"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslation } from "@/hooks/useTranslation"

const lpChartConfig = {
  calledCapital: {
    label: "Cumulative Called Capital",
    color: "var(--primary)",
  },
  distributions: {
    label: "Cumulative Distributions",
    color: "hsl(142 71% 45%)",
  },
} satisfies ChartConfig

interface CapitalCall {
  id: string
  capitalCallId: string
  structureId: string
  structureName: string
  callNumber: number
  callDate: string
  dueDate: string
  totalDue: number
  paidAmount: number
  outstanding: number
  status: string
  currency: string
}

interface Distribution {
  id: string
  structureId: string
  structureName: string
  amount: number
  date: string
  type: string
  status: string
}

interface LPPortfolioChartProps {
  capitalCalls: CapitalCall[]
  distributions: Distribution[]
}

export function LPPortfolioChart({ capitalCalls, distributions }: LPPortfolioChartProps) {
  const isMobile = useIsMobile()
  const { t, language } = useTranslation()
  const [timeRange, setTimeRange] = React.useState<string>("all")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("6m")
    }
  }, [isMobile])

  const chartData = React.useMemo(() => {
    if (capitalCalls.length === 0 && distributions.length === 0) return []

    // Collect all unique months from capital calls and distributions
    const monthSet = new Set<string>()

    capitalCalls.forEach(cc => {
      const d = new Date(cc.callDate)
      if (!isNaN(d.getTime())) monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    })

    distributions.forEach(dist => {
      const d = new Date(dist.date)
      if (!isNaN(d.getTime())) monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    })

    if (monthSet.size === 0) return []

    const sortedMonths = Array.from(monthSet).sort()
    const firstMonth = sortedMonths[0]
    const lastMonth = sortedMonths[sortedMonths.length - 1]

    // Fill in all months between first and last
    const allMonths: string[] = []
    const [startY, startM] = firstMonth.split('-').map(Number)
    const [endY, endM] = lastMonth.split('-').map(Number)
    let cy = startY, cm = startM
    while (cy < endY || (cy === endY && cm <= endM)) {
      allMonths.push(`${cy}-${String(cm).padStart(2, '0')}`)
      cm++
      if (cm > 12) { cm = 1; cy++ }
    }

    return allMonths.map(month => {
      const cumulativeCalled = capitalCalls
        .filter(cc => {
          const d = new Date(cc.callDate)
          const ccMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          return ccMonth <= month
        })
        .reduce((sum, cc) => sum + cc.totalDue, 0)

      const cumulativeDist = distributions
        .filter(dist => {
          const d = new Date(dist.date)
          const distMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          return distMonth <= month
        })
        .reduce((sum, dist) => sum + dist.amount, 0)

      return {
        date: `${month}-01`,
        calledCapital: Math.round(cumulativeCalled),
        distributions: Math.round(cumulativeDist),
      }
    })
  }, [capitalCalls, distributions])

  const filteredData = React.useMemo(() => {
    if (chartData.length === 0) return []
    if (timeRange === "all") return chartData

    const now = new Date()
    const monthsBack = timeRange === "12m" ? 12 : 6
    const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)

    return chartData.filter(item => new Date(item.date) >= cutoff)
  }, [chartData, timeRange])

  if (capitalCalls.length === 0 && distributions.length === 0) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>{t.lpDashboard.portfolioPerformance}</CardTitle>
          <CardDescription>{t.lpDashboard.capitalFlowOverTime}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            {t.lpDashboard.noActivityData}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t.lpDashboard.portfolioPerformance}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {t.lpDashboard.capitalFlowOverTime}
          </span>
          <span className="@[540px]/card:hidden">{t.lpDashboard.portfolioPerformance}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(val) => { if (val) setTimeRange(val) }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 *:data-[slot=toggle-group-item]:text-black @[767px]/card:flex"
          >
            <ToggleGroupItem value="all" className="text-black">{t.lpDashboard.allTime}</ToggleGroupItem>
            <ToggleGroupItem value="12m" className="text-black">{t.lpDashboard.last12Months}</ToggleGroupItem>
            <ToggleGroupItem value="6m" className="text-black">{t.lpDashboard.last6Months}</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder={t.lpDashboard.allTime} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">{t.lpDashboard.allTime}</SelectItem>
              <SelectItem value="12m" className="rounded-lg">{t.lpDashboard.last12Months}</SelectItem>
              <SelectItem value="6m" className="rounded-lg">{t.lpDashboard.last6Months}</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {filteredData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            {t.lpDashboard.noActivityData}
          </div>
        ) : (
          <ChartContainer
            config={lpChartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillCalledCapital" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-calledCapital)" stopOpacity={1.0} />
                  <stop offset="95%" stopColor="var(--color-calledCapital)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillLPDistributions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-distributions)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-distributions)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString(language === 'spanish' ? 'es-ES' : 'en-US', {
                    month: "short",
                    year: "2-digit",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString(language === 'spanish' ? 'es-ES' : 'en-US', {
                        month: "long",
                        year: "numeric",
                      })
                    }}
                    formatter={(value) => {
                      return new Intl.NumberFormat(language === 'spanish' ? 'es-ES' : 'en-US', {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(value as number)
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="calledCapital"
                type="natural"
                fill="url(#fillCalledCapital)"
                stroke="var(--color-calledCapital)"
                stackId="a"
              />
              <Area
                dataKey="distributions"
                type="natural"
                fill="url(#fillLPDistributions)"
                stroke="var(--color-distributions)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
