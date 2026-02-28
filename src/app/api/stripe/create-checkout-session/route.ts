import { NextRequest, NextResponse } from 'next/server';
import { stripe, getSubscriptionModel, getPriceIds, getSharedPriceIds } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planTier, emissionPackId, userId, userEmail, firmId, firmName } = body;

    if (!planTier || !userId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: planTier, userId, userEmail' },
        { status: 400 }
      );
    }

    const model = getSubscriptionModel();
    const priceIds = getPriceIds();
    const sharedPriceIds = getSharedPriceIds();

    // Get the plan price ID
    const planPriceId = (priceIds.plans as any)[planTier];
    if (!planPriceId) {
      return NextResponse.json(
        { success: false, error: `Invalid plan tier: ${planTier}` },
        { status: 400 }
      );
    }

    // Build line items
    const lineItems: any[] = [];

    // 1. Monthly subscription plan
    lineItems.push({
      price: planPriceId,
      quantity: 1,
    });

    // 2. Setup fee (one-time)
    lineItems.push({
      price: sharedPriceIds.setupFee,
      quantity: 1,
    });

    // 3. Optional emission pack (one-time)
    if (emissionPackId) {
      const emissionPriceId = (sharedPriceIds as any)[emissionPackId];
      if (emissionPriceId) {
        lineItems.push({
          price: emissionPriceId,
          quantity: 1,
        });
      }
    }

    // 4. For PAYG model, add initial credit wallet deposit
    // This would typically be handled separately, but for demo we'll track it in metadata

    // Check if customer already exists
    let customerId: string | undefined;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
          firmId: firmId || '',
          firmName: firmName || '',
          subscriptionModel: model,
        },
      });
      customerId = customer.id;
    }

    // Calculate included emissions
    let includedEmissions = 5; // From setup fee
    if (emissionPackId === 'emissionSingle') includedEmissions += 1;
    if (emissionPackId === 'emissionPack5') includedEmissions += 5;
    if (emissionPackId === 'emissionPack10') includedEmissions += 10;
    if (emissionPackId === 'emissionPack20') includedEmissions += 20;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/investment-manager/settings?tab=subscription&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/investment-manager/settings?tab=subscription&canceled=true`,
      metadata: {
        userId,
        firmId: firmId || '',
        planTier,
        emissionPackId: emissionPackId || '',
        includedEmissions: includedEmissions.toString(),
        subscriptionModel: model,
      },
      subscription_data: {
        metadata: {
          userId,
          firmId: firmId || '',
          planTier,
          emissionsAvailable: includedEmissions.toString(),
          emissionsUsed: '0',
          subscriptionModel: model,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
