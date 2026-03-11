/**
 * Distribution Excel Export Utility
 * Generates ProximityParks-style Excel reports for distributions
 */

import { formatCurrencyDetailed as formatCurrency } from '@/lib/format-utils'

// Types for the Excel export data
export interface InvestorDistributionAllocation {
  investorId: string
  investorName: string
  investorType?: string
  commitment: number
  ownershipPercent: number
  baseAllocation: number
  // Payout preference
  payoutType?: 'cash' | 'reinvest' | 'partial'
  cashPercent?: number
  reinvestmentAmount?: number
  netToInvestor?: number
  // Previously distributed for this investor
  previouslyDistributed?: number
}

export interface HistoricalDistributionAllocation {
  investorId?: string
  investorName: string
  allocatedAmount: number
  reinvestmentAmount?: number
  netAmount?: number
  status?: string
}

export interface HistoricalDistribution {
  id?: string
  distributionNumber: number
  distributionDate: string
  totalAmount: number
  status?: string
  allocations?: HistoricalDistributionAllocation[]
}

export interface DistributionExcelData {
  fundName: string
  distributionNumber: number
  currency: string
  totalCommitment: number
  // Period information
  startOfPeriod: string
  endOfPeriod: string
  // Notice and payment fields
  dayOfNotice: string
  businessDays: number
  paymentDateDeadline: string
  description?: string
  // Distribution breakdown (ProximityParks style)
  noi: number
  refinancingProceeds: number
  bankInterest: number
  assetDisposal: number
  totalDistributionAmount: number
  reinvestment: number
  // Allocations
  allocations: InvestorDistributionAllocation[]
  // Historical data
  historicalDistributions: HistoricalDistribution[]
  historySummary: {
    totalDistributed: number
    totalReinvested?: number
    distributionCount?: number
    percentDistributed?: string
  }
  cumulativeDistributed: Record<string, number>
}


/**
 * Generate and download a Distribution Excel file
 */
