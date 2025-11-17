/**
 * API Route: Export Report Data as CSV
 * GET /api/reports/[id]/export/csv?type={summary|investments|investors|transactions}
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateReportSummaryCSV,
  generateInvestmentsCSV,
  generateInvestorsCSV,
  generateTransactionsCSV
} from '@/lib/csv-generator'
import reportsData from '@/data/reports.json'
import investmentsData from '@/data/investments.json'
import investorsData from '@/data/investors.json'
import type { Report, Investment, Investor } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const exportType = searchParams.get('type') || 'summary'

    // Find the report
    const reports = reportsData as Report[]
    const report = reports.find((r) => r.id === id)

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Get related data
    const investments = investmentsData as Investment[]
    const investors = investorsData as Investor[]

    // Filter investments included in this report
    const includedInvestments = investments.filter((inv) =>
      report.includesInvestments.includes(inv.id)
    )

    // Filter investors included in this report
    const includedInvestors = investors.filter((inv) =>
      report.includesInvestors.includes(inv.id)
    )

    let csvContent: string
    let filename: string
    const baseFilename = report.title.replace(/\s+/g, '-').toLowerCase()

    // Get fundId from first investment in report, or use empty string
    const reportFundId = includedInvestments.length > 0 ? includedInvestments[0].fundId : ''

    // Generate appropriate CSV based on type
    switch (exportType) {
      case 'investments':
        csvContent = generateInvestmentsCSV(report, includedInvestments)
        filename = `${baseFilename}-investments.csv`
        break

      case 'investors':
        csvContent = generateInvestorsCSV(report, includedInvestors, reportFundId)
        filename = `${baseFilename}-investors.csv`
        break

      case 'transactions':
        csvContent = generateTransactionsCSV(report)
        filename = `${baseFilename}-transactions.csv`
        break

      case 'summary':
      default:
        csvContent = generateReportSummaryCSV(report)
        filename = `${baseFilename}-summary.csv`
        break
    }

    // Return CSV with appropriate headers
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(csvContent).toString(),
      },
    })
  } catch (error) {
    console.error('CSV generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV', details: (error as Error).message },
      { status: 500 }
    )
  }
}
