// Nav Visibility Configuration Storage
// Controls which navigation items each role can see in both portals

export interface NavItemVisibility {
  admin: boolean      // role 1
  operations: boolean // role 2
  readOnly: boolean   // role 4
}

export interface LPNavItemVisibility {
  investor: boolean   // role 3
}

export interface FeatureFlags {
  paymentsTab: boolean              // LP Settings — Payment tab
  advancedNotificationsLP: boolean  // LP Settings — SMS, Portal Notifs, Comm Prefs
  complianceInfo: boolean           // LP Settings — Tax/KYC/Accreditation cards
  advancedNotificationsIM: boolean  // IM Settings — SMS, Portal Notifs, Comm Prefs
  contractSigning: boolean          // LP Marketplace — contract signing workflow
}

export interface NavVisibilityConfig {
  investmentManager: Record<string, NavItemVisibility>
  lpPortal: Record<string, LPNavItemVisibility>
  features: FeatureFlags
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  paymentsTab: true,
  advancedNotificationsLP: true,
  complianceInfo: true,
  advancedNotificationsIM: true,
  contractSigning: true,
}

export interface FeatureFlagMeta {
  key: keyof FeatureFlags
  label: string
  description: string
}

export const FEATURE_FLAGS_META: FeatureFlagMeta[] = [
  { key: 'paymentsTab', label: 'Payment Tab', description: 'Show the Payment tab in LP Settings' },
  { key: 'advancedNotificationsLP', label: 'Advanced Notifications (LP)', description: 'Show SMS, Portal Notifications, and Communication Preferences in LP Settings' },
  { key: 'complianceInfo', label: 'Compliance Info', description: 'Show Tax, KYC, and Accreditation cards in LP Settings' },
  { key: 'advancedNotificationsIM', label: 'Advanced Notifications (IM)', description: 'Show SMS, Portal Notifications, and Communication Preferences in IM Settings' },
  { key: 'contractSigning', label: 'Contract Signing', description: 'Enable the contract signing workflow in LP Marketplace checkout' },
]

// Nav item metadata for rendering settings tables
export interface NavItemMeta {
  key: string
  label: string
  section?: string
}

// Investment Manager nav items
export const NAV_ITEMS_IM: NavItemMeta[] = [
  { key: 'dashboard', label: 'Dashboard', section: 'Main' },
  { key: 'structures', label: 'Structures', section: 'Main' },
  { key: 'investments', label: 'Investments', section: 'Main' },
  { key: 'investors', label: 'Investors', section: 'Main' },
  { key: 'approvals', label: 'Approvals', section: 'Main' },
  { key: 'reports', label: 'Reports', section: 'Main' },
  { key: 'performance', label: 'Performance', section: 'Main' },
  { key: 'documents', label: 'Documents', section: 'Main' },
  { key: 'chat', label: 'Chat', section: 'Main' },
  { key: 'commitments', label: 'Commitments', section: 'Management > Capital' },
  { key: 'activity', label: 'Activity', section: 'Management > Capital' },
  { key: 'capitalCalls', label: 'Capital Calls', section: 'Management > Operations' },
  { key: 'distributions', label: 'Distributions', section: 'Management > Operations' },
  { key: 'contractsManagement', label: 'Contracts Management', section: 'Management > Operations' },
  { key: 'settings', label: 'Settings', section: 'Secondary' },
]

// LP Portal nav items
export const NAV_ITEMS_LP: NavItemMeta[] = [
  { key: 'dashboard', label: 'Dashboard', section: 'Main' },
  { key: 'marketplace', label: 'Marketplace', section: 'Main' },
  { key: 'portfolio', label: 'Portfolio', section: 'Main' },
  { key: 'reports', label: 'Reports', section: 'Main' },
  { key: 'documents', label: 'Documents', section: 'Main' },
  { key: 'chat', label: 'Chat', section: 'Main' },
  { key: 'commitments', label: 'Commitments', section: 'Management > Capital' },
  { key: 'activity', label: 'Activity', section: 'Management > Capital' },
  { key: 'capitalCalls', label: 'Capital Calls', section: 'Management > Operations' },
  { key: 'distributions', label: 'Distributions', section: 'Management > Operations' },
  { key: 'settings', label: 'Settings', section: 'Secondary' },
]

