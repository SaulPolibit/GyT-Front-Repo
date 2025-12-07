"use client"

import { use, useState, useEffect } from "react"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from 'sonner'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, User, Users, Building, Briefcase, Mail, Phone, MapPin, Calendar, TrendingUp, TrendingDown, Pencil, Trash2, FileText, Download, Loader2 } from "lucide-react"
import investorsData from "@/data/investors.json"
import investmentsData from "@/data/investments.json"
import type { Investor, CapitalCall, Distribution } from "@/lib/types"
import { getInvestors, deleteInvestor } from "@/lib/investors-storage"
import { getStructureById, getStructures, type Structure } from "@/lib/structures-storage"
import { getCapitalCalls } from "@/lib/capital-calls-storage"
import { getDistributions } from "@/lib/distributions-storage"
import { calculateIRR } from "@/lib/performance-calculations"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InvestorDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [dynamicInvestors, setDynamicInvestors] = useState<Investor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [structures, setStructures] = useState<Structure[]>([])
  const [capitalCalls, setCapitalCalls] = useState<CapitalCall[]>([])
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [isDownloadingK1, setIsDownloadingK1] = useState(false)
  const [k1Year, setK1Year] = useState(2024)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Load investors, structures, capital calls, and distributions from localStorage on mount
  useEffect(() => {
    const storedInvestors = getInvestors()
    const storedStructures = getStructures()
    const storedCapitalCalls = getCapitalCalls()
    const storedDistributions = getDistributions()
    setDynamicInvestors(storedInvestors)
    setStructures(storedStructures)
    setCapitalCalls(storedCapitalCalls)
    setDistributions(storedDistributions)
    setIsLoading(false)
  }, [])

  // Merge static and dynamic investors, removing duplicates (prefer dynamic over static)
  const staticInvestors = investorsData as Investor[]
  const dynamicIds = new Set(dynamicInvestors.map(inv => inv.id))
  const uniqueStaticInvestors = staticInvestors.filter(inv => !dynamicIds.has(inv.id))
  const allInvestors = [...uniqueStaticInvestors, ...dynamicInvestors]
  const investor = allInvestors.find((inv) => inv.id === id)

  // Show loading state while fetching dynamic investors
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading investor details...</p>
      </div>
    )
  }

  // Only call notFound() after we've checked both static and dynamic investors
  if (!investor) {
    notFound()
  }

  const handleDownloadK1 = async (year: number) => {
    try {
      setIsDownloadingK1(true)
      const response = await fetch(`/api/investors/${id}/k1/${year}`)
      if (!response.ok) throw new Error('Failed to download K-1')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `K1-${year}-${investor.name.replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading K-1:', error)
      toast.error('Failed to download K-1. Please try again.')
    } finally {
      setIsDownloadingK1(false)
    }
  }

  const handleEdit = () => {
    router.push(`/investment-manager/investors/${id}/edit`)
  }

  const confirmDelete = () => {
    try {
      deleteInvestor(id)
      toast.success('Investor deleted successfully')
      router.push('/investment-manager/investors')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete investor. Please try again.')
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

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Individual': return <User className="h-5 w-5" />
      case 'Institution': return <Building className="h-5 w-5" />
      case 'Family Office': return <Users className="h-5 w-5" />
      case 'Fund of Funds': return <Briefcase className="h-5 w-5" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'outline'        // Pre-registered
      case 'KYC/KYB': return 'outline'        // Identity verification
      case 'Contracts': return 'outline'      // Contract signing
      case 'Commitment': return 'outline'     // Capital commitment setup
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

  const getFundName = (fundId: string): string => {
    const structure = getStructureById(fundId)
    return structure?.name || fundId
  }

  // Calculate actual called capital from capital call transactions
  const calculateCalledCapital = (fundId: string): number => {
    const fundCapitalCalls = capitalCalls.filter(cc =>
      cc.fundId === fundId &&
      cc.status !== 'Draft' &&
      cc.status !== 'Cancelled'
    )

    return fundCapitalCalls.reduce((sum, cc) => {
      const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
      return sum + (allocation?.amountPaid || 0)
    }, 0)
  }

  // Create a map of fundId to actual called capital for all structures
  const calledCapitalMap = new Map<string, number>()
  investor.fundOwnerships?.forEach(ownership => {
    calledCapitalMap.set(ownership.fundId, calculateCalledCapital(ownership.fundId))
  })

  // Calculate ownership % for each structure (called capital / total fund size)
  const ownershipPercentMap = new Map<string, number>()
  investor.fundOwnerships?.forEach(ownership => {
    const structure = structures.find(s => s.id === ownership.fundId)
    const calledCapital = calledCapitalMap.get(ownership.fundId) || 0
    const ownershipPercent = structure && structure.totalCommitment > 0
      ? (calledCapital / structure.totalCommitment) * 100
      : 0
    ownershipPercentMap.set(ownership.fundId, ownershipPercent)
  })

  // Calculate current value for each structure (NAV * ownership %)
  const currentValueMap = new Map<string, number>()
  investor.fundOwnerships?.forEach(ownership => {
    const structure = structures.find(s => s.id === ownership.fundId)
    const ownershipPercent = ownershipPercentMap.get(ownership.fundId) || 0
    const baseValue = structure ? (structure.currentNav ?? structure.totalCommitment) : 0
    const currentValue = baseValue * (ownershipPercent / 100)
    currentValueMap.set(ownership.fundId, currentValue)
  })

  // Calculate unrealized gain for each structure (current value - called capital)
  const unrealizedGainMap = new Map<string, number>()
  investor.fundOwnerships?.forEach(ownership => {
    const currentValue = currentValueMap.get(ownership.fundId) || 0
    const calledCapital = calledCapitalMap.get(ownership.fundId) || 0
    const unrealizedGain = currentValue - calledCapital
    unrealizedGainMap.set(ownership.fundId, unrealizedGain)
  })

  // Calculate total distributed from distribution transactions
  const totalDistributed = distributions
    .filter(dist => dist.status === 'Completed')
    .reduce((sum, dist) => {
      const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
      return sum + (allocation?.finalAllocation || 0)
    }, 0)

  // Calculate total portfolio metrics using actual calculated values
  const totalCommitment = investor.fundOwnerships?.reduce((sum, fo) => sum + fo.commitment, 0) || 0
  const totalCalledCapital = Array.from(calledCapitalMap.values()).reduce((sum, called) => sum + called, 0)
  const totalUncalledCapital = totalCommitment - totalCalledCapital
  const totalCurrentValue = Array.from(currentValueMap.values()).reduce((sum, value) => sum + value, 0)
  const totalUnrealizedGain = Array.from(unrealizedGainMap.values()).reduce((sum, gain) => sum + gain, 0)

  // Calculate IRR from cash flows
  const calculateInvestorIRR = (): number => {
    const cashFlows: { date: Date; amount: number }[] = []

    // Add capital calls as negative cash flows
    capitalCalls
      .filter(cc => cc.status !== 'Draft' && cc.status !== 'Cancelled')
      .forEach(cc => {
        const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
        if (allocation && allocation.amountPaid > 0) {
          cashFlows.push({
            date: new Date(cc.callDate),
            amount: -allocation.amountPaid, // Negative = money out
          })
        }
      })

    // Add distributions as positive cash flows
    distributions
      .filter(dist => dist.status === 'Completed')
      .forEach(dist => {
        const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
        if (allocation && allocation.finalAllocation > 0) {
          cashFlows.push({
            date: new Date(dist.distributionDate),
            amount: allocation.finalAllocation, // Positive = money in
          })
        }
      })

    // Add current value as final positive cash flow at today's date
    // Only add if there's unrealized value (current value > total distributed)
    const unrealizedValue = totalCurrentValue - totalDistributed
    if (unrealizedValue > 0) {
      cashFlows.push({
        date: new Date(),
        amount: unrealizedValue, // Unrealized portfolio value only
      })
    }

    // Need at least 2 cash flows and must have both negative and positive
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

  const investorIRR = calculateInvestorIRR()

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/investment-manager/investors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{investor.name}</h1>
              <Badge variant={getStatusColor(investor.status)}>
                {investor.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                {getTypeIcon(investor.type)}
                <span>{investor.type}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Investor since {formatDate(investor.investorSince)}
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

      {/* Portfolio Overview - Aggregated Totals */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Commitment</div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalCommitment)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Called</div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalCalledCapital)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Uncalled</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalUncalledCapital)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Structures</div>
              <div className="text-2xl font-bold">
                {investor.fundOwnerships?.length || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unrealized Gain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalUnrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalUnrealizedGain)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Structure Allocations */}
      {investor.fundOwnerships && Array.isArray(investor.fundOwnerships) && investor.fundOwnerships.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Structure Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investor.fundOwnerships.map((ownership, index) => {
                if (!ownership) return null

                // Get actual calculated values from maps
                const actualCalledCapital = calledCapitalMap.get(ownership.fundId) || 0
                const actualUncalledCapital = ownership.commitment - actualCalledCapital
                const actualOwnershipPercent = ownershipPercentMap.get(ownership.fundId) || 0
                const calledPercentage = ownership.commitment > 0
                  ? (actualCalledCapital / ownership.commitment) * 100
                  : 0

                return (
                <div key={`${ownership.fundId}-${index}`} className="p-4 border rounded bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-lg">{ownership.fundName}</div>
                    <Badge variant="default" className="text-base px-3 py-1">
                      {actualOwnershipPercent.toFixed(2)}%
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Commitment</div>
                      <div className="font-semibold">{formatCurrency(ownership.commitment)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Called</div>
                      <div className="font-semibold">{formatCurrency(actualCalledCapital)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Uncalled</div>
                      <div className="font-semibold">{formatCurrency(actualUncalledCapital)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Called %</div>
                      <div className="font-semibold">
                        {calledPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {(() => {
                    // Safety check: ensure structures is an array
                    if (!structures || !Array.isArray(structures)) {
                      return null
                    }

                    // Find the structure to get its default terms
                    const structure = structures.find(s => s.id === ownership.fundId)
                    if (!structure) return null

                    // Get custom terms for THIS structure specifically
                    // Prefer per-structure customTerms, fall back to global customTerms (deprecated)
                    const structureSpecificTerms = ownership.customTerms || investor.customTerms

                    // DEBUG LOGGING
                    console.log('=== Economic Terms Comparison ===')
                    console.log('Structure:', structure.name, '(ID:', structure.id, ')')
                    console.log('Structure defaults:', {
                      managementFee: structure.managementFee,
                      performanceFee: structure.performanceFee,
                      hurdleRate: structure.hurdleRate,
                      preferredReturn: structure.preferredReturn
                    })
                    console.log('Ownership-specific custom terms:', ownership.customTerms)
                    console.log('Global custom terms (deprecated):', investor.customTerms)
                    console.log('Using terms:', structureSpecificTerms)

                    // Only show as "custom" if THIS STRUCTURE has custom terms that differ from defaults
                    // Use Number() to handle string/number comparison
                    const mgmtFeeCheck = structureSpecificTerms?.managementFee !== undefined && Number(structureSpecificTerms.managementFee) !== Number(structure.managementFee)
                    const perfFeeCheck = structureSpecificTerms?.performanceFee !== undefined && Number(structureSpecificTerms.performanceFee) !== Number(structure.performanceFee)
                    const hurdleCheck = structureSpecificTerms?.hurdleRate !== undefined && Number(structureSpecificTerms.hurdleRate) !== Number(structure.hurdleRate)
                    const prefReturnCheck = structureSpecificTerms?.preferredReturn !== undefined && Number(structureSpecificTerms.preferredReturn) !== Number(structure.preferredReturn)

                    console.log('Comparison results:')
                    console.log('  - Management Fee differs:', mgmtFeeCheck, `(${Number(structureSpecificTerms?.managementFee)} vs ${Number(structure.managementFee)})`)
                    console.log('  - Performance Fee differs:', perfFeeCheck, `(${Number(structureSpecificTerms?.performanceFee)} vs ${Number(structure.performanceFee)})`)
                    console.log('  - Hurdle Rate differs:', hurdleCheck, `(${Number(structureSpecificTerms?.hurdleRate)} vs ${Number(structure.hurdleRate)})`)
                    console.log('  - Preferred Return differs:', prefReturnCheck, `(${Number(structureSpecificTerms?.preferredReturn)} vs ${Number(structure.preferredReturn)})`)

                    const hasCustomTermsForThisStructure = structureSpecificTerms && (
                      mgmtFeeCheck || perfFeeCheck || hurdleCheck || prefReturnCheck
                    )

                    console.log('Has custom terms for this structure:', hasCustomTermsForThisStructure)
                    console.log('===================================\n')

                    // Determine which terms to show: custom terms override structure defaults
                    const effectiveTerms = {
                      managementFee: structureSpecificTerms?.managementFee ?? structure.managementFee,
                      performanceFee: structureSpecificTerms?.performanceFee ?? structure.performanceFee,
                      hurdleRate: structureSpecificTerms?.hurdleRate ?? structure.hurdleRate,
                      preferredReturn: structureSpecificTerms?.preferredReturn ?? structure.preferredReturn
                    }

                    return (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium">Economic Terms</div>
                            {hasCustomTermsForThisStructure && (
                              <Badge variant="secondary" className="text-xs">
                                Custom Terms Applied
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {effectiveTerms.managementFee !== undefined && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Management Fee</div>
                                <div className="font-semibold text-primary">{effectiveTerms.managementFee}%</div>
                              </div>
                            )}
                            {effectiveTerms.performanceFee !== undefined && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Performance Fee</div>
                                <div className="font-semibold text-primary">{effectiveTerms.performanceFee}%</div>
                              </div>
                            )}
                            {effectiveTerms.hurdleRate !== undefined && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Hurdle Rate</div>
                                <div className="font-semibold text-primary">{effectiveTerms.hurdleRate}%</div>
                              </div>
                            )}
                            {effectiveTerms.preferredReturn !== undefined && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Preferred Return</div>
                                <div className="font-semibold text-primary">{effectiveTerms.preferredReturn}%</div>
                              </div>
                            )}
                          </div>
                          {hasCustomTermsForThisStructure && (
                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-900 dark:text-blue-100">
                              Custom terms override this structure's defaults for this investor
                            </div>
                          )}
                          {!hasCustomTermsForThisStructure && (
                            <div className="mt-3 text-xs text-muted-foreground">
                              Using structure's default economic terms
                            </div>
                          )}
                        </div>
                      </>
                    )
                  })()}
                  {ownership.hierarchyLevel !== undefined && (
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="outline">Level {ownership.hierarchyLevel}</Badge>
                      {ownership.investedDate && (
                        <span className="text-xs text-muted-foreground">
                          Since {formatDate(ownership.investedDate)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Investor ID</div>
                <div className="font-medium">{investor.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Type</div>
                <div className="flex items-center gap-2">
                  {getTypeIcon(investor.type)}
                  <span className="font-medium">{investor.type}</span>
                </div>
              </div>
            </div>
            <Separator />
            {investor.type !== 'individual' && investor.contactFirstName && investor.contactLastName && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Contact Person</div>
                <div className="font-medium">{investor.contactFirstName} {investor.contactLastName}</div>
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{investor.email}</div>
                </div>
              </div>
              {investor.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{investor.phone}</div>
                  </div>
                </div>
              )}
              {investor.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="font-medium space-y-1">
                      <div>{investor.address.street}</div>
                      <div>{investor.address.city}, {investor.address.state} {investor.address.zipCode}</div>
                      <div>{investor.address.country}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Preferred Contact</div>
                <div className="font-medium">{investor.preferredContactMethod}</div>
              </div>
              {investor.lastContactDate && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Last Contact</div>
                  <div className="font-medium">{formatDate(investor.lastContactDate)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary - Aggregated */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Commitment</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(totalCommitment)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Called</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(totalCalledCapital)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Uncalled</div>
                <div className="text-lg font-semibold text-blue-600">
                  {formatCurrency(totalUncalledCapital)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Distributed</div>
                <div className="text-lg font-semibold text-green-600">{formatCurrency(totalDistributed)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Current Value</div>
                <div className="text-lg font-semibold">{formatCurrency(totalCurrentValue)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Net Cash Flow</div>
                <div className={`text-lg font-semibold ${(totalDistributed - totalCalledCapital) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalDistributed - totalCalledCapital)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Unrealized Gain</div>
                <div className={`text-lg font-semibold ${totalUnrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalUnrealizedGain)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">IRR</div>
                <div className={`text-lg font-semibold ${investorIRR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(investorIRR)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tax Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadK1(k1Year)}
                disabled={isDownloadingK1 || investor.k1Status !== 'Delivered'}
              >
                {isDownloadingK1 ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download K-1
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {investor.taxId && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Tax ID</div>
                  <div className="font-medium">{investor.taxId}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground mb-1">K-1 Status</div>
                <Badge variant={getK1StatusColor(investor.k1Status)}>
                  {investor.k1Status}
                </Badge>
              </div>
              {investor.k1DeliveryDate && (
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground mb-1">K-1 Delivery Date</div>
                  <div className="font-medium">{formatDate(investor.k1DeliveryDate)}</div>
                </div>
              )}
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
              {investor.k1Status === 'Delivered' ? (
                `Download Schedule K-1 (Form 1065) for tax year ${k1Year}. This form reports your share of the partnership's income, deductions, and credits.`
              ) : (
                'K-1 form will be available for download once it has been generated and delivered.'
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Notes */}
      {investor.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{investor.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documents</CardTitle>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {investor.documents && investor.documents.length > 0 ? (
            <div className="space-y-2">
              {investor.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                  <div>
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {doc.type} • Uploaded {formatDate(doc.uploadedDate)} by {doc.uploadedBy}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Download</Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No documents uploaded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this investor? This action cannot be undone.
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
