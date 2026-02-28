import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { updateUserSubscriptionStatus } from '@/lib/supabase-server';

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
      limit: 1,
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

    const subscription = subscriptions.data[0];
    const status = subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';

    // Update Supabase with current Stripe status
    await updateUserSubscriptionStatus(email, status, subscription.id);

    return NextResponse.json({
      success: true,
      message: `Subscription status synced: ${status}`,
      status,
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('[Stripe Sync] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
