"use client"

import * as React from "react"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  Calendar,
  MapPin,
  FileText,
  Home,
  Briefcase,
  AlertCircle,
} from "lucide-react"
import { getInvestmentById } from "@/lib/investments-storage"
import type { Investment } from "@/lib/types"

interface Props {
  params: Promise<{ investmentId: string }>
}

export default function MarketplaceInvestmentDetailPage({ params }: Props) {
  const { investmentId } = use(params)
  const [investment, setInvestment] = React.useState<Investment | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    const inv = getInvestmentById(investmentId)
    setInvestment(inv)
    setLoading(false)
  }, [investmentId, refreshKey])

  // Listen for storage events to refresh when data changes
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'polibit_investments') {
        setRefreshKey(prev => prev + 1)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateString
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'real estate':
        return <Building2 className="h-5 w-5" />
      case 'private equity':
        return <Briefcase className="h-5 w-5" />
      case 'private debt':
        return <DollarSign className="h-5 w-5" />
      default:
        return <Home className="h-5 w-5" />
    }
  }

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'closed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" asChild>
          <a href="/lp-portal/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </a>
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading investment details...</p>
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
            <p className="text-sm text-muted-foreground">
              The investment opportunity you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getTotalFundedAmount = () => {
    let amount = 0
    if (investment.fundEquityPosition) {
      amount += investment.fundEquityPosition.equityInvested
    }
    if (investment.fundDebtPosition) {
      amount += investment.fundDebtPosition.principalProvided
    }
    return amount
  }

  const getCurrentValue = () => {
    let value = 0
    if (investment.fundEquityPosition) {
      value += investment.fundEquityPosition.currentEquityValue
    }
    if (investment.fundDebtPosition) {
      value += investment.fundDebtPosition.currentDebtValue
    }
    return value
  }

  const getUnrealizedGain = () => {
    let gain = 0
    if (investment.fundEquityPosition) {
      gain += investment.fundEquityPosition.unrealizedGain
    }
    if (investment.fundDebtPosition) {
      gain += investment.fundDebtPosition.unrealizedGain
    }
    return gain
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Back Button and Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <a href="/lp-portal/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </a>
        </Button>
        <div className="flex gap-2">
          <Button asChild>
            <a href={`/lp-portal/marketplace/${investmentId}/checkout`}>
              Buy
            </a>
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
            {getTypeIcon(investment.type)}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{investment.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-2">
              <MapPin className="h-4 w-4" />
              {investment.geography.city}, {investment.geography.state || investment.geography.country}
            </p>
          </div>
        </div>
        <Badge variant={getStatusBadgeVariant(investment.status)} className="text-base px-3 py-1">
          {investment.status}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment Type</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investment.type}</div>
            <p className="text-xs text-muted-foreground">{investment.sector}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fund Invested</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalFundedAmount())}</div>
            <p className="text-xs text-muted-foreground">Total commitment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getCurrentValue())}</div>
            <p className="text-xs text-muted-foreground">Portfolio valuation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized Gain</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getUnrealizedGain() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(getUnrealizedGain())}
            </div>
            <p className="text-xs text-muted-foreground">
              {getTotalFundedAmount() > 0 ? formatPercent((getUnrealizedGain() / getTotalFundedAmount()) * 100) : '0.00%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equity">Equity Position</TabsTrigger>
          <TabsTrigger value="debt">Debt Position</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Overview</CardTitle>
              <CardDescription>General information about this investment opportunity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Investment Name</p>
                  <p className="text-sm font-semibold">{investment.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Investment Type</p>
                  <p className="text-sm font-semibold">{investment.investmentType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge variant={getStatusBadgeVariant(investment.status)}>
                    {investment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sector</p>
                  <p className="text-sm font-semibold">{investment.sector}</p>
                </div>
              </div>

              <Separator />

              {/* Location Info */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">City</p>
                    <p className="text-sm font-semibold">{investment.geography.city}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">State/Region</p>
                    <p className="text-sm font-semibold">{investment.geography.state || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Country</p>
                    <p className="text-sm font-semibold">{investment.geography.country}</p>
                  </div>
                </div>
              </div>

              {investment.address && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-4">Address</h3>
                    <p className="text-sm text-muted-foreground">
                      {investment.address.street && `${investment.address.street}, `}
                      {investment.address.city}, {investment.address.state} {investment.address.zipCode}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Asset Value */}
              <div>
                <h3 className="font-semibold mb-4">Asset Value</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {investment.totalPropertyValue && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Property Value</p>
                      <p className="text-lg font-bold">{formatCurrency(investment.totalPropertyValue)}</p>
                    </div>
                  )}
                  {investment.totalCompanyValue && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Company Value</p>
                      <p className="text-lg font-bold">{formatCurrency(investment.totalCompanyValue)}</p>
                    </div>
                  )}
                  {investment.totalProjectValue && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Project Value</p>
                      <p className="text-lg font-bold">{formatCurrency(investment.totalProjectValue)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equity Position Tab */}
        <TabsContent value="equity" className="space-y-4">
          {investment.fundEquityPosition ? (
            <Card>
              <CardHeader>
                <CardTitle>Equity Position Details</CardTitle>
                <CardDescription>Fund's equity investment in this opportunity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Ownership Percentage</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPercent(investment.fundEquityPosition.ownershipPercent)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Equity Invested</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(investment.fundEquityPosition.equityInvested)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Current Equity Value</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(investment.fundEquityPosition.currentEquityValue)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Unrealized Gain</p>
                    <p className={`text-3xl font-bold ${investment.fundEquityPosition.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(investment.fundEquityPosition.unrealizedGain)}
                    </p>
                  </div>
                </div>

                {investment.totalFundPosition && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-4">Performance Metrics</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="border rounded-lg p-4">
                          <p className="text-xs text-muted-foreground mb-1">IRR</p>
                          <p className={`text-2xl font-bold ${investment.totalFundPosition.irr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(investment.totalFundPosition.irr)}
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <p className="text-xs text-muted-foreground mb-1">MOIC</p>
                          <p className={`text-2xl font-bold ${investment.totalFundPosition.multiple >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                            {investment.totalFundPosition.multiple.toFixed(2)}x
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No equity position in this investment</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Debt Position Tab */}
        <TabsContent value="debt" className="space-y-4">
          {investment.fundDebtPosition ? (
            <Card>
              <CardHeader>
                <CardTitle>Debt Position Details</CardTitle>
                <CardDescription>Fund's debt investment in this opportunity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Principal Provided</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(investment.fundDebtPosition.principalProvided)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPercent(investment.fundDebtPosition.interestRate)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Accrued Interest</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(investment.fundDebtPosition.accruedInterest)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Current Debt Value</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(investment.fundDebtPosition.currentDebtValue)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Origination Date</p>
                    <p className="text-lg font-semibold">
                      {formatDate(investment.fundDebtPosition.originationDate)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Maturity Date</p>
                    <p className="text-lg font-semibold">
                      {formatDate(investment.fundDebtPosition.maturityDate)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Unrealized Gain</p>
                  <p className={`text-2xl font-bold ${investment.fundDebtPosition.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(investment.fundDebtPosition.unrealizedGain)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No debt position in this investment</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Investment-related documents and materials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Documents coming soon</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Investment materials, term sheets, and legal documents will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
