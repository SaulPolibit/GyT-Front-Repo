import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';

// POST - Manually update emissions for a subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, addEmissions } = body;

    if (!email || !addEmissions) {
      return NextResponse.json(
        { success: false, error: 'email and addEmissions are required' },
        { status: 400 }
      );
    }

    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No customer found with this email' },
        { status: 404 }
      );
    }

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const subscription = subscriptions.data[0];
    const currentEmissions = parseInt(subscription.metadata.emissionsAvailable || '0');
    const newEmissions = currentEmissions + parseInt(addEmissions);

    // Update subscription metadata
    await stripe.subscriptions.update(subscription.id, {
      metadata: {
        ...subscription.metadata,
        emissionsAvailable: newEmissions.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      previousEmissions: currentEmissions,
      addedEmissions: parseInt(addEmissions),
      newEmissions,
    });
  } catch (error: any) {
    console.error('[Update Emissions] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
