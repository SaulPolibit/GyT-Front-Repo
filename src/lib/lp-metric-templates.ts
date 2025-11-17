// Investor-specific metric templates for LP Portal

export interface LPMetricTemplate {
  id: string
  title: string
  description: string
  category: string
  format: 'currency' | 'percentage' | 'number'
  trendsUp?: boolean // true if higher is better
}

export const lpMetricCategories = [
  { id: 'all', label: 'All Metrics', count: 0 },
  { id: 'portfolio', label: 'Portfolio', count: 0 },
  { id: 'capital', label: 'Capital', count: 0 },
  { id: 'performance', label: 'Performance', count: 0 },
  { id: 'funds', label: 'Funds', count: 0 },
]

export const lpMetricTemplates: LPMetricTemplate[] = [
  // Portfolio Metrics
  {
    id: 'total-commitment',
    title: 'Total Commitment',
    description: 'Your total capital commitment across all funds',
    category: 'portfolio',
    format: 'currency',
    trendsUp: true,
  },
  {
    id: 'current-portfolio-value',
    title: 'Current Portfolio Value',
    description: 'Total current value of your investments',
    category: 'portfolio',
    format: 'currency',
    trendsUp: true,
  },
  {
    id: 'total-return',
    title: 'Total Return',
    description: 'Total return on your investments',
    category: 'portfolio',
    format: 'currency',
    trendsUp: true,
  },
  {
    id: 'total-return-percent',
    title: 'Total Return %',
    description: 'Total return as a percentage',
    category: 'portfolio',
    format: 'percentage',
    trendsUp: true,
  },
  {
    id: 'unrealized-gains',
    title: 'Unrealized Gains',
    description: 'Unrealized gains on your investments',
    category: 'portfolio',
    format: 'currency',
    trendsUp: true,
  },
  {
    id: 'total-distributed',
    title: 'Total Distributed',
    description: 'Total distributions received',
    category: 'portfolio',
    format: 'currency',
    trendsUp: true,
  },

  // Capital Metrics
  {
    id: 'called-capital',
    title: 'Called Capital',
    description: 'Total capital called by fund managers',
    category: 'capital',
    format: 'currency',
    trendsUp: false,
  },
  {
    id: 'uncalled-capital',
    title: 'Uncalled Capital',
    description: 'Remaining committed capital not yet called',
    category: 'capital',
    format: 'currency',
    trendsUp: true,
  },
  {
    id: 'deployment-rate',
    title: 'Deployment Rate',
    description: 'Percentage of committed capital that has been called',
    category: 'capital',
    format: 'percentage',
    trendsUp: false,
  },
  {
    id: 'pending-capital-calls',
    title: 'Pending Capital Calls',
    description: 'Total amount of pending capital calls',
    category: 'capital',
    format: 'currency',
    trendsUp: false,
  },
  {
    id: 'paid-capital-calls',
    title: 'Paid Capital Calls',
    description: 'Total amount of capital calls paid',
    category: 'capital',
    format: 'currency',
    trendsUp: true,
  },

  // Performance Metrics
  {
    id: 'average-fund-irr',
    title: 'Average Fund IRR',
    description: 'Average IRR across all your funds',
    category: 'performance',
    format: 'percentage',
    trendsUp: true,
  },
  {
    id: 'average-moic',
    title: 'Average MOIC',
    description: 'Average Multiple on Invested Capital',
    category: 'performance',
    format: 'number',
    trendsUp: true,
  },
  {
    id: 'ytd-return',
    title: 'YTD Return',
    description: 'Year-to-date return on investments',
    category: 'performance',
    format: 'percentage',
    trendsUp: true,
  },
  {
    id: 'distributions-ytd',
    title: 'Distributions YTD',
    description: 'Total distributions received this year',
    category: 'performance',
    format: 'currency',
    trendsUp: true,
  },

  // Fund Metrics
  {
    id: 'active-funds',
    title: 'Active Funds',
    description: 'Number of active fund investments',
    category: 'funds',
    format: 'number',
    trendsUp: true,
  },
  {
    id: 'total-funds',
    title: 'Total Funds',
    description: 'Total number of funds you\'re invested in',
    category: 'funds',
    format: 'number',
    trendsUp: true,
  },
  {
    id: 'largest-position',
    title: 'Largest Position',
    description: 'Value of your largest fund position',
    category: 'funds',
    format: 'currency',
    trendsUp: true,
  },
  {
    id: 'average-ownership',
    title: 'Average Ownership',
    description: 'Average ownership percentage across funds',
    category: 'funds',
    format: 'percentage',
    trendsUp: true,
  },
]

// Update category counts
lpMetricCategories.forEach(category => {
  if (category.id === 'all') {
    category.count = lpMetricTemplates.length
  } else {
    category.count = lpMetricTemplates.filter(m => m.category === category.id).length
  }
})

export function getMetricsByCategory(categoryId: string): LPMetricTemplate[] {
  if (categoryId === 'all') {
    return lpMetricTemplates
  }
  return lpMetricTemplates.filter(m => m.category === categoryId)
}

export function getMetricById(metricId: string): LPMetricTemplate | undefined {
  return lpMetricTemplates.find(m => m.id === metricId)
}
