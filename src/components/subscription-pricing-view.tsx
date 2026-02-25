'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  Wallet,
  Zap,
  Package,
  Users,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
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

interface SubscriptionPricingViewProps {
  onSubscriptionChange?: (subscription: EmulatedSubscription | null) => void;
}

export function SubscriptionPricingView({ onSubscriptionChange }: SubscriptionPricingViewProps) {
  const [subscription, setSubscription] = useState<EmulatedSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedEmissions, setSelectedEmissions] = useState<string | null>(null);

  const subscriptionModel = getSubscriptionModel();
  const plans = subscriptionModel === 'tier_based' ? TIER_BASED_PLANS : PAYG_PLANS;
  const setupFee = SHARED_PRODUCTS[0]; // Setup fee product
  const emissionProducts = SHARED_PRODUCTS.filter(
    p => p.metadata.addon_type === 'emission' || p.metadata.addon_type === 'emission_pack'
  );

  useEffect(() => {
    setLoading(true);
    const sub = getEmulatedSubscription();
    setSubscription(sub);
    if (sub?.currentPlan) {
      setSelectedPlanId(sub.currentPlan.id);
    }
    setLoading(false);
  }, []);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Calculate total emissions: 5 from setup + any selected pack
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
      currentPeriodEnd: periodEnd
    };

    saveEmulatedSubscription(newSubscription);
    setSubscription(newSubscription);
    onSubscriptionChange?.(newSubscription);
    toast.success('Subscription activated!');
    setProcessing(false);
  };

  const handlePurchaseEmissions = async (productId: string) => {
    if (!subscription) return;
    setProcessing(true);
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
      emissionsAvailable: subscription.emissionsAvailable + emissionsToAdd
    };

    saveEmulatedSubscription(updated);
    setSubscription(updated);
    onSubscriptionChange?.(updated);
    toast.success(`Purchased ${emissionsToAdd} emission(s)!`);
    setProcessing(false);
  };

  const handleTopUpCredits = async (amount: number) => {
    if (!subscription || subscriptionModel !== 'payg') return;
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const updated: EmulatedSubscription = {
      ...subscription,
      creditBalance: (subscription.creditBalance || 0) + amount
    };

    saveEmulatedSubscription(updated);
    setSubscription(updated);
    onSubscriptionChange?.(updated);
    toast.success(`Added ${formatAmount(amount)} to wallet!`);
    setProcessing(false);
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Cancel your subscription?')) return;
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    clearEmulatedSubscription();
    setSubscription(null);
    setSelectedPlanId(null);
    onSubscriptionChange?.(null);
    toast.success('Subscription cancelled');
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
          <Button variant="outline" size="sm" onClick={handleCancelSubscription} disabled={processing}>
            Cancel
          </Button>
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
              <CardDescription>For KYC ({formatAmount(getPaygCostsForTier((subscription.currentPlan as any)?.tier || 'starter').kyc?.amount || 0)}/investor) and envelope ({formatAmount(getPaygCostsForTier((subscription.currentPlan as any)?.tier || 'starter').envelope?.amount || 0)}/signing) costs</CardDescription>
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
                  <AlertDescription>Low balance - auto top-up of {formatAmount(CREDIT_WALLET_CONFIG.autoTopUpAmount)} will trigger</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Subscription selection view - show ALL costs upfront
  return (
    <div className="space-y-6">
      {/* Header */}
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

          {/* Overage info for tier-based */}
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
                Subscribe Now
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
