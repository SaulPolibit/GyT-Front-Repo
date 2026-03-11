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
 * - useUserPresence() - Real-time presence tracking (revalidates every 10 sec)
 */

import useSWR, { SWRConfiguration } from 'swr'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken } from '@/lib/auth-storage'

// ===========================================
// FETCHERS
// ===========================================

/**
 * Authenticated fetcher for protected endpoints
 * Handles 401 by triggering logout and redirect
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

  if (response.status === 401) {
    const { logout } = await import('@/lib/auth-storage')
    await logout()
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in'
    }
    throw new Error('Session expired')
  }

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
// API MUTATE HELPER
// ===========================================

/**
 * Authenticated API mutation helper for CRUD operations
 * Handles auth headers, 401 logout, JSON parsing
 */
export async function apiMutate<T = any>(
  endpoint: string,
  options: { method?: string; body?: any } = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const token = getAuthToken()

  if (!token) {
    return { data: null, error: 'No authentication token', status: 0 }
  }

  const url = getApiUrl(endpoint)
  const { method = 'POST', body } = options

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (response.status === 401) {
      const { logout } = await import('@/lib/auth-storage')
      await logout()
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in'
      }
      return { data: null, error: 'Session expired', status: 401 }
    }

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || 'Request failed', status: response.status }
    }

    return { data: result as T, error: null, status: response.status }
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error', status: 0 }
  }
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
    detailsSubmitted: data?.success ? data.detailsSubmitted : false,
    chargesEnabled: data?.success ? data.chargesEnabled : false,
    payoutsEnabled: data?.success ? data.payoutsEnabled : false,
    requirements: data?.success ? data.requirements : null,
    accountId: data?.success ? data.accountId : null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch Stripe Connect admin status for a specific investor
 */
export function useStripeConnectAdminStatus(investorId: string | null) {
  const token = getAuthToken()
  const url = token && investorId
    ? getApiUrl(API_CONFIG.endpoints.stripeConnectAdminStatus(investorId))
    : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    hasAccount: data?.success ? data.hasAccount : false,
    isComplete: data?.success ? data.isComplete : false,
    accountStatus: data?.success ? data.accountStatus : 'not_created',
    detailsSubmitted: data?.success ? data.detailsSubmitted : false,
    chargesEnabled: data?.success ? data.chargesEnabled : false,
    payoutsEnabled: data?.success ? data.payoutsEnabled : false,
    requirements: data?.success ? data.requirements : null,
    accountId: data?.success ? data.accountId : null,
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

// ===========================================
// NEW HOOKS — Phase 0 (API-only data)
// ===========================================

/**
 * Fetch all investments with medium cache (admin view)
 */
export function useInvestments() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getAllInvestments) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    investments: data?.success ? data.data : [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch a single investment by ID
 */
export function useInvestment(investmentId: string | null) {
  const token = getAuthToken()
  const url = token && investmentId
    ? getApiUrl(API_CONFIG.endpoints.getSingleInvestment(investmentId))
    : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    investment: data?.success ? data.data : null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch all investors with medium cache (admin view)
 */
export function useAllInvestors() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getAllInvestors) : null

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
 * Fetch a single investor by ID
 */
export function useInvestor(investorId: string | null) {
  const token = getAuthToken()
  const url = token && investorId
    ? getApiUrl(API_CONFIG.endpoints.getInvestorById(investorId))
    : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    investor: data?.success ? data.data : null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch all capital calls with medium cache (admin view — all structures)
 * Distinct from useCapitalCalls() which is LP-only (my capital calls)
 */
export function useAllCapitalCalls() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getAllCapitalCalls) : null

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
 * Fetch all distributions with medium cache (admin view — all structures)
 */
export function useAllDistributions() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getAllDistributions) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    distributions: data?.success ? data.data : [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch firm settings with long cache
 */
export function useFirmSettings() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getFirmSettings) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    longCacheConfig
  )

  return {
    settings: data?.success ? data.data : null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch all users with medium cache (admin view)
 */
export function useAllUsers() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getAllUsers) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    users: data?.success ? data.data : [],
    isLoading,
    error,
    mutate,
  }
}

