/**
 * Script to add Q1 2025 Quarterly Report to fill the reporting gap
 * Run with: npx tsx scripts/add-q1-2025-report.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import reportsData from '../src/data/reports.json'
import type { Report } from '../src/lib/types'

const reports = reportsData as Report[]

console.log('═══════════════════════════════════════════════════════════')
console.log('ADDING Q1 2025 QUARTERLY REPORT')
console.log('═══════════════════════════════════════════════════════════\n')

// Create Q1 2025 report
const q1Report: Report = {
  id: 'report-008',
  title: 'Q1 2025 Quarterly Report',
  type: 'Quarterly',
  status: 'Published',
  periodStart: '2025-01-01',
  periodEnd: '2025-03-31',
  generatedDate: '2025-04-05',
  publishedDate: '2025-04-08',
  includesInvestments: [
    'inv-001',
    'inv-002',
    'inv-003',
    'inv-004',
    'inv-005',
    'inv-006'
  ],
  includesInvestors: [
    'investor-001',
    'investor-002',
    'investor-003',
    'investor-004',
    'investor-005'
  ],
  metrics: {
    totalAUM: 42900000,
    totalInvestments: 6,
    totalInvestors: 5,
    avgIRR: 11.0,
    totalDistributions: 0
  },
  pdfUrl: '/reports/q1-2025-quarterly-report.pdf',
  excelUrl: '/reports/q1-2025-quarterly-report.xlsx',
  sentTo: [
    {
      investorId: 'investor-001',
      investorName: 'Sarah Johnson',
      sentDate: '2025-04-08',
      opened: true
    },
    {
      investorId: 'investor-002',
      investorName: 'Anderson Family Office',
      sentDate: '2025-04-08',
      opened: true
    },
    {
      investorId: 'investor-003',
      investorName: 'Metropolitan Pension Fund',
      sentDate: '2025-04-08',
      opened: false
    },
    {
      investorId: 'investor-004',
      investorName: 'David Chen',
      sentDate: '2025-04-08',
      opened: true
    }
  ],
  createdBy: 'Gabriela Mena',
  createdAt: '2025-04-05T10:00:00Z',
  updatedAt: '2025-04-08T15:30:00Z'
}

console.log('📊 Creating Q1 2025 Quarterly Report')
console.log('─────────────────────────────────────────────────────────')
console.log('ID:', q1Report.id)
console.log('Period: Jan 1 - Mar 31, 2025')
console.log('Generated: April 5, 2025')
console.log('Published: April 8, 2025')
console.log('')
console.log('Metrics:')
console.log('  AUM: $42,900,000 (between 2024 Annual $42M and Q2 $43.8M)')
console.log('  IRR: 11.0% (progressive increase from 10.8% to 11.2%)')
console.log('  Investments: 6')
console.log('  Investors: 5')
console.log('  Recipients: 4 (sent to)')
console.log('')

// Insert Q1 report between 2024 Annual and Q2 reports
// Find the index of the 2024 Annual report (report-003)
const annualIndex = reports.findIndex(r => r.id === 'report-003')

// Insert Q1 report right after the Annual report
const updatedReports = [
  ...reports.slice(0, annualIndex + 1),
  q1Report,
  ...reports.slice(annualIndex + 1)
]

// Write updated reports
const reportsPath = join(__dirname, '../src/data/reports.json')
writeFileSync(reportsPath, JSON.stringify(updatedReports, null, 2))

console.log('═══════════════════════════════════════════════════════════')
console.log('✅ Q1 2025 REPORT ADDED SUCCESSFULLY')
console.log('═══════════════════════════════════════════════════════════\n')

console.log('📈 COMPLETE REPORTING TIMELINE')
console.log('─────────────────────────────────────────────────────────')
console.log('2024 Annual (2024):        $42,000,000  (10.8% IRR)')
console.log('Q1 2025 (Jan-Mar):         $42,900,000  (11.0% IRR)  ← NEW')
console.log('Q2 2025 (Apr-Jun):         $43,800,000  (11.2% IRR)')
console.log('Q3 2025 (Jul-Sep):         $45,100,000  (11.8% IRR)')
console.log('October 2025 (Oct):        $45,600,000  (12.1% IRR)')
console.log('')
console.log('✅ No more reporting gaps!')
console.log('')

console.log('Total reports: ' + updatedReports.length)
console.log('File updated: src/data/reports.json')
console.log('')
