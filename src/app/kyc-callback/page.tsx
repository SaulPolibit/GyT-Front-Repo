"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { getCurrentUser, updateUserKycData, getAuthToken } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"

export default function KYCCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = React.useState<'loading' | 'success' | 'failed' | 'pending'>('loading')
  const [message, setMessage] = React.useState('')
  const [kycStatus, setKycStatus] = React.useState<string | null>(null)

  React.useEffect(() => {
    const processCallback = async () => {
      // Get session_id from URL params
      const sessionId = searchParams.get('session_id') || searchParams.get('sessionId')
      const urlStatus = searchParams.get('status')

      console.log('[KYC Callback] Processing:', { sessionId, urlStatus })

      if (!sessionId) {
        setStatus('failed')
        setMessage('No session ID found in callback URL')
        return
      }

      try {
        const token = getAuthToken()

        // Fetch the session status from backend
        const response = await fetch(getApiUrl(API_CONFIG.endpoints.getDiditSession(sessionId)), {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch KYC session status')
        }

        const data = await response.json()
        console.log('[KYC Callback] Session status:', data)

        const sessionStatus = data.data?.status || data.status || urlStatus
        setKycStatus(sessionStatus)

        // Update localStorage with the new status
        updateUserKycData(sessionId, undefined, sessionStatus)

        if (sessionStatus === 'Approved') {
          setStatus('success')
          setMessage('Your identity has been verified successfully!')
        } else if (sessionStatus === 'Declined' || sessionStatus === 'Rejected') {
          setStatus('failed')
          setMessage('Your verification was not approved. Please contact support.')
        } else {
          setStatus('pending')
          setMessage('Your verification is still being processed. You will be notified once complete.')
        }
      } catch (error) {
        console.error('[KYC Callback] Error:', error)

        // If we have a status from URL, use it as fallback
        if (urlStatus) {
          setKycStatus(urlStatus)
          if (urlStatus === 'Approved' || urlStatus === 'approved') {
            setStatus('success')
            setMessage('Your identity has been verified successfully!')
          } else if (urlStatus === 'Declined' || urlStatus === 'declined') {
            setStatus('failed')
            setMessage('Your verification was not approved.')
          } else {
            setStatus('pending')
            setMessage('Your verification is being processed.')
          }
        } else {
          setStatus('failed')
          setMessage('Unable to verify KYC status. Please try again.')
        }
      }
    }

    processCallback()
  }, [searchParams])

  const handleContinue = () => {
    const user = getCurrentUser()
    // Redirect based on user role
    if (user?.role === 3 || user?.role === 4) {
      // Investor - go to LP portal
      router.push('/lp-portal/marketplace')
    } else {
      // Fund manager - go to investment manager
      router.push('/investment-manager')
    }
  }

  const handleRetry = () => {
    router.push('/lp-portal/kyc-verification')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <CardTitle>Processing Verification</CardTitle>
              <CardDescription>Please wait while we confirm your KYC status...</CardDescription>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-green-600">Verification Complete</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
          {status === 'failed' && (
            <>
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle className="text-destructive">Verification Failed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
          {status === 'pending' && (
            <>
              <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <CardTitle className="text-yellow-600">Verification Pending</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {kycStatus && (
            <div className="text-center text-sm text-muted-foreground">
              Status: <span className="font-medium">{kycStatus}</span>
            </div>
          )}

          {status !== 'loading' && (
            <div className="flex flex-col gap-2">
              <Button onClick={handleContinue} className="w-full">
                Continue to Dashboard
              </Button>
              {status === 'failed' && (
                <Button variant="outline" onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
