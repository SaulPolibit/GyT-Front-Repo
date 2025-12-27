'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconTrendingDown, IconFileText, IconSend, IconClock, IconCircleCheck, IconAlertCircle, IconCircleX, IconEye } from '@tabler/icons-react'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthState, logout } from '@/lib/auth-storage'
import { useRouter } from 'next/navigation'

interface InvestorCapitalCall {
  id: string
  structureName: string
  structureId: string
  callNumber: string
  callDate: string
  dueDate: string
  status: string
  allocatedAmount: number
  paidAmount: number
  outstanding: number
  purpose: string
}

export default function LPCapitalCallsPage() {
  const router = useRouter()
  const [capitalCalls, setCapitalCalls] = useState<InvestorCapitalCall[]>([])
  const [summary, setSummary] = useState({
    totalCalled: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalCalls: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()

    // Reload data when page becomes visible (e.g., navigating back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }

    const handleFocus = () => {
      loadData()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)

    try {
      // Get auth token from localStorage
      const authState = getAuthState()

      if (!authState.isLoggedIn || !authState.token) {
        console.error('No auth token found')
        setLoading(false)
        return
      }

      const token = authState.token

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch capital calls (includes both summary and calls in one response)
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getMyCapitalCalls), {
        headers
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
        console.error('Failed to fetch capital calls:', response.status)
        throw new Error('Failed to fetch capital calls')
      }

      const responseData = await response.json()
      console.log('Capital calls API response:', responseData)

      if (responseData.success && responseData.data) {
        // Extract summary data
        if (responseData.data.summary) {
          setSummary({
            totalCalled: responseData.data.summary.totalCalled || 0,
            totalPaid: responseData.data.summary.totalPaid || 0,
            totalOutstanding: responseData.data.summary.outstanding || 0,
            totalCalls: responseData.data.summary.totalCalls || 0
          })
        }

        // Extract capital calls array
        const calls = Array.isArray(responseData.data.capitalCalls) ? responseData.data.capitalCalls : []
        console.log('Setting capital calls:', calls)
        setCapitalCalls(calls)
      } else {
        console.error('API returned success: false', responseData)
        setCapitalCalls([])
      }

    } catch (error) {
      console.error('Error loading capital calls data:', error)
      setCapitalCalls([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    type IconComponent = React.ComponentType<{ className?: string }>
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: IconComponent }> = {
      'Draft': { variant: 'secondary', icon: IconFileText },
      'Sent': { variant: 'default', icon: IconSend },
      'Pending': { variant: 'outline', icon: IconClock },
      'Paid': { variant: 'default', icon: IconCircleCheck },
      'Overdue': { variant: 'destructive', icon: IconAlertCircle },
      'Cancelled': { variant: 'secondary', icon: IconCircleX },
    }

    const config = statusConfig[status] || { variant: 'secondary' as const, icon: IconFileText }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    )
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
      month: 'short',
      day: 'numeric',
    })
  }

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'Paid' && status !== 'Cancelled'
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Capital Calls</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and respond to capital calls from your funds
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading capital calls...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Called</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {formatCurrency(summary.totalCalled)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Paid</CardDescription>
            <CardTitle className="text-2xl font-semibold text-green-600">
              {formatCurrency(summary.totalPaid)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Outstanding</CardDescription>
            <CardTitle className="text-2xl font-semibold text-orange-600">
              {formatCurrency(summary.totalOutstanding)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Calls</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {summary.totalCalls}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Capital Calls Grid */}
      {capitalCalls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconTrendingDown className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Capital Calls</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              You don&apos;t have any capital calls yet. Capital calls will appear here when your fund managers request capital.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capitalCalls.map((call) => {
            const overdue = isOverdue(call.dueDate, call.status)

            return (
              <Card key={call.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold">
                        {call.structureName}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {call.callNumber}
                      </CardDescription>
                    </div>
                    {getStatusBadge(overdue && call.status !== 'Paid' ? 'Overdue' : call.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Call Date</p>
                      <p className="text-sm font-medium">{formatDate(call.callDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm font-medium">{formatDate(call.dueDate)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">My Amount</span>
                      <span className="text-sm font-semibold">{formatCurrency(call.allocatedAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Paid</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(call.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Outstanding</span>
                      <span className="text-sm font-medium text-orange-600">{formatCurrency(call.outstanding)}</span>
                    </div>
                  </div>

                  {call.purpose && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Purpose</p>
                      <p className="text-sm">{call.purpose}</p>
                    </div>
                  )}

                  {overdue && call.status !== 'Paid' && (
                    <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                      <IconAlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-red-900 dark:text-red-100">
                        <strong>Payment Overdue</strong>
                        <p className="text-red-700 dark:text-red-300 mt-0.5">
                          Please contact your fund manager
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    {call.status === 'Paid' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.location.href = `/lp-portal/capital-calls/${call.id}/summary`}
                      >
                        <IconEye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => window.location.href = `/lp-portal/capital-calls/${call.id}/payment`}
                      >
                        <IconEye className="w-3 h-3 mr-1" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
        </>
      )}

    </div>
  )
}
