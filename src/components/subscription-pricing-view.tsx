'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  Wallet,
  Zap,
  Package,
  CreditCard,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Users,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import {
  getSubscriptionModel,
  SHARED_PRODUCTS,
  TIER_BASED_PLANS,
  TIER_BASED_ADDONS,
  PAYG_PLANS,
  CREDIT_WALLET_CONFIG,
  formatAmount,
  getPaygCostsForTier,
  getEmulatedSubscription,
  saveEmulatedSubscription,
  clearEmulatedSubscription,
  saveStripeSubscription,
  clearStripeSubscription,
  StripeSubscription,
  EmulatedSubscription
} from '@/lib/stripe-products';
import { getAuthState, getAuthToken } from '@/lib/auth-storage';
import { getApiUrl, API_CONFIG } from '@/lib/api-config';

interface SubscriptionPricingViewProps {
  onSubscriptionChange?: (subscription: EmulatedSubscription | null) => void;
  useRealStripe?: boolean; // Set to true to use real Stripe instead of emulated
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export function SubscriptionPricingView({ onSubscriptionChange, useRealStripe = false }: SubscriptionPricingViewProps) {
  const [subscription, setSubscription] = useState<EmulatedSubscription | null>(null);
  const [stripeSubscription, setStripeSubscription] = useState<any>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedEmissions, setSelectedEmissions] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEmissionPurchaseDialog, setShowEmissionPurchaseDialog] = useState(false);
  const [pendingEmissionProductId, setPendingEmissionProductId] = useState<string | null>(null);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [pendingTopUpAmount, setPendingTopUpAmount] = useState<number | null>(null);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showCurrencyConflictDialog, setShowCurrencyConflictDialog] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Extra AUM and Extra Investors states (tier_based only)
  const [showExtraInvestorsDialog, setShowExtraInvestorsDialog] = useState(false);
  const [showExtraAumDialog, setShowExtraAumDialog] = useState(false);
  const [pendingExtraInvestors, setPendingExtraInvestors] = useState<number | null>(null);
  const [pendingExtraAum, setPendingExtraAum] = useState<number | null>(null);
  const [extraInvestorsInput, setExtraInvestorsInput] = useState<number>(1);
  const [extraAumInput, setExtraAumInput] = useState<number>(1);
  const [subscriptionUsage, setSubscriptionUsage] = useState<{
    investors: { current: number; limit: number; remaining: number };
    commitment: { current: number; limit: number; remaining: number } | null;
  } | null>(null);

  // Subscription model from database (dynamic, not from env)
  const [subscriptionModelFromDb, setSubscriptionModelFromDb] = useState<'tier_based' | 'payg' | null>(null);
  const [usageLoadError, setUsageLoadError] = useState<string | null>(null);

  // Use database value if available, fallback to env for initial render
  const subscriptionModel = subscriptionModelFromDb || getSubscriptionModel();

  console.log('[SubscriptionPricingView] Current state:', {
    subscriptionModel,
    subscriptionModelFromDb,
    hasUsage: !!subscriptionUsage,
    usageLoadError,
    envModel: typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUBSCRIPTION_MODEL : 'server'
  });
  console.log('[SubscriptionPricingView] subscriptionUsage details:', subscriptionUsage);
  const plans = subscriptionModel === 'tier_based' ? TIER_BASED_PLANS : PAYG_PLANS;
  const setupFee = SHARED_PRODUCTS[0];
  const emissionProducts = SHARED_PRODUCTS.filter(
    p => p.metadata.addon_type === 'emission' || p.metadata.addon_type === 'emission_pack'
  );

  useEffect(() => {
    console.log('[SubscriptionPricingView] Mode:', useRealStripe ? 'REAL STRIPE' : 'EMULATED');

    // Handle Stripe redirect callbacks
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const sessionId = urlParams.get('session_id');
    const purchase = urlParams.get('purchase');

    const verifyAndLoadSubscription = async () => {
      const quantity = urlParams.get('quantity');

      // If returning from a successful purchase, verify and apply it
      if (success === 'true' && sessionId && purchase === 'emissions') {
        console.log('[SubscriptionPricingView] Verifying emissions purchase:', sessionId);
        try {
          const authState = getAuthState();
          const email = authState.user?.email || authState.supabase?.email;

          const response = await fetch('/api/stripe/verify-purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, email }),
          });

          const data = await response.json();
          console.log('[SubscriptionPricingView] Verify purchase response:', data);

          if (data.success) {
            if (data.type === 'emission_purchase') {
              toast.success(`${data.emissionsAdded} emissions added! Total: ${data.newEmissions}`);
            } else if (data.message === 'Session already processed') {
              toast.info('Purchase already applied');
            } else {
              toast.success('Purchase verified successfully!');
            }
          } else {
            console.error('[SubscriptionPricingView] Verify purchase error:', data.error);
            toast.error(data.error || 'Failed to verify purchase');
          }
        } catch (error) {
          console.error('[SubscriptionPricingView] Verify purchase exception:', error);
          toast.error('Failed to verify purchase');
        }
        window.history.replaceState({}, '', window.location.pathname + '?tab=subscription');
      } else if (success === 'true' && purchase === 'credits' && sessionId) {
        // Verify credit top-up via backend
        console.log('[SubscriptionPricingView] Verifying credit top-up:', { sessionId, amount: urlParams.get('amount') });
        try {
          const token = getAuthToken();
          // Call frontend API route directly
          const verifyResponse = await fetch('/api/stripe/verify-purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId }),
          });

          const verifyData = await verifyResponse.json();
          console.log('[SubscriptionPricingView] Verify credits response:', verifyData);

          if (verifyData.success) {
            toast.success(`Credits added! New balance: $${(verifyData.newBalance / 100).toFixed(2)}`);
          } else {
            toast.success('Credits purchased! Your balance has been updated.');
          }
        } catch (error) {
          console.error('[SubscriptionPricingView] Error verifying credit purchase:', error);
          toast.success('Credits purchased! Refreshing...');
        }
        window.history.replaceState({}, '', window.location.pathname + '?tab=subscription');
      } else if (success === 'true' && (purchase === 'extra_investors' || purchase === 'extra_aum') && sessionId) {
        // Verify and apply the extra purchase
        console.log('[SubscriptionPricingView] Verifying extra purchase:', { purchase, sessionId, quantity });
        try {
          const token = getAuthToken();
          // Call frontend API route directly
          const verifyResponse = await fetch('/api/stripe/verify-purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId }),
          });

          const verifyData = await verifyResponse.json();
          console.log('[SubscriptionPricingView] Verify response:', verifyData);

          if (verifyData.success) {
            if (purchase === 'extra_investors') {
              toast.success(`Successfully added ${quantity || ''} extra investor slots! New limit: ${verifyData.newLimit}`);
            } else {
              toast.success(`Successfully added $${quantity || ''}M extra AUM! New limit: $${(verifyData.newLimit / 1000000).toFixed(0)}M`);
            }
          } else {
            // May already be processed
            if (purchase === 'extra_investors') {
              toast.success(`Extra investor slots purchased! Your limits have been updated.`);
            } else {
              toast.success(`Extra AUM capacity purchased! Your limits have been updated.`);
            }
          }
        } catch (verifyError) {
          console.error('[SubscriptionPricingView] Error verifying extra purchase:', verifyError);
          toast.success('Purchase completed! Refreshing your limits...');
        }
        window.history.replaceState({}, '', window.location.pathname + '?tab=subscription');
      } else if (success === 'true') {
        if (sessionId) {
          toast.success('Subscription created successfully!');
        }
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname + '?tab=subscription');
      } else if (canceled === 'true') {
        toast.info('Checkout was cancelled');
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname + '?tab=subscription');
      }

      // Load subscription data
      await loadSubscription();
    };

    verifyAndLoadSubscription();
  }, [useRealStripe]);

  const loadSubscription = async () => {
    setLoading(true);

    if (useRealStripe) {
      // Load from Stripe API
      try {
        const authState = getAuthState();
        const email = authState.user?.email || authState.supabase?.email;
        const userId = authState.user?.id || authState.supabase?.id;
        console.log('[LoadSubscription] Auth state:', { email, userId });

        if (email) {
          const response = await fetch(`/api/stripe/subscription?email=${encodeURIComponent(email)}`);
          const data = await response.json();
          console.log('[LoadSubscription] API response:', data);

          if (data.success && data.subscription) {
            console.log('[LoadSubscription] Subscription found:', data.subscription);
            console.log('[LoadSubscription] Subscription status:', data.subscription.status);
            console.log('[LoadSubscription] cancelAtPeriodEnd:', data.subscription.cancelAtPeriodEnd);
            console.log('[LoadSubscription] isPaused:', data.subscription.isPaused);

            setStripeSubscription(data.subscription);
            setCustomerId(data.customerId);
            setCancelAtPeriodEnd(data.subscription.cancelAtPeriodEnd || false);
            setIsPaused(data.subscription.isPaused || false);

            // Save to global cache for app-wide access
            const globalSub: StripeSubscription = {
              id: data.subscription.id,
              status: data.subscription.status,
              planTier: data.subscription.planTier || 'starter',
              planName: data.subscription.planName || 'Subscription',
              planAmount: data.subscription.planAmount || 0,
              emissionsAvailable: data.subscription.emissionsAvailable ?? 0,
              emissionsUsed: data.subscription.emissionsUsed ?? 0,
              creditBalance: data.subscription.creditBalance ?? 0,
              currentPeriodStart: data.subscription.currentPeriodStart,
              currentPeriodEnd: data.subscription.currentPeriodEnd,
              cancelAtPeriodEnd: data.subscription.cancelAtPeriodEnd || false,
              isPaused: data.subscription.isPaused || false,
              customerId: data.customerId || '',
              customerEmail: email,
              lastFetched: Date.now(),
            };
            saveStripeSubscription(globalSub);
            console.log('[LoadSubscription] Saved to global cache:', globalSub);

            // Only hide if subscription is fully canceled (not active, not incomplete, etc.)
            if (data.subscription.status === 'canceled') {
              console.log('[LoadSubscription] Subscription is canceled, showing pricing view');
              setSubscription(null);
              setStripeSubscription(null);
              clearStripeSubscription(); // Clear global cache too
            } else {
              // Show subscription for any non-canceled status
              // Find matching plan by tier name
              const planTier = data.subscription.planTier;
              const matchedPlan = plans.find(p => (p as any).tier === planTier) || plans[0];
              console.log('[LoadSubscription] Matched plan:', { planTier, matchedPlan });

              // Convert to EmulatedSubscription format for consistency
              const emulated: EmulatedSubscription = {
                id: data.subscription.id,
                status: data.subscription.status,
                model: subscriptionModel,
                currentPlan: matchedPlan,
                setupFeePaid: true,
                emissionsUsed: data.subscription.emissionsUsed ?? 0,
                emissionsAvailable: data.subscription.emissionsAvailable ?? 0,
                creditBalance: parseInt(data.subscription.creditBalance ?? '0'),
                currentPeriodStart: new Date(data.subscription.currentPeriodStart * 1000),
                currentPeriodEnd: new Date(data.subscription.currentPeriodEnd * 1000),
              };
              setSubscription(emulated);
            }
          } else {
            console.log('[LoadSubscription] No subscription found:', data);
            setSubscription(null);
            setStripeSubscription(null);
            setCancelAtPeriodEnd(false);
            clearStripeSubscription(); // Clear global cache
          }
        }
      } catch (error) {
        console.error('Error loading Stripe subscription:', error);
      }
    } else {
      // Load emulated subscription
      const sub = getEmulatedSubscription();
      setSubscription(sub);
      if (sub?.currentPlan) {
        setSelectedPlanId(sub.currentPlan.id);
      }
    }

    // Always load subscription usage from database API (includes model and limits)
    try {
      const token = getAuthToken();
      console.log('[LoadSubscription] Loading usage, token exists:', !!token);
      if (token) {
        // Call frontend API route directly (not through backend)
        const usageUrl = '/api/stripe/subscription-usage';
        console.log('[LoadSubscription] Fetching from:', usageUrl);
        const usageResponse = await fetch(usageUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usageData = await usageResponse.json();
        console.log('[LoadSubscription] Usage data:', usageData);
        if (usageData.success && usageData.usage) {
          // Set subscription model from database
          if (usageData.usage.model) {
            setSubscriptionModelFromDb(usageData.usage.model as 'tier_based' | 'payg');
          }
          // Set usage stats
          setSubscriptionUsage({
            investors: usageData.usage.investors,
            commitment: usageData.usage.commitment
          });
          // Update subscription credit balance from database (for PAYG)
          if (usageData.usage.creditBalance !== undefined) {
            setSubscription(prev => prev ? { ...prev, creditBalance: usageData.usage.creditBalance } : prev);
          }
          setUsageLoadError(null);
        } else {
          console.error('[LoadSubscription] API returned error:', usageData);
          setUsageLoadError(usageData.message || usageData.error || 'Failed to load usage data');
        }
      } else {
        console.warn('[LoadSubscription] No auth token found');
        setUsageLoadError('Not authenticated');
      }
    } catch (usageError: any) {
      console.error('[LoadSubscription] Error loading usage:', usageError);
      setUsageLoadError(usageError.message || 'Failed to load usage data');
    }

    setLoading(false);
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Map internal plan ID to Stripe tier
  const getPlanTier = (planId: string): string => {
    if (planId.includes('starter')) return 'starter';
    if (planId.includes('professional')) return 'professional';
    if (planId.includes('growth')) return 'growth';
    if (planId.includes('enterprise')) return 'enterprise';
    return 'starter';
  };

  // Map emission selection to emission pack ID
  const getEmissionPackId = (productId: string | null): string | null => {
    if (!productId) return null;
    if (productId.includes('individual') || productId.includes('single')) return 'emissionSingle';
    if (productId.includes('pack_5') || productId.includes('pack5')) return 'emissionPack5';
    if (productId.includes('pack_10') || productId.includes('pack10')) return 'emissionPack10';
    if (productId.includes('pack_20') || productId.includes('pack20')) return 'emissionPack20';
    return null;
  };

  const handleSubscribe = async (forceNewCustomer = false) => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setProcessing(true);
    setShowCurrencyConflictDialog(false);

    if (useRealStripe) {
      // Use real Stripe checkout
      try {
        const authState = getAuthState();
        const planTier = getPlanTier(selectedPlanId!);
        const userEmail = authState.user?.email || authState.supabase?.email;
        const userId = authState.user?.id || authState.supabase?.id;

        console.log('[Stripe Checkout] Starting checkout...', {
          planTier,
          emissionPackId: getEmissionPackId(selectedEmissions),
          userId,
          userEmail,
          forceNewCustomer,
        });

        // Require valid user email for real Stripe
        if (!userEmail) {
          toast.error('Please sign in to subscribe');
          setProcessing(false);
          return;
        }

        // Check if user already has a subscription
        const checkResponse = await fetch(`/api/stripe/subscription?email=${encodeURIComponent(userEmail)}`);
        const checkData = await checkResponse.json();

        if (checkData.success && checkData.subscription && checkData.subscription.status === 'active') {
          toast.error('You already have an active subscription. Please manage it from the billing portal.');
          setStripeSubscription(checkData.subscription);
          setCustomerId(checkData.customerId);
          await loadSubscription();
          setProcessing(false);
          return;
        }

        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planTier,
            emissionPackId: getEmissionPackId(selectedEmissions),
            userId: userId || userEmail,
            userEmail: userEmail,
            firmId: authState.user?.id || '',
            firmName: '',
            forceNewCustomer,
          }),
        });

        const data = await response.json();
        console.log('[Stripe Checkout] Response:', data);

        if (data.success && data.url) {
          // Redirect to Stripe Checkout
          console.log('[Stripe Checkout] Redirecting to:', data.url);
          window.location.href = data.url;
        } else {
          console.error('[Stripe Checkout] Error:', data.error, data);
          // Handle specific errors
          if (data.subscriptionStatus || data.error?.includes('already have')) {
            // Existing subscription found - reload to show it
            toast.error(data.error || 'You already have an existing subscription.');
            await loadSubscription();
          } else if (data.retryWithNewCustomer || data.error?.includes('currency') || data.error?.includes('currencies')) {
            // Currency conflict - offer to create with new customer
            setShowCurrencyConflictDialog(true);
          } else {
            toast.error(data.error || 'Failed to create checkout session');
          }
        }
      } catch (error: any) {
        console.error('[Stripe Checkout] Exception:', error);
        toast.error(error.message || 'Failed to create checkout session');
      }
    } else {
      console.log('[Stripe Checkout] Using emulated mode (useRealStripe=false)');
      // Emulated subscription
      await new Promise(resolve => setTimeout(resolve, 500));

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      let totalEmissions = 5;
      if (selectedEmissions) {
        const emissionProduct = emissionProducts.find(p => p.id === selectedEmissions);
        if (emissionProduct) {
          totalEmissions += emissionProduct.metadata.pack_size || 1;
        }
      }

      const newSubscription: EmulatedSubscription = {
        id: `sub_${Date.now()}`,
        status: 'active',
        model: subscriptionModel,
        currentPlan: selectedPlan,
        setupFeePaid: true,
        emissionsUsed: 0,
        emissionsAvailable: totalEmissions,
        creditBalance: subscriptionModel === 'payg' ? CREDIT_WALLET_CONFIG.minimumTopUp : undefined,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      };

      saveEmulatedSubscription(newSubscription);
      setSubscription(newSubscription);
      onSubscriptionChange?.(newSubscription);
      toast.success('Subscription activated!');
    }

    setProcessing(false);
  };

  const initiateEmissionPurchase = (productId: string) => {
    setPendingEmissionProductId(productId);
    setShowEmissionPurchaseDialog(true);
  };

  const handlePurchaseEmissions = async () => {
    if (!subscription || !pendingEmissionProductId) return;
    setShowEmissionPurchaseDialog(false);
    setProcessing(true);
    const productId = pendingEmissionProductId;

    if (useRealStripe && stripeSubscription) {
      try {
        const authState = getAuthState();
        const userEmail = authState.user?.email || authState.supabase?.email;

        console.log('[Purchase Emissions] Calling API with:', { customerId, subscriptionId: stripeSubscription.id, emissionPackId: getEmissionPackId(productId), userEmail });
        const response = await fetch('/api/stripe/purchase-emissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            subscriptionId: stripeSubscription.id,
            emissionPackId: getEmissionPackId(productId),
            userEmail,
          }),
        });

        const data = await response.json();
        console.log('[Purchase Emissions] API response:', data);

        if (data.success && data.url) {
          // Redirect to Stripe Checkout
          console.log('[Purchase Emissions] Redirecting to:', data.url);
          window.location.href = data.url;
          return;
        } else {
          toast.error(data.error || 'Failed to purchase emissions');
        }
      } catch (error: any) {
        console.error('[Purchase Emissions] Error:', error);
        toast.error(error.message || 'Failed to purchase emissions');
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 500));

      const product = SHARED_PRODUCTS.find(p => p.id === productId);
      if (!product) {
        toast.error('Product not found');
        setProcessing(false);
        return;
      }

      const emissionsToAdd = product.metadata.pack_size || 1;
      const updated: EmulatedSubscription = {
        ...subscription,
        emissionsAvailable: subscription.emissionsAvailable + emissionsToAdd,
      };

      saveEmulatedSubscription(updated);
      setSubscription(updated);
      onSubscriptionChange?.(updated);
      toast.success(`Purchased ${emissionsToAdd} emission(s)!`);
    }

    setPendingEmissionProductId(null);
    setProcessing(false);
  };

  const initiateTopUpCredits = (amount: number) => {
    setPendingTopUpAmount(amount);
    setShowTopUpDialog(true);
  };

  const handleTopUpCredits = async () => {
    if (!subscription || subscriptionModel !== 'payg' || !pendingTopUpAmount) return;
    setShowTopUpDialog(false);
    setProcessing(true);
    const amount = pendingTopUpAmount;

    if (useRealStripe) {
      try {
        const token = getAuthToken();
        // Call frontend API route directly (endpoint is in frontend, not backend)
        const url = '/api/stripe/topup-credits';

        console.log('[TopUp Credits] Calling API with:', { amount });
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount }),
        });

        const data = await response.json();
        console.log('[TopUp Credits] API response:', data);

        if (data.success && data.url) {
          // Redirect to Stripe Checkout
          console.log('[TopUp Credits] Redirecting to:', data.url);
          window.location.href = data.url;
          return;
        } else {
          toast.error(data.message || data.error || 'Failed to create checkout session');
        }
      } catch (error: any) {
        console.error('[TopUp Credits] Error:', error);
        toast.error(error.message || 'Failed to top up credits');
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 500));

      const updated: EmulatedSubscription = {
        ...subscription,
        creditBalance: (subscription.creditBalance || 0) + amount,
      };

      saveEmulatedSubscription(updated);
      setSubscription(updated);
      onSubscriptionChange?.(updated);
      toast.success(`Added ${formatAmount(amount)} to wallet!`);
    }

    setPendingTopUpAmount(null);
    setProcessing(false);
  };

  const handleCancelSubscription = async () => {
    setShowCancelDialog(false);
    setProcessing(true);

    if (useRealStripe && stripeSubscription) {
      try {
        // Get user email to validate 12-month minimum commitment
        const authState = getAuthState();
        const userEmail = authState.user?.email || authState.supabase?.email;

        const response = await fetch('/api/stripe/subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionId: stripeSubscription.id,
            immediately: false,
            userEmail: userEmail,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Subscription will be cancelled at end of billing period');
          await loadSubscription();
        } else if (data.error === 'MINIMUM_COMMITMENT') {
          // 12-month minimum commitment not met
          toast.error(data.message || `You cannot cancel yet. ${data.remainingMonths} month(s) remaining in your 12-month commitment.`);
        } else {
          toast.error(data.error || data.message || 'Failed to cancel subscription');
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to cancel subscription');
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 500));

      clearEmulatedSubscription();
      setSubscription(null);
      setSelectedPlanId(null);
      onSubscriptionChange?.(null);
      toast.success('Subscription cancelled');
    }

    setProcessing(false);
  };

  const handleManageBilling = async () => {
    if (!useRealStripe || !customerId) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(data.error || 'Failed to open billing portal');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to open billing portal');
    }
    setProcessing(false);
  };

  const handleReactivateSubscription = async () => {
    if (!useRealStripe || !stripeSubscription) return;

    setShowReactivateDialog(false);
    setProcessing(true);

    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: stripeSubscription.id,
          action: 'reactivate',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subscription reactivated successfully!');
        setCancelAtPeriodEnd(false);
        await loadSubscription();
      } else {
        toast.error(data.error || 'Failed to reactivate subscription');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reactivate subscription');
    }

    setProcessing(false);
  };

  const handlePauseSubscription = async () => {
    if (!useRealStripe || !stripeSubscription) return;

    setShowPauseDialog(false);
    setProcessing(true);

    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: stripeSubscription.id,
          action: 'pause',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subscription paused. Payment collection has stopped.');
        setIsPaused(true);
        await loadSubscription();
      } else {
        toast.error(data.error || 'Failed to pause subscription');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to pause subscription');
    }

    setProcessing(false);
  };

  const handleResumeSubscription = async () => {
    if (!useRealStripe || !stripeSubscription) return;

    setProcessing(true);

    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: stripeSubscription.id,
          action: 'resume',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subscription resumed successfully!');
        setIsPaused(false);
        await loadSubscription();
      } else {
        toast.error(data.error || 'Failed to resume subscription');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resume subscription');
    }

    setProcessing(false);
  };

  // Extra Investors purchase handlers
  const initiateExtraInvestorsPurchase = (count: number) => {
    setPendingExtraInvestors(count);
    setShowExtraInvestorsDialog(true);
  };

  const handlePurchaseExtraInvestors = async () => {
    if (!pendingExtraInvestors) return;
    setShowExtraInvestorsDialog(false);
    setProcessing(true);

    try {
      const authState = getAuthState();
      const userEmail = authState.user?.email || authState.supabase?.email;

      // Call frontend API route directly
      const response = await fetch('/api/stripe/purchase-extra-investors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extraInvestors: pendingExtraInvestors,
          userEmail
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        console.log('[Purchase Extra Investors] Redirecting to:', data.url);
        window.location.href = data.url;
        return;
      } else {
        toast.error(data.message || data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to purchase extra investors');
    }

    setPendingExtraInvestors(null);
    setProcessing(false);
  };

  // Extra AUM purchase handlers
  const initiateExtraAumPurchase = (millions: number) => {
    setPendingExtraAum(millions);
    setShowExtraAumDialog(true);
  };

  const handlePurchaseExtraAum = async () => {
    if (!pendingExtraAum) return;
    setShowExtraAumDialog(false);
    setProcessing(true);

    try {
      const authState = getAuthState();
      const userEmail = authState.user?.email || authState.supabase?.email;
      const amountInDollars = pendingExtraAum * 1000000; // Convert millions to dollars

      // Call frontend API route directly
      const response = await fetch('/api/stripe/purchase-extra-aum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extraCommitment: amountInDollars,
          userEmail
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        console.log('[Purchase Extra AUM] Redirecting to:', data.url);
        window.location.href = data.url;
        return;
      } else {
        toast.error(data.message || data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to purchase extra AUM');
    }

    setPendingExtraAum(null);
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Active subscription view - show for active, trialing, or past_due statuses
  // Show subscription view for any non-canceled status
  const isActiveSubscription = subscription && subscription.status !== 'canceled';

  console.log('[SubscriptionView] Render state:', {
    hasSubscription: !!subscription,
    status: subscription?.status,
    isActiveSubscription,
    planName: subscription?.currentPlan?.name
  });

  if (isActiveSubscription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Your Subscription</h2>
                {isPaused ? (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    <PauseCircle className="h-3 w-3 mr-1" />
                    Paused
                  </Badge>
                ) : cancelAtPeriodEnd ? (
                  <Badge variant="destructive">
                    Cancelling
                  </Badge>
                ) : (
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status === 'active' ? 'Active' :
                     subscription.status === 'trialing' ? 'Trial' :
                     subscription.status === 'past_due' ? 'Past Due' :
                     subscription.status}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{subscription.currentPlan?.name || 'Subscription Plan'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {useRealStripe && customerId && (
              <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={processing}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Manage Billing
              </Button>
            )}
            {isPaused ? (
              <Button variant="default" size="sm" onClick={handleResumeSubscription} disabled={processing}>
                <PlayCircle className="h-4 w-4 mr-1" />
                Resume
              </Button>
            ) : cancelAtPeriodEnd ? (
              <Button variant="default" size="sm" onClick={() => setShowReactivateDialog(true)} disabled={processing}>
                Reactivate
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowPauseDialog(true)} disabled={processing}>
                  <PauseCircle className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(true)} disabled={processing}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Paused Warning */}
        {isPaused && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <PauseCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Your subscription is paused. Payment collection has stopped. Click "Resume" to reactivate billing.
            </AlertDescription>
          </Alert>
        )}

        {/* Cancellation Warning */}
        {cancelAtPeriodEnd && !isPaused && subscription.currentPeriodEnd && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your subscription is set to cancel on {subscription.currentPeriodEnd.toLocaleDateString()}.
              Click "Reactivate" to continue your subscription.
            </AlertDescription>
          </Alert>
        )}

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Monthly Fee</div>
              <div className="text-xl font-bold">{formatAmount(subscription.currentPlan?.amount || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Emissions</div>
              <div className="text-xl font-bold">{subscription.emissionsAvailable} available</div>
            </CardContent>
          </Card>
          {subscriptionModel === 'payg' && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Credit Wallet</div>
                <div className="text-xl font-bold">{formatAmount(subscription.creditBalance || 0)}</div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Emissions Used</div>
              <div className="text-xl font-bold">{subscription.emissionsUsed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Investor Capacity for PAYG */}
        {subscriptionModel === 'payg' && subscriptionUsage && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Investor Capacity
              </CardTitle>
              <CardDescription>Current investor usage and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Investors Added</span>
                  <span className="font-medium">{subscriptionUsage.investors.current} / {subscriptionUsage.investors.limit}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${subscriptionUsage.investors.limit > 0 ? Math.min(100, (subscriptionUsage.investors.current / subscriptionUsage.investors.limit) * 100) : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{subscriptionUsage.investors.remaining} slots remaining</span>
                  <span>{subscriptionUsage.investors.limit > 0 ? Math.round((subscriptionUsage.investors.current / subscriptionUsage.investors.limit) * 100) : 0}% used</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extra AUM and Extra Investors (tier_based only) - only show when subscription exists */}
        {subscriptionModel === 'tier_based' && stripeSubscription && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Subscription Limits & Extras
              </CardTitle>
              <CardDescription>Purchase additional capacity for your account</CardDescription>
            </CardHeader>
            <CardContent>
              {usageLoadError ? (
                <div className="text-center py-4">
                  <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive mb-2">{usageLoadError}</p>
                  <Button variant="outline" size="sm" onClick={loadSubscription}>Retry</Button>
                </div>
              ) : !subscriptionUsage ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Loading limits...</span>
                </div>
              ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Current Limits & Extra Investors */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Investor Capacity</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {subscriptionUsage.investors.current} / {subscriptionUsage.investors.limit} used
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${subscriptionUsage.investors.limit > 0 ? Math.min(100, (subscriptionUsage.investors.current / subscriptionUsage.investors.limit) * 100) : 0}%` }}
                />
              </div>
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={extraInvestorsInput}
                    onChange={(e) => setExtraInvestorsInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-9 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => initiateExtraInvestorsPurchase(extraInvestorsInput)}
                    disabled={processing}
                  >
                    <span className="font-semibold">+{extraInvestorsInput} Investor{extraInvestorsInput > 1 ? 's' : ''}</span>
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  ${(4 * extraInvestorsInput).toFixed(0)} total
                </div>
              </div>
            </div>

            {/* AUM Capacity */}
            {subscriptionUsage.commitment && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">AUM Capacity</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  ${(subscriptionUsage.commitment.current / 1000000).toFixed(1)}M / ${(subscriptionUsage.commitment.limit / 1000000).toFixed(0)}M
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (subscriptionUsage.commitment.current / subscriptionUsage.commitment.limit) * 100)}%` }}
                  />
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={extraAumInput}
                      onChange={(e) => setExtraAumInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 h-9 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9"
                      onClick={() => initiateExtraAumPurchase(extraAumInput)}
                      disabled={processing}
                    >
                      <span className="font-semibold">+${extraAumInput}M AUM</span>
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    ${(110 * extraAumInput).toFixed(0)} total
                  </div>
                </div>
              </div>
            )}
          </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Remove old duplicate cards below */}
        {false && subscriptionModel === 'tier_based' && subscriptionUsage && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Old duplicate - disabled */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Investor Capacity
                </CardTitle>
                <CardDescription>
                  {subscriptionUsage.investors.current} / {subscriptionUsage.investors.limit} investors used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Usage</span>
                    <span>{subscriptionUsage.investors.limit > 0 ? Math.round((subscriptionUsage.investors.current / subscriptionUsage.investors.limit) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${subscriptionUsage.investors.limit > 0 ? Math.min(100, (subscriptionUsage.investors.current / subscriptionUsage.investors.limit) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {subscriptionUsage.investors.remaining} slots remaining
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <div className="text-sm font-medium">Purchase Extra Investors</div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex flex-col h-auto py-2 w-full"
                      onClick={() => initiateExtraInvestorsPurchase(1)}
                      disabled={processing}
                    >
                      <span className="font-semibold">+1 Investor</span>
                      <span className="text-xs text-muted-foreground">Add extra capacity</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Limits & Extra AUM */}
            {subscriptionUsage.commitment && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    AUM Capacity
                  </CardTitle>
                  <CardDescription>
                    ${(subscriptionUsage.commitment.current / 1000000).toFixed(1)}M / ${(subscriptionUsage.commitment.limit / 1000000).toFixed(0)}M used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Usage</span>
                      <span>{Math.round((subscriptionUsage.commitment.current / subscriptionUsage.commitment.limit) * 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (subscriptionUsage.commitment.current / subscriptionUsage.commitment.limit) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ${((subscriptionUsage.commitment.limit - subscriptionUsage.commitment.current) / 1000000).toFixed(1)}M remaining
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Purchase Extra AUM</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 5, 10].map((millions) => (
                        <Button
                          key={millions}
                          variant="outline"
                          size="sm"
                          className="flex flex-col h-auto py-2"
                          onClick={() => initiateExtraAumPurchase(millions)}
                          disabled={processing}
                        >
                          <span className="font-semibold">+${millions}M</span>
                          <span className="text-xs text-muted-foreground">${millions * 100}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Purchase More Emissions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Purchase Additional Emissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {emissionProducts.map((product) => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="flex flex-col h-auto py-3"
                  onClick={() => initiateEmissionPurchase(product.id)}
                  disabled={processing}
                >
                  <span className="font-semibold">{product.metadata.pack_size || 1} emission{(product.metadata.pack_size || 1) > 1 ? 's' : ''}</span>
                  <span className="text-sm text-muted-foreground">{formatAmount(product.amount)}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Up Credits (PAYG only) - only show when subscription exists */}
        {subscriptionModel === 'payg' && stripeSubscription && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Credits to Wallet</CardTitle>
              <CardDescription>For KYC and envelope costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {[5000, 10000, 25000, 50000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => initiateTopUpCredits(amount)}
                    disabled={processing}
                  >
                    +{formatAmount(amount)}
                  </Button>
                ))}
              </div>
              {subscription.creditBalance !== undefined && subscription.creditBalance <= CREDIT_WALLET_CONFIG.autoTopUpThreshold && (
                <Alert className="mt-3" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between w-full">
                    <span>Low credit balance ({formatAmount(subscription.creditBalance)} remaining) - add more credits to continue operations</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => initiateTopUpCredits(CREDIT_WALLET_CONFIG.autoTopUpAmount)}
                      disabled={processing}
                    >
                      Add {formatAmount(CREDIT_WALLET_CONFIG.autoTopUpAmount)}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cancel Subscription Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your subscription? Your access will continue until the end of the current billing period.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelSubscription}>
                Yes, Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Purchase Emissions Dialog */}
        <AlertDialog open={showEmissionPurchaseDialog} onOpenChange={setShowEmissionPurchaseDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Purchase Additional Emissions</AlertDialogTitle>
              <AlertDialogDescription>
                {(() => {
                  const product = emissionProducts.find(p => p.id === pendingEmissionProductId);
                  if (!product) return 'Confirm your purchase.';
                  const count = product.metadata.pack_size || 1;
                  return `You are about to purchase ${count} emission${count > 1 ? 's' : ''} for ${formatAmount(product.amount)}. This charge will be processed immediately.`;
                })()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingEmissionProductId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePurchaseEmissions}>
                Confirm Purchase
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Top Up Credits Dialog */}
        <AlertDialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add Credits to Wallet</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingTopUpAmount
                  ? `You are about to add ${formatAmount(pendingTopUpAmount)} to your credit wallet. This charge will be processed immediately.`
                  : 'Confirm your top-up.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingTopUpAmount(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleTopUpCredits}>
                Confirm Top-Up
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reactivate Subscription Dialog */}
        <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reactivate Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                Your subscription is scheduled to cancel. Would you like to reactivate it and continue with your current plan?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Cancelled</AlertDialogCancel>
              <AlertDialogAction onClick={handleReactivateSubscription}>
                Yes, Reactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Pause Subscription Dialog */}
        <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pause Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                Pausing your subscription will stop payment collection. Your subscription will remain active but you won't be charged until you resume. You can resume at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Active</AlertDialogCancel>
              <AlertDialogAction onClick={handlePauseSubscription}>
                Yes, Pause
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Extra Investors Purchase Dialog */}
        <AlertDialog open={showExtraInvestorsDialog} onOpenChange={setShowExtraInvestorsDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Purchase Extra Investor Slot{pendingExtraInvestors && pendingExtraInvestors > 1 ? 's' : ''}</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingExtraInvestors
                  ? `You are about to purchase ${pendingExtraInvestors} additional investor slot${pendingExtraInvestors > 1 ? 's' : ''} for $${pendingExtraInvestors * 4}. This will increase your maximum investor capacity.`
                  : 'Confirm your purchase.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingExtraInvestors(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePurchaseExtraInvestors}>
                Purchase for ${pendingExtraInvestors ? pendingExtraInvestors * 4 : 0}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Extra AUM Purchase Dialog */}
        <AlertDialog open={showExtraAumDialog} onOpenChange={setShowExtraAumDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Purchase Extra AUM Capacity</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingExtraAum
                  ? `You are about to purchase $${pendingExtraAum}M additional AUM capacity for $${pendingExtraAum * 110}. This will increase your maximum total commitment limit.`
                  : 'Confirm your purchase.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingExtraAum(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePurchaseExtraAum}>
                Purchase for ${pendingExtraAum ? pendingExtraAum * 110 : 0}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Subscription selection view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold">
              {subscriptionModel === 'tier_based' ? 'Subscription Plans' : 'Enterprise Plans'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Review all costs before subscribing
            </p>
          </div>
        </div>
        {useRealStripe && (
          <Badge variant="outline" className="text-xs">
            <CreditCard className="h-3 w-3 mr-1" />
            Stripe Checkout
          </Badge>
        )}
      </div>

      {/* SECTION 1: Monthly Plans */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            1. Select Monthly Plan
          </CardTitle>
          <CardDescription>Recurring monthly charge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const costs = subscriptionModel === 'payg' ? getPaygCostsForTier((plan as any).tier) : null;

              return (
                <div
                  key={plan.id}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  {(plan as any).badge && (
                    <Badge className="absolute -top-2 right-2 text-xs">{(plan as any).badge}</Badge>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">
                      {plan.name.replace('Monthly Fee - ', '').replace('Base Fee - ', '')}
                    </span>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatAmount(plan.amount)}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    {subscriptionModel === 'tier_based' ? (
                      <>
                        <div className="flex justify-between"><span>Max AUM:</span> <span className="font-medium text-foreground">{(plan as any).limits.maxAUM}</span></div>
                        <div className="flex justify-between"><span>Max Investors:</span> <span className="font-medium text-foreground">{(plan as any).limits.maxInvestors}</span></div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between"><span>Max Investors:</span> <span className="font-medium text-foreground">{(plan as any).limits.maxInvestors.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>KYC Cost:</span> <span className="font-medium text-foreground">{formatAmount(costs?.kyc?.amount || 0)}/investor</span></div>
                        <div className="flex justify-between"><span>Envelope Cost:</span> <span className="font-medium text-foreground">{formatAmount(costs?.envelope?.amount || 0)}/signing</span></div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {subscriptionModel === 'tier_based' && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
              <span className="font-medium">Overage charges if you exceed limits: </span>
              {TIER_BASED_ADDONS.map((addon, i) => (
                <span key={addon.id}>
                  {addon.name.replace('Add-on: ', '')}: {formatAmount(addon.amount)}/{addon.per_unit.toLowerCase()}
                  {i < TIER_BASED_ADDONS.length - 1 && ' • '}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: One-Time Setup Fee */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            2. One-Time Setup Fee
          </CardTitle>
          <CardDescription>Required to activate your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div>
              <div className="font-semibold text-amber-900">Setup Fee</div>
              <div className="text-sm text-amber-700">
                White-label configuration, smart contracts, payment integration, 5h training
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-900">{formatAmount(setupFee.amount)}</div>
              <div className="text-sm text-amber-700">Includes 5 emissions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: Emissions Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            3. Additional Emissions (Optional)
            <Badge variant="outline" className="ml-2 text-xs font-normal">One-time</Badge>
          </CardTitle>
          <CardDescription>Setup includes 5 emissions. Select a pack if you need more.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {emissionProducts.map((product) => {
              const isSelected = selectedEmissions === product.id;
              return (
                <div
                  key={product.id}
                  className={`p-3 border-2 rounded-lg text-center cursor-pointer transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedEmissions(isSelected ? null : product.id)}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="font-semibold">{product.metadata.pack_size || 1} emission{(product.metadata.pack_size || 1) > 1 ? 's' : ''}</span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="text-lg font-bold text-primary">{formatAmount(product.amount)}</div>
                  {(product.metadata.pack_size || 1) > 1 && (
                    <div className="text-xs text-muted-foreground">
                      {formatAmount(product.amount / (product.metadata.pack_size || 1))}/each
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {selectedEmissions && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setSelectedEmissions(null)}
            >
              Clear selection
            </Button>
          )}
        </CardContent>
      </Card>

      {/* SECTION 4: Credit Wallet (PAYG only) */}
      {subscriptionModel === 'payg' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              4. Credit Wallet (Pay-As-You-Go)
            </CardTitle>
            <CardDescription>Pre-paid credits for KYC and envelope costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-800">Initial deposit (required):</span>
                <span className="font-bold text-blue-900">{formatAmount(CREDIT_WALLET_CONFIG.minimumTopUp)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Auto top-up threshold:</span>
                <span className="text-blue-800">When balance ≤ {formatAmount(CREDIT_WALLET_CONFIG.autoTopUpThreshold)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Auto top-up amount:</span>
                <span className="text-blue-800">{formatAmount(CREDIT_WALLET_CONFIG.autoTopUpAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TOTAL & Subscribe */}
      <Card className="border-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedPlan ? (
            <>
              <div className="flex justify-between">
                <span>Monthly Plan ({selectedPlan.name.replace('Monthly Fee - ', '').replace('Base Fee - ', '')})</span>
                <span className="font-medium">{formatAmount(selectedPlan.amount)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span>Setup Fee (one-time, includes 5 emissions)</span>
                <span className="font-medium">{formatAmount(setupFee.amount)}</span>
              </div>
              {selectedEmissions && (() => {
                const emissionProduct = emissionProducts.find(p => p.id === selectedEmissions);
                return emissionProduct ? (
                  <div className="flex justify-between">
                    <span>Additional Emissions ({emissionProduct.metadata.pack_size || 1}) - one-time</span>
                    <span className="font-medium">{formatAmount(emissionProduct.amount)}</span>
                  </div>
                ) : null;
              })()}
              {subscriptionModel === 'payg' && (
                <div className="flex justify-between">
                  <span>Credit Wallet Deposit (one-time)</span>
                  <span className="font-medium">{formatAmount(CREDIT_WALLET_CONFIG.minimumTopUp)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Due Today</span>
                <span className="text-primary">
                  {formatAmount(
                    selectedPlan.amount +
                    setupFee.amount +
                    (selectedEmissions ? (emissionProducts.find(p => p.id === selectedEmissions)?.amount || 0) : 0) +
                    (subscriptionModel === 'payg' ? CREDIT_WALLET_CONFIG.minimumTopUp : 0)
                  )}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Then {formatAmount(selectedPlan.amount)}/month starting next billing cycle
              </div>
              <Button
                className="w-full mt-4"
                size="lg"
                onClick={() => handleSubscribe()}
                disabled={processing}
              >
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {useRealStripe ? 'Proceed to Checkout' : 'Subscribe Now'}
              </Button>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              Select a plan above to see the total
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extra AUM and Extra Investors (tier_based only) - only show when subscription exists */}
      {subscriptionModel === 'tier_based' && stripeSubscription && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Current Usage & Extras
            </CardTitle>
            <CardDescription>Purchase additional capacity for your account</CardDescription>
          </CardHeader>
          <CardContent>
            {usageLoadError ? (
              <div className="text-center py-8">
                <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive mb-2">{usageLoadError}</p>
                <Button variant="outline" size="sm" onClick={loadSubscription}>
                  Retry
                </Button>
              </div>
            ) : !subscriptionUsage ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Loading usage data...</span>
              </div>
            ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Investor Capacity */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Investor Capacity</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {subscriptionUsage.investors.current} / {subscriptionUsage.investors.limit} used
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${subscriptionUsage.investors.limit > 0 ? Math.min(100, (subscriptionUsage.investors.current / subscriptionUsage.investors.limit) * 100) : 0}%` }}
                  />
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={extraInvestorsInput}
                      onChange={(e) => setExtraInvestorsInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 h-9 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9"
                      onClick={() => initiateExtraInvestorsPurchase(extraInvestorsInput)}
                      disabled={processing}
                    >
                      <span className="font-semibold">+{extraInvestorsInput} Investor{extraInvestorsInput > 1 ? 's' : ''}</span>
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    ${(4 * extraInvestorsInput).toFixed(0)} total
                  </div>
                </div>
              </div>

              {/* AUM Capacity */}
              {subscriptionUsage.commitment && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">AUM Capacity</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${(subscriptionUsage.commitment.current / 1000000).toFixed(1)}M / ${(subscriptionUsage.commitment.limit / 1000000).toFixed(0)}M used
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (subscriptionUsage.commitment.current / subscriptionUsage.commitment.limit) * 100)}%` }}
                    />
                  </div>
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={extraAumInput}
                        onChange={(e) => setExtraAumInput(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 h-9 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9"
                        onClick={() => initiateExtraAumPurchase(extraAumInput)}
                        disabled={processing}
                      >
                        <span className="font-semibold">+${extraAumInput}M AUM</span>
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      ${(110 * extraAumInput).toFixed(0)} total
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Extra Investors Purchase Dialog */}
      <AlertDialog open={showExtraInvestorsDialog} onOpenChange={setShowExtraInvestorsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Purchase Extra Investor Slot{pendingExtraInvestors && pendingExtraInvestors > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingExtraInvestors
                ? `You are about to purchase ${pendingExtraInvestors} additional investor slot${pendingExtraInvestors > 1 ? 's' : ''} for $${pendingExtraInvestors * 4}. This will increase your maximum investor capacity.`
                : 'Confirm your purchase.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingExtraInvestors(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePurchaseExtraInvestors}>
              Purchase for ${pendingExtraInvestors ? pendingExtraInvestors * 4 : 0}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extra AUM Purchase Dialog */}
      <AlertDialog open={showExtraAumDialog} onOpenChange={setShowExtraAumDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Purchase Extra AUM Capacity</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingExtraAum
                ? `You are about to purchase $${pendingExtraAum}M additional AUM capacity for $${pendingExtraAum * 110}. This will increase your maximum total commitment limit.`
                : 'Confirm your purchase.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingExtraAum(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePurchaseExtraAum}>
              Purchase for ${pendingExtraAum ? pendingExtraAum * 110 : 0}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Currency Conflict Dialog */}
      <AlertDialog open={showCurrencyConflictDialog} onOpenChange={setShowCurrencyConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Currency Conflict Detected</AlertDialogTitle>
            <AlertDialogDescription>
              Your account has existing billing items in a different currency. This can happen if you previously had a subscription in another currency.
              <br /><br />
              Would you like to create a new billing profile to proceed with this subscription?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubscribe(true)}>
              Create New Profile & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
