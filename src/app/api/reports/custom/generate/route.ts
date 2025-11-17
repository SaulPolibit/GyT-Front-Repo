/**
 * API Route: Generate Custom Report
 * POST /api/reports/custom/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateCustomPDF } from '@/lib/custom-report-pdf-generator'
import { generateCustomExcel } from '@/lib/custom-report-excel-generator'
import { generateCustomCSV } from '@/lib/custom-report-csv-generator'
import { getInvestors } from '@/lib/investors-storage'
import { getInvestments } from '@/lib/investments-storage'
import reportsData from '@/data/reports.json'
import type { Investor, Investment, Report } from '@/lib/types'

interface CustomReportRequest {
  title: string
  periodStart: string
  periodEnd: string
  selectedInvestors: string[]
  selectedInvestments: string[]
  includeFields: Record<string, boolean>
  format: 'pdf' | 'excel' | 'csv'
}

export async function POST(request: NextRequest) {
  try {
    const body: CustomReportRequest = await request.json()
    const { title, periodStart, periodEnd, selectedInvestors, selectedInvestments, includeFields, format } = body

    // Validate required fields
    if (!title || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: title, periodStart, periodEnd' },
        { status: 400 }
      )
    }

    if (selectedInvestors.length === 0 && selectedInvestments.length === 0) {
      return NextResponse.json(
        { error: 'Must select at least one investor or investment' },
        { status: 400 }
      )
    }

    // Load data
    const allInvestors = getInvestors()
    const allInvestments = getInvestments()
    const allReports = reportsData as Report[]

    // Filter data based on selections
    const filteredInvestors = selectedInvestors.length > 0
      ? allInvestors.filter(inv => selectedInvestors.includes(inv.id))
      : allInvestors

    const filteredInvestments = selectedInvestments.length > 0
      ? allInvestments.filter(inv => selectedInvestments.includes(inv.id))
      : allInvestments

    // Filter reports by date range
    const startDate = new Date(periodStart)
    const endDate = new Date(periodEnd)

    const filteredReports = allReports.filter(report => {
      const reportDate = new Date(report.periodEnd)
      return reportDate >= startDate && reportDate <= endDate
    })

    // Calculate aggregate metrics
    const totalAUM = filteredInvestments.reduce((sum, inv) => sum + inv.totalFundPosition.currentValue, 0)
    const totalInvestments = filteredInvestments.length
    const totalInvestors = filteredInvestors.length

    const avgIRR = filteredInvestments.length > 0
      ? filteredInvestments.reduce((sum, inv) => sum + inv.totalFundPosition.irr, 0) / filteredInvestments.length
      : 0

    const avgMultiple = filteredInvestments.length > 0
      ? filteredInvestments.reduce((sum, inv) => sum + inv.totalFundPosition.multiple, 0) / filteredInvestments.length
      : 0

    const totalDistributions = filteredReports
      .filter(r => r.distribution)
      .reduce((sum, r) => sum + (r.distribution?.totalDistributionAmount || 0), 0)

    const totalUnrealizedGains = filteredInvestments.reduce((sum, inv) => sum + inv.totalFundPosition.unrealizedGain, 0)

    // Prepare report data
    const reportData = {
      title,
      periodStart,
      periodEnd,
      generatedDate: new Date().toISOString(),
      investors: filteredInvestors,
      investments: filteredInvestments,
      reports: filteredReports,
      includeFields,
      metrics: {
        totalAUM,
        totalInvestments,
        totalInvestors,
        avgIRR,
        avgMultiple,
        totalDistributions,
        totalUnrealizedGains,
      },
    }

    // Generate report in requested format
    let buffer: Buffer
    let contentType: string
    let filename: string

    if (format === 'pdf') {
      buffer = await generateCustomPDF(reportData)
      contentType = 'application/pdf'
      filename = `${title.replace(/\s+/g, '-').toLowerCase()}.pdf`
    } else if (format === 'excel') {
      buffer = await generateCustomExcel(reportData)
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = `${title.replace(/\s+/g, '-').toLowerCase()}.xlsx`
    } else {
      buffer = generateCustomCSV(reportData)
      contentType = 'text/csv'
      filename = `${title.replace(/\s+/g, '-').toLowerCase()}.csv`
    }

    // Return the generated file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Custom report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate custom report', details: (error as Error).message },
      { status: 500 }
    )
  }
}
