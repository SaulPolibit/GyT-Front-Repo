/**
 * CSV Export Generator
 * Generates CSV exports for various report data
 */

import type { Report, Investment, Investor } from '@/lib/types'

interface CSVGeneratorOptions {
  report: Report
  investments: Investment[]
  investors: Investor[]
}

export function generateReportSummaryCSV(report: Report): string {
  const rows = [
    ['Report Summary'],
    [],
    ['Field', 'Value'],
    ['Report ID', report.id],
    ['Title', report.title],
    ['Type', report.type],
    ['Status', report.status],
    ['Period Start', report.periodStart],
    ['Period End', report.periodEnd],
    ['Generated Date', report.generatedDate],
    ['Published Date', report.publishedDate || 'Not Published'],
    ['Created By', report.createdBy],
    ['Recipients', report.sentTo.length.toString()],
    [],
    ['Key Metrics'],
    [],
    ['Metric', 'Value'],
    ['Total AUM', formatCurrency(report.metrics.totalAUM)],
    ['Total Investments', report.metrics.totalInvestments.toString()],
    ['Total Investors', report.metrics.totalInvestors.toString()],
    ['Average IRR', `${report.metrics.avgIRR.toFixed(1)}%`],
    ['Total Distributions', formatCurrency(report.metrics.totalDistributions)]
  ]

  // Add capital call details if present
  if (report.capitalCall) {
    rows.push(
      [],
      ['Capital Call Details'],
      [],
      ['Field', 'Value'],
      ['Total Call Amount', formatCurrency(report.capitalCall.totalCallAmount)],
      ['Call Number', report.capitalCall.callNumber.toString()],
      ['Due Date', report.capitalCall.dueDate],
      ['Purpose', report.capitalCall.purpose],
      ['Related Investment', report.capitalCall.relatedInvestmentName]
    )
  }

  // Add distribution details if present
  if (report.distribution) {
    rows.push(
      [],
      ['Distribution Details'],
      [],
      ['Field', 'Value'],
      ['Total Distribution Amount', formatCurrency(report.distribution.totalDistributionAmount)],
      ['Distribution Number', report.distribution.distributionNumber.toString()],
      ['Distribution Date', report.distribution.distributionDate],
      ['Source', report.distribution.source]
    )
  }

  return convertToCSV(rows)
}

export function generateInvestmentsCSV(report: Report, investments: Investment[]): string {
  const includedInvestments = investments.filter(inv =>
    report.includesInvestments.includes(inv.id)
  )

  const rows = [
    [
      'Investment ID',
      'Investment Name',
      'Type',
      'Sector',
      'Acquisition Date',
      'Total Invested',
      'Current Value',
      'IRR (%)',
      'Multiple'
    ]
  ]

  includedInvestments.forEach(inv => {
    rows.push([
      inv.id,
      inv.name,
      inv.type,
      inv.sector,
      inv.acquisitionDate,
      inv.totalFundPosition.totalInvested.toString(),
      inv.totalFundPosition.currentValue.toString(),
      inv.totalFundPosition.irr.toString(),
      inv.totalFundPosition.multiple.toString()
    ])
  })

  // Add totals row
  const totalInvested = includedInvestments.reduce(
    (sum, inv) => sum + inv.totalFundPosition.totalInvested,
    0
  )
  const totalCurrentValue = includedInvestments.reduce(
    (sum, inv) => sum + inv.totalFundPosition.currentValue,
    0
  )
  const avgIRR = includedInvestments.reduce(
    (sum, inv) => sum + inv.totalFundPosition.irr,
    0
  ) / includedInvestments.length
  const avgMultiple = includedInvestments.reduce(
    (sum, inv) => sum + inv.totalFundPosition.multiple,
    0
  ) / includedInvestments.length

  rows.push([
    '',
    'TOTAL',
    '',
    '',
    '',
    totalInvested.toString(),
    totalCurrentValue.toString(),
    avgIRR.toFixed(1),
    avgMultiple.toFixed(2)
  ])

  return convertToCSV(rows)
}

