'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken, logout, getCurrentUser, getUserRoleType } from '@/lib/auth-storage'

// Default request timeout (30 seconds)
const DEFAULT_TIMEOUT = 30_000

interface AuthFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>
  /** Request timeout in ms (default: 30s) */
  timeout?: number
  /** Skip automatic 401 handling */
  skipAuthCheck?: boolean
}

interface AuthFetchResult<T = any> {
  data: T | null
  error: string | null
  status: number | null
}

/**
 * Hook that provides an authenticated fetch wrapper with:
 * - Automatic Bearer token injection
 * - 401 → logout + redirect handling
 * - Request timeouts
 * - Consistent error responses
 *
 * Usage:
 *   const { authFetch } = useAuthFetch()
 *   const { data, error, status } = await authFetch<MyType>(url)
 *   const { data } = await authFetch(url, { method: 'POST', body: JSON.stringify(payload) })
 */
export function useAuthFetch() {
  const router = useRouter()
  // Track if we're already redirecting to prevent multiple redirects
  const isRedirecting = useRef(false)

  const handleUnauthorized = useCallback(async () => {
    if (isRedirecting.current) return
    isRedirecting.current = true

    const user = getCurrentUser()
    const loginPath = user && getUserRoleType(user.role) === 'lp-portal'
      ? '/sign-in'
      : '/sign-in'

    await logout()
    router.push(loginPath)
  }, [router])

  const authFetch = useCallback(async <T = any>(
    url: string,
    options: AuthFetchOptions = {}
  ): Promise<AuthFetchResult<T>> => {
    const {
      timeout = DEFAULT_TIMEOUT,
      skipAuthCheck = false,
      headers: customHeaders = {},
      ...fetchOptions
    } = options

    // Get token
    const token = getAuthToken()
    if (!token) {
      if (!skipAuthCheck) {
        await handleUnauthorized()
      }
      return { data: null, error: 'No authentication token', status: null }
    }

    // Build headers — only set Content-Type if no body or body is string/JSON
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      ...customHeaders,
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(fetchOptions.body instanceof FormData) && !customHeaders['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle 401 Unauthorized
      if (response.status === 401 && !skipAuthCheck) {
        try {
          const errorData = await response.json()
          if (
            errorData.error === 'Invalid or expired token' ||
            errorData.message === 'Please provide a valid authentication token'
          ) {
            await handleUnauthorized()
            return { data: null, error: 'Session expired', status: 401 }
          }
        } catch {
          // If JSON parsing fails on 401, still treat as auth error
          await handleUnauthorized()
          return { data: null, error: 'Session expired', status: 401 }
        }
      }

      // Parse response
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message = data?.message || data?.error || `Request failed (${response.status})`
        return { data: null, error: message, status: response.status }
      }

      return { data: data as T, error: null, status: response.status }
    } catch (err) {
      clearTimeout(timeoutId)

      if (err instanceof DOMException && err.name === 'AbortError') {
        return { data: null, error: 'Request timed out', status: null }
      }

      return {
        data: null,
        error: err instanceof Error ? err.message : 'Network error',
        status: null,
      }
    }
  }, [handleUnauthorized])

  return { authFetch }
}
