"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)
  const [accessToken, setAccessToken] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Parse hash fragment from URL
    const hash = window.location.hash
    if (!hash) {
      setError("Invalid password reset link. Please request a new password reset.")
      return
    }

    // Remove the # and parse parameters
    const params = new URLSearchParams(hash.substring(1))
    const token = params.get("access_token")
    const expiresAt = params.get("expires_at")

    if (!token) {
      setError("Invalid password reset link. Missing access token.")
      return
    }

    // Check if token is expired
    if (expiresAt) {
      const expiryTime = parseInt(expiresAt) * 1000 // Convert to milliseconds
      if (Date.now() > expiryTime) {
        setError("This password reset link has expired. Please request a new one.")
        return
      }
    }

    setAccessToken(token)
  }, [])

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword) {
      setError("Please enter a new password")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!accessToken) {
      setError("Invalid session. Please request a new password reset link.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Call backend API to update password
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/custom/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: accessToken,
          newPassword: newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error_description || errorData.message || "Failed to reset password")
      }

      const data = await response.json()
      console.log("[Reset Password] Password updated successfully:", data)

      setSuccess(true)
      toast.success("Password reset successfully!")

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/sign-in")
      }, 2000)
    } catch (err) {
      console.error("[Reset Password] Error:", err)
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && !success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Password reset successfully! Redirecting to login...
              </AlertDescription>
            </Alert>
          )}

          {/* Password Reset Form */}
          {!success && accessToken && (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setError("")
                  }}
                  placeholder="••••••••"
                  autoFocus
                  disabled={isLoading}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setError("")
                  }}
                  placeholder="••••••••"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleResetPassword()
                    }
                  }}
                />
              </div>

              <Button
                onClick={handleResetPassword}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </>
          )}

          {/* Invalid Token State */}
          {!accessToken && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Unable to reset password. Please request a new password reset link.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/sign-in")}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
