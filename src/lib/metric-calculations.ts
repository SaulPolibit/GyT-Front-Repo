import { getStructures } from './structures-storage'
import { getInvestments } from './investments-storage'
import { getInvestors } from './investors-storage'
import { getCapitalCalls } from './capital-calls-storage'
import { getDistributions } from './distributions-storage'

export interface CalculatedMetric {
  value: string
  badge?: string
  trend?: 'up' | 'down' | 'neutral'
  description?: string
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
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function calculateMetric(metricId: string, structureId?: string): CalculatedMetric {
  const structures = getStructures()
  const allInvestments = getInvestments()
  const allInvestors = getInvestors()
  const allCapitalCalls = getCapitalCalls()
  const allDistributions = getDistributions()

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
        return sum + (inv.totalFundPosition?.currentValue || 0)
      }, 0)

      const weightedIRR = investments.reduce((sum, inv) => {
        const weight = (inv.totalFundPosition?.currentValue || 0) / totalValue
        const irr = inv.totalFundPosition?.irr || 0
        return sum + (irr * weight)
      }, 0)

      return {
        value: formatPercentage(weightedIRR),
        badge: 'Portfolio',
        trend: weightedIRR >= 10 ? 'up' : weightedIRR >= 5 ? 'neutral' : 'down',
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

    default:
      return {
        value: '$0',
        description: 'No data',
      }
  }
}
