/**
 * ILPA Fee Calculations Library
 *
 * Implements ILPA-compliant fee calculations for capital calls and distributions.
 * Supports:
 * - Management fee calculation (on committed, invested, or NIC + unfunded)
 * - VAT calculation with exemptions
 * - Per-investor fee discounts
 * - Balance continuity validation
 */

import type { ManagementFeeBase, FundOwnership, FeeConfiguration } from './types'
import { formatCurrencyDetailed as formatCurrency } from '@/lib/format-utils'

// ============================================================================
// INTERFACES
// ============================================================================

export interface InvestorBalances {
  commitment: number
  calledCapital: number
  uncalledCapital: number
  distributions: number
  netAssetValue: number
}

export interface FeeCalculationInput {
  // Investor details
  investorId: string
  investorName: string
  ownership: FundOwnership

  // Call details
  callAmount: number        // Pro-rata principal being called
  callDate: string

  // Fund fee configuration
  feeConfig: FeeConfiguration

  // Period for management fee calculation
  feeStartDate?: string
  feeEndDate?: string
  feePeriod?: 'quarterly' | 'annual' | 'semi-annual'
}

export interface FeeCalculationResult {
  // Input reference
  investorId: string
  investorName: string

  // Principal
  callAmount: number

  // Management Fee Calculation
  managementFeeBase: number       // The base amount used for calculation
  managementFeeBaseType: ManagementFeeBase
  managementFeeRate: number       // Applied rate (after discount)
  managementFeeGross: number      // Before discount
  feeDiscount: number             // Discount amount
  managementFeeNet: number        // After discount

  // Dual-rate breakdown (Proximity Parks)
  nicFeeAmount?: number           // NIC-specific fee
  unfundedFeeAmount?: number      // Unfunded-specific fee
  feeOffsetAmount?: number        // GP fee offset
  deemedGpContribution?: number   // Negative of fee offset

  // VAT
  vatApplicable: boolean
  vatRate: number
  vatAmount: number

  // Total
  totalDue: number

  // Balance continuity
  priorUncalled: number
  newUncalled: number

  // Breakdown for ILPA notice
  breakdown: {
    label: string
    amount: number
    description?: string
  }[]
}

export interface DistributionCalculationInput {
  investorId: string
  investorName: string
  ownership: FundOwnership

  // Distribution details
  totalDistribution: number
  distributionDate: string

  // Source breakdown
  returnOfCapital: number
  income: number
  capitalGain: number

  // Fund configuration
  feeConfig: FeeConfiguration

  // Waterfall results (if applicable)
  waterfallAllocation?: {
    lpShare: number
    gpShare: number
    carriedInterest: number
  }
}

export interface DistributionCalculationResult {
  investorId: string
  investorName: string

  // Gross allocation
  grossAllocation: number
  ownershipPercent: number

  // Breakdown
  returnOfCapital: number
  income: number
  capitalGain: number

  // After waterfall
  lpAllocation: number
  carriedInterestDeducted: number

  // Tax
  taxWithheld: number
  taxRate: number

  // Net
  netDistribution: number

  // Balance update
  priorDistributions: number
  newTotalDistributions: number
}

// ============================================================================
// FEE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate management fee base amount based on fee base type
 */
export function calculateManagementFeeBase(
  ownership: FundOwnership,
  feeBaseType: ManagementFeeBase
): number {
  const commitment = ownership.commitment || 0
  const calledCapital = ownership.calledCapital || 0
  const uncalledCapital = ownership.uncalledCapital || (commitment - calledCapital)

  switch (feeBaseType) {
    case 'committed':
      // Fee on total commitment (traditional)
      return commitment

    case 'invested':
      // Fee only on deployed capital
      return calledCapital

    case 'nic_plus_unfunded':
      // ILPA standard: Net Invested Capital + Remaining Unfunded
      // NIC = Called Capital - Distributions + Unrealized Gains/Losses
      // For simplicity, we use Called Capital + Unfunded = Commitment
      // This is the most investor-friendly interpretation
      return calledCapital + uncalledCapital

    default:
      return commitment
  }
}

/**
 * Calculate management fee for a period
 */
