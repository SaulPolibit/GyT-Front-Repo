// Core data models for Polibit Investment Manager

export type InvestmentType = 'Real Estate' | 'Private Equity' | 'Private Debt'
export type InvestmentStatus = 'Active' | 'Closed' | 'Pending' | 'Exited'
export type AssetSector =
  // Real Estate
  | 'Multifamily' | 'Office' | 'Retail' | 'Industrial' | 'Hospitality' | 'Mixed-Use'
  // Private Equity
  | 'Software' | 'Healthcare' | 'Financial Services' | 'Consumer' | 'Manufacturing'
  // Private Debt
  | 'Senior Debt' | 'Mezzanine' | 'Subordinated' | 'Bridge Loan'

export type InvestorType = 'individual' | 'institution' | 'family-office' | 'fund-of-funds'
export type InvestorStatus =
  | 'Pending'      // Pre-registered, no action yet
  | 'KYC/KYB'      // Onboarding: Identity verification stage
  | 'Contracts'    // Onboarding: Contract signing stage
  | 'Commitment'   // Onboarding: Capital commitment setup stage
  | 'Active'       // Fully onboarded and investing
  | 'Inactive'     // Previously active, now inactive
export type K1Status = 'Not Started' | 'In Progress' | 'Completed' | 'Delivered' | 'Amended'

export type ReportType = 'Quarterly' | 'Annual' | 'Monthly' | 'Custom' | 'Capital Call' | 'Distribution' | 'ILPA Performance' | 'ILPA Reporting'
export type ReportStatus = 'Draft' | 'In Review' | 'Published' | 'Sent'

// ILPA Performance Methodology
export type PerformanceMethodology = 'granular' | 'grossup'
export type CalculationLevel = 'fund-level' | 'portfolio-level'

// Capital Call & Distribution Types
export type CapitalCallStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Fully Paid' | 'Overdue' | 'Cancelled'
export type DistributionStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed'
export type DistributionSource = 'Operating Income' | 'Exit Proceeds' | 'Refinancing' | 'Return of Capital' | 'Other'

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Covenant {
  type: string
  threshold: number
  currentValue: number
  status: 'Compliant' | 'Warning' | 'Violation'
}

export interface ExternalDebt {
  id: string
  lender: string
  principal: number
  interestRate: number
  maturityDate: string
  covenants: Covenant[]
}

export interface Document {
  id: string
  name: string
  type: string
  url: string
  uploadedDate: string
  uploadedBy: string
}

// Fund-based Investment Model
export interface Investment {
  id: string
  name: string
  type: InvestmentType
  status: InvestmentStatus
  sector: AssetSector
  investmentType: 'EQUITY' | 'DEBT' | 'MIXED'

  // Asset Value (different depending on investment type)
  totalPropertyValue?: number  // For Real Estate
  totalCompanyValue?: number   // For Private Equity
  totalProjectValue?: number   // For Private Debt

  // Geography
  geography: {
    country: string
    state: string
    city: string
  }
  address?: Address

  // Fund's Equity Position (null if pure debt)
  fundEquityPosition: {
    ownershipPercent: number
    equityInvested: number
    currentEquityValue: number
    unrealizedGain: number
  } | null

  // Fund's Debt Position (null if pure equity)
  fundDebtPosition: {
    principalProvided: number
    interestRate: number
    originationDate: string
    maturityDate: string
    accruedInterest: number
    currentDebtValue: number
    unrealizedGain: number
  } | null

  // External Debt (borrowed BY the investment entity, not provided by fund)
  externalDebt: ExternalDebt[]

  // Total Fund Position
  totalFundPosition: {
    totalInvested: number
    currentValue: number
    unrealizedGain: number
    irr: number
    multiple: number
  }

  // Additional Fund Commitment Tracking
  totalInvestmentSize?: number  // Total size of the investment opportunity
  fundCommitment?: number       // Fund's total commitment to this investment
  ownershipPercentage?: number  // Fund's ownership percentage (from fundEquityPosition if available)

  // Visibility & Access Control
  visibility?: {
    type: 'public' | 'fund-specific' | 'private'
    fundId?: string           // If fund-specific, which fund
    allowedInvestorIds?: string[]  // If private, whitelist of investor IDs
  }

  // Metadata
  fundId: string
  acquisitionDate: string
  lastValuationDate: string
  description: string
  documents: Document[]
  createdAt: string
  updatedAt: string
}

// Fund-based Investor Model
export interface Investor {
  id: string
  name: string
  email: string
  phone?: string
  type: InvestorType
  status: InvestorStatus

