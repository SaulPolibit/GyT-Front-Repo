/**
 * Investor Data Transform Utility
 *
 * Transforms API investor data (flat structure per user-structure allocation)
 * to the frontend expected format (investor with fundOwnerships array).
 *
 * API returns: One record per investor-structure allocation
 * Frontend expects: One investor with multiple fundOwnerships
 */

import type { Investor, FundOwnership, InvestorType, InvestorStatus } from './types'

/**
 * API Investor record structure (from GET /api/investors)
 */
export interface ApiInvestorRecord {
  id: string
  userId: string
  structureId: string
  investorType: string
  email: string
  phoneNumber?: string
  country?: string
  taxId?: string
  kycStatus?: string
  accreditedInvestor?: boolean
  // Individual fields
  fullName?: string
  // Institution fields
  institutionName?: string
  // Fund of Funds fields
  fundName?: string
  // Family Office fields
  officeName?: string
  familyName?: string
  // Allocation fields
  commitment?: number
  ownershipPercent?: number
  // ILPA Fee Settings
  feeDiscount?: number
  vatExempt?: boolean
  // Custom terms
  customTerms?: {
    managementFee?: number
    performanceFee?: number
    hurdleRate?: number
    preferredReturn?: number
  }
  // Nested user data from API
  user?: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    role?: number
    isActive?: boolean
  }
  // Nested structure data from API
  structure?: {
    id: string
    name: string
    type?: string
    status?: string
    baseCurrency?: string
  }
  createdAt?: string
  updatedAt?: string
}

/**
 * Get display name from API investor record
 */
function getInvestorName(record: ApiInvestorRecord): string {
  // Try user first/last name
  if (record.user?.firstName || record.user?.lastName) {
    return `${record.user.firstName || ''} ${record.user.lastName || ''}`.trim()
  }
  // Try individual full name
  if (record.fullName) return record.fullName
  // Try institution name
  if (record.institutionName) return record.institutionName
  // Try fund name
  if (record.fundName) return record.fundName
  // Try family office name
  if (record.officeName) return record.officeName
  // Fallback to email
  return record.email || 'Unknown Investor'
}

/**
 * Map API investor type to frontend type
 */
function mapInvestorType(apiType: string): InvestorType {
  const typeMap: Record<string, InvestorType> = {
    'individual': 'Individual',
    'institution': 'Institution',
    'fund-of-funds': 'Fund of Funds',
    'family-office': 'Family Office',
    'Individual': 'Individual',
    'Institution': 'Institution',
    'Fund of Funds': 'Fund of Funds',
    'Family Office': 'Family Office',
  }
  return typeMap[apiType] || 'Individual'
}

/**
 * Map KYC status to investor status
 */
function mapInvestorStatus(kycStatus?: string): InvestorStatus {
  if (!kycStatus) return 'Pending'
  const statusMap: Record<string, InvestorStatus> = {
    'approved': 'Active',
    'pending': 'Pending',
    'rejected': 'Inactive',
    'Approved': 'Active',
    'Pending': 'Pending',
    'Rejected': 'Inactive',
  }
  return statusMap[kycStatus] || 'Pending'
}

/**
 * Transform a single API investor record to a FundOwnership entry
 */
function toFundOwnership(record: ApiInvestorRecord): FundOwnership {
  return {
    fundId: record.structureId,
    fundName: record.structure?.name || 'Unknown Structure',
    investmentOrigin: 'CAPITAL',
    ownershipPercent: record.ownershipPercent || 0,
    investedDate: record.createdAt || new Date().toISOString(),
    commitment: record.commitment || 0,
    calledCapital: 0, // Will be calculated from capital calls
    uncalledCapital: record.commitment || 0,
    customTerms: record.customTerms,
    feeDiscount: record.feeDiscount,
    vatExempt: record.vatExempt,
  }
}

