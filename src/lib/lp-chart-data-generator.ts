// LP Portal chart data generation
// Generates real chart data for investor-specific visualizations

import { getInvestorByEmail, getCurrentInvestorEmail, getInvestorStructures, getInvestorCapitalCalls, getInvestorDistributions } from './lp-portal-helpers'
import { getCapitalCalls } from './capital-calls-storage'
import { getDistributions } from './distributions-storage'

export interface ChartDataPoint {
  [key: string]: string | number
}

export function generateLPChartData(dataSource: string, fundId: string = 'all'): ChartDataPoint[] {
  const email = getCurrentInvestorEmail()
  const investor = getInvestorByEmail(email)

  if (!investor) {
    return []
  }

  const structures = getInvestorStructures(investor)
  const filteredStructures = fundId === 'all' ? structures : structures.filter(s => s.id === fundId)

  switch (dataSource) {
    case 'portfolio-value':
      return generatePortfolioValueData(investor, filteredStructures)

    case 'fund-allocation':
      return generateFundAllocationData(filteredStructures)

    case 'asset-type':
      return generateAssetTypeData(filteredStructures)

    case 'capital-deployment':
      return generateCapitalDeploymentData(filteredStructures)

    case 'capital-calls':
      return generateCapitalCallsData(investor, fundId)

    case 'commitment-called':
      return generateCommitmentCalledData(filteredStructures)

    case 'returns':
      return generateReturnsData(investor, filteredStructures)

    case 'fund-performance':
      return generateFundPerformanceData(filteredStructures)

    case 'moic':
      return generateMOICData(filteredStructures)

    case 'distributions':
      return generateDistributionsData(investor, fundId)

    case 'distribution-types':
      return generateDistributionTypesData(investor, fundId)

    case 'quarterly-distributions':
      return generateQuarterlyDistributionsData(investor, fundId)

    default:
      return []
  }
}

// Portfolio Value Over Time - simulated historical data
function generatePortfolioValueData(investor: any, structures: any[]): ChartDataPoint[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth()

  // Get current total values
  const currentValue = structures.reduce((sum, s) => sum + s.currentValue, 0)
  const calledCapital = structures.reduce((sum, s) => sum + s.calledCapital, 0)
  const commitment = structures.reduce((sum, s) => sum + s.commitment, 0)

  // Generate historical data (current year)
  return months.slice(0, currentMonth + 1).map((month, index) => {
    // Simulate growth over time
    const progress = (index + 1) / (currentMonth + 1)
    const value = Math.floor(currentValue * progress)
    const called = Math.floor(calledCapital * progress)
    const committed = commitment

    return {
      month,
      value,
      called,
      committed,
    }
  })
}

// Fund Allocation - pie chart data
function generateFundAllocationData(structures: any[]): ChartDataPoint[] {
  return structures.map(structure => ({
    name: structure.name,
    allocation: structure.calledCapital,
    percentage: structures.reduce((sum, s) => sum + s.calledCapital, 0) > 0
      ? (structure.calledCapital / structures.reduce((sum, s) => sum + s.calledCapital, 0)) * 100
      : 0,
  }))
}

// Asset Type - donut chart data
function generateAssetTypeData(structures: any[]): ChartDataPoint[] {
  const typeMap: Record<string, number> = {}

  structures.forEach(structure => {
    const type = structure.type || 'Other'
    typeMap[type] = (typeMap[type] || 0) + structure.currentValue
  })

  return Object.entries(typeMap).map(([type, value]) => ({
    type,
    value,
  }))
}

// Capital Deployment - bar chart
function generateCapitalDeploymentData(structures: any[]): ChartDataPoint[] {
  return structures.map(structure => ({
    fund: structure.name.length > 20 ? structure.name.substring(0, 20) + '...' : structure.name,
    called: structure.calledCapital,
    uncalled: structure.uncalledCapital,
    commitment: structure.commitment,
  }))
}

