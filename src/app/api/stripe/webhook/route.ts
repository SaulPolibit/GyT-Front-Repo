import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { updateUserSubscriptionStatus } from '@/lib/supabase-server';
import Stripe from 'stripe';

// Disable body parsing, we need raw body for webhook signature verification
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] No signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('[Stripe Webhook] Event received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Stripe Webhook] Checkout completed:', session.id);

        // Extract metadata
        const { userId, firmId, planTier, includedEmissions, subscriptionModel } = session.metadata || {};

        // Update user subscription status in Supabase
        if (session.customer_email) {
          await updateUserSubscriptionStatus(
            session.customer_email,
            'active',
            session.subscription as string
          );
        }

        console.log('[Stripe Webhook] Subscription created for user:', userId, {
          planTier,
          includedEmissions,
          subscriptionModel,
        });

        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[Stripe Webhook] Subscription created:', subscription.id);

        // Store subscription details
        const metadata = subscription.metadata;
        console.log('[Stripe Webhook] Subscription metadata:', metadata);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[Stripe Webhook] Subscription updated:', subscription.id, 'Status:', subscription.status);

        // Get customer email to update Supabase
        const customerForUpdate = await stripe.customers.retrieve(subscription.customer as string);
        if (customerForUpdate && !customerForUpdate.deleted && customerForUpdate.email) {
          const status = subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
          await updateUserSubscriptionStatus(customerForUpdate.email, status, subscription.id);
        }

        // Handle status changes
        if (subscription.status === 'past_due') {
          // Send payment reminder
          console.log('[Stripe Webhook] Subscription past due, send reminder');
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[Stripe Webhook] Subscription deleted:', subscription.id);

        // Get customer email to update Supabase
        const customerForDelete = await stripe.customers.retrieve(subscription.customer as string);
        if (customerForDelete && !customerForDelete.deleted && customerForDelete.email) {
          await updateUserSubscriptionStatus(customerForDelete.email, 'canceled', subscription.id);
        }

        // Revoke access, send cancellation email
        const { userId } = subscription.metadata || {};
        console.log('[Stripe Webhook] Subscription cancelled for user:', userId);

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[Stripe Webhook] Invoice paid:', invoice.id, 'Amount:', invoice.amount_paid);

        // Check if this is an emission purchase
        if (invoice.metadata?.type === 'emission_purchase') {
          console.log('[Stripe Webhook] Emission purchase completed:', invoice.metadata.emissionsAdded);
        }

        // Check if this is a credit top-up
        if (invoice.metadata?.type === 'credit_topup') {
          console.log('[Stripe Webhook] Credit top-up completed:', invoice.metadata.amount);
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[Stripe Webhook] Invoice payment failed:', invoice.id);

        // Send payment failure notification
        // Consider pausing service or sending reminder

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[Stripe Webhook] Payment succeeded:', paymentIntent.id);

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[Stripe Webhook] Payment failed:', paymentIntent.id);
        console.log('[Stripe Webhook] Failure reason:', paymentIntent.last_payment_error?.message);

        break;
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
