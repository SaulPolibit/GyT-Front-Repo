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

      // If login failed, response will be null and error message already shown by useAuth
      if (!response || !response.success) {
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
