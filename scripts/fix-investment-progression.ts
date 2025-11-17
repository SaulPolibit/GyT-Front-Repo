/**
 * Script to fix investment progression across reports
 * - Vary investment count over time (acquisitions & exits)
 * - Update investment values quarterly
 * - Reflect realistic portfolio evolution
 * Run with: npx tsx scripts/fix-investment-progression.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import reportsData from '../src/data/reports.json'
import type { Report } from '../src/lib/types'

const reports = reportsData as Report[]

console.log('═══════════════════════════════════════════════════════════')
console.log('FIXING INVESTMENT PROGRESSION ACROSS REPORTS')
console.log('═══════════════════════════════════════════════════════════\n')

/**
 * Investment Timeline:
 *
 * Historical (pre-2024):
 * - inv-002: Sept 2021 (Metro Plaza Office)
 * - inv-006: Nov 2021 (Greenway Shopping Center)
 * - inv-001: Mar 2022 (Sunset Tower Apartments)
 * - inv-004: Jun 2022 (HealthFirst Medical)
 * - inv-003: Jan 2023 (TechCo Software)
 * - inv-005: Mar 2024 (Bridge Loan - Riverside)
 *
 * 2024 Annual (Dec 31, 2024):
 * - All 6 investments active
 * - Total: 6 investments
 *
 * Q1 2025 (Mar 31, 2025):
 * - All 6 investments active
 * - Total: 6 investments
 *
 * Q2 2025 (Jun 30, 2025):
 * - New acquisition: inv-007 (acquired May 2025)
 * - Total: 7 investments
 *
 * Q3 2025 (Sep 30, 2025):
 * - Bridge Loan (inv-005) matures & exits (Sept 2025)
 * - Total: 6 investments (lost inv-005, keeping inv-007)
 *
 * October 2025:
 * - Same 6 investments
 * - Total: 6 investments
 */

const investmentProgression = {
  'report-003': { // 2024 Annual
    investments: ['inv-001', 'inv-002', 'inv-003', 'inv-004', 'inv-005', 'inv-006'],
    count: 6,
    reasoning: 'All 6 initial investments acquired by Dec 2024'
  },
  'report-008': { // Q1 2025
    investments: ['inv-001', 'inv-002', 'inv-003', 'inv-004', 'inv-005', 'inv-006'],
    count: 6,
    reasoning: 'No changes in Q1 - same 6 investments'
  },
  'report-002': { // Q2 2025
    investments: ['inv-001', 'inv-002', 'inv-003', 'inv-004', 'inv-005', 'inv-006', 'inv-007'],
    count: 7,
    reasoning: 'New acquisition inv-007 in May 2025 → 7 investments'
  },
  'report-001': { // Q3 2025
    investments: ['inv-001', 'inv-002', 'inv-003', 'inv-004', 'inv-006', 'inv-007'],
    count: 6,
    reasoning: 'Bridge Loan (inv-005) matured & exited Sept 2025 → Back to 6'
  },
  'report-006': { // October 2025
    investments: ['inv-001', 'inv-002', 'inv-003', 'inv-004', 'inv-006', 'inv-007'],
    count: 6,
    reasoning: 'Same 6 investments as Q3'
  },
  'report-004': { // Capital Call (Sept 2025)
    investments: ['inv-001'], // Only for Sunset Tower
    count: 1,
    reasoning: 'Capital call specific to Sunset Tower investment'
  },
  'report-005': { // Distribution (Aug 2025)
    investments: ['inv-003', 'inv-004'], // TechCo & HealthFirst
    count: 2,
    reasoning: 'Distribution from TechCo & HealthFirst performance'
  },
  'report-007': { // Custom Report (Real Estate only)
    investments: ['inv-001', 'inv-002', 'inv-006'], // RE only
    count: 3,
    reasoning: 'Real Estate portfolio analysis (3 properties)'
  }
}

// Update each report
const updatedReports = reports.map(report => {
  const progression = investmentProgression[report.id as keyof typeof investmentProgression]

  if (progression) {
    console.log(`📊 ${report.title}`)
    console.log(`   Investments: ${report.includesInvestments.length} → ${progression.count}`)
    console.log(`   Reason: ${progression.reasoning}`)
    console.log(`   IDs: [${progression.investments.join(', ')}]`)
    console.log('')

    return {
      ...report,
      includesInvestments: progression.investments,
      metrics: {
        ...report.metrics,
        totalInvestments: progression.count
      }
    }
  }

  return report
})

// Write updated reports
const reportsPath = join(__dirname, '../src/data/reports.json')
writeFileSync(reportsPath, JSON.stringify(updatedReports, null, 2))

console.log('═══════════════════════════════════════════════════════════')
console.log('✅ INVESTMENT PROGRESSION FIXED')
console.log('═══════════════════════════════════════════════════════════\n')

console.log('📈 INVESTMENT EVOLUTION TIMELINE')
console.log('─────────────────────────────────────────────────────────')
console.log('2024 Annual (Dec 2024):    6 investments (inv-001 to inv-006)')
console.log('Q1 2025 (Mar 2025):        6 investments (no change)')
console.log('Q2 2025 (Jun 2025):        7 investments (+inv-007 acquired May 2025)')
console.log('Q3 2025 (Sep 2025):        6 investments (-inv-005 exited Sept 2025)')
console.log('October 2025:              6 investments (no change)')
console.log('')

console.log('📊 PORTFOLIO ACTIVITY')
console.log('─────────────────────────────────────────────────────────')
console.log('May 2025:  NEW ACQUISITION → inv-007 added to portfolio')
console.log('Sept 2025: EXIT/MATURITY → inv-005 (Bridge Loan) repaid & exited')
console.log('Net Change: +1 new investment, -1 exit = 6 total (stable)')
console.log('')

console.log('File updated: src/data/reports.json')
console.log('')
