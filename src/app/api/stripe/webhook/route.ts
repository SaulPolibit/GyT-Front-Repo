import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { updateUserSubscriptionStatus } from '@/lib/supabase-server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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
        console.log('[Stripe Webhook] Checkout completed:', session.id, 'Mode:', session.mode);
        console.log('[Stripe Webhook] Session metadata:', session.metadata);

        const metadata = session.metadata || {};
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Handle emission purchase
        if (metadata.type === 'emission_purchase') {
          const { emissionsAdded, userEmail } = metadata;
          const customerEmail = session.customer_email || userEmail;
          console.log('[Stripe Webhook] Emission purchase:', { emissionsAdded, customerEmail });

          try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
              console.error('[Stripe Webhook] Supabase not configured');
              break;
            }

            const supabase = createClient(supabaseUrl, supabaseKey);

            // Check if session already processed
            const { data: existingSession } = await supabase
              .from('processed_stripe_sessions')
              .select('id')
              .eq('session_id', session.id)
              .maybeSingle();

            if (existingSession) {
              console.log('[Stripe Webhook] Emission session already processed:', session.id);
              break;
            }

            // Get platform subscription
            const { data: platformSub, error: subError } = await supabase
              .from('platform_subscription')
              .select('id, emissions_available')
              .in('subscription_status', ['active', 'trialing'])
              .limit(1)
              .single();

            if (subError || !platformSub) {
              console.error('[Stripe Webhook] No active platform subscription found:', subError);
              break;
            }

            // Get user ID for processed_stripe_sessions
            let userId = platformSub.managed_by_user_id;
            if (customerEmail) {
              const { data: user } = await supabase
                .from('users')
                .select('id')
                .eq('email', customerEmail.toLowerCase())
                .single();
              if (user) userId = user.id;
            }

            // Mark session as processed
            await supabase
              .from('processed_stripe_sessions')
              .insert({ session_id: session.id, user_id: userId });

            // Update platform_subscription
            const currentEmissions = platformSub.emissions_available || 0;
            const newEmissions = currentEmissions + parseInt(emissionsAdded || '0');

            const { error: updateError } = await supabase
              .from('platform_subscription')
              .update({ emissions_available: newEmissions })
              .eq('id', platformSub.id);

            if (updateError) {
              console.error('[Stripe Webhook] Error updating emissions:', updateError);
            } else {
              console.log('[Stripe Webhook] Updated emissions:', currentEmissions, '->', newEmissions);
            }
          } catch (err) {
            console.error('[Stripe Webhook] Failed to update emissions:', err);
          }
          break;
        }

        // Handle credit top-up
        if (metadata.type === 'credit_topup') {
          const { amount, userEmail } = metadata;
          const customerEmail = session.customer_email || userEmail;
          console.log('[Stripe Webhook] Credit top-up:', { amount, customerEmail });

          try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
              console.error('[Stripe Webhook] Supabase not configured');
              break;
            }

            const supabase = createClient(supabaseUrl, supabaseKey);

            // Check if session already processed
            const { data: existingSession } = await supabase
              .from('processed_stripe_sessions')
              .select('id')
              .eq('session_id', session.id)
              .maybeSingle();

            if (existingSession) {
              console.log('[Stripe Webhook] Credit session already processed:', session.id);
              break;
            }

            // Get platform subscription
            const { data: platformSub, error: subError } = await supabase
              .from('platform_subscription')
              .select('id, credit_balance, managed_by_user_id')
              .in('subscription_status', ['active', 'trialing'])
              .limit(1)
              .single();

            if (subError || !platformSub) {
              console.error('[Stripe Webhook] No active platform subscription found:', subError);
              break;
            }

            // Get user ID for processed_stripe_sessions
            let userId = platformSub.managed_by_user_id;
            if (customerEmail) {
              const { data: user } = await supabase
                .from('users')
                .select('id')
                .eq('email', customerEmail.toLowerCase())
                .single();
              if (user) userId = user.id;
            }

            // Mark session as processed
            await supabase
              .from('processed_stripe_sessions')
              .insert({ session_id: session.id, user_id: userId });

            // Update platform_subscription
            const currentBalance = platformSub.credit_balance || 0;
            const newBalance = currentBalance + parseInt(amount || '0');

            const { error: updateError } = await supabase
              .from('platform_subscription')
              .update({ credit_balance: newBalance })
              .eq('id', platformSub.id);

            if (updateError) {
              console.error('[Stripe Webhook] Error updating credit balance:', updateError);
            } else {
              console.log('[Stripe Webhook] Updated credit balance:', currentBalance, '->', newBalance);
            }
          } catch (err) {
            console.error('[Stripe Webhook] Failed to update credit balance:', err);
          }
          break;
        }

        // Handle subscription checkout
        const { userId, firmId, planTier, includedEmissions, subscriptionModel } = metadata;

        // Update user subscription status in Supabase (including model and tier)
        if (session.customer_email) {
          await updateUserSubscriptionStatus(
            session.customer_email,
            'active',
            session.subscription as string,
            subscriptionModel as 'tier_based' | 'payg' | undefined,
            planTier // This is the tier (starter, professional, enterprise, growth)
          );

          // Create or update platform_subscription with subscription_start_date
          if (supabaseUrl && supabaseKey && session.subscription) {
            try {
              const supabase = createClient(supabaseUrl, supabaseKey);

              // Get the Stripe subscription to get the start date
              const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
              const subscriptionStartDate = new Date(stripeSubscription.start_date * 1000).toISOString();

              // Get user ID from email
              const { data: user } = await supabase
                .from('users')
                .select('id')
                .eq('email', session.customer_email.toLowerCase())
                .single();

              // Check if platform_subscription already exists
              const { data: existingSub } = await supabase
                .from('platform_subscription')
                .select('id')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              const platformSubData = {
                stripe_subscription_id: session.subscription as string,
                stripe_customer_id: session.customer as string,
                subscription_model: subscriptionModel || 'payg',
                subscription_tier: planTier || 'starter',
                subscription_status: 'active',
                subscription_start_date: subscriptionStartDate,
                managed_by_user_id: user?.id || userId,
              };

              if (existingSub) {
                // Update existing
                await supabase
                  .from('platform_subscription')
                  .update(platformSubData)
                  .eq('id', existingSub.id);
                console.log('[Stripe Webhook] Updated platform_subscription with start_date:', subscriptionStartDate);
              } else {
                // Insert new
                await supabase
                  .from('platform_subscription')
                  .insert(platformSubData);
                console.log('[Stripe Webhook] Created platform_subscription with start_date:', subscriptionStartDate);
              }
            } catch (err) {
              console.error('[Stripe Webhook] Error updating platform_subscription:', err);
            }
          }
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

        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Update platform_subscription status
            await supabase
              .from('platform_subscription')
              .update({ subscription_status: subscription.status })
              .eq('stripe_subscription_id', subscription.id);

            console.log('[Stripe Webhook] Updated platform_subscription status to:', subscription.status);
          }
        } catch (err) {
          console.error('[Stripe Webhook] Error updating platform_subscription:', err);
        }

        // Handle status changes
        if (subscription.status === 'past_due') {
          console.log('[Stripe Webhook] Subscription past due, send reminder');
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[Stripe Webhook] Subscription deleted:', subscription.id);

        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Update platform_subscription status to canceled
            await supabase
              .from('platform_subscription')
              .update({ subscription_status: 'canceled' })
              .eq('stripe_subscription_id', subscription.id);

            console.log('[Stripe Webhook] Updated platform_subscription status to canceled');
          }
        } catch (err) {
          console.error('[Stripe Webhook] Error updating platform_subscription:', err);
        }

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
