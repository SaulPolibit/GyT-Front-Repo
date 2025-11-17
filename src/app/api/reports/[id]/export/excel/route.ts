/**
 * API Route: Export Report as Excel
 * GET /api/reports/[id]/export/excel
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateReportExcel } from '@/lib/excel-generator'
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

    // Generate Excel
    const excelBuffer = await generateReportExcel({
      report,
      investments: includedInvestments,
      investors: includedInvestors,
    })

    // Create filename
    const filename = `${report.title.replace(/\s+/g, '-').toLowerCase()}.xlsx`

    // Return Excel with appropriate headers
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Excel generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Excel', details: (error as Error).message },
      { status: 500 }
    )
  }
}
