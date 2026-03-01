import { NextRequest, NextResponse } from 'next/server';
import { stripe, getSharedPriceIds } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, subscriptionId, emissionPackId, userEmail } = body;

    console.log('[Stripe Purchase Emissions] Request:', { customerId, subscriptionId, emissionPackId, userEmail });

    if (!emissionPackId) {
      return NextResponse.json(
        { success: false, error: 'emissionPackId is required' },
        { status: 400 }
      );
    }

    const sharedPriceIds = getSharedPriceIds();
    const priceId = (sharedPriceIds as any)[emissionPackId];

    if (!priceId) {
      return NextResponse.json(
        { success: false, error: 'Invalid emission pack: ' + emissionPackId },
        { status: 400 }
      );
    }

    // Calculate emissions being added
    let emissionsAdded = 1;
    if (emissionPackId === 'emissionPack5') emissionsAdded = 5;
    if (emissionPackId === 'emissionPack10') emissionsAdded = 10;
    if (emissionPackId === 'emissionPack20') emissionsAdded = 20;

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
        console.warn('[Stripe Purchase Emissions] Could not retrieve customer:', e);
      }
    }

    // Create a simple Checkout session - no customer attachment
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: baseUrl + '/investment-manager/settings?tab=subscription&purchase=emissions&success=true',
      cancel_url: baseUrl + '/investment-manager/settings?tab=subscription&purchase=emissions&canceled=true',
      metadata: {
        type: 'emission_purchase',
        customerId: customerId || '',
        subscriptionId: subscriptionId || '',
        emissionPackId,
        emissionsAdded: emissionsAdded.toString(),
        userEmail: email || '',
      },
    });

    console.log('[Stripe Purchase Emissions] Session created:', session.id, session.url);

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      emissionsAdded,
    });
  } catch (error: any) {
    console.error('[Stripe Purchase Emissions] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
