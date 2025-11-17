import { Investor, CapitalCall, Distribution } from './types'
import { getInvestors } from './investors-storage'
import { getStructures } from './structures-storage'
import { getCapitalCalls } from './capital-calls-storage'
import { getDistributions } from './distributions-storage'

export interface PortfolioMetrics {
  lastReturn: number
  totalReturn: number
  sharesAcquired: number
  totalInvestment: number
}

export interface InvestorStructure {
  id: string
  name: string
  type: string
  ownershipPercent: number
  commitment: number
  calledCapital: number
  uncalledCapital: number
  currentValue: number
  unrealizedGain: number
}

export function getInvestorByEmail(email: string): Investor | null {
  const investors = getInvestors()
  return investors.find(inv => inv.email.toLowerCase() === email.toLowerCase()) || null
}

export function getInvestorStructures(investor: Investor): InvestorStructure[] {
  const allStructures = getStructures()
  const allCapitalCalls = getCapitalCalls()

  return investor.fundOwnerships
    .filter(ownership => {
      // Only include structures where onboarding is complete
      // Use per-structure status, fall back to global investor status, default to 'Active'
      const status = ownership.onboardingStatus ?? investor.status ?? 'Active'
      return status === 'Active'
    })
    .map(ownership => {
      const structure = allStructures.find(s => s.id === ownership.fundId)
      if (!structure) return null

      // Calculate actual called capital from paid capital calls
      const structureCapitalCalls = allCapitalCalls.filter(cc =>
        cc.fundId === ownership.fundId &&
        cc.status !== 'Draft' &&
        cc.status !== 'Cancelled'
      )

      const actualCalledCapital = structureCapitalCalls.reduce((sum, cc) => {
        const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
        return sum + (allocation?.amountPaid || 0)
      }, 0)

      // Calculate ownership based on actual called capital / total fund size
      const calculatedOwnership = structure.totalCommitment > 0
        ? (actualCalledCapital / structure.totalCommitment) * 100
        : 0

      // Calculate uncalled capital
      const uncalledCapital = ownership.commitment - actualCalledCapital

      // Use NAV if available, otherwise fall back to totalCommitment
      const baseValue = structure.currentNav ?? structure.totalCommitment
      const currentValue = baseValue * (calculatedOwnership / 100)

      return {
        id: structure.id,
        name: ownership.fundName,
        type: structure.type,
        ownershipPercent: calculatedOwnership,
        commitment: ownership.commitment,
        calledCapital: actualCalledCapital,
        uncalledCapital,
        currentValue,
        unrealizedGain: currentValue - actualCalledCapital,
      }
    })
    .filter((s): s is InvestorStructure => s !== null)
}

export function getInvestorCapitalCalls(investorId: string): CapitalCall[] {
  const allCapitalCalls = getCapitalCalls()

  return allCapitalCalls.filter(cc =>
    cc.investorAllocations.some(alloc => alloc.investorId === investorId)
  ).sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime())
}

export function getInvestorDistributions(investorId: string): Distribution[] {
  const allDistributions = getDistributions()

  return allDistributions.filter(dist =>
    dist.investorAllocations.some(alloc => alloc.investorId === investorId)
  ).sort((a, b) => new Date(b.distributionDate).getTime() - new Date(a.distributionDate).getTime())
}

export function calculateInvestorMetrics(investor: Investor): PortfolioMetrics {
  const structures = getInvestorStructures(investor)
  const distributions = getInvestorDistributions(investor.id)

  const totalInvestment = structures.reduce((sum, s) => sum + s.calledCapital, 0)
  const currentValue = structures.reduce((sum, s) => sum + s.currentValue, 0)

  // Calculate total distributed from actual distribution transactions
  const totalDistributed = distributions
    .filter(d => d.status === 'Completed')
    .reduce((sum, dist) => {
      const allocation = dist.investorAllocations.find(a => a.investorId === investor.id)
      return sum + (allocation?.finalAllocation || 0)
    }, 0)

  const lastDistribution = distributions.find(d => d.status === 'Completed')
  const lastReturn = lastDistribution
    ? lastDistribution.investorAllocations.find(a => a.investorId === investor.id)?.finalAllocation || 0
    : 0

  const totalReturn = totalDistributed + currentValue - totalInvestment
  const sharesAcquired = structures.reduce((sum, s) => sum + s.ownershipPercent, 0)

  return {
    lastReturn,
    totalReturn,
    sharesAcquired,
    totalInvestment,
  }
}

export function getCurrentInvestorEmail(): string {
  if (typeof window === 'undefined') return ''

  const storedEmail = localStorage.getItem('polibit_current_investor_email')
  return storedEmail || 'investor@example.com'
}

export function setCurrentInvestorEmail(email: string): void {
  if (typeof window === 'undefined') return

  localStorage.setItem('polibit_current_investor_email', email)
}

