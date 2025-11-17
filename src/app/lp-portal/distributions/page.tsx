'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconTrendingUp, IconEye, IconClock, IconCircleCheck, IconCircleX } from '@tabler/icons-react'
import { getDistributions } from '@/lib/distributions-storage'
import { getInvestorByEmail, getCurrentInvestorEmail } from '@/lib/lp-portal-helpers'

interface InvestorDistribution {
  id: string
  fundName: string
  fundId: string
  distributionNumber: number
  distributionDate: string
  paymentDate: string
  source: string
  myAllocation: number
  myReturnOfCapital: number
  myIncome: number
  myCapitalGain: number
  status: string
  currency: string
  isReturnOfCapital: boolean
  isIncome: boolean
  isCapitalGain: boolean
}

export default function LPDistributionsPage() {
  const [distributions, setDistributions] = useState<InvestorDistribution[]>([])
  const [summary, setSummary] = useState({
    totalDistributed: 0,
    totalReturnOfCapital: 0,
    totalIncome: 0,
    totalCapitalGain: 0,
    totalDistributions: 0
  })
  const [investorName, setInvestorName] = useState('')

  useEffect(() => {
    loadData()

    // Reload data when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }

    const handleFocus = () => {
      loadData()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadData = () => {
    const email = getCurrentInvestorEmail()
    const investor = getInvestorByEmail(email)

    if (!investor) return

    setInvestorName(investor.name)

    const allDistributions = getDistributions()

    // Filter distributions for structures the investor is involved in
    const investorStructureIds = investor.fundOwnerships.map(fo => fo.fundId)

    const investorDists: InvestorDistribution[] = allDistributions
      .filter(dist => investorStructureIds.includes(dist.fundId))
      .map(dist => {
        // Find investor's allocation in this distribution
        const myAllocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)

        if (!myAllocation) return null

        return {
          id: dist.id,
          fundName: dist.fundName,
          fundId: dist.fundId,
          distributionNumber: dist.distributionNumber,
          distributionDate: dist.distributionDate,
          paymentDate: dist.paymentDate,
          source: dist.source,
          myAllocation: Number(myAllocation.finalAllocation) || 0,
          myReturnOfCapital: Number(myAllocation.returnOfCapitalAmount) || 0,
          myIncome: Number(myAllocation.incomeAmount) || 0,
          myCapitalGain: Number(myAllocation.capitalGainAmount) || 0,
          status: myAllocation.status,
          currency: dist.currency,
          isReturnOfCapital: dist.isReturnOfCapital,
          isIncome: dist.isIncome,
          isCapitalGain: dist.isCapitalGain,
        }
      })
      .filter((dist): dist is InvestorDistribution => dist !== null)
      .sort((a, b) => new Date(b.distributionDate).getTime() - new Date(a.distributionDate).getTime())

    setDistributions(investorDists)

    // Calculate summary
    const totalDistributed = investorDists.reduce((sum, dist) => sum + dist.myAllocation, 0)
    const totalReturnOfCapital = investorDists.reduce((sum, dist) => sum + dist.myReturnOfCapital, 0)
    const totalIncome = investorDists.reduce((sum, dist) => sum + dist.myIncome, 0)
    const totalCapitalGain = investorDists.reduce((sum, dist) => sum + dist.myCapitalGain, 0)

    setSummary({
      totalDistributed,
      totalReturnOfCapital,
      totalIncome,
      totalCapitalGain,
      totalDistributions: investorDists.length
    })
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Distributions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View distributions received from your funds
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Distributed</CardDescription>
            <CardTitle className="text-2xl font-semibold text-green-600">
              {formatCurrency(summary.totalDistributed)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Return of Capital</CardDescription>
            <CardTitle className="text-2xl font-semibold text-blue-600">
              {formatCurrency(summary.totalReturnOfCapital)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Income</CardDescription>
            <CardTitle className="text-2xl font-semibold text-purple-600">
              {formatCurrency(summary.totalIncome)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Capital Gains</CardDescription>
            <CardTitle className="text-2xl font-semibold text-primary">
              {formatCurrency(summary.totalCapitalGain)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Distributions Grid */}
      {distributions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconTrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Distributions</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              You haven't received any distributions yet. Distributions will appear here when your fund managers make payouts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {distributions.map((dist) => (
            <Card key={dist.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">
                      {dist.fundName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Distribution #{dist.distributionNumber}
                    </CardDescription>
                  </div>
                  {getStatusBadge(dist.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Distribution Date</p>
                    <p className="text-sm font-medium">{formatDate(dist.distributionDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Date</p>
                    <p className="text-sm font-medium">{formatDate(dist.paymentDate)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Source</p>
                  <p className="text-sm font-medium">{dist.source}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">My Distribution</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(dist.myAllocation, dist.currency)}</span>
                  </div>
                  {dist.isReturnOfCapital && dist.myReturnOfCapital > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Return of Capital</span>
                      <span className="text-xs font-medium text-blue-600">{formatCurrency(dist.myReturnOfCapital, dist.currency)}</span>
                    </div>
                  )}
                  {dist.isIncome && dist.myIncome > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Income</span>
                      <span className="text-xs font-medium text-purple-600">{formatCurrency(dist.myIncome, dist.currency)}</span>
                    </div>
                  )}
                  {dist.isCapitalGain && dist.myCapitalGain > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Capital Gain</span>
                      <span className="text-xs font-medium text-primary">{formatCurrency(dist.myCapitalGain, dist.currency)}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {dist.isReturnOfCapital && (
                    <Badge variant="outline" className="text-xs">ROC</Badge>
                  )}
                  {dist.isIncome && (
                    <Badge variant="outline" className="text-xs">Income</Badge>
                  )}
                  {dist.isCapitalGain && (
                    <Badge variant="outline" className="text-xs">Capital Gain</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.location.href = `/lp-portal/distributions/${dist.id}`}
                  >
                    <IconEye className="w-3 h-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  )
}
