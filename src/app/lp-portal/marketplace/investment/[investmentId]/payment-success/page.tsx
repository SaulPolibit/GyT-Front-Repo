"use client"

import * as React from "react"
import { use } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle2,
  Download,
  Mail,
  Home,
  FileText,
  DollarSign,
  Shield,
} from "lucide-react"
import { getInvestmentById } from "@/lib/investments-storage"
import type { Investment } from "@/lib/types"

interface Props {
  params: Promise<{ investmentId: string }>
}

export default function PaymentSuccessPage({ params }: Props) {
  const { investmentId } = use(params)
  const searchParams = useSearchParams()
  const [investment, setInvestment] = React.useState<Investment | null>(null)
  const [loading, setLoading] = React.useState(true)

  const tokens = searchParams.get("tokens") || "0"
  const email = searchParams.get("email") || "investor@demo.polibit.io"
  const amount = searchParams.get("amount") || "0"
  const transactionId = `TXN-${Date.now()}`

  React.useEffect(() => {
    const inv = getInvestmentById(investmentId)
    setInvestment(inv)
    setLoading(false)
  }, [investmentId])

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseInt(value) : value
    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
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
            <Home className="h-4 w-4 mr-2" />
            Back to Marketplace
          </a>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-semibold mb-2">Investment not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Success Hero Section */}
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-green-400/20 rounded-full blur-3xl" />
          <CheckCircle2 className="h-24 w-24 text-green-600 relative z-10" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Your investment has been completed. Thank you for investing in {investment.name}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Transaction Details */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                <p className="text-sm font-mono bg-muted p-2 rounded truncate">{transactionId}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Investment</p>
                <p className="font-semibold text-sm">{investment.name}</p>
                <Badge variant="outline" className="mt-2">
                  {investment.type}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                <p className="text-sm font-semibold">
                  {new Date().toLocaleString()}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-2 text-green-600 mt-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-semibold">Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Success Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Investment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Summary</CardTitle>
              <CardDescription>Your investment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                  <DollarSign className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Investment</p>
                    <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                  <Shield className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tokens Purchased</p>
                    <p className="text-2xl font-bold">{tokens}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Investment Details</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="font-semibold">{investment.investmentType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sector</span>
                      <span className="font-semibold">{investment.sector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Location</span>
                      <span className="font-semibold">
                        {investment.geography.city}, {investment.geography.country}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Investor Information</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono text-muted-foreground truncate">{email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A confirmation email has been sent to your email address.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>Here's what happens after your investment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Fund Subscription Confirmation</p>
                    <p className="text-xs text-muted-foreground">
                      You'll receive a formal subscription confirmation within 24 hours.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Token Issuance</p>
                    <p className="text-xs text-muted-foreground">
                      Your {tokens} tokens will be issued to your digital wallet within 3-5 business days.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-semibold text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Start Earning Returns</p>
                    <p className="text-xs text-muted-foreground">
                      Your tokens will begin accruing returns based on the fund's performance and distribution schedule.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-semibold text-sm flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Access Dashboard</p>
                    <p className="text-xs text-muted-foreground">
                      Monitor your investment, track performance, and manage your tokens from your investor dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents & Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Documents & Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Investment Agreement</p>
                  <p className="text-xs text-muted-foreground">PDF • 2.4 MB</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground ml-auto" />
              </button>

              <button className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Payment Receipt</p>
                  <p className="text-xs text-muted-foreground">PDF • 0.8 MB</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground ml-auto" />
              </button>

              <button className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Fund Documentation</p>
                  <p className="text-xs text-muted-foreground">PDF • 5.2 MB</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground ml-auto" />
              </button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" asChild>
              <a href="/lp-portal/marketplace">
                <Home className="h-4 w-4 mr-2" />
                Back to Marketplace
              </a>
            </Button>
            <Button className="flex-1" asChild>
              <a href="/investment-manager">
                Go to Dashboard
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
