import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { updateUserSubscriptionStatus } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// POST - Sync subscription status from Stripe to Supabase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find customer in Stripe
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      // No Stripe customer, set status to null
      await updateUserSubscriptionStatus(email, null);
      return NextResponse.json({
        success: true,
        message: 'No Stripe customer found, subscription status cleared',
        status: null,
      });
    }

    const customerId = customers.data[0].id;

    // Get subscriptions for customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      // No subscriptions, set status to null
      await updateUserSubscriptionStatus(email, null);
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found, subscription status cleared',
        status: null,
      });
    }

    // Find the best subscription (active > trialing > past_due > etc)
    const statusPriority = ['active', 'trialing', 'past_due', 'incomplete', 'unpaid', 'canceled'];
    let subscription = subscriptions.data[0];
    for (const sub of subscriptions.data) {
      const currentPriority = statusPriority.indexOf(subscription.status);
      const newPriority = statusPriority.indexOf(sub.status);
      if (newPriority < currentPriority) {
        subscription = sub;
      }
    }

    const status = subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';

    // Update Supabase with current Stripe status
    await updateUserSubscriptionStatus(email, status, subscription.id);

    // Also update platform_subscription with subscription_start_date
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let platformSubUpdated = false;
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get subscription start date from Stripe
        const subscriptionStartDate = new Date(subscription.start_date * 1000).toISOString();

        // Get user ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', email.toLowerCase())
          .single();

        // Find existing platform_subscription (any status)
        const { data: existingSub } = await supabase
          .from('platform_subscription')
          .select('id, subscription_start_date')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingSub) {
          // Update existing - set start_date if not already set
          const updateData: Record<string, any> = {
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            subscription_status: status,
          };

          // Only update subscription_start_date if it's null
          if (!existingSub.subscription_start_date) {
            updateData.subscription_start_date = subscriptionStartDate;
          }

          if (user?.id) {
            updateData.managed_by_user_id = user.id;
          }

          await supabase
            .from('platform_subscription')
            .update(updateData)
            .eq('id', existingSub.id);

          platformSubUpdated = true;
          console.log('[Stripe Sync] Updated platform_subscription, start_date:', updateData.subscription_start_date || existingSub.subscription_start_date);
        } else {
          // Create new platform_subscription
          await supabase
            .from('platform_subscription')
            .insert({
              stripe_subscription_id: subscription.id,
              stripe_customer_id: customerId,
              subscription_status: status,
              subscription_start_date: subscriptionStartDate,
              subscription_model: subscription.metadata?.subscriptionModel || 'payg',
              subscription_tier: subscription.metadata?.planTier || 'starter',
              managed_by_user_id: user?.id,
            });

          platformSubUpdated = true;
          console.log('[Stripe Sync] Created platform_subscription with start_date:', subscriptionStartDate);
        }
      } catch (err) {
        console.error('[Stripe Sync] Error updating platform_subscription:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Subscription status synced: ${status}`,
      status,
      subscriptionId: subscription.id,
      platformSubscriptionUpdated: platformSubUpdated,
      subscriptionStartDate: new Date(subscription.start_date * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('[Stripe Sync] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
