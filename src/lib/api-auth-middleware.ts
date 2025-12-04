/**
 * API Authentication Middleware Utilities
 * Handles JWT token verification and role-based access control
 */

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export interface DecodedToken {
  userId: string
  email: string
  role: number // 0=root, 1=admin, 2=staff, 3=customer
  iat?: number
  exp?: number
}

export interface AuthResult {
  success: boolean
  user?: DecodedToken
  error?: string
  status?: number
}

/**
 * Verify JWT token from Authorization header
 */
export function verifyAuthToken(request: NextRequest): AuthResult {
  try {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return {
        success: false,
        error: 'No authorization header provided',
        status: 401
      }
    }

    if (!authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Invalid authorization header format. Expected: Bearer <token>',
        status: 401
      }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (!token) {
      return {
        success: false,
        error: 'No token provided',
        status: 401
      }
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('[Auth] JWT_SECRET not configured')
      return {
        success: false,
        error: 'Server configuration error',
        status: 500
      }
    }

    const decoded = jwt.verify(token, jwtSecret) as DecodedToken

    return {
      success: true,
      user: decoded
    }
  } catch (error) {
    console.error('[Auth] Token verification failed:', error)

    if (error instanceof jwt.TokenExpiredError) {
      return {
        success: false,
        error: 'Token expired',
        status: 401
      }
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        success: false,
        error: 'Invalid token',
        status: 401
      }
    }

    return {
      success: false,
      error: 'Authentication failed',
      status: 401
    }
  }
}

/**
 * Check if user has required role
 * @param userRole - User's role number (0-3)
 * @param allowedRoles - Array of allowed role numbers
 */
export function hasRequiredRole(userRole: number, allowedRoles: number[]): boolean {
  return allowedRoles.includes(userRole)
}

/**
 * Check if user is admin/root/staff (roles 0, 1, 2)
 */
export function isStaffUser(role: number): boolean {
  return role === 0 || role === 1 || role === 2
}

/**
 * Check if user is customer (role 3)
 */
export function isCustomer(role: number): boolean {
  return role === 3
}

/**
 * Verify access to investor resource
 * - Root (0), Admin (1), Staff (2) can access any investor
 * - Customer (3) can only access their own investor record
 *
 * @param user - Decoded user from token
 * @param requestedInvestorId - ID of investor being accessed
 * @param investorEmail - Email of the investor (to match against user email for role 3)
 */
export function canAccessInvestorResource(
  user: DecodedToken,
  requestedInvestorId: string,
  investorEmail: string
): { allowed: boolean; reason?: string } {
  // Root, Admin, Staff can access any investor
  if (isStaffUser(user.role)) {
    return { allowed: true }
  }

  // Customer can only access their own data (match by email)
  if (isCustomer(user.role)) {
    if (user.email.toLowerCase() === investorEmail.toLowerCase()) {
      return { allowed: true }
    }
    return {
      allowed: false,
      reason: 'Customers can only access their own investor data'
    }
  }

  return {
    allowed: false,
    reason: 'Insufficient permissions'
  }
}

/**
 * Create unauthorized error response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 401 }
  )
}

/**
 * Create forbidden error response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 403 }
  )
}
