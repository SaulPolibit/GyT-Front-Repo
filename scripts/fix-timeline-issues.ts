/**
 * Script to fix timeline issues in reports
 * Addresses: NAV progression, capital call/distribution impacts, IRR evolution
 * Run with: npx tsx scripts/fix-timeline-issues.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import reportsData from '../src/data/reports.json'
import type { Report } from '../src/lib/types'

const reports = reportsData as Report[]

console.log('═══════════════════════════════════════════════════════════')
console.log('FIXING TIMELINE ISSUES IN REPORTS')
console.log('═══════════════════════════════════════════════════════════\n')

// Define realistic NAV progression with explanations
const navProgression = {
  'report-003': { // 2024 Annual
    newAUM: 42000000,
    newIRR: 10.8,
    reasoning: 'Starting baseline - fund early stage with moderate performance'
  },
  'report-002': { // Q2 2025
    newAUM: 43800000,
    newIRR: 11.2,
    reasoning: 'Q2: +$1.8M growth (+4.3%) from portfolio appreciation'
  },
  'report-005': { // August Distribution (before Q3)
    // Distribution happened in August, part of Q3
    // This will be reflected in Q3 numbers
  },
  'report-004': { // September Capital Call (during Q3)
    // Capital call in September, part of Q3
    // This will be reflected in Q3 numbers
  },
  'report-001': { // Q3 2025
    newAUM: 45100000,
    newIRR: 11.8,
    reasoning: 'Q3: Starting $43.8M - $850K distribution + $1.5M capital call + $650K growth = $45.1M'
  },
  'report-006': { // October 2025
    newAUM: 45600000,
    newIRR: 12.1,
    reasoning: 'October: +$500K growth from continued strong performance'
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

// Update each report
const updatedReports = reports.map(report => {
  const update = navProgression[report.id as keyof typeof navProgression]

  if (update && 'newAUM' in update && 'newIRR' in update) {
    const oldAUM = report.metrics.totalAUM
    const oldIRR = report.metrics.avgIRR

    console.log(`📊 ${report.title}`)
    console.log(`   AUM: ${formatCurrency(oldAUM)} → ${formatCurrency(update.newAUM)} (${update.newAUM > oldAUM ? '+' : ''}${formatCurrency(update.newAUM - oldAUM)})`)
    console.log(`   IRR: ${oldIRR.toFixed(1)}% → ${update.newIRR.toFixed(1)}% (${update.newIRR > oldIRR ? '+' : ''}${(update.newIRR - oldIRR).toFixed(1)}%)`)
    console.log(`   Reason: ${update.reasoning}`)
    console.log('')

    return {
      ...report,
      metrics: {
        ...report.metrics,
        totalAUM: update.newAUM,
        avgIRR: update.newIRR
      }
    }
  }

  // Fix distribution date (must be before generation date)
  if (report.id === 'report-005' && report.distribution) {
    console.log(`📅 ${report.title}`)
    console.log(`   Distribution Date: ${report.distribution.distributionDate} → 2025-08-25`)
    console.log(`   Reason: Distribution must occur before report generation (Aug 28)`)
    console.log('')

    return {
      ...report,
      distribution: {
        ...report.distribution,
        distributionDate: '2025-08-25'
      }
    }
  }

  return report
})

// Write updated reports
const reportsPath = join(__dirname, '../src/data/reports.json')
writeFileSync(reportsPath, JSON.stringify(updatedReports, null, 2))

console.log('═══════════════════════════════════════════════════════════')
console.log('✅ TIMELINE ISSUES FIXED')
console.log('═══════════════════════════════════════════════════════════\n')

// Summary
console.log('📈 NAV PROGRESSION SUMMARY')
console.log('─────────────────────────────────────────────────────────')
console.log('2024 Annual (Dec 2024):    $42,000,000  (10.8% IRR) - Baseline')
console.log('Q2 2025 (Jun 2025):        $43,800,000  (11.2% IRR) - +$1.8M growth')
console.log('Q3 2025 (Sep 2025):        $45,100,000  (11.8% IRR) - +$1.5M call -$850K dist +$650K growth')
console.log('October 2025 (Oct 2025):   $45,600,000  (12.1% IRR) - +$500K growth')
console.log('')

console.log('💰 TRANSACTION TIMELINE')
console.log('─────────────────────────────────────────────────────────')
console.log('Aug 25, 2025:  Distribution of $850,000 to 3 investors')
console.log('Sep 25, 2025:  Capital Call of $1,500,000 from 3 investors')
console.log('Net Impact:    +$650,000 increase in fund capital')
console.log('')

console.log('🔢 MATHEMATICAL VALIDATION')
console.log('─────────────────────────────────────────────────────────')
console.log('Q2 Ending NAV:             $43,800,000')
console.log('- Distribution (Aug):         -$850,000')
console.log('+ Capital Call (Sep):       +$1,500,000')
console.log('+ Portfolio Growth (Q3):      +$650,000')
console.log('= Q3 Ending NAV:            $45,100,000  ✓')
console.log('')
console.log('Q3 Ending NAV:             $45,100,000')
console.log('+ Portfolio Growth (Oct):     +$500,000')
console.log('= October NAV:              $45,600,000  ✓')
console.log('')

console.log('File updated: src/data/reports.json')
console.log('')
