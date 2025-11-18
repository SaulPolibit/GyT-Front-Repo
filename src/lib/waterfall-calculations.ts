/**
 * Multi-Tier Waterfall Calculation Engine
 * Calculates profit distributions according to waterfall structures commonly used in
 * private equity, real estate, and private debt funds
 */

import type { Investor } from '@/lib/types'

// Waterfall tier types
export type WaterfallTierType =
  | 'RETURN_OF_CAPITAL'      // Return investor capital first
  | 'PREFERRED_RETURN'       // Preferred return (hurdle rate) to investors
  | 'CATCH_UP'               // GP catch-up to reach carried interest
  | 'CARRIED_INTEREST'       // Remaining profits split between LP and GP

export interface WaterfallTier {
  id: string
  name: string
  type: WaterfallTierType
  order: number

  // For PREFERRED_RETURN tiers
  hurdleRate?: number // Annual percentage (e.g., 8 = 8%)

  // For CATCH_UP and CARRIED_INTEREST tiers
  lpSplit?: number  // Limited Partner (investor) percentage (e.g., 80 = 80%)
  gpSplit?: number  // General Partner (manager) percentage (e.g., 20 = 20%)

  // For CATCH_UP tier specifically
  catchUpTo?: number // Target GP percentage to catch up to (e.g., 20 = 20%)
}

export interface WaterfallStructure {
  id: string
  name: string
  description: string
  tiers: WaterfallTier[]
}

export interface InvestorCapitalAccount {
  investorId: string
  investorName: string
  capitalContributed: number
  capitalReturned: number
  preferredReturnAccrued: number
  preferredReturnPaid: number
  distributionsReceived: number
}

export interface WaterfallDistribution {
  totalDistributable: number
  tierDistributions: TierDistribution[]
  investorAllocations: InvestorAllocation[]
  gpAllocation: {
    tierAllocations: { tierId: string; tierName: string; amount: number }[]
    totalAmount: number
  }
}

export interface TierDistribution {
  tierId: string
  tierName: string
  tierType: WaterfallTierType
  amountDistributed: number
  remainingAfterTier: number
  lpAmount: number
  gpAmount: number
}

export interface InvestorAllocation {
  investorId: string
  investorName: string
  ownershipPercent: number
  tierAllocations: { tierId: string; tierName: string; amount: number }[]
  totalAllocation: number
}

/**
 * Calculate waterfall distribution for a given distributable amount
 */
