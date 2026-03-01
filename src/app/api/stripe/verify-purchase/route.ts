import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';

// POST - Verify a checkout session and update emissions/credits
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, email } = body;

    if (!sessionId && !email) {
      return NextResponse.json(
        { success: false, error: 'sessionId or email required' },
        { status: 400 }
      );
    }

    // If sessionId provided, verify the session
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== 'paid') {
        return NextResponse.json({
          success: false,
          error: 'Payment not completed',
          status: session.payment_status,
        });
      }

      const metadata = session.metadata || {};
      const customerEmail = session.customer_email || metadata.userEmail;

      // Find customer and subscription
      if (!customerEmail) {
        return NextResponse.json({
          success: false,
          error: 'No customer email found',
        });
      }

      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No customer found',
        });
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        limit: 1,
      });

      // Find active or paused subscription
      const subscription = subscriptions.data.find(s => 
        s.status === 'active' || s.pause_collection
      );

      if (!subscription) {
        return NextResponse.json({
          success: false,
          error: 'No active subscription found',
        });
      }

      // Check session type and update accordingly
      if (metadata.type === 'emission_purchase') {
        const emissionsAdded = parseInt(metadata.emissionsAdded || '0');
        const currentEmissions = parseInt(subscription.metadata.emissionsAvailable || '0');
        
        // Check if this session was already processed (prevent double-counting)
        const processedSessions = subscription.metadata.processedSessions || '';
        if (processedSessions.includes(sessionId)) {
          return NextResponse.json({
            success: true,
            message: 'Session already processed',
            emissionsAvailable: currentEmissions,
          });
        }

        const newEmissions = currentEmissions + emissionsAdded;

        await stripe.subscriptions.update(subscription.id, {
          metadata: {
            ...subscription.metadata,
            emissionsAvailable: newEmissions.toString(),
            processedSessions: processedSessions + sessionId + ',',
          },
        });

        return NextResponse.json({
          success: true,
          type: 'emission_purchase',
          emissionsAdded,
          previousEmissions: currentEmissions,
          newEmissions,
        });
      }

      if (metadata.type === 'credit_topup') {
        const amount = parseInt(metadata.amount || '0');
        const currentBalance = parseInt(subscription.metadata.creditBalance || '0');
        
        // Check if this session was already processed
        const processedSessions = subscription.metadata.processedSessions || '';
        if (processedSessions.includes(sessionId)) {
          return NextResponse.json({
            success: true,
            message: 'Session already processed',
            creditBalance: currentBalance,
          });
        }

        const newBalance = currentBalance + amount;

        await stripe.subscriptions.update(subscription.id, {
          metadata: {
            ...subscription.metadata,
            creditBalance: newBalance.toString(),
            processedSessions: processedSessions + sessionId + ',',
          },
        });

        return NextResponse.json({
          success: true,
          type: 'credit_topup',
          amountAdded: amount,
          previousBalance: currentBalance,
          newBalance,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Session verified but no update needed',
        metadata,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'No sessionId provided',
    });
  } catch (error: any) {
    console.error('[Verify Purchase] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
