"use client"

import * as React from "react"
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
  Search,
  Grid3x3,
  List,
  Building2,
  Landmark,
  Briefcase,
  ArrowRight,
  MapPin,
  Users,
} from "lucide-react"
import { getInvestments } from "@/lib/investments-storage"
import { getStructures } from "@/lib/structures-storage"
import type { Investment } from "@/lib/types"
import type { Structure } from "@/lib/structures-storage"

export default function MarketplacePage() {
  const [investments, setInvestments] = React.useState<Investment[]>([])
  const [structures, setStructures] = React.useState<Structure[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState('all')
  const [sectorFilter, setSectorFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    const allInvestments = getInvestments()
    const allStructures = getStructures()
    setInvestments(allInvestments)
    setStructures(allStructures)
  }, [refreshKey])

  // Listen for storage events to refresh when data changes
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'polibit_investments' || e.key === 'polibit_structures') {
        setRefreshKey(prev => prev + 1)
      }
    }

    const handleFocus = () => {
      setRefreshKey(prev => prev + 1)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A'
    try {
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return 'N/A'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fund':
        return <Landmark className="h-5 w-5" />
      case 'sa':
        return <Building2 className="h-5 w-5" />
      case 'fideicomiso':
        return <Briefcase className="h-5 w-5" />
      case 'private-debt':
        return <DollarSign className="h-5 w-5" />
      default:
        return <Landmark className="h-5 w-5" />
    }
  }

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'fundraising':
        return 'secondary'
      case 'closed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fund':
        return 'Fund'
      case 'sa':
        return 'SA/LLC'
      case 'fideicomiso':
        return 'Fideicomiso/Trust'
      case 'private-debt':
        return 'Private Debt'
      default:
        return type
    }
  }

  // Filter investments
  const filteredInvestments = investments.filter(investment => {
    const matchesSearch = investment.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || investment.type === typeFilter
    const matchesSector = sectorFilter === 'all' || investment.sector === sectorFilter
    const matchesStatus = statusFilter === 'all' || investment.status === statusFilter

    return matchesSearch && matchesType && matchesSector && matchesStatus
  })

  // Filter structures
  const filteredStructures = structures.filter(structure => {
    const matchesSearch = structure.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || structure.status === statusFilter
    // Structures don't have type and sector in the same way, so we skip those filters for structures
    return matchesSearch && matchesStatus
  })

  // Combine and filter all marketplace items
  const allMarketplaceItems = [
    ...filteredInvestments.map((inv: Investment) => ({ ...inv, itemType: 'investment' as const })),
    ...filteredStructures.map((struct: any) => ({ ...struct, itemType: 'structure' as const }))
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Structure Marketplace</h1>
        <p className="text-muted-foreground">
          Explore available investment opportunities and fund structures
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Structures</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allMarketplaceItems.length}</div>
            <p className="text-xs text-muted-foreground">{investments.length} investments + {structures.length} funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commitment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(structures.reduce((sum, s) => sum + s.totalCommitment, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Across all structures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {structures.reduce((sum, s) => sum + s.investors, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Active investors</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
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
              <SelectItem value="fund">Fund</SelectItem>
              <SelectItem value="sa">SA/LLC</SelectItem>
              <SelectItem value="fideicomiso">Fideicomiso/Trust</SelectItem>
              <SelectItem value="private-debt">Private Debt</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="fundraising">Fundraising</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
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

      {/* Marketplace Grid/List */}
      {allMarketplaceItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No structures found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No structures available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
          {allMarketplaceItems.map((item: any) => {
            if (item.itemType === 'investment') {
              const investment = item as Investment & { itemType: 'investment' }
              return (
                <Card key={`inv-${investment.id}`} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                          {getTypeIcon(investment.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{investment.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {investment.geography.city}, {investment.geography.state || investment.geography.country}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(investment.status)} className="flex-shrink-0 ml-2">
                        {investment.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1">
                    {/* Fund Name Badge */}
                    <div className="flex gap-2 flex-wrap items-center">
                      <Badge className="text-xs bg-primary/20 text-primary hover:bg-primary/30">
                        {getFundName(investment.fundId)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">Investment</Badge>
                    </div>

                    {/* Type and Sector */}
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{investment.type}</Badge>
                      <Badge variant="outline" className="text-xs">{investment.sector}</Badge>
                      <Badge variant="outline" className="text-xs">{investment.investmentType}</Badge>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      {getTotalFundedAmount(investment) > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Funded Amount</p>
                          <p className="text-sm font-semibold">{formatCurrency(getTotalFundedAmount(investment))}</p>
                        </div>
                      )}

                      {getCurrentValue(investment) > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Current Value</p>
                          <p className="text-sm font-semibold">{formatCurrency(getCurrentValue(investment))}</p>
                        </div>
                      )}

                      {investment.fundEquityPosition && (
                        <div>
                          <p className="text-xs text-muted-foreground">Ownership</p>
                          <p className="text-sm font-semibold">{formatPercent(investment.fundEquityPosition.ownershipPercent)}</p>
                        </div>
                      )}

                      {investment.fundDebtPosition && (
                        <div>
                          <p className="text-xs text-muted-foreground">Interest Rate</p>
                          <p className="text-sm font-semibold">{formatPercent(investment.fundDebtPosition.interestRate)}</p>
                        </div>
                      )}
                    </div>

                    {/* Returns or Maturity */}
                    {investment.totalFundPosition && (
                      <div className="pt-2 border-t">
                        {investment.investmentType === 'EQUITY' && investment.totalFundPosition.irr !== undefined && (
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">IRR</p>
                              <p className={`text-sm font-semibold ${investment.totalFundPosition.irr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercent(investment.totalFundPosition.irr)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">MOIC</p>
                              <p className={`text-sm font-semibold ${investment.totalFundPosition.multiple >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                                {investment.totalFundPosition.multiple.toFixed(2)}x
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>

                  {/* CTA */}
                  <div className="px-6 pb-6 pt-2 border-t mt-auto">
                    <Button size="sm" className="w-full" asChild>
                      <a href={`/lp-portal/marketplace/investment/${investment.id}`}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </Card>
              )
            } else {
              // Structure item
              const structure = item as any
              return (
                <Card key={`struct-${structure.id}`} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                          <Landmark className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{structure.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{structure.type}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(structure.status)} className="flex-shrink-0 ml-2">
                        {structure.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1">
                    {/* Type Badge */}
                    <div className="flex gap-2 flex-wrap items-center">
                      <Badge className="text-xs bg-primary/20 text-primary hover:bg-primary/30">
                        Fund Structure
                      </Badge>
                      <Badge variant="secondary" className="text-xs">Structure</Badge>
                    </div>

                    {/* Details */}
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">{structure.type}</Badge>
                      {structure.jurisdiction && <Badge variant="outline" className="text-xs">{structure.jurisdiction}</Badge>}
                      {structure.fundType && <Badge variant="outline" className="text-xs">{structure.fundType}</Badge>}
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Commitment</p>
                        <p className="text-sm font-semibold">{formatCurrency(structure.totalCommitment)}</p>
                      </div>
                      {structure.currency && (
                        <div>
                          <p className="text-xs text-muted-foreground">Currency</p>
                          <p className="text-sm font-semibold">{structure.currency}</p>
                        </div>
                      )}
                      {structure.investors && (
                        <div>
                          <p className="text-xs text-muted-foreground">Investors</p>
                          <p className="text-sm font-semibold">{structure.investors}</p>
                        </div>
                      )}
                      {structure.managementFee && (
                        <div>
                          <p className="text-xs text-muted-foreground">Mgmt Fee</p>
                          <p className="text-sm font-semibold">{structure.managementFee}</p>
                        </div>
                      )}
                    </div>

                    {/* Fund Details */}
                    {(structure.inceptionDate || structure.fundTerm) && (
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {structure.inceptionDate && (
                            <div>
                              <p className="text-muted-foreground">Inception</p>
                              <p className="font-semibold">{formatDate(structure.inceptionDate?.toString() || '')}</p>
                            </div>
                          )}
                          {structure.fundTerm && (
                            <div>
                              <p className="text-muted-foreground">Term</p>
                              <p className="font-semibold">{structure.fundTerm}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {/* CTA */}
                  <div className="px-6 pb-6 pt-2 border-t mt-auto">
                    <Button size="sm" className="w-full" asChild>
                      <a href={`/lp-portal/marketplace/structure/${structure.id}`}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </Card>
              )
            }
          })}
        </div>
      )}
    </div>
  )
}
