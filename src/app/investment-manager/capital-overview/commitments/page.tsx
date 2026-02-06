'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { IconBuilding, IconTrendingUp, IconUsers, IconCurrencyDollar, IconArrowRight } from '@tabler/icons-react'
import { getStructures, type Structure } from '@/lib/structures-storage'
import { getInvestors } from '@/lib/investors-storage'
import { getCapitalCalls } from '@/lib/capital-calls-storage'
// Load cleanup utility for browser console
import '@/lib/cleanup-orphaned-structures'

interface StructureCommitmentData extends Structure {
  totalCommitments: number
  calledCapital: number
  totalInvestors: number
  fundraiseProgress: number
}

export default function CommitmentsPage() {
  const router = useRouter()
  const [structures, setStructures] = useState<StructureCommitmentData[]>([])
  const [totalCommitments, setTotalCommitments] = useState(0)
  const [totalInvestors, setTotalInvestors] = useState(0)
  const [avgFundraiseProgress, setAvgFundraiseProgress] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const allStructures = getStructures()
    const allInvestors = getInvestors()
    const allCapitalCalls = getCapitalCalls()

    const structuresWithCommitments: StructureCommitmentData[] = allStructures.map(structure => {
      // Get investors for this structure (only Active)
      const structureInvestors = allInvestors.filter(inv => {
        if (!inv.fundOwnerships) return false
        const ownership = inv.fundOwnerships.find(fo => fo.fundId === structure.id)
        if (!ownership) return false
        // Check per-structure status first, fall back to global status
        const status = ownership.onboardingStatus ?? inv.status ?? 'Active'
        return status === 'Active'
      })

      // Calculate total commitments for THIS structure
      const totalCommitments = structureInvestors.reduce((sum, inv) => {
        // Find this investor's specific commitment to THIS structure
        const ownership = inv.fundOwnerships?.find(fo => fo.fundId === structure.id)
        return sum + (ownership?.commitment || 0)
      }, 0)

      // Calculate actual called capital from capital call transactions
      const structureCapitalCalls = allCapitalCalls.filter(cc =>
        cc.fundId === structure.id &&
        cc.status !== 'Draft' &&
        cc.status !== 'Cancelled'
      )

      const calledCapital = structureCapitalCalls.reduce((sum, cc) => {
        // Sum all paid allocations for this capital call
        const totalPaid = cc.investorAllocations.reduce((allocSum, alloc) => {
          return allocSum + (alloc.amountPaid || 0)
        }, 0)
        return sum + totalPaid
      }, 0)

      // Calculate fundraise progress based on commitments
      const fundraiseProgress = structure.totalCommitment > 0
        ? Math.min((totalCommitments / structure.totalCommitment) * 100, 100)
        : 0

      return {
        ...structure,
        totalCommitments,
        calledCapital,
        totalInvestors: structureInvestors.length,
        fundraiseProgress,
      }
    })

    setStructures(structuresWithCommitments)

    // Calculate totals
    const totalCom = structuresWithCommitments.reduce((sum, s) => sum + s.totalCommitments, 0)
    const totalInv = new Set(
      allInvestors.filter(inv => {
        // Only count investors with at least one Active fund ownership
        return inv.fundOwnerships?.some(fo => {
          const status = fo.onboardingStatus ?? inv.status ?? 'Active'
          return status === 'Active'
        })
      }).map(inv => inv.id)
    ).size
    const avgProgress = structuresWithCommitments.length > 0
      ? structuresWithCommitments.reduce((sum, s) => sum + s.fundraiseProgress, 0) / structuresWithCommitments.length
      : 0

    setTotalCommitments(totalCom)
    setTotalInvestors(totalInv)
    setAvgFundraiseProgress(avgProgress)
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'fundraising':
        return 'secondary'
      case 'closed':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Capital Commitments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track investor commitments across all structures
          </p>
        </div>
        <Button onClick={() => router.push('/investment-manager/structures')}>
          <IconBuilding className="w-4 h-4 mr-2" />
          View Structures
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Commitments</CardDescription>
            <CardTitle className="text-2xl font-semibold text-primary">
              {formatCurrency(totalCommitments)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Structures</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {structures.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Investors</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {totalInvestors}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Avg Fundraise Progress</CardDescription>
            <CardTitle className="text-2xl font-semibold text-green-600">
              {avgFundraiseProgress.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Structures Grid */}
      {structures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconBuilding className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Structures</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first fund structure
            </p>
            <Button onClick={() => router.push('/investment-manager/onboarding')}>
              <IconBuilding className="w-4 h-4 mr-2" />
              Create Structure
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {structures.map((structure) => (
            <Card key={structure.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">
                      {structure.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {structure.subtype}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(structure.status)}>
                    {structure.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="text-sm font-medium">{formatCurrency(structure.totalCommitment, structure.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Committed</p>
                    <p className="text-sm font-medium text-green-600">{formatCurrency(structure.totalCommitments, structure.currency)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Fundraise Progress</span>
                    <span className="text-xs font-semibold">{structure.fundraiseProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={structure.fundraiseProgress} className="h-2" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <IconUsers className="w-4 h-4" />
                    <span>{structure.totalInvestors} investors</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/investment-manager/structures/${structure.id}`)}
                  >
                    <span className="text-xs">View</span>
                    <IconArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
