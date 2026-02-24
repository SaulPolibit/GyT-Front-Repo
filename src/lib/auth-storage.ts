// Authentication storage utility
import { API_CONFIG, getApiUrl } from './api-config'

// API User object from login response
export interface ApiUser {
  id: string
  email: string
  firstName: string
  lastName: string
  appLanguage: string
  profileImage: string | null
  role: number // 0=root, 1=admin, 2=operations, 3=investor, 4=read-only (0,1,2,4 → /investment-manager, 3 → /lp-portal)
  lastLogin: string
  kycId: string | null
  kycStatus: string | null
  kycUrl: string | null
  address: string | null
  country: string | null
  walletAddress: string | null
  phoneNumber?: string
  mfaEnabled?: boolean
  mfaFactorId?: string | null
}

// Supabase object from login response
export interface SupabaseAuth {
  accessToken: string
  refreshToken: string
  expiresIn: number
  expiresAt: number
}

// Login response from API
export interface LoginResponse {
  success: boolean
  message: string
  token?: string
  expiresIn?: string
  supabase?: SupabaseAuth
  user?: ApiUser
  mfaRequired?: boolean
  userId?: string
  factorId?: string
}

// Auth state stored in localStorage
export interface AuthState {
  isLoggedIn: boolean
  token: string | null
  user: ApiUser | null
  supabase: SupabaseAuth | null
}

const STORAGE_KEY = 'polibit_auth'

// Get current auth state
export function getAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, token: null, user: null, supabase: null }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { isLoggedIn: false, token: null, user: null, supabase: null }
    }

    const authState: AuthState = JSON.parse(stored)
    return authState
  } catch (error) {
    console.error('Error loading auth state:', error)
    return { isLoggedIn: false, token: null, user: null, supabase: null }
  }
}

// Save login response to localStorage
export function saveLoginResponse(response: LoginResponse): AuthState {
  if (typeof window === 'undefined') {
    throw new Error('Cannot login on server side')
  }

  // Ensure we have required fields for a successful login
  if (!response.token || !response.user) {
    throw new Error('Invalid login response: missing required fields')
  }

  const authState: AuthState = {
    isLoggedIn: true,
    token: response.token,
    user: response.user,
    supabase: response.supabase || null,
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authState))
    return authState
  } catch (error) {
    console.error('Error saving auth state:', error)
    throw error
  }
}

// Mark user as offline via presence API
async function markUserOffline(token: string): Promise<void> {
  try {
    const url = getApiUrl(API_CONFIG.endpoints.presenceOffline)

    // Use sendBeacon for reliability (works even during page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({})], { type: 'application/json' })
      navigator.sendBeacon(`${url}?token=${token}`, blob)
      console.log('[Auth] Marked user offline via sendBeacon')
    } else {
      // Fallback to fetch
      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        keepalive: true,
      })
      console.log('[Auth] Marked user offline via fetch')
    }
  } catch (error) {
    console.error('[Auth] Error marking user offline:', error)
  }
}

// Logout user and clear all localStorage data
export function logout(): void {
  if (typeof window === 'undefined') return

  try {
    // Get token before clearing to mark user as offline
    const authState = getAuthState()
    if (authState.token) {
      markUserOffline(authState.token)
    }

    // Clear all localStorage data
    localStorage.clear()
    console.log('[Auth] All localStorage data cleared')
  } catch (error) {
    console.error('Error clearing localStorage:', error)
    throw error
  }
}

// Check if user is logged in
export function isAuthenticated(): boolean {
  const authState = getAuthState()
  return authState.isLoggedIn && authState.user !== null && authState.token !== null
}

// Get current user
export function getCurrentUser(): ApiUser | null {
  const authState = getAuthState()
  return authState.user
}

// Get auth token for API requests
export function getAuthToken(): string | null {
  const authState = getAuthState()
  return authState.token
}

// Get supabase auth
export function getSupabaseAuth(): SupabaseAuth | null {
  const authState = getAuthState()
  return authState.supabase
}

// Get user role type based on role number
export function getUserRoleType(role: number): 'investment-manager' | 'lp-portal' {
  // 0=root, 1=admin, 2=operations, 4=read-only → investment-manager
  // 3=investor → lp-portal
  return role === 3 ? 'lp-portal' : 'investment-manager'
}

// Get redirect path based on user role number
export function getRedirectPathForRole(role: number): string {
  const roleType = getUserRoleType(role)
  return roleType === 'investment-manager' ? '/investment-manager' : '/lp-portal'
}

// Get redirect path based on current user
export function getRedirectPath(): string {
  const user = getCurrentUser()
  if (!user) return '/sign-in'
  return getRedirectPathForRole(user.role)
}

// Get user display name
export function getUserDisplayName(user: ApiUser): string {
  const firstName = user.firstName || ''
  const lastName = user.lastName || ''
  return `${firstName} ${lastName}`.trim() || user.email
}

// Update user KYC data in localStorage
export function updateUserKycData(kycId: string, kycUrl: string, kycStatus: string): void {
  if (typeof window === 'undefined') return

  try {
    const authState = getAuthState()
    if (!authState.user) {
      console.error('[Auth] Cannot update KYC data: No user found')
      return
    }

    // Update user object with KYC data
    authState.user.kycId = kycId
    authState.user.kycUrl = kycUrl
    authState.user.kycStatus = kycStatus

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authState))
    console.log('[Auth] KYC data updated in localStorage:', { kycId, kycUrl, kycStatus })
  } catch (error) {
    console.error('[Auth] Error updating KYC data:', error)
  }
}

// Update user profile data in localStorage
export function updateUserProfile(updates: Partial<ApiUser>): void {
  if (typeof window === 'undefined') return

  try {
    const authState = getAuthState()
    if (!authState.user) {
      console.error('[Auth] Cannot update user profile: No user found')
      return
    }

    // Update user object with new data
    authState.user = {
      ...authState.user,
      ...updates,
    }

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authState))
    console.log('[Auth] User profile updated in localStorage:', updates)
  } catch (error) {
    console.error('[Auth] Error updating user profile:', error)
  }
}
