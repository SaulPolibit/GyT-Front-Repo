'use client'

import * as React from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DraggableChartCard } from "@/components/draggable-chart-card"
import { LPCustomChartRenderer } from "@/components/lp-custom-chart-renderer"
import { LPChartBuilderDialog } from "@/components/lp-chart-builder-dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconPlus, IconTrendingUp, IconTrendingDown, IconBuilding, IconCurrencyDollar, IconCalendar, IconArrowRight } from "@tabler/icons-react"
import { getDashboardConfig, removeWidget, reorderWidgets, type DashboardWidget, addWidget as addLPWidget } from "@/lib/lp-dashboard-storage"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { calculateLPMetric } from "@/lib/lp-metric-calculations"
import { lpMetricTemplates, lpMetricCategories, getMetricsByCategory as getLPMetricsByCategory, type LPMetricTemplate } from "@/lib/lp-metric-templates"
import { lpChartTemplates, lpChartCategories, getTemplatesByCategory as getLPTemplatesByCategory, type LPChartTemplate } from "@/lib/lp-chart-templates"
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken, logout } from '@/lib/auth-storage'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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

export default function LPDashboardPage() {
  const router = useRouter()
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
        setDashboardData(result.data)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

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
        return <LPPortfolioCards summary={dashboardData.summary} structures={dashboardData.structures} />

      case 'lp-nav-card':
        return <LPNavCard summary={dashboardData.summary} structures={dashboardData.structures} />

      case 'lp-commitments-table':
        return <LPCommitmentsTable structures={dashboardData.structures} />

      case 'lp-chart-area':
        // Default area chart - placeholder
        return (
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Portfolio Value Chart - Coming Soon</p>
          </div>
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
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">No data available</p>
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
              <label className="text-sm font-medium">Filter by Fund:</label>
              <Select value={globalFilter} onValueChange={setGlobalFilter}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="All Funds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Funds</SelectItem>
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
              Add a Graph
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
interface LPPortfolioCardsProps {
  summary: DashboardData['summary']
  structures: DashboardData['structures']
}

function LPPortfolioCards({ summary, structures }: LPPortfolioCardsProps) {
  const { totalCommitment, totalCurrentValue, totalCalledCapital, totalDistributed, totalReturn, totalReturnPercent } = summary

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardDescription className="text-sm font-normal flex items-center gap-2">
            <IconBuilding className="w-4 h-4" />
            Total Commitment
          </CardDescription>
          <CardTitle className="text-2xl font-semibold">
            {formatCurrency(totalCommitment)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Across {structures.length} active {structures.length === 1 ? 'fund' : 'funds'}
          </p>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardDescription className="text-sm font-normal flex items-center gap-2">
            <IconCurrencyDollar className="w-4 h-4" />
            Current Value
          </CardDescription>
          <CardTitle className="text-2xl font-semibold text-primary">
            {formatCurrency(totalCurrentValue)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(totalCalledCapital)} called capital
          </p>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardDescription className="text-sm font-normal flex items-center gap-2">
            <IconTrendingUp className="w-4 h-4" />
            Total Return
          </CardDescription>
          <CardTitle className={`text-2xl font-semibold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalReturn)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            {totalReturn >= 0 ? (
              <IconTrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <IconTrendingDown className="w-3 h-3 text-red-600" />
            )}
            <p className={`text-xs font-medium ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(totalReturnPercent)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardDescription className="text-sm font-normal flex items-center gap-2">
            <IconCurrencyDollar className="w-4 h-4" />
            Total Distributed
          </CardDescription>
          <CardTitle className="text-2xl font-semibold text-green-600">
            {formatCurrency(totalDistributed)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Lifetime distributions received
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

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

interface LPCommitmentsTableProps {
  structures: DashboardData['structures']
}

function LPCommitmentsTable({ structures }: LPCommitmentsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio Breakdown</CardTitle>
            <CardDescription>Your investments across all funds</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/lp-portal/commitments">
              View All
              <IconArrowRight className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {structures.length === 0 ? (
          <div className="text-center py-8">
            <IconBuilding className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No active investments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {structures.map((structure) => (
              <div key={structure.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{structure.name}</h4>
                    <Badge variant="outline" className="text-xs">{structure.type}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Commitment</p>
                      <p className="font-medium">{formatCurrency(structure.commitment)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Called</p>
                      <p className="font-medium text-orange-600">{formatCurrency(structure.calledCapital)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Value</p>
                      <p className="font-medium text-primary">{formatCurrency(structure.currentValue)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unrealized Gain</p>
                      <p className={`font-medium ${structure.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(structure.unrealizedGain)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
