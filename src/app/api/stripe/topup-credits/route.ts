import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, subscriptionId, amount } = body;

    if (!customerId || !subscriptionId || !amount) {
      return NextResponse.json(
        { success: false, error: 'customerId, subscriptionId, and amount required' },
        { status: 400 }
      );
    }

    // Amount should be in cents
    const amountInCents = typeof amount === 'number' ? amount : parseInt(amount);

    if (amountInCents < 5000) {
      return NextResponse.json(
        { success: false, error: 'Minimum top-up amount is $50.00' },
        { status: 400 }
      );
    }

    // Create a payment intent for the top-up
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      description: 'Credit Wallet Top-Up',
      metadata: {
        type: 'credit_topup',
        subscriptionId,
        amount: amountInCents.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      confirm: true,
      off_session: true,
    });

    if (paymentIntent.status === 'succeeded') {
      // Update subscription metadata with new credit balance
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const currentBalance = parseInt(subscription.metadata.creditBalance || '0');
      const newBalance = currentBalance + amountInCents;

      await stripe.subscriptions.update(subscriptionId, {
        metadata: {
          ...subscription.metadata,
          creditBalance: newBalance.toString(),
        },
      });

      return NextResponse.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
        },
        creditBalance: newBalance,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Payment not completed',
      status: paymentIntent.status,
    });
  } catch (error: any) {
    console.error('[Stripe Top-Up] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get current credit balance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId required' },
        { status: 400 }
      );
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const creditBalance = parseInt(subscription.metadata.creditBalance || '0');

    return NextResponse.json({
      success: true,
      creditBalance,
    });
  } catch (error: any) {
    console.error('[Stripe Get Credits] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
