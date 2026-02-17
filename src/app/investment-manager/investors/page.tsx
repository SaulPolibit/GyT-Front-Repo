"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, User, Users, Building, Briefcase, Mail, MapPin, Wallet, Loader2, AlertCircle, CheckCircle, XCircle, CreditCard, Clock } from "lucide-react"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { getAuthToken, getAuthState } from "@/lib/auth-storage"

// Investor type from the new API endpoint
interface InvestorUser {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  country: string | null
  kycStatus: string
  walletAddress: string | null
  investorType: string
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  hasPendingPayments: boolean
  paymentsCount: number
  pendingPaymentsCount: number
  // Stripe Connect fields
  stripeAccountId?: string | null
  stripeOnboardingComplete?: boolean
  stripeAccountStatus?: string | null
}

// Helper function to handle 401 authentication errors
const handleAuthError = (response: Response, errorData: any) => {
  if (response.status === 401) {
    // Check for the specific error message pattern
    if (errorData.error?.includes('Invalid or expired token') ||
        errorData.message?.includes('Please provide a valid authentication token')) {
      // Clear all localStorage data
      localStorage.clear()
      // Redirect to login
      window.location.href = '/sign-in'
      return true
    }
  }
  return false
}

export default function InvestorsPage() {
  // Check if user is guest
  const authState = getAuthState()
  const currentUserRole = authState.user?.role ?? null
  const isGuest = currentUserRole === 4

  const [investors, setInvestors] = useState<InvestorUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Load data from API on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        const token = getAuthToken()
        if (!token) {
          setError('Authentication required. Please log in.')
          setIsLoading(false)
          return
        }

        // Fetch investors (users with role=3) with payment data
        const investorsUrl = getApiUrl(API_CONFIG.endpoints.getInvestorUsers)
        const investorsResponse = await fetch(investorsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!investorsResponse.ok) {
          const errorData = await investorsResponse.json()

          // Handle 401 authentication errors
          if (handleAuthError(investorsResponse, errorData)) {
            return // Exit early as we're redirecting
          }

          setError(errorData.message || 'Failed to fetch investors')
          setIsLoading(false)
          return
        }

        const investorsResult = await investorsResponse.json()
        if (investorsResult.success && Array.isArray(investorsResult.data)) {
          setInvestors(investorsResult.data)
        } else {
          setError('Invalid response format from API')
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching investors:', err)
        setError('Failed to load investors')
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter investors based on search and filters
  const filteredInvestors = investors.filter((inv) => {
    const invName = inv.name || `${inv.firstName || ''} ${inv.lastName || ''}`.trim() || inv.email
    const invEmail = inv.email || ''
    const matchesSearch = invName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invEmail.toLowerCase().includes(searchQuery.toLowerCase())

    // Type filtering logic
    let matchesType = false
    if (filterType === "all") {
      matchesType = true
    } else if (filterType === "Individual") {
      matchesType = inv.investorType?.toLowerCase() === "individual"
    } else if (filterType === "Company") {
      const companyTypes = ["institution", "family office", "fund of funds"]
      matchesType = companyTypes.includes(inv.investorType?.toLowerCase() || '')
    }

    // Status filtering logic
    let matchesStatus = false
    if (filterStatus === "all") {
      matchesStatus = true
    } else if (filterStatus === "KYC/KYB") {
      matchesStatus = inv.kycStatus === 'Not Started'
    } else if (filterStatus === "Payments") {
      matchesStatus = inv.hasPendingPayments === true
    } else if (filterStatus === "Active") {
      matchesStatus = inv.isActive === true
    } else if (filterStatus === "Inactive") {
      matchesStatus = inv.isActive === false
    }

    return matchesSearch && matchesType && matchesStatus
  })

  // Summary counts
  const totalInvestors = investors.length
  const activeInvestors = investors.filter(inv => inv.isActive).length
  const pendingKyc = investors.filter(inv => inv.kycStatus === 'Not Started').length
  const pendingPayments = investors.filter(inv => inv.hasPendingPayments).length

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'individual':
        return <User className="h-4 w-4" />
      case 'institution':
        return <Building className="h-4 w-4" />
      case 'family office':
        return <Users className="h-4 w-4" />
      case 'fund of funds':
        return <Briefcase className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const formatInvestorType = (type: string) => {
    if (!type) return 'Individual'
    // Capitalize first letter of each word
    return type.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const formatKycStatus = (status: string): string => {
    if (!status) return 'Not Started'
    const normalized = status.toLowerCase()
    if (normalized === 'not started') return 'Not Started'
    if (normalized === 'in progress') return 'In Progress'
    if (normalized === 'completed') return 'Completed'
    if (normalized === 'approved') return 'Approved'
    if (normalized === 'rejected') return 'Rejected'
    return status
  }

  const getKycStatusColor = (status: string) => {
    const normalized = formatKycStatus(status)
    switch (normalized) {
      case 'Not Started': return 'secondary'
      case 'In Progress': return 'outline'
      case 'Completed': return 'default'
      case 'Approved': return 'default'
      case 'Rejected': return 'destructive'
      default: return 'secondary'
    }
  }

  const truncateWalletAddress = (address: string | null) => {
    if (!address) return 'Not set'
    if (address.length <= 13) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading investors...</h3>
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
            <h3 className="text-lg font-semibold mb-2">Error Loading Investors</h3>
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
          <h1 className="text-3xl font-bold">Investors</h1>
          <p className="text-muted-foreground mt-1">
            {filteredInvestors.length} investor{filteredInvestors.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Investors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvestors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeInvestors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending KYC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingKyc}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search investors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filterType} onValueChange={setFilterType}>
            <TabsList>
              <TabsTrigger value="all">All Types</TabsTrigger>
              <TabsTrigger value="Individual">Individual</TabsTrigger>
              <TabsTrigger value="Company">Company</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Status Filter */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">All Status</TabsTrigger>
            <TabsTrigger value="KYC/KYB">KYC</TabsTrigger>
            <TabsTrigger value="Payments">Payments</TabsTrigger>
            <TabsTrigger value="Active">Active</TabsTrigger>
            <TabsTrigger value="Inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Investors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvestors.map((investor) => {
          const invName = investor.name || `${investor.firstName || ''} ${investor.lastName || ''}`.trim() || investor.email

          return (
            <Card key={investor.id} className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{invName}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getTypeIcon(investor.investorType)}
                      <span>{formatInvestorType(investor.investorType)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {investor.isActive ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Email */}
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">{investor.email || 'N/A'}</span>
                </div>

                {/* Country */}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{investor.country || 'Not specified'}</span>
                </div>

                {/* Wallet Address */}
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground font-mono">
                    {truncateWalletAddress(investor.walletAddress)}
                  </span>
                </div>

                {/* KYC Status */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">KYC Status</span>
                    <Badge variant={getKycStatusColor(investor.kycStatus)} className="text-xs">
                      {formatKycStatus(investor.kycStatus)}
                    </Badge>
                  </div>
                </div>

                {/* Pending Payments indicator */}
                {investor.hasPendingPayments && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pending Payments</span>
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                        {investor.pendingPaymentsCount} pending
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Stripe Connect Status */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Stripe Connect
                    </span>
                    {investor.stripeAccountStatus === 'enabled' ? (
                      <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : investor.stripeAccountStatus === 'pending' ? (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    ) : investor.stripeAccountStatus === 'disabled' || investor.stripeAccountStatus === 'rejected' ? (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        {investor.stripeAccountStatus === 'disabled' ? 'Disabled' : 'Rejected'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Not Setup
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredInvestors.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No investors found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Add your first investor to get started'}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
