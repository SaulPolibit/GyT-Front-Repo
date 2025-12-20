"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, Plus, MapPin, Search, TrendingUp, Users, Calendar, LayoutGrid, List, ChevronDown, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { getStructures, Structure, migrateStructures } from '@/lib/structures-storage'
import { getVisibilitySettings } from '@/lib/visibility-storage'
import { getApiUrl, API_CONFIG } from '@/lib/api-config'
import { getAuthState, logout } from '@/lib/auth-storage'
import { toast } from 'sonner'
import { formatCompactCurrency } from '@/lib/format-utils'

// Type labels
const TYPE_LABELS: Record<string, string> = {
  fund: 'Fund',
  sa: 'SA / LLC',
  fideicomiso: 'Trust',
  'private-debt': 'Private Debt',
}

// Status badge variants
const STATUS_VARIANTS: Record<string, 'default' | 'outline' | 'destructive' | 'secondary'> = {
  active: 'default',
  fundraising: 'secondary',
  closed: 'outline',
}

export default function StructuresPage() {
  const router = useRouter()
  const [structures, setStructures] = useState<Structure[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [visibilitySettings, setVisibilitySettings] = useState(getVisibilitySettings())
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Get current user role
  const authState = getAuthState()
  const currentUserRole = authState.user?.role ?? null
  const isGuest = currentUserRole === 4

  // Load structures from API on mount
  useEffect(() => {
    const fetchStructures = async () => {
      try {
        const authState = getAuthState()
        const token = authState.token

        if (!token) {
          console.warn('No auth token found, loading from localStorage as fallback')
          // Fallback to localStorage if no token
          migrateStructures()
          const loadedStructures = getStructures()
          setStructures(loadedStructures)
          return
        }

        const response = await fetch(getApiUrl(API_CONFIG.endpoints.getAllStructures), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          // Handle 401 Unauthorized - Invalid or expired token
          if (response.status === 401) {
            console.log('[Auth] 401 Unauthorized - Clearing session and redirecting to login')
            logout()
            window.location.href = '/sign-in'
            return
          }

          throw new Error('Failed to fetch structures')
        }

        const data = await response.json()
        console.log('📊 Loaded structures from API:', data.data?.map((s: Structure) => ({
          id: s.id,
          name: s.name,
          parentStructureId: s.parentStructureId,
          parentStructureOwnershipPercentage: s.parentStructureOwnershipPercentage
        })))

        setStructures(data.data || [])
      } catch (error) {
        console.error('Error fetching structures:', error)
        toast.error('Failed to load structures')
        // Fallback to localStorage on error
        migrateStructures()
        const loadedStructures = getStructures()
        setStructures(loadedStructures)
      }
    }

    fetchStructures()
  }, [])

  // Listen for visibility settings changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setVisibilitySettings(getVisibilitySettings())
    }

    window.addEventListener('visibility-settings-changed', handleVisibilityChange)
    window.addEventListener('storage', handleVisibilityChange)

    return () => {
      window.removeEventListener('visibility-settings-changed', handleVisibilityChange)
      window.removeEventListener('storage', handleVisibilityChange)
    }
  }, [])

  const handleCreateNew = () => {
    router.push('/investment-manager/structure-setup')
  }

  const handleViewStructure = (id: string) => {
    router.push(`/investment-manager/structures/${id}`)
  }

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  // Filter structures based on search, type filter, and status filter
  const filteredStructures = structures.filter((structure) => {
    const matchesSearch = structure.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         structure.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = selectedFilter === 'all' ||
                         (selectedFilter === 'fund' && structure.type === 'fund') ||
                         (selectedFilter === 'sa' && structure.type === 'sa') ||
                         (selectedFilter === 'fideicomiso' && structure.type === 'fideicomiso')

    const matchesStatus = selectedStatus === 'all' ||
                         structure.status.toLowerCase() === selectedStatus.toLowerCase()

    return matchesSearch && matchesFilter && matchesStatus
  })

  // For grid view: show all structures (both parent and child)
  const masterStructures = filteredStructures

  // For list view: organize into hierarchies
  const organizedStructures: Array<{master: Structure; children: Structure[]}> = []
  const processedIds = new Set<string>()

  filteredStructures.forEach((structure) => {
    if (!structure.parentStructureId || structure.hierarchyLevel === 1) {
      // This is a master structure
      if (!processedIds.has(structure.id)) {
        const children = filteredStructures.filter((s) =>
          s.parentStructureId === structure.id ||
          (s.hierarchyPath && s.hierarchyPath.includes(structure.id) && s.id !== structure.id)
        ).sort((a, b) => (a.hierarchyLevel || 0) - (b.hierarchyLevel || 0))

        organizedStructures.push({ master: structure, children })
        processedIds.add(structure.id)
        children.forEach(child => processedIds.add(child.id))
      }
    }
  })

  // Add standalone structures (not part of hierarchy)
  filteredStructures.forEach((structure) => {
    if (!processedIds.has(structure.id)) {
      organizedStructures.push({ master: structure, children: [] })
      processedIds.add(structure.id)
    }
  })

  // Calculate summary metrics - ONLY count master structures (hierarchyLevel 1 or no parent)
  const masterStructuresOnly = structures.filter(s =>
    s.hierarchyLevel === 1 || !s.parentStructureId
  )

  const totalCapital = masterStructuresOnly.reduce((acc, s) => {
    const amount = s.currency === 'USD' ? s.totalCommitment : s.totalCommitment / 20
    return acc + amount
  }, 0)

  const totalInvestors = masterStructuresOnly.reduce((acc, s) => acc + s.investors, 0)

  const avgInvestorsPerStructure = masterStructuresOnly.length > 0
    ? Math.round(totalInvestors / masterStructuresOnly.length)
    : 0

  const totalInvestments = masterStructuresOnly.reduce((acc, s) =>
    acc + parseInt(s.plannedInvestments || '0'), 0
  )

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Structures</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {structures.length} {structures.length === 1 ? 'structure' : 'structures'}
          </p>
        </div>
        {!isGuest && (
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Structure
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalCapital / 1000000).toFixed(1)}M
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Structures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{structures.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Investors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvestors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planned Investments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvestments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search structures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
            <TabsList>
              <TabsTrigger value="all">All Types</TabsTrigger>
              <TabsTrigger value="fund">Fund</TabsTrigger>
              <TabsTrigger value="sa">SA / LLC</TabsTrigger>
              <TabsTrigger value="fideicomiso">Trust</TabsTrigger>
            </TabsList>
          </Tabs>
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
            <ToggleGroupItem value="grid" aria-label="Grid view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        </div>

        {/* Status Filter */}
        {(visibilitySettings.structureStatusFilters.all ||
          visibilitySettings.structureStatusFilters.fundraising ||
          visibilitySettings.structureStatusFilters.active ||
          visibilitySettings.structureStatusFilters.closed) && (
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList>
              {visibilitySettings.structureStatusFilters.all && (
                <TabsTrigger value="all">All Status</TabsTrigger>
              )}
              {visibilitySettings.structureStatusFilters.fundraising && (
                <TabsTrigger value="fundraising">Fundraising</TabsTrigger>
              )}
              {visibilitySettings.structureStatusFilters.active && (
                <TabsTrigger value="active">Active</TabsTrigger>
              )}
              {visibilitySettings.structureStatusFilters.closed && (
                <TabsTrigger value="closed">Closed</TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Structures Grid */}
      {structures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No structures yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Get started by creating your first investment structure. The setup wizard will guide you through the process.
            </p>
            <Button onClick={handleCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Structure
            </Button>
          </CardContent>
        </Card>
      ) : filteredStructures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No structures found</h3>
            <p className="text-muted-foreground max-w-md">
              No structures match your search criteria. Try adjusting your filters or search query.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {masterStructures.map((structure) => (
            <Card
              key={structure.id}
              className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden"
              onClick={() => handleViewStructure(structure.id)}
            >
              {structure.bannerImage && (
                <div className="w-full h-32 overflow-hidden bg-gradient-to-r from-primary/20 to-primary/10">
                  <img
                    src={structure.bannerImage}
                    alt={`${structure.name} banner`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{structure.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {structure.jurisdiction === 'United States' && structure.usState
                          ? `${structure.usState === 'Other' ? structure.usStateOther : structure.usState}, ${structure.jurisdiction}`
                          : structure.jurisdiction}
                      </span>
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[structure.status]}>
                    {structure.status.charAt(0).toUpperCase() + structure.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type & Subtype */}
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">{TYPE_LABELS[structure.type]}</span>
                  <span className="text-sm text-muted-foreground">• {structure.subtype}</span>
                </div>

                {/* Financial Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Total Commitment</div>
                    <div className="text-sm font-semibold">
                      {formatCompactCurrency(structure.totalCommitment, structure.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Inception Date</div>
                    <div className="text-sm font-semibold">
                      {format(structure.inceptionDate || structure.createdDate, 'MMM yyyy')}
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Investors</div>
                    <div className="text-sm font-semibold">{structure.investors}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Planned Investments</div>
                    <div className="text-sm font-semibold">
                      {structure.plannedInvestments || '1'}
                    </div>
                  </div>
                </div>

                {/* Current Stage */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Current Stage</span>
                    <span className="font-medium capitalize">
                      {structure.currentStage?.replace('-', ' ') || 'Fundraising'}
                    </span>
                  </div>
                </div>

                {/* Parent Structure */}
                {structure.parentStructureId ? (
                  <>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Parent Structure</span>
                        <span className="font-medium">{structures.find(s => s.id === structure.parentStructureId)?.name || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Percentage Owned</span>
                        <Badge variant="secondary" className="text-xs">
                          {structure.parentStructureOwnershipPercentage !== null && structure.parentStructureOwnershipPercentage !== undefined ? `${structure.parentStructureOwnershipPercentage}%` : 'Not set'}
                        </Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Parent Structure</span>
                      <span className="text-xs text-muted-foreground">None</span>
                    </div>
                  </div>
                )}

                {/* Structure Type Badge */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Structure Type</span>
                    <Badge variant="outline" className="text-xs">
                      {structure.type === 'fund' ? structure.fundType || 'Fund' : TYPE_LABELS[structure.type]}
                    </Badge>
                  </div>
                </div>

                {/* Hierarchy Badge */}
                {structure.hierarchyMode && structure.hierarchyStructures && structure.hierarchyStructures.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Hierarchy</span>
                      <Badge variant="default" className="text-xs bg-primary">
                        {structure.hierarchyStructures.length} Levels
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Structure Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Total Commitment</TableHead>
                <TableHead>Investors</TableHead>
                <TableHead>Parent Structure</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizedStructures.map(({ master, children }) => (
                <React.Fragment key={master.id}>
                  {/* Master Structure Row */}
                  <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewStructure(master.id)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{master.name}</span>
                        {children.length > 0 && (
                          <Badge variant="default" className="text-xs bg-primary ml-2">
                            {children.length + 1} Levels
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{TYPE_LABELS[master.type]}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {master.jurisdiction === 'United States' && master.usState
                          ? `${master.usState === 'Other' ? master.usStateOther : master.usState}, ${master.jurisdiction}`
                          : master.jurisdiction}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatCompactCurrency(master.totalCommitment, master.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{master.investors}</span>
                    </TableCell>
                    <TableCell>
                      {master.parentStructureId ? (
                        <Badge variant="secondary" className="text-xs">
                          {master.parentStructureOwnershipPercentage !== null && master.parentStructureOwnershipPercentage !== undefined ? `${master.parentStructureOwnershipPercentage}% Owned` : 'Not set'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[master.status]} className="text-xs">
                        {master.status.charAt(0).toUpperCase() + master.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>

                  {/* Child Structure Rows (Indented) */}
                  {children.map((child) => (
                    <TableRow
                      key={child.id}
                      className="cursor-pointer hover:bg-accent/50 border-l-4 border-l-primary/30"
                      onClick={() => router.push(`/investment-manager/structures/${master.id}/${child.id}`)}
                    >
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-primary">↳</span>
                          <span className="font-medium">{child.name}</span>
                          <Badge variant="outline" className="text-xs">
                            Level {child.hierarchyLevel}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{TYPE_LABELS[child.type]}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{child.jurisdiction}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatCompactCurrency(master.totalCommitment, master.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{child.investors}</span>
                      </TableCell>
                      <TableCell>
                        {child.parentStructureId ? (
                          <Badge variant="secondary" className="text-xs">
                            {child.parentStructureOwnershipPercentage !== null && child.parentStructureOwnershipPercentage !== undefined ? `${child.parentStructureOwnershipPercentage}% Owned` : 'Not set'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {child.status.charAt(0).toUpperCase() + child.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
