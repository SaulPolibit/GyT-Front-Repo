'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { calculateWaterfall, STANDARD_WATERFALL, type InvestorCapitalAccount } from '@/lib/waterfall-calculations'
import { calculateIRR, type CashFlow } from '@/lib/performance-calculations'
import { IconTrendingUp, IconBuilding } from '@tabler/icons-react'

// Multi-Level Fund Structure
const PARENT_FUND = {
  fundId: 'parent-fund-001',
  fundName: 'Global Investment Partners Fund',
  fundStartDate: '2023-01-15',
  totalCommitment: 100000000, // $100M
  totalInvested: 75000000, // $75M deployed
  investors: [
    { id: 'inv-001', name: 'Pension Fund Alpha', capitalContributed: 50000000 },
    { id: 'inv-002', name: 'Family Office Beta', capitalContributed: 30000000 },
    { id: 'inv-003', name: 'Endowment Gamma', capitalContributed: 20000000 },
  ]
}

// Sub-Fund A (Level 2) - WITH Waterfall
const SUB_FUND_A = {
  fundId: 'sub-fund-a-001',
  fundName: 'Real Estate Opportunities A',
  type: 'WITH Waterfall',
  commitment: 40000000,
  deployed: 30000000,
  currentValue: 42000000,
  baseCashFlows: [
    { date: new Date('2023-01-15'), amount: -30000000 },
    { date: new Date('2023-12-31'), amount: 1500000 },
    { date: new Date('2024-10-31'), amount: 2500000 },
    { date: new Date('2024-11-01'), amount: 42000000 },
  ] as CashFlow[],
  projects: [
    { id: 'proj-1', name: 'Manhattan Office Tower', type: 'Office', value: 21000000 },
    { id: 'proj-2', name: 'Brooklyn Residential Complex', type: 'Residential', value: 21000000 }
  ]
}

// Sub-Fund B (Level 3) - WITH Waterfall
const SUB_FUND_B = {
  fundId: 'sub-fund-b-001',
  fundName: 'Infrastructure Growth B',
  type: 'WITH Waterfall',
  commitment: 35000000,
  deployed: 25000000,
  currentValue: 35000000,
  baseCashFlows: [
    { date: new Date('2023-02-01'), amount: -25000000 },
    { date: new Date('2024-06-30'), amount: 1000000 },
    { date: new Date('2024-10-31'), amount: 2000000 },
    { date: new Date('2024-11-01'), amount: 35000000 },
  ] as CashFlow[],
  projects: [
    { id: 'proj-3', name: 'Silicon Valley Data Center', type: 'Infrastructure', value: 17500000 },
    { id: 'proj-4', name: 'Boston Tech Hub', type: 'Infrastructure', value: 17500000 }
  ]
}

// Level 4 Projects - NO Waterfall
const LEVEL_4_PROJECTS = [
  { id: 'proj-5', name: 'Miami Beach Resort Development', type: 'Hospitality', value: 8000000 },
  { id: 'proj-6', name: 'Austin Tech Campus', type: 'Mixed-Use', value: 12000000 },
  { id: 'proj-7', name: 'Denver Retail Complex', type: 'Retail', value: 10000000 },
  { id: 'proj-8', name: 'Seattle Green Buildings', type: 'Residential', value: 9000000 }
]

const TOTAL_LEVEL_4_VALUE = LEVEL_4_PROJECTS.reduce((sum, p) => sum + p.value, 0)

// Ownership percentages of Level 4 projects by sub-funds
const OWNERSHIP_STRUCTURE = {
  subFundA_pct: 55, // Sub-Fund A owns 55% of Level 4
  subFundB_pct: 45   // Sub-Fund B owns 45% of Level 4
}

