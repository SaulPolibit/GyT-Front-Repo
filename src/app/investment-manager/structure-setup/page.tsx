"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CalendarIcon, ChevronLeft, ChevronRight, Info, AlertCircle, CheckCircle2, Building2, DollarSign, Users, TrendingUp, Upload, Download, X, Edit, Trash2, Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslation } from '@/hooks/useTranslation'
import { saveStructure, getStructures, Structure } from '@/lib/structures-storage'
import { saveInvestor, getInvestors } from '@/lib/investors-storage'
import { useRouter } from 'next/navigation'
import { getVisibilitySettings } from '@/lib/visibility-storage'
import { getApiUrl, API_CONFIG } from '@/lib/api-config'
import { getAuthState, logout } from '@/lib/auth-storage'

// V3.1: Investor Pre-Registration Interface
interface InvestorPreRegistration {
  firstName: string
  lastName: string
  email: string
  taxId?: string
  entityName?: string
  entityType?: string
  contactFirstName?: string
  contactLastName?: string
  investorType?: 'Individual' | 'Institution' | 'Family Office' | 'Fund of Funds'
  hierarchyLevel?: number  // Which level (1-N) investor participates in
  customTerms?: {
    managementFee?: number
    performanceFee?: number
    hurdleRate?: number
    preferredReturn?: number
  }
  source: 'manual' | 'csv'
  addedAt: Date
}

// Pricing tier interface
interface PricingTier {
  name: string
  monthlyFee: number
  maxAUM: number
  maxInvestors: number
  maxIssuances: number
  setupFee: number
  additionalAUMCost: number
  additionalInvestorCost: number
  additionalIssuanceCost: number
  description: string
  badge?: string
  contactSales?: boolean
}

// Structure type definitions with standardized country list (for type checking)
const STRUCTURE_TYPES = {
  'sa': {
    label: 'SA / LLC',
    description: 'Single-property legal entity for isolated risk',
    subtypes: [],
    regions: ['United States', 'Mexico', 'Panama', 'El Salvador', 'Cayman Islands', 'British Virgin Islands']
  },
  'fund': {
    label: 'Fund',
    description: 'Investment fund for single or multiple projects with capital calls',
    subtypes: [],
    regions: ['United States', 'Mexico', 'Panama', 'El Salvador', 'Cayman Islands', 'British Virgin Islands']
  },
  'fideicomiso': {
    label: 'Trust',
    description: 'Bank trust structure with tax incentives, can hold multiple properties',
    subtypes: [],
    regions: ['United States', 'Mexico', 'Panama', 'El Salvador', 'Cayman Islands', 'British Virgin Islands']
  },
  'private-debt': {
    label: 'Private Debt',
    description: 'Promissory note structure with guarantor',
    subtypes: [
      { value: 'secured', label: 'Secured Debt', description: 'Backed by collateral' },
      { value: 'unsecured', label: 'Unsecured Debt', description: 'Backed by guarantor only' },
    ],
    regions: ['United States', 'Mexico', 'Panama', 'El Salvador', 'Cayman Islands', 'British Virgin Islands']
  }
}

// Function to get translated structure types
const getTranslatedStructureTypes = (t: any) => ({
  'sa': {
    ...STRUCTURE_TYPES.sa,
    label: t.structures.sa,
    description: t.onboarding.saLLCDescription,
  },
  'fund': {
    ...STRUCTURE_TYPES.fund,
    label: t.structures.fund,
    description: t.onboarding.fundDescription,
  },
  'fideicomiso': {
    ...STRUCTURE_TYPES.fideicomiso,
    label: t.structures.fideicomiso,
    description: t.onboarding.fideicomisoDescription,
  },
  'private-debt': {
    ...STRUCTURE_TYPES['private-debt'],
    label: t.structures.privateDebt,
    description: t.onboarding.privateDebtDescription,
  }
})

// Structure Features Interface - determines which features are available based on structure type
interface StructureFeatures {
  supportsCapitalCalls: boolean
  supportsWaterfallDistribution: boolean
  supportsCarriedInterest: boolean
  supportsManagementFees: boolean
  distributionType: 'waterfall' | 'simple' | 'interest-only'
}

// Helper function to determine which features are supported for each structure type/subtype
const getStructureFeatures = (structureType: string, subtype: string): StructureFeatures => {
  // Funds: Full featured (capital calls, waterfall distributions, carried interest)
  if (structureType === 'fund') {
    return {
      supportsCapitalCalls: true,
      supportsWaterfallDistribution: true,
      supportsCarriedInterest: true,
      supportsManagementFees: true,
      distributionType: 'waterfall'
    }
  }

  // Trust (Fideicomiso): Depends on subtype
  if (structureType === 'fideicomiso') {
    if (subtype === 'multi-property') {
      // Multi-property trusts act like funds (capital calls + waterfall)
      return {
        supportsCapitalCalls: true,
        supportsWaterfallDistribution: true,
        supportsCarriedInterest: true,
        supportsManagementFees: true,
        distributionType: 'waterfall'
      }
    } else {
      // Single-property trusts have simple distributions (no capital calls)
      return {
        supportsCapitalCalls: false,
        supportsWaterfallDistribution: false,
        supportsCarriedInterest: false,
        supportsManagementFees: false,
        distributionType: 'simple'
      }
    }
  }

  // SA/LLC/SPV: Simple distributions only (no capital calls)
  if (structureType === 'sa') {
    return {
      supportsCapitalCalls: false,
      supportsWaterfallDistribution: false,
      supportsCarriedInterest: false,
      supportsManagementFees: false,
      distributionType: 'simple'
    }
  }

  // Private Debt: Interest payments only (no capital calls, no waterfall)
  if (structureType === 'private-debt') {
    return {
      supportsCapitalCalls: false,
      supportsWaterfallDistribution: false,
      supportsCarriedInterest: false,
      supportsManagementFees: false,
      distributionType: 'interest-only'
    }
  }

  // Default fallback (simple distributions)
  return {
    supportsCapitalCalls: false,
    supportsWaterfallDistribution: false,
    supportsCarriedInterest: false,
    supportsManagementFees: false,
    distributionType: 'simple'
  }
}

// Helper function to get equity and debt subtypes based on structure type
const getEquityAndDebtSubtypes = (structureType: string) => {
  const equityOptions: { value: string; label: string }[] = []
  const debtOptions: { value: string; label: string }[] = []

  // Common debt options for all structure types
  const commonDebtOptions = [
    { value: 'bonds', label: 'Bonds' },
    { value: 'debt-notes', label: 'Debt Notes' },
    { value: 'mezzanine-debt', label: 'Mezzanine Debt' },
    { value: 'promissory-notes', label: 'Promissory Notes' },
  ]

  switch (structureType) {
    case 'sa':
      // SA/LLC structure
      equityOptions.push(
        { value: 'preferred-shares', label: 'Preferred Shares' },
        { value: 'common-shares', label: 'Common Shares' },
        { value: 'membership', label: 'Membership' }
      )
      return { equityOptions, debtOptions: commonDebtOptions }

    case 'fideicomiso':
      // Trust structure
      equityOptions.push({ value: 'trust-interest', label: 'Trust Interest' })
      return { equityOptions, debtOptions: commonDebtOptions }

    case 'fund':
      // Fund structure
      equityOptions.push({ value: 'fund-units', label: 'Fund Units' })
      return { equityOptions, debtOptions: commonDebtOptions }

    default:
      return { equityOptions, debtOptions }
  }
}

// Tiered pricing model (V3.1 - UPDATED SETUP FEES)
const PRICING_TIERS: Record<string, PricingTier> = {
  'starter': {
    name: 'Starter',
    monthlyFee: 1250,
    maxAUM: 10000000, // Up to and including $10M
    maxInvestors: 50,
    maxIssuances: 5,
    setupFee: 5000, // $5,000 for Starter tier (includes 5 issuances)
    additionalAUMCost: 100,
    additionalInvestorCost: 3,
    additionalIssuanceCost: 3000,
    description: 'Perfect for emerging investment managers',
    badge: undefined
  },
  'growth': {
    name: 'Growth',
    monthlyFee: 2500,
    maxAUM: 50000000, // $11M to $50M (inclusive)
    maxInvestors: 100,
    maxIssuances: 10,
    setupFee: 10000, // $10,000 for Growth tier (includes 10 issuances)
    additionalAUMCost: 100,
    additionalInvestorCost: 3,
    additionalIssuanceCost: 3000,
    description: 'For growing investment managers scaling operations',
    badge: 'Most Popular'
  },
  'enterprise': {
    name: 'Enterprise',
    monthlyFee: 5000,
    maxAUM: 100000000, // $51M to $100M (inclusive)
    maxInvestors: 200,
    maxIssuances: 20,
    setupFee: 20000, // $20,000 for Enterprise tier (includes 20 issuances)
    additionalAUMCost: 100,
    additionalInvestorCost: 3,
    additionalIssuanceCost: 3000,
    description: 'Institutional-grade platform for large managers',
    badge: undefined
  },
  'custom': {
    name: 'Custom',
    monthlyFee: 0,
    maxAUM: Infinity, // $101M and above
    maxInvestors: Infinity,
    maxIssuances: Infinity,
    setupFee: 0, // Contact sales for custom pricing
    additionalAUMCost: 0,
    additionalInvestorCost: 0,
    additionalIssuanceCost: 0,
    description: 'White-glove service and custom integrations',
    badge: undefined,
    contactSales: true
  }
}

const CURRENCIES = ['USD', 'MXN', 'GTQ', 'COP', 'CLP', 'PEN']

// Currency exchange rates to USD (updated periodically)
const CURRENCY_EXCHANGE_RATES: Record<string, number> = {
  'USD': 1.0,
  'MXN': 0.059,    // 1 MXN = ~0.059 USD
  'GTQ': 0.128,    // 1 GTQ = ~0.128 USD
  'COP': 0.00025,  // 1 COP = ~0.00025 USD
  'CLP': 0.00110,  // 1 CLP = ~0.00110 USD
  'PEN': 0.27      // 1 PEN = ~0.27 USD
}

const TAX_JURISDICTIONS = {
  'United States': { label: 'United States', taxRate: 21 },
  'Mexico': { label: 'Mexico', taxRate: 30 },
  'Panama': { label: 'Panama', taxRate: 25 },
  'El Salvador': { label: 'El Salvador', taxRate: 30 },
  'Cayman Islands': { label: 'Cayman Islands', taxRate: 0 },
  'British Virgin Islands': { label: 'British Virgin Islands', taxRate: 0 }
}

const SETUP_FEES = {
  firstIssuance: 5000,
  additionalIssuance: 3000
}

