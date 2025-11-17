"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NavSummarySection } from "@/components/nav-summary-section"
import { NavTrendChart } from "@/components/nav-trend-chart"
import { NavComponentsBreakdown } from "@/components/nav-components-breakdown"
import { ValuationByAssetTable } from "@/components/valuation-by-asset-table"
import fundData from "@/app/investment-manager/fund-data.json"
import {
  calculateCurrentNAV,
  calculateNAVPerShare,
  calculateNAVComponents,
  calculateValuationByAsset,
  generateNAVHistory,
  calculatePerformanceMetrics,
  type FundData,
} from "@/lib/nav-calculations"

export function NavDashboardCard() {
  const data = fundData as FundData

  const currentNAV = calculateCurrentNAV(data)
  const navPerShare = calculateNAVPerShare(data)
  const navComponents = calculateNAVComponents(data)
  const valuationByAsset = calculateValuationByAsset(data)
  const navHistory = generateNAVHistory(data, 12)
  const performance = calculatePerformanceMetrics(data, navHistory)

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Portfolio Net Asset Value (NAV)</CardTitle>
            <CardDescription>As of {currentDate}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <NavSummarySection
          currentNAV={currentNAV}
          navPerShare={navPerShare}
          ytdReturn={performance.ytdReturn}
        />

        <NavTrendChart navHistory={navHistory} />

        <NavComponentsBreakdown navComponents={navComponents} />

        <ValuationByAssetTable valuationByAsset={valuationByAsset} />
      </CardContent>
    </Card>
  )
}
