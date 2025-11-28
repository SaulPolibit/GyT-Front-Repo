'use client'

import { useState, useEffect } from 'react'
import {
  getAuthState,
  saveLoginResponse,
  logout,
  getAuthToken,
  getUserDisplayName,
  type AuthState,
  type ApiUser,
  type LoginResponse
} from '@/lib/auth-storage'
import { getApiUrl, API_CONFIG } from '@/lib/api-config'
import { toast } from 'sonner'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    token: null,
    user: null,
    supabase: null
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load auth state on mount
  useEffect(() => {
    const state = getAuthState()
    setAuthState(state)
    setIsLoading(false)
  }, [])

  // Login function - calls API endpoint
  const handleLogin = async (email: string, password: string): Promise<LoginResponse | null> => {
    try {
      console.log('[useAuth] Attempting login to:', getApiUrl(API_CONFIG.endpoints.login))

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.login), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }))
        throw new Error(errorData.message || 'Login failed')
      }

      const data: LoginResponse = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Login failed')
      }

      console.log('[useAuth] Login successful, saving response')
      console.log('[useAuth] User role:', data.user.role)
      console.log('[useAuth] User email:', data.user.email)

      // Save to localStorage
      const newState = saveLoginResponse(data)
      console.log('[useAuth] New state:', newState)

      // Update React state
      setAuthState(newState)
      console.log('[useAuth] State updated')

      return data
    } catch (error) {
      console.error('[useAuth] Login error:', error)
      toast.error(error instanceof Error ? error.message : 'Login failed')
      return null
    }
  }

  // Logout function
  const handleLogout = () => {
    logout()
    setAuthState({ isLoggedIn: false, token: null, user: null, supabase: null })
  }

  return {
    isLoggedIn: authState.isLoggedIn,
    user: authState.user,
    token: authState.token,
    supabase: authState.supabase,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    getUserName: () => authState.user ? getUserDisplayName(authState.user) : null,
  }
}
