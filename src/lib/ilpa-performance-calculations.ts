import type { CapitalCall, Distribution, Investment, Structure } from './types'
import { getCapitalCallsByFundId } from './capital-calls-storage'
import { getDistributionsByFundId } from './distributions-storage'
import { getInvestmentsByFundId } from './investments-storage'

export interface CashFlow {
  date: string
  amount: number
  type: 'inflow' | 'outflow'
  description: string
  transactionType: string
}

export interface PerformanceMetrics {
  // Core Metrics
  irr: number // Internal Rate of Return (%)
  tvpi: number // Total Value to Paid-In (multiple)
  moic: number // Multiple on Invested Capital
  dpi: number // Distributions to Paid-In (multiple)
  rvpi: number // Residual Value to Paid-In (multiple)

  // Cash Flow Summary
  totalCapitalCalled: number
  totalDistributed: number
  totalInvested: number
  currentNAV: number
  totalValue: number // NAV + Distributions

  // Gross Metrics
  grossIRR: number
  grossTVPI: number

  // Net Metrics (after fees)
  netIRR: number
  netTVPI: number

  // Additional Metrics
  unrealizedGain: number
  realizedGain: number
  totalGain: number
}

export interface InvestmentCashFlow {
  investmentId: string
  investmentName: string
  cashFlows: CashFlow[]
  totalInvested: number
  currentValue: number
  distributions: number
  irr: number
  moic: number
}

