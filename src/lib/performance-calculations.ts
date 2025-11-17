// ILPA Performance Calculations
// Implements both Granular and Gross Up methodologies for fund performance reporting

import type { PerformanceMethodology, CalculationLevel } from './types'

/**
 * Granular Methodology
 *
 * Use when detailed capital call tracking is available.
 * Tracks Fund-to-Investor cash flows with specific purposes.
 *
 * Formula:
 * Gross Performance = (Distributions + NAV - Invested Capital) / Invested Capital
 * Where:
 * - Invested Capital = Total capital calls for investments (excludes management fees)
 * - Distributions = Total distributions to investors
 * - NAV = Current Net Asset Value
 */

interface GranularInputs {
  totalCapitalCalls: number           // Total capital called from investors
  managementFeeCalls: number          // Capital calls specifically for management fees
  investmentCalls: number             // Capital calls specifically for investments
  totalDistributions: number          // Total distributions to investors
  currentNAV: number                  // Current Net Asset Value
}

export function calculateGranularPerformance(inputs: GranularInputs) {
  const {
    totalCapitalCalls,
    managementFeeCalls,
    investmentCalls,
    totalDistributions,
    currentNAV,
  } = inputs

  // Invested Capital = Investment-specific capital calls only
  const investedCapital = investmentCalls

  // Gross Performance calculation
  const grossGain = totalDistributions + currentNAV - investedCapital
  const grossPerformancePercent = investedCapital > 0
    ? (grossGain / investedCapital) * 100
    : 0

  // Gross Multiple (MOIC)
  const grossMultiple = investedCapital > 0
    ? (totalDistributions + currentNAV) / investedCapital
    : 0

  // Net Performance (after fees)
  const netInvestedCapital = totalCapitalCalls // Includes fees
  const netGain = totalDistributions + currentNAV - netInvestedCapital
  const netPerformancePercent = netInvestedCapital > 0
    ? (netGain / netInvestedCapital) * 100
    : 0

  const netMultiple = netInvestedCapital > 0
    ? (totalDistributions + currentNAV) / netInvestedCapital
    : 0

  return {
    methodology: 'granular' as PerformanceMethodology,
    investedCapital,
    managementFees: managementFeeCalls,
    totalCapitalCalls,
    totalDistributions,
    currentNAV,
    grossGain,
    grossPerformancePercent,
    grossMultiple,
    netInvestedCapital,
    netGain,
    netPerformancePercent,
    netMultiple,
    breakdown: {
      investmentCapital: investmentCalls,
      managementFees: managementFeeCalls,
      distributions: totalDistributions,
      unrealizedValue: currentNAV,
    }
  }
}

/**
 * Gross Up Methodology
 *
 * Use when detailed capital call purposes are not tracked.
 * Can be used for both Fund-Level and Portfolio-Level calculations.
 *
 * Formula:
 * Gross Performance = (Distributions + NAV) / Invested Capital - 1
 * Invested Capital (Grossed Up) = Called Capital + Estimated Fees
 *
 * Where:
 * - Called Capital = Total capital calls to investors
 * - Estimated Fees = Management fees estimated based on AUM and fee percentage
 * - Distributions = Total distributions
 * - NAV = Current Net Asset Value
 */

interface GrossUpInputs {
  totalCapitalCalls: number           // Total capital called from investors
  totalDistributions: number          // Total distributions to investors
  currentNAV: number                  // Current Net Asset Value
  managementFeePercent: number        // Annual management fee % (e.g., 2.0 for 2%)
  fundAgeYears: number                // Years since fund inception
  averageAUM?: number                 // Average AUM over fund life (optional, defaults to current NAV)
}

