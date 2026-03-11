import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extraCommitment, userEmail } = body; // extraCommitment in dollars

    console.log('[Stripe Extra AUM] Request:', { extraCommitment, userEmail });

    if (!extraCommitment || extraCommitment <= 0) {
      return NextResponse.json(
        { success: false, error: 'extraCommitment must be greater than 0' },
        { status: 400 }
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

    // Calculate price: $100 per $1M AUM
    const pricePerMillion = parseInt(process.env.STRIPE_EXTRA_AUM_PRICE_PER_MILLION || '10000'); // $100 in cents
    const millionsAdded = extraCommitment / 1000000;
    const totalAmount = Math.round(pricePerMillion * millionsAdded);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Extra AUM Capacity',
              description: `Add $${millionsAdded}M additional AUM capacity to your subscription`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      success_url: baseUrl + `/investment-manager/settings?tab=subscription&purchase=extra_aum&success=true&quantity=${millionsAdded}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: baseUrl + '/investment-manager/settings?tab=subscription&canceled=true',
      metadata: {
        type: 'extra_aum',
        extraCommitment: extraCommitment.toString(),
        millionsAdded: millionsAdded.toString(),
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
