"use client"

import * as React from "react"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { getUserRoleType, updateUserKycData, getRedirectPathForRole } from "@/lib/auth-storage"
import { toast } from "sonner"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { AlertCircle, Share2, Shield } from "lucide-react"
import { saveNotificationSettings } from "@/lib/notification-settings-storage"
import { sendInvestorActivityEmail } from "@/lib/email-service"

function LPLoginPageContent() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [firmLogo, setFirmLogo] = React.useState<string | null>(null)

  // MFA states
  const [showMfaDialog, setShowMfaDialog] = React.useState(false)
  const [mfaCode, setMfaCode] = React.useState('')
  const [isVerifyingMfa, setIsVerifyingMfa] = React.useState(false)
  const [mfaData, setMfaData] = React.useState<{
    userId: string
    factorId: string
    supabase?: {
      accessToken: string
      refreshToken: string
      expiresIn: number
      expiresAt: number
    }
  } | null>(null)

  const router = useRouter()
  const { isLoggedIn, user, login, refreshAuthState } = useAuth()

  // Load firm logo
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

  // If already logged in, redirect to portfolio
  React.useEffect(() => {
    if (isLoggedIn && user) {
      const redirectPath = getUserRoleType(user.role) === 'lp-portal'
        ? '/lp-portal/portfolio'
        : getRedirectPathForRole(user.role)
      router.push(redirectPath)
    }
  }, [isLoggedIn, user, router])

  const handleLogin = async () => {
    if (!email) {
      setErrorMessage('Please enter your email')
      return
    }

    if (!password) {
      setErrorMessage('Please enter your password')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      console.log('[LP Login] Attempting login...')

      // Login via useAuth hook
      const response = await login(email, password)

      console.log('[LP Login] Login response received:', response)

      if (!response) {
        console.log('[LP Login] Login failed - no response')
        setIsLoading(false)
        return
      }

      // Check if MFA is required
      if (response.mfaRequired) {
        console.log('[LP Login] MFA verification required')

        // Store MFA data for verification
        setMfaData({
          userId: response.userId,
          factorId: response.factorId,
          supabase: response.supabase,
        })

        // Show MFA dialog
        setShowMfaDialog(true)
        setIsLoading(false)
        return
      }

      // If not MFA required and login failed, exit
      if (!response.success) {
        setErrorMessage(response.message || 'Invalid email or password')
        setIsLoading(false)
        return
      }

      if (response.success && response.user) {
        console.log('[LP Login] Login successful, user role:', response.user.role)

        toast.success('Welcome back!')

        // Handle KYC for investors (role 3)
        if (response.user.role === 3 && response.user.kycStatus !== 'Approved') {
          console.log('[LP Login] Retrieving DiDit session for user...')
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
              console.log('[LP Login] DiDit session response:', diditData)

              const sessionId = diditData.data?.session_id || diditData.data?.sessionId
              const sessionUrl = diditData.data?.url
              const sessionStatus = diditData.data?.status

              if (sessionId && sessionUrl) {
                updateUserKycData(sessionId, sessionUrl, sessionStatus)
                console.log('[LP Login] KYC data updated in localStorage')
                refreshAuthState()
              }
            }
          } catch (diditError) {
            console.error('[LP Login] Error creating DiDit session:', diditError)
          }
        }

        // Fetch and save notification settings
        try {
          console.log('[LP Login] Fetching notification settings...')
          const notificationResponse = await fetch(getApiUrl(API_CONFIG.endpoints.getNotificationSettings), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${response.token}`,
            },
          })

          if (notificationResponse.ok) {
            const notificationData = await notificationResponse.json()
            console.log('[LP Login] Notification settings fetched:', notificationData)

            if (notificationData.success && notificationData.data) {
              saveNotificationSettings(notificationData.data)
              console.log('[LP Login] Notification settings saved to localStorage')

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

                  const loginLocation = 'Unknown'
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
                  console.log('[LP Login] Security alert email sent successfully')
                } catch (emailError) {
                  console.error('[LP Login] Error sending security alert email:', emailError)
                }
              }
            }
          }
        } catch (notificationError) {
          console.error('[LP Login] Error fetching notification settings:', notificationError)
        }

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('[LP Login] Login error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaVerify = async () => {
    if (!mfaCode || mfaCode.length !== 6 || !mfaData) {
      setErrorMessage('Please enter a valid 6-digit code')
      return
    }

    // Check if Supabase tokens are available
    if (!mfaData.supabase?.accessToken || !mfaData.supabase?.refreshToken) {
      setErrorMessage('Invalid session. Please login again.')
      setShowMfaDialog(false)
      return
    }

    setIsVerifyingMfa(true)
    setErrorMessage('')

    try {
      console.log('[MFA Verify] Verifying MFA code...')

      const response = await fetch(getApiUrl('/api/custom/mfa/login-verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: mfaData.userId,
          code: mfaCode,
          supabaseAccessToken: mfaData.supabase.accessToken,
          supabaseRefreshToken: mfaData.supabase.refreshToken,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'MFA verification failed')
      }

      console.log('[MFA Verify] MFA verification successful')

      // Close MFA dialog
      setShowMfaDialog(false)
      setMfaCode('')
      setMfaData(null)

      // Save login response
      const { saveLoginResponse } = await import('@/lib/auth-storage')
      saveLoginResponse(data)

      toast.success('Welcome! Logged in successfully')

      // Redirect to portfolio
      refreshAuthState()
    } catch (error) {
      console.error('[MFA Verify] Error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'MFA verification failed. Please try again.')
    } finally {
      setIsVerifyingMfa(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {/* Firm Logo */}
          <div className="flex justify-center">
            {firmLogo ? (
              <img
                src={firmLogo}
                alt="Firm logo"
                className="h-16 w-auto object-contain"
              />
            ) : (
              <Share2 className="h-16 w-16 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">Investor Login</CardTitle>
          <CardDescription>
            Access your investment portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Alert */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrorMessage('')
              }}
              placeholder="you@example.com"
              autoFocus
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrorMessage('')
              }}
              placeholder="••••••••"
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* MFA Verification Dialog */}
      <Dialog open={showMfaDialog} onOpenChange={(open) => {
        if (!open && !isVerifyingMfa) {
          setShowMfaDialog(false)
          setMfaCode('')
          setMfaData(null)
          setErrorMessage('')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mfaCode">Authentication Code</Label>
              <Input
                id="mfaCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setMfaCode(value)
                  setErrorMessage('')
                }}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
                disabled={isVerifyingMfa}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && mfaCode.length === 6) {
                    handleMfaVerify()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the code shown in your authenticator app (Google Authenticator, Authy, etc.)
              </p>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowMfaDialog(false)
                setMfaCode('')
                setMfaData(null)
                setErrorMessage('')
              }}
              disabled={isVerifyingMfa}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMfaVerify}
              disabled={isVerifyingMfa || mfaCode.length !== 6}
              className="w-full sm:w-auto"
            >
              {isVerifyingMfa ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LPLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <p className="text-center mt-4 text-muted-foreground">
              Loading...
            </p>
          </CardContent>
        </Card>
      </div>
    }>
      <LPLoginPageContent />
    </Suspense>
  )
}
