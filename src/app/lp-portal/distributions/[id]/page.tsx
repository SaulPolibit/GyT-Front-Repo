'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  IconArrowLeft,
  IconTrendingUp,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconCalendar,
  IconCurrencyDollar,
  IconFileText,
  IconBuilding,
  IconUser
} from '@tabler/icons-react'
import { getDistributionById } from '@/lib/distributions-storage'
import { getInvestorByEmail, getCurrentInvestorEmail } from '@/lib/lp-portal-helpers'
import { getStructureById } from '@/lib/structures-storage'
import { useBreadcrumb } from '@/contexts/lp-breadcrumb-context'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function DistributionDetailsPage({ params }: PageProps) {
  const router = useRouter()
  const { setCustomBreadcrumb, clearCustomBreadcrumb } = useBreadcrumb()
  const [distributionId, setDistributionId] = useState<string>('')
  const [distribution, setDistribution] = useState<any>(null)
  const [myAllocation, setMyAllocation] = useState<any>(null)
  const [structure, setStructure] = useState<any>(null)
  const [investor, setInvestor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => {
      setDistributionId(id)
      loadData(id)
    })
  }, [params])

  useEffect(() => {
    return () => {
      if (distributionId) {
        clearCustomBreadcrumb(`/lp-portal/distributions/${distributionId}`)
      }
    }
  }, [distributionId, clearCustomBreadcrumb])

  const loadData = (id: string) => {
    setLoading(true)

    const email = getCurrentInvestorEmail()
    const investorData = getInvestorByEmail(email)

    if (!investorData) {
      setLoading(false)
      return
    }

    setInvestor(investorData)

    const dist = getDistributionById(id)

    if (!dist) {
      setLoading(false)
      return
    }

    setDistribution(dist)

    // Update document title and breadcrumb
    const pageTitle = `Distribution #${dist.distributionNumber} - ${dist.fundName}`
    document.title = pageTitle
    setCustomBreadcrumb(`/lp-portal/distributions/${id}`, pageTitle)

    // Find investor's allocation
    const allocation = dist.investorAllocations.find(
      (alloc: any) => alloc.investorId === investorData.id
    )

    setMyAllocation(allocation)

    // Get structure details
    const structureData = getStructureById(dist.fundId)
    setStructure(structureData)

    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      'Pending': { variant: 'secondary', icon: IconClock },
      'Processing': { variant: 'outline', icon: IconClock },
      'Completed': { variant: 'default', icon: IconCircleCheck },
      'Failed': { variant: 'destructive', icon: IconCircleX },
    }

    const config = statusConfig[status] || { variant: 'secondary' as const, icon: IconClock }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading distribution details...</p>
        </div>
      </div>
    )
  }

  if (!distribution || !myAllocation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <IconCircleX className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Distribution Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The distribution you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/lp-portal/distributions')}>
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back to Distributions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/lp-portal/distributions')}
        >
          <IconArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Distribution #{distribution.distributionNumber} - {distribution.fundName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View details and breakdown of your distribution
          </p>
        </div>
        {myAllocation && getStatusBadge(myAllocation.status)}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal flex items-center gap-2">
              <IconCurrencyDollar className="w-4 h-4" />
              My Distribution
            </CardDescription>
            <CardTitle className="text-2xl font-semibold text-green-600">
              {formatCurrency(myAllocation.finalAllocation, distribution.currency)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {myAllocation.ownershipPercent.toFixed(2)}% ownership
            </p>
          </CardContent>
        </Card>

        {distribution.isReturnOfCapital && myAllocation.returnOfCapitalAmount > 0 && (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-normal">Return of Capital</CardDescription>
              <CardTitle className="text-2xl font-semibold text-blue-600">
                {formatCurrency(myAllocation.returnOfCapitalAmount, distribution.currency)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-xs">ROC</Badge>
            </CardContent>
          </Card>
        )}

        {distribution.isIncome && myAllocation.incomeAmount > 0 && (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-normal">Income</CardDescription>
              <CardTitle className="text-2xl font-semibold text-purple-600">
                {formatCurrency(myAllocation.incomeAmount, distribution.currency)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-xs">Income</Badge>
            </CardContent>
          </Card>
        )}

        {distribution.isCapitalGain && myAllocation.capitalGainAmount > 0 && (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-normal">Capital Gains</CardDescription>
              <CardTitle className="text-2xl font-semibold text-primary">
                {formatCurrency(myAllocation.capitalGainAmount, distribution.currency)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-xs">Capital Gain</Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFileText className="w-5 h-5" />
              Distribution Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Distribution Number</p>
                <p className="text-base font-medium">#{distribution.distributionNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Currency</p>
                <p className="text-base font-medium">{distribution.currency}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <IconCalendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Distribution Date</p>
                  <p className="text-base font-medium">{formatDate(distribution.distributionDate)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IconCalendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Record Date</p>
                  <p className="text-base font-medium">{formatDate(distribution.recordDate)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IconCalendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Payment Date</p>
                  <p className="text-base font-medium">{formatDate(distribution.paymentDate)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">Source</p>
              <p className="text-base font-medium">{distribution.source}</p>
              {distribution.sourceDescription && (
                <p className="text-sm text-muted-foreground mt-1">{distribution.sourceDescription}</p>
              )}
            </div>

            {distribution.relatedInvestmentName && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Related Investment</p>
                  <p className="text-base font-medium">{distribution.relatedInvestmentName}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Fund & Investor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBuilding className="w-5 h-5" />
              Fund & Investor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Fund Name</p>
              <p className="text-base font-medium">{distribution.fundName}</p>
            </div>

            {structure && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fund Type</p>
                    <p className="text-base font-medium">{structure.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Jurisdiction</p>
                    <p className="text-base font-medium">{structure.jurisdiction}</p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <IconUser className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Your Position</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ownership Percentage</span>
                  <span className="text-sm font-medium">{myAllocation.ownershipPercent.toFixed(4)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Base Allocation</span>
                  <span className="text-sm font-medium">{formatCurrency(myAllocation.baseAllocation, distribution.currency)}</span>
                </div>
                {distribution.waterfallApplied && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">After Waterfall</span>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(myAllocation.finalAllocation, distribution.currency)}</span>
                  </div>
                )}
              </div>
            </div>

            {myAllocation.distributionsToDate && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Distributions to Date</p>
                  <p className="text-base font-medium">{formatCurrency(myAllocation.distributionsToDate, distribution.currency)}</p>
                </div>
              </>
            )}

            {myAllocation.dpi && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">DPI (Distributions to Paid-In)</p>
                <p className="text-base font-medium">{myAllocation.dpi.toFixed(2)}x</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Details */}
      {myAllocation.status === 'Completed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCircleCheck className="w-5 h-5 text-green-600" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myAllocation.processedDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Processed Date</p>
                  <p className="text-base font-medium">{formatDate(myAllocation.processedDate)}</p>
                </div>
              )}
              {myAllocation.paymentMethod && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <p className="text-base font-medium">{myAllocation.paymentMethod}</p>
                </div>
              )}
              {myAllocation.transactionReference && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transaction Reference</p>
                  <p className="text-base font-medium font-mono text-sm">{myAllocation.transactionReference}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tax Information */}
      {(myAllocation.taxWithheld || myAllocation.taxRate) && (
        <Card>
          <CardHeader>
            <CardTitle>Tax Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myAllocation.taxWithheld && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tax Withheld</p>
                  <p className="text-base font-medium">{formatCurrency(myAllocation.taxWithheld, distribution.currency)}</p>
                </div>
              )}
              {myAllocation.taxRate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tax Rate</p>
                  <p className="text-base font-medium">{(myAllocation.taxRate * 100).toFixed(2)}%</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Please consult with your tax advisor regarding the tax implications of this distribution.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Distribution Breakdown */}
      {distribution.waterfallApplied && distribution.waterfallBreakdown && distribution.waterfallBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Waterfall Breakdown</CardTitle>
            <CardDescription>How this distribution was allocated across tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distribution.waterfallBreakdown.map((tier: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{tier.tier}</p>
                    <p className="text-sm font-semibold">{formatCurrency(tier.amount, distribution.currency)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">LP Share</span>
                      <span className="font-medium">{formatCurrency(tier.lpAmount, distribution.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GP Share</span>
                      <span className="font-medium">{formatCurrency(tier.gpAmount, distribution.currency)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/lp-portal/distributions')}>
          <IconArrowLeft className="w-4 h-4 mr-2" />
          Back to Distributions
        </Button>
      </div>
    </div>
  )
}