export async function generateDistributionExcel(data: DistributionExcelData): Promise<void> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'PoliBit'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet(`Distribution #${data.distributionNumber}`)

  const allocations = data.allocations
  const numInvestors = allocations.length

  // Set column widths
  worksheet.columns = [
    { width: 5 },   // Checkmark column
    { width: 40 },  // Description
    { width: 18 },  // Total
    ...allocations.map(() => ({ width: 18 }))
  ]

  // Styling constants
  const headerFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1a1a2e' } }
  const headerFont = { bold: true, color: { argb: 'FFFFFFFF' } }
  const primaryFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF3F4F6' } }
  const totalFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFD1FAE5' } }

  // Row 1: Title
  const titleRow = worksheet.addRow(['', 'Distribution Notice'])
  titleRow.getCell(2).font = { bold: true, size: 16 }
  worksheet.mergeCells(1, 2, 1, 3 + numInvestors)

  // Row 2-4: Header info
  worksheet.addRow(['', 'Fund:', data.fundName, '', 'Distribution #:', `#${data.distributionNumber}`])
  worksheet.addRow(['', 'Day of Notice:', data.dayOfNotice || 'N/A', '', 'Business Days:', data.businessDays || 10])
  worksheet.addRow(['', 'Payment Deadline:', data.paymentDateDeadline || 'N/A', '', 'Currency:', data.currency])
  worksheet.addRow([]) // Empty row

  // Period information
  if (data.startOfPeriod || data.endOfPeriod) {
    worksheet.addRow(['', 'Period:', `${data.startOfPeriod || 'N/A'} to ${data.endOfPeriod || 'N/A'}`])
  }
  if (data.description) {
    worksheet.addRow(['', 'Description:', data.description])
  }
  worksheet.addRow([]) // Empty row

  // Investor header row
  const investorHeaders = ['', 'Description', 'Total', ...allocations.map(a => a.investorName)]
  const headerRow = worksheet.addRow(investorHeaders)
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) {
      cell.fill = headerFill
      cell.font = headerFont
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    }
  })

  // Commitment row
  const commitmentValues = ['', 'Commitment', formatCurrency(allocations.reduce((sum, a) => sum + a.commitment, 0))]
  allocations.forEach(a => commitmentValues.push(formatCurrency(a.commitment)))
  const commitmentRow = worksheet.addRow(commitmentValues)
  commitmentRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) {
      cell.fill = primaryFill
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    }
  })

  // Ownership row
  const ownershipValues = ['', 'Ownership %', '100.00%']
  allocations.forEach(a => ownershipValues.push(`${a.ownershipPercent.toFixed(2)}%`))
  const ownershipRow = worksheet.addRow(ownershipValues)
  ownershipRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) {
      cell.fill = primaryFill
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    }
  })

  worksheet.addRow([]) // Empty row separator

  // Previously Distributed row
  const prevDistributedValues = ['✓', 'Previously Distributed', formatCurrency(data.historySummary?.totalDistributed || 0)]
  allocations.forEach(a => {
    const previouslyDistributed = data.cumulativeDistributed[a.investorId] || a.previouslyDistributed || 0
    prevDistributedValues.push(previouslyDistributed > 0 ? formatCurrency(previouslyDistributed) : '-')
  })
  const prevDistributedRow = worksheet.addRow(prevDistributedValues)
  prevDistributedRow.eachCell((cell, colNumber) => {
    cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    if (colNumber > 1 && cell.value !== '-') cell.font = { color: { argb: 'FF6366F1' } } // Indigo color
  })

  worksheet.addRow([]) // Empty row separator

  // Distribution Breakdown Section Header
  const breakdownHeaderRow = worksheet.addRow(['', 'DISTRIBUTION BREAKDOWN'])
  breakdownHeaderRow.getCell(2).font = { bold: true, size: 12 }
  breakdownHeaderRow.getCell(2).fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFDBEAFE' } }
  worksheet.mergeCells(breakdownHeaderRow.number, 2, breakdownHeaderRow.number, 3 + numInvestors)

  // NOI row (if > 0)
  if (data.noi > 0) {
    const noiValues = ['✓', 'Net Operating Income (NOI)', formatCurrency(data.noi)]
    allocations.forEach(a => {
      noiValues.push(formatCurrency(data.noi * (a.ownershipPercent / 100)))
    })
    const noiRow = worksheet.addRow(noiValues)
    noiRow.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      if (colNumber > 2) cell.font = { color: { argb: 'FF3B82F6' } } // Blue
    })
  }

  // Refinancing Proceeds row (if > 0)
  if (data.refinancingProceeds > 0) {
    const refinancingValues = ['✓', 'Refinancing Proceeds', formatCurrency(data.refinancingProceeds)]
    allocations.forEach(a => {
      refinancingValues.push(formatCurrency(data.refinancingProceeds * (a.ownershipPercent / 100)))
    })
    const refinancingRow = worksheet.addRow(refinancingValues)
    refinancingRow.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      if (colNumber > 2) cell.font = { color: { argb: 'FF16A34A' } } // Green
    })
  }

  // Bank Interest row (if > 0)
  if (data.bankInterest > 0) {
    const bankInterestValues = ['✓', 'Bank Interest', formatCurrency(data.bankInterest)]
    allocations.forEach(a => {
      bankInterestValues.push(formatCurrency(data.bankInterest * (a.ownershipPercent / 100)))
    })
    const bankInterestRow = worksheet.addRow(bankInterestValues)
    bankInterestRow.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      if (colNumber > 2) cell.font = { color: { argb: 'FF9333EA' } } // Purple
    })
  }

  // Asset Disposal row (if > 0)
  if (data.assetDisposal > 0) {
    const assetDisposalValues = ['✓', 'Asset Disposal', formatCurrency(data.assetDisposal)]
    allocations.forEach(a => {
      assetDisposalValues.push(formatCurrency(data.assetDisposal * (a.ownershipPercent / 100)))
    })
    const assetDisposalRow = worksheet.addRow(assetDisposalValues)
    assetDisposalRow.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      if (colNumber > 2) cell.font = { color: { argb: 'FFEA580C' } } // Orange
    })
  }

  // Total Distribution row
  const totalDistValues = ['✓', 'TOTAL DISTRIBUTION', formatCurrency(data.totalDistributionAmount)]
  allocations.forEach(a => totalDistValues.push(formatCurrency(a.baseAllocation)))
  const totalDistRow = worksheet.addRow(totalDistValues)
  totalDistRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) {
      cell.fill = totalFill
      cell.font = { bold: true, color: { argb: 'FF166534' } }
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    }
  })

  // Reinvestment row (if any)
  if (data.reinvestment > 0) {
    const reinvestValues = ['', 'Reinvestment', `-${formatCurrency(data.reinvestment)}`]
    allocations.forEach(a => {
      const reinvestAmount = a.reinvestmentAmount || 0
      reinvestValues.push(reinvestAmount > 0 ? `-${formatCurrency(reinvestAmount)}` : '-')
    })
    const reinvestRow = worksheet.addRow(reinvestValues)
    reinvestRow.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      if (colNumber > 2 && cell.value !== '-') cell.font = { color: { argb: 'FFEA580C' } } // Orange
    })
  }

  // Net to Investor row
  const netToInvestorValues = ['✓', 'NET TO INVESTOR', '']
  let totalNetToInvestor = 0
  allocations.forEach(a => {
    const reinvestAmount = a.reinvestmentAmount || 0
    const netAmount = a.baseAllocation - reinvestAmount
    netToInvestorValues.push(formatCurrency(netAmount))
    totalNetToInvestor += netAmount
  })
  netToInvestorValues[2] = formatCurrency(totalNetToInvestor)
  const netToInvestorRow = worksheet.addRow(netToInvestorValues)
  netToInvestorRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) {
      cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE0E7FF' } } // Indigo-50
      cell.font = { bold: true, color: { argb: 'FF4338CA' } } // Indigo-700
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    }
  })

  // % of Commitment row
  const percentValues = ['', '% of Commitment', `${((data.totalDistributionAmount / (data.totalCommitment || 1)) * 100).toFixed(2)}%`]
  allocations.forEach(a => {
    percentValues.push(`${((a.baseAllocation / a.commitment) * 100).toFixed(2)}%`)
  })
  const percentRow = worksheet.addRow(percentValues)
  percentRow.eachCell((cell, colNumber) => {
    cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    cell.font = { italic: true, color: { argb: 'FF6B7280' } }
  })

  // Payout Type row
  const payoutTypeValues = ['', 'Payout Type', '']
  allocations.forEach(a => {
    const type = a.payoutType || 'cash'
    if (type === 'cash') {
      payoutTypeValues.push('Cash')
    } else if (type === 'reinvest') {
      payoutTypeValues.push('Reinvest')
    } else {
      payoutTypeValues.push(`Partial (${a.cashPercent || 0}% cash)`)
    }
  })
  const payoutTypeRow = worksheet.addRow(payoutTypeValues)
  payoutTypeRow.eachCell((cell, colNumber) => {
    cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    if (colNumber > 2) {
      const val = String(cell.value)
      if (val === 'Cash') {
        cell.font = { bold: true, color: { argb: 'FF16A34A' } } // Green
      } else if (val === 'Reinvest') {
        cell.font = { bold: true, color: { argb: 'FFEA580C' } } // Orange
      } else {
        cell.font = { bold: true, color: { argb: 'FF3B82F6' } } // Blue
      }
    }
  })

  // Total After This Distribution row
  const totalPreviouslyDistributed = data.historySummary?.totalDistributed || 0
  const totalAfterThis = totalPreviouslyDistributed + data.totalDistributionAmount
  const totalAfterValues = ['', 'Total Distributed After This', formatCurrency(totalAfterThis)]
  allocations.forEach(a => {
    const prevDistributed = data.cumulativeDistributed[a.investorId] || a.previouslyDistributed || 0
    totalAfterValues.push(formatCurrency(prevDistributed + a.baseAllocation))
  })
  const totalAfterRow = worksheet.addRow(totalAfterValues)
  totalAfterRow.eachCell((cell, colNumber) => {
    cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    if (colNumber > 1) cell.font = { color: { argb: 'FFD97706' } } // Amber color
  })

  // Add Historical Distributions section if there are previous distributions
  if (data.historicalDistributions.length > 0) {
    worksheet.addRow([]) // Empty row
    worksheet.addRow([]) // Empty row

    // Historical section header
    const histHeaderRow = worksheet.addRow(['', 'HISTORICAL DISTRIBUTIONS'])
    histHeaderRow.getCell(2).font = { bold: true, size: 14 }
    histHeaderRow.getCell(2).fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFDBEAFE' } }
    worksheet.mergeCells(histHeaderRow.number, 2, histHeaderRow.number, 3 + numInvestors)

    // Detailed breakdown for each historical distribution
    data.historicalDistributions.forEach((dist) => {
      worksheet.addRow([]) // Empty row separator

      // Distribution header
      const distHeaderRow = worksheet.addRow([
        '',
        `Distribution #${dist.distributionNumber} - ${new Date(dist.distributionDate).toLocaleDateString()}`,
        '',
        `Total: ${formatCurrency(dist.totalAmount || 0)}`,
        `Status: ${dist.status || 'N/A'}`
      ])
      distHeaderRow.getCell(2).font = { bold: true, size: 11 }
      distHeaderRow.getCell(2).fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF3F4F6' } }
      distHeaderRow.getCell(4).font = { bold: true }
      distHeaderRow.getCell(5).font = { bold: true, color: { argb: dist.status === 'Paid' ? 'FF16A34A' : 'FFD97706' } }

      // Check if this distribution has allocations
      if (dist.allocations && dist.allocations.length > 0) {
        const histAllocations = dist.allocations

        // Investor header row for this historical distribution
        const histInvestorHeaders = ['', 'Description', 'Total', ...histAllocations.map(a => a.investorName || 'Investor')]
        const histInvHeaderRow = worksheet.addRow(histInvestorHeaders)
        histInvHeaderRow.eachCell((cell, colNumber) => {
          if (colNumber > 1) {
            cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF374151' } }
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
            cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
          }
        })

        // Allocated Amount row
        const allocatedValues = ['', 'Allocated Amount', formatCurrency(histAllocations.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0))]
        histAllocations.forEach(a => allocatedValues.push(formatCurrency(a.allocatedAmount || 0)))
        const allocatedRow = worksheet.addRow(allocatedValues)
        allocatedRow.eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
          if (colNumber > 2) cell.font = { color: { argb: 'FF16A34A' } } // Green
        })

        // Reinvestment row (if any have reinvestment)
        const totalReinvest = histAllocations.reduce((sum, a) => sum + (a.reinvestmentAmount || 0), 0)
        if (totalReinvest > 0) {
          const reinvestValues = ['', 'Reinvestment', `-${formatCurrency(totalReinvest)}`]
          histAllocations.forEach(a => reinvestValues.push(a.reinvestmentAmount ? `-${formatCurrency(a.reinvestmentAmount)}` : '-'))
          const reinvestRow = worksheet.addRow(reinvestValues)
          reinvestRow.eachCell((cell, colNumber) => {
            cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
            if (colNumber > 2 && cell.value !== '-') cell.font = { color: { argb: 'FFEA580C' } }
          })
        }

        // Net Amount row
        const netValues = ['', 'Net Amount', formatCurrency(histAllocations.reduce((sum, a) => sum + ((a.allocatedAmount || 0) - (a.reinvestmentAmount || 0)), 0))]
        histAllocations.forEach(a => {
          const net = (a.allocatedAmount || 0) - (a.reinvestmentAmount || 0)
          netValues.push(formatCurrency(net))
        })
        const netRow = worksheet.addRow(netValues)
        netRow.eachCell((cell, colNumber) => {
          if (colNumber > 1) {
            cell.font = { bold: true }
            cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
          }
        })

        // Status row per investor
        const statusValues = ['', 'Status', '']
        histAllocations.forEach(a => statusValues.push(a.status || 'N/A'))
        const statusRow = worksheet.addRow(statusValues)
        statusRow.eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
          if (colNumber > 2) {
            const statusVal = String(cell.value)
            if (statusVal === 'Paid') {
              cell.font = { bold: true, color: { argb: 'FF16A34A' } }
            } else if (statusVal === 'Pending') {
              cell.font = { bold: true, color: { argb: 'FFD97706' } }
            } else {
              cell.font = { italic: true, color: { argb: 'FF6B7280' } }
            }
          }
        })
      } else {
        // No allocation details available - show simple row
        const simpleRow = worksheet.addRow(['', 'No detailed allocation data available for this distribution', '', '', ''])
        simpleRow.getCell(2).font = { italic: true, color: { argb: 'FF6B7280' } }
      }
    })

    worksheet.addRow([]) // Empty row
    worksheet.addRow([]) // Empty row

    // Summary section
    const summaryHeaderRow = worksheet.addRow(['', 'DISTRIBUTION SUMMARY'])
    summaryHeaderRow.getCell(2).font = { bold: true, size: 12 }
    summaryHeaderRow.getCell(2).fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFD1FAE5' } }
    worksheet.mergeCells(summaryHeaderRow.number, 2, summaryHeaderRow.number, 5)

    const percentDistributed = data.totalCommitment > 0 ? (totalAfterThis / data.totalCommitment * 100).toFixed(2) : '0.00'

    worksheet.addRow(['', 'Total Previously Distributed:', formatCurrency(totalPreviouslyDistributed)])
    worksheet.addRow(['', 'This Distribution:', formatCurrency(data.totalDistributionAmount)])

    const totalAfterSummaryRow = worksheet.addRow(['', 'Total After This Distribution:', formatCurrency(totalAfterThis)])
    totalAfterSummaryRow.getCell(3).font = { bold: true }

    worksheet.addRow(['', '% of Commitment Distributed:', `${percentDistributed}%`])

    if (data.historySummary?.totalReinvested && data.historySummary.totalReinvested > 0) {
      const reinvestedRow = worksheet.addRow(['', 'Total Reinvested:', formatCurrency(data.historySummary.totalReinvested + data.reinvestment)])
      reinvestedRow.getCell(2).font = { bold: true }
      reinvestedRow.getCell(3).font = { bold: true, color: { argb: 'FFEA580C' } }
    }
  }

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Distribution_${data.distributionNumber}_${data.fundName.replace(/\s+/g, '_')}.xlsx`
  link.click()
  window.URL.revokeObjectURL(url)
}