export function calculateGrossUpPerformance(inputs: GrossUpInputs) {
  const {
    totalCapitalCalls,
    totalDistributions,
    currentNAV,
    managementFeePercent,
    fundAgeYears,
    averageAUM,
  } = inputs

  // Estimate management fees over fund life
  const estimatedAUM = averageAUM || currentNAV
  const estimatedManagementFees = estimatedAUM * (managementFeePercent / 100) * fundAgeYears

  // Grossed Up Invested Capital
  const grossedUpInvestedCapital = totalCapitalCalls + estimatedManagementFees

  // Gross Performance calculation
  const grossGain = totalDistributions + currentNAV - grossedUpInvestedCapital
  const grossPerformancePercent = grossedUpInvestedCapital > 0
    ? (grossGain / grossedUpInvestedCapital) * 100
    : 0

  // Gross Multiple (MOIC)
  const grossMultiple = grossedUpInvestedCapital > 0
    ? (totalDistributions + currentNAV) / grossedUpInvestedCapital
    : 0

  // Net Performance (as reported to LPs)
  const netInvestedCapital = totalCapitalCalls
  const netGain = totalDistributions + currentNAV - netInvestedCapital
  const netPerformancePercent = netInvestedCapital > 0
    ? (netGain / netInvestedCapital) * 100
    : 0

  const netMultiple = netInvestedCapital > 0
    ? (totalDistributions + currentNAV) / netInvestedCapital
    : 0

  return {
    methodology: 'grossup' as PerformanceMethodology,
    investedCapital: grossedUpInvestedCapital,
    estimatedManagementFees,
    totalCapitalCalls,
    totalDistributions,
    currentNAV,
    grossGain,
    grossPerformancePercent,
    grossMultiple,
    netInvestedCapital,
    netGain,
    netPerformancePercent,
    netMultiple,
    breakdown: {
      calledCapital: totalCapitalCalls,
      estimatedFees: estimatedManagementFees,
      distributions: totalDistributions,
      unrealizedValue: currentNAV,
    }
  }
}

/**
 * Portfolio-Level Performance
 *
 * Calculates performance at the portfolio level (Fund-to-Investment).
 * Always uses Gross Up methodology.
 *
 * Tracks cash flows between fund and investments (not investors).
 */

interface PortfolioLevelInputs {
  totalInvestedInPortfolio: number    // Total capital deployed to investments
  totalReturnsFromPortfolio: number   // Total returns from investments (realized + unrealized)
  currentPortfolioValue: number       // Current value of all investments
  managementFeePercent: number        // Annual management fee %
  fundAgeYears: number                // Years since fund inception
  averageAUM?: number                 // Average AUM over fund life
}

export function calculatePortfolioLevelPerformance(inputs: PortfolioLevelInputs) {
  const {
    totalInvestedInPortfolio,
    totalReturnsFromPortfolio,
    currentPortfolioValue,
    managementFeePercent,
    fundAgeYears,
    averageAUM,
  } = inputs

  // Estimate management fees over fund life
  const estimatedAUM = averageAUM || currentPortfolioValue
  const estimatedManagementFees = estimatedAUM * (managementFeePercent / 100) * fundAgeYears

  // Grossed Up Invested Capital
  const grossedUpInvestedCapital = totalInvestedInPortfolio + estimatedManagementFees

  // Gross Performance calculation
  const grossGain = totalReturnsFromPortfolio + currentPortfolioValue - grossedUpInvestedCapital
  const grossPerformancePercent = grossedUpInvestedCapital > 0
    ? (grossGain / grossedUpInvestedCapital) * 100
    : 0

  // Gross Multiple (MOIC)
  const grossMultiple = grossedUpInvestedCapital > 0
    ? (totalReturnsFromPortfolio + currentPortfolioValue) / grossedUpInvestedCapital
    : 0

  return {
    methodology: 'grossup' as PerformanceMethodology,
    calculationLevel: 'portfolio-level' as CalculationLevel,
    investedCapital: grossedUpInvestedCapital,
    estimatedManagementFees,
    totalInvestedInPortfolio,
    totalReturnsFromPortfolio,
    currentPortfolioValue,
    grossGain,
    grossPerformancePercent,
    grossMultiple,
    breakdown: {
      portfolioInvestment: totalInvestedInPortfolio,
      estimatedFees: estimatedManagementFees,
      portfolioReturns: totalReturnsFromPortfolio,
      unrealizedValue: currentPortfolioValue,
    }
  }
}

/**
 * Fund-Level Performance
 *
 * Calculates performance at the fund level (Fund-to-Investor).
 * Can use either Granular or Gross Up methodology.
 */

interface FundLevelInputs {
  methodology: PerformanceMethodology
  totalCapitalCalls: number
  managementFeeCalls?: number         // Required for Granular
  investmentCalls?: number            // Required for Granular
  totalDistributions: number
  currentNAV: number
  managementFeePercent?: number       // Required for Gross Up
  fundAgeYears?: number               // Required for Gross Up
  averageAUM?: number                 // Optional for Gross Up
}

