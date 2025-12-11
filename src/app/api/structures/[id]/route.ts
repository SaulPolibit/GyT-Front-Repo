/**
 * Single Structure API Route
 * GET /api/structures/[id] - Get structure by ID
 *
 * This is a mock endpoint that returns structure data by ID.
 * In production, this would fetch from a database.
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock structures data - same as in /api/structures/route.ts
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
    legalTerms: {
      managementControl: 'The General Partner has exclusive authority to manage and control the business and affairs of the Partnership.',
      capitalContributions: 'Capital contributions shall be made within 10 business days of receiving a capital call notice.',
      allocationsDistributions: 'Profits and losses shall be allocated among the Partners in accordance with their respective Partnership Interests.',
      limitedPartnerRights: [
        'Right to receive quarterly financial statements',
        'Right to receive K-1 tax forms',
        'Right to attend annual investor meetings',
        'Right to inspect books and records',
        'Right to receive capital call notices',
        'Right to receive distribution notices',
        'Right to vote on major decisions'
      ],
      limitedPartnerObligations: [
        'Obligation to fund capital calls within 10 business days',
        'Obligation to maintain accredited investor status',
        'Obligation to provide updated tax information',
        'Obligation to comply with transfer restrictions',
        'Obligation to maintain confidentiality',
        'Obligation to indemnify for breaches'
      ],
      votingRights: {
        votingThreshold: 66.67,
        mattersRequiringConsent: [
          'Amendment of partnership agreement',
          'Removal of General Partner',
          'Sale of substantially all assets',
          'Merger or dissolution'
        ]
      },
      redemptionTerms: {
        lockUpPeriod: 'Your capital commitment is subject to a lock-up period through the earlier of (i) the end of the investment period or (ii) 5 years from the fund inception date.',
        withdrawalConditions: [
          'Death or disability of individual investor',
          'Bankruptcy or insolvency of investor',
          'Regulatory requirement mandating disposition',
          'General Partner consent'
        ],
        withdrawalProcess: [
          'Written notice to GP at least 90 days in advance',
          'Subject to GP approval',
          'Payment within 180 days of approval',
          'May be subject to discount to NAV'
        ]
      },
      transferRestrictions: {
        generalProhibition: 'Partnership Interests may not be sold, assigned, transferred, pledged, or otherwise disposed of without the prior written consent of the General Partner.',
        permittedTransfers: [
          'Transfers to immediate family members or family trusts',
          'Transfers to wholly-owned affiliates',
          'Transfers required by law or court order'
        ],
        transferRequirements: [
          'Transferee must be an accredited investor',
          'Transferee must execute subscription documents',
          'Transfer must comply with securities laws',
          'Written consent of General Partner',
          'Payment of transfer fees'
        ]
      },
      reportingCommitments: {
        quarterlyReports: 'Unaudited financial statements, NAV updates, portfolio summaries within 45 days of quarter end',
        annualReports: 'Audited financial statements and detailed portfolio review within 120 days of year end',
        taxForms: 'Schedule K-1 (Form 1065) delivered by March 15th annually',
        capitalNotices: 'Capital call and distribution notices sent at least 10 business days in advance',
        additionalCommunications: [
          'Annual investor meeting (virtual or in-person)',
          'Material event notifications',
          'Access to online investor portal',
          'Quarterly investor letters',
          'Ad-hoc communications as needed'
        ]
      },
      liabilityLimitations: {
        limitedLiabilityProtection: 'As a Limited Partner, your liability is limited to your capital commitment to the Partnership.',
        exceptionsToLimitedLiability: [
          'Return of distributions: Wrongful distributions may be reclaimed',
          'Participation in control: Active management participation',
          'Fraud or willful misconduct',
          'Violation of securities laws',
          'Breach of representations and warranties'
        ],
        maximumExposureNote: 'Your Maximum Exposure: {{commitment}} (committed capital) plus potential clawback of distributions if necessary to satisfy Partnership obligations.'
      },
      indemnification: {
        partnershipIndemnifiesLPFor: [
          'Claims arising from Partnership activities conducted in good faith',
          'Litigation related to your status as Limited Partner',
          'Third-party claims arising from Partnership investments',
          'Regulatory inquiries related to Partnership activities'
        ],
        lpIndemnifiesPartnershipFor: [
          'Breach of representations and warranties in subscription agreement',
          'Violation of transfer restrictions',
          'Unauthorized disclosure of confidential information',
          'Claims arising from LP\'s own gross negligence or willful misconduct',
          'Tax liabilities arising from LP\'s specific circumstances'
        ],
        indemnificationProcedures: 'Indemnified party must provide prompt written notice of any claim. Indemnifying party has the right to control defense with counsel of its choice.'
      },
      amendments: 'This Agreement may be amended only with the written consent of the General Partner and Limited Partners holding at least 66.67% of the Partnership Interests.',
      dissolution: 'The Partnership shall be dissolved upon the earliest to occur of: (i) the end of the fund term, (ii) sale of all assets, (iii) vote by 75% of Limited Partners, or (iv) determination by the General Partner.',
      disputes: 'Any dispute, controversy, or claim arising out of or relating to this Agreement shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.',
      governingLaw: 'This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.',
      additionalProvisions: 'Confidentiality obligations shall survive termination. All notices shall be sent to addresses provided in subscription documents. Partnership may not be used for illegal activities.'
    }
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
    legalTerms: {
      managementControl: 'The General Partner has exclusive authority to manage and control the business and affairs of the Partnership.',
      capitalContributions: 'Capital contributions shall be made within 15 business days of receiving a capital call notice.',
      allocationsDistributions: 'Profits and losses shall be allocated pro-rata based on ownership percentages.',
      limitedPartnerRights: [
        'Right to receive quarterly reports',
        'Right to access financial statements',
        'Right to attend annual meetings'
      ],
      limitedPartnerObligations: [
        'Obligation to fund capital calls',
        'Obligation to maintain confidentiality',
        'Obligation to comply with local regulations'
      ],
      votingRights: {
        votingThreshold: 75,
        mattersRequiringConsent: [
          'Major asset sales',
          'Change of investment strategy',
          'Dissolution'
        ]
      }
    }
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
    legalTerms: {
      managementControl: 'The Fund Manager has exclusive authority to manage and control the business and affairs of the Fund.',
      capitalContributions: 'Capital contributions shall be made within 5 business days of receiving a capital call notice.',
      allocationsDistributions: 'Interest income and principal repayments shall be allocated pro-rata based on capital contributions.',
      limitedPartnerRights: [
        'Right to receive monthly statements',
        'Right to receive quarterly reports',
        'Right to inspect loan portfolio'
      ],
      limitedPartnerObligations: [
        'Obligation to fund capital calls promptly',
        'Obligation to maintain investor qualifications'
      ]
    }
  },
]

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

    // Find structure by ID
    const structure = MOCK_STRUCTURES.find(s => s.id === id)

    if (!structure) {
      return NextResponse.json(
        {
          success: false,
          error: 'Structure not found',
          message: `No structure found with ID: ${id}`,
        },
        { status: 404 }
      )
    }

    console.log('[Mock API] Returning structure:', id)

    return NextResponse.json({
      success: true,
      data: structure,
    })
  } catch (error) {
    console.error('[Structure API] Error:', error)
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

export async function PUT(
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

    // Parse request body
    const updates = await request.json()

    // Find structure by ID
    const structureIndex = MOCK_STRUCTURES.findIndex(s => s.id === id)

    if (structureIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Structure not found',
          message: `No structure found with ID: ${id}`,
        },
        { status: 404 }
      )
    }

    // Update the structure (merge updates with existing data)
    const updatedStructure = {
      ...MOCK_STRUCTURES[structureIndex],
      ...updates,
      id, // Ensure ID cannot be changed
      createdDate: MOCK_STRUCTURES[structureIndex].createdDate, // Preserve creation date
    }

    // Update in the mock array
    MOCK_STRUCTURES[structureIndex] = updatedStructure

    console.log('[Mock API] Updated structure:', id)
    console.log('[Mock API] Updated fields:', Object.keys(updates))

    return NextResponse.json({
      success: true,
      data: updatedStructure,
      message: 'Structure updated successfully',
    })
  } catch (error) {
    console.error('[Structure API] Error:', error)
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

export async function DELETE(
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

    // Find structure by ID
    const structureIndex = MOCK_STRUCTURES.findIndex(s => s.id === id)

    if (structureIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Structure not found',
          message: `No structure found with ID: ${id}`,
        },
        { status: 404 }
      )
    }

    // Remove the structure from the mock array
    const deletedStructure = MOCK_STRUCTURES.splice(structureIndex, 1)[0]

    console.log('[Mock API] Deleted structure:', id)

    return NextResponse.json({
      success: true,
      message: 'Structure deleted successfully',
      data: deletedStructure,
    })
  } catch (error) {
    console.error('[Structure API] Error:', error)
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
