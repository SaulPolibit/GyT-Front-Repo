import { NextResponse } from 'next/server';
import { getSubscriptionModel, getPriceIds, getSharedPriceIds, PLAN_DETAILS } from '@/lib/stripe-server';

export async function GET() {
  try {
    const model = getSubscriptionModel();
    const priceIds = getPriceIds();
    const sharedPriceIds = getSharedPriceIds();

    return NextResponse.json({
      success: true,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      subscriptionModel: model,
      priceIds,
      sharedPriceIds,
      planDetails: PLAN_DETAILS[model],
    });
  } catch (error: any) {
    console.error('[Stripe Config] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
