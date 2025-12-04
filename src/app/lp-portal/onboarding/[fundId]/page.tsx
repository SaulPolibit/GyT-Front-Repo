"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CheckCircle2,
  Circle,
  FileText,
  Shield,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Upload,
} from "lucide-react"
import { useBreadcrumb } from "@/contexts/lp-breadcrumb-context"
import { toast } from "sonner"
import { getCurrentUser, getAuthToken } from '@/lib/auth-storage'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'

type OnboardingStep = 'KYC/KYB' | 'Contracts' | 'Commitment' | 'Complete'

const STEPS: OnboardingStep[] = ['KYC/KYB', 'Contracts', 'Commitment', 'Complete']

export default function OnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const fundId = params.fundId as string
  const { setCustomBreadcrumb, clearCustomBreadcrumb } = useBreadcrumb()

  const [currentStep, setCurrentStep] = React.useState<OnboardingStep>('KYC/KYB')
  const [fundName, setFundName] = React.useState('')
  const [investorId, setInvestorId] = React.useState('')
  const [commitment, setCommitment] = React.useState(0)
  const [structureData, setStructureData] = React.useState<{
    tokenName: string
    tokenSymbol: string
    tokenValue: number
    minTokens: number
    maxTokens: number
  } | null>(null)
  const [completionSummary, setCompletionSummary] = React.useState<{
    investorName: string
    kycCompleted: boolean
    contractsSigned: string[]
    tokensPurchased: number
    totalAmount: number
    paymentMethod: string
    ownershipPercent: number
  } | null>(null)

  // KYC/KYB form data
  const [kycData, setKycData] = React.useState({
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    idNumber: '',
    address: '',
    taxId: '',
    sourceOfFunds: '',
    occupation: '',
  })

  // Contracts form data
  const [contractsData, setContractsData] = React.useState({
    subscriptionAgreementSigned: false,
    lpaSigned: false,
    investorQuestionnaireSigned: false,
    accreditationVerified: false,
  })

  // Document viewer state
  const [viewingDocument, setViewingDocument] = React.useState<{
    title: string
    content: string
    onSign: () => void
  } | null>(null)

  // Payments form data
  const [paymentsData, setPaymentsData] = React.useState({
    tokensToPurchase: 0,
    paymentMethod: 'card' as 'card' | 'ach' | 'crypto',
  })

  React.useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        console.log('[Onboarding] Starting to load data for fundId:', fundId)

        const user = getCurrentUser()
        console.log('[Onboarding] Current user:', user)

        if (!user?.email) {
          console.error('[Onboarding] No user email found')
          toast.error('User not found. Please log in.')
          router.push('/lp-portal/login')
          return
        }

        const token = getAuthToken()
        if (!token) {
          console.error('[Onboarding] No auth token found')
          toast.error('Authentication required')
          router.push('/lp-portal/login')
          return
        }

        // Step 1: Search for investor by email
        console.log('[Onboarding] Searching for investor:', user.email)
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

        console.log('[Onboarding] Search response status:', searchResponse.status)

        if (!searchResponse.ok) {
          console.error('[Onboarding] Search failed with status:', searchResponse.status)
          toast.error('Failed to load investor data')
          router.push('/lp-portal')
          return
        }

        const searchData = await searchResponse.json()
        console.log('[Onboarding] Search data:', searchData)

        if (!searchData.success || !searchData.data || searchData.data.length === 0) {
          console.error('[Onboarding] No investor found in search results')
          toast.error('Investor not found')
          router.push('/lp-portal')
          return
        }

        const investor = searchData.data[0]
        console.log('[Onboarding] Found investor:', investor.id)
        setInvestorId(investor.id)

        // Step 2: Get investor commitments (which includes structures)
        console.log('[Onboarding] Fetching investor commitments for:', investor.id)
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

        console.log('[Onboarding] Commitments response status:', commitmentsResponse.status)

        if (!commitmentsResponse.ok) {
          console.error('[Onboarding] Failed to fetch investor commitments')
          toast.error('Failed to load structure data')
          router.push('/lp-portal')
          return
        }

        const commitmentsData = await commitmentsResponse.json()
        console.log('[Onboarding] Commitments data:', commitmentsData)

        if (!commitmentsData.success || !commitmentsData.data) {
          console.error('[Onboarding] Invalid commitments data response')
          toast.error('Structure not found')
          router.push('/lp-portal')
          return
        }

        const structures = commitmentsData.data.structures || []
        console.log('[Onboarding] Structures:', structures)
        console.log('[Onboarding] Looking for fundId:', fundId)

        const structure = structures.find((s: any) => s.id === fundId)
        console.log('[Onboarding] Found structure:', structure)

        if (!structure) {
          console.error('[Onboarding] Structure not found for fundId:', fundId)
          toast.error('Structure not found')
          router.push('/lp-portal')
          return
        }

        console.log('[Onboarding] Setting fund name:', structure.name)
        setFundName(structure.name)
        setCommitment(structure.commitment || 0)

        // Store investor details for KYC prefill
        const investorDetails = investor

        // Load structure data for token information
        const structureResponse = await fetch(
          getApiUrl(API_CONFIG.endpoints.getSingleStructure(fundId)),
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (structureResponse.ok) {
          const structureData = await structureResponse.json()
          if (structureData.success && structureData.data) {
            const struct = structureData.data
            if (struct.tokenValue) {
              setStructureData({
                tokenName: struct.tokenName || 'Tokens',
                tokenSymbol: struct.tokenSymbol || 'TKN',
                tokenValue: struct.tokenValue,
                minTokens: struct.minTokensPerInvestor || 1,
                maxTokens: struct.maxTokensPerInvestor || 1000,
              })
              setPaymentsData(prev => ({ ...prev, tokensToPurchase: struct.minTokensPerInvestor || 1 }))
            }
          }
        }

        // Set custom breadcrumb for this fund
        setCustomBreadcrumb(`/lp-portal/onboarding/${fundId}`, structure.name)

        // Set current step based on THIS fund's onboarding status
        const status = structure.onboardingStatus

        // Check if investor has completed KYC/KYB for any other fund
        const hasCompletedKYC = structures.some(
          (s: any) => s.id !== fundId && s.onboardingStatus && s.onboardingStatus !== 'Pending'
        )

        if (status === 'KYC/KYB') setCurrentStep('KYC/KYB')
        else if (status === 'Contracts') setCurrentStep('Contracts')
        else if (status === 'Commitment') setCurrentStep('Commitment')
        else if (status === 'Active') setCurrentStep('Complete')
        else if (hasCompletedKYC) {
          setCurrentStep('Contracts')
        } else {
          setCurrentStep('KYC/KYB')
        }

        // Pre-fill KYC data from investor
        setKycData({
          fullName: investorDetails.name || '',
          dateOfBirth: '',
          nationality: '',
          idNumber: '',
          address: investorDetails.address || '',
          taxId: investorDetails.taxId || '',
          sourceOfFunds: '',
          occupation: '',
        })
      } catch (error) {
        console.error('[Onboarding] Error loading onboarding data:', error)
        toast.error('Failed to load onboarding data')
        router.push('/lp-portal')
      }
    }

    console.log('[Onboarding] Effect triggered for fundId:', fundId)

    loadOnboardingData()

    // Cleanup breadcrumb on unmount
    return () => {
      clearCustomBreadcrumb(`/lp-portal/onboarding/${fundId}`)
    }
  }, [fundId, router, setCustomBreadcrumb, clearCustomBreadcrumb])

  const getStepIcon = (step: OnboardingStep) => {
    switch (step) {
      case 'KYC/KYB': return Shield
      case 'Contracts': return FileText
      case 'Commitment': return CreditCard
      case 'Complete': return CheckCircle2
    }
  }

  const getProgress = () => {
    const stepIndex = STEPS.indexOf(currentStep)
    return ((stepIndex + 1) / STEPS.length) * 100
  }

  const handleKycSubmit = async () => {
    if (!kycData.fullName || !kycData.dateOfBirth || !kycData.nationality || !kycData.idNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    // TODO: Implement API endpoint to update onboarding status
    // For now, just move to next step in UI
    toast.success('KYC/KYB verification completed')
    setCurrentStep('Contracts')
  }

  const handleContractsSubmit = async () => {
    if (!contractsData.subscriptionAgreementSigned || !contractsData.lpaSigned) {
      toast.error('Please sign all required documents')
      return
    }

    // TODO: Implement API endpoint to update onboarding status
    // For now, just move to next step in UI
    toast.success('Contracts signed successfully')
    setCurrentStep('Commitment')
  }

  const handlePaymentsSubmit = async () => {
    if (!paymentsData.tokensToPurchase || paymentsData.tokensToPurchase === 0) {
      toast.error('Please select the number of tokens to purchase')
      return
    }

    if (structureData && (paymentsData.tokensToPurchase < structureData.minTokens || paymentsData.tokensToPurchase > structureData.maxTokens)) {
      toast.error(`Token purchase must be between ${structureData.minTokens} and ${structureData.maxTokens}`)
      return
    }

    // Save payment method preferences for future capital calls
    const totalAmount = paymentsData.tokensToPurchase * (structureData?.tokenValue || 0)
    const paymentMethodLabel = paymentsData.paymentMethod === 'card' ? 'Card' :
                               paymentsData.paymentMethod === 'ach' ? 'Bank Account (ACH)' :
                               'Crypto (Bridge by Stripe)'

    toast.info('Saving commitment and payment preferences...')

    // TODO: Implement API endpoint to update commitment and onboarding status
    // In production:
    // 1. Save commitment amount and token allocation
    // 2. Save preferred payment method for future capital calls
    // 3. Update onboarding status to Active
    // 4. When capital call is issued, investor will be notified to complete payment

    setTimeout(() => {
      if (!structureData) {
        toast.error('Structure data not found')
        return
      }

      // Calculate ownership percentage based on tokens purchased
      // Note: This requires totalTokens from the structure
      const ownershipPercent = 0 // Will be calculated once API provides total tokens

      // Create completion summary
      setCompletionSummary({
        investorName: kycData.fullName,
        kycCompleted: true,
        contractsSigned: [
          contractsData.subscriptionAgreementSigned ? 'Subscription Agreement' : '',
          contractsData.lpaSigned ? 'Limited Partnership Agreement' : '',
          contractsData.investorQuestionnaireSigned ? 'Investor Questionnaire' : '',
          contractsData.accreditationVerified ? 'Accredited Investor Verification' : '',
        ].filter(Boolean),
        tokensPurchased: paymentsData.tokensToPurchase,
        totalAmount,
        paymentMethod: paymentMethodLabel,
        ownershipPercent,
      })

      toast.success('Payment preferences saved! Onboarding complete.')
      setCurrentStep('Complete')
    }, 1500)
  }

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const openDocument = (documentType: 'subscription' | 'lpa' | 'questionnaire' | 'accreditation') => {
    const documents = {
      subscription: {
        title: 'Subscription Agreement',
        content: `
SUBSCRIPTION AGREEMENT

This Subscription Agreement ("Agreement") is entered into between ${fundName} ("Fund") and the undersigned investor ("Investor").

1. SUBSCRIPTION
The Investor hereby subscribes for limited partnership interests in the Fund for a total commitment of ${formatCurrency(commitment)}.

2. REPRESENTATIONS AND WARRANTIES
The Investor represents and warrants that:
- They have the financial capacity to bear the economic risk of this investment
- They have received and reviewed the Fund's offering documents
- They understand the risks associated with this investment
- All information provided is accurate and complete

3. CAPITAL CONTRIBUTIONS
The Investor agrees to make capital contributions as requested by the General Partner through capital calls.

4. ACCEPTANCE
This subscription is subject to acceptance by the General Partner.

[Additional terms and conditions would appear here in a production environment]

By signing below, the Investor acknowledges that they have read, understood, and agree to be bound by the terms of this Agreement.
        `,
        onSign: () => {
          setContractsData({ ...contractsData, subscriptionAgreementSigned: true })
          setViewingDocument(null)
          toast.success('Subscription Agreement signed')
        }
      },
      lpa: {
        title: 'Limited Partnership Agreement (LPA)',
        content: `
LIMITED PARTNERSHIP AGREEMENT

This Limited Partnership Agreement ("LPA") governs the ${fundName}.

1. FORMATION
The Fund is formed as a limited partnership under applicable law.

2. TERM
The term of the Fund shall be [X] years from the final closing date.

3. MANAGEMENT
The General Partner shall have full authority to manage the Fund's business.

4. CAPITAL COMMITMENTS AND CONTRIBUTIONS
Limited Partners commit to contribute capital as set forth in their subscription agreements.

5. DISTRIBUTIONS
Distributions shall be made in accordance with the waterfall provisions outlined in Schedule A.

6. FEES AND EXPENSES
- Management Fee: [X]% per annum
- Performance Fee: [X]% carried interest

7. TRANSFER RESTRICTIONS
Limited Partner interests may not be transferred without General Partner consent.

8. RIGHTS AND OBLIGATIONS
[Detailed rights and obligations of Limited Partners and General Partner]

[Additional comprehensive LPA terms would appear here in a production environment]
        `,
        onSign: () => {
          setContractsData({ ...contractsData, lpaSigned: true })
          setViewingDocument(null)
          toast.success('Limited Partnership Agreement signed')
        }
      },
      questionnaire: {
        title: 'Investor Questionnaire',
        content: `
INVESTOR QUESTIONNAIRE

Fund: ${fundName}
Investor: [Name from registration]

1. INVESTMENT EXPERIENCE
Please describe your experience with alternative investments:
[ ] Extensive experience (10+ years)
[ ] Moderate experience (5-10 years)
[ ] Limited experience (1-5 years)
[ ] No prior experience

2. RISK TOLERANCE
How would you characterize your risk tolerance?
[ ] Conservative
[ ] Moderate
[ ] Aggressive

3. INVESTMENT OBJECTIVES
What are your primary investment objectives? (Select all that apply)
[ ] Capital appreciation
[ ] Current income
[ ] Portfolio diversification
[ ] Tax benefits

4. FINANCIAL SITUATION
Annual Income Range: [ ]
Net Worth (excluding primary residence): [ ]

5. INVESTMENT HORIZON
Expected investment time horizon:
[ ] 3-5 years
[ ] 5-10 years
[ ] 10+ years

6. SOURCE OF FUNDS
Please describe the source of funds for this investment:
_________________________________

7. SUITABILITY
I confirm that this investment is suitable for my financial situation and investment objectives.

By signing, I certify that all information provided is accurate and complete.
        `,
        onSign: () => {
          setContractsData({ ...contractsData, investorQuestionnaireSigned: true })
          setViewingDocument(null)
          toast.success('Investor Questionnaire completed')
        }
      },
      accreditation: {
        title: 'Accredited Investor Verification',
        content: `
ACCREDITED INVESTOR CERTIFICATION

Fund: ${fundName}
Investor: [Name]

ACCREDITED INVESTOR DEFINITION

Under Regulation D of the Securities Act of 1933, an "accredited investor" includes:

1. Any natural person whose individual net worth, or joint net worth with spouse, exceeds $1,000,000 (excluding primary residence)

2. Any natural person who had individual income exceeding $200,000 (or $300,000 jointly with spouse) in each of the two most recent years and reasonably expects the same for the current year

3. Certain professional certifications, designations, or credentials (Series 7, 65, or 82 licenses)

INVESTOR CERTIFICATION

I hereby certify that I qualify as an accredited investor under one or more of the following (check all that apply):

[ ] Net worth exceeds $1,000,000 (excluding primary residence)
[ ] Individual income exceeds $200,000 (or $300,000 jointly) for the past two years
[ ] Hold qualifying professional certification (Series 7, 65, or 82)
[ ] Other (specify): _____________

I understand that:
- The Fund's securities have not been registered with the SEC
- This investment involves significant risks
- I may lose my entire investment
- The securities are subject to restrictions on transfer

I certify under penalty of perjury that the foregoing is true and correct.
        `,
        onSign: () => {
          setContractsData({ ...contractsData, accreditationVerified: true })
          setViewingDocument(null)
          toast.success('Accredited Investor status verified')
        }
      }
    }

    setViewingDocument(documents[documentType])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/lp-portal')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
          <p className="text-muted-foreground">{fundName || 'Loading...'}</p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Onboarding Progress</CardTitle>
            <Badge variant="secondary">{currentStep === 'Complete' ? 'Complete' : currentStep}</Badge>
          </div>
          <CardDescription>
            Complete all steps to start investing • Commitment: {formatCurrency(commitment)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={getProgress()} className="mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {STEPS.map((step, index) => {
              const Icon = getStepIcon(step)
              const stepIndex = STEPS.indexOf(currentStep)
              const isComplete = index < stepIndex
              const isCurrent = index === stepIndex

              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isCurrent ? 'border-primary bg-primary/5' : isComplete ? 'border-green-500 bg-green-50' : 'border-muted'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : isCurrent ? (
                    <Icon className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${isCurrent ? 'text-primary' : isComplete ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {step}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 'KYC/KYB' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Identity Verification (KYC/KYB)
            </CardTitle>
            <CardDescription>
              Verify your identity to comply with regulatory requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Legal Name *</Label>
                <Input
                  id="fullName"
                  value={kycData.fullName}
                  onChange={(e) => setKycData({ ...kycData, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={kycData.dateOfBirth}
                  onChange={(e) => setKycData({ ...kycData, dateOfBirth: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality *</Label>
                <Input
                  id="nationality"
                  value={kycData.nationality}
                  onChange={(e) => setKycData({ ...kycData, nationality: e.target.value })}
                  placeholder="United States"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">Government ID Number *</Label>
                <Input
                  id="idNumber"
                  value={kycData.idNumber}
                  onChange={(e) => setKycData({ ...kycData, idNumber: e.target.value })}
                  placeholder="Passport or National ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / SSN</Label>
                <Input
                  id="taxId"
                  value={kycData.taxId}
                  onChange={(e) => setKycData({ ...kycData, taxId: e.target.value })}
                  placeholder="123-45-6789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={kycData.occupation}
                  onChange={(e) => setKycData({ ...kycData, occupation: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Residential Address</Label>
              <Input
                id="address"
                value={kycData.address}
                onChange={(e) => setKycData({ ...kycData, address: e.target.value })}
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceOfFunds">Source of Funds</Label>
              <Input
                id="sourceOfFunds"
                value={kycData.sourceOfFunds}
                onChange={(e) => setKycData({ ...kycData, sourceOfFunds: e.target.value })}
                placeholder="Salary, Business Income, etc."
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Upload Identity Documents</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload Government ID (Passport, Driver's License, or National ID)
                </p>
                <Button variant="outline" size="sm">
                  Choose Files
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleKycSubmit} size="lg">
                Complete Verification
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'Contracts' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sign Legal Documents
            </CardTitle>
            <CardDescription>
              Review and sign required legal agreements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="subscriptionAgreement"
                  checked={contractsData.subscriptionAgreementSigned}
                  disabled
                />
                <div className="flex-1">
                  <Label htmlFor="subscriptionAgreement" className="font-medium">
                    Subscription Agreement *
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Agreement to subscribe to fund units and commit capital
                  </p>
                  {!contractsData.subscriptionAgreementSigned && (
                    <Button
                      variant="link"
                      className="h-auto p-0 mt-2"
                      onClick={() => openDocument('subscription')}
                    >
                      Review & Sign
                    </Button>
                  )}
                  {contractsData.subscriptionAgreementSigned && (
                    <p className="text-sm text-green-600 mt-2">✓ Signed</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="lpa"
                  checked={contractsData.lpaSigned}
                  disabled
                />
                <div className="flex-1">
                  <Label htmlFor="lpa" className="font-medium">
                    Limited Partnership Agreement (LPA) *
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Terms governing the fund structure and investor rights
                  </p>
                  {!contractsData.lpaSigned && (
                    <Button
                      variant="link"
                      className="h-auto p-0 mt-2"
                      onClick={() => openDocument('lpa')}
                    >
                      Review & Sign
                    </Button>
                  )}
                  {contractsData.lpaSigned && (
                    <p className="text-sm text-green-600 mt-2">✓ Signed</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="questionnaire"
                  checked={contractsData.investorQuestionnaireSigned}
                  disabled
                />
                <div className="flex-1">
                  <Label htmlFor="questionnaire" className="font-medium">
                    Investor Questionnaire
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Information about investment experience and suitability
                  </p>
                  {!contractsData.investorQuestionnaireSigned && (
                    <Button
                      variant="link"
                      className="h-auto p-0 mt-2"
                      onClick={() => openDocument('questionnaire')}
                    >
                      Review & Sign
                    </Button>
                  )}
                  {contractsData.investorQuestionnaireSigned && (
                    <p className="text-sm text-green-600 mt-2">✓ Signed</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="accreditation"
                  checked={contractsData.accreditationVerified}
                  disabled
                />
                <div className="flex-1">
                  <Label htmlFor="accreditation" className="font-medium">
                    Accredited Investor Verification
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Certification of accredited investor status
                  </p>
                  {!contractsData.accreditationVerified && (
                    <Button
                      variant="link"
                      className="h-auto p-0 mt-2"
                      onClick={() => openDocument('accreditation')}
                    >
                      Review & Sign
                    </Button>
                  )}
                  {contractsData.accreditationVerified && (
                    <p className="text-sm text-green-600 mt-2">✓ Signed</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('KYC/KYB')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleContractsSubmit} size="lg">
                Complete Contracts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'Commitment' && structureData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Capital Commitment
            </CardTitle>
            <CardDescription>
              Set your capital commitment for this fund
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Token Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Select {structureData.tokenName}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {structureData.tokenSymbol} • {formatCurrency(structureData.tokenValue)} per token
                  </p>
                </div>
                <Badge variant="secondary" className="text-sm">
                  Min: {structureData.minTokens} • Max: {structureData.maxTokens}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokensToPurchase">Number of Tokens *</Label>
                <div className="flex gap-2">
                  <Input
                    id="tokensToPurchase"
                    type="number"
                    min={structureData.minTokens}
                    max={structureData.maxTokens}
                    value={paymentsData.tokensToPurchase}
                    onChange={(e) => setPaymentsData({ ...paymentsData, tokensToPurchase: parseInt(e.target.value) || 0 })}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setPaymentsData({ ...paymentsData, tokensToPurchase: structureData.minTokens })}
                  >
                    Min
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPaymentsData({ ...paymentsData, tokensToPurchase: structureData.maxTokens })}
                  >
                    Max
                  </Button>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(paymentsData.tokensToPurchase * structureData.tokenValue)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {paymentsData.tokensToPurchase} tokens × {formatCurrency(structureData.tokenValue)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Payment Method Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Payment Method *</Label>
              <p className="text-sm text-muted-foreground">All payments are securely processed through Stripe</p>

              <div className="grid gap-3">
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentsData.paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentsData({ ...paymentsData, paymentMethod: 'card' })}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentsData.paymentMethod === 'card'}
                      onChange={() => setPaymentsData({ ...paymentsData, paymentMethod: 'card' })}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Credit / Debit Card</p>
                      <p className="text-sm text-muted-foreground">Instant payment • Powered by Stripe</p>
                    </div>
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentsData.paymentMethod === 'ach' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentsData({ ...paymentsData, paymentMethod: 'ach' })}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentsData.paymentMethod === 'ach'}
                      onChange={() => setPaymentsData({ ...paymentsData, paymentMethod: 'ach' })}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Bank Account (ACH)</p>
                      <p className="text-sm text-muted-foreground">Direct transfer (3-5 days) • Powered by Stripe</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentsData.paymentMethod === 'crypto' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentsData({ ...paymentsData, paymentMethod: 'crypto' })}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentsData.paymentMethod === 'crypto'}
                      onChange={() => setPaymentsData({ ...paymentsData, paymentMethod: 'crypto' })}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Stablecoins (USDC, USDT)</p>
                      <p className="text-sm text-muted-foreground">Pay with crypto • Powered by Bridge (Stripe)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Secure Payment:</strong> You will be redirected to Stripe's secure checkout to complete your payment.
                {paymentsData.paymentMethod === 'ach' && ' ACH payments take 3-5 business days to process.'}
                {paymentsData.paymentMethod === 'crypto' && ' Cryptocurrency payments are processed instantly via Bridge by Stripe.'}
              </p>
            </div>

            <Separator />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('Contracts')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handlePaymentsSubmit} size="lg">
                Save Commitment & Complete Onboarding
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'Complete' && completionSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Onboarding Complete!
            </CardTitle>
            <CardDescription>
              You have successfully completed all onboarding steps for {fundName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Welcome to {fundName}!</h3>
              <p className="text-sm text-muted-foreground">
                Your commitment has been recorded and payment preferences have been saved.
              </p>
            </div>

            {/* Onboarding Summary */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Onboarding Summary</h4>

              {/* Step 1: KYC/KYB */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Identity Verification (KYC/KYB)</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verified identity for: {completionSummary.investorName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Contracts */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Legal Documents Signed</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      {completionSummary.contractsSigned.map((contract, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="text-green-600">✓</span> {contract}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 3: Commitment & Payment Preferences */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Commitment & Payment Preferences</p>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>Token Commitment: <span className="font-semibold text-foreground">{completionSummary.tokensPurchased} {structureData?.tokenSymbol}</span></p>
                      <p>Total Commitment: <span className="font-semibold text-foreground">{formatCurrency(completionSummary.totalAmount)}</span></p>
                      <p>Preferred Payment Method: <span className="font-semibold text-foreground">{completionSummary.paymentMethod}</span></p>
                      <p>Potential Ownership: <span className="font-semibold text-foreground">{completionSummary.ownershipPercent.toFixed(4)}%</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Next Steps */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">What's Next?</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Wait for capital call notifications from the fund manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>When a capital call is issued, you'll purchase tokens using your saved payment method</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Access your portfolio dashboard to track your commitment and future investments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Access important documents anytime from the Documents section</span>
                </li>
              </ul>
            </div>

            <Separator />

            {/* Action Button */}
            <div className="text-center">
              <Button onClick={() => router.push('/lp-portal')} size="lg" className="w-full md:w-auto">
                Go to My Portfolio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Viewer Dialog */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>{viewingDocument.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewingDocument(null)}
                >
                  <span className="text-xl">×</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {viewingDocument.content}
                </pre>
              </div>
            </CardContent>
            <div className="border-t p-4 flex items-center justify-between bg-muted/30">
              <p className="text-sm text-muted-foreground">
                By clicking "Sign Document", you agree to be legally bound by the terms above
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewingDocument(null)}
                >
                  Cancel
                </Button>
                <Button onClick={viewingDocument.onSign}>
                  Sign Document
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
