"use client"

import * as React from "react"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { getUserRoleType, updateUserKycData, saveLoginResponse, getRedirectPathForRole } from "@/lib/auth-storage"
import { toast } from "sonner"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { AlertCircle } from "lucide-react"
import { saveNotificationSettings } from "@/lib/notification-settings-storage"
import { sendInvestorActivityEmail } from "@/lib/email-service"

function LPLoginPageContent() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isProsperapLoading, setIsProsperapLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [prosperapRedirectUrl, setProsperapRedirectUrl] = React.useState<string | null>(null)
  const [showTermsDialog, setShowTermsDialog] = React.useState(false)
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [registrationData, setRegistrationData] = React.useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoggedIn, user, refreshAuthState} = useAuth()

  // Handle OAuth callback from Prospera
  React.useEffect(() => {
    const code = searchParams.get('code')
    const storedVerifier = sessionStorage.getItem('prospera_code_verifier')
    const storedNonce = sessionStorage.getItem('prospera_nonce')

    if (code && storedVerifier && storedNonce) {
      console.log('[LP Login] OAuth callback detected, processing...')
      handleProsperapCallback(code, storedVerifier, storedNonce)
    }
  }, [searchParams])

  // If already logged in, redirect to portfolio
  React.useEffect(() => {
    if (isLoggedIn && user) {
      // If user is customer (role 3), go to portfolio
      // Otherwise redirect to their correct dashboard
      const redirectPath = getUserRoleType(user.role) === 'lp-portal'
        ? '/lp-portal/portfolio'
        : getRedirectPathForRole(user.role)
      router.push(redirectPath)
    }
  }, [isLoggedIn, user, router])

  const handleLogin = async () => {
    // Clear previous error
    setErrorMessage('')

    if (!email) {
      setErrorMessage('Please enter your email')
      return
    }

    if (!password) {
      setErrorMessage('Please enter your password')
      return
    }

    setIsLoading(true)

    try {
      // Make API call directly to capture error message
      const apiResponse = await fetch(getApiUrl(API_CONFIG.endpoints.login), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await apiResponse.json()

      // Check if MFA is required BEFORE checking success
      if (data.mfaRequired) {
        console.log('[LP Login] MFA verification required, redirecting...')
        router.push(`/sign-in/mfa-validation?userId=${data.userId}`)
        return
      }

      // If not MFA required and login failed, show error message
      if (!data.success) {
        console.log('[LP Login] Login failed:', data.message)
        setErrorMessage(data.message || 'Login failed. Please try again.')
        setIsLoading(false)
        return
      }

      // Now call the login function to save the auth state
      const response = await login(email, password)

      if (!response || !response.success) {
        console.log('[LP Login] Login state save failed')
        setIsLoading(false)
        return
      }

      if (response.success) {
        // Check if user is a customer (role 3)
        if (response.user.role !== 3) {
          toast.error('This login is for investors only. Please use the main sign-in page.')
          setIsLoading(false)
          return
        }

        console.log('[LP Login] KYC Status:', response.user.kycStatus)

        // KYC validation for role 3 (investors) without kycId
        if (!response.user.kycId || response.user.kycStatus !== 'Approved') {
          console.log('[LP Login] Retrieving DiDit session for investor...')
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
              console.log('[LP Login] DiDit session created:', diditData)

              // Update user KYC data in localStorage
              if (diditData.data?.sessionId && diditData.data?.url) {
                updateUserKycData(
                  diditData.data.sessionId,
                  diditData.data.url,
                  diditData.data.status
                )
                console.log('[LP Login] KYC data updated in localStorage')

                // Refresh auth state to pick up new KYC data
                refreshAuthState()
                console.log('[LP Login] Auth state refreshed with new KYC data')
              }
            } else {
              console.error('[LP Login] Failed to create DiDit session:', await diditResponse.text())
            }
          } catch (diditError) {
            console.error('[LP Login] Error creating DiDit session:', diditError)
          }
        }

        // Fetch and save notification settings after successful login
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
                  console.log('[LP Login] Security alert email sent successfully')
                } catch (emailError) {
                  console.error('[LP Login] Error sending security alert email:', emailError)
                  // Don't fail login if email fails
                }
              }
            }
          } else {
            console.warn('[LP Login] Failed to fetch notification settings:', await notificationResponse.text())
          }
        } catch (notificationError) {
          console.error('[LP Login] Error fetching notification settings:', notificationError)
          // Don't fail login if notification settings fetch fails
        }

        // Redirect will happen via useEffect once isLoggedIn updates
        toast.success('Welcome back!')
      }
    } catch (error) {
      console.error('[LP Login] Error:', error)
      setErrorMessage('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProsperapLogin = async () => {
    setIsProsperapLoading(true)
    setErrorMessage('')
    setProsperapRedirectUrl(null)

    try {
      console.log('[Prospera Login] Requesting authorization URL...')

      // Construct the full redirect URI for this page
      const redirectUri = `${window.location.origin}/lp-portal/login`

      // Get authorization URL from backend
      const response = await fetch(getApiUrl('/api/custom/prospera/auth-url'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectUri }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to initiate Prospera login')
      }

      const data = await response.json()

      if (!data.success || !data.authUrl) {
        throw new Error('Invalid response from Prospera service')
      }

      console.log('[Prospera Login] Authorization URL received')

      // Store code verifier and nonce for callback
      sessionStorage.setItem('prospera_code_verifier', data.codeVerifier)
      sessionStorage.setItem('prospera_nonce', data.nonce)

      // Redirect to Prospera
      console.log('[Prospera Login] Redirecting to Prospera...')
      window.location.href = data.authUrl
    } catch (error) {
      console.error('[Prospera Login] Error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to Prospera. Please try again.')
      setIsProsperapLoading(false)
    }
  }

  const handleCompleteRegistration = async () => {
    if (!termsAccepted || !registrationData) {
      setErrorMessage('Please accept the terms and conditions to continue')
      return
    }

    setIsProsperapLoading(true)
    setErrorMessage('')

    try {
      console.log('[Prospera Registration] Completing registration...')

      const response = await fetch(getApiUrl('/api/custom/prospera/complete-registration'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData: registrationData.userData,
          sessionData: registrationData.sessionData,
          termsAccepted: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Registration failed')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Registration failed')
      }

      console.log('[Prospera Registration] Registration complete')

      // Save to localStorage (same format as regular login)
      saveLoginResponse(data)

      // Close terms dialog
      setShowTermsDialog(false)
      setRegistrationData(null)
      setTermsAccepted(false)

      toast.success('Welcome! Account created successfully')

      // Redirect to portfolio (will be handled by useEffect)
      refreshAuthState()
    } catch (error) {
      console.error('[Prospera Registration] Error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setIsProsperapLoading(false)
    }
  }

  const handleProsperapCallback = async (code: string, codeVerifier: string, nonce: string) => {
    setIsProsperapLoading(true)
    setErrorMessage('')
    setProsperapRedirectUrl(null)

    try {
      console.log('[Prospera Callback] Processing OAuth callback...')

      // Construct the redirect URI (must match what was used in the auth request)
      const redirectUri = `${window.location.origin}/lp-portal/login`

      const response = await fetch(getApiUrl('/api/custom/prospera/callback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, codeVerifier, nonce, redirectUri }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Store redirect URL if provided (for Próspera residency errors)
        if (errorData.redirectUrl) {
          setProsperapRedirectUrl(errorData.redirectUrl)
        }

        throw new Error(errorData.message || 'Prospera authentication failed')
      }

      const data = await response.json()

      if (!data.success) {
        // Store redirect URL if provided (for Próspera residency errors)
        if (data.redirectUrl) {
          setProsperapRedirectUrl(data.redirectUrl)
        }

        throw new Error(data.message || 'Prospera authentication failed')
      }

      // Check if terms acceptance is required (new user)
      if (data.requiresTermsAcceptance) {
        console.log('[Prospera Callback] Terms acceptance required for new user')

        // Store registration data for later use
        setRegistrationData(data)

        // Clear URL parameters
        window.history.replaceState({}, '', '/lp-portal/login')

        // Show terms dialog
        setShowTermsDialog(true)
        setIsProsperapLoading(false)
        return
      }

      console.log('[Prospera Callback] Authentication successful')

      // Save to localStorage (same format as regular login)
      saveLoginResponse(data)

      // Clear stored verifier and nonce
      sessionStorage.removeItem('prospera_code_verifier')
      sessionStorage.removeItem('prospera_nonce')

      // Clear URL parameters
      window.history.replaceState({}, '', '/lp-portal/login')

      toast.success('Welcome! Logged in with Prospera')

      // Redirect to portfolio (will be handled by useEffect)
      refreshAuthState()
    } catch (error) {
      console.error('[Prospera Callback] Error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Prospera authentication failed. Please try again.')
      sessionStorage.removeItem('prospera_code_verifier')
      sessionStorage.removeItem('prospera_nonce')

      // Clear URL parameters
      window.history.replaceState({}, '', '/lp-portal/login')
    } finally {
      setIsProsperapLoading(false)
    }
  }

  // Show loading state during OAuth callback
  if (isProsperapLoading && searchParams.get('code')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <p className="text-center mt-4 text-muted-foreground">
              Authenticating with Prospera...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
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
                {prosperapRedirectUrl && (
                  <div className="mt-2">
                    <a
                      href={prosperapRedirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium underline hover:no-underline"
                    >
                      Manage your Próspera account →
                    </a>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Prospera Login Button */}
          <Button
            onClick={handleProsperapLogin}
            disabled={isLoading || isProsperapLoading}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            size="lg"
          >
            {isProsperapLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Connecting to Prospera...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
                Login with Prospera
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading || isProsperapLoading}
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
              disabled={isLoading || isProsperapLoading}
            />
          </div>

          <Button
            onClick={handleLogin}
            className="w-full"
            disabled={isLoading || isProsperapLoading}
            variant="outline"
          >
            {isLoading ? 'Signing in...' : 'Sign In with Email'}
          </Button>

          {/* Prospera Sign Up Link */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p className="mb-2">Don't have a Prospera account?</p>
            <a
              href="https://staging-portal.eprospera.com/en/login?returnTo=%2F"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Create one on Prospera →
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Terms and Conditions</DialogTitle>
            <DialogDescription>
              Please review and accept the terms to continue
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                disabled={isProsperapLoading}
              />
              <label
                htmlFor="terms"
                className="text-sm leading-relaxed cursor-pointer select-none"
              >
                I accept the terms and conditions of{' '}
                <a
                  href="https://eprospera.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Próspera
                </a>
                {' '}and{' '}
                <a
                  href="https://polibit.io/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  the platform
                </a>
              </label>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleCompleteRegistration}
              disabled={!termsAccepted || isProsperapLoading}
              className="w-full"
            >
              {isProsperapLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating account...
                </>
              ) : (
                'Accept and Continue'
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
