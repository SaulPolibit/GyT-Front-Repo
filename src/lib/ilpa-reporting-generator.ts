// ILPA Reporting Template v2.0 Generator
// Generates standardized ILPA reports for fund performance and operations

import type { Structure } from './structures-storage'
import type { Investment } from './types'
import { getCapitalCallsByFundId } from './capital-calls-storage'
import { getDistributionsByFundId } from './distributions-storage'
import { getInvestorsByFundId } from './investors-storage'
import { getInvestmentsByFundId } from './investments-storage'
import {
  calculateFundLevelPerformance,
  calculatePortfolioLevelPerformance,
  calculateIRR,
  calculateDPI,
  calculateRVPI,
  calculateTVPI,
  calculateFundAgeYears,
  type CashFlow,
} from './performance-calculations'

// ILPA Report Types
export type ILPAReportType =
  | 'Performance Report'           // ILPA Performance Template
  | 'Quarterly Report'             // ILPA Reporting Template
  | 'Capital Call & Distribution'  // ILPA CC&D Template
  | 'Portfolio Summary'            // Portfolio-level summary

/**
 * ILPA Performance Report
 *
 * Generates performance metrics following ILPA standards.
 * Uses either Granular or Gross Up methodology based on fund settings.
 */

export interface ILPAPerformanceReport {
  reportType: 'Performance Report'
  fundId: string
  fundName: string
  reportDate: string
  reportPeriod: {
    startDate: string
    endDate: string
  }

  // Fund Information
  fundInformation: {
    inceptionDate: string
    fundAgeYears: number
    fundStatus: string
    totalCommitment: number
    currency: string
    performanceMethodology: string
    calculationLevel: string
  }

  // Performance Metrics
  performance: {
    methodology: string
    grossPerformance: number        // Gross performance %
    grossMultiple: number            // Gross MOIC
    netPerformance: number           // Net performance %
    netMultiple: number              // Net MOIC
    irr: number                      // Internal Rate of Return %
    dpi: number                      // Distributions to Paid-In
    rvpi: number                     // Residual Value to Paid-In
    tvpi: number                     // Total Value to Paid-In
  }

  // Capital Summary
  capitalSummary: {
    totalCommitment: number
    calledCapital: number
    uncalledCapital: number
    percentCalled: number
    totalDistributions: number
    currentNAV: number
    totalValue: number              // Distributions + NAV
  }

  // Fee Breakdown
  fees: {
    estimatedManagementFees: number
    managementFeePercent: number
    performanceFeePercent: number
  }

  // Investor Summary
  investors: {
    totalInvestors: number
    totalCommitment: number
    weightedAverageOwnership: number
  }

  // Portfolio Summary
  portfolio: {
    totalInvestments: number
    activeInvestments: number
    exitedInvestments: number
    totalDeployed: number
    currentValue: number
  }
}

