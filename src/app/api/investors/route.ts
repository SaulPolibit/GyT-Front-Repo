import { NextRequest, NextResponse } from 'next/server'
import investorsData from '@/data/investors.json'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Return all investors
    return NextResponse.json({
      success: true,
      data: investorsData,
      message: 'Investors fetched successfully',
    })
  } catch (error) {
    console.error('Error fetching investors:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
