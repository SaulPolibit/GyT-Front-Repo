'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { IconArrowLeft, IconDownload, IconCircleCheck, IconBuildingBank } from '@tabler/icons-react'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getCurrentUser, getAuthToken, logout } from '@/lib/auth-storage'

export default function CapitalCallSummaryPage() {
  const router = useRouter()
  const params = useParams()
  const [capitalCall, setCapitalCall] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCapitalCallData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const loadCapitalCallData = async () => {
    setLoading(true)

    try {
      const user = getCurrentUser()
      const token = getAuthToken()

      if (!user || !token) {
        console.error('[Summary] No user or token found')
        router.push('/lp-portal/capital-calls')
        return
      }

      // Fetch capital calls from API
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getMyCapitalCalls), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {

        // Check if it's an expired token error
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Account] 401 Unauthorized - clearing session and redirecting to login')
            logout()
            router.push('/lp-portal/login')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

      if (!response.ok) {
        console.error('[Summary] Failed to fetch capital calls:', response.status)
        router.push('/lp-portal/capital-calls')
        return
      }

      const responseData = await response.json()

      if (!responseData.success || !responseData.data) {
        console.error('[Summary] Invalid API response')
        router.push('/lp-portal/capital-calls')
        return
      }

      // Find the specific capital call by ID
      const calls = responseData.data.capitalCalls || []
      const call = calls.find((c: any) => c.id === params.id)

      if (!call) {
        console.error('[Summary] Capital call not found:', params.id)
        router.push('/lp-portal/capital-calls')
        return
      }

      setCapitalCall(call)
    } catch (error) {
      console.error('[Summary] Error loading capital call:', error)
      router.push('/lp-portal/capital-calls')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading || !capitalCall) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transaction details...</p>
        </div>
      </div>
    )
  }

  const isPaid = capitalCall.status === 'Paid'

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <IconArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Transaction Summary</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {capitalCall.callNumber} - {capitalCall.structureName}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Status Banner */}
      {isPaid && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IconCircleCheck className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">Payment Completed</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                  Your payment was successfully processed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Capital Call Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capital Call Information</CardTitle>
            <CardDescription>Details of this capital call request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fund</p>
                <p className="text-sm font-medium">{capitalCall.structureName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Call Number</p>
                <p className="text-sm font-medium">{capitalCall.callNumber}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Call Date</p>
                <p className="text-sm font-medium">{formatDate(capitalCall.callDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                <p className="text-sm font-medium">{formatDate(capitalCall.dueDate)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-1">Purpose</p>
              <p className="text-sm">{capitalCall.purpose || 'N/A'}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge variant={isPaid ? 'default' : 'secondary'}>{capitalCall.status}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Summary</CardTitle>
            <CardDescription>Your payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Allocated Amount</span>
                <span className="text-sm font-semibold">{formatCurrency(capitalCall.allocatedAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(capitalCall.paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Outstanding</span>
                <span className="text-sm font-semibold text-orange-600">{formatCurrency(capitalCall.outstanding)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start items-center">
        <Button variant="outline" onClick={() => router.push('/lp-portal/capital-calls')}>
          Back to Capital Calls
        </Button>
      </div>
    </div>
  )
}
