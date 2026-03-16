"use client"

import * as React from "react"
import { IconTrendingDown, IconTrendingUp, IconCalendar, IconArrowRight } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-utils"
import { useTranslation } from "@/hooks/useTranslation"
import { usePlatformCurrency } from "@/hooks/use-swr-hooks"

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

interface LPRecentActivityCardProps {
  capitalCalls: CapitalCall[]
  distributions: Distribution[]
}

export function LPRecentActivityCard({ capitalCalls, distributions }: LPRecentActivityCardProps) {
  const { t, language } = useTranslation()
  const { currency: platformCurrency } = usePlatformCurrency()
  const safeCurrency = typeof platformCurrency === 'string' ? platformCurrency : 'USD'

  const recentItems = React.useMemo(() => {
    const items: Array<{
      id: string
      type: 'call' | 'distribution'
      title: string
      structureName: string
      date: string
      amount: number
      status: string
    }> = []

    capitalCalls.forEach(cc => {
      items.push({
        id: cc.id,
        type: 'call',
        title: `${t.lpDashboard.capitalCall} #${cc.callNumber}`,
        structureName: cc.structureName,
        date: cc.callDate,
        amount: cc.totalDue,
        status: cc.status,
      })
    })

    distributions.forEach(dist => {
      items.push({
        id: dist.id,
        type: 'distribution',
        title: t.lpDashboard.distribution,
        structureName: dist.structureName,
        date: dist.date,
        amount: dist.amount,
        status: dist.status,
      })
    })

    // Sort by date descending, take first 5
    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [capitalCalls, distributions, t])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'spanish' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.lpDashboard.recentActivity}</CardTitle>
            <CardDescription>{t.lpDashboard.latestTransactions}</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/lp-portal/activity">
              {t.lpDashboard.viewAll}
              <IconArrowRight className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentItems.length === 0 ? (
          <div className="text-center py-8">
            <IconCalendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">{t.lpDashboard.noRecentActivity}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {item.type === 'call' ? (
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-950">
                      <IconTrendingDown className="w-4 h-4 text-orange-600" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-950">
                      <IconTrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.structureName} &middot; {formatDate(item.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-sm font-semibold ${item.type === 'call' ? 'text-orange-600' : 'text-green-600'}`}>
                    {item.type === 'call' ? '-' : '+'}{formatCurrency(item.amount, safeCurrency)}
                  </p>
                  <Badge variant="outline" className="text-xs">{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
