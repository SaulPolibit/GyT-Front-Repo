import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';

// POST - Decrement one emission when a structure is created
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'email is required' },
        { status: 400 }
      );
    }

    console.log('[Use Emission] Looking up customer by email:', email);

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

    const currentEmissions = parseInt(subscription.metadata.emissionsAvailable || '0');
    const emissionsUsed = parseInt(subscription.metadata.emissionsUsed || '0');

    // Check if there are emissions available
    if (currentEmissions <= 0) {
      return NextResponse.json(
        { success: false, error: 'No emissions available. Please purchase more emissions.' },
        { status: 400 }
      );
    }

    // Decrement emissions
    const newEmissionsAvailable = currentEmissions - 1;
    const newEmissionsUsed = emissionsUsed + 1;

    // Update subscription metadata
    await stripe.subscriptions.update(subscription.id, {
      metadata: {
        ...subscription.metadata,
        emissionsAvailable: newEmissionsAvailable.toString(),
        emissionsUsed: newEmissionsUsed.toString(),
      },
    });

    console.log('[Use Emission] Updated emissions:', {
      previousAvailable: currentEmissions,
      newAvailable: newEmissionsAvailable,
      totalUsed: newEmissionsUsed,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      previousEmissionsAvailable: currentEmissions,
      emissionsAvailable: newEmissionsAvailable,
      emissionsUsed: newEmissionsUsed,
    });
  } catch (error: any) {
    console.error('[Use Emission] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
