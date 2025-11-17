"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { getInvestorByEmail, setCurrentInvestorEmail } from "@/lib/lp-portal-helpers"
import { toast } from "sonner"

export default function LPLoginPage() {
  const [email, setEmail] = React.useState('')
  const router = useRouter()

  const handleLogin = () => {
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    const investor = getInvestorByEmail(email)
    if (!investor) {
      toast.error('No investor found with this email. Please contact your fund administrator.')
      return
    }

    setCurrentInvestorEmail(email)
    toast.success(`Welcome, ${investor.name}!`)
    router.push('/lp-portal/portfolio')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Investor Portal</CardTitle>
          <CardDescription>
            Enter your email to access your portfolio
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
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="investor@example.com"
              autoFocus
            />
          </div>

          <Button onClick={handleLogin} className="w-full">
            Access Portfolio
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">Demo Investors:</p>
            <div className="space-y-1">
              <button
                onClick={() => setEmail('contact@acmecap.com')}
                className="block text-primary hover:underline w-full text-center"
              >
                Acme Capital Partners
              </button>
              <button
                onClick={() => setEmail('investments@globalwealth.com')}
                className="block text-primary hover:underline w-full text-center"
              >
                Global Wealth Management
              </button>
              <button
                onClick={() => setEmail('team@pacifictech.vc')}
                className="block text-primary hover:underline w-full text-center"
              >
                Pacific Tech Ventures
              </button>
              <button
                onClick={() => setEmail('info@euinfra.eu')}
                className="block text-primary hover:underline w-full text-center"
              >
                European Infrastructure Fund
              </button>
              <button
                onClick={() => setEmail('admin@mxpension.mx')}
                className="block text-primary hover:underline w-full text-center"
              >
                Mexican Pension Fund
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
