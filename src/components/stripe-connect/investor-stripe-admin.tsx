'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken } from '@/lib/auth-storage'
import { useStripeConnectAdminStatus } from '@/hooks/use-swr-hooks'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Send,
  Building2,
  Copy,
  ExternalLink
} from 'lucide-react'

interface InvestorStripeAdminProps {
  investorId: string
  investorName?: string
  investorEmail?: string
}

export function InvestorStripeAdmin({
  investorId,
  investorName,
  investorEmail,
}: InvestorStripeAdminProps) {
  const {
    hasAccount,
    isComplete,
    accountStatus,
    chargesEnabled,
    payoutsEnabled,
    requirements,
    accountId,
    isLoading,
    mutate: refreshStatus
  } = useStripeConnectAdminStatus(investorId)

  const [actionLoading, setActionLoading] = useState(false)
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null)

  const handleSendInvite = async () => {
    const token = getAuthToken()
    if (!token) return

    try {
      setActionLoading(true)
      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.stripeConnectAdminSendInvite(investorId)),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (data.success) {
        setOnboardingUrl(data.onboardingUrl)
        toast.success('Onboarding link generated! You can now share it with the investor.')
        await refreshStatus()
      } else {
        toast.error(data.message || 'Failed to generate onboarding link')
      }
    } catch (error) {
      console.error('Error sending invite:', error)
      toast.error('Failed to generate onboarding link')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (onboardingUrl) {
      await navigator.clipboard.writeText(onboardingUrl)
      toast.success('Link copied to clipboard!')
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
              Payment Account Status
            </CardTitle>
            <CardDescription className="mt-1">
              Manage {investorName || 'investor'}&apos;s payment account for receiving distributions
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
              <p className="text-sm text-muted-foreground">
                This investor has not set up their payment account yet.
                Generate an onboarding link to send them.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSendInvite} disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Generate Onboarding Link
                  </>
                )}
              </Button>
            </div>

            {onboardingUrl && (
              <div className="mt-4 rounded-lg border p-4 bg-muted border-border">
                <p className="text-sm font-medium text-foreground mb-2">
                  Onboarding Link Generated
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Share this link with {investorEmail || 'the investor'} to complete their payment account setup.
                  This link expires in 24 hours.
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">
                    {onboardingUrl}
                  </code>
                  <Button size="sm" variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(onboardingUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : accountStatus === 'pending' || !isComplete ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted p-4">
              <h4 className="font-medium text-foreground">
                Account setup incomplete
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                The investor has created their account but hasn&apos;t completed the onboarding process.
              </p>
              {requirements?.currently_due && requirements.currently_due.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-foreground">Pending requirements:</p>
                  <ul className="text-xs text-muted-foreground ml-4 list-disc">
                    {requirements.currently_due.slice(0, 5).map((item: string, index: number) => (
                      <li key={index}>{item.replace(/_/g, ' ')}</li>
                    ))}
                    {requirements.currently_due.length > 5 && (
                      <li>And {requirements.currently_due.length - 5} more...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSendInvite} disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Resend Onboarding Link
                  </>
                )}
              </Button>
            </div>

            {onboardingUrl && (
              <div className="mt-4 rounded-lg border p-4 bg-muted border-border">
                <p className="text-sm font-medium text-foreground mb-2">
                  New Onboarding Link Generated
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">
                    {onboardingUrl}
                  </code>
                  <Button size="sm" variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : accountStatus === 'enabled' ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted p-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Account Active
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                This investor&apos;s payment account is fully set up and ready to receive distributions.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
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
                {accountId && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Account ID:</span>{' '}
                    <code className="font-mono text-xs bg-muted px-1 rounded">
                      {accountId}
                    </code>
                  </div>
                )}
              </div>
            </div>
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
                  ? `Account disabled: ${requirements.disabled_reason.replace(/_/g, ' ')}`
                  : 'There is an issue with this payment account.'}
              </p>
            </div>
            <Button onClick={handleSendInvite} disabled={actionLoading}>
              <Send className="mr-2 h-4 w-4" />
              Send Update Request
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
