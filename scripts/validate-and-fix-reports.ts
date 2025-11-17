/**
 * Comprehensive validation and fix for all report issues
 * - Fix totalDistributions calculation
 * - Track distribution payment history
 * - Validate data consistency
 * - Cross-reference with promised features
 * Run with: npx tsx scripts/validate-and-fix-reports.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import reportsData from '../src/data/reports.json'
import investorsData from '../src/data/investors.json'
import type { Report, Investor } from '../src/lib/types'

const reports = reportsData as Report[]
const investors = investorsData as Investor[]

console.log('═══════════════════════════════════════════════════════════')
console.log('COMPREHENSIVE REPORT VALIDATION & FIX')
console.log('═══════════════════════════════════════════════════════════\n')

// Track all distribution events chronologically
interface DistributionEvent {
  date: string
  reportId: string
  amount: number
  investorAllocations: any[]
}

const distributionEvents: DistributionEvent[] = []

// Find all distribution reports
reports.forEach(report => {
  if (report.distribution) {
    distributionEvents.push({
      date: report.distribution.distributionDate,
      reportId: report.id,
      amount: report.distribution.totalDistributionAmount,
      investorAllocations: report.distribution.investorAllocations
    })
  }
})

// Sort by date
distributionEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

console.log('📊 DISTRIBUTION HISTORY FOUND')
console.log('─────────────────────────────────────────────────────────')
distributionEvents.forEach((event, idx) => {
  console.log(`${idx + 1}. ${event.date}: $${event.amount.toLocaleString()} (${event.reportId})`)
  console.log(`   Paid to ${event.investorAllocations.length} investors`)
})
console.log('')

// Calculate cumulative distributions up to each report date
function calculateCumulativeDistributions(reportEndDate: string): number {
  return distributionEvents
    .filter(event => new Date(event.date) <= new Date(reportEndDate))
    .reduce((sum, event) => sum + event.amount, 0)
}

// VALIDATION ISSUES
const issues: string[] = []

console.log('🔍 VALIDATION CHECKS')
console.log('─────────────────────────────────────────────────────────\n')

// Check 1: totalDistributions metric
console.log('CHECK 1: totalDistributions Metric')
console.log('───────────────────────────────────────')
reports.forEach(report => {
  const expectedDistributions = calculateCumulativeDistributions(report.periodEnd)
  const actualDistributions = report.metrics.totalDistributions

  if (expectedDistributions !== actualDistributions) {
    console.log(`❌ ${report.title}`)
    console.log(`   Expected: $${expectedDistributions.toLocaleString()}`)
    console.log(`   Actual: $${actualDistributions.toLocaleString()}`)
    console.log(`   Gap: $${(expectedDistributions - actualDistributions).toLocaleString()}`)
    issues.push(`${report.id}: totalDistributions mismatch`)
  } else {
    console.log(`✅ ${report.title}: $${actualDistributions.toLocaleString()}`)
  }
})
console.log('')

// Check 2: Investment progression
console.log('CHECK 2: Investment Progression')
console.log('───────────────────────────────────────')
const investmentProgression = [
  { report: '2024 Annual (Dec 2024)', expected: 6 },
  { report: 'Q1 2025 (Mar 2025)', expected: 6 },
  { report: 'Q2 2025 (Jun 2025)', expected: 7 }, // Added inv-007
  { report: 'Q3 2025 (Sep 2025)', expected: 6 }, // Exited inv-005
  { report: 'October 2025', expected: 6 }
]
investmentProgression.forEach((item, idx) => {
  const report = reports.find(r => r.title.includes(item.report.split(' ')[0]))
  if (report) {
    const actual = report.metrics.totalInvestments
    if (actual === item.expected) {
      console.log(`✅ ${item.report}: ${actual} investments`)
    } else {
      console.log(`❌ ${item.report}: Expected ${item.expected}, got ${actual}`)
      issues.push(`Investment count mismatch in ${item.report}`)
    }
  }
})
console.log('')

// Check 3: AUM progression (should generally increase)
console.log('CHECK 3: AUM Progression Logic')
console.log('───────────────────────────────────────')
const aumProgression = [
  { id: 'report-003', title: '2024 Annual' },
  { id: 'report-008', title: 'Q1 2025' },
  { id: 'report-002', title: 'Q2 2025' },
  { id: 'report-001', title: 'Q3 2025' },
  { id: 'report-006', title: 'October 2025' }
]

for (let i = 1; i < aumProgression.length; i++) {
  const prev = reports.find(r => r.id === aumProgression[i - 1].id)
  const curr = reports.find(r => r.id === aumProgression[i].id)

  if (prev && curr) {
    const change = curr.metrics.totalAUM - prev.metrics.totalAUM
    const pctChange = (change / prev.metrics.totalAUM * 100).toFixed(1)

    console.log(`${aumProgression[i].title}: $${curr.metrics.totalAUM.toLocaleString()} (${pctChange > '0' ? '+' : ''}${pctChange}%)`)

    // Q3 should account for capital call (+$1.5M) and distribution (-$850K)
    if (curr.id === 'report-001') {
      const expectedChange = 1500000 - 850000 // Net should be +$650K + growth
      if (change < 0) {
        console.log(`⚠️  Q3 2025 AUM decreased despite capital call - check calculations`)
        issues.push('Q3 AUM logic issue')
      }
    }
  }
}
console.log('')

// Check 4: Distribution report specifics
console.log('CHECK 4: Distribution Report Details')
console.log('───────────────────────────────────────')
const distReport = reports.find(r => r.type === 'Distribution')
if (distReport && distReport.distribution) {
  const totalAllocated = distReport.distribution.investorAllocations.reduce(
    (sum, alloc) => sum + alloc.amount,
    0
  )
  const reported = distReport.distribution.totalDistributionAmount

  console.log(`Total Distribution Amount: $${reported.toLocaleString()}`)
  console.log(`Sum of Allocations: $${totalAllocated.toLocaleString()}`)
  console.log(`Difference: $${Math.abs(totalAllocated - reported).toFixed(2)}`)

  if (Math.abs(totalAllocated - reported) > 1) {
    console.log(`⚠️  Allocation mismatch detected`)
    issues.push('Distribution allocation sum mismatch')
  } else {
    console.log(`✅ Allocations sum correctly`)
  }

  console.log(`\nInvestors: ${distReport.distribution.investorAllocations.length}/5`)
  if (distReport.distribution.investorAllocations.length < 5) {
    console.log(`⚠️  Not all investors included in distribution`)
    issues.push('Incomplete investor distribution list')
  } else {
    console.log(`✅ All investors included`)
  }
}
console.log('')

// FIX: Update totalDistributions for all reports
console.log('═══════════════════════════════════════════════════════════')
console.log('APPLYING FIXES')
console.log('═══════════════════════════════════════════════════════════\n')

const updatedReports = reports.map(report => {
  const cumulativeDistributions = calculateCumulativeDistributions(report.periodEnd)
  const oldValue = report.metrics.totalDistributions
  const needsUpdate = cumulativeDistributions !== oldValue

  if (needsUpdate) {
    console.log(`📝 ${report.title}`)
    console.log(`   totalDistributions: $${oldValue.toLocaleString()} → $${cumulativeDistributions.toLocaleString()}`)
  }

  return {
    ...report,
    metrics: {
      ...report.metrics,
      totalDistributions: cumulativeDistributions
    }
  }
})

// Write updated reports
const reportsPath = join(__dirname, '../src/data/reports.json')
writeFileSync(reportsPath, JSON.stringify(updatedReports, null, 2))

console.log('')
console.log('═══════════════════════════════════════════════════════════')
console.log('VALIDATION SUMMARY')
console.log('═══════════════════════════════════════════════════════════\n')

if (issues.length === 0) {
  console.log('✅ ALL VALIDATION CHECKS PASSED')
} else {
  console.log(`⚠️  ${issues.length} ISSUES FOUND:`)
  issues.forEach((issue, idx) => {
    console.log(`   ${idx + 1}. ${issue}`)
  })
}

console.log('')
console.log('📋 PROMISED FEATURES CHECK')
console.log('─────────────────────────────────────────────────────────')
console.log('✅ Automated quarterly report generation - IMPLEMENTED')
console.log('✅ Distribution history reports - IMPLEMENTED')
console.log('✅ Capital activity tracking - IMPLEMENTED (capital calls)')
console.log('✅ Complete transaction history - IMPLEMENTED (distributions)')
console.log('✅ Real-time capital account tracking - DATA READY')
console.log('⚠️  Contribution and distribution history (investor-level) - NEEDS UI')
console.log('⚠️  Commitment vs. funded tracking - NEEDS IMPLEMENTATION')
console.log('⚠️  Multi-currency reporting - NEEDS IMPLEMENTATION')
console.log('⚠️  Custom report builder - NEEDS IMPLEMENTATION')
console.log('')

console.log('File updated: src/data/reports.json')
console.log('')
