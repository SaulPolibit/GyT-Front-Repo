import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extraInvestors = 1, userEmail } = body;

    console.log('[Stripe Extra Investors] Request:', { extraInvestors, userEmail });

    if (!extraInvestors || extraInvestors < 1) {
      return NextResponse.json(
        { success: false, error: 'extraInvestors must be at least 1' },
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
          { success: false, error: 'Extra investors only available for tier-based subscriptions' },
          { status: 400 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Price: $25 per extra investor
    const pricePerInvestor = parseInt(process.env.STRIPE_EXTRA_INVESTOR_PRICE || '2500'); // in cents
    const totalAmount = pricePerInvestor * extraInvestors;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Extra Investor Slot${extraInvestors > 1 ? 's' : ''}`,
              description: `Add ${extraInvestors} additional investor slot${extraInvestors > 1 ? 's' : ''} to your subscription`,
            },
            unit_amount: pricePerInvestor,
          },
          quantity: extraInvestors,
        },
      ],
      customer_email: userEmail,
      success_url: baseUrl + `/investment-manager/settings?tab=subscription&purchase=extra_investors&success=true&quantity=${extraInvestors}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: baseUrl + '/investment-manager/settings?tab=subscription&canceled=true',
      metadata: {
        type: 'extra_investors',
        extraInvestors: extraInvestors.toString(),
        userEmail: userEmail || '',
      },
    });

    console.log('[Stripe Extra Investors] Session created:', session.id, session.url);

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('[Stripe Extra Investors] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
