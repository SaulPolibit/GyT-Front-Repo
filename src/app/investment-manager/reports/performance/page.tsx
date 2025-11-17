'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  IconFileTypography,
  IconChartLine,
  IconCurrencyDollar,
  IconTrendingUp,
  IconArrowRight,
  IconInfoCircle
} from '@tabler/icons-react'
import { getStructures, type Structure } from '@/lib/structures-storage'
import { calculateFundPerformance, type PerformanceMetrics } from '@/lib/ilpa-performance-calculations'
import { downloadILPAPerformance } from '@/lib/ilpa-performance-generator'

interface FundPerformance extends Structure {
  metrics: PerformanceMetrics
}

export default function PerformanceReportsPage() {
  const router = useRouter()
  const [selectedMethodology, setSelectedMethodology] = useState<'granular' | 'grossup'>('granular')
  const [fundsWithPerformance, setFundsWithPerformance] = useState<FundPerformance[]>([])
  const [selectedFund, setSelectedFund] = useState<FundPerformance | null>(null)

  useEffect(() => {
    loadPerformanceData()
  }, [])

  const loadPerformanceData = () => {
    const structures = getStructures()

    const fundsData = structures.map(fund => ({
      ...fund,
      metrics: calculateFundPerformance(fund)
    }))

    setFundsWithPerformance(fundsData)
    if (fundsData.length > 0) {
      setSelectedFund(fundsData[0])
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (value: number, decimals: number = 1) => {
    return `${value.toFixed(decimals)}%`
  }

  const formatMultiple = (value: number) => {
    return `${value.toFixed(2)}x`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ILPA Performance Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track fund performance with ILPA-compliant metrics and reporting
          </p>
        </div>
      </div>

      {/* Methodology Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Methodology</CardTitle>
              <CardDescription>
                Choose between Granular or Gross Up methodology for performance reporting
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={selectedMethodology === 'granular' ? 'default' : 'outline'}
                onClick={() => setSelectedMethodology('granular')}
              >
                <IconChartLine className="w-4 h-4 mr-2" />
                Granular
              </Button>
              <Button
                variant={selectedMethodology === 'grossup' ? 'default' : 'outline'}
                onClick={() => setSelectedMethodology('grossup')}
              >
                <IconTrendingUp className="w-4 h-4 mr-2" />
                Gross Up
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedMethodology === 'granular' ? (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <IconInfoCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Granular Methodology</p>
                <p className="text-sm text-blue-700">
                  For GPs who itemize capital calls and know usage at call time. Provides detailed transaction-level tracking with precise allocation of capital to specific investments.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <IconInfoCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-900 mb-1">Gross Up Methodology</p>
                <p className="text-sm text-purple-700">
                  For GPs who don't itemize capital calls or prefer fund-level cash flows. Calculates performance based on aggregate fund movements without transaction-level detail.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fund Selector */}
      {fundsWithPerformance.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <IconChartLine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Funds Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a fund structure to start tracking performance
            </p>
            <Button onClick={() => router.push('/investment-manager/onboarding')}>
              Create Fund
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Fund Selection Tabs */}
          <Tabs value={selectedFund?.id} onValueChange={(id) => {
            const fund = fundsWithPerformance.find(f => f.id === id)
            if (fund) setSelectedFund(fund)
          }}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {fundsWithPerformance.map(fund => (
                <TabsTrigger key={fund.id} value={fund.id}>
                  {fund.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {fundsWithPerformance.map(fund => (
              <TabsContent key={fund.id} value={fund.id} className="space-y-6">
                {/* Performance Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-sm font-normal">IRR</CardDescription>
                      <CardTitle className="text-2xl font-semibold text-primary">
                        {formatPercent(fund.metrics.irr)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Internal Rate of Return</p>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-sm font-normal">TVPI</CardDescription>
                      <CardTitle className="text-2xl font-semibold text-green-600">
                        {formatMultiple(fund.metrics.tvpi)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Total Value to Paid-In</p>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-sm font-normal">DPI</CardDescription>
                      <CardTitle className="text-2xl font-semibold text-blue-600">
                        {formatMultiple(fund.metrics.dpi)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Distributions to Paid-In</p>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-sm font-normal">RVPI</CardDescription>
                      <CardTitle className="text-2xl font-semibold text-purple-600">
                        {formatMultiple(fund.metrics.rvpi)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Residual Value to Paid-In</p>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-sm font-normal">MOIC</CardDescription>
                      <CardTitle className="text-2xl font-semibold text-orange-600">
                        {formatMultiple(fund.metrics.moic)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Multiple on Invested Capital</p>
                    </CardHeader>
                  </Card>
                </div>

                {/* Cash Flow Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Capital Called</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-orange-600">
                        {formatCurrency(fund.metrics.totalCapitalCalled, fund.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Total capital called from LPs</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Distributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-green-600">
                        {formatCurrency(fund.metrics.totalDistributed, fund.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Total distributed to LPs</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Current NAV</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-blue-600">
                        {formatCurrency(fund.metrics.currentNAV, fund.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Current net asset value</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Gain/Loss Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gain/Loss Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Unrealized Gain</p>
                        <p className="text-2xl font-semibold text-blue-600">
                          {formatCurrency(fund.metrics.unrealizedGain, fund.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Realized Gain</p>
                        <p className="text-2xl font-semibold text-green-600">
                          {formatCurrency(fund.metrics.realizedGain, fund.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Gain</p>
                        <p className="text-2xl font-semibold text-primary">
                          {formatCurrency(fund.metrics.totalGain, fund.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Export Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Export ILPA Performance Template</CardTitle>
                    <CardDescription>
                      Download {selectedMethodology === 'granular' ? 'Granular' : 'Gross Up'} methodology template
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        size="lg"
                        onClick={() => downloadILPAPerformance(fund, selectedMethodology)}
                      >
                        <IconFileTypography className="w-4 h-4 mr-2" />
                        Export {selectedMethodology === 'granular' ? 'Granular' : 'Gross Up'} Template
                      </Button>
                      <Button variant="outline" size="lg" onClick={() => router.push('/investment-manager/reports')}>
                        <IconArrowRight className="w-4 h-4 mr-2" />
                        View All Reports
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  )
}
