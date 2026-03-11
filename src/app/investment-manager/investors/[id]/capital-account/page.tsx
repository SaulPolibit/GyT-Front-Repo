'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IconArrowLeft, IconDownload, IconLoader } from '@tabler/icons-react'
import { toast } from 'sonner'
import { getAuthToken, logout } from '@/lib/auth-storage'
import { getApiUrl, API_CONFIG } from '@/lib/api-config'
import { formatCurrency } from '@/lib/format-utils'
import { useTranslation } from '@/hooks/useTranslation'

interface CapitalAccountData {
  investor: { id: string; name: string; email: string; commitment: number }
  structure: { id: string; name: string; currency: string }
  summary: {
    commitment: number
    totalCalled: number
    totalDistributed: number
    totalFees: number
    totalVAT: number
    uncalled: number
    netAccountValue: number
    openingBalance: number
    closingBalance: number
  }
  capitalCalls: Array<{
    date: string
    callNumber: string
    principal: number
    managementFee: number
    vat: number
    total: number
  }>
  distributions: Array<{
    date: string
    distributionNumber: string
    returnOfCapital: number
    income: number
    capitalGain: number
    total: number
  }>
}

interface Structure {
  id: string
  name: string
  currency: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InvestorCapitalAccountPage({ params }: PageProps) {
  const router = useRouter()
  const { t, language } = useTranslation()
  const [investorId, setInvestorId] = useState('')
  const [structures, setStructures] = useState<Structure[]>([])
  const [selectedStructure, setSelectedStructure] = useState('')
  const [period, setPeriod] = useState('ytd')
  const [accountData, setAccountData] = useState<CapitalAccountData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    params.then(p => {
      setInvestorId(p.id)
      fetchStructures(p.id)
    })
  }, [params])

  const getDateRange = (periodType: string) => {
    const now = new Date()
    const year = now.getFullYear()
    switch (periodType) {
      case 'q1': return { startDate: `${year}-01-01`, endDate: `${year}-03-31` }
      case 'q2': return { startDate: `${year}-04-01`, endDate: `${year}-06-30` }
      case 'q3': return { startDate: `${year}-07-01`, endDate: `${year}-09-30` }
      case 'q4': return { startDate: `${year}-10-01`, endDate: `${year}-12-31` }
      case 'ytd': return { startDate: `${year}-01-01`, endDate: now.toISOString().split('T')[0] }
      case 'annual': return { startDate: `${year - 1}-01-01`, endDate: `${year - 1}-12-31` }
      default: return { startDate: `${year}-01-01`, endDate: now.toISOString().split('T')[0] }
    }
  }

  const fetchStructures = async (invId: string) => {
    try {
      const token = getAuthToken()
      if (!token) return

      // Fetch investor's structures
      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.getInvestorWithStructures(invId)),
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )

      if (response.status === 401) { logout(); router.push('/sign-in'); return }
      if (!response.ok) throw new Error('Failed to fetch investor data')

      const data = await response.json()
      const investorStructures = data.data?.structures || []
      setStructures(investorStructures)

      if (investorStructures.length > 0) {
        setSelectedStructure(investorStructures[0].id)
        fetchAccountData(invId, investorStructures[0].id, 'ytd')
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error fetching structures:', error)
      setIsLoading(false)
    }
  }

  const fetchAccountData = async (invId: string, structureId: string, periodType: string) => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      const { startDate, endDate } = getDateRange(periodType)
      const url = getApiUrl(API_CONFIG.endpoints.getCapitalAccountData(invId))
        + `?structureId=${structureId}&startDate=${startDate}&endDate=${endDate}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })

      if (response.status === 401) { logout(); router.push('/sign-in'); return }
      if (!response.ok) throw new Error('Failed to fetch capital account data')

      const data = await response.json()
      setAccountData(data.data)
    } catch (error) {
      console.error('Error fetching account data:', error)
      toast.error('Failed to load capital account data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedStructure || !investorId) return
    setIsDownloading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      const { startDate, endDate } = getDateRange(period)
      const url = getApiUrl(API_CONFIG.endpoints.getCapitalAccountStatement(investorId))
        + `?structureId=${selectedStructure}&startDate=${startDate}&endDate=${endDate}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

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

      toast.success('Capital account statement downloaded')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download statement')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleStructureChange = (value: string) => {
    setSelectedStructure(value)
    fetchAccountData(investorId, value, period)
  }

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    if (selectedStructure) {
      fetchAccountData(investorId, selectedStructure, value)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'spanish' ? 'es-ES' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const currency = accountData?.structure?.currency || 'USD'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <IconArrowLeft className="w-4 h-4 mr-2" />
            {t.capitalAccount.back}
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t.capitalAccount.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {accountData?.investor?.name || 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStructure} onValueChange={handleStructureChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select structure" />
            </SelectTrigger>
            <SelectContent>
              {structures.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t.capitalAccount.selectPeriod} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q1">{t.capitalAccount.q1}</SelectItem>
              <SelectItem value="q2">{t.capitalAccount.q2}</SelectItem>
              <SelectItem value="q3">{t.capitalAccount.q3}</SelectItem>
              <SelectItem value="q4">{t.capitalAccount.q4}</SelectItem>
              <SelectItem value="ytd">{t.capitalAccount.yearToDate}</SelectItem>
              <SelectItem value="annual">{t.capitalAccount.lastYear}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleDownloadPDF} disabled={isDownloading || !accountData}>
            {isDownloading ? (
              <><IconLoader className="w-4 h-4 mr-2 animate-spin" />{t.capitalAccount.generating}</>
            ) : (
              <><IconDownload className="w-4 h-4 mr-2" />{t.capitalAccount.downloadPdf}</>
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
      ) : accountData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.capitalAccount.commitment}</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(accountData.summary.commitment, currency)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.capitalAccount.totalCalled}</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(accountData.summary.totalCalled, currency)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.capitalAccount.totalDistributed}</CardDescription>
                <CardTitle className="text-2xl text-green-600">{formatCurrency(accountData.summary.totalDistributed, currency)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.capitalAccount.uncalled}</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(accountData.summary.uncalled, currency)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t.capitalAccount.netAccountValue}</CardDescription>
                <CardTitle className="text-2xl text-purple-600">{formatCurrency(accountData.summary.netAccountValue, currency)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Capital Call Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t.capitalAccount.capitalCallActivity}</CardTitle>
              <CardDescription>{accountData.capitalCalls.length} {t.capitalAccount.callsInPeriod}</CardDescription>
            </CardHeader>
            <CardContent>
              {accountData.capitalCalls.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.capitalAccount.date}</TableHead>
                      <TableHead>{t.capitalAccount.callNumber}</TableHead>
                      <TableHead className="text-right">{t.capitalAccount.principal}</TableHead>
                      <TableHead className="text-right">{t.capitalAccount.mgmtFee}</TableHead>
                      <TableHead className="text-right">{t.capitalAccount.vat}</TableHead>
                      <TableHead className="text-right">{t.capitalAccount.total}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountData.capitalCalls.map((call, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatDate(call.date)}</TableCell>
                        <TableCell>#{call.callNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrency(call.principal, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(call.managementFee, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(call.vat, currency)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(call.total, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t.capitalAccount.noCapitalCalls}</p>
              )}
            </CardContent>
          </Card>

          {/* Distribution Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t.capitalAccount.distributionActivity}</CardTitle>
              <CardDescription>{accountData.distributions.length} {t.capitalAccount.distributionsInPeriod}</CardDescription>
            </CardHeader>
            <CardContent>
              {accountData.distributions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.capitalAccount.date}</TableHead>
                      <TableHead>{t.capitalAccount.distNumber}</TableHead>
                      <TableHead className="text-right">{t.capitalAccount.returnOfCapital}</TableHead>
                      <TableHead className="text-right">{t.capitalAccount.income}</TableHead>
                      <TableHead className="text-right">{t.capitalAccount.capitalGain}</TableHead>
                      <TableHead className="text-right">{t.capitalAccount.total}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountData.distributions.map((dist, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatDate(dist.date)}</TableCell>
                        <TableCell>#{dist.distributionNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dist.returnOfCapital, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dist.income, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dist.capitalGain, currency)}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">{formatCurrency(dist.total, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t.capitalAccount.noDistributions}</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">{t.capitalAccount.noDataAvailable}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
