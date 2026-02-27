import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';

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

    // Get subscriptions for customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId!,
      status: 'all',
      limit: 1,
      expand: ['data.items.data.price.product'],
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({
        success: true,
        subscription: null,
        message: 'No subscription found',
      });
    }

    const subscription = subscriptions.data[0];

    // Get emission counts from metadata
    const emissionsAvailable = parseInt(subscription.metadata.emissionsAvailable || '0');
    const emissionsUsed = parseInt(subscription.metadata.emissionsUsed || '0');

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        planTier: subscription.metadata.planTier,
        subscriptionModel: subscription.metadata.subscriptionModel,
        emissionsAvailable,
        emissionsUsed,
        items: subscription.items.data.map((item) => ({
          id: item.id,
          priceId: item.price.id,
          productName: (item.price.product as any)?.name || 'Unknown',
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
    } else {
      // Cancel at period end
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
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

// PATCH - Reactivate subscription (remove cancel_at_period_end)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId required' },
        { status: 400 }
      );
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
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
