'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  ExternalLink
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
  EmulatedSubscription
} from '@/lib/stripe-products';
import { getAuthState } from '@/lib/auth-storage';

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

  const subscriptionModel = getSubscriptionModel();
  const plans = subscriptionModel === 'tier_based' ? TIER_BASED_PLANS : PAYG_PLANS;
  const setupFee = SHARED_PRODUCTS[0];
  const emissionProducts = SHARED_PRODUCTS.filter(
    p => p.metadata.addon_type === 'emission' || p.metadata.addon_type === 'emission_pack'
  );

  useEffect(() => {
    console.log('[SubscriptionPricingView] Mode:', useRealStripe ? 'REAL STRIPE' : 'EMULATED');
    loadSubscription();
  }, [useRealStripe]);

  const loadSubscription = async () => {
    setLoading(true);

    if (useRealStripe) {
      // Load from Stripe API
      try {
        const authState = getAuthState();
        const email = authState?.email;

        if (email) {
          const response = await fetch(`/api/stripe/subscription?email=${encodeURIComponent(email)}`);
          const data = await response.json();

          if (data.success && data.subscription) {
            setStripeSubscription(data.subscription);
            setCustomerId(data.customerId);

            // Convert to EmulatedSubscription format for consistency
            const emulated: EmulatedSubscription = {
              id: data.subscription.id,
              status: data.subscription.status,
              model: subscriptionModel,
              currentPlan: plans.find(p => {
                const tierMap: Record<string, string> = {
                  starter: 'price_tier_starter',
                  professional: 'price_tier_professional',
                  enterprise: 'price_tier_enterprise',
                  growth: 'price_payg_growth',
                };
                return p.id === tierMap[data.subscription.planTier];
              }) || null,
              setupFeePaid: true,
              emissionsUsed: data.subscription.emissionsUsed || 0,
              emissionsAvailable: data.subscription.emissionsAvailable || 0,
              creditBalance: parseInt(data.subscription.creditBalance || '0'),
              currentPeriodStart: new Date(data.subscription.currentPeriodStart * 1000),
              currentPeriodEnd: new Date(data.subscription.currentPeriodEnd * 1000),
            };
            setSubscription(emulated);
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

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setProcessing(true);

    if (useRealStripe) {
      // Use real Stripe checkout
      try {
        const authState = getAuthState();
        const planTier = getPlanTier(selectedPlanId!);

        console.log('[Stripe Checkout] Starting checkout...', {
          planTier,
          emissionPackId: getEmissionPackId(selectedEmissions),
          userId: authState?.userId,
          userEmail: authState?.email,
        });

        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planTier,
            emissionPackId: getEmissionPackId(selectedEmissions),
            userId: authState?.userId || 'demo-user',
            userEmail: authState?.email || 'demo@example.com',
            firmId: authState?.firmId || '',
            firmName: authState?.firmName || '',
          }),
        });

        const data = await response.json();
        console.log('[Stripe Checkout] Response:', data);

        if (data.success && data.url) {
          // Redirect to Stripe Checkout
          console.log('[Stripe Checkout] Redirecting to:', data.url);
          window.location.href = data.url;
        } else {
          console.error('[Stripe Checkout] Error:', data.error);
          toast.error(data.error || 'Failed to create checkout session');
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

  const handlePurchaseEmissions = async (productId: string) => {
    if (!subscription) return;
    setProcessing(true);

    if (useRealStripe && stripeSubscription) {
      try {
        const response = await fetch('/api/stripe/purchase-emissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            subscriptionId: stripeSubscription.id,
            emissionPackId: getEmissionPackId(productId),
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success(`Purchased ${data.emissionsAdded} emission(s)!`);
          await loadSubscription();
        } else {
          toast.error(data.error || 'Failed to purchase emissions');
        }
      } catch (error: any) {
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

    setProcessing(false);
  };

  const handleTopUpCredits = async (amount: number) => {
    if (!subscription || subscriptionModel !== 'payg') return;
    setProcessing(true);

    if (useRealStripe && stripeSubscription) {
      try {
        const response = await fetch('/api/stripe/topup-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            subscriptionId: stripeSubscription.id,
            amount,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success(`Added ${formatAmount(amount)} to wallet!`);
          await loadSubscription();
        } else {
          toast.error(data.error || 'Failed to top up credits');
        }
      } catch (error: any) {
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

    setProcessing(false);
  };

  const handleCancelSubscription = async () => {
    setShowCancelDialog(false);
    setProcessing(true);

    if (useRealStripe && stripeSubscription) {
      try {
        const response = await fetch('/api/stripe/subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionId: stripeSubscription.id,
            immediately: false,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Subscription will be cancelled at end of billing period');
          await loadSubscription();
        } else {
          toast.error(data.error || 'Failed to cancel subscription');
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
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to open billing portal');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to open billing portal');
    }
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Active subscription view
  if (subscription?.status === 'active') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Active Subscription</h2>
              <p className="text-sm text-muted-foreground">{subscription.currentPlan?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {useRealStripe && customerId && (
              <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={processing}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Manage Billing
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(true)} disabled={processing}>
              Cancel
            </Button>
          </div>
        </div>

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
                  onClick={() => handlePurchaseEmissions(product.id)}
                  disabled={processing}
                >
                  <span className="font-semibold">{product.metadata.pack_size || 1} emission{(product.metadata.pack_size || 1) > 1 ? 's' : ''}</span>
                  <span className="text-sm text-muted-foreground">{formatAmount(product.amount)}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Up Credits (PAYG only) */}
        {subscriptionModel === 'payg' && (
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
                    onClick={() => handleTopUpCredits(amount)}
                    disabled={processing}
                  >
                    +{formatAmount(amount)}
                  </Button>
                ))}
              </div>
              {subscription.creditBalance !== undefined && subscription.creditBalance <= CREDIT_WALLET_CONFIG.autoTopUpThreshold && (
                <Alert className="mt-3" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Low balance - auto top-up will trigger</AlertDescription>
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
                onClick={handleSubscribe}
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
    </div>
  );
}
