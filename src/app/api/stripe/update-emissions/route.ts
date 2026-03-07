import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST - Manually update emissions for platform subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, addEmissions } = body;

    if (!email || !addEmissions) {
      return NextResponse.json(
        { success: false, error: 'email and addEmissions are required' },
        { status: 400 }
      );
    }

    console.log('[Update Emissions] Request:', { email, addEmissions });

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
      .select('id, emissions_available, subscription_status')
      .in('subscription_status', ['active', 'trialing'])
      .limit(1)
      .single();

    if (subError || !subscription) {
      console.error('[Update Emissions] No active subscription found:', subError);
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const currentEmissions = subscription.emissions_available || 0;
    const emissionsToAdd = parseInt(addEmissions);
    const newEmissions = currentEmissions + emissionsToAdd;

    // Update platform_subscription
    const { error: updateError } = await supabase
      .from('platform_subscription')
      .update({
        emissions_available: newEmissions,
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('[Update Emissions] Error updating subscription:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update emissions' },
        { status: 500 }
      );
    }

    console.log('[Update Emissions] Updated emissions:', {
      previousEmissions: currentEmissions,
      addedEmissions: emissionsToAdd,
      newEmissions,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      previousEmissions: currentEmissions,
      addedEmissions: emissionsToAdd,
      newEmissions,
    });
  } catch (error: any) {
    console.error('[Update Emissions] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
