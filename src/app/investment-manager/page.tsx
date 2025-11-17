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
import { calculateMetric } from "@/lib/metric-calculations"
import { getStructures } from "@/lib/structures-storage"
import { ComparisonTable } from "@/components/comparison-table"

import data from "./investment-data.json"

export default function Page() {
  const [widgets, setWidgets] = React.useState<DashboardWidget[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingWidget, setEditingWidget] = React.useState<DashboardWidget | null>(null)
  const [globalFilter, setGlobalFilter] = React.useState<string>('all')

  // Load widgets from localStorage on mount
  React.useEffect(() => {
    const config = getDashboardConfig()
    setWidgets(config.widgets)
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
          const calculatedValue = calculateMetric(config.metricId, config.structureId || 'all')

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
                  {getStructures().map(structure => (
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
