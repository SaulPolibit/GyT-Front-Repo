/**
 * API Route: Upload/Delete Documents for Structure
 * POST /api/structures/[id]/documents - Upload document
 * DELETE /api/structures/[id]/documents - Delete all structure documents
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, rm } from 'fs/promises'
import path from 'path'

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'application/msword', // DOC
  'application/vnd.ms-excel', // XLS
]

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File
    const docType = formData.get('type') as string // 'fund' or 'investor'

    // Validation
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!docType || !['fund', 'investor'].includes(docType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOCX, and XLSX files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      )
    }

    // Sanitize filename (remove special characters)
    const originalFilename = file.name
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '-')

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', id, `${docType}-docs`)
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const filepath = path.join(uploadDir, sanitizedFilename)
    await writeFile(filepath, buffer)

    return NextResponse.json({
      success: true,
      filename: sanitizedFilename,
      originalFilename,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      downloadPath: `/api/structures/${id}/documents/${docType}/${sanitizedFilename}`,
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete entire structure uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads', id)

    try {
      await rm(uploadsDir, { recursive: true, force: true })
    } catch (error) {
      // Directory might not exist, which is fine
      console.log('Upload directory not found or already deleted:', uploadsDir)
    }

    return NextResponse.json({
      success: true,
      message: 'All documents deleted successfully',
    })
  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json(
      { error: 'Deletion failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
