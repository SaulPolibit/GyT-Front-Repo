'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken } from '@/lib/auth-storage'
import { useStripeConnectStatus } from '@/hooks/use-swr-hooks'
import { toast } from 'sonner'
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  CreditCard,
  Building2
} from 'lucide-react'

export function StripeConnectManager() {
  const {
    hasAccount,
    isComplete,
    accountStatus,
    chargesEnabled,
    payoutsEnabled,
    requirements,
    isLoading,
    mutate: refreshStatus
  } = useStripeConnectStatus()

  const [actionLoading, setActionLoading] = useState(false)

  const handleCreateAccount = async () => {
    const token = getAuthToken()
    if (!token) return

    try {
      setActionLoading(true)
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.stripeConnectCreateAccount), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Payment account created!')
        await refreshStatus()
      } else {
        toast.error(data.message || 'Failed to create payment account')
      }
    } catch (error) {
      console.error('Error creating Connect account:', error)
      toast.error('Failed to create payment account')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartOnboarding = async () => {
    const token = getAuthToken()
    if (!token) return

    try {
      setActionLoading(true)
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.stripeConnectOnboardingLink), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/lp-portal/settings?tab=payment&onboarding=complete`,
          refreshUrl: `${window.location.origin}/lp-portal/settings?tab=payment&onboarding=refresh`,
        }),
      })

      const data = await response.json()

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.message || 'Failed to start onboarding')
      }
    } catch (error) {
      console.error('Error starting onboarding:', error)
      toast.error('Failed to start onboarding')
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenDashboard = async () => {
    const token = getAuthToken()
    if (!token) return

    try {
      setActionLoading(true)
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.stripeConnectDashboardLink), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success && data.url) {
        window.open(data.url, '_blank')
      } else {
        toast.error(data.message || 'Failed to open dashboard')
      }
    } catch (error) {
      console.error('Error opening dashboard:', error)
      toast.error('Failed to open dashboard')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!hasAccount) {
      return <Badge variant="secondary">Not Set Up</Badge>
    }

    switch (accountStatus) {
      case 'enabled':
        return (
          <Badge className="bg-muted text-foreground hover:bg-muted">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Active
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-muted text-foreground hover:bg-muted">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case 'disabled':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Disabled
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Payment Account
            </CardTitle>
            <CardDescription className="mt-1">
              Set up your payment account to receive distributions and payouts
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refreshStatus()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasAccount ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Why set up a payment account?
              </h4>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Receive distributions directly to your bank account</li>
                <li>Track all your payouts in one place</li>
                <li>Secure, fast transfers powered by Stripe</li>
              </ul>
            </div>
            <Button onClick={handleCreateAccount} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Set Up Payment Account'
              )}
            </Button>
          </div>
        ) : accountStatus === 'pending' || !isComplete ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted p-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Complete Your Account Setup
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Your payment account has been created but requires additional information.
                Please complete the onboarding process to receive payouts.
              </p>
              {requirements?.currently_due && requirements.currently_due.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-foreground">Items needed:</p>
                  <ul className="text-xs text-muted-foreground ml-4 list-disc">
                    {requirements.currently_due.slice(0, 3).map((item: string, index: number) => (
                      <li key={index}>{item.replace(/_/g, ' ')}</li>
                    ))}
                    {requirements.currently_due.length > 3 && (
                      <li>And {requirements.currently_due.length - 3} more...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <Button onClick={handleStartOnboarding} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          </div>
        ) : accountStatus === 'enabled' ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted p-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Account Active
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Your payment account is set up and ready to receive distributions.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Payouts:</span>{' '}
                  <span className="font-medium text-foreground">
                    {payoutsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Charges:</span>{' '}
                  <span className="font-medium text-foreground">
                    {chargesEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={handleOpenDashboard} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Payment Dashboard
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted p-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Account Issue
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {requirements?.disabled_reason
                  ? `Your account has been disabled: ${requirements.disabled_reason.replace(/_/g, ' ')}`
                  : 'There is an issue with your payment account. Please contact support.'}
              </p>
            </div>
            <Button variant="outline" onClick={handleStartOnboarding} disabled={actionLoading}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Update Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
