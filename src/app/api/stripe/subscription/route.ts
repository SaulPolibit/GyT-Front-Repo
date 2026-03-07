import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { updateUserSubscriptionStatus } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// Helper to get platform subscription
async function getPlatformSubscription() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('[Stripe Subscription] Supabase not configured');
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get platform subscription (single subscription for entire platform)
    const { data: subscription, error } = await supabase
      .from('platform_subscription')
      .select('*')
      .in('subscription_status', ['active', 'trialing'])
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Stripe Subscription] Error fetching platform subscription:', error);
    }

    if (subscription) {
      console.log('[Stripe Subscription] Found platform subscription:', subscription.id);
    }

    return subscription || null;
  } catch (err) {
    console.error('[Stripe Subscription] Error in getPlatformSubscription:', err);
    return null;
  }
}

// GET - Get current subscription (from platform_subscription table)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const userEmail = searchParams.get('email');

    if (!customerId && !userEmail) {
      return NextResponse.json(
        { success: false, error: 'customerId or email required' },
        { status: 400 }
      );
    }

    let stripeCustomerId = customerId;
    let subscriptionId: string | null = null;
    let isOwner = false;

    // Get platform subscription (applies to all users)
    const platformSub = await getPlatformSubscription();

    if (platformSub && platformSub.stripe_customer_id) {
      // Use platform subscription's Stripe customer
      stripeCustomerId = platformSub.stripe_customer_id;
      subscriptionId = platformSub.id;

      // Check if current user is the manager
      if (userEmail && platformSub.managed_by_user_id) {
        // We need to check if this email belongs to the manager
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: manager } = await supabase
            .from('users')
            .select('email')
            .eq('id', platformSub.managed_by_user_id)
            .single();
          isOwner = manager?.email?.toLowerCase() === userEmail?.toLowerCase();
        }
      }
      console.log('[Stripe Subscription GET] Using platform subscription for user:', userEmail);
    } else if (!stripeCustomerId && userEmail) {
      // Fallback: If no platform subscription, look up by the user's email
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        isOwner = true;
      } else {
        return NextResponse.json({
          success: true,
          subscription: null,
          message: 'No customer found',
        });
      }
    }

    // Get subscriptions for customer - fetch multiple to find the best one
    // Note: Stripe limits expansion to 4 levels, so we can't expand data.items.data.price.product
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId!,
      status: 'all',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({
        success: true,
        subscription: null,
        message: 'No subscription found',
      });
    }

    // Prioritize: active/paused > trialing > past_due > incomplete > canceled
    const statusPriority = ['active', 'trialing', 'past_due', 'incomplete', 'unpaid', 'canceled', 'incomplete_expired'];
    let subscription = subscriptions.data[0];

    // Find the best subscription (active or paused takes priority)
    for (const sub of subscriptions.data) {
      // Paused subscriptions have pause_collection set
      if (sub.pause_collection) {
        subscription = sub;
        break;
      }
      // Otherwise prioritize by status
      const currentPriority = statusPriority.indexOf(subscription.status);
      const newPriority = statusPriority.indexOf(sub.status);
      if (newPriority < currentPriority) {
        subscription = sub;
      }
    }

    console.log('[Stripe Subscription GET] Found', subscriptions.data.length, 'subscriptions, selected:', subscription.id, 'status:', subscription.status);

    // Get emission counts and credit balance from metadata
    const emissionsAvailable = parseInt(subscription.metadata.emissionsAvailable || '0');
    const emissionsUsed = parseInt(subscription.metadata.emissionsUsed || '0');
    const creditBalance = parseInt(subscription.metadata.creditBalance || '0');

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        pauseCollection: subscription.pause_collection,
        isPaused: !!subscription.pause_collection,
        planTier: platformSub?.subscription_tier || subscription.metadata.planTier,
        subscriptionModel: platformSub?.subscription_model || subscription.metadata.subscriptionModel,
        emissionsAvailable: platformSub?.emissions_available || emissionsAvailable,
        emissionsUsed: platformSub?.emissions_used || emissionsUsed,
        creditBalance: platformSub?.credit_balance || creditBalance,
        maxInvestors: platformSub?.max_investors,
        maxTotalCommitment: platformSub?.max_total_commitment,
        items: subscription.items.data.map((item) => ({
          id: item.id,
          priceId: item.price.id,
          productId: typeof item.price.product === 'string' ? item.price.product : (item.price.product as any)?.id,
          amount: item.price.unit_amount,
          interval: item.price.recurring?.interval,
        })),
      },
      customerId: stripeCustomerId,
      platformSubscriptionId: subscriptionId,
      isOwner,
    });
  } catch (error: any) {
    console.error('[Stripe Subscription GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Cancel subscription
// Note: 12-month minimum commitment is enforced
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, immediately, userEmail } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId required' },
        { status: 400 }
      );
    }

    // Check 12-month minimum commitment from platform_subscription
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get platform subscription
    const { data: platformSub } = await supabase
      .from('platform_subscription')
      .select('subscription_start_date')
      .in('subscription_status', ['active', 'trialing', 'canceling'])
      .limit(1)
      .single();

    console.log('[Stripe Subscription DELETE] Checking commitment:', { subscription_start_date: platformSub?.subscription_start_date });

    if (platformSub?.subscription_start_date) {
      const startDate = new Date(platformSub.subscription_start_date);
      const now = new Date();
      const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 +
                            (now.getMonth() - startDate.getMonth());

      const MINIMUM_MONTHS = 12;

      console.log('[Stripe Subscription DELETE] Commitment check:', { monthsElapsed, MINIMUM_MONTHS, shouldBlock: monthsElapsed < MINIMUM_MONTHS });

      if (monthsElapsed < MINIMUM_MONTHS) {
        const remainingMonths = MINIMUM_MONTHS - monthsElapsed;
        const canCancelDate = new Date(startDate);
        canCancelDate.setMonth(canCancelDate.getMonth() + MINIMUM_MONTHS);

        return NextResponse.json({
          success: false,
          error: 'MINIMUM_COMMITMENT',
          message: `Your subscription has a 12-month minimum commitment. You can cancel after ${canCancelDate.toLocaleDateString()}.`,
          monthsElapsed,
          remainingMonths,
          canCancelDate: canCancelDate.toISOString()
        }, { status: 403 });
      }
    }

    let subscription;

    if (immediately) {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId);

      // Update platform_subscription status to canceled
      await supabase
        .from('platform_subscription')
        .update({ subscription_status: 'canceled' })
        .eq('stripe_subscription_id', subscriptionId);
    } else {
      // Cancel at period end - status stays active until period ends
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // Update platform_subscription status to canceling
      await supabase
        .from('platform_subscription')
        .update({ subscription_status: 'canceling' })
        .eq('stripe_subscription_id', subscriptionId);
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at,
      },
    });
  } catch (error: any) {
    console.error('[Stripe Subscription DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update subscription (reactivate, pause, resume)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, action } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId required' },
        { status: 400 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let subscription;
    let message = '';
    let newStatus = '';

    switch (action) {
      case 'pause':
        // Pause subscription - stop collecting payments
        subscription = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: {
            behavior: 'mark_uncollectible',
          },
        });
        message = 'Subscription paused';
        newStatus = 'paused';
        break;

      case 'resume':
        // Resume subscription - start collecting payments again
        subscription = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: null,
        });
        message = 'Subscription resumed';
        newStatus = 'active';
        break;

      case 'reactivate':
      default:
        // Reactivate - remove cancel_at_period_end
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
        });
        message = 'Subscription reactivated';
        newStatus = 'active';
        break;
    }

    // Update platform_subscription status
    await supabase
      .from('platform_subscription')
      .update({ subscription_status: newStatus })
      .eq('stripe_subscription_id', subscriptionId);

    return NextResponse.json({
      success: true,
      message,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        pauseCollection: subscription.pause_collection,
      },
    });
  } catch (error: any) {
    console.error('[Stripe Subscription PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
