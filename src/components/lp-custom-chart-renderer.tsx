'use client'

import * as React from 'react'
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { generateLPChartData } from '@/lib/lp-chart-data-generator'

interface LPCustomChartRendererProps {
  config: {
    type: 'line' | 'bar' | 'area' | 'pie' | 'donut'
    dataSource: string
    metrics: string[]
    title: string
    description?: string
    fundId?: string
  }
}

export function LPCustomChartRenderer({ config }: LPCustomChartRendererProps) {
  const data = React.useMemo(
    () => generateLPChartData(config.dataSource, config.fundId || 'all'),
    [config.dataSource, config.fundId]
  )

  const chartConfig = React.useMemo(() => {
    const configObj: Record<string, { label: string; color: string }> = {}
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

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
    const allMultiples = config.metrics.every(m =>
      m.toLowerCase().includes('multiple') ||
      m.toLowerCase().includes('moic')
    )
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
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
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
            />
            <ChartTooltip content={<ChartTooltipContent />} />
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
      // Determine x-axis key
      const xAxisKey = data[0]?.fund ? 'fund' : data[0]?.quarter ? 'quarter' : data[0]?.month ? 'month' : 'date'

      return (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart data={data} accessibilityLayer margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => typeof value === 'string' && value.length > 10 ? value.slice(0, 10) + '...' : value}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatYAxis}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
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
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <AreaChart data={data} accessibilityLayer margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <defs>
              {config.metrics.map((metric) => (
                <linearGradient key={metric} id={`fill${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartConfig[metric]?.color || '#8b5cf6'} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartConfig[metric]?.color || '#8b5cf6'} stopOpacity={0.1} />
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
            />
            <ChartTooltip content={<ChartTooltipContent />} />
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
      // For pie charts, data should already have name/value or type/value structure
      const pieData = data.map((item, index) => ({
        name: item.name || item.type || item.fund || `Item ${index + 1}`,
        value: item.value || item.allocation || item.amount || 0,
        fill: chartConfig[config.metrics[0]]?.color || `hsl(${index * 137.5}, 70%, 50%)`,
      })).filter(item => item.value > 0)

      if (pieData.length === 0) {
        return (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )
      }

      const pieChartConfig = React.useMemo(() => {
        const configObj: Record<string, { label: string; color: string }> = {}
        pieData.forEach((item, index) => {
          configObj[item.name] = {
            label: item.name,
            color: item.fill,
          }
        })
        return configObj satisfies ChartConfig
      }, [pieData])

      return (
        <ChartContainer config={pieChartConfig} className="min-h-[300px] w-full">
          <PieChart margin={{ top: 10, right: 10, bottom: 50, left: 10 }}>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="42%"
              innerRadius={config.type === 'donut' ? 60 : 0}
              outerRadius={100}
              strokeWidth={2}
              paddingAngle={2}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
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

    default:
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Unsupported chart type
        </div>
      )
  }
}