/**
 * Transform API investor records to frontend Investor format
 * Groups multiple records by user and creates fundOwnerships array
 *
 * @param apiRecords - Array of API investor records
 * @returns Array of transformed Investor objects with fundOwnerships
 */
export function transformApiInvestors(apiRecords: ApiInvestorRecord[]): Investor[] {
  if (!apiRecords || !Array.isArray(apiRecords)) return []

  // Group records by userId (or by id if no userId)
  const groupedByUser = new Map<string, ApiInvestorRecord[]>()

  apiRecords.forEach(record => {
    const key = record.userId || record.user?.id || record.id
    if (!groupedByUser.has(key)) {
      groupedByUser.set(key, [])
    }
    groupedByUser.get(key)!.push(record)
  })

  // Transform each group into an Investor with fundOwnerships
  const investors: Investor[] = []

  groupedByUser.forEach((records, userId) => {
    const firstRecord = records[0]

    // Build fundOwnerships from all records for this user
    const fundOwnerships: FundOwnership[] = records.map(toFundOwnership)

    // Calculate totals across all fund ownerships
    const totalCommitment = fundOwnerships.reduce((sum, fo) => sum + (fo.commitment || 0), 0)
    const totalCalledCapital = fundOwnerships.reduce((sum, fo) => sum + (fo.calledCapital || 0), 0)

    const investor: Investor = {
      id: userId,
      name: getInvestorName(firstRecord),
      email: firstRecord.user?.email || firstRecord.email || '',
      phone: firstRecord.phoneNumber,
      type: mapInvestorType(firstRecord.investorType),
      status: mapInvestorStatus(firstRecord.kycStatus),

      // Entity fields
      entityName: firstRecord.institutionName || firstRecord.fundName || firstRecord.officeName,
      entityType: firstRecord.investorType,

      // Fund ownerships
      fundOwnerships,

      // Custom terms from first record (for backwards compatibility)
      customTerms: firstRecord.customTerms,

      // Performance metrics (will be calculated elsewhere)
      currentValue: totalCalledCapital,
      unrealizedGain: 0,
      totalDistributed: 0,
      netCashFlow: 0,
      irr: 0,

      // Tax
      taxId: firstRecord.taxId,
      k1Status: 'Not Started',

      // Contact
      preferredContactMethod: 'Email',
      notes: '',

      // Timestamps
      createdAt: firstRecord.createdAt || new Date().toISOString(),
      updatedAt: firstRecord.updatedAt || new Date().toISOString(),
      investorSince: firstRecord.createdAt || new Date().toISOString(),
    }

    investors.push(investor)
  })

  return investors
}

/**
 * Transform API investor records for a specific structure
 * Returns investors filtered to only include the specified structure in fundOwnerships
 *
 * @param apiRecords - Array of API investor records (already filtered by structureId)
 * @returns Array of transformed Investor objects
 */
export function transformApiInvestorsForStructure(apiRecords: ApiInvestorRecord[]): Investor[] {
  if (!apiRecords || !Array.isArray(apiRecords)) return []

  return apiRecords.map(record => {
    const fundOwnership = toFundOwnership(record)

    const investor: Investor = {
      id: record.userId || record.user?.id || record.id,
      name: getInvestorName(record),
      email: record.user?.email || record.email || '',
      phone: record.phoneNumber,
      type: mapInvestorType(record.investorType),
      status: mapInvestorStatus(record.kycStatus),

      entityName: record.institutionName || record.fundName || record.officeName,
      entityType: record.investorType,

      fundOwnerships: [fundOwnership],

      customTerms: record.customTerms,

      currentValue: fundOwnership.calledCapital || 0,
      unrealizedGain: 0,
      totalDistributed: 0,
      netCashFlow: 0,
      irr: 0,

      taxId: record.taxId,
      k1Status: 'Not Started',

      preferredContactMethod: 'Email',
      notes: '',

      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: record.updatedAt || new Date().toISOString(),
      investorSince: record.createdAt || new Date().toISOString(),
    }

    return investor
  })
}
