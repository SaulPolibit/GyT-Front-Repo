import type {
  ILPAScheduleData,
  ILPASectionA,
  ILPASectionB,
  ILPASectionCTransaction,
  ILPASectionD,
} from './drawdown-notice-generator'

interface BuildILPAInput {
  formData: {
    fundName: string
    investmentsAmount: number
    fundExpensesAmount: number
    reservesAmount: number
    feePeriod: 'quarterly' | 'annual' | 'semi-annual'
    feePeriodMonths: number
    feeRateOnNic: number | null
    feeRateOnUnfunded: number | null
    vatRate: number
    vatApplicable: boolean
    selectedFees: { nicFee: boolean; unfundedFee: boolean }
    gpPercentage?: number
  }
  allocation: {
    investorId: string
    investorName: string
    commitment: number
    ownershipPercent: number
    callAmount: number
  }
  fees: {
    grossFees: number
    discountPercent: number
    discountAmount: number
    netFees: number
    vatRate: number
    vatAmount: number
    totalDue: number
    feeBreakdown: { nicFee: number; unfundedFee: number }
  }
  cumulativeCalled: Record<string, number>
  cumulativeDistributed?: Record<string, number>
  totalDistributedFund?: number
  historySummary: { totalCalled?: number } | null
  selectedFund: { totalCommitment: number; gpPercentage?: number } | null
  totalCallAmount: number
  hasSelectedFees: boolean
  investorPortion: number
  investmentsShare: number
  expensesShare: number
  reservesShare: number
}

function feePeriodLabel(period: string, months: number): string {
  if (months === 3) return 'Quarterly (3/12)'
  if (months === 6) return 'Semi-Annual (6/12)'
  if (months === 12) return 'Annual (12/12)'
  return `${period} (${months}/12)`
}

export function buildILPAScheduleData(input: BuildILPAInput): ILPAScheduleData {
  const {
    formData, allocation, fees, cumulativeCalled,
    cumulativeDistributed, totalDistributedFund,
    historySummary, selectedFund, totalCallAmount,
    hasSelectedFees, investorPortion,
    investmentsShare, expensesShare, reservesShare,
  } = input

  const fundCommitment = selectedFund?.totalCommitment || 0
  const gpPercent = selectedFund?.gpPercentage || formData.gpPercentage || 0
  const prevCalledInvestor = cumulativeCalled[allocation.investorId] || 0
  const prevCalledFund = historySummary?.totalCalled || 0
  const prorationFactor = formData.feePeriodMonths / 12

  const unfundedBefore = Math.max(0, allocation.commitment - prevCalledInvestor)
  const prevDistributedInvestor = cumulativeDistributed?.[allocation.investorId] || 0
  const prevDistributedFund = totalDistributedFund || 0

  // Fee amounts for this investor
  const feeTotalWithVat = hasSelectedFees ? fees.netFees + fees.vatAmount : 0
  const gpFeeOffset = gpPercent > 0 && hasSelectedFees
    ? fees.netFees * (gpPercent / 100) : 0
  const deemedGp = -gpFeeOffset

  // ── Section A ──
  const sectionA: ILPASectionA = {
    fundName: formData.fundName,
    gpCoInvestmentPercent: gpPercent,
    fundCapitalCommitments: fundCommitment,
    cumulativeFundContributionsPrior: prevCalledFund,
    cumulativeFundDistributionsPrior: prevDistributedFund,
    currentNoticeInvestments: formData.investmentsAmount,
    currentNoticeFundExpenses: formData.fundExpensesAmount,
    currentNoticeReserves: formData.reservesAmount,
    currentNoticeManagementFees: hasSelectedFees
      ? fees.netFees * (fundCommitment > 0 ? fundCommitment / allocation.commitment : 1)
      : 0,
    currentNoticeOther: 0,
    currentNoticeTotalContributions: totalCallAmount,
    currentNoticeTotalDistributions: 0,
  }

  // ── Section B ──
  const sectionB: ILPASectionB = {
    investorName: allocation.investorName,
    investorCommitment: allocation.commitment,
    investorPercentOfFund: allocation.ownershipPercent,
    investorPercentOfNAV: null, // NAV engine not built
    cumulativeInvestorContributionsPrior: prevCalledInvestor,
    cumulativeInvestorDistributionsPrior: prevDistributedInvestor,
    currentInvestorContributions: investorPortion,
    currentInvestorDistributions: 0,
    unfundedCommitment: unfundedBefore - investorPortion,
    aggregateContributions: prevCalledInvestor + investorPortion,
    aggregateDistributions: prevDistributedInvestor,
    aggregateNetCashFlow: -(prevCalledInvestor + investorPortion) + prevDistributedInvestor,
    investorNAV: null,
  }

  // ── Section C — Transaction rows ──
  const transactions: ILPASectionCTransaction[] = []

  if (investmentsShare > 0) {
    transactions.push({
      description: 'Portfolio Investments',
      transactionType: 'Capital Call',
      investorAmount: investmentsShare,
      impactOnUnfunded: -investmentsShare,
    })
  }
  if (expensesShare > 0) {
    transactions.push({
      description: 'Fund Expenses',
      transactionType: 'Capital Call',
      investorAmount: expensesShare,
      impactOnUnfunded: -expensesShare,
    })
  }
  if (reservesShare > 0) {
    transactions.push({
      description: 'Reserves',
      transactionType: 'Capital Call',
      investorAmount: reservesShare,
      impactOnUnfunded: -reservesShare,
    })
  }
  if (hasSelectedFees && fees.netFees > 0) {
    transactions.push({
      description: 'Management Fees (Net)',
      transactionType: 'Capital Call',
      investorAmount: fees.netFees,
      impactOnUnfunded: -fees.netFees,
    })
  }
  if (hasSelectedFees && fees.vatAmount > 0) {
    transactions.push({
      description: `VAT (${fees.vatRate}%)`,
      transactionType: 'Capital Call',
      investorAmount: fees.vatAmount,
      impactOnUnfunded: -fees.vatAmount,
    })
  }
  if (deemedGp !== 0) {
    transactions.push({
      description: 'Deemed GP Contribution',
      transactionType: 'Offset',
      investorAmount: deemedGp,
      impactOnUnfunded: -deemedGp,
    })
  }

  // ── Section D — Fee calculations (only if fees active) ──
  let sectionD: ILPASectionD | undefined
  if (hasSelectedFees && (fees.feeBreakdown.nicFee > 0 || fees.feeBreakdown.unfundedFee > 0)) {
    sectionD = {
      feePeriodText: feePeriodLabel(formData.feePeriod, formData.feePeriodMonths),
      feePeriodFraction: prorationFactor,
      feeRateOnNic: formData.feeRateOnNic || 0,
      feeRateOnUnfunded: formData.feeRateOnUnfunded || 0,
      adjustedNic: prevCalledInvestor,
      unfundedCommitment: unfundedBefore,
      nicFeeSubtotal: fees.feeBreakdown.nicFee,
      unfundedFeeSubtotal: fees.feeBreakdown.unfundedFee,
      grossFee: fees.grossFees,
      feeDiscount: fees.discountAmount,
      feeDiscountPercent: fees.discountPercent,
      feeOffset: gpFeeOffset,
      netFees: fees.netFees,
      vatRate: fees.vatRate,
      vatAmount: fees.vatAmount,
      totalFeesWithVat: fees.netFees + fees.vatAmount,
    }
  }

  return {
    sectionA,
    sectionB,
    sectionC: transactions,
    sectionD,
  }
}
