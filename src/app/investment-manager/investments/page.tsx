"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, TrendingUp, TrendingDown, MapPin, Building2, DollarSign, Loader2, AlertCircle } from "lucide-react"
import type { Investment } from "@/lib/types"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { getAuthToken, getAuthState, logout } from "@/lib/auth-storage"

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Check if user is guest
  const authState = getAuthState()
  const currentUserRole = authState.user?.role ?? null
  const isGuest = currentUserRole === 4

  // Load investments from API on mount
  useEffect(() => {
    async function fetchInvestments() {
      try {
        setIsLoading(true)
        setError(null)

        // Get authentication token
        const token = getAuthToken()

        if (!token) {
          setError('Authentication required. Please log in.')
          setIsLoading(false)
          return
        }

        const apiUrl = getApiUrl(API_CONFIG.endpoints.getAllInvestments)

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          // Handle 401 Unauthorized - Invalid or expired token
          if (response.status === 401) {
            console.log('[Auth] 401 Unauthorized - Clearing session and redirecting to login')
            logout()
            window.location.href = '/sign-in'
            return
          }

          const errorData = await response.json()
          setError(errorData.message || 'Failed to fetch investments')
          setIsLoading(false)
          return
        }

        const result = await response.json()

        if (result.success && Array.isArray(result.data)) {
          setInvestments(result.data)
        } else {
          setError('Invalid response format from API')
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching investments:', err)
        setError('Failed to load investments')
        setIsLoading(false)
      }
    }

    fetchInvestments()
  }, [])

  // Filter investments
  const filteredInvestments = investments.filter((inv) => {
    const invName = inv.name || (inv as any).investmentName || ''
    const geoString = typeof inv.geography === 'string'
      ? inv.geography
      : inv.geography?.city || ''
    const matchesSearch = invName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         geoString.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || inv.type === filterType
    const matchesStatus = filterStatus === "all" || inv.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  // Calculate summary metrics from fund positions
  const totalValue = investments.reduce((sum, inv) => sum + ((inv as any).currentValue || inv.totalFundPosition?.currentValue || 0), 0)
  const totalCost = investments.reduce((sum, inv) => sum + ((inv as any).totalInvested || inv.totalFundPosition?.totalInvested || 0), 0)
  const totalGain = totalValue - totalCost
  const gainPercent = totalCost > 0 ? ((totalGain / totalCost) * 100) : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default'
      case 'Closed': return 'secondary'
      case 'Pending': return 'outline'
      default: return 'secondary'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Real Estate': return <Building2 className="h-4 w-4" />
      case 'Private Equity': return <TrendingUp className="h-4 w-4" />
      case 'Private Debt': return <DollarSign className="h-4 w-4" />
      default: return null
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading investments...</h3>
            <p className="text-muted-foreground">Please wait while we fetch your data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Investments</h3>
            <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground mt-1">
            {filteredInvestments.length} asset{filteredInvestments.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!isGuest && (
          <Button asChild>
            <Link href="/investment-manager/investments/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Link>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unrealized Gain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalGain)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPercent(gainPercent)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filterType} onValueChange={setFilterType}>
            <TabsList>
              <TabsTrigger value="all">All Types</TabsTrigger>
              <TabsTrigger value="Real Estate">Real Estate</TabsTrigger>
              <TabsTrigger value="Private Equity">Private Equity</TabsTrigger>
              <TabsTrigger value="Private Debt">Private Debt</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Status Filter */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">All Status</TabsTrigger>
            <TabsTrigger value="Active">Active</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="Closed">Closed</TabsTrigger>
            <TabsTrigger value="Exited">Exited</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Investments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvestments.map((investment) => (
          <Link key={investment.id} href={`/investment-manager/investments/${investment.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{investment.name || (investment as any).investmentName || 'Unnamed'}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {typeof investment.geography === 'string'
                        ? investment.geography
                        : investment.geography?.city && investment.geography?.state
                        ? `${investment.geography.city}, ${investment.geography.state}`
                        : 'N/A'}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(investment.status)}>
                    {investment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type & Sector */}
                <div className="flex items-center gap-2">
                  {getTypeIcon(investment.type)}
                  <span className="text-sm">{investment.type}</span>
                  <span className="text-sm text-muted-foreground">• {investment.sector}</span>
                </div>

                {/* Financial Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Current Value</div>
                    <div className="text-sm font-semibold">{formatCurrency((investment as any).currentValue || investment.totalFundPosition?.currentValue || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Invested</div>
                    <div className="text-sm font-semibold">{formatCurrency((investment as any).totalInvested || investment.totalFundPosition?.totalInvested || 0)}</div>
                  </div>
                </div>

                {/* Performance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">IRR</div>
                    <div className={`text-sm font-semibold flex items-center gap-1 ${((investment as any).irr || investment.totalFundPosition?.irr || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {((investment as any).irr || investment.totalFundPosition?.irr || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {formatPercent((investment as any).irr || investment.totalFundPosition?.irr)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Multiple</div>
                    <div className={`text-sm font-semibold ${((investment as any).multiple || investment.totalFundPosition?.multiple || 0) >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {((investment as any).multiple || investment.totalFundPosition?.multiple || 0).toFixed(2)}x
                    </div>
                  </div>
                </div>

                {/* Asset Type Badge */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Asset Type</span>
                    <Badge variant="outline" className="text-xs">
                      {investment.investmentType}
                    </Badge>
                  </div>
                </div>

                {/* External Debt Indicator */}
                {investment.externalDebt && investment.externalDebt.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">External Debt</span>
                      <span className="font-medium">{formatCurrency(investment.externalDebt.reduce((sum, d) => sum + d.principal, 0))}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredInvestments.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assets found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Add your first asset to get started'}
            </p>
            {!searchQuery && !isGuest && (
              <Button asChild>
                <Link href="/investment-manager/investments/add">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Link>
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
