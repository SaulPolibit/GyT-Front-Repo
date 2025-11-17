/**
 * API Route: Download Document from Structure
 * GET /api/structures/[id]/documents/[type]/[filename]
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string; filename: string }> }
) {
  try {
    const { id, type, filename } = await params

    // Validate document type
    if (!['fund', 'investor'].includes(type)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    // Construct file path
    const filepath = path.join(process.cwd(), 'uploads', id, `${type}-docs`, filename)

    // Check if file exists
    try {
      await access(filepath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(filepath)

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase()
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.doc': 'application/msword',
      '.xls': 'application/vnd.ms-excel',
    }
    const contentType = contentTypeMap[ext] || 'application/octet-stream'

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json(
      { error: 'Download failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
