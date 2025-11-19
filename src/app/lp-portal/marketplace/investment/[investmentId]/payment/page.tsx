"use client"

import * as React from "react"
import { use } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  AlertCircle,
  Check,
  CreditCard,
  Lock,
  Coins,
  Wallet,
  Upload,
  File,
  Loader2,
} from "lucide-react"
import { getInvestmentById } from "@/lib/investments-storage"
import { getCurrentInvestorEmail, getInvestorByEmail } from "@/lib/lp-portal-helpers"
import { createInvestmentSubscription, updateInvestmentSubscriptionStatus } from "@/lib/investment-subscriptions-storage"
import { addFundOwnershipToInvestor } from "@/lib/investors-storage"
import type { Investment } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface Props {
  params: Promise<{ investmentId: string }>
}

export default function PaymentPage({ params }: Props) {
  const { investmentId } = use(params)
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [investment, setInvestment] = React.useState<Investment | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [cardNumber, setCardNumber] = React.useState("")
  const [cardName, setCardName] = React.useState("")
  const [cardExpiry, setCardExpiry] = React.useState("")
  const [cardCVC, setCardCVC] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState("credit-card")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [paymentComplete, setPaymentComplete] = React.useState(false)
  const [bankTransferReceipt, setBankTransferReceipt] = React.useState<File | null>(null)
  const [usdcWalletAddress, setUsdcWalletAddress] = React.useState("")
  const [receiptFileName, setReceiptFileName] = React.useState("")

  const tokens = searchParams.get("tokens") || "0"
  const email = searchParams.get("email") || "investor@demo.polibit.io"
  const amount = searchParams.get("amount") || "0"

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

  const isFormValid = () => {
    if (paymentMethod === "credit-card") {
      return cardNumber.length >= 13 && cardName.length > 0 && cardExpiry.length === 5 && cardCVC.length === 3
    }
    if (paymentMethod === "usdc") {
      return usdcWalletAddress.length > 0
    }
    if (paymentMethod === "bank-transfer") {
      return bankTransferReceipt !== null
    }
    return false
  }

  const handlePayment = async () => {
    if (!isFormValid() || !investment) return

    setIsProcessing(true)
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Get current investor
      const investorEmail = getCurrentInvestorEmail()
      const investor = investorEmail ? getInvestorByEmail(investorEmail) : null

      if (!investor) {
        throw new Error('Investor not found. Please log in again.')
      }

      // Create investment subscription (records the purchase request)
      const subscription = createInvestmentSubscription({
        investmentId: investment.id,
        investorId: investor.id,
        fundId: investment.fundId,
        requestedAmount: parseInt(amount),
        currency: 'USD',
        status: 'pending',
      })

      console.log('Subscription created:', subscription.id)

      // Auto-approve the subscription and link investor to fund
      updateInvestmentSubscriptionStatus(subscription.id, 'approved', 'Auto-approved via marketplace purchase')

      // Add fund ownership to investor (this is what shows in their portfolio!)
      const ownershipAdded = addFundOwnershipToInvestor(
        investor.id,
        investment.fundId,
        parseInt(amount) // commitment amount
      )

      if (!ownershipAdded) {
        console.warn('Could not add fund ownership - investor may already have this fund')
      } else {
        console.log('Investor linked to fund successfully')
      }

      setPaymentComplete(true)

      // Show success toast
      toast({
        title: "✅ Payment Successful!",
        description: `You've successfully invested ${tokens} tokens for ${formatCurrency(amount)} in ${investment.name}. The fund has been added to your portfolio.`,
        variant: "default",
      })

      console.log('✅ Payment successful, redirecting to portfolio...')

      // Redirect to portfolio after a short delay
      setTimeout(() => {
        window.location.href = `/lp-portal/portfolio`
      }, 1500)
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const formatted = cleaned.replace(/(\d{4})/g, "$1 ").trim()
    return formatted.slice(0, 19)
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
    }
    return cleaned
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" asChild>
          <a href={`/lp-portal/marketplace/${investmentId}/contracts`}>
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
        <a href={`/lp-portal/marketplace/${investmentId}/contracts`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contract Signing
        </a>
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Order Summary */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Investment</p>
                <p className="font-semibold text-sm">{investment.name}</p>
                <Badge variant="outline" className="mt-2">
                  {investment.type}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tokens ({tokens})</span>
                  <span className="font-semibold">${(parseInt(amount) - 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Processing Fee</span>
                  <span className="font-semibold">$0</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">{formatCurrency(amount)}</span>
                </div>
              </div>
              {paymentComplete && (
                <div className="flex items-center gap-2 text-green-600 pt-2">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-semibold">Payment Complete</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Select how you'd like to pay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" style={{ borderColor: paymentMethod === "credit-card" ? "oklch(0.2521 0.1319 280.76)" : undefined, backgroundColor: paymentMethod === "credit-card" ? "oklch(0.2521 0.1319 280.76 / 0.05)" : undefined }}>
                  <input
                    type="radio"
                    value="credit-card"
                    checked={paymentMethod === "credit-card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                  />
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-semibold text-sm">Credit or Debit Card</p>
                      <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" style={{ borderColor: paymentMethod === "usdc" ? "oklch(0.2521 0.1319 280.76)" : undefined, backgroundColor: paymentMethod === "usdc" ? "oklch(0.2521 0.1319 280.76 / 0.05)" : undefined }}>
                  <input
                    type="radio"
                    value="usdc"
                    checked={paymentMethod === "usdc"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                  />
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    <div>
                      <p className="font-semibold text-sm">USDC - Stablecoin</p>
                      <p className="text-xs text-muted-foreground">Pay with USDC on blockchain</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" style={{ borderColor: paymentMethod === "bank-transfer" ? "oklch(0.2521 0.1319 280.76)" : undefined, backgroundColor: paymentMethod === "bank-transfer" ? "oklch(0.2521 0.1319 280.76 / 0.05)" : undefined }}>
                  <input
                    type="radio"
                    value="bank-transfer"
                    checked={paymentMethod === "bank-transfer"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                  />
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    <div>
                      <p className="font-semibold text-sm">Bank Transfer</p>
                      <p className="text-xs text-muted-foreground">Upload receipt after transfer</p>
                    </div>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Card Details Form */}
          {paymentMethod === "credit-card" && (
            <Card>
              <CardHeader>
                <CardTitle>Card Details</CardTitle>
                <CardDescription>Enter your card information securely</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="card-name">Cardholder Name</Label>
                  <Input
                    id="card-name"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                  <p className="text-xs text-muted-foreground">No actual charges will be made in demo mode</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-expiry">Expiry Date</Label>
                    <Input
                      id="card-expiry"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-cvc">CVC</Label>
                    <Input
                      id="card-cvc"
                      placeholder="123"
                      type="password"
                      value={cardCVC}
                      onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      maxLength={3}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Your card information is secure and encrypted</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* USDC Wallet Address Form */}
          {paymentMethod === "usdc" && (
            <Card>
              <CardHeader>
                <CardTitle>USDC Payment Details</CardTitle>
                <CardDescription>Send USDC to the provided wallet address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="usdc-address">Your Wallet Address</Label>
                  <Input
                    id="usdc-address"
                    placeholder="0x742d35Cc6634C0532925a3b844Bc51e39552b97e"
                    value={usdcWalletAddress}
                    onChange={(e) => setUsdcWalletAddress(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your Ethereum/Polygon wallet address where USDC will be received
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Send Payment</p>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>Amount:</strong> {amount} USDC</p>
                    <p><strong>Network:</strong> Ethereum or Polygon</p>
                    <p className="text-xs">Use the wallet address you provided above as recipient.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Blockchain transactions are immutable and secure</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bank Transfer Receipt Upload */}
          {paymentMethod === "bank-transfer" && (
            <Card>
              <CardHeader>
                <CardTitle>Bank Transfer Receipt</CardTitle>
                <CardDescription>Upload a screenshot or PDF of your bank transfer receipt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-amber-900 mb-2">Bank Details</p>
                    <div className="space-y-1 text-sm text-amber-800">
                      <p><strong>Account Name:</strong> Polibit Investment Fund</p>
                      <p><strong>Account Number:</strong> ••••••••5432</p>
                      <p><strong>Routing Number:</strong> 021000021</p>
                      <p><strong>Amount:</strong> ${amount}</p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="file"
                      id="receipt-upload"
                      accept=".pdf,.png,.jpg,.jpeg,.gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setBankTransferReceipt(file)
                          setReceiptFileName(file.name)
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      {bankTransferReceipt ? (
                        <>
                          <File className="h-8 w-8 text-green-600" />
                          <p className="text-sm font-semibold text-green-700">{receiptFileName}</p>
                          <p className="text-xs text-muted-foreground">Click to change file</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm font-semibold">Click to upload receipt</p>
                          <p className="text-xs text-muted-foreground">PDF, PNG, JPG, GIF (max 10MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Confirm Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex gap-3 p-4 border rounded-lg bg-muted/30">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    By clicking "Complete Payment", you agree to the payment terms and understand that your investment will be processed immediately.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" asChild disabled={isProcessing}>
                  <a href={`/lp-portal/marketplace/${investmentId}/contracts`}>
                    Cancel
                  </a>
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  disabled={!isFormValid() || isProcessing || paymentComplete}
                  onClick={handlePayment}
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Processing Payment...
                    </>
                  ) : paymentComplete ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Payment Complete
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Complete Payment - {formatCurrency(amount)}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
