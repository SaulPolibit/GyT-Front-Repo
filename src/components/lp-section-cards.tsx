"use client"

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
import { formatCurrency } from "@/lib/format-utils"
import { useTranslation } from "@/hooks/useTranslation"
import { usePlatformCurrency } from "@/hooks/use-swr-hooks"

interface LPSummary {
  totalCommitment: number
  totalCalledCapital: number
  totalCurrentValue: number
  totalDistributed: number
  totalReturn: number
  totalReturnPercent: number
}

interface LPStructure {
  id: string
  name: string
  type: string
  commitment: number
  calledCapital: number
  currentValue: number
  unrealizedGain: number
  currency: string
  ownershipPercent: number
}

interface LPSectionCardsProps {
  summary: LPSummary
  structures: LPStructure[]
}

export function LPSectionCards({ summary, structures }: LPSectionCardsProps) {
  const { t } = useTranslation()
  const { currency: platformCurrency } = usePlatformCurrency()
  const safeCurrency = typeof platformCurrency === 'string' ? platformCurrency : 'USD'

  const { totalCommitment, totalCurrentValue, totalReturn, totalReturnPercent, totalDistributed } = summary

  const formatPercent = (value: number) => {
    if (!isFinite(value)) value = 0
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 lg:gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs min-w-0">
      {/* Card 1: Total Commitment */}
      <Card className="@container/card min-w-0">
        <CardHeader className="min-w-0">
          <CardDescription className="text-slate-600 dark:text-slate-300 truncate">
            {t.lpDashboard.totalCommitment}
          </CardDescription>
          <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 truncate">
            {formatCurrency(totalCommitment, safeCurrency)}
          </CardTitle>
          <CardAction className="flex-shrink-0">
            <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 whitespace-nowrap">
              <IconTrendingUp />
              {structures.length} {structures.length === 1 ? t.lpDashboard.activeFund : t.lpDashboard.activeFunds}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-slate-800 dark:text-slate-200">
            {t.lpDashboard.across} {structures.length} {t.lpDashboard.active} {structures.length === 1 ? t.lpDashboard.activeFund : t.lpDashboard.activeFunds}
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            {t.lpDashboard.totalCommitment}
          </div>
        </CardFooter>
      </Card>

      {/* Card 2: Current Value */}
      <Card className="@container/card min-w-0">
        <CardHeader className="min-w-0">
          <CardDescription className="text-slate-600 dark:text-slate-300 truncate">
            {t.lpDashboard.currentValue}
          </CardDescription>
          <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 truncate">
            {formatCurrency(totalCurrentValue, safeCurrency)}
          </CardTitle>
          <CardAction className="flex-shrink-0">
            <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 whitespace-nowrap">
              {totalReturnPercent >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercent(totalReturnPercent)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-slate-800 dark:text-slate-200">
            {t.lpDashboard.portfolioPerformance}
            {totalReturnPercent >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            {t.lpDashboard.currentValue}
          </div>
        </CardFooter>
      </Card>

      {/* Card 3: Total Return */}
      <Card className="@container/card min-w-0">
        <CardHeader className="min-w-0">
          <CardDescription className="text-slate-600 dark:text-slate-300 truncate">
            {t.lpDashboard.totalReturn}
          </CardDescription>
          <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 truncate">
            {formatCurrency(totalReturn, safeCurrency)}
          </CardTitle>
          <CardAction className="flex-shrink-0">
            <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 whitespace-nowrap">
              {totalReturn >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercent(totalReturnPercent)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-slate-800 dark:text-slate-200">
            {t.lpDashboard.totalReturn}
            {totalReturn >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Net gain/loss
          </div>
        </CardFooter>
      </Card>

      {/* Card 4: Total Distributed */}
      <Card className="@container/card min-w-0">
        <CardHeader className="min-w-0">
          <CardDescription className="text-slate-600 dark:text-slate-300 truncate">
            {t.lpDashboard.totalDistributed}
          </CardDescription>
          <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 truncate">
            {formatCurrency(totalDistributed, safeCurrency)}
          </CardTitle>
          <CardAction className="flex-shrink-0">
            <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 whitespace-nowrap">
              <IconTrendingUp />
              Lifetime
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-slate-800 dark:text-slate-200">
            {t.lpDashboard.lifetimeDistributions}
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            {t.lpDashboard.totalDistributed}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
