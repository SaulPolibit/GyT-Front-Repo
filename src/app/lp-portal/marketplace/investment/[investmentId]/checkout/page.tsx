"use client"

import * as React from "react"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Shield,
  FileText,
  Building2,
} from "lucide-react"
import { getInvestmentById } from "@/lib/investments-storage"
import { getCurrentInvestorEmail } from "@/lib/lp-portal-helpers"
import { getInvestorByEmail } from "@/lib/investors-storage"
import { createInvestmentSubscription } from "@/lib/investment-subscriptions-storage"
import type { Investment } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface Props {
  params: Promise<{ investmentId: string }>
}

export default function InvestmentCheckoutPage({ params }: Props) {
  const { investmentId } = use(params)
  const { toast } = useToast()
  const [investment, setInvestment] = React.useState<Investment | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [tokenAmount, setTokenAmount] = React.useState<string>('')
  const [pricePerToken] = React.useState(1000) // $1,000 per token
  const [agreedToTerms, setAgreedToTerms] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    const inv = getInvestmentById(investmentId)
    setInvestment(inv)
    setLoading(false)
  }, [investmentId])

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const tokens = parseInt(tokenAmount) || 0
  const totalCost = tokens * pricePerToken
  const isFormValid = tokens > 0 && agreedToTerms

  const handleSignContracts = async () => {
    if (!isFormValid || !investment) return

    setIsSubmitting(true)
    try {
      // Get current investor email
      const investorEmail = getCurrentInvestorEmail()

      // Generate random suffix for unique demo contracts (email+randomnumber@domain.com)
      const randomSuffix = Math.floor(Math.random() * 1000000)
      const [localPart, domain] = investorEmail.includes('@')
        ? investorEmail.split('@')
        : [investorEmail, '']
      const uniqueEmail = domain
        ? `${localPart}+${randomSuffix}@${domain}`
        : `${investorEmail}+${randomSuffix}`

      // Redirect to contracts page with investment details as query params
      const contractsUrl = `/lp-portal/marketplace/${investmentId}/contracts?tokens=${tokens}&email=${encodeURIComponent(uniqueEmail)}&amount=${totalCost}`
      window.location.href = contractsUrl
    } catch (error) {
      console.error('Navigation error:', error)
      toast({
        title: "Error",
        description: "Failed to navigate to contracts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" asChild>
          <a href={`/lp-portal/marketplace/${investmentId}`}>
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <a href={`/lp-portal/marketplace/${investmentId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Investment
        </a>
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Investment Summary */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">{investment.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-2">
                <Building2 className="h-4 w-4" />
                {investment.type}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Price per Token</p>
                <p className="text-2xl font-bold">{formatCurrency(pricePerToken)}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Your Investment</p>
                <p className="text-3xl font-bold text-primary">
                  {tokens > 0 ? `${tokens} Tokens` : '0'}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(totalCost)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Checkout Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Investment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sector</p>
                  <Badge variant="outline">{investment.sector}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge variant="default">{investment.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="text-sm font-semibold">
                    {investment.geography.city}, {investment.geography.country}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Investment Type</p>
                  <p className="text-sm font-semibold">{investment.investmentType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Purchase Form */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Tokens</CardTitle>
              <CardDescription>Select the number of tokens you want to purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="token-amount">Number of Tokens</Label>
                <div className="relative">
                  <Input
                    id="token-amount"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="1"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    className="text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    tokens
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Each token costs {formatCurrency(pricePerToken)}
                </p>
              </div>

              {tokens > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Subtotal ({tokens} tokens)</span>
                      <span className="font-semibold">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fees</span>
                      <span className="font-semibold">{formatCurrency(0)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold">Total Amount</span>
                      <span className="font-bold text-primary">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Legal Agreement</CardTitle>
              <CardDescription>Review and accept the investment terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Terms Summary */}
              <div className="space-y-4">
                <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Investment Agreement</p>
                    <p className="text-xs text-muted-foreground">
                      You agree to the terms and conditions of this investment opportunity, including fund management fees, distribution policies, and investor rights.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                  <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Confidentiality & Compliance</p>
                    <p className="text-xs text-muted-foreground">
                      You confirm that your information is accurate and that you comply with all applicable laws, including KYC/AML requirements.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-primary/5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="terms" className="text-sm cursor-pointer">
                  <span className="font-semibold">I agree to the Investment Agreement and Confidentiality Terms</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    By proceeding, you acknowledge that you have read and understood the investment terms and agree to be bound by them.
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" asChild>
              <a href={`/lp-portal/marketplace/${investmentId}`}>
                Cancel
              </a>
            </Button>
            <Button
              className="flex-1"
              size="lg"
              disabled={!isFormValid || isSubmitting}
              onClick={handleSignContracts}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Proceeding to Contracts...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Continue to Sign Contracts
                </>
              )}
            </Button>
          </div>

          {/* Info Message */}
          {!agreedToTerms && tokens > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex gap-3 pt-6">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Please agree to the terms and conditions to proceed with your investment request.
                </p>
              </CardContent>
            </Card>
          )}

          {tokens === 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="flex gap-3 pt-6">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Enter the number of tokens you want to purchase to see the total amount and submit your investment request.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
