"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { getRedirectPathForRole, updateUserKycData } from "@/lib/auth-storage"
import { toast } from "sonner"
import Link from "next/link"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { saveNotificationSettings } from "@/lib/notification-settings-storage"
import { sendInvestorActivityEmail } from "@/lib/email-service"

export default function SignInPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [firmLogo, setFirmLogo] = React.useState<string | null>(null)
  const router = useRouter()
  const { login, isLoggedIn, user, refreshAuthState } = useAuth()

  // Fetch firm logo on mount
  React.useEffect(() => {
    async function fetchFirmLogo() {
      try {
        const url = getApiUrl(API_CONFIG.endpoints.getFirmLogo)
        const response = await fetch(url)

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setFirmLogo(result.data.firmLogo)
          }
        }
      } catch (error) {
        console.error('Failed to fetch firm logo:', error)
      }
    }

    fetchFirmLogo()
  }, [])

  // If already logged in, redirect
  React.useEffect(() => {
    if (isLoggedIn && user) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || getRedirectPathForRole(user.role)
      sessionStorage.removeItem('redirectAfterLogin')
      console.log('[Sign-In] Redirecting to:', redirectPath)

      // Use replace instead of push to prevent back button issues
      router.replace(redirectPath)
    }
  }, [isLoggedIn, user, router])

  const handleLogin = async () => {
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    if (!password) {
      toast.error('Please enter your password')
      return
    }

    setIsLoading(true)

    try {
      // Login via API
      const response = await login(email, password)

      console.log('[Sign-In] Login response received:', response)

      // If login failed completely (no response), exit
      // Note: useAuth hook already showed error toast
      if (!response) {
        console.log('[Sign-In] Login failed - no response (error already shown by useAuth)')
        setIsLoading(false)
        return
      }

      // Check if MFA is required BEFORE checking success
      if (response.mfaRequired) {
        console.log('[Sign-In] MFA verification required, redirecting...')
        console.log('[Sign-In] MFA userId:', response.userId)
        console.log('[Sign-In] MFA factorId:', response.factorId)

        // Store Supabase tokens in sessionStorage for MFA verification
        if (response.supabase?.accessToken && response.supabase?.refreshToken) {
          sessionStorage.setItem('mfa_supabase_access_token', response.supabase.accessToken)
          sessionStorage.setItem('mfa_supabase_refresh_token', response.supabase.refreshToken)
          console.log('[Sign-In] Supabase tokens stored for MFA verification')
        }

        const params = new URLSearchParams()
        if (response.userId) {
          params.append('userId', response.userId)
        }
        if (response.factorId) {
          params.append('factorId', response.factorId)
        }
        const redirectUrl = `/sign-in/mfa-validation?${params.toString()}`
        console.log('[Sign-In] Redirecting to:', redirectUrl)
        router.push(redirectUrl)
        setIsLoading(false)
        return
      }

      // If not MFA required and login failed, exit
      if (!response.success) {
        toast.error(response.message || 'Invalid email or password')
        setIsLoading(false)
        return
      }

      if (response.success && response.user) {
        console.log('[Sign-In] Login successful, user role:', response.user.role)
        console.log('[Sign-In] KYC Status:', response.user.kycStatus)

        toast.success(`Welcome back!`)

        // KYC validation for role 3 (investors/customers)
        if (response.user.role === 3) {
          const kycStatus = response.user.kycStatus
          const kycUrl = response.user.kycUrl

          // Case 1: kyc_status is null → create new DiDit session
          if (kycStatus === null || kycStatus === undefined) {
            console.log('[Sign-In] KYC status is null, creating new DiDit session...')
            try {
              const diditResponse = await fetch(getApiUrl(API_CONFIG.endpoints.diditSession), {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${response.token}`,
                  'Content-Type': 'application/json',
                },
              })

              if (diditResponse.ok) {
                const diditData = await diditResponse.json()
                console.log('[Sign-In] DiDit session created:', diditData)

                const sessionId = diditData.data?.session_id || diditData.data?.sessionId
                const sessionUrl = diditData.data?.url
                const sessionStatus = diditData.data?.status

                if (sessionId && sessionUrl) {
                  updateUserKycData(sessionId, sessionUrl, sessionStatus)
                  console.log('[Sign-In] KYC data updated in localStorage')
                  refreshAuthState()
                }
              } else {
                console.error('[Sign-In] Failed to create DiDit session:', await diditResponse.text())
              }
            } catch (diditError) {
              console.error('[Sign-In] Error creating DiDit session:', diditError)
            }
          }
          // Case 2: kyc_status is not null but not 'Completed' → use existing kyc_url
          else if (kycStatus !== 'Completed') {
            console.log('[Sign-In] KYC status is', kycStatus, '- verification required')

            if (kycUrl) {
              // Update localStorage with existing KYC URL
              updateUserKycData(response.user.kycId || '', kycUrl, kycStatus)
              console.log('[Sign-In] Using existing KYC URL:', kycUrl)
              refreshAuthState()
            } else {
              console.warn('[Sign-In] KYC status is not Completed but no kycUrl available')
            }
          }
          // Case 3: kyc_status is 'Completed' → do nothing (no message)
          else {
            console.log('[Sign-In] KYC verification completed')
          }
        }

        // Fetch and save notification settings after successful login
        try {
          console.log('[Sign-In] Fetching notification settings...')
          const notificationResponse = await fetch(getApiUrl(API_CONFIG.endpoints.getNotificationSettings), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${response.token}`,
            },
          })

          if (notificationResponse.ok) {
            const notificationData = await notificationResponse.json()
            console.log('[Sign-In] Notification settings fetched:', notificationData)

            if (notificationData.success && notificationData.data) {
              saveNotificationSettings(notificationData.data)
              console.log('[Sign-In] Notification settings saved to localStorage')

              // Send security alert email if enabled
              if (notificationData.data.securityAlerts && response.user?.id && response.user?.email) {
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
                    response.user.id,
                    response.user.email,
                    {
                      investorName: response.user.email,
                      activityType: 'Security Alert: New Login Detected',
                      activityDescription: `A new login to your account was detected.\n\nLogin Details:\nDate & Time: ${currentDate}\nDevice: ${deviceInfo}\nLocation: ${loginLocation}\n\nIf this was you, no action is needed. If you did not log in, please secure your account immediately by changing your password and enabling two-factor authentication.`,
                      date: currentDate,
                      fundManagerName: 'Polibit Security Team',
                      fundManagerEmail: 'security@polibit.com',
                    }
                  )
                  console.log('[Sign-In] Security alert email sent successfully')
                } catch (emailError) {
                  console.error('[Sign-In] Error sending security alert email:', emailError)
                  // Don't fail login if email fails
                }
              }
            }
          } else {
            console.warn('[Sign-In] Failed to fetch notification settings:', await notificationResponse.text())
          }
        } catch (notificationError) {
          console.error('[Sign-In] Error fetching notification settings:', notificationError)
          // Don't fail login if notification settings fetch fails
        }

        // The useEffect will handle the redirect after state updates
        // Just wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {firmLogo && (
            <div className="flex justify-center mb-4">
              <img
                src={firmLogo}
                alt="Firm logo"
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Enter your credentials to access the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              disabled={isLoading}
              suppressHydrationWarning
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              disabled={isLoading}
              suppressHydrationWarning
            />
          </div>

          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
