export type NotificationFrequency = 'real-time' | 'daily-digest' | 'weekly-summary' | 'disabled'

export interface NotificationEvent {
  id: string
  name: string
  description: string
  category: 'capital' | 'reports' | 'investors' | 'system'
  enabled: boolean
  frequency: NotificationFrequency
}

export interface NotificationSettings {
  // Main notification toggles
  emailNotifications?: boolean
  smsNotifications?: boolean
  pushNotifications?: boolean

  // Email notification sub-settings
  capitalCallNotices?: boolean
  distributionNotices?: boolean
  quarterlyReports?: boolean
  k1TaxForms?: boolean
  documentUploads?: boolean
  generalAnnouncements?: boolean

  // SMS notification sub-settings
  urgentCapitalCalls?: boolean
  paymentConfirmations?: boolean
  securityAlerts?: boolean

  // Communication preferences
  preferredContactMethod?: string
  reportDeliveryFormat?: string
  notificationFrequency?: string

  // Legacy structure (for backward compatibility)
  capitalCallIssued?: NotificationEvent
  distributionExecuted?: NotificationEvent
  paymentOverdue?: NotificationEvent
  paymentReceived?: NotificationEvent
  reportGenerated?: NotificationEvent
  quarterlyReportDue?: NotificationEvent
  newInvestorAdded?: NotificationEvent
  investorDocumentUploaded?: NotificationEvent
  systemMaintenance?: NotificationEvent
  securityAlert?: NotificationEvent

  // Global settings
  emailAddress?: string
  enableEmailNotifications?: boolean
  enableInAppNotifications?: boolean

  updatedAt?: Date
}

const STORAGE_KEY = 'polibit_notification_settings'

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  // Main notification toggles
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,

  // Email notification sub-settings
  capitalCallNotices: true,
  distributionNotices: true,
  quarterlyReports: true,
  k1TaxForms: true,
  documentUploads: true,
  generalAnnouncements: true,

  // SMS notification sub-settings
  urgentCapitalCalls: false,
  paymentConfirmations: false,
  securityAlerts: false,

  // Communication preferences
  preferredContactMethod: 'email',
  reportDeliveryFormat: 'pdf',
  notificationFrequency: 'real-time',

  // Global settings
  emailAddress: '',
  enableEmailNotifications: true,
  enableInAppNotifications: true,
  updatedAt: new Date(),
}

// Get notification settings
export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Initialize with defaults
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS))
      return DEFAULT_NOTIFICATION_SETTINGS
    }

    const settings = JSON.parse(stored)
    return {
      ...settings,
      updatedAt: new Date(settings.updatedAt)
    }
  } catch (error) {
    console.error('Error loading notification settings:', error)
    return DEFAULT_NOTIFICATION_SETTINGS
  }
}

// Save notification settings
export function saveNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  const currentSettings = getNotificationSettings()

  const newSettings: NotificationSettings = {
    ...currentSettings,
    ...settings,
    updatedAt: new Date()
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
  } catch (error) {
    console.error('Error saving notification settings:', error)
    throw error
  }

  return newSettings
}

// Update specific event setting
export function updateEventSetting(eventId: string, updates: Partial<NotificationEvent>): NotificationSettings {
  const settings = getNotificationSettings()

  // Find the event key in settings
  const eventKey = Object.keys(settings).find(key => {
    const value = settings[key as keyof NotificationSettings]
    return typeof value === 'object' && value !== null && 'id' in value && value.id === eventId
  })

  if (!eventKey) {
    throw new Error(`Event with id ${eventId} not found`)
  }

  const currentEvent = settings[eventKey as keyof NotificationSettings] as NotificationEvent

  const updatedSettings = {
    ...settings,
    [eventKey]: {
      ...currentEvent,
      ...updates,
    },
    updatedAt: new Date()
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings))
  } catch (error) {
    console.error('Error updating event setting:', error)
    throw error
  }

  return updatedSettings
}

// Reset to defaults
export function resetNotificationSettings(): NotificationSettings {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS))
  } catch (error) {
    console.error('Error resetting notification settings:', error)
    throw error
  }

  return DEFAULT_NOTIFICATION_SETTINGS
}

// Get frequency label
export function getFrequencyLabel(frequency: NotificationFrequency): string {
  switch (frequency) {
    case 'real-time':
      return 'Real-time'
    case 'daily-digest':
      return 'Daily Digest'
    case 'weekly-summary':
      return 'Weekly Summary'
    case 'disabled':
      return 'Disabled'
  }
}

// Get frequency description
export function getFrequencyDescription(frequency: NotificationFrequency): string {
  switch (frequency) {
    case 'real-time':
      return 'Immediate notifications when event occurs'
    case 'daily-digest':
      return 'Daily summary of events (sent at 9:00 AM)'
    case 'weekly-summary':
      return 'Weekly summary (sent on Mondays)'
    case 'disabled':
      return 'Do not receive notifications for this event'
  }
}
