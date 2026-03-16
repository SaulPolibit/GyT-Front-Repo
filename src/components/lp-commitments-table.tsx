"use client"

import { IconBuilding, IconArrowRight } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/format-utils"
import { useTranslation } from "@/hooks/useTranslation"

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

interface LPCommitmentsTableProps {
  structures: LPStructure[]
}

export function LPCommitmentsTable({ structures }: LPCommitmentsTableProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.lpDashboard.portfolioBreakdown}</CardTitle>
            <CardDescription>{t.lpDashboard.investmentsAcrossFunds}</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/lp-portal/commitments">
              {t.lpDashboard.viewAll}
              <IconArrowRight className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {structures.length === 0 ? (
          <div className="text-center py-8">
            <IconBuilding className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">{t.lpDashboard.noActiveInvestments}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {structures.map((structure) => (
              <div key={structure.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{structure.name}</h4>
                    <Badge variant="outline" className="text-xs">{structure.type}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t.lpDashboard.commitment}</p>
                      <p className="font-medium">{formatCurrency(structure.commitment, String(structure.currency || 'USD'))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t.lpDashboard.called}</p>
                      <p className="font-medium text-foreground">{formatCurrency(structure.calledCapital, String(structure.currency || 'USD'))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t.lpDashboard.currentValue}</p>
                      <p className="font-medium text-primary">{formatCurrency(structure.currentValue, String(structure.currency || 'USD'))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t.lpDashboard.unrealizedGain}</p>
                      <p className="font-medium text-foreground">
                        {formatCurrency(structure.unrealizedGain, String(structure.currency || 'USD'))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t.lpDashboard.ownership}</p>
                      <p className="font-medium">{structure.ownershipPercent?.toFixed(2) ?? '0.00'}%</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{t.lpDashboard.capitalDeployed}</span>
                      <span>{structure.commitment > 0 ? ((structure.calledCapital / structure.commitment) * 100).toFixed(1) : '0.0'}%</span>
                    </div>
                    <Progress
                      value={structure.commitment > 0 ? (structure.calledCapital / structure.commitment) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