// Default visibility based on existing permissions matrix
export const DEFAULT_NAV_VISIBILITY: NavVisibilityConfig = {
  investmentManager: {
    dashboard:           { admin: true,  operations: true,  readOnly: true },
    structures:          { admin: true,  operations: true,  readOnly: true },
    investments:         { admin: true,  operations: true,  readOnly: true },
    investors:           { admin: true,  operations: true,  readOnly: true },
    approvals:           { admin: true,  operations: true,  readOnly: false },
    reports:             { admin: true,  operations: true,  readOnly: true },
    performance:         { admin: true,  operations: true,  readOnly: true },
    documents:           { admin: true,  operations: true,  readOnly: true },
    chat:                { admin: true,  operations: true,  readOnly: true },
    commitments:         { admin: true,  operations: true,  readOnly: true },
    activity:            { admin: true,  operations: true,  readOnly: true },
    capitalCalls:        { admin: true,  operations: true,  readOnly: false },
    distributions:       { admin: true,  operations: true,  readOnly: false },
    contractsManagement: { admin: false, operations: false, readOnly: false },
    settings:            { admin: true,  operations: false, readOnly: false },
  },
  lpPortal: {
    dashboard:     { investor: true },
    marketplace:   { investor: true },
    portfolio:     { investor: true },
    reports:       { investor: true },
    documents:     { investor: true },
    chat:          { investor: true },
    commitments:   { investor: true },
    activity:      { investor: true },
    capitalCalls:  { investor: true },
    distributions: { investor: true },
    settings:      { investor: true },
  },
  features: { ...DEFAULT_FEATURE_FLAGS },
}

const STORAGE_KEY = 'polibit_nav_visibility'

function mergeWithDefaults(parsed: NavVisibilityConfig): NavVisibilityConfig {
  return {
    investmentManager: {
      ...DEFAULT_NAV_VISIBILITY.investmentManager,
      ...parsed.investmentManager,
    },
    lpPortal: {
      ...DEFAULT_NAV_VISIBILITY.lpPortal,
      ...parsed.lpPortal,
    },
    features: {
      ...DEFAULT_FEATURE_FLAGS,
      ...parsed.features,
    },
  }
}

// Check if a feature flag is enabled
export function isFeatureEnabled(config: NavVisibilityConfig, featureKey: keyof FeatureFlags): boolean {
  return config.features?.[featureKey] ?? DEFAULT_FEATURE_FLAGS[featureKey]
}

// Get nav visibility config from localStorage cache (synchronous, for sidebar rendering)
export function getNavVisibility(): NavVisibilityConfig {
  if (typeof window === 'undefined') return DEFAULT_NAV_VISIBILITY

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_NAV_VISIBILITY

    return mergeWithDefaults(JSON.parse(stored) as NavVisibilityConfig)
  } catch (error) {
    console.error('Error loading nav visibility config:', error)
    return DEFAULT_NAV_VISIBILITY
  }
}

// Save nav visibility config to localStorage cache
export function saveNavVisibilityToCache(config: NavVisibilityConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Error saving nav visibility to cache:', error)
  }
}

// Fetch nav visibility from API and update localStorage cache
// Called on app load to sync database → localStorage
export async function fetchAndCacheNavVisibility(token: string): Promise<NavVisibilityConfig> {
  const { API_CONFIG, getApiUrl } = await import('@/lib/api-config')

  try {
    const response = await fetch(
      getApiUrl(API_CONFIG.endpoints.getNavVisibility),
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        const config = mergeWithDefaults(result.data)
        saveNavVisibilityToCache(config)
        return config
      }
    }
  } catch (error) {
    console.error('Error fetching nav visibility from API:', error)
  }

  // Fallback to cached/defaults
  return getNavVisibility()
}

// Save nav visibility to API (database) and update localStorage cache
export async function saveNavVisibility(config: NavVisibilityConfig, token: string): Promise<boolean> {
  const { API_CONFIG, getApiUrl } = await import('@/lib/api-config')

  try {
    const response = await fetch(
      getApiUrl(API_CONFIG.endpoints.updateNavVisibility),
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      }
    )

    if (response.ok) {
      saveNavVisibilityToCache(config)
      return true
    }

    return false
  } catch (error) {
    console.error('Error saving nav visibility to API:', error)
    return false
  }
}

// Check if a nav item is visible for a given role
// Root (role 0) always sees everything
export function isNavItemVisible(
  config: NavVisibilityConfig,
  portal: 'investmentManager' | 'lpPortal',
  itemKey: string,
  userRole: number
): boolean {
  // Root always sees everything
  if (userRole === 0) return true

  if (portal === 'investmentManager') {
    const item = config.investmentManager[itemKey]
    if (!item) return false

    switch (userRole) {
      case 1: return item.admin
      case 2: return item.operations
      case 4: return item.readOnly
      default: return false
    }
  }

  if (portal === 'lpPortal') {
    const item = config.lpPortal[itemKey]
    if (!item) return false

    if (userRole === 3) return item.investor
    return false
  }

  return false
}
