'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { IconArrowLeft, IconDeviceFloppy, IconLoader, IconFileText, IconInfoCircle, IconCopy } from '@tabler/icons-react'
import { useTranslation } from '@/hooks/useTranslation'
import { getAuthToken } from '@/lib/auth-storage'
import { getApiUrl } from '@/lib/api-config'
import type { DrawdownNoticeTemplate } from '@/lib/types'

const DEFAULT_LEGAL_DESCRIPTION = `Dear {{LP_NAME}},

In accordance with the terms of the Limited Partnership Agreement of {{FUND_NAME}}, we hereby notify you of a capital call in the amount detailed below.

This capital call is being made for the purpose of funding new investments and covering fund operating expenses. Please remit payment by {{DEADLINE_DATE}}.`

const DEFAULT_TEMPLATE: Omit<DrawdownNoticeTemplate, 'structureId'> = {
  headerTitle: 'DRAWDOWN NOTICE',
  headerSubtitle: 'Capital Call No. {{CALL_NUMBER}}',
  includeFirmLogo: true,
  legalDescription: DEFAULT_LEGAL_DESCRIPTION,
  paymentInstructionsNote: '',
  footerSignatoryName: '',
  footerSignatoryTitle: 'Fund Manager',
  footerCompanyName: '',
  footerAdditionalNotes: '',
}

const AVAILABLE_PLACEHOLDERS = [
  { token: '{{LP_NAME}}', description: 'Investor full name', source: 'Users table' },
  { token: '{{LP_EMAIL}}', description: 'Investor email', source: 'Users table' },
  { token: '{{LP_ADDRESS}}', description: 'Investor address', source: 'Investor' },
  { token: '{{FUND_NAME}}', description: 'Structure/fund name', source: 'Structures table' },
  { token: '{{CURRENCY}}', description: 'Fund currency (USD, MXN...)', source: 'Structures table' },
  { token: '{{CALL_NUMBER}}', description: 'Capital call number', source: 'Capital Call' },
  { token: '{{NOTICE_DATE}}', description: 'Date the notice is issued', source: 'Capital Call' },
  { token: '{{DEADLINE_DATE}}', description: 'Payment due date', source: 'Capital Call' },
  { token: '{{TOTAL_CALL_AMOUNT}}', description: 'Total amount being called', source: 'Calculated' },
  { token: '{{INVESTOR_PORTION}}', description: 'Investor\'s amount due', source: 'Calculated' },
  { token: '{{COMMITTED_CAPITAL}}', description: 'Investor\'s total commitment', source: 'Investor-Structure' },
  { token: '{{CONTRIBUTED_CAPITAL}}', description: 'Cumulative capital called', source: 'Calculated' },
  { token: '{{UNFUNDED_CAPITAL}}', description: 'Remaining unfunded', source: 'Calculated' },
  { token: '{{COMMITMENT_PERCENT}}', description: '% of commitment called', source: 'Calculated' },
  { token: '{{BANK_NAME}}', description: 'Receiving bank name', source: 'Structures table' },
  { token: '{{ACCOUNT_NUMBER}}', description: 'Bank account number', source: 'Structures table' },
  { token: '{{ROUTING_NUMBER}}', description: 'Routing/SWIFT code', source: 'Structures table' },
  { token: '{{ACCOUNT_HOLDER}}', description: 'Account holder name', source: 'Structures table' },
  { token: '{{TAX_ID}}', description: 'Tax ID / RFC', source: 'Structures table' },
  { token: '{{GP_NAME}}', description: 'General Partner name', source: 'Firm Settings' },
  { token: '{{GP_ADDRESS}}', description: 'GP address', source: 'Firm Settings' },
  { token: '{{GP_EMAIL}}', description: 'GP email', source: 'Firm Settings' },
  { token: '{{GP_PHONE}}', description: 'GP phone number', source: 'Firm Settings' },
  { token: '{{GP_WEBSITE}}', description: 'GP website URL', source: 'Firm Settings' },
]

