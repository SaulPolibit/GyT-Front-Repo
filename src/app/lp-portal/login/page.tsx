"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { getInvestorByEmail, setCurrentInvestorEmail } from "@/lib/lp-portal-helpers"
import { useAuth } from "@/hooks/useAuth"
import { getRedirectPathForRole, getUserRoleType } from "@/lib/auth-storage"
import { toast } from "sonner"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"

export default function LPLoginPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
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

      if (response && response.success) {
        // Check if user is a customer (role 3)
        if (response.user.role !== 3) {
          toast.error('This login is for investors only. Please use the main sign-in page.')
          setIsLoading(false)
          return
        }

        console.log('[LP Login] KYC Status:', response.user.kycStatus)

        // Check if KYC status is null and create DiDit session
        if (response.user.kycStatus === null) {
          console.log('[LP Login] KYC Status is null, creating DiDit session...')
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
            } else {
              console.error('[LP Login] Failed to create DiDit session:', await diditResponse.text())
            }
          } catch (diditError) {
            console.error('[LP Login] Error creating DiDit session:', diditError)
          }
        }
        // If KYC exists but is not approved, get DiDit session and open KYC URL
        else if (response.user.kycId && response.user.kycStatus !== 'Approved') {
          console.log('[LP Login] KYC pending, getting DiDit session...')
          try {
            const diditSessionResponse = await fetch(
              getApiUrl(API_CONFIG.endpoints.getDiditSession(response.user.kycId)),
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${response.token}`,
                  'Content-Type': 'application/json',
                },
              }
            )

            if (diditSessionResponse.ok) {
              const diditSessionData = await diditSessionResponse.json()
              console.log('[LP Login] DiDit session retrieved:', diditSessionData)
            } else {
              console.error('[LP Login] Failed to get DiDit session:', await diditSessionResponse.text())
            }
          } catch (diditError) {
            console.error('[LP Login] Error getting DiDit session:', diditError)
          }

          // Open KYC URL in new tab
          console.log('[LP Login] Opening KYC URL:', response.user.kycUrl)
          if (response.user.kycUrl) {
            window.open(`https://${response.user.kycUrl}`, '_blank')
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Access Portfolio'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
