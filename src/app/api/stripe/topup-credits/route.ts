import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, subscriptionId, amount, userEmail } = body;

    console.log('[Stripe Top-Up Credits] Request:', { customerId, subscriptionId, amount, userEmail });

    if (!amount) {
      return NextResponse.json(
        { success: false, error: 'amount is required' },
        { status: 400 }
      );
    }

    // Validate amount (minimum $50, in cents)
    if (amount < 5000) {
      return NextResponse.json(
        { success: false, error: 'Minimum top-up amount is $50' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Get user email for checkout
    let email = userEmail;
    if (!email && customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && !customer.deleted && customer.email) {
          email = customer.email;
        }
      } catch (e) {
        console.warn('[Stripe Top-Up Credits] Could not retrieve customer:', e);
      }
    }

    // Create a simple Checkout session - no customer attachment
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Credit Wallet Top-Up',
              description: 'Add credits to your wallet for KYC and envelope costs',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: baseUrl + '/investment-manager/settings?tab=subscription&purchase=credits&success=true&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: baseUrl + '/investment-manager/settings?tab=subscription&purchase=credits&canceled=true',
      metadata: {
        type: 'credit_topup',
        customerId: customerId || '',
        subscriptionId: subscriptionId || '',
        amount: amount.toString(),
        userEmail: email || '',
      },
    });

    console.log('[Stripe Top-Up Credits] Session created:', session.id, session.url);

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      amount,
    });
  } catch (error: any) {
    console.error('[Stripe Top-Up Credits] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
