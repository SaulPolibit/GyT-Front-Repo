// Investor-specific metric calculations for LP Portal

import { getInvestorByEmail, getCurrentInvestorEmail, getInvestorStructures } from './lp-portal-helpers'
import { getCapitalCalls } from './capital-calls-storage'
import { getDistributions } from './distributions-storage'
import { calculateIRR } from './ilpa-performance-calculations'

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
      // Calculate IRR for each fund and then take weighted average
      let totalWeightedIRR = 0
      let totalWeight = 0

      filteredStructures.forEach(structure => {
        // Build cash flows for this fund
        const cashFlows: { date: string; amount: number }[] = []

        // Add capital calls (negative cash flows)
        const fundCapitalCalls = allCapitalCalls
          .filter(cc => cc.fundId === structure.id)
          .filter(cc => cc.investorAllocations.some(alloc => alloc.investorId === investor.id))

        fundCapitalCalls.forEach(cc => {
          const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
          if (allocation && allocation.amountPaid > 0) {
            cashFlows.push({
              date: cc.callDate || cc.createdAt,
              amount: -(allocation.amountPaid || 0) // Negative for outflows
            })
          }
        })

        // Add distributions (positive cash flows)
        const fundDistributions = allDistributions
          .filter(dist => dist.fundId === structure.id)
          .filter(dist => dist.investorAllocations.some(alloc => alloc.investorId === investor.id))

        fundDistributions.forEach(dist => {
          const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
          if (allocation && allocation.finalAllocation > 0) {
            cashFlows.push({
              date: dist.distributionDate,
              amount: allocation.finalAllocation || 0 // Positive for inflows
            })
          }
        })

        // Add current value as final cash flow (at today's date)
        if (structure.currentValue > 0) {
          cashFlows.push({
            date: new Date().toISOString(),
            amount: structure.currentValue
          })
        }

        // Calculate IRR for this fund
        if (cashFlows.length >= 2) {
          const fundIRR = calculateIRR(cashFlows)
          const weight = structure.calledCapital || 0
          totalWeightedIRR += fundIRR * weight
          totalWeight += weight
        }
      })

      const avgIRR = totalWeight > 0 ? totalWeightedIRR / totalWeight : 0
      const trend = avgIRR >= 10 ? 'up' : avgIRR >= 5 ? 'neutral' : 'down'

      return {
        value: `${avgIRR.toFixed(1)}%`,
        description: `Across ${filteredStructures.length} ${filteredStructures.length === 1 ? 'fund' : 'funds'}`,
        trend
      }
    }

    case 'average-moic': {
      // Calculate MOIC = (Current Value + Total Distributed) / Called Capital
      const currentValue = filteredStructures.reduce((sum, s) => sum + s.currentValue, 0)
      const calledCapital = filteredStructures.reduce((sum, s) => sum + s.calledCapital, 0)

      // Get total distributions for this investor across filtered structures
      const totalDistributed = allDistributions
        .filter(dist => filteredStructureIds.includes(dist.fundId))
        .filter(dist => dist.investorAllocations.some(alloc => alloc.investorId === investor.id))
        .reduce((sum, dist) => {
          const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
          return sum + (allocation?.finalAllocation || 0)
        }, 0)

      const moic = calledCapital > 0 ? (currentValue + totalDistributed) / calledCapital : 0
      const trend = moic >= 1.5 ? 'up' : moic >= 1.0 ? 'neutral' : 'down'

      return {
        value: `${moic.toFixed(2)}x`,
        description: 'Average multiple on invested capital',
        trend
      }
    }

    case 'ytd-return': {
      // Calculate YTD return: (Current Value + YTD Distributions - Start of Year Value) / Start of Year Value
      // Note: Without historical NAV snapshots, we estimate start of year value
      // This should be replaced with actual historical data when available
      const currentValue = filteredStructures.reduce((sum, s) => sum + s.currentValue, 0)
      const calledCapital = filteredStructures.reduce((sum, s) => sum + s.calledCapital, 0)

      // Get YTD distributions
      const currentYear = new Date().getFullYear()
      const ytdDistributions = allDistributions
        .filter(dist => filteredStructureIds.includes(dist.fundId))
        .filter(dist => new Date(dist.distributionDate).getFullYear() === currentYear)
        .filter(dist => dist.investorAllocations.some(alloc => alloc.investorId === investor.id))
        .reduce((sum, dist) => {
          const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
          return sum + (allocation?.finalAllocation || 0)
        }, 0)

      // Estimate start of year value (current - unrealized gains)
      // This is a simplification - ideally we'd have historical NAV snapshots
      const unrealizedGains = filteredStructures.reduce((sum, s) => sum + s.unrealizedGain, 0)
      const startOfYearValue = Math.max(0, currentValue - unrealizedGains)

      const ytdReturn = startOfYearValue > 0
        ? ((currentValue + ytdDistributions - startOfYearValue) / startOfYearValue) * 100
        : 0

      const trend = ytdReturn >= 5 ? 'up' : ytdReturn >= 0 ? 'neutral' : 'down'

      return {
        value: formatPercent(ytdReturn),
        description: 'Year-to-date (estimated)',
        trend
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
