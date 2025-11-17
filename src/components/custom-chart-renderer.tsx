'use client'

import * as React from 'react'
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react'

interface TooltipConfig {
  variant?: 'default' | 'line-indicator' | 'no-indicator' | 'no-label' | 'label-formatter' | 'advanced'
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: 'dot' | 'line' | 'dashed'
  showTotal?: boolean
}

interface CustomChartRendererProps {
  config: {
    type: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'table' | 'radar' | 'radial'
    dataSource: string
    metrics: string[]
    title: string
    description?: string
    structureId?: string
    tooltipConfig?: TooltipConfig
  }
}

// Mock data generators for different data sources
const generateMockData = (dataSource: string, metrics: string[], structureId?: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Scale factor: if filtering by specific structure, reduce values to simulate structure-specific data
  const scaleFactor = structureId && structureId !== 'all' ? 0.3 : 1.0

  switch (dataSource) {
    case 'nav':
      return months.map((month, i) => ({
        month,
        totalValue: (1000000 + (i * 50000) + Math.random() * 100000) * scaleFactor,
        unrealizedGain: (50000 + (i * 10000) + Math.random() * 20000) * scaleFactor,
        navPerShare: 100 + (i * 2) + Math.random() * 5,
      }))

    case 'investments':
      if (metrics.includes('realEstate') || metrics.includes('privateEquity') || metrics.includes('privateDebt')) {
        // For pie/donut charts showing asset distribution
        return [
          { name: 'Real Estate', value: 2500000 * scaleFactor, percentage: 50 },
          { name: 'Private Equity', value: 1500000 * scaleFactor, percentage: 30 },
          { name: 'Private Debt', value: 1000000 * scaleFactor, percentage: 20 },
        ]
      }
      return months.map((month, i) => ({
        month,
        currentValue: (800000 + (i * 40000) + Math.random() * 80000) * scaleFactor,
        totalInvested: (500000 + (i * 30000)) * scaleFactor,
        irr: 12 + Math.random() * 8,
        multiple: 1.2 + (i * 0.05) + Math.random() * 0.1,
        unrealizedGain: (300000 + (i * 10000) + Math.random() * 50000) * scaleFactor,
      }))

    case 'investors':
      return months.map((month, i) => ({
        month,
        commitment: 5000000 * scaleFactor,
        contributed: (500000 + (i * 100000)) * scaleFactor,
        distributed: (100000 + (i * 20000)) * scaleFactor,
        irr: 10 + Math.random() * 5,
      }))

    case 'capitalCalls':
      return months.map((month, i) => ({
        month,
        called: (200000 + Math.random() * 100000) * scaleFactor,
        uncalled: (5000000 - (200000 * i)) * scaleFactor,
      }))

    case 'distributions':
      return months.map((month, i) => ({
        month,
        amount: (50000 + Math.random() * 50000) * scaleFactor,
        cumulative: (50000 * (i + 1) + Math.random() * 100000) * scaleFactor,
      }))

    case 'performance':
      return months.map((month, i) => ({
        month,
        irr: 10 + (i * 0.5) + Math.random() * 3,
        multiple: 1.1 + (i * 0.05) + Math.random() * 0.1,
        dpi: 0.2 + (i * 0.05) + Math.random() * 0.05,
        tvpi: 1.3 + (i * 0.05) + Math.random() * 0.1,
        rvpi: 1.1 + (i * 0.05) + Math.random() * 0.1,
      }))

    default:
      return []
  }
}

const CHART_COLORS = {
  chart1: 'var(--color-chart1)',
  chart2: 'var(--color-chart2)',
  chart3: 'var(--color-chart3)',
  chart4: 'var(--color-chart4)',
  chart5: 'var(--color-chart5)',
}

