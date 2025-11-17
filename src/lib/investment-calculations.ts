/**
 * Investment-based calculation formulas for reports
 * All report metrics are calculated from actual investment data
 */

export interface Investment {
  id: string
  totalFundPosition: {
    totalInvested: number
    currentValue: number
    irr: number
    multiple: number
  }
  acquisitionDate: string
  lastValuationDate: string
}

/**
 * Calculate investment value at a specific date using IRR compound growth
 * Formula: Value = Principal × (1 + IRR)^years
 */
export function calculateValueAtDate(
  investment: Investment,
  targetDate: string
): number {
  const acquisition = new Date(investment.acquisitionDate)
  const target = new Date(targetDate)
  const principal = investment.totalFundPosition.totalInvested
  const irr = investment.totalFundPosition.irr / 100 // Convert percentage to decimal

  // Calculate years elapsed (can be fractional)
  const yearsElapsed = (target.getTime() - acquisition.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  // Compound growth formula: FV = PV × (1 + r)^t
  const value = principal * Math.pow(1 + irr, yearsElapsed)

  return Math.round(value)
}

/**
 * Calculate total AUM for a report based on included investments
 * Formula: SUM(investment values at report date)
 */
export function calculateTotalAUM(
  investments: Investment[],
  includedInvestmentIds: string[],
  reportEndDate: string
): number {
  const includedInvestments = investments.filter(inv =>
    includedInvestmentIds.includes(inv.id)
  )

  const totalAUM = includedInvestments.reduce((sum, investment) => {
    return sum + calculateValueAtDate(investment, reportEndDate)
  }, 0)

  return Math.round(totalAUM)
}

/**
 * Calculate weighted average IRR for a report
 * Formula: (SUM(IRR × Investment Value)) / SUM(Investment Values)
 */
export function calculateWeightedAvgIRR(
  investments: Investment[],
  includedInvestmentIds: string[],
  reportEndDate: string
): number {
  const includedInvestments = investments.filter(inv =>
    includedInvestmentIds.includes(inv.id)
  )

  let totalWeightedIRR = 0
  let totalValue = 0

  includedInvestments.forEach(investment => {
    const value = calculateValueAtDate(investment, reportEndDate)
    const irr = investment.totalFundPosition.irr

    totalWeightedIRR += irr * value
    totalValue += value
  })

  // Weighted average: SUM(IRR × Value) / SUM(Value)
  const weightedAvgIRR = totalValue > 0 ? totalWeightedIRR / totalValue : 0

  return Math.round(weightedAvgIRR * 10) / 10 // Round to 1 decimal
}

/**
 * Calculate total unrealized gains for a report
 * Formula: SUM(Current Value - Total Invested) for all included investments
 */
export function calculateTotalUnrealizedGains(
  investments: Investment[],
  includedInvestmentIds: string[],
  reportEndDate: string
): number {
  const includedInvestments = investments.filter(inv =>
    includedInvestmentIds.includes(inv.id)
  )

  const totalGains = includedInvestments.reduce((sum, investment) => {
    const currentValue = calculateValueAtDate(investment, reportEndDate)
    const invested = investment.totalFundPosition.totalInvested
    return sum + (currentValue - invested)
  }, 0)

  return Math.round(totalGains)
}

/**
 * Calculate total invested capital for a report
 * Formula: SUM(totalInvested) for all included investments
 */
export function calculateTotalInvested(
  investments: Investment[],
  includedInvestmentIds: string[]
): number {
  const includedInvestments = investments.filter(inv =>
    includedInvestmentIds.includes(inv.id)
  )

  const totalInvested = includedInvestments.reduce((sum, investment) => {
    return sum + investment.totalFundPosition.totalInvested
  }, 0)

  return Math.round(totalInvested)
}

/**
 * Calculate portfolio multiple (MOIC - Multiple on Invested Capital)
 * Formula: Total Current Value / Total Invested
 */
export function calculatePortfolioMultiple(
  investments: Investment[],
  includedInvestmentIds: string[],
  reportEndDate: string
): number {
  const totalAUM = calculateTotalAUM(investments, includedInvestmentIds, reportEndDate)
  const totalInvested = calculateTotalInvested(investments, includedInvestmentIds)

  const multiple = totalInvested > 0 ? totalAUM / totalInvested : 0

  return Math.round(multiple * 100) / 100 // Round to 2 decimals
}

/**
 * Adjust AUM for distributions
 * Formula: Base AUM - Distributions
 *
 * Note: Capital calls are NOT added here because they are already reflected
 * in investment values when those investments are revalued at report date.
 * When capital is called and deployed into investments, the investment values
 * increase, which is captured in the base AUM calculation.
 *
 * Only distributions need to be subtracted because they represent cash
 * distributed out of the fund, reducing NAV.
 */
export function adjustAUMForTransactions(
  baseAUM: number,
  capitalCalls: number = 0,
  distributions: number = 0
): number {
  // Capital calls already reflected in investment values - don't double-count
  // Only subtract distributions (cash out)
  return Math.round(baseAUM - distributions)
}

/**
 * Calculate portfolio-level IRR considering cash flows
 * This is a simplified approximation - real IRR requires XIRR with dates
 * Formula: ((Current Value / Total Invested)^(1/years)) - 1
 */
export function calculatePortfolioIRR(
  investments: Investment[],
  includedInvestmentIds: string[],
  reportEndDate: string
): number {
  const includedInvestments = investments.filter(inv =>
    includedInvestmentIds.includes(inv.id)
  )

  if (includedInvestments.length === 0) return 0

  // Calculate weighted average holding period
  let totalWeightedPeriod = 0
  let totalValue = 0

  includedInvestments.forEach(investment => {
    const acquisition = new Date(investment.acquisitionDate)
    const target = new Date(reportEndDate)
    const years = (target.getTime() - acquisition.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    const value = calculateValueAtDate(investment, reportEndDate)

    totalWeightedPeriod += years * value
    totalValue += value
  })

  const avgYears = totalValue > 0 ? totalWeightedPeriod / totalValue : 0
  const multiple = calculatePortfolioMultiple(investments, includedInvestmentIds, reportEndDate)

  // IRR approximation: (Multiple^(1/years)) - 1
  const irr = avgYears > 0 ? (Math.pow(multiple, 1/avgYears) - 1) * 100 : 0

  return Math.round(irr * 10) / 10
}
