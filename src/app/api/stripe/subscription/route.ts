import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { updateUserSubscriptionStatus } from '@/lib/supabase-server';

// GET - Get current subscription
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

    // If no customerId provided, look up by email
    if (!stripeCustomerId && userEmail) {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
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
        planTier: subscription.metadata.planTier,
        subscriptionModel: subscription.metadata.subscriptionModel,
        emissionsAvailable,
        emissionsUsed,
        creditBalance,
        items: subscription.items.data.map((item) => ({
          id: item.id,
          priceId: item.price.id,
          productId: typeof item.price.product === 'string' ? item.price.product : (item.price.product as any)?.id,
          amount: item.price.unit_amount,
          interval: item.price.recurring?.interval,
        })),
      },
      customerId: stripeCustomerId,
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
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, immediately } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId required' },
        { status: 400 }
      );
    }

    let subscription;

    if (immediately) {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId);

      // Sync with Supabase - update status to canceled
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      if (customer && !customer.deleted && customer.email) {
        await updateUserSubscriptionStatus(customer.email, 'canceled', subscription.id);
      }
    } else {
      // Cancel at period end - status stays active until period ends
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      // Note: Don't update Supabase yet - webhook will handle when it actually cancels
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

    let subscription;
    let message = '';

    switch (action) {
      case 'pause':
        // Pause subscription - stop collecting payments
        subscription = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: {
            behavior: 'mark_uncollectible', // or 'keep_as_draft' or 'void'
          },
        });
        message = 'Subscription paused';

        // Sync with Supabase
        const customerForPause = await stripe.customers.retrieve(subscription.customer as string);
        if (customerForPause && !customerForPause.deleted && customerForPause.email) {
          await updateUserSubscriptionStatus(customerForPause.email, 'paused' as any, subscription.id);
        }
        break;

      case 'resume':
        // Resume subscription - start collecting payments again
        subscription = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: null,
        });
        message = 'Subscription resumed';

        // Sync with Supabase
        const customerForResume = await stripe.customers.retrieve(subscription.customer as string);
        if (customerForResume && !customerForResume.deleted && customerForResume.email) {
          await updateUserSubscriptionStatus(customerForResume.email, 'active', subscription.id);
        }
        break;

      case 'reactivate':
      default:
        // Reactivate - remove cancel_at_period_end
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
        });
        message = 'Subscription reactivated';

        // Sync with Supabase
        const customerForReactivate = await stripe.customers.retrieve(subscription.customer as string);
        if (customerForReactivate && !customerForReactivate.deleted && customerForReactivate.email) {
          await updateUserSubscriptionStatus(customerForReactivate.email, 'active', subscription.id);
        }
        break;
    }

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
