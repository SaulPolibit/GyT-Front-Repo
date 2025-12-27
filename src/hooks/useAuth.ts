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
import { saveNotificationSettings } from '@/lib/notification-settings-storage'

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

      // Parse response JSON first to check for MFA
      const data: LoginResponse = await response.json().catch(() => ({
        success: false,
        message: 'Failed to parse response'
      }))

      console.log('[useAuth] Response status:', response.status)
      console.log('[useAuth] Response ok:', response.ok)

      console.log('[useAuth] Login response data:', data)
      console.log('[useAuth] MFA required?', data.mfaRequired)

      // Check if MFA is required - this is not an error, just a different flow
      if (data.mfaRequired) {
        console.log('[useAuth] MFA verification required - returning MFA data')
        return data
      }

      console.log('[useAuth] MFA not required, checking success status')

      if (!data.success) {
        console.error('[useAuth] Login failed:', data.message)
        toast.error(data.message || 'Login failed')
        return null
      }

      console.log('[useAuth] Login successful, saving response')
      console.log('[useAuth] User role:', data.user?.role)
      console.log('[useAuth] User email:', data.user?.email)

      // Save to localStorage
      const newState = saveLoginResponse(data)
      console.log('[useAuth] New state:', newState)

      // Update React state
      setAuthState(newState)
      console.log('[useAuth] State updated')

      // Fetch and save notification settings after successful login
      try {
        console.log('[useAuth] Fetching notification settings...')
        const notificationResponse = await fetch(getApiUrl(API_CONFIG.endpoints.getNotificationSettings), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`,
          },
        })

        if (notificationResponse.ok) {
          const notificationData = await notificationResponse.json()
          console.log('[useAuth] Notification settings fetched:', notificationData)

          if (notificationData.success && notificationData.data) {
            saveNotificationSettings(notificationData.data)
            console.log('[useAuth] Notification settings saved to localStorage')
          }
        } else {
          console.warn('[useAuth] Failed to fetch notification settings:', await notificationResponse.text())
        }
      } catch (notificationError) {
        console.error('[useAuth] Error fetching notification settings:', notificationError)
        // Don't fail login if notification settings fetch fails
      }

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

  // Refresh auth state from localStorage
  const refreshAuthState = () => {
    const state = getAuthState()
    setAuthState(state)
    console.log('[useAuth] Auth state refreshed from localStorage')
  }

  return {
    isLoggedIn: authState.isLoggedIn,
    user: authState.user,
    token: authState.token,
    supabase: authState.supabase,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    refreshAuthState,
    getUserName: () => authState.user ? getUserDisplayName(authState.user) : null,
  }
}
