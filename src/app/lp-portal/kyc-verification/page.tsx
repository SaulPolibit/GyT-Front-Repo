"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, ArrowLeft, Shield } from "lucide-react"
import { getCurrentUser } from "@/lib/auth-storage"

export default function KYCVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/lp-portal/marketplace'
  const user = getCurrentUser()

  // Handle navigation back
  const handleGoBack = () => {
    router.push(returnUrl)
  }

  // If user is already approved, show success message
  if (user && user.kycStatus === 'Approved') {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
            <p className="text-muted-foreground">Identity verification status</p>
          </div>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
              <div>
                <CardTitle className="text-lg text-green-900">KYC Verification Complete</CardTitle>
                <CardDescription className="text-green-800 mt-1">
                  Your identity has been verified and approved. You can now access all investment features.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoBack}>
              Continue to Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user has no KYC URL, show error
  if (!user?.kycUrl) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
            <p className="text-muted-foreground">Identity verification</p>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
              <div>
                <CardTitle className="text-lg text-red-900">Verification Not Available</CardTitle>
                <CardDescription className="text-red-800 mt-1">
                  KYC verification session could not be found. Please try logging out and logging back in, or contact support.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleGoBack}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show KYC verification iframe
  return (
    <div className="space-y-6 p-4 md:p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complete KYC Verification</h1>
          <p className="text-muted-foreground">
            Verify your identity to access investment features
          </p>
        </div>
      </div>

      {/* Info Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex gap-3 py-4">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Secure Identity Verification</p>
            <p className="text-sm text-blue-800">
              Please complete the verification form below. You may be asked to:
            </p>
            <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc space-y-1">
              <li>Upload a government-issued ID (passport, driver's license, etc.)</li>
              <li>Take a selfie for liveness verification</li>
              <li>Provide personal information</li>
            </ul>
            <p className="text-xs text-blue-700 mt-2">
              Current status: <span className="font-semibold">{user.kycStatus || 'Not started'}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KYC iFrame */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>Identity Verification Form</CardTitle>
          <CardDescription>
            Complete the form below to verify your identity
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0">
          <iframe
            src={user.kycUrl.startsWith('http') ? user.kycUrl : `https://${user.kycUrl}`}
            className="w-full h-full border-0"
            title="KYC Verification"
            allow="camera; microphone"
          />
        </CardContent>
      </Card>

      {/* Footer Note */}
      <Card className="border-muted">
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground text-center">
            After completing verification, you may need to refresh this page or log out and log back in to see the updated status.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
