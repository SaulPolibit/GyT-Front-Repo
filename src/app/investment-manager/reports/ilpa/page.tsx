'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IconArrowLeft, IconDownload, IconLoader, IconFileSpreadsheet, IconRefresh } from '@tabler/icons-react'
import { toast } from 'sonner'
import { getAuthToken, logout } from '@/lib/auth-storage'
import { getApiUrl, API_CONFIG } from '@/lib/api-config'
import { formatCurrency } from '@/lib/format-utils'
import { useTranslation } from "@/hooks/useTranslation"

interface PerformanceData {
  fundInfo: {
    id: string; name: string; currency: string; vintage: number | null
    totalCommitment: number; investorCount: number
  }
  performance: {
    grossIRR: number; netIRR: number; grossTVPI: number; netTVPI: number
    dpi: number; rvpi: number; moic: number
  }
  capitalSummary: {
    totalCommitment: number; totalCapitalCalled: number; totalDistributed: number
    totalFees: number; currentNAV: number; totalValue: number
    uncalled: number; paidInRatio: number
  }
  cashFlowSummary: {
    totalCalls: number; totalDistributions: number
    unrealizedGain: number; realizedGain: number
  }
  asOfDate: string
}

interface QuarterlyActivity {
  period: { startDate: string; endDate: string }
  capitalCalls: { count: number; totalAmount: number; calls: Array<{ callNumber: string; callDate: string; amount: number; purpose: string }> }
  distributions: { count: number; totalAmount: number; distributions: Array<{ distributionNumber: string; distributionDate: string; amount: number; source: string }> }
  netCashFlow: number
}

interface CCDData {
  capitalCalls: { count: number; totalAmount: number; items: Array<{ callNumber: string; callDate: string; amount: number; purpose: string; cumulativeCalled: number }> }
  distributions: { count: number; totalAmount: number; items: Array<{ distributionNumber: string; distributionDate: string; amount: number; source: string; cumulativeDistributed: number }> }
  netPosition: number
}

interface Structure {
  id: string
  name: string
}

