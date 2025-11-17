/**
 * API Route: Export Investor Capital Account History as CSV
 * GET /api/investors/[id]/capital-account/export
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateCapitalAccountHistoryCSV } from '@/lib/csv-generator'
import investorsData from '@/data/investors.json'
import type { Investor } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find the investor
    const investors = investorsData as Investor[]
    const investor = investors.find((inv) => inv.id === id)

    if (!investor) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      )
    }

    // Generate CSV
    const csvContent = generateCapitalAccountHistoryCSV(investor)

    // Create filename
    const filename = `${investor.name.replace(/\s+/g, '-').toLowerCase()}-capital-account.csv`

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
