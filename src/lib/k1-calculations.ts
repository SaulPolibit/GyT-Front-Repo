/**
 * K-1 Tax Calculation Engine
 * Calculates IRS Form 1065 Schedule K-1 values for partnership investors
 */

import type { Investor, Investment, Report } from '@/lib/types'
import { getCapitalCalls } from './capital-calls-storage'
import { getDistributions } from './distributions-storage'
import { getStructureById } from './structures-storage'

export interface K1Data {
  taxYear: number
  partnerInfo: {
    name: string
    taxId: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
    ownershipPercent: number
    profitSharingPercent: number
    lossSharingPercent: number
    capitalSharingPercent: number
  }
  partnershipInfo: {
    name: string
    ein: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
    }
  }
  capitalAccount: {
    beginningBalance: number
    capitalContributed: number
    currentYearIncrease: number
    withdrawalsDistributions: number
    endingBalance: number
  }
  income: {
    ordinaryBusinessIncome: number // Box 1
    netRentalRealEstateIncome: number // Box 2
    otherNetRentalIncome: number // Box 3
    guaranteedPayments: number // Box 4
    interestIncome: number // Box 5
    dividends: number // Box 6a
    qualifiedDividends: number // Box 6b
    royalties: number // Box 7
    netShortTermCapitalGain: number // Box 8
    netLongTermCapitalGain: number // Box 9a
    collectiblesGain: number // Box 9b
    unrecapturedSection1250Gain: number // Box 9c
    netSection1231Gain: number // Box 10
    otherIncome: number // Box 11
  }
  deductions: {
    section179Deduction: number // Box 12
    otherDeductions: number // Box 13
    selfEmploymentEarnings: number // Box 14a
  }
  credits: {
    lowIncomeHousingCredit: number // Box 15a
    otherRentalRealEstateCredits: number // Box 15b
    otherRentalCredits: number // Box 15c
    otherCredits: number // Box 15d
  }
  foreignTransactions: {
    foreignCountryName: string
    foreignGrossIncome: number
    foreignTaxesPaid: number
  }
  alternativeMinimumTax: {
    postNinetySevenDepreciation: number
    adjustedGain: number
    depletion: number
    taxExemptInterest: number
  }
  otherInformation: {
    investmentIncomeExpenses: number
    fuelTaxCredit: number
    section199ADividends: number
  }
}

