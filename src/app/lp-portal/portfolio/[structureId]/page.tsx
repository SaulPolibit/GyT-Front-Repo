"use client"

import * as React from "react"
import { use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Wallet,
  FileText,
  AlertCircle,
  Info,
  Shield,
  Scale,
  Users,
  Bell,
  BarChart3,
  ExternalLink,
} from "lucide-react"
import { getApiUrl } from "@/lib/api-config"
import { getAuthToken, logout } from "@/lib/auth-storage"
import { getFirmSettings } from "@/lib/firm-settings-storage"

interface Props {
  params: Promise<{ structureId: string }>
}

export default function StructureDataRoomPage({ params }: Props) {
  const { structureId } = use(params)
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const router = useRouter()

  const [structure, setStructure] = React.useState<any>(null)
  const [payment, setPayment] = React.useState<any>(null)
  const [investor, setInvestor] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [documents, setDocuments] = React.useState<any[]>([])

  React.useEffect(() => {
    const fetchStructureData = async () => {
      console.log('[StructureDetail] Starting fetchStructureData')
      console.log('[StructureDetail] Structure ID:', structureId)
      console.log('[StructureDetail] Payment ID:', paymentId)

      const token = getAuthToken()
      if (!token) {
        console.error('[StructureDetail] No authentication token found')
        setLoading(false)
        return
      }

      try {
        // Step 1: Fetch structure by structure ID
        console.log('[StructureDetail] Fetching structure:', structureId)
        const structureResponse = await fetch(
          getApiUrl(`/api/structures/${structureId}`),
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (structureResponse.status === 401) {
          console.log('[StructureDetail] 401 Unauthorized - clearing session')
          logout()
          router.push('/lp-portal/login')
          return
        }

        if (!structureResponse.ok) {
          console.error('[StructureDetail] Failed to fetch structure:', structureResponse.status)
          setLoading(false)
          return
        }

        const structureResult = await structureResponse.json()
        console.log('[StructureDetail] Structure data:', structureResult)

        if (structureResult.success && structureResult.data) {
          setStructure(structureResult.data)
        }

        // Step 2: Fetch payment by payment ID
        if (paymentId) {
          console.log('[StructureDetail] Fetching payment by ID:', paymentId)
          const paymentResponse = await fetch(
            getApiUrl(`/api/payments/${paymentId}`),
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )

          if (paymentResponse.status === 401) {
            logout()
            router.push('/lp-portal/login')
            return
          }

          if (paymentResponse.ok) {
            const paymentResult = await paymentResponse.json()
            console.log('[StructureDetail] Payment data:', paymentResult)

            if (paymentResult.success && paymentResult.data) {
              setPayment(paymentResult.data)

              // Set investor from payment
              if (paymentResult.data.investor) {
                setInvestor(paymentResult.data.investor)
              }
            }
          } else {
            console.warn('[StructureDetail] Failed to fetch payment:', paymentResponse.status)
          }
        } else {
          console.warn('[StructureDetail] No payment ID provided')
        }

        // Step 3: Fetch documents for this structure
        console.log('[StructureDetail] Fetching documents for structure:', structureId)
        const documentsResponse = await fetch(
          getApiUrl(`/api/documents/entity/Structure/${structureId}`),
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (documentsResponse.status === 401) {
          logout()
          router.push('/lp-portal/login')
          return
        }

        if (documentsResponse.ok) {
          const documentsResult = await documentsResponse.json()
          console.log('[StructureDetail] Documents data:', documentsResult)
          setDocuments(documentsResult.data || [])
        }

      } catch (error) {
        console.error('[StructureDetail] Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStructureData()
  }, [structureId, paymentId, router])


  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get custom terms for this investor
  const getCustomTerms = () => {
    if (!investor) return null
    const structureId = payment?.structure?.id || payment?.structureId
    const fundOwnership = investor.fundOwnerships?.find((fo: any) => fo.fundId === structureId)
    return fundOwnership?.customTerms || null
  }

  // Calculate performance metrics
  const calculatePerformanceMetrics = () => {
    if (!payment) {
      return { tvpi: 0, dpi: 0, rvpi: 0, moic: 0, irr: 0, totalDistributed: 0 }
    }

    // TODO: Fetch distributions from API in the future
    const totalDistributed = 0

    const calledCapital = payment.amount || 0
    const currentValue = payment.amount || 0 // TODO: Get actual current value from API

    const tvpi = calledCapital > 0 ? (totalDistributed + currentValue) / calledCapital : 0
    const dpi = calledCapital > 0 ? totalDistributed / calledCapital : 0
    const rvpi = calledCapital > 0 ? currentValue / calledCapital : 0
    const moic = tvpi

    // Mock IRR for demonstration (would need actual cash flow dates for real calculation)
    const irr = calledCapital > 0 ? ((currentValue + totalDistributed - calledCapital) / calledCapital) * 15 : 0

    return { tvpi, dpi, rvpi, moic, irr, totalDistributed }
  }

  if (loading || !structure || !payment) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <a href="/lp-portal/portfolio">
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {loading ? 'Loading...' : 'Investment not found'}
            </h1>
          </div>
        </div>
      </div>
    )
  }

  // Calculate metrics from payment data
  const customTerms = getCustomTerms()
  const performanceMetrics = calculatePerformanceMetrics()

  // Create display structure from payment data
  const displayInvestorStructure = {
    id: payment.structure?.id || payment.structureId,
    name: payment.structure?.name || structure.name,
    type: payment.structure?.type || structure.type,
    commitment: payment.amount || 0,
    calledCapital: payment.amount || 0,
    currentValue: payment.amount || 0,
    ownershipPercent: 0, // TODO: Calculate from API data
    unrealizedGain: 0, // currentValue - calledCapital
    uncalledCapital: 0,
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <a href="/lp-portal/portfolio">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{displayInvestorStructure.name}</h1>
              <p className="text-muted-foreground">{displayInvestorStructure.type}</p>
            </div>
          </div>
        </div>
        <Badge variant={displayInvestorStructure.calledCapital > 0 ? 'default' : 'secondary'}>
          {displayInvestorStructure.calledCapital > 0 ? 'Active' : 'Pending'}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Commitment</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(displayInvestorStructure.commitment || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercent(displayInvestorStructure.ownershipPercent)} ownership
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Called Capital</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(displayInvestorStructure.calledCapital)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {displayInvestorStructure.commitment > 0
                ? `${((displayInvestorStructure.calledCapital / displayInvestorStructure.commitment) * 100).toFixed(1)}% of commitment`
                : 'No commitment yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(displayInvestorStructure.currentValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {displayInvestorStructure.calledCapital > 0
                ? `${((displayInvestorStructure.currentValue - displayInvestorStructure.calledCapital) / displayInvestorStructure.calledCapital * 100).toFixed(1)}% unrealized gain`
                : 'No called capital yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TVPI</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.tvpi.toFixed(2)}x</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total Value to Paid-In
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="legal">Legal & Terms</TabsTrigger>
          <TabsTrigger value="payment">Payment Details</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Structure Details */}
          <Card>
            <CardHeader>
              <CardTitle>Structure Details</CardTitle>
              <CardDescription>Key information about this investment structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Structure Name</p>
                  <p className="text-base font-medium">{structure.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="text-base font-medium capitalize">{structure.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subtype</p>
                  <p className="text-base font-medium">{structure.subtype}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jurisdiction</p>
                  <p className="text-base font-medium">{structure.jurisdiction}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="text-base font-medium">{structure.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-base font-medium capitalize">{structure.status}</p>
                </div>
                {structure.inceptionDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Inception Date</p>
                    <p className="text-base font-medium">{formatDate(structure.inceptionDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created Date</p>
                  <p className="text-base font-medium">{formatDate(structure.createdDate)}</p>
                </div>
                {structure.fundTerm && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fund Term</p>
                    <p className="text-base font-medium">{structure.fundTerm}</p>
                  </div>
                )}
                {structure.fundType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fund Type</p>
                    <p className="text-base font-medium">{structure.fundType}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* My Investment Terms */}
          <Card>
            <CardHeader>
              <CardTitle>My Investment Terms</CardTitle>
              <CardDescription>
                {customTerms ? 'You have custom economic terms for this investment' : 'Standard fund economic terms apply to your investment'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground">Standard Terms</h4>
                  <div className="space-y-3">
                    {structure.managementFee && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Management Fee</span>
                        <span className={`text-base font-medium ${customTerms?.managementFee !== undefined ? 'line-through text-muted-foreground' : ''}`}>
                          {structure.managementFee}%
                        </span>
                      </div>
                    )}
                    {structure.performanceFee && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Performance Fee</span>
                        <span className={`text-base font-medium ${customTerms?.performanceFee !== undefined ? 'line-through text-muted-foreground' : ''}`}>
                          {structure.performanceFee}%
                        </span>
                      </div>
                    )}
                    {structure.preferredReturn && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Preferred Return</span>
                        <span className={`text-base font-medium ${customTerms?.preferredReturn !== undefined ? 'line-through text-muted-foreground' : ''}`}>
                          {structure.preferredReturn}%
                        </span>
                      </div>
                    )}
                    {structure.hurdleRate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Hurdle Rate</span>
                        <span className={`text-base font-medium ${customTerms?.hurdleRate !== undefined ? 'line-through text-muted-foreground' : ''}`}>
                          {structure.hurdleRate}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {customTerms && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary">My Custom Terms</h4>
                    <div className="space-y-3">
                      {customTerms.managementFee !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Management Fee</span>
                          <span className="text-base font-semibold text-primary">
                            {customTerms.managementFee}%
                          </span>
                        </div>
                      )}
                      {customTerms.performanceFee !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Performance Fee</span>
                          <span className="text-base font-semibold text-primary">
                            {customTerms.performanceFee}%
                          </span>
                        </div>
                      )}
                      {customTerms.preferredReturn !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Preferred Return</span>
                          <span className="text-base font-semibold text-primary">
                            {customTerms.preferredReturn}%
                          </span>
                        </div>
                      )}
                      {customTerms.hurdleRate !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Hurdle Rate</span>
                          <span className="text-base font-semibold text-primary">
                            {customTerms.hurdleRate}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Investment performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">IRR</p>
                  <p className="text-2xl font-bold">{performanceMetrics.irr.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Internal Rate of Return</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MOIC</p>
                  <p className="text-2xl font-bold">{performanceMetrics.moic.toFixed(2)}x</p>
                  <p className="text-xs text-muted-foreground mt-1">Multiple on Invested Capital</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TVPI</p>
                  <p className="text-2xl font-bold">{performanceMetrics.tvpi.toFixed(2)}x</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Value to Paid-In</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DPI</p>
                  <p className="text-2xl font-bold">{performanceMetrics.dpi.toFixed(2)}x</p>
                  <p className="text-xs text-muted-foreground mt-1">Distributions to Paid-In</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RVPI</p>
                  <p className="text-2xl font-bold">{performanceMetrics.rvpi.toFixed(2)}x</p>
                  <p className="text-xs text-muted-foreground mt-1">Residual Value to Paid-In</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Distributed</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(performanceMetrics.totalDistributed)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Cumulative</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waterfall & Distribution Model */}
          {structure.waterfallStructure && (
            <Card>
              <CardHeader>
                <CardTitle>Waterfall & Distribution Model</CardTitle>
                <CardDescription>How distributions are calculated and allocated</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Waterfall Structure</p>
                    <p className="text-base font-medium capitalize">{structure.waterfallStructure}</p>
                  </div>
                  {structure.distributionFrequency && (
                    <div>
                      <p className="text-sm text-muted-foreground">Distribution Frequency</p>
                      <p className="text-base font-medium">{structure.distributionFrequency}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Distribution Tiers</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">1</Badge>
                      <div>
                        <p className="font-medium">Return of Capital</p>
                        <p className="text-muted-foreground">100% to LPs until capital returned</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">2</Badge>
                      <div>
                        <p className="font-medium">Preferred Return</p>
                        <p className="text-muted-foreground">
                          100% to LPs until {customTerms?.preferredReturn || structure.preferredReturn}% preferred return achieved
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">3</Badge>
                      <div>
                        <p className="font-medium">GP Catch-Up</p>
                        <p className="text-muted-foreground">
                          100% to GP until GP receives {customTerms?.performanceFee || structure.performanceFee}% of total profits
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">4</Badge>
                      <div>
                        <p className="font-medium">Carried Interest Split</p>
                        <p className="text-muted-foreground">
                          {100 - Number(customTerms?.performanceFee || structure.performanceFee)}% to LPs, {customTerms?.performanceFee || structure.performanceFee}% to GP
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Investment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Summary</CardTitle>
              <CardDescription>Your investment position in this structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Commitment</span>
                  <span className="text-base font-semibold">{formatCurrency(displayInvestorStructure.commitment)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Called Capital</span>
                  <span className="text-base font-semibold">{formatCurrency(displayInvestorStructure.calledCapital)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Uncalled Capital</span>
                  <span className="text-base font-semibold">{formatCurrency(displayInvestorStructure.uncalledCapital)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Current Value</span>
                  <span className="text-base font-semibold">{formatCurrency(displayInvestorStructure.currentValue)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Unrealized Gain/Loss</span>
                  <span className={`text-base font-semibold ${displayInvestorStructure.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(displayInvestorStructure.unrealizedGain)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Information */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Information</CardTitle>
              <CardDescription>Investment capacity and diversification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Current Investments</p>
                  <p className="text-2xl font-bold">N/A</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Planned Investments</p>
                  <p className="text-2xl font-bold">{structure.plannedInvestments || 'N/A'}</p>
                </div>
                {structure.minCheckSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Min Check Size</p>
                    <p className="text-base font-medium">{formatCurrency(structure.minCheckSize)}</p>
                  </div>
                )}
                {structure.maxCheckSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Max Check Size</p>
                    <p className="text-base font-medium">{formatCurrency(structure.maxCheckSize)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Key Dates & Contacts */}
          <Card>
            <CardHeader>
              <CardTitle>Key Dates & Contacts</CardTitle>
              <CardDescription>Important dates and fund manager information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Key Dates</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {structure.inceptionDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Fund Inception</p>
                        <p className="text-base font-medium">{formatDate(structure.inceptionDate)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">My Investment Date</p>
                      <p className="text-base font-medium">
                        {formatDate(payment.createdAt || structure.createdDate)}
                      </p>
                    </div>
                    {structure.fundTerm && (
                      <div>
                        <p className="text-sm text-muted-foreground">Fund Term</p>
                        <p className="text-base font-medium">{structure.fundTerm}</p>
                      </div>
                    )}
                    {structure.distributionFrequency && (
                      <div>
                        <p className="text-sm text-muted-foreground">Next Report</p>
                        <p className="text-base font-medium">{structure.distributionFrequency}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-3">Fund Manager Contact</h4>
                  <div className="space-y-2 text-sm">
                    <p>For questions or assistance, please contact:</p>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="font-medium">{getFirmSettings().firmName || 'Investment Manager'}</p>
                      <p className="text-muted-foreground">Email: {getFirmSettings().firmEmail || 'support@example.com'}</p>
                      {getFirmSettings().firmPhone && (
                        <p className="text-muted-foreground">Phone: {getFirmSettings().firmPhone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Next capital calls, distributions, and reporting dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p>No upcoming events at this time</p>
                    <p className="text-xs mt-1">You will be notified of any capital calls or distributions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal & Terms Tab */}
        <TabsContent value="legal" className="space-y-4">
          {/* Subscription Agreement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Subscription Agreement
              </CardTitle>
              <CardDescription>Key terms from your subscription agreement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start py-2 border-b">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Subscription Amount</p>
                    <p className="text-xs text-muted-foreground">Initial commitment to the fund</p>
                  </div>
                  <p className="text-base font-semibold">{formatCurrency(displayInvestorStructure.commitment)}</p>
                </div>

                <div className="flex justify-between items-start py-2 border-b">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Ownership Interest</p>
                    <p className="text-xs text-muted-foreground">Percentage of fund ownership</p>
                  </div>
                  <p className="text-base font-semibold">{formatPercent(displayInvestorStructure.ownershipPercent)}</p>
                </div>

                <div className="flex justify-between items-start py-2 border-b">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Subscription Date</p>
                    <p className="text-xs text-muted-foreground">Date of subscription</p>
                  </div>
                  <p className="text-base font-medium">
                    {formatDate(payment.createdAt || structure.createdDate)}
                  </p>
                </div>

                <div className="flex justify-between items-start py-2 border-b">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Investor Type</p>
                    <p className="text-xs text-muted-foreground">Classification for regulatory purposes</p>
                  </div>
                  <p className="text-base font-medium capitalize">{investor?.type?.replace(/-/g, ' ') || 'N/A'}</p>
                </div>

                <div className="flex justify-between items-start py-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Accreditation Status</p>
                    <p className="text-xs text-muted-foreground">Qualified purchaser status</p>
                  </div>
                  <Badge variant="default">Accredited Investor</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partnership/Operating Agreement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Partnership Agreement
              </CardTitle>
              <CardDescription>Key terms from the limited partnership agreement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Management & Control</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {structure.legalTerms?.managementControl ||
                      "The General Partner has exclusive authority to manage and control the business and affairs of the Partnership. Limited Partners have no right to participate in management and control of the Partnership business."}
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2">Capital Contributions</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      Your total capital commitment: <span className="font-semibold text-foreground">{formatCurrency(displayInvestorStructure.commitment)}</span>
                    </p>
                    {structure.legalTerms?.capitalContributions ? (
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {structure.legalTerms.capitalContributions}
                      </p>
                    ) : (
                      <>
                        <p className="text-muted-foreground">
                          Capital contributions shall be made within {structure.capitalCallPaymentDeadline || '15'} business days of receiving a capital call notice.
                        </p>
                        <p className="text-muted-foreground">
                          Minimum notice period: {structure.capitalCallNoticePeriod || '10'} business days
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2">Allocations & Distributions</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {structure.legalTerms?.allocationsDistributions ? (
                      <p className="whitespace-pre-wrap">
                        {structure.legalTerms.allocationsDistributions}
                      </p>
                    ) : (
                      <>
                        <p>
                          Profits and losses shall be allocated among the Partners in accordance with their respective Partnership Interests.
                        </p>
                        <p>
                          Distributions shall be made at the discretion of the General Partner in accordance with the waterfall provisions set forth in Schedule A of the Partnership Agreement.
                        </p>
                        <p>
                          Distribution frequency: {structure.distributionFrequency || 'Quarterly or as deemed appropriate by GP'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Schedule
              </CardTitle>
              <CardDescription>Management fees and performance compensation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold">Management Fee</p>
                    <p className="text-base font-bold">
                      {customTerms?.managementFee !== undefined ? customTerms.managementFee : structure.managementFee}% per annum
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Calculated on committed capital during investment period, then on invested capital during harvest period.
                    Payable quarterly in arrears.
                  </p>
                  {customTerms?.managementFee !== undefined && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-primary">
                        Custom rate: {customTerms.managementFee}% (Standard: {structure.managementFee}%)
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-muted rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold">Performance Fee (Carried Interest)</p>
                    <p className="text-base font-bold">
                      {customTerms?.performanceFee !== undefined ? customTerms.performanceFee : structure.performanceFee}%
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The General Partner shall receive {customTerms?.performanceFee !== undefined ? customTerms.performanceFee : structure.performanceFee}%
                    of realized and unrealized gains after return of capital and preferred return to Limited Partners.
                  </p>
                  {customTerms?.performanceFee !== undefined && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-primary">
                        Custom rate: {customTerms.performanceFee}% (Standard: {structure.performanceFee}%)
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-muted rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold">Preferred Return</p>
                    <p className="text-base font-bold">
                      {customTerms?.preferredReturn !== undefined ? customTerms.preferredReturn : structure.preferredReturn}% per annum
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Limited Partners are entitled to receive a preferred return of {customTerms?.preferredReturn !== undefined ? customTerms.preferredReturn : structure.preferredReturn}%
                    per annum on contributed capital before GP participates in carried interest.
                  </p>
                  {customTerms?.preferredReturn !== undefined && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-primary">
                        Custom rate: {customTerms.preferredReturn}% (Standard: {structure.preferredReturn}%)
                      </p>
                    </div>
                  )}
                </div>

                {structure.hurdleRate && (
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold">Hurdle Rate</p>
                      <p className="text-base font-bold">
                        {customTerms?.hurdleRate !== undefined ? customTerms.hurdleRate : structure.hurdleRate}% per annum
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum return threshold that must be achieved before performance fees are earned.
                    </p>
                    {customTerms?.hurdleRate !== undefined && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-primary">
                          Custom rate: {customTerms.hurdleRate}% (Standard: {structure.hurdleRate}%)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-900 dark:text-amber-100">
                    <strong>Expense Reimbursement:</strong> The Partnership shall reimburse the General Partner for all ordinary
                    and necessary expenses incurred on behalf of the Partnership, including legal, accounting, and administrative expenses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rights & Obligations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Rights & Obligations
              </CardTitle>
              <CardDescription>Your rights and responsibilities as a limited partner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-green-700 dark:text-green-400">Limited Partner Rights</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    {structure.legalTerms?.limitedPartnerRights && structure.legalTerms.limitedPartnerRights.length > 0 ? (
                      structure.legalTerms.limitedPartnerRights.map((right: string, idx: number) => (
                        <li key={idx}>{right}</li>
                      ))
                    ) : (
                      <>
                        <li>Right to receive quarterly financial statements and annual audited financials</li>
                        <li>Right to receive K-1 tax forms annually by March 15th</li>
                        <li>Right to attend annual investor meetings</li>
                        <li>Right to receive distributions in accordance with the waterfall provisions</li>
                        <li>Right to inspect partnership books and records upon reasonable notice</li>
                        <li>Right to receive capital call notices at least {structure.capitalCallNoticePeriod || '10'} business days in advance</li>
                        <li>Pro-rata participation in future fundraising opportunities</li>
                      </>
                    )}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2 text-orange-700 dark:text-orange-400">Limited Partner Obligations</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    {structure.legalTerms?.limitedPartnerObligations && structure.legalTerms.limitedPartnerObligations.length > 0 ? (
                      structure.legalTerms.limitedPartnerObligations.map((obligation: string, idx: number) => (
                        <li key={idx}>{obligation}</li>
                      ))
                    ) : (
                      <>
                        <li>Obligation to fund capital calls within {structure.capitalCallPaymentDeadline || '15'} business days</li>
                        <li>Obligation to maintain accredited investor status</li>
                        <li>Obligation to provide updated tax information annually</li>
                        <li>Obligation to notify GP of any changes to contact information</li>
                        <li>Obligation to comply with transfer restrictions (see below)</li>
                        <li>Obligation to indemnify Partnership for breach of representations</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voting Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Voting Rights
              </CardTitle>
              <CardDescription>Matters requiring limited partner consent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The following actions require the consent of Limited Partners holding at least {structure.legalTerms?.votingRights?.votingThreshold || 66.67}% of the Partnership Interests:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside ml-2">
                {structure.legalTerms?.votingRights?.mattersRequiringConsent && structure.legalTerms.votingRights.mattersRequiringConsent.length > 0 ? (
                  structure.legalTerms.votingRights.mattersRequiringConsent.map((matter: string, idx: number) => (
                    <li key={idx}>{matter}</li>
                  ))
                ) : (
                  <>
                    <li>Amendment of the Partnership Agreement</li>
                    <li>Removal of the General Partner for cause</li>
                    <li>Extension of the fund term beyond the initial term plus permitted extensions</li>
                    <li>Dissolution of the Partnership prior to the end of the fund term</li>
                    <li>Change in the investment strategy or restrictions</li>
                    <li>Increase in management fees or performance fees</li>
                    <li>Transfer of GP interest to a third party</li>
                  </>
                )}
              </ul>
              <div className="p-3 bg-muted rounded-md mt-3">
                <p className="text-xs">
                  <strong>Your Voting Power:</strong> {formatPercent(displayInvestorStructure.ownershipPercent)} of total Partnership Interests
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Redemption & Withdrawal */}
          <Card>
            <CardHeader>
              <CardTitle>Redemption & Withdrawal Terms</CardTitle>
              <CardDescription>Conditions for withdrawing your investment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">Lock-Up Period</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {structure.legalTerms?.redemptionTerms?.lockUpPeriod ||
                    `Your capital commitment is subject to a lock-up period through the earlier of (i) the end of the investment period or (ii) ${structure.fundTerm || '10 years'} from the fund inception date. No redemptions or withdrawals are permitted during the lock-up period except in extraordinary circumstances as determined by the GP.`}
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Withdrawal Conditions:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {structure.legalTerms?.redemptionTerms?.withdrawalConditions && structure.legalTerms.redemptionTerms.withdrawalConditions.length > 0 ? (
                    structure.legalTerms.redemptionTerms.withdrawalConditions.map((condition: string, idx: number) => (
                      <li key={idx}>{condition}</li>
                    ))
                  ) : (
                    <>
                      <li>Death or disability of individual investor</li>
                      <li>Bankruptcy or insolvency of investor</li>
                      <li>Regulatory requirement mandating disposition</li>
                      <li>With consent of GP in its sole discretion</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Withdrawal Process:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {structure.legalTerms?.redemptionTerms?.withdrawalProcess && structure.legalTerms.redemptionTerms.withdrawalProcess.length > 0 ? (
                    // @ts-ignore
                    structure.legalTerms.redemptionTerms.withdrawalProcess.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))
                  ) : (
                    <>
                      <li>Written notice to GP at least 90 days in advance</li>
                      <li>Subject to GP approval</li>
                      <li>Withdrawal price based on most recent NAV less 2% early withdrawal penalty</li>
                      <li>Payment within 180 days of approval, subject to Partnership liquidity</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer Restrictions</CardTitle>
              <CardDescription>Limitations on transferring your partnership interest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-900 dark:text-red-100">
                  <strong>General Prohibition:</strong> {structure.legalTerms?.transferRestrictions?.generalProhibition ||
                    "Partnership Interests may not be sold, assigned, transferred, pledged, or otherwise disposed of without the prior written consent of the General Partner, which may be withheld in its sole discretion."}
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Permitted Transfers (with GP consent):</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {structure.legalTerms?.transferRestrictions?.permittedTransfers && structure.legalTerms.transferRestrictions.permittedTransfers.length > 0 ? (
                    structure.legalTerms.transferRestrictions.permittedTransfers.map((transfer: string, idx: number) => (
                      <li key={idx}>{transfer}</li>
                    ))
                  ) : (
                    <>
                      <li>Transfers to immediate family members or family trusts</li>
                      <li>Transfers to wholly-owned affiliates</li>
                      <li>Transfers required by law or court order</li>
                      <li>Transfers to other existing Limited Partners</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Transfer Requirements:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {structure.legalTerms?.transferRestrictions?.transferRequirements && structure.legalTerms.transferRestrictions.transferRequirements.length > 0 ? (
                    structure.legalTerms.transferRestrictions.transferRequirements.map((req: string, idx: number) => (
                      <li key={idx}>{req}</li>
                    ))
                  ) : (
                    <>
                      <li>Transferee must be an accredited investor and qualified purchaser</li>
                      <li>Transferee must execute subscription documents and partnership agreement</li>
                      <li>Transfer must comply with all applicable securities laws</li>
                      <li>Transferor responsible for legal fees and transfer taxes</li>
                      <li>GP may charge reasonable administrative fee for processing transfer</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Reporting Commitments */}
          <Card>
            <CardHeader>
              <CardTitle>Reporting Frequency Commitments</CardTitle>
              <CardDescription>Regular reports and communications you will receive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-semibold mb-1">Quarterly Reports</p>
                    <p className="text-xs text-muted-foreground">
                      {structure.legalTerms?.reportingCommitments?.quarterlyReports ||
                        "Unaudited financial statements, NAV updates, portfolio summaries within 45 days of quarter end"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-semibold mb-1">Annual Reports</p>
                    <p className="text-xs text-muted-foreground">
                      {structure.legalTerms?.reportingCommitments?.annualReports ||
                        "Audited financial statements and detailed portfolio review within 120 days of year end"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-semibold mb-1">Tax Forms (K-1)</p>
                    <p className="text-xs text-muted-foreground">
                      {structure.legalTerms?.reportingCommitments?.taxForms ||
                        "Schedule K-1 (Form 1065) delivered by March 15th annually"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-semibold mb-1">Capital Notices</p>
                    <p className="text-xs text-muted-foreground">
                      {structure.legalTerms?.reportingCommitments?.capitalNotices ||
                        `Capital call and distribution notices sent at least ${structure.capitalCallNoticePeriod || '10'} business days in advance`}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Additional Communications:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    {structure.legalTerms?.reportingCommitments?.additionalCommunications && structure.legalTerms.reportingCommitments.additionalCommunications.length > 0 ? (
                      structure.legalTerms.reportingCommitments.additionalCommunications.map((comm: string, idx: number) => (
                        <li key={idx}>{comm}</li>
                      ))
                    ) : (
                      <>
                        <li>Annual investor meeting (virtual or in-person)</li>
                        <li>Material event notifications (acquisitions, dispositions, major developments)</li>
                        <li>Valuation updates for significant portfolio changes</li>
                        <li>Regulatory filings and compliance updates</li>
                        <li>Access to online investor portal for 24/7 account access</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liability Limitations */}
          <Card>
            <CardHeader>
              <CardTitle>Liability Limitations</CardTitle>
              <CardDescription>Limited liability protections and exceptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">Limited Liability Protection</p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {structure.legalTerms?.liabilityLimitations?.limitedLiabilityProtection ||
                    "As a Limited Partner, your liability is limited to your capital commitment to the Partnership. You shall not be liable for any debts, obligations, or liabilities of the Partnership beyond your committed capital contribution."}
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Exceptions to Limited Liability:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {structure.legalTerms?.liabilityLimitations?.exceptionsToLimitedLiability && structure.legalTerms.liabilityLimitations.exceptionsToLimitedLiability.length > 0 ? (
                    structure.legalTerms.liabilityLimitations.exceptionsToLimitedLiability.map((exception: string, idx: number) => (
                      <li key={idx}>{exception}</li>
                    ))
                  ) : (
                    <>
                      <li>Return of distributions: Wrongful distributions may be reclaimed by creditors up to 1 year after distribution</li>
                      <li>Participation in control: Active participation in management may expose LP to general liability</li>
                      <li>Fraud or willful misconduct: Intentional wrongdoing not protected</li>
                      <li>Breach of subscription representations: False representations in subscription documents</li>
                      <li>Environmental liabilities: Certain environmental claims may pierce limited liability under federal law</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="p-3 bg-muted rounded-md mt-3">
                <p className="text-xs">
                  {structure.legalTerms?.liabilityLimitations?.maximumExposureNote ? (
                    <span dangerouslySetInnerHTML={{ __html: structure.legalTerms.liabilityLimitations.maximumExposureNote.replace('{{commitment}}', formatCurrency(displayInvestorStructure.commitment)) }} />
                  ) : (
                    <>
                      <strong>Your Maximum Exposure:</strong> {formatCurrency(displayInvestorStructure.commitment)} (committed capital) plus
                      potential clawback of distributions received within past 12 months in extraordinary circumstances
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Indemnification */}
          <Card>
            <CardHeader>
              <CardTitle>Indemnification Clauses</CardTitle>
              <CardDescription>Mutual indemnification obligations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Partnership Indemnifies You For:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside ml-2">
                  {structure.legalTerms?.indemnification?.partnershipIndemnifiesLPFor && structure.legalTerms.indemnification.partnershipIndemnifiesLPFor.length > 0 ? (
                    structure.legalTerms.indemnification.partnershipIndemnifiesLPFor.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))
                  ) : (
                    <>
                      <li>Claims arising from Partnership activities conducted in good faith</li>
                      <li>Litigation related to your status as Limited Partner (not personal conduct)</li>
                      <li>Environmental claims related to Partnership properties (subject to limitations)</li>
                      <li>Third-party claims arising from Partnership investments</li>
                    </>
                  )}
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2">You Indemnify Partnership For:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside ml-2">
                  {structure.legalTerms?.indemnification?.lpIndemnifiesPartnershipFor && structure.legalTerms.indemnification.lpIndemnifiesPartnershipFor.length > 0 ? (
                    structure.legalTerms.indemnification.lpIndemnifiesPartnershipFor.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))
                  ) : (
                    <>
                      <li>Breach of representations and warranties in subscription agreement</li>
                      <li>Violation of transfer restrictions</li>
                      <li>Claims arising from your unauthorized disclosure of confidential information</li>
                      <li>Tax liabilities resulting from your failure to provide accurate tax information</li>
                      <li>Third-party claims arising from your willful misconduct or gross negligence</li>
                    </>
                  )}
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2">Indemnification Procedures:</h4>
                <div className="space-y-2 text-sm text-muted-foreground whitespace-pre-wrap">
                  {structure.legalTerms?.indemnification?.indemnificationProcedures ||
                    "Indemnified party must provide prompt written notice of any claim. Indemnifying party has right to assume defense with counsel of its choice. Indemnified party may participate in defense at own expense.\n\nNo settlement may be made without consent of indemnified party (not to be unreasonably withheld)."}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Details Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Information about your payment for this investment</CardDescription>
            </CardHeader>
            <CardContent>
              {!payment ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No payment information available</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Payment details will appear here once your payment has been processed.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Date */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Payment Date</p>
                      <p className="text-base font-medium">
                        {payment.createdAt ? formatDate(payment.createdAt) : 'N/A'}
                      </p>
                    </div>

                    {/* Email */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="text-base font-medium break-all">
                        {payment.email || investor?.email || 'N/A'}
                      </p>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                      <p className="text-base font-medium capitalize">
                        {payment.paymentMethod || 'N/A'}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge
                        variant={
                          payment.status === 'completed' ? 'default' :
                          payment.status === 'pending' ? 'secondary' :
                          'outline'
                        }
                        className="capitalize"
                      >
                        {payment.status || 'N/A'}
                      </Badge>
                    </div>
                  </div>

                  {/* Transaction Hashes */}
                  {(payment.paymentTransactionHash || payment.mintTransactionHash) && (
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold">Blockchain Transactions</h4>

                      {payment.paymentTransactionHash && payment.paymentTransactionHash.trim() !== '' && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Payment Transaction Hash</p>
                          <a
                            href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL || 'https://amoy.polygonscan.com/tx/'}${payment.paymentTransactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono bg-muted p-2 rounded break-all block hover:bg-muted/80 transition-colors text-primary hover:underline"
                          >
                            {payment.paymentTransactionHash}
                          </a>
                        </div>
                      )}

                      {payment.mintTransactionHash && payment.mintTransactionHash.trim() !== '' && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Token Mint Transaction Hash</p>
                          <a
                            href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL || 'https://amoy.polygonscan.com/tx/'}${payment.mintTransactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono bg-muted p-2 rounded break-all block hover:bg-muted/80 transition-colors text-primary hover:underline"
                          >
                            {payment.mintTransactionHash}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Image/Receipt */}
                  {payment.paymentImage && payment.paymentImage.trim() !== '' && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-3">Payment Receipt</h4>
                      <div className="border rounded-lg p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(payment.paymentImage, '_blank')}
                          className="flex items-center gap-2"
                        >
                          View Receipt
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Structure-related documents and materials</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No documents available</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Documents will appear here once they are uploaded.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{doc.documentName}</p>
                          <p className="text-sm text-muted-foreground">{doc.documentType}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.filePath, '_blank')}
                        className="flex items-center gap-2 flex-shrink-0"
                      >
                        See
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