  // Entity-specific fields (for institution, family-office, fund-of-funds)
  entityName?: string
  entityType?: string
  contactFirstName?: string
  contactLastName?: string

  // Fund Ownerships (investors can own shares in multiple funds/structures)
  fundOwnerships: {
    fundId: string
    fundName: string
    commitment: number
    ownershipPercent: number
    calledCapital: number
    uncalledCapital: number
    hierarchyLevel?: number  // Which level (1-N) investor participates in this structure
    investedDate: string     // When investor committed to this structure
    onboardingStatus?: InvestorStatus  // Per-structure onboarding status (overrides global status if present)
    // Custom Economic Terms (per structure - overrides fund-level terms for THIS structure only)
    customTerms?: {
      managementFee?: number
      performanceFee?: number
      hurdleRate?: number
      preferredReturn?: number
    }
  }[]

  // @deprecated - Use fundOwnerships[].customTerms instead for per-structure terms
  // Global custom terms (for backwards compatibility only)
  customTerms?: {
    managementFee?: number
    performanceFee?: number
    hurdleRate?: number
    preferredReturn?: number
  }

  // Performance Metrics (calculated from fund ownership)
  currentValue: number
  unrealizedGain: number
  totalDistributed: number
  netCashFlow: number
  irr: number

  // Tax
  taxId?: string
  k1Status: K1Status
  k1DeliveryDate?: string

  // Contact
  address?: Address
  preferredContactMethod: 'Email' | 'Phone' | 'Portal'
  lastContactDate?: string
  notes: string

  // Documents
  documents: Document[]

  // Metadata
  investorSince: string
  createdAt: string
  updatedAt: string
}

// Investor Allocation (for Capital Calls and Distributions)
export interface InvestorAllocation {
  investorId: string
  investorName: string
  investorType: InvestorType
  ownershipPercent: number
  amount: number
  status?: 'Pending' | 'Paid' | 'Overdue' | 'Processing'
  paidDate?: string
  paymentMethod?: string
  transactionReference?: string
}

// Report Model
export interface Report {
  id: string
  title: string
  type: ReportType
  status: ReportStatus

  // Period
  periodStart: string
  periodEnd: string
  generatedDate: string
  publishedDate?: string

  // Content
  includesInvestments: string[] // Investment IDs
  includesInvestors: string[] // Investor IDs

  // Metrics
  metrics: {
    totalAUM: number
    totalInvestments: number
    totalInvestors: number
    avgIRR: number
    totalDistributions: number
  }

  // Capital Call Specific Fields (only for type: 'Capital Call')
  capitalCall?: {
    totalCallAmount: number
    callNumber: number
    dueDate: string
    purpose: string
    relatedInvestmentId?: string
    relatedInvestmentName?: string
    investorAllocations: InvestorAllocation[]
  }

  // Distribution Specific Fields (only for type: 'Distribution')
  distribution?: {
    totalDistributionAmount: number
    distributionNumber: number
    distributionDate: string
    source: string // e.g., "Operating Income", "Exit Proceeds", "Refinancing"
    relatedInvestmentId?: string
    relatedInvestmentName?: string
    investorAllocations: InvestorAllocation[]
  }

  // Files
  pdfUrl?: string
  excelUrl?: string

  // Recipients
  sentTo: {
    investorId: string
    investorName: string
    sentDate: string
    opened: boolean
  }[]

  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
}

// Transaction Model (for capital calls, distributions, etc.)
export interface Transaction {
  id: string
  type: 'Capital Call' | 'Distribution' | 'Contribution' | 'Withdrawal'
  amount: number
  date: string
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed'

  // Related entities
  investmentId?: string
  investorId?: string
  fundId: string

  // Details
  description: string
  dueDate?: string
  completedDate?: string

  // Payment
  paymentMethod?: string
  transactionReference?: string

  // Metadata
  createdAt: string
  updatedAt: string
}

// Fund Model
export interface Fund {
  id: string
  name: string
  fundNumber: string
  type: string  // Multi-Strategy or specific type

  // Financial
  totalCommittedCapital: number
  totalDeployed: number
  deploymentRate: number
  remainingCapital: number

  // Structure
  managementFeePercent: number
  carriedInterestPercent: number
  hurdleRate: number

  // Dates
  inceptionDate: string
  status: 'Fundraising' | 'Investing' | 'Harvesting' | 'Closed'

  // Investors
  totalInvestors: number
  investorShares: {
    investorId: string
    investorName: string
    commitment: number
    ownershipPercent: number
    calledCapital: number
    uncalledCapital: number
  }[]

  // Additional
  notes: string