// ===========================================
// EXISTING HOOKS (continued)
// ===========================================

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
 * Fetch LP capital calls with medium cache
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
 * Fetch LP distributions with medium cache
 */
export function useDistributions() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getMyDistributions) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    distributions: data?.success ? data.data : [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch user profile with medium cache
 */
export function useUserProfile() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.userProfile) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    user: data?.success ? data.user : null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch Stripe Connect admin investors list
 */
export function useStripeConnectAdminInvestors() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.stripeConnectAdminInvestors) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    mediumCacheConfig
  )

  return {
    investors: data?.success ? data.data : [],
    total: data?.success ? data.total : 0,
    withAccount: data?.success ? data.withAccount : 0,
    onboardingComplete: data?.success ? data.onboardingComplete : 0,
    isLoading,
    error,
    mutate,
  }
}

// ===========================================
// PLATFORM CURRENCY HOOK
// ===========================================

/**
 * Fetch platform currency from firm settings with long cache
 * Returns the baseCurrency set on first structure creation, defaults to 'USD'
 */
export function usePlatformCurrency() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getFirmSettings) : null

  const { data, error, isLoading, mutate } = useSWR(
    url ? `${url}:currency` : null,
    () => authFetcher(url!),
    longCacheConfig
  )

  return {
    currency: data?.success && data?.data?.baseCurrency ? data.data.baseCurrency : 'USD',
    isLoading,
    error,
    mutate,
  }
}

// ===========================================
// NOTIFICATION HOOKS
// ===========================================

/**
 * Fetch user notifications with short cache (frequently updated)
 */
export function useNotifications(options?: {
  limit?: number
  offset?: number
  unreadOnly?: boolean
  channel?: string
  type?: string
}) {
  const token = getAuthToken()
  let url = token ? getApiUrl(API_CONFIG.endpoints.getNotifications) : null

  // Add query params if options provided
  if (url && options) {
    const params = new URLSearchParams()
    if (options.limit) params.set('limit', options.limit.toString())
    if (options.offset) params.set('offset', options.offset.toString())
    if (options.unreadOnly) params.set('unreadOnly', 'true')
    if (options.channel) params.set('channel', options.channel)
    if (options.type) params.set('type', options.type)
    const queryString = params.toString()
    if (queryString) url = `${url}?${queryString}`
  }

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    shortCacheConfig
  )

  return {
    notifications: data?.success ? data.data : [],
    count: data?.success ? data.count : 0,
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
      refreshInterval: 30 * 1000, // Refresh every 30 seconds for badge updates
    }
  )

  return {
    count: data?.success ? data.count : 0,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Fetch single notification by ID
 */
export function useNotification(notificationId: string | null) {
  const token = getAuthToken()
  const url = token && notificationId
    ? getApiUrl(API_CONFIG.endpoints.getNotificationById(notificationId))
    : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    shortCacheConfig
  )

  return {
    notification: data?.success ? data.data : null,
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

// ===========================================
// MESSAGE HOOKS
// ===========================================

/**
 * Fetch unread message count across all conversations with short cache
 */
export function useUnreadMessageCount() {
  const token = getAuthToken()
  const url = token ? getApiUrl(API_CONFIG.endpoints.getUnreadMessageCount) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    {
      ...shortCacheConfig,
      refreshInterval: 30 * 1000, // 30 seconds for count
    }
  )

  return {
    totalUnreadCount: data?.success ? data.data?.totalUnreadCount || 0 : 0,
    conversationsWithUnread: data?.success ? data.data?.conversationsWithUnread || 0 : 0,
    isLoading,
    error,
    mutate,
  }
}

// ===========================================
// PENDING APPROVALS HOOK
// ===========================================

/**
 * Fetch total pending approvals count across capital calls, distributions, and payments.
 * Uses shortCacheConfig with 60s refresh (approvals change less frequently than messages).
 */
export function usePendingApprovalsCount() {
  const token = getAuthToken()

  const fetcher = async () => {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    const [capitalCallsRes, distributionsRes, paymentsRes] = await Promise.all([
      fetch(getApiUrl(API_CONFIG.endpoints.getPendingCapitalCallApprovals), { headers }),
      fetch(getApiUrl(API_CONFIG.endpoints.getPendingDistributionApprovals), { headers }),
      fetch(getApiUrl(API_CONFIG.endpoints.getPaymentStats), { headers }),
    ])

    const capitalCallsData = capitalCallsRes.ok ? await capitalCallsRes.json() : { data: [] }
    const distributionsData = distributionsRes.ok ? await distributionsRes.json() : { data: [] }
    const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { data: { pending: 0 } }

    const ccCount = Array.isArray(capitalCallsData.data) ? capitalCallsData.data.length : 0
    const distCount = Array.isArray(distributionsData.data) ? distributionsData.data.length : 0
    const paymentCount = paymentsData.data?.pending || 0

    return ccCount + distCount + paymentCount
  }

  const { data, error, isLoading, mutate } = useSWR(
    token ? 'pending-approvals-count' : null,
    fetcher,
    {
      ...shortCacheConfig,
      refreshInterval: 60 * 1000,
    }
  )

  return {
    count: typeof data === 'number' ? data : 0,
    isLoading,
    error,
    mutate,
  }
}

// ===========================================
// PRESENCE HOOKS
// ===========================================

/**
 * Presence config - fast refresh for real-time status
 */
const presenceConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 10 * 1000, // 10 seconds
  dedupingInterval: 5 * 1000, // 5 seconds
}

