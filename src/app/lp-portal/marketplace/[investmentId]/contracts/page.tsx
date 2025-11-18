"use client"

import * as React from "react"
import { use, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle, Check, Loader2 } from "lucide-react"
import { getInvestmentById } from "@/lib/investments-storage"
import type { Investment } from "@/lib/types"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "docuseal-form": any
    }
  }
}

interface Props {
  params: Promise<{ investmentId: string }>
}

export default function ContractsSigningPage({ params }: Props) {
  const { investmentId } = use(params)
  const searchParams = useSearchParams()
  const [investment, setInvestment] = React.useState<Investment | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isSigned, setIsSigned] = React.useState(false)
  const [isChecking, setIsChecking] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const tokens = searchParams.get("tokens") || "0"
  const email = searchParams.get("email") || "investor@demo.polibit.io"
  const amount = searchParams.get("amount") || "0"

  React.useEffect(() => {
    const inv = getInvestmentById(investmentId)
    setInvestment(inv)
    setLoading(false)
  }, [investmentId])

  // Load DocuSeal script
  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src="https://cdn.docuseal.com/js/form.js"]')) {
      console.log("DocuSeal script already loaded")
      return
    }

    // Load DocuSeal script to document head
    const script = document.createElement("script")
    script.src = "https://cdn.docuseal.com/js/form.js"
    script.async = true
    script.onload = () => {
      console.log("DocuSeal script loaded successfully")
    }
    script.onerror = () => {
      console.error("Failed to load DocuSeal script")
    }
    document.head.appendChild(script)

    return () => {
      // Don't remove the script to avoid reloading it on every render
    }
  }, [])

  // Listen for DocuSeal completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("Message event received:", event.data, event.origin)

      // Log all messages for debugging
      if (event.origin && event.origin.includes("docuseal")) {
        console.log("DocuSeal message:", JSON.stringify(event.data))
      }

      // Check if message is from DocuSeal
      if (event.origin && event.origin.includes("docuseal")) {
        if (event.data?.status === "completed" ||
            event.data?.type === "completed" ||
            event.data?.completed ||
            event.data?.submission_completed ||
            event.data?.form === "completed" ||
            (typeof event.data === "string" && event.data.includes("completed"))) {
          console.log("Document signed via postMessage!")
          setIsSigned(true)
        }
      }
    }

    // Expose a manual trigger for testing - can be called from browser console
    // Type this in the browser console: window.markAsSigned()
    (window as any).markAsSigned = () => {
      console.log("Manually marked as signed - Status updated!")
      setIsSigned(true)
    }

    window.addEventListener("message", handleMessage, false)

    // Watch for DOM mutations that indicate signing is complete
    const observer = new MutationObserver((mutations) => {
      // Check if the form shows a completion/thank you message
      const formContainer = containerRef.current
      if (formContainer) {
        const text = formContainer.innerText || formContainer.textContent || ""
        const lowerText = text.toLowerCase()

        // Check for completion indicators
        const completionIndicators = [
          "thank you",
          "completado",
          "firmado",
          "ya ha sido enviado",
          "formulario ya ha sido",
          "documento",
          "listo",
          "enviar",
          "completed",
          "signed",
          "success"
        ]

        const isCompleted = completionIndicators.some(indicator => lowerText.includes(indicator))

        if (text && isCompleted) {
          console.log("Detected signing completion in DOM:", text.substring(0, 100))
          setIsSigned(true)
        }
      }
    })

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }

    return () => {
      window.removeEventListener("message", handleMessage)
      observer.disconnect()
    }
  }, [])

  const handleProceedToPayment = () => {
    setIsChecking(true)
    // Redirect to payment page
    setTimeout(() => {
      window.location.href = `/lp-portal/marketplace/${investmentId}/payment?tokens=${tokens}&email=${encodeURIComponent(email)}&amount=${amount}`
    }, 500)
  }

  const handleCheckSigningStatus = async () => {
    setIsChecking(true)
    try {
      // Simulate checking with DocuSeal API
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log("Signature verified!")

      // Automatically redirect to payment page after verification
      setTimeout(() => {
        window.location.href = `/lp-portal/marketplace/${investmentId}/payment?tokens=${tokens}&email=${encodeURIComponent(email)}&amount=${amount}`
      }, 500)
    } catch (error) {
      console.error("Failed to verify signature:", error)
      setIsChecking(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" asChild>
          <a href={`/lp-portal/marketplace/${investmentId}/checkout`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </a>
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!investment) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" asChild>
          <a href="/lp-portal/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </a>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Investment not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 h-screen flex flex-col overflow-hidden">
      <div className="grid gap-6 md:grid-cols-4 flex-1 overflow-hidden">
        {/* Left Column - Summary */}
        <div className="md:col-span-1 flex flex-col min-h-0">
          <Card className="flex flex-col h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">Contract Summary</CardTitle>
              </div>
              <Button variant="ghost" asChild className="w-full justify-start -ml-4 mt-2">
                <a href={`/lp-portal/marketplace/${investmentId}/checkout`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Checkout
                </a>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Investment</p>
                <p className="font-semibold text-sm">{investment.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Tokens</p>
                <p className="text-2xl font-bold text-primary">{tokens}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">${amount}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Status</p>
                {isSigned ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-semibold">Signed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-semibold">Pending</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - DocuSeal Form */}
        <div className="md:col-span-3 flex flex-col min-h-0 overflow-hidden">
          <Card className="flex flex-col flex-1 min-h-0">
            <CardHeader className="pb-3">
              <CardTitle>Sign Investment Agreement</CardTitle>
              <CardDescription>
                Please review and sign the investment agreement using the form below
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 min-h-0 gap-3 pt-0 overflow-y-auto">
              {/* DocuSeal Embed */}
              <div ref={containerRef} className="border rounded-lg overflow-y-auto bg-muted/30 flex-1 min-h-0">
                {/* @ts-ignore - DocuSeal is a custom web component */}
                <docuseal-form
                  data-src="https://docuseal.com/d/tmbNrqj1TzQoPR"
                  data-email={email}
                  data-language="es"
                  data-values={JSON.stringify({
                    Nombre2: "Martha Mena",
                    Email: email,
                    Email2: email,
                    Nombre: "Martha Mena",
                    Nombre4: "Martha Mena",
                    Nombre3: "Martha Mena",
                    Cantidad: tokens,
                    Cantidad2: tokens,
                  })}
                  data-read-only-fields={JSON.stringify(["Nombre2", "Email", "Email2", "Nombre", "Nombre4", "Nombre3", "Cantidad2", "Cantidad"])}
                  className="w-full h-full"
                />
              </div>

              {/* Status Alert - Compact */}
              {!isSigned && (
                <div className="flex gap-2 p-3 border border-amber-200 bg-amber-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Complete signing the agreement to proceed to payment.
                  </p>
                </div>
              )}

              {isSigned && (
                <div className="flex gap-2 p-3 border border-green-200 bg-green-50 rounded-lg">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800">
                    Document signed! Ready to proceed to payment.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                {!isSigned ? (
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={isChecking}
                    onClick={handleCheckSigningStatus}
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying Signature...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Verify Signature
                      </>
                    )}
                  </Button>
                ) : null}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`/lp-portal/marketplace/${investmentId}/checkout`}>
                      Cancel
                    </a>
                  </Button>
                  <Button
                    className="flex-1"
                    size="lg"
                    disabled={!isSigned || isChecking}
                    onClick={handleProceedToPayment}
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
