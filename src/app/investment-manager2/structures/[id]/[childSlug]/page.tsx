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
import { Building2, ArrowLeft, Pencil, Trash2, MapPin, Users, TrendingUp, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { getStructureById, deleteStructure, Structure } from '@/lib/structures-storage'
import { getInvestorByEmail } from '@/lib/investors-storage'
import { getInvestmentsByFundId } from '@/lib/investments-storage'
import type { Investment } from '@/lib/types'
import { StructureCapTable } from '@/components/structure-cap-table'

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

// Format subtype for display (e.g., "multi-project" -> "Multi Project")
const formatSubtype = (subtype: string) => {
  return subtype
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface PageProps {
  params: Promise<{ id: string; childSlug: string }>
}

export default function ChildStructureDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [parentStructure, setParentStructure] = useState<Structure | null>(null)
  const [childStructure, setChildStructure] = useState<Structure | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [parentId, setParentId] = useState<string>('')
  const [childSlug, setChildSlug] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    params.then((resolvedParams) => {
      setParentId(resolvedParams.id)
      setChildSlug(resolvedParams.childSlug)

      // Load parent structure
      const loadedParent = getStructureById(resolvedParams.id)
      if (loadedParent) {
        setParentStructure(loadedParent)

        // Find child structure by slug
        const child = getStructureById(resolvedParams.childSlug)

        if (child) {
          setChildStructure(child)

          // Load investments tied to this child structure
          const structureInvestments = getInvestmentsByFundId(child.id)
          setInvestments(structureInvestments)
        }
      }
    })
  }, [params])

  const handleBackToParent = () => {
    router.push(`/investment-manager/structures/${parentId}`)
  }

  const handleEdit = () => {
    // Navigate to edit page (to be implemented)
    router.push(`/investment-manager/structures/${parentId}/${childSlug}/edit`)
  }

  const confirmDelete = async () => {
    if (!childStructure) return

    try {
      await deleteStructure(childStructure.id)
      toast.success('Structure deleted successfully')
      router.push(`/investment-manager/structures/${parentId}`)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete structure. Please try again.')
    }
  }

  const handleDownload = async (filename: string, docType: 'fund' | 'investor') => {
    try {
      const response = await fetch(`/api/structures/${childSlug}/documents/${docType}/${filename}`)

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

  if (!childStructure || !parentStructure) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Structure not found</h3>
            <p className="text-muted-foreground mb-4">
              The structure you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={handleBackToParent}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {parentStructure?.name || 'Parent Structure'}
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
          <Button variant="ghost" size="icon" onClick={handleBackToParent}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{childStructure.name}</h1>
              <Badge variant={getStatusVariant(childStructure.status)}>
                {childStructure.status.charAt(0).toUpperCase() + childStructure.status.slice(1)}
              </Badge>
              {childStructure.hierarchyLevel && (
                <Badge variant="secondary">
                  Level {childStructure.hierarchyLevel}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                {getTypeIcon(childStructure.type)}
                <span>{TYPE_LABELS[childStructure.type]}</span>
              </div>
              <span>•</span>
              <span>{formatSubtype(childStructure.subtype)}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {childStructure.jurisdiction === 'United States' && childStructure.usState
                  ? `${childStructure.usState === 'Other' ? childStructure.usStateOther : childStructure.usState}, ${childStructure.jurisdiction}`
                  : childStructure.jurisdiction}
              </div>
            </div>
          </div>
        </div>
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commitment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(parentStructure?.currency || childStructure.currency) === 'USD' ? '$' : (parentStructure?.currency || childStructure.currency) + ' '}
              {((parentStructure?.totalCommitment || childStructure.totalCommitment) / 1000000).toFixed(1)}M
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
              {childStructure.investors}
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
              {format(childStructure.inceptionDate || childStructure.createdDate, 'MMM yyyy')}
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
                {childStructure.currentStage?.replace('-', ' ') || 'Fundraising'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Level Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Waterfall Calculation</p>
              <p className="text-base font-semibold">
                {childStructure.applyWaterfallAtThisLevel ? (
                  <span className="text-green-600">
                    ✓ Enabled ({childStructure.waterfallAlgorithm ? childStructure.waterfallAlgorithm.charAt(0).toUpperCase() + childStructure.waterfallAlgorithm.slice(1) : 'American'})
                  </span>
                ) : (
                  <span className="text-muted-foreground">Disabled (Pro-Rata)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Economic Terms</p>
              <p className="text-base font-semibold">
                {childStructure.applyEconomicTermsAtThisLevel ? (
                  <span className="text-green-600">✓ Applied (Investors can participate)</span>
                ) : (
                  <span className="text-muted-foreground">Not Applied (Operational only)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Income Flow Target</p>
              <p className="text-base">
                {childStructure.incomeFlowTarget === 'investors'
                  ? 'Flows to investors'
                  : `Flows to Level ${childStructure.hierarchyLevel! - 1}`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Position</p>
              <p className="text-base">
                {childStructure.hierarchyLevel === 1 ? 'Master Level' :
                 childStructure.hierarchyLevel === parentStructure?.numberOfLevels ? 'Property Level' :
                 'Intermediate Level'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <Badge variant="outline">{TYPE_LABELS[childStructure.type]}</Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Subtype</div>
                <div className="font-medium">{formatSubtype(childStructure.subtype)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Jurisdiction</div>
                <div className="font-medium">{childStructure.jurisdiction}</div>
              </div>
              {childStructure.usState && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">US State</div>
                  <div className="font-medium">
                    {childStructure.usState === 'Other' ? childStructure.usStateOther : childStructure.usState}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Created Date</div>
                <div className="font-medium">{formatDate(childStructure.createdDate)}</div>
              </div>
              {childStructure.inceptionDate && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Inception Date</div>
                  <div className="font-medium">{formatDate(childStructure.inceptionDate)}</div>
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
                  {parentStructure?.currency || childStructure.currency} {(parentStructure?.totalCommitment || childStructure.totalCommitment).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Number of Investors</div>
                <div className="text-lg font-semibold">{childStructure.investors}</div>
              </div>
              {childStructure.minCheckSize && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Min Check Size</div>
                  <div className="text-lg font-semibold">
                    {childStructure.currency} {childStructure.minCheckSize.toLocaleString()}
                  </div>
                </div>
              )}
              {childStructure.maxCheckSize && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Max Check Size</div>
                  <div className="text-lg font-semibold">
                    {childStructure.currency} {childStructure.maxCheckSize.toLocaleString()}
                  </div>
                </div>
              )}
              {childStructure.plannedInvestments && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Planned Investments</div>
                  <div className="text-lg font-semibold">{childStructure.plannedInvestments}</div>
                </div>
              )}
              {childStructure.financingStrategy && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Financing Strategy</div>
                  <div className="text-lg font-semibold capitalize">{childStructure.financingStrategy}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fund Details */}
        {childStructure.type === 'fund' && (childStructure.fundTerm || childStructure.fundType) && (
          <Card>
            <CardHeader>
              <CardTitle>Fund Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {childStructure.fundType && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Fund Type</div>
                    <div className="text-lg font-semibold capitalize">
                      {childStructure.fundType.replace('-', ' ')}
                    </div>
                  </div>
                )}
                {childStructure.fundTerm && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Fund Term</div>
                    <div className="text-lg font-semibold">{childStructure.fundTerm} years</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Economic Terms */}
        {(childStructure.managementFee || childStructure.performanceFee || childStructure.hurdleRate || childStructure.preferredReturn) && (
          <Card>
            <CardHeader>
              <CardTitle>Economic Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {childStructure.managementFee && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Management Fee</div>
                    <div className="text-lg font-semibold">{childStructure.managementFee}%</div>
                  </div>
                )}
                {childStructure.performanceFee && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Performance Fee</div>
                    <div className="text-lg font-semibold">{childStructure.performanceFee}%</div>
                  </div>
                )}
                {childStructure.hurdleRate && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Hurdle Rate</div>
                    <div className="text-lg font-semibold">{childStructure.hurdleRate}%</div>
                  </div>
                )}
                {childStructure.preferredReturn && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Preferred Return</div>
                    <div className="text-lg font-semibold">{childStructure.preferredReturn}%</div>
                  </div>
                )}
                {childStructure.waterfallStructure && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Waterfall Structure</div>
                    <div className="text-lg font-semibold capitalize">{childStructure.waterfallStructure}</div>
                  </div>
                )}
                {childStructure.economicTermsApplication && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Terms Application</div>
                    <div className="text-lg font-semibold capitalize">
                      {childStructure.economicTermsApplication.replace('-', ' ')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tokenization Details */}
        {(childStructure.calculatedIssuances || childStructure.tokenName || childStructure.determinedTier) && (
          <Card>
            <CardHeader>
              <CardTitle>Tokenization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {childStructure.tokenName && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Token Name</div>
                    <div className="text-lg font-semibold">{childStructure.tokenName}</div>
                  </div>
                )}
                {childStructure.tokenSymbol && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Token Symbol</div>
                    <div className="text-lg font-semibold">{childStructure.tokenSymbol}</div>
                  </div>
                )}
                {childStructure.tokenValue && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Token Value</div>
                    <div className="text-lg font-semibold">
                      {childStructure.currency} {childStructure.tokenValue.toLocaleString()}
                    </div>
                  </div>
                )}
                {childStructure.totalTokens && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Tokens</div>
                    <div className="text-lg font-semibold">
                      {childStructure.totalTokens.toLocaleString()}
                    </div>
                  </div>
                )}
                {childStructure.calculatedIssuances && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Calculated Issuances</div>
                    <div className="text-lg font-semibold">{childStructure.calculatedIssuances}</div>
                  </div>
                )}
                {childStructure.determinedTier && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Pricing Tier</div>
                    <div className="text-lg font-semibold capitalize">{childStructure.determinedTier}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribution & Tax */}
        {(childStructure.distributionFrequency || childStructure.defaultTaxRate || childStructure.capitalCallNoticePeriod || childStructure.capitalCallDefaultPercentage || childStructure.capitalCallPaymentDeadline) && (
          <Card>
            <CardHeader>
              <CardTitle>Distribution & Tax</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {childStructure.distributionFrequency && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Distribution Frequency</div>
                    <div className="text-lg font-semibold capitalize">
                      {childStructure.distributionFrequency.replace('-', ' ')}
                    </div>
                  </div>
                )}
                {childStructure.defaultTaxRate && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Default Tax Rate</div>
                    <div className="text-lg font-semibold">{childStructure.defaultTaxRate}%</div>
                  </div>
                )}
                {childStructure.capitalCallNoticePeriod && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Capital Call Notice</div>
                    <div className="text-lg font-semibold">{childStructure.capitalCallNoticePeriod} days</div>
                  </div>
                )}
                {childStructure.capitalCallDefaultPercentage && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Default Capital Call %</div>
                    <div className="text-lg font-semibold">{childStructure.capitalCallDefaultPercentage}%</div>
                  </div>
                )}
                {childStructure.capitalCallPaymentDeadline && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Payment Deadline</div>
                    <div className="text-lg font-semibold">{childStructure.capitalCallPaymentDeadline} days</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pre-Registered Investors */}
      {(() => {
        // Filter pre-registered investors to only show those assigned to this child structure's level
        const investorsAtThisLevel = childStructure.preRegisteredInvestors?.filter(
          investor => investor.hierarchyLevel === childStructure.hierarchyLevel
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
      <StructureCapTable structure={childStructure} />

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
      {((childStructure.uploadedFundDocuments && childStructure.uploadedFundDocuments.length > 0) ||
        (childStructure.uploadedInvestorDocuments && childStructure.uploadedInvestorDocuments.length > 0)) && (
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
              {childStructure.uploadedFundDocuments && childStructure.uploadedFundDocuments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Fund Documents</div>
                  <div className="space-y-2">
                    {childStructure.uploadedFundDocuments.map((doc, idx) => (
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

              {childStructure.uploadedInvestorDocuments && childStructure.uploadedInvestorDocuments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Investor Documents</div>
                  <div className="space-y-2">
                    {childStructure.uploadedInvestorDocuments.map((doc, idx) => (
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
