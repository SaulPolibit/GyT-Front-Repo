"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, Users, DollarSign, Calculator, ArrowRight, Info } from "lucide-react"
import investorsData from "@/data/investors.json"
import type { Investor } from "@/lib/types"
import {
  calculateWaterfall,
  STANDARD_WATERFALL,
  AMERICAN_WATERFALL,
  formatWaterfallCurrency,
  formatWaterfallPercent,
  type WaterfallStructure,
  type WaterfallDistribution,
  type InvestorCapitalAccount,
} from "@/lib/waterfall-calculations"

export default function WaterfallCalculatorPage() {
  const investors = investorsData as Investor[]

  // State
  const [selectedStructure, setSelectedStructure] = useState<WaterfallStructure>(STANDARD_WATERFALL)
  const [distributionAmount, setDistributionAmount] = useState<string>("1000000")
  const [fundStartDate] = useState("2022-01-01")
  const [distributionDate] = useState(new Date().toISOString().split('T')[0])
  const [waterfallResult, setWaterfallResult] = useState<WaterfallDistribution | null>(null)

  // Prepare capital accounts from investor data (aggregated across all structures)
  const capitalAccounts: InvestorCapitalAccount[] = investors.map(investor => {
    const totalCalledCapital = investor.fundOwnerships?.reduce((sum, fo) => sum + fo.calledCapital, 0) || 0

    return {
      investorId: investor.id,
      investorName: investor.name,
      capitalContributed: totalCalledCapital,
      capitalReturned: investor.totalDistributed * 0.3, // Assume 30% is capital return
      preferredReturnAccrued: 0,
      preferredReturnPaid: investor.totalDistributed * 0.2, // Assume 20% is preferred return
      distributionsReceived: investor.totalDistributed,
    }
  })

  // Calculate waterfall whenever inputs change
  useEffect(() => {
    const amount = parseFloat(distributionAmount) || 0
    if (amount > 0) {
      const result = calculateWaterfall(
        selectedStructure,
        amount,
        capitalAccounts,
        fundStartDate,
        distributionDate
      )
      setWaterfallResult(result)
    } else {
      setWaterfallResult(null)
    }
  }, [distributionAmount, selectedStructure])

  const handleStructureChange = (structureId: string) => {
    if (structureId === 'standard') {
      setSelectedStructure(STANDARD_WATERFALL)
    } else if (structureId === 'american') {
      setSelectedStructure(AMERICAN_WATERFALL)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Waterfall Calculator</h1>
        <p className="text-muted-foreground mt-1">
          Calculate and visualize profit distributions across multi-tier waterfall structures
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Distribution Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution Configuration</CardTitle>
              <CardDescription>Set the distribution amount and waterfall structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Distribution Amount */}
              <div className="space-y-2">
                <Label htmlFor="distributionAmount">Distribution Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="distributionAmount"
                    type="number"
                    value={distributionAmount}
                    onChange={(e) => setDistributionAmount(e.target.value)}
                    className="pl-10"
                    placeholder="1000000"
                  />
                </div>
              </div>

              <Separator />

              {/* Waterfall Structure Selection */}
              <div className="space-y-3">
                <Label>Waterfall Structure</Label>
                <Tabs
                  value={selectedStructure.id.includes('standard') ? 'standard' : 'american'}
                  onValueChange={handleStructureChange}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="standard">Standard (4-Tier)</TabsTrigger>
                    <TabsTrigger value="american">American (3-Tier)</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2 mb-3">
                    <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{selectedStructure.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{selectedStructure.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    {selectedStructure.tiers.map((tier, index) => (
                      <div key={tier.id} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{tier.name}</span>
                        {tier.hurdleRate && (
                          <span className="text-muted-foreground">({tier.hurdleRate}%)</span>
                        )}
                        {tier.lpSplit !== undefined && tier.gpSplit !== undefined && (
                          <span className="text-muted-foreground">
                            ({tier.lpSplit}/{tier.gpSplit} split)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waterfall Breakdown */}
          {waterfallResult && (
            <Card>
              <CardHeader>
                <CardTitle>Waterfall Breakdown</CardTitle>
                <CardDescription>
                  Distribution across {selectedStructure.tiers.length} tiers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {waterfallResult.tierDistributions.map((tier, index) => (
                  <div key={tier.tierId}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{tier.tierName}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {tier.tierType.replace(/_/g, ' ').toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatWaterfallCurrency(tier.amountDistributed)}</p>
                        <p className="text-sm text-muted-foreground">
                          {((tier.amountDistributed / waterfallResult.totalDistributable) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>

                    {/* LP/GP Split */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Limited Partners (LP)</p>
                        <p className="font-semibold">{formatWaterfallCurrency(tier.lpAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">General Partner (GP)</p>
                        <p className="font-semibold">{formatWaterfallCurrency(tier.gpAmount)}</p>
                      </div>
                    </div>

                    {/* Remaining */}
                    {tier.remainingAfterTier > 0 && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4" />
                        <span>Remaining: {formatWaterfallCurrency(tier.remainingAfterTier)}</span>
                      </div>
                    )}

                    {index < waterfallResult.tierDistributions.length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Investor Allocations */}
          {waterfallResult && waterfallResult.investorAllocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Investor Allocations</CardTitle>
                <CardDescription>
                  Distribution to {waterfallResult.investorAllocations.length} investors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {waterfallResult.investorAllocations
                    .sort((a, b) => b.totalAllocation - a.totalAllocation)
                    .map((allocation) => (
                      <div key={allocation.investorId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold">{allocation.investorName}</p>
                            {allocation.ownershipPercent > 0 && (
                              <p className="text-sm text-muted-foreground">
                                {formatWaterfallPercent(allocation.ownershipPercent)} ownership
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-primary">
                              {formatWaterfallCurrency(allocation.totalAllocation)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {((allocation.totalAllocation / waterfallResult.totalDistributable) * 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>

                        {/* Tier-by-tier breakdown */}
                        <div className="space-y-2">
                          {allocation.tierAllocations.map((tierAlloc) => (
                            <div
                              key={tierAlloc.tierId}
                              className="flex items-center justify-between text-sm bg-muted/30 rounded p-2"
                            >
                              <span className="text-muted-foreground">{tierAlloc.tierName}</span>
                              <span className="font-medium">{formatWaterfallCurrency(tierAlloc.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Summary Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Distributable</div>
                <div className="text-2xl font-bold">
                  {formatWaterfallCurrency(parseFloat(distributionAmount) || 0)}
                </div>
              </div>

              {waterfallResult && (
                <>
                  <Separator />

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total to LPs</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatWaterfallCurrency(
                        waterfallResult.tierDistributions.reduce((sum, tier) => sum + tier.lpAmount, 0)
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {(
                        (waterfallResult.tierDistributions.reduce((sum, tier) => sum + tier.lpAmount, 0) /
                          waterfallResult.totalDistributable) *
                        100
                      ).toFixed(1)}%
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total to GP</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatWaterfallCurrency(waterfallResult.gpAllocation.totalAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {((waterfallResult.gpAllocation.totalAmount / waterfallResult.totalDistributable) * 100).toFixed(
                        1
                      )}
                      %
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Number of Investors</div>
                    <div className="text-xl font-semibold">{waterfallResult.investorAllocations.length}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* GP Breakdown */}
          {waterfallResult && waterfallResult.gpAllocation.tierAllocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  GP Allocation Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {waterfallResult.gpAllocation.tierAllocations.map((tierAlloc) => (
                    <div key={tierAlloc.tierId} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{tierAlloc.tierName}</span>
                      <span className="font-semibold">{formatWaterfallCurrency(tierAlloc.amount)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatWaterfallCurrency(waterfallResult.gpAllocation.totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-5 w-5" />
                About Waterfalls
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Waterfall structures determine how profits are distributed between Limited Partners (investors) and the
                General Partner (fund manager).
              </p>
              <p>
                <strong>Standard (European):</strong> Includes GP catch-up tier to ensure GP receives full carried
                interest on all profits.
              </p>
              <p>
                <strong>American:</strong> Simpler structure without catch-up, GP receives carried interest only on
                profits above hurdle.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
