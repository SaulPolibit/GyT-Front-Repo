"use client"

import * as React from "react"
import { use } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle2,
  Home,
  DollarSign,
  Shield,
  Bell,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react"
import type { Structure } from "@/lib/structures-storage"
import { getAuthToken, logout, getCurrentUser } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/format-utils"
import { useTranslation } from '@/hooks/useTranslation'

interface Props {
  params: Promise<{ structureId: string }>
}

export default function CommitmentSuccessPage({ params }: Props) {
  const { structureId } = use(params)
  const searchParams = useSearchParams()
  const { t, language } = useTranslation()
  const router = useRouter()
  const [structure, setStructure] = React.useState<Structure | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [commitmentStatus, setCommitmentStatus] = React.useState<'pending' | 'success' | 'error'>('pending')
  const [commitmentError, setCommitmentError] = React.useState<string | null>(null)
  const [paymentId, setPaymentId] = React.useState<string | null>(null)
  const hasCreatedCommitment = React.useRef(false)

  const tokens = searchParams.get("tokens") || "0"
  const email = searchParams.get("email") || "investor@demo.polibit.io"
  const amount = searchParams.get("amount") || "0"
  const commitmentId = paymentId || `CMT-${Date.now()}`

  // Create the capital commitment record via API
  React.useEffect(() => {
    const createCommitment = async () => {
      // Prevent duplicate calls
      if (hasCreatedCommitment.current) return
      hasCreatedCommitment.current = true

      try {
        const token = getAuthToken()
        if (!token) {
          setCommitmentError('No authentication token found')
          setCommitmentStatus('error')
          return
        }

        const user = getCurrentUser()
        if (!user?.email) {
          setCommitmentError('No user found')
          setCommitmentStatus('error')
          return
        }

        console.log('[Commitment Success] Creating capital commitment:', {
          structureId,
          amount,
          tokens,
          email: user.email
        })

        // Call the payment API to create the commitment record
        // This will also create the structure_investor record
        // Capital commitments don't require a contractId
        const response = await fetch(getApiUrl(API_CONFIG.endpoints.createPayment), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            amount: amount,
            structureId: structureId,
            // No contractId for capital commitments - it's optional for this payment method
            tokens: parseInt(tokens),
            paymentMethod: 'capital-commitment',
            status: 'pending', // Capital commitment starts as pending until capital is called
          }),
        })

        if (response.status === 401) {
          logout()
          router.push('/lp-portal/login')
          return
        }

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to create commitment')
        }

        const data = await response.json()
        console.log('[Commitment Success] Commitment created:', data)

        setPaymentId(data.data?.id || data.data?.submissionId)
        setCommitmentStatus('success')
      } catch (err) {
        console.error('[Commitment Success] Error creating commitment:', err)
        setCommitmentError(err instanceof Error ? err.message : 'Failed to create commitment')
        setCommitmentStatus('error')
      }
    }

    createCommitment()
  }, [structureId, amount, tokens, router])

  // Fetch structure details
  React.useEffect(() => {
    const fetchStructure = async () => {
      try {
        const token = getAuthToken()
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch(getApiUrl(API_CONFIG.endpoints.getSingleStructure(structureId)), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.status === 401) {
          try {
            const errorData = await response.json()
            if (errorData.error === "Invalid or expired token") {
              logout()
              router.push('/lp-portal/login')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

        if (response.ok) {
          const data = await response.json()
          setStructure({
            ...data.data,
            currency: data.data.baseCurrency,
            jurisdiction: data.data.taxJurisdiction,
          })
        }
      } catch (err) {
        console.error('[Commitment Success] Error fetching structure:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStructure()
  }, [structureId, router])

  if (loading || commitmentStatus === 'pending') {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
          <h1 className="text-2xl font-bold mb-2">{t.lpMarketplace.recordingCommitment}</h1>
          <p className="text-muted-foreground">{t.lpMarketplace.recordingCommitmentDesc}</p>
        </div>
      </div>
    )
  }

  if (commitmentStatus === 'error') {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <h1 className="text-2xl font-bold mb-2">{t.lpMarketplace.errorRecordingCommitment}</h1>
          <p className="text-muted-foreground mb-6">{commitmentError || t.lpMarketplace.errorRecordingCommitmentDesc}</p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <a href={`/lp-portal/marketplace/structure/${structureId}`}>
                {t.lpMarketplace.tryAgain}
              </a>
            </Button>
            <Button asChild>
              <a href="/lp-portal/marketplace">
                {t.lpMarketplace.backToMarketplace}
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Success Hero Section */}
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
          <CheckCircle2 className="h-24 w-24 text-primary relative z-10" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{t.lpMarketplace.capitalCommitmentRecorded}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          {t.lpMarketplace.capitalCommitmentRecordedDesc.replace('{amount}', formatCurrency(Number(amount))).replace('{name}', structure?.name || t.common.thisFund)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Commitment Details */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">{t.lpMarketplace.commitmentDetails}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t.lpMarketplace.commitmentId}</p>
                <p className="text-sm font-mono bg-muted p-2 rounded truncate">{commitmentId}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t.lpMarketplace.fundLabel}</p>
                <p className="font-semibold text-sm">{structure?.name || t.common.fund}</p>
                {structure?.type && (
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{structure.type}</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t.lpMarketplace.date}</p>
                <p className="text-sm font-semibold">
                  {new Date().toLocaleString(language === 'spanish' ? 'es-ES' : 'en-US')}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t.lpMarketplace.status}</p>
                <div className="flex items-center gap-2 text-primary mt-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-semibold">{t.lpMarketplace.commitmentRecorded}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Success Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Commitment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t.lpMarketplace.commitmentSummary}</CardTitle>
              <CardDescription>{t.lpMarketplace.commitmentSummaryDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                  <DollarSign className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t.lpMarketplace.totalCapitalCommitment}</p>
                    <p className="text-2xl font-bold">{formatCurrency(Number(amount))}</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                  <Shield className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t.lpMarketplace.tokensCommitted}</p>
                    <p className="text-2xl font-bold">{tokens}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex gap-3">
                  <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">{t.lpMarketplace.noPaymentRequiredNow}</p>
                    <p className="text-xs text-blue-800">
                      {t.lpMarketplace.noPaymentRequiredNowDesc}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card>
            <CardHeader>
              <CardTitle>{t.lpMarketplace.whatHappensNext}</CardTitle>
              <CardDescription>{t.lpMarketplace.whatHappensNextDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">{t.lpMarketplace.capitalCallNotices}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.lpMarketplace.capitalCallNoticesDesc}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">{t.lpMarketplace.payCapitalCalls}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.lpMarketplace.payCapitalCallsDesc}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-semibold text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">{t.lpMarketplace.trackYourCommitment}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.lpMarketplace.trackYourCommitmentDesc}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" asChild>
              <a href="/lp-portal/marketplace">
                <Home className="h-4 w-4 mr-2" />
                {t.lpMarketplace.backToMarketplace}
              </a>
            </Button>
            <Button className="flex-1" asChild>
              <a href="/lp-portal/portfolio">
                <DollarSign className="h-4 w-4 mr-2" />
                {t.lpMarketplace.viewPortfolio}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
