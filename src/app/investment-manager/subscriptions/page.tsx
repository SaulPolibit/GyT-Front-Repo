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
  XCircle,
  Loader2,
  CreditCard,
  AlertCircle,
  Calendar,
  DollarSign,
  Building2,
  Plus,
  Trash2,
} from 'lucide-react';
import { API_CONFIG, getApiUrl } from '@/lib/api-config';
import { toast } from 'sonner';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { StripeAPI } from '@/lib/stripe-api';
import { CheckoutForm } from '@/components/subscription/checkout-form';

export default function FirmSubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [includeAdditionalService, setIncludeAdditionalService] = useState(false);
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
      const result = await StripeAPI.createSubscription(includeAdditionalService);

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
    let total = 999;
    if (includeAdditionalService) {
      total += 49;
    }
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
      <div className="container mx-auto py-8 max-w-2xl">
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
      </div>
    );
  }

  // Show active subscription
  if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
    const isCanceling = subscription.cancel_at_period_end;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Firm Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your firm's platform subscription and billing
          </p>
        </div>

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
                        </p>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>
                      {item.price.product.name === 'Additional Service Base Cost' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveService(item.id)}
                          disabled={processing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                  <h3 className="font-semibold mb-4">Available Add-ons</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg border-dashed">
                    <div className="flex items-center gap-3">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Additional Service Base Cost</p>
                        <p className="text-sm text-muted-foreground">
                          Additional service features and capabilities
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">$10.00</p>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddAdditionalService}
                        disabled={processing}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
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
                    total + (item.price.unit_amount / 100), 0
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
      <div>
        <h1 className="text-3xl font-bold">Firm Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Subscribe to activate your firm's access to the platform
        </p>
      </div>

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
              <div className="flex items-center gap-4 flex-1">
                <Switch
                  id="additional-service"
                  checked={includeAdditionalService}
                  onCheckedChange={setIncludeAdditionalService}
                />
                <div>
                  <Label htmlFor="additional-service" className="text-lg font-semibold cursor-pointer">
                    Additional Service Base Cost
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Optional - Additional service features and capabilities
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$49.00</p>
                <p className="text-sm text-muted-foreground">/month</p>
              </div>
            </div>
            {includeAdditionalService && (
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
            <span className="text-2xl">${calculateTotal()}.00</span>
          </div>

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
