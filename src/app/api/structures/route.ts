/**
 * Structures API Route
 * GET /api/structures - Get all structures
 *
 * This is a mock endpoint that returns structures data.
 * In production, this would fetch from a database.
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock structures data - matches the Structure interface
const MOCK_STRUCTURES = [
  {
    id: 'struct-001',
    name: 'Tech Growth Fund I',
    type: 'fund',
    subtype: 'Venture Capital',
    jurisdiction: 'United States',
    usState: 'Delaware',
    totalCommitment: 50000000,
    currency: 'USD',
    investors: 25,
    createdDate: new Date('2023-01-15'),
    inceptionDate: new Date('2023-01-15'),
    status: 'active',
    currentStage: 'active',
    fundTerm: '10',
    fundType: 'Venture Capital',
    minCheckSize: 100000,
    maxCheckSize: 5000000,
    managementFee: '2',
    performanceFee: '20',
    hurdleRate: '8',
    preferredReturn: '8',
    plannedInvestments: '15',
    hierarchyLevel: 1,
  },
  {
    id: 'struct-002',
    name: 'Real Estate SPV Mexico',
    type: 'sa',
    subtype: 'Real Estate',
    jurisdiction: 'Mexico',
    totalCommitment: 25000000,
    currency: 'MXN',
    investors: 12,
    createdDate: new Date('2023-06-01'),
    inceptionDate: new Date('2023-06-01'),
    status: 'fundraising',
    currentStage: 'fundraising',
    plannedInvestments: '8',
    hierarchyLevel: 1,
  },
  {
    id: 'struct-003',
    name: 'Private Debt Fund',
    type: 'private-debt',
    subtype: 'Senior Secured',
    jurisdiction: 'Cayman Islands',
    totalCommitment: 100000000,
    currency: 'USD',
    investors: 45,
    createdDate: new Date('2022-09-01'),
    inceptionDate: new Date('2022-09-01'),
    status: 'active',
    currentStage: 'active',
    debtInterestRate: '12',
    debtGrossInterestRate: '14',
    plannedInvestments: '30',
    hierarchyLevel: 1,
  },
]

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

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const createdBy = searchParams.get('createdBy')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const parentId = searchParams.get('parentId')

    // Filter structures based on query parameters
    let filteredStructures = [...MOCK_STRUCTURES]

    if (type) {
      filteredStructures = filteredStructures.filter((s) => s.type === type)
    }

    if (status) {
      filteredStructures = filteredStructures.filter((s) => s.status === status)
    }

    if (parentId) {
      filteredStructures = filteredStructures.filter(
        (s) => (s as any).parentStructureId === parentId
      )
    }

    console.log('[Mock API] Returning', filteredStructures.length, 'structures')

    return NextResponse.json({
      success: true,
      count: filteredStructures.length,
      data: filteredStructures,
    })
  } catch (error) {
    console.error('[Structures API] Error:', error)
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
