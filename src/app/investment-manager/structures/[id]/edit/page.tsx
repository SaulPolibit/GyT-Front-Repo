"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Info, CheckCircle2, AlertCircle } from 'lucide-react'
import { getStructureById, updateStructure } from '@/lib/structures-storage'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditStructurePage({ params }: PageProps) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as 'active' | 'fundraising' | 'closed',
    totalCommitment: 0,
    investors: 0,
    managementFee: '',
    performanceFee: '',
    hurdleRate: '',
    preferredReturn: '',
    waterfallStructure: '',
    distributionFrequency: '',
    // Hierarchy fields
    hierarchyMode: false,
    hierarchySetupApproach: 'all-at-once' as 'all-at-once' | 'incremental',
    hierarchyLevels: 2,
    hierarchyStructures: [] as {
      level: number
      name: string
      type: string
      applyWaterfall: boolean
      waterfallAlgorithm: 'american' | 'european' | null
      applyEconomicTerms: boolean
    }[],
    // Legal Terms - Comprehensive structure
    legalTerms: {
      // Partnership Agreement
      managementControl: '',
      capitalContributions: '',
      allocationsDistributions: '',
      // Rights & Obligations
      limitedPartnerRights: [] as string[],
      limitedPartnerObligations: [] as string[],
      // Voting Rights
      votingThreshold: 66.67,
      mattersRequiringConsent: [] as string[],
      // Redemption Terms
      lockUpPeriod: '',
      withdrawalConditions: [] as string[],
      withdrawalProcess: [] as string[],
      // Transfer Restrictions
      transferProhibition: '',
      permittedTransfers: [] as string[],
      transferRequirements: [] as string[],
      // Reporting
      quarterlyReports: '',
      annualReports: '',
      taxForms: '',
      capitalNotices: '',
      additionalCommunications: [] as string[],
      // Liability
      liabilityProtection: '',
      liabilityExceptions: [] as string[],
      maximumExposure: '',
      // Indemnification
      partnershipIndemnifiesLP: [] as string[],
      lpIndemnifiesPartnership: [] as string[],
      indemnificationProcedures: '',
      // Additional Provisions
      amendments: '',
      dissolution: '',
      disputes: '',
      governingLaw: '',
      additionalProvisions: ''
    }
  })

  // Helper functions for array field management
  const arrayToText = (arr: string[]): string => arr.join('\n')
  const textToArray = (text: string): string[] => text.split('\n').map(s => s.trim()).filter(s => s.length > 0)

  const updateLegalTermsArray = (field: string, value: string) => {
    const array = textToArray(value)
    setFormData({
      ...formData,
      legalTerms: { ...formData.legalTerms, [field]: array }
    })
  }

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!id) return

    const structure = getStructureById(id)
    if (!structure) {
      setError('Structure not found')
      setLoading(false)
      return
    }

    // Initialize form with existing structure data
    setFormData({
      name: structure.name,
      status: structure.status,
      totalCommitment: structure.totalCommitment,
      investors: structure.investors,
      managementFee: structure.managementFee || '',
      performanceFee: structure.performanceFee || '',
      hurdleRate: structure.hurdleRate || '',
      preferredReturn: structure.preferredReturn || '',
      waterfallStructure: structure.waterfallStructure || '',
      distributionFrequency: structure.distributionFrequency || '',
      hierarchyMode: structure.hierarchyMode || false,
      hierarchySetupApproach: structure.hierarchySetupApproach || 'all-at-once',
      hierarchyLevels: structure.hierarchyLevels || 2,
      hierarchyStructures: structure.hierarchyStructures || [],
      legalTerms: {
        // Partnership Agreement
        managementControl: structure.legalTerms?.managementControl || '',
        capitalContributions: structure.legalTerms?.capitalContributions || '',
        allocationsDistributions: structure.legalTerms?.allocationsDistributions || '',
        // Rights & Obligations
        limitedPartnerRights: structure.legalTerms?.limitedPartnerRights || [],
        limitedPartnerObligations: structure.legalTerms?.limitedPartnerObligations || [],
        // Voting Rights
        votingThreshold: structure.legalTerms?.votingRights?.votingThreshold || 66.67,
        mattersRequiringConsent: structure.legalTerms?.votingRights?.mattersRequiringConsent || [],
        // Redemption Terms
        lockUpPeriod: structure.legalTerms?.redemptionTerms?.lockUpPeriod || '',
        withdrawalConditions: structure.legalTerms?.redemptionTerms?.withdrawalConditions || [],
        withdrawalProcess: structure.legalTerms?.redemptionTerms?.withdrawalProcess || [],
        // Transfer Restrictions
        transferProhibition: structure.legalTerms?.transferRestrictions?.generalProhibition || '',
        permittedTransfers: structure.legalTerms?.transferRestrictions?.permittedTransfers || [],
        transferRequirements: structure.legalTerms?.transferRestrictions?.transferRequirements || [],
        // Reporting
        quarterlyReports: structure.legalTerms?.reportingCommitments?.quarterlyReports || '',
        annualReports: structure.legalTerms?.reportingCommitments?.annualReports || '',
        taxForms: structure.legalTerms?.reportingCommitments?.taxForms || '',
        capitalNotices: structure.legalTerms?.reportingCommitments?.capitalNotices || '',
        additionalCommunications: structure.legalTerms?.reportingCommitments?.additionalCommunications || [],
        // Liability
        liabilityProtection: structure.legalTerms?.liabilityLimitations?.limitedLiabilityProtection || '',
        liabilityExceptions: structure.legalTerms?.liabilityLimitations?.exceptionsToLimitedLiability || [],
        maximumExposure: structure.legalTerms?.liabilityLimitations?.maximumExposureNote || '',
        // Indemnification
        partnershipIndemnifiesLP: structure.legalTerms?.indemnification?.partnershipIndemnifiesLPFor || [],
        lpIndemnifiesPartnership: structure.legalTerms?.indemnification?.lpIndemnifiesPartnershipFor || [],
        indemnificationProcedures: structure.legalTerms?.indemnification?.indemnificationProcedures || '',
        // Additional Provisions
        amendments: structure.legalTerms?.amendments || '',
        dissolution: structure.legalTerms?.dissolution || '',
        disputes: structure.legalTerms?.disputes || '',
        governingLaw: structure.legalTerms?.governingLaw || '',
        additionalProvisions: structure.legalTerms?.additionalProvisions || ''
      }
    })

    setLoading(false)
  }, [id])

  // Initialize hierarchy structures when levels change
  useEffect(() => {
    if (formData.hierarchyMode && formData.hierarchySetupApproach === 'all-at-once') {
      const currentLevels = formData.hierarchyStructures.length
      const targetLevels = formData.hierarchyLevels

      if (currentLevels !== targetLevels) {
        const structure = getStructureById(id)
        const newStructures = Array.from({ length: targetLevels }, (_, index) => {
          const existing = formData.hierarchyStructures[index]
          if (existing) return existing

          return {
            level: index + 1,
            name: index === 0
              ? `${structure?.name} - Master Level`
              : index === targetLevels - 1
              ? `${structure?.name} - Property Level`
              : `${structure?.name} - Level ${index + 1}`,
            type: structure?.type || 'fund',
            applyWaterfall: false,
            waterfallAlgorithm: null as 'american' | 'european' | null,
            applyEconomicTerms: false
          }
        })

        setFormData(prev => ({
          ...prev,
          hierarchyStructures: newStructures
        }))
      }
    }
  }, [formData.hierarchyMode, formData.hierarchySetupApproach, formData.hierarchyLevels, id])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const success = updateStructure(id, {
        name: formData.name,
        status: formData.status,
        totalCommitment: formData.totalCommitment,
        investors: formData.investors,
        managementFee: formData.managementFee,
        performanceFee: formData.performanceFee,
        hurdleRate: formData.hurdleRate,
        preferredReturn: formData.preferredReturn,
        waterfallStructure: formData.waterfallStructure,
        distributionFrequency: formData.distributionFrequency,
        hierarchyMode: formData.hierarchyMode,
        hierarchySetupApproach: formData.hierarchySetupApproach,
        hierarchyLevels: formData.hierarchyLevels,
        hierarchyStructures: formData.hierarchyStructures,
        legalTerms: {
          // Partnership Agreement
          managementControl: formData.legalTerms.managementControl,
          capitalContributions: formData.legalTerms.capitalContributions,
          allocationsDistributions: formData.legalTerms.allocationsDistributions,
          // Rights & Obligations
          limitedPartnerRights: formData.legalTerms.limitedPartnerRights,
          limitedPartnerObligations: formData.legalTerms.limitedPartnerObligations,
          // Voting Rights
          votingRights: {
            votingThreshold: formData.legalTerms.votingThreshold,
            mattersRequiringConsent: formData.legalTerms.mattersRequiringConsent
          },
          // Redemption Terms
          redemptionTerms: {
            lockUpPeriod: formData.legalTerms.lockUpPeriod,
            withdrawalConditions: formData.legalTerms.withdrawalConditions,
            withdrawalProcess: formData.legalTerms.withdrawalProcess
          },
          // Transfer Restrictions
          transferRestrictions: {
            generalProhibition: formData.legalTerms.transferProhibition,
            permittedTransfers: formData.legalTerms.permittedTransfers,
            transferRequirements: formData.legalTerms.transferRequirements
          },
          // Reporting Commitments
          reportingCommitments: {
            quarterlyReports: formData.legalTerms.quarterlyReports,
            annualReports: formData.legalTerms.annualReports,
            taxForms: formData.legalTerms.taxForms,
            capitalNotices: formData.legalTerms.capitalNotices,
            additionalCommunications: formData.legalTerms.additionalCommunications
          },
          // Liability Limitations
          liabilityLimitations: {
            limitedLiabilityProtection: formData.legalTerms.liabilityProtection,
            exceptionsToLimitedLiability: formData.legalTerms.liabilityExceptions,
            maximumExposureNote: formData.legalTerms.maximumExposure
          },
          // Indemnification
          indemnification: {
            partnershipIndemnifiesLPFor: formData.legalTerms.partnershipIndemnifiesLP,
            lpIndemnifiesPartnershipFor: formData.legalTerms.lpIndemnifiesPartnership,
            indemnificationProcedures: formData.legalTerms.indemnificationProcedures
          },
          // Additional Provisions
          amendments: formData.legalTerms.amendments,
          dissolution: formData.legalTerms.dissolution,
          disputes: formData.legalTerms.disputes,
          governingLaw: formData.legalTerms.governingLaw,
          additionalProvisions: formData.legalTerms.additionalProvisions
        }
      })

      if (success) {
        router.push(`/investment-manager/structures/${id}`)
      } else {
        setError('Failed to update structure')
      }
    } catch (err) {
      setError('An error occurred while saving')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <p>Loading...</p>
      </div>
    )
  }

  if (error && !formData.name) {
    return (
      <div className="flex-1 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/investment-manager/structures">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Structures
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/investment-manager/structures/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Structure</h1>
            <p className="text-muted-foreground">{formData.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/investment-manager/structures/${id}`}>Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update structure details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Structure Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fundraising">Fundraising</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalCommitment">Total Commitment *</Label>
              <Input
                id="totalCommitment"
                type="number"
                value={formData.totalCommitment}
                onChange={(e) => setFormData({ ...formData, totalCommitment: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investors">Number of Investors *</Label>
              <Input
                id="investors"
                type="number"
                value={formData.investors}
                onChange={(e) => setFormData({ ...formData, investors: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Economic Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Economic Terms</CardTitle>
          <CardDescription>Fee structure and performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="managementFee">Management Fee</Label>
              <Input
                id="managementFee"
                value={formData.managementFee}
                onChange={(e) => setFormData({ ...formData, managementFee: e.target.value })}
                placeholder="e.g., 2%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="performanceFee">Performance Fee</Label>
              <Input
                id="performanceFee"
                value={formData.performanceFee}
                onChange={(e) => setFormData({ ...formData, performanceFee: e.target.value })}
                placeholder="e.g., 20%"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hurdleRate">Hurdle Rate</Label>
              <Input
                id="hurdleRate"
                value={formData.hurdleRate}
                onChange={(e) => setFormData({ ...formData, hurdleRate: e.target.value })}
                placeholder="e.g., 8%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredReturn">Preferred Return</Label>
              <Input
                id="preferredReturn"
                value={formData.preferredReturn}
                onChange={(e) => setFormData({ ...formData, preferredReturn: e.target.value })}
                placeholder="e.g., 8%"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Model */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution Model</CardTitle>
          <CardDescription>Waterfall structure and distribution frequency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="waterfallStructure">Waterfall Structure</Label>
            <Select
              value={formData.waterfallStructure}
              onValueChange={(value) => setFormData({ ...formData, waterfallStructure: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select waterfall structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="american">American (Deal-by-Deal)</SelectItem>
                <SelectItem value="european">European (Whole Fund)</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="distributionFrequency">Distribution Frequency</Label>
            <Select
              value={formData.distributionFrequency}
              onValueChange={(value) => setFormData({ ...formData, distributionFrequency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select distribution frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="upon-exit">Upon Exit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Level Hierarchy Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Level Hierarchy</CardTitle>
          <CardDescription>Configure hierarchical structure with cascade distributions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="hierarchyMode"
              checked={formData.hierarchyMode}
              onCheckedChange={(checked) => setFormData({ ...formData, hierarchyMode: checked as boolean })}
            />
            <div className="flex-1">
              <Label htmlFor="hierarchyMode" className="cursor-pointer font-medium">
                Enable Multi-Level Hierarchy
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Create a hierarchical structure with multiple levels for complex fund arrangements
              </p>
            </div>
          </div>

          {formData.hierarchyMode && (
            <div className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="hierarchySetupApproach">Setup Approach *</Label>
                <RadioGroup
                  value={formData.hierarchySetupApproach}
                  onValueChange={(value: any) => setFormData({ ...formData, hierarchySetupApproach: value })}
                >
                  <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                    <RadioGroupItem value="all-at-once" id="all-at-once" />
                    <div className="flex-1">
                      <Label htmlFor="all-at-once" className="cursor-pointer font-medium">
                        Configure All Levels at Once
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Define all hierarchy levels and their relationships in one setup
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {formData.hierarchySetupApproach === 'all-at-once' && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="hierarchyLevels">Number of Hierarchy Levels *</Label>
                    <Select
                      value={formData.hierarchyLevels.toString()}
                      onValueChange={(value) => setFormData({ ...formData, hierarchyLevels: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} Levels
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.hierarchyStructures.length > 0 && (
                    <div className="space-y-3 pt-3 border-t">
                      <h4 className="text-sm font-semibold">Hierarchy Level Configuration</h4>
                      {formData.hierarchyStructures.map((structure, index) => (
                        <Card key={index} className="border-primary/20">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    Level {index + 1} of {formData.hierarchyLevels}
                                  </Badge>
                                  {structure.name}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {index === 0 && 'Top-level structure (receives distributions from children)'}
                                  {index === formData.hierarchyLevels - 1 && 'Property/Investment level (income entry point)'}
                                  {index > 0 && index < formData.hierarchyLevels - 1 && `Intermediate level`}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`level-${index}-name`} className="text-xs">
                                Level Name *
                              </Label>
                              <Input
                                id={`level-${index}-name`}
                                value={structure.name}
                                onChange={(e) => {
                                  const newStructures = [...formData.hierarchyStructures]
                                  newStructures[index] = { ...structure, name: e.target.value }
                                  setFormData({ ...formData, hierarchyStructures: newStructures })
                                }}
                                placeholder="e.g., Master Trust, Investor Trust, Project Trust"
                                className="h-8 text-xs"
                              />
                            </div>

                            {/* Waterfall Configuration */}
                            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <Checkbox
                                  id={`level-${index}-waterfall`}
                                  checked={structure.applyWaterfall}
                                  disabled={index === formData.hierarchyLevels - 1}
                                  onCheckedChange={(checked) => {
                                    const newStructures = [...formData.hierarchyStructures]
                                    newStructures[index] = {
                                      ...structure,
                                      applyWaterfall: checked as boolean,
                                      waterfallAlgorithm: checked ? 'american' : null
                                    }
                                    setFormData({ ...formData, hierarchyStructures: newStructures })
                                  }}
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`level-${index}-waterfall`}
                                    className={`cursor-pointer text-xs font-medium ${index === formData.hierarchyLevels - 1 ? 'text-muted-foreground' : ''}`}
                                  >
                                    Apply Waterfall at This Level
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {index === formData.hierarchyLevels - 1
                                      ? 'Waterfall not applicable at property level - income enters here'
                                      : 'Calculate distributions using waterfall algorithm before passing to next level'}
                                  </p>
                                </div>
                              </div>

                              {structure.applyWaterfall && (
                                <div className="pl-6 pt-2">
                                  <RadioGroup
                                    value={structure.waterfallAlgorithm || 'american'}
                                    onValueChange={(value: any) => {
                                      const newStructures = [...formData.hierarchyStructures]
                                      newStructures[index] = {
                                        ...structure,
                                        waterfallAlgorithm: value
                                      }
                                      setFormData({ ...formData, hierarchyStructures: newStructures })
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="american" id={`level-${index}-american`} />
                                      <Label htmlFor={`level-${index}-american`} className="cursor-pointer text-xs font-normal">
                                        American (deal-by-deal)
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="european" id={`level-${index}-european`} />
                                      <Label htmlFor={`level-${index}-european`} className="cursor-pointer text-xs font-normal">
                                        European (whole fund)
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                              )}
                            </div>

                            {/* Economic Terms Configuration */}
                            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <Checkbox
                                  id={`level-${index}-economic`}
                                  checked={structure.applyEconomicTerms}
                                  disabled={index === formData.hierarchyLevels - 1}
                                  onCheckedChange={(checked) => {
                                    const newStructures = [...formData.hierarchyStructures]
                                    newStructures[index] = { ...structure, applyEconomicTerms: checked as boolean }
                                    setFormData({ ...formData, hierarchyStructures: newStructures })
                                  }}
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`level-${index}-economic`}
                                    className={`cursor-pointer text-xs font-medium ${index === formData.hierarchyLevels - 1 ? 'text-muted-foreground' : ''}`}
                                  >
                                    Apply Economic Terms at This Level
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {index === formData.hierarchyLevels - 1
                                      ? 'Economic terms not applicable at property level - income enters here'
                                      : 'Calculate management fees, performance fees, and carry at this level'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legal & Terms Section - Comprehensive */}
      <Card id="legal-terms">
        <CardHeader>
          <CardTitle>Legal & Terms</CardTitle>
          <CardDescription>
            Define comprehensive partnership agreement terms and legal provisions displayed to investors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Partnership Agreement */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Partnership Agreement</h3>

            <div className="space-y-2">
              <Label htmlFor="managementControl">Management & Control</Label>
              <Textarea
                id="managementControl"
                placeholder="The General Partner has exclusive authority to manage and control the business and affairs of the Partnership..."
                value={formData.legalTerms.managementControl}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, managementControl: e.target.value } })}
                rows={3}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capitalContributions">Capital Contributions</Label>
              <Textarea
                id="capitalContributions"
                placeholder="Capital contributions shall be made within X business days of receiving a capital call notice..."
                value={formData.legalTerms.capitalContributions}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, capitalContributions: e.target.value } })}
                rows={3}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocationsDistributions">Allocations & Distributions</Label>
              <Textarea
                id="allocationsDistributions"
                placeholder="Profits and losses shall be allocated among the Partners in accordance with their respective Partnership Interests..."
                value={formData.legalTerms.allocationsDistributions}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, allocationsDistributions: e.target.value } })}
                rows={3}
                className="resize-y"
              />
            </div>
          </div>

          <Separator />

          {/* Rights & Obligations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rights & Obligations</h3>

            <div className="space-y-2">
              <Label htmlFor="limitedPartnerRights">Limited Partner Rights (one per line)</Label>
              <Textarea
                id="limitedPartnerRights"
                placeholder="Right to receive quarterly financial statements&#10;Right to receive K-1 tax forms&#10;Right to attend annual investor meetings"
                value={arrayToText(formData.legalTerms.limitedPartnerRights)}
                onChange={(e) => updateLegalTermsArray('limitedPartnerRights', e.target.value)}
                rows={7}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limitedPartnerObligations">Limited Partner Obligations (one per line)</Label>
              <Textarea
                id="limitedPartnerObligations"
                placeholder="Obligation to fund capital calls within X business days&#10;Obligation to maintain accredited investor status&#10;Obligation to provide updated tax information"
                value={arrayToText(formData.legalTerms.limitedPartnerObligations)}
                onChange={(e) => updateLegalTermsArray('limitedPartnerObligations', e.target.value)}
                rows={6}
                className="resize-y"
              />
            </div>
          </div>

          <Separator />

          {/* Voting Rights */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Voting Rights</h3>

            <div className="space-y-2">
              <Label htmlFor="votingThreshold">Voting Threshold (%)</Label>
              <Input
                id="votingThreshold"
                type="number"
                step="0.01"
                value={formData.legalTerms.votingThreshold}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, votingThreshold: parseFloat(e.target.value) || 66.67 } })}
              />
              <p className="text-xs text-muted-foreground">Percentage of Partnership Interests required for consent</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mattersRequiringConsent">Matters Requiring Consent (one per line)</Label>
              <Textarea
                id="mattersRequiringConsent"
                placeholder="Amendment of the Partnership Agreement&#10;Removal of the General Partner for cause&#10;Extension of the fund term"
                value={arrayToText(formData.legalTerms.mattersRequiringConsent)}
                onChange={(e) => updateLegalTermsArray('mattersRequiringConsent', e.target.value)}
                rows={7}
                className="resize-y"
              />
            </div>
          </div>

          <Separator />

          {/* Redemption & Withdrawal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Redemption & Withdrawal Terms</h3>

            <div className="space-y-2">
              <Label htmlFor="lockUpPeriod">Lock-Up Period</Label>
              <Textarea
                id="lockUpPeriod"
                placeholder="Your capital commitment is subject to a lock-up period through the earlier of (i) the end of the investment period or (ii) X years from the fund inception date..."
                value={formData.legalTerms.lockUpPeriod}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, lockUpPeriod: e.target.value } })}
                rows={3}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawalConditions">Withdrawal Conditions (one per line)</Label>
              <Textarea
                id="withdrawalConditions"
                placeholder="Death or disability of individual investor&#10;Bankruptcy or insolvency of investor&#10;Regulatory requirement mandating disposition"
                value={arrayToText(formData.legalTerms.withdrawalConditions)}
                onChange={(e) => updateLegalTermsArray('withdrawalConditions', e.target.value)}
                rows={4}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawalProcess">Withdrawal Process (one per line)</Label>
              <Textarea
                id="withdrawalProcess"
                placeholder="Written notice to GP at least 90 days in advance&#10;Subject to GP approval&#10;Payment within 180 days of approval"
                value={arrayToText(formData.legalTerms.withdrawalProcess)}
                onChange={(e) => updateLegalTermsArray('withdrawalProcess', e.target.value)}
                rows={4}
                className="resize-y"
              />
            </div>
          </div>

          <Separator />

          {/* Transfer Restrictions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transfer Restrictions</h3>

            <div className="space-y-2">
              <Label htmlFor="transferProhibition">General Prohibition</Label>
              <Textarea
                id="transferProhibition"
                placeholder="Partnership Interests may not be sold, assigned, transferred, pledged, or otherwise disposed of without the prior written consent of the General Partner..."
                value={formData.legalTerms.transferProhibition}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, transferProhibition: e.target.value } })}
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permittedTransfers">Permitted Transfers (one per line)</Label>
              <Textarea
                id="permittedTransfers"
                placeholder="Transfers to immediate family members or family trusts&#10;Transfers to wholly-owned affiliates&#10;Transfers required by law or court order"
                value={arrayToText(formData.legalTerms.permittedTransfers)}
                onChange={(e) => updateLegalTermsArray('permittedTransfers', e.target.value)}
                rows={4}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferRequirements">Transfer Requirements (one per line)</Label>
              <Textarea
                id="transferRequirements"
                placeholder="Transferee must be an accredited investor&#10;Transferee must execute subscription documents&#10;Transfer must comply with securities laws"
                value={arrayToText(formData.legalTerms.transferRequirements)}
                onChange={(e) => updateLegalTermsArray('transferRequirements', e.target.value)}
                rows={5}
                className="resize-y"
              />
            </div>
          </div>

          <Separator />

          {/* Reporting Commitments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reporting Commitments</h3>

            <div className="space-y-2">
              <Label htmlFor="quarterlyReports">Quarterly Reports</Label>
              <Textarea
                id="quarterlyReports"
                placeholder="Unaudited financial statements, NAV updates, portfolio summaries within 45 days of quarter end"
                value={formData.legalTerms.quarterlyReports}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, quarterlyReports: e.target.value } })}
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualReports">Annual Reports</Label>
              <Textarea
                id="annualReports"
                placeholder="Audited financial statements and detailed portfolio review within 120 days of year end"
                value={formData.legalTerms.annualReports}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, annualReports: e.target.value } })}
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxForms">Tax Forms (K-1)</Label>
              <Textarea
                id="taxForms"
                placeholder="Schedule K-1 (Form 1065) delivered by March 15th annually"
                value={formData.legalTerms.taxForms}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, taxForms: e.target.value } })}
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capitalNotices">Capital Call & Distribution Notices</Label>
              <Textarea
                id="capitalNotices"
                placeholder="Capital call and distribution notices sent at least X business days in advance"
                value={formData.legalTerms.capitalNotices}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, capitalNotices: e.target.value } })}
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalCommunications">Additional Communications (one per line)</Label>
              <Textarea
                id="additionalCommunications"
                placeholder="Annual investor meeting (virtual or in-person)&#10;Material event notifications&#10;Access to online investor portal"
                value={arrayToText(formData.legalTerms.additionalCommunications)}
                onChange={(e) => updateLegalTermsArray('additionalCommunications', e.target.value)}
                rows={5}
                className="resize-y"
              />
            </div>
          </div>

          <Separator />

          {/* Liability Limitations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Liability Limitations</h3>

            <div className="space-y-2">
              <Label htmlFor="liabilityProtection">Limited Liability Protection</Label>
              <Textarea
                id="liabilityProtection"
                placeholder="As a Limited Partner, your liability is limited to your capital commitment to the Partnership..."
                value={formData.legalTerms.liabilityProtection}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, liabilityProtection: e.target.value } })}
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="liabilityExceptions">Exceptions to Limited Liability (one per line)</Label>
              <Textarea
                id="liabilityExceptions"
                placeholder="Return of distributions: Wrongful distributions may be reclaimed&#10;Participation in control: Active management participation&#10;Fraud or willful misconduct"
                value={arrayToText(formData.legalTerms.liabilityExceptions)}
                onChange={(e) => updateLegalTermsArray('liabilityExceptions', e.target.value)}
                rows={5}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maximumExposure">Maximum Exposure Note</Label>
              <Textarea
                id="maximumExposure"
                placeholder="Your Maximum Exposure: {{commitment}} (committed capital) plus potential clawback..."
                value={formData.legalTerms.maximumExposure}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, maximumExposure: e.target.value } })}
                rows={2}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">Use {'{'}{'{'} commitment {'}'}{'}'}  as placeholder for investor commitment amount</p>
            </div>
          </div>

          <Separator />

          {/* Indemnification */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Indemnification</h3>

            <div className="space-y-2">
              <Label htmlFor="partnershipIndemnifiesLP">Partnership Indemnifies LP For (one per line)</Label>
              <Textarea
                id="partnershipIndemnifiesLP"
                placeholder="Claims arising from Partnership activities conducted in good faith&#10;Litigation related to your status as Limited Partner&#10;Third-party claims arising from Partnership investments"
                value={arrayToText(formData.legalTerms.partnershipIndemnifiesLP)}
                onChange={(e) => updateLegalTermsArray('partnershipIndemnifiesLP', e.target.value)}
                rows={4}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lpIndemnifiesPartnership">LP Indemnifies Partnership For (one per line)</Label>
              <Textarea
                id="lpIndemnifiesPartnership"
                placeholder="Breach of representations and warranties in subscription agreement&#10;Violation of transfer restrictions&#10;Unauthorized disclosure of confidential information"
                value={arrayToText(formData.legalTerms.lpIndemnifiesPartnership)}
                onChange={(e) => updateLegalTermsArray('lpIndemnifiesPartnership', e.target.value)}
                rows={5}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indemnificationProcedures">Indemnification Procedures</Label>
              <Textarea
                id="indemnificationProcedures"
                placeholder="Indemnified party must provide prompt written notice of any claim..."
                value={formData.legalTerms.indemnificationProcedures}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, indemnificationProcedures: e.target.value } })}
                rows={3}
                className="resize-y"
              />
            </div>
          </div>

          <Separator />

          {/* Additional Provisions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Provisions</h3>

            <div className="space-y-2">
              <Label htmlFor="amendments">Amendments</Label>
              <Textarea
                id="amendments"
                placeholder="This Agreement may be amended only with the written consent of the General Partner and Limited Partners..."
                value={formData.legalTerms.amendments}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, amendments: e.target.value } })}
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dissolution">Dissolution</Label>
              <Textarea
                id="dissolution"
                placeholder="The Partnership shall be dissolved upon the earliest to occur of..."
                value={formData.legalTerms.dissolution}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, dissolution: e.target.value } })}
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disputes">Dispute Resolution</Label>
              <Textarea
                id="disputes"
                placeholder="Any dispute, controversy, or claim arising out of or relating to this Agreement shall be resolved through binding arbitration..."
                value={formData.legalTerms.disputes}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, disputes: e.target.value } })}
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="governingLaw">Governing Law</Label>
              <Textarea
                id="governingLaw"
                placeholder="This Agreement shall be governed by and construed in accordance with the laws of..."
                value={formData.legalTerms.governingLaw}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, governingLaw: e.target.value } })}
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalProvisions">Additional Provisions</Label>
              <Textarea
                id="additionalProvisions"
                placeholder="Confidentiality, notices, and other important provisions..."
                value={formData.legalTerms.additionalProvisions}
                onChange={(e) => setFormData({ ...formData, legalTerms: { ...formData.legalTerms, additionalProvisions: e.target.value } })}
                rows={3}
                className="resize-y"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" asChild>
          <Link href={`/investment-manager/structures/${id}`}>Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
