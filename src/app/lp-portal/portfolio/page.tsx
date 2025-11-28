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
  Wallet,
  Search,
  Grid3x3,
  List,
  ArrowRight,
  Building2,
  Landmark,
  AlertCircle,
} from "lucide-react"
import {
  getInvestorByEmail,
  getCurrentInvestorEmail,
  getInvestorStructures,
} from "@/lib/lp-portal-helpers"
import { useAuth } from "@/hooks/useAuth"

export default function PortfolioPage() {
  const { user } = useAuth()
  const [currentEmail, setCurrentEmail] = React.useState('')
  const [structures, setStructures] = React.useState<any[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    const email = getCurrentInvestorEmail()
    setCurrentEmail(email)

    const investor = getInvestorByEmail(email)
    if (investor) {
      setStructures(getInvestorStructures(investor))
    }
  }, [refreshKey])

  // Listen for storage events to refresh when data changes
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'polibit_investors') {
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
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  // Calculate summary metrics
  const totalCommitment = structures.reduce((sum, s) => sum + s.commitment, 0)
  const totalCalledCapital = structures.reduce((sum, s) => sum + s.calledCapital, 0)
  const totalCurrentValue = structures.reduce((sum, s) => sum + s.currentValue, 0)

  // Filter structures
  const filteredStructures = structures.filter(structure => {
    const matchesSearch = structure.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || structure.type === typeFilter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && structure.commitment > 0) ||
      (statusFilter === 'pending' && structure.commitment === 0)

    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (structure: any) => {
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
            <Card key={structure.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(structure.type)}
                    <div>
                      <CardTitle className="text-lg">{structure.name}</CardTitle>
                      <CardDescription>{structure.type}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(structure)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <a href={`/lp-portal/portfolio/${structure.id}`}>
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
    </div>
  )
}
