"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Users, Building, Briefcase } from 'lucide-react'
import { getInvestorsByFundId } from '@/lib/investors-storage'
import { getCapitalCalls } from '@/lib/capital-calls-storage'
import type { Investor, CapitalCall } from '@/lib/types'
import type { Structure } from '@/lib/structures-storage'

interface StructureCapTableProps {
  structure: Structure
}

export function StructureCapTable({ structure }: StructureCapTableProps) {
  const [investors, setInvestors] = useState<Investor[]>([])
  const [capitalCalls, setCapitalCalls] = useState<CapitalCall[]>([])

  useEffect(() => {
    // Load investors allocated to this structure
    const fundInvestors = getInvestorsByFundId(structure.id)
    setInvestors(fundInvestors)

    // Load capital calls for calculating actual called capital
    const calls = getCapitalCalls()
    setCapitalCalls(calls)
  }, [structure.id])

  // Calculate actual called capital for an investor in this structure
  const calculateCalledCapital = (investor: Investor): number => {
    const fundCapitalCalls = capitalCalls.filter(cc =>
      cc.fundId === structure.id &&
      cc.status !== 'Draft' &&
      cc.status !== 'Cancelled'
    )

    return fundCapitalCalls.reduce((sum, cc) => {
      const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
      return sum + (allocation?.amountPaid || 0)
    }, 0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Individual': return <User className="h-4 w-4" />
      case 'Institution': return <Building className="h-4 w-4" />
      case 'Family Office': return <Users className="h-4 w-4" />
      case 'Fund of Funds': return <Briefcase className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  if (investors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cap Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No investors allocated to this structure yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cap Table</CardTitle>
          <Badge variant="secondary">
            {investors.length} investor{investors.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {investors.map((investor) => {
            // Find this investor's ownership in this structure
            const ownership = investor.fundOwnerships?.find(fo => fo.fundId === structure.id)
            if (!ownership) return null

            // Calculate actual called capital from transactions
            const actualCalledCapital = calculateCalledCapital(investor)
            const actualUncalledCapital = ownership.commitment - actualCalledCapital
            const calledPercentage = ownership.commitment > 0
              ? (actualCalledCapital / ownership.commitment) * 100
              : 0

            // Calculate ownership % based on actual called capital
            const ownershipPercent = structure.totalCommitment > 0
              ? (actualCalledCapital / structure.totalCommitment) * 100
              : 0

            // Check if this investor has custom terms for this structure
            const customTerms = ownership.customTerms || investor.customTerms

            // Determine if custom terms differ from structure defaults
            const hasCustomTerms = customTerms && (
              (customTerms.managementFee !== undefined && Number(customTerms.managementFee) !== Number(structure.managementFee)) ||
              (customTerms.performanceFee !== undefined && Number(customTerms.performanceFee) !== Number(structure.performanceFee)) ||
              (customTerms.hurdleRate !== undefined && Number(customTerms.hurdleRate) !== Number(structure.hurdleRate)) ||
              (customTerms.preferredReturn !== undefined && Number(customTerms.preferredReturn) !== Number(structure.preferredReturn))
            )

            // Effective terms (custom overrides structure defaults)
            const effectiveTerms = {
              managementFee: customTerms?.managementFee ?? structure.managementFee,
              performanceFee: customTerms?.performanceFee ?? structure.performanceFee,
              hurdleRate: customTerms?.hurdleRate ?? structure.hurdleRate,
              preferredReturn: customTerms?.preferredReturn ?? structure.preferredReturn
            }

            return (
              <Link
                key={investor.id}
                href={`/investment-manager/investors/${investor.id}`}
                className="block p-4 border rounded bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(investor.type)}
                      <span className="font-semibold text-lg">{investor.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {investor.type}
                    </Badge>
                  </div>
                  <Badge variant="default" className="text-base px-3 py-1">
                    {ownershipPercent.toFixed(2)}%
                  </Badge>
                </div>

                <Separator className="my-3" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Commitment</div>
                    <div className="font-semibold">{formatCurrency(ownership.commitment)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Called</div>
                    <div className="font-semibold">{formatCurrency(actualCalledCapital)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Uncalled</div>
                    <div className="font-semibold">{formatCurrency(actualUncalledCapital)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Called %</div>
                    <div className="font-semibold">
                      {calledPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium">Economic Terms</div>
                    {hasCustomTerms && (
                      <Badge variant="secondary" className="text-xs">
                        Custom Terms Applied
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {effectiveTerms.managementFee !== undefined && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Management Fee</div>
                        <div className="font-semibold text-primary">{effectiveTerms.managementFee}%</div>
                      </div>
                    )}
                    {effectiveTerms.performanceFee !== undefined && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Performance Fee</div>
                        <div className="font-semibold text-primary">{effectiveTerms.performanceFee}%</div>
                      </div>
                    )}
                    {effectiveTerms.hurdleRate !== undefined && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Hurdle Rate</div>
                        <div className="font-semibold text-primary">{effectiveTerms.hurdleRate}%</div>
                      </div>
                    )}
                    {effectiveTerms.preferredReturn !== undefined && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Preferred Return</div>
                        <div className="font-semibold text-primary">{effectiveTerms.preferredReturn}%</div>
                      </div>
                    )}
                  </div>
                  {hasCustomTerms && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-900 dark:text-blue-100">
                      Custom terms override structure defaults for this investor
                    </div>
                  )}
                  {!hasCustomTerms && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Using structure's default economic terms
                    </div>
                  )}
                </div>

                {ownership.hierarchyLevel !== undefined && (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline">Level {ownership.hierarchyLevel}</Badge>
                    {ownership.investedDate && (
                      <span className="text-xs text-muted-foreground">
                        Since {formatDate(ownership.investedDate)}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
