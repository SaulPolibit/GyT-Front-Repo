import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// DiDit webhook payload interface
interface DiditWebhookPayload {
  session_id: string;
  status: 'Approved' | 'Declined' | 'Pending' | 'In Progress' | 'Expired';
  user_id?: string;
  email?: string;
  timestamp?: string;
  created_at?: string;
  updated_at?: string;
  vendor_data?: string;
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
}

// Disable body parsing for webhook signature verification
export const dynamic = 'force-dynamic';

/**
 * Verify DiDit webhook signature
 * DiDit uses HMAC-SHA256 to sign webhooks
 */
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) {
    console.warn('[DiDit Webhook] Missing signature or secret');
    return false;
  }

  try {
    // DiDit might send signature in different formats
    // Common formats: "sha256=xxx" or just "xxx"
    const signatureValue = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signatureValue, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    console.error('[DiDit Webhook] Signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get signature from headers (DiDit might use different header names)
    const signature = request.headers.get('x-didit-signature')
      || request.headers.get('x-webhook-signature')
      || request.headers.get('x-signature');

    // Get webhook secret from environment
    const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret) {
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        console.error('[DiDit Webhook] Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      console.log('[DiDit Webhook] Signature verified successfully');
    } else {
      console.warn('[DiDit Webhook] No DIDIT_WEBHOOK_SECRET configured, skipping signature verification');
    }

    // Parse the body
    const body = JSON.parse(rawBody) as DiditWebhookPayload;

    console.log('[DiDit Webhook] Received:', JSON.stringify(body, null, 2));

    const { session_id, status, email, user_id } = body;

    if (!session_id) {
      console.error('[DiDit Webhook] No session_id in payload');
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    console.log('[DiDit Webhook] Processing KYC result:', { session_id, status, email });

    // Get the backend API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Always try to update user KYC status in backend (for any status change)
    try {
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
        console.warn('[DiDit Webhook] Failed to update user KYC status in backend:', updateResponse.status);
      } else {
        console.log('[DiDit Webhook] Updated user KYC status in backend');
      }
    } catch (updateError) {
      console.error('[DiDit Webhook] Error updating KYC status:', updateError);
    }

    // If status is Approved, deduct credits from subscription
    if (status === 'Approved' && email) {
      try {
        // Deduct credits for KYC verification
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const creditResponse = await fetch(`${appUrl}/api/stripe/use-credits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
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
      } catch (creditError) {
        console.error('[DiDit Webhook] Error deducting credits:', creditError);
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
