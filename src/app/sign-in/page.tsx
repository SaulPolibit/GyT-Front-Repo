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
  const router = useRouter()
  const { login, isLoggedIn, user, refreshAuthState } = useAuth()

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

      // If login failed completely (no response), exit
      if (!response) {
        console.log('[Sign-In] Login failed - no response')
        setIsLoading(false)
        return
      }

      // Check if MFA is required BEFORE checking success
      if (response.mfaRequired) {
        console.log('[Sign-In] MFA verification required, redirecting...')
        router.push(`/sign-in/mfa-validation?userId=${response.userId}`)
        return
      }

      // If not MFA required and login failed, exit
      if (!response.success) {
        console.log('[Sign-In] Login failed')
        setIsLoading(false)
        return
      }

      if (response.success) {
        console.log('[Sign-In] Login successful, user role:', response.user.role)
        console.log('[Sign-In] KYC Status:', response.user.kycStatus)

        toast.success(`Welcome back!`)

        // KYC validation only for role 3 (investors/customers) without kycId
        if (response.user.role === 3 && response.user.kycStatus !== 'Approved') {
          console.log('[Sign-In] Retrieving DiDit session for user...')
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

              // Update user KYC data in localStorage
              if (diditData.data?.sessionId && diditData.data?.url) {
                updateUserKycData(
                  diditData.data.sessionId,
                  diditData.data.url,
                  diditData.data.status
                )
                console.log('[Sign-In] KYC data updated in localStorage')

                // Refresh auth state to pick up new KYC data
                refreshAuthState()
                console.log('[Sign-In] Auth state refreshed with new KYC data')
              }
            } else {
              console.error('[Sign-In] Failed to create DiDit session:', await diditResponse.text())
            }
          } catch (diditError) {
            console.error('[Sign-In] Error creating DiDit session:', diditError)
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
          <CardTitle className="text-2xl">Sign In to Polibit</CardTitle>
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
            />
          </div>

          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>

          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p className="mb-2 font-medium">Demo Credentials:</p>
            <div className="space-y-2">
              <div className="p-2 bg-muted rounded text-left">
                <button
                  onClick={() => {
                    setEmail('saul@polibit.io')
                    setPassword('saul.polibit123*')
                  }}
                  className="text-primary hover:underline w-full text-left"
                >
                  <div className="font-medium">Admin Account</div>
                  <div className="text-xs">saul@polibit.io</div>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
