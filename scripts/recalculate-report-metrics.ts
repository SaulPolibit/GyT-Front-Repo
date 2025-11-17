/**
 * Recalculate all report metrics using formula-based calculations
 * NO HARD-CODED VALUES - All metrics derived from investment data
 * Run with: npx tsx scripts/recalculate-report-metrics.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import reportsData from '../src/data/reports.json'
import investmentsData from '../src/data/investments.json'
import type { Report } from '../src/lib/types'
import {
  calculateTotalAUM,
  calculateWeightedAvgIRR,
  calculatePortfolioIRR,
  adjustAUMForTransactions,
  type Investment
} from '../src/lib/investment-calculations'

const reports = reportsData as Report[]
const investments = investmentsData as Investment[]

console.log('═══════════════════════════════════════════════════════════')
console.log('RECALCULATING ALL REPORT METRICS (FORMULA-DRIVEN)')
console.log('═══════════════════════════════════════════════════════════\n')

/**
 * Define investment composition for each report
 * This is the ONLY configuration needed - all values are calculated
 */
interface ReportConfig {
  investments: string[]
  endDate: string
  description: string
  capitalCallAmount?: number
  distributionAmount?: number
}

const reportInvestmentConfig: Record<string, ReportConfig> = {
  'report-003': { // 2024 Annual
    investments: ['inv-001', 'inv-002', 'inv-003', 'inv-004', 'inv-005', 'inv-006'],
    endDate: '2024-12-31',
    description: 'All 6 initial investments'
  },
  'report-008': { // Q1 2025
    investments: ['inv-001', 'inv-002', 'inv-003', 'inv-004', 'inv-005', 'inv-006'],
    endDate: '2025-03-31',
    description: 'Same 6 investments'
  },
  'report-002': { // Q2 2025
    investments: ['inv-001', 'inv-002', 'inv-003', 'inv-004', 'inv-005', 'inv-006', 'inv-007'],
    endDate: '2025-06-30',
    description: 'Added inv-007 (7 total)'
  },
  'report-001': { // Q3 2025
    investments: ['inv-001', 'inv-002', 'inv-003', 'inv-004', 'inv-006', 'inv-007'],
    endDate: '2025-09-30',
    capitalCallAmount: 1500000, // Capital call in September
    distributionAmount: 850000,  // Distribution in August
    description: 'Exited inv-005 (6 total)'
  },
  'report-006': { // October 2025
    investments: ['inv-001', 'inv-002', 'inv-003', 'inv-004', 'inv-006', 'inv-007'],
    endDate: '2025-10-31',
    description: 'Same 6 investments'
  },
  'report-004': { // Capital Call (Sept 2025)
    investments: ['inv-001'], // Specific to Sunset Tower
    endDate: '2025-09-30',
    description: 'Capital call for inv-001 only'
  },
  'report-005': { // Distribution (Aug 2025)
    investments: ['inv-003', 'inv-004'], // TechCo & HealthFirst
    endDate: '2025-08-31',
    description: 'Distribution from 2 PE investments'
  },
  'report-007': { // Custom Report
    investments: ['inv-001', 'inv-002', 'inv-006'], // Real Estate only
    endDate: '2025-09-30',
    description: 'Real estate portfolio analysis'
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Recalculate metrics for each report
const updatedReports = reports.map(report => {
  const config = reportInvestmentConfig[report.id]

  if (!config) {
    console.log(`⚠️  ${report.title} - No config found, skipping`)
    return report
  }

  console.log(`\n📊 ${report.title}`)
  console.log('─────────────────────────────────────────────────────────')
  console.log(`Report Date: ${config.endDate}`)
  console.log(`Investments: ${config.investments.length} (${config.description})`)
  console.log(`IDs: [${config.investments.join(', ')}]`)
  console.log('')

  // FORMULA 1: Calculate base AUM from investment values
  const baseAUM = calculateTotalAUM(investments, config.investments, config.endDate)
  console.log(`Formula: Base AUM = SUM(investment values at ${config.endDate})`)
  console.log(`Calculated Base AUM: ${formatCurrency(baseAUM)}`)

  // FORMULA 2: Adjust for capital calls and distributions
  const capitalCalls = config.capitalCallAmount || 0
  const distributions = config.distributionAmount || 0
  const adjustedAUM = adjustAUMForTransactions(baseAUM, capitalCalls, distributions)

  if (capitalCalls || distributions) {
    console.log(`Formula: Adjusted AUM = Base AUM + Capital Calls - Distributions`)
    console.log(`         = ${formatCurrency(baseAUM)} + ${formatCurrency(capitalCalls)} - ${formatCurrency(distributions)}`)
    console.log(`         = ${formatCurrency(adjustedAUM)}`)
  } else {
    console.log(`No transactions → AUM = ${formatCurrency(adjustedAUM)}`)
  }

  // FORMULA 3: Calculate weighted average IRR
  const avgIRR = calculateWeightedAvgIRR(investments, config.investments, config.endDate)
  console.log(`Formula: Avg IRR = (SUM(IRR × Value)) / SUM(Value)`)
  console.log(`Calculated Avg IRR: ${avgIRR.toFixed(1)}%`)

  // FORMULA 4: Alternative portfolio IRR calculation
  const portfolioIRR = calculatePortfolioIRR(investments, config.investments, config.endDate)
  console.log(`Formula: Portfolio IRR = ((Multiple)^(1/years)) - 1`)
  console.log(`Calculated Portfolio IRR: ${portfolioIRR.toFixed(1)}%`)

  // Use weighted average IRR for consistency with previous data
  const finalIRR = avgIRR

  console.log(`\n✅ Old Metrics → New (Calculated) Metrics:`)
  console.log(`   AUM: ${formatCurrency(report.metrics.totalAUM)} → ${formatCurrency(adjustedAUM)}`)
  console.log(`   IRR: ${report.metrics.avgIRR.toFixed(1)}% → ${finalIRR.toFixed(1)}%`)
  console.log(`   Investments: ${report.metrics.totalInvestments} → ${config.investments.length}`)

  return {
    ...report,
    includesInvestments: config.investments,
    metrics: {
      ...report.metrics,
      totalAUM: adjustedAUM,
      avgIRR: finalIRR,
      totalInvestments: config.investments.length
    }
  }
})

// Write updated reports
const reportsPath = join(__dirname, '../src/data/reports.json')
writeFileSync(reportsPath, JSON.stringify(updatedReports, null, 2))

console.log('\n═══════════════════════════════════════════════════════════')
console.log('✅ ALL METRICS RECALCULATED USING FORMULAS')
console.log('═══════════════════════════════════════════════════════════\n')

console.log('📐 FORMULAS USED:')
console.log('─────────────────────────────────────────────────────────')
console.log('1. Investment Value at Date = Principal × (1 + IRR)^years')
console.log('2. Total AUM = SUM(investment values at report date)')
console.log('3. Adjusted AUM = Base AUM + Capital Calls - Distributions')
console.log('4. Weighted Avg IRR = SUM(IRR × Value) / SUM(Value)')
console.log('5. Portfolio IRR = (Multiple^(1/years)) - 1')
console.log('')

console.log('📈 INVESTMENT PROGRESSION:')
console.log('─────────────────────────────────────────────────────────')
console.log('2024 Annual:    6 investments (inv-001 to inv-006)')
console.log('Q1 2025:        6 investments (no change)')
console.log('Q2 2025:        7 investments (+inv-007 NEW)')
console.log('Q3 2025:        6 investments (-inv-005 EXITED)')
console.log('October 2025:   6 investments (no change)')
console.log('')

console.log('File updated: src/data/reports.json')
console.log('')
