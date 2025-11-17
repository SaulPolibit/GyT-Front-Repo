/**
 * Script to add detailed investor allocations to Capital Call and Distribution reports
 * Run with: npx tsx scripts/add-investor-allocations.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import investorsData from '../src/data/investors.json'
import investmentsData from '../src/data/investments.json'
import reportsData from '../src/data/reports.json'
import type { Investor, Investment, Report } from '../src/lib/types'
import { generateCapitalCallAllocations, generateDistributionAllocations } from '../src/lib/report-calculations'

const investors = investorsData as Investor[]
const investments = investmentsData as Investment[]
const reports = reportsData as Report[]

console.log('═══════════════════════════════════════════════════════════')
console.log('ADDING INVESTOR ALLOCATIONS TO REPORTS')
console.log('═══════════════════════════════════════════════════════════\n')

// Process each report
const updatedReports = reports.map(report => {
  // Handle Capital Call reports
  if (report.type === 'Capital Call') {
    console.log(`📞 Processing Capital Call: ${report.title}`)

    // Get the investors included in this report
    const reportInvestors = investors.filter(inv =>
      report.includesInvestors.includes(inv.id)
    )

    // For Capital Call report-004, it's for Sunset Tower Apartments (inv-001)
    // Let's call $1.5M for additional capital needs
    const totalCallAmount = 1500000
    const relatedInvestment = investments.find(inv => inv.id === 'inv-001')

    // Generate investor allocations
    const investorAllocations = generateCapitalCallAllocations(
      reportInvestors,
      totalCallAmount,
      'Pending'
    )

    console.log(`  Total Call Amount: $${totalCallAmount.toLocaleString()}`)
    console.log(`  Investors: ${reportInvestors.length}`)
    console.log(`  Allocations:`)
    investorAllocations.forEach(alloc => {
      console.log(`    - ${alloc.investorName}: $${alloc.amount.toLocaleString()} (${alloc.ownershipPercent.toFixed(2)}%)`)
    })
    console.log('')

    return {
      ...report,
      capitalCall: {
        totalCallAmount,
        callNumber: 3,
        dueDate: '2025-10-15',
        purpose: 'Additional capital for property improvements and reserve funding',
        relatedInvestmentId: relatedInvestment?.id,
        relatedInvestmentName: relatedInvestment?.name,
        investorAllocations
      }
    }
  }

  // Handle Distribution reports
  if (report.type === 'Distribution') {
    console.log(`💰 Processing Distribution: ${report.title}`)

    // Get the investors included in this report
    const reportInvestors = investors.filter(inv =>
      report.includesInvestors.includes(inv.id)
    )

    // For Distribution report-005, distributing $850K from operating income
    const totalDistributionAmount = 850000
    const relatedInvestments = investments.filter(inv =>
      report.includesInvestments.includes(inv.id)
    )

    // Generate investor allocations
    const investorAllocations = generateDistributionAllocations(
      reportInvestors,
      totalDistributionAmount,
      'Paid'
    )

    console.log(`  Total Distribution: $${totalDistributionAmount.toLocaleString()}`)
    console.log(`  Investors: ${reportInvestors.length}`)
    console.log(`  Source: Operating income from ${relatedInvestments.map(i => i.name).join(', ')}`)
    console.log(`  Allocations:`)
    investorAllocations.forEach(alloc => {
      console.log(`    - ${alloc.investorName}: $${alloc.amount.toLocaleString()} (${alloc.ownershipPercent.toFixed(2)}%)`)
    })
    console.log('')

    return {
      ...report,
      distribution: {
        totalDistributionAmount,
        distributionNumber: 2,
        distributionDate: '2025-09-05',
        source: 'Operating Income',
        relatedInvestmentId: relatedInvestments.length === 1 ? relatedInvestments[0].id : undefined,
        relatedInvestmentName: relatedInvestments.length === 1 ? relatedInvestments[0].name : undefined,
        investorAllocations
      }
    }
  }

  // Return other reports unchanged
  return report
})

// Write updated reports to file
const reportsPath = join(__dirname, '../src/data/reports.json')
writeFileSync(reportsPath, JSON.stringify(updatedReports, null, 2))

console.log('═══════════════════════════════════════════════════════════')
console.log('✅ INVESTOR ALLOCATIONS ADDED SUCCESSFULLY')
console.log('═══════════════════════════════════════════════════════════\n')

// Summary
const capitalCallReports = updatedReports.filter(r => r.type === 'Capital Call')
const distributionReports = updatedReports.filter(r => r.type === 'Distribution')

console.log('📊 SUMMARY')
console.log('─────────────────────────────────────────────────────────')
console.log(`Total Reports: ${updatedReports.length}`)
console.log(`Capital Call Reports: ${capitalCallReports.length} (with detailed allocations)`)
console.log(`Distribution Reports: ${distributionReports.length} (with detailed allocations)`)
console.log('')

// Show total allocations
const totalCapitalCallAmount = capitalCallReports.reduce((sum, r) =>
  sum + (r.capitalCall?.totalCallAmount || 0), 0
)
const totalDistributionAmount = distributionReports.reduce((sum, r) =>
  sum + (r.distribution?.totalDistributionAmount || 0), 0
)

console.log(`Total Capital Called: $${totalCapitalCallAmount.toLocaleString()}`)
console.log(`Total Distributions: $${totalDistributionAmount.toLocaleString()}`)
console.log('')
console.log('File updated: src/data/reports.json')
console.log('')
