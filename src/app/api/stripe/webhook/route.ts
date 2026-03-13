import { NextRequest, NextResponse } from 'next/server';
import { stripe, getSubscriptionModel } from '@/lib/stripe-server';
import { updateUserSubscriptionStatus } from '@/lib/supabase-server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Disable body parsing, we need raw body for webhook signature verification
export const dynamic = 'force-dynamic';

// Tier limits for subscription models
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

const getLimitsForTier = (model: string, tier: string) => {
  if (model === 'payg') {
    // PAYG tiers: starter, growth, enterprise
    return PAYG_LIMITS[tier] || PAYG_LIMITS.starter;
  }
  // Tier-based tiers: starter, professional, enterprise
  return TIER_BASED_LIMITS[tier] || TIER_BASED_LIMITS.starter;
};

// Normalize tier name based on model (handle tier name differences)
const normalizeTier = (model: string, tier: string): string => {
  // If tier is valid for the model, return as-is
  if (model === 'payg') {
    if (['starter', 'growth', 'enterprise'].includes(tier)) return tier;
    // Map tier_based names to PAYG equivalents
    if (tier === 'professional') return 'growth';
    return 'starter';
  } else {
    if (['starter', 'professional', 'enterprise'].includes(tier)) return tier;
    // Map PAYG names to tier_based equivalents
    if (tier === 'growth') return 'professional';
    return 'starter';
  }
};

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

            // Get platform subscription (any status - user can add credits even when canceling)
            const { data: platformSub, error: subError } = await supabase
              .from('platform_subscription')
              .select('id, credit_balance, managed_by_user_id')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (subError || !platformSub) {
              console.error('[Stripe Webhook] No platform subscription found:', subError);
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

        // Handle extra investors purchase
        if (metadata.type === 'extra_investors' && session.mode === 'payment') {
          const extraInvestors = parseInt(metadata.extraInvestors || '0');
          console.log('[Stripe Webhook] Extra investors purchase:', { extraInvestors });

          if (extraInvestors > 0 && supabaseUrl && supabaseKey) {
            try {
              const supabase = createClient(supabaseUrl, supabaseKey);

              // Get platform subscription with model and tier info
              const { data: platformSub } = await supabase
                .from('platform_subscription')
                .select('id, max_investors, extra_investors_purchased, subscription_model, subscription_tier')
                .in('subscription_status', ['active', 'trialing', 'canceling', 'incomplete'])
                .limit(1)
                .single();

              if (platformSub) {
                const currentExtra = platformSub.extra_investors_purchased || 0;
                const updateData: Record<string, number> = {
                  extra_investors_purchased: currentExtra + extraInvestors
                };

                // If max_investors is 0, initialize with tier default (one-time fix)
                if (!platformSub.max_investors || platformSub.max_investors === 0) {
                  const model = platformSub.subscription_model || 'tier_based';
                  const tier = platformSub.subscription_tier || 'starter';
                  const tierDefaults = model === 'payg'
                    ? (PAYG_LIMITS[tier] || PAYG_LIMITS.starter)
                    : (TIER_BASED_LIMITS[tier] || TIER_BASED_LIMITS.starter);
                  updateData.max_investors = tierDefaults.maxInvestors;
                  console.log('[Stripe Webhook] Initializing max_investors from tier default:', { model, tier, max: tierDefaults.maxInvestors });
                }

                await supabase
                  .from('platform_subscription')
                  .update(updateData)
                  .eq('id', platformSub.id);

                console.log('[Stripe Webhook] Updated extra_investors_purchased:', currentExtra, '->', currentExtra + extraInvestors);
              }
            } catch (err) {
              console.error('[Stripe Webhook] Failed to update extra investors:', err);
            }
          }
          break;
        }

        // Handle extra AUM purchase
        if (metadata.type === 'extra_aum' && session.mode === 'payment') {
          const extraCommitment = parseInt(metadata.extraCommitment || '0');
          console.log('[Stripe Webhook] Extra AUM purchase:', { extraCommitment });

          if (extraCommitment > 0 && supabaseUrl && supabaseKey) {
            try {
              const supabase = createClient(supabaseUrl, supabaseKey);

              // Get platform subscription with model and tier info
              const { data: platformSub } = await supabase
                .from('platform_subscription')
                .select('id, max_total_commitment, extra_commitment_purchased, subscription_model, subscription_tier')
                .in('subscription_status', ['active', 'trialing', 'canceling', 'incomplete'])
                .limit(1)
                .single();

              if (platformSub) {
                const currentExtra = parseFloat(platformSub.extra_commitment_purchased) || 0;
                const updateData: Record<string, number> = {
                  extra_commitment_purchased: currentExtra + extraCommitment
                };

                // If max_total_commitment is 0, initialize with tier default (one-time fix)
                if (!platformSub.max_total_commitment || parseFloat(platformSub.max_total_commitment) === 0) {
                  const model = platformSub.subscription_model || 'tier_based';
                  const tier = platformSub.subscription_tier || 'starter';
                  const tierDefaults = model === 'payg'
                    ? (PAYG_LIMITS[tier] || PAYG_LIMITS.starter)
                    : (TIER_BASED_LIMITS[tier] || TIER_BASED_LIMITS.starter);
                  updateData.max_total_commitment = tierDefaults.maxTotalCommitment;
                  console.log('[Stripe Webhook] Initializing max_total_commitment from tier default:', { model, tier, max: tierDefaults.maxTotalCommitment });
                }

                await supabase
                  .from('platform_subscription')
                  .update(updateData)
                  .eq('id', platformSub.id);

                console.log('[Stripe Webhook] Updated extra_commitment_purchased:', currentExtra, '->', currentExtra + extraCommitment);
              }
            } catch (err) {
              console.error('[Stripe Webhook] Failed to update extra AUM:', err);
            }
          }
          break;
        }

        // Handle subscription checkout
        const { userId, firmId, planTier, includedEmissions, subscriptionModel, initialCreditDeposit } = metadata;

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

              // Get the Stripe subscription to get the start date and actual status
              const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
              const subscriptionStartDate = new Date(stripeSubscription.start_date * 1000).toISOString();
              // Use the actual Stripe subscription status
              const actualStatus = stripeSubscription.status;

              console.log('[Stripe Webhook] Stripe subscription details:', {
                id: stripeSubscription.id,
                status: actualStatus,
                startDate: subscriptionStartDate,
                metadata: stripeSubscription.metadata
              });

              // Get user ID from email
              const { data: user } = await supabase
                .from('users')
                .select('id')
                .eq('email', session.customer_email.toLowerCase())
                .single();

              // Check if platform_subscription already exists by stripe_subscription_id first (prevents duplicates)
              const { data: existingBySubId } = await supabase
                .from('platform_subscription')
                .select('id')
                .eq('stripe_subscription_id', session.subscription as string)
                .maybeSingle();

              // Fall back to checking any existing subscription
              const existingSub = existingBySubId || (await supabase
                .from('platform_subscription')
                .select('id')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()).data;

              // Use metadata model, or fall back to env var, then default to tier_based
              const finalModel = subscriptionModel || getSubscriptionModel();
              // Normalize tier name based on model (handles tier name differences between models)
              const finalTier = normalizeTier(finalModel, planTier || 'starter');
              const limits = getLimitsForTier(finalModel, finalTier);

              console.log('[Stripe Webhook] Setting subscription with:', {
                model: finalModel,
                tier: finalTier,
                planTierFromMetadata: planTier,
                limits,
                fromMetadata: !!subscriptionModel,
                envModel: getSubscriptionModel(),
                actualStripeStatus: actualStatus
              });

              const platformSubData: Record<string, any> = {
                stripe_subscription_id: session.subscription as string,
                stripe_customer_id: session.customer as string,
                subscription_model: finalModel,
                subscription_tier: finalTier,
                subscription_status: actualStatus, // Use actual Stripe status
                subscription_start_date: subscriptionStartDate,
                managed_by_user_id: user?.id || userId,
                max_investors: limits.maxInvestors,
                max_total_commitment: limits.maxTotalCommitment,
                emissions_available: parseInt(includedEmissions || '0'),
              };

              // Initialize credit_balance for PAYG model with initial deposit from checkout
              if (finalModel === 'payg') {
                // Use initialCreditDeposit from checkout metadata (default $50 = 5000 cents)
                platformSubData.credit_balance = parseInt(initialCreditDeposit || '0') || 5000;
              }

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
        console.log('[Stripe Webhook] Subscription metadata:', subscription.metadata);

        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Build update data - always update status
            const updateData: Record<string, any> = {
              subscription_status: subscription.status
            };

            // If metadata has tier/model info, update those too
            const { planTier, subscriptionModel } = subscription.metadata || {};
            if (planTier || subscriptionModel) {
              const finalModel = subscriptionModel || getSubscriptionModel();
              const finalTier = normalizeTier(finalModel, planTier || 'starter');
              const limits = getLimitsForTier(finalModel, finalTier);

              updateData.subscription_model = finalModel;
              updateData.subscription_tier = finalTier;
              updateData.max_investors = limits.maxInvestors;
              updateData.max_total_commitment = limits.maxTotalCommitment;

              console.log('[Stripe Webhook] Also updating tier/model from metadata:', {
                model: finalModel,
                tier: finalTier,
                limits
              });
            }

            // Update platform_subscription
            const { error } = await supabase
              .from('platform_subscription')
              .update(updateData)
              .eq('stripe_subscription_id', subscription.id);

            if (error) {
              console.error('[Stripe Webhook] Error updating platform_subscription:', error);
            } else {
              console.log('[Stripe Webhook] Updated platform_subscription:', updateData);
            }
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
        console.log('[Stripe Webhook] Invoice subscription:', invoice.subscription);

        // Check if this is an emission purchase
        if (invoice.metadata?.type === 'emission_purchase') {
          console.log('[Stripe Webhook] Emission purchase completed:', invoice.metadata.emissionsAdded);
        }

        // Check if this is a credit top-up
        if (invoice.metadata?.type === 'credit_topup') {
          console.log('[Stripe Webhook] Credit top-up completed:', invoice.metadata.amount);
        }

        // If this invoice is for a subscription, update status to active
        if (invoice.subscription && invoice.billing_reason === 'subscription_create') {
          try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (supabaseUrl && supabaseKey) {
              const supabase = createClient(supabaseUrl, supabaseKey);

              // Get the subscription to get its metadata
              const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
              const { planTier, subscriptionModel } = stripeSubscription.metadata || {};

              console.log('[Stripe Webhook] Invoice paid for subscription:', {
                subscriptionId: invoice.subscription,
                status: stripeSubscription.status,
                planTier,
                subscriptionModel
              });

              // Build update data
              const updateData: Record<string, any> = {
                subscription_status: stripeSubscription.status // Should be 'active' now
              };

              // Also update tier/model if available
              if (planTier || subscriptionModel) {
                const finalModel = subscriptionModel || getSubscriptionModel();
                const finalTier = normalizeTier(finalModel, planTier || 'starter');
                const limits = getLimitsForTier(finalModel, finalTier);

                updateData.subscription_model = finalModel;
                updateData.subscription_tier = finalTier;
                updateData.max_investors = limits.maxInvestors;
                updateData.max_total_commitment = limits.maxTotalCommitment;

                console.log('[Stripe Webhook] Updating subscription from invoice.paid:', {
                  model: finalModel,
                  tier: finalTier,
                  status: stripeSubscription.status
                });
              }

              const { error } = await supabase
                .from('platform_subscription')
                .update(updateData)
                .eq('stripe_subscription_id', invoice.subscription);

              if (error) {
                console.error('[Stripe Webhook] Error updating from invoice.paid:', error);
              } else {
                console.log('[Stripe Webhook] Updated platform_subscription from invoice.paid');
              }
            }
          } catch (err) {
            console.error('[Stripe Webhook] Error processing invoice.paid:', err);
          }
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
