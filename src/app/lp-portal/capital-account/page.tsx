'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IconDownload, IconLoader } from '@tabler/icons-react'
import { toast } from 'sonner'
import { getAuthToken, logout } from '@/lib/auth-storage'
import { getApiUrl, API_CONFIG } from '@/lib/api-config'
import { formatCurrency } from '@/lib/format-utils'
import { useTranslation } from '@/hooks/useTranslation'

interface CapitalAccountData {
  investor: { id: string; name: string; email: string; commitment: number }
  structure: { id: string; name: string; currency: string }
  summary: {
    commitment: number; totalCalled: number; totalDistributed: number
    totalFees: number; totalVAT: number; uncalled: number
    netAccountValue: number; openingBalance: number; closingBalance: number
  }
  capitalCalls: Array<{ date: string; callNumber: string; principal: number; managementFee: number; vat: number; total: number }>
  distributions: Array<{ date: string; distributionNumber: string; returnOfCapital: number; income: number; capitalGain: number; total: number }>
}

interface Structure {
  id: string; name: string; currency: string
}

export default function LPCapitalAccountPage() {
  const router = useRouter()
  const [structures, setStructures] = useState<Structure[]>([])
  const [selectedStructure, setSelectedStructure] = useState('')
  const [period, setPeriod] = useState('ytd')
  const [accountData, setAccountData] = useState<CapitalAccountData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const { t, language } = useTranslation()

  useEffect(() => { fetchMyStructures() }, [])

  const getDateRange = (periodType: string) => {
    const now = new Date()
    const year = now.getFullYear()
    switch (periodType) {
      case 'q1': return { startDate: `${year}-01-01`, endDate: `${year}-03-31` }
      case 'q2': return { startDate: `${year}-04-01`, endDate: `${year}-06-30` }
      case 'q3': return { startDate: `${year}-07-01`, endDate: `${year}-09-30` }
      case 'q4': return { startDate: `${year}-10-01`, endDate: `${year}-12-31` }
      case 'ytd': return { startDate: `${year}-01-01`, endDate: now.toISOString().split('T')[0] }
      default: return { startDate: `${year}-01-01`, endDate: now.toISOString().split('T')[0] }
    }
  }

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
        fetchAccountData(myStructures[0].id, 'ytd')
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error fetching structures:', error)
      setIsLoading(false)
    }
  }

  const fetchAccountData = async (structureId: string, periodType: string) => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      // Use 'me' as investor ID - the API will resolve from token
      const { startDate, endDate } = getDateRange(periodType)
      const url = getApiUrl(API_CONFIG.endpoints.getCapitalAccountData('me'))
        + `?structureId=${structureId}&startDate=${startDate}&endDate=${endDate}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })

      if (response.status === 401) { logout(); router.push('/sign-in'); return }
      if (!response.ok) throw new Error('Failed to fetch data')

      const data = await response.json()
      setAccountData(data.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error(t.lpCapitalAccount.failedToLoadCapitalAccount)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedStructure) return
    setIsDownloading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      const { startDate, endDate } = getDateRange(period)
      const url = getApiUrl(API_CONFIG.endpoints.getCapitalAccountStatement('me'))
        + `?structureId=${selectedStructure}&startDate=${startDate}&endDate=${endDate}`

      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `Capital_Account_Statement.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success(t.lpCapitalAccount.statementDownloaded)
    } catch (error) {
      toast.error(t.lpCapitalAccount.failedToDownloadStatement)
    } finally {
      setIsDownloading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'spanish' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const currency = accountData?.structure?.currency || 'USD'

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.lpCapitalAccount.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.lpCapitalAccount.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStructure} onValueChange={(v) => { setSelectedStructure(v); fetchAccountData(v, period) }}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder={t.lpCapitalAccount.selectFund} /></SelectTrigger>
            <SelectContent>
              {structures.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(v) => { setPeriod(v); if (selectedStructure) fetchAccountData(selectedStructure, v) }}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="q1">Q1</SelectItem>
              <SelectItem value="q2">Q2</SelectItem>
              <SelectItem value="q3">Q3</SelectItem>
              <SelectItem value="q4">Q4</SelectItem>
              <SelectItem value="ytd">{t.lpCapitalAccount.yearToDate}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleDownloadPDF} disabled={isDownloading || !accountData}>
            {isDownloading ? <IconLoader className="w-4 h-4 mr-2 animate-spin" /> : <IconDownload className="w-4 h-4 mr-2" />}
            {t.lpCapitalAccount.downloadPDF}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="flex items-center justify-center py-12"><IconLoader className="w-8 h-8 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : accountData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardHeader className="pb-3"><CardDescription>{t.lpCapitalAccount.commitment}</CardDescription><CardTitle className="text-xl">{formatCurrency(accountData.summary.commitment, currency)}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-3"><CardDescription>{t.lpCapitalAccount.totalCalled}</CardDescription><CardTitle className="text-xl">{formatCurrency(accountData.summary.totalCalled, currency)}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-3"><CardDescription>{t.lpCapitalAccount.totalDistributed}</CardDescription><CardTitle className="text-xl text-green-600">{formatCurrency(accountData.summary.totalDistributed, currency)}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-3"><CardDescription>{t.lpCapitalAccount.netAccount}</CardDescription><CardTitle className="text-xl text-purple-600">{formatCurrency(accountData.summary.netAccountValue, currency)}</CardTitle></CardHeader></Card>
          </div>

          {accountData.capitalCalls.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{t.lpCapitalAccount.capitalCalls}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>{t.lpCapitalAccount.date}</TableHead><TableHead>{t.lpCapitalAccount.callNumber}</TableHead>
                    <TableHead className="text-right">{t.lpCapitalAccount.principal}</TableHead><TableHead className="text-right">{t.lpCapitalAccount.fee}</TableHead>
                    <TableHead className="text-right">{t.lpCapitalAccount.total}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {accountData.capitalCalls.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatDate(c.date)}</TableCell>
                        <TableCell>#{c.callNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrency(c.principal, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(c.managementFee, currency)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(c.total, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {accountData.distributions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{t.lpCapitalAccount.distributions}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>{t.lpCapitalAccount.date}</TableHead><TableHead>{t.lpCapitalAccount.distNumber}</TableHead>
                    <TableHead className="text-right">{t.lpCapitalAccount.roc}</TableHead><TableHead className="text-right">{t.lpCapitalAccount.income}</TableHead>
                    <TableHead className="text-right">{t.lpCapitalAccount.total}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {accountData.distributions.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatDate(d.date)}</TableCell>
                        <TableCell>#{d.distributionNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.returnOfCapital, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.income, currency)}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">{formatCurrency(d.total, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card><CardContent className="text-center py-12"><p className="text-muted-foreground">{t.lpCapitalAccount.noData}</p></CardContent></Card>
      )}
    </div>
  )
}
