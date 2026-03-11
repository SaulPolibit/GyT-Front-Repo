import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Get subscription usage statistics
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get platform subscription
    const { data: platformSub, error: subError } = await supabase
      .from('platform_subscription')
      .select('*')
      .in('subscription_status', ['active', 'trialing', 'canceling'])
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('[Subscription Usage] Error fetching platform subscription:', subError);
    }

    if (!platformSub) {
      return NextResponse.json({
        success: true,
        usage: {
          hasSubscription: false,
          model: null,
          tier: null,
          status: null,
          investors: { current: 0, limit: 0, remaining: 0, percentUsed: 0 },
          commitment: null,
          creditBalance: 0,
          emissionsAvailable: 0,
          emissionsUsed: 0,
        }
      });
    }

    // Count investors (users with role 3)
    const { count: investorCount, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 3);

    if (countError) {
      console.error('[Subscription Usage] Error counting investors:', countError);
    }

    const currentInvestors = investorCount || 0;
    const maxInvestors = platformSub.max_investors || 1000;

    // Calculate total commitment (for tier_based model)
    let currentCommitment = 0;
    if (platformSub.subscription_model === 'tier_based') {
      const { data: structures, error: structError } = await supabase
        .from('structures')
        .select('total_commitment');

      if (!structError && structures) {
        currentCommitment = structures.reduce((sum, s) => sum + (parseFloat(s.total_commitment) || 0), 0);
      }
    }

    const maxCommitment = platformSub.max_total_commitment || 999999999999;

    // Build usage response
    const usage = {
      hasSubscription: true,
      model: platformSub.subscription_model || 'payg',
      tier: platformSub.subscription_tier || 'starter',
      status: platformSub.subscription_status,
      subscriptionStartDate: platformSub.subscription_start_date,
      investors: {
        current: currentInvestors,
        limit: maxInvestors,
        remaining: Math.max(0, maxInvestors - currentInvestors),
        percentUsed: maxInvestors > 0 ? Math.round((currentInvestors / maxInvestors) * 100) : 0,
      },
      commitment: platformSub.subscription_model === 'tier_based' ? {
        current: currentCommitment,
        limit: maxCommitment,
        remaining: Math.max(0, maxCommitment - currentCommitment),
        percentUsed: maxCommitment > 0 ? Math.round((currentCommitment / maxCommitment) * 100) : 0,
      } : null,
      creditBalance: platformSub.credit_balance || 0,
      emissionsAvailable: platformSub.emissions_available || 0,
      emissionsUsed: platformSub.emissions_used || 0,
      extras: {
        commitmentPurchased: platformSub.extra_commitment_purchased || 0,
        investorsPurchased: platformSub.extra_investors_purchased || 0,
      },
    };

    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error: any) {
    console.error('[Subscription Usage] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