export function generateILPAPerformanceReport(
  fund: Structure,
  reportPeriod: { startDate: string; endDate: string }
): ILPAPerformanceReport {
  const capitalCalls = getCapitalCallsByFundId(fund.id)
  const distributions = getDistributionsByFundId(fund.id)
  const investors = getInvestorsByFundId(fund.id)
  const investments = getInvestmentsByFundId(fund.id)

  // Calculate totals
  const totalCapitalCalls = capitalCalls.reduce((sum, cc) => sum + cc.totalCallAmount, 0)
  const totalDistributions = distributions.reduce((sum, d) => sum + d.totalDistributionAmount, 0)

  // Calculate current NAV from investments
  const currentNAV = investments.reduce((sum, inv) => {
    return sum + (inv.totalFundPosition?.currentValue || 0)
  }, 0)

  const fundAgeYears = fund.inceptionDate
    ? calculateFundAgeYears(new Date(fund.inceptionDate))
    : 0

  // Build cash flows for IRR calculation
  const cashFlows: CashFlow[] = []

  // Capital calls (negative)
  capitalCalls.forEach(cc => {
    cashFlows.push({
      date: new Date(cc.callDate),
      amount: -cc.totalCallAmount,
    })
  })

  // Distributions (positive)
  distributions.forEach(d => {
    cashFlows.push({
      date: new Date(d.distributionDate),
      amount: d.totalDistributionAmount,
    })
  })

  // Current NAV (positive, at report date)
  if (currentNAV > 0) {
    cashFlows.push({
      date: new Date(reportPeriod.endDate),
      amount: currentNAV,
    })
  }

  const irr = calculateIRR(cashFlows)
  const dpi = calculateDPI(totalDistributions, totalCapitalCalls)
  const rvpi = calculateRVPI(currentNAV, totalCapitalCalls)
  const tvpi = calculateTVPI(totalDistributions, currentNAV, totalCapitalCalls)

  // Calculate performance based on methodology
  let performanceData: any

  if (fund.calculationLevel === 'portfolio-level') {
    const totalDeployed = investments.reduce((sum, inv) => {
      return sum + (inv.totalFundPosition?.totalInvested || 0)
    }, 0)

    performanceData = calculatePortfolioLevelPerformance({
      totalInvestedInPortfolio: totalDeployed,
      totalReturnsFromPortfolio: totalDistributions,
      currentPortfolioValue: currentNAV,
      managementFeePercent: parseFloat(fund.managementFee || '0'),
      fundAgeYears,
      averageAUM: fund.totalCommitment,
    })
  } else {
    // Fund-level
    const managementFeeCalls = capitalCalls
      .filter(cc => cc.managementFeeIncluded)
      .reduce((sum, cc) => sum + (cc.managementFeeAmount || 0), 0)

    const investmentCalls = totalCapitalCalls - managementFeeCalls

    performanceData = calculateFundLevelPerformance({
      methodology: fund.performanceMethodology || 'grossup',
      totalCapitalCalls,
      managementFeeCalls,
      investmentCalls,
      totalDistributions,
      currentNAV,
      managementFeePercent: parseFloat(fund.managementFee || '0'),
      fundAgeYears,
      averageAUM: fund.totalCommitment,
    })
  }

  return {
    reportType: 'Performance Report',
    fundId: fund.id,
    fundName: fund.name,
    reportDate: reportPeriod.endDate,
    reportPeriod,

    fundInformation: {
      inceptionDate: fund.inceptionDate?.toString() || '',
      fundAgeYears,
      fundStatus: fund.status,
      totalCommitment: fund.totalCommitment,
      currency: fund.currency,
      performanceMethodology: fund.performanceMethodology || 'grossup',
      calculationLevel: fund.calculationLevel || 'fund-level',
    },

    performance: {
      methodology: performanceData.methodology,
      grossPerformance: performanceData.grossPerformancePercent,
      grossMultiple: performanceData.grossMultiple,
      netPerformance: performanceData.netPerformancePercent,
      netMultiple: performanceData.netMultiple,
      irr,
      dpi,
      rvpi,
      tvpi,
    },

    capitalSummary: {
      totalCommitment: fund.totalCommitment,
      calledCapital: totalCapitalCalls,
      uncalledCapital: fund.totalCommitment - totalCapitalCalls,
      percentCalled: (totalCapitalCalls / fund.totalCommitment) * 100,
      totalDistributions,
      currentNAV,
      totalValue: totalDistributions + currentNAV,
    },

    fees: {
      estimatedManagementFees: performanceData.estimatedManagementFees || performanceData.managementFees || 0,
      managementFeePercent: parseFloat(fund.managementFee || '0'),
      performanceFeePercent: parseFloat(fund.performanceFee || '0'),
    },

    investors: {
      totalInvestors: investors.length,
      totalCommitment: investors.reduce((sum, inv) => {
        const allocation = inv.allocations?.find(a => a.fundId === fund.id)
        return sum + (allocation?.commitment || 0)
      }, 0),
      weightedAverageOwnership: investors.length > 0
        ? investors.reduce((sum, inv) => {
            const allocation = inv.allocations?.find(a => a.fundId === fund.id)
            return sum + (allocation?.ownership || 0)
          }, 0) / investors.length
        : 0,
    },

    portfolio: {
      totalInvestments: investments.length,
      activeInvestments: investments.filter(inv => inv.status === 'Active').length,
      exitedInvestments: investments.filter(inv => inv.status === 'Exited').length,
      totalDeployed: investments.reduce((sum, inv) => {
        return sum + (inv.totalFundPosition?.totalInvested || 0)
      }, 0),
      currentValue: currentNAV,
    },
  }
}

/**
 * ILPA Quarterly Report
 *
 * Standard quarterly reporting template with all fund metrics
 */

export interface ILPAQuarterlyReport extends ILPAPerformanceReport {
  reportType: 'Quarterly Report'

  // Quarter-specific data
  quarterActivity: {
    capitalCallsThisQuarter: number
    capitalCallAmountThisQuarter: number
    distributionsThisQuarter: number
    distributionAmountThisQuarter: number
    newInvestmentsThisQuarter: number
    exitsThisQuarter: number
  }

  // Top investments
  topInvestments: Array<{
    investmentName: string
    type: string
    currentValue: number
    unrealizedGain: number
    percentOfPortfolio: number
  }>
}

