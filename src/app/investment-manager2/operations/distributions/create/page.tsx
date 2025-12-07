'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { IconArrowLeft, IconDeviceFloppy, IconSend, IconAlertCircle, IconCurrencyDollar, IconCalendar, IconUsers, IconFileText, IconCircleCheck, IconTrendingUp } from '@tabler/icons-react'
import { getStructures, type Structure } from '@/lib/structures-storage'
import { getInvestorsByFundId, getInvestorsByHierarchy } from '@/lib/investors-storage'
import { getInvestments } from '@/lib/investments-storage'
import { saveDistribution, getNextDistributionNumber } from '@/lib/distributions-storage'
import type { DistributionAllocation, DistributionSource } from '@/lib/types'
import { calculateWaterfall, AMERICAN_WATERFALL, type InvestorCapitalAccount } from '@/lib/waterfall-calculations'

export default function CreateDistributionPage() {
  const router = useRouter()
  const [structures, setStructures] = useState<Structure[]>([])
  const [selectedFund, setSelectedFund] = useState<Structure | null>(null)
  const [investors, setInvestors] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    fundId: '',
    fundName: '',
    distributionNumber: 1,
    totalDistributionAmount: 0,
    currency: 'USD',
    distributionDate: new Date().toISOString().split('T')[0],
    recordDate: new Date().toISOString().split('T')[0],
    paymentDate: new Date().toISOString().split('T')[0],
    source: '' as DistributionSource | '',
    sourceDescription: '',
    relatedInvestmentId: '',
    relatedInvestmentName: '',
    isReturnOfCapital: false,
    isIncome: false,
    isCapitalGain: false,
    returnOfCapitalAmount: 0,
    incomeAmount: 0,
    capitalGainAmount: 0,
    waterfallApplied: false,
    transactionType: 'Distribution',
    exitProceedsMultiple: undefined as number | undefined,
  })

  const [investorAllocations, setInvestorAllocations] = useState<DistributionAllocation[]>([])
  const [level1WaterfallSummary, setLevel1WaterfallSummary] = useState<any>(null)

  useEffect(() => {
    setStructures(getStructures())
    setInvestments(getInvestments())
  }, [])

  useEffect(() => {
    if (formData.fundId) {
      const fund = structures.find(s => s.id === formData.fundId)
      setSelectedFund(fund || null)

      if (fund) {
        // Check if this is a hierarchical structure (has hierarchyLevel and it's the master)
        const isHierarchyMaster = fund.hierarchyLevel === 1

        let fundInvestors: any[] = []

        if (isHierarchyMaster) {
          // Get all investors across the entire hierarchy
          const hierarchyData = getInvestorsByHierarchy(fund.id)

          // Transform to include hierarchy information
          fundInvestors = hierarchyData.map(item => ({
            ...item.investor,
            hierarchyLevel: item.hierarchyLevel,
            structureId: item.structureId,
            structureName: item.structureName,
            // Store the ownership info for this specific structure
            _hierarchyOwnership: {
              ownershipPercent: item.ownershipPercent,
              commitment: item.commitment,
              structureId: item.structureId
            }
          }))
        } else {
          // Single-level structure - use existing logic
          fundInvestors = getInvestorsByFundId(fund.id)
        }

        setInvestors(fundInvestors)

        setFormData(prev => ({
          ...prev,
          fundName: fund.name,
          currency: fund.currency,
          distributionNumber: getNextDistributionNumber(fund.id),
          // Use applyWaterfallAtThisLevel flag to determine calculation method
          // If true: waterfall, If false: pro-rata
          waterfallApplied: !!fund.applyWaterfallAtThisLevel,
        }))
      }
    }
  }, [formData.fundId, structures])

  useEffect(() => {
    if (formData.totalDistributionAmount > 0 && investors.length > 0 && selectedFund) {
      // Check if this is a hierarchical master structure
      const isHierarchyMaster = selectedFund.hierarchyLevel === 1

      if (isHierarchyMaster) {
        // TWO-STAGE WATERFALL CALCULATION (Bottom-to-Top Cascade)
        // Separate Level 1 and Level 2 investors
        const level1Investors = investors.filter(inv => inv.hierarchyLevel === 1)
        const level2Investors = investors.filter(inv => inv.hierarchyLevel === 2)

        console.log('=== DISTRIBUTION CALCULATION DEBUG ===')
        console.log('Total investors:', investors.length)
        console.log('Level 1 investors:', level1Investors.length)
        console.log('Level 2 investors:', level2Investors.length)
        console.log('Level 2 investors data:', level2Investors)

        // Get Level 2 structure (Investment Trust) for waterfall parameters
        const level2StructureId = level2Investors[0]?._hierarchyOwnership?.structureId
        const level2Structure = level2StructureId ? structures.find(s => s.id === level2StructureId) : null

        console.log('Level 2 Structure ID:', level2StructureId)
        console.log('Level 2 Structure:', level2Structure)

        // Get the Investment Trust's ownership percentage in the Master Trust
        // Calculate from level 2 investors' total ownership
        const level2TotalOwnership = level2Investors.reduce((sum, inv) =>
          sum + (inv._hierarchyOwnership?.ownershipPercent || 0), 0)
        const level2OwnershipOfMaster = level2TotalOwnership > 0 ? level2TotalOwnership : 0
        console.log('Level 2 Ownership of Master:', level2OwnershipOfMaster, '%')

        // STEP 1: Calculate Level 2 distribution (Investment Trust)
        // Bottom layer gets paid FIRST from total distribution
        // Level 2 receives: totalDistribution * (Level2OwnershipOfMaster / 100)
        const level2TotalFromMaster = formData.totalDistributionAmount * (level2OwnershipOfMaster / 100)
        const level2Allocations: DistributionAllocation[] = []

        if (level2Investors.length > 0 && level2Structure && level2TotalFromMaster > 0) {
          // Calculate total ownership at Level 2 (should sum to ~100%)
          const level2TotalOwnership = level2Investors.reduce((sum, inv) => {
            return sum + (inv._hierarchyOwnership?.ownershipPercent || 0)
          }, 0)

          // Apply waterfall within Level 2 (simple preferred return + pro-rata)
          // For now, using pro-rata distribution based on ownership within Level 2
          level2Investors.forEach(investor => {
            const hierarchyOwnership = investor._hierarchyOwnership as any
            const ownershipPercent = hierarchyOwnership?.ownershipPercent || 0

            // Pro-rata within Level 2 based on their ownership percentage
            const ownershipFraction = level2TotalOwnership > 0 ? ownershipPercent / level2TotalOwnership : 0
            const baseAllocation = level2TotalFromMaster * ownershipFraction

            const returnOfCapital = formData.isReturnOfCapital
              ? (formData.returnOfCapitalAmount * (level2OwnershipOfMaster / 100)) * ownershipFraction
              : undefined
            const income = formData.isIncome
              ? (formData.incomeAmount * (level2OwnershipOfMaster / 100)) * ownershipFraction
              : undefined
            const capitalGain = formData.isCapitalGain
              ? (formData.capitalGainAmount * (level2OwnershipOfMaster / 100)) * ownershipFraction
              : undefined

            level2Allocations.push({
              investorId: investor.id,
              investorName: investor.name,
              investorType: investor.type,
              ownershipPercent,
              baseAllocation,
              finalAllocation: baseAllocation,
              returnOfCapitalAmount: returnOfCapital,
              incomeAmount: income,
              capitalGainAmount: capitalGain,
              status: 'Pending' as const,
              noticeSent: false,
              distributionsToDate: baseAllocation,
              hierarchyLevel: investor.hierarchyLevel,
              structureName: investor.structureName,
            } as any)
          })
        }

        // STEP 2: Calculate Level 1 distribution (Master Trust)
        // Top layer gets REMAINDER after Level 2 is paid
        const remainingForLevel1 = formData.totalDistributionAmount - level2TotalFromMaster
        const level1Allocations: DistributionAllocation[] = []
        let waterfallSummary: any = null

        if (level1Investors.length > 0 && remainingForLevel1 > 0) {
          // Check if waterfall is enabled at Master level
          const applyWaterfall = selectedFund.applyWaterfallAtThisLevel
          const waterfallAlgorithm = selectedFund.waterfallAlgorithm

          if (applyWaterfall && waterfallAlgorithm) {
            // COMPLEX WATERFALL: Apply 4-tier waterfall (ROC → Pref Return → Catch-Up → Carry)
            console.log('Applying', waterfallAlgorithm, 'waterfall at Level 1')

            // Build capital accounts for Level 1 investors
            const capitalAccounts: InvestorCapitalAccount[] = level1Investors.map(investor => {
              const commitment = investor._hierarchyOwnership?.commitment || 0

              // For now, assume all capital has been called and not yet returned
              // In production, this would come from capital call history
              return {
                investorId: investor.id,
                investorName: investor.name,
                capitalContributed: commitment,
                capitalReturned: 0, // Would track previous distributions
                preferredReturnAccrued: 0, // Would calculate based on time
                preferredReturnPaid: 0, // Would track previous pref return distributions
                distributionsReceived: 0, // Would track all previous distributions
              }
            })

            // Get waterfall structure (American or European)
            const waterfallStructure = waterfallAlgorithm === 'american' ? AMERICAN_WATERFALL : AMERICAN_WATERFALL

            // Calculate waterfall distribution
            const waterfallResult = calculateWaterfall(
              waterfallStructure,
              remainingForLevel1,
              capitalAccounts,
              selectedFund.createdDate instanceof Date ? selectedFund.createdDate.toISOString() : new Date().toISOString(),
              formData.distributionDate
            )

            console.log('Waterfall Result:', waterfallResult)

            // Store waterfall summary for UI display
            waterfallSummary = {
              tiers: waterfallResult.tierDistributions.map(tier => ({
                name: tier.tierName,
                type: tier.tierType,
                amount: tier.amountDistributed,
                lpAmount: tier.lpAmount,
                gpAmount: tier.gpAmount,
              })),
              gpCarry: waterfallResult.gpAllocation.totalAmount,
            }

            // Map waterfall results to allocations
            waterfallResult.investorAllocations.forEach(waterfallAlloc => {
              const investor = level1Investors.find(inv => inv.id === waterfallAlloc.investorId)
              if (!investor) return

              const baseAllocation = waterfallAlloc.totalAllocation

              // Calculate tax components proportionally
              const allocationFraction = remainingForLevel1 > 0 ? baseAllocation / remainingForLevel1 : 0
              const level1PortionOfTotal = remainingForLevel1 / formData.totalDistributionAmount

              const returnOfCapital = formData.isReturnOfCapital && remainingForLevel1 > 0
                ? (formData.returnOfCapitalAmount * level1PortionOfTotal) * allocationFraction
                : undefined
              const income = formData.isIncome && remainingForLevel1 > 0
                ? (formData.incomeAmount * level1PortionOfTotal) * allocationFraction
                : undefined
              const capitalGain = formData.isCapitalGain && remainingForLevel1 > 0
                ? (formData.capitalGainAmount * level1PortionOfTotal) * allocationFraction
                : undefined

              level1Allocations.push({
                investorId: investor.id,
                investorName: investor.name,
                investorType: investor.type,
                ownershipPercent: waterfallAlloc.ownershipPercent,
                baseAllocation,
                finalAllocation: baseAllocation,
                returnOfCapitalAmount: returnOfCapital,
                incomeAmount: income,
                capitalGainAmount: capitalGain,
                status: 'Pending' as const,
                noticeSent: false,
                distributionsToDate: baseAllocation,
                hierarchyLevel: investor.hierarchyLevel,
                structureName: investor.structureName,
              } as any)
            })

            // Add GP allocation if there is carried interest
            if (waterfallResult.gpAllocation.totalAmount > 0) {
              console.log('GP Carry:', waterfallResult.gpAllocation.totalAmount)
              // Note: GP allocation would be stored separately in production
            }
          } else {
            // SIMPLE PRO-RATA: No waterfall, just pro-rata distribution
            console.log('Applying pro-rata distribution at Level 1 (no waterfall)')

            const level1TotalOwnership = level1Investors.reduce((sum, inv) => {
              return sum + (inv._hierarchyOwnership?.ownershipPercent || 0)
            }, 0)

            level1Investors.forEach(investor => {
              const hierarchyOwnership = investor._hierarchyOwnership as any
              const ownershipPercent = hierarchyOwnership?.ownershipPercent || 0

              // Pro-rata distribution of remainder based on Level 1 ownership
              const ownershipFraction = level1TotalOwnership > 0 ? ownershipPercent / level1TotalOwnership : 0
              const baseAllocation = remainingForLevel1 * ownershipFraction

              // Calculate tax components from the remaining amount
              const level1PortionOfTotal = remainingForLevel1 / formData.totalDistributionAmount

              const returnOfCapital = formData.isReturnOfCapital && remainingForLevel1 > 0
                ? (formData.returnOfCapitalAmount * level1PortionOfTotal) * ownershipFraction
                : undefined
              const income = formData.isIncome && remainingForLevel1 > 0
                ? (formData.incomeAmount * level1PortionOfTotal) * ownershipFraction
                : undefined
              const capitalGain = formData.isCapitalGain && remainingForLevel1 > 0
                ? (formData.capitalGainAmount * level1PortionOfTotal) * ownershipFraction
                : undefined

              level1Allocations.push({
                investorId: investor.id,
                investorName: investor.name,
                investorType: investor.type,
                ownershipPercent,
                baseAllocation,
                finalAllocation: baseAllocation,
                returnOfCapitalAmount: returnOfCapital,
                incomeAmount: income,
                capitalGainAmount: capitalGain,
                status: 'Pending' as const,
                noticeSent: false,
                distributionsToDate: baseAllocation,
                hierarchyLevel: investor.hierarchyLevel,
                structureName: investor.structureName,
              } as any)
            })
          }
        }

        // Combine allocations: Level 2 first, then Level 1
        setInvestorAllocations([...level2Allocations, ...level1Allocations])
        setLevel1WaterfallSummary(waterfallSummary)
      } else {
        // SINGLE-LEVEL STRUCTURE: Original pro-rata calculation
        const allocations: DistributionAllocation[] = investors.map(investor => {
          let ownershipPercent = 0

          if (investor._hierarchyOwnership) {
            ownershipPercent = investor._hierarchyOwnership.ownershipPercent
          } else {
            const ownership = investor.fundOwnerships?.find((fo: any) => fo.fundId === formData.fundId)
            ownershipPercent = ownership?.ownershipPercent || 0
          }

          const baseAllocation = formData.totalDistributionAmount * (ownershipPercent / 100)

          const returnOfCapital = formData.isReturnOfCapital
            ? formData.returnOfCapitalAmount * (ownershipPercent / 100)
            : undefined
          const income = formData.isIncome
            ? formData.incomeAmount * (ownershipPercent / 100)
            : undefined
          const capitalGain = formData.isCapitalGain
            ? formData.capitalGainAmount * (ownershipPercent / 100)
            : undefined

          return {
            investorId: investor.id,
            investorName: investor.name,
            investorType: investor.type,
            ownershipPercent,
            baseAllocation,
            finalAllocation: baseAllocation,
            returnOfCapitalAmount: returnOfCapital,
            incomeAmount: income,
            capitalGainAmount: capitalGain,
            status: 'Pending' as const,
            noticeSent: false,
            distributionsToDate: baseAllocation,
            hierarchyLevel: investor.hierarchyLevel,
            structureName: investor.structureName,
          } as any
        })

        setInvestorAllocations(allocations)
      }
    }
  }, [
    formData.totalDistributionAmount,
    formData.isReturnOfCapital,
    formData.isIncome,
    formData.isCapitalGain,
    formData.returnOfCapitalAmount,
    formData.incomeAmount,
    formData.capitalGainAmount,
    investors,
    formData.fundId,
    selectedFund,
    structures,
  ])

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      if (field === 'relatedInvestmentId' && value) {
        const investment = investments.find(inv => inv.id === value)
        if (investment) {
          updated.relatedInvestmentName = investment.name
          if (updated.source === 'Exit Proceeds') {
            updated.sourceDescription = `Exit proceeds from ${investment.name}`
          }
        }
      }

      if (field === 'source' && value === 'Exit Proceeds') {
        const investment = investments.find(inv => inv.id === updated.relatedInvestmentId)
        if (investment) {
          updated.sourceDescription = `Exit proceeds from ${investment.name}`
        }
      }

      // Auto-populate tax classification based on Distribution Source
      if (field === 'source') {
        const totalAmount = updated.totalDistributionAmount

        switch (value) {
          case 'Operating Income':
            updated.isReturnOfCapital = false
            updated.isIncome = true
            updated.isCapitalGain = false
            updated.returnOfCapitalAmount = 0
            updated.incomeAmount = totalAmount
            updated.capitalGainAmount = 0
            break
          case 'Exit Proceeds':
            updated.isReturnOfCapital = true
            updated.isIncome = false
            updated.isCapitalGain = true
            updated.returnOfCapitalAmount = totalAmount * 0.5
            updated.incomeAmount = 0
            updated.capitalGainAmount = totalAmount * 0.5
            break
          case 'Refinancing':
            updated.isReturnOfCapital = true
            updated.isIncome = false
            updated.isCapitalGain = false
            updated.returnOfCapitalAmount = totalAmount
            updated.incomeAmount = 0
            updated.capitalGainAmount = 0
            break
          case 'Return of Capital':
            updated.isReturnOfCapital = true
            updated.isIncome = false
            updated.isCapitalGain = false
            updated.returnOfCapitalAmount = totalAmount
            updated.incomeAmount = 0
            updated.capitalGainAmount = 0
            break
          case 'Other':
            // User must manually allocate for "Other"
            updated.isReturnOfCapital = true
            updated.isIncome = true
            updated.isCapitalGain = true
            updated.returnOfCapitalAmount = 0
            updated.incomeAmount = 0
            updated.capitalGainAmount = 0
            break
          default:
            break
        }
      }

      return updated
    })
  }

  const handleSave = (processNow: boolean = false) => {
    if (!formData.fundId || formData.totalDistributionAmount === 0) {
      toast.error('Please select a fund and enter a distribution amount')
      return
    }

    if (!formData.source) {
      toast.error('Please select a distribution source')
      return
    }

    const distribution = {
      fundId: formData.fundId,
      fundName: formData.fundName,
      distributionNumber: formData.distributionNumber,
      totalDistributionAmount: formData.totalDistributionAmount,
      currency: formData.currency,
      distributionDate: formData.distributionDate,
      recordDate: formData.recordDate,
      paymentDate: formData.paymentDate,
      source: formData.source as DistributionSource,
      sourceDescription: formData.sourceDescription,
      relatedInvestmentId: formData.relatedInvestmentId || undefined,
      relatedInvestmentName: formData.relatedInvestmentName || undefined,
      isReturnOfCapital: formData.isReturnOfCapital,
      isIncome: formData.isIncome,
      isCapitalGain: formData.isCapitalGain,
      returnOfCapitalAmount: formData.isReturnOfCapital ? formData.returnOfCapitalAmount : undefined,
      incomeAmount: formData.isIncome ? formData.incomeAmount : undefined,
      capitalGainAmount: formData.isCapitalGain ? formData.capitalGainAmount : undefined,
      status: processNow ? ('Processing' as const) : ('Pending' as const),
      processedDate: processNow ? new Date().toISOString() : undefined,
      investorAllocations,
      waterfallApplied: formData.waterfallApplied,
      transactionType: formData.transactionType,
      exitProceedsMultiple: formData.exitProceedsMultiple,
      createdBy: 'Gabriela Mena',
    }

    const saved = saveDistribution(distribution)

    if (processNow) {
      toast.success(`Distribution #${saved.distributionNumber} is being processed!`)
    } else {
      toast.success(`Distribution #${saved.distributionNumber} has been saved`)
    }

    router.push('/investment-manager/operations/distributions')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <IconArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Distribution</h1>
          <p className="text-muted-foreground mt-1">
            Distribute capital to limited partners
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Fund & Amount', icon: IconCurrencyDollar },
          { num: 2, label: 'Source & Classification', icon: IconFileText },
          { num: 3, label: 'Investor Allocations', icon: IconUsers },
          { num: 4, label: 'Review & Process', icon: IconCircleCheck },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= s.num
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{s.label}</p>
              </div>
            </div>
            {idx < 4 && (
              <div className={`h-1 flex-1 mx-4 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Fund & Amount */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Fund and Distribution Amount</CardTitle>
            <CardDescription>Choose which fund to distribute from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fund">Fund Structure *</Label>
                <Select value={formData.fundId} onValueChange={(value) => updateFormData('fundId', value)}>
                  <SelectTrigger id="fund">
                    <SelectValue placeholder="Select a fund" />
                  </SelectTrigger>
                  <SelectContent>
                    {structures.map((structure) => (
                      <SelectItem key={structure.id} value={structure.id}>
                        {structure.name} ({structure.type.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="distributionNumber">Distribution Number</Label>
                <Input
                  id="distributionNumber"
                  type="number"
                  value={formData.distributionNumber}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Auto-generated based on fund history</p>
              </div>
            </div>

            {selectedFund && (
              <Alert>
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedFund.name}</strong> has {investors.length} investor{investors.length !== 1 ? 's' : ''}
                  {selectedFund.hierarchyLevel === 1 && investors.length > 0 && (
                    <span className="block mt-1 text-xs">
                      {(() => {
                        const levels = investors.reduce((acc: any, inv: any) => {
                          const level = inv.hierarchyLevel || 1
                          acc[level] = (acc[level] || 0) + 1
                          return acc
                        }, {})
                        return Object.entries(levels).map(([level, count]) => (
                          <span key={level} className="mr-3">Level {level}: {count as number}</span>
                        ))
                      })()}
                    </span>
                  )}
                  <span className="block mt-1">
                    <strong>Distribution Method:</strong>{' '}
                    {selectedFund.applyWaterfallAtThisLevel ? (
                      <span className="text-primary font-semibold">
                        Waterfall ({selectedFund.waterfallAlgorithm ? selectedFund.waterfallAlgorithm.charAt(0).toUpperCase() + selectedFund.waterfallAlgorithm.slice(1) : 'Standard'})
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-semibold">Pro-Rata</span>
                    )}
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalDistributionAmount">Total Distribution Amount *</Label>
                <Input
                  id="totalDistributionAmount"
                  type="number"
                  value={formData.totalDistributionAmount || ''}
                  onChange={(e) => updateFormData('totalDistributionAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">From fund settings</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button onClick={() => router.back()} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.fundId || formData.totalDistributionAmount === 0}
              >
                Next: Source & Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Source & Classification */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Source & Tax Classification</CardTitle>
            <CardDescription>Specify distribution source, dates, and tax treatment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distributionDate">Distribution Date *</Label>
                <Input
                  id="distributionDate"
                  type="date"
                  value={formData.distributionDate}
                  onChange={(e) => updateFormData('distributionDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recordDate">Record Date</Label>
                <Input
                  id="recordDate"
                  type="date"
                  value={formData.recordDate}
                  onChange={(e) => updateFormData('recordDate', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Date to determine eligible investors</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => updateFormData('paymentDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Distribution Source *</Label>
              <Select value={formData.source} onValueChange={(value) => updateFormData('source', value)}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operating Income">Operating Income</SelectItem>
                  <SelectItem value="Exit Proceeds">Exit Proceeds</SelectItem>
                  <SelectItem value="Refinancing">Refinancing</SelectItem>
                  <SelectItem value="Return of Capital">Return of Capital</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceDescription">Source Description</Label>
              <Textarea
                id="sourceDescription"
                value={formData.sourceDescription}
                onChange={(e) => updateFormData('sourceDescription', e.target.value)}
                placeholder="e.g., Quarterly rental income from ABC Property, Sale of XYZ Investment"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relatedInvestment">Related Investment (Optional)</Label>
              <Select
                value={formData.relatedInvestmentId || undefined}
                onValueChange={(value) => updateFormData('relatedInvestmentId', value === 'none' ? '' : value)}
              >
                <SelectTrigger id="relatedInvestment">
                  <SelectValue placeholder="Select an investment (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {investments
                    .filter(inv => inv.fundId === formData.fundId)
                    .map((investment) => (
                      <SelectItem key={investment.id} value={investment.id}>
                        {investment.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {formData.source === 'Exit Proceeds' && (
              <div className="space-y-2">
                <Label htmlFor="exitMultiple">Exit Proceeds Multiple (Optional)</Label>
                <Input
                  id="exitMultiple"
                  type="number"
                  step="0.1"
                  value={formData.exitProceedsMultiple || ''}
                  onChange={(e) => updateFormData('exitProceedsMultiple', parseFloat(e.target.value) || undefined)}
                  placeholder="e.g., 2.5x"
                />
                <p className="text-xs text-muted-foreground">Return multiple on investment (e.g., 2.5x = 2.5 times invested capital)</p>
              </div>
            )}

            {/* Tax Classification Breakdown */}
            {formData.source && (
              <div className="border-t pt-6 mt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Tax Classification Breakdown *</h3>
                  <p className="text-sm text-muted-foreground">
                    Allocate the distribution amount across tax categories. Values are auto-populated based on distribution source but can be adjusted.
                  </p>
                </div>

                <Alert className="mb-4">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {formData.source === 'Other'
                      ? 'For "Other" distributions, you must manually allocate the total amount across the three tax categories.'
                      : 'Auto-populated based on distribution source. Adjust as needed to match your fund\'s tax treatment.'}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Return of Capital */}
                  <div className="space-y-2">
                    <Label htmlFor="rocAmount" className="font-medium">
                      Return of Capital (ROC)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {formData.currency}
                      </span>
                      <Input
                        id="rocAmount"
                        type="number"
                        value={formData.returnOfCapitalAmount || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setFormData(prev => ({
                            ...prev,
                            returnOfCapitalAmount: value,
                            isReturnOfCapital: value > 0
                          }))
                        }}
                        placeholder="0"
                        className="pl-16"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Previously contributed capital (not taxable)
                    </p>
                  </div>

                  {/* Ordinary Income */}
                  <div className="space-y-2">
                    <Label htmlFor="incomeAmount" className="font-medium">
                      Ordinary Income
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {formData.currency}
                      </span>
                      <Input
                        id="incomeAmount"
                        type="number"
                        value={formData.incomeAmount || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setFormData(prev => ({
                            ...prev,
                            incomeAmount: value,
                            isIncome: value > 0
                          }))
                        }}
                        placeholder="0"
                        className="pl-16"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Operating income, rental income, interest
                    </p>
                  </div>

                  {/* Capital Gains */}
                  <div className="space-y-2">
                    <Label htmlFor="capitalGainAmount" className="font-medium">
                      Capital Gains
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {formData.currency}
                      </span>
                      <Input
                        id="capitalGainAmount"
                        type="number"
                        value={formData.capitalGainAmount || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setFormData(prev => ({
                            ...prev,
                            capitalGainAmount: value,
                            isCapitalGain: value > 0
                          }))
                        }}
                        placeholder="0"
                        className="pl-16"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gain from sale or appreciation
                    </p>
                  </div>
                </div>

                {/* Validation Summary */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Total Classified:</span>
                    <span className={`text-lg font-semibold ${
                      Math.abs(
                        formData.returnOfCapitalAmount +
                        formData.incomeAmount +
                        formData.capitalGainAmount -
                        formData.totalDistributionAmount
                      ) < 0.01
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(
                        formData.returnOfCapitalAmount +
                        formData.incomeAmount +
                        formData.capitalGainAmount
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Total Distribution:</span>
                    <span className="font-semibold">{formatCurrency(formData.totalDistributionAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Remaining to Allocate:</span>
                    <span className={`font-semibold ${
                      Math.abs(
                        formData.totalDistributionAmount -
                        (formData.returnOfCapitalAmount +
                         formData.incomeAmount +
                         formData.capitalGainAmount)
                      ) < 0.01
                        ? 'text-green-600'
                        : 'text-orange-600'
                    }`}>
                      {formatCurrency(
                        formData.totalDistributionAmount -
                        (formData.returnOfCapitalAmount +
                         formData.incomeAmount +
                         formData.capitalGainAmount)
                      )}
                      {Math.abs(
                        formData.totalDistributionAmount -
                        (formData.returnOfCapitalAmount +
                         formData.incomeAmount +
                         formData.capitalGainAmount)
                      ) < 0.01 && (
                        <IconCircleCheck className="w-4 h-4 inline ml-2" />
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <Button onClick={() => setStep(1)} variant="outline">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={
                  !formData.source ||
                  Math.abs(
                    formData.totalDistributionAmount -
                    (formData.returnOfCapitalAmount +
                     formData.incomeAmount +
                     formData.capitalGainAmount)
                  ) >= 0.01
                }
              >
                Next: Investor Allocations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2b: Classification (part of step 2) */}
      {step === 2 && false && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution Classification</CardTitle>
            <CardDescription>
              Classify the distribution for tax reporting purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>
                Distribution can be classified as Return of Capital, Income, Capital Gain, or a combination.
                The sum of all classifications should equal the total distribution amount.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="returnOfCapital"
                  checked={formData.isReturnOfCapital}
                  onCheckedChange={(checked) => updateFormData('isReturnOfCapital', checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="returnOfCapital" className="font-medium cursor-pointer">
                    Return of Capital
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Distribution of previously contributed capital (not taxable as income)
                  </p>
                  {formData.isReturnOfCapital && (
                    <div className="mt-3">
                      <Label htmlFor="rocAmount">Return of Capital Amount</Label>
                      <Input
                        id="rocAmount"
                        type="number"
                        value={formData.returnOfCapitalAmount || ''}
                        onChange={(e) => updateFormData('returnOfCapitalAmount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="income"
                  checked={formData.isIncome}
                  onCheckedChange={(checked) => updateFormData('isIncome', checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="income" className="font-medium cursor-pointer">
                    Income
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Operating income, rental income, interest, dividends
                  </p>
                  {formData.isIncome && (
                    <div className="mt-3">
                      <Label htmlFor="incomeAmount">Income Amount</Label>
                      <Input
                        id="incomeAmount"
                        type="number"
                        value={formData.incomeAmount || ''}
                        onChange={(e) => updateFormData('incomeAmount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="capitalGain"
                  checked={formData.isCapitalGain}
                  onCheckedChange={(checked) => updateFormData('isCapitalGain', checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="capitalGain" className="font-medium cursor-pointer">
                    Capital Gain
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Gain from sale or appreciation of investment
                  </p>
                  {formData.isCapitalGain && (
                    <div className="mt-3">
                      <Label htmlFor="capitalGainAmount">Capital Gain Amount</Label>
                      <Input
                        id="capitalGainAmount"
                        type="number"
                        value={formData.capitalGainAmount || ''}
                        onChange={(e) => updateFormData('capitalGainAmount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Total Classified:</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(
                    (formData.isReturnOfCapital ? formData.returnOfCapitalAmount : 0) +
                    (formData.isIncome ? formData.incomeAmount : 0) +
                    (formData.isCapitalGain ? formData.capitalGainAmount : 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Distribution:</span>
                <span className="font-semibold">{formatCurrency(formData.totalDistributionAmount)}</span>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button onClick={() => setStep(2)} variant="outline">
                Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next: Investor Allocations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Investor Allocations */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Investor Allocations</CardTitle>
            <CardDescription>
              Review how the distribution will be allocated to each investor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Distribution Method:</strong>
                <div className="mt-2 space-y-1">
                  <div className="font-medium text-blue-900">
                    • Level 2 (Investment Trust): Simple pro-rata distribution (paid first)
                  </div>
                  <div className="font-medium text-purple-900">
                    • Level 1 (Master Trust): {selectedFund?.applyWaterfallAtThisLevel ? (
                      <>
                        {selectedFund.waterfallAlgorithm === 'american' ? 'American' : 'European'} Waterfall
                        <span className="block text-sm text-muted-foreground mt-1">
                          Tiers: Return of Capital → 8% Preferred Return → Profit Split (80/20)
                        </span>
                      </>
                    ) : (
                      'Simple pro-rata distribution'
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ownership %</TableHead>
                  <TableHead>Base Allocation</TableHead>
                  {formData.isReturnOfCapital && <TableHead>ROC</TableHead>}
                  {formData.isIncome && <TableHead>Income</TableHead>}
                  {formData.isCapitalGain && <TableHead>Gain</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // Group allocations by hierarchy level
                  const level2Allocations = investorAllocations.filter((a: any) => a.hierarchyLevel === 2)
                  const level1Allocations = investorAllocations.filter((a: any) => a.hierarchyLevel === 1)
                  const otherAllocations = investorAllocations.filter((a: any) => !a.hierarchyLevel || (a.hierarchyLevel !== 1 && a.hierarchyLevel !== 2))

                  const level2Total = level2Allocations.reduce((sum: number, a: any) => sum + a.baseAllocation, 0)
                  const level1Total = level1Allocations.reduce((sum: number, a: any) => sum + a.baseAllocation, 0)

                  console.log('Level 2 Allocations:', level2Allocations)
                  console.log('Level 1 Allocations:', level1Allocations)
                  console.log('Level 2 Total:', level2Total)
                  console.log('Level 1 Total:', level1Total)

                  return (
                    <>
                      {/* Level 2 Section (Investment Trust - Paid First) */}
                      {level2Allocations.length > 0 && (
                        <>
                          <TableRow className="bg-blue-50">
                            <TableCell colSpan={7} className="font-bold text-blue-900">
                              Level 2: Investment Trust (Paid First)
                            </TableCell>
                          </TableRow>
                          {level2Allocations.map((allocation: any) => (
                            <TableRow key={allocation.investorId}>
                              <TableCell className="font-medium pl-8">
                                {allocation.investorName}
                                <span className="block text-xs text-muted-foreground mt-1">
                                  {allocation.structureName}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{allocation.investorType}</Badge>
                              </TableCell>
                              <TableCell>{allocation.ownershipPercent.toFixed(2)}%</TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {formatCurrency(allocation.baseAllocation)}
                              </TableCell>
                              {formData.isReturnOfCapital && (
                                <TableCell>{formatCurrency(allocation.returnOfCapitalAmount || 0)}</TableCell>
                              )}
                              {formData.isIncome && (
                                <TableCell>{formatCurrency(allocation.incomeAmount || 0)}</TableCell>
                              )}
                              {formData.isCapitalGain && (
                                <TableCell>{formatCurrency(allocation.capitalGainAmount || 0)}</TableCell>
                              )}
                            </TableRow>
                          ))}
                          <TableRow className="bg-blue-100 font-semibold">
                            <TableCell colSpan={3} className="text-right">Level 2 Subtotal:</TableCell>
                            <TableCell className="text-blue-900">{formatCurrency(level2Total)}</TableCell>
                            {formData.isReturnOfCapital && (
                              <TableCell className="text-blue-900">
                                {formatCurrency(level2Allocations.reduce((sum: number, a: any) => sum + (a.returnOfCapitalAmount || 0), 0))}
                              </TableCell>
                            )}
                            {formData.isIncome && (
                              <TableCell className="text-blue-900">
                                {formatCurrency(level2Allocations.reduce((sum: number, a: any) => sum + (a.incomeAmount || 0), 0))}
                              </TableCell>
                            )}
                            {formData.isCapitalGain && (
                              <TableCell className="text-blue-900">
                                {formatCurrency(level2Allocations.reduce((sum: number, a: any) => sum + (a.capitalGainAmount || 0), 0))}
                              </TableCell>
                            )}
                          </TableRow>
                        </>
                      )}

                      {/* Level 1 Section (Master Trust - Remainder) */}
                      {level1Allocations.length > 0 && (
                        <>
                          <TableRow className="bg-purple-50">
                            <TableCell colSpan={7} className="font-bold text-purple-900">
                              Level 1: Master Trust (Remainder After Level 2)
                              {level1WaterfallSummary && (
                                <div className="text-xs font-normal text-purple-700 mt-1">
                                  Waterfall Applied: {level1WaterfallSummary.tiers.map((tier: any, idx: number) => (
                                    <span key={idx}>
                                      {tier.name}: {formatCurrency(tier.amount)}
                                      {tier.amount > 0 && <span className="text-green-600"> ✓</span>}
                                      {tier.amount === 0 && <span className="text-gray-400"> (not reached)</span>}
                                      {idx < level1WaterfallSummary.tiers.length - 1 && ' → '}
                                    </span>
                                  ))}
                                  {level1WaterfallSummary.gpCarry > 0 && (
                                    <span className="block mt-1">
                                      GP Carried Interest: {formatCurrency(level1WaterfallSummary.gpCarry)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                          {level1Allocations.map((allocation: any) => (
                            <TableRow key={allocation.investorId}>
                              <TableCell className="font-medium pl-8">
                                {allocation.investorName}
                                <span className="block text-xs text-muted-foreground mt-1">
                                  {allocation.structureName}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{allocation.investorType}</Badge>
                              </TableCell>
                              <TableCell>{allocation.ownershipPercent.toFixed(2)}%</TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {formatCurrency(allocation.baseAllocation)}
                              </TableCell>
                              {formData.isReturnOfCapital && (
                                <TableCell>{formatCurrency(allocation.returnOfCapitalAmount || 0)}</TableCell>
                              )}
                              {formData.isIncome && (
                                <TableCell>{formatCurrency(allocation.incomeAmount || 0)}</TableCell>
                              )}
                              {formData.isCapitalGain && (
                                <TableCell>{formatCurrency(allocation.capitalGainAmount || 0)}</TableCell>
                              )}
                            </TableRow>
                          ))}
                          <TableRow className="bg-purple-100 font-semibold">
                            <TableCell colSpan={3} className="text-right">Level 1 Subtotal:</TableCell>
                            <TableCell className="text-purple-900">{formatCurrency(level1Total)}</TableCell>
                            {formData.isReturnOfCapital && (
                              <TableCell className="text-purple-900">
                                {formatCurrency(level1Allocations.reduce((sum: number, a: any) => sum + (a.returnOfCapitalAmount || 0), 0))}
                              </TableCell>
                            )}
                            {formData.isIncome && (
                              <TableCell className="text-purple-900">
                                {formatCurrency(level1Allocations.reduce((sum: number, a: any) => sum + (a.incomeAmount || 0), 0))}
                              </TableCell>
                            )}
                            {formData.isCapitalGain && (
                              <TableCell className="text-purple-900">
                                {formatCurrency(level1Allocations.reduce((sum: number, a: any) => sum + (a.capitalGainAmount || 0), 0))}
                              </TableCell>
                            )}
                          </TableRow>
                        </>
                      )}

                      {/* Other allocations (non-hierarchical) */}
                      {otherAllocations.map((allocation: any) => (
                        <TableRow key={allocation.investorId}>
                          <TableCell className="font-medium">
                            {allocation.investorName}
                            {allocation.hierarchyLevel && (
                              <span className="block text-xs text-muted-foreground mt-1">
                                Level {allocation.hierarchyLevel}: {allocation.structureName}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{allocation.investorType}</Badge>
                          </TableCell>
                          <TableCell>{allocation.ownershipPercent.toFixed(2)}%</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(allocation.baseAllocation)}
                          </TableCell>
                          {formData.isReturnOfCapital && (
                            <TableCell>{formatCurrency(allocation.returnOfCapitalAmount || 0)}</TableCell>
                          )}
                          {formData.isIncome && (
                            <TableCell>{formatCurrency(allocation.incomeAmount || 0)}</TableCell>
                          )}
                          {formData.isCapitalGain && (
                            <TableCell>{formatCurrency(allocation.capitalGainAmount || 0)}</TableCell>
                          )}
                        </TableRow>
                      ))}
                    </>
                  )
                })()}
              </TableBody>
            </Table>

            <div className="flex justify-between gap-3">
              <Button onClick={() => setStep(2)} variant="outline">
                Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next: Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Process */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Distribution</CardTitle>
            <CardDescription>Review all details before saving or processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Fund Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Fund:</span>
                    <p className="font-medium">{formData.fundName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Distribution Number:</span>
                    <p className="font-medium">#{formData.distributionNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <p className="font-medium text-lg text-green-600">
                      {formatCurrency(formData.totalDistributionAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Dates</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Distribution Date:</span>
                    <p className="font-medium">{new Date(formData.distributionDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Record Date:</span>
                    <p className="font-medium">{new Date(formData.recordDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Date:</span>
                    <p className="font-medium">{new Date(formData.paymentDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Source</h3>
              <div className="flex items-center gap-2">
                <Badge>{formData.source}</Badge>
                {formData.relatedInvestmentName && (
                  <span className="text-sm">Related to: {formData.relatedInvestmentName}</span>
                )}
              </div>
              {formData.sourceDescription && (
                <p className="text-sm bg-muted p-3 rounded mt-2">{formData.sourceDescription}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Classification</h3>
              <div className="grid grid-cols-3 gap-4">
                {formData.isReturnOfCapital && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">Return of Capital</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(formData.returnOfCapitalAmount)}</p>
                  </div>
                )}
                {formData.isIncome && (
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">Income</p>
                    <p className="font-semibold text-green-600">{formatCurrency(formData.incomeAmount)}</p>
                  </div>
                )}
                {formData.isCapitalGain && (
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">Capital Gain</p>
                    <p className="font-semibold text-purple-600">{formatCurrency(formData.capitalGainAmount)}</p>
                  </div>
                )}
              </div>
            </div>

            {formData.waterfallApplied && (
              <Alert>
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Waterfall structure will be applied to this distribution
                </AlertDescription>
              </Alert>
            )}

            {/* Enhanced Investor Allocations Summary */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Investor Allocations ({investorAllocations.length})</h3>

              {(() => {
                const level2Allocations = investorAllocations.filter((a: any) => a.hierarchyLevel === 2)
                const level1Allocations = investorAllocations.filter((a: any) => a.hierarchyLevel === 1)
                const level2Total = level2Allocations.reduce((sum, a) => sum + a.baseAllocation, 0)
                const level1Total = level1Allocations.reduce((sum, a) => sum + a.baseAllocation, 0)

                return (
                  <div className="space-y-4">
                    {/* Level 2 Summary */}
                    {level2Allocations.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-blue-900">
                            Level 2: Investment Trust (Paid First)
                          </h4>
                          <span className="text-lg font-bold text-blue-900">
                            {formatCurrency(level2Total)}
                          </span>
                        </div>
                        <div className="text-xs text-blue-700 mb-2">
                          Distribution Method: Simple pro-rata
                        </div>
                        <div className="space-y-1 text-sm">
                          {level2Allocations.map((allocation: any) => (
                            <div key={allocation.investorId} className="flex justify-between items-center">
                              <span className="text-blue-900">
                                • {allocation.investorName} ({allocation.ownershipPercent.toFixed(2)}%)
                              </span>
                              <span className="font-medium text-blue-900">
                                {formatCurrency(allocation.baseAllocation)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Level 1 Summary */}
                    {level1Allocations.length > 0 && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-purple-900">
                            Level 1: Master Trust (Remainder)
                          </h4>
                          <span className="text-lg font-bold text-purple-900">
                            {formatCurrency(level1Total)}
                          </span>
                        </div>

                        {/* Waterfall Breakdown */}
                        {level1WaterfallSummary && (
                          <div className="bg-white p-3 rounded mb-3 border border-purple-100">
                            <div className="text-xs font-semibold text-purple-900 mb-2">
                              Waterfall Distribution Applied:
                            </div>
                            <div className="space-y-1 text-xs">
                              {level1WaterfallSummary.tiers.map((tier: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <span className={tier.amount > 0 ? 'text-green-700 font-medium' : 'text-gray-400'}>
                                    {idx + 1}. {tier.name}
                                    {tier.amount > 0 ? ' ✓' : ' (not reached)'}
                                  </span>
                                  <span className={tier.amount > 0 ? 'text-green-700 font-semibold' : 'text-gray-400'}>
                                    {formatCurrency(tier.amount)}
                                  </span>
                                </div>
                              ))}
                              {level1WaterfallSummary.gpCarry > 0 && (
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-100">
                                  <span className="text-purple-700 font-medium">
                                    GP Carried Interest (20%):
                                  </span>
                                  <span className="text-purple-700 font-semibold">
                                    {formatCurrency(level1WaterfallSummary.gpCarry)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Level 1 Investor Breakdown */}
                        <div className="space-y-1 text-sm">
                          {level1Allocations.map((allocation: any) => (
                            <div key={allocation.investorId} className="flex justify-between items-center">
                              <span className="text-purple-900">
                                • {allocation.investorName}
                              </span>
                              <span className="font-medium text-purple-900">
                                {formatCurrency(allocation.baseAllocation)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grand Total */}
                    <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-900">Total Distribution</h4>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(level2Total + level1Total)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="flex justify-between gap-3 pt-6 border-t">
              <Button onClick={() => setStep(3)} variant="outline">
                Back
              </Button>
              <div className="flex gap-3">
                <Button onClick={() => handleSave(false)} variant="outline">
                  <IconDeviceFloppy className="w-4 h-4 mr-2" />
                  Save as Pending
                </Button>
                <Button onClick={() => handleSave(true)}>
                  <IconSend className="w-4 h-4 mr-2" />
                  Process Distribution
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
