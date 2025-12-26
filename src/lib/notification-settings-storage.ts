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
  // Capital Operations
  capitalCallIssued: NotificationEvent
  distributionExecuted: NotificationEvent
  paymentOverdue: NotificationEvent
  paymentReceived: NotificationEvent

  // Reports
  reportGenerated: NotificationEvent
  quarterlyReportDue: NotificationEvent

  // Investors
  newInvestorAdded: NotificationEvent
  investorDocumentUploaded: NotificationEvent

  // System
  systemMaintenance: NotificationEvent
  securityAlert: NotificationEvent
  generalAnnouncements: NotificationEvent

  // Global settings
  emailAddress: string
  enableEmailNotifications: boolean
  enableInAppNotifications: boolean

  updatedAt: Date
}

const STORAGE_KEY = 'polibit_notification_settings'

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  capitalCallIssued: {
    id: 'capital-call-issued',
    name: 'Capital Call Issued',
    description: 'Notification when a new capital call is issued',
    category: 'capital',
    enabled: true,
    frequency: 'real-time',
  },
  distributionExecuted: {
    id: 'distribution-executed',
    name: 'Distribution Executed',
    description: 'Notification when a distribution is executed',
    category: 'capital',
    enabled: true,
    frequency: 'real-time',
  },
  paymentOverdue: {
    id: 'payment-overdue',
    name: 'Payment Overdue',
    description: 'Alert when a payment is overdue',
    category: 'capital',
    enabled: true,
    frequency: 'daily-digest',
  },
  paymentReceived: {
    id: 'payment-received',
    name: 'Payment Received',
    description: 'Confirmation when a payment is received',
    category: 'capital',
    enabled: true,
    frequency: 'real-time',
  },
  reportGenerated: {
    id: 'report-generated',
    name: 'Report Generated',
    description: 'Notification when a report is generated',
    category: 'reports',
    enabled: true,
    frequency: 'real-time',
  },
  quarterlyReportDue: {
    id: 'quarterly-report-due',
    name: 'Quarterly Report Due',
    description: 'Reminder for upcoming quarterly report',
    category: 'reports',
    enabled: true,
    frequency: 'weekly-summary',
  },
  newInvestorAdded: {
    id: 'new-investor-added',
    name: 'New Investor Added',
    description: 'Notification when a new investor is added',
    category: 'investors',
    enabled: true,
    frequency: 'real-time',
  },
  investorDocumentUploaded: {
    id: 'investor-document-uploaded',
    name: 'Investor Document Uploaded',
    description: 'Notification when an investor uploads a document',
    category: 'investors',
    enabled: false,
    frequency: 'daily-digest',
  },
  systemMaintenance: {
    id: 'system-maintenance',
    name: 'System Maintenance',
    description: 'Notice of scheduled system maintenance',
    category: 'system',
    enabled: true,
    frequency: 'real-time',
  },
  securityAlert: {
    id: 'security-alert',
    name: 'Security Alert',
    description: 'Important security alerts',
    category: 'system',
    enabled: true,
    frequency: 'real-time',
  },
  generalAnnouncements: {
    id: 'general-announcements',
    name: 'General Announcements',
    description: 'General platform announcements and updates',
    category: 'system',
    enabled: true,
    frequency: 'real-time',
  },
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
