import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extraCommitment, extraAumUnits = 1, userEmail } = body; // extraAumUnits = number of $1M units

    // Support both extraCommitment (in dollars) and extraAumUnits (number of $1M units)
    const unitsToAdd = extraCommitment ? Math.round(extraCommitment / 1000000) : extraAumUnits;

    console.log('[Stripe Extra AUM] Request:', { extraCommitment, extraAumUnits, unitsToAdd, userEmail });

    if (!unitsToAdd || unitsToAdd < 1) {
      return NextResponse.json(
        { success: false, error: 'Must add at least $1M AUM' },
        { status: 400 }
      );
    }

    // Get the Stripe price ID from env
    const priceId = process.env.STRIPE_PRICE_EXTRA_AUM;
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: 'STRIPE_PRICE_EXTRA_AUM not configured' },
        { status: 500 }
      );
    }

    // Verify tier_based subscription
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: platformSub } = await supabase
        .from('platform_subscription')
        .select('subscription_model')
        .in('subscription_status', ['active', 'trialing', 'canceling', 'incomplete'])
        .limit(1)
        .single();

      if (platformSub && platformSub.subscription_model !== 'tier_based') {
        return NextResponse.json(
          { success: false, error: 'Extra AUM only available for tier-based subscriptions' },
          { status: 400 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Use the configured Stripe price ID (price is per $1M AUM unit)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: unitsToAdd,
        },
      ],
      customer_email: userEmail,
      success_url: baseUrl + `/investment-manager/settings?tab=subscription&purchase=extra_aum&success=true&quantity=${unitsToAdd}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: baseUrl + '/investment-manager/settings?tab=subscription&canceled=true',
      metadata: {
        type: 'extra_aum',
        extraCommitment: (unitsToAdd * 1000000).toString(),
        millionsAdded: unitsToAdd.toString(),
        userEmail: userEmail || '',
      },
    });

    console.log('[Stripe Extra AUM] Session created:', session.id, session.url);

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('[Stripe Extra AUM] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
