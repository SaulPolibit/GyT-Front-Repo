'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconTrendingDown, IconTrendingUp, IconCurrencyDollar, IconCalendar, IconArrowRight } from '@tabler/icons-react'
import { getInvestorByEmail, getCurrentInvestorEmail } from '@/lib/lp-portal-helpers'
import { getCapitalCalls } from '@/lib/capital-calls-storage'
import { getDistributions } from '@/lib/distributions-storage'

interface InvestorActivitySummary {
  totalCalled: number
  totalPaid: number
  totalOutstanding: number
  totalDistributed: number
  netCashPosition: number
}

export default function LPActivityPage() {
  const router = useRouter()
  const [activitySummary, setActivitySummary] = useState<InvestorActivitySummary>({
    totalCalled: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalDistributed: 0,
    netCashPosition: 0,
  })
  const [recentCapitalCalls, setRecentCapitalCalls] = useState<any[]>([])
  const [recentDistributions, setRecentDistributions] = useState<any[]>([])
  const [investorName, setInvestorName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const email = getCurrentInvestorEmail()
    const investor = getInvestorByEmail(email)

    if (!investor) {
      router.push('/lp-portal')
      return
    }

    setInvestorName(investor.name)

    // Get all capital calls and distributions
    const allCapitalCalls = getCapitalCalls()
    const allDistributions = getDistributions()

    // Filter to only include items where investor has an allocation
    const investorCapitalCalls = allCapitalCalls.filter(cc =>
      cc.investorAllocations.some(alloc => alloc.investorId === investor.id)
    )

    const investorDistributions = allDistributions.filter(dist =>
      dist.investorAllocations.some(alloc => alloc.investorId === investor.id)
    )

    // Calculate investor-specific totals
    let totalCalled = 0
    let totalPaid = 0
    let totalOutstanding = 0

    investorCapitalCalls.forEach(cc => {
      const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
      if (allocation) {
        totalCalled += allocation.callAmount // Total amount requested in capital calls
        totalPaid += allocation.amountPaid || 0 // What investor has actually paid
        totalOutstanding += (allocation.callAmount - (allocation.amountPaid || 0)) // Called but not yet paid
      }
    })

    let totalDistributed = 0

    investorDistributions.forEach(dist => {
      const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
      if (allocation) {
        totalDistributed += allocation.finalAllocation || 0
      }
    })

    // Net cash position = distributions received - paid capital
    // Positive = investor has received more than paid (net gain)
    // Negative = investor has paid more than received (net invested)
    const netCash = totalDistributed - totalPaid

    setActivitySummary({
      totalCalled,
      totalPaid,
      totalOutstanding,
      totalDistributed,
      netCashPosition: netCash,
    })

    // Get 5 most recent capital calls
    setRecentCapitalCalls(
      investorCapitalCalls
        .sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime())
        .slice(0, 5)
        .map(cc => {
          const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
          return {
            ...cc,
            myAmount: allocation?.callAmount || 0,
            myPaid: allocation?.amountPaid || 0,
            myOutstanding: allocation?.amountOutstanding || 0,
            myStatus: allocation?.status || 'Pending',
          }
        })
    )

    // Get 5 most recent distributions
    setRecentDistributions(
      investorDistributions
        .sort((a, b) => new Date(b.distributionDate).getTime() - new Date(a.distributionDate).getTime())
        .slice(0, 5)
        .map(dist => {
          const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
          return {
            ...dist,
            myAmount: allocation?.finalAllocation || 0,
            myStatus: allocation?.status || 'Pending',
          }
        })
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
      'Pending': 'secondary',
      'Paid': 'default',
      'Partially Paid': 'outline',
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your capital contributions and distributions
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
            <CardTitle className={`text-2xl font-semibold ${activitySummary.netCashPosition > 0 ? 'text-green-600' : activitySummary.netCashPosition < 0 ? 'text-red-600' : ''}`}>
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
                  <CardDescription>Your latest capital call notices</CardDescription>
                </div>
                <Button onClick={() => router.push('/lp-portal/capital-calls')}>
                  View All
                  <IconArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentCapitalCalls.length === 0 ? (
                <div className="text-center py-8">
                  <IconTrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No capital calls yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Call #</TableHead>
                      <TableHead>Fund</TableHead>
                      <TableHead>Call Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">My Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCapitalCalls.map((call) => (
                      <TableRow
                        key={call.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/lp-portal/capital-calls/${call.id}`)}
                      >
                        <TableCell className="font-medium">#{call.callNumber}</TableCell>
                        <TableCell>{call.fundName}</TableCell>
                        <TableCell>{formatDate(call.callDate)}</TableCell>
                        <TableCell>{formatDate(call.dueDate)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(call.myAmount, call.currency)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(call.myPaid, call.currency)}</TableCell>
                        <TableCell>{getCallStatusBadge(call.myStatus)}</TableCell>
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
                  <CardDescription>Your latest distribution payments</CardDescription>
                </div>
                <Button onClick={() => router.push('/lp-portal/distributions')}>
                  View All
                  <IconArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentDistributions.length === 0 ? (
                <div className="text-center py-8">
                  <IconTrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No distributions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distribution #</TableHead>
                      <TableHead>Fund</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">My Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDistributions.map((dist) => (
                      <TableRow
                        key={dist.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/lp-portal/distributions/${dist.id}`)}
                      >
                        <TableCell className="font-medium">#{dist.distributionNumber}</TableCell>
                        <TableCell>{dist.fundName}</TableCell>
                        <TableCell>{formatDate(dist.distributionDate)}</TableCell>
                        <TableCell>{dist.source}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">{formatCurrency(dist.myAmount, dist.currency)}</TableCell>
                        <TableCell>{getDistStatusBadge(dist.myStatus)}</TableCell>
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