export function calculateWaterfall(
  structure: WaterfallStructure,
  distributionAmount: number,
  capitalAccounts: InvestorCapitalAccount[],
  fundStartDate: string,
  distributionDate: string
): WaterfallDistribution {
  const sortedTiers = [...structure.tiers].sort((a, b) => a.order - b.order)
  const tierDistributions: TierDistribution[] = []
  const investorAllocations: Map<string, InvestorAllocation> = new Map()
  const gpTierAllocations: { tierId: string; tierName: string; amount: number }[] = []

  // Initialize investor allocations
  capitalAccounts.forEach((account) => {
    investorAllocations.set(account.investorId, {
      investorId: account.investorId,
      investorName: account.investorName,
      ownershipPercent: 0, // Will be calculated dynamically per tier
      tierAllocations: [],
      totalAllocation: 0,
    })
  })

  let remainingToDistribute = distributionAmount

  // Process each tier in order
  for (const tier of sortedTiers) {
    if (remainingToDistribute <= 0) {
      // No more to distribute, add tier with $0
      tierDistributions.push({
        tierId: tier.id,
        tierName: tier.name,
        tierType: tier.type,
        amountDistributed: 0,
        remainingAfterTier: 0,
        lpAmount: 0,
        gpAmount: 0,
      })
      continue
    }

    let tierAmount = 0
    let lpAmount = 0
    let gpAmount = 0

    switch (tier.type) {
      case 'RETURN_OF_CAPITAL': {
        // Calculate total unreturned capital
        const totalUnreturnedCapital = capitalAccounts.reduce(
          (sum, account) => sum + (account.capitalContributed - account.capitalReturned),
          0
        )

        tierAmount = Math.min(remainingToDistribute, totalUnreturnedCapital)
        lpAmount = tierAmount
        gpAmount = 0

        // Calculate total capital contributed for ownership percentage
        const totalCapitalContributed = capitalAccounts.reduce(
          (sum, account) => sum + account.capitalContributed,
          0
        )

        // Distribute proportionally to investors based on unreturned capital
        capitalAccounts.forEach((account) => {
          const unreturnedCapital = account.capitalContributed - account.capitalReturned
          if (unreturnedCapital > 0 && totalUnreturnedCapital > 0) {
            const investorShare = (unreturnedCapital / totalUnreturnedCapital) * tierAmount
            const allocation = investorAllocations.get(account.investorId)!
            allocation.tierAllocations.push({
              tierId: tier.id,
              tierName: tier.name,
              amount: investorShare,
            })
            allocation.totalAllocation += investorShare

            // Calculate ownership percent based on capital contributed
            if (totalCapitalContributed > 0) {
              const ownershipPercent = (account.capitalContributed / totalCapitalContributed) * 100
              allocation.ownershipPercent = ownershipPercent
            }
          }
        })

        break
      }

      case 'PREFERRED_RETURN': {
        const hurdleRate = tier.hurdleRate || 8

        // Calculate total preferred return (8% of initial invested capital, not time-based)
        const totalPreferredReturnDue = capitalAccounts.reduce((sum, account) => {
          const contributedCapital = account.capitalContributed
          const preferredReturnAmount = contributedCapital * (hurdleRate / 100)
          const unpaidReturn = Math.max(0, preferredReturnAmount - account.preferredReturnPaid)
          return sum + unpaidReturn
        }, 0)

        tierAmount = Math.min(remainingToDistribute, totalPreferredReturnDue)
        lpAmount = tierAmount
        gpAmount = 0

        // Distribute proportionally to investors based on preferred return
        capitalAccounts.forEach((account) => {
          const contributedCapital = account.capitalContributed
          const preferredReturnAmount = contributedCapital * (hurdleRate / 100)
          const unpaidReturn = Math.max(0, preferredReturnAmount - account.preferredReturnPaid)

          if (unpaidReturn > 0 && totalPreferredReturnDue > 0) {
            const investorShare = (unpaidReturn / totalPreferredReturnDue) * tierAmount
            const allocation = investorAllocations.get(account.investorId)!
            allocation.tierAllocations.push({
              tierId: tier.id,
              tierName: tier.name,
              amount: investorShare,
            })
            allocation.totalAllocation += investorShare
          }
        })

        break
      }

      case 'CATCH_UP': {
        const targetGpPercent = tier.catchUpTo || 20

        // Calculate how much GP has received so far
        const gpReceivedSoFar = gpTierAllocations.reduce((sum, alloc) => sum + alloc.amount, 0)

        // Calculate how much LP has received in preferred return (Tier 2)
        // We need to calculate profits distributed so far (excluding return of capital)
        const returnOfCapitalAmount = tierDistributions[0]?.lpAmount || 0 // Tier 1 ROC
        const preferredReturnAmount = tierDistributions[1]?.lpAmount || 0 // Tier 2 Preferred Return

        // Profits distributed so far = preferred return (since ROC is not profit)
        const profitsDistributedSoFar = preferredReturnAmount

        // Total distributed to LPs (for catch-up calculation, only count profits)
        const profitsTotal = profitsDistributedSoFar + gpReceivedSoFar

        // Target GP amount to catch up to target percentage
        // GP should receive (targetGpPercent / (100 - targetGpPercent)) of LP's profits
        // Or: targetGpAmount = profits * (targetGpPercent / 100)
        const targetGpAmount = profitsTotal * (targetGpPercent / (100 - targetGpPercent))

        // How much more GP needs to reach target
        const gpCatchUpNeeded = Math.max(0, targetGpAmount - gpReceivedSoFar)

        tierAmount = Math.min(remainingToDistribute, gpCatchUpNeeded)
        lpAmount = 0
        gpAmount = tierAmount

        // All catch-up goes to GP
        gpTierAllocations.push({
          tierId: tier.id,
          tierName: tier.name,
          amount: gpAmount,
        })

        break
      }

      case 'CARRIED_INTEREST': {
        const lpSplitPercent = tier.lpSplit || 80
        const gpSplitPercent = tier.gpSplit || 20

        tierAmount = remainingToDistribute
        lpAmount = tierAmount * (lpSplitPercent / 100)
        gpAmount = tierAmount * (gpSplitPercent / 100)

        // Calculate total capital contributed by all investors
        const totalCapitalContributed = capitalAccounts.reduce(
          (sum, account) => sum + account.capitalContributed,
          0
        )

        // Distribute to investors based on ownership percentage
        capitalAccounts.forEach((account) => {
          if (totalCapitalContributed > 0) {
            const ownershipPercent = (account.capitalContributed / totalCapitalContributed) * 100
            const investorShare = lpAmount * (ownershipPercent / 100)
            const allocation = investorAllocations.get(account.investorId)!
            allocation.tierAllocations.push({
              tierId: tier.id,
              tierName: tier.name,
              amount: investorShare,
            })
            allocation.totalAllocation += investorShare
            allocation.ownershipPercent = ownershipPercent
          }
        })

        // GP allocation
        gpTierAllocations.push({
          tierId: tier.id,
          tierName: tier.name,
          amount: gpAmount,
        })

        break
      }
    }

    tierDistributions.push({
      tierId: tier.id,
      tierName: tier.name,
      tierType: tier.type,
      amountDistributed: tierAmount,
      remainingAfterTier: remainingToDistribute - tierAmount,
      lpAmount,
      gpAmount,
    })

    remainingToDistribute -= tierAmount
  }

  // Calculate total GP allocation
  const totalGpAmount = gpTierAllocations.reduce((sum, alloc) => sum + alloc.amount, 0)

  return {
    totalDistributable: distributionAmount,
    tierDistributions,
    investorAllocations: Array.from(investorAllocations.values()),
    gpAllocation: {
      tierAllocations: gpTierAllocations,
      totalAmount: totalGpAmount,
    },
  }
}

