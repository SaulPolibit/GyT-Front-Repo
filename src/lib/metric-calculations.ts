export interface CalculatedMetric {
  value: string
  badge?: string
  trend?: 'up' | 'down' | 'neutral'
  description?: string
}

export interface DashboardData {
  structures?: any[]
  investments?: any[]
  investors?: any[]
  capitalCalls?: any[]
  distributions?: any[]
  payments?: any[]
}

// Helper to format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Helper to format percentage
function formatPercentage(value: number): string {
  // Handle NaN, Infinity, and other invalid numbers
  if (!isFinite(value)) {
    value = 0
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function calculateMetric(metricId: string, structureId?: string, dashboardData?: DashboardData): CalculatedMetric {
  // Use provided data from API - no localStorage fallback
  const structures = dashboardData?.structures ?? []
  const allInvestments = dashboardData?.investments ?? []
  const allInvestors = dashboardData?.investors ?? []
  const allCapitalCalls = dashboardData?.capitalCalls ?? []
  const allDistributions = dashboardData?.distributions ?? []
  const allPayments = dashboardData?.payments ?? []

  // Filter by structure if specified
  const investments = structureId && structureId !== 'all'
    ? allInvestments.filter(inv => inv.fundId === structureId)
    : allInvestments

  const investors = structureId && structureId !== 'all'
    ? allInvestors.filter(investor =>
        investor.fundOwnerships?.some(fo => fo.fundId === structureId)
      )
    : allInvestors

  const capitalCalls = structureId && structureId !== 'all'
    ? allCapitalCalls.filter(cc => cc.fundId === structureId)
    : allCapitalCalls

  const distributions = structureId && structureId !== 'all'
    ? allDistributions.filter(dist => dist.fundId === structureId)
    : allDistributions

  const payments = structureId && structureId !== 'all'
    ? allPayments.filter(payment => payment.structureId === structureId)
    : allPayments

  switch (metricId) {
    case 'total-investment-value': {
      const total = investments.reduce((sum, inv) => {
        return sum + (inv.totalFundPosition?.currentValue || 0)
      }, 0)
      const gain = investments.reduce((sum, inv) => {
        return sum + (inv.totalFundPosition?.unrealizedGain || 0)
      }, 0)
      const gainPercent = total > 0 ? (gain / (total - gain)) * 100 : 0

      return {
        value: formatCurrency(total),
        badge: formatPercentage(gainPercent),
        trend: gainPercent >= 0 ? 'up' : 'down',
        description: 'Current portfolio value',
      }
    }

    case 'total-invested-capital': {
      const total = investments.reduce((sum, inv) => {
        return sum + (inv.totalFundPosition?.totalInvested || 0)
      }, 0)

      return {
        value: formatCurrency(total),
        badge: 'Initial',
        trend: 'neutral',
        description: 'Original investment amount',
      }
    }

    case 'unrealized-gains': {
      // Calculate total called capital from capital calls
      const totalCalled = capitalCalls
        .filter(cc => cc.status !== 'Draft' && cc.status !== 'Cancelled')
        .reduce((sum, cc) => {
          const ccTotal = cc.investorAllocations.reduce((allocSum, alloc) => {
            return allocSum + (alloc.amountPaid || 0)
          }, 0)
          return sum + ccTotal
        }, 0)

      // Calculate current portfolio value based on structures' NAV
      const currentValue = investors.reduce((sum, investor) => {
        return sum + (investor.fundOwnerships || []).reduce((foSum, ownership) => {
          const structure = structures.find(s => s.id === ownership.fundId)
          if (!structure) return foSum

          // Calculate investor's called capital for this fund
          const fundCapitalCalls = capitalCalls.filter(cc =>
            cc.fundId === ownership.fundId &&
            cc.status !== 'Draft' &&
            cc.status !== 'Cancelled'
          )

          const calledCapital = fundCapitalCalls.reduce((callSum, cc) => {
            const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
            return callSum + (allocation?.amountPaid || 0)
          }, 0)

          // Calculate ownership based on called capital / total fund size
          const ownershipPercent = structure.totalCommitment > 0
            ? (calledCapital / structure.totalCommitment) * 100
            : 0

          // Use NAV if available, otherwise fall back to totalCommitment
          const baseValue = structure.currentNav ?? structure.totalCommitment
          const investorValue = baseValue * (ownershipPercent / 100)

          return foSum + investorValue
        }, 0)
      }, 0)

      const gains = currentValue - totalCalled
      const gainPercent = totalCalled > 0 ? (gains / totalCalled) * 100 : 0

      return {
        value: formatCurrency(gains),
        badge: formatPercentage(gainPercent),
        trend: gains >= 0 ? 'up' : 'down',
        description: 'Unrealized portfolio gains',
      }
    }

    case 'total-distributions': {
      // Calculate from actual distribution transactions
      const total = distributions
        .filter(dist => dist.status === 'Completed')
        .reduce((sum, dist) => {
          const distTotal = dist.investorAllocations.reduce((allocSum, alloc) => {
            return allocSum + (alloc.finalAllocation || 0)
          }, 0)
          return sum + distTotal
        }, 0)

      return {
        value: formatCurrency(total),
        badge: 'Lifetime',
        trend: 'neutral',
        description: 'Total cash flow distributed',
      }
    }

    case 'average-irr': {
      const totalValue = investments.reduce((sum, inv) => {
        const value = inv.totalFundPosition?.currentValue || 0
        return sum + (isNaN(value) ? 0 : value)
      }, 0)

      const weightedIRR = investments.reduce((sum, inv) => {
        if (totalValue === 0) return sum
        const currentValue = inv.totalFundPosition?.currentValue || 0
        const weight = (isNaN(currentValue) ? 0 : currentValue) / totalValue
        const irr = inv.totalFundPosition?.irr || 0
        const validIrr = isNaN(irr) ? 0 : irr
        return sum + (validIrr * weight)
      }, 0)

      // Explicitly check for NaN before using the value
      const finalIRR = isNaN(weightedIRR) ? 0 : weightedIRR

      return {
        value: formatPercentage(finalIRR),
        badge: 'Portfolio',
        trend: finalIRR >= 10 ? 'up' : finalIRR >= 5 ? 'neutral' : 'down',
        description: `Across ${investments.length} investments`,
      }
    }

    case 'total-commitment': {
      const total = investors.reduce((sum, investor) => {
        const fundOwnerships = investor.fundOwnerships || []
        return sum + fundOwnerships.reduce((foSum, fo) => foSum + (fo.commitment || 0), 0)
      }, 0)

      return {
        value: formatCurrency(total),
        description: 'Total commitment',
      }
    }

    case 'total-called-capital': {
      // Calculate from actual capital call transactions
      const total = capitalCalls
        .filter(cc => cc.status !== 'Draft' && cc.status !== 'Cancelled')
        .reduce((sum, cc) => {
          const ccTotal = cc.investorAllocations.reduce((allocSum, alloc) => {
            return allocSum + (alloc.amountPaid || 0)
          }, 0)
          return sum + ccTotal
        }, 0)

      const totalCommitment = investors.reduce((sum, investor) => {
        const fundOwnerships = investor.fundOwnerships || []
        return sum + fundOwnerships.reduce((foSum, fo) => foSum + (fo.commitment || 0), 0)
      }, 0)

      const percentage = totalCommitment > 0 ? (total / totalCommitment) * 100 : 0

      return {
        value: formatCurrency(total),
        badge: `${percentage.toFixed(0)}%`,
        trend: 'neutral',
        description: 'Of total commitment',
      }
    }

    case 'investor-count': {
      const count = investors.length

      return {
        value: count.toString(),
        description: 'Active investors',
      }
    }

    case 'structure-count': {
      const count = structures.filter(s => s.status === 'active' || s.status === 'fundraising').length

      return {
        value: count.toString(),
        description: 'Active structures',
      }
    }

    case 'ytd-performance': {
      // Mock YTD calculation - would need historical NAV data
      const ytdReturn = 1.10

      return {
        value: formatPercentage(ytdReturn),
        trend: 'up',
        description: 'Year-to-date return',
      }
    }

    case 'nav-per-share': {
      // Mock calculation
      return {
        value: '$53',
        badge: '+1.10%',
        trend: 'up',
        description: 'NAV per share',
      }
    }

    case 'uncalled-capital': {
      const totalCommitment = investors.reduce((sum, investor) => {
        const fundOwnerships = investor.fundOwnerships || []
        return sum + fundOwnerships.reduce((foSum, fo) => foSum + (fo.commitment || 0), 0)
      }, 0)

      // Calculate actual called capital from capital calls
      const called = capitalCalls
        .filter(cc => cc.status !== 'Draft' && cc.status !== 'Cancelled')
        .reduce((sum, cc) => {
          const ccTotal = cc.investorAllocations.reduce((allocSum, alloc) => {
            return allocSum + (alloc.amountPaid || 0)
          }, 0)
          return sum + ccTotal
        }, 0)

      const uncalled = totalCommitment - called
      const uncalledPercent = totalCommitment > 0 ? (uncalled / totalCommitment) * 100 : 0

      return {
        value: formatCurrency(uncalled),
        badge: `${uncalledPercent.toFixed(0)}%`,
        trend: 'neutral',
        description: 'Remaining commitment',
      }
    }

    // Marketplace Metrics
    case 'total-marketplace-investments': {
      const approvedPayments = payments.filter(p => p.status === 'approved')
      const total = approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const count = approvedPayments.length

      return {
        value: formatCurrency(total),
        badge: `${count} txns`,
        trend: 'up',
        description: 'Approved marketplace investments',
      }
    }

    case 'pending-investments': {
      const pendingPayments = payments.filter(p => p.status === 'pending')
      const total = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const count = pendingPayments.length

      return {
        value: formatCurrency(total),
        badge: `${count} pending`,
        trend: count > 0 ? 'neutral' : 'up',
        description: 'Awaiting approval',
      }
    }

    case 'marketplace-investors': {
      const approvedPayments = payments.filter(p => p.status === 'approved')
      const uniqueInvestors = new Set(approvedPayments.map(p => p.userId).filter(Boolean))
      const count = uniqueInvestors.size

      return {
        value: count.toString(),
        description: 'Unique marketplace investors',
      }
    }

    case 'tokens-issued': {
      const approvedPayments = payments.filter(p => p.status === 'approved')
      const total = approvedPayments.reduce((sum, p) => sum + (p.tokens || 0), 0)

      return {
        value: total.toLocaleString(),
        badge: 'Tokens',
        trend: 'up',
        description: 'Total tokens minted',
      }
    }

    default:
      return {
        value: '$0',
        description: 'No data',
      }
  }
}