  // Metadata
  createdAt: string
  updatedAt: string
}

// Capital Call Model (ILPA-compliant)
export interface CapitalCall {
  id: string
  fundId: string
  fundName: string
  callNumber: number

  // Amounts
  totalCallAmount: number
  currency: string

  // Dates
  callDate: string
  dueDate: string
  noticePeriodDays: number  // Days between call date and due date

  // Purpose & Investment
  purpose: string
  relatedInvestmentId?: string
  relatedInvestmentName?: string

  // Status & Tracking
  status: CapitalCallStatus
  sentDate?: string

  // Investor Allocations
  investorAllocations: CapitalCallAllocation[]

  // Payment Summary
  totalPaidAmount: number
  totalOutstandingAmount: number

  // ILPA Template Fields
  transactionType: string  // Per ILPA CC&D Template
  useOfProceeds: string
  managementFeeIncluded: boolean
  managementFeeAmount?: number

  // Notice Template
  coverLetterTemplate?: string
  noticeDocumentUrl?: string

  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
  cancelledDate?: string
  cancelledReason?: string
}

// Capital Call Allocation (per investor)
export interface CapitalCallAllocation {
  investorId: string
  investorName: string
  investorType: InvestorType

  // Hierarchy Support (for multi-level structures)
  hierarchyLevel?: number  // Which level (1-N) this investor participates at

  // Allocation
  commitment: number
  ownershipPercent: number
  callAmount: number

  // Payment Tracking
  status: 'Pending' | 'Paid' | 'Overdue' | 'Partial'
  amountPaid: number
  amountOutstanding: number
  paidDate?: string

  // Payment Details
  paymentMethod?: string
  transactionReference?: string
  bankDetails?: string

  // Communication
  noticeSent: boolean
  noticeSentDate?: string
  noticeOpenedDate?: string

  // ILPA Fields
  calledCapitalToDate: number
  uncalledCapital: number
}

// Distribution Model (ILPA-compliant)
export interface Distribution {
  id: string
  fundId: string
  fundName: string
  distributionNumber: number

  // Amounts
  totalDistributionAmount: number
  currency: string

  // Dates
  distributionDate: string
  recordDate: string  // Date to determine eligible investors
  paymentDate: string  // Actual payment date

  // Source & Investment
  source: DistributionSource
  sourceDescription: string
  relatedInvestmentId?: string
  relatedInvestmentName?: string

  // Distribution Type
  isReturnOfCapital: boolean
  isIncome: boolean
  isCapitalGain: boolean

  // Breakdown (if applicable)
  returnOfCapitalAmount?: number
  incomeAmount?: number
  capitalGainAmount?: number

  // Status & Tracking
  status: DistributionStatus
  processedDate?: string

  // Investor Allocations (after waterfall)
  investorAllocations: DistributionAllocation[]

  // Waterfall Details
  waterfallApplied: boolean
  waterfallBreakdown?: {
    tier: string
    amount: number
    lpAmount: number
    gpAmount: number
  }[]

  // ILPA Template Fields
  transactionType: string
  exitProceedsMultiple?: number  // If from exit

  // Notice Template
  coverLetterTemplate?: string
  noticeDocumentUrl?: string

  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
}

// Distribution Allocation (per investor, after waterfall)
export interface DistributionAllocation {
  investorId: string
  investorName: string
  investorType: InvestorType

  // Allocation
  ownershipPercent: number
  baseAllocation: number  // Before waterfall
  finalAllocation: number  // After waterfall

  // Breakdown
  returnOfCapitalAmount?: number
  incomeAmount?: number
  capitalGainAmount?: number

  // Payment Tracking
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed'
  processedDate?: string

  // Payment Details
  paymentMethod?: string
  transactionReference?: string
  bankDetails?: string

  // Communication
  noticeSent: boolean
  noticeSentDate?: string

  // Tax Information
  taxWithheld?: number
  taxRate?: number

  // ILPA Fields
  distributionsToDate: number
  dpi?: number  // Distributions to Paid-In capital
}

// Investment Subscription Model (LP purchase intent for investments)
export interface InvestmentSubscription {
  id: string
  investmentId: string       // Link to Investment.id
  investorId: string        // Link to Investor.id
  fundId: string            // Link to Structure.id (from investment)

  // Requested Commitment
  requestedAmount: number    // Amount LP wants to commit
  currency: string

  // Status Tracking
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  approvalReason?: string    // Why approved/rejected

  // Dates
  createdAt: string
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string

  // Admin Notes
  adminNotes?: string

  // When approved, this subscription creates a fundOwnership entry
  linkedFundOwnershipCreated?: boolean
}
