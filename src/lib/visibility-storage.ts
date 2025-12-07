export interface VisibilitySettings {
  navMainItems: {
    [key: string]: boolean;
  };
  navManagementItems: {
    [key: string]: boolean;
  };
  navSecondaryItems: {
    [key: string]: boolean;
  };
  currentStageOptions: {
    [key: string]: boolean;
  };
  structureStatusFilters: {
    [key: string]: boolean;
  };
  economicTermsOptions: {
    [key: string]: boolean;
  };
  setupCompleteButtons: {
    [key: string]: boolean;
  };
  actionButtons: {
    [key: string]: boolean;
  };
}

const VISIBILITY_STORAGE_KEY = 'polibit-visibility-settings';

// Default visibility settings - all items visible
const DEFAULT_VISIBILITY: VisibilitySettings = {
  navMainItems: {
    dashboard: true,
    structures: true,
    investments: true,
    investors: true,
    reports: true,
    performance: true,
    documents: true,
    chat: true,
  },
  navManagementItems: {
    capital: true,
    operations: true,
  },
  navSecondaryItems: {
    settings: true,
    getHelp: true,
    search: true,
  },
  currentStageOptions: {
    fundraising: true,
    active: true,
    closed: true,
  },
  structureStatusFilters: {
    all: true,
    fundraising: true,
    active: true,
    closed: true,
  },
  economicTermsOptions: {
    'all-investors': true,
    'per-investor': true,
  },
  setupCompleteButtons: {
    'check-structure': true,
    'invite-investors': true,
  },
  actionButtons: {
    'add-investor': true,
  },
};

export function getVisibilitySettings(): VisibilitySettings {
  if (typeof window === 'undefined') {
    return DEFAULT_VISIBILITY;
  }

  try {
    const stored = localStorage.getItem(VISIBILITY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle backwards compatibility
      return {
        navMainItems: { ...DEFAULT_VISIBILITY.navMainItems, ...parsed.navMainItems },
        navManagementItems: { ...DEFAULT_VISIBILITY.navManagementItems, ...parsed.navManagementItems },
        navSecondaryItems: { ...DEFAULT_VISIBILITY.navSecondaryItems, ...parsed.navSecondaryItems },
        currentStageOptions: { ...DEFAULT_VISIBILITY.currentStageOptions, ...parsed.currentStageOptions },
        structureStatusFilters: { ...DEFAULT_VISIBILITY.structureStatusFilters, ...parsed.structureStatusFilters },
        economicTermsOptions: { ...DEFAULT_VISIBILITY.economicTermsOptions, ...parsed.economicTermsOptions },
        setupCompleteButtons: { ...DEFAULT_VISIBILITY.setupCompleteButtons, ...parsed.setupCompleteButtons },
        actionButtons: { ...DEFAULT_VISIBILITY.actionButtons, ...parsed.actionButtons },
      };
    }
  } catch (error) {
    console.error('Failed to parse visibility settings:', error);
  }

  return DEFAULT_VISIBILITY;
}

export function saveVisibilitySettings(settings: VisibilitySettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save visibility settings:', error);
  }
}

export function resetVisibilitySettings(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(VISIBILITY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset visibility settings:', error);
  }
}
