/**
 * Script to fix all report metrics using calculated values from source data
 * Run with: npx tsx scripts/fix-report-metrics.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import investorsData from '../src/data/investors.json'
import investmentsData from '../src/data/investments.json'
import reportsData from '../src/data/reports.json'
import type { Investor, Investment, Report } from '../src/lib/types'
import {
  validateReportMetrics,
  generateReportMetrics,
  calculateFundNAV,
  calculateAvgIRR,
  calculateTotalDistributions
} from '../src/lib/report-calculations'

const investors = investorsData as Investor[]
const investments = investmentsData as Investment[]
const reports = reportsData as Report[]

console.log('═══════════════════════════════════════════════════════════')
console.log('FIXING REPORT METRICS')
console.log('═══════════════════════════════════════════════════════════\n')

// Process each report
const updatedReports = reports.map(report => {
  console.log(`📊 Processing: ${report.title} (${report.id})`)
  console.log('─────────────────────────────────────────────────────────')

  // Get filtered data for this report
  const reportInvestments = investments.filter(inv =>
    report.includesInvestments.includes(inv.id)
  )
  const reportInvestors = investors.filter(inv =>
    report.includesInvestors.includes(inv.id)
  )

  // Calculate correct metrics
  const correctAUM = calculateFundNAV(reportInvestments)
  const correctIRR = calculateAvgIRR(reportInvestments)
  const correctDistributions = calculateTotalDistributions(reportInvestors)

  // Show before/after
  console.log('BEFORE:')
  console.log(`  Total AUM:          $${report.metrics.totalAUM.toLocaleString()}`)
  console.log(`  Avg IRR:            ${report.metrics.avgIRR.toFixed(1)}%`)
  console.log(`  Total Distributions: $${report.metrics.totalDistributions.toLocaleString()}`)

  console.log('\nAFTER (CORRECTED):')
  console.log(`  Total AUM:          $${correctAUM.toLocaleString()}`)
  console.log(`  Avg IRR:            ${correctIRR.toFixed(1)}%`)
  console.log(`  Total Distributions: $${correctDistributions.toLocaleString()}`)

  // Calculate differences
  const aumDiff = correctAUM - report.metrics.totalAUM
  const irrDiff = correctIRR - report.metrics.avgIRR
  const distDiff = correctDistributions - report.metrics.totalDistributions

  console.log('\nCHANGES:')
  console.log(`  AUM:          ${aumDiff >= 0 ? '+' : ''}$${aumDiff.toLocaleString()}`)
  console.log(`  IRR:          ${irrDiff >= 0 ? '+' : ''}${irrDiff.toFixed(1)}%`)
  console.log(`  Distributions: ${distDiff >= 0 ? '+' : ''}$${distDiff.toLocaleString()}`)
  console.log('')

  // Return updated report
  return {
    ...report,
    metrics: {
      ...report.metrics,
      totalAUM: correctAUM,
      avgIRR: parseFloat(correctIRR.toFixed(1)),
      totalDistributions: correctDistributions
    }
  }
})

// Write updated reports to file
const reportsPath = join(__dirname, '../src/data/reports.json')
writeFileSync(reportsPath, JSON.stringify(updatedReports, null, 2))

console.log('═══════════════════════════════════════════════════════════')
console.log('✅ ALL REPORT METRICS CORRECTED')
console.log('═══════════════════════════════════════════════════════════\n')

// Validation pass
console.log('🔍 RUNNING VALIDATION...\n')

let allValid = true
updatedReports.forEach(report => {
  const reportInvestments = investments.filter(inv =>
    report.includesInvestments.includes(inv.id)
  )
  const reportInvestors = investors.filter(inv =>
    report.includesInvestors.includes(inv.id)
  )

  const validation = validateReportMetrics(report, investments, investors)

  if (validation.isValid) {
    console.log(`✅ ${report.id}: ${report.title} - VALID`)
  } else {
    console.log(`❌ ${report.id}: ${report.title} - INVALID`)
    validation.errors.forEach(error => {
      console.log(`   • ${error}`)
    })
    allValid = false
  }
})

console.log('')
console.log('═══════════════════════════════════════════════════════════')
if (allValid) {
  console.log('✅ SUCCESS: All reports are now valid!')
} else {
  console.log('⚠️  WARNING: Some reports still have validation errors')
}
console.log('═══════════════════════════════════════════════════════════\n')

// Summary statistics
console.log('📈 SUMMARY STATISTICS')
console.log('─────────────────────────────────────────────────────────')

const totalAUMBefore = reports.reduce((sum, r) => sum + r.metrics.totalAUM, 0) / reports.length
const totalAUMAfter = updatedReports.reduce((sum, r) => sum + r.metrics.totalAUM, 0) / updatedReports.length

const avgIRRBefore = reports.reduce((sum, r) => sum + r.metrics.avgIRR, 0) / reports.length
const avgIRRAfter = updatedReports.reduce((sum, r) => sum + r.metrics.avgIRR, 0) / updatedReports.length

const totalDistBefore = reports.reduce((sum, r) => sum + r.metrics.totalDistributions, 0)
const totalDistAfter = updatedReports.reduce((sum, r) => sum + r.metrics.totalDistributions, 0)

console.log(`Average AUM:`)
console.log(`  Before: $${totalAUMBefore.toLocaleString()}`)
console.log(`  After:  $${totalAUMAfter.toLocaleString()}`)
console.log(`  Change: ${((totalAUMAfter - totalAUMBefore) / totalAUMBefore * 100).toFixed(1)}%`)
console.log('')

console.log(`Average IRR:`)
console.log(`  Before: ${avgIRRBefore.toFixed(1)}%`)
console.log(`  After:  ${avgIRRAfter.toFixed(1)}%`)
console.log(`  Change: ${(avgIRRAfter - avgIRRBefore).toFixed(1)}%`)
console.log('')

console.log(`Total Distributions (summed across all reports):`)
console.log(`  Before: $${totalDistBefore.toLocaleString()}`)
console.log(`  After:  $${totalDistAfter.toLocaleString()}`)
console.log(`  Change: ${totalDistAfter >= 0 ? '+' : ''}$${(totalDistAfter - totalDistBefore).toLocaleString()}`)
console.log('')

console.log('File updated: src/data/reports.json')
console.log('')
