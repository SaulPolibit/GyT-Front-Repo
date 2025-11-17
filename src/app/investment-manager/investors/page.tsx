"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, TrendingUp, TrendingDown, User, Users, Building, Briefcase, Mail, Phone } from "lucide-react"
import investorsData from "@/data/investors.json"
import type { Investor, CapitalCall, Distribution, Structure } from "@/lib/types"
import { getInvestors } from "@/lib/investors-storage"
import { getCapitalCalls } from "@/lib/capital-calls-storage"
import { getDistributions } from "@/lib/distributions-storage"
import { getStructures } from "@/lib/structures-storage"
import { calculateIRR } from "@/lib/performance-calculations"

export default function InvestorsPage() {
  const staticInvestors = investorsData as Investor[]
  const [dynamicInvestors, setDynamicInvestors] = useState<Investor[]>([])
  const [capitalCalls, setCapitalCalls] = useState<CapitalCall[]>([])
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [structures, setStructures] = useState<Structure[]>([])

  // Load data from localStorage on mount
  useEffect(() => {
    const storedInvestors = getInvestors()
    const storedCapitalCalls = getCapitalCalls()
    const storedDistributions = getDistributions()
    const storedStructures = getStructures()

    setDynamicInvestors(storedInvestors)
    setCapitalCalls(storedCapitalCalls)
    setDistributions(storedDistributions)
    setStructures(storedStructures)
  }, [])

  // Merge static and dynamic investors, removing duplicates (prefer dynamic over static)
  const dynamicIds = new Set(dynamicInvestors.map(inv => inv.id))
  const uniqueStaticInvestors = staticInvestors.filter(inv => !dynamicIds.has(inv.id))
  const investors = [...uniqueStaticInvestors, ...dynamicInvestors]
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

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
    const matchesSearch = inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inv.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || inv.type === filterType
    const matchesStatus = filterStatus === "all" || inv.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  // Calculate summary metrics from transactions
  const totalCommitment = investors.reduce((sum, inv) => {
    return sum + (inv.fundOwnerships?.reduce((foSum, fo) => foSum + fo.commitment, 0) || 0)
  }, 0)

  const totalContributed = investors.reduce((sum, inv) => {
    return sum + calculateCalledCapital(inv.id)
  }, 0)

  const totalDistributed = investors.reduce((sum, inv) => {
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

  const formatStatus = (status: string) => {
    // Capitalize first letter to handle both lowercase and capitalized formats
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  const getStatusColor = (status: string) => {
    // Handle both formats: lowercase and capitalized
    const normalizedStatus = formatStatus(status)
    switch (normalizedStatus) {
      case 'Pending': return 'outline'        // Pre-registered
      case 'Kyc/kyb': return 'outline'        // Identity verification
      case 'Contracts': return 'outline'      // Contract signing
      case 'Payments': return 'outline'       // Payment setup
      case 'Active': return 'default'         // Fully onboarded
      case 'Inactive': return 'secondary'     // Previously active
      default: return 'secondary'
    }
  }

  const getK1StatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'default'
      case 'Completed': return 'default'
      case 'In Progress': return 'outline'
      case 'Not Started': return 'secondary'
      case 'Amended': return 'outline'
      default: return 'secondary'
    }
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
        <Button asChild>
          <Link href="/investment-manager/investors/add">
            <Plus className="h-4 w-4 mr-2" />
            Add Investor
          </Link>
        </Button>
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
              <TabsTrigger value="Institution">Institution</TabsTrigger>
              <TabsTrigger value="Family Office">Family Office</TabsTrigger>
              <TabsTrigger value="Fund of Funds">Fund of Funds</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Status Filter */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">All Status</TabsTrigger>
            <TabsTrigger value="Active">Active</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="KYC/KYB">KYC/KYB</TabsTrigger>
            <TabsTrigger value="Contracts">Contracts</TabsTrigger>
            <TabsTrigger value="Payments">Payments</TabsTrigger>
            <TabsTrigger value="Inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Investors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvestors.map((investor) => (
          <Link key={investor.id} href={`/investment-manager/investors/${investor.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{investor.name}</CardTitle>
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
                    <span className="text-xs text-muted-foreground truncate">{investor.email}</span>
                  </div>
                  {investor.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{investor.phone}</span>
                    </div>
                  )}
                </div>

                {/* Financial Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Commitment</div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(investor.fundOwnerships?.reduce((sum, fo) => sum + fo.commitment, 0) || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Current Value</div>
                    <div className="text-sm font-semibold">{formatCurrency(calculateCurrentValue(investor))}</div>
                  </div>
                </div>

                {/* Capital Calls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Called Capital</div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(calculateCalledCapital(investor.id))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Uncalled</div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(
                        (investor.fundOwnerships?.reduce((sum, fo) => sum + fo.commitment, 0) || 0) -
                        calculateCalledCapital(investor.id)
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

                {/* K-1 Status */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">K-1 Status</span>
                    <Badge variant={getK1StatusColor(investor.k1Status)} className="text-xs">
                      {investor.k1Status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
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
            {!searchQuery && (
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
