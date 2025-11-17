// Firm settings data type
export interface FirmSettings {
  firmName: string
  firmLogo?: string | null
  firmDescription?: string
  firmWebsite?: string
  firmAddress?: string
  firmPhone?: string
  firmEmail?: string
  updatedAt: Date
}

const STORAGE_KEY = 'polibit_firm_settings'

// Default firm settings
const DEFAULT_SETTINGS: FirmSettings = {
  firmName: 'Polibit',
  firmLogo: null,
  firmDescription: '',
  firmWebsite: '',
  firmAddress: '',
  firmPhone: '',
  firmEmail: '',
  updatedAt: new Date()
}

// Get firm settings from localStorage
export function getFirmSettings(): FirmSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS

    const settings = JSON.parse(stored)
    return {
      ...settings,
      updatedAt: new Date(settings.updatedAt)
    }
  } catch (error) {
    console.error('Error loading firm settings:', error)
    return DEFAULT_SETTINGS
  }
}

// Save firm settings
export function saveFirmSettings(settings: Partial<FirmSettings>): FirmSettings {
  const currentSettings = getFirmSettings()

  const newSettings: FirmSettings = {
    ...currentSettings,
    ...settings,
    updatedAt: new Date()
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
  } catch (error) {
    console.error('Error saving firm settings:', error)
    throw error
  }

  return newSettings
}

// Reset to defaults
export function resetFirmSettings(): FirmSettings {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS))
  } catch (error) {
    console.error('Error resetting firm settings:', error)
    throw error
  }

  return DEFAULT_SETTINGS
}
