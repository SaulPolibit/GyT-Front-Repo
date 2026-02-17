"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Wallet,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { toast } from "sonner"

interface StripeConnectStatus {
  hasAccount: boolean
  accountId?: string
  detailsSubmitted?: boolean
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  isComplete?: boolean
  accountStatus?: 'not_created' | 'pending' | 'enabled' | 'disabled' | 'rejected'
  requirements?: {
    currently_due?: string[]
    eventually_due?: string[]
    past_due?: string[]
    disabled_reason?: string | null
  }
}

interface StripeConnectManagerProps {
  className?: string
}

export function StripeConnectManager({ className }: StripeConnectManagerProps) {
  const [loading, setLoading] = React.useState(true)
  const [status, setStatus] = React.useState<StripeConnectStatus | null>(null)
  const [isCreatingAccount, setIsCreatingAccount] = React.useState(false)
  const [isGettingOnboardingLink, setIsGettingOnboardingLink] = React.useState(false)
  const [isGettingDashboardLink, setIsGettingDashboardLink] = React.useState(false)

  // Check for onboarding return/refresh query params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const onboarding = urlParams.get('onboarding')

    if (onboarding === 'complete') {
      toast.success('Onboarding completed! Checking your account status...')
      // Remove query param
      window.history.replaceState({}, '', window.location.pathname)
    } else if (onboarding === 'refresh') {
      toast.info('Onboarding link expired. Please try again.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const loadStatus = React.useCallback(async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.stripeConnectAccountStatus),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus(data)
      } else {
        throw new Error(data.message || 'Failed to get account status')
      }
    } catch (error) {
      console.error('Error loading Stripe Connect status:', error)
      setStatus({
        hasAccount: false,
        accountStatus: 'not_created'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.stripeConnectCreateAccount),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Account created successfully!')
        await loadStatus()
        // Automatically start onboarding
        handleGetOnboardingLink()
      } else {
        throw new Error(data.message || 'Failed to create account')
      }
    } catch (error: any) {
      console.error('Error creating Stripe Connect account:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleGetOnboardingLink = async () => {
    setIsGettingOnboardingLink(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.stripeConnectOnboardingLink),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            returnUrl: `${window.location.origin}${window.location.pathname}?tab=payments&onboarding=complete`,
            refreshUrl: `${window.location.origin}${window.location.pathname}?tab=payments&onboarding=refresh`,
          }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        // Redirect to Stripe onboarding
        window.location.href = data.url
      } else {
        throw new Error(data.message || 'Failed to get onboarding link')
      }
    } catch (error: any) {
      console.error('Error getting onboarding link:', error)
      toast.error(error.message || 'Failed to start onboarding')
    } finally {
      setIsGettingOnboardingLink(false)
    }
  }

  const handleGetDashboardLink = async () => {
    setIsGettingDashboardLink(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.stripeConnectDashboardLink),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        // Open Stripe dashboard in new tab
        window.open(data.url, '_blank')
      } else {
        throw new Error(data.message || 'Failed to get dashboard link')
      }
    } catch (error: any) {
      console.error('Error getting dashboard link:', error)
      toast.error(error.message || 'Failed to open dashboard')
    } finally {
      setIsGettingDashboardLink(false)
    }
  }

  const getStatusBadge = () => {
    if (!status?.hasAccount) {
      return <Badge variant="secondary">Not Setup</Badge>
    }

    switch (status.accountStatus) {
      case 'enabled':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'disabled':
        return <Badge variant="destructive">Disabled</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusIcon = () => {
    if (!status?.hasAccount) {
      return <Wallet className="h-5 w-5 text-muted-foreground" />
    }

    switch (status.accountStatus) {
      case 'enabled':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'disabled':
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Payment Account
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Payment Account
            </CardTitle>
            <CardDescription>
              Set up your payment account to receive distributions and returns
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">Account Status</p>
              <p className="text-sm text-muted-foreground">
                {!status?.hasAccount
                  ? 'No payment account set up yet'
                  : status.accountStatus === 'enabled'
                  ? 'Your account is active and ready to receive payments'
                  : status.accountStatus === 'pending'
                  ? 'Complete onboarding to activate your account'
                  : 'There is an issue with your account'}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Requirements Alert */}
        {status?.hasAccount && status.accountStatus === 'pending' && status.requirements?.currently_due && status.requirements.currently_due.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              Please complete the remaining requirements to activate your account.
            </AlertDescription>
          </Alert>
        )}

        {/* Disabled Alert */}
        {status?.hasAccount && status.accountStatus === 'disabled' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Account Disabled</AlertTitle>
            <AlertDescription>
              {status.requirements?.disabled_reason || 'Your account has been disabled. Please contact support.'}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Account Details */}
        {status?.hasAccount && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Account Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Account ID</p>
                <p className="font-mono">{status.accountId?.slice(0, 15)}...</p>
              </div>
              <div>
                <p className="text-muted-foreground">Details Submitted</p>
                <p>{status.detailsSubmitted ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Charges Enabled</p>
                <p>{status.chargesEnabled ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payouts Enabled</p>
                <p>{status.payoutsEnabled ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {!status?.hasAccount && (
            <Button
              onClick={handleCreateAccount}
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Set Up Payment Account
                </>
              )}
            </Button>
          )}

          {status?.hasAccount && status.accountStatus === 'pending' && (
            <Button
              onClick={handleGetOnboardingLink}
              disabled={isGettingOnboardingLink}
            >
              {isGettingOnboardingLink ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Complete Onboarding
                </>
              )}
            </Button>
          )}

          {status?.hasAccount && status.accountStatus === 'enabled' && (
            <Button
              variant="outline"
              onClick={handleGetDashboardLink}
              disabled={isGettingDashboardLink}
            >
              {isGettingDashboardLink ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Stripe Dashboard
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground">
          Powered by Stripe Connect. Your financial data is securely handled by Stripe.
        </p>
      </CardContent>
    </Card>
  )
}
