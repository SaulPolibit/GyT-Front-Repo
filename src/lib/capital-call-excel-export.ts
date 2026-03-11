/**
 * Shared Capital Call Excel Export Utility
 * Used by both the capital call creation page and the approvals page
 */

import { formatCurrencyDetailed as formatCurrency } from '@/lib/format-utils'

// Types for the Excel export data
export interface InvestorAllocationExcel {
  investorId: string
  investorName: string
  commitment: number
  ownershipPercent: number
  callAmount: number
  feeDiscount: number
  vatExempt: boolean
  feeBreakdown?: {
    nicFee: number
    unfundedFee: number
  }
  grossFees?: number
  discountAmount?: number
  netFees?: number
  vatAmount?: number
  totalDue?: number
  previouslyCalled?: number
  investmentsAmount?: number
  fundExpensesAmount?: number
  reservesAmount?: number
  totalDrawdown?: number
  feeOffsetAmount?: number
  deemedGpContribution?: number
}

export interface FeeConfigExcel {
  selectedFees: {
    nicFee?: boolean
    unfundedFee?: boolean
  }
  feeRateOnNic: number
  feeRateOnUnfunded: number
  feePeriodMonths: number
  vatRate: number
  vatApplicable: boolean
}

export interface HistoricalCallAllocationExcel {
  investorId?: string
  investorName: string
  principalAmount: number
  managementFee?: number
  vatAmount?: number
  totalDue: number
  paidAmount?: number
  remainingAmount?: number
  status?: string
}

export interface HistoricalCallExcel {
  id?: string
  callNumber: number
  callDate: string
  totalCallAmount: number
  totalPaidAmount?: number
  status?: string
  approvalStatus?: string
  allocations?: HistoricalCallAllocationExcel[]
}

export interface CapitalCallExcelData {
  fundName: string
  callNumber: number
  callDate: string
  noticeDate: string
  deadlineDate: string
  currency: string
  totalCallAmount: number
  totalCommitment: number
  allocations: InvestorAllocationExcel[]
  feeConfig: FeeConfigExcel
  historicalCalls: HistoricalCallExcel[]
  historySummary: {
    totalCalled: number
    percentCalled?: string
  }
  cumulativeCalled: Record<string, number>
  totalInvestments?: number
  totalFundExpenses?: number
  totalReserves?: number
  totalDrawdown?: number
  gpPercentage?: number
}


// Fee calculation function (matches the one in creation page)
export function calculateInvestorFeesForExcel(
  callAmount: number,
  feeDiscount: number,
  vatExempt: boolean,
  feeConfig: FeeConfigExcel,
  previouslyCalled: number = 0,
  commitment: number = 0,
  gpPercentage: number = 0
): {
  feeBreakdown: { nicFee: number; unfundedFee: number }
  grossFees: number
  discountAmount: number
  feesAfterDiscount: number
  feeOffset: number
  deemedGpContribution: number
  netFees: number
  vatAmount: number
  totalDue: number
} {
  const periodMultiplier = feeConfig.feePeriodMonths / 12
  const unfundedCommitment = Math.max(0, commitment - previouslyCalled)
  const nicFee = feeConfig.selectedFees.nicFee
    ? previouslyCalled * (feeConfig.feeRateOnNic / 100) * periodMultiplier
    : 0
  const unfundedFee = feeConfig.selectedFees.unfundedFee
    ? unfundedCommitment * (feeConfig.feeRateOnUnfunded / 100) * periodMultiplier
    : 0
  const grossFees = nicFee + unfundedFee
  const discountAmount = grossFees * (feeDiscount / 100)
  const feesAfterDiscount = grossFees - discountAmount
  const feeOffset = gpPercentage > 0 ? feesAfterDiscount * (gpPercentage / 100) : 0
  const deemedGpContribution = -feeOffset
  const netFees = feesAfterDiscount - feeOffset
  const vatAmount = vatExempt ? 0 : (feeConfig.vatApplicable ? netFees * (feeConfig.vatRate / 100) : 0)
  const totalDue = callAmount + netFees + vatAmount
  return {
    feeBreakdown: { nicFee, unfundedFee },
    grossFees, discountAmount, feesAfterDiscount, feeOffset,
    deemedGpContribution, netFees, vatAmount, totalDue
  }
}

