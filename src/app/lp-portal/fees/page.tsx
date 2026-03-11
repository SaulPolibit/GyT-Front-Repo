'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IconLoader } from '@tabler/icons-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format-utils'
import { getAuthToken, logout } from '@/lib/auth-storage'
import { getApiUrl, API_CONFIG } from '@/lib/api-config'
import { usePlatformCurrency } from '@/hooks/use-swr-hooks'
import { useTranslation } from '@/hooks/useTranslation'

interface FeeDetail {
  callNumber: string
  callDate: string
  principal: number
  managementFeeGross: number
  managementFeeDiscount: number
  managementFeeNet: number
  vatAmount: number
  totalDue: number
}

interface FeeSummary {
  totalGross: number
  totalDiscount: number
  totalNet: number
  totalVAT: number
  totalDue: number
}

interface Structure {
  id: string; name: string; currency?: string
}

export default function LPFeesPage() {
  const router = useRouter()
  const { currency: platformCurrency } = usePlatformCurrency()
  const [structures, setStructures] = useState<Structure[]>([])
  const [selectedStructure, setSelectedStructure] = useState('')
  const [fees, setFees] = useState<FeeDetail[]>([])
  const [summary, setSummary] = useState<FeeSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
        fetchFeeData(myStructures[0].id)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      setIsLoading(false)
    }
  }

  const fetchFeeData = async (structureId: string) => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      const url = getApiUrl(API_CONFIG.endpoints.getInvestorFeeDetail(structureId, 'me'))
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })

      if (response.status === 401) { logout(); router.push('/sign-in'); return }
      if (!response.ok) throw new Error('Failed to fetch fee data')

      const data = await response.json()
      setFees(data.data?.fees || [])
      setSummary(data.data?.summary || null)
    } catch (error) {
      console.error('Error:', error)
      toast.error(t.lpFees.failedToLoadFeeData)
    } finally {
      setIsLoading(false)
    }
  }

  // Use selected structure's currency if available, otherwise platform currency
  const selectedStructureData = structures.find(s => s.id === selectedStructure)
  const currency = selectedStructureData?.currency || platformCurrency

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'spanish' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.lpFees.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.lpFees.subtitle}</p>
        </div>
        <Select value={selectedStructure} onValueChange={(v) => { setSelectedStructure(v); fetchFeeData(v) }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder={t.lpFees.selectFund} /></SelectTrigger>
          <SelectContent>
            {structures.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card><CardContent className="flex items-center justify-center py-12"><IconLoader className="w-8 h-8 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardHeader className="pb-3"><CardDescription>{t.lpFees.totalFeesGross}</CardDescription><CardTitle className="text-xl">{formatCurrency(summary.totalGross, currency)}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-3"><CardDescription>{t.lpFees.totalDiscounts}</CardDescription><CardTitle className="text-xl text-orange-600">-{formatCurrency(summary.totalDiscount, currency)}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-3"><CardDescription>{t.lpFees.totalVAT}</CardDescription><CardTitle className="text-xl">{formatCurrency(summary.totalVAT, currency)}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-3"><CardDescription>{t.lpFees.totalFeesPaid}</CardDescription><CardTitle className="text-xl text-purple-600">{formatCurrency(summary.totalNet + summary.totalVAT, currency)}</CardTitle></CardHeader></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t.lpFees.feeHistory}</CardTitle>
              <CardDescription>{fees.length} {t.lpFees.capitalCallsSuffix}</CardDescription>
            </CardHeader>
            <CardContent>
              {fees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.lpFees.callNumber}</TableHead>
                      <TableHead>{t.lpFees.date}</TableHead>
                      <TableHead className="text-right">{t.lpFees.grossFee}</TableHead>
                      <TableHead className="text-right">{t.lpFees.discount}</TableHead>
                      <TableHead className="text-right">{t.lpFees.netFee}</TableHead>
                      <TableHead className="text-right">{t.lpFees.vat}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.map((fee, i) => (
                      <TableRow key={i}>
                        <TableCell>#{fee.callNumber}</TableCell>
                        <TableCell>{formatDate(fee.callDate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(fee.managementFeeGross, currency)}</TableCell>
                        <TableCell className="text-right text-orange-600">
                          {fee.managementFeeDiscount > 0 ? `-${formatCurrency(fee.managementFeeDiscount, currency)}` : formatCurrency(0, currency)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(fee.managementFeeNet, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(fee.vatAmount, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t.lpFees.noFeeHistory}</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card><CardContent className="text-center py-12"><p className="text-muted-foreground">{t.lpFees.noFeeData}</p></CardContent></Card>
      )}
    </div>
  )
}
