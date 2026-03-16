'use client'

import * as React from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DraggableChartCard } from "@/components/draggable-chart-card"
import { LPCustomChartRenderer } from "@/components/lp-custom-chart-renderer"
import { LPChartBuilderDialog } from "@/components/lp-chart-builder-dialog"
import { LPSectionCards } from "@/components/lp-section-cards"
import { LPPortfolioChart } from "@/components/lp-portfolio-chart"
import { LPRecentActivityCard } from "@/components/lp-recent-activity-card"
import { LPCommitmentsTable as LPCommitmentsTableNew } from "@/components/lp-commitments-table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconPlus, IconTrendingUp, IconTrendingDown, IconBuilding, IconCurrencyDollar } from "@tabler/icons-react"
import { getDashboardConfig, removeWidget, reorderWidgets, type DashboardWidget } from "@/lib/lp-dashboard-storage"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { calculateLPMetric } from "@/lib/lp-metric-calculations"
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken, logout } from '@/lib/auth-storage'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'

interface DashboardData {
  investor: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }
  structures: Array<{
    id: string
    name: string
    type: string
    commitment: number
    calledCapital: number
    currentValue: number
    unrealizedGain: number
    currency: string
    ownershipPercent: number
  }>
  summary: {
    totalCommitment: number
    totalCalledCapital: number
    totalCurrentValue: number
    totalDistributed: number
    totalReturn: number
    totalReturnPercent: number
  }
  distributions: Array<{
    id: string
    structureId: string
    structureName: string
    amount: number
    date: string
    type: string
    status: string
  }>
}

// Data normalization function to prevent React Error #310
const normalizeDashboardData = (raw: any): DashboardData => {
  return {
    investor: {
      id: String(raw.investor?.id ?? ''),
      firstName: String(raw.investor?.firstName ?? ''),
      lastName: String(raw.investor?.lastName ?? ''),
      email: String(raw.investor?.email ?? ''),
      profileImage: raw.investor?.profileImage ? String(raw.investor.profileImage) : undefined,
    },
    structures: (raw.structures ?? []).map((s: any) => ({
      id: String(s.id ?? ''),
      name: String(s.name ?? ''),
      type: String(s.type ?? ''),
      commitment: Number(s.commitment) || 0,
      calledCapital: Number(s.calledCapital) || 0,
      currentValue: Number(s.currentValue) || 0,
      unrealizedGain: Number(s.unrealizedGain) || 0,
      currency: String(s.currency || 'USD'),
      ownershipPercent: Number(s.ownershipPercent) || 0,
    })),
    summary: {
      totalCommitment: Number(raw.summary?.totalCommitment) || 0,
      totalCalledCapital: Number(raw.summary?.totalCalledCapital) || 0,
      totalCurrentValue: Number(raw.summary?.totalCurrentValue) || 0,
      totalDistributed: Number(raw.summary?.totalDistributed) || 0,
      totalReturn: Number(raw.summary?.totalReturn) || 0,
      totalReturnPercent: Number(raw.summary?.totalReturnPercent) || 0,
    },
    distributions: (raw.distributions ?? []).map((d: any) => ({
      id: String(d.id ?? ''),
      structureId: String(d.structureId ?? ''),
      structureName: String(d.structureName ?? ''),
      amount: Number(d.amount) || 0,
      date: String(d.date ?? ''),
      type: String(d.type ?? ''),
      status: String(d.status ?? ''),
    })),
  }
}