export function calculateManagementFee(
  feeBase: number,
  annualRate: number,
  period: 'quarterly' | 'annual' | 'semi-annual' = 'quarterly',
  discountPercent: number = 0
): { gross: number; discount: number; net: number } {
  // Convert annual rate to period rate
  let periodRate: number
  switch (period) {
    case 'quarterly':
      periodRate = annualRate / 4
      break
    case 'semi-annual':
      periodRate = annualRate / 2
      break
    case 'annual':
    default:
      periodRate = annualRate
  }

  // Calculate gross fee
  const gross = feeBase * (periodRate / 100)

  // Apply discount
  const discount = gross * (discountPercent / 100)
  const net = gross - discount

  return { gross, discount, net }
}

/**
 * Calculate VAT on management fee
 */
export function calculateVAT(
  feeAmount: number,
  vatRate: number,
  isExempt: boolean = false
): number {
  if (isExempt || vatRate <= 0) {
    return 0
  }
  return feeAmount * (vatRate / 100)
}

/**
 * Calculate dual-rate management fee (Proximity Parks model)
 * Applies separate rates to NIC and Unfunded bases
 */
export function calculateDualRateManagementFee(
  ownership: FundOwnership,
  feeRateOnNic: number,
  feeRateOnUnfunded: number,
  period: 'quarterly' | 'annual' | 'semi-annual' = 'quarterly',
  feeDiscountRate: number = 0,
  gpPercentage: number = 0
): {
  nicFee: number
  unfundedFee: number
  gross: number
  feeOffset: number
  net: number
  deemedGpContribution: number
} {
  // Period fraction
  let periodFraction = 1.0
  if (period === 'quarterly') periodFraction = 0.25
  else if (period === 'semi-annual') periodFraction = 0.5

  const commitment = ownership.commitment || 0
  const calledCapital = ownership.calledCapital || 0
  const unfundedCommitment = commitment - calledCapital

  // NIC = called capital (what's been invested)
  const nicBase = calledCapital
  const unfundedBase = unfundedCommitment

  // Fee discount is subtracted from the rate per Proximity formula
  const effectiveNicRate = Math.max(0, feeRateOnNic - feeDiscountRate)
  const effectiveUnfundedRate = Math.max(0, feeRateOnUnfunded - feeDiscountRate)

  const nicFee = nicBase * periodFraction * (effectiveNicRate / 100)
  const unfundedFee = unfundedBase * periodFraction * (effectiveUnfundedRate / 100)
  const gross = nicFee + unfundedFee

  // Fee offset based on GP percentage
  const feeOffset = gpPercentage > 0 ? gross * (gpPercentage / 100) : 0
  const net = gross - feeOffset
  const deemedGpContribution = -feeOffset

  return { nicFee, unfundedFee, gross, feeOffset, net, deemedGpContribution }
}

/**
 * Calculate complete fee breakdown for a capital call
 */