const formatValue = (value: number, metric: string) => {
  if (metric.includes('irr') || metric.includes('percentage')) {
    return `${value.toFixed(2)}%`
  }
  if (metric.includes('multiple')) {
    return `${value.toFixed(2)}x`
  }
  if (typeof value === 'number' && value > 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return value.toFixed(0)
}

// Generate tooltip content props based on variant
const getTooltipProps = (tooltipConfig?: TooltipConfig) => {
  if (!tooltipConfig) {
    return {} // Default tooltip
  }

  const variant = tooltipConfig.variant || 'default'

  switch (variant) {
    case 'line-indicator':
      return {
        indicator: 'line' as const,
      }

    case 'no-indicator':
      return {
        hideIndicator: true,
      }

    case 'no-label':
      return {
        hideLabel: true,
      }

    case 'label-formatter':
      return {
        labelFormatter: (value: any) => {
          // Format dates nicely
          if (typeof value === 'string') {
            return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          }
          return value
        },
      }

    case 'advanced':
      return {
        formatter: (value: any, name: string, item: any, index: number, payload: any) => {
          return `${formatValue(value, name)}`
        },
        labelFormatter: (label: any) => {
          return label
        },
      }

    case 'default':
    default:
      return {}
  }
}

export function CustomChartRenderer({ config }: CustomChartRendererProps) {
  const data = React.useMemo(() => generateMockData(config.dataSource, config.metrics, config.structureId), [config.dataSource, config.metrics, config.structureId])

  const chartConfig = React.useMemo(() => {
    const configObj: Record<string, { label: string; color: string }> = {}

    // Use actual color values from your theme - these match shadcn's chart colors
    const colors = ['#2563eb', '#60a5fa', '#10b981', '#f59e0b', '#ef4444']

    config.metrics.forEach((metric, index) => {
      configObj[metric] = {
        label: metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1'),
        color: colors[index % colors.length],
      }
    })
    return configObj satisfies ChartConfig
  }, [config.metrics])

  // Helper to determine primary metric type for Y-axis formatting
  const yAxisFormat = React.useMemo(() => {
    // Check if ALL metrics are multiples
    const allMultiples = config.metrics.every(m => m.toLowerCase().includes('multiple') || m.toLowerCase().includes('moic'))
    if (allMultiples) return 'multiple'

    // Check if ALL metrics are percentages
    const allPercentages = config.metrics.every(m =>
      m.toLowerCase().includes('irr') ||
      m.toLowerCase().includes('percentage') ||
      m.toLowerCase().includes('return') ||
      m.toLowerCase().includes('dpi') ||
      m.toLowerCase().includes('tvpi') ||
      m.toLowerCase().includes('rvpi')
    )
    if (allPercentages) return 'percentage'

    // Default to currency
    return 'currency'
  }, [config.metrics])

  // Y-axis formatter based on metric type
  const formatYAxis = React.useCallback((value: number) => {
    if (yAxisFormat === 'percentage') {
      return `${value.toFixed(0)}%`
    }
    if (yAxisFormat === 'multiple') {
      return `${value.toFixed(1)}x`
    }
    // Default to currency formatting
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }, [yAxisFormat])

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    )
  }

  switch (config.type) {
    case 'line':
      return (
        <ChartContainer config={chartConfig} className="min-h-[150px] w-full">
          <LineChart data={data} accessibilityLayer margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatYAxis}
              domain={[0, 'auto']}
            />
            <ChartTooltip content={<ChartTooltipContent {...getTooltipProps(config.tooltipConfig)} />} />
            <ChartLegend content={<ChartLegendContent />} />
            {config.metrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={`var(--color-${metric})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      )

    case 'bar':
      return (
        <ChartContainer config={chartConfig} className="min-h-[150px] w-full">
          <BarChart data={data} accessibilityLayer margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatYAxis}
              domain={[0, 'auto']}
            />
            <ChartTooltip content={<ChartTooltipContent {...getTooltipProps(config.tooltipConfig)} />} />
            <ChartLegend content={<ChartLegendContent />} />
            {config.metrics.map((metric) => (
              <Bar
                key={metric}
                dataKey={metric}
                fill={`var(--color-${metric})`}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      )

    case 'area':
      return (
        <ChartContainer config={chartConfig} className="min-h-[150px] w-full">
          <AreaChart data={data} accessibilityLayer margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <defs>
              {config.metrics.map((metric) => (
                <linearGradient key={metric} id={`fill${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartConfig[metric]?.color || '#2563eb'} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartConfig[metric]?.color || '#2563eb'} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatYAxis}
              domain={[0, 'auto']}
            />
            <ChartTooltip content={<ChartTooltipContent {...getTooltipProps(config.tooltipConfig)} />} />
            <ChartLegend content={<ChartLegendContent />} />
            {config.metrics.map((metric) => (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={`var(--color-${metric})`}
                fill={`url(#fill${metric})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      )

    case 'pie':
    case 'donut':
      // Transform data for pie charts - convert metrics to pie slices
      const pieData = data.length > 0 && data[0].name
        ? data.slice(0, 5) // Already formatted with name/value
        : config.metrics.map((metric, index) => ({
            name: chartConfig[metric]?.label || metric,
            value: data[data.length - 1]?.[metric] || 0,
            fill: chartConfig[metric]?.color || `hsl(var(--chart-${index + 1}))`,
          })).filter(item => item.value > 0)

      if (pieData.length === 0) {
        return (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available for pie chart
          </div>
        )
      }

      // Create a chartConfig for pie data to ensure labels show in legend
      const pieChartConfig = React.useMemo(() => {
        const configObj: Record<string, { label: string; color: string }> = {}
        pieData.forEach((item) => {
          configObj[item.name] = {
            label: item.name,
            color: item.fill,
          }
        })
        return configObj satisfies ChartConfig
      }, [pieData])

      return (
        <ChartContainer config={pieChartConfig} className="min-h-[350px] w-full">
          <PieChart margin={{ top: 10, right: 10, bottom: 50, left: 10 }}>
            <ChartTooltip content={<ChartTooltipContent hideLabel {...getTooltipProps(config.tooltipConfig)} />} />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="42%"
              innerRadius={config.type === 'donut' ? 80 : 0}
              outerRadius={120}
              strokeWidth={2}
              paddingAngle={2}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill || `hsl(var(--chart-${index + 1}))`}
                />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              verticalAlign="bottom"
              height={36}
            />
          </PieChart>
        </ChartContainer>
      )

    case 'table':
      return <TableView config={config} data={data} />

    case 'radar':
      // For radar charts, transform data to show latest values across metrics
      const radarData = config.metrics.map(metric => {
        const latestValue = data[data.length - 1]?.[metric] || 0
        return {
          metric: formatHeader(metric),
          value: typeof latestValue === 'number' ? latestValue : 0,
          fullMark: typeof latestValue === 'number' ? latestValue * 1.5 : 100,
        }
      })

      return (
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <RadarChart data={radarData} accessibilityLayer>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
            <ChartTooltip content={<ChartTooltipContent {...getTooltipProps(config.tooltipConfig)} />} />
            {config.metrics.map((metric, index) => (
              <Radar
                key={metric}
                name={formatHeader(metric)}
                dataKey="value"
                stroke={chartConfig[metric]?.color || `hsl(var(--chart-${index + 1}))`}
                fill={chartConfig[metric]?.color || `hsl(var(--chart-${index + 1}))`}
                fillOpacity={0.6}
              />
            ))}
          </RadarChart>
        </ChartContainer>
      )

    case 'radial':
      // For radial charts, show progress/goal completion
      const radialData = config.metrics.map((metric, index) => {
        const latestValue = data[data.length - 1]?.[metric] || 0
        const total = data.reduce((sum, item) => sum + (item[metric] || 0), 0)
        return {
          name: formatHeader(metric),
          value: typeof latestValue === 'number' ? latestValue : 0,
          fill: chartConfig[metric]?.color || `hsl(var(--chart-${index + 1}))`,
        }
      })

      // Create a chartConfig for radial data to ensure labels show in legend
      const radialChartConfig = React.useMemo(() => {
        const configObj: Record<string, { label: string; color: string }> = {}
        radialData.forEach((item) => {
          configObj[item.name] = {
            label: item.name,
            color: item.fill,
          }
        })
        return configObj satisfies ChartConfig
      }, [radialData])

      return (
        <ChartContainer config={radialChartConfig} className="min-h-[250px] w-full">
          <RadialBarChart
            data={radialData}
            innerRadius="10%"
            outerRadius="80%"
            accessibilityLayer
          >
            <ChartTooltip content={<ChartTooltipContent {...getTooltipProps(config.tooltipConfig)} />} />
            <PolarAngleAxis type="number" domain={[0, 'auto']} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <ChartLegend
              content={<ChartLegendContent />}
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </RadialBarChart>
        </ChartContainer>
      )

    default:
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Unsupported chart type
        </div>
      )
  }
}

// Helper functions outside component to avoid recreation
const formatHeader = (metric: string) => {
  // Special case for IRR
  if (metric.toLowerCase() === 'irr') return 'IRR'

  return metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1')
}

const formatCell = (value: any, metric: string) => {
  if (value === '-' || value === null || value === undefined) return '-'

  // Status badges
  if (metric.toLowerCase().includes('status')) {
    const status = String(value).toLowerCase()
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'active': 'default',
      'matured': 'secondary',
      'under construction': 'outline',
      'lease-up phase': 'outline',
    }
    return <Badge variant={variantMap[status] || 'secondary'}>{value}</Badge>
  }

  // Method badges
  if (metric.toLowerCase().includes('method')) {
    return <Badge variant="outline">{value}</Badge>
  }

  // Section type badges
  if (metric.toLowerCase().includes('sectiontype') || metric.toLowerCase().includes('type')) {
    return <Badge variant="secondary">{value}</Badge>
  }

  // Percentage values
  if (metric.toLowerCase().includes('percentage') || metric.toLowerCase().includes('navpercentage')) {
    return `${Number(value).toFixed(1)}%`
  }

  // IRR values
  if (metric.toLowerCase().includes('irr')) {
    return `${Number(value).toFixed(1)}%`
  }

  // Currency values
  if (metric.toLowerCase().includes('value') || metric.toLowerCase().includes('amount')) {
    const num = Number(value)
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
    return `$${num.toLocaleString()}`
  }

  return value
}

// TableView component with TanStack Table
function TableView({ config, data }: { config: any; data: any[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Generate columns dynamically from config.metrics
  const columns = React.useMemo<ColumnDef<any>[]>(
    () =>
      config.metrics.map((metric: string) => {
        return {
          accessorKey: metric,
          header: ({ column }: any) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4 h-8 data-[state=open]:bg-accent"
            >
              {formatHeader(metric)}
              {column.getIsSorted() === 'asc' ? (
                <IconChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <IconChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <IconSelector className="ml-2 h-4 w-4" />
              )}
            </Button>
          ),
          cell: ({ row }: any) => formatCell(row.getValue(metric), metric),
        }
      }),
    [config.metrics]
  )

  // Prepare table data
  const tableData = React.useMemo(
    () =>
      data.map((row, index) => {
        const tableRow: any = { id: index + 1 }
        config.metrics.forEach((metric: string) => {
          tableRow[metric] = row[metric] || '-'
        })
        return tableRow
      }),
    [data, config.metrics]
  )

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
