// Investor-specific chart templates for LP Portal

import { ChartConfig } from './lp-dashboard-storage'

export interface LPChartTemplate {
  id: string
  title: string
  description: string
  category: string
  config: Partial<ChartConfig>
  previewData?: any[]
}

export const lpChartCategories = [
  { id: 'all', label: 'All Charts', count: 0 },
  { id: 'portfolio', label: 'Portfolio', count: 0 },
  { id: 'capital', label: 'Capital', count: 0 },
  { id: 'performance', label: 'Performance', count: 0 },
  { id: 'distributions', label: 'Distributions', count: 0 },
]

export const lpChartTemplates: LPChartTemplate[] = [
  // Portfolio Charts
  {
    id: 'portfolio-value-over-time',
    title: 'Portfolio Value Over Time',
    description: 'Track your total portfolio value',
    category: 'portfolio',
    config: {
      type: 'area',
      dataSource: 'portfolio-value',
      metrics: ['value'],
      title: 'Portfolio Value Over Time',
      description: 'Your total portfolio value',
    },
  },
  {
    id: 'fund-allocation',
    title: 'Fund Allocation',
    description: 'Breakdown of your investments by fund',
    category: 'portfolio',
    config: {
      type: 'pie',
      dataSource: 'fund-allocation',
      metrics: ['allocation'],
      title: 'Fund Allocation',
      description: 'Your capital distribution across funds',
    },
  },
  {
    id: 'portfolio-composition',
    title: 'Portfolio Composition',
    description: 'Asset type breakdown',
    category: 'portfolio',
    config: {
      type: 'donut',
      dataSource: 'asset-type',
      metrics: ['value'],
      title: 'Portfolio Composition',
      description: 'Breakdown by asset type',
    },
  },

  // Capital Charts
  {
    id: 'capital-deployment',
    title: 'Capital Deployment',
    description: 'Called vs uncalled capital over time',
    category: 'capital',
    config: {
      type: 'bar',
      dataSource: 'capital-deployment',
      metrics: ['called', 'uncalled'],
      title: 'Capital Deployment',
      description: 'Called and uncalled capital by fund',
    },
  },
  {
    id: 'capital-calls-timeline',
    title: 'Capital Calls Timeline',
    description: 'Your capital call history',
    category: 'capital',
    config: {
      type: 'line',
      dataSource: 'capital-calls',
      metrics: ['amount'],
      title: 'Capital Calls Timeline',
      description: 'Historical capital calls',
    },
  },
  {
    id: 'commitment-vs-called',
    title: 'Commitment vs Called',
    description: 'Compare commitment to called capital',
    category: 'capital',
    config: {
      type: 'bar',
      dataSource: 'commitment-called',
      metrics: ['commitment', 'called'],
      title: 'Commitment vs Called Capital',
      description: 'By fund',
    },
  },

  // Performance Charts
  {
    id: 'returns-over-time',
    title: 'Returns Over Time',
    description: 'Your cumulative returns',
    category: 'performance',
    config: {
      type: 'area',
      dataSource: 'returns',
      metrics: ['return'],
      title: 'Returns Over Time',
      description: 'Cumulative portfolio returns',
    },
  },
  {
    id: 'fund-performance-comparison',
    title: 'Fund Performance Comparison',
    description: 'Compare IRR across your funds',
    category: 'performance',
    config: {
      type: 'bar',
      dataSource: 'fund-performance',
      metrics: ['irr'],
      title: 'Fund Performance Comparison',
      description: 'IRR by fund',
    },
  },
  {
    id: 'moic-by-fund',
    title: 'MOIC by Fund',
    description: 'Multiple on invested capital',
    category: 'performance',
    config: {
      type: 'bar',
      dataSource: 'moic',
      metrics: ['moic'],
      title: 'MOIC by Fund',
      description: 'Return multiple across your portfolio',
    },
  },

  // Distribution Charts
  {
    id: 'distributions-over-time',
    title: 'Distributions Over Time',
    description: 'Track distributions received',
    category: 'distributions',
    config: {
      type: 'line',
      dataSource: 'distributions',
      metrics: ['amount'],
      title: 'Distributions Over Time',
      description: 'Your distribution history',
    },
  },
  {
    id: 'distribution-breakdown',
    title: 'Distribution Breakdown',
    description: 'Distribution types (ROC, Income, Capital Gains)',
    category: 'distributions',
    config: {
      type: 'bar',
      dataSource: 'distribution-types',
      metrics: ['roc', 'income', 'capitalGain'],
      title: 'Distribution Breakdown',
      description: 'By type',
    },
  },
  {
    id: 'quarterly-distributions',
    title: 'Quarterly Distributions',
    description: 'Distributions by quarter',
    category: 'distributions',
    config: {
      type: 'bar',
      dataSource: 'quarterly-distributions',
      metrics: ['amount'],
      title: 'Quarterly Distributions',
      description: 'Distribution amounts by quarter',
    },
  },
]

// Update category counts
lpChartCategories.forEach(category => {
  if (category.id === 'all') {
    category.count = lpChartTemplates.length
  } else {
    category.count = lpChartTemplates.filter(c => c.category === category.id).length
  }
})

export function getTemplatesByCategory(categoryId: string): LPChartTemplate[] {
  if (categoryId === 'all') {
    return lpChartTemplates
  }
  return lpChartTemplates.filter(c => c.category === categoryId)
}

export function getTemplateById(templateId: string): LPChartTemplate | undefined {
  return lpChartTemplates.find(t => t.id === templateId)
}

// Data source options for custom charts
export const lpDataSourceOptions = [
  { value: 'portfolio-value', label: 'Portfolio Value' },
  { value: 'fund-allocation', label: 'Fund Allocation' },
  { value: 'capital-deployment', label: 'Capital Deployment' },
  { value: 'capital-calls', label: 'Capital Calls' },
  { value: 'distributions', label: 'Distributions' },
  { value: 'returns', label: 'Returns' },
  { value: 'fund-performance', label: 'Fund Performance' },
]

// Metrics available for each data source
export const lpMetricsByDataSource: Record<string, Array<{ value: string; label: string }>> = {
  'portfolio-value': [
    { value: 'value', label: 'Portfolio Value' },
    { value: 'committed', label: 'Committed Capital' },
    { value: 'called', label: 'Called Capital' },
  ],
  'fund-allocation': [
    { value: 'allocation', label: 'Allocation Amount' },
    { value: 'percentage', label: 'Percentage' },
  ],
  'capital-deployment': [
    { value: 'called', label: 'Called Capital' },
    { value: 'uncalled', label: 'Uncalled Capital' },
    { value: 'commitment', label: 'Total Commitment' },
  ],
  'capital-calls': [
    { value: 'amount', label: 'Call Amount' },
    { value: 'cumulative', label: 'Cumulative' },
  ],
  'distributions': [
    { value: 'amount', label: 'Distribution Amount' },
    { value: 'roc', label: 'Return of Capital' },
    { value: 'income', label: 'Income' },
    { value: 'capitalGain', label: 'Capital Gains' },
  ],
  'returns': [
    { value: 'return', label: 'Total Return' },
    { value: 'returnPercent', label: 'Return %' },
  ],
  'fund-performance': [
    { value: 'irr', label: 'IRR' },
    { value: 'moic', label: 'MOIC' },
  ],
}

export const lpChartTypeOptions = [
  { value: 'line', label: 'Line Chart' },
  { value: 'bar', label: 'Bar Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'donut', label: 'Donut Chart' },
]
