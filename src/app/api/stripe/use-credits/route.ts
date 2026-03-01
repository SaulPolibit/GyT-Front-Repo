import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';

// POST - Deduct credits when a KYC is approved or other credit-consuming action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, reason } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'email is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'amount must be a positive number' },
        { status: 400 }
      );
    }

    console.log('[Use Credits] Deducting credits:', { email, amount, reason });

    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No customer found with this email' },
        { status: 404 }
      );
    }

    // Find active or paused subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      limit: 10,
    });

    // Find first active or paused subscription
    const subscription = subscriptions.data.find(s =>
      s.status === 'active' || s.pause_collection
    );

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const currentBalance = parseInt(subscription.metadata.creditBalance || '0');
    const creditsUsed = parseInt(subscription.metadata.creditsUsed || '0');

    // Check if there are enough credits
    if (currentBalance < amount) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits. Please top up your credit wallet.',
        currentBalance,
        required: amount,
      }, { status: 400 });
    }

    // Deduct credits
    const newBalance = currentBalance - amount;
    const newCreditsUsed = creditsUsed + amount;

    // Update subscription metadata
    await stripe.subscriptions.update(subscription.id, {
      metadata: {
        ...subscription.metadata,
        creditBalance: newBalance.toString(),
        creditsUsed: newCreditsUsed.toString(),
        lastCreditUsage: new Date().toISOString(),
        lastCreditUsageReason: reason || 'unspecified',
      },
    });

    console.log('[Use Credits] Updated credits:', {
      previousBalance: currentBalance,
      newBalance,
      amountDeducted: amount,
      totalUsed: newCreditsUsed,
      reason,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      previousBalance: currentBalance,
      newBalance,
      amountDeducted: amount,
      creditsUsed: newCreditsUsed,
    });
  } catch (error: any) {
    console.error('[Use Credits] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
