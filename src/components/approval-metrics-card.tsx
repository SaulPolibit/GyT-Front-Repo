"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  IconFileCheck,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconArrowRight,
  IconFileText,
  IconCash
} from "@tabler/icons-react"
import { getApiUrl, API_CONFIG } from "@/lib/api-config"
import { getAuthState } from "@/lib/auth-storage"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/hooks/useTranslation"

interface ApprovalMetrics {
  capitalCalls: {
    pendingReview: number
    pendingCfo: number
    total: number
  }
  distributions: {
    pendingReview: number
    pendingCfo: number
    total: number
  }
  payments: {
    pending: number
    total: number
  }
}

interface ApprovalMetricsCardProps {
  className?: string
}

export function ApprovalMetricsCard({ className }: ApprovalMetricsCardProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [metrics, setMetrics] = React.useState<ApprovalMetrics | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchApprovalMetrics = async () => {
      try {
        const authState = getAuthState()
        const token = authState.token

        if (!token) {
          setError('Authentication required')
          setLoading(false)
          return
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }

        // Fetch pending approvals from all sources
        const [capitalCallsRes, distributionsRes, paymentsRes] = await Promise.all([
          fetch(getApiUrl(API_CONFIG.endpoints.getPendingCapitalCallApprovals), { headers }),
          fetch(getApiUrl(API_CONFIG.endpoints.getPendingDistributionApprovals), { headers }),
          fetch(getApiUrl(API_CONFIG.endpoints.getPaymentStats), { headers })
        ])

        // Parse responses
        const capitalCallsData = capitalCallsRes.ok ? await capitalCallsRes.json() : { data: [] }
        const distributionsData = distributionsRes.ok ? await distributionsRes.json() : { data: [] }
        const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { data: { pending: 0, total: 0 } }

        // Calculate metrics (simplified workflow - only pending_cfo)
        const capitalCalls = capitalCallsData.data || []
        const distributions = distributionsData.data || []

        setMetrics({
          capitalCalls: {
            pendingReview: 0, // Legacy - kept for interface compatibility
            pendingCfo: capitalCalls.filter((cc: any) => cc.approvalStatus === 'pending_cfo').length,
            total: capitalCalls.length
          },
          distributions: {
            pendingReview: 0, // Legacy - kept for interface compatibility
            pendingCfo: distributions.filter((d: any) => d.approvalStatus === 'pending_cfo').length,
            total: distributions.length
          },
          payments: {
            pending: paymentsData.data?.pending || 0,
            total: paymentsData.data?.total || 0
          }
        })

        setLoading(false)
      } catch (err) {
        console.error('Error fetching approval metrics:', err)
        setError('Failed to load approval metrics')
        setLoading(false)
      }
    }

    fetchApprovalMetrics()
  }, [])

  const totalPendingApprovals = metrics
    ? metrics.capitalCalls.total + metrics.distributions.total + metrics.payments.pending
    : 0

  const totalPendingCfo = metrics
    ? metrics.capitalCalls.pendingCfo + metrics.distributions.pendingCfo
    : 0

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
            {t.dashboard.approvalQueue}
          </CardTitle>
          <CardDescription className="text-muted-foreground">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <IconFileCheck className="h-4 w-4" />
              {t.dashboard.pendingApprovals}
            </CardTitle>
            <CardDescription>
              {totalPendingApprovals} {t.dashboard.awaitingApproval}
            </CardDescription>
          </div>
          {totalPendingApprovals > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalPendingApprovals} {t.dashboard.pending}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Capital Calls */}
          <div
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => router.push('/investment-manager/approvals?tab=capital-calls')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <IconFileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{t.dashboard.capitalCalls}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.capitalCalls.pendingCfo || 0} {t.dashboard.pendingCfoApproval}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(metrics?.capitalCalls.total || 0) > 0 && (
                <Badge variant="outline" className="bg-muted text-foreground border-border">
                  {metrics?.capitalCalls.total}
                </Badge>
              )}
              <IconArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Distributions */}
          <div
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => router.push('/investment-manager/approvals?tab=distributions')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <IconCash className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{t.dashboard.distributions}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.distributions.pendingCfo || 0} {t.dashboard.pendingCfoApproval}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(metrics?.distributions.total || 0) > 0 && (
                <Badge variant="outline" className="bg-muted text-foreground border-border">
                  {metrics?.distributions.total}
                </Badge>
              )}
              <IconArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Payments */}
          <div
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => router.push('/investment-manager/approvals?tab=payments')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <IconClock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{t.dashboard.marketplacePayments}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.payments.pending || 0} {t.dashboard.pending.toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(metrics?.payments.pending || 0) > 0 && (
                <Badge variant="outline" className="bg-muted text-foreground border-border">
                  {metrics?.payments.pending}
                </Badge>
              )}
              <IconArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* CFO Alert */}
          {totalPendingCfo > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted border border-border">
              <div className="flex items-center gap-2">
                <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  {totalPendingCfo} {t.dashboard.awaitingCfoApproval}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* View All Button */}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => router.push('/investment-manager/approvals')}
        >
          {t.dashboard.viewAllApprovals}
          <IconArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default ApprovalMetricsCard
