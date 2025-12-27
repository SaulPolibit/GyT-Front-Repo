"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Download, ArrowLeft, Loader2, Users, TrendingUp, DollarSign, BarChart3, PieChart, Activity } from "lucide-react"
import { getInvestors } from "@/lib/investors-storage"
import { getInvestments } from "@/lib/investments-storage"
import { getStructures } from "@/lib/structures-storage"
import type { Investor, Investment } from "@/lib/types"

export default function ReportBuilderPage() {
  const router = useRouter()
  const { logout } = useAuth()

  // Load data from localStorage
  const [investors, setInvestors] = useState<Investor[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [structures, setStructures] = useState<any[]>([])

  useEffect(() => {
    // Load all data from localStorage
    setInvestors(getInvestors())
    setInvestments(getInvestments())
    setStructures(getStructures())
  }, [])

  // Form state
  const [reportTitle, setReportTitle] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([])
  const [selectedInvestments, setSelectedInvestments] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [useILPAFormat, setUseILPAFormat] = useState(false)
  const [selectedStructure, setSelectedStructure] = useState<string>("")
  const [gpName, setGpName] = useState("")
  const [fundCurrency, setFundCurrency] = useState("USD")
  const [isGenerating, setIsGenerating] = useState(false)

  // Data fields to include
  const [includeFields, setIncludeFields] = useState({
    // Portfolio Summary
    totalAUM: true,
    totalInvestments: true,
    totalInvestors: true,
    avgIRR: true,
    avgMultiple: true,

    // Investment Details
    investmentBreakdown: true,
    assetAllocation: true,
    geographicDistribution: true,
    sectorBreakdown: true,

    // Performance Metrics
    individualIRR: true,
    individualMultiples: true,
    unrealizedGains: true,
    realizedGains: true,

    // Investor Information
    investorList: true,
    investorAllocations: true,
    capitalCalls: true,
    distributions: true,

    // Financial Details
    cashFlows: true,
    valuationHistory: true,
    feeBreakdown: false,
    expenseRatios: false,
  })

  const toggleInvestor = (investorId: string) => {
    setSelectedInvestors(prev =>
      prev.includes(investorId)
        ? prev.filter(id => id !== investorId)
        : [...prev, investorId]
    )
  }

  const toggleInvestment = (investmentId: string) => {
    setSelectedInvestments(prev =>
      prev.includes(investmentId)
        ? prev.filter(id => id !== investmentId)
        : [...prev, investmentId]
    )
  }

  const toggleAllInvestors = () => {
    if (selectedInvestors.length === investors.length) {
      setSelectedInvestors([])
    } else {
      setSelectedInvestors(investors.map(inv => inv.id))
    }
  }

  const toggleAllInvestments = () => {
    if (selectedInvestments.length === investments.length) {
      setSelectedInvestments([])
    } else {
      setSelectedInvestments(investments.map(inv => inv.id))
    }
  }

  const handleGenerate = async () => {
    if (!reportTitle || !periodStart || !periodEnd) {
      toast.error('Please fill in report title and date range')
      return
    }

    if (useILPAFormat && (!selectedStructure || !gpName || !fundCurrency)) {
      toast.error('Please select a structure and fill in GP Name and Fund Currency for ILPA format')
      return
    }

    if (selectedInvestors.length === 0 && selectedInvestments.length === 0) {
      toast.error('Please select at least one investor or investment')
      return
    }

    try {
      setIsGenerating(true)

      if (useILPAFormat) {
        // Generate ILPA report client-side
        const { generateILPAExcelReport, generateILPACSV } = await import('@/lib/ilpa-report-generator')
        const { generateILPAPDF } = await import('@/lib/ilpa-report-pdf-generator')
        const selectedStruct = structures.find(s => s.id === selectedStructure)

        const ilpaConfig = {
          fundId: selectedStructure,
          reportingDate: periodEnd,
          gpName,
          fundName: selectedStruct?.name || reportTitle,
          fundCurrency,
        }

        if (exportFormat === 'excel') {
          const workbook = await generateILPAExcelReport(ilpaConfig)
          const buffer = await workbook.xlsx.writeBuffer()
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${reportTitle.replace(/\s+/g, '-').toLowerCase()}-ILPA.xlsx`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else if (exportFormat === 'csv') {
          const csvString = generateILPACSV(ilpaConfig)
          const blob = new Blob([csvString], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${reportTitle.replace(/\s+/g, '-').toLowerCase()}-ILPA.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else if (exportFormat === 'pdf') {
          const pdfBuffer = await generateILPAPDF(ilpaConfig)
          const blob = new Blob([pdfBuffer as any], { type: 'application/pdf' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${reportTitle.replace(/\s+/g, '-').toLowerCase()}-ILPA.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }

        toast.success(`ILPA report generated successfully! The file has been downloaded.`)
      } else {
        // Generate standard custom report via API
        const requestBody = {
          title: reportTitle,
          periodStart,
          periodEnd,
          selectedInvestors,
          selectedInvestments,
          includeFields,
          format: exportFormat,
        }

        const response = await fetch('/api/reports/custom/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })

        // Handle 401 Unauthorized - session expired or invalid
        if (response.status === 401) {
          // Check if it's an expired token error
          try {
            const errorData = await response.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Report Builder] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

        if (!response.ok) throw new Error('Failed to generate report')

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url

        const fileExtension = exportFormat === 'pdf' ? 'pdf' : exportFormat === 'excel' ? 'xlsx' : 'csv'
        a.download = `${reportTitle.replace(/\s+/g, '-').toLowerCase()}.${fileExtension}`

        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success(`Report generated successfully! The file has been downloaded.`)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/investment-manager/reports')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Custom Report Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create a custom report with your selected data fields and filters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
              <CardDescription>Set the title and time period for your report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportTitle">Report Title</Label>
                <Input
                  id="reportTitle"
                  placeholder="e.g., Q4 2024 Portfolio Performance"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodStart">Period Start</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodEnd">Period End</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Data Fields</CardTitle>
              <CardDescription>Select which data points to include in your report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Portfolio Summary */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <PieChart className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Portfolio Summary</h4>
                </div>
                <div className="space-y-2 ml-7">
                  {[
                    { key: 'totalAUM', label: 'Total AUM' },
                    { key: 'totalInvestments', label: 'Total Investments' },
                    { key: 'totalInvestors', label: 'Total Investors' },
                    { key: 'avgIRR', label: 'Average IRR' },
                    { key: 'avgMultiple', label: 'Average Multiple' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={includeFields[key as keyof typeof includeFields]}
                        onCheckedChange={(checked) =>
                          setIncludeFields(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                      <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Investment Details */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Investment Details</h4>
                </div>
                <div className="space-y-2 ml-7">
                  {[
                    { key: 'investmentBreakdown', label: 'Investment Breakdown' },
                    { key: 'assetAllocation', label: 'Asset Allocation' },
                    { key: 'geographicDistribution', label: 'Geographic Distribution' },
                    { key: 'sectorBreakdown', label: 'Sector Breakdown' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={includeFields[key as keyof typeof includeFields]}
                        onCheckedChange={(checked) =>
                          setIncludeFields(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                      <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Performance Metrics */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Performance Metrics</h4>
                </div>
                <div className="space-y-2 ml-7">
                  {[
                    { key: 'individualIRR', label: 'Individual IRR' },
                    { key: 'individualMultiples', label: 'Individual Multiples' },
                    { key: 'unrealizedGains', label: 'Unrealized Gains' },
                    { key: 'realizedGains', label: 'Realized Gains' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={includeFields[key as keyof typeof includeFields]}
                        onCheckedChange={(checked) =>
                          setIncludeFields(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                      <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Investor Information */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Investor Information</h4>
                </div>
                <div className="space-y-2 ml-7">
                  {[
                    { key: 'investorList', label: 'Investor List' },
                    { key: 'investorAllocations', label: 'Investor Allocations' },
                    { key: 'capitalCalls', label: 'Capital Calls' },
                    { key: 'distributions', label: 'Distributions' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={includeFields[key as keyof typeof includeFields]}
                        onCheckedChange={(checked) =>
                          setIncludeFields(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                      <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Financial Details */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Financial Details</h4>
                </div>
                <div className="space-y-2 ml-7">
                  {[
                    { key: 'cashFlows', label: 'Cash Flows' },
                    { key: 'valuationHistory', label: 'Valuation History' },
                    { key: 'feeBreakdown', label: 'Fee Breakdown' },
                    { key: 'expenseRatios', label: 'Expense Ratios' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={includeFields[key as keyof typeof includeFields]}
                        onCheckedChange={(checked) =>
                          setIncludeFields(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                      <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investors Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Investors</CardTitle>
                  <CardDescription>
                    {selectedInvestors.length === 0
                      ? 'No investors selected'
                      : `${selectedInvestors.length} of ${investors.length} selected`}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllInvestors}
                >
                  {selectedInvestors.length === investors.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {investors.map((investor) => (
                  <div
                    key={investor.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`investor-${investor.id}`}
                        checked={selectedInvestors.includes(investor.id)}
                        onCheckedChange={() => toggleInvestor(investor.id)}
                      />
                      <div>
                        <Label
                          htmlFor={`investor-${investor.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {investor.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {investor.type} • {investor.fundOwnerships?.length || 0} structure{(investor.fundOwnerships?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{investor.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Investments Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Investments</CardTitle>
                  <CardDescription>
                    {selectedInvestments.length === 0
                      ? 'No investments selected'
                      : `${selectedInvestments.length} of ${investments.length} selected`}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllInvestments}
                >
                  {selectedInvestments.length === investments.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {investments.map((investment) => (
                  <div
                    key={investment.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`investment-${investment.id}`}
                        checked={selectedInvestments.includes(investment.id)}
                        onCheckedChange={() => toggleInvestment(investment.id)}
                      />
                      <div>
                        <Label
                          htmlFor={`investment-${investment.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {investment.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {investment.type} • {investment.sector} • IRR: {investment.totalFundPosition.irr.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{investment.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Export Format */}
          <Card>
            <CardHeader>
              <CardTitle>Export Format</CardTitle>
              <CardDescription>Choose your preferred format</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={exportFormat} onValueChange={(val) => setExportFormat(val as 'pdf' | 'excel' | 'csv')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pdf">PDF</TabsTrigger>
                  <TabsTrigger value="excel">Excel</TabsTrigger>
                  <TabsTrigger value="csv">CSV</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    {exportFormat === 'pdf' && (
                      <p className="text-muted-foreground">
                        Professional PDF report with charts, tables, and formatting suitable for distribution to investors.
                      </p>
                    )}
                    {exportFormat === 'excel' && (
                      <p className="text-muted-foreground">
                        Excel workbook with multiple sheets containing raw data, pivot tables, and charts for further analysis.
                      </p>
                    )}
                    {exportFormat === 'csv' && (
                      <p className="text-muted-foreground">
                        Comma-separated values file containing raw data for easy import into other systems or databases.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* ILPA Format Toggle */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ilpa-format"
                    checked={useILPAFormat}
                    onCheckedChange={(checked) => setUseILPAFormat(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="ilpa-format"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Use ILPA Format
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Generate report following ILPA Portfolio Company Metrics Template v1.0 standard
                    </p>
                  </div>
                </div>

                {/* ILPA-specific fields */}
                {useILPAFormat && (
                  <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                    <div className="space-y-2">
                      <Label htmlFor="structure-select">Select Fund/Structure *</Label>
                      <select
                        id="structure-select"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedStructure}
                        onChange={(e) => {
                          const structureId = e.target.value
                          setSelectedStructure(structureId)
                          // Auto-fill GP name and currency from structure
                          const structure = structures.find(s => s.id === structureId)
                          if (structure) {
                            setFundCurrency(structure.currency || 'USD')
                          }
                        }}
                      >
                        <option value="">-- Select a structure --</option>
                        {structures.map((structure) => (
                          <option key={structure.id} value={structure.id}>
                            {structure.name} ({structure.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gp-name">GP Name *</Label>
                      <Input
                        id="gp-name"
                        placeholder="e.g., Acme Capital Partners"
                        value={gpName}
                        onChange={(e) => setGpName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fund-currency">Fund Currency *</Label>
                      <Input
                        id="fund-currency"
                        placeholder="e.g., USD, EUR, GBP"
                        value={fundCurrency}
                        onChange={(e) => setFundCurrency(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      * Required fields for ILPA-compliant reporting
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Title</div>
                <div className="font-medium">{reportTitle || 'Not set'}</div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Period</div>
                <div className="font-medium">
                  {periodStart && periodEnd
                    ? `${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`
                    : 'Not set'}
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Data Fields</div>
                <div className="font-medium">
                  {Object.values(includeFields).filter(Boolean).length} selected
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Investors</div>
                <div className="font-medium">
                  {selectedInvestors.length === 0
                    ? 'None selected'
                    : `${selectedInvestors.length} selected`}
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Investments</div>
                <div className="font-medium">
                  {selectedInvestments.length === 0
                    ? 'None selected'
                    : `${selectedInvestments.length} selected`}
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Format</div>
                <div className="font-medium uppercase">{exportFormat}</div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating || !reportTitle || !periodStart || !periodEnd}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