export function calculateK1Data(
  investor: Investor,
  fundId: string,
  taxYear: number,
  investments: Investment[],
  distributions: Report[]
): K1Data {
  // Filter data for the tax year
  const yearStart = new Date(`${taxYear}-01-01`)
  const yearEnd = new Date(`${taxYear}-12-31`)

  // Get fund ownership for this specific fund
  const fundOwnership = investor.fundOwnerships?.find(fo => fo.fundId === fundId)

  if (!fundOwnership) {
    throw new Error(`Investor ${investor.name} has no ownership in fund ${fundId}`)
  }

  // Get structure to calculate dynamic ownership
  const structure = getStructureById(fundId)
  if (!structure) {
    throw new Error(`Structure ${fundId} not found`)
  }

  // Get actual capital calls and distributions from transactions
  const allCapitalCalls = getCapitalCalls()
  const allDistributions = getDistributions()

  // Calculate actual capital contributed from capital calls for the tax year
  const yearCapitalCalls = allCapitalCalls.filter(cc => {
    const callDate = new Date(cc.callDate)
    return callDate >= yearStart && callDate <= yearEnd && cc.status !== 'Draft' && cc.status !== 'Cancelled'
  })

  const capitalContributed = yearCapitalCalls.reduce((sum, cc) => {
    const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
    return sum + (allocation?.amountPaid || 0)
  }, 0)

  // Calculate actual distributions for the tax year
  const yearDistributions = allDistributions.filter(dist => {
    const distDate = new Date(dist.distributionDate)
    return distDate >= yearStart && distDate <= yearEnd && dist.status === 'Completed'
  })

  const withdrawalsDistributions = yearDistributions.reduce((sum, dist) => {
    const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
    return sum + (allocation?.finalAllocation || 0)
  }, 0)

  // Calculate actual called capital up to end of tax year
  const allPriorCapitalCalls = allCapitalCalls.filter(cc => {
    const callDate = new Date(cc.callDate)
    return callDate <= yearEnd && cc.status !== 'Draft' && cc.status !== 'Cancelled'
  })

  const totalCalledCapital = allPriorCapitalCalls.reduce((sum, cc) => {
    const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
    return sum + (allocation?.amountPaid || 0)
  }, 0)

  // Calculate all distributions up to end of tax year
  const allPriorDistributions = allDistributions.filter(dist => {
    const distDate = new Date(dist.distributionDate)
    return distDate <= yearEnd && dist.status === 'Completed'
  })

  const totalDistributed = allPriorDistributions.reduce((sum, dist) => {
    const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
    return sum + (allocation?.finalAllocation || 0)
  }, 0)

  // Calculate beginning balance (called capital - distributions before year start)
  const priorYearCapitalCalls = allCapitalCalls.filter(cc => {
    const callDate = new Date(cc.callDate)
    return callDate < yearStart && cc.status !== 'Draft' && cc.status !== 'Cancelled'
  })

  const beginningCapital = priorYearCapitalCalls.reduce((sum, cc) => {
    const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
    return sum + (allocation?.amountPaid || 0)
  }, 0)

  const priorYearDistributions = allDistributions.filter(dist => {
    const distDate = new Date(dist.distributionDate)
    return distDate < yearStart && dist.status === 'Completed'
  })

  const beginningDistributions = priorYearDistributions.reduce((sum, dist) => {
    const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
    return sum + (allocation?.finalAllocation || 0)
  }, 0)

  const beginningBalance = beginningCapital - beginningDistributions
  const endingBalance = totalCalledCapital - totalDistributed

  // Calculate dynamic ownership percentage (called capital / total fund size)
  const ownershipPercent = structure.totalCommitment > 0
    ? (totalCalledCapital / structure.totalCommitment) * 100
    : 0

  // Calculate current value based on structure NAV and ownership
  const baseValue = structure.currentNav ?? structure.totalCommitment
  const currentValue = baseValue * (ownershipPercent / 100)

  // Calculate unrealized gain (current value - total called capital)
  const unrealizedGain = currentValue - totalCalledCapital

  // For real estate partnerships, most income comes from rental income
  // Calculate based on investor's share of portfolio performance
  const investorShare = ownershipPercent / 100

  // Estimate ordinary business income from rental operations
  // Using a simplified calculation: total distributed + unrealized gains
  const estimatedTotalIncome = withdrawalsDistributions + unrealizedGain
  const ordinaryBusinessIncome = estimatedTotalIncome * 0.7 // 70% as ordinary income
  const netRentalRealEstateIncome = estimatedTotalIncome * 0.3 // 30% as rental income

  // Long-term capital gains from asset appreciation
  const netLongTermCapitalGain = unrealizedGain

  // Calculate current year increase (income - distributions)
  const currentYearIncrease = ordinaryBusinessIncome + netRentalRealEstateIncome - withdrawalsDistributions

  return {
    taxYear,
    partnerInfo: {
      name: investor.name,
      taxId: investor.taxId,
      address: investor.address,
      ownershipPercent: ownershipPercent,
      profitSharingPercent: ownershipPercent,
      lossSharingPercent: ownershipPercent,
      capitalSharingPercent: ownershipPercent,
    },
    partnershipInfo: {
      name: 'Polibit Real Estate Fund I, LP',
      ein: '12-3456789', // Replace with actual EIN
      address: {
        street: '100 Main Street, Suite 500',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
      },
    },
    capitalAccount: {
      beginningBalance,
      capitalContributed,
      currentYearIncrease,
      withdrawalsDistributions,
      endingBalance,
    },
    income: {
      ordinaryBusinessIncome: Math.round(ordinaryBusinessIncome),
      netRentalRealEstateIncome: Math.round(netRentalRealEstateIncome),
      otherNetRentalIncome: 0,
      guaranteedPayments: 0,
      interestIncome: 0,
      dividends: 0,
      qualifiedDividends: 0,
      royalties: 0,
      netShortTermCapitalGain: 0,
      netLongTermCapitalGain: Math.round(netLongTermCapitalGain * investorShare),
      collectiblesGain: 0,
      unrecapturedSection1250Gain: 0,
      netSection1231Gain: 0,
      otherIncome: 0,
    },
    deductions: {
      section179Deduction: 0,
      otherDeductions: Math.round(estimatedTotalIncome * 0.15), // Estimate 15% for expenses
      selfEmploymentEarnings: 0,
    },
    credits: {
      lowIncomeHousingCredit: 0,
      otherRentalRealEstateCredits: 0,
      otherRentalCredits: 0,
      otherCredits: 0,
    },
    foreignTransactions: {
      foreignCountryName: '',
      foreignGrossIncome: 0,
      foreignTaxesPaid: 0,
    },
    alternativeMinimumTax: {
      postNinetySevenDepreciation: 0,
      adjustedGain: 0,
      depletion: 0,
      taxExemptInterest: 0,
    },
    otherInformation: {
      investmentIncomeExpenses: Math.round(estimatedTotalIncome * 0.05), // 5% investment expenses
      fuelTaxCredit: 0,
      section199ADividends: 0,
    },
  }
}

export function formatK1Amount(amount: number): string {
  if (amount === 0) return '0'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatK1Percentage(percent: number): string {
  return `${percent.toFixed(4)}%`
}
