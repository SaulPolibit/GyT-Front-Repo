import type { Distribution, DistributionStatus, DistributionSource } from './types'

const STORAGE_KEY = 'polibit_distributions'

// Get all distributions from localStorage
export function getDistributions(): Distribution[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading distributions:', error)
    return []
  }
}

// Save a new distribution
export function saveDistribution(distribution: Omit<Distribution, 'id' | 'createdAt' | 'updatedAt'>): Distribution {
  const distributions = getDistributions()

  const now = new Date().toISOString()
  const newId = `dist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  // Ensure ID is unique
  let finalId = newId
  while (distributions.some(d => d.id === finalId)) {
    finalId = `dist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  const newDistribution: Distribution = {
    ...distribution,
    id: finalId,
    createdAt: now,
    updatedAt: now,
  }

  distributions.push(newDistribution)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(distributions))
  } catch (error) {
    console.error('Error saving distribution:', error)
    throw error
  }

  return newDistribution
}

// Update an existing distribution
export function updateDistribution(id: string, updates: Partial<Distribution>): Distribution | null {
  const distributions = getDistributions()
  const index = distributions.findIndex(d => d.id === id)

  if (index === -1) return null

  distributions[index] = {
    ...distributions[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(distributions))
  } catch (error) {
    console.error('Error updating distribution:', error)
    throw error
  }

  return distributions[index]
}

// Delete a distribution
export function deleteDistribution(id: string): boolean {
  const distributions = getDistributions()
  const filtered = distributions.filter(d => d.id !== id)

  if (filtered.length === distributions.length) return false

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting distribution:', error)
    throw error
  }
}

// Get a single distribution by ID
export function getDistributionById(id: string): Distribution | null {
  const distributions = getDistributions()
  return distributions.find(d => d.id === id) || null
}

// Get distributions by fund ID
export function getDistributionsByFundId(fundId: string): Distribution[] {
  const distributions = getDistributions()
  return distributions.filter(d => d.fundId === fundId)
}

// Get distributions by status
export function getDistributionsByStatus(status: DistributionStatus): Distribution[] {
  const distributions = getDistributions()
  return distributions.filter(d => d.status === status)
}

// Get distributions by source
export function getDistributionsBySource(source: DistributionSource): Distribution[] {
  const distributions = getDistributions()
  return distributions.filter(d => d.source === source)
}

// Get next distribution number for a fund
export function getNextDistributionNumber(fundId: string): number {
  const fundDistributions = getDistributionsByFundId(fundId)
  if (fundDistributions.length === 0) return 1

  const maxDistNumber = Math.max(...fundDistributions.map(d => d.distributionNumber))
  return maxDistNumber + 1
}

// Update payment status for an investor allocation
export function updateInvestorDistribution(
  distributionId: string,
  investorId: string,
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed',
  paymentDetails?: {
    paymentMethod?: string
    transactionReference?: string
    bankDetails?: string
  }
): Distribution | null {
  const distribution = getDistributionById(distributionId)
  if (!distribution) return null

  const allocationIndex = distribution.investorAllocations.findIndex(
    alloc => alloc.investorId === investorId
  )

  if (allocationIndex === -1) return null

  distribution.investorAllocations[allocationIndex] = {
    ...distribution.investorAllocations[allocationIndex],
    status,
    processedDate: status === 'Completed' ? new Date().toISOString() : undefined,
    ...paymentDetails
  }

  // Update distribution status if all allocations are completed
  const allCompleted = distribution.investorAllocations.every(alloc => alloc.status === 'Completed')
  const anyProcessing = distribution.investorAllocations.some(alloc => alloc.status === 'Processing')

  let newStatus: DistributionStatus = distribution.status
  if (allCompleted) {
    newStatus = 'Completed'
  } else if (anyProcessing) {
    newStatus = 'Processing'
  }

  return updateDistribution(distributionId, {
    investorAllocations: distribution.investorAllocations,
    status: newStatus,
    processedDate: allCompleted ? new Date().toISOString() : undefined
  })
}

// Mark distribution as processing
export function markDistributionAsProcessing(distributionId: string): Distribution | null {
  return updateDistribution(distributionId, {
    status: 'Processing'
  })
}

// Mark distribution as completed
export function markDistributionAsCompleted(distributionId: string): Distribution | null {
  return updateDistribution(distributionId, {
    status: 'Completed',
    processedDate: new Date().toISOString()
  })
}

// Get upcoming distributions (next 30 days)
export function getUpcomingDistributions(): Distribution[] {
  const distributions = getDistributions()
  const now = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(now.getDate() + 30)

  return distributions.filter(d => {
    if (d.status === 'Completed') return false
    const distDate = new Date(d.distributionDate)
    return distDate >= now && distDate <= thirtyDaysFromNow
  }).sort((a, b) => new Date(a.distributionDate).getTime() - new Date(b.distributionDate).getTime())
}

// Get summary statistics
export function getDistributionSummary() {
  const distributions = getDistributions()

  return {
    total: distributions.length,
    pending: distributions.filter(d => d.status === 'Pending').length,
    processing: distributions.filter(d => d.status === 'Processing').length,
    completed: distributions.filter(d => d.status === 'Completed').length,
    failed: distributions.filter(d => d.status === 'Failed').length,
    upcoming: getUpcomingDistributions().length,
    totalDistributionAmount: distributions.reduce((sum, d) => sum + d.totalDistributionAmount, 0),
    totalReturnOfCapital: distributions.reduce((sum, d) => sum + (d.returnOfCapitalAmount || 0), 0),
    totalIncome: distributions.reduce((sum, d) => sum + (d.incomeAmount || 0), 0),
    totalCapitalGain: distributions.reduce((sum, d) => sum + (d.capitalGainAmount || 0), 0)
  }
}

// Get distributions by date range
export function getDistributionsByDateRange(startDate: string, endDate: string): Distribution[] {
  const distributions = getDistributions()
  const start = new Date(startDate)
  const end = new Date(endDate)

  return distributions.filter(d => {
    const distDate = new Date(d.distributionDate)
    return distDate >= start && distDate <= end
  }).sort((a, b) => new Date(b.distributionDate).getTime() - new Date(a.distributionDate).getTime())
}
