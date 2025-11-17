import type { Investment, Investor, Report, InvestorAllocation, InvestorType } from './types'

/**
 * Calculate total fund NAV from all investment current values
 */
export function calculateFundNAV(investments: Investment[]): number {
  return investments.reduce(
    (sum, inv) => sum + inv.totalFundPosition.currentValue,
    0
  )
}

/**
 * Calculate average IRR across investments
 */
export function calculateAvgIRR(investments: Investment[]): number {
  if (investments.length === 0) return 0
  const totalIRR = investments.reduce(
    (sum, inv) => sum + inv.totalFundPosition.irr,
    0
  )
  return totalIRR / investments.length
}

/**
 * Calculate weighted average IRR across investments (weighted by total invested)
 */
export function calculateWeightedAvgIRR(investments: Investment[]): number {
  if (investments.length === 0) return 0

  let totalWeightedIRR = 0
  let totalInvested = 0

  investments.forEach(inv => {
    const invested = inv.totalFundPosition.totalInvested
    totalWeightedIRR += inv.totalFundPosition.irr * invested
    totalInvested += invested
  })

  return totalInvested > 0 ? totalWeightedIRR / totalInvested : 0
}

/**
 * Calculate total distributions to investors
 */
export function calculateTotalDistributions(investors: Investor[]): number {
  return investors.reduce(
    (sum, inv) => sum + inv.totalDistributed,
    0
  )
}

/**
 * Calculate total capital called from investors for a specific fund
 */
export function calculateTotalCalledCapital(investors: Investor[], fundId: string): number {
  return investors.reduce(
    (sum, inv) => sum + (inv.fundOwnerships?.find(fo => fo.fundId === fundId)?.calledCapital || 0),
    0
  )
}

/**
 * Calculate total committed capital from investors for a specific fund
 */
export function calculateTotalCommitment(investors: Investor[], fundId: string): number {
  return investors.reduce(
    (sum, inv) => sum + (inv.fundOwnerships?.find(fo => fo.fundId === fundId)?.commitment || 0),
    0
  )
}

/**
 * Calculate specific investor's share of a transaction based on ownership percentage for a specific fund
 */
export function calculateInvestorAllocation(
  investor: Investor,
  totalAmount: number,
  fundId: string
): number {
  const ownership = investor.fundOwnerships?.find(fo => fo.fundId === fundId)
  return ownership ? totalAmount * (ownership.ownershipPercent / 100) : 0
}

/**
 * Calculate capital call allocations for all investors for a specific fund
 */
export function calculateCapitalCallAllocations(
  investors: Investor[],
  totalAmount: number,
  fundId: string
): Array<{
  investorId: string
  investorName: string
  ownershipPercent: number
  amount: number
}> {
  return investors.map(investor => {
    const ownership = investor.fundOwnerships?.find(fo => fo.fundId === fundId)
    return {
      investorId: investor.id,
      investorName: investor.name,
      ownershipPercent: ownership?.ownershipPercent || 0,
      amount: calculateInvestorAllocation(investor, totalAmount, fundId)
    }
  })
}

/**
 * Calculate distribution allocations for all investors for a specific fund
 */
export function calculateDistributionAllocations(
  investors: Investor[],
  totalAmount: number,
  fundId: string
): Array<{
  investorId: string
  investorName: string
  ownershipPercent: number
  amount: number
}> {
  // Same calculation as capital calls for now
  // In future, could add waterfall logic here
  return calculateCapitalCallAllocations(investors, totalAmount, fundId)
}

/**
 * Generate detailed investor allocations for Capital Call reports for a specific fund
 */
export function generateCapitalCallAllocations(
  investors: Investor[],
  totalAmount: number,
  fundId: string,
  status: 'Pending' | 'Paid' | 'Overdue' | 'Processing' = 'Pending'
): InvestorAllocation[] {
  return investors.map(investor => {
    const ownership = investor.fundOwnerships?.find(fo => fo.fundId === fundId)
    return {
      investorId: investor.id,
      investorName: investor.name,
      investorType: investor.type,
      ownershipPercent: ownership?.ownershipPercent || 0,
      amount: calculateInvestorAllocation(investor, totalAmount, fundId),
      status
    }
  })
}

/**
 * Generate detailed investor allocations for Distribution reports for a specific fund
 */
export function generateDistributionAllocations(
  investors: Investor[],
  totalAmount: number,
  fundId: string,
  status: 'Pending' | 'Paid' | 'Overdue' | 'Processing' = 'Pending'
): InvestorAllocation[] {
  return investors.map(investor => {
    const ownership = investor.fundOwnerships?.find(fo => fo.fundId === fundId)
    return {
      investorId: investor.id,
      investorName: investor.name,
      investorType: investor.type,
      ownershipPercent: ownership?.ownershipPercent || 0,
      amount: calculateInvestorAllocation(investor, totalAmount, fundId),
      status
    }
  })
}

/**
 * Calculate aggregate investment metrics for a set of investments
 */
