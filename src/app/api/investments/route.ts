/**
 * Investments API Route
 * GET /api/investments - Get all investments
 *
 * This is a mock endpoint that returns investments data.
 * In production, this would fetch from a database.
 */

import { NextRequest, NextResponse } from 'next/server'
import investmentsData from '@/data/investments.json'

export async function GET(request: NextRequest) {
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

    console.log('[Mock API] Returning investments')

    return NextResponse.json({
      success: true,
      data: investmentsData,
    })
  } catch (error) {
    console.error('[Investments API] Error:', error)
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
