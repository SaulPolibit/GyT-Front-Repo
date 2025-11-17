/**
 * Custom Report CSV Generator
 * Generates CSV files based on selected data fields
 */

import type { Investor, Investment, Report } from '@/lib/types'

interface CustomReportData {
  title: string
  periodStart: string
  periodEnd: string
  generatedDate: string
  investors: Investor[]
  investments: Investment[]
  reports: Report[]
  includeFields: Record<string, boolean>
  metrics: {
    totalAUM: number
    totalInvestments: number
    totalInvestors: number
    avgIRR: number
    avgMultiple: number
    totalDistributions: number
    totalUnrealizedGains: number
  }
}

export function generateCustomCSV(data: CustomReportData): Buffer {
  const sections: string[] = []

  // Header
  sections.push(`"${data.title}"`)
  sections.push(`"Period: ${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}"`)
  sections.push(`"Generated: ${formatDate(data.generatedDate)}"`)
  sections.push('') // Empty line

  // Portfolio Summary
  if (shouldIncludePortfolioSummary(data.includeFields)) {
    sections.push('"Portfolio Summary"')
    if (data.includeFields.totalAUM) {
      sections.push(`"Total AUM","${data.metrics.totalAUM}"`)
    }
    if (data.includeFields.totalInvestments) {
      sections.push(`"Total Investments","${data.metrics.totalInvestments}"`)
    }
    if (data.includeFields.totalInvestors) {
      sections.push(`"Total Investors","${data.metrics.totalInvestors}"`)
    }
    if (data.includeFields.avgIRR) {
      sections.push(`"Average IRR","${data.metrics.avgIRR.toFixed(2)}%"`)
    }
    if (data.includeFields.avgMultiple) {
      sections.push(`"Average Multiple","${data.metrics.avgMultiple.toFixed(2)}x"`)
    }
    sections.push('') // Empty line
  }

  // Investments
  if (shouldIncludeInvestmentDetails(data.includeFields) && data.investments.length > 0) {
    sections.push('"Investments"')

    const headers = ['Name', 'Type', 'Sector', 'Status', 'Country', 'City']

    if (data.includeFields.investmentBreakdown) {
      headers.push('Total Invested', 'Current Value', 'Unrealized Gain')
    }

    if (data.includeFields.individualIRR) {
      headers.push('IRR')
    }

    if (data.includeFields.individualMultiples) {
      headers.push('Multiple')
    }

    sections.push(headers.map(h => `"${h}"`).join(','))

    data.investments.forEach((inv) => {
      const row = [
        escapeCSV(inv.name),
        escapeCSV(inv.type),
        escapeCSV(inv.sector),
        escapeCSV(inv.status),
        escapeCSV(inv.geography.country),
        escapeCSV(inv.geography.city),
      ]

      if (data.includeFields.investmentBreakdown) {
        row.push(
          inv.totalFundPosition.totalInvested.toString(),
          inv.totalFundPosition.currentValue.toString(),
          inv.totalFundPosition.unrealizedGain.toString()
        )
      }

      if (data.includeFields.individualIRR) {
        row.push(`${inv.totalFundPosition.irr.toFixed(2)}%`)
      }

      if (data.includeFields.individualMultiples) {
        row.push(`${inv.totalFundPosition.multiple.toFixed(2)}x`)
      }

      sections.push(row.join(','))
    })

    sections.push('') // Empty line
  }

  // Performance Metrics
  if (shouldIncludePerformanceMetrics(data.includeFields) && data.investments.length > 0) {
    sections.push('"Performance Metrics"')

    const headers = ['Investment Name']
    if (data.includeFields.individualIRR) headers.push('IRR')
    if (data.includeFields.individualMultiples) headers.push('Multiple')
    if (data.includeFields.unrealizedGains) headers.push('Unrealized Gain')

    sections.push(headers.map(h => `"${h}"`).join(','))

    data.investments.forEach((inv) => {
      const row = [escapeCSV(inv.name)]

      if (data.includeFields.individualIRR) {
        row.push(`${inv.totalFundPosition.irr.toFixed(2)}%`)
      }

      if (data.includeFields.individualMultiples) {
        row.push(`${inv.totalFundPosition.multiple.toFixed(2)}x`)
      }

      if (data.includeFields.unrealizedGains) {
        row.push(inv.totalFundPosition.unrealizedGain.toString())
      }

      sections.push(row.join(','))
    })

    sections.push('') // Empty line
  }

  // Investors
  if (shouldIncludeInvestorInfo(data.includeFields) && data.investors.length > 0) {
    sections.push('"Investors"')

    const headers = ['Name', 'Type', 'Status']

    if (data.includeFields.investorAllocations) {
      headers.push('Ownership %', 'Commitment', 'Called Capital', 'Uncalled Capital')
    }

    if (data.includeFields.investorList) {
      headers.push('Current Value', 'IRR', 'Total Distributed')
    }

    sections.push(headers.map(h => `"${h}"`).join(','))

    data.investors.forEach((investor) => {
      // Aggregate ownership across all funds
      const totalOwnership = investor.fundOwnerships?.reduce((sum, fo) => sum + fo.ownershipPercent, 0) || 0
      const totalCommitment = investor.fundOwnerships?.reduce((sum, fo) => sum + fo.commitment, 0) || 0
      const totalCalledCapital = investor.fundOwnerships?.reduce((sum, fo) => sum + fo.calledCapital, 0) || 0
      const totalUncalledCapital = investor.fundOwnerships?.reduce((sum, fo) => sum + fo.uncalledCapital, 0) || 0

      const row = [
        escapeCSV(investor.name),
        escapeCSV(investor.type),
        escapeCSV(investor.status),
      ]

      if (data.includeFields.investorAllocations) {
        row.push(
          `${totalOwnership.toFixed(2)}%`,
          totalCommitment.toString(),
          totalCalledCapital.toString(),
          totalUncalledCapital.toString()
        )
      }

      if (data.includeFields.investorList) {
        row.push(
          investor.currentValue.toString(),
          `${investor.irr.toFixed(2)}%`,
          investor.totalDistributed.toString()
        )
      }

      sections.push(row.join(','))
    })

    sections.push('') // Empty line
  }

  // Financial Details
  if (shouldIncludeFinancialDetails(data.includeFields)) {
    sections.push('"Financial Details"')

    if (data.includeFields.cashFlows) {
      sections.push(`"Total Distributions","${data.metrics.totalDistributions}"`)
      sections.push(`"Total Unrealized Gains","${data.metrics.totalUnrealizedGains}"`)
    }

    if (data.includeFields.valuationHistory) {
      sections.push(`"Current Portfolio Value","${data.metrics.totalAUM}"`)
      sections.push(`"Number of Investments","${data.metrics.totalInvestments}"`)
      sections.push(`"Average IRR","${data.metrics.avgIRR.toFixed(2)}%"`)
    }

    sections.push('') // Empty line
  }

  // Asset Allocation (if included)
  if (data.includeFields.assetAllocation && data.investments.length > 0) {
    sections.push('"Asset Allocation"')
    sections.push('"Type","Value","Percentage"')

    const typeBreakdown = data.investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + inv.totalFundPosition.currentValue
      return acc
    }, {} as Record<string, number>)

    Object.entries(typeBreakdown).forEach(([type, value]) => {
      const percentage = (value / data.metrics.totalAUM) * 100
      sections.push(`"${type}","${value}","${percentage.toFixed(2)}%"`)
    })

    sections.push('') // Empty line
  }

  // Geographic Distribution (if included)
  if (data.includeFields.geographicDistribution && data.investments.length > 0) {
    sections.push('"Geographic Distribution"')
    sections.push('"Country","Value","Percentage"')

    const countryBreakdown = data.investments.reduce((acc, inv) => {
      const country = inv.geography.country
      acc[country] = (acc[country] || 0) + inv.totalFundPosition.currentValue
      return acc
    }, {} as Record<string, number>)

    Object.entries(countryBreakdown).forEach(([country, value]) => {
      const percentage = (value / data.metrics.totalAUM) * 100
      sections.push(`"${country}","${value}","${percentage.toFixed(2)}%"`)
    })

    sections.push('') // Empty line
  }

  // Sector Breakdown (if included)
  if (data.includeFields.sectorBreakdown && data.investments.length > 0) {
    sections.push('"Sector Breakdown"')
    sections.push('"Sector","Value","Percentage"')

    const sectorBreakdown = data.investments.reduce((acc, inv) => {
      acc[inv.sector] = (acc[inv.sector] || 0) + inv.totalFundPosition.currentValue
      return acc
    }, {} as Record<string, number>)

    Object.entries(sectorBreakdown).forEach(([sector, value]) => {
      const percentage = (value / data.metrics.totalAUM) * 100
      sections.push(`"${sector}","${value}","${percentage.toFixed(2)}%"`)
    })

    sections.push('') // Empty line
  }

  const csvContent = sections.join('\n')
  return Buffer.from(csvContent, 'utf-8')
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return `"${value}"`
}

function shouldIncludePortfolioSummary(fields: Record<string, boolean>): boolean {
  return fields.totalAUM || fields.totalInvestments || fields.totalInvestors || fields.avgIRR || fields.avgMultiple
}

function shouldIncludeInvestmentDetails(fields: Record<string, boolean>): boolean {
  return fields.investmentBreakdown || fields.assetAllocation || fields.geographicDistribution || fields.sectorBreakdown
}

function shouldIncludePerformanceMetrics(fields: Record<string, boolean>): boolean {
  return fields.individualIRR || fields.individualMultiples || fields.unrealizedGains || fields.realizedGains
}

function shouldIncludeInvestorInfo(fields: Record<string, boolean>): boolean {
  return fields.investorList || fields.investorAllocations || fields.capitalCalls || fields.distributions
}

function shouldIncludeFinancialDetails(fields: Record<string, boolean>): boolean {
  return fields.cashFlows || fields.valuationHistory || fields.feeBreakdown || fields.expenseRatios
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