export function calculateFundLevelPerformance(inputs: FundLevelInputs) {
  if (inputs.methodology === 'granular') {
    if (inputs.managementFeeCalls === undefined || inputs.investmentCalls === undefined) {
      throw new Error('Granular methodology requires managementFeeCalls and investmentCalls')
    }

    return calculateGranularPerformance({
      totalCapitalCalls: inputs.totalCapitalCalls,
      managementFeeCalls: inputs.managementFeeCalls,
      investmentCalls: inputs.investmentCalls,
      totalDistributions: inputs.totalDistributions,
      currentNAV: inputs.currentNAV,
    })
  } else {
    // Gross Up
    if (inputs.managementFeePercent === undefined || inputs.fundAgeYears === undefined) {
      throw new Error('Gross Up methodology requires managementFeePercent and fundAgeYears')
    }

    return calculateGrossUpPerformance({
      totalCapitalCalls: inputs.totalCapitalCalls,
      totalDistributions: inputs.totalDistributions,
      currentNAV: inputs.currentNAV,
      managementFeePercent: inputs.managementFeePercent,
      fundAgeYears: inputs.fundAgeYears,
      averageAUM: inputs.averageAUM,
    })
  }
}

/**
 * Calculate IRR (Internal Rate of Return)
 *
 * Uses Newton-Raphson method to find the discount rate that makes NPV = 0.
 * Works for both methodologies.
 */

interface CashFlow {
  date: Date
  amount: number  // Negative for calls, positive for distributions
}

export function calculateIRR(cashFlows: CashFlow[]): number {
  if (cashFlows.length < 2) return 0

  // Sort cash flows by date
  const sortedFlows = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime())
  const firstDate = sortedFlows[0].date.getTime()

  // Convert dates to years from first cash flow
  const flows = sortedFlows.map(cf => ({
    years: (cf.date.getTime() - firstDate) / (365.25 * 24 * 60 * 60 * 1000),
    amount: cf.amount,
  }))

  // Newton-Raphson method
  let rate = 0.1 // Initial guess: 10%
  const maxIterations = 100
  const tolerance = 0.0001

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let npvDerivative = 0

    for (const flow of flows) {
      const factor = Math.pow(1 + rate, flow.years)
      npv += flow.amount / factor
      npvDerivative -= flow.amount * flow.years / (factor * (1 + rate))
    }

    if (Math.abs(npv) < tolerance) {
      return rate * 100 // Convert to percentage
    }

    rate = rate - npv / npvDerivative
  }

  return rate * 100 // Convert to percentage
}

/**
 * Calculate DPI (Distributions to Paid-In Capital)
 */
export function calculateDPI(totalDistributions: number, totalCapitalCalls: number): number {
  return totalCapitalCalls > 0 ? totalDistributions / totalCapitalCalls : 0
}

/**
 * Calculate RVPI (Residual Value to Paid-In Capital)
 */
export function calculateRVPI(currentNAV: number, totalCapitalCalls: number): number {
  return totalCapitalCalls > 0 ? currentNAV / totalCapitalCalls : 0
}

/**
 * Calculate TVPI (Total Value to Paid-In Capital)
 * TVPI = DPI + RVPI
 */
export function calculateTVPI(totalDistributions: number, currentNAV: number, totalCapitalCalls: number): number {
  return totalCapitalCalls > 0 ? (totalDistributions + currentNAV) / totalCapitalCalls : 0
}

/**
 * Helper: Calculate fund age in years
 */
export function calculateFundAgeYears(inceptionDate: Date): number {
  const now = new Date()
  const ageMs = now.getTime() - inceptionDate.getTime()
  return ageMs / (365.25 * 24 * 60 * 60 * 1000)
}

/**
 * Helper: Get methodology based on structure settings and calculation level
 */
export function determineMethodology(
  calculationLevel: CalculationLevel,
  detailedCapitalCalls: boolean
): PerformanceMethodology {
  if (calculationLevel === 'portfolio-level') {
    return 'grossup' // Always use gross up for portfolio-level
  }

  // Fund-level: Choose based on detailed tracking
  return detailedCapitalCalls ? 'granular' : 'grossup'
}
