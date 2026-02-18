/**
 * SWR Hooks for API Data Fetching with Caching
 *
 * These hooks use SWR for:
 * - Automatic caching and deduplication
 * - Background revalidation
 * - Reduced API requests on Vercel
 *
 * Usage:
 * - useFirmLogo() - Cached firm logo (revalidates every 1 hour)
 * - useStripeConnectStatus() - Cached Stripe Connect status (revalidates every 5 min)
 * - useStructures() - Cached structures list (revalidates every 5 min)
 * - useDashboardData() - Cached dashboard data (revalidates every 1 min)
 */

import useSWR, { SWRConfiguration } from 'swr'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken } from '@/lib/auth-storage'

// ===========================================
// FETCHERS
// ===========================================

/**
 * Authenticated fetcher for protected endpoints
 */
export const authFetcher = async (url: string) => {
  const token = getAuthToken()

  if (!token) {
    throw new Error('No authentication token')
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = new Error('Failed to fetch data')
    ;(error as any).status = response.status
    throw error
  }

  return response.json()
}

/**
 * Public fetcher for non-authenticated endpoints
 */
export const publicFetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch data')
  }

  return response.json()
}

// ===========================================
// SWR CONFIG PRESETS
// ===========================================

/**
 * Long cache - for data that rarely changes (firm logo, settings)
 * Revalidates every 1 hour, keeps stale data for 24 hours
 */
export const longCacheConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 60 * 60 * 1000, // 1 hour
  dedupingInterval: 60 * 60 * 1000, // 1 hour
}

/**
 * Medium cache - for semi-dynamic data (Stripe status, structures)
 * Revalidates every 5 minutes
 */
export const mediumCacheConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  dedupingInterval: 5 * 60 * 1000, // 5 minutes
}

/**
 * Short cache - for frequently changing data (dashboard, activity)
 * Revalidates every 1 minute
 */
export const shortCacheConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 60 * 1000, // 1 minute
  dedupingInterval: 30 * 1000, // 30 seconds
}

// ===========================================
// HOOKS
// ===========================================

/**
 * Fetch firm logo with long cache (rarely changes)
 */
export function useFirmLogo() {
  const url = getApiUrl(API_CONFIG.endpoints.getFirmLogo)

  const { data, error, isLoading, mutate } = useSWR(
    url,
    publicFetcher,
    longCacheConfig
  )

  return {
    firmLogo: data?.success && data?.data ? data.data.firmLogo : null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch Stripe Connect account status with medium cache
 */
export function useStripeConnectStatus() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.stripeConnectAccountStatus) : null

  const { data, error, isLoading, mutate } = useSWR(
    url, // null key will prevent the request
    authFetcher,
    mediumCacheConfig
  )

  return {
    hasAccount: data?.success ? data.hasAccount : false,
    isComplete: data?.success ? data.isComplete : false,
    accountStatus: data?.success ? data.accountStatus : 'not_created',
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch all structures with medium cache
 */
export function useStructures() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getAllStructures) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    structures: data?.success ? data.data : [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch LP dashboard data with short cache
 */
export function useDashboardData() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getMyDashboard) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    shortCacheConfig
  )

  return {
    dashboardData: data?.success ? data.data : null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch investor users (admin) with medium cache
 */
export function useInvestorUsers() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getInvestorUsers) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    investors: data?.success ? data.data : [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch LP portfolio data with medium cache
 */
export function usePortfolioData() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getMyInvestorWithStructures) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    portfolio: data?.success ? data.data : null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch capital calls with medium cache
 */
export function useCapitalCalls() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getMyCapitalCalls) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    capitalCalls: data?.success ? data.data : [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch user notifications with short cache
 */
export function useNotifications(options?: { limit?: number; unreadOnly?: boolean }) {
  const token = getAuthToken()

  // Build URL with query params
  let url = null
  if (token) {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.unreadOnly) params.append('unread', 'true')
    const queryString = params.toString()
    url = getApiUrl(API_CONFIG.endpoints.getNotifications) + (queryString ? `?${queryString}` : '')
  }

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    shortCacheConfig
  )

  return {
    notifications: data?.success ? data.data : [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch unread notification count with short cache
 */
export function useUnreadNotificationCount() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getUnreadNotificationCount) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    {
      ...shortCacheConfig,
      refreshInterval: 30 * 1000, // 30 seconds for count
    }
  )

  return {
    count: data?.success ? data.data?.count || 0 : 0,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch notification settings with medium cache
 */
export function useNotificationSettings() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getNotificationSettings) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    settings: data?.success ? data.data : null,
    pushNotificationsEnabled: data?.success ? data.data?.pushNotifications ?? true : true,
    isLoading,
    error,
    mutate,
  }
}