export function calculateInvestmentMetrics(investments: Investment[]): {
  totalInvested: number
  currentValue: number
  unrealizedGain: number
  avgIRR: number
  weightedAvgIRR: number
  avgMultiple: number
} {
  const totalInvested = investments.reduce(
    (sum, inv) => sum + inv.totalFundPosition.totalInvested,
    0
  )
  const currentValue = calculateFundNAV(investments)
  const unrealizedGain = currentValue - totalInvested

  const avgMultiple = totalInvested > 0 ? currentValue / totalInvested : 0

  return {
    totalInvested,
    currentValue,
    unrealizedGain,
    avgIRR: calculateAvgIRR(investments),
    weightedAvgIRR: calculateWeightedAvgIRR(investments),
    avgMultiple
  }
}

/**
 * Calculate aggregate investor metrics for a set of investors for a specific fund
 */
export function calculateInvestorMetrics(investors: Investor[], fundId: string): {
  totalCommitment: number
  totalCalledCapital: number
  totalUncalledCapital: number
  totalCurrentValue: number
  totalUnrealizedGain: number
  totalDistributed: number
  avgIRR: number
} {
  const totalCommitment = calculateTotalCommitment(investors, fundId)
  const totalCalledCapital = calculateTotalCalledCapital(investors, fundId)
  const totalUncalledCapital = totalCommitment - totalCalledCapital

  const totalCurrentValue = investors.reduce(
    (sum, inv) => sum + inv.currentValue,
    0
  )

  const totalUnrealizedGain = investors.reduce(
    (sum, inv) => sum + inv.unrealizedGain,
    0
  )

  const totalDistributed = calculateTotalDistributions(investors)

  const avgIRR = investors.length > 0
    ? investors.reduce((sum, inv) => sum + inv.irr, 0) / investors.length
    : 0

  return {
    totalCommitment,
    totalCalledCapital,
    totalUncalledCapital,
    totalCurrentValue,
    totalUnrealizedGain,
    totalDistributed,
    avgIRR
  }
}

/**
 * Validate report metrics against calculated values
 */
export function validateReportMetrics(
  report: Report,
  investments: Investment[],
  investors: Investor[]
): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  calculatedMetrics: {
    totalAUM: number
    avgIRR: number
    totalDistributions: number
  }
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Filter to only included investments/investors
  const filteredInvestments = investments.filter(inv =>
    report.includesInvestments.includes(inv.id)
  )
  const filteredInvestors = investors.filter(inv =>
    report.includesInvestors.includes(inv.id)
  )

  // Calculate actual metrics
  const calculatedAUM = calculateFundNAV(filteredInvestments)
  const calculatedIRR = calculateAvgIRR(filteredInvestments)
  const calculatedDistributions = calculateTotalDistributions(filteredInvestors)

  // Validate AUM (allow $1000 rounding tolerance)
  const aumDiff = Math.abs(report.metrics.totalAUM - calculatedAUM)
  if (aumDiff > 1000) {
    errors.push(
      `AUM mismatch: reported $${report.metrics.totalAUM.toLocaleString()}, calculated $${calculatedAUM.toLocaleString()} (diff: $${aumDiff.toLocaleString()})`
    )
  } else if (aumDiff > 0) {
    warnings.push(
      `Minor AUM difference: $${aumDiff.toLocaleString()} (within tolerance)`
    )
  }

  // Validate IRR (allow 0.1% rounding tolerance)
  const irrDiff = Math.abs(report.metrics.avgIRR - calculatedIRR)
  if (irrDiff > 0.1) {
    errors.push(
      `IRR mismatch: reported ${report.metrics.avgIRR.toFixed(1)}%, calculated ${calculatedIRR.toFixed(1)}% (diff: ${irrDiff.toFixed(1)}%)`
    )
  }

  // Validate distributions (allow $1000 rounding tolerance)
  const distDiff = Math.abs(report.metrics.totalDistributions - calculatedDistributions)
  if (distDiff > 1000) {
    errors.push(
      `Distributions mismatch: reported $${report.metrics.totalDistributions.toLocaleString()}, calculated $${calculatedDistributions.toLocaleString()} (diff: $${distDiff.toLocaleString()})`
    )
  } else if (distDiff > 0) {
    warnings.push(
      `Minor distributions difference: $${distDiff.toLocaleString()} (within tolerance)`
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    calculatedMetrics: {
      totalAUM: calculatedAUM,
      avgIRR: calculatedIRR,
      totalDistributions: calculatedDistributions
    }
  }
}

/**
 * Generate corrected report metrics based on actual data for a specific fund
 */
export function generateReportMetrics(
  investments: Investment[],
  investors: Investor[],
  fundId: string
): {
  totalAUM: number
  avgIRR: number
  weightedAvgIRR: number
  totalInvested: number
  unrealizedGain: number
  totalDistributions: number
  totalCommitment: number
  totalCalledCapital: number
} {
  const investmentMetrics = calculateInvestmentMetrics(investments)
  const investorMetrics = calculateInvestorMetrics(investors, fundId)

  return {
    totalAUM: investmentMetrics.currentValue,
    avgIRR: investmentMetrics.avgIRR,
    weightedAvgIRR: investmentMetrics.weightedAvgIRR,
    totalInvested: investmentMetrics.totalInvested,
    unrealizedGain: investmentMetrics.unrealizedGain,
    totalDistributions: investorMetrics.totalDistributed,
    totalCommitment: investorMetrics.totalCommitment,
    totalCalledCapital: investorMetrics.totalCalledCapital
  }
}
