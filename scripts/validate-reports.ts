/**
 * Validation script to check report accuracy against source data
 * Run with: npx tsx scripts/validate-reports.ts
 */

import investmentsData from '../src/data/investments.json'
import investorsData from '../src/data/investors.json'
import reportsData from '../src/data/reports.json'
import type { Investment, Investor, Report } from '../src/lib/types'
import {
  validateReportMetrics,
  generateReportMetrics,
  calculateFundNAV,
  calculateAvgIRR,
  calculateTotalDistributions,
  calculateInvestmentMetrics,
  calculateInvestorMetrics
} from '../src/lib/report-calculations'

const investments = investmentsData as Investment[]
const investors = investorsData as Investor[]
const reports = reportsData as Report[]

console.log('═══════════════════════════════════════════════════════════')
console.log('REPORT VALIDATION RESULTS')
console.log('═══════════════════════════════════════════════════════════\n')

// Overall fund metrics
console.log('📊 OVERALL FUND METRICS')
console.log('─────────────────────────────────────────────────────────')
const allInvestmentMetrics = calculateInvestmentMetrics(investments)
const allInvestorMetrics = calculateInvestorMetrics(investors)

console.log(`Total Fund NAV:          $${allInvestmentMetrics.currentValue.toLocaleString()}`)
console.log(`Total Invested:          $${allInvestmentMetrics.totalInvested.toLocaleString()}`)
console.log(`Unrealized Gain:         $${allInvestmentMetrics.unrealizedGain.toLocaleString()}`)
console.log(`Average IRR:             ${allInvestmentMetrics.avgIRR.toFixed(2)}%`)
console.log(`Weighted Avg IRR:        ${allInvestmentMetrics.weightedAvgIRR.toFixed(2)}%`)
console.log(`Overall Multiple:        ${allInvestmentMetrics.avgMultiple.toFixed(2)}x`)
console.log(`Total Commitment:        $${allInvestorMetrics.totalCommitment.toLocaleString()}`)
console.log(`Total Called Capital:    $${allInvestorMetrics.totalCalledCapital.toLocaleString()}`)
console.log(`Total Distributions:     $${allInvestorMetrics.totalDistributed.toLocaleString()}`)
console.log(`Investor Avg IRR:        ${allInvestorMetrics.avgIRR.toFixed(2)}%`)
console.log('')

// Validate each report
reports.forEach((report, index) => {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`REPORT ${index + 1}: ${report.title}`)
  console.log(`${'═'.repeat(60)}`)
  console.log(`ID: ${report.id}`)
  console.log(`Type: ${report.type}`)
  console.log(`Period: ${report.period}`)
  console.log(`Generated: ${report.generatedDate}`)
  console.log(`Includes: ${report.includesInvestments.length} investments, ${report.includesInvestors.length} investors`)
  console.log('')

  const validation = validateReportMetrics(report, investments, investors)

  // Show reported vs calculated
  console.log('📈 METRICS COMPARISON')
  console.log('─────────────────────────────────────────────────────────')
  console.log(`Total AUM:`)
  console.log(`  Reported:   $${report.metrics.totalAUM.toLocaleString()}`)
  console.log(`  Calculated: $${validation.calculatedMetrics.totalAUM.toLocaleString()}`)
  console.log(`  Difference: $${Math.abs(report.metrics.totalAUM - validation.calculatedMetrics.totalAUM).toLocaleString()}`)
  console.log('')
  console.log(`Average IRR:`)
  console.log(`  Reported:   ${report.metrics.avgIRR.toFixed(2)}%`)
  console.log(`  Calculated: ${validation.calculatedMetrics.avgIRR.toFixed(2)}%`)
  console.log(`  Difference: ${Math.abs(report.metrics.avgIRR - validation.calculatedMetrics.avgIRR).toFixed(2)}%`)
  console.log('')
  console.log(`Total Distributions:`)
  console.log(`  Reported:   $${report.metrics.totalDistributions.toLocaleString()}`)
  console.log(`  Calculated: $${validation.calculatedMetrics.totalDistributions.toLocaleString()}`)
  console.log(`  Difference: $${Math.abs(report.metrics.totalDistributions - validation.calculatedMetrics.totalDistributions).toLocaleString()}`)
  console.log('')

  // Show validation status
  if (validation.isValid) {
    console.log('✅ STATUS: VALID - All metrics match')
  } else {
    console.log('❌ STATUS: INVALID - Discrepancies found')
  }

  // Show errors
  if (validation.errors.length > 0) {
    console.log('')
    console.log('🚨 ERRORS:')
    validation.errors.forEach(error => {
      console.log(`  • ${error}`)
    })
  }

  // Show warnings
  if (validation.warnings.length > 0) {
    console.log('')
    console.log('⚠️  WARNINGS:')
    validation.warnings.forEach(warning => {
      console.log(`  • ${warning}`)
    })
  }
})

// Summary
console.log(`\n${'═'.repeat(60)}`)
console.log('SUMMARY')
console.log(`${'═'.repeat(60)}`)

const validReports = reports.filter(report => {
  const validation = validateReportMetrics(report, investments, investors)
  return validation.isValid
})

const invalidReports = reports.filter(report => {
  const validation = validateReportMetrics(report, investments, investors)
  return !validation.isValid
})

console.log(`Total Reports:   ${reports.length}`)
console.log(`Valid Reports:   ${validReports.length} ✅`)
console.log(`Invalid Reports: ${invalidReports.length} ❌`)

if (invalidReports.length > 0) {
  console.log('')
  console.log('Reports requiring correction:')
  invalidReports.forEach(report => {
    console.log(`  • ${report.id}: ${report.title}`)
  })
}

console.log('')
console.log('═══════════════════════════════════════════════════════════')
console.log('VALIDATION COMPLETE')
console.log('═══════════════════════════════════════════════════════════\n')

// Generate corrected metrics for all reports
console.log('\n📋 CORRECTED METRICS FOR ALL REPORTS')
console.log('─────────────────────────────────────────────────────────\n')

reports.forEach(report => {
  const filteredInvestments = investments.filter(inv =>
    report.includesInvestments.includes(inv.id)
  )
  const filteredInvestors = investors.filter(inv =>
    report.includesInvestors.includes(inv.id)
  )

  const corrected = generateReportMetrics(filteredInvestments, filteredInvestors)

  console.log(`${report.id}: ${report.title}`)
  console.log(`  totalAUM: ${corrected.totalAUM},`)
  console.log(`  avgIRR: ${corrected.avgIRR.toFixed(1)},`)
  console.log(`  totalDistributions: ${corrected.totalDistributions}`)
  console.log('')
})