export function calculateCapitalCallFees(input: FeeCalculationInput): FeeCalculationResult {
  const {
    investorId,
    investorName,
    ownership,
    callAmount,
    feeConfig,
    feePeriod = 'quarterly'
  } = input

  // Get investor-specific overrides
  const feeDiscountPercent = ownership.feeDiscount || 0
  const isVatExempt = ownership.vatExempt || false

  // Balance continuity
  const priorUncalled = ownership.uncalledCapital || 0
  const newUncalled = priorUncalled - callAmount

  // Check if we should use dual-rate mode (Proximity Parks)
  const isDualRateMode = feeConfig.managementFeeBase === 'nic_plus_unfunded' &&
    (feeConfig.feeRateOnNic != null || feeConfig.feeRateOnUnfunded != null)

  if (isDualRateMode) {
    // DUAL-RATE MODE (Proximity Parks)
    const dualFee = calculateDualRateManagementFee(
      ownership,
      feeConfig.feeRateOnNic || 0,
      feeConfig.feeRateOnUnfunded || 0,
      feePeriod,
      feeDiscountPercent,
      feeConfig.gpPercentage || 0
    )

    // Calculate VAT on net fee
    const vatAmount = calculateVAT(
      dualFee.net,
      feeConfig.vatRate,
      isVatExempt || !feeConfig.vatApplicable
    )

    const totalDue = callAmount + dualFee.net + vatAmount

    // Build breakdown
    const breakdown: FeeCalculationResult['breakdown'] = [
      {
        label: 'Capital Call (Principal)',
        amount: callAmount,
        description: 'Pro-rata share of fund capital call'
      },
      {
        label: `NIC Fee (${feePeriod})`,
        amount: dualFee.nicFee,
        description: `${feeConfig.feeRateOnNic}% on Net Invested Capital${feeDiscountPercent > 0 ? ` (${feeDiscountPercent}pp discount)` : ''}`
      },
      {
        label: `Unfunded Fee (${feePeriod})`,
        amount: dualFee.unfundedFee,
        description: `${feeConfig.feeRateOnUnfunded}% on Unfunded Commitment${feeDiscountPercent > 0 ? ` (${feeDiscountPercent}pp discount)` : ''}`
      }
    ]

    if (dualFee.feeOffset > 0) {
      breakdown.push({
        label: 'GP Fee Offset',
        amount: -dualFee.feeOffset,
        description: `${feeConfig.gpPercentage}% GP fee offset`
      })
    }

    if (vatAmount > 0) {
      breakdown.push({
        label: `VAT (${feeConfig.vatRate}%)`,
        amount: vatAmount,
        description: 'Value Added Tax on net management fee'
      })
    }

    breakdown.push({
      label: 'Total Due',
      amount: totalDue,
      description: 'Total amount to be wired'
    })

    return {
      investorId,
      investorName,
      callAmount,
      managementFeeBase: (ownership.commitment || 0),
      managementFeeBaseType: feeConfig.managementFeeBase,
      managementFeeRate: feeConfig.feeRateOnNic || 0,
      managementFeeGross: dualFee.gross,
      feeDiscount: dualFee.feeOffset,
      managementFeeNet: dualFee.net,
      nicFeeAmount: dualFee.nicFee,
      unfundedFeeAmount: dualFee.unfundedFee,
      feeOffsetAmount: dualFee.feeOffset,
      deemedGpContribution: dualFee.deemedGpContribution,
      vatApplicable: feeConfig.vatApplicable && !isVatExempt,
      vatRate: feeConfig.vatRate,
      vatAmount,
      totalDue,
      priorUncalled,
      newUncalled,
      breakdown
    }
  }

  // SINGLE-RATE MODE (legacy, unchanged)
  const managementFeeBase = calculateManagementFeeBase(ownership, feeConfig.managementFeeBase)

  // Calculate management fee
  const managementFee = calculateManagementFee(
    managementFeeBase,
    feeConfig.managementFeeRate,
    feePeriod,
    feeDiscountPercent
  )

  // Calculate VAT
  const vatAmount = calculateVAT(
    managementFee.net,
    feeConfig.vatRate,
    isVatExempt || !feeConfig.vatApplicable
  )

  // Calculate total due
  const totalDue = callAmount + managementFee.net + vatAmount

  // Build breakdown for ILPA notice
  const breakdown: FeeCalculationResult['breakdown'] = [
    {
      label: 'Capital Call (Principal)',
      amount: callAmount,
      description: `Pro-rata share of fund capital call`
    },
    {
      label: `Management Fee (${feePeriod})`,
      amount: managementFee.net,
      description: `${feeConfig.managementFeeRate}% on ${formatFeeBase(feeConfig.managementFeeBase)}${feeDiscountPercent > 0 ? ` (${feeDiscountPercent}% discount applied)` : ''}`
    }
  ]

  if (vatAmount > 0) {
    breakdown.push({
      label: `VAT (${feeConfig.vatRate}%)`,
      amount: vatAmount,
      description: 'Value Added Tax on management fee'
    })
  }

  breakdown.push({
    label: 'Total Due',
    amount: totalDue,
    description: 'Total amount to be wired'
  })

  return {
    investorId,
    investorName,
    callAmount,
    managementFeeBase,
    managementFeeBaseType: feeConfig.managementFeeBase,
    managementFeeRate: feeConfig.managementFeeRate,
    managementFeeGross: managementFee.gross,
    feeDiscount: managementFee.discount,
    managementFeeNet: managementFee.net,
    vatApplicable: feeConfig.vatApplicable && !isVatExempt,
    vatRate: feeConfig.vatRate,
    vatAmount,
    totalDue,
    priorUncalled,
    newUncalled,
    breakdown
  }
}

/**
 * Validate balance continuity
 * Ensures: Prior Unfunded - Call Amount = New Unfunded
 */
