'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useStripeConnectStatus } from '@/hooks/use-swr-hooks'
import { CreditCard, X, ArrowRight } from 'lucide-react'
import { getAuthToken, getCurrentUser } from '@/lib/auth-storage'
import { getApiUrl, API_CONFIG } from '@/lib/api-config'

interface StripeConnectOnboardingAlertProps {
  className?: string
  onDismiss?: () => void
  showDismiss?: boolean
}

export function StripeConnectOnboardingAlert({
  className = '',
  onDismiss,
  showDismiss = true,
}: StripeConnectOnboardingAlertProps) {
  const router = useRouter()
  const {
    hasAccount,
    isComplete,
    accountStatus,
    isLoading
  } = useStripeConnectStatus()

  const [dismissed, setDismissed] = useState(false)
  const [hasBankDetails, setHasBankDetails] = useState(false)
  const [loadingBankDetails, setLoadingBankDetails] = useState(true)

  // Fetch user profile to check if bank details are filled
  useEffect(() => {
    const fetchBankDetails = async () => {
      const token = getAuthToken()
      const user = getCurrentUser()
      if (!token || !user?.id) {
        setLoadingBankDetails(false)
        return
      }

      try {
        const response = await fetch(getApiUrl(API_CONFIG.endpoints.getUserById(user.id)), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            // Check if bank details are filled
            const bankName = result.data.bankName
            const bankAccountNumber = result.data.bankAccountNumber
            setHasBankDetails(!!(bankName && bankAccountNumber))
          }
        }
      } catch (error) {
        console.error('Error fetching bank details:', error)
      } finally {
        setLoadingBankDetails(false)
      }
    }

    fetchBankDetails()
  }, [])

  const handleGetStarted = () => {
    router.push('/lp-portal/settings?tab=payment')
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  // Don't render if loading, dismissed, or bank details are already filled
  if (loadingBankDetails || dismissed) {
    return null
  }

  // If bank details are already filled, don't show the alert
  if (hasBankDetails) {
    return null
  }

  const title = 'Set Up Payment Account'
  const description = 'Set up your payment account to receive distributions and payouts from your investments.'

  return (
    <Alert className={`bg-primary/5 border-primary/20 ${className}`}>
      <CreditCard className="h-4 w-4 text-primary" />
      <AlertTitle className="flex items-center justify-between">
        {title}
        {showDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <Button
          size="sm"
          onClick={handleGetStarted}
        >
          Get Started
          <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}
