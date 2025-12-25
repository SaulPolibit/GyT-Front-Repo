"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken } from '@/lib/auth-storage'
import { toast } from 'sonner'
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

    async function fetchStructure() {
      try {
        // Get authentication token
        const token = getAuthToken()

        if (!token) {
          setError('Authentication required. Please log in.')
          setLoading(false)
          return
        }

        const apiUrl = getApiUrl(API_CONFIG.endpoints.getSingleStructure(id))

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.message || 'Failed to fetch structure')
          setLoading(false)
          return
        }

        const result = await response.json()
        const structure = result.data

        if (!structure) {
          setError('Structure not found')
          setLoading(false)
          return
        }

        // Initialize form with existing structure data
        // Map API response field names to form data structure
        setFormData({
          name: structure.name || '',
          status: structure.status || 'active',
          totalCommitment: structure.totalCommitment || 0,
          investors: structure.investors || 0,
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
            managementControl: structure.managementControl || '',
            capitalContributions: structure.capitalContributions || '',
            allocationsDistributions: structure.allocationsDistributions || '',
            // Rights & Obligations (convert strings to arrays)
            limitedPartnerRights: textToArray(structure.limitedPartnerRights || ''),
            limitedPartnerObligations: textToArray(structure.limitedPartnerObligations || ''),
            // Voting Rights
            votingThreshold: 66.67,
            mattersRequiringConsent: [],
            // Redemption Terms
            lockUpPeriod: structure.lockUpPeriod || '',
            withdrawalConditions: textToArray(structure.withdrawalConditions || ''),
            withdrawalProcess: textToArray(structure.withdrawalProcess || ''),
            // Transfer Restrictions
            transferProhibition: structure.generalProhibition || '',
            permittedTransfers: textToArray(structure.permittedTransfers || ''),
            transferRequirements: textToArray(structure.transferRequirements || ''),
            // Reporting
            quarterlyReports: structure.quarterlyReports || '',
            annualReports: structure.annualReports || '',
            taxForms: structure.taxForms || '',
            capitalNotices: structure.capitalCallDistributionsNotices || '',
            additionalCommunications: textToArray(structure.additionalCommunications || ''),
            // Liability
            liabilityProtection: structure.limitedLiability || '',
            liabilityExceptions: textToArray(structure.exceptionsLiability || ''),
            maximumExposure: structure.maximumExposure || '',
            // Indemnification
            partnershipIndemnifiesLP: textToArray(structure.indemnifiesPartnership || ''),
            lpIndemnifiesPartnership: textToArray(structure.lpIndemnifiesPartnership || ''),
            indemnificationProcedures: structure.indemnifiesProcedures || '',
            // Additional Provisions
            amendments: structure.amendments || '',
            dissolution: structure.dissolution || '',
            disputes: structure.disputesResolution || '',
            governingLaw: structure.governingLaw || '',
            additionalProvisions: structure.additionalProvisions || ''
          }
        })

        setLoading(false)
      } catch (err) {
        console.error('Error fetching structure:', err)
        setError('Failed to load structure data')
        setLoading(false)
      }
    }

    fetchStructure()
  }, [id])

  // Initialize hierarchy structures when levels change
  useEffect(() => {
    if (formData.hierarchyMode && formData.hierarchySetupApproach === 'all-at-once') {
      const currentLevels = formData.hierarchyStructures.length
      const targetLevels = formData.hierarchyLevels

      if (currentLevels !== targetLevels) {
        const newStructures = Array.from({ length: targetLevels }, (_, index) => {
          const existing = formData.hierarchyStructures[index]
          if (existing) return existing

          return {
            level: index + 1,
            name: index === 0
              ? `${formData.name} - Master Level`
              : index === targetLevels - 1
              ? `${formData.name} - Property Level`
              : `${formData.name} - Level ${index + 1}`,
            type: 'fund',
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
  }, [formData.hierarchyMode, formData.hierarchySetupApproach, formData.hierarchyLevels, formData.name])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Get authentication token
      const token = getAuthToken()

      if (!token) {
        setError('Authentication required. Please log in.')
        setSaving(false)
        return
      }

      // Prepare update data - only send legalTerms with exact field names as strings
      const updateData = {
          managementControl: formData.legalTerms.managementControl,
          capitalContributions: formData.legalTerms.capitalContributions,
          allocationsDistributions: formData.legalTerms.allocationsDistributions,
          limitedPartnerObligations: arrayToText(formData.legalTerms.limitedPartnerObligations),
          limitedPartnerRights: arrayToText(formData.legalTerms.limitedPartnerRights),
          lockUpPeriod: formData.legalTerms.lockUpPeriod,
          withdrawalConditions: arrayToText(formData.legalTerms.withdrawalConditions),
          withdrawalProcess: arrayToText(formData.legalTerms.withdrawalProcess),
          generalProhibition: formData.legalTerms.transferProhibition,
          permittedTransfers: arrayToText(formData.legalTerms.permittedTransfers),
          transferRequirements: arrayToText(formData.legalTerms.transferRequirements),
          quarterlyReports: formData.legalTerms.quarterlyReports,
          annualReports: formData.legalTerms.annualReports,
          taxForms: formData.legalTerms.taxForms,
          capitalCallDistributionsNotices: formData.legalTerms.capitalNotices,
          additionalCommunications: arrayToText(formData.legalTerms.additionalCommunications),
          limitedLiability: formData.legalTerms.liabilityProtection,
          exceptionsLiability: arrayToText(formData.legalTerms.liabilityExceptions),
          maximumExposure: formData.legalTerms.maximumExposure,
          indemnifiesPartnership: arrayToText(formData.legalTerms.partnershipIndemnifiesLP),
          lpIndemnifiesPartnership: arrayToText(formData.legalTerms.lpIndemnifiesPartnership),
          indemnifiesProcedures: formData.legalTerms.indemnificationProcedures,
          amendments: formData.legalTerms.amendments,
          dissolution: formData.legalTerms.dissolution,
          disputesResolution: formData.legalTerms.disputes,
          governingLaw: formData.legalTerms.governingLaw,
          additionalProvisions: formData.legalTerms.additionalProvisions
      }

      const apiUrl = getApiUrl(API_CONFIG.endpoints.updateStructure(id))

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update structure')
        setSaving(false)
        return
      }

      const result = await response.json()

      if (result.success) {
        toast.success('Structure updated successfully')
        // router.push(`/investment-manager/structures/${id}`)
      } else {
        setError(result.message || 'Failed to update structure')
        toast.error(result.message || 'Failed to update structure')
      }
    } catch (err) {
      setError('An error occurred while saving')
      toast.error('An error occurred while saving')
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
