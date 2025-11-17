import { ChartConfig } from './dashboard-storage'
import { IconChartLine, IconCurrencyDollar, IconChartPie, IconChartBar, IconTrendingUp, IconBuilding, IconChartArea, IconGauge, IconTable, IconRadar, IconCircleDotted } from '@tabler/icons-react'

export interface ChartTemplate {
  id: string
  name: string
  description: string
  icon: any
  config: ChartConfig
  category: 'performance' | 'financial' | 'portfolio' | 'operations'
}

export const chartTemplates: ChartTemplate[] = [
  {
    id: 'portfolio-performance',
    name: 'Portfolio Performance',
    description: 'Track your portfolio value over time',
    icon: IconChartLine,
    category: 'performance',
    config: {
      type: 'area',
      dataSource: 'nav',
      metrics: ['totalValue', 'unrealizedGain'],
      title: 'Portfolio Performance',
      description: 'Net Asset Value trend over time',
    },
  },
  {
    id: 'capital-calls-timeline',
    name: 'Capital Calls Timeline',
    description: 'Visualize capital call history and projections',
    icon: IconCurrencyDollar,
    category: 'operations',
    config: {
      type: 'bar',
      dataSource: 'capitalCalls',
      metrics: ['called', 'uncalled'],
      title: 'Capital Calls Timeline',
      description: 'Historical and projected capital calls',
    },
  },
  {
    id: 'investment-distribution',
    name: 'Investment Distribution',
    description: 'View breakdown of investments by asset class',
    icon: IconChartPie,
    category: 'portfolio',
    config: {
      type: 'pie',
      dataSource: 'investments',
      metrics: ['realEstate', 'privateEquity', 'privateDebt'],
      title: 'Investment Distribution',
      description: 'Portfolio allocation by asset class',
    },
  },
  {
    id: 'irr-comparison',
    name: 'IRR Comparison',
    description: 'Compare IRR across investments',
    icon: IconChartBar,
    category: 'performance',
    config: {
      type: 'bar',
      dataSource: 'investments',
      metrics: ['irr'],
      title: 'IRR Comparison',
      description: 'Internal Rate of Return by investment',
    },
  },
  {
    id: 'distribution-history',
    name: 'Distribution History',
    description: 'Track distributions to investors over time',
    icon: IconTrendingUp,
    category: 'financial',
    config: {
      type: 'line',
      dataSource: 'distributions',
      metrics: ['amount'],
      title: 'Distribution History',
      description: 'Cash distributions to investors',
    },
  },
  {
    id: 'top-investments',
    name: 'Top Investments',
    description: 'View your highest performing investments',
    icon: IconBuilding,
    category: 'portfolio',
    config: {
      type: 'bar',
      dataSource: 'investments',
      metrics: ['currentValue', 'multiple'],
      title: 'Top Investments',
      description: 'Best performing investments by value',
    },
  },
  {
    id: 'asset-allocation',
    name: 'Asset Allocation',
    description: 'Donut chart of asset allocation',
    icon: IconChartArea,
    category: 'portfolio',
    config: {
      type: 'donut',
      dataSource: 'investments',
      metrics: ['totalInvested'],
      title: 'Asset Allocation',
      description: 'Capital deployed by asset class',
    },
  },
  {
    id: 'performance-metrics',
    name: 'Performance Metrics',
    description: 'Key performance indicators dashboard',
    icon: IconGauge,
    category: 'performance',
    config: {
      type: 'line',
      dataSource: 'performance',
      metrics: ['irr', 'multiple', 'dpi'],
      title: 'Performance Metrics',
      description: 'IRR, MOIC, and DPI over time',
    },
  },
  {
    id: 'holdings-table',
    name: 'Holdings by Value',
    description: 'Detailed table of all portfolio holdings',
    icon: IconTable,
    category: 'portfolio',
    config: {
      type: 'table',
      dataSource: 'investments',
      metrics: ['name', 'type', 'currentValue', 'navPercentage', 'method'],
      title: 'Holdings by Value',
      description: 'Asset Name, Type, Value, % of NAV, Method',
    },
  },
  {
    id: 'investments-table',
    name: 'Active Investments',
    description: 'Table view of all active investments',
    icon: IconTable,
    category: 'portfolio',
    config: {
      type: 'table',
      dataSource: 'investments',
      metrics: ['investment', 'sectionType', 'status', 'amount', 'value', 'irr'],
      title: 'Investment Performance',
      description: 'Portfolio Overview, Investment Performance, Active Investments',
    },
  },
  {
    id: 'performance-radar',
    name: 'Performance Comparison',
    description: 'Multi-dimensional performance analysis',
    icon: IconRadar,
    category: 'performance',
    config: {
      type: 'radar',
      dataSource: 'performance',
      metrics: ['irr', 'multiple', 'dpi', 'tvpi', 'rvpi'],
      title: 'Performance Comparison',
      description: 'Multi-dimensional fund performance metrics',
    },
  },
  {
    id: 'goal-progress',
    name: 'Goal Progress',
    description: 'Track fundraising or investment goals',
    icon: IconCircleDotted,
    category: 'operations',
    config: {
      type: 'radial',
      dataSource: 'capitalCalls',
      metrics: ['called', 'uncalled'],
      title: 'Capital Deployment Progress',
      description: 'Capital called vs total commitment',
    },
  },
]

