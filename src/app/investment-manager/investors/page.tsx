"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, TrendingUp, TrendingDown, User, Users, Building, Briefcase, Mail, Phone, Loader2, AlertCircle } from "lucide-react"
import type { Investor, CapitalCall, Distribution } from "@/lib/types"
import type { Structure } from "@/lib/structures-storage"
import { getCapitalCalls } from "@/lib/capital-calls-storage"
import { getDistributions } from "@/lib/distributions-storage"
import { calculateIRR } from "@/lib/performance-calculations"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { getAuthToken, getAuthState } from "@/lib/auth-storage"

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

  const [investors, setInvestors] = useState<Investor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [capitalCalls, setCapitalCalls] = useState<CapitalCall[]>([])
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [structures, setStructures] = useState<Structure[]>([])
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

        // Fetch investors from users table (role 3 = INVESTOR)
        const investorsUrl = getApiUrl(API_CONFIG.endpoints.getUsersByRole('3'))
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
          // Map the API response to match the expected Investor type
          const mappedInvestors = investorsResult.data.map((inv: any) => ({
            ...inv,
            // Map API fields to expected fields
            name: inv.name || (inv.user ? `${inv.user.firstName} ${inv.user.lastName}`.trim() : inv.email),
            type: inv.investorType || 'n/d',
            status: inv.kycStatus || inv.status || 'Pending',
            // Map structure object to fundOwnerships array for backward compatibility
            fundOwnerships: inv.structure ? [{
              fundId: inv.structure.id,
              fundName: inv.structure.name,
              fundType: inv.structure.type,
              commitment: inv.commitment || 0,
              investedDate: inv.createdAt,
            }] : []
          }))

          setInvestors(mappedInvestors)

          // Extract and populate structures data from investor structure
          const structuresMap = new Map<string, Structure>()
          investorsResult.data.forEach((investor: any) => {
            if (investor.structure) {
              const structureId = investor.structure.id
              if (structureId && !structuresMap.has(structureId)) {
                structuresMap.set(structureId, {
                  id: structureId,
                  name: investor.structure.name,
                  type: investor.structure.type,
                  subtype: '',
                  status: investor.structure.status || 'active',
                  jurisdiction: 'Unknown',
                  currency: investor.structure.baseCurrency || 'USD',
                  totalCommitment: 0,
                  investors: 0,
                  createdDate: new Date(),
                } as Structure)
              }
            }
          })

          setStructures(Array.from(structuresMap.values()))
        } else {
          setError('Invalid response format from API')
        }

        // Load capital calls and distributions from localStorage (these will be migrated later)
        const storedCapitalCalls = getCapitalCalls()
        const storedDistributions = getDistributions()

        setCapitalCalls(storedCapitalCalls)
        setDistributions(storedDistributions)

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching investors:', err)
        setError('Failed to load investors')
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate called capital from capital call transactions
  const calculateCalledCapital = (investorId: string): number => {
    const investorCapitalCalls = capitalCalls.filter(cc =>
      cc.status !== 'Draft' && cc.status !== 'Cancelled'
    )

    return investorCapitalCalls.reduce((sum, cc) => {
      const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investorId)
      return sum + (allocation?.amountPaid || 0)
    }, 0)
  }

  // Calculate total distributed from distribution transactions
  const calculateTotalDistributed = (investorId: string): number => {
    const investorDistributions = distributions.filter(dist =>
      dist.status === 'Completed'
    )

    return investorDistributions.reduce((sum, dist) => {
      const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investorId)
      return sum + (allocation?.finalAllocation || 0)
    }, 0)
  }

  // Calculate current value based on ownership in each structure
  const calculateCurrentValue = (investor: Investor): number => {
    if (!investor.fundOwnerships || investor.fundOwnerships.length === 0) return 0

    return investor.fundOwnerships.reduce((sum, ownership) => {
      const structure = structures.find(s => s.id === ownership.fundId)
      if (!structure) return sum

      // Calculate called capital for this fund
      const fundCapitalCalls = capitalCalls.filter(cc =>
        cc.fundId === ownership.fundId &&
        cc.status !== 'Draft' &&
        cc.status !== 'Cancelled'
      )

      const calledCapital = fundCapitalCalls.reduce((callSum, cc) => {
        const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
        return callSum + (allocation?.amountPaid || 0)
      }, 0)

      // Calculate ownership based on called capital / total fund size
      const ownershipPercent = structure.totalCommitment > 0
        ? (calledCapital / structure.totalCommitment) * 100
        : 0

      // Use NAV if available, otherwise fall back to totalCommitment
      const baseValue = structure.currentNav ?? structure.totalCommitment
      const currentValue = baseValue * (ownershipPercent / 100)

      return sum + currentValue
    }, 0)
  }

  // Calculate IRR from cash flows
  const calculateInvestorIRR = (investorId: string): number => {
    const cashFlows: { date: Date; amount: number }[] = []

    // Add capital calls as negative cash flows
    capitalCalls
      .filter(cc => cc.status !== 'Draft' && cc.status !== 'Cancelled')
      .forEach(cc => {
        const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investorId)
        if (allocation && allocation.amountPaid > 0) {
          cashFlows.push({
            date: new Date(cc.callDate),
            amount: -allocation.amountPaid,
          })
        }
      })

    // Add distributions as positive cash flows
    distributions
      .filter(dist => dist.status === 'Completed')
      .forEach(dist => {
        const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investorId)
        if (allocation && allocation.finalAllocation > 0) {
          cashFlows.push({
            date: new Date(dist.distributionDate),
            amount: allocation.finalAllocation,
          })
        }
      })

    // Calculate total distributed and current value for this investor
    const totalDistributed = calculateTotalDistributed(investorId)
    const investor = investors.find(inv => inv.id === investorId)
    const currentValue = investor ? calculateCurrentValue(investor) : 0

    // Add unrealized value as final positive cash flow
    const unrealizedValue = currentValue - totalDistributed
    if (unrealizedValue > 0) {
      cashFlows.push({
        date: new Date(),
        amount: unrealizedValue,
      })
    }

    // Need at least 2 cash flows with both negative and positive
    if (cashFlows.length < 2) return 0

    const hasNegative = cashFlows.some(cf => cf.amount < 0)
    const hasPositive = cashFlows.some(cf => cf.amount > 0)
    if (!hasNegative || !hasPositive) return 0

    try {
      const irr = calculateIRR(cashFlows)
      // Sanity check: IRR shouldn't be astronomical
      if (Math.abs(irr) > 1000) return 0
      return irr
    } catch (error) {
      console.error('IRR calculation error:', error)
      return 0
    }
  }

  const filteredInvestors = investors.filter((inv) => {
    // Construct name from firstName and lastName
    const firstName = (inv as any).firstName || ''
    const lastName = (inv as any).lastName || ''
    const invName = inv.name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || '')
    const invEmail = inv.email || (inv as any).investorEmail || ''
    const matchesSearch = invName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invEmail.toLowerCase().includes(searchQuery.toLowerCase())

    // Type filtering logic
    let matchesType = false
    if (filterType === "all") {
      matchesType = true
    } else if (filterType === "Individual") {
      // Show individual investors (both formats: "individual" and "Individual")
      matchesType = inv.type.toLowerCase() === "individual"
    } else if (filterType === "Company") {
      // Show company types: institution, family-office, fund-of-funds
      const companyTypes = ["institution", "family-office", "fund-of-funds"]
      matchesType = companyTypes.includes(inv.type.toLowerCase())
    }

    // Status filtering logic with new rules
    let matchesStatus = false
    if (filterStatus === "all") {
      matchesStatus = true
    } else if (filterStatus === "KYC/KYB") {
      // Show when kycStatus is 'Not Started'
      matchesStatus = (inv as any).kycStatus === 'Not Started'
    } else if (filterStatus === "Contracts") {
      // Show when hasFreeDocusealSubmission is true
      matchesStatus = (inv as any).hasFreeDocusealSubmission === true
    } else if (filterStatus === "Payments") {
      // Show when there's a payment with status 'pending'
      const payments = (inv as any).payments
      matchesStatus = Array.isArray(payments) && payments.some((payment: any) => payment.status === 'pending')
    } else if (filterStatus === "Active") {
      // Show when user.isActive is true
      matchesStatus = (inv as any).user?.isActive === true
    } else if (filterStatus === "Inactive") {
      // Show when user.isActive is false
      matchesStatus = (inv as any).user?.isActive === false
    }

    return matchesSearch && matchesType && matchesStatus
  })

  // Calculate summary metrics from API data or fallback to calculations
  const totalCommitment = investors.reduce((sum, inv) => {
    // Try to get from API response first, fallback to fundOwnerships calculation
    const apiCommitment = (inv as any).totalCommitment || (inv as any).commitment
    if (apiCommitment !== undefined) {
      return sum + apiCommitment
    }
    return sum + (inv.fundOwnerships?.reduce((foSum, fo) => foSum + fo.commitment, 0) || 0)
  }, 0)

  const totalContributed = investors.reduce((sum, inv) => {
    // Try to get from API response first, fallback to calculation
    const apiContributed = (inv as any).totalContributed || (inv as any).contributed
    if (apiContributed !== undefined) {
      return sum + apiContributed
    }
    return sum + calculateCalledCapital(inv.id)
  }, 0)

  const totalDistributed = investors.reduce((sum, inv) => {
    // Try to get from API response first, fallback to calculation
    const apiDistributed = (inv as any).totalDistributed || (inv as any).distributed
    if (apiDistributed !== undefined) {
      return sum + apiDistributed
    }
    return sum + calculateTotalDistributed(inv.id)
  }, 0)

  const avgIRR = investors.length > 0
    ? investors.reduce((sum, inv) => sum + calculateInvestorIRR(inv.id), 0) / investors.length
    : 0

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

  const getTypeIcon = (type: string) => {
    // Support both formats: lowercase kebab-case (new) and capitalized with spaces (legacy JSON)
    switch (type) {
      case 'individual':
      case 'Individual':
        return <User className="h-4 w-4" />
      case 'institution':
      case 'Institution':
        return <Building className="h-4 w-4" />
      case 'family-office':
      case 'Family Office':
        return <Users className="h-4 w-4" />
      case 'fund-of-funds':
      case 'Fund of Funds':
        return <Briefcase className="h-4 w-4" />
      default: return null
    }
  }

  const formatInvestorType = (type: string) => {
    // Convert kebab-case to Title Case with spaces
    switch (type) {
      case 'individual': return 'Individual'
      case 'institution': return 'Institution'
      case 'family-office': return 'Family Office'
      case 'fund-of-funds': return 'Fund of Funds'
      default: return type // Return as-is if already formatted
    }
  }

  const formatStatus = (status: string): string => {
    // Handle special cases first, then apply normal case transformation
    if (!status) return 'Pending'
    const normalized = status.toLowerCase()

    // KYC/Onboarding statuses
    if (normalized === 'not started') return 'Not Started'
    if (normalized === 'in progress') return 'In Progress'
    if (normalized === 'completed') return 'Completed'
    if (normalized === 'approved') return 'Approved'
    if (normalized === 'rejected') return 'Rejected'

    // Standard statuses
    if (normalized === 'kyc/kyb') return 'KYC/KYB'
    if (normalized === 'pending') return 'Pending'
    if (normalized === 'contracts') return 'Contracts'
    if (normalized === 'commitment') return 'Commitment'
    if (normalized === 'active') return 'Active'
    if (normalized === 'inactive') return 'Inactive'

    return status // Return as-is if unrecognized
  }

  const getStatusColor = (status: string) => {
    // Handle both formats: lowercase and capitalized
    const normalizedStatus = formatStatus(status)
    switch (normalizedStatus) {
      // KYC/Onboarding statuses
      case 'Not Started': return 'secondary'
      case 'In Progress': return 'outline'
      case 'Completed': return 'default'
      case 'Approved': return 'default'
      case 'Rejected': return 'destructive'

      // Standard statuses
      case 'Pending': return 'outline'        // Pre-registered
      case 'KYC/KYB': return 'outline'        // Identity verification
      case 'Contracts': return 'outline'      // Contract signing
      case 'Commitment': return 'outline'     // Capital commitment setup
      case 'Active': return 'default'         // Fully onboarded
      case 'Inactive': return 'secondary'     // Previously active

      default: return 'secondary'
    }
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
        {!isGuest && (
          <Button asChild>
            <Link href="/investment-manager/investors/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Investor
            </Link>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commitment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommitment)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contributed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalContributed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Distributed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalDistributed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg IRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPercent(avgIRR)}</div>
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
            <TabsTrigger value="Contracts">Contracts</TabsTrigger>
            <TabsTrigger value="Payments">Payments</TabsTrigger>
            <TabsTrigger value="Active">Active</TabsTrigger>
            <TabsTrigger value="Inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Investors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvestors.map((investor) => {
          // Construct name from firstName and lastName
          const firstName = (investor as any).firstName || ''
          const lastName = (investor as any).lastName || ''
          const invName = investor.name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || 'Unnamed')
          const invEmail = investor.email || (investor as any).investorEmail || 'N/A'
          const invPhone = investor.phone || (investor as any).investorPhone

          return (
            <Link key={investor.id} href={`/investment-manager/investors/${investor.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{invName}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        {getTypeIcon(investor.type)}
                        <span>{formatInvestorType(investor.type)}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(investor.status)}>
                      {formatStatus(investor.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{invEmail}</span>
                    </div>
                    {invPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{invPhone}</span>
                      </div>
                    )}
                </div>

                {/* Financial Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Commitment</div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(
                        (investor as any).totalCommitment ||
                        (investor as any).commitment ||
                        investor.fundOwnerships?.reduce((sum, fo) => sum + fo.commitment, 0) ||
                        0
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Current Value</div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(
                        (investor as any).currentValue ||
                        calculateCurrentValue(investor)
                      )}
                    </div>
                  </div>
                </div>

                {/* Capital Calls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Called Capital</div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(
                        (investor as any).totalContributed ||
                        (investor as any).contributed ||
                        calculateCalledCapital(investor.id)
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Uncalled</div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(
                        ((investor as any).totalCommitment || (investor as any).commitment || investor.fundOwnerships?.reduce((sum, fo) => sum + fo.commitment, 0) || 0) -
                        ((investor as any).totalContributed || (investor as any).contributed || calculateCalledCapital(investor.id))
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Unrealized Gain</div>
                    <div className={`text-sm font-semibold ${
                      (calculateCurrentValue(investor) - calculateCalledCapital(investor.id)) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(calculateCurrentValue(investor) - calculateCalledCapital(investor.id))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">IRR</div>
                    <div className={`text-sm font-semibold flex items-center gap-1 ${
                      calculateInvestorIRR(investor.id) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateInvestorIRR(investor.id) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {formatPercent(calculateInvestorIRR(investor.id))}
                    </div>
                  </div>
                </div>

                {/* Fund Ownership */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Structures</span>
                    <span className="font-medium">
                      {investor.fundOwnerships?.length || 0} structure{(investor.fundOwnerships?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* KYC Status */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">KYC Status</span>
                    <Badge variant={getStatusColor((investor as any).kycStatus || investor.status)} className="text-xs">
                      {formatStatus((investor as any).kycStatus || investor.status)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
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
            {!searchQuery && !isGuest && (
              <Button asChild>
                <Link href="/investment-manager/investors/add">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Investor
                </Link>
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
