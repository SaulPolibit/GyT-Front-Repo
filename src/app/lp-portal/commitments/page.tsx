'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { IconBuilding, IconArrowRight, IconAlertCircle } from '@tabler/icons-react'
import { getCurrentUser, getAuthToken, logout } from '@/lib/auth-storage'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'

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
  const router = useRouter()
  const [commitments, setCommitments] = useState<InvestorCommitmentData[]>([])
  const [totalCommitment, setTotalCommitment] = useState(0)
  const [totalCalled, setTotalCalled] = useState(0)
  const [totalUncalled, setTotalUncalled] = useState(0)
  const [activeFunds, setActiveFunds] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completedOnboardings, setCompletedOnboardings] = useState<string[]>([])

  useEffect(() => {
    loadData()
    // Load completed onboardings from sessionStorage
    const completed = JSON.parse(sessionStorage.getItem('completedOnboardings') || '[]')
    setCompletedOnboardings(completed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    const user = getCurrentUser()

    if (!user?.email) {
      setError('No user found. Please log in.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Step 1: Search for investor by email
      console.log('[Commitments] Searching for investor:', user.email)
      const searchResponse = await fetch(
        getApiUrl(API_CONFIG.endpoints.searchInvestors(user.email)),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Handle 401 Unauthorized - session expired or invalid
      if (searchResponse.status === 401) {
        console.log('[Commitments] 401 Unauthorized - clearing session and redirecting to login')
        logout()
        router.push('/lp-portal/login')
        return
      }

      if (!searchResponse.ok) {
        throw new Error(`Failed to search investor: ${searchResponse.statusText}`)
      }

      const searchData = await searchResponse.json()
      console.log('[Commitments] Search response:', searchData)

      if (!searchData.success || !searchData.data || searchData.data.length === 0) {
        // No investor found - show empty state
        console.log('[Commitments] No investor found for this user')
        setCommitments([])
        setIsLoading(false)
        return
      }

      const investor = searchData.data[0] // First matching investor
      console.log('[Commitments] Found investor:', investor.id)

      // Step 2: Get investor commitments
      const commitmentsResponse = await fetch(
        getApiUrl(API_CONFIG.endpoints.getInvestorCommitments(investor.id)),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Handle 401 Unauthorized - session expired or invalid
      if (commitmentsResponse.status === 401) {
        console.log('[Commitments] 401 Unauthorized - clearing session and redirecting to login')
        logout()
        router.push('/lp-portal/login')
        return
      }

      if (!commitmentsResponse.ok) {
        throw new Error(`Failed to fetch commitments: ${commitmentsResponse.statusText}`)
      }

      const commitmentsData = await commitmentsResponse.json()
      console.log('[Commitments] Commitments response:', commitmentsData)

      if (!commitmentsData.success || !commitmentsData.data) {
        throw new Error('Invalid response from server')
      }

      // Step 3: Map API response to component format
      const data = commitmentsData.data
      setTotalCommitment(data.totalCommitment || 0)
      setTotalCalled(data.calledCapital || 0)
      setTotalUncalled(data.uncalledCapital || 0)
      setActiveFunds(data.activeFunds || 0)

      // Map structures to InvestorCommitmentData format
      interface APIStructure {
        id: string
        name: string
        type: string
        subtype?: string
        status?: string
        onboardingStatus?: string
        commitment?: number
        calledCapital?: number
        uncalledCapital?: number
        ownershipPercent?: number
        currency?: string
        totalFundSize?: number
      }

      const mappedCommitments: InvestorCommitmentData[] = (data.structures || []).map((structure: APIStructure) => {
        const commitment = structure.commitment || 0
        const calledCapital = structure.calledCapital || 0
        const commitmentProgress = commitment > 0 ? (calledCapital / commitment) * 100 : 0

        return {
          id: structure.id,
          fundName: structure.name,
          fundId: structure.id,
          structureType: structure.type,
          subtype: structure.subtype || structure.type,
          status: structure.status || 'Active',
          onboardingStatus: structure.onboardingStatus || 'Active',
          commitment,
          calledCapital,
          uncalledCapital: structure.uncalledCapital || 0,
          ownershipPercent: structure.ownershipPercent || 0,
          currency: structure.currency || 'USD',
          totalFundSize: structure.totalFundSize || 0,
          commitmentProgress,
        }
      })

      setCommitments(mappedCommitments)
    } catch (err) {
      console.error('[Commitments] Error fetching commitments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch commitments data')
    } finally {
      setIsLoading(false)
    }
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Commitments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your capital commitments across all funds
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading commitments...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Commitments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your capital commitments across all funds
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Commitments</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              {error}
            </p>
            <Button onClick={() => loadData()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
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
              {activeFunds}
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
              You don&apos;t have any active commitments. Complete your pending invitations to start investing.
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
                {(commitment.onboardingStatus !== 'Active' && commitment.onboardingStatus !== 'Complete' || commitment.commitment === 0) && !completedOnboardings.includes(commitment.fundId) ? (
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
                ) : completedOnboardings.includes(commitment.fundId) && commitment.onboardingStatus !== 'Active' && commitment.onboardingStatus !== 'Complete' ? (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <IconAlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Onboarding Complete
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Your onboarding is complete. The fund manager will review and activate your commitment.
                      </p>
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