export default function ILPAReportsPage() {
  const router = useRouter()
  const [structures, setStructures] = useState<Structure[]>([])
  const [selectedStructure, setSelectedStructure] = useState('')
  const [activeTab, setActiveTab] = useState('performance')
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [quarterlyData, setQuarterlyData] = useState<{ performance: PerformanceData; quarterlyActivity: QuarterlyActivity } | null>(null)
  const [ccdData, setCcdData] = useState<CCDData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null)
  const [quarter, setQuarter] = useState('q4')
  const { t, language } = useTranslation()

  useEffect(() => {
    fetchStructures()
  }, [])

  const getQuarterDates = (q: string) => {
    const year = new Date().getFullYear()
    switch (q) {
      case 'q1': return { startDate: `${year}-01-01`, endDate: `${year}-03-31` }
      case 'q2': return { startDate: `${year}-04-01`, endDate: `${year}-06-30` }
      case 'q3': return { startDate: `${year}-07-01`, endDate: `${year}-09-30` }
      case 'q4': return { startDate: `${year}-10-01`, endDate: `${year}-12-31` }
      default: return { startDate: `${year}-01-01`, endDate: `${year}-03-31` }
    }
  }

  const fetchStructures = async () => {
    try {
      const token = getAuthToken()
      if (!token) { setIsLoading(false); return }

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getAllStructures), {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })

      if (response.status === 401) { logout(); router.push('/sign-in'); return }
      if (!response.ok) throw new Error('Failed to fetch structures')

      const data = await response.json()
      const list = data.data || []
      setStructures(list)

      if (list.length > 0) {
        setSelectedStructure(list[0].id)
        fetchPerformance(list[0].id)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error fetching structures:', error)
      setIsLoading(false)
    }
  }

  const fetchPerformance = async (structureId: string) => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.getILPAPerformanceReport(structureId)),
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )

      if (response.status === 401) { logout(); router.push('/sign-in'); return }
      if (!response.ok) throw new Error('Failed to fetch performance data')

      const data = await response.json()
      setPerformanceData(data.data)
    } catch (error) {
      console.error('Error fetching performance:', error)
      toast.error('Failed to load performance data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchQuarterly = async (structureId: string, q: string) => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      const { startDate, endDate } = getQuarterDates(q)
      const url = getApiUrl(API_CONFIG.endpoints.getILPAQuarterlyReport(structureId))
        + `?startDate=${startDate}&endDate=${endDate}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to fetch quarterly data')

      const data = await response.json()
      setQuarterlyData(data.data)
    } catch (error) {
      console.error('Error fetching quarterly:', error)
      toast.error('Failed to load quarterly data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCCD = async (structureId: string) => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.getILPACCDReport(structureId)),
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )

      if (!response.ok) throw new Error('Failed to fetch CC&D data')

      const data = await response.json()
      setCcdData(data.data)
    } catch (error) {
      console.error('Error fetching CC&D:', error)
      toast.error('Failed to load CC&D data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (!selectedStructure) return
    if (tab === 'performance' && !performanceData) fetchPerformance(selectedStructure)
    if (tab === 'quarterly') fetchQuarterly(selectedStructure, quarter)
    if (tab === 'ccd' && !ccdData) fetchCCD(selectedStructure)
  }

  const handleStructureChange = (value: string) => {
    setSelectedStructure(value)
    setPerformanceData(null)
    setQuarterlyData(null)
    setCcdData(null)
    if (activeTab === 'performance') fetchPerformance(value)
    if (activeTab === 'quarterly') fetchQuarterly(value, quarter)
    if (activeTab === 'ccd') fetchCCD(value)
  }

  const handleDownload = async (reportType: string, format: 'pdf' | 'excel') => {
    if (!selectedStructure) return
    setDownloadingFormat(`${reportType}-${format}`)
    try {
      const token = getAuthToken()
      if (!token) return

      let url = ''
      if (reportType === 'performance') {
        url = getApiUrl(API_CONFIG.endpoints.getILPAPerformanceReport(selectedStructure)) + `?format=${format}`
      } else if (reportType === 'quarterly') {
        const { startDate, endDate } = getQuarterDates(quarter)
        url = getApiUrl(API_CONFIG.endpoints.getILPAQuarterlyReport(selectedStructure))
          + `?format=${format}&startDate=${startDate}&endDate=${endDate}`
      } else {
        url = getApiUrl(API_CONFIG.endpoints.getILPACCDReport(selectedStructure)) + `?format=${format}`
      }

      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) throw new Error(`Failed to generate ${format.toUpperCase()}`)

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `ILPA_${reportType}_report.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      toast.success(`ILPA ${reportType} report downloaded`)
    } catch (error) {
      console.error('Download error:', error)
      toast.error(`Failed to download report`)
    } finally {
      setDownloadingFormat(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'spanish' ? 'es-ES' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const currency = performanceData?.fundInfo?.currency || 'USD'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <IconArrowLeft className="w-4 h-4 mr-2" />
            {t.ilpa.back}
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t.ilpa.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.ilpa.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStructure} onValueChange={handleStructureChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t.ilpa.selectStructure} />
            </SelectTrigger>
            <SelectContent>
              {structures.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance KPI Cards */}
      {performanceData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.ilpa.grossIrr}</CardDescription>
              <CardTitle className="text-2xl text-foreground">
                {performanceData.performance.grossIRR}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>TVPI</CardDescription>
              <CardTitle className="text-2xl">{performanceData.performance.grossTVPI}x</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>DPI</CardDescription>
              <CardTitle className="text-2xl">{performanceData.performance.dpi}x</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>RVPI</CardDescription>
              <CardTitle className="text-2xl">{performanceData.performance.rvpi}x</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="performance">{t.ilpa.performance}</TabsTrigger>
          <TabsTrigger value="quarterly">{t.ilpa.quarterly}</TabsTrigger>
          <TabsTrigger value="ccd">{t.ilpa.ccdSummary}</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handleDownload('performance', 'pdf')} disabled={downloadingFormat === 'performance-pdf'}>
              {downloadingFormat === 'performance-pdf' ? <IconLoader className="w-4 h-4 mr-2 animate-spin" /> : <IconDownload className="w-4 h-4 mr-2" />}
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload('performance', 'excel')} disabled={downloadingFormat === 'performance-excel'}>
              {downloadingFormat === 'performance-excel' ? <IconLoader className="w-4 h-4 mr-2 animate-spin" /> : <IconFileSpreadsheet className="w-4 h-4 mr-2" />}
              Excel
            </Button>
          </div>

          {isLoading ? (
            <Card><CardContent className="flex items-center justify-center py-12"><IconLoader className="w-8 h-8 animate-spin text-muted-foreground" /></CardContent></Card>
          ) : performanceData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>{t.ilpa.capitalSummary}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.ilpa.totalCommitment}</span><span className="font-medium">{formatCurrency(performanceData.capitalSummary.totalCommitment, currency)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.ilpa.capitalCalled}</span><span className="font-medium">{formatCurrency(performanceData.capitalSummary.totalCapitalCalled, currency)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.ilpa.paidInRatio}</span><span className="font-medium">{performanceData.capitalSummary.paidInRatio}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.ilpa.totalDistributed}</span><span className="font-medium text-foreground">{formatCurrency(performanceData.capitalSummary.totalDistributed, currency)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.ilpa.totalFees}</span><span className="font-medium">{formatCurrency(performanceData.capitalSummary.totalFees, currency)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.ilpa.currentNAV}</span><span className="font-medium text-purple-600">{formatCurrency(performanceData.capitalSummary.currentNAV, currency)}</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t.ilpa.performanceMetrics}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.ilpa.grossIrr}</span><Badge variant="outline">{performanceData.performance.grossIRR}%</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.ilpa.netIrr}</span><Badge variant="outline">{performanceData.performance.netIRR}%</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.ilpa.grossTvpi}</span><Badge variant="outline">{performanceData.performance.grossTVPI}x</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t.ilpa.netTvpi}</span><Badge variant="outline">{performanceData.performance.netTVPI}x</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">DPI</span><Badge variant="outline">{performanceData.performance.dpi}x</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">RVPI</span><Badge variant="outline">{performanceData.performance.rvpi}x</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">MOIC</span><Badge variant="outline">{performanceData.performance.moic}x</Badge></div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        {/* Quarterly Tab */}
        <TabsContent value="quarterly" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={quarter} onValueChange={(v) => { setQuarter(v); if (selectedStructure) fetchQuarterly(selectedStructure, v) }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="q1">Q1</SelectItem>
                <SelectItem value="q2">Q2</SelectItem>
                <SelectItem value="q3">Q3</SelectItem>
                <SelectItem value="q4">Q4</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDownload('quarterly', 'pdf')} disabled={downloadingFormat === 'quarterly-pdf'}>
                {downloadingFormat === 'quarterly-pdf' ? <IconLoader className="w-4 h-4 mr-2 animate-spin" /> : <IconDownload className="w-4 h-4 mr-2" />}
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload('quarterly', 'excel')} disabled={downloadingFormat === 'quarterly-excel'}>
                {downloadingFormat === 'quarterly-excel' ? <IconLoader className="w-4 h-4 mr-2 animate-spin" /> : <IconFileSpreadsheet className="w-4 h-4 mr-2" />}
                Excel
              </Button>
            </div>
          </div>

          {isLoading ? (
            <Card><CardContent className="flex items-center justify-center py-12"><IconLoader className="w-8 h-8 animate-spin text-muted-foreground" /></CardContent></Card>
          ) : quarterlyData?.quarterlyActivity ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>{t.ilpa.capitalCallsLabel}</CardDescription>
                    <CardTitle className="text-xl">{quarterlyData.quarterlyActivity.capitalCalls.count} ({formatCurrency(quarterlyData.quarterlyActivity.capitalCalls.totalAmount, currency)})</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>{t.ilpa.distributionsLabel}</CardDescription>
                    <CardTitle className="text-xl text-foreground">{quarterlyData.quarterlyActivity.distributions.count} ({formatCurrency(quarterlyData.quarterlyActivity.distributions.totalAmount, currency)})</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>{t.ilpa.netCashFlow}</CardDescription>
                    <CardTitle className="text-xl text-foreground">
                      {formatCurrency(quarterlyData.quarterlyActivity.netCashFlow, currency)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {quarterlyData.quarterlyActivity.capitalCalls.calls.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>{t.ilpa.capitalCallsThisQuarter}</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.ilpa.callNumber}</TableHead>
                          <TableHead>{t.ilpa.date}</TableHead>
                          <TableHead className="text-right">{t.ilpa.amount}</TableHead>
                          <TableHead>{t.ilpa.purpose}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quarterlyData.quarterlyActivity.capitalCalls.calls.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell>#{c.callNumber}</TableCell>
                            <TableCell>{formatDate(c.callDate)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(c.amount, currency)}</TableCell>
                            <TableCell>{c.purpose}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {quarterlyData.quarterlyActivity.distributions.distributions.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>{t.ilpa.distributionsThisQuarter}</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.ilpa.distNumber}</TableHead>
                          <TableHead>{t.ilpa.date}</TableHead>
                          <TableHead className="text-right">{t.ilpa.amount}</TableHead>
                          <TableHead>{t.ilpa.source}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quarterlyData.quarterlyActivity.distributions.distributions.map((d, i) => (
                          <TableRow key={i}>
                            <TableCell>#{d.distributionNumber}</TableCell>
                            <TableCell>{formatDate(d.distributionDate)}</TableCell>
                            <TableCell className="text-right font-medium text-foreground">{formatCurrency(d.amount, currency)}</TableCell>
                            <TableCell>{d.source}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card><CardContent className="text-center py-8"><p className="text-muted-foreground">{t.ilpa.selectQuarter}</p></CardContent></Card>
          )}
        </TabsContent>

        {/* CC&D Tab */}
        <TabsContent value="ccd" className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handleDownload('ccd', 'pdf')} disabled={downloadingFormat === 'ccd-pdf'}>
              {downloadingFormat === 'ccd-pdf' ? <IconLoader className="w-4 h-4 mr-2 animate-spin" /> : <IconDownload className="w-4 h-4 mr-2" />}
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload('ccd', 'excel')} disabled={downloadingFormat === 'ccd-excel'}>
              {downloadingFormat === 'ccd-excel' ? <IconLoader className="w-4 h-4 mr-2 animate-spin" /> : <IconFileSpreadsheet className="w-4 h-4 mr-2" />}
              Excel
            </Button>
          </div>

          {isLoading ? (
            <Card><CardContent className="flex items-center justify-center py-12"><IconLoader className="w-8 h-8 animate-spin text-muted-foreground" /></CardContent></Card>
          ) : ccdData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>{t.ilpa.totalCalled}</CardDescription>
                    <CardTitle className="text-xl">{formatCurrency(ccdData.capitalCalls.totalAmount, currency)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>{t.ilpa.totalDistributed}</CardDescription>
                    <CardTitle className="text-xl text-foreground">{formatCurrency(ccdData.distributions.totalAmount, currency)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>{t.ilpa.netPosition}</CardDescription>
                    <CardTitle className="text-xl text-purple-600">{formatCurrency(ccdData.netPosition, currency)}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>{t.ilpa.capitalCallsLabel} ({ccdData.capitalCalls.count})</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.ilpa.callNumber}</TableHead>
                        <TableHead>{t.ilpa.date}</TableHead>
                        <TableHead className="text-right">{t.ilpa.amount}</TableHead>
                        <TableHead>{t.ilpa.purpose}</TableHead>
                        <TableHead className="text-right">{t.ilpa.cumulative}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ccdData.capitalCalls.items.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell>#{c.callNumber}</TableCell>
                          <TableCell>{formatDate(c.callDate)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.amount, currency)}</TableCell>
                          <TableCell>{c.purpose}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(c.cumulativeCalled, currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>{t.ilpa.distributionsLabel} ({ccdData.distributions.count})</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.ilpa.distNumber}</TableHead>
                        <TableHead>{t.ilpa.date}</TableHead>
                        <TableHead className="text-right">{t.ilpa.amount}</TableHead>
                        <TableHead>{t.ilpa.source}</TableHead>
                        <TableHead className="text-right">{t.ilpa.cumulative}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ccdData.distributions.items.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell>#{d.distributionNumber}</TableCell>
                          <TableCell>{formatDate(d.distributionDate)}</TableCell>
                          <TableCell className="text-right text-foreground">{formatCurrency(d.amount, currency)}</TableCell>
                          <TableCell>{d.source}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(d.cumulativeDistributed, currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