/**
 * Calculate years elapsed between two dates (for preferred return calculations)
 */
function calculateYearsElapsed(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25)
  return diffYears
}

/**
 * Standard 4-tier waterfall structure (European-style)
 */
export const STANDARD_WATERFALL: WaterfallStructure = {
  id: 'standard-4-tier',
  name: 'Standard 4-Tier Waterfall',
  description: 'Return of capital, 8% preferred return, GP catch-up to 20%, then 80/20 split',
  tiers: [
    {
      id: 'tier-1',
      name: 'Return of Capital',
      type: 'RETURN_OF_CAPITAL',
      order: 1,
    },
    {
      id: 'tier-2',
      name: 'Preferred Return (8%)',
      type: 'PREFERRED_RETURN',
      order: 2,
      hurdleRate: 8,
    },
    {
      id: 'tier-3',
      name: 'GP Catch-Up',
      type: 'CATCH_UP',
      order: 3,
      catchUpTo: 20,
      lpSplit: 0,
      gpSplit: 100,
    },
    {
      id: 'tier-4',
      name: 'Carried Interest Split',
      type: 'CARRIED_INTEREST',
      order: 4,
      lpSplit: 80,
      gpSplit: 20,
    },
  ],
}

/**
 * American-style waterfall (no catch-up)
 */
export const AMERICAN_WATERFALL: WaterfallStructure = {
  id: 'american-3-tier',
  name: 'American-Style 3-Tier Waterfall',
  description: 'Return of capital, 8% preferred return, then 80/20 split (no catch-up)',
  tiers: [
    {
      id: 'tier-1',
      name: 'Return of Capital',
      type: 'RETURN_OF_CAPITAL',
      order: 1,
    },
    {
      id: 'tier-2',
      name: 'Preferred Return (8%)',
      type: 'PREFERRED_RETURN',
      order: 2,
      hurdleRate: 8,
    },
    {
      id: 'tier-3',
      name: 'Profit Split',
      type: 'CARRIED_INTEREST',
      order: 3,
      lpSplit: 80,
      gpSplit: 20,
    },
  ],
}

/**
 * Format currency values for display
 */
export function formatWaterfallCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format percentage values for display
 */
export function formatWaterfallPercent(value: number): string {
  return `${value.toFixed(2)}%`
}
