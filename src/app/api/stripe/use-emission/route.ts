// ============================================================================
// ⚠️⚠️⚠️ CRITICAL API ENDPOINT: EMISSIONS DECREMENT ⚠️⚠️⚠️
// ============================================================================
//
// FILE: /src/app/api/stripe/use-emission/route.ts
//
// DO NOT REMOVE, MODIFY, OR BYPASS without approval from Tech Lead
//
// PURPOSE: Decrements emissions_available in platform_subscription table
//
// This endpoint is the AUTHORITATIVE source for emissions consumption.
// Called AFTER each successful structure creation.
//
// FLOW:
// 1. Receives POST request with user email
// 2. Fetches active platform_subscription from Supabase
// 3. Validates emissions_available > 0
// 4. Decrements emissions_available by 1
// 5. Increments emissions_used by 1
// 6. Updates platform_subscription table
//
// DATABASE IMPACT:
// - Table: platform_subscription
// - Fields: emissions_available (decremented), emissions_used (incremented)
// - Query: UPDATE platform_subscription SET
//          emissions_available = emissions_available - 1,
//          emissions_used = emissions_used + 1
//          WHERE id = subscription.id
//
// CALLED BY:
// - Frontend: /src/app/investment-manager/structure-setup/page.tsx (line 1395)
// - After: Successful structure creation in backend API
//
// SECURITY:
// - Validates active subscription exists
// - Checks emissions_available > 0 before decrement
// - Returns 400 if no emissions available
// - Uses Supabase service role key for database access
//
// CONSEQUENCES OF REMOVAL/BYPASS:
// - Users can create unlimited structures without consuming emissions
// - Revenue loss from unpaid structure creation
// - Subscription enforcement completely broken
// - Data integrity: emissions_used won't match actual structures created
//
// TESTS: /tests/integration/subscription-enforcement.test.js
//
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    console.log('[Use Emission] Request for email:', email);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get platform subscription (applies to all users)
    const { data: subscription, error: subError } = await supabase
      .from('platform_subscription')
      .select('id, emissions_available, emissions_used, subscription_status')
      .in('subscription_status', ['active', 'trialing'])
      .limit(1)
      .single();

    if (subError || !subscription) {
      console.error('[Use Emission] No active subscription found:', subError);
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const currentEmissions = subscription.emissions_available || 0;
    const emissionsUsed = subscription.emissions_used || 0;

    // Check if there are emissions available
    if (currentEmissions <= 0) {
      return NextResponse.json(
        { success: false, error: 'No emissions available. Please purchase more emissions.' },
        { status: 400 }
      );
    }

    // ============================================================================
    // ⚠️⚠️⚠️ CRITICAL: DATABASE UPDATE - EMISSIONS DECREMENT ⚠️⚠️⚠️
    // ============================================================================
    //
    // DO NOT REMOVE OR MODIFY without approval from Tech Lead
    //
    // This is the actual database update that decrements emissions.
    //
    // CALCULATION:
    // - emissions_available: currentEmissions - 1
    // - emissions_used: emissionsUsed + 1
    //
    // DATABASE UPDATE:
    // - Table: platform_subscription
    // - WHERE: id = subscription.id (platform-wide single record)
    // - SET: emissions_available = newEmissionsAvailable (decremented)
    //        emissions_used = newEmissionsUsed (incremented)
    //
    // IMPORTANT: This update is NOT transactional with structure creation.
    // Structure is created first, then this is called. If this fails,
    // structure exists but emissions aren't consumed (reconciliation needed).
    //
    // CONSEQUENCES OF REMOVAL:
    // - Emissions never decrease in database
    // - Users get unlimited structure creation
    // - Complete subscription bypass
    //
    // ============================================================================
    const newEmissionsAvailable = currentEmissions - 1;
    const newEmissionsUsed = emissionsUsed + 1;

    // Update platform_subscription
    const { error: updateError } = await supabase
      .from('platform_subscription')
      .update({
        emissions_available: newEmissionsAvailable,
        emissions_used: newEmissionsUsed,
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('[Use Emission] Error updating subscription:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update emissions' },
        { status: 500 }
      );
    }

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