export function validateBalanceContinuity(
  priorUncalled: number,
  callAmount: number,
  newUncalled: number,
  tolerance: number = 0.01 // Allow for rounding errors
): { valid: boolean; discrepancy: number; message?: string } {
  const expected = priorUncalled - callAmount
  const discrepancy = Math.abs(expected - newUncalled)

  if (discrepancy <= tolerance) {
    return { valid: true, discrepancy: 0 }
  }

  return {
    valid: false,
    discrepancy,
    message: `Balance continuity error: Expected ${formatCurrency(expected)}, got ${formatCurrency(newUncalled)}. Discrepancy: ${formatCurrency(discrepancy)}`
  }
}

/**
 * Calculate distribution allocation for an investor
 */
export function calculateDistributionAllocation(
  input: DistributionCalculationInput
): DistributionCalculationResult {
  const {
    investorId,
    investorName,
    ownership,
    totalDistribution,
    returnOfCapital,
    income,
    capitalGain,
    feeConfig,
    waterfallAllocation
  } = input

  const ownershipPercent = ownership.ownershipPercent || 0

  // Calculate gross allocation based on ownership
  const grossAllocation = totalDistribution * (ownershipPercent / 100)

  // Pro-rata breakdown
  const totalSource = returnOfCapital + income + capitalGain
  const rocRatio = totalSource > 0 ? returnOfCapital / totalSource : 0
  const incomeRatio = totalSource > 0 ? income / totalSource : 0
  const gainRatio = totalSource > 0 ? capitalGain / totalSource : 0

  const investorROC = grossAllocation * rocRatio
  const investorIncome = grossAllocation * incomeRatio
  const investorGain = grossAllocation * gainRatio

  // Apply waterfall if provided
  let lpAllocation = grossAllocation
  let carriedInterestDeducted = 0

  if (waterfallAllocation) {
    lpAllocation = waterfallAllocation.lpShare
    carriedInterestDeducted = waterfallAllocation.carriedInterest
  }

  // Calculate tax withholding (simplified - would need tax rules per jurisdiction)
  const taxRate = 0 // TODO: Implement based on investor tax status
  const taxWithheld = lpAllocation * (taxRate / 100)

  // Net distribution
  const netDistribution = lpAllocation - taxWithheld

  // Update distribution totals
  const priorDistributions = ownership.balanceHistory?.length > 0
    ? ownership.balanceHistory[ownership.balanceHistory.length - 1].distributions
    : 0
  const newTotalDistributions = priorDistributions + netDistribution

  return {
    investorId,
    investorName,
    grossAllocation,
    ownershipPercent,
    returnOfCapital: investorROC,
    income: investorIncome,
    capitalGain: investorGain,
    lpAllocation,
    carriedInterestDeducted,
    taxWithheld,
    taxRate,
    netDistribution,
    priorDistributions,
    newTotalDistributions
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatFeeBase(base: ManagementFeeBase): string {
  switch (base) {
    case 'committed':
      return 'Committed Capital'
    case 'invested':
      return 'Invested Capital'
    case 'nic_plus_unfunded':
      return 'NIC + Unfunded'
    default:
      return base
  }
}


/**
 * Calculate pro-rata allocation for a capital call
 */
export function calculateProRataAllocation(
  totalCallAmount: number,
  investorCommitment: number,
  totalFundCommitment: number
): number {
  if (totalFundCommitment <= 0) return 0
  return totalCallAmount * (investorCommitment / totalFundCommitment)
}

/**
 * Generate summary statistics for a capital call
 */
export function generateCallSummary(
  results: FeeCalculationResult[]
): {
  totalPrincipal: number
  totalManagementFees: number
  totalVAT: number
  totalDue: number
  investorCount: number
} {
  return {
    totalPrincipal: results.reduce((sum, r) => sum + r.callAmount, 0),
    totalManagementFees: results.reduce((sum, r) => sum + r.managementFeeNet, 0),
    totalVAT: results.reduce((sum, r) => sum + r.vatAmount, 0),
    totalDue: results.reduce((sum, r) => sum + r.totalDue, 0),
    investorCount: results.length
  }
}

export default {
  calculateManagementFeeBase,
  calculateManagementFee,
  calculateDualRateManagementFee,
  calculateVAT,
  calculateCapitalCallFees,
  validateBalanceContinuity,
  calculateDistributionAllocation,
  calculateProRataAllocation,
  generateCallSummary
}
