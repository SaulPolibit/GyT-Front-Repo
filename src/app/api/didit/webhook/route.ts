import { NextRequest, NextResponse } from 'next/server';

// DiDit webhook payload interface
interface DiditWebhookPayload {
  session_id: string;
  status: 'Approved' | 'Declined' | 'Pending' | 'In Progress' | 'Expired';
  user_id?: string;
  email?: string;
  timestamp?: string;
  decision?: {
    kyc?: {
      status: string;
      reason?: string;
    };
    aml?: {
      status: string;
      risk_level?: string;
    };
  };
  // Add other fields as needed based on DiDit's webhook format
}

// Disable body parsing for webhook signature verification
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DiditWebhookPayload;

    console.log('[DiDit Webhook] Received:', JSON.stringify(body, null, 2));

    const { session_id, status, email, user_id } = body;

    if (!session_id) {
      console.error('[DiDit Webhook] No session_id in payload');
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // TODO: Verify webhook signature if DiDit provides one
    // const signature = request.headers.get('x-didit-signature');
    // if (!verifySignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    console.log('[DiDit Webhook] Processing KYC result:', { session_id, status, email });

    // If status is Approved, deduct credits from subscription
    if (status === 'Approved' && email) {
      try {
        // Get the backend API URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        // Update user KYC status in backend
        const updateResponse = await fetch(`${apiUrl}/api/users/kyc-status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session_id,
            email,
            userId: user_id,
            kycStatus: status,
          }),
        });

        if (!updateResponse.ok) {
          console.warn('[DiDit Webhook] Failed to update user KYC status in backend');
        } else {
          console.log('[DiDit Webhook] Updated user KYC status in backend');
        }

        // Deduct credits for KYC verification
        // Find the firm owner's subscription to deduct credits
        const creditResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stripe/use-credits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email, // This should be the firm owner's email, not the investor's
            amount: 2500, // $25.00 per KYC in cents
            reason: `KYC approval for session ${session_id}`,
          }),
        });

        const creditData = await creditResponse.json();
        if (creditData.success) {
          console.log('[DiDit Webhook] Deducted KYC credits:', creditData);
        } else {
          console.warn('[DiDit Webhook] Failed to deduct credits:', creditData.error);
        }
      } catch (error) {
        console.error('[DiDit Webhook] Error processing approval:', error);
        // Don't fail the webhook, just log the error
      }
    }

    // Return success to DiDit
    return NextResponse.json({
      success: true,
      message: `KYC status ${status} processed for session ${session_id}`,
    });
  } catch (error: any) {
    console.error('[DiDit Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (some services require this)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get('challenge');

  // If DiDit sends a challenge for verification, echo it back
  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    status: 'DiDit webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
