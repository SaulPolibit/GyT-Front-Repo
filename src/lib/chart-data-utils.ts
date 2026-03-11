import { calculateValueAtDate } from '@/lib/investment-calculations'
import type { DashboardData } from '@/lib/metric-calculations'

// Generate real data from dashboardData for different data sources
export const generateChartData = (dataSource: string, metrics: string[], dashboardData?: DashboardData, structureId?: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const allInvestments = dashboardData?.investments ?? []
  const allInvestors = dashboardData?.investors ?? []
  const allCapitalCalls = dashboardData?.capitalCalls ?? []
  const allDistributions = dashboardData?.distributions ?? []

  // Filter by structure if specified
  const investments = structureId && structureId !== 'all'
    ? allInvestments.filter(inv => inv.fundId === structureId)
    : allInvestments
  const investors = structureId && structureId !== 'all'
    ? allInvestors.filter(inv => inv.fundOwnerships?.some((fo: any) => fo.fundId === structureId))
    : allInvestors
  const capitalCalls = structureId && structureId !== 'all'
    ? allCapitalCalls.filter(cc => cc.fundId === structureId)
    : allCapitalCalls
  const distributions = structureId && structureId !== 'all'
    ? allDistributions.filter(d => d.fundId === structureId)
    : allDistributions

  const now = new Date()
  const currentYear = now.getFullYear()

  switch (dataSource) {
    case 'nav': {
      if (investments.length === 0) return []
      return months.map((month, i) => {
        const date = new Date(currentYear, i, 15)
        if (date > now) return null
        const dateStr = date.toISOString().split('T')[0]
        const totalValue = investments.reduce((sum, inv) => {
          if (new Date(inv.acquisitionDate) > date) return sum
          try { return sum + calculateValueAtDate(inv, dateStr) }
          catch { return sum + (inv.totalFundPosition?.currentValue || 0) }
        }, 0)
        const totalInvested = investments
          .filter(inv => new Date(inv.acquisitionDate) <= date)
          .reduce((sum, inv) => sum + (inv.totalFundPosition?.totalInvested || 0), 0)
        const shares = (dashboardData?.structures ?? []).reduce(
          (sum, s) => sum + (s.totalSharesOutstanding || s.tokenSupply || 100000), 0
        ) || 100000
        return {
          month,
          totalValue: Math.round(totalValue),
          unrealizedGain: Math.round(totalValue - totalInvested),
          navPerShare: Math.round((totalValue / shares) * 100) / 100,
        }
      }).filter(Boolean)
    }

    case 'investments': {
      if (investments.length === 0) return []
      if (metrics.includes('realEstate') || metrics.includes('privateEquity') || metrics.includes('privateDebt')) {
        const groups: Record<string, number> = {}
        investments.forEach(inv => {
          const type = inv.type || 'Other'
          groups[type] = (groups[type] || 0) + (inv.totalFundPosition?.currentValue || 0)
        })
        const total = Object.values(groups).reduce((a, b) => a + b, 0)
        return Object.entries(groups).map(([name, value]) => ({
          name,
          value: Math.round(value),
          percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        }))
      }
      return months.map((month, i) => {
        const date = new Date(currentYear, i, 15)
        if (date > now) return null
        const dateStr = date.toISOString().split('T')[0]
        const activeInvs = investments.filter(inv => new Date(inv.acquisitionDate) <= date)
        const currentValue = activeInvs.reduce((sum, inv) => {
          try { return sum + calculateValueAtDate(inv, dateStr) }
          catch { return sum + (inv.totalFundPosition?.currentValue || 0) }
        }, 0)
        const totalInvested = activeInvs.reduce((sum, inv) => sum + (inv.totalFundPosition?.totalInvested || 0), 0)
        const avgIrr = activeInvs.length > 0
          ? activeInvs.reduce((sum, inv) => sum + (inv.totalFundPosition?.irr || 0), 0) / activeInvs.length
          : 0
        return {
          month,
          currentValue: Math.round(currentValue),
          totalInvested: Math.round(totalInvested),
          irr: Math.round(avgIrr * 10) / 10,
          multiple: totalInvested > 0 ? Math.round((currentValue / totalInvested) * 100) / 100 : 0,
          unrealizedGain: Math.round(currentValue - totalInvested),
        }
      }).filter(Boolean)
    }

    case 'investors': {
      if (investors.length === 0) return []
      const totalCommitment = investors.reduce((sum, inv) =>
        sum + (inv.fundOwnerships || []).reduce((s: number, fo: any) => s + (fo.commitment || 0), 0), 0
      )
      // Build cumulative called/distributed per month
      return months.map((month, i) => {
        const endDate = new Date(currentYear, i + 1, 0)
        if (endDate > now) return null
        const contributed = capitalCalls
          .filter(cc => cc.status !== 'Draft' && cc.status !== 'Cancelled' && new Date(cc.callDate || cc.createdAt) <= endDate)
          .reduce((sum, cc) => sum + (cc.investorAllocations || []).reduce(
            (s: number, a: any) => s + (a.amountPaid || 0), 0
          ), 0)
        const distributed = distributions
          .filter(d => d.status === 'Completed' && new Date(d.distributionDate || d.createdAt) <= endDate)
          .reduce((sum, d) => sum + (d.totalAmount || (d.investorAllocations || []).reduce(
            (s: number, a: any) => s + (a.finalAllocation || 0), 0
          )), 0)
        return {
          month,
          commitment: totalCommitment,
          contributed: Math.round(contributed),
          distributed: Math.round(distributed),
          irr: contributed > 0 ? Math.round(((distributed / contributed) * 100) * 10) / 10 : 0,
        }
      }).filter(Boolean)
    }

    case 'capitalCalls': {
      if (capitalCalls.length === 0) return []
      const totalCommitment = investors.reduce((sum, inv) =>
        sum + (inv.fundOwnerships || []).reduce((s: number, fo: any) => s + (fo.commitment || 0), 0), 0
      )
      return months.map((month, i) => {
        const startDate = new Date(currentYear, i, 1)
        const endDate = new Date(currentYear, i + 1, 0)
        if (startDate > now) return null
        const monthlyCalled = capitalCalls
          .filter(cc => {
            const d = new Date(cc.callDate || cc.createdAt)
            return cc.status !== 'Draft' && cc.status !== 'Cancelled' && d >= startDate && d <= endDate
          })
          .reduce((sum, cc) => sum + (cc.investorAllocations || []).reduce(
            (s: number, a: any) => s + (a.amountPaid || 0), 0
          ), 0)
        const cumulativeCalled = capitalCalls
          .filter(cc => cc.status !== 'Draft' && cc.status !== 'Cancelled' && new Date(cc.callDate || cc.createdAt) <= endDate)
          .reduce((sum, cc) => sum + (cc.investorAllocations || []).reduce(
            (s: number, a: any) => s + (a.amountPaid || 0), 0
          ), 0)
        return {
          month,
          called: Math.round(monthlyCalled),
          uncalled: Math.round(Math.max(0, totalCommitment - cumulativeCalled)),
        }
      }).filter(Boolean)
    }

    case 'distributions': {
      if (distributions.length === 0) return []
      let cumulative = 0
      return months.map((month, i) => {
        const startDate = new Date(currentYear, i, 1)
        const endDate = new Date(currentYear, i + 1, 0)
        if (startDate > now) return null
        const monthlyAmount = distributions
          .filter(d => {
            const dd = new Date(d.distributionDate || d.createdAt)
            return d.status === 'Completed' && dd >= startDate && dd <= endDate
          })
          .reduce((sum, d) => sum + (d.totalAmount || (d.investorAllocations || []).reduce(
            (s: number, a: any) => s + (a.finalAllocation || 0), 0
          )), 0)
        cumulative += monthlyAmount
        return {
          month,
          amount: Math.round(monthlyAmount),
          cumulative: Math.round(cumulative),
        }
      }).filter(Boolean)
    }

    case 'performance': {
      if (investments.length === 0) return []
      const totalDistributed = distributions
        .filter(d => d.status === 'Completed')
        .reduce((sum, d) => sum + (d.totalAmount || 0), 0)
      return months.map((month, i) => {
        const date = new Date(currentYear, i, 15)
        if (date > now) return null
        const dateStr = date.toISOString().split('T')[0]
        const activeInvs = investments.filter(inv => new Date(inv.acquisitionDate) <= date)
        const totalValue = activeInvs.reduce((sum, inv) => {
          try { return sum + calculateValueAtDate(inv, dateStr) }
          catch { return sum + (inv.totalFundPosition?.currentValue || 0) }
        }, 0)
        const totalInvested = activeInvs.reduce((sum, inv) => sum + (inv.totalFundPosition?.totalInvested || 0), 0)
        const multiple = totalInvested > 0 ? totalValue / totalInvested : 0
        const dpi = totalInvested > 0 ? totalDistributed / totalInvested : 0
        const tvpi = totalInvested > 0 ? (totalValue + totalDistributed) / totalInvested : 0
        const rvpi = totalInvested > 0 ? totalValue / totalInvested : 0
        const avgIrr = activeInvs.length > 0
          ? activeInvs.reduce((sum, inv) => sum + (inv.totalFundPosition?.irr || 0), 0) / activeInvs.length
          : 0
        return {
          month,
          irr: Math.round(avgIrr * 10) / 10,
          multiple: Math.round(multiple * 100) / 100,
          dpi: Math.round(dpi * 100) / 100,
          tvpi: Math.round(tvpi * 100) / 100,
          rvpi: Math.round(rvpi * 100) / 100,
        }
      }).filter(Boolean)
    }

    default:
      return []
  }
}
