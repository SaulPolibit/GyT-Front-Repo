'use client'

import * as React from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { NavDashboardCard } from "@/components/nav-dashboard-card"
import { DraggableChartCard } from "@/components/draggable-chart-card"
import { CustomChartRenderer } from "@/components/custom-chart-renderer"
import { ChartBuilderDialog } from "@/components/chart-builder-dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus } from "@tabler/icons-react"
import { getDashboardConfig, removeWidget, reorderWidgets, type DashboardWidget } from "@/lib/dashboard-storage"
import { calculateMetric, type DashboardData } from "@/lib/metric-calculations"
import { getStructures } from "@/lib/structures-storage"
import { ComparisonTable } from "@/components/comparison-table"
import { getApiUrl, API_CONFIG } from '@/lib/api-config'
import { getAuthState, logout } from '@/lib/auth-storage'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  // Redirect to structures page
  React.useEffect(() => {
    router.replace('/investment-manager/structures')
  }, [router])

  // Show nothing while redirecting
  return null
}

// Original dashboard code kept for reference (root users only)
function DashboardPage() {
  const router = useRouter()
  const [widgets, setWidgets] = React.useState<DashboardWidget[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingWidget, setEditingWidget] = React.useState<DashboardWidget | null>(null)
  const [globalFilter, setGlobalFilter] = React.useState<string>('all')
  const [data, setData] = React.useState<any[]>([])
  const [dashboardData, setDashboardData] = React.useState<DashboardData>({})
  const [structures, setStructures] = React.useState<any[]>([])

  // Load widgets and fetch data from API on mount
  React.useEffect(() => {
    const config = getDashboardConfig()
    setWidgets(config.widgets)

    // Fetch all dashboard data from API
    const fetchDashboardData = async () => {
      try {
        const authState = getAuthState()
        const token = authState.token

        if (!token) {
          console.warn('No auth token found, using localStorage as fallback')
          // Fallback to localStorage
          const localStructures = getStructures()
          setStructures(localStructures)
          const transformedData = localStructures
            .filter((s: any) => s.status === 'active')
            .map((structure: any, index: number) => ({
              id: index + 1,
              header: structure.name || `Fund ${index + 1}`,
              type: structure.type === 'fund' ? 'Fund' : structure.type === 'sa' ? 'SA/LLC' : structure.type === 'trust' ? 'Trust' : 'SPV',
              status: 'Active',
              target: `$${(structure.currentNav || structure.totalCommitment || 0).toLocaleString()}`,
              limit: `$${(structure.totalCommitment || 0).toLocaleString()}`,
              irr: `${structure.performance?.irr || 0}%`,
            }))
          setData(transformedData)
          return
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }

        // Fetch all data in parallel
        const [
          structuresRes,
          investmentsRes,
          investorsRes,
          capitalCallsRes,
          distributionsRes
        ] = await Promise.all([
          fetch(getApiUrl(API_CONFIG.endpoints.getAllStructures), { headers }),
          fetch(getApiUrl(API_CONFIG.endpoints.getAllInvestments), { headers }),
          fetch(getApiUrl(API_CONFIG.endpoints.getAllInvestors), { headers }),
          fetch(getApiUrl(API_CONFIG.endpoints.getAllCapitalCalls), { headers }),
          fetch(getApiUrl(API_CONFIG.endpoints.getAllDistributions), { headers })
        ])

        // Handle 401 Unauthorized for structures endpoint
        if (structuresRes.status === 401) {
          // Check if it's an expired token error
          try {
            const errorData = await structuresRes.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Dashboard] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

        // Handle 401 Unauthorized for investments endpoint
        if (investmentsRes.status === 401) {
          // Check if it's an expired token error
          try {
            const errorData = await investmentsRes.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Dashboard] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

        // Handle 401 Unauthorized for investors endpoint
        if (investorsRes.status === 401) {
          // Check if it's an expired token error
          try {
            const errorData = await investorsRes.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Dashboard] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

        // Handle 401 Unauthorized for capital calls endpoint
        if (capitalCallsRes.status === 401) {
          // Check if it's an expired token error
          try {
            const errorData = await capitalCallsRes.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Dashboard] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

        // Handle 401 Unauthorized for distributions endpoint
        if (distributionsRes.status === 401) {
          // Check if it's an expired token error
          try {
            const errorData = await distributionsRes.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Dashboard] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

        const structuresData = structuresRes.ok ? (await structuresRes.json()).data || [] : []
        const investmentsData = investmentsRes.ok ? (await investmentsRes.json()).data || [] : []
        const investorsData = investorsRes.ok ? (await investorsRes.json()).data || [] : []
        const capitalCallsData = capitalCallsRes.ok ? (await capitalCallsRes.json()).data || [] : []
        const distributionsData = distributionsRes.ok ? (await distributionsRes.json()).data || [] : []

        // Store API data for metric calculations
        setDashboardData({
          structures: structuresData,
          investments: investmentsData,
          investors: investorsData,
          capitalCalls: capitalCallsData,
          distributions: distributionsData
        })

        // Store structures for filter dropdown
        setStructures(structuresData)

        // Transform structures for data table
        const transformedData = structuresData
          .filter((s: any) => s.status === 'active')
          .map((structure: any, index: number) => ({
            id: index + 1,
            header: structure.name || `Fund ${index + 1}`,
            type: structure.type === 'fund' ? 'Fund' : structure.type === 'sa' ? 'SA/LLC' : structure.type === 'trust' ? 'Trust' : 'SPV',
            status: 'Active',
            target: `$${(structure.currentNav || structure.totalCommitment || 0).toLocaleString()}`,
            limit: `$${(structure.totalCommitment || 0).toLocaleString()}`,
            irr: `${structure.performance?.irr || 0}%`,
          }))
        setData(transformedData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Failed to load dashboard data')
        // Fallback to localStorage
        const localStructures = getStructures()
        setStructures(localStructures)
        const transformedData = localStructures
          .filter((s: any) => s.status === 'active')
          .map((structure: any, index: number) => ({
            id: index + 1,
            header: structure.name || `Fund ${index + 1}`,
            type: structure.type === 'fund' ? 'Fund' : structure.type === 'sa' ? 'SA/LLC' : structure.type === 'trust' ? 'Trust' : 'SPV',
            status: 'Active',
            target: `$${(structure.currentNav || structure.totalCommitment || 0).toLocaleString()}`,
            limit: `$${(structure.totalCommitment || 0).toLocaleString()}`,
            irr: `${structure.performance?.irr || 0}%`,
          }))
        setData(transformedData)
      }
    }

    fetchDashboardData()
  }, [])

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

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.id) {
      case 'section-cards':
        return <SectionCards />

      case 'nav-dashboard-card':
        return <NavDashboardCard />

      case 'chart-area-interactive':
        return <ChartAreaInteractive />

      case 'data-table':
        return <DataTable data={data} />

      default:
        // Custom chart widget
        if (widget.type === 'chart' && widget.config) {
          return (
            <CustomChartRenderer
              config={widget.config as any}
            />
          )
        }

        // Metric card widget
        if (widget.type === 'metric' && widget.config) {
          const config = widget.config as any
          const calculatedValue = calculateMetric(config.metricId, config.structureId || 'all', dashboardData)

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

        // Comparison table widget
        if (widget.type === 'comparison') {
          return <ComparisonTable />
        }

        return null
    }
  }

  return (
    <>
      <ChartBuilderDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onChartAdded={handleChartAdded}
        editingWidget={editingWidget}
        defaultStructureId={globalFilter}
      />

      <div className="@container/main flex flex-col gap-2 min-w-0">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 min-w-0">
          {/* Filter and Add button */}
          <div className="px-4 lg:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Filter by Structure:</label>
              <Select value={globalFilter} onValueChange={setGlobalFilter}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="All Structures" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Structures</SelectItem>
                  {structures.map(structure => (
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
                <div className="flex flex-wrap gap-4 md:gap-6 items-start">
                  {widgets
                    .filter(w => w.type !== 'section') // Exclude section widgets
                    .filter(widget => {
                      // Apply global filter (except for comparison widgets)
                      if (widget.ignoreFilter) return true

                      const config = widget.config as any

                      // When "All Structures" is selected, only show widgets with structureId === 'all'
                      if (globalFilter === 'all') {
                        return !config.structureId || config.structureId === 'all'
                      }

                      // Otherwise, filter by widget's specific structure
                      return config.structureId === globalFilter
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
