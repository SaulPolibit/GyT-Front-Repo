/**
 * Single Investment API Route
 * GET /api/investments/[id] - Get investment by ID
 *
 * This is a mock endpoint that returns investment data by ID.
 * In production, this would fetch from a database.
 */

import { NextRequest, NextResponse } from 'next/server'
import investmentsData from '@/data/investments.json'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'Please provide Authorization header (Bearer token)',
        },
        { status: 401 }
      )
    }

    // In a real implementation, verify the token here
    const token = authHeader.substring(7)

    // Mock token validation (accept any mock token)
    if (!token.startsWith('mock_token_')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token',
          message: 'The provided token is invalid',
        },
        { status: 401 }
      )
    }

    // Await params (Next.js 15 requirement)
    const { id } = await context.params

    // Find investment by ID
    const investment = investmentsData.find((inv: any) => inv.id === id)

    if (!investment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Investment not found',
          message: `No investment found with ID: ${id}`,
        },
        { status: 404 }
      )
    }

    console.log('[Mock API] Returning investment:', id)

    return NextResponse.json({
      success: true,
      data: investment,
    })
  } catch (error) {
    console.error('[Investment API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
