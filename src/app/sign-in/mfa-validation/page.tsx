"use client"

import * as React from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { getRedirectPathForRole, updateUserKycData } from "@/lib/auth-storage"
import { ShieldCheck } from "lucide-react"
import { saveNotificationSettings } from "@/lib/notification-settings-storage"
import { sendInvestorActivityEmail } from "@/lib/email-service"

function MfaValidationContent() {
  const [code, setCode] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get userId from URL params (set during login redirect)
  const userId = searchParams.get('userId')

  React.useEffect(() => {
    // Redirect back to sign-in if no userId
    if (!userId) {
      toast.error('Invalid MFA session. Please login again.')
      router.replace('/sign-in')
    }
  }, [userId, router])

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    if (!userId) {
      toast.error('Invalid session. Please login again.')
      router.replace('/sign-in')
      return
    }

    // Retrieve Supabase tokens from sessionStorage
    const supabaseAccessToken = sessionStorage.getItem('mfa_supabase_access_token')
    const supabaseRefreshToken = sessionStorage.getItem('mfa_supabase_refresh_token')

    if (!supabaseAccessToken || !supabaseRefreshToken) {
      console.error('[MFA Validation] Missing Supabase tokens')
      toast.error('Invalid session. Please login again.')
      router.replace('/sign-in')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.mfaLoginVerify), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          code,
          supabaseAccessToken,
          supabaseRefreshToken,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(data.message || 'Invalid MFA code')
        setIsLoading(false)
        return
      }

      console.log('[MFA Validation] Verification successful')
      toast.success('MFA verified successfully!')

      // Clean up sessionStorage tokens
      sessionStorage.removeItem('mfa_supabase_access_token')
      sessionStorage.removeItem('mfa_supabase_refresh_token')

      // Save auth data
      const { saveLoginResponse } = await import('@/lib/auth-storage')
      saveLoginResponse(data)

      // KYC validation for role 3 (investors/customers)
      if (data.user.role === 3) {
        const kycStatus = data.user.kycStatus
        const kycUrl = data.user.kycUrl

        // Case 1: kyc_status is null → create new DiDit session
        if (kycStatus === null || kycStatus === undefined) {
          console.log('[MFA Validation] KYC status is null, creating new DiDit session...')
          try {
            const diditResponse = await fetch(getApiUrl(API_CONFIG.endpoints.diditSession), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${data.token}`,
                'Content-Type': 'application/json',
              },
            })

            if (diditResponse.ok) {
              const diditData = await diditResponse.json()
              console.log('[MFA Validation] DiDit session created:', diditData)

              const sessionId = diditData.data?.session_id || diditData.data?.sessionId
              const sessionUrl = diditData.data?.url
              const sessionStatus = diditData.data?.status

              if (sessionId && sessionUrl) {
                updateUserKycData(sessionId, sessionUrl, sessionStatus)
                console.log('[MFA Validation] KYC data updated in localStorage')
              }
            } else {
              console.error('[MFA Validation] Failed to create DiDit session:', await diditResponse.text())
            }
          } catch (diditError) {
            console.error('[MFA Validation] Error creating DiDit session:', diditError)
          }
        }
        // Case 2: kyc_status is not null but not 'Completed' → use existing kyc_url
        else if (kycStatus !== 'Completed') {
          console.log('[MFA Validation] KYC status is', kycStatus, '- verification required')

          if (kycUrl) {
            // Update localStorage with existing KYC URL
            updateUserKycData(data.user.kycId || '', kycUrl, kycStatus)
            console.log('[MFA Validation] Using existing KYC URL:', kycUrl)
          } else {
            console.warn('[MFA Validation] KYC status is not Completed but no kycUrl available')
          }
        }
        // Case 3: kyc_status is 'Completed' → do nothing (no message)
        else {
          console.log('[MFA Validation] KYC verification completed')
        }
      }

      // Fetch and save notification settings after successful login
      try {
        console.log('[MFA Validation] Fetching notification settings...')
        const notificationResponse = await fetch(getApiUrl(API_CONFIG.endpoints.getNotificationSettings), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`,
          },
        })

        if (notificationResponse.ok) {
          const notificationData = await notificationResponse.json()
          console.log('[MFA Validation] Notification settings fetched:', notificationData)

          if (notificationData.success && notificationData.data) {
            saveNotificationSettings(notificationData.data)
            console.log('[MFA Validation] Notification settings saved to localStorage')

            // Send security alert email if enabled
            if (notificationData.data.securityAlerts && data.user?.id && data.user?.email) {
              try {
                const currentDate = new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                const loginLocation = 'Unknown' // You can enhance this with IP geolocation
                const deviceInfo = navigator.userAgent

                await sendInvestorActivityEmail(
                  data.user.id,
                  data.user.email,
                  {
                    investorName: data.user.email,
                    activityType: 'Security Alert: New Login Detected',
                    activityDescription: `A new login to your account was detected.\n\nLogin Details:\nDate & Time: ${currentDate}\nDevice: ${deviceInfo}\nLocation: ${loginLocation}\n\nIf this was you, no action is needed. If you did not log in, please secure your account immediately by changing your password and enabling two-factor authentication.`,
                    date: currentDate,
                    fundManagerName: 'Polibit Security Team',
                    fundManagerEmail: 'security@polibit.com',
                  }
                )
                console.log('[MFA Validation] Security alert email sent successfully')
              } catch (emailError) {
                console.error('[MFA Validation] Error sending security alert email:', emailError)
                // Don't fail login if email fails
              }
            }
          }
        } else {
          console.warn('[MFA Validation] Failed to fetch notification settings:', await notificationResponse.text())
        }
      } catch (notificationError) {
        console.error('[MFA Validation] Error fetching notification settings:', notificationError)
        // Don't fail login if notification settings fetch fails
      }

      // Redirect to appropriate dashboard
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || getRedirectPathForRole(data.user.role)
      sessionStorage.removeItem('redirectAfterLogin')

      console.log('[MFA Validation] Redirecting to:', redirectPath)
      router.replace(redirectPath)
    } catch (error) {
      console.error('[MFA Validation] Error:', error)
      toast.error('Failed to verify MFA code')
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.replace('/sign-in')
  }

  if (!userId) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify MFA Code</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Authentication Code</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setCode(value)
              }}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && code.length === 6) {
                  handleVerify()
                }
              }}
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the code shown in your authenticator app (Google Authenticator, Authy, etc.)
            </p>
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleBackToLogin}
            className="w-full"
            disabled={isLoading}
          >
            Back to Login
          </Button>

          <div className="text-center text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
            <p className="font-medium mb-1">Having trouble?</p>
            <p>Make sure your device time is synchronized and you&apos;re using the correct authenticator app.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MfaValidationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <MfaValidationContent />
    </Suspense>
  )
}