export default function OnboardingPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const translatedStructureTypes = getTranslatedStructureTypes(t)

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [inReviewMode, setInReviewMode] = useState(false)
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false)
  const [createdStructureId, setCreatedStructureId] = useState<string | null>(null)
  const [visibilitySettings, setVisibilitySettings] = useState<ReturnType<typeof getVisibilitySettings> | null>(null)

  // V3.1: Investor Pre-Registration State
  const [showInvestorForm, setShowInvestorForm] = useState(false)
  const [editingInvestor, setEditingInvestor] = useState<InvestorPreRegistration | null>(null)
  const [selectedInvestorType, setSelectedInvestorType] = useState<'individual' | 'institution' | 'fund-of-funds' | 'family-office'>('individual')
  const csvFileInputRef = useRef<HTMLInputElement>(null)

  // Available parent structures from API
  const [availableParentStructures, setAvailableParentStructures] = useState<Structure[]>([])

  // Confirmation dialog states
  const [removeInvestorDialogOpen, setRemoveInvestorDialogOpen] = useState(false)
  const [clearAllInvestorsDialogOpen, setClearAllInvestorsDialogOpen] = useState(false)
  const [investorToRemove, setInvestorToRemove] = useState<string | null>(null)

  // Document upload error state
  const [uploadError, setUploadError] = useState<string>('')

  // Form validation error state
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Parent structure toggle state
  const [hasParentStructure, setHasParentStructure] = useState(false)

  // Platform wallet state
  const [usePlatformWallet, setUsePlatformWallet] = useState(true)
  const [userWalletAddress, setUserWalletAddress] = useState<string | null>(null)

  // Operating agreement hash state
  const [manuallyEnterHash, setManuallyEnterHash] = useState(false)

  // Track focused currency field for formatting
  const [focusedCurrencyField, setFocusedCurrencyField] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Step 1: Structure Type Selection
    structureType: '',
    structureSubtype: '',

    // Step 2: Basic Information
    structureName: '',
    jurisdiction: '',
    jurisdictionOther: '', // When "Other" is selected
    usState: '', // For SA/LLC in United States
    usStateOther: '', // When "Other" is selected
    inceptionDate: undefined,
    currentStage: 'fundraising',

    // Step 3: Capital Structure & Issuances (V3 ENHANCED)
    totalCapitalCommitment: '',
    currency: 'USD',
    plannedInvestments: '1', // NEW: How many properties/projects
    financingStrategy: 'equity', // NEW: equity, debt, or mixed
    equitySubtype: '', // NEW: Subtype for equity instruments
    debtSubtype: '', // NEW: Subtype for debt instruments
    totalInvestors: '',
    minCheckSize: '',
    maxCheckSize: '',

    // Step 4: Economic Terms (V3 ENHANCED)
    economicTermsApplication: 'all-investors', // NEW: all-investors or per-investor
    distributionModel: 'waterfall', // NEW: waterfall, simple, or interest-only
    managementFee: '2',
    performanceFee: '20',
    hurdleRate: '8',
    preferredReturn: '8',
    waterfallStructure: 'european',
    waterfallScenarios: [ // Multiple waterfall tiers (up to 3)
      {
        id: '1',
        name: 'Tier 1',
        managementFee: '2',
        gpSplit: '20',
        irrHurdle: '8',
        preferredReturn: '8',
        isExpanded: true
      }
    ] as Array<{id: string; name: string; managementFee: string; gpSplit: string; irrHurdle: string; preferredReturn: string; isExpanded: boolean}>,

    // Step 5: Distribution & Tax
    distributionFrequency: 'quarterly',
    defaultTaxRate: '',
    debtInterestRate: '', // Interest rate for debt instruments
    debtGrossInterestRate: '', // Gross interest rate for debt
    enableCapitalCalls: false, // NEW: Whether to enable capital calls configuration
    capitalCalls: [] as Array<{ id: string; date: string; callPercentage: number }>, // Capital calls (up to 4)
    // Tax fields - specific to asset type
    vatRate: '', // For Debt: VAT Rate
    incomeDebtTaxRate: '', // For Debt: Income tax
    witholdingDividendTaxRate: '', // For Equity: Withholding / Dividend tax
    incomeEquityTaxRate: '', // For Equity: Income tax
    sameTaxTreatment: true, // NEW: Same tax treatment for natural persons and legal entities
    // Tax fields for natural persons (when sameTaxTreatment is false)
    vatRateNaturalPersons: '', // For Debt: VAT Rate - Natural Persons
    incomeDebtTaxRateNaturalPersons: '', // For Debt: Income tax - Natural Persons
    witholdingDividendTaxRateNaturalPersons: '', // For Equity: Withholding / Dividend tax - Natural Persons
    incomeEquityTaxRateNaturalPersons: '', // For Equity: Income tax - Natural Persons
    // Tax fields for legal entities (when sameTaxTreatment is false)
    vatRateLegalEntities: '', // For Debt: VAT Rate - Legal Entities
    incomeDebtTaxRateLegalEntities: '', // For Debt: Income tax - Legal Entities
    witholdingDividendTaxRateLegalEntities: '', // For Equity: Withholding / Dividend tax - Legal Entities
    incomeEquityTaxRateLegalEntities: '', // For Equity: Income tax - Legal Entities

    // Fund-specific
    fundTerm: '10',
    fundType: 'closed-end',
    capitalCallNoticePeriod: '10', // Days notice before capital call
    capitalCallDefaultPercentage: '25', // Default % of commitment to call
    capitalCallPaymentDeadline: '15', // Days to wire funds

    // Auto-calculated fields
    determinedTier: null,
    calculatedIssuances: 1,
    tokenName: '',
    tokenSymbol: '',
    tokenValue: 1000,
    totalTokens: 1000,
    minTokensPerInvestor: 1,
    maxTokensPerInvestor: 1000,

    // V3.1: Investor Pre-Registration
    preRegisteredInvestors: [] as InvestorPreRegistration[],

    // Document tracking
    uploadedFundDocuments: [] as { name: string; addedAt: Date; file: File }[],
    uploadedInvestorDocuments: [] as { name: string; addedAt: Date; file: File }[],

    // V4: Multi-Level Hierarchy
    hierarchyMode: false,
    hierarchySetupApproach: 'all-at-once' as 'all-at-once' | 'incremental',
    hierarchyLevels: 2, // Total levels in hierarchy (2-10)
    hierarchyStructures: [] as {
      level: number
      name: string
      type: string
      applyWaterfall: boolean
      applyEconomicTerms: boolean
      waterfallAlgorithm: 'american' | 'european' | null
    }[],
    parentStructureId: null as string | null,
    parentStructureOwnershipPercentage: null as number | null,
    applyWaterfallAtThisLevel: true,
    applyEconomicTermsAtThisLevel: true,
    waterfallAlgorithm: null as 'american' | 'european' | null,
    incomeFlowTarget: 'investors' as string,

    // V5: ILPA Performance Methodology
    performanceMethodology: '' as '' | 'granular' | 'grossup',
    calculationLevel: '' as '' | 'fund-level' | 'portfolio-level',

    // V6: Structure Banner Image
    bannerImage: null as File | null, // Actual file object
    bannerImagePreview: '' as string, // Base64 preview for display

    // V6.1: Blockchain Owner Information
    walletOwnerAddress: '' as string, // Wallet owner address (hexadecimal)
    operatingAgreementHash: '' as string, // Operating agreement hash (hexadecimal)

    // V7: Payment Configurations
    paymentLocalBankEnabled: false,
    paymentLocalBankName: '',
    paymentLocalAccountNumber: '',
    paymentLocalRoutingNumber: '',
    paymentLocalAccountHolder: '',
    paymentLocalBankAddress: '',
    paymentIntlBankEnabled: false,
    paymentIntlBankName: '',
    paymentIntlAccountNumber: '',
    paymentIntlSwiftCode: '',
    paymentIntlAccountHolder: '',
    paymentIntlBankAddress: '',
    paymentCryptoEnabled: false,
    paymentCryptoBlockchain: 'Polygon' as 'Polygon' | 'Arbitrum',
    paymentCryptoWalletAddress: '',
  })

  const totalSteps = 8
  const progress = (currentStep / totalSteps) * 100

  // V3.1: Convert any currency amount to USD for tier calculation
  const convertToUSD = (amount: number, currency: string): number => {
    const rate = CURRENCY_EXCHANGE_RATES[currency] || 1
    return amount * rate
  }

  // V3: Calculate issuances based on investments and financing strategy
  const calculateIssuances = () => {
    const investments = parseInt(formData.plannedInvestments) || 1

    switch (formData.financingStrategy) {
      case 'equity':
        return investments // 1 issuance per investment (equity only)
      case 'debt':
        return investments // 1 issuance per investment (debt only)
      case 'mixed':
        return investments * 2 // 2 issuances per investment (equity + debt)
      default:
        return 1
    }
  }

  // Calculate pricing tier based on AUM (V3 - CORRECTED)
  const calculateTier = (aum: number) => {
    if (aum <= 10000000) return 'starter' // Up to and including $10M
    if (aum <= 50000000) return 'growth' // $10M+ to $50M
    if (aum <= 100000000) return 'enterprise' // $50M+ to $100M
    return 'custom' // $100M+
  }

  // Calculate additional costs (V3.1 - Updated for tier-based setup fees and currency conversion)
  const calculateAdditionalCosts = () => {
    if (!formData.totalCapitalCommitment || !formData.determinedTier) return null

    const tier = PRICING_TIERS[formData.determinedTier as keyof typeof PRICING_TIERS]
    const aum = parseFloat(formData.totalCapitalCommitment)
    // Convert to USD for AUM overage calculation
    const aumInUSD = convertToUSD(aum, formData.currency)
    const investors = parseInt(formData.totalInvestors) || 0
    const issuances = calculateIssuances()

    const costs = {
      baseMonthlyCost: tier.monthlyFee,
      additionalAUMCost: 0,
      additionalInvestorCost: 0,
      additionalIssuanceCost: 0,
      setupFee: tier.setupFee, // Use tier-based setup fee (includes issuances up to tier limit)
      totalMonthlyCost: tier.monthlyFee,
      totalSetupCost: tier.setupFee
    }

    // Calculate AUM overage (using USD equivalent)
    if (aumInUSD > tier.maxAUM && tier.maxAUM !== Infinity) {
      const excessAUM = aumInUSD - tier.maxAUM
      const excessMillions = Math.ceil(excessAUM / 1000000)
      costs.additionalAUMCost = excessMillions * tier.additionalAUMCost
    }

    // Calculate investor overage
    if (investors > tier.maxInvestors && tier.maxInvestors !== Infinity) {
      const excessInvestors = investors - tier.maxInvestors
      costs.additionalInvestorCost = excessInvestors * tier.additionalInvestorCost
    }

    // Calculate issuance overage (only for issuances BEYOND tier limit)
    if (issuances > tier.maxIssuances && tier.maxIssuances !== Infinity) {
      const excessIssuances = issuances - tier.maxIssuances
      costs.additionalIssuanceCost = excessIssuances * tier.additionalIssuanceCost
    }

    costs.totalMonthlyCost = costs.baseMonthlyCost + costs.additionalAUMCost + costs.additionalInvestorCost
    costs.totalSetupCost = costs.setupFee + costs.additionalIssuanceCost

    return costs
  }

  // Auto-generate token configuration
  const generateTokenConfig = () => {
    if (!formData.structureName) return

    const tokenName = `${formData.structureName} Token`

    const words = formData.structureName.split(' ').filter(w => w.length > 0)
    let symbol = words.map(w => w[0].toUpperCase()).join('').substring(0, 5)
    if (symbol.length < 3) symbol = formData.structureName.substring(0, 5).toUpperCase()

    // Token Value = Minimum Check Size
    let tokenValue = 1000
    let totalTokens = 1000
    let minTokensPerInvestor = 1
    let maxTokensPerInvestor = 1000

    if (formData.minCheckSize) {
      tokenValue = parseFloat(formData.minCheckSize)
    }

    if (formData.totalCapitalCommitment && tokenValue > 0) {
      const aum = parseFloat(formData.totalCapitalCommitment)
      // Total Tokens = AUM / Token Value
      totalTokens = Math.round(aum / tokenValue)
    }

    // Min Tokens Per Investor = 1 (always)
    minTokensPerInvestor = 1

    // Max Tokens Per Investor = Max Check Size / Token Value
    if (formData.maxCheckSize && tokenValue > 0) {
      maxTokensPerInvestor = Math.round(parseFloat(formData.maxCheckSize) / tokenValue)
    }

    setFormData(prev => ({
      ...prev,
      tokenName,
      tokenSymbol: symbol,
      tokenValue,
      totalTokens,
      minTokensPerInvestor,
      maxTokensPerInvestor,
      calculatedIssuances: calculateIssuances()
    }))
  }

  // Fetch available parent structures from API on mount
  useEffect(() => {
    const fetchParentStructures = async () => {
      try {
        const authState = getAuthState()
        const token = authState.token

        if (!token) {
          console.warn('[Parent Structures] No auth token, using localStorage fallback')
          setAvailableParentStructures(getStructures())
          return
        }

        const response = await fetch(getApiUrl(API_CONFIG.endpoints.getAllStructures), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          // Handle 401 Unauthorized - session expired or invalid
          if (response.status === 401) {
            try {
              const errorData = await response.json()
              if (errorData.error === "Invalid or expired token") {
                console.log('[Parent Structures] 401 Unauthorized - clearing session and redirecting to login')
                logout()
                router.push('/sign-in')
                return
              }
            } catch (e) {
              console.log('Error: ', e)
            }
          }
          throw new Error('Failed to fetch structures')
        }

        const data = await response.json()
        setAvailableParentStructures(data.data || [])
        console.log('[Parent Structures] Loaded from API:', data.data?.length || 0)
      } catch (error) {
        console.error('[Parent Structures] Error fetching from API:', error)
        // Fallback to localStorage
        setAvailableParentStructures(getStructures())
      }
    }

    fetchParentStructures()
  }, [])

  // Fetch user's platform wallet on mount
  useEffect(() => {
    const authState = getAuthState()
    const walletAddress = authState.user?.walletAddress

    if (walletAddress) {
      setUserWalletAddress(walletAddress)
      // Auto-fill wallet owner address if using platform wallet
      if (usePlatformWallet) {
        updateFormData('walletOwnerAddress', walletAddress)
      }
    }
  }, [])

  // Update wallet owner address when platform wallet toggle changes
  useEffect(() => {
    if (usePlatformWallet && userWalletAddress) {
      updateFormData('walletOwnerAddress', userWalletAddress)
    } else if (!usePlatformWallet && userWalletAddress === formData.walletOwnerAddress) {
      // Clear if switching from platform wallet to manual
      updateFormData('walletOwnerAddress', '')
    }
  }, [usePlatformWallet, userWalletAddress])

  // Auto-populate crypto payment wallet address from wallet owner address
  useEffect(() => {
    if (formData.paymentCryptoEnabled && formData.walletOwnerAddress) {
      updateFormData('paymentCryptoWalletAddress', formData.walletOwnerAddress)
    }
  }, [formData.paymentCryptoEnabled, formData.walletOwnerAddress])

  // Handle operating agreement hash default value
  useEffect(() => {
    const defaultHash = '0x0000000000000000000000000000000000000000000000000000000000000000'

    if (!manuallyEnterHash) {
      // Use default hash when manual entry is disabled
      updateFormData('operatingAgreementHash', defaultHash)
    } else if (manuallyEnterHash && formData.operatingAgreementHash === defaultHash) {
      // Clear default hash when switching to manual entry
      updateFormData('operatingAgreementHash', '')
    }
  }, [manuallyEnterHash])

  // Update tier when AUM or currency changes (V3.1 - with currency conversion)
  useEffect(() => {
    if (formData.totalCapitalCommitment) {
      const aum = parseFloat(formData.totalCapitalCommitment)
      if (!isNaN(aum) && aum > 0) {
        // Convert to USD for tier calculation
        const aumInUSD = convertToUSD(aum, formData.currency)
        const tier = calculateTier(aumInUSD)
        setFormData(prev => ({
          ...prev,
          determinedTier: tier as any
        }))
      }
    }
  }, [formData.totalCapitalCommitment, formData.currency])

  // Update issuances when investments or financing changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      calculatedIssuances: calculateIssuances()
    }))
  }, [formData.plannedInvestments, formData.financingStrategy])

  // Auto-generate token config
  useEffect(() => {
    generateTokenConfig()
  }, [formData.structureName, formData.totalCapitalCommitment, formData.minCheckSize, formData.maxCheckSize])

  // Auto-set distribution model based on structure type
  useEffect(() => {
    if (formData.structureType === 'private-debt') {
      setFormData(prev => ({ ...prev, distributionModel: 'interest-only' }))
    } else if (formData.distributionModel === 'interest-only') {
      // If switching from private-debt to another type, reset to waterfall
      setFormData(prev => ({ ...prev, distributionModel: 'waterfall' }))
    }
  }, [formData.structureType])

  // Listen for visibility settings changes
  useEffect(() => {
    // Initialize visibility settings on mount
    setVisibilitySettings(getVisibilitySettings())

    const handleVisibilityChange = () => {
      setVisibilitySettings(getVisibilitySettings())
    }

    window.addEventListener('visibility-settings-changed', handleVisibilityChange)
    window.addEventListener('storage', handleVisibilityChange)

    return () => {
      window.removeEventListener('visibility-settings-changed', handleVisibilityChange)
      window.removeEventListener('storage', handleVisibilityChange)
    }
  }, [])

  // Initialize hierarchy structures when levels change (all-at-once mode)
  useEffect(() => {
    if (formData.hierarchyMode && formData.hierarchySetupApproach === 'all-at-once') {
      const currentLevels = formData.hierarchyStructures.length
      const targetLevels = formData.hierarchyLevels

      if (currentLevels !== targetLevels) {
        const newStructures = Array.from({ length: targetLevels }, (_, index) => {
          // Preserve existing structure config if available
          const existing = formData.hierarchyStructures[index]
          if (existing) return existing

          // Create new structure template
          return {
            level: index,
            name: index === 0 ? 'Master Structure' :
                  `Level ${index + 1} Structure`,
            type: formData.structureType, // Use correct field name: formData.structureType (not formData.type which doesn't exist!)
            applyWaterfall: index === 0, // Only apply waterfall at master level by default
            applyEconomicTerms: index === 0, // Only apply economic terms at master level by default
            waterfallAlgorithm: index === 0 ? 'american' : null,
          }
        })

        setFormData(prev => ({
          ...prev,
          hierarchyStructures: newStructures as any
        }))
      }
    }
  }, [formData.hierarchyMode, formData.hierarchySetupApproach, formData.hierarchyLevels, formData.structureType])

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const selectedStructure = STRUCTURE_TYPES[formData.structureType as keyof typeof STRUCTURE_TYPES]
  const availableSubtypes = selectedStructure?.subtypes || []
  const availableRegions = selectedStructure?.regions || []
  const currentTier = formData.determinedTier ? PRICING_TIERS[formData.determinedTier as keyof typeof PRICING_TIERS] : null
  const additionalCosts = calculateAdditionalCosts()
  const calculatedIssuances = calculateIssuances()

  // Validate current step before moving to next
  const validateStep = (step: number): string[] => {
    const errors: string[] = []

    switch (step) {
      case 1:
        if (!formData.structureType) {
          errors.push('Please select a primary structure type')
        }
        if (formData.structureType && availableSubtypes.length > 0 && !formData.structureSubtype) {
          errors.push('Please select a structure subtype')
        }
        // Validate parent structure ownership percentage if parent is selected
        if (formData.parentStructureId && (formData.parentStructureOwnershipPercentage === null || formData.parentStructureOwnershipPercentage === undefined)) {
          errors.push('Please enter the parent structure ownership percentage (0-100%)')
        }
        // Validate banner image is uploaded
        if (!formData.bannerImage) {
          errors.push('Please upload a structure banner image')
        }
        // Validate wallet owner address (mandatory)
        if (!formData.walletOwnerAddress || formData.walletOwnerAddress.trim() === '') {
          errors.push('Please enter the wallet owner address')
        } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.walletOwnerAddress)) {
          errors.push('Please enter a valid hexadecimal wallet address (0x followed by 40 hex characters)')
        }
        // Validate operating agreement hash (mandatory)
        if (!formData.operatingAgreementHash || formData.operatingAgreementHash.trim() === '') {
          errors.push('Please enter the operating agreement hash')
        } else if (!/^0x[a-fA-F0-9]+$/.test(formData.operatingAgreementHash)) {
          errors.push('Please enter a valid hexadecimal hash (0x followed by hex characters)')
        }
        break

      case 2:
        if (!formData.structureName.trim()) {
          errors.push('Please enter a structure name')
        }
        if (!formData.jurisdiction) {
          errors.push('Please select a jurisdiction')
        }
        // Validate US State for Fund, SA/LLC, and Trust structures in United States
        if (['fund', 'sa', 'fideicomiso'].includes(formData.structureType) && formData.jurisdiction === 'United States') {
          if (!formData.usState) {
            errors.push('Please select a US state')
          }
          if (formData.usState === 'Other' && !formData.usStateOther.trim()) {
            errors.push('Please specify the state name')
          }
        }
        if (formData.structureType === 'fund' && !formData.fundTerm) {
          errors.push('Please enter the fund term (years)')
        }
        if (!formData.inceptionDate) {
          errors.push('Please select an inception date')
        }
        break

      case 3:
        if (!formData.totalCapitalCommitment) {
          errors.push('Please enter total capital commitment')
        }
        if (!formData.totalInvestors) {
          errors.push('Please enter the total number of investors')
        }
        if (!formData.minCheckSize) {
          errors.push('Please enter minimum check size')
        }
        if (!formData.maxCheckSize) {
          errors.push('Please enter maximum check size')
        }
        if (!formData.tokenName) {
          errors.push('Please enter ticket name')
        }
        if (!formData.tokenSymbol) {
          errors.push('Please enter ticket symbol')
        }

        // CRITICAL: Validate that total commitment is evenly divisible by minCheckSize
        if (formData.totalCapitalCommitment && formData.minCheckSize) {
          const totalCommitment = parseFloat(formData.totalCapitalCommitment)
          const minCheck = parseFloat(formData.minCheckSize)

          if (totalCommitment > 0 && minCheck > 0) {
            const calculatedTokens = totalCommitment / minCheck
            if (!Number.isInteger(calculatedTokens)) {
              errors.push(`Total commitment (${formData.currency} ${totalCommitment.toLocaleString()}) must be evenly divisible by minimum ticket size (${formData.currency} ${minCheck.toLocaleString()}). Please adjust one of these values.`)
            }
          }
        }

        if (formData.minCheckSize && formData.maxCheckSize) {
          const min = parseFloat(formData.minCheckSize)
          const max = parseFloat(formData.maxCheckSize)

          if (min > max) {
            errors.push('Minimum check size cannot be greater than maximum check size')
          }

          // Validate that max is a multiple of min
          if (min > 0 && max % min !== 0) {
            errors.push('Maximum check size must be a multiple of minimum check size')
          }
        }
        // Validate equity/debt subtype selection
        if (formData.financingStrategy === 'equity' && !formData.equitySubtype) {
          errors.push('Please select an equity instrument type')
        }
        if (formData.financingStrategy === 'debt' && !formData.debtSubtype) {
          errors.push('Please select a debt instrument type')
        }
        break

      case 4:
        // Validate that at least one payment method is enabled
        if (!formData.paymentLocalBankEnabled &&
            !formData.paymentIntlBankEnabled &&
            !formData.paymentCryptoEnabled) {
          errors.push('Please select at least one payment method to continue')
        }

        // Validate Local Bank Transfer fields if enabled
        if (formData.paymentLocalBankEnabled) {
          if (!formData.paymentLocalBankName.trim()) {
            errors.push('Local Bank Transfer: Bank Name is required')
          }
          if (!formData.paymentLocalAccountNumber.trim()) {
            errors.push('Local Bank Transfer: Account Number is required')
          }
          if (!formData.paymentLocalRoutingNumber.trim()) {
            errors.push('Local Bank Transfer: Routing/ABA Number is required')
          }
          if (!formData.paymentLocalAccountHolder.trim()) {
            errors.push('Local Bank Transfer: Account Holder Name is required')
          }
          if (!formData.paymentLocalBankAddress.trim()) {
            errors.push('Local Bank Transfer: Bank Address is required')
          }
        }

        // Validate International Bank Transfer fields if enabled
        if (formData.paymentIntlBankEnabled) {
          if (!formData.paymentIntlBankName.trim()) {
            errors.push('International Bank Transfer: Bank Name is required')
          }
          if (!formData.paymentIntlAccountNumber.trim()) {
            errors.push('International Bank Transfer: Account Number/IBAN is required')
          }
          if (!formData.paymentIntlSwiftCode.trim()) {
            errors.push('International Bank Transfer: SWIFT/BIC Code is required')
          }
          if (!formData.paymentIntlAccountHolder.trim()) {
            errors.push('International Bank Transfer: Account Holder Name is required')
          }
          if (!formData.paymentIntlBankAddress.trim()) {
            errors.push('International Bank Transfer: Bank Address is required')
          }
        }

        // Validate Crypto Payment fields if enabled
        if (formData.paymentCryptoEnabled) {
          if (!formData.paymentCryptoBlockchain) {
            errors.push('Crypto Payment: Blockchain selection is required')
          }
          if (!formData.paymentCryptoWalletAddress.trim()) {
            errors.push('Crypto Payment: Destination Wallet Address is required')
          } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.paymentCryptoWalletAddress)) {
            errors.push('Crypto Payment: Please enter a valid EVM wallet address (0x followed by 40 hexadecimal characters)')
          }
        }
        break

      case 5:
        // Validate capital calls if enabled
        if (formData.enableCapitalCalls) {
          if (formData.capitalCalls.length === 0) {
            errors.push('Please add at least one capital call')
          } else {
            const totalCallPercent = formData.capitalCalls.reduce((sum, c) => sum + (c.callPercentage || 0), 0)
            if (Math.abs(totalCallPercent - 100) > 0.01) { // Allow for small floating point differences
              errors.push(`Capital call percentages must total 100% (currently ${totalCallPercent}%)`)
            }
          }
        }
        break

      // Step 7 has no required fields (Document Upload is optional)
      default:
        break
    }

    return errors
  }

  const nextStep = () => {
    // Clear previous validation errors
    setValidationErrors([])

    // Validate current step
    const errors = validateStep(currentStep)

    if (errors.length > 0) {
      setValidationErrors(errors)
      // Scroll to top to show validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // If validation passes, move to next step
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    // Clear validation errors when going back
    setValidationErrors([])

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Validate that if parent structure is selected, ownership percentage must be provided
      if (formData.parentStructureId && (formData.parentStructureOwnershipPercentage === null || formData.parentStructureOwnershipPercentage === undefined)) {
        toast.error('Please enter the parent structure ownership percentage')
        setIsSubmitting(false)
        return
      }

      // Save the structure to localStorage
      const newStructure = saveStructure({
        name: formData.structureName,
        type: formData.structureType as 'fund' | 'sa' | 'fideicomiso' | 'private-debt',
        subtype: formData.structureSubtype,
        jurisdiction: formData.jurisdiction,
        totalCommitment: parseFloat(formData.totalCapitalCommitment),
        currency: formData.currency,
        investors: parseInt(formData.totalInvestors),
        status: formData.currentStage === 'fundraising' ? 'fundraising' : 'active',
        inceptionDate: formData.inceptionDate,
        currentStage: formData.currentStage,
        fundTerm: formData.fundTerm,
        fundType: formData.fundType,
        minCheckSize: parseFloat(formData.minCheckSize),
        maxCheckSize: parseFloat(formData.maxCheckSize),
        economicTermsApplication: formData.economicTermsApplication,
        distributionModel: formData.distributionModel,
        managementFee: formData.managementFee,
        performanceFee: formData.performanceFee,
        hurdleRate: formData.hurdleRate,
        preferredReturn: formData.preferredReturn,
        waterfallStructure: formData.waterfallStructure,
        waterfallScenarios: formData.waterfallScenarios,
        distributionFrequency: formData.distributionFrequency,
        defaultTaxRate: formData.defaultTaxRate,
        debtInterestRate: formData.debtInterestRate,
        debtGrossInterestRate: formData.debtGrossInterestRate,
        // V3 Additional fields
        plannedInvestments: formData.plannedInvestments,
        financingStrategy: formData.financingStrategy,
        equitySubtype: formData.equitySubtype,
        debtSubtype: formData.debtSubtype,
        usState: formData.usState,
        usStateOther: formData.usStateOther,
        capitalCallNoticePeriod: formData.capitalCallNoticePeriod,
        capitalCallDefaultPercentage: formData.capitalCallDefaultPercentage || undefined,
        capitalCallPaymentDeadline: formData.capitalCallPaymentDeadline,
        determinedTier: formData.determinedTier || undefined,
        calculatedIssuances: formData.calculatedIssuances,
        tokenName: formData.tokenName,
        tokenSymbol: formData.tokenSymbol,
        tokenValue: formData.tokenValue,
        totalTokens: formData.totalTokens,
        minTokensPerInvestor: formData.minTokensPerInvestor,
        maxTokensPerInvestor: formData.maxTokensPerInvestor,
        preRegisteredInvestors: formData.preRegisteredInvestors as any,
        // Note: Documents are uploaded separately via POST /api/documents after structure creation
        // V4: Multi-Level Hierarchy
        hierarchyMode: formData.hierarchyMode,
        numberOfLevels: formData.hierarchyLevels, // Pass number of levels for multi-level creation
        hierarchyStructures: formData.hierarchyStructures,
        parentStructureId: formData.parentStructureId,
        parentStructureOwnershipPercentage: formData.parentStructureOwnershipPercentage,
        childStructureIds: [],
        hierarchyLevel: formData.parentStructureId ? 1 : 1, // Start at level 1 for root structures
        hierarchyPath: [], // Will be updated immediately after save
        applyWaterfallAtThisLevel: formData.applyWaterfallAtThisLevel,
        applyEconomicTermsAtThisLevel: formData.applyEconomicTermsAtThisLevel,
        waterfallAlgorithm: formData.waterfallAlgorithm,
        incomeFlowTarget: formData.incomeFlowTarget,
        // V5: ILPA Performance Methodology
        performanceMethodology: formData.performanceMethodology as 'granular' | 'grossup' | undefined,
        calculationLevel: formData.calculationLevel as 'fund-level' | 'portfolio-level' | undefined,
        // V6: Structure Banner Image
        bannerImage: formData.bannerImagePreview, // Save preview for localStorage
        // V7: Payment Configurations - Flat structure
        localBankName: formData.paymentLocalBankEnabled ? formData.paymentLocalBankName : undefined,
        localAccountBank: formData.paymentLocalBankEnabled ? formData.paymentLocalAccountNumber : undefined,
        localRoutingBank: formData.paymentLocalBankEnabled ? formData.paymentLocalRoutingNumber : undefined,
        localAccountHolder: formData.paymentLocalBankEnabled ? formData.paymentLocalAccountHolder : undefined,
        localBankAddress: formData.paymentLocalBankEnabled ? formData.paymentLocalBankAddress : undefined,
        internationalBankName: formData.paymentIntlBankEnabled ? formData.paymentIntlBankName : undefined,
        internationalAccountBank: formData.paymentIntlBankEnabled ? formData.paymentIntlAccountNumber : undefined,
        internationalSwift: formData.paymentIntlBankEnabled ? formData.paymentIntlSwiftCode : undefined,
        internationalHolderName: formData.paymentIntlBankEnabled ? formData.paymentIntlAccountHolder : undefined,
        internationalBankAddress: formData.paymentIntlBankEnabled ? formData.paymentIntlBankAddress : undefined,
        blockchainNetwork: formData.paymentCryptoEnabled ? formData.paymentCryptoBlockchain : undefined,
        walletAddress: formData.paymentCryptoEnabled ? formData.paymentCryptoWalletAddress : undefined,
      })

      // Update hierarchyPath with the generated structure ID
      const { updateStructure } = await import('@/lib/structures-storage')
      updateStructure(newStructure.id, {
        hierarchyPath: formData.parentStructureId
          ? [formData.parentStructureId, newStructure.id] // Parent path + this structure
          : [newStructure.id] // Root structure
      })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Save pre-registered investors to the investors storage
      // ONLY if NOT in hierarchy mode - hierarchy mode handles investor creation internally in createMultiLevelStructure()
      if (formData.preRegisteredInvestors.length > 0 && !formData.hierarchyMode) {
        const masterStructureId = newStructure.id
        const totalCommitment = parseFloat(formData.totalCapitalCommitment)

        // Build a map of hierarchy level to structure ID
        // Level 1 = master structure
        // Level 2+ = child structures (if they exist in newStructure.childStructureIds)
        const levelToStructureMap: Record<number, { id: string; name: string }> = {
          1: { id: masterStructureId, name: formData.structureName }
        }

        // If hierarchy mode, map child structures to their levels
        // IMPORTANT: childStructureIds array does NOT include the master structure
        // So childStructureIds[0] = Level 2, childStructureIds[1] = Level 3, etc.
        if (formData.hierarchyMode && newStructure.childStructureIds && newStructure.childStructureIds.length > 0) {
          formData.hierarchyStructures.forEach((hierStruct, index) => {
            const level = hierStruct.level || (index + 1)

            // Skip Level 1 (master) - it's already mapped above
            if (level === 1) return

            // For Level 2+, use childStructureIds[level - 2] because array doesn't include master
            const childIndex = level - 2
            const childId = newStructure.childStructureIds?.[childIndex]
            if (childId) {
              levelToStructureMap[level] = { id: childId, name: hierStruct.name }
            }
          })
        }

        formData.preRegisteredInvestors.forEach((preInvestor) => {
          // Determine investor type and name based on investorType field
          const isEntity = preInvestor.investorType?.toLowerCase() !== 'individual'
          const investorName = isEntity ? ((preInvestor as any).entityName || 'Entity') : `${preInvestor.firstName || ''} ${preInvestor.lastName || ''}`

          // Determine which structure this investor should be assigned to based on their hierarchy level
          const investorLevel = preInvestor.hierarchyLevel || 1 // Default to Level 1 (master) if not specified
          const targetStructure = levelToStructureMap[investorLevel] || levelToStructureMap[1] // Fallback to master
          const structureId = targetStructure.id
          const structureName = targetStructure.name

          // Check if investor already exists by email
          const { getInvestorByEmail, updateInvestor } = require('@/lib/investors-storage')
          const existingInvestor = getInvestorByEmail(preInvestor.email)

          if (existingInvestor) {
            // Investor exists - add this structure to their fundOwnerships
            const newOwnership = {
              fundId: structureId,
              fundName: structureName,
              commitment: 0,
              ownershipPercent: 0,
              calledCapital: 0,
              uncalledCapital: 0,
              investedDate: new Date().toISOString(),
              customTerms: preInvestor.customTerms,
            }

            // Add new ownership to existing array
            const updatedOwnerships = [...(existingInvestor.fundOwnerships || []), newOwnership]

            // Check if ALL ownerships have zero commitment - if so, set status to Pending
            const allZeroCommitment = updatedOwnerships.every(fo => fo.commitment === 0)

            updateInvestor(existingInvestor.id, {
              fundOwnerships: updatedOwnerships,
              status: allZeroCommitment ? 'Pending' : existingInvestor.status, // Set to Pending if no commitments yet
              notes: `${existingInvestor.notes || ''}\nAdded to ${formData.structureName} structure. Source: ${preInvestor.source}${preInvestor.customTerms ? ' (with custom terms)' : ''}`.trim()
            })

            console.log(`Updated existing investor: ${existingInvestor.name} - added ${formData.structureName}`)
          } else {
            // Investor doesn't exist - create new investor
            saveInvestor({
            name: investorName,
            email: preInvestor.email,
            type: (preInvestor.investorType?.toLowerCase() || 'individual') as 'individual' | 'institution' | 'family-office' | 'fund-of-funds',
            status: 'Pending', // Pending until they complete onboarding

            // Entity-specific fields (for B2B entities)
            entityName: (preInvestor as any).entityName,
            contactFirstName: preInvestor.firstName,
            contactLastName: preInvestor.lastName,

            // Fund Ownerships (plural array) - will be calculated properly during investor onboarding
            fundOwnerships: [{
              fundId: structureId,
              fundName: structureName,
              commitment: 0, // Will be set during onboarding
              ownershipPercent: 0, // Will be calculated during onboarding
              calledCapital: 0,
              uncalledCapital: 0,
              investedDate: new Date().toISOString(),
              customTerms: preInvestor.customTerms, // Store per-structure custom terms
            }],

            // Performance Metrics - all zeros until they invest
            currentValue: 0,
            unrealizedGain: 0,
            totalDistributed: 0,
            netCashFlow: 0,
            irr: 0,

            // Tax
            k1Status: 'Not Started',

            // Contact
            preferredContactMethod: 'Email',
            notes: `Pre-registered during ${formData.structureName} structure creation. Source: ${preInvestor.source}${preInvestor.customTerms ? ' (with custom terms)' : ''}`,

            // Documents
            documents: [],

            // Metadata
            investorSince: new Date().toISOString(),
            })
          }
        })
      }

      setIsSubmitting(false)
      setCreatedStructureId(newStructure.id)
      setInReviewMode(true)

      // Show review page - user can then confirm to complete setup
    } catch (error) {
      console.error('Error saving structure:', error)
      setIsSubmitting(false)
      toast.error('Failed to save structure. Please try again.')
    }
  }

  // Complete Setup Confirmation Handler
  const handleCompleteSetupConfirmation = async () => {
    setShowCompleteConfirmation(false)
    setIsSubmitting(true)

    try {
      // Get auth token from storage (using getAuthState)
      const { getAuthState } = await import('@/lib/auth-storage')
      const authState = getAuthState()
      const authToken = authState.token || 'mock_token_user-001_test'

      // Step 1: Create structure via API using FormData for file upload
      const formDataPayload = new FormData()

      // Basic Information
      formDataPayload.append('name', formData.structureName)
      formDataPayload.append('type', formData.structureType)
      formDataPayload.append('subtype', formData.structureSubtype)
      formDataPayload.append('status', formData.currentStage === 'fundraising' ? 'fundraising' : 'active')
      formDataPayload.append('description', '')

      // Hierarchy
      if (formData.parentStructureId) {
        formDataPayload.append('parentStructureId', formData.parentStructureId)
        // Parent structure ownership percentage (required if parent exists)
        if (formData.parentStructureOwnershipPercentage !== null && formData.parentStructureOwnershipPercentage !== undefined) {
          formDataPayload.append('parentStructureOwnershipPercentage', formData.parentStructureOwnershipPercentage.toString())
        }
      }

      // Financial Terms
      formDataPayload.append('totalCommitment', formData.totalCapitalCommitment)
      formDataPayload.append('managementFee', formData.managementFee.toString())
      formDataPayload.append('carriedInterest', formData.performanceFee.toString())
      formDataPayload.append('hurdleRate', formData.hurdleRate.toString())
      formDataPayload.append('waterfallType', formData.waterfallStructure)
      formDataPayload.append('performanceFee', formData.performanceFee.toString())
      formDataPayload.append('preferredReturn', formData.preferredReturn.toString())

      // Performance Methodology
      if (formData.performanceMethodology) {
        formDataPayload.append('performanceMethodology', formData.performanceMethodology)
      } else {
        formDataPayload.append('performanceMethodology', '')
      }

      // Dates & Term
      // Format inceptionDate as YYYY-MM-DD
      if (formData.inceptionDate) {
        const date = new Date(formData.inceptionDate)
        const formattedDate = date.toISOString().split('T')[0] // YYYY-MM-DD format
        formDataPayload.append('inceptionDate', formattedDate)
      } else {
        formDataPayload.append('inceptionDate', '')
      }
      formDataPayload.append('termYears', formData.fundTerm.toString())
      formDataPayload.append('extensionYears', '')

      // Fund Type
      if (formData.fundType) {
        formDataPayload.append('fundType', formData.fundType)
      } else {
        formDataPayload.append('fundType', '')
      }

      // Service Providers (not captured in current form)
      formDataPayload.append('gp', '')
      formDataPayload.append('fundAdmin', '')
      formDataPayload.append('legalCounsel', '')
      formDataPayload.append('auditor', '')
      formDataPayload.append('taxAdvisor', '')
      formDataPayload.append('bankAccounts', '')

      // Currency & Jurisdiction
      formDataPayload.append('baseCurrency', formData.currency)
      // Merge jurisdiction with US state information
      let jurisdictionValue = formData.jurisdiction
      if (formData.jurisdiction === 'United States' && formData.usState) {
        if (formData.usState === 'Other' && formData.usStateOther) {
          jurisdictionValue = `${formData.jurisdiction} - ${formData.usStateOther}`
        } else {
          jurisdictionValue = `${formData.jurisdiction} - ${formData.usState}`
        }
      }
      formDataPayload.append('taxJurisdiction', jurisdictionValue)
      formDataPayload.append('regulatoryStatus', '')

      // Investment Details
      formDataPayload.append('investmentStrategy', formData.financingStrategy)
      formDataPayload.append('targetReturns', '')
      formDataPayload.append('riskProfile', '')
      formDataPayload.append('stage', formData.currentStage)
      formDataPayload.append('plannedInvestments', formData.plannedInvestments.toString())
      formDataPayload.append('investors', formData.totalInvestors)

      // Income Flow Target
      if (formData.incomeFlowTarget) {
        formDataPayload.append('incomeFlowTarget', formData.incomeFlowTarget)
      } else {
        formDataPayload.append('incomeFlowTarget', '')
      }

      // Tier and Issuances
      if (formData.determinedTier) {
        formDataPayload.append('determinedTier', formData.determinedTier)
      } else {
        formDataPayload.append('determinedTier', '')
      }
      formDataPayload.append('calculatedIssuances', formData.calculatedIssuances.toString())

      // Debt Interest Rates (for private-debt structures)
      if (formData.debtInterestRate) {
        formDataPayload.append('debtInterestRate', formData.debtInterestRate)
      } else {
        formDataPayload.append('debtInterestRate', '')
      }
      if (formData.debtGrossInterestRate) {
        formDataPayload.append('debtGrossInterestRate', formData.debtGrossInterestRate)
      } else {
        formDataPayload.append('debtGrossInterestRate', '')
      }

      // Capital Call Configuration
      if (formData.capitalCallNoticePeriod) {
        formDataPayload.append('capitalCallNoticePeriod', formData.capitalCallNoticePeriod)
      } else {
        formDataPayload.append('capitalCallNoticePeriod', '')
      }
      if (formData.capitalCallPaymentDeadline) {
        formDataPayload.append('capitalCallPaymentDeadline', formData.capitalCallPaymentDeadline)
      } else {
        formDataPayload.append('capitalCallPaymentDeadline', '')
      }
      if (formData.capitalCallDefaultPercentage) {
        formDataPayload.append('capitalCallDefaultPercentage', formData.capitalCallDefaultPercentage)
      } else {
        formDataPayload.append('capitalCallDefaultPercentage', '')
      }

      // Distribution Configuration
      formDataPayload.append('distributionFrequency', formData.distributionFrequency)

      // Tax Configuration
      // Default Tax Rate
      if (formData.defaultTaxRate) {
        formDataPayload.append('defaultTaxRate', formData.defaultTaxRate)
      } else {
        formDataPayload.append('defaultTaxRate', '')
      }

      // VAT Rates
      if (formData.sameTaxTreatment) {
        // Same treatment - use main VAT rate
        if (formData.vatRate) {
          formDataPayload.append('vatRate', formData.vatRate)
        } else {
          formDataPayload.append('vatRate', '')
        }
      } else {
        // Different treatment - use separate VAT rates
        if (formData.vatRateNaturalPersons) {
          formDataPayload.append('vatRateNaturalPersons', formData.vatRateNaturalPersons)
        } else {
          formDataPayload.append('vatRateNaturalPersons', '')
        }
        if (formData.vatRateLegalEntities) {
          formDataPayload.append('vatRateLegalEntities', formData.vatRateLegalEntities)
        } else {
          formDataPayload.append('vatRateLegalEntities', '')
        }
      }

      // Withholding / Dividend Tax
      if (formData.sameTaxTreatment) {
        // Same treatment for all - use the main fields
        if (formData.witholdingDividendTaxRate) {
          formDataPayload.append('witholdingDividendTaxRate', formData.witholdingDividendTaxRate)
        } else {
          formDataPayload.append('witholdingDividendTaxRate', '')
        }
      } else {
        // Different treatment for natural persons vs legal entities
        if (formData.witholdingDividendTaxRateNaturalPersons) {
          formDataPayload.append('witholdingDividendTaxRateNaturalPersons', formData.witholdingDividendTaxRateNaturalPersons)
        } else {
          formDataPayload.append('witholdingDividendTaxRateNaturalPersons', '')
        }
        if (formData.witholdingDividendTaxRateLegalEntities) {
          formDataPayload.append('witholdingDividendTaxRateLegalEntities', formData.witholdingDividendTaxRateLegalEntities)
        } else {
          formDataPayload.append('witholdingDividendTaxRateLegalEntities', '')
        }
      }

      // Income Tax
      if (formData.sameTaxTreatment) {
        // Same treatment for all
        if (formData.incomeDebtTaxRate) {
          formDataPayload.append('incomeDebtTaxRate', formData.incomeDebtTaxRate)
        } else {
          formDataPayload.append('incomeDebtTaxRate', '')
        }
        if (formData.incomeEquityTaxRate) {
          formDataPayload.append('incomeEquityTaxRate', formData.incomeEquityTaxRate)
        } else {
          formDataPayload.append('incomeEquityTaxRate', '')
        }
      } else {
        // Different treatment
        if (formData.incomeDebtTaxRateNaturalPersons) {
          formDataPayload.append('incomeDebtTaxRateNaturalPersons', formData.incomeDebtTaxRateNaturalPersons)
        } else {
          formDataPayload.append('incomeDebtTaxRateNaturalPersons', '')
        }
        if (formData.incomeEquityTaxRateNaturalPersons) {
          formDataPayload.append('incomeEquityTaxRateNaturalPersons', formData.incomeEquityTaxRateNaturalPersons)
        } else {
          formDataPayload.append('incomeEquityTaxRateNaturalPersons', '')
        }
        if (formData.incomeDebtTaxRateLegalEntities) {
          formDataPayload.append('incomeDebtTaxRateLegalEntities', formData.incomeDebtTaxRateLegalEntities)
        } else {
          formDataPayload.append('incomeDebtTaxRateLegalEntities', '')
        }
        if (formData.incomeEquityTaxRateLegalEntities) {
          formDataPayload.append('incomeEquityTaxRateLegalEntities', formData.incomeEquityTaxRateLegalEntities)
        } else {
          formDataPayload.append('incomeEquityTaxRateLegalEntities', '')
        }
      }

      // Ticket Sizes
      formDataPayload.append('minimumTicket', formData.minCheckSize)
      formDataPayload.append('maximumTicket', formData.maxCheckSize)
      formDataPayload.append('strategyInstrumentType', formData.equitySubtype || formData.debtSubtype || '')

      // Legal Terms (placeholder - not captured in form)
      formDataPayload.append('managementControl', '')
      formDataPayload.append('capitalContributions', '')
      formDataPayload.append('allocationsDistributions', '')
      formDataPayload.append('limitedPartnerObligations', '')
      formDataPayload.append('limitedPartnerRights', '')
      formDataPayload.append('lockUpPeriod', '')
      formDataPayload.append('withdrawalConditions', '')
      formDataPayload.append('withdrawalProcess', '')
      formDataPayload.append('generalProhibition', '')
      formDataPayload.append('permittedTransfers', '')
      formDataPayload.append('transferRequirements', '')

      // Reporting
      formDataPayload.append('quarterlyReports', '')
      formDataPayload.append('annualReports', '')
      formDataPayload.append('taxForms', '')
      formDataPayload.append('capitalCallDistributionsNotices', '')
      formDataPayload.append('additionalCommunications', '')

      // Liability & Indemnification
      formDataPayload.append('limitedLiability', '')
      formDataPayload.append('exceptionsLiability', '')
      formDataPayload.append('maximumExposure', '')
      formDataPayload.append('indemnifiesPartnership', '')
      formDataPayload.append('lpIndemnifiesPartnership', '')
      formDataPayload.append('indemnifiesProcedures', '')

      // Additional Legal
      formDataPayload.append('amendments', '')
      formDataPayload.append('dissolution', '')
      formDataPayload.append('disputesResolution', '')
      formDataPayload.append('governingLaw', '')
      formDataPayload.append('additionalProvisions', '')

      // Payment Configurations - Flat structure
      if (formData.paymentLocalBankEnabled) {
        formDataPayload.append('localBankName', formData.paymentLocalBankName || '')
        formDataPayload.append('localAccountBank', formData.paymentLocalAccountNumber || '')
        formDataPayload.append('localRoutingBank', formData.paymentLocalRoutingNumber || '')
        formDataPayload.append('localAccountHolder', formData.paymentLocalAccountHolder || '')
        formDataPayload.append('localBankAddress', formData.paymentLocalBankAddress || '')
      } else {
        formDataPayload.append('localBankName', '')
        formDataPayload.append('localAccountBank', '')
        formDataPayload.append('localRoutingBank', '')
        formDataPayload.append('localAccountHolder', '')
        formDataPayload.append('localBankAddress', '')
      }

      if (formData.paymentIntlBankEnabled) {
        formDataPayload.append('internationalBankName', formData.paymentIntlBankName || '')
        formDataPayload.append('internationalAccountBank', formData.paymentIntlAccountNumber || '')
        formDataPayload.append('internationalSwift', formData.paymentIntlSwiftCode || '')
        formDataPayload.append('internationalHolderName', formData.paymentIntlAccountHolder || '')
        formDataPayload.append('internationalBankAddress', formData.paymentIntlBankAddress || '')
      } else {
        formDataPayload.append('internationalBankName', '')
        formDataPayload.append('internationalAccountBank', '')
        formDataPayload.append('internationalSwift', '')
        formDataPayload.append('internationalHolderName', '')
        formDataPayload.append('internationalBankAddress', '')
      }

      if (formData.paymentCryptoEnabled) {
        formDataPayload.append('blockchainNetwork', formData.paymentCryptoBlockchain || '')
        formDataPayload.append('walletAddress', formData.paymentCryptoWalletAddress || '')
      } else {
        formDataPayload.append('blockchainNetwork', '')
        formDataPayload.append('walletAddress', '')
      }

      // Banner Image - Append as file if exists
      if (formData.bannerImage) {
        formDataPayload.append('bannerImage', formData.bannerImage)
      }

      // Blockchain Owner Information
      if (formData.walletOwnerAddress) {
        formDataPayload.append('walletOwnerAddress', formData.walletOwnerAddress)
      } else {
        formDataPayload.append('walletOwnerAddress', '')
      }
      if (formData.operatingAgreementHash) {
        formDataPayload.append('operatingAgreementHash', formData.operatingAgreementHash)
      } else {
        formDataPayload.append('operatingAgreementHash', '')
      }

      const structureResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/structures`, {
        method: 'POST',
        headers: {
          // Note: No Content-Type header - browser sets it automatically with boundary for FormData
          'Authorization': `Bearer ${authToken}`
        },
        body: formDataPayload
      })

      if (!structureResponse.ok) {
        // Handle 401 Unauthorized - session expired or invalid
        if (structureResponse.status === 401) {
          try {
            const errorData = await structureResponse.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Structure Setup] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }
        const errorData = await structureResponse.json().catch(() => ({}))
        console.error('[Structure Setup] Failed to create structure:', errorData)
        toast.error('Failed to create structure. Please try again.')
        setIsSubmitting(false)
        return
      }

      const structureData = await structureResponse.json()
      const structureId = structureData.data?.id

      // Step 2: Create waterfall tiers
      if (formData.waterfallScenarios && formData.waterfallScenarios.length > 0) {
        const waterfallPayload = {
          structureId: structureId,
          tiers: formData.waterfallScenarios.map(scenario => ({
            name: scenario.name,
            gpSplit: parseFloat(scenario.gpSplit),
            managementFee: parseFloat(scenario.managementFee),
            preferredReturn: parseFloat(scenario.preferredReturn),
          }))
        }

        console.log('[Waterfall Tiers] Creating tiers for structure:', structureId)
        console.log('[Waterfall Tiers] Payload:', waterfallPayload)

        const waterfallResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/waterfall-tiers/bulk-create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(waterfallPayload)
        })

        if (!waterfallResponse.ok) {
          // Handle 401 Unauthorized - session expired or invalid
          if (waterfallResponse.status === 401) {
            try {
              const errorData = await waterfallResponse.json()
              if (errorData.error === "Invalid or expired token") {
                console.log('[Waterfall Tiers] 401 Unauthorized - clearing session and redirecting to login')
                logout()
                router.push('/sign-in')
                return
              }
            } catch (e) {
              console.log('Error: ', e)
            }
          }
          const errorData = await waterfallResponse.json().catch(() => ({}))
          console.error('[Waterfall Tiers] Failed to create:', errorData)

          // Rollback: Delete created structure
          console.log('[Rollback] Deleting structure due to waterfall failure:', structureId)
          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/structures/${structureId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            })
          } catch (rollbackError) {
            console.error('[Rollback] Failed to delete structure:', rollbackError)
          }

          toast.error('Failed to create waterfall tiers. Structure creation rolled back.')
          setIsSubmitting(false)
          return
        }

        const responseData = await waterfallResponse.json()
        console.log('[Waterfall Tiers] Created successfully:', responseData)
      }

      // Step 3: Create capital calls (if enabled)
      const createdCapitalCallIds: string[] = []
      if (formData.enableCapitalCalls && formData.capitalCalls && formData.capitalCalls.length > 0) {
        console.log('[Capital Calls] Creating capital calls for structure:', structureId)

        for (let index = 0; index < formData.capitalCalls.length; index++) {
          const call = formData.capitalCalls[index]

          try {
            const capitalCallPayload = {
              structureId: structureId,
              callNumber: index + 1, // Index starts at 0, but callNumber starts at 1
              callDate: call.date,
              totalCallAmount: call.callPercentage
            }

            console.log(`[Capital Call ${index + 1}] Sending:`, capitalCallPayload)

            const capitalCallResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/capital-calls`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify(capitalCallPayload)
            })

            if (!capitalCallResponse.ok) {
              // Handle 401 Unauthorized - session expired or invalid
              if (capitalCallResponse.status === 401) {
                try {
                  const errorData = await capitalCallResponse.json()
                  if (errorData.error === "Invalid or expired token") {
                    console.log('[Capital Calls] 401 Unauthorized - clearing session and redirecting to login')
                    logout()
                    router.push('/sign-in')
                    return
                  }
                } catch (e) {
                  console.log('Error: ', e)
                }
              }
              const errorData = await capitalCallResponse.json()
              console.error(`[Capital Call ${index + 1}] Failed:`, errorData)

              // Rollback: Delete structure and waterfalls
              console.log('[Rollback] Deleting structure and waterfalls due to capital call failure')
              try {
                // Delete structure (this should cascade delete waterfalls)
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/structures/${structureId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${authToken}`
                  }
                })
              } catch (rollbackError) {
                console.error('[Rollback] Failed to delete structure:', rollbackError)
              }

              toast.error(`Failed to create capital call ${index + 1}. Structure creation rolled back.`)
              setIsSubmitting(false)
              return
            }

            const responseData = await capitalCallResponse.json()
            if (responseData.data?.id) {
              createdCapitalCallIds.push(responseData.data.id)
            }
            console.log(`[Capital Call ${index + 1}] Created successfully:`, responseData)
          } catch (error) {
            console.error(`[Capital Call ${index + 1}] Error:`, error)

            // Rollback: Delete structure and waterfalls
            console.log('[Rollback] Deleting structure and waterfalls due to capital call error')
            try {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/structures/${structureId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              })
            } catch (rollbackError) {
              console.error('[Rollback] Failed to delete structure:', rollbackError)
            }

            toast.error(`Error creating capital call ${index + 1}. Structure creation rolled back.`)
            setIsSubmitting(false)
            return
          }
        }
      }

      // Step 3: Deploy blockchain contract
      const totalCapitalCommitment = parseFloat(formData.totalCapitalCommitment)
      const minTicketSize = parseFloat(formData.minCheckSize)
      const maxTokens = Math.floor(totalCapitalCommitment / minTicketSize)

      const blockchainPayload = {
        structureId: structureId,
        contractTokenName: formData.tokenName,
        contractTokenSymbol: formData.tokenSymbol,
        contractTokenValue: minTicketSize,
        contractMaxTokens: maxTokens,
        company: formData.structureName,
        currency: formData.currency,
        projectName: formData.structureName,
        network: formData.paymentCryptoEnabled ? formData.paymentCryptoBlockchain : null,
        operatingAgreementHash: formData.operatingAgreementHash,
      }

      const blockchainApiKey = process.env.NEXT_PUBLIC_BLOCKCHAIN_API_KEY || ''
      console.log('[Blockchain] API Key loaded:', blockchainApiKey ? 'Yes' : 'No (empty)')
      console.log('[Blockchain] Deploying contract for structure:', structureId)

      // Hash the API key using SHA-256
      const encoder = new TextEncoder()
      const data = encoder.encode(blockchainApiKey)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashedApiKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      console.log('[Blockchain] API Key hashed:', hashedApiKey ? 'Yes' : 'No')

      const blockchainResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/blockchain/deploy/erc3643`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'x-api-key': hashedApiKey
        },
        body: JSON.stringify(blockchainPayload)
      })

      console.log('[Blockchain] Response status:', blockchainResponse.status)
      if (!blockchainResponse.ok) {
        // Handle 401 Unauthorized - session expired or invalid
        if (blockchainResponse.status === 401) {
          try {
            const errorData = await blockchainResponse.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Blockchain] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }
        const errorData = await blockchainResponse.json().catch(() => ({}))
        console.error('[Blockchain] Error response:', errorData)

        // Rollback: Delete structure, waterfalls, and capital calls
        console.log('[Rollback] Deleting structure, waterfalls, and capital calls due to blockchain failure')
        try {
          // Delete structure (this should cascade delete waterfalls and capital calls)
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/structures/${structureId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          })
        } catch (rollbackError) {
          console.error('[Rollback] Failed to delete structure:', rollbackError)
        }

        toast.error('Failed to deploy blockchain contract. Structure creation rolled back.')
        setIsSubmitting(false)
        return
      }

      // Step 4: Upload documents
      const allDocuments = [
        ...formData.uploadedFundDocuments.map(doc => ({ ...doc, category: 'fund' })),
        ...formData.uploadedInvestorDocuments.map(doc => ({ ...doc, category: 'investor' }))
      ]

      if (allDocuments.length > 0) {
        for (const doc of allDocuments) {
          try {
            const documentFormData = new FormData()
            documentFormData.append('entityType', 'Structure')
            documentFormData.append('entityId', structureId)
            documentFormData.append('file', doc.file)
            documentFormData.append('documentType', doc.name)
            documentFormData.append('documentName', doc.name)
            documentFormData.append('tags', doc.category)
            documentFormData.append('metadata', doc.category)
            documentFormData.append('notes', 'Uploaded during structure setup')

            const documentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/documents`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`
              },
              body: documentFormData
            })

            if (!documentResponse.ok) {
              // Handle 401 Unauthorized - session expired or invalid
              if (documentResponse.status === 401) {
                try {
                  const errorData = await documentResponse.json()
                  if (errorData.error === "Invalid or expired token") {
                    console.log('[Documents] 401 Unauthorized - clearing session and redirecting to login')
                    logout()
                    router.push('/sign-in')
                    return
                  }
                } catch (e) {
                  console.log('Error: ', e)
                }
              }
              console.error(`Failed to upload document: ${doc.name}`)
              toast.warning(`Failed to upload document: ${doc.name}. Structure created successfully, but document upload failed.`)
            } else {
              console.log(`[Documents] Successfully uploaded: ${doc.name}`)
            }
          } catch (error) {
            console.error(`Error uploading document ${doc.name}:`, error)
            toast.warning(`Error uploading document: ${doc.name}. Structure created successfully, but document upload failed.`)
          }
        }
      }

      // Success - redirect or show success message
      toast.success('Structure setup completed successfully!')
      setIsSubmitting(false)

      // Redirect to the edit page of the newly created structure
      setTimeout(() => {
        window.location.href = `/investment-manager/structures/${structureId}/edit`
      }, 2000)

    } catch (error) {
      console.error('Error completing setup:', error)
      setIsSubmitting(false)
      toast.error('Failed to complete setup. Please try again.')
    }
  }

  // V3.1: Investor Pre-Registration Functions

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    return emailRegex.test(email)
  }

  const downloadCSVTemplate = () => {
    const headers = [
      'investor_type',
      'first_name',
      'last_name',
      'entity_name',
      'entity_type',
      'contact_first_name',
      'contact_last_name',
      'email',
      'tax_id',
      'hierarchy_level',
      'management_fee',
      'performance_fee',
      'hurdle_rate',
      'preferred_return'
    ]

    const exampleRows = [
      'individual,John,Smith,,,,,john.smith@example.com,,1,,,',
      'institution,,,ABC Investment LLC,LLC,Jane,Doe,jane.doe@abcinvest.com,12-3456789,1,,,',
      'fund-of-funds,,,XYZ Fund of Funds,Partnership,Michael,Johnson,michael@xyzfund.com,,1,,,',
      'family-office,,,Smith Family Office,Trust,Sarah,Williams,sarah@smithfamily.com,98-7654321,1,,,'
    ]

    const csvContent = headers.join(',') + '\n' + exampleRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'investor_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const parseCSV = (file: File): Promise<InvestorPreRegistration[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())

        if (lines.length === 0) {
          reject(new Error('CSV file is empty'))
          return
        }

        const header = lines[0].split(',').map(h => h.trim())
        const requiredFields = ['investor_type', 'email']
        const missingFields = requiredFields.filter(f => !header.includes(f))

        if (missingFields.length > 0) {
          reject(new Error(`Missing required fields: ${missingFields.join(', ')}`))
          return
        }

        const investors: InvestorPreRegistration[] = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const values = line.split(',').map(v => v.trim())
          const row: any = {}

          header.forEach((field, index) => {
            row[field] = values[index] || ''
          })

          if (!row.email) {
            continue
          }

          if (!isValidEmail(row.email)) {
            continue
          }

          // Determine investor type
          const investorType = row.investor_type?.toLowerCase() || 'individual'
          const isEntity = investorType !== 'individual'

          // Map CSV investor type to our enum
          let mappedInvestorType: 'individual' | 'institution' | 'fund-of-funds' | 'family-office'
          switch (investorType) {
            case 'institution':
              mappedInvestorType = 'institution'
              break
            case 'fund-of-funds':
            case 'fund of funds':
              mappedInvestorType = 'fund-of-funds'
              break
            case 'family-office':
            case 'family office':
              mappedInvestorType = 'family-office'
              break
            default:
              mappedInvestorType = 'individual'
          }

          // Validate required fields based on investor type
          if (!isEntity) {
            // Individual investor: requires first_name, last_name
            if (!row.first_name || !row.last_name) {
              console.warn(`Skipping individual investor at line ${i + 1}: missing first_name or last_name`)
              continue
            }
          } else {
            // Entity investor: requires entity_name, contact_first_name, contact_last_name
            if (!row.entity_name || !row.contact_first_name || !row.contact_last_name) {
              console.warn(`Skipping entity investor at line ${i + 1}: missing entity_name or contact names`)
              continue
            }
          }

          const investor: any = {
            investorType: mappedInvestorType as any,
            email: row.email.toLowerCase(),
            source: 'csv',
            addedAt: new Date(),
            firstName: row.first_name,
            lastName: row.last_name
          }

          // Add type-specific fields
          if (isEntity) {
            // Entity investor fields
            investor.entityName = row.entity_name
            investor.entityType = row.entity_type || undefined
            investor.contactFirstName = row.contact_first_name
            investor.contactLastName = row.contact_last_name
            investor.taxId = row.tax_id || undefined
          } else {
            // Individual investor fields - already set above
            investor.taxId = row.tax_id || undefined
          }

          // Parse hierarchy level (validate it's a positive number)
          if (row.hierarchy_level) {
            const level = parseInt(row.hierarchy_level)
            if (!isNaN(level) && level > 0) {
              investor.hierarchyLevel = level
            }
          }

          const hasCustomTerms = row.management_fee || row.performance_fee ||
                                row.hurdle_rate || row.preferred_return

          if (hasCustomTerms) {
            investor.customTerms = {
              managementFee: row.management_fee ? parseFloat(row.management_fee) : undefined,
              performanceFee: row.performance_fee ? parseFloat(row.performance_fee) : undefined,
              hurdleRate: row.hurdle_rate ? parseFloat(row.hurdle_rate) : undefined,
              preferredReturn: row.preferred_return ? parseFloat(row.preferred_return) : undefined
            }
          }

          investors.push(investor)
        }

        resolve(investors)
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      const investors = await parseCSV(file)

      if (investors.length === 0) {
        toast.error('No valid investors found in CSV')
        return
      }

      const existingEmails = formData.preRegisteredInvestors.map(inv => inv.email)
      const newInvestors = investors.filter(inv => !existingEmails.includes(inv.email))
      const duplicates = investors.length - newInvestors.length

      setFormData(prev => ({
        ...prev,
        preRegisteredInvestors: [...prev.preRegisteredInvestors, ...newInvestors]
      }))

      toast.success(`Success! ${newInvestors.length} investors added${duplicates > 0 ? ` (${duplicates} duplicates skipped)` : ''}`)
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to parse CSV'}`)
    }

    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = ''
    }
  }

  const handleAddInvestor = (investor: Omit<InvestorPreRegistration, 'addedAt' | 'source'>) => {
    const existingInvestor = formData.preRegisteredInvestors.find(
      inv => inv.email.toLowerCase() === investor.email.toLowerCase()
    )

    if (existingInvestor && !editingInvestor) {
      toast.error('An investor with this email already exists')
      return
    }

    if (editingInvestor) {
      setFormData(prev => ({
        ...prev,
        preRegisteredInvestors: prev.preRegisteredInvestors.map(inv =>
          inv.email === editingInvestor.email
            ? { ...investor, source: inv.source, addedAt: inv.addedAt }
            : inv
        )
      }))
      setEditingInvestor(null)
    } else {
      setFormData(prev => ({
        ...prev,
        preRegisteredInvestors: [
          ...prev.preRegisteredInvestors,
          { ...investor, source: 'manual', addedAt: new Date() }
        ]
      }))
    }

    setShowInvestorForm(false)
  }

  const handleEditInvestor = (investor: InvestorPreRegistration) => {
    setEditingInvestor(investor)
    setShowInvestorForm(true)
  }

  const handleRemoveInvestor = (email: string) => {
    setInvestorToRemove(email)
    setRemoveInvestorDialogOpen(true)
  }

  const confirmRemoveInvestor = () => {
    if (investorToRemove) {
      setFormData(prev => ({
        ...prev,
        preRegisteredInvestors: prev.preRegisteredInvestors.filter(inv => inv.email !== investorToRemove)
      }))
      toast.success('Investor removed successfully')
      setRemoveInvestorDialogOpen(false)
      setInvestorToRemove(null)
    }
  }

  const handleClearAllInvestors = () => {
    setClearAllInvestorsDialogOpen(true)
  }

  const confirmClearAllInvestors = () => {
    setFormData(prev => ({
      ...prev,
      preRegisteredInvestors: []
    }))
    toast.success('All investors removed successfully')
    setClearAllInvestorsDialogOpen(false)
  }

  const exportInvestorsCSV = () => {
    const headers = [
      'investor_type',
      'first_name',
      'last_name',
      'entity_name',
      'entity_type',
      'contact_first_name',
      'contact_last_name',
      'email',
      'tax_id',
      'hierarchy_level',
      'management_fee',
      'performance_fee',
      'hurdle_rate',
      'preferred_return',
      'source'
    ]
    const rows = formData.preRegisteredInvestors.map((inv: any) => [
      inv.investorType || 'individual',
      inv.firstName || '',
      inv.lastName || '',
      inv.entityName || '',
      inv.entityType || '',
      inv.contactFirstName || '',
      inv.contactLastName || '',
      inv.email,
      inv.taxId || '',
      inv.hierarchyLevel || '',
      inv.customTerms?.managementFee ?? '',
      inv.customTerms?.performanceFee ?? '',
      inv.customTerms?.hurdleRate ?? '',
      inv.customTerms?.preferredReturn ?? '',
      inv.source
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `investors_${formData.structureName.replace(/\s+/g, '_')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // V3: SUCCESS PAGE with comprehensive summary
  if (setupComplete || inReviewMode) {
    const isReviewing = inReviewMode && !setupComplete
    return (
      <div className={`min-h-screen bg-gradient-to-br py-12 px-4 sm:px-6 lg:px-8 ${isReviewing ? 'from-blue-50 to-indigo-50' : 'from-green-50 to-blue-50'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isReviewing ? 'bg-blue-100' : 'bg-green-100'}`}>
              <CheckCircle2 className={`w-10 h-10 ${isReviewing ? 'text-blue-600' : 'text-green-600'}`} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{isReviewing ? 'Review Your Setup' : 'Setup Complete!'}</h1>
            <p className="text-lg text-gray-600">
              {isReviewing ? 'Please review your investment structure configuration below. Once confirmed, it cannot be modified.' : 'Your investment structure is ready to accept investors'}
            </p>
          </div>

          {/* Comprehensive Summary Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Structure Configuration Summary</CardTitle>
              <CardDescription>
                Review your complete setup details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Structure Details */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Structure Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Structure Name:</span>
                    <p className="font-medium">{formData.structureName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Structure Type:</span>
                    <p className="font-medium">{selectedStructure?.label}</p>
                  </div>
                  {formData.structureSubtype && (
                    <div>
                      <span className="text-gray-500">Subtype:</span>
                      <p className="font-medium">
                        {availableSubtypes.find(s => s.value === formData.structureSubtype)?.label}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Jurisdiction:</span>
                    <p className="font-medium">{formData.jurisdiction}</p>
                  </div>
                  {['fund', 'sa', 'fideicomiso'].includes(formData.structureType) && formData.jurisdiction === 'United States' && formData.usState && (
                    <div>
                      <span className="text-gray-500">US State:</span>
                      <p className="font-medium">
                        {formData.usState === 'Other' ? formData.usStateOther : formData.usState}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Inception Date:</span>
                    <p className="font-medium">
                      {formData.inceptionDate ? format(formData.inceptionDate, "PPP") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Stage:</span>
                    <p className="font-medium capitalize">{formData.currentStage}</p>
                  </div>
                  {formData.structureType === 'fund' && (
                    <>
                      <div>
                        <span className="text-gray-500">Fund Term:</span>
                        <p className="font-medium">{formData.fundTerm} years</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Fund Type:</span>
                        <p className="font-medium capitalize">{formData.fundType}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Token Configuration */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Token Configuration</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Token Name:</span>
                    <p className="font-medium">{formData.tokenName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Token Symbol:</span>
                    <p className="font-medium">{formData.tokenSymbol}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Token Value:</span>
                    <p className="font-medium">{formData.currency} {formData.tokenValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Tokens:</span>
                    <p className="font-medium">
                      {formData.totalCapitalCommitment ?
                        Math.ceil(parseFloat(formData.totalCapitalCommitment) / formData.tokenValue).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Min Tokens Per Investor:</span>
                    <p className="font-medium">{formData.minTokensPerInvestor.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Tokens Per Investor:</span>
                    <p className="font-medium">{formData.maxTokensPerInvestor.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Capital & Investor Details */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Capital & Investors</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Capital Commitment:</span>
                    <p className="font-medium">
                      {formData.currency} {formData.totalCapitalCommitment && !isNaN(parseFloat(formData.totalCapitalCommitment))
                        ? parseFloat(formData.totalCapitalCommitment).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Investors:</span>
                    <p className="font-medium">{formData.totalInvestors || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Minimum Check Size:</span>
                    <p className="font-medium">
                      {formData.currency} {formData.minCheckSize && !isNaN(parseFloat(formData.minCheckSize))
                        ? parseFloat(formData.minCheckSize).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Maximum Check Size:</span>
                    <p className="font-medium">
                      {formData.currency} {formData.maxCheckSize && !isNaN(parseFloat(formData.maxCheckSize))
                        ? parseFloat(formData.maxCheckSize).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Financing Strategy:</span>
                    <p className="font-medium capitalize">{formData.financingStrategy}</p>
                  </div>
                  {formData.financingStrategy === 'equity' && formData.equitySubtype && (
                    <div>
                      <span className="text-gray-500">Equity Subtype:</span>
                      <p className="font-medium">{formData.equitySubtype}</p>
                    </div>
                  )}
                  {formData.financingStrategy === 'debt' && formData.debtSubtype && (
                    <div>
                      <span className="text-gray-500">Debt Subtype:</span>
                      <p className="font-medium">{formData.debtSubtype}</p>
                    </div>
                  )}
                  {formData.financingStrategy === 'mixed' && (
                    <>
                      {formData.equitySubtype && (
                        <div>
                          <span className="text-gray-500">Equity Subtype:</span>
                          <p className="font-medium">{formData.equitySubtype}</p>
                        </div>
                      )}
                      {formData.debtSubtype && (
                        <div>
                          <span className="text-gray-500">Debt Subtype:</span>
                          <p className="font-medium">{formData.debtSubtype}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <span className="text-gray-500">Total Issuances:</span>
                    <p className="font-medium">{calculatedIssuances}</p>
                  </div>
                </div>

                {/* Pre-Registered Investors */}
                {formData.preRegisteredInvestors.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold mb-3 text-gray-700">Pre-Registered Investors ({formData.preRegisteredInvestors.length})</h4>
                    <div className="space-y-2">
                      {formData.preRegisteredInvestors.map((investor, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                          <div>
                            <p className="font-medium">
                              {investor.investorType?.toLowerCase() === 'individual'
                                ? `${investor.firstName} ${investor.lastName}`
                                : (investor as any).entityName}
                            </p>
                            <p className="text-xs text-gray-500">{investor.email}</p>
                          </div>
                          <Badge variant={investor.customTerms ? 'default' : 'secondary'} className="text-xs">
                            {investor.customTerms ? 'Custom Terms' : 'Standard Terms'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Economic Terms */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold">Economic Terms</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Distribution Model:</span>
                    <p className="font-medium">
                      {formData.distributionModel === 'waterfall' && 'Waterfall Distribution'}
                      {formData.distributionModel === 'simple' && 'Simple Pro-Rata'}
                      {formData.distributionModel === 'interest-only' && 'Interest Payment'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Terms Application:</span>
                    <p className="font-medium">
                      {formData.economicTermsApplication === 'all-investors'
                        ? 'All investors equally'
                        : 'Per investor type'}
                    </p>
                  </div>
                  {formData.distributionModel === 'waterfall' && (
                    <>
                      <div>
                        <span className="text-gray-500">Management Fee:</span>
                        <p className="font-medium">{formData.managementFee}% annually</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Performance Fee:</span>
                        <p className="font-medium">{formData.performanceFee}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Hurdle Rate:</span>
                        <p className="font-medium">{formData.hurdleRate}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Preferred Return:</span>
                        <p className="font-medium">{formData.preferredReturn}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Waterfall Structure:</span>
                        <p className="font-medium capitalize">{formData.waterfallStructure}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Distribution & Tax Settings */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Distribution & Tax Settings</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Distribution Frequency:</span>
                    <p className="font-medium capitalize">{formData.distributionFrequency}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Same Tax Treatment:</span>
                    <p className="font-medium">{formData.sameTaxTreatment ? 'Yes' : 'No'}</p>
                  </div>

                  {formData.sameTaxTreatment ? (
                    formData.structureType === 'private-debt' ? (
                      <>
                        <div>
                          <span className="text-gray-500">VAT Rate:</span>
                          <p className="font-medium">{formData.vatRate}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Income Tax:</span>
                          <p className="font-medium">{formData.incomeDebtTaxRate}%</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-gray-500">Withholding / Dividend Tax:</span>
                          <p className="font-medium">{formData.witholdingDividendTaxRate}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Income Tax:</span>
                          <p className="font-medium">{formData.incomeEquityTaxRate}%</p>
                        </div>
                      </>
                    )
                  ) : (
                    formData.structureType === 'private-debt' ? (
                      <>
                        <div>
                          <span className="text-gray-500">VAT Rate (Natural Persons):</span>
                          <p className="font-medium">{formData.vatRateNaturalPersons}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Income Tax (Natural Persons):</span>
                          <p className="font-medium">{formData.incomeDebtTaxRateNaturalPersons}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">VAT Rate (Legal Entities):</span>
                          <p className="font-medium">{formData.vatRateLegalEntities}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Income Tax (Legal Entities):</span>
                          <p className="font-medium">{formData.incomeDebtTaxRateLegalEntities}%</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-gray-500">Withholding / Dividend Tax (Natural Persons):</span>
                          <p className="font-medium">{formData.witholdingDividendTaxRateNaturalPersons}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Income Tax (Natural Persons):</span>
                          <p className="font-medium">{formData.incomeEquityTaxRateNaturalPersons}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Withholding / Dividend Tax (Legal Entities):</span>
                          <p className="font-medium">{formData.witholdingDividendTaxRateLegalEntities}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Income Tax (Legal Entities):</span>
                          <p className="font-medium">{formData.incomeEquityTaxRateLegalEntities}%</p>
                        </div>
                      </>
                    )
                  )}

                  {formData.structureType === 'private-debt' && (formData.debtInterestRate || formData.debtGrossInterestRate) && (
                    <>
                      {formData.debtInterestRate && (
                        <div>
                          <span className="text-gray-500">Debt Interest Rate:</span>
                          <p className="font-medium">{formData.debtInterestRate}%</p>
                        </div>
                      )}
                      {formData.debtGrossInterestRate && (
                        <div>
                          <span className="text-gray-500">Debt Gross Interest Rate:</span>
                          <p className="font-medium">{formData.debtGrossInterestRate}%</p>
                        </div>
                      )}
                    </>
                  )}

                  {formData.enableCapitalCalls && formData.capitalCalls.length > 0 && (
                    <div className="col-span-2 pt-2 border-t">
                      <h4 className="font-semibold text-sm mb-3">Capital Calls Schedule</h4>
                      <div className="space-y-2">
                        {formData.capitalCalls.map((call, idx) => (
                          <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>Capital Call {idx + 1}:</span>
                            <span className="font-medium">
                              {call.date} - {call.callPercentage}%
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold bg-primary/10 p-2 rounded mt-2">
                          <span>Total:</span>
                          <span>{formData.capitalCalls.reduce((sum, c) => sum + (c.callPercentage || 0), 0)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* V5: Performance Methodology Display */}
              {formData.performanceMethodology && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold">ILPA Performance Reporting</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Calculation Level:</span>
                        <p className="font-medium">
                          {formData.calculationLevel === 'fund-level' ? 'Fund-Level (Fund-to-Investor)' : 'Portfolio-Level (Fund-to-Investment)'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Methodology:</span>
                        <p className="font-medium">
                          {formData.performanceMethodology === 'granular' ? 'Granular (Detailed Tracking)' : 'Gross Up (Simplified)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Documentation */}
              {(formData.uploadedFundDocuments.length > 0 || formData.uploadedInvestorDocuments.length > 0) && (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Upload className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold">Documentation</h3>
                    </div>

                    {/* Offering-Related Documents */}
                    {formData.uploadedFundDocuments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-gray-700">Offering-Related Documents ({formData.uploadedFundDocuments.length})</h4>
                        <div className="space-y-1">
                          {formData.uploadedFundDocuments.map((doc, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-primary/5 rounded text-sm">
                              <Upload className="w-4 h-4 text-primary" />
                              <span className="flex-1">{doc.name}</span>
                              <span className="text-xs text-gray-500">{format(doc.addedAt, 'MMM d, yyyy')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Investor Documents */}
                    {formData.uploadedInvestorDocuments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-gray-700">Investor Documents ({formData.uploadedInvestorDocuments.length})</h4>
                        <div className="space-y-1">
                          {formData.uploadedInvestorDocuments.map((doc, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                              <Upload className="w-4 h-4 text-green-600" />
                              <span className="flex-1">{doc.name}</span>
                              <span className="text-xs text-gray-500">{format(doc.addedAt, 'MMM d, yyyy')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />
                </>
              )}

            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardFooter className="flex gap-3 pt-6">
              {isReviewing ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="lg"
                    onClick={() => setInReviewMode(false)}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={() => setShowCompleteConfirmation(true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Setup'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {visibilitySettings?.setupCompleteButtons['check-structure'] && (
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={() => router.push(`/investment-manager/structures/${createdStructureId}/edit`)}
                    >
                      Edit Offering
                    </Button>
                  )}
                  {visibilitySettings?.setupCompleteButtons['invite-investors'] && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="lg"
                      onClick={() => router.push('/investment-manager/investors')}
                    >
                      Invite Investors
                    </Button>
                  )}
                </>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Complete Setup Confirmation Dialog */}
        <AlertDialog open={showCompleteConfirmation} onOpenChange={setShowCompleteConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Setup?</AlertDialogTitle>
              <AlertDialogDescription>
                Once the setup is complete, <span className="font-semibold text-red-600">no modifications can be made</span> to this structure configuration. Please ensure all details are correct before confirming.
                <br /><br />
                <span className="font-semibold text-red-600">Check wallet POL tokens, you should have at least 3 tokens for minting contract.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCompleteSetupConfirmation} className="bg-primary">
                Complete Setup
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t.onboarding.title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t.onboarding.subtitle}
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {t.onboarding.step} {currentStep} {t.onboarding.of} {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% {t.onboarding.complete}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>


        {validationErrors.length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-900">Please fix the following errors:</AlertTitle>
            <AlertDescription className="text-red-700">
              <ul className="list-disc list-inside space-y-1 mt-2">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && t.onboarding.selectStructureType}
              {currentStep === 2 && 'Basic Information'}
              {currentStep === 3 && 'Capital Structure & Issuances'}
              {currentStep === 4 && 'Payment Configurations'}
              {currentStep === 5 && 'Capital Calls Configuration'}
              {currentStep === 6 && 'Economic Terms'}
              {currentStep === 7 && 'Distribution & Tax Settings'}
              {currentStep === 8 && 'Document Upload'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && t.onboarding.selectStructureSubtitle}
              {currentStep === 2 && 'Provide essential information about your structure'}
              {currentStep === 3 && 'Define capital requirements, financing strategy, and investor parameters'}
              {currentStep === 4 && 'Configure payment methods for investor contributions'}
              {currentStep === 5 && 'Set up capital call schedule and payment requirements'}
              {currentStep === 6 && 'Set up fee structures and distribution terms'}
              {currentStep === 7 && 'Configure distribution schedule and tax settings'}
              {currentStep === 8 && 'Upload fund and investor documents'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* STEP 1: Structure Type Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">{t.onboarding.primaryStructureType} *</Label>
                  <RadioGroup
                    value={formData.structureType}
                    onValueChange={(value) => {
                      updateFormData('structureType', value)
                      updateFormData('structureSubtype', '')
                    }}
                  >
                    {Object.entries(translatedStructureTypes).filter(([key]) => key !== 'private-debt').map(([key, structure]) => (
                      <div
                        key={key}
                        className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          updateFormData('structureType', key)
                          updateFormData('structureSubtype', '')
                        }}
                      >
                        <RadioGroupItem value={key} id={key} />
                        <div className="flex-1">
                          <Label htmlFor={key} className="cursor-pointer font-medium">
                            {structure.label}
                          </Label>
                          <p className="text-sm text-gray-500 mt-1">
                            {structure.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {formData.structureType && availableSubtypes.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">Structure Subtype *</Label>
                    <RadioGroup
                      value={formData.structureSubtype}
                      onValueChange={(value) => updateFormData('structureSubtype', value)}
                    >
                      {availableSubtypes.map((subtype) => (
                        <div
                          key={subtype.value}
                          className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => updateFormData('structureSubtype', subtype.value)}
                        >
                          <RadioGroupItem value={subtype.value} id={subtype.value} />
                          <div className="flex-1">
                            <Label htmlFor={subtype.value} className="cursor-pointer font-medium">
                              {subtype.label}
                            </Label>
                            <p className="text-sm text-gray-500 mt-1">
                              {subtype.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {/* Parent Structure Configuration */}
                {formData.structureType && (
                  <div className="space-y-4 pt-6 border-t">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="hasParentStructure"
                        checked={hasParentStructure}
                        onCheckedChange={(checked) => {
                          setHasParentStructure(checked as boolean)
                          if (!checked) {
                            updateFormData('parentStructureId', null)
                            updateFormData('parentStructureOwnershipPercentage', null)
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label htmlFor="hasParentStructure" className="cursor-pointer font-medium text-base">
                          This structure has a parent structure
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Check if this structure is part of a larger hierarchy with a parent structure
                        </p>
                      </div>
                    </div>

                    {hasParentStructure && (
                      <div className="space-y-4 pl-6 border-l-2 border-primary/30">
                        {/* Parent Structure Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="parentStructure" className="font-medium">
                            Select Parent Structure *
                          </Label>
                          <Select
                            value={formData.parentStructureId || ''}
                            onValueChange={(value) => updateFormData('parentStructureId', value || null)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a parent structure..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableParentStructures.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  No structures available
                                </SelectItem>
                              ) : (
                                availableParentStructures.map((structure) => (
                                  <SelectItem key={structure.id} value={structure.id}>
                                    {structure.name} ({structure.type})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Select the parent structure that this structure will be linked to
                          </p>
                        </div>

                        {/* Parent Structure Ownership Percentage */}
                        <div className="space-y-2">
                          <Label htmlFor="parentOwnershipPercentage" className="font-medium">
                            Parent Structure Ownership % *
                          </Label>
                          <Input
                            id="parentOwnershipPercentage"
                            type="text"
                            inputMode="decimal"
                            placeholder="e.g., 50 or 99.5"
                            value={formData.parentStructureOwnershipPercentage ?? ''}
                            onChange={(e) => {
                              let value = e.target.value.replace(',', '.');
                              // Allow empty, digits, and one decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                // Validate range if it's a complete number
                                if (value === '' || value === '.') {
                                  updateFormData('parentStructureOwnershipPercentage', value === '' ? null : value);
                                } else {
                                  const numValue = parseFloat(value);
                                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                                    updateFormData('parentStructureOwnershipPercentage', value.endsWith('.') ? value : numValue);
                                  } else if (value.endsWith('.') && numValue >= 0 && numValue <= 100) {
                                    updateFormData('parentStructureOwnershipPercentage', value);
                                  }
                                }
                              }
                            }}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            The percentage ownership that the parent structure has of this new structure (0-100%)
                          </p>
                        </div>

                        <Alert className="bg-blue-50 border-blue-200">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-xs text-blue-800">
                            <strong>Parent-Child Relationship:</strong> The parent structure owns {formData.parentStructureOwnershipPercentage || '0'}% of this structure. This relationship will be maintained for calculations and reporting.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                )}

                {/* Structure Banner Image */}
                <div className="space-y-4 pt-6 border-t">
                  <Label className="text-base font-semibold">Structure Banner Image *</Label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="bannerImage"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // Store the actual file object
                          updateFormData('bannerImage', file)

                          // Create preview for display
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string
                            updateFormData('bannerImagePreview', base64)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-white
                        hover:file:bg-primary/90"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a banner image (JPG, PNG) to be displayed in the structure summary. Recommended: 500x200px or wider
                    </p>
                  </div>
                  {formData.bannerImagePreview && (
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">Preview:</div>
                      <img
                        src={formData.bannerImagePreview}
                        alt="Banner preview"
                        className="max-w-full h-auto rounded-md border max-h-48"
                      />
                    </div>
                  )}
                </div>

                {/* Blockchain Owner Information */}
                <div className="space-y-4 pt-6 border-t">
                  <Label className="text-base font-semibold">Blockchain Owner Information *</Label>

                  {/* Use Platform Wallet Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="usePlatformWallet"
                      checked={usePlatformWallet}
                      onCheckedChange={(checked) => setUsePlatformWallet(checked as boolean)}
                    />
                    <Label
                      htmlFor="usePlatformWallet"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Use Platform Wallet
                    </Label>
                  </div>

                  {/* Conditional Display Based on Checkbox State */}
                  {usePlatformWallet ? (
                    // Platform Wallet Mode
                    userWalletAddress ? (
                      // User has wallet - show read-only
                      <div className="space-y-2">
                        <Label htmlFor="walletOwnerAddress">Wallet Owner Address (polygon address) *</Label>
                        <Input
                          id="walletOwnerAddress"
                          value={formData.walletOwnerAddress}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Using your platform wallet for blockchain operations
                        </p>
                      </div>
                    ) : (
                      // User doesn't have wallet - show alert
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Wallet Required</AlertTitle>
                        <AlertDescription>
                          You need to create a platform wallet first.{' '}
                          <a
                            href="/investment-manager/account"
                            className="text-primary hover:underline font-medium"
                          >
                            Create wallet now →
                          </a>
                        </AlertDescription>
                      </Alert>
                    )
                  ) : (
                    // Manual Wallet Mode
                    <div className="space-y-2">
                      <Label htmlFor="walletOwnerAddress">Wallet Owner Address (polygon address) *</Label>
                      <Input
                        id="walletOwnerAddress"
                        value={formData.walletOwnerAddress}
                        onChange={(e) => {
                          const address = e.target.value
                          updateFormData('walletOwnerAddress', address)
                        }}
                        placeholder="0x..."
                        required
                        className={
                          formData.walletOwnerAddress &&
                          !/^0x[a-fA-F0-9]{40}$/.test(formData.walletOwnerAddress)
                            ? 'border-red-500'
                            : ''
                        }
                      />
                      {formData.walletOwnerAddress &&
                        !/^0x[a-fA-F0-9]{40}$/.test(formData.walletOwnerAddress) && (
                          <p className="text-xs text-red-600">
                            Please enter a valid hexadecimal wallet address (0x followed by 40 hexadecimal characters)
                          </p>
                        )}
                      <p className="text-xs text-muted-foreground">
                        Enter the wallet owner address for blockchain operations
                      </p>
                    </div>
                  )}

                  {/* Manually Enter Hash Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="manuallyEnterHash"
                      checked={manuallyEnterHash}
                      onCheckedChange={(checked) => setManuallyEnterHash(checked as boolean)}
                    />
                    <Label
                      htmlFor="manuallyEnterHash"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Manually enter Operating Agreement Hash
                    </Label>
                  </div>

                  {/* Conditional Display Based on Checkbox State */}
                  {manuallyEnterHash ? (
                    // Manual Hash Entry Mode
                    <div className="space-y-2">
                      <Label htmlFor="operatingAgreementHash">Operating Agreement Hash *</Label>
                      <Input
                        id="operatingAgreementHash"
                        value={formData.operatingAgreementHash}
                        onChange={(e) => {
                          const hash = e.target.value
                          updateFormData('operatingAgreementHash', hash)
                        }}
                        placeholder="0x..."
                        required
                        className={
                          formData.operatingAgreementHash &&
                          !/^0x[a-fA-F0-9]+$/.test(formData.operatingAgreementHash)
                            ? 'border-red-500'
                            : ''
                        }
                      />
                      {formData.operatingAgreementHash &&
                        !/^0x[a-fA-F0-9]+$/.test(formData.operatingAgreementHash) && (
                          <p className="text-xs text-red-600">
                            Please enter a valid hexadecimal hash (0x followed by hexadecimal characters)
                          </p>
                        )}
                      <p className="text-xs text-muted-foreground">
                        Enter the operating agreement hash for document verification
                      </p>
                    </div>
                  ) : (
                    // Default Hash Mode
                    <div className="space-y-2">
                      <Label htmlFor="operatingAgreementHash">Operating Agreement Hash *</Label>
                      <Input
                        id="operatingAgreementHash"
                        value={formData.operatingAgreementHash}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Using default hash value for document verification
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Basic Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="structureName">
                    Structure Name *
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The legal name of your fund, trust, or entity</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="structureName"
                    placeholder="e.g., Polibit Real Estate Fund I"
                    value={formData.structureName}
                    onChange={(e) => updateFormData('structureName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                  <Select
                    value={formData.jurisdiction}
                    onValueChange={(value) => {
                      updateFormData('jurisdiction', value)
                      updateFormData('usState', '')
                      updateFormData('usStateOther', '')
                      const tax = TAX_JURISDICTIONS[value as keyof typeof TAX_JURISDICTIONS]
                      if (tax) {
                        updateFormData('defaultTaxRate', tax.taxRate.toString())
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRegions.map(region => {
                        const taxInfo = TAX_JURISDICTIONS[region as keyof typeof TAX_JURISDICTIONS]
                        return (
                          <SelectItem key={region} value={region}>
                            {taxInfo?.label || region}
                          </SelectItem>
                        )
                      })}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Other Jurisdiction - Text Input */}
                {formData.jurisdiction === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="jurisdictionOther">Enter Jurisdiction *</Label>
                    <Input
                      id="jurisdictionOther"
                      value={formData.jurisdictionOther}
                      onChange={(e) => updateFormData('jurisdictionOther', e.target.value)}
                      placeholder="e.g., Singapore, Dubai, etc."
                    />
                  </div>
                )}

                {/* US State Selection for United States jurisdiction (Fund, SA/LLC, Trust) */}
                {['fund', 'sa', 'fideicomiso'].includes(formData.structureType) && formData.jurisdiction === 'United States' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="usState">US State *</Label>
                      <Select
                        value={formData.usState}
                        onValueChange={(value) => {
                          updateFormData('usState', value)
                          if (value !== 'Other') {
                            updateFormData('usStateOther', '')
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Wyoming">Wyoming</SelectItem>
                          <SelectItem value="Delaware">Delaware</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.usState === 'Other' && (
                      <div className="space-y-2">
                        <Label htmlFor="usStateOther">Specify State *</Label>
                        <Input
                          id="usStateOther"
                          placeholder="Enter state name"
                          value={formData.usStateOther}
                          onChange={(e) => updateFormData('usStateOther', e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <Label>Inception Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.inceptionDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.inceptionDate ? format(formData.inceptionDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.inceptionDate}
                        onSelect={(date) => updateFormData('inceptionDate', date)}
                        captionLayout="dropdown"
                        fromYear={1990}
                        toYear={2030}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentStage">Current Stage</Label>
                  <Select
                    value={formData.currentStage}
                    onValueChange={(value) => updateFormData('currentStage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {visibilitySettings?.currentStageOptions.fundraising && (
                        <SelectItem value="fundraising">Fundraising</SelectItem>
                      )}
                      {visibilitySettings?.currentStageOptions.active && (
                        <SelectItem value="active">Active</SelectItem>
                      )}
                      {visibilitySettings?.currentStageOptions.closed && (
                        <SelectItem value="closed">Closed</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {formData.structureType === 'fund' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fundTerm">Fund Term (Years) *</Label>
                      <Input
                        id="fundTerm"
                        type="number"
                        placeholder="10"
                        value={formData.fundTerm}
                        onChange={(e) => updateFormData('fundTerm', e.target.value)}
                      />
                      <p className="text-sm text-gray-500">
                        Typical: 5-7 years for single-project, 10-15 years for multi-project
                      </p>
                    </div>

                    {/* Fund Type section commented out */}
                    {/* <div className="space-y-2">
                      <Label>Fund Type</Label>
                      <RadioGroup
                        value={formData.fundType}
                        onValueChange={(value) => updateFormData('fundType', value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="closed-end" id="closed-end" />
                          <Label htmlFor="closed-end">Closed-End</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="open-end" id="open-end" />
                          <Label htmlFor="open-end">Open-End</Label>
                        </div>
                      </RadioGroup>
                    </div> */}
                  </>
                )}
              </div>
            )}

            {/* STEP 3: Capital Structure & Issuances (V3 ENHANCED) */}
            {currentStep === 3 && (() => {
              // Calculate structure features based on type and subtype
              const features = getStructureFeatures(formData.structureType, (formData as any).subtype || formData.structureSubtype)

              return (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => updateFormData('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalCapitalCommitment">
                    Total Capital Commitment / Fund Size *
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total amount of capital the structure aims to raise</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      {formData.currency}
                    </span>
                    <Input
                      id="totalCapitalCommitment"
                      type="text"
                      placeholder="10,000,000"
                      className="rounded-l-none"
                      value={
                        focusedCurrencyField === 'totalCapitalCommitment'
                          ? formData.totalCapitalCommitment
                          : formData.totalCapitalCommitment
                          ? parseFloat(formData.totalCapitalCommitment).toLocaleString('en-US')
                          : ''
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, '')
                        if (rawValue === '' || !isNaN(parseFloat(rawValue))) {
                          updateFormData('totalCapitalCommitment', rawValue)
                        }
                      }}
                      onFocus={() => setFocusedCurrencyField('totalCapitalCommitment')}
                      onBlur={() => setFocusedCurrencyField(null)}
                    />
                  </div>
                </div>


                {/* Conditional: Show Investment & Financing Configuration for all except Private Debt */}
                {features.distributionType !== 'interest-only' && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-4">
                  <h4 className="font-medium text-sm text-primary">Investment & Financing Configuration</h4>

                  <div className="space-y-2">
                    <Label>What financing strategy will you use? *</Label>
                    <RadioGroup
                      value={formData.financingStrategy}
                      onValueChange={(value) => updateFormData('financingStrategy', value)}
                    >
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="equity" id="equity" />
                        <div>
                          <Label htmlFor="equity" className="cursor-pointer font-medium">Equity Only</Label>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="debt" id="debt" />
                        <div>
                          <Label htmlFor="debt" className="cursor-pointer font-medium">Debt Only</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Equity Subtype Selection */}
                  {formData.financingStrategy === 'equity' && (() => {
                    const { equityOptions } = getEquityAndDebtSubtypes(formData.structureType)
                    return equityOptions.length > 0 ? (
                      <div className="space-y-2">
                        <Label htmlFor="equitySubtype">
                          Type of Equity Instrument *
                        </Label>
                        <Select
                          value={formData.equitySubtype}
                          onValueChange={(value) => updateFormData('equitySubtype', value)}
                        >
                          <SelectTrigger id="equitySubtype">
                            <SelectValue placeholder="Select equity type" />
                          </SelectTrigger>
                          <SelectContent>
                            {equityOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null
                  })()}

                  {/* Debt Subtype Selection */}
                  {formData.financingStrategy === 'debt' && (() => {
                    const { debtOptions } = getEquityAndDebtSubtypes(formData.structureType)
                    return debtOptions.length > 0 ? (
                      <div className="space-y-2">
                        <Label htmlFor="debtSubtype">
                          Type of Debt Instrument *
                        </Label>
                        <Select
                          value={formData.debtSubtype}
                          onValueChange={(value) => updateFormData('debtSubtype', value)}
                        >
                          <SelectTrigger id="debtSubtype">
                            <SelectValue placeholder="Select debt type" />
                          </SelectTrigger>
                          <SelectContent>
                            {debtOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null
                  })()}

                </div>
                )}

                {/* Note for Private Debt structures - always 1 debt issuance */}
                {features.distributionType === 'interest-only' && (
                  <Alert className="border-primary/30 bg-white">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Debt Issuance Structure</AlertTitle>
                    <AlertDescription className="text-primary/80">
                      <p className="font-medium mb-2">Total Issuances: 1</p>
                      <p className="text-sm">
                        Private debt structures use a single debt issuance (promissory note structure with guarantor).
                        Returns are distributed as interest payments based on the debt terms you configure.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Total Number of Investors */}
                <div className="space-y-2">
                  <Label htmlFor="totalInvestors">
                    Total Number of Investors *
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Expected or current number of investors</p>
                          {currentTier && currentTier.maxInvestors !== Infinity && (
                            <p className="text-xs mt-1">
                              Your plan includes {currentTier.maxInvestors} investors.
                              Additional investors: ${currentTier.additionalInvestorCost}/month each
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="totalInvestors"
                    type="number"
                    placeholder="50"
                    value={formData.totalInvestors}
                    onChange={(e) => updateFormData('totalInvestors', e.target.value)}
                    required
                    min="1"
                  />
                  {currentTier && (() => {
                    const existingInvestorsCount = getInvestors().length
                    const newInvestorsCount = parseInt(formData.totalInvestors) || 0
                    const totalInvestors = existingInvestorsCount + newInvestorsCount
                    const overage = totalInvestors - currentTier.maxInvestors
                    return overage > 0 && currentTier.maxInvestors !== Infinity ? (
                      <p className="text-sm text-orange-600">
                        ⚠️ You'll have {overage} investors above your plan limit.
                        Additional cost: ${overage * currentTier.additionalInvestorCost}/month
                      </p>
                    ) : null
                  })()}
                </div>

                {/* Planned Investments */}
                <div className="space-y-2">
                  <Label htmlFor="plannedInvestments">
                    Planned Investments *
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of planned investments for this structure</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="plannedInvestments"
                    type="number"
                    placeholder="10"
                    value={formData.plannedInvestments}
                    onChange={(e) => updateFormData('plannedInvestments', e.target.value)}
                    required
                    min="1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minCheckSize">Minimum Ticket Size *</Label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs">
                        {formData.currency}
                      </span>
                      <Input
                        id="minCheckSize"
                        type="text"
                        placeholder="50,000"
                        className="rounded-l-none"
                        value={
                          focusedCurrencyField === 'minCheckSize'
                            ? formData.minCheckSize
                            : formData.minCheckSize
                            ? parseFloat(formData.minCheckSize).toLocaleString('en-US')
                            : ''
                        }
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/,/g, '')
                          if (rawValue === '' || !isNaN(parseFloat(rawValue))) {
                            updateFormData('minCheckSize', rawValue)
                          }
                        }}
                        onFocus={() => setFocusedCurrencyField('minCheckSize')}
                        onBlur={() => setFocusedCurrencyField(null)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxCheckSize">Maximum Ticket Size *</Label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs">
                        {formData.currency}
                      </span>
                      <Input
                        id="maxCheckSize"
                        type="text"
                        placeholder="150,000"
                        className="rounded-l-none"
                        value={
                          focusedCurrencyField === 'maxCheckSize'
                            ? formData.maxCheckSize
                            : formData.maxCheckSize
                            ? parseFloat(formData.maxCheckSize).toLocaleString('en-US')
                            : ''
                        }
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/,/g, '')
                          if (rawValue === '' || !isNaN(parseFloat(rawValue))) {
                            updateFormData('maxCheckSize', rawValue)
                          }
                        }}
                        onFocus={() => setFocusedCurrencyField('maxCheckSize')}
                        onBlur={() => setFocusedCurrencyField(null)}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-600">Must be a multiple of the minimum ticket size</p>
                  </div>
                </div>

                {/* Token Economics Validation */}
                {(() => {
                  const totalCommitment = parseFloat(formData.totalCapitalCommitment) || 0
                  const minCheck = parseFloat(formData.minCheckSize) || 0
                  const maxCheck = parseFloat(formData.maxCheckSize) || 0

                  // Check both validations
                  const calculatedTokens = totalCommitment / minCheck
                  const isTokensInteger = Number.isInteger(calculatedTokens)
                  const isMaxMultipleOfMin = minCheck > 0 && maxCheck > 0 ? maxCheck % minCheck === 0 : true

                  const hasErrors = (totalCommitment > 0 && minCheck > 0 && !isTokensInteger) ||
                                   (minCheck > 0 && maxCheck > 0 && !isMaxMultipleOfMin)
                  const showValidation = totalCommitment > 0 && minCheck > 0

                  if (!showValidation) return null

                  if (hasErrors) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-red-800">Invalid Ticket Configuration</h3>

                            {!isTokensInteger && (
                              <>
                                <p className="text-sm text-red-700 mt-2">
                                  <strong>Issue 1:</strong> Total commitment ({formData.currency} {totalCommitment.toLocaleString()}) must be evenly divisible by minimum ticket size ({formData.currency} {minCheck.toLocaleString()}).
                                </p>
                                <p className="text-sm text-red-700 mt-1">
                                  Current calculation: {totalCommitment.toLocaleString()} ÷ {minCheck.toLocaleString()} = <strong>{calculatedTokens.toFixed(2)} tickets</strong> (must be a whole number)
                                </p>
                              </>
                            )}

                            {!isMaxMultipleOfMin && maxCheck > 0 && (
                              <p className="text-sm text-red-700 mt-2">
                                <strong>Issue {!isTokensInteger ? '2' : '1'}:</strong> Maximum ticket size ({formData.currency} {maxCheck.toLocaleString()}) must be a multiple of minimum ticket size ({formData.currency} {minCheck.toLocaleString()}).
                              </p>
                            )}

                            <p className="text-sm font-semibold text-red-800 mt-3">
                              Please adjust your ticket sizes to resolve {(!isTokensInteger && !isMaxMultipleOfMin) ? 'these issues' : 'this issue'}.
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-green-800">Ticket Configuration Valid</h3>
                            <p className="text-sm text-green-700 mt-1">
                              Your structure will have <strong>{calculatedTokens.toLocaleString()} tickets</strong> at {formData.currency} {minCheck.toLocaleString()} each.
                            </p>
                            {maxCheck > 0 && (
                              <p className="text-sm text-green-700 mt-1">
                                Maximum investment: <strong>{Math.floor(maxCheck / minCheck)} tickets</strong> ({formData.currency} {maxCheck.toLocaleString()})
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }
                })()}

                {/* Token Name and Symbol */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tokenName">Ticket Name *</Label>
                    <Input
                      id="tokenName"
                      type="text"
                      placeholder="e.g., Alpha Fund Tickets"
                      value={formData.tokenName}
                      onChange={(e) => updateFormData('tokenName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tokenSymbol">Ticket Symbol *</Label>
                    <Input
                      id="tokenSymbol"
                      type="text"
                      placeholder="e.g., ALPHA"
                      value={formData.tokenSymbol}
                      onChange={(e) => updateFormData('tokenSymbol', e.target.value.toUpperCase())}
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
              </div>
              )
            })()}

            {/* STEP 4: Payment Configurations */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Local Bank Transfer */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="paymentLocalBank"
                      checked={formData.paymentLocalBankEnabled}
                      onCheckedChange={(checked) => updateFormData('paymentLocalBankEnabled', checked)}
                    />
                    <Label htmlFor="paymentLocalBank" className="cursor-pointer font-medium">
                      Local Bank Transfer
                    </Label>
                  </div>

                  {formData.paymentLocalBankEnabled && (
                    <div className="ml-7 p-4 bg-gray-50 rounded-lg space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentLocalBankName">Bank Name *</Label>
                          <Input
                            id="paymentLocalBankName"
                            value={formData.paymentLocalBankName}
                            onChange={(e) => updateFormData('paymentLocalBankName', e.target.value)}
                            placeholder="Enter bank name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentLocalAccountNumber">Account Number *</Label>
                          <Input
                            id="paymentLocalAccountNumber"
                            value={formData.paymentLocalAccountNumber}
                            onChange={(e) => updateFormData('paymentLocalAccountNumber', e.target.value)}
                            placeholder="Enter account number"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentLocalRoutingNumber">Routing / ABA Number</Label>
                          <Input
                            id="paymentLocalRoutingNumber"
                            value={formData.paymentLocalRoutingNumber}
                            onChange={(e) => updateFormData('paymentLocalRoutingNumber', e.target.value)}
                            placeholder="Enter routing number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentLocalAccountHolder">Account Holder Name *</Label>
                          <Input
                            id="paymentLocalAccountHolder"
                            value={formData.paymentLocalAccountHolder}
                            onChange={(e) => updateFormData('paymentLocalAccountHolder', e.target.value)}
                            placeholder="Enter account holder name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentLocalBankAddress">Bank Address</Label>
                        <Input
                          id="paymentLocalBankAddress"
                          value={formData.paymentLocalBankAddress}
                          onChange={(e) => updateFormData('paymentLocalBankAddress', e.target.value)}
                          placeholder="Enter bank address"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* International Bank Transfer */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="paymentIntlBank"
                      checked={formData.paymentIntlBankEnabled}
                      onCheckedChange={(checked) => updateFormData('paymentIntlBankEnabled', checked)}
                    />
                    <Label htmlFor="paymentIntlBank" className="cursor-pointer font-medium">
                      International Bank Transfer
                    </Label>
                  </div>

                  {formData.paymentIntlBankEnabled && (
                    <div className="ml-7 p-4 bg-gray-50 rounded-lg space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentIntlBankName">Bank Name *</Label>
                          <Input
                            id="paymentIntlBankName"
                            value={formData.paymentIntlBankName}
                            onChange={(e) => updateFormData('paymentIntlBankName', e.target.value)}
                            placeholder="Enter bank name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentIntlAccountNumber">Account Number / IBAN *</Label>
                          <Input
                            id="paymentIntlAccountNumber"
                            value={formData.paymentIntlAccountNumber}
                            onChange={(e) => updateFormData('paymentIntlAccountNumber', e.target.value)}
                            placeholder="Enter account number or IBAN"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentIntlSwiftCode">SWIFT / BIC Code *</Label>
                          <Input
                            id="paymentIntlSwiftCode"
                            value={formData.paymentIntlSwiftCode}
                            onChange={(e) => updateFormData('paymentIntlSwiftCode', e.target.value)}
                            placeholder="Enter SWIFT/BIC code"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentIntlAccountHolder">Account Holder Name *</Label>
                          <Input
                            id="paymentIntlAccountHolder"
                            value={formData.paymentIntlAccountHolder}
                            onChange={(e) => updateFormData('paymentIntlAccountHolder', e.target.value)}
                            placeholder="Enter account holder name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentIntlBankAddress">Bank Address</Label>
                        <Input
                          id="paymentIntlBankAddress"
                          value={formData.paymentIntlBankAddress}
                          onChange={(e) => updateFormData('paymentIntlBankAddress', e.target.value)}
                          placeholder="Enter bank address"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Crypto Payments */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="paymentCrypto"
                      checked={formData.paymentCryptoEnabled}
                      onCheckedChange={(checked) => updateFormData('paymentCryptoEnabled', checked)}
                    />
                    <Label htmlFor="paymentCrypto" className="cursor-pointer font-medium">
                      Payments with Stablecoins
                    </Label>
                  </div>

                  {formData.paymentCryptoEnabled && (
                    <div className="ml-7 p-4 bg-gray-50 rounded-lg space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentCryptoCoin">Coin</Label>
                          <Input
                            id="paymentCryptoCoin"
                            value="USDC"
                            disabled
                            className="bg-gray-100 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500">Only USDC is supported at this time</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentCryptoBlockchain">Blockchain *</Label>
                          <Select
                            value={formData.paymentCryptoBlockchain}
                            onValueChange={(value) => updateFormData('paymentCryptoBlockchain', value)}
                          >
                            <SelectTrigger id="paymentCryptoBlockchain">
                              <SelectValue placeholder="Select blockchain" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Polygon">Polygon</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentCryptoWallet">Destination Wallet Address *</Label>
                        <Input
                          id="paymentCryptoWallet"
                          value={formData.paymentCryptoWalletAddress}
                          disabled
                          className="bg-gray-100 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500">Using the wallet address from Step 1</p>
                      </div>
                    </div>
                  )}
                </div>

                {!formData.paymentLocalBankEnabled &&
                  !formData.paymentIntlBankEnabled &&
                  !formData.paymentCryptoEnabled && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-700 text-sm">
                        Please select at least one payment method to continue
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
            )}

            {/* STEP 5: Capital Calls Configuration */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Capital calls configuration</h3>

                <div className="flex items-center gap-3">
                  <input
                    id="enableCapitalCalls"
                    type="checkbox"
                    checked={formData.enableCapitalCalls}
                    onChange={(e) => updateFormData('enableCapitalCalls', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <Label htmlFor="enableCapitalCalls" className="cursor-pointer font-medium">
                    Capital Calls
                  </Label>
                </div>

                {formData.enableCapitalCalls && (
                  <div className="p-4 bg-green-50 rounded-lg space-y-4">
                    {/* Global Capital Call Settings */}
                    <div className="bg-white rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-sm text-gray-900">Capital Call Settings</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="capitalCallNoticePeriod">Notice Period (Days)</Label>
                          <Input
                            id="capitalCallNoticePeriod"
                            type="number"
                            min="1"
                            placeholder="e.g., 10"
                            value={formData.capitalCallNoticePeriod}
                            onChange={(e) => updateFormData('capitalCallNoticePeriod', e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Number of days notice before capital call is due
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="capitalCallPaymentDeadline">Payment Deadline (Days)</Label>
                          <Input
                            id="capitalCallPaymentDeadline"
                            type="number"
                            min="1"
                            placeholder="e.g., 30"
                            value={formData.capitalCallPaymentDeadline}
                            onChange={(e) => updateFormData('capitalCallPaymentDeadline', e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Number of days investors have to pay after notice
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm text-green-900">Capital Call Schedule</h4>
                        <p className="text-xs text-green-700 mt-1">
                          Define capital call schedule. Total must equal 100%.
                        </p>
                      </div>
                      {formData.capitalCalls.length < 4 && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const newCall = {
                              id: `call-${Date.now()}`,
                              date: '',
                              callPercentage: 0
                            }
                            updateFormData('capitalCalls', [...formData.capitalCalls, newCall])
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Call
                        </Button>
                      )}
                    </div>

                    {formData.capitalCalls.length === 0 ? (
                      <p className="text-xs text-green-700 italic">No capital calls added yet. Click "Add Call" to create one.</p>
                    ) : (
                      <div className="space-y-4">
                        {formData.capitalCalls.map((call, index) => (
                          <div key={call.id} className="bg-white rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-sm text-gray-900">Capital Call {index + 1}</h5>
                              {formData.capitalCalls.length > 1 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    updateFormData('capitalCalls', formData.capitalCalls.filter(c => c.id !== call.id))
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`call-date-${call.id}`}>Date</Label>
                                <Input
                                  id={`call-date-${call.id}`}
                                  type="date"
                                  value={call.date}
                                  onChange={(e) => {
                                    const updated = formData.capitalCalls.map(c =>
                                      c.id === call.id ? { ...c, date: e.target.value } : c
                                    )
                                    updateFormData('capitalCalls', updated)
                                  }}
                                  className="bg-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`call-percent-${call.id}`}>Call % (0-100)</Label>
                                <Input
                                  id={`call-percent-${call.id}`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={call.callPercentage}
                                  onChange={(e) => {
                                    const updated = formData.capitalCalls.map(c =>
                                      c.id === call.id ? { ...c, callPercentage: parseFloat(e.target.value) || 0 } : c
                                    )
                                    updateFormData('capitalCalls', updated)
                                  }}
                                  className="bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900">Total Call %:</span>
                            <span className={`font-bold text-sm ${formData.capitalCalls.reduce((sum, c) => sum + (c.callPercentage || 0), 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                              {formData.capitalCalls.reduce((sum, c) => sum + (c.callPercentage || 0), 0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900">Reporting configuration</h3>

                  <div className="space-y-3">
                    <Label className="text-base font-medium text-gray-900">
                      What level of detail do you want in your performance reporting?
                    </Label>
                  <p className="text-xs text-gray-700">
                    Choose your preferred methodology for calculating and reporting investment performance metrics.
                  </p>

                  <RadioGroup
                    value={formData.performanceMethodology}
                    onValueChange={(value) => updateFormData('performanceMethodology', value)}
                  >
                    <div className="flex items-start space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50/50 cursor-pointer">
                      <RadioGroupItem value="granular" id="granular" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="granular" className="cursor-pointer font-medium text-gray-900">
                          Yes - Use Granular Methodology
                        </Label>
                        <p className="text-xs text-gray-700 mt-1">
                          Detailed tracking of capital call purposes. Most accurate for performance reporting.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50/50 cursor-pointer">
                      <RadioGroupItem value="grossup" id="grossup-fund" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="grossup-fund" className="cursor-pointer font-medium text-gray-900">
                          No - Use Gross Up Methodology
                        </Label>
                        <p className="text-xs text-gray-700 mt-1">
                          Simplified calculation. Suitable when capital call purposes aren't tracked in detail.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                  </div>
                </div>

                {/* ILPA Performance Reporting Methodology */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      ILPA Performance Reporting Methodology
                    </h3>
                    <p className="text-sm text-gray-700">
                      Select how you will calculate gross performance for investor reporting. This follows ILPA
                      (Institutional Limited Partners Association) standards.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Granular Methodology */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">
                        Granular Methodology (Most Detailed)
                      </h4>
                      <p className="text-sm text-gray-700">
                        Use when you track detailed capital calls where the specific purpose (management fees,
                        investment financing, etc.) is known at the time of each capital call. This provides
                        the most accurate Fund-to-Investor cash flow performance.
                      </p>
                    </div>

                    {/* Gross Up Methodology */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">
                        Gross Up Methodology (Simplified)
                      </h4>
                      <p className="text-sm text-gray-700">
                        Use when capital call purposes are not tracked in detail, or when you calculate
                        performance at the Portfolio-Level (Fund-to-Investment cash flows). Management fees
                        and expenses are grossed up in the calculation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Economic Terms (V3 ENHANCED) */}
            {currentStep === 6 && (() => {
              // Calculate structure features based on type and subtype
              const features = getStructureFeatures(formData.structureType, (formData as any).subtype || formData.structureSubtype)

              return (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <Label className="text-base font-semibold text-blue-900">
                    How should these economic terms be applied?
                  </Label>
                  <RadioGroup
                    value={formData.economicTermsApplication}
                    onValueChange={(value) => updateFormData('economicTermsApplication', value)}
                  >
                    {visibilitySettings?.economicTermsOptions['all-investors'] && (
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="all-investors" id="all-investors" />
                        <div>
                          <Label htmlFor="all-investors" className="cursor-pointer font-medium">
                            Apply to all investors equally
                          </Label>
                          <p className="text-xs text-blue-700">
                            Same terms for every investor (standard approach)
                          </p>
                        </div>
                      </div>
                    )}
                    {visibilitySettings?.economicTermsOptions['per-investor'] && (
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="per-investor" id="per-investor" />
                        <div>
                          <Label htmlFor="per-investor" className="cursor-pointer font-medium">
                            Configure per investor type
                          </Label>
                          <p className="text-xs text-blue-700">
                            Set different terms for different investor types or large check sizes (configure during investor onboarding)
                          </p>
                        </div>
                      </div>
                    )}
                  </RadioGroup>
                  {formData.economicTermsApplication === 'per-investor' && (
                    <Alert className="border-blue-300 bg-white">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-700 text-xs">
                        The default terms below will be used as a baseline. You'll be able to negotiate
                        specific terms with individual investors or investor types during their onboarding process.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* V3.1: Investor Pre-Registration Section */}
                {formData.economicTermsApplication === 'per-investor' && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-900 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Pre-Register Investors (Optional)
                        </h4>
                        <p className="text-sm text-green-700 mt-1">
                          Add investors now with custom terms, or add them later during onboarding
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingInvestor(null)
                          setShowInvestorForm(true)
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Add Investor Manually
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => csvFileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CSV
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={downloadCSVTemplate}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </div>

                    <input
                      ref={csvFileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCSVUpload}
                    />

                    {formData.preRegisteredInvestors.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium text-green-900">
                            Pre-Registered Investors ({formData.preRegisteredInvestors.length})
                          </h5>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={exportInvestorsCSV}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Export
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleClearAllInvestors}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Clear All
                            </Button>
                          </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden bg-white">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Type</TableHead>
                                {formData.hierarchyMode && formData.hierarchyStructures && formData.hierarchyStructures.length > 0 && (
                                  <TableHead>Level</TableHead>
                                )}
                                <TableHead>Terms</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formData.preRegisteredInvestors.map((investor, idx) => {
                                const hasCustomTerms = investor.customTerms &&
                                  (investor.customTerms.managementFee !== undefined ||
                                   investor.customTerms.performanceFee !== undefined ||
                                   investor.customTerms.hurdleRate !== undefined ||
                                   investor.customTerms.preferredReturn !== undefined)

                                return (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">
                                      {investor.investorType?.toLowerCase() === 'individual'
                                        ? `${investor.firstName} ${investor.lastName}`
                                        : (investor as any).entityName}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                      {investor.email}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {investor.investorType?.replace('-', ' ') || 'individual'}
                                      </Badge>
                                    </TableCell>
                                    {formData.hierarchyMode && formData.hierarchyStructures.length > 0 && (
                                      <TableCell className="text-xs">
                                        {investor.hierarchyLevel ? (
                                          <Badge variant="secondary" className="text-xs">
                                            Level {investor.hierarchyLevel}
                                          </Badge>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                    )}
                                    <TableCell className="text-xs">
                                      {hasCustomTerms ? (
                                        <div className="flex flex-col">
                                          <Badge variant="secondary" className="w-fit mb-1">Custom</Badge>
                                          <span className="text-gray-600">
                                            {investor.customTerms?.managementFee ?? formData.managementFee}% /
                                            {investor.customTerms?.performanceFee ?? formData.performanceFee}% /
                                            {investor.customTerms?.hurdleRate ?? formData.hurdleRate}% /
                                            {investor.customTerms?.preferredReturn ?? formData.preferredReturn}%
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col">
                                          <Badge variant="outline" className="w-fit mb-1">Defaults</Badge>
                                          <span className="text-gray-600">
                                            {formData.managementFee}% / {formData.performanceFee}% / {formData.hurdleRate}% / {formData.preferredReturn}%
                                          </span>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      <Badge variant={investor.source === 'manual' ? 'default' : 'secondary'}>
                                        {investor.source === 'manual' ? 'Manual' : 'CSV'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditInvestor(investor)}
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveInvestor(investor.email)}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                        <p className="text-xs text-green-700 italic">
                          Legend: Management Fee / Performance Fee / Hurdle Rate / Preferred Return
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* V3.1: Investor Pre-Registration Form Modal */}
                <Sheet open={showInvestorForm} onOpenChange={setShowInvestorForm}>
                  <SheetContent className="overflow-y-auto sm:max-w-[540px] px-6">
                    <SheetHeader>
                      <SheetTitle>
                        {editingInvestor ? 'Edit Investor' : 'Add Investor Manually'}
                      </SheetTitle>
                      <SheetDescription>
                        Enter investor details and optional custom economic terms
                      </SheetDescription>
                    </SheetHeader>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        const formEl = e.target as HTMLFormElement
                        const formData = new FormData(formEl)

                        const investorType = formData.get('investorType') as string
                        const isEntity = investorType !== 'individual'

                        const investor: any = {
                          investorType: investorType as 'individual' | 'institution' | 'fund-of-funds' | 'family-office',
                          email: (formData.get('email') as string).toLowerCase(),
                          hierarchyLevel: formData.get('hierarchyLevel') ? parseInt(formData.get('hierarchyLevel') as string) : undefined,
                          customTerms: undefined as {
                            managementFee?: number
                            performanceFee?: number
                            hurdleRate?: number
                            preferredReturn?: number
                          } | undefined
                        }

                        // Add type-specific fields
                        if (isEntity) {
                          investor.entityName = formData.get('entityName') as string
                          investor.entityType = formData.get('entityType') as string || undefined
                          investor.contactFirstName = formData.get('contactFirstName') as string
                          investor.contactLastName = formData.get('contactLastName') as string
                          investor.taxId = formData.get('taxId') as string || undefined
                        } else {
                          investor.firstName = formData.get('firstName') as string
                          investor.lastName = formData.get('lastName') as string
                          investor.taxId = formData.get('taxId') as string || undefined
                        }

                        // Only include custom terms if any are provided
                        const mgmtFee = formData.get('managementFee')
                        const perfFee = formData.get('performanceFee')
                        const hurdle = formData.get('hurdleRate')
                        const prefReturn = formData.get('preferredReturn')

                        if (mgmtFee || perfFee || hurdle || prefReturn) {
                          investor.customTerms = {
                            managementFee: mgmtFee ? parseFloat(mgmtFee as string) : undefined,
                            performanceFee: perfFee ? parseFloat(perfFee as string) : undefined,
                            hurdleRate: hurdle ? parseFloat(hurdle as string) : undefined,
                            preferredReturn: prefReturn ? parseFloat(prefReturn as string) : undefined
                          }
                        }

                        handleAddInvestor(investor)
                        formEl.reset()
                        setSelectedInvestorType('individual') // Reset to default
                      }}
                      className="space-y-6 mt-6"
                    >
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>

                        {/* Investor Type */}
                        <div className="space-y-2">
                          <Label htmlFor="investorType">Investor Type *</Label>
                          <Select
                            name="investorType"
                            defaultValue={editingInvestor?.investorType || 'individual'}
                            onValueChange={(value) => setSelectedInvestorType(value as 'individual' | 'institution' | 'fund-of-funds' | 'family-office')}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="institution">Institution</SelectItem>
                              <SelectItem value="family-office">Family Office</SelectItem>
                              <SelectItem value="fund-of-funds">Fund of Funds</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Conditional fields based on investor type */}
                        {selectedInvestorType === 'individual' ? (
                          // Individual investor fields
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                  id="firstName"
                                  name="firstName"
                                  placeholder="John"
                                  defaultValue={editingInvestor?.firstName || ''}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                  id="lastName"
                                  name="lastName"
                                  placeholder="Doe"
                                  defaultValue={editingInvestor?.lastName || ''}
                                  required
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email *</Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="john.doe@example.com"
                                defaultValue={editingInvestor?.email || ''}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="taxId">Tax ID / SSN (Optional)</Label>
                              <Input
                                id="taxId"
                                name="taxId"
                                placeholder="XXX-XX-XXXX"
                                defaultValue={editingInvestor?.taxId || ''}
                              />
                            </div>
                          </>
                        ) : (
                          // Entity investor fields
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="entityName">Entity Name *</Label>
                              <Input
                                id="entityName"
                                name="entityName"
                                placeholder="ABC Investment LLC"
                                defaultValue={editingInvestor?.entityName || ''}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="entityType">Entity Type</Label>
                              <Input
                                id="entityType"
                                name="entityType"
                                placeholder="LLC, Corporation, Trust, Partnership, etc."
                                defaultValue={editingInvestor?.entityType || ''}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="contactFirstName">Contact First Name *</Label>
                                <Input
                                  id="contactFirstName"
                                  name="contactFirstName"
                                  placeholder="Jane"
                                  defaultValue={editingInvestor?.contactFirstName || ''}
                                  required
                                />
                                <p className="text-xs text-muted-foreground">Portal user</p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="contactLastName">Contact Last Name *</Label>
                                <Input
                                  id="contactLastName"
                                  name="contactLastName"
                                  placeholder="Doe"
                                  defaultValue={editingInvestor?.contactLastName || ''}
                                  required
                                />
                                <p className="text-xs text-muted-foreground">Portal user</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Contact Email *</Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="jane.doe@abcinvest.com"
                                defaultValue={editingInvestor?.email || ''}
                                required
                              />
                              <p className="text-xs text-muted-foreground">Used for portal access</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="taxId">Tax ID / EIN (Optional)</Label>
                              <Input
                                id="taxId"
                                name="taxId"
                                placeholder="XX-XXXXXXX"
                                defaultValue={editingInvestor?.taxId || ''}
                              />
                            </div>
                          </>
                        )}

                        {/* Hierarchy Level (conditional) */}
                        {formData.hierarchyMode && formData.hierarchyStructures && formData.hierarchyStructures.length > 0 && (
                          <div className="space-y-2">
                            <Label htmlFor="hierarchyLevel">Participating Hierarchy Level *</Label>
                            <Select name="hierarchyLevel" defaultValue={editingInvestor?.hierarchyLevel?.toString() || '1'} required>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {formData.hierarchyStructures.map((level, index) => (
                                  <SelectItem key={index} value={(index + 1).toString()}>
                                    Level {index + 1}: {level.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Select which hierarchy level this investor participates in
                            </p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Custom Economic Terms */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            Custom Economic Terms (Optional)
                          </h3>
                          <p className="text-xs text-gray-500">
                            Leave blank to use default terms ({formData.managementFee}% / {formData.performanceFee}% / {formData.hurdleRate}% / {formData.preferredReturn}%)
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="managementFee" className="text-xs">
                              Management Fee (%)
                            </Label>
                            <Input
                              id="managementFee"
                              name="managementFee"
                              type="number"
                              step="0.1"
                              placeholder={formData.managementFee}
                              defaultValue={editingInvestor?.customTerms?.managementFee || ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="performanceFee" className="text-xs">
                              Performance Fee (%)
                            </Label>
                            <Input
                              id="performanceFee"
                              name="performanceFee"
                              type="number"
                              step="0.1"
                              placeholder={formData.performanceFee}
                              defaultValue={editingInvestor?.customTerms?.performanceFee || ''}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hurdleRate" className="text-xs">
                              Hurdle Rate (%)
                            </Label>
                            <Input
                              id="hurdleRate"
                              name="hurdleRate"
                              type="number"
                              step="0.1"
                              placeholder={formData.hurdleRate}
                              defaultValue={editingInvestor?.customTerms?.hurdleRate || ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="preferredReturn" className="text-xs">
                              Preferred Return (%)
                            </Label>
                            <Input
                              id="preferredReturn"
                              name="preferredReturn"
                              type="number"
                              step="0.1"
                              placeholder={formData.preferredReturn}
                              defaultValue={editingInvestor?.customTerms?.preferredReturn || ''}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowInvestorForm(false)
                            setEditingInvestor(null)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                          {editingInvestor ? 'Update Investor' : 'Add Investor'}
                        </Button>
                      </div>
                    </form>
                  </SheetContent>
                </Sheet>

                {/* Distribution Model Selection - Context-aware based on structure type */}
                {formData.structureType === 'private-debt' ? (
                  <Alert className="border-primary/30 bg-white">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Interest Payment Model</AlertTitle>
                    <AlertDescription className="text-primary/80">
                      <p className="mb-2">
                        Private debt structures use an interest payment model for debt-based investments.
                      </p>
                      <p className="text-sm">
                        Returns are distributed as interest payments based on the debt terms configured.
                      </p>
                    </AlertDescription>
                  </Alert>
                ) : formData.financingStrategy === 'equity' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="distributionModel">Distribution Model *</Label>
                      <Select
                        value={formData.distributionModel}
                        onValueChange={(value) => updateFormData('distributionModel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple Pro-Rata Distribution</SelectItem>
                          <SelectItem value="waterfall">Waterfall Distribution</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">
                        {formData.distributionModel === 'simple' && 'Profits distributed proportionally based on ownership percentage'}
                        {formData.distributionModel === 'waterfall' && 'Distributions are calculated on total fund performance'}
                      </p>
                    </div>

                    {formData.distributionModel === 'simple' && (
                      <div className="space-y-2">
                        <Label htmlFor="preferredReturnSimple">Preferred return %</Label>
                        <Input
                          id="preferredReturnSimple"
                          type="number"
                          step="0.1"
                          placeholder="8.0"
                          value={formData.preferredReturn || ''}
                          onChange={(e) => updateFormData('preferredReturn', parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-gray-500">Minimum annual return to LPs before distributions</p>
                      </div>
                    )}
                  </div>
                ) : formData.financingStrategy === 'debt' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="debtInterestRate">Interest Rate (Brute) %</Label>
                      <Input
                        id="debtInterestRate"
                        type="number"
                        step="0.1"
                        placeholder="5.0"
                        value={formData.debtInterestRate}
                        onChange={(e) => updateFormData('debtInterestRate', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Base interest rate</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="debtGrossInterestRate">Annual Gross Interest %</Label>
                      <Input
                        id="debtGrossInterestRate"
                        type="number"
                        step="0.1"
                        placeholder="5.5"
                        value={formData.debtGrossInterestRate}
                        onChange={(e) => updateFormData('debtGrossInterestRate', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Gross interest rate for reporting</p>
                    </div>
                  </div>
                ) : null}

                {/* Conditional: Show waterfall scenarios if waterfall model selected - only for equity */}
                {formData.financingStrategy === 'equity' && formData.distributionModel === 'waterfall' && (
                <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-medium text-gray-900">Waterfall Tiers</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (formData.waterfallScenarios.length < 3) {
                          const newScenario = {
                            id: Date.now().toString(),
                            name: `Tier ${formData.waterfallScenarios.length + 1}`,
                            gpSplit: '20',
                            preferredReturn: '8',
                            isExpanded: true
                          }
                          updateFormData('waterfallScenarios', [...formData.waterfallScenarios, newScenario])
                        }
                      }}
                      disabled={formData.waterfallScenarios.length >= 3}
                    >
                      + Add Tier {formData.waterfallScenarios.length < 3 ? `(${formData.waterfallScenarios.length}/3)` : '(Max)'}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="managementFee">Management Fee (%)</Label>
                    <Input
                      id="managementFee"
                      type="number"
                      step="0.1"
                      placeholder="2.0"
                      value={formData.managementFee}
                      onChange={(e) => updateFormData('managementFee', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Annual % of AUM - applies to all tiers</p>
                  </div>

                  {formData.waterfallScenarios.map((scenario, index) => (
                    <div key={scenario.id} className="border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={() => {
                        const updated = [...formData.waterfallScenarios]
                        updated[index].isExpanded = !updated[index].isExpanded
                        updateFormData('waterfallScenarios', updated)
                      }}>
                        <div className="flex items-center gap-2">
                          <span className={`transform transition-transform ${scenario.isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                          <h5 className="font-medium text-gray-900">{scenario.name}</h5>
                        </div>
                        {formData.waterfallScenarios.length > 1 && (
                          <button
                            type="button"
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateFormData('waterfallScenarios', formData.waterfallScenarios.filter((_, i) => i !== index))
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {scenario.isExpanded && (
                        <div className="p-4 border-t border-gray-200 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`gpSplit-${scenario.id}`}>GP Split / Carry (%)</Label>
                            <Input
                              id={`gpSplit-${scenario.id}`}
                              type="number"
                              step="0.1"
                              placeholder="20.0"
                              value={scenario.gpSplit}
                              onChange={(e) => {
                                const updated = [...formData.waterfallScenarios]
                                updated[index].gpSplit = e.target.value
                                updateFormData('waterfallScenarios', updated)
                              }}
                            />
                            <p className="text-xs text-gray-500">% of profits above hurdle</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`preferredReturn-${scenario.id}`}>Preferred Return/Hurdle Rate (%)</Label>
                            <Input
                              id={`preferredReturn-${scenario.id}`}
                              type="number"
                              step="0.1"
                              placeholder="8.0"
                              value={scenario.preferredReturn}
                              onChange={(e) => {
                                const updated = [...formData.waterfallScenarios]
                                updated[index].preferredReturn = e.target.value
                                updateFormData('waterfallScenarios', updated)
                              }}
                            />
                            <p className="text-xs text-gray-500">Annual preferred return to LPs</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                </>
                )}
              </div>
              )
            })()}

            {/* STEP 6: Distribution & Tax */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="distributionFrequency">Distribution Frequency</Label>
                  <Select
                    value={formData.distributionFrequency}
                    onValueChange={(value) => updateFormData('distributionFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      {formData.structureType !== 'private-debt' && (
                        <SelectItem value="on-exit">On Exit Only</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="sameTaxTreatment"
                    type="checkbox"
                    checked={formData.sameTaxTreatment}
                    onChange={(e) => updateFormData('sameTaxTreatment', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <Label htmlFor="sameTaxTreatment" className="cursor-pointer text-sm">
                    The same tax treatment applies to both natural persons and legal entities
                  </Label>
                </div>

                {formData.sameTaxTreatment ? (
                  // Show 2 fields for same treatment
                  formData.structureType === 'private-debt' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="vatRate">
                          VAT Rate (%)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Value Added Tax rate for {formData.jurisdiction}</p>
                                <p className="text-xs mt-1">Individual investors will have different rates based on nationality</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <Input
                          id="vatRate"
                          type="number"
                          step="0.1"
                          placeholder="21.0"
                          value={formData.vatRate}
                          onChange={(e) => updateFormData('vatRate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="incomeDebtTaxRate">
                          Income Tax (%)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Income tax rate for {formData.jurisdiction}</p>
                                <p className="text-xs mt-1">Individual investors will have different rates based on nationality</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <Input
                          id="incomeDebtTaxRate"
                          type="number"
                          step="0.1"
                          placeholder="25.0"
                          value={formData.incomeDebtTaxRate}
                          onChange={(e) => updateFormData('incomeDebtTaxRate', e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="witholdingDividendTaxRate">
                          Withholding / Dividend Tax (%)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Withholding tax rate on dividend distributions for {formData.jurisdiction}</p>
                                <p className="text-xs mt-1">Individual investors will have different rates based on nationality</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <Input
                          id="witholdingDividendTaxRate"
                          type="number"
                          step="0.1"
                          placeholder="15.0"
                          value={formData.witholdingDividendTaxRate}
                          onChange={(e) => updateFormData('witholdingDividendTaxRate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="incomeEquityTaxRate">
                          Income Tax (%)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Income tax rate for {formData.jurisdiction}</p>
                                <p className="text-xs mt-1">Individual investors will have different rates based on nationality</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <Input
                          id="incomeEquityTaxRate"
                          type="number"
                          step="0.1"
                          placeholder="25.0"
                          value={formData.incomeEquityTaxRate}
                          onChange={(e) => updateFormData('incomeEquityTaxRate', e.target.value)}
                        />
                      </div>
                    </>
                  )
                ) : (
                  // Show 4 fields for different treatment (2 for natural persons, 2 for legal entities)
                  formData.structureType === 'private-debt' ? (
                    <>
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-4 text-gray-900">Natural Persons</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="vatRateNaturalPersons">
                              VAT Rate (%)
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>VAT rate for natural persons in {formData.jurisdiction}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                            <Input
                              id="vatRateNaturalPersons"
                              type="number"
                              step="0.1"
                              placeholder="21.0"
                              value={formData.vatRateNaturalPersons}
                              onChange={(e) => updateFormData('vatRateNaturalPersons', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="incomeDebtTaxRateNaturalPersons">
                              Income Tax (%)
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Income tax rate for natural persons in {formData.jurisdiction}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                            <Input
                              id="incomeDebtTaxRateNaturalPersons"
                              type="number"
                              step="0.1"
                              placeholder="25.0"
                              value={formData.incomeDebtTaxRateNaturalPersons}
                              onChange={(e) => updateFormData('incomeDebtTaxRateNaturalPersons', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-4 text-gray-900">Legal Entities</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="vatRateLegalEntities">
                              VAT Rate (%)
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>VAT rate for legal entities in {formData.jurisdiction}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                            <Input
                              id="vatRateLegalEntities"
                              type="number"
                              step="0.1"
                              placeholder="21.0"
                              value={formData.vatRateLegalEntities}
                              onChange={(e) => updateFormData('vatRateLegalEntities', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="incomeDebtTaxRateLegalEntities">
                              Income Tax (%)
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Income tax rate for legal entities in {formData.jurisdiction}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                            <Input
                              id="incomeDebtTaxRateLegalEntities"
                              type="number"
                              step="0.1"
                              placeholder="25.0"
                              value={formData.incomeDebtTaxRateLegalEntities}
                              onChange={(e) => updateFormData('incomeDebtTaxRateLegalEntities', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-4 text-gray-900">Natural Persons</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="witholdingDividendTaxRateNaturalPersons">
                              Withholding / Dividend Tax (%)
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Withholding tax rate for natural persons in {formData.jurisdiction}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                            <Input
                              id="witholdingDividendTaxRateNaturalPersons"
                              type="number"
                              step="0.1"
                              placeholder="15.0"
                              value={formData.witholdingDividendTaxRateNaturalPersons}
                              onChange={(e) => updateFormData('witholdingDividendTaxRateNaturalPersons', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="incomeEquityTaxRateNaturalPersons">
                              Income Tax (%)
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Income tax rate for natural persons in {formData.jurisdiction}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                            <Input
                              id="incomeEquityTaxRateNaturalPersons"
                              type="number"
                              step="0.1"
                              placeholder="25.0"
                              value={formData.incomeEquityTaxRateNaturalPersons}
                              onChange={(e) => updateFormData('incomeEquityTaxRateNaturalPersons', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-4 text-gray-900">Legal Entities</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="witholdingDividendTaxRateLegalEntities">
                              Withholding / Dividend Tax (%)
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Withholding tax rate for legal entities in {formData.jurisdiction}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                            <Input
                              id="witholdingDividendTaxRateLegalEntities"
                              type="number"
                              step="0.1"
                              placeholder="15.0"
                              value={formData.witholdingDividendTaxRateLegalEntities}
                              onChange={(e) => updateFormData('witholdingDividendTaxRateLegalEntities', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="incomeEquityTaxRateLegalEntities">
                              Income Tax (%)
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Income tax rate for legal entities in {formData.jurisdiction}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                            <Input
                              id="incomeEquityTaxRateLegalEntities"
                              type="number"
                              step="0.1"
                              placeholder="25.0"
                              value={formData.incomeEquityTaxRateLegalEntities}
                              onChange={(e) => updateFormData('incomeEquityTaxRateLegalEntities', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )
                )}

              </div>
            )}

            {/* STEP 7: Document Upload */}
            {currentStep === 8 && (
              <div className="space-y-6">
                {/* No Documents Uploaded Alert */}
                {(formData.uploadedFundDocuments.length === 0 || formData.uploadedInvestorDocuments.length === 0) && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-900">Documents Required</AlertTitle>
                    <AlertDescription className="text-red-700 text-sm">
                      Documents are required for both sections to complete the setup.
                      {formData.uploadedFundDocuments.length === 0 && formData.uploadedInvestorDocuments.length === 0 && ' Please upload offering-related documents and investor-related documents below.'}
                      {formData.uploadedFundDocuments.length === 0 && formData.uploadedInvestorDocuments.length > 0 && ' Please upload offering-related documents below.'}
                      {formData.uploadedFundDocuments.length > 0 && formData.uploadedInvestorDocuments.length === 0 && ' Please upload investor-related documents below.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Upload Error Alert */}
                {uploadError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-900">Upload Error</AlertTitle>
                    <AlertDescription className="text-red-700 text-sm">
                      {uploadError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Offering-Related Documents Section */}
                <div className="p-4 bg-primary/5 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h4 className="font-medium text-sm text-primary">Offering-Related Documents</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Upload documents related to your offering structure
                  </p>

                  <div className="space-y-3">
                    <Label htmlFor="fundDocuments" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors">
                        <div className="flex flex-col items-center justify-center text-center">
                          <DollarSign className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Click to upload offering documents
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF, DOCX, XLSX up to 10MB each
                          </p>
                        </div>
                      </div>
                    </Label>
                    <Input
                      id="fundDocuments"
                      type="file"
                      multiple
                      accept=".pdf,.docx,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        // Clear any previous errors
                        setUploadError('')

                        // Validate file size
                        const invalidFiles = files.filter(f => f.size > 10 * 1024 * 1024)
                        if (invalidFiles.length > 0) {
                          setUploadError(`The following files exceed the 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}. Please select smaller files.`)
                          // Clear error after 8 seconds
                          setTimeout(() => setUploadError(''), 8000)
                          // Reset the input
                          e.target.value = ''
                          return
                        }

                        // Store valid files in state with File objects
                        const newDocs = files.map(f => ({ name: f.name, addedAt: new Date(), file: f }))
                        setFormData(prev => ({
                          ...prev,
                          uploadedFundDocuments: [...prev.uploadedFundDocuments, ...newDocs]
                        }))

                        // Reset the input to allow re-uploading the same file
                        e.target.value = ''
                      }}
                    />
                  </div>

                  {/* Display uploaded fund documents */}
                  {formData.uploadedFundDocuments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Uploaded Files ({formData.uploadedFundDocuments.length}):</p>
                      {formData.uploadedFundDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {new Date(doc.addedAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                uploadedFundDocuments: prev.uploadedFundDocuments.filter((_, i) => i !== index)
                              }))
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Investor-Related Documents Section */}
                <div className="p-4 bg-green-50 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-green-700" />
                    <h4 className="font-medium text-sm text-green-900">Investor-Related Documents</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Upload documents for investor onboarding
                  </p>

                  <div className="space-y-3">
                    <Label htmlFor="investorDocuments" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-600 hover:bg-green-50 transition-colors">
                        <div className="flex flex-col items-center justify-center text-center">
                          <Users className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Click to upload investor documents
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF, DOCX, XLSX up to 10MB each
                          </p>
                        </div>
                      </div>
                    </Label>
                    <Input
                      id="investorDocuments"
                      type="file"
                      multiple
                      accept=".pdf,.docx,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        // Clear any previous errors
                        setUploadError('')

                        // Validate file size
                        const invalidFiles = files.filter(f => f.size > 10 * 1024 * 1024)
                        if (invalidFiles.length > 0) {
                          setUploadError(`The following files exceed the 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}. Please select smaller files.`)
                          // Clear error after 8 seconds
                          setTimeout(() => setUploadError(''), 8000)
                          // Reset the input
                          e.target.value = ''
                          return
                        }

                        // Store valid files in state with File objects
                        const newDocs = files.map(f => ({ name: f.name, addedAt: new Date(), file: f }))
                        setFormData(prev => ({
                          ...prev,
                          uploadedInvestorDocuments: [...prev.uploadedInvestorDocuments, ...newDocs]
                        }))

                        // Reset the input to allow re-uploading the same file
                        e.target.value = ''
                      }}
                    />
                  </div>

                  {/* Display uploaded investor documents */}
                  {formData.uploadedInvestorDocuments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Uploaded Files ({formData.uploadedInvestorDocuments.length}):</p>
                      {formData.uploadedInvestorDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {new Date(doc.addedAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                uploadedInvestorDocuments: prev.uploadedInvestorDocuments.filter((_, i) => i !== index)
                              }))
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-600 italic mt-2">
                    Note: KYC/AML verification is included in Polibit's automated investor onboarding process
                  </p>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Document Upload</AlertTitle>
                  <AlertDescription className="text-blue-700 text-sm">
                    Document upload is mandatory. We will upload your documents to the investment portal this process takes up to 10 days.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-primary hover:bg-primary/90"
                disabled={isSubmitting || formData.uploadedFundDocuments.length === 0 || formData.uploadedInvestorDocuments.length === 0}
                title={formData.uploadedFundDocuments.length === 0 || formData.uploadedInvestorDocuments.length === 0 ? 'Please upload documents to both sections to complete setup' : ''}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Loading Review...
                  </>
                ) : (
                  'Review Setup'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        {visibilitySettings?.navSecondaryItems.getHelp && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Need help? Visit the <span className="text-primary font-medium">Get Help</span> tab in the navigation menu
          </div>
        )}
      </div>

      {/* Remove Single Investor Confirmation Dialog */}
      <AlertDialog open={removeInvestorDialogOpen} onOpenChange={setRemoveInvestorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Investor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this investor from the pre-registration list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveInvestor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Investor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Investors Confirmation Dialog */}
      <AlertDialog open={clearAllInvestorsDialogOpen} onOpenChange={setClearAllInvestorsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Investors</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all {formData.preRegisteredInvestors.length} investors from the pre-registration list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAllInvestors} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All Investors
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
