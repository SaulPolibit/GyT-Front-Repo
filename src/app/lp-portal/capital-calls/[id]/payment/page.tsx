'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { IconArrowLeft, IconCreditCard, IconBuildingBank, IconCurrencyBitcoin, IconAlertCircle, IconCircleCheck, IconCalendar, IconFileText } from '@tabler/icons-react'
import { getCapitalCalls, updateInvestorPayment } from '@/lib/capital-calls-storage'
import { getInvestorByEmail, getCurrentInvestorEmail } from '@/lib/lp-portal-helpers'

type PaymentMethod = 'bank' | 'card' | 'crypto'

export default function CapitalCallPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const [capitalCall, setCapitalCall] = useState<any>(null)
  const [investorAllocation, setInvestorAllocation] = useState<any>(null)
  const [investorId, setInvestorId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank')
  const [isProcessing, setIsProcessing] = useState(false)

  const [bankFormData, setBankFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
  })

  useEffect(() => {
    const email = getCurrentInvestorEmail()
    const investor = getInvestorByEmail(email)

    if (!investor) {
      router.push('/lp-portal/capital-calls')
      return
    }

    const allCapitalCalls = getCapitalCalls()
    const call = allCapitalCalls.find(c => c.id === params.id)

    if (!call) {
      router.push('/lp-portal/capital-calls')
      return
    }

    const allocation = call.investorAllocations.find(a => a.investorId === investor.id)

    if (!allocation) {
      router.push('/lp-portal/capital-calls')
      return
    }

    setCapitalCall(call)
    setInvestorAllocation(allocation)
    setInvestorId(investor.id)

    // Pre-fill account holder name
    setBankFormData(prev => ({
      ...prev,
      accountHolderName: investor.name
    }))
  }, [params.id, router])

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleBankPayment = async () => {
    if (!bankFormData.accountHolderName || !bankFormData.bankName || !bankFormData.accountNumber || !bankFormData.routingNumber) {
      toast.error('Please fill in all bank account fields')
      return
    }

    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      // Update payment in localStorage
      const bankDetails = `${bankFormData.bankName} - Account ending in ${bankFormData.accountNumber.slice(-4)}`
      const updated = updateInvestorPayment(
        capitalCall.id,
        investorId,
        investorAllocation.callAmount,
        {
          paymentMethod: 'Bank Transfer / ACH',
          transactionReference: `ACH-${Date.now()}`,
          bankDetails: bankDetails
        }
      )

      setIsProcessing(false)

      if (updated) {
        toast.success('Payment submitted successfully! Your bank transfer is being processed.')
        // Force a full page reload to ensure fresh data
        window.location.href = '/lp-portal/capital-calls'
      } else {
        toast.error('Error processing payment. Please try again.')
      }
    }, 2000)
  }

  const handleCardPayment = () => {
    setIsProcessing(true)
    // Redirect to Stripe for credit card payment
    setTimeout(() => {
      toast.info('Redirecting to Stripe for credit card payment...')
      // In production: window.location.href = stripeCheckoutUrl
      setIsProcessing(false)
    }, 1000)
  }

  const handleCryptoPayment = () => {
    setIsProcessing(true)
    // Redirect to Stripe or crypto payment provider
    setTimeout(() => {
      toast.info('Redirecting to crypto payment gateway...')
      // In production: window.location.href = cryptoPaymentUrl
      setIsProcessing(false)
    }, 1000)
  }

  const handleSubmitPayment = () => {
    if (paymentMethod === 'bank') {
      handleBankPayment()
    } else if (paymentMethod === 'card') {
      handleCardPayment()
    } else if (paymentMethod === 'crypto') {
      handleCryptoPayment()
    }
  }

  if (!capitalCall || !investorAllocation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    )
  }

  const isOverdue = new Date(capitalCall.dueDate) < new Date()

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <IconArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Complete Payment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capital Call #{capitalCall.callNumber} - {capitalCall.fundName}
          </p>
        </div>
      </div>

      {/* Overdue Alert */}
      {isOverdue && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Payment Overdue:</strong> This capital call was due on {formatDate(capitalCall.dueDate)}. Please complete payment as soon as possible.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Summary</CardTitle>
            <CardDescription>Review the details of this capital call</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Fund</span>
                <span className="text-sm font-medium">{capitalCall.fundName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Call Number</span>
                <span className="text-sm font-medium">#{capitalCall.callNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Call Date</span>
                <span className="text-sm font-medium">{formatDate(capitalCall.callDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Due Date</span>
                <span className="text-sm font-medium">{formatDate(capitalCall.dueDate)}</span>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-2">Purpose</p>
              <p className="text-sm">{capitalCall.purpose}</p>
            </div>

            <Separator />

            <div className="space-y-2 bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount Due</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(investorAllocation.callAmount, capitalCall.currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Payment Method</CardTitle>
            <CardDescription>Choose how you'd like to pay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="bank" id="bank" />
                <div className="flex-1">
                  <Label htmlFor="bank" className="font-medium cursor-pointer flex items-center gap-2">
                    <IconBuildingBank className="w-4 h-4" />
                    Bank Account / ACH
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Most common method. Direct bank transfer (3-5 business days)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="card" id="card" />
                <div className="flex-1">
                  <Label htmlFor="card" className="font-medium cursor-pointer flex items-center gap-2">
                    <IconCreditCard className="w-4 h-4" />
                    Credit Card
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instant payment via Stripe (processing fees may apply)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="crypto" id="crypto" />
                <div className="flex-1">
                  <Label htmlFor="crypto" className="font-medium cursor-pointer flex items-center gap-2">
                    <IconCurrencyBitcoin className="w-4 h-4" />
                    Cryptocurrency
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pay with Bitcoin, Ethereum, or USDC via Stripe
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Bank Account Form */}
      {paymentMethod === 'bank' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bank Account Details</CardTitle>
            <CardDescription>Enter your bank account information for ACH transfer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input
                  id="accountHolderName"
                  value={bankFormData.accountHolderName}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountHolderName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={bankFormData.bankName}
                  onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                  placeholder="Chase Bank"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  value={bankFormData.accountNumber}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                  placeholder="1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="routingNumber">Routing Number *</Label>
                <Input
                  id="routingNumber"
                  type="text"
                  value={bankFormData.routingNumber}
                  onChange={(e) => setBankFormData({ ...bankFormData, routingNumber: e.target.value })}
                  placeholder="021000021"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <RadioGroup
                  value={bankFormData.accountType}
                  onValueChange={(value) => setBankFormData({ ...bankFormData, accountType: value })}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="checking" id="checking" />
                      <Label htmlFor="checking" className="font-normal cursor-pointer">
                        Checking
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="savings" id="savings" />
                      <Label htmlFor="savings" className="font-normal cursor-pointer">
                        Savings
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <Alert>
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>
                Bank transfers typically take 3-5 business days to process. Your payment will be confirmed once the transfer is complete.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Payment Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={() => router.back()} disabled={isProcessing}>
          Cancel
        </Button>
        <Button onClick={handleSubmitPayment} disabled={isProcessing} size="lg">
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <IconCircleCheck className="w-4 h-4 mr-2" />
              {paymentMethod === 'bank' ? 'Submit Bank Transfer' :
               paymentMethod === 'card' ? 'Pay with Credit Card' :
               'Pay with Crypto'}
            </>
          )}
        </Button>
      </div>

      {/* Security Notice */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <IconCircleCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Secure Payment Processing</p>
              <p>Your payment information is encrypted and processed securely. We never store your full bank account or card details.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
