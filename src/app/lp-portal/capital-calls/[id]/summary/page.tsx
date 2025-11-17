'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { IconArrowLeft, IconDownload, IconCircleCheck, IconBuildingBank } from '@tabler/icons-react'
import { getCapitalCalls } from '@/lib/capital-calls-storage'
import { getInvestorByEmail, getCurrentInvestorEmail } from '@/lib/lp-portal-helpers'
import { generateCapitalCallReceiptPDF } from '@/lib/capital-call-receipt-generator'
import { getFirmSettings } from '@/lib/firm-settings-storage'

export default function CapitalCallSummaryPage() {
  const router = useRouter()
  const params = useParams()
  const [capitalCall, setCapitalCall] = useState<any>(null)
  const [investorAllocation, setInvestorAllocation] = useState<any>(null)
  const [investorName, setInvestorName] = useState('')

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
    setInvestorName(investor.name)
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

  const handleDownloadPDF = () => {
    if (!capitalCall || !investorAllocation) return

    const firmSettings = getFirmSettings()

    generateCapitalCallReceiptPDF({
      capitalCall: {
        id: capitalCall.id,
        fundName: capitalCall.fundName,
        callNumber: capitalCall.callNumber,
        callDate: capitalCall.callDate,
        dueDate: capitalCall.dueDate,
        purpose: capitalCall.purpose,
        useOfProceeds: capitalCall.useOfProceeds,
        currency: capitalCall.currency,
      },
      investorAllocation: {
        investorName: investorName,
        investorType: investorAllocation.investorType,
        callAmount: investorAllocation.callAmount,
        amountPaid: investorAllocation.amountPaid,
        amountOutstanding: investorAllocation.amountOutstanding,
        status: investorAllocation.status,
        paidDate: investorAllocation.paidDate,
        paymentMethod: investorAllocation.paymentMethod,
        transactionReference: investorAllocation.transactionReference,
        bankDetails: investorAllocation.bankDetails,
        commitment: investorAllocation.commitment,
        calledCapitalToDate: investorAllocation.calledCapitalToDate,
        uncalledCapital: investorAllocation.uncalledCapital,
      },
      investorName: investorName,
      firmName: firmSettings.firmName,
    })
  }

  if (!capitalCall || !investorAllocation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading transaction details...</p>
        </div>
      </div>
    )
  }

  const isPaid = investorAllocation.status === 'Paid'

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <IconArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Transaction Summary</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Capital Call #{capitalCall.callNumber} - {capitalCall.fundName}
            </p>
          </div>
        </div>
        {isPaid && (
          <Button onClick={handleDownloadPDF}>
            <IconDownload className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        )}
      </div>

      {/* Payment Status Banner */}
      {isPaid && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IconCircleCheck className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">Payment Completed</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                  Your payment was successfully processed on {formatDate(investorAllocation.paidDate || capitalCall.callDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Capital Call Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capital Call Information</CardTitle>
            <CardDescription>Details of this capital call request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fund</p>
                <p className="text-sm font-medium">{capitalCall.fundName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Call Number</p>
                <p className="text-sm font-medium">#{capitalCall.callNumber}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Call Date</p>
                <p className="text-sm font-medium">{formatDate(capitalCall.callDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                <p className="text-sm font-medium">{formatDate(capitalCall.dueDate)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-1">Purpose</p>
              <p className="text-sm">{capitalCall.purpose}</p>
            </div>

            {capitalCall.useOfProceeds && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Use of Proceeds</p>
                  <Badge variant="outline">{capitalCall.useOfProceeds}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Details</CardTitle>
            <CardDescription>Your payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Investor</span>
                <span className="text-sm font-medium">{investorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Investor Type</span>
                <Badge variant="outline">{investorAllocation.investorType}</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Call Amount</span>
                <span className="text-sm font-semibold">{formatCurrency(investorAllocation.callAmount, capitalCall.currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(investorAllocation.amountPaid, capitalCall.currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Outstanding</span>
                <span className="text-sm font-semibold text-orange-600">{formatCurrency(investorAllocation.amountOutstanding, capitalCall.currency)}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={isPaid ? 'default' : 'secondary'}>{investorAllocation.status}</Badge>
              </div>
              {isPaid && investorAllocation.paidDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payment Date</span>
                  <span className="text-sm font-medium">{formatDate(investorAllocation.paidDate)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details (if paid) */}
      {isPaid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Information</CardTitle>
            <CardDescription>Payment method and transaction details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {investorAllocation.paymentMethod && (
                <div className="flex items-start gap-3">
                  <IconBuildingBank className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                    <p className="text-sm font-medium">{investorAllocation.paymentMethod}</p>
                  </div>
                </div>
              )}

              {investorAllocation.transactionReference && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Transaction Reference</p>
                  <p className="text-sm font-mono">{investorAllocation.transactionReference}</p>
                </div>
              )}
            </div>

            {investorAllocation.bankDetails && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bank Details</p>
                  <p className="text-sm">{investorAllocation.bankDetails}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Commitment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Commitment Overview</CardTitle>
          <CardDescription>Your capital commitment to this fund</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Commitment</p>
              <p className="text-lg font-semibold">{formatCurrency(investorAllocation.commitment, capitalCall.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Called to Date</p>
              <p className="text-lg font-semibold text-orange-600">{formatCurrency(investorAllocation.calledCapitalToDate || investorAllocation.amountPaid, capitalCall.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Uncalled Capital</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(investorAllocation.uncalledCapital || (investorAllocation.commitment - investorAllocation.amountPaid), capitalCall.currency)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-start items-center">
        <Button variant="outline" onClick={() => router.push('/lp-portal/capital-calls')}>
          Back to Capital Calls
        </Button>
      </div>
    </div>
  )
}
