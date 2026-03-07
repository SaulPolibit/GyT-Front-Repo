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

    // Decrement emissions
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
