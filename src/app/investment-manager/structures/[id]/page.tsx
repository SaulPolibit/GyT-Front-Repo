"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Building2, ArrowLeft, Pencil, Trash2, MapPin, Users, TrendingUp, Calendar, FileText, Scale, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Structure, getStructures } from '@/lib/structures-storage'
import { getInvestorByEmail } from '@/lib/investors-storage'
import type { Investment } from '@/lib/types'
import { StructureValuationSection } from '@/components/structure-valuation-section'
import { StructureCapTable } from '@/components/structure-cap-table'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken, getAuthState } from '@/lib/auth-storage'
import { formatCompactCurrency } from '@/lib/format-utils'

// Type labels
const TYPE_LABELS: Record<string, string> = {
  fund: 'Fund',
  sa: 'SA / LLC',
  fideicomiso: 'Trust',
  'private-debt': 'Private Debt',
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
  active: 'default',
  fundraising: 'outline',
  closed: 'secondary',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function StructureDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [structure, setStructure] = useState<Structure | null>(null)
  const [childStructures, setChildStructures] = useState<Structure[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [id, setId] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get current user role
  const authState = getAuthState()
  const currentUserRole = authState.user?.role ?? null
  const isGuest = currentUserRole === 4

  const loadStructureData = async (structureId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Get authentication token
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found. Please login first.')
      }

      // Fetch structure with investors from API
      const apiUrl = getApiUrl(`/api/structures/${structureId}/with-investors`)
      console.log('🔄 Fetching structure with investors from:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch structure: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📊 Loaded structure with investors from API:', data)

      // Handle API response format: { success: true, data: Structure }
      if (data.success && data.data) {
        const apiStructure = data.data

        // Map API field names to frontend field names and convert types
        const loadedStructure: Structure = {
          ...apiStructure,
          // Date conversions: API returns strings, frontend expects Date objects
          createdDate: apiStructure.createdAt ? new Date(apiStructure.createdAt) : new Date(),
          inceptionDate: apiStructure.inceptionDate ? new Date(apiStructure.inceptionDate) : undefined,
          finalDate: apiStructure.finalDate ? new Date(apiStructure.finalDate) : undefined,
          // Field name mappings: API → Frontend
          jurisdiction: apiStructure.taxJurisdiction || apiStructure.jurisdiction || 'N/A',
          currency: apiStructure.baseCurrency || apiStructure.currency || 'USD',
          // Map carriedInterest to performanceFee
          performanceFee: apiStructure.carriedInterest || apiStructure.performanceFee,
        }

        setStructure(loadedStructure)

        // Load child structures if this is a hierarchy master
        if (loadedStructure.hierarchyMode && loadedStructure.childStructureIds && loadedStructure.childStructureIds.length > 0) {
          const allStructures = getStructures()
          const children = allStructures.filter(s =>
            s.parentStructureId === loadedStructure.id ||
            (s.hierarchyPath && s.hierarchyPath.includes(loadedStructure.id) && s.id !== loadedStructure.id)
          ).sort((a, b) => (a.hierarchyLevel || 0) - (b.hierarchyLevel || 0))
          setChildStructures(children)
        }
      } else {
        throw new Error('Invalid response format from API')
      }

      // Fetch investments tied to this structure from API
      const investmentsUrl = getApiUrl(`/api/investments/active?structureId=${structureId}`)
      console.log('🔄 Fetching investments from:', investmentsUrl)

      const investmentsResponse = await fetch(investmentsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (investmentsResponse.ok) {
        const investmentsData = await investmentsResponse.json()
        console.log('📊 Loaded investments from API:', investmentsData)

        if (investmentsData.success && Array.isArray(investmentsData.data)) {
          // Map API response to Investment interface
          const mappedInvestments: Investment[] = investmentsData.data.map((apiInv: any) => {
            // Parse geography from "City, State, Country" or "City, Country"
            const geoParts = (apiInv.geography || '').split(',').map((s: string) => s.trim())
            const geography = geoParts.length === 3
              ? { city: geoParts[0], state: geoParts[1], country: geoParts[2] }
              : geoParts.length === 2
              ? { city: geoParts[0], state: '', country: geoParts[1] }
              : { city: '', state: '', country: '' }

            // Determine investment type based on investmentType
            let type: 'Real Estate' | 'Private Equity' | 'Private Debt' = 'Private Equity'
            if (apiInv.investmentType === 'DEBT') {
              type = 'Private Debt'
            } else if (apiInv.sector && ['Multifamily', 'Office', 'Retail', 'Industrial', 'Hospitality', 'Mixed-Use'].includes(apiInv.sector)) {
              type = 'Real Estate'
            }

            // Build fundEquityPosition if equity data exists
            const fundEquityPosition = (apiInv.investmentType === 'EQUITY' || apiInv.investmentType === 'MIXED') && apiInv.equityInvested
              ? {
                  ownershipPercent: apiInv.equityOwnershipPercent || 0,
                  equityInvested: apiInv.equityInvested || 0,
                  currentEquityValue: apiInv.equityCurrentValue || apiInv.equityInvested || 0,
                  unrealizedGain: (apiInv.equityRealizedGain || 0)
                }
              : null

            // Build fundDebtPosition if debt data exists
            const fundDebtPosition = (apiInv.investmentType === 'DEBT' || apiInv.investmentType === 'MIXED') && apiInv.principalProvided
              ? {
                  principalProvided: apiInv.principalProvided || 0,
                  interestRate: apiInv.interestRate || 0,
                  originationDate: apiInv.investmentDate || '',
                  maturityDate: apiInv.maturityDate || '',
                  accruedInterest: apiInv.interestReceived || 0,
                  currentDebtValue: apiInv.outstandingPrincipal || apiInv.principalProvided || 0,
                  unrealizedGain: 0
                }
              : null

            // Calculate total fund position
            const totalInvested = (fundEquityPosition?.equityInvested || 0) + (fundDebtPosition?.principalProvided || 0)
            const currentValue = (fundEquityPosition?.currentEquityValue || 0) + (fundDebtPosition?.currentDebtValue || 0)
            const unrealizedGain = currentValue - totalInvested

            return {
              id: apiInv.id,
              name: apiInv.investmentName || 'Unnamed Investment',
              type,
              status: apiInv.status as 'Active' | 'Closed' | 'Pending' | 'Exited',
              sector: apiInv.sector || 'Other',
              investmentType: apiInv.investmentType as 'EQUITY' | 'DEBT' | 'MIXED',
              geography,
              fundEquityPosition,
              fundDebtPosition,
              externalDebt: [],
              totalFundPosition: {
                totalInvested,
                currentValue,
                unrealizedGain,
                irr: apiInv.irrPercent || 0,
                multiple: apiInv.moic || 0
              },
              fundId: apiInv.structureId,
              acquisitionDate: apiInv.investmentDate || '',
              lastValuationDate: apiInv.updatedAt || apiInv.createdAt || '',
              description: apiInv.notes || '',
              documents: [],
              createdAt: apiInv.createdAt || '',
              updatedAt: apiInv.updatedAt || ''
            } as Investment
          })

          setInvestments(mappedInvestments)
        }
      } else {
        console.warn('⚠️ Failed to fetch investments, using empty array')
        setInvestments([])
      }
    } catch (err) {
      console.error('❌ Error fetching structure:', err)
      setError(err instanceof Error ? err.message : 'Failed to load structure')
      setStructure(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id)
      loadStructureData(resolvedParams.id)
    })
  }, [params])

  const handleBack = () => {
    router.push('/investment-manager/structures')
  }

  const handleEdit = () => {
    // Navigate to edit page (to be implemented)
    router.push(`/investment-manager/structures/${id}/edit`)
  }

  const confirmDelete = async () => {
    if (!structure) return

    try {
      // Get authentication token
      const token = getAuthToken()

      if (!token) {
        toast.error('Authentication required. Please log in.')
        return
      }

      const apiUrl = getApiUrl(API_CONFIG.endpoints.deleteStructure(structure.id))

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to delete structure')
        return
      }

      const result = await response.json()

      if (result.success) {
        toast.success('Structure deleted successfully')
        router.push('/investment-manager/structures')
      } else {
        toast.error(result.message || 'Failed to delete structure')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete structure. Please try again.')
    }
  }

  const handleDownload = async (filename: string, docType: 'fund' | 'investor') => {
    try {
      const response = await fetch(`/api/structures/${id}/documents/${docType}/${filename}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('File not found. It may have been deleted.')
        } else {
          throw new Error('Download failed')
        }
        return
      }

      // Create blob from response
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file. Please try again.')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return format(date, 'MMMM dd, yyyy')
  }

  const getStatusVariant = (status: string) => {
    return STATUS_COLORS[status] as "default" | "outline" | "secondary"
  }

  const getTypeIcon = (type: string) => {
    return <Building2 className="h-5 w-5" />
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading structure...</h3>
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
            <h3 className="text-lg font-semibold mb-2">Error Loading Structure</h3>
            <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => loadStructureData(id)} variant="outline">
                Try Again
              </Button>
              <Button onClick={handleBack} asChild>
                <Link href="/investment-manager/structures">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Structures
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Structure not found state
  if (!structure) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Structure not found</h3>
            <p className="text-muted-foreground mb-4">
              The structure you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={handleBack} asChild>
              <Link href="/investment-manager/structures">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Structures
              </Link>
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/investment-manager/structures">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{structure.name}</h1>
              <Badge variant={getStatusVariant(structure.status)}>
                {structure.status.charAt(0).toUpperCase() + structure.status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                {getTypeIcon(structure.type)}
                <span>{TYPE_LABELS[structure.type]}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {structure.jurisdiction === 'United States' && structure.usState
                  ? `${structure.usState === 'Other' ? structure.usStateOther : structure.usState}, ${structure.jurisdiction}`
                  : structure.jurisdiction}
              </div>
            </div>
          </div>
        </div>
        {!isGuest && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commitment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompactCurrency(structure.totalCommitment, structure.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Investors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {structure.investors}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inception Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              {format(structure.inceptionDate || structure.createdDate, 'MMM yyyy')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="capitalize text-base">
                {structure.currentStage?.replace('-', ' ') || 'Fundraising'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy Levels */}
      {structure.hierarchyMode && structure.hierarchyStructures && structure.hierarchyStructures.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Multi-Level Hierarchy</CardTitle>
              <Badge variant="secondary">
                {structure.hierarchyStructures.length} levels
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {structure.hierarchyStructures.map((level, index) => {
                // Find the corresponding child structure for this level (skip level 1 which is master)
                const childStructure = index > 0 ? childStructures.find(c => c.hierarchyLevel === index + 1) : null
                const isClickable = index > 0 && childStructure

                return (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg bg-muted/30 transition-colors ${
                      isClickable ? 'hover:bg-muted/50 cursor-pointer hover:border-primary' : ''
                    }`}
                    onClick={() => {
                      if (isClickable && childStructure) {
                        router.push(`/investment-manager/structures/${id}/${childStructure.id}`)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            Level {index + 1}
                          </Badge>
                          <span className="font-semibold text-lg">{level.name}</span>
                          {index === 0 && (
                            <Badge variant="default" className="text-xs">Master Level</Badge>
                          )}
                          {isClickable && (
                            <Badge variant="secondary" className="text-xs">Click to view →</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {TYPE_LABELS[level.type] || TYPE_LABELS[structure.type]}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      {/* Waterfall Configuration */}
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${level.applyWaterfall ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <div className="text-xs text-muted-foreground">Waterfall Calculation</div>
                          <div className="text-sm font-medium">
                            {level.applyWaterfall ? (
                              <span className="text-green-600">
                                Enabled ({level.waterfallAlgorithm === 'american' ? 'American' : 'European'})
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Disabled</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Economic Terms Configuration */}
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${level.applyEconomicTerms ? 'bg-blue-500' : 'bg-gray-300'}`} />
                        <div>
                          <div className="text-xs text-muted-foreground">Economic Terms</div>
                          <div className="text-sm font-medium">
                            {level.applyEconomicTerms ? (
                              <span className="text-blue-600">Applied</span>
                            ) : (
                              <span className="text-muted-foreground">Not Applied</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Level Position */}
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <div className="text-xs text-muted-foreground">Position</div>
                          <div className="text-sm font-medium">
                            {index === 0 ? 'Master Level' :
                             index === (structure.hierarchyStructures?.length || 0) - 1 ? 'Property Level' :
                             `Intermediate Level`}
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* Income Flow Arrow */}
                  {index < (structure.hierarchyStructures?.length || 0) - 1 && (
                    <div className="mt-3 pt-3 border-t border-dashed flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>Income flows upward to {structure.hierarchyStructures?.[index - 1]?.name || 'investors'}</span>
                    </div>
                  )}
                </div>
              )
})}

              {/* Cascade Flow Summary */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Income Flow Direction
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  Income enters at <strong>Level {structure.hierarchyStructures?.length || 0}</strong> (Property Level)
                  and cascades upward through each level
                  {structure.hierarchyStructures?.some(l => l.applyWaterfall) &&
                    ', applying waterfall calculations at configured levels,'
                  }
                  {' '}until reaching investors at the top.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Structure Type</div>
                <div className="font-medium">
                  <Badge variant="outline">{TYPE_LABELS[structure.type]}</Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Jurisdiction</div>
                <div className="font-medium">{structure.jurisdiction}</div>
              </div>
              {structure.usState && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">US State</div>
                  <div className="font-medium">
                    {structure.usState === 'Other' ? structure.usStateOther : structure.usState}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Created Date</div>
                <div className="font-medium">{formatDate(structure.createdDate)}</div>
              </div>
              {structure.inceptionDate && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Inception Date</div>
                  <div className="font-medium">{formatDate(structure.inceptionDate)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Capital Structure */}
        <Card>
          <CardHeader>
            <CardTitle>Capital Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Commitment</div>
                <div className="text-lg font-semibold">
                  {structure.currency} {structure.totalCommitment.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Number of Investors</div>
                <div className="text-lg font-semibold">{structure.investors}</div>
              </div>
              {structure.minCheckSize && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Min Check Size</div>
                  <div className="text-lg font-semibold">
                    {structure.currency} {structure.minCheckSize.toLocaleString()}
                  </div>
                </div>
              )}
              {structure.maxCheckSize && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Max Check Size</div>
                  <div className="text-lg font-semibold">
                    {structure.currency} {structure.maxCheckSize.toLocaleString()}
                  </div>
                </div>
              )}
              {structure.plannedInvestments && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Planned Investments</div>
                  <div className="text-lg font-semibold">{structure.plannedInvestments}</div>
                </div>
              )}
              {structure.financingStrategy && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Financing Strategy</div>
                  <div className="text-lg font-semibold capitalize">{structure.financingStrategy}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fund Details */}
        {structure.type === 'fund' && (structure.fundTerm || structure.fundType) && (
          <Card>
            <CardHeader>
              <CardTitle>Fund Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {structure.fundType && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Fund Type</div>
                    <div className="text-lg font-semibold capitalize">
                      {structure.fundType.replace('-', ' ')}
                    </div>
                  </div>
                )}
                {structure.fundTerm && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Fund Term</div>
                    <div className="text-lg font-semibold">{structure.fundTerm} years</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Economic Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Economic Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Management Fee</div>
                <div className="text-lg font-semibold">{structure.managementFee ? `${structure.managementFee}%` : ''}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Performance Fee</div>
                <div className="text-lg font-semibold">{structure.performanceFee ? `${structure.performanceFee}%` : ''}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Hurdle Rate</div>
                <div className="text-lg font-semibold">{structure.hurdleRate ? `${structure.hurdleRate}%` : ''}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Preferred Return</div>
                <div className="text-lg font-semibold">{structure.preferredReturn ? `${structure.preferredReturn}%` : ''}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Waterfall Structure</div>
                <div className="text-lg font-semibold capitalize">{structure.waterfallStructure || ''}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Terms Application</div>
                <div className="text-lg font-semibold capitalize">
                  {structure.economicTermsApplication ? structure.economicTermsApplication.replace('-', ' ') : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokenization Details */}
        {(structure.calculatedIssuances || structure.tokenName || structure.determinedTier) && (
          <Card>
            <CardHeader>
              <CardTitle>Tokenization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {structure.tokenName && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Token Name</div>
                    <div className="text-lg font-semibold">{structure.tokenName}</div>
                  </div>
                )}
                {structure.tokenSymbol && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Token Symbol</div>
                    <div className="text-lg font-semibold">{structure.tokenSymbol}</div>
                  </div>
                )}
                {structure.tokenValue && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Token Value</div>
                    <div className="text-lg font-semibold">
                      {structure.currency} {structure.tokenValue.toLocaleString()}
                    </div>
                  </div>
                )}
                {structure.totalTokens && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Tokens</div>
                    <div className="text-lg font-semibold">
                      {structure.totalTokens.toLocaleString()}
                    </div>
                  </div>
                )}
                {structure.calculatedIssuances && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Calculated Issuances</div>
                    <div className="text-lg font-semibold">{structure.calculatedIssuances}</div>
                  </div>
                )}
                {structure.determinedTier && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Pricing Tier</div>
                    <div className="text-lg font-semibold capitalize">{structure.determinedTier}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribution & Tax */}
        {(structure.distributionFrequency || structure.defaultTaxRate || structure.capitalCallNoticePeriod || structure.capitalCallDefaultPercentage || structure.capitalCallPaymentDeadline) && (
          <Card>
            <CardHeader>
              <CardTitle>Distribution & Tax</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {structure.distributionFrequency && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Distribution Frequency</div>
                    <div className="text-lg font-semibold capitalize">
                      {structure.distributionFrequency.replace('-', ' ')}
                    </div>
                  </div>
                )}
                {structure.defaultTaxRate && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Default Tax Rate</div>
                    <div className="text-lg font-semibold">{structure.defaultTaxRate}%</div>
                  </div>
                )}
                {structure.capitalCallNoticePeriod && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Capital Call Notice</div>
                    <div className="text-lg font-semibold">{structure.capitalCallNoticePeriod} days</div>
                  </div>
                )}
                {structure.capitalCallDefaultPercentage && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Default Capital Call %</div>
                    <div className="text-lg font-semibold">{structure.capitalCallDefaultPercentage}%</div>
                  </div>
                )}
                {structure.capitalCallPaymentDeadline && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Payment Deadline</div>
                    <div className="text-lg font-semibold">{structure.capitalCallPaymentDeadline} days</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Valuation (NAV) Section */}
      <StructureValuationSection
        structure={structure}
        onUpdate={() => loadStructureData(id)}
        isGuest={isGuest}
      />

      {/* Pre-Registered Investors */}
      {(() => {
        // Filter pre-registered investors to only show those assigned to this structure's level
        // Master structure is Level 1, so show investors with hierarchyLevel === 1
        const investorsAtThisLevel = structure.preRegisteredInvestors?.filter(
          investor => investor.hierarchyLevel === structure.hierarchyLevel
        ) || []

        return investorsAtThisLevel.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pre-Registered Investors</CardTitle>
                <Badge variant="secondary">
                  {investorsAtThisLevel.length} investor{investorsAtThisLevel.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {investorsAtThisLevel.map((investor, idx) => {
                  // Look up the actual investor from localStorage by email
                  const actualInvestor = getInvestorByEmail(investor.email)
                  const investorId = actualInvestor?.id || null

                  const handleInvestorClick = () => {
                    if (investorId) {
                      router.push(`/investment-manager/investors/${investorId}`)
                    }
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 border rounded transition-colors ${
                        investorId ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                      }`}
                      onClick={handleInvestorClick}
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {investor.entityName || `${investor.firstName} ${investor.lastName}`}
                          {!investorId && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Not Created Yet
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {investor.email}
                        </div>
                        {investor.customTerms && (
                          <div className="text-sm text-primary mt-1">
                            Custom Terms:
                            {investor.customTerms.managementFee !== undefined && ` Mgmt ${investor.customTerms.managementFee}%`}
                            {investor.customTerms.performanceFee !== undefined && ` • Perf ${investor.customTerms.performanceFee}%`}
                            {investor.customTerms.hurdleRate !== undefined && ` • Hurdle ${investor.customTerms.hurdleRate}%`}
                            {investor.customTerms.preferredReturn !== undefined && ` • Preferred ${investor.customTerms.preferredReturn}%`}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {investor.source === 'csv' ? 'CSV Import' : 'Manual'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Cap Table - Investors allocated to this structure */}
      <StructureCapTable structure={structure} />

      {/* Investments */}
      {investments && investments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Investments</CardTitle>
              <Badge variant="secondary">
                {investments.length} investment{investments.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {investments.map((investment) => (
                <div
                  key={investment.id}
                  className="flex items-center justify-between p-3 border rounded transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/investment-manager/investments/${investment.id}`)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{investment.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {investment.type} • {investment.sector}
                      {investment.geography && (
                        <span className="ml-2">
                          • {investment.geography.city}, {investment.geography.state}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Fund Commitment</div>
                      <div className="font-medium">{formatCurrency(investment.totalFundPosition?.totalInvested || 0)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Current Value</div>
                      <div className="font-medium">{formatCurrency(investment.totalFundPosition?.currentValue || 0)}</div>
                    </div>
                    <Badge variant={investment.status === 'Active' ? 'default' : 'secondary'}>
                      {investment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents */}
      {((structure.uploadedFundDocuments && structure.uploadedFundDocuments.length > 0) ||
        (structure.uploadedInvestorDocuments && structure.uploadedInvestorDocuments.length > 0)) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Button variant="outline" size="sm">
                Upload Document
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {structure.uploadedFundDocuments && structure.uploadedFundDocuments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Fund Documents</div>
                  <div className="space-y-2">
                    {structure.uploadedFundDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Uploaded {formatDate(new Date(doc.addedAt))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc.name, 'fund')}
                        >
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {structure.uploadedInvestorDocuments && structure.uploadedInvestorDocuments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Investor Documents</div>
                  <div className="space-y-2">
                    {structure.uploadedInvestorDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Uploaded {formatDate(new Date(doc.addedAt))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc.name, 'investor')}
                        >
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legal & Terms Section - Comprehensive */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Legal & Terms</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive partnership agreement and legal provisions
              </p>
            </div>
            {!isGuest && (
              <Link href={`/investment-manager/structures/${id}/edit#legal-terms`}>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Terms
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Partnership Agreement */}
          {(structure.legalTerms?.managementControl || structure.legalTerms?.capitalContributions || structure.legalTerms?.allocationsDistributions) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Partnership Agreement</h3>
              </div>

              {structure.legalTerms?.managementControl && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Management & Control</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{structure.legalTerms.managementControl}</p>
                </div>
              )}

              {structure.legalTerms?.capitalContributions && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Capital Contributions</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{structure.legalTerms.capitalContributions}</p>
                  </div>
                </>
              )}

              {structure.legalTerms?.allocationsDistributions && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Allocations & Distributions</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{structure.legalTerms.allocationsDistributions}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Rights & Obligations */}
          {(structure.legalTerms?.limitedPartnerRights?.length || structure.legalTerms?.limitedPartnerObligations?.length) && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rights & Obligations</h3>

                {structure.legalTerms.limitedPartnerRights && structure.legalTerms.limitedPartnerRights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">Limited Partner Rights</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {structure.legalTerms.limitedPartnerRights.map((right, idx) => (
                        <li key={idx}>{right}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {structure.legalTerms.limitedPartnerObligations && structure.legalTerms.limitedPartnerObligations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400">Limited Partner Obligations</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {structure.legalTerms.limitedPartnerObligations.map((obligation, idx) => (
                        <li key={idx}>{obligation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Voting Rights */}
          {structure.legalTerms?.votingRights && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Voting Rights</h3>
                <p className="text-sm text-muted-foreground">
                  Voting threshold: <strong>{structure.legalTerms.votingRights.votingThreshold}%</strong> of Partnership Interests
                </p>
                {structure.legalTerms.votingRights.mattersRequiringConsent && structure.legalTerms.votingRights.mattersRequiringConsent.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Matters Requiring Consent</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {structure.legalTerms.votingRights.mattersRequiringConsent.map((matter, idx) => (
                        <li key={idx}>{matter}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Redemption Terms */}
          {structure.legalTerms?.redemptionTerms && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Redemption & Withdrawal Terms</h3>
                {structure.legalTerms.redemptionTerms.lockUpPeriod && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Lock-Up Period</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{structure.legalTerms.redemptionTerms.lockUpPeriod}</p>
                  </div>
                )}
                {structure.legalTerms.redemptionTerms.withdrawalConditions && structure.legalTerms.redemptionTerms.withdrawalConditions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Withdrawal Conditions</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {structure.legalTerms.redemptionTerms.withdrawalConditions.map((condition, idx) => (
                        <li key={idx}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {structure.legalTerms.redemptionTerms.withdrawalProcess && structure.legalTerms.redemptionTerms.withdrawalProcess.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Withdrawal Process</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {structure.legalTerms.redemptionTerms.withdrawalProcess.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Transfer Restrictions */}
          {structure.legalTerms?.transferRestrictions && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Transfer Restrictions</h3>
                {structure.legalTerms.transferRestrictions.generalProhibition && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">General Prohibition</h4>
                    <p className="text-sm text-muted-foreground">{structure.legalTerms.transferRestrictions.generalProhibition}</p>
                  </div>
                )}
                {structure.legalTerms.transferRestrictions.permittedTransfers && structure.legalTerms.transferRestrictions.permittedTransfers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Permitted Transfers</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {structure.legalTerms.transferRestrictions.permittedTransfers.map((transfer, idx) => (
                        <li key={idx}>{transfer}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {structure.legalTerms.transferRestrictions.transferRequirements && structure.legalTerms.transferRestrictions.transferRequirements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Transfer Requirements</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {structure.legalTerms.transferRestrictions.transferRequirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Reporting Commitments */}
          {structure.legalTerms?.reportingCommitments && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Reporting Commitments</h3>
                <div className="grid grid-cols-2 gap-4">
                  {structure.legalTerms.reportingCommitments.quarterlyReports && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-semibold mb-1">Quarterly Reports</p>
                      <p className="text-xs text-muted-foreground">{structure.legalTerms.reportingCommitments.quarterlyReports}</p>
                    </div>
                  )}
                  {structure.legalTerms.reportingCommitments.annualReports && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-semibold mb-1">Annual Reports</p>
                      <p className="text-xs text-muted-foreground">{structure.legalTerms.reportingCommitments.annualReports}</p>
                    </div>
                  )}
                  {structure.legalTerms.reportingCommitments.taxForms && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-semibold mb-1">Tax Forms (K-1)</p>
                      <p className="text-xs text-muted-foreground">{structure.legalTerms.reportingCommitments.taxForms}</p>
                    </div>
                  )}
                  {structure.legalTerms.reportingCommitments.capitalNotices && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-semibold mb-1">Capital Notices</p>
                      <p className="text-xs text-muted-foreground">{structure.legalTerms.reportingCommitments.capitalNotices}</p>
                    </div>
                  )}
                </div>
                {structure.legalTerms.reportingCommitments.additionalCommunications && structure.legalTerms.reportingCommitments.additionalCommunications.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Additional Communications</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {structure.legalTerms.reportingCommitments.additionalCommunications.map((comm, idx) => (
                        <li key={idx}>{comm}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Liability Limitations */}
          {structure.legalTerms?.liabilityLimitations && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Liability Limitations</h3>
                {structure.legalTerms.liabilityLimitations.limitedLiabilityProtection && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Limited Liability Protection</h4>
                    <p className="text-sm text-muted-foreground">{structure.legalTerms.liabilityLimitations.limitedLiabilityProtection}</p>
                  </div>
                )}
                {structure.legalTerms.liabilityLimitations.exceptionsToLimitedLiability && structure.legalTerms.liabilityLimitations.exceptionsToLimitedLiability.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Exceptions</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {structure.legalTerms.liabilityLimitations.exceptionsToLimitedLiability.map((exception, idx) => (
                        <li key={idx}>{exception}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Indemnification */}
          {structure.legalTerms?.indemnification && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Indemnification</h3>
                {structure.legalTerms.indemnification.partnershipIndemnifiesLPFor && structure.legalTerms.indemnification.partnershipIndemnifiesLPFor.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Partnership Indemnifies LP For</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {structure.legalTerms.indemnification.partnershipIndemnifiesLPFor.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {structure.legalTerms.indemnification.lpIndemnifiesPartnershipFor && structure.legalTerms.indemnification.lpIndemnifiesPartnershipFor.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">LP Indemnifies Partnership For</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {structure.legalTerms.indemnification.lpIndemnifiesPartnershipFor.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {structure.legalTerms.indemnification.indemnificationProcedures && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Procedures</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{structure.legalTerms.indemnification.indemnificationProcedures}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Additional Provisions */}
          {(structure.legalTerms?.amendments || structure.legalTerms?.dissolution || structure.legalTerms?.disputes || structure.legalTerms?.governingLaw || structure.legalTerms?.additionalProvisions) && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Additional Provisions</h3>
                </div>

                {structure.legalTerms.amendments && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Amendments</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{structure.legalTerms.amendments}</p>
                  </div>
                )}

                {structure.legalTerms.dissolution && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Dissolution</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{structure.legalTerms.dissolution}</p>
                    </div>
                  </>
                )}

                {structure.legalTerms.disputes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Dispute Resolution</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{structure.legalTerms.disputes}</p>
                    </div>
                  </>
                )}

                {structure.legalTerms.governingLaw && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Governing Law</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{structure.legalTerms.governingLaw}</p>
                    </div>
                  </>
                )}

                {structure.legalTerms.additionalProvisions && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Additional Provisions</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{structure.legalTerms.additionalProvisions}</p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Empty state */}
          {!structure.legalTerms?.managementControl && !structure.legalTerms?.capitalContributions && !structure.legalTerms?.allocationsDistributions &&
           !structure.legalTerms?.limitedPartnerRights?.length && !structure.legalTerms?.limitedPartnerObligations?.length &&
           !structure.legalTerms?.votingRights && !structure.legalTerms?.redemptionTerms && !structure.legalTerms?.transferRestrictions &&
           !structure.legalTerms?.reportingCommitments && !structure.legalTerms?.liabilityLimitations && !structure.legalTerms?.indemnification &&
           !structure.legalTerms?.amendments && !structure.legalTerms?.dissolution && !structure.legalTerms?.disputes &&
           !structure.legalTerms?.governingLaw && !structure.legalTerms?.additionalProvisions && (
            <p className="text-sm text-muted-foreground">
              No legal terms have been added yet. Click "Edit Terms" to add comprehensive legal provisions.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Structure</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this structure? This will also delete all associated investors and documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
