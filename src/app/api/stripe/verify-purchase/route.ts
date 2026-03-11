import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { createClient } from '@supabase/supabase-js';

// POST - Verify a checkout session and update emissions/credits in platform_subscription
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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

      // Check if this session was already processed (prevent double-counting)
      const { data: existingSession } = await supabase
        .from('processed_stripe_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existingSession) {
        console.log('[Verify Purchase] Session already processed:', sessionId);

        // Get current emissions to return (any status)
        const { data: subscription } = await supabase
          .from('platform_subscription')
          .select('emissions_available, credit_balance')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return NextResponse.json({
          success: true,
          message: 'Session already processed',
          emissionsAvailable: subscription?.emissions_available || 0,
          creditBalance: subscription?.credit_balance || 0,
        });
      }

      // Get platform subscription (any status - user can verify purchases even when canceling)
      const { data: subscription, error: subError } = await supabase
        .from('platform_subscription')
        .select('id, emissions_available, emissions_used, credit_balance, subscription_status, managed_by_user_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError || !subscription) {
        console.error('[Verify Purchase] No platform subscription found:', subError);
        return NextResponse.json({
          success: false,
          error: 'No platform subscription found',
        });
      }

      // Mark session as processed FIRST (prevents race conditions)
      const customerEmail = session.customer_email || metadata.userEmail;

      // Get user ID from email if available
      let userId = null;
      if (customerEmail) {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', customerEmail.toLowerCase())
          .single();
        userId = user?.id;
      }

      const { error: insertError } = await supabase
        .from('processed_stripe_sessions')
        .insert({
          session_id: sessionId,
          user_id: userId || subscription.managed_by_user_id
        });

      if (insertError) {
        if (insertError.code === '23505') {
          // Duplicate - already processed
          return NextResponse.json({
            success: true,
            message: 'Session already processed (concurrent)',
            emissionsAvailable: subscription.emissions_available,
          });
        }
        console.error('[Verify Purchase] Error marking session as processed:', insertError);
      }

      // Check session type and update accordingly
      if (metadata.type === 'emission_purchase') {
        const emissionsAdded = parseInt(metadata.emissionsAdded || '0');
        const currentEmissions = subscription.emissions_available || 0;
        const newEmissions = currentEmissions + emissionsAdded;

        // Update platform_subscription
        const { error: updateError } = await supabase
          .from('platform_subscription')
          .update({
            emissions_available: newEmissions,
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error('[Verify Purchase] Error updating emissions:', updateError);
          return NextResponse.json({
            success: false,
            error: 'Failed to update emissions',
          });
        }

        console.log('[Verify Purchase] Added emissions:', {
          previousEmissions: currentEmissions,
          emissionsAdded,
          newEmissions,
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
        const currentBalance = subscription.credit_balance || 0;
        const newBalance = currentBalance + amount;

        // Update platform_subscription
        const { error: updateError } = await supabase
          .from('platform_subscription')
          .update({
            credit_balance: newBalance,
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error('[Verify Purchase] Error updating credits:', updateError);
          return NextResponse.json({
            success: false,
            error: 'Failed to update credits',
          });
        }

        console.log('[Verify Purchase] Added credits:', {
          previousBalance: currentBalance,
          amountAdded: amount,
          newBalance,
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
