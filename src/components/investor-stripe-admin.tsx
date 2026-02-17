"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { toast } from "sonner"

interface InvestorStripeAdminProps {
  investorId: string
  investorEmail: string
  investorName: string
  stripeAccountId?: string
  stripeOnboardingComplete?: boolean
  stripeAccountStatus?: string
  className?: string
  onStatusChange?: () => void
}

export function InvestorStripeAdmin({
  investorId,
  investorEmail,
  investorName,
  stripeAccountId,
  stripeOnboardingComplete,
  stripeAccountStatus,
  className,
  onStatusChange,
}: InvestorStripeAdminProps) {
  const [loading, setLoading] = React.useState(false)
  const [accountStatus, setAccountStatus] = React.useState(stripeAccountStatus || 'not_created')
  const [onboardingComplete, setOnboardingComplete] = React.useState(stripeOnboardingComplete || false)
  const [accountId, setAccountId] = React.useState<string | null>(stripeAccountId || null)
  const [isSendingInvite, setIsSendingInvite] = React.useState(false)

  // Sync props to state when they change
  React.useEffect(() => {
    setAccountStatus(stripeAccountStatus || 'not_created')
    setOnboardingComplete(stripeOnboardingComplete || false)
    setAccountId(stripeAccountId || null)
  }, [stripeAccountId, stripeOnboardingComplete, stripeAccountStatus])

  const refreshStatus = async () => {
    if (!accountId) return

    setLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Admin endpoint to check investor's Stripe Connect status
      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.stripeConnectAdminStatus(investorId)),
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
        setAccountStatus(data.accountStatus || 'not_created')
        setOnboardingComplete(data.isComplete || false)
        onStatusChange?.()
      }
    } catch (error) {
      console.error('Error refreshing Stripe status:', error)
      toast.error('Failed to refresh status')
    } finally {
      setLoading(false)
    }
  }

  const sendOnboardingInvite = async () => {
    setIsSendingInvite(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Admin endpoint to send onboarding invite email
      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.stripeConnectAdminSendInvite(investorId)),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: investorEmail,
            name: investorName,
          }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Onboarding invite sent to investor')
      } else {
        throw new Error(data.message || 'Failed to send invite')
      }
    } catch (error: any) {
      console.error('Error sending onboarding invite:', error)
      toast.error(error.message || 'Failed to send onboarding invite')
    } finally {
      setIsSendingInvite(false)
    }
  }

  const getStatusBadge = () => {
    switch (accountStatus) {
      case 'enabled':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'disabled':
        return <Badge variant="destructive">Disabled</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'not_created':
      default:
        return <Badge variant="secondary">Not Setup</Badge>
    }
  }

  const getStatusIcon = () => {
    switch (accountStatus) {
      case 'enabled':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'disabled':
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'not_created':
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Stripe Connect Account
            </CardTitle>
            <CardDescription>
              Payment account for receiving distributions
            </CardDescription>
          </div>
          {accountId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Section */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="text-sm font-medium">Account Status</p>
              <p className="text-xs text-muted-foreground">
                {accountStatus === 'not_created'
                  ? 'No payment account set up'
                  : accountStatus === 'enabled'
                  ? 'Ready to receive payments'
                  : accountStatus === 'pending'
                  ? 'Awaiting onboarding completion'
                  : 'Account issue'}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Account Details */}
        {accountId && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Account ID</p>
              <p className="font-mono text-xs">{accountId.slice(0, 15)}...</p>
            </div>
            <div>
              <p className="text-muted-foreground">Onboarding</p>
              <p>{onboardingComplete ? 'Complete' : 'Incomplete'}</p>
            </div>
          </div>
        )}

        {/* No Account Alert */}
        {!accountId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Payment Account</AlertTitle>
            <AlertDescription>
              This investor hasn't set up their payment account yet.
              Send them an onboarding invite to get started.
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Alert */}
        {accountId && accountStatus === 'pending' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Onboarding Incomplete</AlertTitle>
            <AlertDescription>
              The investor needs to complete their Stripe Connect onboarding.
              You can send them a reminder.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {(!accountId || accountStatus === 'pending') && (
            <Button
              variant="outline"
              size="sm"
              onClick={sendOnboardingInvite}
              disabled={isSendingInvite}
            >
              {isSendingInvite ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-3 w-3" />
                  {accountId ? 'Send Reminder' : 'Send Invite'}
                </>
              )}
            </Button>
          )}

          {accountId && accountStatus === 'enabled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://dashboard.stripe.com/connect/accounts/${accountId}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              View in Stripe
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