export const chartCategories = [
  { id: 'all', name: 'All Templates', count: chartTemplates.length },
  { id: 'performance', name: 'Performance', count: chartTemplates.filter(t => t.category === 'performance').length },
  { id: 'financial', name: 'Financial', count: chartTemplates.filter(t => t.category === 'financial').length },
  { id: 'portfolio', name: 'Portfolio', count: chartTemplates.filter(t => t.category === 'portfolio').length },
  { id: 'operations', name: 'Operations', count: chartTemplates.filter(t => t.category === 'operations').length },
]

export function getTemplatesByCategory(category: string): ChartTemplate[] {
  if (category === 'all') {
    return chartTemplates
  }
  return chartTemplates.filter(t => t.category === category)
}

export function getTemplateById(id: string): ChartTemplate | undefined {
  return chartTemplates.find(t => t.id === id)
}

// Data source options for custom chart builder
export const dataSourceOptions = [
  { value: 'nav', label: 'Net Asset Value', description: 'Portfolio NAV over time' },
  { value: 'investments', label: 'Investments', description: 'Investment portfolio data' },
  { value: 'investors', label: 'Investors', description: 'LP commitment and performance' },
  { value: 'capitalCalls', label: 'Capital Calls', description: 'Capital call history' },
  { value: 'distributions', label: 'Distributions', description: 'Distribution history' },
  { value: 'performance', label: 'Performance', description: 'Fund performance metrics' },
]

// Metric options by data source
export const metricsByDataSource: Record<string, Array<{ value: string; label: string }>> = {
  nav: [
    { value: 'totalValue', label: 'Total Value' },
    { value: 'unrealizedGain', label: 'Unrealized Gain' },
    { value: 'navPerShare', label: 'NAV per Share' },
  ],
  investments: [
    { value: 'currentValue', label: 'Current Value' },
    { value: 'totalInvested', label: 'Total Invested' },
    { value: 'irr', label: 'IRR' },
    { value: 'multiple', label: 'Multiple (MOIC)' },
    { value: 'unrealizedGain', label: 'Unrealized Gain' },
  ],
  investors: [
    { value: 'commitment', label: 'Commitment' },
    { value: 'contributed', label: 'Contributed' },
    { value: 'distributed', label: 'Distributed' },
    { value: 'irr', label: 'IRR' },
  ],
  capitalCalls: [
    { value: 'called', label: 'Capital Called' },
    { value: 'uncalled', label: 'Uncalled Capital' },
  ],
  distributions: [
    { value: 'amount', label: 'Distribution Amount' },
    { value: 'cumulative', label: 'Cumulative Distributions' },
  ],
  performance: [
    { value: 'irr', label: 'IRR' },
    { value: 'multiple', label: 'Multiple (MOIC)' },
    { value: 'dpi', label: 'DPI' },
    { value: 'tvpi', label: 'TVPI' },
    { value: 'rvpi', label: 'RVPI' },
  ],
}

// Chart type options
export const chartTypeOptions = [
  { value: 'line', label: 'Line Chart', description: 'Show trends over time' },
  { value: 'bar', label: 'Bar Chart', description: 'Compare values across categories' },
  { value: 'area', label: 'Area Chart', description: 'Show cumulative values over time' },
  { value: 'pie', label: 'Pie Chart', description: 'Show proportional distribution' },
  { value: 'donut', label: 'Donut Chart', description: 'Show proportional distribution with center space' },
  { value: 'radar', label: 'Radar Chart', description: 'Multi-dimensional data comparison' },
  { value: 'radial', label: 'Radial Chart', description: 'Circular progress and goal tracking' },
  { value: 'table', label: 'Data Table', description: 'Display data in structured table format' },
]

// Tooltip variant options
export const tooltipVariantOptions = [
  { value: 'default', label: 'Default', description: 'Standard tooltip with dot indicator' },
  { value: 'line-indicator', label: 'Line Indicator', description: 'Tooltip with line indicator' },
  { value: 'no-indicator', label: 'No Indicator', description: 'Tooltip without indicator' },
  { value: 'no-label', label: 'No Label', description: 'Tooltip without date/time label' },
  { value: 'label-formatter', label: 'Label Formatter', description: 'Tooltip with custom date formatting' },
  { value: 'advanced', label: 'Advanced', description: 'Tooltip with custom formatting and totals' },
]
