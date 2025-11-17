import { NextRequest, NextResponse } from 'next/server'
import { getInvestorById } from '@/lib/investors-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; year: string }> }
) {
  try {
    const { id, year } = await params

    // Verify investor exists
    const investor = getInvestorById(id)
    if (!investor) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      )
    }

    // Check if K-1 is available (status must be "Delivered")
    if (investor.k1Status !== 'Delivered') {
      return NextResponse.json(
        { error: 'K-1 form not yet available. Status: ' + investor.k1Status },
        { status: 404 }
      )
    }

    // TODO: Implement actual K-1 PDF generation
    // For now, return a simple PDF placeholder
    const pdfContent = generateK1PlaceholderPDF(investor, year)

    return new NextResponse(pdfContent as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="K1-${year}-${investor.name.replace(/\s+/g, '-')}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating K-1:', error)
    return NextResponse.json(
      { error: 'Failed to generate K-1' },
      { status: 500 }
    )
  }
}

function generateK1PlaceholderPDF(investor: any, year: string): Buffer {
  // Simple PDF placeholder (in production, use jsPDF or similar library)
  const pdfHeader = '%PDF-1.4\n'
  const pdfContent = `
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
50 700 Td
(Schedule K-1 (Form 1065)) Tj
0 -40 Td
/F1 14 Tf
(Tax Year: ${year}) Tj
0 -30 Td
(Investor: ${investor.name}) Tj
0 -30 Td
(Status: ${investor.k1Status}) Tj
0 -50 Td
/F1 10 Tf
(This is a placeholder PDF.) Tj
0 -20 Td
(K-1 generation feature is in development.) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
567
%%EOF
`

  return Buffer.from(pdfHeader + pdfContent)
}
