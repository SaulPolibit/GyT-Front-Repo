"use client"

import * as React from "react"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { getUserRoleType, updateUserKycData, saveLoginResponse, getRedirectPathForRole } from "@/lib/auth-storage"
import { toast } from "sonner"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { AlertCircle, Share2 } from "lucide-react"
import { saveNotificationSettings } from "@/lib/notification-settings-storage"
import { sendInvestorActivityEmail } from "@/lib/email-service"

function LPLoginPageContent() {
  const [isProsperapLoading, setIsProsperapLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [prosperapRedirectUrl, setProsperapRedirectUrl] = React.useState<string | null>(null)
  const [showTermsDialog, setShowTermsDialog] = React.useState(false)
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [registrationData, setRegistrationData] = React.useState<any>(null)
  const [firmLogo, setFirmLogo] = React.useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoggedIn, user, refreshAuthState} = useAuth()

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
              Authenticating with Próspera...
            </p>
          </CardContent>
        </Card>
      </div>
    )
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
            disabled={isProsperapLoading}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            size="lg"
          >
            {isProsperapLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Connecting to Próspera...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
                Login with Próspera
              </>
            )}
          </Button>

          {/* Prospera Sign Up Link */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p className="mb-2">Don't have a Próspera account?</p>
            <a
              href="https://staging-portal.eprospera.com/en/login?returnTo=%2F"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Create one on Próspera →
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