// Convert 1-based column index to Excel column letter
function colLetter(col: number): string {
  let result = ''
  let c = col
  while (c > 0) {
    c--
    result = String.fromCharCode(65 + (c % 26)) + result
    c = Math.floor(c / 26)
  }
  return result
}

// Get ExcelJS number format string for the given currency
function getCurrencyFormat(currency: string): string {
  const symbols: Record<string, string> = {
    'USD': '$', 'MXN': 'MX$', 'EUR': '€', 'GBP': '£', 'GTQ': 'Q',
    'PAB': 'B/.', 'COP': 'COL$', 'BRL': 'R$', 'PEN': 'S/',
  }
  const sym = symbols[currency] || currency || '$'
  return `"${sym}"#,##0.00`
}

/**
 * Generate and download a Capital Call Excel file (ProximityParks format)
 */
export async function generateCapitalCallExcel(data: CapitalCallExcelData): Promise<void> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'PoliBit'
  workbook.created = new Date()
  workbook.calcProperties = { fullCalcOnLoad: true }

  const worksheet = workbook.addWorksheet(`Capital Call #${data.callNumber}`)

  const allocations = data.allocations
  const numInvestors = allocations.length
  const feeConfig = data.feeConfig
  const currFmt = getCurrencyFormat(data.currency)
  const pctFmt = '0.00%'

  const hasSelectedFees = feeConfig.selectedFees.nicFee || feeConfig.selectedFees.unfundedFee

  // Column layout: A=1(checkmark), B=2(description), C=3(total), D+=investors
  const totalCol = 3
  const firstInvCol = 4
  const lastInvCol = 3 + numInvestors

  const sumFormula = (rowNum: number) =>
    `SUM(${colLetter(firstInvCol)}${rowNum}:${colLetter(lastInvCol)}${rowNum})`

  worksheet.columns = [
    { width: 5 },
    { width: 40 },
    { width: 18 },
    ...allocations.map(() => ({ width: 18 }))
  ]

  // Styling constants (ProximityParks)
  const navyFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1a1a2e' } }
  const navyFont = { bold: true, color: { argb: 'FFFFFFFF' } }
  const greenColor = { argb: 'FF16A34A' }
  const blueBarFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFDBEAFE' } }
  const thinBorder = { style: 'thin' as const, color: { argb: 'FF374151' } }
  const thickBorder = { style: 'medium' as const, color: { argb: 'FF000000' } }

  // Helper: add navy separator row
  const addSeparatorRow = (label1: string, label2: string, dateStr: string) => {
    const sepData: any[] = [label1, label2, dateStr]
    for (let i = 0; i < numInvestors; i++) sepData.push('')
    const row = worksheet.addRow(sepData)
    row.eachCell((cell, colNumber) => {
      cell.fill = navyFill
      cell.font = navyFont
      cell.alignment = { horizontal: colNumber <= 2 ? 'left' : 'center' }
    })
    return row
  }

  // Helper: add dash row (placeholder)
  const addDashRow = (checkmark: string, label: string, italic = false) => {
    const rowData: any[] = [checkmark, label, '-']
    for (let i = 0; i < numInvestors; i++) rowData.push('-')
    const row = worksheet.addRow(rowData)
    row.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      if (italic && colNumber === 2) cell.font = { italic: true }
    })
    return row
  }

  // === HEADER SECTION ===
  const titleRow = worksheet.addRow(['', data.fundName])
  titleRow.getCell(2).font = { bold: true, size: 14 }
  worksheet.mergeCells(1, 2, 1, 3 + numInvestors)

  // Investor header row (dark navy)
  const investorHeaders = ['', 'Investor', 'Total', ...allocations.map(a => a.investorName)]
  const invHeaderRow = worksheet.addRow(investorHeaders)
  invHeaderRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) {
      cell.fill = navyFill
      cell.font = navyFont
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    }
  })

  // === SOURCE DATA ROWS (white background) ===

  // Commitment row (green text)
  const commitmentRowData: (string | number | null)[] = ['', 'Commitment', null]
  allocations.forEach(a => commitmentRowData.push(a.commitment))
  const commitmentRow = worksheet.addRow(commitmentRowData)
  commitmentRow.getCell(totalCol).value = { formula: sumFormula(commitmentRow.number) }
  commitmentRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      if (colNumber >= totalCol) {
        cell.numFmt = currFmt
        cell.font = { bold: colNumber === totalCol, color: greenColor }
      }
      if (colNumber === 2) cell.font = { bold: true }
    }
  })

  // Ownership % row
  const ownershipRowData: (string | number | null)[] = ['', 'Ownership', 1]
  allocations.forEach(a => ownershipRowData.push(a.ownershipPercent / 100))
  const ownershipRow = worksheet.addRow(ownershipRowData)
  ownershipRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      if (colNumber >= totalCol) cell.numFmt = pctFmt
      if (colNumber === 2) cell.font = { bold: true }
    }
  })

  // Fee Discount row (italic, green values)
  const discountRowData: (string | number | null)[] = ['', 'Fees Discount', '']
  allocations.forEach(a => discountRowData.push((a.feeDiscount || 0) / 100))
  const discountRow = worksheet.addRow(discountRowData)
  discountRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      if (colNumber === 2) cell.font = { bold: true, italic: true }
      if (colNumber > 2) {
        cell.numFmt = pctFmt
        cell.font = { italic: true, color: greenColor }
      }
    }
  })

  // === HISTORICAL CALLS (flat format, same structure as current call) ===
  data.historicalCalls.forEach((call) => {
    const dateFormatted = new Date(call.callDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })

    // Navy separator row
    addSeparatorRow('NIC', `DN${call.callNumber}`, dateFormatted)

    if (call.allocations && call.allocations.length > 0) {
      const histAllocs = call.allocations

      // Helper: find historical allocation matching an investor from the current call
      const matchAlloc = (investorId: string) =>
        histAllocs.find(a => a.investorId === investorId)

      // Unfunded Commitments — show "-" (we don't track per-call unfunded for historical)
      addDashRow('✓', 'Unfunded Commitments')

      // Net Invested Capital — show "-"
      addDashRow('✓', 'Net Invested Capital')

      // Total Reserves
      addDashRow('', 'Total Reserves')

      // Investments (= principalAmount, green)
      const invValues: (string | number)[] = ['✓', 'Investments', formatCurrency(histAllocs.reduce((s, a) => s + (a.principalAmount || 0), 0))]
      allocations.forEach(inv => { const a = matchAlloc(inv.investorId); invValues.push(a ? formatCurrency(a.principalAmount || 0) : '-') })
      const invRow = worksheet.addRow(invValues)
      invRow.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
        if (colNumber > 2) cell.font = { bold: true, color: greenColor }
      })

      // VAT Applicable (placeholder after investments)
      addDashRow('', 'VAT Applicable', true)

      // Fund Expenses
      addDashRow('', 'Fund Expenses')

      // VAT Applicable (placeholder after expenses)
      addDashRow('', 'VAT Applicable', true)

      // Reserves
      addDashRow('', 'Reserves')

      // Management Fees (= managementFee from historical data)
      const totalMgmtFee = histAllocs.reduce((s, a) => s + (a.managementFee || 0), 0)
      if (totalMgmtFee > 0) {
        const feeValues: (string | number)[] = ['✓', 'Net Invested Capital Mgt Fees', '-']
        for (let i = 0; i < numInvestors; i++) feeValues.push('-')
        worksheet.addRow(feeValues).eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
        })

        const unfFeeValues: (string | number)[] = ['✓', 'Unfunded Commitments Mgt Fees', formatCurrency(totalMgmtFee)]
        allocations.forEach(inv => { const a = matchAlloc(inv.investorId); unfFeeValues.push(a ? formatCurrency(a.managementFee || 0) : '-') })
        worksheet.addRow(unfFeeValues).eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
        })
      } else {
        addDashRow('✓', 'Net Invested Capital Mgt Fees')
        addDashRow('✓', 'Unfunded Commitments Mgt Fees')
      }

      // Invested Capital (after IP)
      addDashRow('✓', 'Invested Capital (after IP)', true)

      // Fee Offset
      const feeOffsetHistRow = addDashRow('', 'Fee Offset')
      feeOffsetHistRow.eachCell((cell, colNumber) => {
        if (colNumber > 1) cell.fill = blueBarFill
      })

      // VAT Applicable (main)
      const totalVat = histAllocs.reduce((s, a) => s + (a.vatAmount || 0), 0)
      if (totalVat > 0) {
        const vatValues: (string | number)[] = ['✓', 'VAT Applicable', formatCurrency(totalVat)]
        allocations.forEach(inv => { const a = matchAlloc(inv.investorId); vatValues.push(a ? formatCurrency(a.vatAmount || 0) : '-') })
        const vatHistRow = worksheet.addRow(vatValues)
        vatHistRow.eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
          if (colNumber === 2) cell.font = { italic: true }
        })
      } else {
        const vr = addDashRow('✓', 'VAT Applicable', true)
        vr.eachCell(() => {})
      }

      // Deemed GP Contributions
      addDashRow('✓', 'Deemed GP Contributions', true)

      // Total Drawdown (bold, thick top border)
      const tdValues: (string | number)[] = ['✓', 'Total Drawdown', formatCurrency(histAllocs.reduce((s, a) => s + (a.totalDue || 0), 0))]
      allocations.forEach(inv => { const a = matchAlloc(inv.investorId); tdValues.push(a ? formatCurrency(a.totalDue || 0) : '-') })
      const tdRow = worksheet.addRow(tdValues)
      tdRow.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
        cell.font = { bold: true }
        cell.border = { top: thickBorder }
      })

      // Total Drawdown (%) — italic green
      const tdPctValues: (string | number)[] = ['', 'Total Drawdown (%)', '100.00%']
      const histTotalDue = histAllocs.reduce((s, a) => s + (a.totalDue || 0), 0)
      allocations.forEach(inv => {
        const a = matchAlloc(inv.investorId)
        tdPctValues.push(a && histTotalDue > 0 ? `${((a.totalDue / histTotalDue) * 100).toFixed(2)}%` : '0.00%')
      })
      const tdPctRow = worksheet.addRow(tdPctValues)
      tdPctRow.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
        cell.font = { italic: true, color: greenColor }
      })

      // Payment tracking rows (Amount Paid, Outstanding, Status)
      const paidValues: (string | number)[] = ['', 'Amount Paid', formatCurrency(histAllocs.reduce((s, a) => s + (a.paidAmount || 0), 0))]
      allocations.forEach(inv => { const a = matchAlloc(inv.investorId); paidValues.push(a ? formatCurrency(a.paidAmount || 0) : '-') })
      const paidRow = worksheet.addRow(paidValues)
      paidRow.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
        if (colNumber > 2) cell.font = { color: greenColor }
      })

      const totalRemaining = histAllocs.reduce((s, a) => s + (a.remainingAmount || 0), 0)
      if (totalRemaining > 0) {
        const remValues: (string | number)[] = ['', 'Outstanding', formatCurrency(totalRemaining)]
        allocations.forEach(inv => { const a = matchAlloc(inv.investorId); remValues.push(a && a.remainingAmount && a.remainingAmount > 0 ? formatCurrency(a.remainingAmount) : '-') })
        const remRow = worksheet.addRow(remValues)
        remRow.eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
          if (colNumber > 2 && cell.value !== '-') cell.font = { color: { argb: 'FFD97706' } }
        })
      }

      const statusValues: (string | number)[] = ['', 'Status', '']
      allocations.forEach(inv => { const a = matchAlloc(inv.investorId); statusValues.push(a?.status || 'N/A') })
      const statusRow = worksheet.addRow(statusValues)
      statusRow.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
        if (colNumber > 2) {
          const sv = String(cell.value)
          if (sv === 'Fully Paid' || sv === 'Paid') cell.font = { bold: true, color: greenColor }
          else if (sv === 'Partially Paid') cell.font = { bold: true, color: { argb: 'FFD97706' } }
          else cell.font = { italic: true, color: { argb: 'FF6B7280' } }
        }
      })
    } else {
      const simpleRow = worksheet.addRow(['', 'No detailed allocation data available for this call'])
      simpleRow.getCell(2).font = { italic: true, color: { argb: 'FF6B7280' } }
    }
  })

  // === CURRENT CALL ===
  const currentDateFormatted = new Date(data.callDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
  addSeparatorRow('NIC', `DN${data.callNumber}`, currentDateFormatted)

  // Unfunded Commitments (FORMULA: commitment - NIC)
  const unfundedRow = worksheet.addRow(['✓', 'Unfunded Commitments'])

  // Net Invested Capital (source data)
  const nicRowData: (string | number | null)[] = ['✓', 'Net Invested Capital', null]
  allocations.forEach(a => {
    const prev = data.cumulativeCalled[a.investorId] || a.previouslyCalled || 0
    nicRowData.push(prev)
  })
  const nicRow = worksheet.addRow(nicRowData)
  nicRow.getCell(totalCol).value = { formula: sumFormula(nicRow.number) }
  nicRow.eachCell((cell, colNumber) => {
    cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    if (colNumber >= totalCol) cell.numFmt = currFmt
  })

  // Set Unfunded formulas
  for (let i = 0; i < numInvestors; i++) {
    const col = colLetter(firstInvCol + i)
    const cell = unfundedRow.getCell(firstInvCol + i)
    cell.value = { formula: `${col}${commitmentRow.number}-${col}${nicRow.number}` }
    cell.numFmt = currFmt
  }
  unfundedRow.getCell(totalCol).value = { formula: `${colLetter(totalCol)}${commitmentRow.number}-${colLetter(totalCol)}${nicRow.number}` }
  unfundedRow.getCell(totalCol).numFmt = currFmt
  unfundedRow.eachCell((cell, colNumber) => {
    cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
  })

  // Total Reserves (total = raw, investors = formula)
  const totalReservesRow = worksheet.addRow(['', 'Total Reserves', data.totalReserves || 0])
  totalReservesRow.getCell(totalCol).numFmt = currFmt
  for (let i = 0; i < numInvestors; i++) {
    const col = colLetter(firstInvCol + i)
    const cell = totalReservesRow.getCell(firstInvCol + i)
    if ((data.totalReserves || 0) > 0) {
      cell.value = { formula: `$${colLetter(totalCol)}$${totalReservesRow.number}*${col}${ownershipRow.number}` }
    } else {
      cell.value = '-'
    }
    if (typeof cell.value !== 'string') cell.numFmt = currFmt
  }
  totalReservesRow.eachCell((cell, colNumber) => {
    cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
  })

  // Adjusted NIC (only for subsequent calls)
  if ((data.historySummary?.totalCalled || 0) > 0) {
    const adjustedNicRow = worksheet.addRow(['✓', 'Adjusted Net Invested Capital'])
    adjustedNicRow.getCell(totalCol).value = { formula: `${colLetter(totalCol)}${nicRow.number}` }
    adjustedNicRow.getCell(totalCol).numFmt = currFmt
    for (let i = 0; i < numInvestors; i++) {
      const col = colLetter(firstInvCol + i)
      const cell = adjustedNicRow.getCell(firstInvCol + i)
      cell.value = { formula: `${col}${nicRow.number}` }
      cell.numFmt = currFmt
    }
    adjustedNicRow.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    })
  }

  // Investments row (green text)
  const hasBreakdown = !!data.totalInvestments
  const investmentsRow = worksheet.addRow(['✓', 'Investments'])
  if (hasBreakdown) {
    investmentsRow.getCell(totalCol).value = data.totalInvestments!
    investmentsRow.getCell(totalCol).numFmt = currFmt
    for (let i = 0; i < numInvestors; i++) {
      const col = colLetter(firstInvCol + i)
      const cell = investmentsRow.getCell(firstInvCol + i)
      cell.value = { formula: `$${colLetter(totalCol)}$${investmentsRow.number}*${col}${ownershipRow.number}` }
      cell.numFmt = currFmt
    }
  } else {
    for (let i = 0; i < numInvestors; i++) {
      investmentsRow.getCell(firstInvCol + i).value = allocations[i].callAmount
      investmentsRow.getCell(firstInvCol + i).numFmt = currFmt
    }
    investmentsRow.getCell(totalCol).value = { formula: sumFormula(investmentsRow.number) }
    investmentsRow.getCell(totalCol).numFmt = currFmt
  }
  investmentsRow.eachCell((cell, colNumber) => {
    cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    if (colNumber > 2) cell.font = { bold: true, color: greenColor }
  })

  // VAT Applicable placeholder (after investments, italic)
  addDashRow('', 'VAT Applicable', true)

  // Fund Expenses (conditional)
  let expensesRow: any = null
  if (data.totalFundExpenses && data.totalFundExpenses > 0) {
    expensesRow = worksheet.addRow(['✓', 'Fund Expenses'])
    expensesRow.getCell(totalCol).value = data.totalFundExpenses
    expensesRow.getCell(totalCol).numFmt = currFmt
    for (let i = 0; i < numInvestors; i++) {
      const col = colLetter(firstInvCol + i)
      const cell = expensesRow.getCell(firstInvCol + i)
      cell.value = { formula: `$${colLetter(totalCol)}$${expensesRow.number}*${col}${ownershipRow.number}` }
      cell.numFmt = currFmt
    }
    expensesRow.eachCell((cell: any, colNumber: number) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    })
  } else {
    addDashRow('', 'Fund Expenses')
  }

  // VAT Applicable placeholder (after expenses, italic)
  addDashRow('', 'VAT Applicable', true)

  // Reserves breakdown (conditional)
  let reservesBreakdownRow: any = null
  if (data.totalReserves && data.totalReserves > 0) {
    reservesBreakdownRow = worksheet.addRow(['✓', 'Reserves'])
    reservesBreakdownRow.getCell(totalCol).value = data.totalReserves
    reservesBreakdownRow.getCell(totalCol).numFmt = currFmt
    for (let i = 0; i < numInvestors; i++) {
      const col = colLetter(firstInvCol + i)
      const cell = reservesBreakdownRow.getCell(firstInvCol + i)
      cell.value = { formula: `$${colLetter(totalCol)}$${reservesBreakdownRow.number}*${col}${ownershipRow.number}` }
      cell.numFmt = currFmt
    }
    reservesBreakdownRow.eachCell((cell: any, colNumber: number) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    })
  } else {
    addDashRow('', 'Reserves')
  }

  // === FEE ROWS ===
  let nicFeeRow: any = null
  let unfundedFeeRow: any = null
  let feeOffsetRow: any = null
  let vatRow: any = null
  let totalDrawdownRow: any = null

  if (hasSelectedFees) {
    const gpPercentage = data.gpPercentage || 0
    const periodMultiplier = feeConfig.feePeriodMonths / 12

    // NIC Mgt Fees
    if (feeConfig.selectedFees.nicFee && feeConfig.feeRateOnNic) {
      const rateVal = (feeConfig.feeRateOnNic / 100) * periodMultiplier
      nicFeeRow = worksheet.addRow(['✓', 'Net Invested Capital Mgt Fees'])
      for (let i = 0; i < numInvestors; i++) {
        const col = colLetter(firstInvCol + i)
        const cell = nicFeeRow.getCell(firstInvCol + i)
        cell.value = { formula: `${col}${nicRow.number}*${rateVal}*(1-${col}${discountRow.number})` }
        cell.numFmt = currFmt
      }
      nicFeeRow.getCell(totalCol).value = { formula: sumFormula(nicFeeRow.number) }
      nicFeeRow.getCell(totalCol).numFmt = currFmt
      nicFeeRow.eachCell((cell: any, colNumber: number) => {
        cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      })
    } else {
      addDashRow('✓', 'Net Invested Capital Mgt Fees')
    }

    // Unfunded Mgt Fees
    if (feeConfig.selectedFees.unfundedFee && feeConfig.feeRateOnUnfunded) {
      const rateVal = (feeConfig.feeRateOnUnfunded / 100) * periodMultiplier
      unfundedFeeRow = worksheet.addRow(['✓', 'Unfunded Commitments Mgt Fees'])
      for (let i = 0; i < numInvestors; i++) {
        const col = colLetter(firstInvCol + i)
        const cell = unfundedFeeRow.getCell(firstInvCol + i)
        cell.value = { formula: `${col}${unfundedRow.number}*${rateVal}*(1-${col}${discountRow.number})` }
        cell.numFmt = currFmt
      }
      unfundedFeeRow.getCell(totalCol).value = { formula: sumFormula(unfundedFeeRow.number) }
      unfundedFeeRow.getCell(totalCol).numFmt = currFmt
      unfundedFeeRow.eachCell((cell: any, colNumber: number) => {
        cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      })
    } else {
      addDashRow('✓', 'Unfunded Commitments Mgt Fees')
    }

    // Invested Capital (after IP) — italic placeholder
    const icRow = addDashRow('✓', 'Invested Capital (after IP)', true)
    icRow.eachCell(() => {})

    // Fee Offset (light blue bar)
    feeOffsetRow = worksheet.addRow(['', 'Fee Offset'])
    if (gpPercentage > 0) {
      const gpRate = gpPercentage / 100
      for (let i = 0; i < numInvestors; i++) {
        const col = colLetter(firstInvCol + i)
        const cell = feeOffsetRow.getCell(firstInvCol + i)
        const feeParts: string[] = []
        if (nicFeeRow) feeParts.push(`${col}${nicFeeRow.number}`)
        if (unfundedFeeRow) feeParts.push(`${col}${unfundedFeeRow.number}`)
        if (feeParts.length > 0) {
          cell.value = { formula: `-(${feeParts.join('+')})*${gpRate}` }
        } else {
          cell.value = 0
        }
        cell.numFmt = currFmt
      }
      feeOffsetRow.getCell(totalCol).value = { formula: sumFormula(feeOffsetRow.number) }
      feeOffsetRow.getCell(totalCol).numFmt = currFmt
    } else {
      for (let i = 0; i < numInvestors; i++) {
        feeOffsetRow.getCell(firstInvCol + i).value = '-'
      }
      feeOffsetRow.getCell(totalCol).value = '-'
    }
    feeOffsetRow.eachCell((cell: any, colNumber: number) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      if (colNumber > 1) cell.fill = blueBarFill
    })

    // VAT Applicable (main VAT row, italic label)
    if (feeConfig.vatApplicable && feeConfig.vatRate > 0) {
      const vatRateVal = feeConfig.vatRate / 100
      vatRow = worksheet.addRow(['✓', `VAT Applicable`])
      vatRow.getCell(2).font = { italic: true }
      for (let i = 0; i < numInvestors; i++) {
        const col = colLetter(firstInvCol + i)
        const cell = vatRow.getCell(firstInvCol + i)
        if (allocations[i].vatExempt) {
          cell.value = 0
          cell.note = 'VAT Exempt'
        } else {
          const feeParts: string[] = []
          if (nicFeeRow) feeParts.push(`${col}${nicFeeRow.number}`)
          if (unfundedFeeRow) feeParts.push(`${col}${unfundedFeeRow.number}`)
          if (gpPercentage > 0) feeParts.push(`${col}${feeOffsetRow.number}`)
          if (feeParts.length > 0) {
            cell.value = { formula: `(${feeParts.join('+')})*${vatRateVal}` }
          } else {
            cell.value = 0
          }
        }
        cell.numFmt = currFmt
      }
      vatRow.getCell(totalCol).value = { formula: sumFormula(vatRow.number) }
      vatRow.getCell(totalCol).numFmt = currFmt
      vatRow.eachCell((cell: any, colNumber: number) => {
        cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      })
    } else {
      addDashRow('✓', 'VAT Applicable', true)
    }

    // Deemed GP Contributions (italic)
    const deemedGpRow = worksheet.addRow(['✓', 'Deemed GP Contributions'])
    deemedGpRow.getCell(2).font = { italic: true }
    for (let i = 0; i < numInvestors; i++) {
      const col = colLetter(firstInvCol + i)
      const cell = deemedGpRow.getCell(firstInvCol + i)
      if (gpPercentage > 0) {
        cell.value = { formula: `${col}${feeOffsetRow.number}` }
        cell.numFmt = currFmt
      } else {
        cell.value = '-'
      }
    }
    if (gpPercentage > 0) {
      deemedGpRow.getCell(totalCol).value = { formula: sumFormula(deemedGpRow.number) }
      deemedGpRow.getCell(totalCol).numFmt = currFmt
    } else {
      deemedGpRow.getCell(totalCol).value = '-'
    }
    deemedGpRow.eachCell((cell: any, colNumber: number) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    })

    // TOTAL DRAWDOWN (bold, thick top border, no fill)
    totalDrawdownRow = worksheet.addRow(['✓', 'Total Drawdown'])
    for (let i = 0; i < numInvestors; i++) {
      const col = colLetter(firstInvCol + i)
      const cell = totalDrawdownRow.getCell(firstInvCol + i)
      const parts: string[] = [`${col}${investmentsRow.number}`]
      if (expensesRow) parts.push(`${col}${expensesRow.number}`)
      if (reservesBreakdownRow) parts.push(`${col}${reservesBreakdownRow.number}`)
      if (nicFeeRow) parts.push(`${col}${nicFeeRow.number}`)
      if (unfundedFeeRow) parts.push(`${col}${unfundedFeeRow.number}`)
      if (gpPercentage > 0) parts.push(`${col}${feeOffsetRow.number}`)
      if (vatRow) parts.push(`${col}${vatRow.number}`)
      cell.value = { formula: parts.join('+') }
      cell.numFmt = currFmt
    }
    totalDrawdownRow.getCell(totalCol).value = { formula: sumFormula(totalDrawdownRow.number) }
    totalDrawdownRow.getCell(totalCol).numFmt = currFmt
    totalDrawdownRow.eachCell((cell: any, colNumber: number) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      cell.font = { bold: true }
      cell.border = { top: thickBorder }
    })
  } else {
    // No fees — show placeholder rows then Total Drawdown
    addDashRow('✓', 'Net Invested Capital Mgt Fees')
    addDashRow('✓', 'Unfunded Commitments Mgt Fees')
    addDashRow('✓', 'Invested Capital (after IP)', true)
    const foRow = addDashRow('', 'Fee Offset')
    foRow.eachCell((cell: any, colNumber: number) => { if (colNumber > 1) cell.fill = blueBarFill })
    addDashRow('✓', 'VAT Applicable', true)
    addDashRow('✓', 'Deemed GP Contributions', true)

    totalDrawdownRow = worksheet.addRow(['✓', 'Total Drawdown'])
    for (let i = 0; i < numInvestors; i++) {
      const col = colLetter(firstInvCol + i)
      const cell = totalDrawdownRow.getCell(firstInvCol + i)
      const parts: string[] = [`${col}${investmentsRow.number}`]
      if (expensesRow) parts.push(`${col}${expensesRow.number}`)
      if (reservesBreakdownRow) parts.push(`${col}${reservesBreakdownRow.number}`)
      cell.value = { formula: parts.join('+') }
      cell.numFmt = currFmt
    }
    totalDrawdownRow.getCell(totalCol).value = { formula: sumFormula(totalDrawdownRow.number) }
    totalDrawdownRow.getCell(totalCol).numFmt = currFmt
    totalDrawdownRow.eachCell((cell: any, colNumber: number) => {
      cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
      cell.font = { bold: true }
      cell.border = { top: thickBorder }
    })
  }

  // Total Drawdown (%) — italic green
  const tdPctRow = worksheet.addRow(['', 'Total Drawdown (%)'])
  for (let i = 0; i < numInvestors; i++) {
    const col = colLetter(firstInvCol + i)
    const cell = tdPctRow.getCell(firstInvCol + i)
    cell.value = { formula: `${col}${totalDrawdownRow.number}/${colLetter(totalCol)}${totalDrawdownRow.number}` }
    cell.numFmt = pctFmt
  }
  tdPctRow.getCell(totalCol).value = 1
  tdPctRow.getCell(totalCol).numFmt = pctFmt
  tdPctRow.eachCell((cell, colNumber) => {
    cell.alignment = { horizontal: colNumber > 2 ? 'right' : 'left' }
    cell.font = { italic: true, color: greenColor }
  })

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Capital_Call_${data.callNumber}_${data.fundName.replace(/\s+/g, '_')}.xlsx`
  link.click()
  window.URL.revokeObjectURL(url)
}