/**
 * Fetch online status for multiple users
 * @param userIds Array of user IDs to check
 */
export function useUserPresence(userIds: string[]) {
  const token = getAuthToken()

  // Create a stable key from sorted user IDs
  const key = token && userIds.length > 0
    ? `presence:${userIds.sort().join(',')}`
    : null

  const fetcher = async () => {
    const response = await fetch(getApiUrl(API_CONFIG.endpoints.presenceStatusBulk), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch presence')
    }

    const result = await response.json()
    return result
  }

  const { data, error, isLoading, mutate } = useSWR(
    key,
    fetcher,
    presenceConfig
  )

  // Create a map for easy lookup
  const presenceMap: Record<string, { isOnline: boolean; lastSeenAt: string | null }> = {}
  if (data?.success && data?.data) {
    data.data.forEach((p: { user_id: string; is_online: boolean; last_seen_at: string | null }) => {
      presenceMap[p.user_id] = {
        isOnline: p.is_online,
        lastSeenAt: p.last_seen_at,
      }
    })
  }

  return {
    presenceMap,
    isLoading,
    error,
    mutate,
    isOnline: (userId: string) => presenceMap[userId]?.isOnline ?? false,
  }
}

/**
 * Fetch online status for a single user
 * @param userId User ID to check
 */
export function useSingleUserPresence(userId: string | null) {
  const token = getAuthToken()
  const url = token && userId ? getApiUrl(API_CONFIG.endpoints.presenceStatus(userId)) : null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    presenceConfig
  )

  return {
    isOnline: data?.success ? data.data?.is_online ?? false : false,
    lastSeenAt: data?.success ? data.data?.last_seen_at : null,
    status: data?.success ? data.data?.status : 'offline',
    isLoading,
    error,
    mutate,
  }
}

/**
 * Get all currently online users
 * DISABLED: Set url to null to prevent API requests
 */
export function useOnlineUsers() {
  const url = null

  const { data, error, isLoading, mutate } = useSWR(
    url,
    authFetcher,
    presenceConfig
  )

  return {
    onlineUsers: data?.success ? data.data : [],
    isLoading,
    error,
    mutate,
  }
}
