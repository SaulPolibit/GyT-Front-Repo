// Investor-specific metric calculations for LP Portal

import { getInvestorByEmail, getCurrentInvestorEmail, getInvestorStructures } from './lp-portal-helpers'
import { getCapitalCalls } from './capital-calls-storage'
import { getDistributions } from './distributions-storage'

export interface CalculatedMetric {
  value: string
  description?: string
  badge?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function calculateLPMetric(metricId: string, fundId: string = 'all'): CalculatedMetric {
  const email = getCurrentInvestorEmail()
  const investor = getInvestorByEmail(email)

  if (!investor) {
    return { value: '$0', description: '', badge: '', trend: 'neutral' }
  }

  const structures = getInvestorStructures(investor)
  const filteredStructures = fundId === 'all' ? structures : structures.filter(s => s.id === fundId)

  const allCapitalCalls = getCapitalCalls()
  const allDistributions = getDistributions()

  const investorStructureIds = investor.fundOwnerships.map(fo => fo.fundId)
  const filteredStructureIds = fundId === 'all' ? investorStructureIds : [fundId]

  switch (metricId) {
    // Portfolio Metrics
    case 'total-commitment': {
      const total = filteredStructures.reduce((sum, s) => sum + s.commitment, 0)
      return {
        value: formatCurrency(total),
        description: `Across ${filteredStructures.length} ${filteredStructures.length === 1 ? 'fund' : 'funds'}`,
        trend: 'neutral'
      }
    }

    case 'current-portfolio-value': {
      const total = filteredStructures.reduce((sum, s) => sum + s.currentValue, 0)
      const called = filteredStructures.reduce((sum, s) => sum + s.calledCapital, 0)
      return {
        value: formatCurrency(total),
        description: `${formatCurrency(called)} called capital`,
        trend: 'up'
      }
    }

    case 'total-return': {
      const currentValue = filteredStructures.reduce((sum, s) => sum + s.currentValue, 0)
      const calledCapital = filteredStructures.reduce((sum, s) => sum + s.calledCapital, 0)
      const totalDistributed = allDistributions
        .filter(dist => filteredStructureIds.includes(dist.fundId))
        .filter(dist => dist.investorAllocations.some(alloc => alloc.investorId === investor.id))
        .reduce((sum, dist) => {
          const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
          return sum + (allocation?.finalAllocation || 0)
        }, 0)
      const totalReturn = totalDistributed + currentValue - calledCapital
      const returnPercent = calledCapital > 0 ? (totalReturn / calledCapital) * 100 : 0
      return {
        value: formatCurrency(totalReturn),
        badge: formatPercent(returnPercent),
        trend: totalReturn >= 0 ? 'up' : 'down'
      }
    }

    case 'total-return-percent': {
      const currentValue = filteredStructures.reduce((sum, s) => sum + s.currentValue, 0)
      const calledCapital = filteredStructures.reduce((sum, s) => sum + s.calledCapital, 0)
      const totalDistributed = allDistributions
        .filter(dist => filteredStructureIds.includes(dist.fundId))
        .filter(dist => dist.investorAllocations.some(alloc => alloc.investorId === investor.id))
        .reduce((sum, dist) => {
          const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
          return sum + (allocation?.finalAllocation || 0)
        }, 0)
      const totalReturn = totalDistributed + currentValue - calledCapital
      const returnPercent = calledCapital > 0 ? (totalReturn / calledCapital) * 100 : 0
      return {
        value: formatPercent(returnPercent),
        description: formatCurrency(totalReturn),
        trend: returnPercent >= 0 ? 'up' : 'down'
      }
    }

    case 'unrealized-gains': {
      const total = filteredStructures.reduce((sum, s) => sum + s.unrealizedGain, 0)
      return {
        value: formatCurrency(total),
        trend: total >= 0 ? 'up' : 'down'
      }
    }

    case 'total-distributed': {
      const total = allDistributions
        .filter(dist => filteredStructureIds.includes(dist.fundId))
        .filter(dist => dist.investorAllocations.some(alloc => alloc.investorId === investor.id))
        .reduce((sum, dist) => {
          const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
          return sum + (allocation?.finalAllocation || 0)
        }, 0)

      return {
        value: formatCurrency(total),
        description: 'Lifetime distributions',
        trend: 'up'
      }
    }

    // Capital Metrics
    case 'called-capital': {
      const total = filteredStructures.reduce((sum, s) => sum + s.calledCapital, 0)
      const commitment = filteredStructures.reduce((sum, s) => sum + s.commitment, 0)
      const percent = commitment > 0 ? (total / commitment) * 100 : 0
      return {
        value: formatCurrency(total),
        badge: `${percent.toFixed(1)}% of commitment`,
        trend: 'neutral'
      }
    }

    case 'uncalled-capital': {
      // Calculate as commitment minus called capital
      const commitment = filteredStructures.reduce((sum, s) => sum + s.commitment, 0)
      const called = filteredStructures.reduce((sum, s) => sum + s.calledCapital, 0)
      const total = commitment - called
      return {
        value: formatCurrency(total),
        description: 'Available for future calls',
        trend: 'neutral'
      }
    }

    case 'deployment-rate': {
      const called = filteredStructures.reduce((sum, s) => sum + s.calledCapital, 0)
      const commitment = filteredStructures.reduce((sum, s) => sum + s.commitment, 0)
      const rate = commitment > 0 ? (called / commitment) * 100 : 0
      return {
        value: `${rate.toFixed(1)}%`,
        description: `${formatCurrency(called)} called of ${formatCurrency(commitment)}`,
        trend: 'neutral'
      }
    }

    case 'pending-capital-calls': {
      const pendingCalls = allCapitalCalls
        .filter(cc => filteredStructureIds.includes(cc.fundId))
        .filter(cc => cc.investorAllocations.some(alloc =>
          alloc.investorId === investor.id &&
          (alloc.status === 'Pending' || alloc.status === 'Sent')
        ))

      const total = pendingCalls.reduce((sum, cc) => {
        const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
        return sum + (allocation?.amountOutstanding || 0)
      }, 0)

      return {
        value: formatCurrency(total),
        badge: `${pendingCalls.length} ${pendingCalls.length === 1 ? 'call' : 'calls'}`,
        trend: 'neutral'
      }
    }

    case 'paid-capital-calls': {
      const paidCalls = allCapitalCalls
        .filter(cc => filteredStructureIds.includes(cc.fundId))
        .filter(cc => cc.investorAllocations.some(alloc =>
          alloc.investorId === investor.id &&
          alloc.status === 'Paid'
        ))

      const total = paidCalls.reduce((sum, cc) => {
        const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
        return sum + (allocation?.amountPaid || 0)
      }, 0)

      return {
        value: formatCurrency(total),
        badge: `${paidCalls.length} ${paidCalls.length === 1 ? 'call' : 'calls'}`,
        trend: 'up'
      }
    }

    // Performance Metrics
    case 'average-fund-irr': {
      // Placeholder - would need actual IRR calculation
      return {
        value: '12.5%',
        description: 'Across all funds',
        trend: 'up'
      }
    }

    case 'average-moic': {
      // Placeholder - would need actual MOIC calculation
      return {
        value: '1.5x',
        description: 'Average multiple',
        trend: 'up'
      }
    }

    case 'ytd-return': {
      // Placeholder - would need YTD calculation
      return {
        value: '8.2%',
        description: 'Year-to-date',
        trend: 'up'
      }
    }

    case 'distributions-ytd': {
      const currentYear = new Date().getFullYear()
      const ytdDistributions = allDistributions
        .filter(dist => filteredStructureIds.includes(dist.fundId))
        .filter(dist => new Date(dist.distributionDate).getFullYear() === currentYear)
        .filter(dist => dist.investorAllocations.some(alloc => alloc.investorId === investor.id))

      const total = ytdDistributions.reduce((sum, dist) => {
        const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
        return sum + (allocation?.finalAllocation || 0)
      }, 0)

      return {
        value: formatCurrency(total),
        badge: `${ytdDistributions.length} ${ytdDistributions.length === 1 ? 'distribution' : 'distributions'}`,
        trend: 'up'
      }
    }

    // Fund Metrics
    case 'active-funds': {
      const activeFunds = filteredStructures.length
      return {
        value: activeFunds.toString(),
        description: 'Active investments',
        trend: 'neutral'
      }
    }

    case 'total-funds': {
      const totalFunds = investor.fundOwnerships.length
      return {
        value: totalFunds.toString(),
        description: 'Total fund relationships',
        trend: 'neutral'
      }
    }

    case 'largest-position': {
      if (filteredStructures.length === 0) {
        return { value: '$0', trend: 'neutral' }
      }
      const largest = filteredStructures.reduce((max, s) =>
        s.currentValue > max.currentValue ? s : max
      )
      return {
        value: formatCurrency(largest.currentValue),
        description: largest.name,
        trend: 'up'
      }
    }

    case 'average-ownership': {
      if (filteredStructures.length === 0) {
        return { value: '0%', trend: 'neutral' }
      }
      const avgOwnership = filteredStructures.reduce((sum, s) => sum + s.ownershipPercent, 0) / filteredStructures.length
      return {
        value: `${avgOwnership.toFixed(2)}%`,
        description: 'Average across funds',
        trend: 'neutral'
      }
    }

    default:
      return {
        value: '$0',
        description: '',
        badge: '',
        trend: 'neutral'
      }
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}
