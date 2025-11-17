'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { IconArrowLeft, IconDeviceFloppy, IconSend, IconAlertCircle, IconCurrencyDollar, IconCalendar, IconUsers, IconFileText, IconCircleCheck } from '@tabler/icons-react'
import { getStructures, type Structure } from '@/lib/structures-storage'
import { getInvestorsByFundId, getInvestorsByHierarchy } from '@/lib/investors-storage'
import { getInvestments } from '@/lib/investments-storage'
import { saveCapitalCall, getNextCallNumber } from '@/lib/capital-calls-storage'
import type { CapitalCallAllocation } from '@/lib/types'

export default function CreateCapitalCallPage() {
  const router = useRouter()
  const [structures, setStructures] = useState<Structure[]>([])
  const [selectedFund, setSelectedFund] = useState<Structure | null>(null)
  const [investors, setInvestors] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    fundId: '',
    fundName: '',
    callNumber: 1,
    totalCallAmount: 0,
    currency: 'USD',
    callDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    noticePeriodDays: 10,
    purpose: '',
    relatedInvestmentId: '',
    relatedInvestmentName: '',
    transactionType: 'Capital Call',
    useOfProceeds: '',
    managementFeeIncluded: false,
    managementFeeAmount: 0,
  })

  const [investorAllocations, setInvestorAllocations] = useState<CapitalCallAllocation[]>([])

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
          callNumber: getNextCallNumber(fund.id),
          dueDate: calculateDueDate(prev.callDate, prev.noticePeriodDays)
        }))
      }
    }
  }, [formData.fundId, structures])

  // Memoize allocation calculation to avoid React warnings about dependency array
  const calculatedAllocations = useMemo(() => {
    if (formData.totalCallAmount <= 0 || investors.length === 0 || !selectedFund) {
      return []
    }

    // Check if this is a hierarchical master structure
    const isHierarchyMaster = selectedFund.hierarchyLevel === 1

    if (isHierarchyMaster) {
      // HIERARCHICAL STRUCTURE: Calculate based on global ownership
      // Separate Level 1 and Level 2 investors
      const level1Investors = investors.filter(inv => inv.hierarchyLevel === 1)
      const level2Investors = investors.filter(inv => inv.hierarchyLevel === 2)

      // Get Level 2 structure (Investment Trust) ownership of Master
      const level2StructureId = level2Investors[0]?._hierarchyOwnership?.structureId
      const level2Structure = level2StructureId ? structures.find(s => s.id === level2StructureId) : null
      // For multi-level structures, calculate the ownership from level 2 investors' commitment
      const level2TotalOwnership = level2Investors.reduce((sum, inv) =>
        sum + (inv._hierarchyOwnership?.ownershipPercent || 0), 0)
      const level2OwnershipOfMaster = level2TotalOwnership > 0 ? level2TotalOwnership : 0

      // Calculate total capital call amount for each level
      const level2TotalCall = formData.totalCallAmount * (level2OwnershipOfMaster / 100)
      const level1TotalCall = formData.totalCallAmount - level2TotalCall

      const allocations: CapitalCallAllocation[] = []

      // Level 2 allocations (proportional within Level 2)
      if (level2Investors.length > 0 && level2TotalCall > 0) {
        const level2TotalCommitment = level2Investors.reduce((sum, inv) =>
          sum + (inv._hierarchyOwnership?.commitment || 0), 0)

        level2Investors.forEach(investor => {
          const hierarchyOwnership = investor._hierarchyOwnership as any
          const ownershipPercent = hierarchyOwnership?.ownershipPercent || 0
          const commitment = hierarchyOwnership?.commitment || 0

          // Pro-rata within Level 2 based on commitment
          const commitmentFraction = level2TotalCommitment > 0 ? commitment / level2TotalCommitment : 0
          const callAmount = level2TotalCall * commitmentFraction

          const ownership = investor.fundOwnerships?.find((fo: any) => fo.fundId === hierarchyOwnership?.structureId)
          const calledToDate = ownership?.calledCapital || 0
          const uncalledCapital = commitment - calledToDate

          allocations.push({
            investorId: investor.id,
            investorName: investor.name,
            investorType: investor.type,
            commitment,
            ownershipPercent,
            callAmount,
            status: 'Pending' as const,
            amountPaid: 0,
            amountOutstanding: callAmount,
            noticeSent: false,
            calledCapitalToDate: calledToDate,
            uncalledCapital: uncalledCapital - callAmount,
            hierarchyLevel: investor.hierarchyLevel,
            structureName: investor.structureName,
          } as any)
        })
      }

      // Level 1 allocations (proportional within Level 1)
      if (level1Investors.length > 0 && level1TotalCall > 0) {
        const level1TotalCommitment = level1Investors.reduce((sum, inv) =>
          sum + (inv._hierarchyOwnership?.commitment || 0), 0)

        level1Investors.forEach(investor => {
          const hierarchyOwnership = investor._hierarchyOwnership as any
          const ownershipPercent = hierarchyOwnership?.ownershipPercent || 0
          const commitment = hierarchyOwnership?.commitment || 0

          // Pro-rata within Level 1 based on commitment
          const commitmentFraction = level1TotalCommitment > 0 ? commitment / level1TotalCommitment : 0
          const callAmount = level1TotalCall * commitmentFraction

          const ownership = investor.fundOwnerships?.find((fo: any) => fo.fundId === hierarchyOwnership?.structureId)
          const calledToDate = ownership?.calledCapital || 0
          const uncalledCapital = commitment - calledToDate

          allocations.push({
            investorId: investor.id,
            investorName: investor.name,
            investorType: investor.type,
            commitment,
            ownershipPercent,
            callAmount,
            status: 'Pending' as const,
            amountPaid: 0,
            amountOutstanding: callAmount,
            noticeSent: false,
            calledCapitalToDate: calledToDate,
            uncalledCapital: uncalledCapital - callAmount,
            hierarchyLevel: investor.hierarchyLevel,
            structureName: investor.structureName,
          } as any)
        })
      }

      return allocations
    } else {
      // SINGLE-LEVEL STRUCTURE: Calculate based on commitment
      // Get total commitments from all investors
      const totalCommitments = investors.reduce((sum, inv) => {
        const ownership = inv.fundOwnerships?.find((fo: any) => fo.fundId === formData.fundId)
        return sum + (ownership?.commitment || 0)
      }, 0)

      return investors.map(investor => {
        const ownership = investor.fundOwnerships?.find((fo: any) => fo.fundId === formData.fundId)
        const ownershipPercent = ownership?.ownershipPercent || 0
        const commitment = ownership?.commitment || 0

        // Pro-rata based on commitment
        const callAmount = totalCommitments > 0
          ? formData.totalCallAmount * (commitment / totalCommitments)
          : 0

        const calledToDate = ownership?.calledCapital || 0
        const uncalledCapital = commitment - calledToDate

        return {
          investorId: investor.id,
          investorName: investor.name,
          investorType: investor.type,
          commitment,
          ownershipPercent,
          callAmount,
          status: 'Pending' as const,
          amountPaid: 0,
          amountOutstanding: callAmount,
          noticeSent: false,
          calledCapitalToDate: calledToDate,
          uncalledCapital: uncalledCapital - callAmount,
        }
      })
    }
  }, [formData.totalCallAmount, formData.fundId, selectedFund, investors, structures])

  // Update state when calculated allocations change
  useEffect(() => {
    setInvestorAllocations(calculatedAllocations)
  }, [calculatedAllocations])

  const calculateDueDate = (callDate: string, noticePeriod: number): string => {
    const date = new Date(callDate)
    date.setDate(date.getDate() + noticePeriod)
    return date.toISOString().split('T')[0]
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      if (field === 'callDate' || field === 'noticePeriodDays') {
        updated.dueDate = calculateDueDate(
          field === 'callDate' ? value : prev.callDate,
          field === 'noticePeriodDays' ? value : prev.noticePeriodDays
        )
      }

      if (field === 'relatedInvestmentId' && value) {
        const investment = investments.find(inv => inv.id === value)
        if (investment) {
          updated.relatedInvestmentName = investment.name
        }
      }

      return updated
    })
  }

  const handleSave = (sendNow: boolean = false) => {
    if (!formData.fundId || formData.totalCallAmount === 0) {
      toast.error('Please select a fund and enter a call amount')
      return
    }

    const capitalCall = {
      fundId: formData.fundId,
      fundName: formData.fundName,
      callNumber: formData.callNumber,
      totalCallAmount: formData.totalCallAmount,
      currency: formData.currency,
      callDate: formData.callDate,
      dueDate: formData.dueDate,
      noticePeriodDays: formData.noticePeriodDays,
      purpose: formData.purpose,
      relatedInvestmentId: formData.relatedInvestmentId || undefined,
      relatedInvestmentName: formData.relatedInvestmentName || undefined,
      status: sendNow ? ('Sent' as const) : ('Draft' as const),
      sentDate: sendNow ? new Date().toISOString() : undefined,
      investorAllocations,
      totalPaidAmount: 0,
      totalOutstandingAmount: formData.totalCallAmount,
      transactionType: formData.transactionType,
      useOfProceeds: formData.useOfProceeds,
      managementFeeIncluded: formData.managementFeeIncluded,
      managementFeeAmount: formData.managementFeeIncluded ? formData.managementFeeAmount : undefined,
      createdBy: 'Gabriela Mena',
    }

    const saved = saveCapitalCall(capitalCall)

    if (sendNow) {
      toast.success(`Capital Call #${saved.callNumber} has been sent to all investors!`, {
        description: `${investorAllocations.length} investors will be notified`,
        duration: 5000,
      })
    } else {
      toast.success(`Capital Call #${saved.callNumber} has been saved as draft`, {
        description: 'You can send it to investors later',
        duration: 4000,
      })
    }

    router.push('/investment-manager/operations/capital-calls')
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
          <h1 className="text-3xl font-bold">Create Capital Call</h1>
          <p className="text-muted-foreground mt-1">
            Request capital from limited partners
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Fund & Amount', icon: IconCurrencyDollar },
          { num: 2, label: 'Details & Purpose', icon: IconFileText },
          { num: 3, label: 'Investor Allocations', icon: IconUsers },
          { num: 4, label: 'Review & Send', icon: IconCircleCheck },
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
            {idx < 3 && (
              <div className={`h-1 flex-1 mx-4 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Fund & Amount */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Fund and Call Amount</CardTitle>
            <CardDescription>Choose which fund to call capital from</CardDescription>
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
                <Label htmlFor="callNumber">Call Number</Label>
                <Input
                  id="callNumber"
                  type="number"
                  value={formData.callNumber}
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
                  <strong>{selectedFund.name}</strong> has {investors.length} investors with total commitment of{' '}
                  {formatCurrency(selectedFund.totalCommitment)}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalCallAmount">Total Call Amount *</Label>
                <Input
                  id="totalCallAmount"
                  type="number"
                  value={formData.totalCallAmount || ''}
                  onChange={(e) => updateFormData('totalCallAmount', parseFloat(e.target.value) || 0)}
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
                disabled={!formData.fundId || formData.totalCallAmount === 0}
              >
                Next: Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Details & Purpose */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Capital Call Details</CardTitle>
            <CardDescription>Specify dates, purpose, and related investment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="callDate">Call Date *</Label>
                <Input
                  id="callDate"
                  type="date"
                  value={formData.callDate}
                  onChange={(e) => updateFormData('callDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="noticePeriod">Notice Period (days)</Label>
                <Input
                  id="noticePeriod"
                  type="number"
                  value={formData.noticePeriodDays}
                  onChange={(e) => updateFormData('noticePeriodDays', parseInt(e.target.value) || 10)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => updateFormData('dueDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose / Reason for Capital Call *</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => updateFormData('purpose', e.target.value)}
                placeholder="e.g., Investment in ABC Property, Management fees Q1 2024, Working capital"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="useOfProceeds">Use of Proceeds (ILPA Template Field)</Label>
              <Select value={formData.useOfProceeds} onValueChange={(value) => updateFormData('useOfProceeds', value)}>
                <SelectTrigger id="useOfProceeds">
                  <SelectValue placeholder="Select use of proceeds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Investment">Investment</SelectItem>
                  <SelectItem value="Management Fees">Management Fees</SelectItem>
                  <SelectItem value="Fund Expenses">Fund Expenses</SelectItem>
                  <SelectItem value="Working Capital">Working Capital</SelectItem>
                  <SelectItem value="Bridge Financing">Bridge Financing</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Checkbox
                id="managementFee"
                checked={formData.managementFeeIncluded}
                onCheckedChange={(checked) => updateFormData('managementFeeIncluded', checked)}
              />
              <div className="flex-1">
                <Label htmlFor="managementFee" className="font-medium cursor-pointer">
                  Include Management Fee
                </Label>
                <p className="text-sm text-muted-foreground">
                  Check if part of this capital call is for management fees
                </p>
                {formData.managementFeeIncluded && (
                  <div className="mt-3">
                    <Label htmlFor="managementFeeAmount">Management Fee Amount</Label>
                    <Input
                      id="managementFeeAmount"
                      type="number"
                      value={formData.managementFeeAmount || ''}
                      onChange={(e) => updateFormData('managementFeeAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button onClick={() => setStep(1)} variant="outline">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.purpose || !formData.useOfProceeds}
              >
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
              Review how the capital call will be allocated to each investor based on ownership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedFund?.hierarchyLevel === 1 ? (
              <>
                <Alert>
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Two-Stage Capital Call:</strong>
                    <div className="mt-2 space-y-1">
                      <div className="font-medium text-blue-900">
                        • Level 2 (Investment Trust): Called first based on ownership of Master
                      </div>
                      <div className="font-medium text-purple-900">
                        • Level 1 (Master Trust): Receives remainder of capital call
                      </div>
                    </div>
                    <div className="mt-2 font-semibold">
                      Total Capital Call: {formatCurrency(formData.totalCallAmount)}
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Level 2 Investors */}
                {investorAllocations.filter(a => a.hierarchyLevel === 2).length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-blue-900 text-lg">
                        Level 2: Investment Trust (Called First)
                      </h4>
                      <span className="text-lg font-bold text-blue-900">
                        {formatCurrency(investorAllocations.filter(a => a.hierarchyLevel === 2).reduce((sum, a) => sum + a.callAmount, 0))}
                      </span>
                    </div>
                    <div className="text-xs text-blue-700 mb-3">
                      Pro-rata allocation within Level 2
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-blue-100">
                          <TableHead>Investor</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Commitment</TableHead>
                          <TableHead>Call Amount</TableHead>
                          <TableHead>Called to Date</TableHead>
                          <TableHead>Uncalled</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {investorAllocations.filter(a => a.hierarchyLevel === 2).map((allocation) => (
                          <TableRow key={allocation.investorId} className="bg-white">
                            <TableCell className="font-medium">{allocation.investorName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{allocation.investorType}</Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(allocation.commitment)}</TableCell>
                            <TableCell className="font-semibold text-blue-600">
                              {formatCurrency(allocation.callAmount)}
                            </TableCell>
                            <TableCell>{formatCurrency(allocation.calledCapitalToDate)}</TableCell>
                            <TableCell>{formatCurrency(allocation.uncalledCapital)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Level 1 Investors */}
                {investorAllocations.filter(a => a.hierarchyLevel === 1).length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-purple-900 text-lg">
                        Level 1: Master Trust (Remainder)
                      </h4>
                      <span className="text-lg font-bold text-purple-900">
                        {formatCurrency(investorAllocations.filter(a => a.hierarchyLevel === 1).reduce((sum, a) => sum + a.callAmount, 0))}
                      </span>
                    </div>
                    <div className="text-xs text-purple-700 mb-3">
                      Pro-rata allocation within Level 1
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-purple-100">
                          <TableHead>Investor</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Commitment</TableHead>
                          <TableHead>Call Amount</TableHead>
                          <TableHead>Called to Date</TableHead>
                          <TableHead>Uncalled</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {investorAllocations.filter(a => a.hierarchyLevel === 1).map((allocation) => (
                          <TableRow key={allocation.investorId} className="bg-white">
                            <TableCell className="font-medium">{allocation.investorName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{allocation.investorType}</Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(allocation.commitment)}</TableCell>
                            <TableCell className="font-semibold text-purple-600">
                              {formatCurrency(allocation.callAmount)}
                            </TableCell>
                            <TableCell>{formatCurrency(allocation.calledCapitalToDate)}</TableCell>
                            <TableCell>{formatCurrency(allocation.uncalledCapital)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            ) : (
              <>
                <Alert>
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Allocations are automatically calculated based on each investor's commitment in the fund.
                    Total: {formatCurrency(formData.totalCallAmount)}
                  </AlertDescription>
                </Alert>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Commitment</TableHead>
                      <TableHead>Call Amount</TableHead>
                      <TableHead>Called to Date</TableHead>
                      <TableHead>Uncalled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investorAllocations.map((allocation) => (
                      <TableRow key={allocation.investorId}>
                        <TableCell className="font-medium">{allocation.investorName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{allocation.investorType}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(allocation.commitment)}</TableCell>
                        <TableCell className="font-semibold text-blue-600">
                          {formatCurrency(allocation.callAmount)}
                        </TableCell>
                        <TableCell>{formatCurrency(allocation.calledCapitalToDate)}</TableCell>
                        <TableCell>{formatCurrency(allocation.uncalledCapital)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

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

      {/* Step 4: Review & Send */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Capital Call</CardTitle>
            <CardDescription>Review all details before saving or sending</CardDescription>
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
                    <span className="text-muted-foreground">Call Number:</span>
                    <p className="font-medium">#{formData.callNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <p className="font-medium text-lg text-blue-600">
                      {formatCurrency(formData.totalCallAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Dates</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Call Date:</span>
                    <p className="font-medium">{new Date(formData.callDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    <p className="font-medium">{new Date(formData.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Notice Period:</span>
                    <p className="font-medium">{formData.noticePeriodDays} days</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Purpose</h3>
              <p className="text-sm bg-muted p-3 rounded">{formData.purpose}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Use of Proceeds</h3>
                <Badge>{formData.useOfProceeds}</Badge>
              </div>
              {formData.relatedInvestmentName && (
                <div>
                  <h3 className="font-semibold mb-2">Related Investment</h3>
                  <p className="text-sm">{formData.relatedInvestmentName}</p>
                </div>
              )}
            </div>

            {formData.managementFeeIncluded && (
              <Alert>
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Management fee of {formatCurrency(formData.managementFeeAmount)} is included in this capital call
                </AlertDescription>
              </Alert>
            )}

            {/* Investor Allocations Summary */}
            <div>
              <h3 className="font-semibold mb-3">Investor Allocations Summary</h3>

              {selectedFund?.hierarchyLevel === 1 ? (
                <div className="space-y-4">
                  {/* Two-Stage Summary Alert */}
                  <Alert>
                    <IconAlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Two-Stage Capital Call Process:</strong>
                      <div className="mt-2 text-sm">
                        Capital is called from investors across two hierarchy levels, with Level 2 called first, then Level 1 receives the remainder.
                      </div>
                    </AlertDescription>
                  </Alert>

                  {/* Level 2 Summary */}
                  {investorAllocations.filter(a => a.hierarchyLevel === 2).length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-blue-900">
                          Level 2: Investment Trust (Called First)
                        </h4>
                        <span className="text-lg font-bold text-blue-900">
                          {formatCurrency(investorAllocations.filter(a => a.hierarchyLevel === 2).reduce((sum, a) => sum + a.callAmount, 0))}
                        </span>
                      </div>
                      <div className="text-xs text-blue-700 mb-3">
                        Capital Call Method: Pro-rata allocation within Level 2
                      </div>
                      <div className="space-y-2">
                        {investorAllocations.filter(a => a.hierarchyLevel === 2).map((allocation) => (
                          <div key={allocation.investorId} className="flex justify-between items-center bg-white p-2 rounded text-sm">
                            <div>
                              <span className="font-medium">{allocation.investorName}</span>
                              <span className="text-muted-foreground ml-2">
                                ({allocation.ownershipPercent.toFixed(2)}%)
                              </span>
                            </div>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(allocation.callAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Level 1 Summary */}
                  {investorAllocations.filter(a => a.hierarchyLevel === 1).length > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-purple-900">
                          Level 1: Master Trust (Remainder)
                        </h4>
                        <span className="text-lg font-bold text-purple-900">
                          {formatCurrency(investorAllocations.filter(a => a.hierarchyLevel === 1).reduce((sum, a) => sum + a.callAmount, 0))}
                        </span>
                      </div>
                      <div className="text-xs text-purple-700 mb-3">
                        Capital Call Method: Pro-rata allocation within Level 1
                      </div>
                      <div className="space-y-2">
                        {investorAllocations.filter(a => a.hierarchyLevel === 1).map((allocation) => (
                          <div key={allocation.investorId} className="flex justify-between items-center bg-white p-2 rounded text-sm">
                            <div>
                              <span className="font-medium">{allocation.investorName}</span>
                              <span className="text-muted-foreground ml-2">
                                ({allocation.ownershipPercent.toFixed(2)}%)
                              </span>
                            </div>
                            <span className="font-semibold text-purple-600">
                              {formatCurrency(allocation.callAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total Summary */}
                  <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total Capital Call</span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(investorAllocations.reduce((sum, a) => sum + a.callAmount, 0))}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {investorAllocations.length} investors across 2 hierarchy levels
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    Total allocated: {formatCurrency(investorAllocations.reduce((sum, a) => sum + a.callAmount, 0))}
                  </div>
                  <div className="space-y-2">
                    {investorAllocations.map((allocation) => (
                      <div key={allocation.investorId} className="flex justify-between items-center bg-muted p-3 rounded text-sm">
                        <div>
                          <span className="font-medium">{allocation.investorName}</span>
                          <span className="text-muted-foreground ml-2">
                            ({allocation.ownershipPercent.toFixed(2)}%)
                          </span>
                        </div>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(allocation.callAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 pt-6 border-t">
              <Button onClick={() => setStep(3)} variant="outline">
                Back
              </Button>
              <div className="flex gap-3">
                <Button onClick={() => handleSave(false)} variant="outline">
                  <IconDeviceFloppy className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
                <Button onClick={() => handleSave(true)}>
                  <IconSend className="w-4 h-4 mr-2" />
                  Send to Investors
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
