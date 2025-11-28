"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { getInvestorByEmail, setCurrentInvestorEmail } from "@/lib/lp-portal-helpers"
import { useAuth } from "@/hooks/useAuth"
import { getRedirectPathForRole, getUserRoleType, updateUserKycData } from "@/lib/auth-storage"
import { toast } from "sonner"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { AlertCircle } from "lucide-react"

export default function LPLoginPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const router = useRouter()
  const { login, isLoggedIn, user } = useAuth()

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

      // If login failed, show error message in view
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
        if (!response.user.kycId && response.user.kycStatus !== 'Approved') {
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
              }
            } else {
              console.error('[LP Login] Failed to create DiDit session:', await diditResponse.text())
            }
          } catch (diditError) {
            console.error('[LP Login] Error creating DiDit session:', diditError)
          }
        }

        // Set current investor email (for LP portal specific functionality)
        const investor = getInvestorByEmail(email)
        if (investor) {
          setCurrentInvestorEmail(email)
        }

        toast.success(`Welcome back!`)
        router.push('/lp-portal/portfolio')
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Investor Portal</CardTitle>
          <CardDescription>
            Enter your credentials to access your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrorMessage('') // Clear error when user types
              }}
              placeholder="investor@example.com"
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
              onChange={(e) => {
                setPassword(e.target.value)
                setErrorMessage('') // Clear error when user types
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Access Portfolio'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
