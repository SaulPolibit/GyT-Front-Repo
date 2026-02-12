'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { CheckoutForm } from '@/components/subscription/checkout-form';

export function SubscriptionManager() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState('');
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
      // Don't set error for "no subscription" case
      if (!err.message?.includes('No subscription')) {
        setError(err.message || 'Failed to load subscription');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessing(true);
    setError(null);

    try {
      await StripeAPI.createCustomer();
      const result = await StripeAPI.createSubscription(additionalServiceQuantity);

      if (result.clientSecret) {
        setClientSecret(result.clientSecret);
      } else {
        setError('Failed to create subscription');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create subscription');
      toast.error(err.message || 'Failed to create subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async (immediately: boolean) => {
    if (!confirm(`Are you sure you want to cancel your firm's subscription ${immediately ? 'immediately' : 'at the end of the billing period'}?`)) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await StripeAPI.cancelSubscription(immediately);
      await loadSubscription();
      toast.success('Subscription canceled successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
      toast.error(err.message || 'Failed to cancel subscription');
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
      toast.success('Subscription reactivated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate subscription');
      toast.error(err.message || 'Failed to reactivate subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddAdditionalService = async () => {
    setProcessing(true);
    setError(null);

    try {
      await StripeAPI.addAdditionalService();
      await loadSubscription();
      toast.success('Additional service added successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to add additional service');
      toast.error(err.message || 'Failed to add additional service');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;

    if (newQuantity < 1) {
      toast.error('Quantity must be at least 1. Use the trash icon to remove the service.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await StripeAPI.updateServiceQuantity(itemId, newQuantity);
      await loadSubscription();
      toast.success(`Service quantity updated to ${newQuantity}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update service quantity');
      toast.error(err.message || 'Failed to update service quantity');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveService = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this service? You will receive a prorated credit.')) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await StripeAPI.removeService(itemId);
      await loadSubscription();
      toast.success('Service removed successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to remove service');
      toast.error(err.message || 'Failed to remove service');
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotal = () => {
    const basePrice = 999;
    const additionalServicePrice = 49;
    const total = basePrice + (additionalServicePrice * additionalServiceQuantity);
    return total;
  };

  const hasAdditionalService = () => {
    if (!subscription?.items?.data) return false;
    return subscription.items.data.some((item: any) =>
      item.price.product.name === 'Additional Service Base Cost'
    );
  };

  const handleSubscriptionSuccess = async () => {
    setClientSecret('');
    await loadSubscription();
    toast.success('Payment completed successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show payment form if we have a client secret
  if (clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
          <CardDescription>
            Enter payment details to activate your firm's subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={getStripe()} options={{ clientSecret }}>
            <CheckoutForm onSuccess={handleSubscriptionSuccess} />
          </Elements>

          <Button
            variant="ghost"
            onClick={() => setClientSecret('')}
            className="mt-4 w-full"
          >
            Cancel
          </Button>
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
              Your subscription will cancel at the end of the current billing period.
              {subscription.current_period_end && (
                <> Ends on {new Date(subscription.current_period_end * 1000).toLocaleDateString()}.</>
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
                  <CardTitle>Platform Subscription</CardTitle>
                  <CardDescription>Active services and billing information</CardDescription>
                </div>
              </div>
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Active Services */}
            <div>
              <h3 className="font-semibold mb-4">Active Services</h3>
              <div className="space-y-3">
                {subscription.items.data.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{item.price.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.price.product.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(item.price.unit_amount / 100).toFixed(2)}
                          {item.quantity > 1 && ` × ${item.quantity}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity > 1
                            ? `$${((item.price.unit_amount * item.quantity) / 100).toFixed(2)}/month total`
                            : '/month'}
                        </p>
                      </div>
                      {item.price.product.name === 'Additional Service Base Cost' && (
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

            {/* Add Additional Service - only show if none exist */}
            {!hasAdditionalService() && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-4">Available Add-ons</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg border-dashed">
                    <div className="flex items-center gap-3">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Additional Service Base Cost</p>
                        <p className="text-sm text-muted-foreground">
                          Add additional service features and capabilities ($49/month each)
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
                        Add One
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
                  Next billing date
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
                  Amount
                </p>
                <p className="font-medium">
                  ${subscription.items.data.reduce((total: number, item: any) =>
                    total + (item.price.unit_amount * item.quantity / 100), 0
                  ).toFixed(2)}/month
                </p>
              </div>
            </div>

            {/* Actions */}
            <Separator />
            <div className="flex gap-3">
              {isCanceling ? (
                <Button
                  onClick={handleReactivate}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Reactivate Subscription
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleCancelSubscription(false)}
                    disabled={processing}
                    className="flex-1"
                  >
                    Cancel at Period End
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelSubscription(true)}
                    disabled={processing}
                  >
                    Cancel Immediately
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
              <CardTitle>Select Your Services</CardTitle>
              <CardDescription>
                Start with the base service and optionally add additional features
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
                  Service Base Cost
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Required - Base service subscription with core platform features
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
                Core platform features
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Standard support
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Basic analytics and reporting
              </li>
            </ul>
          </div>

          {/* Additional Service */}
          <div className="p-6 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-lg font-semibold">
                      Additional Service Base Cost
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Optional - Additional service features and capabilities
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">$49.00</p>
                    <p className="text-sm text-muted-foreground">/month each</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <Label className="text-sm font-medium">Quantity:</Label>
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
                      <p className="text-sm text-muted-foreground">Subtotal</p>
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
                  Advanced analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Enhanced features
                </li>
              </ul>
            )}
          </div>

          {/* Total */}
          <Separator />
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total per month:</span>
            <span className="text-2xl">${calculateTotal().toFixed(2)}</span>
          </div>
          {additionalServiceQuantity > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Base: $999.00 + Additional Services: ${(49 * additionalServiceQuantity).toFixed(2)}
            </p>
          )}

          {/* Subscribe Button */}
          <Button
            onClick={handleSubscribe}
            disabled={processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Subscribe Now
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By subscribing, you agree to our terms of service. You can cancel anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