export default function LPDashboardPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [widgets, setWidgets] = React.useState<DashboardWidget[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingWidget, setEditingWidget] = React.useState<DashboardWidget | null>(null)
  const [globalFilter, setGlobalFilter] = React.useState<string>('all')
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)

  const loadDashboardData = React.useCallback(async () => {
    setLoading(true)
    const token = getAuthToken()

    if (!token) {
      toast.error('Authentication required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getMyDashboard), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
        throw new Error('Failed to load dashboard data')
      }

      const result = await response.json()

      if (result.success && result.data) {
        // Normalize data to prevent React Error #310 (objects as children)
        const normalized = normalizeDashboardData(result.data)
        setDashboardData(normalized)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error(t.lpDashboard.noData || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [t])

  // Load widgets and dashboard data
  React.useEffect(() => {
    const config = getDashboardConfig()
    setWidgets(config.widgets)
    loadDashboardData()
  }, [loadDashboardData])

  // Configure drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newOrder = arrayMove(items, oldIndex, newIndex)

        // Save new order to localStorage
        reorderWidgets(newOrder.map(w => w.id))

        return newOrder
      })
    }
  }

  const handleDeleteWidget = (widgetId: string) => {
    setWidgets((items) => items.filter(w => w.id !== widgetId))
    removeWidget(widgetId)
  }

  const handleEditWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId)
    if (widget) {
      setEditingWidget(widget)
      setDialogOpen(true)
    }
  }

  const handleChartAdded = () => {
    // Reload widgets from storage
    const config = getDashboardConfig()
    setWidgets(config.widgets)
    setEditingWidget(null)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingWidget(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  const renderWidget = (widget: DashboardWidget) => {
    if (!dashboardData) return null

    switch (widget.id) {
      case 'lp-portfolio-cards':
        return <LPSectionCards summary={dashboardData.summary} structures={dashboardData.structures} />

      case 'lp-nav-card':
        // Capital Deployment card (keep as is for backward compatibility)
        return <LPNavCard summary={dashboardData.summary} structures={dashboardData.structures} />

      case 'lp-commitments-table':
        return <LPCommitmentsTableNew structures={dashboardData.structures} />

      case 'lp-chart-area':
        // Portfolio performance chart with capital flows
        return (
          <LPPortfolioChart
            capitalCalls={[]}
            distributions={dashboardData.distributions}
          />
        )

      case 'lp-recent-activity':
        return (
          <LPRecentActivityCard
            capitalCalls={[]}
            distributions={dashboardData.distributions}
          />
        )

      default:
        // Custom chart widget
        if (widget.type === 'chart' && widget.config) {
          return (
            <LPCustomChartRenderer
              config={widget.config as any}
            />
          )
        }

        // Metric card widget
        if (widget.type === 'metric' && widget.config) {
          const config = widget.config as any
          // Calculate investor-specific metric
          const calculatedValue = calculateLPMetric(config.metricId, config.fundId || 'all')

          return (
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">{config.title}</h3>
                {calculatedValue.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    calculatedValue.trend === 'up' ? 'bg-green-100 text-green-700' :
                    calculatedValue.trend === 'down' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {calculatedValue.badge}
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold">{calculatedValue.value}</div>
              {calculatedValue.description && (
                <p className="text-sm text-muted-foreground mt-1">{calculatedValue.description}</p>
              )}
            </div>
          )
        }

        // Card widget (non-specific)
        if (widget.type === 'card') {
          return renderWidget({ ...widget, id: widget.id } as DashboardWidget)
        }

        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t.lpDashboard.loading}</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">{t.lpDashboard.noData}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <LPChartBuilderDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onChartAdded={handleChartAdded}
        editingWidget={editingWidget}
      />

      <div className="@container/main flex flex-col gap-2 min-w-0">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 min-w-0">
          {/* Filter and Add button */}
          <div className="px-4 lg:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">{t.lpDashboard.filterByFund}</label>
              <Select value={globalFilter} onValueChange={setGlobalFilter}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder={t.lpDashboard.allFunds} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.lpDashboard.allFunds}</SelectItem>
                  {dashboardData.structures.map(structure => (
                    <SelectItem key={structure.id} value={structure.id}>
                      {structure.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
            >
              <IconPlus className="h-4 w-4 mr-2" />
              {t.lpDashboard.addGraph}
            </Button>
          </div>

          {/* Draggable widgets in flat layout */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={widgets.map(w => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="px-4 lg:px-6">
                <div className="flex flex-wrap gap-4 md:gap-6 items-stretch">
                  {widgets
                    .filter(w => w.type !== 'section') // Exclude section widgets
                    .filter(widget => {
                      // Apply global filter
                      if (widget.ignoreFilter) return true
                      if (globalFilter === 'all') return true

                      // Filter by widget's fund
                      const config = widget.config as any
                      return config.fundId === globalFilter
                    })
                    .map((widget) => {
                      // Get size class for widgets
                      const getWidgetSizeClass = () => {
                        const config = widget.config as any
                        const size = config.size || (widget.type === 'metric' ? 'small' : 'large')

                        const sizeMap = {
                          small: 'w-full sm:w-[calc(25%-1.125rem)]',     // 25% minus gap (1/4 width)
                          medium: 'w-full sm:w-[calc(50%-0.75rem)]',    // 50% minus gap (1/2 width)
                          large: 'w-full'               // 100% width
                        }

                        return sizeMap[size as keyof typeof sizeMap] || sizeMap.large
                      }

                      const widgetSizeClass = (widget.type === 'metric' || widget.type === 'chart')
                        ? getWidgetSizeClass()
                        : 'w-full'

                      return (
                        <div key={widget.id} className={widgetSizeClass}>
                          <DraggableChartCard
                            widget={widget}
                            onDelete={handleDeleteWidget}
                            onEdit={handleEditWidget}
                            title={widget.type === 'chart' ? (widget.config as any)?.title : undefined}
                            description={widget.type === 'chart' ? (widget.config as any)?.description : undefined}
                          >
                            {renderWidget(widget)}
                          </DraggableChartCard>
                        </div>
                      )
                    })}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </>
  )
}

// Helper components

interface LPNavCardProps {
  summary: DashboardData['summary']
  structures: DashboardData['structures']
}

function LPNavCard({ summary, structures }: LPNavCardProps) {
  const { totalCommitment, totalCalledCapital } = summary
  // Calculate uncalled capital as commitment minus called capital
  const uncalledCapital = totalCommitment - totalCalledCapital

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Capital Deployment</CardTitle>
        <CardDescription>Your commitment vs. called capital</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Called Capital</p>
            <p className="text-2xl font-semibold text-orange-600">{formatCurrency(totalCalledCapital)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Uncalled Capital</p>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(uncalledCapital)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Deployment Rate</p>
            <p className="text-2xl font-semibold">
              {totalCommitment > 0
                ? ((totalCalledCapital / totalCommitment) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
        <Progress
          value={totalCommitment > 0
            ? (totalCalledCapital / totalCommitment) * 100
            : 0}
          className="h-3"
        />
      </CardContent>
    </Card>
  )
}

