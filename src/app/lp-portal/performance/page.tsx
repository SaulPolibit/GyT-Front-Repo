'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconDownload, IconLoader } from '@tabler/icons-react'
import { toast } from 'sonner'
import { getAuthToken, logout } from '@/lib/auth-storage'
import { getApiUrl, API_CONFIG } from '@/lib/api-config'
import { formatCurrency } from '@/lib/format-utils'
import { useTranslation } from '@/hooks/useTranslation'

interface PerformanceData {
  fundInfo: {
    id: string; name: string; currency: string; totalCommitment: number; investorCount: number
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
  asOfDate: string
}

interface Structure {
  id: string; name: string
}

export default function LPPerformancePage() {
  const router = useRouter()
  const [structures, setStructures] = useState<Structure[]>([])
  const [selectedStructure, setSelectedStructure] = useState('')
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const { t, language } = useTranslation()

  useEffect(() => { fetchMyStructures() }, [])

  const fetchMyStructures = async () => {
    try {
      const token = getAuthToken()
      if (!token) { setIsLoading(false); return }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.getMyInvestorWithStructures),
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )

      if (response.status === 401) { logout(); router.push('/sign-in'); return }
      if (!response.ok) { setIsLoading(false); return }

      const data = await response.json()
      const myStructures = data.data?.structures || []
      setStructures(myStructures)

      if (myStructures.length > 0) {
        setSelectedStructure(myStructures[0].id)
        fetchPerformance(myStructures[0].id)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
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
      if (!response.ok) throw new Error('Failed to fetch performance')

      const data = await response.json()
      setPerformanceData(data.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error(t.lpPerformance.failedToLoadPerformance)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!selectedStructure) return
    setIsDownloading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      const url = getApiUrl(API_CONFIG.endpoints.getILPAPerformanceReport(selectedStructure)) + '?format=pdf'
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })

      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = 'ILPA_Performance_Report.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success(t.lpPerformance.reportDownloaded)
    } catch (error) {
      toast.error(t.lpPerformance.failedToDownloadReport)
    } finally {
      setIsDownloading(false)
    }
  }

  const currency = performanceData?.fundInfo?.currency || 'USD'

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.lpPerformance.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {performanceData ? `${t.lpPerformance.asOf} ${new Date(performanceData.asOfDate).toLocaleDateString(language === 'spanish' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : t.lpPerformance.loading}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStructure} onValueChange={(v) => { setSelectedStructure(v); fetchPerformance(v) }}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder={t.lpPerformance.selectFund} /></SelectTrigger>
            <SelectContent>
              {structures.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button onClick={handleDownload} disabled={isDownloading || !performanceData}>
            {isDownloading ? <IconLoader className="w-4 h-4 mr-2 animate-spin" /> : <IconDownload className="w-4 h-4 mr-2" />}
            {t.lpPerformance.downloadReport}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="flex items-center justify-center py-12"><IconLoader className="w-8 h-8 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : performanceData ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.lpPerformance.grossIRR}</CardDescription>
                <CardTitle className={`text-2xl ${performanceData.performance.grossIRR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {performanceData.performance.grossIRR}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.lpPerformance.tvpi}</CardDescription>
                <CardTitle className="text-2xl">{performanceData.performance.grossTVPI}x</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.lpPerformance.dpi}</CardDescription>
                <CardTitle className="text-2xl">{performanceData.performance.dpi}x</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.lpPerformance.rvpi}</CardDescription>
                <CardTitle className="text-2xl">{performanceData.performance.rvpi}x</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Performance Metrics */}
            <Card>
              <CardHeader><CardTitle>{t.lpPerformance.performanceMetrics}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.grossIRR}</span><Badge variant="outline">{performanceData.performance.grossIRR}%</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.netIRR}</span><Badge variant="outline">{performanceData.performance.netIRR}%</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.grossTVPI}</span><Badge variant="outline">{performanceData.performance.grossTVPI}x</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.netTVPI}</span><Badge variant="outline">{performanceData.performance.netTVPI}x</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.dpi}</span><Badge variant="outline">{performanceData.performance.dpi}x</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.rvpi}</span><Badge variant="outline">{performanceData.performance.rvpi}x</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.moic}</span><Badge variant="outline">{performanceData.performance.moic}x</Badge></div>
              </CardContent>
            </Card>

            {/* Capital Summary */}
            <Card>
              <CardHeader><CardTitle>{t.lpPerformance.capitalSummary}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.totalCommitment}</span><span className="font-medium">{formatCurrency(performanceData.capitalSummary.totalCommitment, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.capitalCalled}</span><span className="font-medium">{formatCurrency(performanceData.capitalSummary.totalCapitalCalled, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.paidInRatio}</span><span className="font-medium">{performanceData.capitalSummary.paidInRatio}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.totalDistributed}</span><span className="font-medium text-green-600">{formatCurrency(performanceData.capitalSummary.totalDistributed, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.uncalledCapital}</span><span className="font-medium">{formatCurrency(performanceData.capitalSummary.uncalled, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.currentNAV}</span><span className="font-medium text-purple-600">{formatCurrency(performanceData.capitalSummary.currentNAV, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.lpPerformance.totalValue}</span><span className="font-semibold">{formatCurrency(performanceData.capitalSummary.totalValue, currency)}</span></div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card><CardContent className="text-center py-12"><p className="text-muted-foreground">{t.lpPerformance.noPerformanceData}</p></CardContent></Card>
      )}
    </div>
  )
}
