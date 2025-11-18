"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Portfolio performance over time"

const chartData = [
  { date: "2024-04-01", portfolioValue: 1850000, distributions: 0 },
  { date: "2024-04-15", portfolioValue: 1892000, distributions: 8200 },
  { date: "2024-05-01", portfolioValue: 1934000, distributions: 12450 },
  { date: "2024-05-15", portfolioValue: 1978000, distributions: 15600 },
  { date: "2024-06-01", portfolioValue: 2025000, distributions: 18750 },
  { date: "2024-06-15", portfolioValue: 2089000, distributions: 22300 },
  { date: "2024-07-01", portfolioValue: 2156000, distributions: 26180 },
  { date: "2024-07-15", portfolioValue: 2198000, distributions: 29450 },
  { date: "2024-08-01", portfolioValue: 2243000, distributions: 32800 },
  { date: "2024-08-15", portfolioValue: 2289000, distributions: 36200 },
  { date: "2024-09-01", portfolioValue: 2334000, distributions: 39750 },
  { date: "2024-09-15", portfolioValue: 2378000, distributions: 43150 },
  { date: "2024-10-01", portfolioValue: 2421000, distributions: 46800 },
  { date: "2024-10-15", portfolioValue: 2456890, distributions: 50200 },
  { date: "2024-11-01", portfolioValue: 2489000, distributions: 53700 },
  { date: "2024-11-15", portfolioValue: 2523000, distributions: 57300 },
  { date: "2024-12-01", portfolioValue: 2558000, distributions: 60950 },
  { date: "2024-12-15", portfolioValue: 2594000, distributions: 64800 },
  { date: "2024-12-31", portfolioValue: 2631000, distributions: 68750 },
]

const chartConfig = {
  performance: {
    label: "Performance",
  },
  portfolioValue: {
    label: "Portfolio Value",
    color: "var(--primary)",
  },
  distributions: {
    label: "Cumulative Distributions",
    color: "hsl(var(--primary) / 0.6)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-12-31")
    let daysToSubtract = 270
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Investment value and distributions over time
          </span>
          <span className="@[540px]/card:hidden">Performance tracking</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 *:data-[slot=toggle-group-item]:text-black @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d" className="text-black">Last 9 months</ToggleGroupItem>
            <ToggleGroupItem value="30d" className="text-black">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d" className="text-black">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 9 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 9 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillPortfolioValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-portfolioValue)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-portfolioValue)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillDistributions" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-distributions)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-distributions)"
                  stopOpacity={0.1}
                />
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
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  formatter={(value) => {
                    return new Intl.NumberFormat("en-US", {
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
              dataKey="distributions"
              type="natural"
              fill="url(#fillDistributions)"
              stroke="var(--color-distributions)"
              stackId="a"
            />
            <Area
              dataKey="portfolioValue"
              type="natural"
              fill="url(#fillPortfolioValue)"
              stroke="var(--color-portfolioValue)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
