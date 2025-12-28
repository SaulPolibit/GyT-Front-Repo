"use client"

import * as React from "react"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Shield,
  FileText,
  Landmark,
} from "lucide-react"
import { getCurrentInvestorEmail } from "@/lib/lp-portal-helpers"
import { useToast } from "@/hooks/use-toast"
import type { Structure } from "@/lib/structures-storage"
import { getAuthToken, logout } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { useRouter } from "next/navigation"

interface Props {
  params: Promise<{ structureId: string }>
}

export default function StructureCheckoutPage({ params }: Props) {
  const { structureId } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [structure, setStructure] = React.useState<Structure | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [tokenAmount, setTokenAmount] = React.useState<string>('')
  const [pricePerToken, setPricePerToken] = React.useState(1000) // Default $1,000 per token
  const [agreedToTerms, setAgreedToTerms] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    const fetchStructure = async () => {
      setLoading(true)
      setError(null)

      try {
        const token = getAuthToken()

        if (!token) {
          setError('No authentication token found')
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

        // Handle 401 Unauthorized - session expired or invalid
        if (response.status === 401) {

          // Check if it's an expired token error
          try {
            const errorData = await response.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Account] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/lp-portal/login')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch structure: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('[Structure Checkout] API Response:', data)

        // Map API fields to existing structure format
        const mappedStructure = {
          ...data.data,
          currency: data.data.baseCurrency,
          jurisdiction: data.data.taxJurisdiction,
          fundTerm: data.data.finalDate,
        }

        setStructure(mappedStructure)

        // Log structure data for debugging
        console.log('[Structure Checkout] Loaded structure:', {
          id: mappedStructure?.id,
          name: mappedStructure?.name,
          tokenValue: mappedStructure?.tokenValue,
          minCheckSize: mappedStructure?.minCheckSize,
          totalCommitment: mappedStructure?.totalCommitment,
        })

        // Set price from structure's smartContract.tokenValue if available, otherwise use default
        if (mappedStructure?.smartContract?.tokenValue && mappedStructure.smartContract.tokenValue > 0) {
          setPricePerToken(mappedStructure.smartContract.tokenValue)
          console.log('[Structure Checkout] Using structure.smartContract.tokenValue:', mappedStructure.smartContract.tokenValue)
        } else {
          console.log('[Structure Checkout] structure.smartContract.tokenValue not available, using default: 1000')
        }
      } catch (err) {
        console.error('[Structure Checkout] Error fetching structure:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch structure')
        setStructure(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStructure()
  }, [structureId])

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const tokens = parseInt(tokenAmount) || 0
  const totalCost = tokens * pricePerToken
  const isFormValid = tokens > 0 && agreedToTerms

  // Check if contract signing is enabled
  const enableContractSigning = process.env.NEXT_PUBLIC_ENABLE_CONTRACT_SIGNING !== 'false'

  const handleSignContracts = async () => {
    if (!isFormValid || !structure) return

    setIsSubmitting(true)
    try {
      // Check if contract signing is enabled via environment variable
      const enableContractSigning = process.env.NEXT_PUBLIC_ENABLE_CONTRACT_SIGNING !== 'false'

      // Get current investor email
      const investorEmail = getCurrentInvestorEmail()

      // Generate random suffix for unique demo contracts (email+randomnumber@domain.com)
      const randomSuffix = Math.floor(Math.random() * 1000000)
      const [localPart, domain] = investorEmail.includes('@')
        ? investorEmail.split('@')
        : [investorEmail, '']
      const uniqueEmail = domain
        ? `${localPart}+${randomSuffix}@${domain}`
        : `${investorEmail}+${randomSuffix}`

      // Navigate based on contract signing configuration
      if (enableContractSigning) {
        // Redirect to contracts page with structure details as query params
        const contractsUrl = `/lp-portal/marketplace/structure/${structureId}/contracts?tokens=${tokens}&email=${encodeURIComponent(uniqueEmail)}&amount=${totalCost}`
        window.location.href = contractsUrl
      } else {
        // Skip contracts and go directly to payment
        const paymentUrl = `/lp-portal/marketplace/structure/${structureId}/payment?tokens=${tokens}&email=${encodeURIComponent(uniqueEmail)}&amount=${totalCost}`
        window.location.href = paymentUrl
      }
    } catch (error) {
      console.error('Navigation error:', error)
      toast({
        title: "Error",
        description: "Failed to proceed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" asChild>
          <a href={`/lp-portal/marketplace/structure/${structureId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </a>
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!structure) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" asChild>
          <a href="/lp-portal/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </a>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold mb-2">
              {error ? 'Error loading structure' : 'Structure not found'}
            </p>
            <p className="text-sm text-muted-foreground">
              {error || 'The structure you are looking for could not be found.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <a href={`/lp-portal/marketplace/structure/${structureId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Structure
        </a>
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Structure Summary */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">{structure.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-2">
                <Landmark className="h-4 w-4" />
                {structure.type}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Price per Token</p>
                <p className="text-2xl font-bold">{formatCurrency(pricePerToken)}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Your Investment</p>
                <p className="text-3xl font-bold text-primary">
                  {tokens > 0 ? `${tokens} Tokens` : '0'}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(totalCost)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Checkout Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Structure Details */}
          <Card>
            <CardHeader>
              <CardTitle>Structure Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Structure Type</p>
                  <Badge variant="outline">{structure.type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge variant="default">{structure.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Jurisdiction</p>
                  <p className="text-sm font-semibold">{structure.jurisdiction}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Commitment</p>
                  <p className="text-sm font-semibold">{formatCurrency(structure.totalCommitment)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Purchase Form */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Tokens</CardTitle>
              <CardDescription>Select the number of tokens you want to purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="token-amount">Number of Tokens</Label>
                <div className="relative">
                  <Input
                    id="token-amount"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="1"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    className="text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    tokens
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Each token costs {formatCurrency(pricePerToken)}
                </p>
              </div>

              {tokens > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Subtotal ({tokens} tokens)</span>
                      <span className="font-semibold">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fees</span>
                      <span className="font-semibold">{formatCurrency(0)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold">Total Amount</span>
                      <span className="font-bold text-primary">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Legal Agreement</CardTitle>
              <CardDescription>Review and accept the fund structure terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Terms Summary */}
              <div className="space-y-4">
                <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Fund Agreement</p>
                    <p className="text-xs text-muted-foreground">
                      You agree to the terms and conditions of this fund structure, including management fees, distribution policies, and investor rights.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                  <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Confidentiality & Compliance</p>
                    <p className="text-xs text-muted-foreground">
                      You confirm that your information is accurate and that you comply with all applicable laws, including KYC/AML requirements.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-primary/5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="terms" className="text-sm cursor-pointer">
                  <p className="text-xs leading-relaxed">
                    By checking this box and completing my purchase, I acknowledge that I have read, understood, and agree to be bound by the Operating Agreement. I understand that my acquisition of Tokens constitutes the legal equivalent of acquiring Membership Units, that the blockchain ledger is the definitive record of ownership, and that I am subject to all transfer restrictions and other terms set forth therein. I confirm that I hold valid Próspera e-Residency or Physical Residency status, have completed all required KYC procedures, and consent to the exclusive jurisdiction of Próspera ZEDE law and the Próspera Arbitration Center for any disputes arising from this agreement.
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" asChild>
              <a href={`/lp-portal/marketplace/structure/${structureId}`}>
                Cancel
              </a>
            </Button>
            <Button
              className="flex-1"
              size="lg"
              disabled={!isFormValid || isSubmitting}
              onClick={handleSignContracts}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {enableContractSigning ? 'Proceeding to Contracts...' : 'Proceeding to Payment...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {enableContractSigning ? 'Continue to Sign Contracts' : 'Continue to Payment'}
                </>
              )}
            </Button>
          </div>

          {/* Info Message */}
          {!agreedToTerms && tokens > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex gap-3 pt-6">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Please agree to the terms and conditions to proceed with your token purchase.
                </p>
              </CardContent>
            </Card>
          )}

          {tokens === 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="flex gap-3 pt-6">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Enter the number of tokens you want to purchase to see the total amount and submit your request.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