export function generateILPAQuarterlyReport(
  fund: Structure,
  quarter: { startDate: string; endDate: string }
): ILPAQuarterlyReport {
  const performanceReport = generateILPAPerformanceReport(fund, quarter)
  const capitalCalls = getCapitalCallsByFundId(fund.id)
  const distributions = getDistributionsByFundId(fund.id)
  const investments = getInvestmentsByFundId(fund.id)

  const quarterStart = new Date(quarter.startDate)
  const quarterEnd = new Date(quarter.endDate)

  // Quarter activity
  const capitalCallsThisQuarter = capitalCalls.filter(cc => {
    const callDate = new Date(cc.callDate)
    return callDate >= quarterStart && callDate <= quarterEnd
  })

  const distributionsThisQuarter = distributions.filter(d => {
    const distDate = new Date(d.distributionDate)
    return distDate >= quarterStart && distDate <= quarterEnd
  })

  const newInvestmentsThisQuarter = investments.filter(inv => {
    const acqDate = new Date(inv.acquisitionDate)
    return acqDate >= quarterStart && acqDate <= quarterEnd
  })

  const exitsThisQuarter = investments.filter(inv => {
    return inv.status === 'Exited' // Would need exit date field for accurate filtering
  })

  // Top investments by value
  const topInvestments = investments
    .map(inv => ({
      investmentName: inv.name,
      type: inv.type,
      currentValue: inv.totalFundPosition?.currentValue || 0,
      unrealizedGain: inv.totalFundPosition?.unrealizedGain || 0,
      percentOfPortfolio: performanceReport.capitalSummary.currentNAV > 0
        ? ((inv.totalFundPosition?.currentValue || 0) / performanceReport.capitalSummary.currentNAV) * 100
        : 0,
    }))
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 10)

  return {
    ...performanceReport,
    reportType: 'Quarterly Report',

    quarterActivity: {
      capitalCallsThisQuarter: capitalCallsThisQuarter.length,
      capitalCallAmountThisQuarter: capitalCallsThisQuarter.reduce((sum, cc) => sum + cc.totalCallAmount, 0),
      distributionsThisQuarter: distributionsThisQuarter.length,
      distributionAmountThisQuarter: distributionsThisQuarter.reduce((sum, d) => sum + d.totalDistributionAmount, 0),
      newInvestmentsThisQuarter: newInvestmentsThisQuarter.length,
      exitsThisQuarter: exitsThisQuarter.length,
    },

    topInvestments,
  }
}

/**
 * ILPA Capital Call & Distribution Summary
 *
 * Summary of all capital calls and distributions for ILPA template
 */

export interface ILPACCDReport {
  reportType: 'Capital Call & Distribution'
  fundId: string
  fundName: string
  reportDate: string

  capitalCallSummary: {
    totalCalls: number
    totalAmount: number
    totalPaid: number
    totalOutstanding: number
    averageCallSize: number
  }

  distributionSummary: {
    totalDistributions: number
    totalAmount: number
    averageDistributionSize: number
    returnOfCapital: number
    income: number
    capitalGains: number
  }

  recentActivity: {
    recentCapitalCalls: Array<{
      callNumber: number
      callDate: string
      amount: number
      status: string
    }>
    recentDistributions: Array<{
      distributionNumber: number
      distributionDate: string
      amount: number
      source: string
    }>
  }
}

export function generateILPACCDReport(fund: Structure, reportDate: string): ILPACCDReport {
  const capitalCalls = getCapitalCallsByFundId(fund.id)
  const distributions = getDistributionsByFundId(fund.id)

  const totalCallAmount = capitalCalls.reduce((sum, cc) => sum + cc.totalCallAmount, 0)
  const totalPaid = capitalCalls.reduce((sum, cc) => sum + cc.totalPaidAmount, 0)
  const totalOutstanding = capitalCalls.reduce((sum, cc) => sum + cc.totalOutstandingAmount, 0)

  const totalDistributionAmount = distributions.reduce((sum, d) => sum + d.totalDistributionAmount, 0)
  const returnOfCapital = distributions.reduce((sum, d) => sum + (d.returnOfCapitalAmount || 0), 0)
  const income = distributions.reduce((sum, d) => sum + (d.incomeAmount || 0), 0)
  const capitalGains = distributions.reduce((sum, d) => sum + (d.capitalGainAmount || 0), 0)

  // Recent activity (last 5)
  const recentCapitalCalls = capitalCalls
    .sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime())
    .slice(0, 5)
    .map(cc => ({
      callNumber: cc.callNumber,
      callDate: cc.callDate,
      amount: cc.totalCallAmount,
      status: cc.status,
    }))

  const recentDistributions = distributions
    .sort((a, b) => new Date(b.distributionDate).getTime() - new Date(a.distributionDate).getTime())
    .slice(0, 5)
    .map(d => ({
      distributionNumber: d.distributionNumber,
      distributionDate: d.distributionDate,
      amount: d.totalDistributionAmount,
      source: d.source,
    }))

  return {
    reportType: 'Capital Call & Distribution',
    fundId: fund.id,
    fundName: fund.name,
    reportDate,

    capitalCallSummary: {
      totalCalls: capitalCalls.length,
      totalAmount: totalCallAmount,
      totalPaid,
      totalOutstanding,
      averageCallSize: capitalCalls.length > 0 ? totalCallAmount / capitalCalls.length : 0,
    },

    distributionSummary: {
      totalDistributions: distributions.length,
      totalAmount: totalDistributionAmount,
      averageDistributionSize: distributions.length > 0 ? totalDistributionAmount / distributions.length : 0,
      returnOfCapital,
      income,
      capitalGains,
    },

    recentActivity: {
      recentCapitalCalls,
      recentDistributions,
    },
  }
}

/**
 * Generate all ILPA reports for a fund
 */
export function generateAllILPAReports(
  fund: Structure,
  reportPeriod: { startDate: string; endDate: string }
) {
  return {
    performanceReport: generateILPAPerformanceReport(fund, reportPeriod),
    quarterlyReport: generateILPAQuarterlyReport(fund, reportPeriod),
    ccdReport: generateILPACCDReport(fund, reportPeriod.endDate),
  }
}
