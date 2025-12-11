/**
 * Mock Login API Route
 * POST /api/custom/login
 *
 * This is a development mock endpoint that returns test user data.
 * Replace this with the actual backend API in production.
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock user database
const MOCK_USERS = [
  {
    id: 'user-001',
    email: 'saul@polibit.io',
    password: 'saul.polibit123*', // In production, this would be hashed
    firstName: 'Saul',
    lastName: 'Ibarra',
    role: 1, // Admin
    appLanguage: 'en',
    profileImage: null,
    kycId: null,
    kycStatus: null,
    kycUrl: null,
    address: null,
    country: 'Mexico',
  },
  {
    id: 'user-002',
    email: 'admin@polibit.io',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 0, // Root
    appLanguage: 'en',
    profileImage: null,
    kycId: null,
    kycStatus: null,
    kycUrl: null,
    address: null,
    country: 'USA',
  },
  {
    id: 'user-003',
    email: 'investor@polibit.io',
    password: 'investor123',
    firstName: 'John',
    lastName: 'Investor',
    role: 3, // Customer/Investor
    appLanguage: 'en',
    profileImage: null,
    kycId: null,
    kycStatus: 'Pending',
    kycUrl: null,
    address: null,
    country: 'USA',
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email and password are required',
        },
        { status: 400 }
      )
    }

    // Find user
    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      )
    }

    // Generate mock JWT token (in production, use proper JWT signing)
    const mockToken = `mock_token_${user.id}_${Date.now()}`

    // Create response matching LoginResponse interface
    const response = {
      success: true,
      message: 'Login successful',
      token: mockToken,
      expiresIn: '7d',
      supabase: {
        accessToken: `supabase_${mockToken}`,
        refreshToken: `refresh_${mockToken}`,
        expiresIn: 604800, // 7 days in seconds
        expiresAt: Date.now() + 604800000, // 7 days from now
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        appLanguage: user.appLanguage,
        profileImage: user.profileImage,
        role: user.role,
        lastLogin: new Date().toISOString(),
        kycId: user.kycId,
        kycStatus: user.kycStatus,
        kycUrl: user.kycUrl,
        address: user.address,
        country: user.country,
      },
    }

    console.log('[Mock Login] User logged in:', user.email, 'Role:', user.role)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Mock Login] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
