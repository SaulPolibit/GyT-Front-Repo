"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  ArrowRight,
  CheckCircle,
  Clock,
  Wallet,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"

interface StripeConnectOnboardingAlertProps {
  variant?: 'banner' | 'card' | 'minimal'
  onDismiss?: () => void
  className?: string
}

export function StripeConnectOnboardingAlert({
  variant = 'banner',
  onDismiss,
  className,
}: StripeConnectOnboardingAlertProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [status, setStatus] = React.useState<{
    hasAccount: boolean
    isComplete: boolean
    accountStatus: string
  } | null>(null)
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = getAuthToken()
        if (!token) {
          setLoading(false)
          return
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
          setStatus({
            hasAccount: data.hasAccount,
            isComplete: data.isComplete || false,
            accountStatus: data.accountStatus || 'not_created',
          })
        }
      } catch (error) {
        console.error('Error checking Stripe Connect status:', error)
      } finally {
        setLoading(false)
      }
    }

    // Check localStorage for dismissal
    const dismissedUntil = localStorage.getItem('stripeConnectAlertDismissed')
    if (dismissedUntil) {
      const dismissDate = new Date(dismissedUntil)
      if (dismissDate > new Date()) {
        setDismissed(true)
        setLoading(false)
        return
      }
    }

    checkStatus()
  }, [])

  const handleDismiss = () => {
    // Dismiss for 24 hours
    const dismissUntil = new Date()
    dismissUntil.setHours(dismissUntil.getHours() + 24)
    localStorage.setItem('stripeConnectAlertDismissed', dismissUntil.toISOString())
    setDismissed(true)
    onDismiss?.()
  }

  const handleSetup = () => {
    router.push('/lp-portal/settings?tab=payment')
  }

  // Don't show if loading, dismissed, or account is complete
  if (loading || dismissed) {
    return null
  }

  // Don't show if account is fully set up
  if (status?.hasAccount && status?.isComplete) {
    return null
  }

  // Minimal variant - just a small badge-like indicator
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md ${className}`}>
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <span className="text-sm text-yellow-800">Payment setup required</span>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-yellow-800 underline"
          onClick={handleSetup}
        >
          Set up now
        </Button>
      </div>
    )
  }

  // Banner variant - full-width alert banner
  if (variant === 'banner') {
    return (
      <Alert className={`relative bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 ${className}`}>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Wallet className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold">
          {!status?.hasAccount
            ? 'Set Up Your Payment Account'
            : 'Complete Your Payment Setup'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm text-muted-foreground mb-3">
            {!status?.hasAccount
              ? 'Set up your payment account to receive distributions and returns from your investments.'
              : 'Complete your payment account onboarding to start receiving distributions.'}
          </p>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleSetup}>
              {!status?.hasAccount ? 'Get Started' : 'Continue Setup'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Remind me later
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Card variant - prominent card with more details
  return (
    <Card className={`border-primary/20 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Payment Account Setup</CardTitle>
              <CardDescription>
                Required to receive distributions
              </CardDescription>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Setup Progress</span>
            <span className="font-medium">
              {!status?.hasAccount ? '0%' : status?.isComplete ? '100%' : '50%'}
            </span>
          </div>
          <Progress
            value={!status?.hasAccount ? 0 : status?.isComplete ? 100 : 50}
            className="h-2"
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            {status?.hasAccount ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={status?.hasAccount ? 'text-green-600' : ''}>
              Create payment account
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {status?.isComplete ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={status?.isComplete ? 'text-green-600' : ''}>
              Complete identity verification
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {status?.isComplete ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={status?.isComplete ? 'text-green-600' : ''}>
              Add bank account for payouts
            </span>
          </div>
        </div>

        {/* CTA */}
        <Button className="w-full" onClick={handleSetup}>
          {!status?.hasAccount ? 'Start Setup' : 'Continue Setup'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Powered by Stripe. Your data is secure.
        </p>
      </CardContent>
    </Card>
  )
}