export default function MultiLevelWaterfallDemo() {
  const [distributionAmount, setDistributionAmount] = useState<number[]>([1000000])
  const [taxRate, setTaxRate] = useState<number[]>([21])

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Calculate waterfall for Sub-Fund A
  const subFundACapitalAccounts: InvestorCapitalAccount[] = useMemo(() => {
    return PARENT_FUND.investors.map(investor => ({
      investorId: investor.id,
      investorName: investor.name,
      capitalContributed: (investor.capitalContributed / PARENT_FUND.totalCommitment) * SUB_FUND_A.deployed,
      capitalReturned: 0,
      preferredReturnAccrued: 0,
      preferredReturnPaid: 0,
      distributionsReceived: 0,
    }))
  }, [])

  // Calculate profit allocation from Level 4 FIRST
  const profitAllocation = useMemo(() => {
    const level4Distribution = distributionAmount[0]
    const subFundAProfit = level4Distribution * (OWNERSHIP_STRUCTURE.subFundA_pct / 100)
    const subFundBProfit = level4Distribution * (OWNERSHIP_STRUCTURE.subFundB_pct / 100)

    return {
      level4Distribution,
      subFundAProfit,
      subFundBProfit,
    }
  }, [distributionAmount])

  const subFundAWaterfallResult = useMemo(() => {
    return calculateWaterfall(
      STANDARD_WATERFALL,
      profitAllocation.subFundAProfit,  // Use allocated amount, not full distribution
      subFundACapitalAccounts,
      SUB_FUND_A.fundId,
      new Date().toISOString()
    )
  }, [profitAllocation.subFundAProfit, subFundACapitalAccounts])

  // Calculate waterfall for Sub-Fund B
  const subFundBCapitalAccounts: InvestorCapitalAccount[] = useMemo(() => {
    return PARENT_FUND.investors.map(investor => ({
      investorId: investor.id,
      investorName: investor.name,
      capitalContributed: (investor.capitalContributed / PARENT_FUND.totalCommitment) * SUB_FUND_B.deployed,
      capitalReturned: 0,
      preferredReturnAccrued: 0,
      preferredReturnPaid: 0,
      distributionsReceived: 0,
    }))
  }, [])

  const subFundBWaterfallResult = useMemo(() => {
    return calculateWaterfall(
      STANDARD_WATERFALL,
      profitAllocation.subFundBProfit,  // Use allocated amount, not full distribution
      subFundBCapitalAccounts,
      SUB_FUND_B.fundId,
      new Date().toISOString()
    )
  }, [profitAllocation.subFundBProfit, subFundBCapitalAccounts])

  // Calculate tax impacts
  const currentTaxRate = taxRate[0] / 100
  const calculateTaxImpact = (waterfallResult: any) => {
    return waterfallResult.tierDistributions.map((tier: any) => {
      const isTaxable = tier.tierId !== 'tier-1'
      const taxAmount = isTaxable ? tier.amountDistributed * currentTaxRate : 0
      return {
        ...tier,
        taxAmount,
        afterTaxAmount: tier.amountDistributed - taxAmount,
      }
    })
  }

  const subFundAWithTaxes = useMemo(() => calculateTaxImpact(subFundAWaterfallResult), [subFundAWaterfallResult, currentTaxRate])
  const subFundBWithTaxes = useMemo(() => calculateTaxImpact(subFundBWaterfallResult), [subFundBWaterfallResult, currentTaxRate])

  const totalTaxA = subFundAWithTaxes.reduce((sum, tier) => sum + tier.taxAmount, 0)
  const totalTaxB = subFundBWithTaxes.reduce((sum, tier) => sum + tier.taxAmount, 0)

  // Calculate profit flow from Level 4 to sub-funds
  const profitFlowCalculations = useMemo(() => {
    const level4TotalValue = TOTAL_LEVEL_4_VALUE

    // Calculate what flows up to Parent Fund after sub-fund waterfalls
    const subFundAAfterTax = profitAllocation.subFundAProfit - totalTaxA
    const subFundBAfterTax = profitAllocation.subFundBProfit - totalTaxB

    // Total flowing to Parent Fund
    const totalToParentFund = subFundAAfterTax + subFundBAfterTax

    return {
      level4TotalValue,
      level4Distribution: profitAllocation.level4Distribution,
      subFundAProfit: profitAllocation.subFundAProfit,
      subFundBProfit: profitAllocation.subFundBProfit,
      subFundAOwnershipPct: OWNERSHIP_STRUCTURE.subFundA_pct,
      subFundBOwnershipPct: OWNERSHIP_STRUCTURE.subFundB_pct,
      totalToParentFund,
      subFundAAfterTax,
      subFundBAfterTax,
      subFundANetProfit: profitAllocation.subFundAProfit - totalTaxA,
      subFundBNetProfit: profitAllocation.subFundBProfit - totalTaxB,
    }
  }, [profitAllocation, totalTaxA, totalTaxB])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Multi-Level Waterfall Structure</h1>
        <p className="text-muted-foreground mt-2">
          4-Level fund hierarchy with waterfalls at levels 2 and 3
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distribution Slider */}
        <Card className="bg-gray-100 dark:bg-gray-900/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Distribution Amount</CardTitle>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(distributionAmount[0])}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              value={distributionAmount}
              onValueChange={setDistributionAmount}
              min={0}
              max={100000000}
              step={1000000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>$100M</span>
            </div>
          </CardContent>
        </Card>

        {/* Tax Rate Slider */}
        <Card className="bg-gray-100 dark:bg-gray-900/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Tax Rate</CardTitle>
              <div className="text-right">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{taxRate[0]}%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              value={taxRate}
              onValueChange={setTaxRate}
              min={0}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund Structure Overview */}
      <Card className="bg-gray-100 dark:bg-gray-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBuilding className="w-5 h-5" />
            Fund Structure Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-semibold text-purple-600 dark:text-purple-400">Level 1: Parent Fund</p>
              <p className="text-xs text-muted-foreground">No Waterfall</p>
            </div>
            <div>
              <p className="font-semibold text-blue-600 dark:text-blue-400">Level 2: Sub-Fund A</p>
              <p className="text-xs text-muted-foreground">2 Projects + Waterfall</p>
            </div>
            <div>
              <p className="font-semibold text-green-600 dark:text-green-400">Level 3: Sub-Fund B</p>
              <p className="text-xs text-muted-foreground">2 Projects + Waterfall</p>
            </div>
            <div>
              <p className="font-semibold text-amber-600 dark:text-amber-400">Level 4: Projects</p>
              <p className="text-xs text-muted-foreground">4 Projects, No Waterfall</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PROFIT FLOW CASCADE */}
      <Card className="bg-gray-100 dark:bg-gray-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTrendingUp className="w-5 h-5" />
            Profit Flow from Level 4 to Parent Fund
          </CardTitle>
          <CardDescription>Shows how profits cascade through the fund hierarchy based on ownership percentages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parent Fund Summary (Top) */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Level 1: Parent Fund (Profit Recipient)</p>
            <div className="bg-gray-100 dark:bg-gray-900/20 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">From Sub-Fund A</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(profitFlowCalculations.subFundAAfterTax)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">From Sub-Fund B</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(profitFlowCalculations.subFundBAfterTax)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
                <span>Total Profit Distributed</span>
                <span className="text-purple-600 dark:text-purple-400">{formatCurrency(profitFlowCalculations.totalToParentFund)}</span>
              </div>
            </div>
          </div>

          {/* Upward Flow Arrow */}
          <div className="flex justify-center">
            <div className="text-3xl text-slate-400">↑ ↑</div>
          </div>

          {/* Sub-Fund Allocations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sub-Fund A */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Level 2: Sub-Fund A ({profitFlowCalculations.subFundAOwnershipPct}% ownership)</p>
                <Badge className="bg-blue-600">55%</Badge>
              </div>
              <div className="bg-gray-100 dark:bg-gray-900/20 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receives from Level 4</span>
                  <span className="font-semibold">{formatCurrency(profitFlowCalculations.subFundAProfit)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Less: Tax Impact</span>
                  <span className="font-semibold text-amber-600">-{formatCurrency(totalTaxA)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2 bg-gray-200 dark:bg-gray-800 -mx-3 -my-2 px-3 py-2 rounded">
                  <span>Net to Parent Fund</span>
                  <span className="text-blue-600 dark:text-blue-400">{formatCurrency(profitFlowCalculations.subFundAAfterTax)}</span>
                </div>
              </div>
            </div>

            {/* Sub-Fund B */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Level 3: Sub-Fund B ({profitFlowCalculations.subFundBOwnershipPct}% ownership)</p>
                <Badge className="bg-green-600">45%</Badge>
              </div>
              <div className="bg-gray-100 dark:bg-gray-900/20 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receives from Level 4</span>
                  <span className="font-semibold">{formatCurrency(profitFlowCalculations.subFundBProfit)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Less: Tax Impact</span>
                  <span className="font-semibold text-amber-600">-{formatCurrency(totalTaxB)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2 bg-gray-200 dark:bg-gray-800 -mx-3 -my-2 px-3 py-2 rounded">
                  <span>Net to Parent Fund</span>
                  <span className="text-green-600 dark:text-green-400">{formatCurrency(profitFlowCalculations.subFundBAfterTax)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upward Flow Arrow */}
          <div className="flex justify-center">
            <div className="text-3xl text-slate-400">↑ ↑</div>
          </div>

          {/* Level 4 Profit Source (Bottom) */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Level 4: Direct Projects (Profit Source)</p>
            <div className="bg-gray-100 dark:bg-gray-900/20 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Portfolio Value</span>
                <span className="font-bold">{formatCurrency(profitFlowCalculations.level4TotalValue)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">Distribution Amount</span>
                <span className="font-bold text-lg text-amber-600">{formatCurrency(profitFlowCalculations.level4Distribution)}</span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t">
            <Card className="bg-gray-100 dark:bg-gray-900/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total Tax Deducted</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(totalTaxA + totalTaxB)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-100 dark:bg-gray-900/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Effective Tax Rate</p>
                <p className="text-lg font-bold">
                  {profitFlowCalculations.level4Distribution > 0
                    ? (((totalTaxA + totalTaxB) / profitFlowCalculations.level4Distribution) * 100).toFixed(1)
                    : '0.0'}%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-100 dark:bg-gray-900/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Net Profit Preserved</p>
                <p className="text-lg font-bold text-green-600">
                  {profitFlowCalculations.level4Distribution > 0
                    ? ((profitFlowCalculations.totalToParentFund / profitFlowCalculations.level4Distribution) * 100).toFixed(1)
                    : '0.0'}%
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* SUB-FUND A WATERFALL */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-500 rounded"></div>
          <h2 className="text-2xl font-bold">Level 2: Real Estate Opportunities A</h2>
        </div>
        <p className="text-sm text-muted-foreground">European-style 4-tier waterfall with {SUB_FUND_A.projects.length} projects</p>

        {/* Projects under Sub-Fund A */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SUB_FUND_A.projects.map(project => (
            <Card key={project.id} className="bg-gray-100 dark:bg-gray-900/20">
              <CardContent className="pt-4">
                <p className="font-semibold text-sm">{project.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{project.type}</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-2">{formatCurrency(project.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Waterfall Tiers for Sub-Fund A */}
        <div className="space-y-3 mt-4">
          <h3 className="font-semibold">Waterfall Distribution</h3>
          {subFundAWithTaxes.map((tier: any, idx: number) => {
            const getTierColor = () => {
              switch (tier.tierId) {
                case 'tier-1': return { bg: 'bg-gray-100 dark:bg-gray-900/20', border: 'border-blue-200 dark:border-blue-800', progress: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400' }
                case 'tier-2': return { bg: 'bg-gray-100 dark:bg-gray-900/20', border: 'border-green-200 dark:border-green-800', progress: 'bg-green-500', text: 'text-green-700 dark:text-green-400' }
                case 'tier-3': return { bg: 'bg-gray-100 dark:bg-gray-900/20', border: 'border-purple-200 dark:border-purple-800', progress: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400' }
                case 'tier-4': return { bg: 'bg-gray-100 dark:bg-gray-900/20', border: 'border-amber-200 dark:border-amber-800', progress: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' }
                default: return { bg: 'bg-gray-100 dark:bg-gray-900/20', border: 'border-slate-200 dark:border-slate-800', progress: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-400' }
              }
            }
            const colors = getTierColor()
            const progressPercent = profitAllocation.subFundAProfit > 0
              ? (tier.amountDistributed / profitAllocation.subFundAProfit) * 100
              : 0
            return (
              <div key={tier.tierId} className={`${colors.bg} ${colors.border} border rounded-lg p-3`}>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm">{idx + 1}. {tier.tierName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatCurrency(tier.amountDistributed)}</p>
                    </div>
                    <div className="text-right">
                      {tier.taxAmount > 0 && (
                        <div className="text-xs space-y-1">
                          <p className="text-muted-foreground">Tax: <span className="text-amber-600 font-semibold">{formatCurrency(tier.taxAmount)}</span></p>
                          <p className="font-semibold">After-tax: {formatCurrency(tier.afterTaxAmount)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${colors.progress} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(Math.max(progressPercent, 2), 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{progressPercent.toFixed(1)}% of {formatCurrency(profitAllocation.subFundAProfit)}</span>
                    <span className="font-medium">{progressPercent.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )
          })}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
            <Card className="bg-gray-100 dark:bg-gray-900/20">
              <CardContent className="pt-3">
                <p className="text-xs text-muted-foreground">Total Tax Impact</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(totalTaxA)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-100 dark:bg-gray-900/20">
              <CardContent className="pt-3">
                <p className="text-xs text-muted-foreground">After-Tax Dist.</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(profitAllocation.subFundAProfit - totalTaxA)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* SUB-FUND B WATERFALL */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-green-500 rounded"></div>
          <h2 className="text-2xl font-bold">Level 3: Infrastructure Growth B</h2>
        </div>
        <p className="text-sm text-muted-foreground">European-style 4-tier waterfall with {SUB_FUND_B.projects.length} projects</p>

        {/* Projects under Sub-Fund B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SUB_FUND_B.projects.map(project => (
            <Card key={project.id} className="bg-gray-100 dark:bg-gray-900/20">
              <CardContent className="pt-4">
                <p className="font-semibold text-sm">{project.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{project.type}</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-2">{formatCurrency(project.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Waterfall Tiers for Sub-Fund B */}
        <div className="space-y-3 mt-4">
          <h3 className="font-semibold">Waterfall Distribution</h3>
          {subFundBWithTaxes.map((tier: any, idx: number) => {
            const getTierColor = () => {
              switch (tier.tierId) {
                case 'tier-1': return { bg: 'bg-gray-100 dark:bg-gray-900/20', border: 'border-blue-200 dark:border-blue-800', progress: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400' }
                case 'tier-2': return { bg: 'bg-gray-100 dark:bg-gray-900/20', border: 'border-green-200 dark:border-green-800', progress: 'bg-green-500', text: 'text-green-700 dark:text-green-400' }
                case 'tier-3': return { bg: 'bg-gray-100 dark:bg-gray-900/20', border: 'border-purple-200 dark:border-purple-800', progress: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400' }
                case 'tier-4': return { bg: 'bg-gray-100 dark:bg-gray-900/20', border: 'border-amber-200 dark:border-amber-800', progress: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' }
                default: return { bg: 'bg-gray-100 dark:bg-gray-900/20', border: 'border-slate-200 dark:border-slate-800', progress: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-400' }
              }
            }
            const colors = getTierColor()
            const progressPercent = profitAllocation.subFundBProfit > 0
              ? (tier.amountDistributed / profitAllocation.subFundBProfit) * 100
              : 0
            return (
              <div key={tier.tierId} className={`${colors.bg} ${colors.border} border rounded-lg p-3`}>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm">{idx + 1}. {tier.tierName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatCurrency(tier.amountDistributed)}</p>
                    </div>
                    <div className="text-right">
                      {tier.taxAmount > 0 && (
                        <div className="text-xs space-y-1">
                          <p className="text-muted-foreground">Tax: <span className="text-amber-600 font-semibold">{formatCurrency(tier.taxAmount)}</span></p>
                          <p className="font-semibold">After-tax: {formatCurrency(tier.afterTaxAmount)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${colors.progress} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(Math.max(progressPercent, 2), 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{progressPercent.toFixed(1)}% of {formatCurrency(profitAllocation.subFundBProfit)}</span>
                    <span className="font-medium">{progressPercent.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )
          })}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
            <Card className="bg-gray-100 dark:bg-gray-900/20">
              <CardContent className="pt-3">
                <p className="text-xs text-muted-foreground">Total Tax Impact</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(totalTaxB)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-100 dark:bg-gray-900/20">
              <CardContent className="pt-3">
                <p className="text-xs text-muted-foreground">After-Tax Dist.</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(profitAllocation.subFundBProfit - totalTaxB)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* LEVEL 4 PROJECTS (NO WATERFALL) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-amber-500 rounded"></div>
          <h2 className="text-2xl font-bold">Level 4: Direct Projects</h2>
        </div>
        <p className="text-sm text-muted-foreground">4 projects with no waterfall allocation</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEVEL_4_PROJECTS.map(project => (
            <Card key={project.id} className="bg-gray-100 dark:bg-gray-900/20 hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <p className="font-semibold text-sm">{project.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{project.type}</p>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-3">{formatCurrency(project.value)}</p>
                <Badge variant="secondary" className="mt-3">No Waterfall</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gray-100 dark:bg-gray-900/20 mt-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Level 4 Value</p>
                <p className="text-lg font-bold">{formatCurrency(LEVEL_4_PROJECTS.reduce((sum, p) => sum + p.value, 0))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projects</p>
                <p className="text-lg font-bold">{LEVEL_4_PROJECTS.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Distribution Model</p>
                <p className="text-sm font-bold">Direct</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Waterfall</p>
                <Badge variant="outline">None</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
