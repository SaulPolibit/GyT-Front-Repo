"use client"

import * as React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, ShieldCheck, X } from "lucide-react"
import { getCurrentUser } from "@/lib/auth-storage"

export function KycVerificationBanner() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isDismissed, setIsDismissed] = React.useState(false)
  const user = getCurrentUser()

  // Check if user needs KYC verification
  // Only show for role 3 (investors) with incomplete KYC
  const needsKyc = user &&
    user.role === 3 &&
    user.kycStatus !== 'Approved' &&
    user.kycUrl

  // Don't show if dismissed or not needed
  if (!needsKyc || isDismissed) {
    return null
  }

  return (
    <>
      <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <AlertTitle className="text-amber-900 dark:text-amber-100 mb-1">
                KYC Verification Required
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200 mb-3">
                Please complete your KYC (Know Your Customer) verification to access all platform features.
              </AlertDescription>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Complete Verification
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsDismissed(true)}
                  className="text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/20"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>

      {/* KYC Verification Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Complete KYC Verification
            </DialogTitle>
            <DialogDescription>
              Please complete the verification form below to gain access to all platform features.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <iframe
              src={user.kycUrl?.startsWith('http') ? user.kycUrl : `https://${user.kycUrl}`}
              className="w-full h-full border-0 rounded-md"
              title="KYC Verification"
              allow="camera; microphone"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
