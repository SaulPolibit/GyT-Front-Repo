import { IconTrendingUp, IconTrendingDown, IconWallet, IconCash, IconChartLine, IconUsers, IconBuilding, IconTable } from '@tabler/icons-react'

export interface MetricTemplate {
  id: string
  title: string
  description: string
  icon: any
  category: 'portfolio' | 'capital' | 'performance' | 'investors' | 'comparison'
  dataSource: 'investments' | 'structures' | 'investors' | 'capitalCalls' | 'distributions' | 'nav'
  calculation: string // Description of how the metric is calculated
  isComparison?: boolean // Special flag for comparison widgets
}

export const metricTemplates: MetricTemplate[] = [
  // Portfolio Metrics
  {
    id: 'total-investment-value',
    title: 'Total Investment Value',
    description: 'Sum of current values across all investments',
    icon: IconWallet,
    category: 'portfolio',
    dataSource: 'investments',
    calculation: 'SUM(investments.currentValue)',
  },
  {
    id: 'total-invested-capital',
    title: 'Total Invested Capital',
    description: 'Total capital deployed across all investments',
    icon: IconCash,
    category: 'portfolio',
    dataSource: 'investments',
    calculation: 'SUM(investments.totalInvested)',
  },
  {
    id: 'unrealized-gains',
    title: 'Unrealized Gains',
    description: 'Total unrealized gains across portfolio',
    icon: IconTrendingUp,
    category: 'portfolio',
    dataSource: 'investments',
    calculation: 'SUM(investments.currentValue - investments.totalInvested)',
  },
  {
    id: 'total-distributions',
    title: 'Total Distributions',
    description: 'Cumulative distributions to investors',
    icon: IconCash,
    category: 'capital',
    dataSource: 'distributions',
    calculation: 'SUM(distributions.amount)',
  },
  {
    id: 'average-irr',
    title: 'Average IRR',
    description: 'Portfolio-weighted average IRR',
    icon: IconChartLine,
    category: 'performance',
    dataSource: 'investments',
    calculation: 'WEIGHTED_AVG(investments.irr, investments.currentValue)',
  },
  {
    id: 'total-commitment',
    title: 'Total Commitment',
    description: 'Total LP commitments across all structures',
    icon: IconWallet,
    category: 'capital',
    dataSource: 'investors',
    calculation: 'SUM(investors.commitment)',
  },
  {
    id: 'total-called-capital',
    title: 'Total Called Capital',
    description: 'Capital called from investors',
    icon: IconCash,
    category: 'capital',
    dataSource: 'capitalCalls',
    calculation: 'SUM(capitalCalls.amount)',
  },
  {
    id: 'investor-count',
    title: 'Total Investors',
    description: 'Number of active investors',
    icon: IconUsers,
    category: 'investors',
    dataSource: 'investors',
    calculation: 'COUNT(investors WHERE status = "active")',
  },
  {
    id: 'structure-count',
    title: 'Active Structures',
    description: 'Number of active fund structures',
    icon: IconBuilding,
    category: 'portfolio',
    dataSource: 'structures',
    calculation: 'COUNT(structures WHERE status = "active")',
  },
  {
    id: 'ytd-performance',
    title: 'YTD Performance',
    description: 'Year-to-date portfolio return',
    icon: IconTrendingUp,
    category: 'performance',
    dataSource: 'nav',
    calculation: 'NAV_CHANGE_YTD(%)',
  },
  {
    id: 'nav-per-share',
    title: 'NAV per Share',
    description: 'Current NAV divided by shares outstanding',
    icon: IconChartLine,
    category: 'performance',
    dataSource: 'nav',
    calculation: 'NAV / totalShares',
  },
  {
    id: 'uncalled-capital',
    title: 'Uncalled Capital',
    description: 'Remaining committed capital not yet called',
    icon: IconWallet,
    category: 'capital',
    dataSource: 'investors',
    calculation: 'SUM(investors.commitment - investors.calledCapital)',
  },
  // Comparison Metric
  {
    id: 'all-structures-comparison',
    title: 'All Structures Comparison',
    description: 'Compare key metrics across all fund structures',
    icon: IconTable,
    category: 'comparison',
    dataSource: 'structures',
    calculation: 'COMPARE_ALL(structures)',
    isComparison: true,
  },
]

export const metricCategories = [
  { id: 'all', name: 'All Metrics', count: metricTemplates.length },
  { id: 'portfolio', name: 'Portfolio', count: metricTemplates.filter(m => m.category === 'portfolio').length },
  { id: 'capital', name: 'Capital', count: metricTemplates.filter(m => m.category === 'capital').length },
  { id: 'performance', name: 'Performance', count: metricTemplates.filter(m => m.category === 'performance').length },
  { id: 'investors', name: 'Investors', count: metricTemplates.filter(m => m.category === 'investors').length },
  { id: 'comparison', name: 'Comparison', count: metricTemplates.filter(m => m.category === 'comparison').length },
]

export function getMetricsByCategory(category: string): MetricTemplate[] {
  if (category === 'all') {
    return metricTemplates
  }
  return metricTemplates.filter(m => m.category === category)
}

export function getMetricById(id: string): MetricTemplate | undefined {
  return metricTemplates.find(m => m.id === id)
}
