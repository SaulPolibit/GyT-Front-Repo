import { NextRequest, NextResponse } from 'next/server'
import investorsData from '@/data/investors.json'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    // Find investor by ID
    const investor = investorsData.find((inv: any) => inv.id === id)

    if (!investor) {
      return NextResponse.json(
        { success: false, error: 'Investor not found' },
        { status: 404 }
      )
    }

    // Return investor data
    return NextResponse.json({
      success: true,
      data: investor,
      message: 'Investor fetched successfully',
    })
  } catch (error) {
    console.error('Error fetching investor:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
