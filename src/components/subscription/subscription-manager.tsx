'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  Loader2,
  CreditCard,
  AlertCircle,
  Calendar,
  DollarSign,
  Building2,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { StripeAPI } from '@/lib/stripe-api';
import { SetupForm } from '@/components/subscription/setup-form';
import { useTranslation } from '@/hooks/useTranslation';

export function SubscriptionManager() {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [additionalServiceQuantity, setAdditionalServiceQuantity] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await StripeAPI.getSubscription();
      setSubscription(result.subscription);
    } catch (err: any) {
      console.error('Failed to load subscription:', err);
      if (!err.message?.includes('No subscription')) {
        setError(err.message || t.settings.subscription.manager.failedToLoadSubscription);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setError(null);

    try {
      await StripeAPI.createCustomer();
      setShowPaymentForm(true);
    } catch (err: any) {
      console.error('[Subscription] Error creating customer:', err);
      setError(err.message || t.settings.subscription.manager.failedToCreateCustomer);
      toast.error(err.message || t.settings.subscription.manager.failedToCreateCustomer);
    }
  };

  const handlePaymentSuccess = async (cardToken: string) => {
    setProcessing(true);
    setError(null);

    try {
      const result = await StripeAPI.createSubscription(
        cardToken,
        additionalServiceQuantity
      );

      if (result.success && result.subscriptionId) {
        if (result.status === 'active') {
          toast.success(t.settings.subscription.manager.subscriptionCreatedPaymentSuccessful);
        } else if (result.status === 'incomplete') {
          toast.error(t.settings.subscription.manager.subscriptionCreatedPaymentFailed);
        } else {
          toast.success(t.settings.subscription.manager.subscriptionCreatedSuccessfully);
        }

        setShowPaymentForm(false);
        await loadSubscription();
      } else {
        setError(t.settings.subscription.manager.failedToCreateSubscription);
        toast.error(t.settings.subscription.manager.failedToCreateSubscription);
      }
    } catch (err: any) {
      console.error('[Subscription] Error creating subscription:', err);
      setError(err.message || t.settings.subscription.manager.failedToCreateSubscription);
      toast.error(err.message || t.settings.subscription.manager.failedToCreateSubscription);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async (immediately: boolean) => {
    const when = immediately ? t.settings.subscription.manager.immediately : t.settings.subscription.manager.atEndOfBillingPeriod;
    if (!confirm(t.settings.subscription.manager.confirmCancelSubscription.replace('{when}', when))) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await StripeAPI.cancelSubscription(immediately);
      await loadSubscription();
      toast.success(t.settings.subscription.manager.subscriptionCanceled);
    } catch (err: any) {
      setError(err.message || t.settings.subscription.manager.failedToCancelSubscription);
      toast.error(err.message || t.settings.subscription.manager.failedToCancelSubscription);
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async () => {
    setProcessing(true);
    setError(null);

    try {
      await StripeAPI.reactivateSubscription();
      await loadSubscription();
      toast.success(t.settings.subscription.manager.subscriptionReactivated);
    } catch (err: any) {
      setError(err.message || t.settings.subscription.manager.failedToReactivateSubscription);
      toast.error(err.message || t.settings.subscription.manager.failedToReactivateSubscription);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddAdditionalService = async () => {
    if (!confirm(t.settings.subscription.manager.confirmAddAdditionalService)) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await StripeAPI.addAdditionalService();
      await loadSubscription();
      toast.success(t.settings.subscription.manager.additionalServiceAdded);
    } catch (err: any) {
      setError(err.message || t.settings.subscription.manager.failedToAddAdditionalService);
      toast.error(err.message || t.settings.subscription.manager.failedToAddAdditionalService);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;

    if (newQuantity < 1) {
      toast.error(t.settings.subscription.manager.quantityMustBeAtLeast);
      return;
    }

    const confirmMessage = change > 0
      ? t.settings.subscription.manager.confirmIncreaseQuantity
      : t.settings.subscription.manager.confirmDecreaseQuantity;

    if (!confirm(confirmMessage.replace('{current}', currentQuantity.toString()).replace('{new}', newQuantity.toString()))) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await StripeAPI.updateServiceQuantity(itemId, newQuantity);
      await loadSubscription();
      toast.success(t.settings.subscription.manager.serviceQuantityUpdated.replace('{quantity}', newQuantity.toString()));
    } catch (err: any) {
      setError(err.message || t.settings.subscription.manager.failedToUpdateServiceQuantity);
      toast.error(err.message || t.settings.subscription.manager.failedToUpdateServiceQuantity);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveService = async (itemId: string) => {
    if (!confirm(t.settings.subscription.manager.confirmRemoveService)) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await StripeAPI.removeService(itemId);
      await loadSubscription();
      toast.success(t.settings.subscription.manager.serviceRemoved);
    } catch (err: any) {
      setError(err.message || t.settings.subscription.manager.failedToRemoveService);
      toast.error(err.message || t.settings.subscription.manager.failedToRemoveService);
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotal = () => {
    const basePrice = 999;
    const additionalServicePrice = 49;
    return basePrice + (additionalServicePrice * additionalServiceQuantity);
  };

  const hasAdditionalService = () => {
    if (!subscription?.items?.data) return false;
    return subscription.items.data.some((item: any) =>
      item.price?.product?.name?.includes('Additional')
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show payment form
  if (showPaymentForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.settings.subscription.manager.enterPaymentDetails}</CardTitle>
          <CardDescription>{t.settings.subscription.manager.enterCardDetails}</CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={getStripe()}>
            <SetupForm
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentForm(false)}
            />
          </Elements>
        </CardContent>
      </Card>
    );
  }

  // Show active subscription
  if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
    const isCanceling = subscription.cancel_at_period_end;

    return (
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isCanceling && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t.settings.subscription.manager.subscriptionWillCancelAtPeriodEnd}
              {subscription.current_period_end && (
                <> {t.settings.subscription.manager.endsOn.replace('{date}', new Date(subscription.current_period_end * 1000).toLocaleDateString())}</>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>{t.settings.subscription.manager.platformSubscription}</CardTitle>
                  <CardDescription>{t.settings.subscription.manager.activeServicesInfo}</CardDescription>
                </div>
              </div>
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Active Services */}
            <div>
              <h3 className="font-semibold mb-4">{t.settings.subscription.manager.activeServices}</h3>
              <div className="space-y-3">
                {subscription.items.data.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{item.price?.product?.name || 'Service'}</p>
                        <p className="text-sm text-muted-foreground">{item.price?.product?.description || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(item.price?.unit_amount / 100).toFixed(2)}
                          {item.quantity > 1 && ` x ${item.quantity}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity > 1
                            ? `$${((item.price?.unit_amount * item.quantity) / 100).toFixed(2)}/month total`
                            : '/month'}
                        </p>
                      </div>
                      {item.price?.product?.name?.includes('Additional') && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                            disabled={processing || item.quantity <= 1}
                            className="h-8 w-8"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="min-w-[2rem] text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                            disabled={processing}
                            className="h-8 w-8"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveService(item.id)}
                            disabled={processing}
                            className="h-8 w-8 ml-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Additional Service */}
            {!hasAdditionalService() && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-4">{t.settings.subscription.manager.availableAddons}</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg border-dashed">
                    <div className="flex items-center gap-3">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t.settings.subscription.manager.additionalService}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.settings.subscription.manager.addAdditionalService}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">$49.00</p>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddAdditionalService}
                        disabled={processing}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t.settings.subscription.manager.addOne}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Billing Info */}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t.settings.subscription.manager.nextBillingDate}
                </p>
                <p className="font-medium">
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t.settings.subscription.manager.amount}
                </p>
                <p className="font-medium">
                  ${subscription.items.data.reduce((total: number, item: any) =>
                    total + ((item.price?.unit_amount || 0) * item.quantity / 100), 0
                  ).toFixed(2)}/month
                </p>
              </div>
            </div>

            {/* Actions */}
            <Separator />
            <div className="flex gap-3">
              {isCanceling ? (
                <Button onClick={handleReactivate} disabled={processing} className="flex-1">
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.settings.subscription.manager.reactivateSubscription}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleCancelSubscription(false)}
                    disabled={processing}
                    className="flex-1"
                  >
                    {t.settings.subscription.manager.cancelAtPeriodEnd}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelSubscription(true)}
                    disabled={processing}
                  >
                    {t.settings.subscription.manager.cancelImmediately}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show subscription creation form
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>{t.settings.subscription.manager.selectYourServices}</CardTitle>
              <CardDescription>
                {t.settings.subscription.manager.startWithBaseService}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Service */}
          <div className="p-6 border rounded-lg bg-primary/5 border-primary">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t.settings.subscription.manager.serviceBaseCost}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.settings.subscription.manager.required}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">$999.00</p>
                <p className="text-sm text-muted-foreground">/month</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {t.settings.subscription.manager.corePlatformFeatures}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {t.settings.subscription.manager.standardSupport}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {t.settings.subscription.manager.basicAnalytics}
              </li>
            </ul>
          </div>

          {/* Additional Service */}
          <div className="p-6 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-lg font-semibold">{t.settings.subscription.manager.additionalService}</Label>
                    <p className="text-sm text-muted-foreground mt-1">{t.settings.subscription.manager.optionalAdditionalFeatures}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">$49.00</p>
                    <p className="text-sm text-muted-foreground">{t.settings.subscription.manager.monthEach}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <Label className="text-sm font-medium">{t.settings.subscription.manager.quantity}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAdditionalServiceQuantity(Math.max(0, additionalServiceQuantity - 1))}
                      disabled={additionalServiceQuantity === 0}
                      className="h-9 w-9"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[3rem] text-center">
                      <span className="text-2xl font-bold">{additionalServiceQuantity}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAdditionalServiceQuantity(additionalServiceQuantity + 1)}
                      className="h-9 w-9"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {additionalServiceQuantity > 0 && (
                    <div className="ml-auto text-right">
                      <p className="text-sm text-muted-foreground">{t.settings.subscription.manager.subtotal}</p>
                      <p className="text-lg font-semibold">${(49 * additionalServiceQuantity).toFixed(2)}/month</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {additionalServiceQuantity > 0 && (
              <ul className="space-y-2 text-sm mt-4 pt-4 border-t">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {t.settings.subscription.manager.advancedAnalytics}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {t.settings.subscription.manager.prioritySupport}
                </li>
              </ul>
            )}
          </div>

          {/* Total */}
          <Separator />
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>{t.settings.subscription.manager.totalPerMonth}</span>
            <span className="text-2xl">${calculateTotal().toFixed(2)}</span>
          </div>
          {additionalServiceQuantity > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {t.settings.subscription.manager.basePlusAdditional.replace('${amount}', (49 * additionalServiceQuantity).toFixed(2))}
            </p>
          )}

          {/* Subscribe Button */}
          <Button onClick={handleSubscribe} disabled={processing} className="w-full" size="lg">
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.settings.subscription.manager.processing}
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {t.settings.subscription.manager.subscribeNow_btn}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {t.settings.subscription.manager.agreeToTerms}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
