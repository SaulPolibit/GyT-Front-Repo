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

    // Get platform subscription (include 'incomplete' - subscription still valid, just pending payment)
    const { data: platformSub, error: subError } = await supabase
      .from('platform_subscription')
      .select('*')
      .in('subscription_status', ['active', 'trialing', 'canceling', 'incomplete'])
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

    // Default tier limits (fallback if max_investors is not set)
    const TIER_BASED_LIMITS: Record<string, { maxInvestors: number; maxTotalCommitment: number }> = {
      starter: { maxTotalCommitment: 25000000, maxInvestors: 50 },
      professional: { maxTotalCommitment: 50000000, maxInvestors: 100 },
      enterprise: { maxTotalCommitment: 100000000, maxInvestors: 200 },
    };
    const PAYG_LIMITS: Record<string, { maxInvestors: number; maxTotalCommitment: number }> = {
      starter: { maxInvestors: 1000, maxTotalCommitment: 999999999999 },
      growth: { maxInvestors: 2000, maxTotalCommitment: 999999999999 },
      enterprise: { maxInvestors: 4000, maxTotalCommitment: 999999999999 },
    };

    // Get tier limits based on model and tier
    const model = platformSub.subscription_model || 'tier_based';
    const tier = platformSub.subscription_tier || 'starter';
    const tierLimits = model === 'payg'
      ? (PAYG_LIMITS[tier] || PAYG_LIMITS.starter)
      : (TIER_BASED_LIMITS[tier] || TIER_BASED_LIMITS.starter);

    // max_investors: base limit + extras purchased
    // Use DB value if set, otherwise fall back to tier default
    const baseInvestors = (platformSub.max_investors || 0) > 0
      ? platformSub.max_investors
      : tierLimits.maxInvestors;
    const extraInvestorsPurchased = platformSub.extra_investors_purchased || 0;
    const maxInvestors = baseInvestors;
    console.log('[Subscription Usage] Investors - Base:', baseInvestors, 'Extras Purchased:', extraInvestorsPurchased, 'Max:', maxInvestors); 

    // Calculate total commitment (for tier_based model)
    let currentCommitment = 0;
    if (model === 'tier_based') {
      const { data: structures, error: structError } = await supabase
        .from('structures')
        .select('total_commitment');

      if (!structError && structures) {
        currentCommitment = structures.reduce((sum, s) => sum + (parseFloat(s.total_commitment) || 0), 0);
      }
    }

    // max_total_commitment: base limit + extras purchased
    // Use DB value if set, otherwise fall back to tier default
    // Note: DB field is 'total_max_commitment' not 'max_total_commitment'
    const baseCommitment = (platformSub.max_total_commitment || 0) > 0
      ? platformSub.max_total_commitment
      : tierLimits.maxTotalCommitment;
    const extraCommitmentPurchased = platformSub.extra_commitment_purchased || 0;
    const maxCommitment = baseCommitment;
    console.log('[Subscription Usage] Commitment - Base:', baseCommitment, 'Extras Purchased:', extraCommitmentPurchased, 'Max:', maxCommitment);

    // Debug logging
    console.log('[Subscription Usage] Calculated values:', {
      model,
      tier,
      dbModel: platformSub.subscription_model,
      dbTier: platformSub.subscription_tier,
      dbMaxInvestors: platformSub.max_investors,
      dbExtraInvestors: platformSub.extra_investors_purchased,
      dbMaxCommitment: platformSub.max_total_commitment,
      dbExtraCommitment: platformSub.extra_commitment_purchased,
      baseInvestors,
      extraInvestorsPurchased,
      maxInvestors,
      baseCommitment,
      extraCommitmentPurchased,
      maxCommitment,
      tierLimits,
    });

    // Build usage response
    const usage = {
      hasSubscription: true,
      model: model, // Use the computed model (with tier_based as default)
      tier: tier,   // Use the computed tier (with starter as default)
      status: platformSub.subscription_status,
      subscriptionStartDate: platformSub.subscription_start_date,
      investors: {
        current: currentInvestors,
        limit: maxInvestors,
        remaining: Math.max(0, maxInvestors - currentInvestors),
        percentUsed: maxInvestors > 0 ? Math.round((currentInvestors / maxInvestors) * 100) : 0,
      },
      commitment: model === 'tier_based' ? {
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
