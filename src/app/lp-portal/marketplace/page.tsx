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
import type { Structure } from "@/lib/structures-storage"
import { getAuthToken } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

export default function MarketplacePage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [structures, setStructures] = React.useState<Structure[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchStructures = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = getAuthToken()

        if (!token) {
          setError('No authentication token found')
          setIsLoading(false)
          return
        }

        const response = await fetch(getApiUrl(API_CONFIG.endpoints.getAllStructures), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        // Check for 401 Unauthorized
        if (response.status === 401) {

          // Check if it's an expired token error
          try {
            const errorData = await response.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Account] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/lp-portal/login')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch structures: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('[Marketplace] API Response:', data)

        // Map API fields to existing structure format
        const mappedStructures = data.data.map((item: any) => ({
          ...item,
          currency: item.baseCurrency,
          jurisdiction: item.taxJurisdiction,
          fundTerm: item.finalDate,
          bannerImage: item.bannerImage,
        }))

        setStructures(mappedStructures)
      } catch (err) {
        console.error('[Marketplace] Error fetching structures:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch structures')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStructures()
  }, [refreshKey])


  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (date: Date | string | undefined) => {
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

  // Filter structures
  const filteredStructures = structures.filter(structure => {
    const matchesSearch = structure.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          structure.subtype.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || structure.type === typeFilter
    const matchesStatus = statusFilter === 'all' || structure.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

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
            <div className="text-2xl font-bold">{structures.length}</div>
            <p className="text-xs text-muted-foreground">Available structures</p>
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

      {/* Structures Grid/List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg font-semibold mb-2">Loading structures...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Landmark className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold mb-2">Error loading structures</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => setRefreshKey(prev => prev + 1)}>Try Again</Button>
          </CardContent>
        </Card>
      ) : filteredStructures.length === 0 ? (
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
          {filteredStructures.map((structure) => (
            <Card key={structure.id} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
              {structure.bannerImage && (
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src={structure.bannerImage}
                    alt={structure.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                      {getTypeIcon(structure.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{structure.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{structure.jurisdiction}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(structure.status)} className="flex-shrink-0 ml-2">
                    {structure.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                {/* Type and Subtype */}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{getTypeLabel(structure.type)}</Badge>
                  {structure.subtype && structure.subtype.trim() !== '' && (
                    <Badge variant="outline" className="text-xs">{structure.subtype}</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{structure.currency}</Badge>
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
              ))
          }
        </div>
      )}
    </div>
  )
}
