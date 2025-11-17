"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { NAVHistoryPoint } from "@/lib/nav-calculations"

interface NavTrendChartProps {
  navHistory: NAVHistoryPoint[]
}

const chartConfig = {
  nav: {
    label: "NAV",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function NavTrendChart({ navHistory }: NavTrendChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `$${(value / 1000).toFixed(0)}K`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">NAV Trend (12 Months)</h3>
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
        <AreaChart
          accessibilityLayer
          data={navHistory}
          margin={{
            left: 12,
            right: 12,
            top: 12,
            bottom: 12,
          }}
        >
          <defs>
            <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-nav)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-nav)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatDate}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatCurrency}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Area
            dataKey="nav"
            type="monotone"
            fill="url(#navGradient)"
            fillOpacity={1}
            stroke="var(--color-nav)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