export function getInvestorAvatar(investorId: string): string | null {
  if (typeof window === 'undefined') return null

  const avatars = localStorage.getItem('polibit_investor_avatars')
  if (!avatars) return null

  try {
    const parsed = JSON.parse(avatars)
    return parsed[investorId] || null
  } catch {
    return null
  }
}

export function setInvestorAvatar(investorId: string, avatarUrl: string): void {
  if (typeof window === 'undefined') return

  const avatars = localStorage.getItem('polibit_investor_avatars')
  let parsed: { [key: string]: string} = {}

  if (avatars) {
    try {
      parsed = JSON.parse(avatars)
    } catch {
      parsed = {}
    }
  }

  parsed[investorId] = avatarUrl
  localStorage.setItem('polibit_investor_avatars', JSON.stringify(parsed))
}

export interface PendingInvitation {
  fundId: string
  fundName: string
  commitment: number
  ownershipPercent: number
  status: 'Pending' | 'KYC/KYB' | 'Contracts' | 'Commitment'
  hierarchyLevel?: number
  investedDate: string
}

export function getPendingInvitations(investor: Investor): PendingInvitation[] {
  // Filter for fund ownerships where onboarding is not complete (not 'Active')
  return investor.fundOwnerships
    .filter(ownership => {
      // Use per-structure status, fall back to global investor status, default to 'Active'
      const status = ownership.onboardingStatus ?? investor.status ?? 'Active'
      return status !== 'Active' && status !== 'Inactive'
    })
    .map(ownership => ({
      fundId: ownership.fundId,
      fundName: ownership.fundName,
      commitment: ownership.commitment,
      ownershipPercent: ownership.ownershipPercent,
      status: ownership.onboardingStatus ?? investor.status ?? 'Active',
      hierarchyLevel: ownership.hierarchyLevel,
      investedDate: ownership.investedDate,
    }))
}

// Helper to determine the most advanced onboarding status
function getMostAdvancedStatus(statuses: InvestorStatus[]): InvestorStatus {
  const statusOrder: InvestorStatus[] = ['Pending', 'KYC/KYB', 'Contracts', 'Commitment', 'Active', 'Inactive']

  let mostAdvanced: InvestorStatus = 'Pending'
  let mostAdvancedIndex = 0

  for (const status of statuses) {
    const index = statusOrder.indexOf(status)
    if (index > mostAdvancedIndex) {
      mostAdvancedIndex = index
      mostAdvanced = status
    }
  }

  return mostAdvanced
}

export function updateStructureOnboardingStatus(
  investorId: string,
  fundId: string,
  newStatus: 'Pending' | 'KYC/KYB' | 'Contracts' | 'Commitment' | 'Active',
  ownershipData?: {
    ownershipPercent?: number
    commitment?: number
    calledCapital?: number
    uncalledCapital?: number
  }
): boolean {
  const investors = getInvestors()
  const investorIndex = investors.findIndex(inv => inv.id === investorId)

  if (investorIndex === -1) return false

  const investor = investors[investorIndex]
  const ownershipIndex = investor.fundOwnerships.findIndex(o => o.fundId === fundId)

  if (ownershipIndex === -1) return false

  // Update the onboarding status for this specific structure
  investor.fundOwnerships[ownershipIndex].onboardingStatus = newStatus

  // Update ownership data if provided
  if (ownershipData) {
    if (ownershipData.ownershipPercent !== undefined) {
      investor.fundOwnerships[ownershipIndex].ownershipPercent = ownershipData.ownershipPercent
    }
    if (ownershipData.commitment !== undefined) {
      investor.fundOwnerships[ownershipIndex].commitment = ownershipData.commitment
    }
    if (ownershipData.calledCapital !== undefined) {
      investor.fundOwnerships[ownershipIndex].calledCapital = ownershipData.calledCapital
    }
    if (ownershipData.uncalledCapital !== undefined) {
      investor.fundOwnerships[ownershipIndex].uncalledCapital = ownershipData.uncalledCapital
    }
  }

  // Update global investor status only if they have at least one Active fund
  // This allows Investment Manager to see if investor is generally active
  // But keeps per-fund onboarding independent
  const hasActiveFund = investor.fundOwnerships.some(fo => fo.onboardingStatus === 'Active')

  if (hasActiveFund && investor.status !== 'Active') {
    investor.status = 'Active'
  } else if (!hasActiveFund && newStatus !== 'Active') {
    // If no active funds, sync the global status to the most advanced onboarding state
    const statuses = investor.fundOwnerships.map(fo => fo.onboardingStatus || 'Pending')
    const mostAdvanced = getMostAdvancedStatus(statuses)
    investor.status = mostAdvanced
  }

  // Save back to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('polibit_investors', JSON.stringify(investors))
  }

  return true
}
