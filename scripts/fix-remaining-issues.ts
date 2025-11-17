/**
 * Script to fix remaining medium-priority issues
 * 1. October report period (generated mid-month)
 * 2. Investor allocation logic for distribution
 * Run with: npx tsx scripts/fix-remaining-issues.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import reportsData from '../src/data/reports.json'
import investorsData from '../src/data/investors.json'
import type { Report, Investor } from '../src/lib/types'
import { generateDistributionAllocations } from '../src/lib/report-calculations'

const reports = reportsData as Report[]
const investors = investorsData as Investor[]

console.log('═══════════════════════════════════════════════════════════')
console.log('FIXING REMAINING ISSUES')
console.log('═══════════════════════════════════════════════════════════\n')

// Fix 1: October report period
console.log('📅 ISSUE 1: October Report Period')
console.log('─────────────────────────────────────────────────────────')
console.log('Problem: Report generated Oct 10, but covers full month (Oct 1-31)')
console.log('Solution: Move generation to Nov 1-3 (after month end)')
console.log('')

// Fix 2: Distribution investor allocation logic
console.log('💰 ISSUE 2: Distribution Investor Allocation')
console.log('─────────────────────────────────────────────────────────')
console.log('Problem: Distribution only includes 3 of 5 investors')
console.log('Solution: Include all 5 investors based on fund ownership')
console.log('')
console.log('Current allocation (3 investors):')
console.log('  Anderson Family Office: 17.78% → $151,111')
console.log('  David Chen: 6.67% → $56,667')
console.log('  Rodriguez Capital: 26.67% → $226,667')
console.log('  Total: 51.11% → $434,445')
console.log('')
console.log('NEW allocation (ALL 5 investors):')

// Calculate allocations for ALL investors
const allInvestors = investors
const totalDistribution = 850000

const newAllocations = generateDistributionAllocations(allInvestors, totalDistribution, 'Paid')

newAllocations.forEach(alloc => {
  console.log(`  ${alloc.investorName}: ${alloc.ownershipPercent.toFixed(2)}% → $${Math.round(alloc.amount).toLocaleString()}`)
})
console.log(`  Total: 100.00% → $${totalDistribution.toLocaleString()}`)
console.log('')

// Update reports
const updatedReports = reports.map(report => {
  // Fix October report period
  if (report.id === 'report-006') {
    console.log('✅ Updating October 2025 Report:')
    console.log('   Generation Date: 2025-10-10 → 2025-11-01')
    console.log('   Created At: 2025-10-10 → 2025-11-01')
    console.log('   Updated At: 2025-10-10 → 2025-11-01')
    console.log('')

    return {
      ...report,
      generatedDate: '2025-11-01',
      createdAt: '2025-11-01T10:00:00Z',
      updatedAt: '2025-11-01T15:30:00Z'
    }
  }

  // Fix distribution allocations
  if (report.id === 'report-005' && report.distribution) {
    console.log('✅ Updating August 2025 Distribution:')
    console.log('   Investors: 3 → 5 (now includes ALL investors)')
    console.log('   Total allocation: 51.11% → 100.00%')
    console.log('')

    return {
      ...report,
      includesInvestors: [
        'investor-001',
        'investor-002',
        'investor-003',
        'investor-004',
        'investor-005'
      ],
      metrics: {
        ...report.metrics,
        totalInvestors: 5
      },
      distribution: {
        ...report.distribution,
        investorAllocations: newAllocations
      },
      sentTo: [
        {
          investorId: 'investor-001',
          investorName: 'Sarah Johnson',
          sentDate: '2025-08-29',
          opened: true
        },
        {
          investorId: 'investor-002',
          investorName: 'Anderson Family Office',
          sentDate: '2025-08-29',
          opened: true
        },
        {
          investorId: 'investor-003',
          investorName: 'Metropolitan Pension Fund',
          sentDate: '2025-08-29',
          opened: false
        },
        {
          investorId: 'investor-004',
          investorName: 'David Chen',
          sentDate: '2025-08-29',
          opened: true
        },
        {
          investorId: 'investor-005',
          investorName: 'Rodriguez Capital Partners',
          sentDate: '2025-08-29',
          opened: true
        }
      ]
    }
  }

  return report
})

// Write updated reports
const reportsPath = join(__dirname, '../src/data/reports.json')
writeFileSync(reportsPath, JSON.stringify(updatedReports, null, 2))

console.log('═══════════════════════════════════════════════════════════')
console.log('✅ ALL REMAINING ISSUES FIXED')
console.log('═══════════════════════════════════════════════════════════\n')

console.log('📊 FINAL SUMMARY')
console.log('─────────────────────────────────────────────────────────')
console.log('Total Reports: 8')
console.log('Issues Fixed: 8')
console.log('')
console.log('✅ CRITICAL (5):')
console.log('  1. NAV progression showing realistic growth')
console.log('  2. Capital call reflected in Q3 NAV')
console.log('  3. Distribution reflected in Q3 NAV')
console.log('  4. Distribution date fixed (before generation)')
console.log('  5. IRR progression across quarters')
console.log('')
console.log('✅ HIGH (1):')
console.log('  6. Q1 2025 report added (no more gaps)')
console.log('')
console.log('✅ MEDIUM (2):')
console.log('  7. October report period fixed (generated after month-end)')
console.log('  8. Distribution includes all 5 investors (100% allocation)')
console.log('')
console.log('File updated: src/data/reports.json')
console.log('')
