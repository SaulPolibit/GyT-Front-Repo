"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, ArrowLeft, Shield, Loader2 } from "lucide-react"
import { getCurrentUser, getAuthToken, updateUserKycData } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { toast } from "sonner"

export default function KYCVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/lp-portal/marketplace'
  const [user, setUser] = React.useState(getCurrentUser())
  const [isCreatingSession, setIsCreatingSession] = React.useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = React.useState(false)
  const [sessionError, setSessionError] = React.useState<string | null>(null)

  // Handle navigation back
  const handleGoBack = () => {
    router.push(returnUrl)
  }

  // Check if user has a session and fetch its current status from backend
  React.useEffect(() => {
    const checkSessionStatus = async () => {
      const currentUser = getCurrentUser()

      // If user has a kycSessionId, check its status
      if (currentUser?.kycSessionId && currentUser.kycStatus !== 'Approved') {
        console.log('[KYC Verification] Checking session status for:', currentUser.kycSessionId)
        setIsCheckingStatus(true)

        try {
          const token = getAuthToken()
          if (!token) {
            setIsCheckingStatus(false)
            return
          }

          // Fetch session status from backend
          const response = await fetch(getApiUrl(API_CONFIG.endpoints.getDiditSession(currentUser.kycSessionId)), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            console.log('[KYC Verification] Session status response:', data)

            const sessionStatus = data.data?.status || data.status

            if (sessionStatus && sessionStatus !== currentUser.kycStatus) {
              console.log('[KYC Verification] Status changed:', currentUser.kycStatus, '->', sessionStatus)

              // Update localStorage
              updateUserKycData(currentUser.kycSessionId, currentUser.kycUrl, sessionStatus)

              // If approved, also update the user in the database
              if (sessionStatus === 'Approved') {
                await updateUserKycStatusInDatabase(currentUser.kycSessionId, sessionStatus)
                toast.success('KYC verification approved!')
              }

              // Refresh user state
              setUser(getCurrentUser())
            }
          }
        } catch (error) {
          console.error('[KYC Verification] Error checking session status:', error)
        } finally {
          setIsCheckingStatus(false)
        }
      }
    }

    checkSessionStatus()
  }, [])

  // Function to update KYC status in the database
  const updateUserKycStatusInDatabase = async (sessionId: string, status: string) => {
    try {
      const token = getAuthToken()
      if (!token) return

      const currentUser = getCurrentUser()
      if (!currentUser?.id) return

      console.log('[KYC Verification] Updating KYC status in database:', { sessionId, status })

      // Update user's KYC status via API
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.updateUserProfile), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kycStatus: status,
          kycSessionId: sessionId,
        }),
      })

      if (response.ok) {
        console.log('[KYC Verification] Successfully updated KYC status in database')
      } else {
        console.error('[KYC Verification] Failed to update KYC status in database:', response.status)
      }
    } catch (error) {
      console.error('[KYC Verification] Error updating KYC status in database:', error)
    }
  }

  // Auto-create KYC session if user doesn't have kycUrl
  React.useEffect(() => {
    const createKycSession = async () => {
      // Skip if user is already approved or already has kycUrl
      if (user?.kycStatus === 'Approved' || user?.kycUrl) {
        return
      }

      // Skip if already creating or checking
      if (isCreatingSession || isCheckingStatus) {
        return
      }

      console.log('[KYC Verification] No kycUrl found, creating DiDit session...')
      setIsCreatingSession(true)
      setSessionError(null)

      try {
        const token = getAuthToken()
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await fetch(getApiUrl(API_CONFIG.endpoints.diditSession), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to create KYC session')
        }

        const diditData = await response.json()
        console.log('[KYC Verification] DiDit session response:', diditData)

        // Extract session data (handle both session_id and sessionId)
        const sessionId = diditData.data?.session_id || diditData.data?.sessionId
        const sessionUrl = diditData.data?.url
        const sessionStatus = diditData.data?.status

        if (sessionId && sessionUrl) {
          // Update localStorage
          updateUserKycData(sessionId, sessionUrl, sessionStatus)
          console.log('[KYC Verification] Session created and saved to localStorage')

          // Update local state to trigger re-render
          setUser(getCurrentUser())
        } else {
          throw new Error('Invalid session data received from API')
        }
      } catch (error) {
        console.error('[KYC Verification] Error creating session:', error)
        setSessionError(error instanceof Error ? error.message : 'Failed to create KYC session')
      } finally {
        setIsCreatingSession(false)
      }
    }

    createKycSession()
  }, [user?.kycUrl, user?.kycStatus, isCreatingSession, isCheckingStatus])

  // If user is already approved, show success message
  if (user && user.kycStatus === 'Approved') {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
            <p className="text-muted-foreground">Identity verification status</p>
          </div>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
              <div>
                <CardTitle className="text-lg text-green-900">KYC Verification Complete</CardTitle>
                <CardDescription className="text-green-800 mt-1">
                  Your identity has been verified and approved. You can now access all investment features.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoBack}>
              Continue to Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If creating session, show loading
  if (isCreatingSession) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
            <p className="text-muted-foreground">Setting up your verification session</p>
          </div>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-lg font-semibold text-blue-900 mb-2">Creating Verification Session</p>
            <p className="text-sm text-blue-800 text-center max-w-md">
              Please wait while we set up your KYC verification session. This will only take a moment...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If session creation failed, show error
  if (sessionError && !user?.kycUrl) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
            <p className="text-muted-foreground">Identity verification</p>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
              <div>
                <CardTitle className="text-lg text-red-900">Failed to Create Verification Session</CardTitle>
                <CardDescription className="text-red-800 mt-1">
                  {sessionError}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-red-800">
              Please try one of the following:
            </p>
            <ul className="text-sm text-red-800 ml-4 list-disc space-y-1">
              <li>Click the button below to try again</li>
              <li>Log out and log back in</li>
              <li>Contact support if the problem persists</li>
            </ul>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSessionError(null)
                  setUser({ ...user, kycUrl: null } as any)
                }}
              >
                Try Again
              </Button>
              <Button variant="outline" onClick={handleGoBack}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user has no KYC URL and not creating/errored, this shouldn't happen but show fallback
  if (!user?.kycUrl) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
            <p className="text-muted-foreground">Identity verification</p>
          </div>
        </div>

        <Card className="border-muted">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Function to manually check and refresh KYC status
  const handleRefreshStatus = async () => {
    const currentUser = getCurrentUser()

    if (!currentUser?.kycSessionId) {
      toast.error('No KYC session found')
      return
    }

    setIsCheckingStatus(true)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      // Fetch session status from backend
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getDiditSession(currentUser.kycSessionId)), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[KYC Verification] Refresh status response:', data)

        const sessionStatus = data.data?.status || data.status

        if (sessionStatus) {
          // Update localStorage
          updateUserKycData(currentUser.kycSessionId, currentUser.kycUrl, sessionStatus)

          // If status changed, update database
          if (sessionStatus !== currentUser.kycStatus) {
            await updateUserKycStatusInDatabase(currentUser.kycSessionId, sessionStatus)

            if (sessionStatus === 'Approved') {
              toast.success('KYC verification approved!')
            } else {
              toast.info(`KYC status: ${sessionStatus}`)
            }
          } else {
            toast.info(`Current status: ${sessionStatus}`)
          }

          // Refresh user state
          setUser(getCurrentUser())
        }
      } else {
        toast.error('Failed to check status')
      }
    } catch (error) {
      console.error('[KYC Verification] Error refreshing status:', error)
      toast.error('Failed to check status')
    } finally {
      setIsCheckingStatus(false)
    }
  }

  // Show KYC verification iframe
  return (
    <div className="h-screen flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background">
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Complete KYC Verification</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Status: <span className="font-medium">{user.kycStatus || 'Not started'}</span></span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStatus}
            disabled={isCheckingStatus}
          >
            {isCheckingStatus ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Status'
            )}
          </Button>
        </div>
      </div>

      {/* Full-size iFrame - takes all remaining space */}
      <div className="flex-1 relative">
        <iframe
          src={user.kycUrl.startsWith('http') ? user.kycUrl : `https://${user.kycUrl}`}
          className="absolute inset-0 w-full h-full border-0"
          title="KYC Verification"
          allow="camera; microphone"
        />
      </div>
    </div>
  )
}
