'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconTrendingDown, IconTrendingUp, IconCurrencyDollar, IconCalendar, IconArrowRight, IconPlus } from '@tabler/icons-react'
import { getCapitalCalls, getCapitalCallSummary } from '@/lib/capital-calls-storage'
import { getDistributions, getDistributionSummary } from '@/lib/distributions-storage'
import { getStructures } from '@/lib/structures-storage'

interface ActivitySummary {
  totalCalled: number
  totalPaid: number
  totalOutstanding: number
  totalDistributed: number
  netCashPosition: number
}

export default function CapitalActivityPage() {
  const router = useRouter()
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({
    totalCalled: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalDistributed: 0,
    netCashPosition: 0,
  })
  const [recentCapitalCalls, setRecentCapitalCalls] = useState<any[]>([])
  const [recentDistributions, setRecentDistributions] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const capitalCallSummary = getCapitalCallSummary()
    const distributionSummary = getDistributionSummary()

    const capitalCalls = getCapitalCalls()
    const distributions = getDistributions()

    // Calculate net cash position (capital called - distributions)
    const netCash = capitalCallSummary.totalPaidAmount - distributionSummary.totalDistributionAmount

    setActivitySummary({
      totalCalled: capitalCallSummary.totalCallAmount,
      totalPaid: capitalCallSummary.totalPaidAmount,
      totalOutstanding: capitalCallSummary.totalOutstandingAmount,
      totalDistributed: distributionSummary.totalDistributionAmount,
      netCashPosition: netCash,
    })

    // Get 5 most recent capital calls
    setRecentCapitalCalls(
      capitalCalls
        .sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime())
        .slice(0, 5)
    )

    // Get 5 most recent distributions
    setRecentDistributions(
      distributions
        .sort((a, b) => new Date(b.distributionDate).getTime() - new Date(a.distributionDate).getTime())
        .slice(0, 5)
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

  const getCallStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Draft': 'secondary',
      'Sent': 'default',
      'Partially Paid': 'outline',
      'Fully Paid': 'default',
      'Overdue': 'destructive',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  const getDistStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Pending': 'secondary',
      'Processing': 'outline',
      'Completed': 'default',
      'Failed': 'destructive',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Capital Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track capital calls, distributions, and net cash position
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Called</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {formatCurrency(activitySummary.totalCalled)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Paid</CardDescription>
            <CardTitle className="text-2xl font-semibold text-green-600">
              {formatCurrency(activitySummary.totalPaid)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Outstanding</CardDescription>
            <CardTitle className="text-2xl font-semibold text-orange-600">
              {formatCurrency(activitySummary.totalOutstanding)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Distributed</CardDescription>
            <CardTitle className="text-2xl font-semibold text-blue-600">
              {formatCurrency(activitySummary.totalDistributed)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Net Cash Position</CardDescription>
            <CardTitle className={`text-2xl font-semibold ${activitySummary.netCashPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(activitySummary.netCashPosition)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Activity Tabs */}
      <Tabs defaultValue="capital-calls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="capital-calls">
            <IconTrendingDown className="w-4 h-4 mr-2" />
            Capital Calls
          </TabsTrigger>
          <TabsTrigger value="distributions">
            <IconTrendingUp className="w-4 h-4 mr-2" />
            Distributions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capital-calls" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Capital Calls</CardTitle>
                  <CardDescription>Latest 5 capital call notices</CardDescription>
                </div>
                <Button onClick={() => router.push('/investment-manager/operations/capital-calls')}>
                  View All
                  <IconArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentCapitalCalls.length === 0 ? (
                <div className="text-center py-8">
                  <IconTrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">No capital calls yet</p>
                  <Button onClick={() => router.push('/investment-manager/operations/capital-calls/create')}>
                    <IconPlus className="w-4 h-4 mr-2" />
                    Create Capital Call
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Call #</TableHead>
                      <TableHead>Fund</TableHead>
                      <TableHead>Call Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCapitalCalls.map((call) => (
                      <TableRow
                        key={call.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/investment-manager/operations/capital-calls/${call.id}`)}
                      >
                        <TableCell className="font-medium">#{call.callNumber}</TableCell>
                        <TableCell>{call.fundName}</TableCell>
                        <TableCell>{formatDate(call.callDate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(call.totalCallAmount, call.currency)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(call.totalPaidAmount, call.currency)}</TableCell>
                        <TableCell>{getCallStatusBadge(call.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Distributions</CardTitle>
                  <CardDescription>Latest 5 distributions to investors</CardDescription>
                </div>
                <Button onClick={() => router.push('/investment-manager/operations/distributions')}>
                  View All
                  <IconArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentDistributions.length === 0 ? (
                <div className="text-center py-8">
                  <IconTrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">No distributions yet</p>
                  <Button onClick={() => router.push('/investment-manager/operations/distributions/create')}>
                    <IconPlus className="w-4 h-4 mr-2" />
                    Create Distribution
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distribution #</TableHead>
                      <TableHead>Fund</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDistributions.map((dist) => (
                      <TableRow
                        key={dist.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/investment-manager/operations/distributions/${dist.id}`)}
                      >
                        <TableCell className="font-medium">#{dist.distributionNumber}</TableCell>
                        <TableCell>{dist.fundName}</TableCell>
                        <TableCell>{formatDate(dist.distributionDate)}</TableCell>
                        <TableCell>{dist.source}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(dist.totalDistributionAmount, dist.currency)}</TableCell>
                        <TableCell>{getDistStatusBadge(dist.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