// Capital Calls Timeline
function generateCapitalCallsData(investor: any, fundId: string): ChartDataPoint[] {
  const capitalCalls = getInvestorCapitalCalls(investor.id)
  const filteredCalls = fundId === 'all'
    ? capitalCalls
    : capitalCalls.filter(cc => cc.fundId === fundId)

  return filteredCalls.map(cc => {
    const allocation = cc.investorAllocations.find(a => a.investorId === investor.id)
    const date = new Date(cc.callDate)

    return {
      date: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      amount: allocation?.callAmount || 0,
      cumulative: 0, // Will be calculated below
    }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((item, index, arr) => ({
      ...item,
      cumulative: arr.slice(0, index + 1).reduce((sum, x) => sum + x.amount, 0),
    }))
}

// Commitment vs Called
function generateCommitmentCalledData(structures: any[]): ChartDataPoint[] {
  return structures.map(structure => ({
    fund: structure.name.length > 15 ? structure.name.substring(0, 15) + '...' : structure.name,
    commitment: structure.commitment,
    called: structure.calledCapital,
  }))
}

// Returns Over Time - simulated
function generateReturnsData(investor: any, structures: any[]): ChartDataPoint[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth()

  const currentValue = structures.reduce((sum, s) => sum + s.currentValue, 0)
  const calledCapital = structures.reduce((sum, s) => sum + s.calledCapital, 0)
  const totalDistributed = investor.totalDistributed || 0
  const totalReturn = totalDistributed + currentValue - calledCapital

  return months.slice(0, currentMonth + 1).map((month, index) => {
    const progress = (index + 1) / (currentMonth + 1)
    const returnValue = Math.floor(totalReturn * progress)
    const returnPercent = calledCapital > 0 ? (returnValue / calledCapital) * 100 : 0

    return {
      month,
      return: returnValue,
      returnPercent: parseFloat(returnPercent.toFixed(2)),
    }
  })
}

// Fund Performance Comparison - IRR placeholder
function generateFundPerformanceData(structures: any[]): ChartDataPoint[] {
  return structures.map(structure => {
    // Placeholder IRR calculation - would need actual cash flow data
    const calledCapital = structure.calledCapital
    const currentValue = structure.currentValue
    const simpleReturn = calledCapital > 0 ? ((currentValue - calledCapital) / calledCapital) * 100 : 0

    return {
      fund: structure.name.length > 15 ? structure.name.substring(0, 15) + '...' : structure.name,
      irr: parseFloat(simpleReturn.toFixed(2)),
    }
  })
}

// MOIC by Fund
function generateMOICData(structures: any[]): ChartDataPoint[] {
  return structures.map(structure => {
    const moic = structure.calledCapital > 0
      ? structure.currentValue / structure.calledCapital
      : 0

    return {
      fund: structure.name.length > 15 ? structure.name.substring(0, 15) + '...' : structure.name,
      moic: parseFloat(moic.toFixed(2)),
    }
  })
}

// Distributions Over Time
function generateDistributionsData(investor: any, fundId: string): ChartDataPoint[] {
  const distributions = getInvestorDistributions(investor.id)
  const filteredDist = fundId === 'all'
    ? distributions
    : distributions.filter(d => d.fundId === fundId)

  return filteredDist
    .filter(d => d.status === 'Completed')
    .map(dist => {
      const allocation = dist.investorAllocations.find(a => a.investorId === investor.id)
      const date = new Date(dist.distributionDate)

      return {
        date: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: allocation?.finalAllocation || 0,
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// Distribution Types Breakdown
function generateDistributionTypesData(investor: any, fundId: string): ChartDataPoint[] {
  const distributions = getInvestorDistributions(investor.id)
  const filteredDist = fundId === 'all'
    ? distributions
    : distributions.filter(d => d.fundId === fundId)

  // Aggregate by type
  const typeMap: Record<string, number> = {
    'Return of Capital': 0,
    'Income': 0,
    'Capital Gains': 0,
  }

  filteredDist
    .filter(d => d.status === 'Completed')
    .forEach(dist => {
      const allocation = dist.investorAllocations.find(a => a.investorId === investor.id)
      if (allocation) {
        // Simulate breakdown - in real implementation, this would come from distribution data
        const total = allocation.finalAllocation || 0
        typeMap['Return of Capital'] += total * 0.4
        typeMap['Income'] += total * 0.3
        typeMap['Capital Gains'] += total * 0.3
      }
    })

  return Object.entries(typeMap).map(([type, amount]) => ({
    type,
    roc: type === 'Return of Capital' ? amount : 0,
    income: type === 'Income' ? amount : 0,
    capitalGain: type === 'Capital Gains' ? amount : 0,
    amount,
  }))
}

// Quarterly Distributions
function generateQuarterlyDistributionsData(investor: any, fundId: string): ChartDataPoint[] {
  const distributions = getInvestorDistributions(investor.id)
  const filteredDist = fundId === 'all'
    ? distributions
    : distributions.filter(d => d.fundId === fundId)

  const quarterMap: Record<string, number> = {}

  filteredDist
    .filter(d => d.status === 'Completed')
    .forEach(dist => {
      const allocation = dist.investorAllocations.find(a => a.investorId === investor.id)
      const date = new Date(dist.distributionDate)
      const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`

      quarterMap[quarter] = (quarterMap[quarter] || 0) + (allocation?.finalAllocation || 0)
    })

  return Object.entries(quarterMap)
    .map(([quarter, amount]) => ({
      quarter,
      amount,
    }))
    .sort((a, b) => {
      // Sort by year and quarter
      const [qA, yearA] = a.quarter.split(' ')
      const [qB, yearB] = b.quarter.split(' ')
      return yearA === yearB
        ? qA.localeCompare(qB)
        : parseInt(yearA) - parseInt(yearB)
    })
}
