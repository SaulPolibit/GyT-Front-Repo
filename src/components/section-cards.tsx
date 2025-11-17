import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import investmentsData from "@/data/investments.json"
import investorsData from "@/data/investors.json"
import type { Investment, Investor } from "@/lib/types"

export function SectionCards() {
  const investments = investmentsData as Investment[]
  const investors = investorsData as Investor[]

  // Calculate from fund's positions in investments
  const totalValue = investments.reduce((sum, inv) => sum + inv.totalFundPosition.currentValue, 0)
  const totalCost = investments.reduce((sum, inv) => sum + inv.totalFundPosition.totalInvested, 0)
  const totalDistributed = investors.reduce((sum, inv) => sum + inv.totalDistributed, 0)
  const avgIRR = investments.reduce((sum, inv) => sum + inv.totalFundPosition.irr, 0) / investments.length

  const totalGain = totalValue - totalCost
  const totalReturn = ((totalGain / totalCost) * 100)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 lg:gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs min-w-0">
      <Card className="@container/card min-w-0">
        <CardHeader className="min-w-0">
          <CardDescription className="text-slate-600 dark:text-slate-300 truncate">Total Investment Value</CardDescription>
          <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 truncate">
            {formatCurrency(totalValue)}
          </CardTitle>
          <CardAction className="flex-shrink-0">
            <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 whitespace-nowrap">
              {totalReturn >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercent(totalReturn)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-slate-800 dark:text-slate-200">
            YTD Performance {totalReturn >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Current portfolio value
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card min-w-0">
        <CardHeader className="min-w-0">
          <CardDescription className="text-slate-600 dark:text-slate-300 truncate">Total Invested Capital</CardDescription>
          <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 truncate">
            {formatCurrency(totalCost)}
          </CardTitle>
          <CardAction className="flex-shrink-0">
            <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 whitespace-nowrap">
              <IconTrendingUp />
              Initial
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-slate-800 dark:text-slate-200">
            Total commitment <IconTrendingUp className="size-4" />
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Original investment amount
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-slate-600 dark:text-slate-300">Total Distributions</CardDescription>
          <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(totalDistributed)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600">
              <IconTrendingUp />
              Lifetime
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-slate-800 dark:text-slate-200">
            To investors <IconTrendingUp className="size-4" />
          </div>
          <div className="text-slate-500 dark:text-slate-400">Total cash flow distributed</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-slate-600 dark:text-slate-300">Average IRR</CardDescription>
          <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {formatPercent(avgIRR)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600">
              {avgIRR >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              Portfolio
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-slate-800 dark:text-slate-200">
            Across {investments.length} investments {avgIRR >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-slate-500 dark:text-slate-400">Portfolio performance</div>
        </CardFooter>
      </Card>
    </div>
  )
}