// Calculate IRR using Newton-Raphson method
export function calculateIRR(cashFlows: { date: string; amount: number }[]): number {
  if (cashFlows.length < 2) return 0

  // Sort by date
  const sorted = [...cashFlows].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const startDate = new Date(sorted[0].date)

  // Convert to days from start
  const flows = sorted.map(cf => ({
    days: Math.floor((new Date(cf.date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    amount: cf.amount
  }))

  // Newton-Raphson iteration
  let rate = 0.1 // Initial guess 10%
  const maxIterations = 100
  const tolerance = 0.0001

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let derivative = 0

    for (const flow of flows) {
      const years = flow.days / 365.25
      const factor = Math.pow(1 + rate, years)
      npv += flow.amount / factor
      derivative -= flow.amount * years / (factor * (1 + rate))
    }

    if (Math.abs(npv) < tolerance) {
      return rate * 100 // Convert to percentage
    }

    if (Math.abs(derivative) < 1e-10) {
      break
    }

    rate = rate - npv / derivative

    // Prevent extreme values
    if (rate < -0.99) rate = -0.99
    if (rate > 10) rate = 10
  }

  return rate * 100
}

// Calculate TVPI (Total Value to Paid-In)
export function calculateTVPI(
  totalValue: number,
  totalInvested: number
): number {
  if (totalInvested === 0) return 0
  return totalValue / totalInvested
}

// Calculate DPI (Distributions to Paid-In)
export function calculateDPI(
  totalDistributed: number,
  totalInvested: number
): number {
  if (totalInvested === 0) return 0
  return totalDistributed / totalInvested
}

// Calculate RVPI (Residual Value to Paid-In)
export function calculateRVPI(
  currentNAV: number,
  totalInvested: number
): number {
  if (totalInvested === 0) return 0
  return currentNAV / totalInvested
}

// Calculate MOIC (Multiple on Invested Capital)
export function calculateMOIC(
  totalValue: number,
  totalInvested: number
): number {
  return calculateTVPI(totalValue, totalInvested)
}

// Get all cash flows for a fund
export function getFundCashFlows(fundId: string): CashFlow[] {
  const capitalCalls = getCapitalCallsByFundId(fundId)
  const distributions = getDistributionsByFundId(fundId)
  const cashFlows: CashFlow[] = []

  // Capital Calls (outflows from LP perspective, inflows to fund)
  capitalCalls.forEach(call => {
    if (call.status === 'Fully Paid' || call.status === 'Partially Paid') {
      cashFlows.push({
        date: call.callDate,
        amount: -call.totalPaidAmount, // Negative = outflow from LP
        type: 'outflow',
        description: `Capital Call #${call.callNumber}`,
        transactionType: call.transactionType
      })
    }
  })

  // Distributions (inflows to LP)
  distributions.forEach(dist => {
    if (dist.status === 'Completed') {
      cashFlows.push({
        date: dist.distributionDate,
        amount: dist.totalDistributionAmount, // Positive = inflow to LP
        type: 'inflow',
        description: `Distribution #${dist.distributionNumber}`,
        transactionType: 'Distribution'
      })
    }
  })

  return cashFlows.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

// Get investment-level cash flows
export function getInvestmentCashFlows(fundId: string): InvestmentCashFlow[] {
  const investments = getInvestmentsByFundId(fundId)

  return investments.map(inv => {
    const cashFlows: CashFlow[] = []

    // Initial investment (outflow)
    cashFlows.push({
      date: inv.acquisitionDate,
      amount: -inv.totalFundPosition.totalInvested,
      type: 'outflow',
      description: `Investment in ${inv.name}`,
      transactionType: 'Investment'
    })

    // Current value (would be inflow if liquidated today)
    cashFlows.push({
      date: inv.lastValuationDate,
      amount: inv.totalFundPosition.currentValue,
      type: 'inflow',
      description: `Current valuation`,
      transactionType: 'Valuation'
    })

    const irr = calculateIRR(cashFlows)
    const moic = calculateMOIC(
      inv.totalFundPosition.currentValue,
      inv.totalFundPosition.totalInvested
    )

    return {
      investmentId: inv.id,
      investmentName: inv.name,
      cashFlows,
      totalInvested: inv.totalFundPosition.totalInvested,
      currentValue: inv.totalFundPosition.currentValue,
      distributions: 0, // TODO: Track distributions per investment
      irr,
      moic
    }
  })
}

// Calculate comprehensive performance metrics for a fund
export function calculateFundPerformance(
  fund: Structure,
  asOfDate: Date = new Date()
): PerformanceMetrics {
  const capitalCalls = getCapitalCallsByFundId(fund.id)
  const distributions = getDistributionsByFundId(fund.id)
  const investments = getInvestmentsByFundId(fund.id)

  // Calculate totals
  const totalCapitalCalled = capitalCalls.reduce(
    (sum, cc) => sum + (cc.status !== 'Draft' && cc.status !== 'Cancelled' ? cc.totalCallAmount : 0),
    0
  )

  const totalPaidCapital = capitalCalls.reduce(
    (sum, cc) => sum + cc.totalPaidAmount,
    0
  )

  const totalDistributed = distributions.reduce(
    (sum, d) => sum + (d.status === 'Completed' ? d.totalDistributionAmount : 0),
    0
  )

  const totalInvested = investments.reduce(
    (sum, inv) => sum + inv.totalFundPosition.totalInvested,
    0
  )

  const currentNAV = investments.reduce(
    (sum, inv) => sum + inv.totalFundPosition.currentValue,
    0
  )

  const totalValue = currentNAV + totalDistributed

  const unrealizedGain = investments.reduce(
    (sum, inv) => sum + inv.totalFundPosition.unrealizedGain,
    0
  )

  const realizedGain = totalDistributed - Math.min(totalDistributed, totalPaidCapital)
  const totalGain = unrealizedGain + realizedGain

  // Calculate IRR
  const cashFlows = getFundCashFlows(fund.id)

  // Add current NAV as final inflow for IRR calculation
  const irrCashFlows = [
    ...cashFlows.map(cf => ({ date: cf.date, amount: cf.amount })),
    { date: asOfDate.toISOString(), amount: currentNAV }
  ]

  const irr = calculateIRR(irrCashFlows)

  // Calculate multiples
  const tvpi = calculateTVPI(totalValue, totalPaidCapital)
  const dpi = calculateDPI(totalDistributed, totalPaidCapital)
  const rvpi = calculateRVPI(currentNAV, totalPaidCapital)
  const moic = tvpi

  // For now, assume gross = net (no fee adjustments)
  // In production, would adjust for management fees and carry
  const grossIRR = irr
  const netIRR = irr
  const grossTVPI = tvpi
  const netTVPI = tvpi

  return {
    irr,
    tvpi,
    moic,
    dpi,
    rvpi,
    totalCapitalCalled,
    totalDistributed,
    totalInvested,
    currentNAV,
    totalValue,
    grossIRR,
    grossTVPI,
    netIRR,
    netTVPI,
    unrealizedGain,
    realizedGain,
    totalGain
  }
}

// Calculate performance metrics for a specific period
export function calculatePeriodPerformance(
  fund: Structure,
  startDate: Date,
  endDate: Date
): PerformanceMetrics {
  // Filter cash flows to period
  const allCashFlows = getFundCashFlows(fund.id)
  const periodCashFlows = allCashFlows.filter(cf => {
    const cfDate = new Date(cf.date)
    return cfDate >= startDate && cfDate <= endDate
  })

  // Get NAV at start and end of period
  const investments = getInvestmentsByFundId(fund.id)
  const endNAV = investments.reduce((sum, inv) => sum + inv.totalFundPosition.currentValue, 0)

  // Calculate metrics
  const totalCapitalCalled = periodCashFlows
    .filter(cf => cf.type === 'outflow')
    .reduce((sum, cf) => sum + Math.abs(cf.amount), 0)

  const totalDistributed = periodCashFlows
    .filter(cf => cf.type === 'inflow')
    .reduce((sum, cf) => sum + cf.amount, 0)

  // For period performance, use period-specific calculations
  const irrCashFlows = [
    ...periodCashFlows.map(cf => ({ date: cf.date, amount: cf.amount })),
    { date: endDate.toISOString(), amount: endNAV }
  ]

  const irr = calculateIRR(irrCashFlows)
  const tvpi = calculateTVPI(endNAV + totalDistributed, totalCapitalCalled)
  const dpi = calculateDPI(totalDistributed, totalCapitalCalled)
  const rvpi = calculateRVPI(endNAV, totalCapitalCalled)

  return {
    irr,
    tvpi,
    moic: tvpi,
    dpi,
    rvpi,
    totalCapitalCalled,
    totalDistributed,
    totalInvested: totalCapitalCalled,
    currentNAV: endNAV,
    totalValue: endNAV + totalDistributed,
    grossIRR: irr,
    grossTVPI: tvpi,
    netIRR: irr,
    netTVPI: tvpi,
    unrealizedGain: endNAV - totalCapitalCalled,
    realizedGain: totalDistributed - Math.min(totalDistributed, totalCapitalCalled),
    totalGain: (endNAV + totalDistributed) - totalCapitalCalled
  }
}
