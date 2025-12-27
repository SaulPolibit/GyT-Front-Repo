"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Search,
  Grid3x3,
  List,
  ArrowRight,
  Building2,
  Landmark,
  AlertCircle,
} from "lucide-react"
import { getCurrentUser, getAuthToken, logout } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"

interface InvestorStructure {
  id: string
  name: string
  type: string
  commitment: number
  calledCapital: number
  currentValue: number
  ownershipPercent: number
  unrealizedGain: number
  paymentStatus?: string
  paymentMethod?: string
  paymentId?: string
  createdAt?: string
}

interface CapitalCall {
  id: string
  structureId: string
  structureName: string
  callNumber: string
  callDate: string
  dueDate: string
  allocatedAmount: number
  paidAmount: number
  outstanding: number
  status: string
  purpose: string
}

interface CapitalCallsData {
  userId: string
  userName: string
  userEmail: string
  summary: {
    totalCalled: number
    totalPaid: number
    outstanding: number
    totalCalls: number
  }
  investors: Array<{
    id: string
    name: string
    type: string
    status: string
  }>
  capitalCalls: CapitalCall[]
}

export default function PortfolioPage() {
  const router = useRouter()
  const [structures, setStructures] = React.useState<InvestorStructure[]>([])
  const [capitalCallsData, setCapitalCallsData] = React.useState<CapitalCallsData | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchPortfolioData = React.useCallback(async () => {
    const user = getCurrentUser()

    if (!user?.email) {
      setError('No user found. Please log in.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Get payments with structure data
      console.log('[Portfolio] Fetching payments with structures')
      const paymentsResponse = await fetch(
        getApiUrl('/api/payments/me'),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Handle 401 Unauthorized - session expired or invalid
      if (paymentsResponse.status === 401) {
        console.log('[Portfolio] 401 Unauthorized - clearing session and redirecting to login')
        logout()
        router.push('/lp-portal/login')
        return
      }

      if (!paymentsResponse.ok) {
        throw new Error(`Failed to fetch payments: ${paymentsResponse.statusText}`)
      }

      const paymentsData = await paymentsResponse.json()
      console.log('[Portfolio] Payments with structures:', paymentsData)

      if (!paymentsData.success || !paymentsData.data) {
        throw new Error('Invalid response from server')
      }

      // Map payments to structures
      const paymentsStructures: InvestorStructure[] = paymentsData.data.map((payment: any) => {
        return {
          id: payment.structure?.id || payment.structureId,
          name: payment.structure?.name || 'Unknown Structure',
          type: payment.structure?.type || 'Unknown',
          commitment: payment.amount || 0,
          calledCapital: 0, // Placeholder
          currentValue: 0, // Placeholder
          ownershipPercent: 0, // Placeholder
          unrealizedGain: 0, // Placeholder
          paymentStatus: payment.status,
          paymentMethod: payment.paymentMethod,
          paymentId: payment.id,
          createdAt: payment.createdAt,
        }
      })

      setStructures(paymentsStructures)
      console.log('[Portfolio] Mapped structures from payments:', paymentsStructures)

      // Get investor ID from first payment if available
      const investor = paymentsData.data[0]?.investor
      if (!investor?.id) {
        console.warn('[Portfolio] No investor ID found in payments')
        setIsLoading(false)
        return
      }
      console.log('[Portfolio] Found investor from payments:', investor.id)

      // Fetch capital calls data
      try {
        console.log('[Portfolio] Fetching capital calls for investor:', investor.id)
        const capitalCallsResponse = await fetch(
          getApiUrl(API_CONFIG.endpoints.getInvestorCapitalCalls(investor.id)),
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (capitalCallsResponse.ok) {
          const capitalCallsResponseData = await capitalCallsResponse.json()
          console.log('[Portfolio] Capital calls response:', capitalCallsResponseData)

          if (capitalCallsResponseData.success && capitalCallsResponseData.data) {
            setCapitalCallsData(capitalCallsResponseData.data)
          }
        } else {
          console.warn('[Portfolio] Failed to fetch capital calls:', capitalCallsResponse.statusText)
          // Don't throw error - capital calls are optional data
        }
      } catch (capitalCallsError) {
        console.warn('[Portfolio] Error fetching capital calls:', capitalCallsError)
        // Don't throw error - capital calls are optional data
      }
    } catch (err) {
      console.error('[Portfolio] Error fetching portfolio:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  React.useEffect(() => {
    fetchPortfolioData()
  }, [fetchPortfolioData])

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  // Calculate summary metrics
  const totalCommitment = structures.reduce((sum, s) => sum + s.commitment, 0)
  const totalCalledCapital = totalCommitment
  const totalCurrentValue = totalCommitment

  // Filter structures
  const filteredStructures = structures.filter(structure => {
    const matchesSearch = structure.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || structure.type === typeFilter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && structure.commitment > 0) ||
      (statusFilter === 'pending' && structure.commitment === 0)

    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (structure: InvestorStructure) => {
    if (structure.commitment === 0) {
      return <Badge variant="secondary">Pending</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  const getTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('real estate')) {
      return <Building2 className="h-5 w-5" />
    }
    return <Landmark className="h-5 w-5" />
  }

  // Check if user needs to complete KYC
  const user = getCurrentUser()
  if (user && user.kycStatus !== 'Approved' && user.kycUrl) {
    return (
      <div className="space-y-6 p-4 md:p-6 h-screen flex flex-col">
        {/* KYC Notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-lg text-amber-900">KYC Verification Required</CardTitle>
                <CardDescription className="text-amber-800 mt-1">
                  Please complete your KYC (Know Your Customer) verification to access your portfolio and investment features.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* KYC iFrame */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader>
            <CardTitle>Complete Your Verification</CardTitle>
            <CardDescription>
              Please fill out the verification form below to gain access to your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <iframe
              src={user.kycUrl.startsWith('http') ? user.kycUrl : `https://${user.kycUrl}`}
              className="w-full h-full border-0"
              title="KYC Verification"
              allow="camera; microphone"
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground">
            Overview of your investment structures and performance
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg font-semibold mb-2">Loading your portfolio...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground">
            Overview of your investment structures and performance
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold mb-2">Error loading portfolio</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPortfolioData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground">
          Overview of your investment structures and performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commitment</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommitment)}</div>
            <p className="text-xs text-muted-foreground">Across {structures.length} structure{structures.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Called Capital</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCalledCapital)}</div>
            <p className="text-xs text-muted-foreground">
              {totalCommitment > 0 ? ((totalCalledCapital / totalCommitment) * 100).toFixed(1) : 0}% of commitment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div>
            <p className="text-xs text-muted-foreground">
              {totalCalledCapital > 0
                ? `${((totalCurrentValue - totalCalledCapital) / totalCalledCapital * 100).toFixed(1)}% unrealized gain`
                : 'No called capital yet'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search structures..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Fund">Fund</SelectItem>
              <SelectItem value="SPV">SPV</SelectItem>
              <SelectItem value="Real Estate Fund">Real Estate Fund</SelectItem>
              <SelectItem value="Private Equity Fund">Private Equity Fund</SelectItem>
              <SelectItem value="Private Debt Fund">Private Debt Fund</SelectItem>
              <SelectItem value="sa">SA</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Structures Grid/List */}
      {filteredStructures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No structures found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'You have no investment structures yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
          {filteredStructures.map((structure) => (
            <Card key={structure.paymentId || structure.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(structure.type)}
                    <div>
                      <CardTitle className="text-lg">{structure.name}</CardTitle>
                      <CardDescription>{structure.type}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {getStatusBadge(structure)}
                    {structure.paymentStatus && (
                      <Badge variant={structure.paymentStatus === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {structure.paymentStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Info */}
                {(structure.paymentStatus || structure.paymentMethod) && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    {structure.paymentMethod && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Payment Method</p>
                        <Badge variant="outline" className="text-xs">
                          {structure.paymentMethod === 'usdc' ? 'USDC' :
                           structure.paymentMethod === 'bank-transfer' ? 'Bank Transfer' :
                           structure.paymentMethod}
                        </Badge>
                      </div>
                    )}
                    {structure.paymentStatus && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Payment Status</p>
                        <p className="text-xs font-semibold capitalize">{structure.paymentStatus}</p>
                      </div>
                    )}
                    {structure.createdAt && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Created At</p>
                        <p className="text-xs font-medium">{formatDateTime(structure.createdAt)}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Commitment</p>
                    <p className="text-sm font-semibold">{formatCurrency(structure.commitment)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Called Capital</p>
                    <p className="text-sm font-semibold">{formatCurrency(structure.calledCapital)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ownership</p>
                    <p className="text-sm font-semibold">{formatPercent(structure.ownershipPercent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Value</p>
                    <p className="text-sm font-semibold">{formatCurrency(structure.currentValue)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  {structure.commitment > 0 ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Unrealized Gain</p>
                        <p className={`text-sm font-semibold ${structure.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(structure.unrealizedGain)}
                        </p>
                      </div>
                      <Button size="sm" asChild>
                        <a href={`/lp-portal/portfolio/${structure.id}?paymentId=${structure.paymentId}`}>
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Complete your onboarding process to access this structure and view all investment details.
                      </p>
                      <Button size="sm" variant="secondary" className="w-full" asChild>
                        <a href={`/lp-portal/onboarding/${structure.id}`}>
                          Complete Onboarding <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Capital Calls Section */}
      {capitalCallsData && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Capital Calls</h2>
            <p className="text-muted-foreground">
              Track your capital call obligations and payment history
            </p>
          </div>

          {/* Capital Calls Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Called</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(capitalCallsData.summary.totalCalled)}</div>
                <p className="text-xs text-muted-foreground">
                  {capitalCallsData.summary.totalCalls} call{capitalCallsData.summary.totalCalls !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(capitalCallsData.summary.totalPaid)}</div>
                <p className="text-xs text-muted-foreground">
                  {capitalCallsData.summary.totalCalled > 0
                    ? `${((capitalCallsData.summary.totalPaid / capitalCallsData.summary.totalCalled) * 100).toFixed(1)}% of total`
                    : 'No calls yet'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${capitalCallsData.summary.outstanding > 0 ? 'text-amber-600' : ''}`}>
                  {formatCurrency(capitalCallsData.summary.outstanding)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {capitalCallsData.summary.outstanding > 0 ? 'Requires payment' : 'All paid'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Structures</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{capitalCallsData.investors?.length || 0}</div>
                <p className="text-xs text-muted-foreground">With capital calls</p>
              </CardContent>
            </Card>
          </div>

          {/* Capital Calls Table */}
          {capitalCallsData.capitalCalls?.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Capital Call History</CardTitle>
                <CardDescription>
                  All capital calls across your investment structures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-sm">Call Number</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Structure</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Call Date</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Due Date</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Allocated</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Paid</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Outstanding</th>
                        <th className="text-center py-3 px-4 font-medium text-sm">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capitalCallsData.capitalCalls.map((call) => (
                        <tr key={call.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm font-medium">{call.callNumber}</td>
                          <td className="py-3 px-4 text-sm">{call.structureName}</td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(call.callDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(call.dueDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium">
                            {formatCurrency(call.allocatedAmount)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            {formatCurrency(call.paidAmount)}
                          </td>
                          <td className={`py-3 px-4 text-sm text-right font-medium ${call.outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {formatCurrency(call.outstanding)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={
                                call.status === 'Paid' ? 'default' :
                                call.status === 'Partially Paid' ? 'secondary' :
                                'outline'
                              }
                            >
                              {call.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {call.purpose}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">No capital calls yet</p>
                <p className="text-sm text-muted-foreground">
                  Capital calls will appear here when they are issued
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
