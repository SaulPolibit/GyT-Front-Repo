export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'table' | 'radar' | 'radial'

export type TooltipVariant = 'default' | 'line-indicator' | 'no-indicator' | 'no-label' | 'label-formatter' | 'advanced'

export interface TooltipConfig {
  variant: TooltipVariant
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: 'dot' | 'line' | 'dashed'
  showTotal?: boolean
}

export interface ChartConfig {
  type: ChartType
  dataSource: string
  metrics: string[]
  dateRange?: {
    start: string
    end: string
  }
  title: string
  description?: string
  structureId?: string // Filter chart data by structure ('all' or specific structure ID)
  size?: 'small' | 'medium' | 'large' // Chart display size
  tooltipConfig?: TooltipConfig // Tooltip customization
}

export interface MetricCardConfig {
  title: string
  value: string
  description?: string
  badge?: string
  trend?: 'up' | 'down' | 'neutral'
  size?: 'small' | 'medium' | 'large'
  metricId?: string
  structureId?: string // Filter by specific structure, or 'all' for all structures
}

export interface SectionConfig {
  title: string
  structureId: string // 'all' or specific structure ID
  collapsed: boolean
}

export interface DashboardWidget {
  id: string
  type: 'chart' | 'card' | 'table' | 'metric' | 'section' | 'comparison'
  position: number
  config: ChartConfig | MetricCardConfig | SectionConfig | Record<string, any>
  isCustom: boolean
  sectionId?: string // For widgets that belong to a section
  ignoreFilter?: boolean // For comparison widgets that should always show all structures
}

export interface DashboardConfig {
  widgets: DashboardWidget[]
  lastModified: string
}

const STORAGE_KEY = 'polibit_dashboard_config'

// Get default dashboard configuration
export function getDefaultDashboard(): DashboardConfig {
  return {
    widgets: [],
    lastModified: new Date().toISOString(),
  }
}

// Get dashboard configuration from localStorage
export function getDashboardConfig(): DashboardConfig {
  if (typeof window === 'undefined') {
    return getDefaultDashboard()
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return getDefaultDashboard()
    }

    const config = JSON.parse(stored) as DashboardConfig

    // Migration: Check if we have widgets but no sections
    const hasSections = config.widgets.some(w => w.type === 'section')
    if (!hasSections && config.widgets.length > 0) {
      // Create default "All Structures" section
      const allStructuresSection: DashboardWidget = {
        id: 'section-all-structures',
        type: 'section',
        position: 0,
        config: {
          title: 'All Structures',
          structureId: 'all',
          collapsed: false,
        },
        isCustom: false,
      }

      // Add section to beginning
      config.widgets.unshift(allStructuresSection)

      // Assign all existing widgets to this section
      config.widgets.forEach((widget, index) => {
        if (widget.type !== 'section') {
          widget.sectionId = 'section-all-structures'
          widget.position = index
        }
      })

      // Save migrated config
      saveDashboardConfig(config)
    }

    return config
  } catch (error) {
    console.error('Error loading dashboard config:', error)
    return getDefaultDashboard()
  }
}

// Save dashboard configuration to localStorage
export function saveDashboardConfig(config: DashboardConfig): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    config.lastModified = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Error saving dashboard config:', error)
  }
}

// Add a widget to the dashboard
export function addWidget(widget: Omit<DashboardWidget, 'id' | 'position'>): DashboardWidget {
  const config = getDashboardConfig()
  const newWidget: DashboardWidget = {
    ...widget,
    id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    position: config.widgets.length,
  }

  config.widgets.push(newWidget)
  saveDashboardConfig(config)

  return newWidget
}

// Remove a widget from the dashboard
export function removeWidget(widgetId: string): void {
  const config = getDashboardConfig()
  config.widgets = config.widgets
    .filter(w => w.id !== widgetId)
    .map((w, index) => ({ ...w, position: index }))

  saveDashboardConfig(config)
}

// Update widget configuration
export function updateWidget(widgetId: string, updates: Partial<DashboardWidget>): void {
  const config = getDashboardConfig()
  const widgetIndex = config.widgets.findIndex(w => w.id === widgetId)

  if (widgetIndex === -1) {
    console.error('Widget not found:', widgetId)
    return
  }

  config.widgets[widgetIndex] = {
    ...config.widgets[widgetIndex],
    ...updates,
  }

  saveDashboardConfig(config)
}

// Reorder widgets (after drag and drop)
export function reorderWidgets(widgetIds: string[]): void {
  const config = getDashboardConfig()
  const widgetMap = new Map(config.widgets.map(w => [w.id, w]))

  config.widgets = widgetIds
    .map(id => widgetMap.get(id))
    .filter((w): w is DashboardWidget => w !== undefined)
    .map((w, index) => ({ ...w, position: index }))

  saveDashboardConfig(config)
}

// Reset to default dashboard
export function resetToDefault(): void {
  const defaultConfig = getDefaultDashboard()
  saveDashboardConfig(defaultConfig)
}

// Toggle section collapsed state
export function toggleSection(sectionId: string): void {
  const config = getDashboardConfig()
  const section = config.widgets.find(w => w.id === sectionId && w.type === 'section')

  if (section && section.config) {
    const sectionConfig = section.config as SectionConfig
    sectionConfig.collapsed = !sectionConfig.collapsed
    updateWidget(sectionId, { config: sectionConfig })
  }
}

// Add a new section
export function addSection(title: string, structureId: string): DashboardWidget {
  const config = getDashboardConfig()
  const newSection: DashboardWidget = {
    id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'section',
    position: config.widgets.length,
    config: {
      title,
      structureId,
      collapsed: false,
    },
    isCustom: true,
  }

  config.widgets.push(newSection)
  saveDashboardConfig(config)

  return newSection
}
