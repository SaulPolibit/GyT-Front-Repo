'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { IconBuilding, IconCurrencyDollar, IconPercentage, IconArrowRight, IconAlertCircle } from '@tabler/icons-react'
import { getStructures } from '@/lib/structures-storage'
import { getInvestorByEmail, getCurrentInvestorEmail } from '@/lib/lp-portal-helpers'
import { getCapitalCalls } from '@/lib/capital-calls-storage'

interface InvestorCommitmentData {
  id: string
  fundName: string
  fundId: string
  structureType: string
  subtype: string
  status: string
  onboardingStatus: string
  commitment: number
  calledCapital: number
  uncalledCapital: number
  ownershipPercent: number
  currency: string
  totalFundSize: number
  commitmentProgress: number
}

export default function LPCommitmentsPage() {
  const [commitments, setCommitments] = useState<InvestorCommitmentData[]>([])
  const [totalCommitment, setTotalCommitment] = useState(0)
  const [totalCalled, setTotalCalled] = useState(0)
  const [totalUncalled, setTotalUncalled] = useState(0)
  const [investorName, setInvestorName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const email = getCurrentInvestorEmail()
    const investor = getInvestorByEmail(email)

    if (!investor) return

    setInvestorName(investor.name)

    const allStructures = getStructures()
    const allCapitalCalls = getCapitalCalls()

    // Get all investor's commitments (including pending onboarding)
    const investorCommitments: InvestorCommitmentData[] = investor.fundOwnerships.map(ownership => {
      const structure = allStructures.find(s => s.id === ownership.fundId)

      if (!structure) return null as any

      const commitment = ownership.commitment || 0

      // Calculate called capital from actual capital call payments
      const fundCapitalCalls = allCapitalCalls.filter(cc => cc.fundId === ownership.fundId)
      const investorAllocations = fundCapitalCalls
        .map(cc => cc.investorAllocations.find(alloc => alloc.investorId === investor.id))
        .filter(alloc => alloc !== undefined)

      const calledCapital = investorAllocations.reduce((sum, alloc) => sum + (alloc?.amountPaid || 0), 0)
      const uncalledCapital = commitment - calledCapital
      const commitmentProgress = commitment > 0 ? (calledCapital / commitment) * 100 : 0

      // Calculate ownership percentage based on called capital vs total fund size
      const totalFundSize = structure.totalCommitment || 0
      const ownershipPercent = totalFundSize > 0
        ? (calledCapital / totalFundSize) * 100
        : 0

      return {
        id: ownership.fundId,
        fundName: ownership.fundName,
        fundId: ownership.fundId,
        structureType: structure.type,
        subtype: structure.subtype || structure.type,
        status: structure.status,
        onboardingStatus: ownership.onboardingStatus || investor.status,
        commitment,
        calledCapital,
        uncalledCapital,
        ownershipPercent,
        currency: structure.currency || 'USD',
        totalFundSize: structure.totalCommitment || 0,
        commitmentProgress,
      }
    }).filter((c): c is InvestorCommitmentData => c !== null)

    setCommitments(investorCommitments)

    // Calculate totals (only for active commitments)
    const activeCommitments = investorCommitments.filter(c => c.onboardingStatus === 'Active')
    const totalCom = activeCommitments.reduce((sum, c) => sum + c.commitment, 0)
    const totalCall = activeCommitments.reduce((sum, c) => sum + c.calledCapital, 0)
    const totalUncall = activeCommitments.reduce((sum, c) => sum + c.uncalledCapital, 0)

    setTotalCommitment(totalCom)
    setTotalCalled(totalCall)
    setTotalUncalled(totalUncall)
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getOnboardingStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default'
      case 'KYC/KYB':
      case 'Contracts':
      case 'Payments':
        return 'secondary'
      case 'Pending':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Commitments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your capital commitments across all funds
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Commitment</CardDescription>
            <CardTitle className="text-2xl font-semibold text-primary">
              {formatCurrency(totalCommitment)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Called Capital</CardDescription>
            <CardTitle className="text-2xl font-semibold text-orange-600">
              {formatCurrency(totalCalled)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Uncalled Capital</CardDescription>
            <CardTitle className="text-2xl font-semibold text-green-600">
              {formatCurrency(totalUncalled)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Active Funds</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {commitments.filter(c => c.onboardingStatus === 'Active').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Commitments Grid */}
      {commitments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconBuilding className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Commitments Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              You don't have any active commitments. Complete your pending invitations to start investing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commitments.map((commitment) => (
            <Card key={commitment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">
                      {commitment.fundName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {commitment.subtype}
                    </CardDescription>
                  </div>
                  <Badge variant={getOnboardingStatusColor(commitment.onboardingStatus)}>
                    {commitment.onboardingStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {commitment.onboardingStatus !== 'Active' || commitment.commitment === 0 ? (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                    <IconAlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        {commitment.commitment === 0 ? 'Commitment Not Set' : 'Onboarding In Progress'}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        {commitment.commitment === 0
                          ? 'Complete your onboarding to set your capital commitment'
                          : 'Complete your onboarding to activate your commitment'
                        }
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        asChild
                      >
                        <a href={`/lp-portal/onboarding/${commitment.fundId}`}>
                          {commitment.commitment === 0 ? 'Set Commitment' : 'Continue Onboarding'}
                          <IconArrowRight className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">My Commitment</p>
                        <p className="text-sm font-medium">{formatCurrency(commitment.commitment, commitment.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ownership</p>
                        <p className="text-sm font-medium text-primary">{commitment.ownershipPercent.toFixed(4)}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Called</p>
                        <p className="text-sm font-medium text-orange-600">{formatCurrency(commitment.calledCapital, commitment.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Uncalled</p>
                        <p className="text-sm font-medium text-green-600">{formatCurrency(commitment.uncalledCapital, commitment.currency)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Capital Called</span>
                        <span className="text-xs font-semibold">{commitment.commitmentProgress.toFixed(1)}%</span>
                      </div>
                      <Progress value={commitment.commitmentProgress} className="h-2" />
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-1">Fund Size</div>
                      <div className="text-sm font-medium">{formatCurrency(commitment.totalFundSize, commitment.currency)}</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  )
}
