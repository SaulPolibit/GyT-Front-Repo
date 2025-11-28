"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { getRedirectPath } from "@/lib/auth-storage"
import { toast } from "sonner"
import Link from "next/link"

export default function SignUpPage() {
  const [email, setEmail] = React.useState('')
  const [name, setName] = React.useState('')
  const [role, setRole] = React.useState<'investment-manager' | 'lp-portal'>('investment-manager')
  const router = useRouter()
  const { login, isLoggedIn } = useAuth()

  // If already logged in, redirect
  React.useEffect(() => {
    if (isLoggedIn) {
      router.push(getRedirectPath(role))
    }
  }, [isLoggedIn, role, router])

  const handleSignUp = () => {
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    if (!name) {
      toast.error('Please enter your name')
      return
    }

    // Create account and login the user
    login({ email, name, role })

    toast.success(`Account created! Welcome, ${name}!`)

    // Redirect to appropriate dashboard
    router.push(getRedirectPath(role))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>
            Get started with Polibit platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label>I am a...</Label>
            <RadioGroup value={role} onValueChange={(value) => setRole(value as typeof role)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="investment-manager" id="investment-manager" />
                <Label htmlFor="investment-manager" className="font-normal cursor-pointer">
                  Fund Manager / GP
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lp-portal" id="lp-portal" />
                <Label htmlFor="lp-portal" className="font-normal cursor-pointer">
                  Investor / LP
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleSignUp} className="w-full">
            Create Account
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
