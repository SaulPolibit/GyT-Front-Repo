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
import { CalendarIcon, ChevronLeft, ChevronRight, Info, AlertCircle, CheckCircle2, Building2, DollarSign, Users, TrendingUp, Upload, Download, X, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslation } from '@/hooks/useTranslation'
import { saveStructure } from '@/lib/structures-storage'
import { saveInvestor } from '@/lib/investors-storage'
import { useRouter } from 'next/navigation'

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
  'fund': {
    label: 'Fund',
    description: 'Investment fund for single or multiple projects with capital calls',
    subtypes: [
      { value: 'single-project', label: 'Single-Project Fund', description: 'Fund for one specific project (5-7 year lifecycle)' },
      { value: 'multi-project', label: 'Multi-Project Fund', description: 'Fund for multiple properties/projects (10-15 year lifecycle)' },
      { value: 'core-income', label: 'Core/Income Fund', description: 'Rent-focused with stable income (10+ year hold)' },
    ],
    regions: ['United States', 'Mexico', 'Panama', 'El Salvador', 'Cayman Islands', 'British Virgin Islands']
  },
  'sa': {
    label: 'SA / LLC / SPV',
    description: 'Single-property legal entity for isolated risk',
    subtypes: [
      { value: 'spv', label: 'Single-Property Entity (SPV)', description: 'Holds one property/project for risk isolation' },
      { value: 'management', label: 'Management Company / GP Entity', description: 'Manages fund operations and employs investment professionals' },
      { value: 'joint-venture', label: 'Joint Venture Vehicle', description: 'Partnership structure for co-investment opportunities' }
    ],
    regions: ['United States', 'Mexico', 'Panama', 'El Salvador', 'Cayman Islands', 'British Virgin Islands']
  },
  'fideicomiso': {
    label: 'Trust',
    description: 'Bank trust structure with tax incentives, can hold multiple properties',
    subtypes: [
      { value: 'single-property', label: 'Single Property Trust', description: 'Trust for one property' },
      { value: 'multi-property', label: 'Multi-Property Trust', description: 'Trust holding multiple properties (fund-like)' },
    ],
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
  'fund': {
    ...STRUCTURE_TYPES.fund,
    label: t.structures.fund,
    description: t.onboarding.fundDescription,
  },
  'sa': {
    ...STRUCTURE_TYPES.sa,
    label: t.structures.sa,
    description: t.onboarding.saLLCDescription,
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

  // V3.1: Investor Pre-Registration State
  const [showInvestorForm, setShowInvestorForm] = useState(false)
  const [editingInvestor, setEditingInvestor] = useState<InvestorPreRegistration | null>(null)
  const [selectedInvestorType, setSelectedInvestorType] = useState<'individual' | 'institution' | 'fund-of-funds' | 'family-office'>('individual')
  const csvFileInputRef = useRef<HTMLInputElement>(null)

  // Confirmation dialog states
  const [removeInvestorDialogOpen, setRemoveInvestorDialogOpen] = useState(false)
  const [clearAllInvestorsDialogOpen, setClearAllInvestorsDialogOpen] = useState(false)
  const [investorToRemove, setInvestorToRemove] = useState<string | null>(null)

  // Document upload error state
  const [uploadError, setUploadError] = useState<string>('')

  // Form validation error state
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const [formData, setFormData] = useState({
    // Step 1: Structure Type Selection
    structureType: '',
    structureSubtype: '',

    // Step 2: Basic Information
    structureName: '',
    jurisdiction: '',
    usState: '', // For SA/LLC in United States
    usStateOther: '', // When "Other" is selected
    inceptionDate: undefined,
    currentStage: 'fundraising',

    // Step 3: Capital Structure & Issuances (V3 ENHANCED)
    totalCapitalCommitment: '',
    currency: 'USD',
    plannedInvestments: '1', // NEW: How many properties/projects
    financingStrategy: 'equity', // NEW: equity, debt, or mixed
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
    waterfallStructure: 'american',

    // Step 5: Distribution & Tax
    distributionFrequency: 'quarterly',
    defaultTaxRate: '',

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
    uploadedFundDocuments: [] as { name: string; addedAt: Date }[],
    uploadedInvestorDocuments: [] as { name: string; addedAt: Date }[],

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
    applyWaterfallAtThisLevel: true,
    applyEconomicTermsAtThisLevel: true,
    waterfallAlgorithm: null as 'american' | 'european' | null,
    incomeFlowTarget: 'investors' as string,

    // V5: ILPA Performance Methodology
    performanceMethodology: '' as '' | 'granular' | 'grossup',
    calculationLevel: '' as '' | 'fund-level' | 'portfolio-level',
  })

  const totalSteps = 6
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
                  index === targetLevels - 1 ? 'Property/Investment Level' :
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
        if (formData.minCheckSize && formData.maxCheckSize &&
            parseFloat(formData.minCheckSize) > parseFloat(formData.maxCheckSize)) {
          errors.push('Minimum check size cannot be greater than maximum check size')
        }
        break

      // Steps 4, 5, and 6 have no required fields (all have defaults or are optional)
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
        distributionFrequency: formData.distributionFrequency,
        defaultTaxRate: formData.defaultTaxRate,
        // V3 Additional fields
        plannedInvestments: formData.plannedInvestments,
        financingStrategy: formData.financingStrategy,
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
        uploadedFundDocuments: formData.uploadedFundDocuments,
        uploadedInvestorDocuments: formData.uploadedInvestorDocuments,
        // V4: Multi-Level Hierarchy
        hierarchyMode: formData.hierarchyMode,
        numberOfLevels: formData.hierarchyLevels, // Pass number of levels for multi-level creation
        hierarchyStructures: formData.hierarchyStructures,
        parentStructureId: formData.parentStructureId,
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
      setSetupComplete(true)

      // Don't auto-redirect - let user review the summary and choose where to go
    } catch (error) {
      console.error('Error saving structure:', error)
      setIsSubmitting(false)
      toast.error('Failed to save structure. Please try again.')
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
  if (setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Complete!</h1>
            <p className="text-lg text-gray-600">
              Your investment structure is ready to accept investors
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
                  <div>
                    <span className="text-gray-500">Subtype:</span>
                    <p className="font-medium">
                      {availableSubtypes.find(s => s.value === formData.structureSubtype)?.label}
                    </p>
                  </div>
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
                        ? parseFloat(formData.totalCapitalCommitment).toLocaleString()
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
                        ? parseFloat(formData.minCheckSize).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Maximum Check Size:</span>
                    <p className="font-medium">
                      {formData.currency} {formData.maxCheckSize && !isNaN(parseFloat(formData.maxCheckSize))
                        ? parseFloat(formData.maxCheckSize).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Planned Investments:</span>
                    <p className="font-medium">{formData.plannedInvestments}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Financing Strategy:</span>
                    <p className="font-medium capitalize">{formData.financingStrategy}</p>
                  </div>
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
                    <span className="text-gray-500">Default Tax Rate:</span>
                    <p className="font-medium">{formData.defaultTaxRate}%</p>
                  </div>
                  {formData.structureType === 'fund' && (
                    <>
                      <div>
                        <span className="text-gray-500">Capital Call Notice Period:</span>
                        <p className="font-medium">{formData.capitalCallNoticePeriod} days</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Default Capital Call %:</span>
                        <p className="font-medium">{formData.capitalCallDefaultPercentage}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment Deadline:</span>
                        <p className="font-medium">{formData.capitalCallPaymentDeadline} days</p>
                      </div>
                    </>
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

                    {/* Fund Documents */}
                    {formData.uploadedFundDocuments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-gray-700">Fund Documents ({formData.uploadedFundDocuments.length})</h4>
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

              {/* Pricing Summary */}
              {additionalCosts && (
                <div className="bg-primary/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Pricing Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{currentTier?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Base Fee:</span>
                      <span className="font-medium">${additionalCosts.baseMonthlyCost.toLocaleString()}</span>
                    </div>
                    {additionalCosts.additionalAUMCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">+ AUM Overage:</span>
                        <span className="font-medium">${additionalCosts.additionalAUMCost.toLocaleString()}/mo</span>
                      </div>
                    )}
                    {additionalCosts.additionalInvestorCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">+ Investor Overage:</span>
                        <span className="font-medium">${additionalCosts.additionalInvestorCost.toLocaleString()}/mo</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total Monthly:</span>
                      <span className="text-primary">${additionalCosts.totalMonthlyCost.toLocaleString()}/month</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>One-Time Setup Fee:</span>
                      <span className="text-primary">${additionalCosts.totalSetupCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardFooter className="flex gap-3 pt-6">
              <Button
                className="flex-1"
                size="lg"
                onClick={() => router.push('/investment-manager/structures')}
              >
                Check New Structure Created
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => router.push('/investment-manager/investors')}
              >
                Invite Investors
              </Button>
            </CardFooter>
          </Card>
        </div>
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

        {currentTier && currentStep >= 3 && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">
              {currentTier.name} Plan Selected
            </AlertTitle>
            <AlertDescription className="text-primary/80">
              {(() => {
                const aum = parseFloat(formData.totalCapitalCommitment)
                const aumInUSD = convertToUSD(aum, formData.currency)
                const displayText = formData.currency === 'USD'
                  ? `$${aum.toLocaleString()} USD`
                  : `${formData.currency} ${aum.toLocaleString()} (~$${aumInUSD.toLocaleString()} USD)`
                return `Based on your ${displayText} AUM, you're on the ${currentTier.name} tier at $${currentTier.monthlyFee.toLocaleString()}/month`
              })()}
              {additionalCosts && (additionalCosts.additionalAUMCost > 0 || additionalCosts.additionalInvestorCost > 0) && (
                <span> + ${(additionalCosts.additionalAUMCost + additionalCosts.additionalInvestorCost).toLocaleString()}/month in overages</span>
              )}
            </AlertDescription>
          </Alert>
        )}

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
              {currentStep === 4 && 'Economic Terms'}
              {currentStep === 5 && 'Distribution & Tax Settings'}
              {currentStep === 6 && 'Document Upload'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && t.onboarding.selectStructureSubtitle}
              {currentStep === 2 && 'Provide essential information about your structure'}
              {currentStep === 3 && 'Define capital requirements, financing strategy, and investor parameters'}
              {currentStep === 4 && 'Set up fee structures and distribution terms'}
              {currentStep === 5 && 'Configure distribution schedule and tax settings'}
              {currentStep === 6 && 'Upload fund and investor documents'}
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
                    {Object.entries(translatedStructureTypes).map(([key, structure]) => (
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

                {/* Hierarchy Configuration */}
                {formData.structureSubtype && (
                  <div className="space-y-4 pt-6 border-t">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="hierarchyMode"
                        checked={formData.hierarchyMode}
                        onCheckedChange={(checked) => updateFormData('hierarchyMode', checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="hierarchyMode" className="cursor-pointer font-medium text-base">
                          Enable Multi-Level Hierarchy
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create a multi-level structure with cascading distributions (e.g., Master Trust → Investor Trust → Project Trust → Property)
                        </p>
                      </div>
                    </div>

                    {formData.hierarchyMode && (
                      <Alert className="border-primary/30 bg-white">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary">Multi-Level Hierarchy Enabled</AlertTitle>
                        <AlertDescription className="text-primary/80">
                          <div className="space-y-4 mt-3">
                            <div className="space-y-2">
                              <Label htmlFor="hierarchySetupApproach">Setup Approach *</Label>
                              <RadioGroup
                                value={formData.hierarchySetupApproach}
                                onValueChange={(value) => updateFormData('hierarchySetupApproach', value as 'all-at-once' | 'incremental')}
                              >
                                <div className="flex items-start space-x-3 space-y-0 rounded-lg border border-primary/20 p-4 hover:bg-primary/5 cursor-pointer">
                                  <RadioGroupItem value="all-at-once" id="all-at-once" />
                                  <div className="flex-1">
                                    <Label htmlFor="all-at-once" className="cursor-pointer font-medium text-sm">
                                      All-at-Once Configuration
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Define the entire hierarchy structure upfront with all levels and their configurations
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3 space-y-0 rounded-lg border border-primary/20 p-4 hover:bg-primary/5 cursor-pointer">
                                  <RadioGroupItem value="incremental" id="incremental" />
                                  <div className="flex-1">
                                    <Label htmlFor="incremental" className="cursor-pointer font-medium text-sm">
                                      Incremental Setup
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Create this structure now and add child/parent structures later as needed
                                    </p>
                                  </div>
                                </div>
                              </RadioGroup>
                            </div>

                            {formData.hierarchySetupApproach === 'all-at-once' && (
                              <div className="space-y-3 pt-3 border-t border-primary/20">
                                <div className="space-y-2">
                                  <Label htmlFor="hierarchyLevels">Number of Hierarchy Levels *</Label>
                                  <Select
                                    value={formData.hierarchyLevels.toString()}
                                    onValueChange={(value) => updateFormData('hierarchyLevels', parseInt(value))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                        <SelectItem key={num} value={num.toString()}>
                                          {num} Levels
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground">
                                    Example of 3 levels: Master Trust → Investor Trust → Project Trust
                                  </p>
                                </div>

                                <Alert className="bg-primary/5 border-primary/30">
                                  <AlertCircle className="h-4 w-4 text-primary" />
                                  <AlertDescription className="text-xs text-primary/80">
                                    <strong>Configure Each Level:</strong> Define where calculations occur in your hierarchy. Income enters at the bottom (property level) and flows upward through each level to investors.
                                  </AlertDescription>
                                </Alert>

                                {/* Level-by-Level Configuration */}
                                {formData.hierarchyStructures.length > 0 && (
                                  <div className="space-y-3 pt-3 border-t border-primary/20">
                                    <h4 className="text-sm font-semibold text-primary">Hierarchy Level Configuration</h4>
                                    {formData.hierarchyStructures.map((structure, index) => (
                                      <Card key={index} className="border-primary/20 bg-white">
                                        <CardHeader className="pb-3">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <CardTitle className="text-sm flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                  Level {index + 1} of {formData.hierarchyLevels}
                                                </Badge>
                                                {structure.name}
                                              </CardTitle>
                                              <CardDescription className="text-xs mt-1">
                                                {index === 0 && 'Top-level structure (receives distributions from children)'}
                                                {index === formData.hierarchyLevels - 1 && 'Property/Investment level (income entry point)'}
                                                {index > 0 && index < formData.hierarchyLevels - 1 && `Intermediate level (flows from Level ${index + 2} to Level ${index})`}
                                              </CardDescription>
                                            </div>
                                          </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                          {/* Structure Name */}
                                          <div className="space-y-1.5">
                                            <Label htmlFor={`level-${index}-name`} className="text-xs">
                                              Level Name *
                                            </Label>
                                            <Input
                                              id={`level-${index}-name`}
                                              value={structure.name}
                                              onChange={(e) => {
                                                const newStructures = [...formData.hierarchyStructures]
                                                newStructures[index] = { ...structure, name: e.target.value }
                                                updateFormData('hierarchyStructures', newStructures)
                                              }}
                                              placeholder="e.g., Master Trust, Investor Trust, Project Trust"
                                              className="h-8 text-xs"
                                            />
                                          </div>

                                          {/* Waterfall Configuration */}
                                          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                                            <div className="flex items-start space-x-2">
                                              <Checkbox
                                                id={`level-${index}-waterfall`}
                                                checked={structure.applyWaterfall}
                                                onCheckedChange={(checked) => {
                                                  const newStructures = [...formData.hierarchyStructures]
                                                  newStructures[index] = {
                                                    ...structure,
                                                    applyWaterfall: checked as boolean,
                                                    waterfallAlgorithm: checked ? 'american' : null
                                                  }
                                                  updateFormData('hierarchyStructures', newStructures)
                                                }}
                                              />
                                              <div className="flex-1">
                                                <Label htmlFor={`level-${index}-waterfall`} className="cursor-pointer text-xs font-medium">
                                                  Apply Waterfall at This Level
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                  {index === formData.hierarchyLevels - 1
                                                    ? 'Enable if investors participate at this level (property/investment level)'
                                                    : 'Calculate distributions using waterfall algorithm before passing to next level'}
                                                </p>
                                              </div>
                                            </div>

                                            {structure.applyWaterfall && (
                                              <div className="space-y-2 pl-6 pt-2">
                                                <div className="space-y-1.5">
                                                  <Label htmlFor={`level-${index}-algorithm`} className="text-xs">
                                                    Waterfall Algorithm
                                                  </Label>
                                                  <RadioGroup
                                                    value={structure.waterfallAlgorithm || 'american'}
                                                    onValueChange={(value) => {
                                                      const newStructures = [...formData.hierarchyStructures]
                                                      newStructures[index] = {
                                                        ...structure,
                                                        waterfallAlgorithm: value as 'american' | 'european'
                                                      }
                                                      updateFormData('hierarchyStructures', newStructures)
                                                    }}
                                                  >
                                                    <div className="flex items-center space-x-2">
                                                      <RadioGroupItem value="american" id={`level-${index}-american`} />
                                                      <Label htmlFor={`level-${index}-american`} className="cursor-pointer text-xs font-normal">
                                                        American (deal-by-deal)
                                                      </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                      <RadioGroupItem value="european" id={`level-${index}-european`} />
                                                      <Label htmlFor={`level-${index}-european`} className="cursor-pointer text-xs font-normal">
                                                        European (whole fund)
                                                      </Label>
                                                    </div>
                                                  </RadioGroup>
                                                </div>

                                                {/* Cascade Calculation Order Info */}
                                                <Alert className="bg-amber-50 border-amber-200">
                                                  <Info className="h-3 w-3 text-amber-600" />
                                                  <AlertDescription className="text-xs text-amber-800">
                                                    <strong>Cascade Order:</strong> Waterfall will calculate at this level, then distribute to {
                                                      index === 0
                                                        ? 'investors'
                                                        : `Level ${index} before flowing upward`
                                                    }. Income flows from bottom to top.
                                                  </AlertDescription>
                                                </Alert>
                                              </div>
                                            )}
                                          </div>

                                          {/* Economic Terms Configuration */}
                                          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                                            <div className="flex items-start space-x-2">
                                              <Checkbox
                                                id={`level-${index}-economic`}
                                                checked={structure.applyEconomicTerms}
                                                onCheckedChange={(checked) => {
                                                  const newStructures = [...formData.hierarchyStructures]
                                                  newStructures[index] = { ...structure, applyEconomicTerms: checked as boolean }
                                                  updateFormData('hierarchyStructures', newStructures)
                                                }}
                                              />
                                              <div className="flex-1">
                                                <Label htmlFor={`level-${index}-economic`} className="cursor-pointer text-xs font-medium">
                                                  Apply Economic Terms at This Level
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                  {index === formData.hierarchyLevels - 1
                                                    ? 'Enable if investors will participate at this level (property/investment level)'
                                                    : 'Calculate management fees, performance fees, and carry at this level'}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Income Flow Direction */}
                                          <div className="pt-2 border-t border-muted">
                                            <p className="text-xs text-muted-foreground">
                                              <strong>Income Flow:</strong> {
                                                index === formData.hierarchyLevels - 1
                                                  ? '💰 Income enters here from properties/investments'
                                                  : index === 0
                                                  ? `⬆️ Receives from Level ${index + 2} → Distributes to investors`
                                                  : `⬆️ Receives from Level ${index + 2} → Flows to Level ${index}`
                                              }
                                            </p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {formData.hierarchySetupApproach === 'incremental' && (
                              <Alert className="bg-primary/5 border-primary/30">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <AlertDescription className="text-xs text-primary/80">
                                  <strong>Incremental Mode:</strong> This structure will be created as standalone. You can link it to parent or child structures later from the Structures page.
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
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
                    </SelectContent>
                  </Select>
                </div>

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
                      <SelectItem value="fundraising">Fundraising</SelectItem>
                      <SelectItem value="investment">Investment Period</SelectItem>
                      <SelectItem value="management">Management/Hold</SelectItem>
                      <SelectItem value="exit">Exit/Distribution</SelectItem>
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

                    <div className="space-y-2">
                      <Label>Fund Type</Label>
                      <RadioGroup
                        value={formData.fundType}
                        onValueChange={(value) => updateFormData('fundType', value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="closed-end" id="closed-end" />
                          <Label htmlFor="closed-end">Closed-End (Standard)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="open-end" id="open-end" />
                          <Label htmlFor="open-end">Open-End (Rare)</Label>
                        </div>
                      </RadioGroup>
                    </div>
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
                      value={formData.totalCapitalCommitment ? parseFloat(formData.totalCapitalCommitment.replace(/,/g, '')).toLocaleString() : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, '')
                        if (rawValue === '' || !isNaN(parseFloat(rawValue))) {
                          updateFormData('totalCapitalCommitment', rawValue)
                        }
                      }}
                    />
                  </div>
                </div>

                {currentTier && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900">
                      {currentTier.name} Plan
                      {currentTier.badge && (
                        <Badge className="ml-2 bg-primary">{currentTier.badge}</Badge>
                      )}
                    </AlertTitle>
                    <AlertDescription className="text-blue-700 space-y-2">
                      <p>{currentTier.description}</p>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                        <div>
                          <strong>Max AUM:</strong> ${(currentTier.maxAUM / 1000000).toFixed(0)}M
                        </div>
                        <div>
                          <strong>Max Investors:</strong> {currentTier.maxInvestors}
                        </div>
                        <div>
                          <strong>Max Issuances:</strong> {currentTier.maxIssuances}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Conditional: Show Investment & Financing Configuration for all except Private Debt */}
                {features.distributionType !== 'interest-only' && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-4">
                  <h4 className="font-medium text-sm text-primary">Investment & Financing Configuration</h4>

                  <div className="space-y-2">
                    <Label htmlFor="plannedInvestments">
                      How many investments/properties will this structure hold? *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Number of properties, projects, or companies you plan to invest in</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="plannedInvestments"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={formData.plannedInvestments}
                      onChange={(e) => updateFormData('plannedInvestments', e.target.value)}
                    />
                  </div>

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
                          <p className="text-xs text-gray-500">1 issuance per investment</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="debt" id="debt" />
                        <div>
                          <Label htmlFor="debt" className="cursor-pointer font-medium">Debt Only</Label>
                          <p className="text-xs text-gray-500">1 issuance per investment</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="mixed" id="mixed" />
                        <div>
                          <Label htmlFor="mixed" className="cursor-pointer font-medium">Mixed (Equity + Debt)</Label>
                          <p className="text-xs text-gray-500">2 issuances per investment (one for equity, one for debt)</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <Alert className="border-primary/30 bg-white">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Calculated Token Issuances</AlertTitle>
                    <AlertDescription className="text-primary/80">
                      <p className="font-medium">Total Issuances: {calculatedIssuances}</p>
                      <p className="text-xs mt-1">
                        {formData.plannedInvestments} investment(s) × {formData.financingStrategy === 'mixed' ? '2' : '1'}
                        {formData.financingStrategy === 'mixed' ? ' (equity + debt)' : ` (${formData.financingStrategy} only)`}
                      </p>
                      {currentTier && calculatedIssuances > currentTier.maxIssuances && currentTier.maxIssuances !== Infinity && (
                        <p className="text-xs mt-2 text-orange-600">
                          ⚠️ You'll have {calculatedIssuances - currentTier.maxIssuances} issuances above your plan limit.
                          Additional cost: ${(calculatedIssuances - currentTier.maxIssuances) * 3000} one-time
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
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
                  {currentTier && parseInt(formData.totalInvestors) > currentTier.maxInvestors && currentTier.maxInvestors !== Infinity && (
                    <p className="text-sm text-orange-600">
                      ⚠️ You'll have {parseInt(formData.totalInvestors) - currentTier.maxInvestors} investors above your plan limit.
                      Additional cost: ${(parseInt(formData.totalInvestors) - currentTier.maxInvestors) * currentTier.additionalInvestorCost}/month
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minCheckSize">Minimum Check Size *</Label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs">
                        {formData.currency}
                      </span>
                      <Input
                        id="minCheckSize"
                        type="text"
                        placeholder="50,000"
                        className="rounded-l-none"
                        value={formData.minCheckSize ? parseFloat(formData.minCheckSize.replace(/,/g, '')).toLocaleString() : ''}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/,/g, '')
                          if (rawValue === '' || !isNaN(parseFloat(rawValue))) {
                            updateFormData('minCheckSize', rawValue)
                          }
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxCheckSize">Maximum Check Size *</Label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs">
                        {formData.currency}
                      </span>
                      <Input
                        id="maxCheckSize"
                        type="text"
                        placeholder="150,000"
                        className="rounded-l-none"
                        value={formData.maxCheckSize ? parseFloat(formData.maxCheckSize.replace(/,/g, '')).toLocaleString() : ''}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/,/g, '')
                          if (rawValue === '' || !isNaN(parseFloat(rawValue))) {
                            updateFormData('maxCheckSize', rawValue)
                          }
                        }}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              )
            })()}

            {/* STEP 4: Economic Terms (V3 ENHANCED) */}
            {currentStep === 4 && (() => {
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

                    {/* CSV Format Note */}
                    <div className="text-xs text-green-700 bg-green-100/50 p-3 rounded border border-green-200">
                      <p className="font-semibold mb-1">CSV Format Notes:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li><span className="font-medium">investor_type</span>: Individual, Institution, Family Office, or Fund of Funds</li>
                        <li><span className="font-medium">hierarchy_level</span>: 1-N for multi-level structures, or 0 if hierarchy is not enabled</li>
                      </ul>
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
                ) : (
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
                        <SelectItem value="waterfall">Waterfall Distribution (2-20 Structure)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      {formData.distributionModel === 'simple' && 'Profits distributed proportionally based on ownership percentage'}
                      {formData.distributionModel === 'waterfall' && 'Complex waterfall with management fees, performance fees, hurdle rates'}
                    </p>
                  </div>
                )}

                {/* Conditional: Show waterfall config if waterfall model selected */}
                {formData.distributionModel === 'waterfall' && (
                <>
                <div className="space-y-2">
                  <Label htmlFor="waterfallStructure">Waterfall Structure *</Label>
                  <Select
                    value={formData.waterfallStructure}
                    onValueChange={(value) => updateFormData('waterfallStructure', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="american">American (Deal-by-Deal)</SelectItem>
                      <SelectItem value="european">European (Whole Fund)</SelectItem>
                      <SelectItem value="custom">Custom Tiers</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    {formData.waterfallStructure === 'american' && 'Distributions calculated per deal/asset'}
                    {formData.waterfallStructure === 'european' && 'Distributions calculated on total fund performance'}
                    {formData.waterfallStructure === 'custom' && 'Custom tiered structure based on performance'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <p className="text-xs text-gray-500">Annual % of AUM</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="performanceFee">Performance Fee / Carry (%)</Label>
                    <Input
                      id="performanceFee"
                      type="number"
                      step="0.1"
                      placeholder="20.0"
                      value={formData.performanceFee}
                      onChange={(e) => updateFormData('performanceFee', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">% of profits above hurdle</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hurdleRate">Hurdle Rate (%)</Label>
                    <Input
                      id="hurdleRate"
                      type="number"
                      step="0.1"
                      placeholder="8.0"
                      value={formData.hurdleRate}
                      onChange={(e) => updateFormData('hurdleRate', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Minimum return before carry</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredReturn">Preferred Return (%)</Label>
                    <Input
                      id="preferredReturn"
                      type="number"
                      step="0.1"
                      placeholder="8.0"
                      value={formData.preferredReturn}
                      onChange={(e) => updateFormData('preferredReturn', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Annual preferred return to LPs</p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-sm text-yellow-900 mb-2">Standard 2-and-20 Structure</h4>
                  <p className="text-xs text-yellow-700">
                    Most funds use 2% management fee + 20% performance fee above an 8% hurdle rate.
                    Adjust based on your investor negotiations and market standards.
                  </p>
                </div>
                </>
                )}

                {/* Information alert for Simple Distribution Model - only for non-private-debt */}
                {formData.distributionModel === 'simple' && formData.structureType !== 'private-debt' && (
                  <Alert className="border-primary/30 bg-white">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Simplified Distribution Model</AlertTitle>
                    <AlertDescription className="text-primary/80">
                      <p className="mb-2">
                        This structure uses a simple pro-rata distribution model rather than complex waterfall distributions.
                      </p>
                      <p className="text-sm">
                        Profits are distributed proportionally to each investor based on their ownership percentage.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* V5: ILPA Performance Methodology Selector */}
                <div className="mt-8 p-6 bg-purple-50 rounded-lg border-2 border-purple-200 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">ILPA Performance Reporting Methodology</h4>
                  </div>
                  <p className="text-sm text-purple-700 mb-4">
                    Select how you will calculate gross performance for investor reporting. This follows ILPA (Institutional Limited Partners Association) standards.
                  </p>

                  {/* Decision Tree Explanation */}
                  <div className="bg-white p-4 rounded-lg border border-purple-200 space-y-3">
                    <h5 className="font-semibold text-purple-900 text-sm">Understanding the Methodologies</h5>
                    <div className="space-y-3 text-xs text-purple-700">
                      <div className="p-3 bg-purple-50/50 rounded">
                        <p className="font-semibold mb-1">Granular Methodology (Most Detailed)</p>
                        <p>Use when you track detailed capital calls where the specific purpose (management fees, investment financing, etc.) is known at the time of each capital call. This provides the most accurate Fund-to-Investor cash flow performance.</p>
                      </div>
                      <div className="p-3 bg-purple-50/50 rounded">
                        <p className="font-semibold mb-1">Gross Up Methodology (Simplified)</p>
                        <p>Use when capital call purposes are not tracked in detail, or when you calculate performance at the Portfolio-Level (Fund-to-Investment cash flows). Management fees and expenses are grossed up in the calculation.</p>
                      </div>
                    </div>
                  </div>

                  {/* Calculation Level Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium text-purple-900">
                      Where do you calculate "Gross Performance"?
                    </Label>
                    <RadioGroup
                      value={formData.calculationLevel}
                      onValueChange={(value) => {
                        updateFormData('calculationLevel', value)
                        // Auto-select methodology based on level
                        if (value === 'portfolio-level') {
                          updateFormData('performanceMethodology', 'grossup')
                        }
                      }}
                    >
                      <div className="flex items-start space-x-2 p-3 border border-purple-200 rounded-lg hover:bg-purple-50/50 cursor-pointer">
                        <RadioGroupItem value="fund-level" id="fund-level" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="fund-level" className="cursor-pointer font-medium text-purple-900">
                            Fund-Level (Fund-to-Investor cash flows)
                          </Label>
                          <p className="text-xs text-purple-700 mt-1">
                            Track cash flows between fund and investors. Requires detailed capital call tracking.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2 p-3 border border-purple-200 rounded-lg hover:bg-purple-50/50 cursor-pointer">
                        <RadioGroupItem value="portfolio-level" id="portfolio-level" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="portfolio-level" className="cursor-pointer font-medium text-purple-900">
                            Portfolio-Level (Fund-to-Investment cash flows)
                          </Label>
                          <p className="text-xs text-purple-700 mt-1">
                            Track cash flows between fund and investments. Simpler, uses Gross Up methodology.
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Conditional: If Fund-Level, ask about detailed capital calls */}
                  {formData.calculationLevel === 'fund-level' && (
                    <div className="space-y-3 pl-4 border-l-4 border-purple-300">
                      <Label className="text-base font-medium text-purple-900">
                        Do you track detailed capital calls?
                      </Label>
                      <p className="text-xs text-purple-700">
                        Do you call capital specifically to pay management fees, finance an investment, and is the use known at the time of the capital call?
                      </p>
                      <RadioGroup
                        value={formData.performanceMethodology}
                        onValueChange={(value) => updateFormData('performanceMethodology', value)}
                      >
                        <div className="flex items-start space-x-2 p-3 border border-purple-200 rounded-lg hover:bg-purple-50/50 cursor-pointer">
                          <RadioGroupItem value="granular" id="granular" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="granular" className="cursor-pointer font-medium text-purple-900">
                              Yes - Use Granular Methodology
                            </Label>
                            <p className="text-xs text-purple-700 mt-1">
                              Detailed tracking of capital call purposes. Most accurate for performance reporting.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2 p-3 border border-purple-200 rounded-lg hover:bg-purple-50/50 cursor-pointer">
                          <RadioGroupItem value="grossup" id="grossup-fund" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="grossup-fund" className="cursor-pointer font-medium text-purple-900">
                              No - Use Gross Up Methodology
                            </Label>
                            <p className="text-xs text-purple-700 mt-1">
                              Simplified calculation. Suitable when capital call purposes aren't tracked in detail.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Show selected methodology */}
                  {formData.performanceMethodology && (
                    <Alert className="border-purple-300 bg-white">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" />
                      <AlertTitle className="text-purple-900">Selected Methodology</AlertTitle>
                      <AlertDescription className="text-purple-700">
                        <p className="font-medium">
                          {formData.performanceMethodology === 'granular' ? 'Granular Methodology' : 'Gross Up Methodology'}
                        </p>
                        <p className="text-sm mt-1">
                          {formData.performanceMethodology === 'granular'
                            ? 'You will track detailed capital call purposes for accurate performance calculations based on Fund-to-Investor cash flows.'
                            : 'You will use simplified performance calculations. Management fees and expenses will be grossed up.'}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              )
            })()}

            {/* STEP 5: Distribution & Tax */}
            {currentStep === 5 && (
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
                      <SelectItem value="on-exit">On Exit Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultTaxRate">
                    Default Tax Rate (%)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="inline-block ml-1 h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Corporate tax rate for {formData.jurisdiction}</p>
                          <p className="text-xs mt-1">Individual investors will have different rates based on nationality</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    step="0.1"
                    placeholder="25.0"
                    value={formData.defaultTaxRate}
                    onChange={(e) => updateFormData('defaultTaxRate', e.target.value)}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm text-blue-900">Investor-Level Tax Configuration</h4>
                  <p className="text-xs text-blue-700">
                    Individual investor tax rates will be configured during investor onboarding based on:
                  </p>
                  <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                    <li>Investor nationality</li>
                    <li>Investor type (Individual, Institutional, Pension, Family Office)</li>
                    <li>Negotiated terms for large tickets</li>
                  </ul>
                </div>

                {additionalCosts && (
                  <Alert className="border-primary/20 bg-primary/5">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Pricing Summary</AlertTitle>
                    <AlertDescription className="text-primary/80 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Monthly Base Fee:</strong></div>
                        <div>${additionalCosts.baseMonthlyCost.toLocaleString()}</div>

                        {additionalCosts.additionalAUMCost > 0 && (
                          <>
                            <div><strong>+ AUM Overage:</strong></div>
                            <div>${additionalCosts.additionalAUMCost.toLocaleString()}/month</div>
                          </>
                        )}

                        {additionalCosts.additionalInvestorCost > 0 && (
                          <>
                            <div><strong>+ Investor Overage:</strong></div>
                            <div>${additionalCosts.additionalInvestorCost.toLocaleString()}/month</div>
                          </>
                        )}

                        <div className="col-span-2 border-t border-primary/30 my-1"></div>

                        <div><strong>Total Monthly:</strong></div>
                        <div className="font-bold">${additionalCosts.totalMonthlyCost.toLocaleString()}/month</div>

                        <div className="col-span-2 border-t border-primary/30 my-1"></div>

                        <div><strong>One-Time Setup Fee:</strong></div>
                        <div className="font-bold">${additionalCosts.totalSetupCost.toLocaleString()}</div>
                      </div>

                      {additionalCosts.additionalIssuanceCost > 0 && (
                        <p className="text-xs mt-2">
                          * Includes ${additionalCosts.additionalIssuanceCost.toLocaleString()} for {calculatedIssuances - currentTier!.maxIssuances} additional issuance(s)
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="p-4 bg-green-50 rounded-lg space-y-4">
                  <h4 className="font-medium text-sm text-green-900">Capital Call Configuration</h4>
                  <p className="text-xs text-green-700 mb-3">
                    Set default parameters for capital calls. These can be adjusted for individual calls.
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capitalCallNoticePeriod" className="text-xs">
                        Notice Period (Days)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="inline-block ml-1 h-3 w-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Days notice before capital is due</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Input
                        id="capitalCallNoticePeriod"
                        type="number"
                        placeholder="10"
                        value={formData.capitalCallNoticePeriod}
                        onChange={(e) => updateFormData('capitalCallNoticePeriod', e.target.value)}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capitalCallDefaultPercentage" className="text-xs">
                        Default Call %
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="inline-block ml-1 h-3 w-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>% of commitment typically called</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Input
                        id="capitalCallDefaultPercentage"
                        type="number"
                        placeholder="25"
                        value={formData.capitalCallDefaultPercentage}
                        onChange={(e) => updateFormData('capitalCallDefaultPercentage', e.target.value)}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capitalCallPaymentDeadline" className="text-xs">
                        Payment Deadline (Days)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="inline-block ml-1 h-3 w-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Days to wire funds after call</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Input
                        id="capitalCallPaymentDeadline"
                        type="number"
                        placeholder="15"
                        value={formData.capitalCallPaymentDeadline}
                        onChange={(e) => updateFormData('capitalCallPaymentDeadline', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Document Upload */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Document Upload Requirements</AlertTitle>
                  <AlertDescription className="text-blue-700 text-sm">
                    Upload relevant documents for your structure. Accepted formats: PDF, DOCX, XLSX. Maximum file size: 10MB per file.
                  </AlertDescription>
                </Alert>

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

                {/* Fund-Related Documents Section */}
                <div className="p-4 bg-primary/5 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h4 className="font-medium text-sm text-primary">Fund-Related Documents</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Upload documents related to your fund structure (e.g., PPM, LPA, Operating Agreement, Formation Documents)
                  </p>

                  <div className="space-y-3">
                    <Label htmlFor="fundDocuments" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors">
                        <div className="flex flex-col items-center justify-center text-center">
                          <DollarSign className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Click to upload fund documents
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

                        // Store valid files in state
                        const newDocs = files.map(f => ({ name: f.name, addedAt: new Date() }))
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

                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-medium">Suggested documents:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Private Placement Memorandum (PPM)</li>
                      <li>Limited Partnership Agreement (LPA)</li>
                      <li>Operating Agreement</li>
                      <li>Formation Documents</li>
                      <li>Subscription Agreement Template</li>
                    </ul>
                  </div>
                </div>

                {/* Investor-Related Documents Section */}
                <div className="p-4 bg-green-50 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-green-700" />
                    <h4 className="font-medium text-sm text-green-900">Investor-Related Documents</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Upload documents for investor onboarding (e.g., KYC forms, subscription agreements, investor questionnaires)
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

                        // Store valid files in state
                        const newDocs = files.map(f => ({ name: f.name, addedAt: new Date() }))
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

                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-medium">Suggested documents:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Investor Questionnaire</li>
                      <li>Accreditation Verification Form</li>
                      <li>W-8/W-9 Tax Forms</li>
                      <li>Wire Instructions Template</li>
                    </ul>
                    <p className="text-xs text-gray-600 italic mt-2">
                      Note: KYC/AML verification is included in Polibit's automated investor onboarding process
                    </p>
                  </div>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700 text-xs">
                    <strong>Note:</strong> Document upload is optional during initial setup. You can always upload or update documents later from your dashboard.
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Finalizing Setup...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          Need help? Visit the <span className="text-primary font-medium">Get Help</span> tab in the navigation menu
        </div>
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