export default function DrawdownTemplatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const structureId = searchParams.get('structureId') || ''

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [structureName, setStructureName] = useState('')
  const [template, setTemplate] = useState<Omit<DrawdownNoticeTemplate, 'structureId'>>({ ...DEFAULT_TEMPLATE })

  // Fetch existing template and structure info
  useEffect(() => {
    if (!structureId) return

    const fetchData = async () => {
      setIsLoading(true)
      const token = getAuthToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch structure name
        const structRes = await fetch(getApiUrl(`/api/structures/${structureId}`), {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (structRes.ok) {
          const structData = await structRes.json()
          const struct = structData.data || structData
          setStructureName(struct.name || '')

          // Pre-fill company name from structure if template is new
          setTemplate(prev => ({
            ...prev,
            footerCompanyName: prev.footerCompanyName || struct.name || '',
          }))
        }

        // Fetch existing template
        const templateRes = await fetch(getApiUrl(`/api/structures/${structureId}/drawdown-template`), {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (templateRes.ok) {
          const templateData = await templateRes.json()
          if (templateData.data) {
            setTemplate({
              headerTitle: templateData.data.headerTitle || DEFAULT_TEMPLATE.headerTitle,
              headerSubtitle: templateData.data.headerSubtitle || DEFAULT_TEMPLATE.headerSubtitle,
              includeFirmLogo: templateData.data.includeFirmLogo ?? true,
              legalDescription: templateData.data.legalDescription || DEFAULT_TEMPLATE.legalDescription,
              paymentInstructionsNote: templateData.data.paymentInstructionsNote || '',
              footerSignatoryName: templateData.data.footerSignatoryName || '',
              footerSignatoryTitle: templateData.data.footerSignatoryTitle || DEFAULT_TEMPLATE.footerSignatoryTitle,
              footerCompanyName: templateData.data.footerCompanyName || '',
              footerAdditionalNotes: templateData.data.footerAdditionalNotes || '',
            })
          }
        }
      } catch (error) {
        console.error('Error fetching template data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [structureId])

  const handleSave = async () => {
    if (!structureId) {
      toast.error('No structure selected')
      return
    }

    setIsSaving(true)
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(getApiUrl(`/api/structures/${structureId}/drawdown-template`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...template,
          structureId,
        }),
      })

      if (response.ok) {
        toast.success('Drawdown notice template saved successfully')
      } else {
        const errorData = await response.json().catch(() => null)
        toast.error(errorData?.message || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  const copyPlaceholder = (token: string) => {
    navigator.clipboard.writeText(token)
    toast.success(`Copied ${token}`)
  }

  if (!structureId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconFileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">{t.drawdownTemplate.noStructure}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {t.drawdownTemplate.noStructureDesc}
            </p>
            <Button onClick={() => router.push('/investment-manager/operations/capital-calls/create')}>
              {t.drawdownTemplate.goToCapitalCalls}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/investment-manager/operations/capital-calls/create?step=4')}>
          <IconArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{t.drawdownTemplate.title}</h1>
          <p className="text-muted-foreground">
            {t.drawdownTemplate.configureFor} <span className="font-medium">{structureName || structureId}</span>
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <IconLoader className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <IconDeviceFloppy className="w-4 h-4 mr-2" />
          )}
          {t.drawdownTemplate.saveTemplate}
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-lg font-semibold">{t.drawdownTemplate.loadingTemplate}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Form - Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.drawdownTemplate.header}</CardTitle>
                <CardDescription>{t.drawdownTemplate.headerDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headerTitle">{t.drawdownTemplate.titleField}</Label>
                  <Input
                    id="headerTitle"
                    value={template.headerTitle}
                    onChange={(e) => setTemplate(prev => ({ ...prev, headerTitle: e.target.value }))}
                    placeholder="e.g. DRAWDOWN NOTICE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headerSubtitle">{t.drawdownTemplate.subtitle}</Label>
                  <Input
                    id="headerSubtitle"
                    value={template.headerSubtitle}
                    onChange={(e) => setTemplate(prev => ({ ...prev, headerSubtitle: e.target.value }))}
                    placeholder='e.g. Capital Call No. {{CALL_NUMBER}}'
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{{CALL_NUMBER}}'} to auto-fill the capital call number
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="includeFirmLogo">{t.drawdownTemplate.includeLogo}</Label>
                    <p className="text-xs text-muted-foreground">{t.drawdownTemplate.includeLogoDesc}</p>
                  </div>
                  <Switch
                    id="includeFirmLogo"
                    checked={template.includeFirmLogo}
                    onCheckedChange={(checked) => setTemplate(prev => ({ ...prev, includeFirmLogo: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Legal Description Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.drawdownTemplate.legalDescription}</CardTitle>
                <CardDescription>
                  {t.drawdownTemplate.legalDescriptionDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="legalDescription">{t.drawdownTemplate.noticeBody}</Label>
                  <Textarea
                    id="legalDescription"
                    value={template.legalDescription}
                    onChange={(e) => setTemplate(prev => ({ ...prev, legalDescription: e.target.value }))}
                    placeholder={t.drawdownTemplate.noticeBodyPlaceholder}
                    className="min-h-[250px] font-mono text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplate(prev => ({ ...prev, legalDescription: DEFAULT_LEGAL_DESCRIPTION }))}
                >
                  {t.drawdownTemplate.resetToDefault}
                </Button>
              </CardContent>
            </Card>

            {/* Payment Instructions Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.drawdownTemplate.paymentInstructions}</CardTitle>
                <CardDescription>
                  {t.drawdownTemplate.paymentInstructionsDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-muted/50 p-4 text-sm space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <IconInfoCircle className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{t.drawdownTemplate.autoFilled}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {t.drawdownTemplate.bankDetails}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentInstructionsNote">{t.drawdownTemplate.additionalPaymentNotes}</Label>
                  <Textarea
                    id="paymentInstructionsNote"
                    value={template.paymentInstructionsNote || ''}
                    onChange={(e) => setTemplate(prev => ({ ...prev, paymentInstructionsNote: e.target.value }))}
                    placeholder="e.g. Please include your investor ID as payment reference..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Footer / Signature Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.drawdownTemplate.footerSignature}</CardTitle>
                <CardDescription>{t.drawdownTemplate.footerSignatureDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="footerSignatoryName">{t.drawdownTemplate.signatoryName}</Label>
                    <Input
                      id="footerSignatoryName"
                      value={template.footerSignatoryName}
                      onChange={(e) => setTemplate(prev => ({ ...prev, footerSignatoryName: e.target.value }))}
                      placeholder="e.g. Juan Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footerSignatoryTitle">{t.drawdownTemplate.signatoryTitle}</Label>
                    <Input
                      id="footerSignatoryTitle"
                      value={template.footerSignatoryTitle}
                      onChange={(e) => setTemplate(prev => ({ ...prev, footerSignatoryTitle: e.target.value }))}
                      placeholder="e.g. Fund Manager"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footerCompanyName">{t.drawdownTemplate.companyName}</Label>
                  <Input
                    id="footerCompanyName"
                    value={template.footerCompanyName}
                    onChange={(e) => setTemplate(prev => ({ ...prev, footerCompanyName: e.target.value }))}
                    placeholder="e.g. Proximity Capital Management"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footerAdditionalNotes">{t.drawdownTemplate.additionalNotes}</Label>
                  <Textarea
                    id="footerAdditionalNotes"
                    value={template.footerAdditionalNotes || ''}
                    onChange={(e) => setTemplate(prev => ({ ...prev, footerAdditionalNotes: e.target.value }))}
                    placeholder="e.g. This notice is confidential and intended solely for the addressee..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholders Reference - Right column */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">{t.drawdownTemplate.availablePlaceholders}</CardTitle>
                <CardDescription>
                  {t.drawdownTemplate.placeholdersDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Group by source */}
                  {['Capital Call', 'Calculated', 'Users table', 'Investor-Structure', 'Structures table', 'Firm Settings'].map(source => {
                    const placeholders = AVAILABLE_PLACEHOLDERS.filter(p => p.source === source)
                    if (placeholders.length === 0) return null
                    return (
                      <div key={source}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {source}
                        </p>
                        <div className="space-y-1">
                          {placeholders.map(p => (
                            <button
                              key={p.token}
                              onClick={() => copyPlaceholder(p.token)}
                              className="w-full text-left flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition-colors group"
                            >
                              <div className="min-w-0">
                                <code className="text-xs font-mono text-primary">{p.token}</code>
                                <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                              </div>
                              <IconCopy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                        <Separator className="mt-3" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
