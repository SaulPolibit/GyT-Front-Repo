'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IconArrowLeft, IconDownload, IconLoader, IconFileSpreadsheet } from '@tabler/icons-react'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'
import { getAuthToken, logout } from '@/lib/auth-storage'
import { getApiUrl, API_CONFIG } from '@/lib/api-config'
import { formatCurrency } from '@/lib/format-utils'

interface FeeReportData {
  structure: { id: string; name: string; currency: string }
  period: { startDate: string; endDate: string }
  summary: {
    totalFeesGross: number
    totalDiscounts: number
    totalFeesNet: number
    totalVAT: number
    totalFeesCollected: number
  }
  investors: Array<{
    investorId: string
    investorName: string
    commitment: number
    grossFee: number
    discount: number
    netFee: number
    vat: number
    total: number
    nicFeeAmount?: number
    unfundedFeeAmount?: number
    feeOffsetAmount?: number
    callCount: number
  }>
  isDualRate: boolean
}

interface Structure {
  id: string
  name: string
}

export default function FeeReportPage() {
  const router = useRouter()
  const { t, language } = useTranslation()
  const [structures, setStructures] = useState<Structure[]>([])
  const [selectedStructure, setSelectedStructure] = useState('')
  const [period, setPeriod] = useState('ytd')
  const [feeData, setFeeData] = useState<FeeReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null)

  useEffect(() => {
    fetchStructures()
  }, [])

  const getDateRange = (periodType: string) => {
    const now = new Date()
    const year = now.getFullYear()
    switch (periodType) {
      case 'q1': return { startDate: `${year}-01-01`, endDate: `${year}-03-31` }
      case 'q2': return { startDate: `${year}-04-01`, endDate: `${year}-06-30` }
      case 'q3': return { startDate: `${year}-07-01`, endDate: `${year}-09-30` }
      case 'q4': return { startDate: `${year}-10-01`, endDate: `${year}-12-31` }
      case 'ytd': return { startDate: `${year}-01-01`, endDate: now.toISOString().split('T')[0] }
      case 'all': return { startDate: '', endDate: '' }
      default: return { startDate: `${year}-01-01`, endDate: now.toISOString().split('T')[0] }
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
      const structureList = data.data || []
      setStructures(structureList)

      if (structureList.length > 0) {
        setSelectedStructure(structureList[0].id)
        fetchFeeData(structureList[0].id, 'ytd')
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error fetching structures:', error)
      setIsLoading(false)
    }
  }

  const fetchFeeData = async (structureId: string, periodType: string) => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      const { startDate, endDate } = getDateRange(periodType)
      let url = getApiUrl(API_CONFIG.endpoints.getFeeReportData(structureId))
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })

      if (response.status === 401) { logout(); router.push('/sign-in'); return }
      if (!response.ok) throw new Error('Failed to fetch fee data')

      const data = await response.json()
      setFeeData(data.data)
    } catch (error) {
      console.error('Error fetching fee data:', error)
      toast.error('Failed to load fee report data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (format: 'pdf' | 'excel') => {
    if (!selectedStructure) return
    setDownloadingFormat(format)
    try {
      const token = getAuthToken()
      if (!token) return

      const { startDate, endDate } = getDateRange(period)
      let url = getApiUrl(API_CONFIG.endpoints.generateFeeReport(selectedStructure))
      const params = new URLSearchParams({ format })
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      url += `?${params.toString()}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error(`Failed to generate ${format.toUpperCase()}`)

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `Fee_Report.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      toast.success(`Fee report ${format.toUpperCase()} downloaded`)
    } catch (error) {
      console.error(`Error downloading ${format}:`, error)
      toast.error(`Failed to download ${format.toUpperCase()}`)
    } finally {
      setDownloadingFormat(null)
    }
  }

  const handleStructureChange = (value: string) => {
    setSelectedStructure(value)
    fetchFeeData(value, period)
  }

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    if (selectedStructure) fetchFeeData(selectedStructure, value)
  }

  const currency = feeData?.structure?.currency || 'USD'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <IconArrowLeft className="w-4 h-4 mr-2" />
            {t.feesReport.back}
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t.feesReport.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.feesReport.ilpaTransparency}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStructure} onValueChange={handleStructureChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t.feesReport.selectStructure} />
            </SelectTrigger>
            <SelectContent>
              {structures.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t.feesReport.period} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q1">{t.feesReport.q1}</SelectItem>
              <SelectItem value="q2">{t.feesReport.q2}</SelectItem>
              <SelectItem value="q3">{t.feesReport.q3}</SelectItem>
              <SelectItem value="q4">{t.feesReport.q4}</SelectItem>
              <SelectItem value="ytd">{t.feesReport.yearToDate}</SelectItem>
              <SelectItem value="all">{t.feesReport.allTime}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleDownload('pdf')} disabled={downloadingFormat === 'pdf' || !feeData}>
            {downloadingFormat === 'pdf' ? (
              <><IconLoader className="w-4 h-4 mr-2 animate-spin" />{t.feesReport.pdfGenerating}</>
            ) : (
              <><IconDownload className="w-4 h-4 mr-2" />{t.feesReport.pdf}</>
            )}
          </Button>
          <Button variant="outline" onClick={() => handleDownload('excel')} disabled={downloadingFormat === 'excel' || !feeData}>
            {downloadingFormat === 'excel' ? (
              <><IconLoader className="w-4 h-4 mr-2 animate-spin" />{t.feesReport.excelGenerating}</>
            ) : (
              <><IconFileSpreadsheet className="w-4 h-4 mr-2" />{t.feesReport.excel}</>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <IconLoader className="w-8 h-8 text-muted-foreground animate-spin" />
          </CardContent>
        </Card>
      ) : feeData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.feesReport.totalFeesGross}</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(feeData.summary.totalFeesGross, currency)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.feesReport.totalDiscounts}</CardDescription>
                <CardTitle className="text-2xl text-orange-600">-{formatCurrency(feeData.summary.totalDiscounts, currency)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.feesReport.totalVat}</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(feeData.summary.totalVAT, currency)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.feesReport.netFeesCollected}</CardDescription>
                <CardTitle className="text-2xl text-purple-600">{formatCurrency(feeData.summary.totalFeesCollected, currency)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Per-Investor Fee Detail */}
          <Card>
            <CardHeader>
              <CardTitle>{t.feesReport.perInvestorBreakdown}</CardTitle>
              <CardDescription>{feeData.investors.length} {t.feesReport.investorCount}</CardDescription>
            </CardHeader>
            <CardContent>
              {feeData.investors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.feesReport.investor}</TableHead>
                      <TableHead className="text-right">{t.feesReport.commitment}</TableHead>
                      {feeData.isDualRate && (
                        <>
                          <TableHead className="text-right">{t.feesReport.nicFee}</TableHead>
                          <TableHead className="text-right">{t.feesReport.unfundedFee}</TableHead>
                        </>
                      )}
                      <TableHead className="text-right">{t.feesReport.grossFee}</TableHead>
                      <TableHead className="text-right">{t.feesReport.discount}</TableHead>
                      <TableHead className="text-right">{t.feesReport.netFee}</TableHead>
                      <TableHead className="text-right">{t.feesReport.vat}</TableHead>
                      <TableHead className="text-right">{t.feesReport.total}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeData.investors.map((inv) => (
                      <TableRow key={inv.investorId}>
                        <TableCell className="font-medium">{inv.investorName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(inv.commitment, currency)}</TableCell>
                        {feeData.isDualRate && (
                          <>
                            <TableCell className="text-right">{formatCurrency(inv.nicFeeAmount || 0, currency)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(inv.unfundedFeeAmount || 0, currency)}</TableCell>
                          </>
                        )}
                        <TableCell className="text-right">{formatCurrency(inv.grossFee, currency)}</TableCell>
                        <TableCell className="text-right text-orange-600">
                          {inv.discount > 0 ? `-${formatCurrency(inv.discount, currency)}` : '$0'}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(inv.netFee, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(inv.vat, currency)}</TableCell>
                        <TableCell className="text-right font-medium text-purple-600">{formatCurrency(inv.total, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t.feesReport.noFeeData}</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">{t.feesReport.selectStructure}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