export function generateInvestorsCSV(report: Report, investors: Investor[], fundId: string): string {
  const includedInvestors = investors.filter(inv =>
    report.includesInvestors.includes(inv.id)
  )

  const rows = [
    [
      'Investor ID',
      'Investor Name',
      'Type',
      'Email',
      'Phone',
      'Ownership %',
      'Commitment',
      'Called Capital',
      'Funded %',
      'Current Balance'
    ]
  ]

  includedInvestors.forEach(investor => {
    const fundOwnership = investor.fundOwnerships?.find(fo => fo.fundId === fundId)
    const capitalHistory = investor.capitalAccountHistory || []
    const currentBalance = capitalHistory.length > 0
      ? capitalHistory[capitalHistory.length - 1].runningBalance
      : (fundOwnership?.calledCapital || 0)

    rows.push([
      investor.id,
      investor.name,
      investor.type,
      investor.email || 'N/A',
      investor.phone || 'N/A',
      (fundOwnership?.ownershipPercent || 0).toString(),
      (fundOwnership?.commitment || 0).toString(),
      (fundOwnership?.calledCapital || 0).toString(),
      (fundOwnership?.fundedPercent || 0).toString(),
      currentBalance.toString()
    ])
  })

  // Add totals row
  const totalOwnership = includedInvestors.reduce(
    (sum, inv) => sum + (inv.fundOwnerships?.find(fo => fo.fundId === fundId)?.ownershipPercent || 0),
    0
  )
  const totalCommitment = includedInvestors.reduce(
    (sum, inv) => sum + (inv.fundOwnerships?.find(fo => fo.fundId === fundId)?.commitment || 0),
    0
  )
  const totalCalledCapital = includedInvestors.reduce(
    (sum, inv) => sum + (inv.fundOwnerships?.find(fo => fo.fundId === fundId)?.calledCapital || 0),
    0
  )
  const avgFunded = includedInvestors.reduce(
    (sum, inv) => sum + (inv.fundOwnerships?.find(fo => fo.fundId === fundId)?.fundedPercent || 0),
    0
  ) / includedInvestors.length

  const totalCurrentBalance = includedInvestors.reduce((sum, investor) => {
    const fundOwnership = investor.fundOwnerships?.find(fo => fo.fundId === fundId)
    const capitalHistory = investor.capitalAccountHistory || []
    const currentBalance = capitalHistory.length > 0
      ? capitalHistory[capitalHistory.length - 1].runningBalance
      : (fundOwnership?.calledCapital || 0)
    return sum + currentBalance
  }, 0)

  rows.push([
    '',
    'TOTAL',
    '',
    '',
    '',
    totalOwnership.toFixed(2),
    totalCommitment.toString(),
    totalCalledCapital.toString(),
    avgFunded.toFixed(1),
    totalCurrentBalance.toString()
  ])

  return convertToCSV(rows)
}

export function generateTransactionsCSV(report: Report): string {
  const allocations = report.capitalCall?.investorAllocations ||
                     report.distribution?.investorAllocations

  if (!allocations || allocations.length === 0) {
    return convertToCSV([['No transactions in this report']])
  }

  const isCapitalCall = !!report.capitalCall

  const rows = [
    [
      'Transaction Type',
      'Transaction Number',
      'Transaction Date',
      isCapitalCall ? 'Due Date' : 'Distribution Date',
      isCapitalCall ? 'Purpose' : 'Source',
      'Investor ID',
      'Investor Name',
      'Investor Type',
      'Ownership %',
      'Amount',
      'Status'
    ]
  ]

  const transactionDate = isCapitalCall
    ? report.capitalCall!.dueDate
    : report.distribution!.distributionDate

  const purposeOrSource = isCapitalCall
    ? report.capitalCall!.purpose
    : report.distribution!.source

  const transactionNumber = isCapitalCall
    ? report.capitalCall!.callNumber
    : report.distribution!.distributionNumber

  allocations.forEach(allocation => {
    rows.push([
      isCapitalCall ? 'Capital Call' : 'Distribution',
      transactionNumber.toString(),
      report.periodEnd,
      transactionDate,
      purposeOrSource,
      allocation.investorId,
      allocation.investorName,
      allocation.investorType,
      allocation.ownershipPercent.toString(),
      allocation.amount.toString(),
      allocation.status || 'Pending'
    ])
  })

  // Add totals row
  const totalOwnership = allocations.reduce(
    (sum, alloc) => sum + alloc.ownershipPercent,
    0
  )
  const totalAmount = allocations.reduce(
    (sum, alloc) => sum + alloc.amount,
    0
  )

  rows.push([
    '',
    '',
    '',
    '',
    '',
    '',
    'TOTAL',
    '',
    totalOwnership.toFixed(2),
    totalAmount.toString(),
    ''
  ])

  return convertToCSV(rows)
}

export function generateCapitalAccountHistoryCSV(investor: Investor): string {
  const rows = [
    ['Capital Account History'],
    [],
    ['Investor:', investor.name],
    ['Type:', investor.type],
    ['Email:', investor.contactInfo.email],
    [],
    [
      'Date',
      'Transaction Type',
      'Amount',
      'Description',
      'Report ID',
      'Running Balance'
    ]
  ]

  const history = investor.capitalAccountHistory || []

  history.forEach(transaction => {
    rows.push([
      transaction.date,
      transaction.type,
      transaction.amount.toString(),
      transaction.description,
      transaction.reportId || 'N/A',
      transaction.runningBalance.toString()
    ])
  })

  return convertToCSV(rows)
}

// Utility functions
function convertToCSV(rows: string[][]): string {
  return rows
    .map(row =>
      row
        .map(cell => {
          // Escape quotes and wrap in quotes if needed
          const escaped = cell.replace(/"/g, '""')
          return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped
        })
        .join(',')
    )
    .join('\n')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
