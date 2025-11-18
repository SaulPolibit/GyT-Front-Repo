import ExcelJS from 'exceljs'
import type { PerformanceMethodology } from './types'
import type { Structure } from './structures-storage'
import {
  calculateFundPerformance,
  getFundCashFlows,
  getInvestmentCashFlows,
  type PerformanceMetrics
} from './ilpa-performance-calculations'

export async function generateILPAPerformanceTemplate(
  fund: Structure,
  methodology: PerformanceMethodology,
  asOfDate: Date = new Date()
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'Polibit'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.lastModifiedBy = 'Polibit'

  const performance = calculateFundPerformance(fund, asOfDate)
  const cashFlows = getFundCashFlows(fund.id)
  const investmentCashFlows = getInvestmentCashFlows(fund.id)

  const worksheet = workbook.addWorksheet('Performance Report')

  worksheet.getColumn('A').width = 35
  worksheet.getColumn('B').width = 20
  worksheet.getColumn('C').width = 20
  worksheet.getColumn('D').width = 20
  worksheet.getColumn('E').width = 20

  let currentRow = 1

  const titleStyle = {
    font: { bold: true, size: 14, color: { argb: 'FF2D1B69' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF3F4F6' } },
    border: {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const }
    }
  }

  const headerStyle = {
    font: { bold: true, size: 11, color: { argb: 'FF2D1B69' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFEDE9FE' } },
    border: {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const }
    }
  }

  const labelStyle = {
    font: { bold: true },
    border: {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const }
    }
  }

  const dataStyle = {
    border: {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const }
    }
  }

  // Main Title
  const titleCell = worksheet.getCell(`A${currentRow}`)
  titleCell.value = `ILPA Performance Template v1.1 - ${methodology === 'granular' ? 'Granular' : 'Gross Up'} Methodology`
  titleCell.style = titleStyle
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  currentRow += 2

  // SECTION 1: FUND INFORMATION
  const section1Cell = worksheet.getCell(`A${currentRow}`)
  section1Cell.value = 'Section 1: Fund Information'
  section1Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  currentRow++

  const fundInfo = [
    ['Fund Name', fund.name],
    ['Fund Size (Total Commitment)', `${fund.currency} ${fund.totalCommitment.toLocaleString()}`],
    ['Fund Currency', fund.currency],
    ['Fund Type', fund.subtype],
    ['Inception Date', fund.inceptionDate ? new Date(fund.inceptionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'],
    ['As of Date', asOfDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Methodology', methodology === 'granular' ? 'Granular' : 'Gross Up'],
  ]

  fundInfo.forEach(([label, value]) => {
    const labelCell = worksheet.getCell(`A${currentRow}`)
    const valueCell = worksheet.getCell(`B${currentRow}`)
    labelCell.value = label
    valueCell.value = value
    labelCell.style = labelStyle
    valueCell.style = dataStyle
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`)
    currentRow++
  })

  currentRow++

  // SECTION 2: PERFORMANCE METRICS
  const section2Cell = worksheet.getCell(`A${currentRow}`)
  section2Cell.value = 'Section 2: Performance Metrics'
  section2Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  currentRow++

  const metricsHeaders = ['Metric', 'Value', 'Description']
  metricsHeaders.forEach((header, index) => {
    const cols = ['A', 'B', 'C']
    const cell = worksheet.getCell(`${cols[index]}${currentRow}`)
    cell.value = header
    cell.style = headerStyle
  })
  worksheet.mergeCells(`C${currentRow}:E${currentRow}`)
  currentRow++

  const metrics = [
    ['IRR (Internal Rate of Return)', `${performance.irr.toFixed(2)}%`, 'Annualized return on invested capital'],
    ['TVPI (Total Value to Paid-In)', `${performance.tvpi.toFixed(2)}x`, 'Total value divided by paid-in capital'],
    ['DPI (Distributions to Paid-In)', `${performance.dpi.toFixed(2)}x`, 'Distributions divided by paid-in capital'],
    ['RVPI (Residual Value to Paid-In)', `${performance.rvpi.toFixed(2)}x`, 'Remaining NAV divided by paid-in capital'],
    ['MOIC (Multiple on Invested Capital)', `${performance.moic.toFixed(2)}x`, 'Total value multiple on invested capital'],
  ]

  metrics.forEach(([metric, value, description]) => {
    worksheet.getCell(`A${currentRow}`).value = metric
    worksheet.getCell(`B${currentRow}`).value = value
    worksheet.getCell(`C${currentRow}`).value = description

    worksheet.getCell(`A${currentRow}`).style = dataStyle
    worksheet.getCell(`B${currentRow}`).style = dataStyle
    worksheet.getCell(`C${currentRow}`).style = dataStyle

    worksheet.mergeCells(`C${currentRow}:E${currentRow}`)
    currentRow++
  })

  currentRow++

  // SECTION 3: CASH FLOW SUMMARY
  const section3Cell = worksheet.getCell(`A${currentRow}`)
  section3Cell.value = 'Section 3: Cash Flow Summary'
  section3Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  currentRow++

  const cashFlowData = [
    ['Total Capital Called', `${fund.currency} ${performance.totalCapitalCalled.toLocaleString()}`],
    ['Total Invested', `${fund.currency} ${performance.totalInvested.toLocaleString()}`],
    ['Total Distributed', `${fund.currency} ${performance.totalDistributed.toLocaleString()}`],
    ['Current NAV', `${fund.currency} ${performance.currentNAV.toLocaleString()}`],
    ['Total Value (NAV + Distributions)', `${fund.currency} ${performance.totalValue.toLocaleString()}`],
  ]

  cashFlowData.forEach(([label, value]) => {
    const labelCell = worksheet.getCell(`A${currentRow}`)
    const valueCell = worksheet.getCell(`B${currentRow}`)
    labelCell.value = label
    valueCell.value = value
    labelCell.style = labelStyle
    valueCell.style = dataStyle
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`)
    currentRow++
  })

  currentRow++

  // SECTION 4: GAIN/LOSS ANALYSIS
  const section4Cell = worksheet.getCell(`A${currentRow}`)
  section4Cell.value = 'Section 4: Gain/Loss Analysis'
  section4Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  currentRow++

  const gainLossData = [
    ['Unrealized Gain', `${fund.currency} ${performance.unrealizedGain.toLocaleString()}`],
    ['Realized Gain', `${fund.currency} ${performance.realizedGain.toLocaleString()}`],
    ['Total Gain/Loss', `${fund.currency} ${performance.totalGain.toLocaleString()}`],
  ]

  gainLossData.forEach(([label, value]) => {
    const labelCell = worksheet.getCell(`A${currentRow}`)
    const valueCell = worksheet.getCell(`B${currentRow}`)
    labelCell.value = label
    valueCell.value = value
    labelCell.style = labelStyle
    valueCell.style = dataStyle
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`)
    currentRow++
  })

  currentRow++

  // SECTION 5: CASH FLOW TRANSACTIONS
  if (methodology === 'granular') {
    const section5Cell = worksheet.getCell(`A${currentRow}`)
    section5Cell.value = 'Section 5: Cash Flow Transactions (Granular)'
    section5Cell.style = headerStyle
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
    currentRow++

    const txHeaders = ['Date', 'Type', 'Description', 'Amount', 'Transaction Type']
    txHeaders.forEach((header, index) => {
      const col = String.fromCharCode(65 + index)
      const cell = worksheet.getCell(`${col}${currentRow}`)
      cell.value = header
      cell.style = headerStyle
    })
    currentRow++

    cashFlows.forEach(cf => {
      worksheet.getCell(`A${currentRow}`).value = new Date(cf.date).toLocaleDateString('en-US')
      worksheet.getCell(`B${currentRow}`).value = cf.type === 'outflow' ? 'Capital Call' : 'Distribution'
      worksheet.getCell(`C${currentRow}`).value = cf.description
      worksheet.getCell(`D${currentRow}`).value = cf.amount
      worksheet.getCell(`E${currentRow}`).value = cf.transactionType

      worksheet.getCell(`D${currentRow}`).numFmt = '#,##0'

      for (let col = 0; col < txHeaders.length; col++) {
        const colLetter = String.fromCharCode(65 + col)
        worksheet.getCell(`${colLetter}${currentRow}`).style = dataStyle
      }

      currentRow++
    })

    currentRow++
  }

  // SECTION 6: INVESTMENT-LEVEL PERFORMANCE
  if (investmentCashFlows.length > 0) {
    const section6Cell = worksheet.getCell(`A${currentRow}`)
    section6Cell.value = 'Section 6: Investment-Level Performance'
    section6Cell.style = headerStyle
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
    currentRow++

    const invHeaders = ['Investment', 'Total Invested', 'Current Value', 'IRR', 'MOIC']
    invHeaders.forEach((header, index) => {
      const col = String.fromCharCode(65 + index)
      const cell = worksheet.getCell(`${col}${currentRow}`)
      cell.value = header
      cell.style = headerStyle
    })
    currentRow++

    investmentCashFlows.forEach(inv => {
      worksheet.getCell(`A${currentRow}`).value = inv.investmentName
      worksheet.getCell(`B${currentRow}`).value = inv.totalInvested
      worksheet.getCell(`C${currentRow}`).value = inv.currentValue
      worksheet.getCell(`D${currentRow}`).value = `${inv.irr.toFixed(2)}%`
      worksheet.getCell(`E${currentRow}`).value = `${inv.moic.toFixed(2)}x`

      worksheet.getCell(`B${currentRow}`).numFmt = '#,##0'
      worksheet.getCell(`C${currentRow}`).numFmt = '#,##0'

      for (let col = 0; col < invHeaders.length; col++) {
        const colLetter = String.fromCharCode(65 + col)
        worksheet.getCell(`${colLetter}${currentRow}`).style = dataStyle
      }

      currentRow++
    })
  }

  currentRow += 2

  // Footer
  const footerCell = worksheet.getCell(`A${currentRow}`)
  footerCell.value = `Generated by Polibit on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
  footerCell.font = { italic: true, size: 9, color: { argb: 'FF6B7280' } }
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  currentRow++

  const noticeCell = worksheet.getCell(`A${currentRow}`)
  noticeCell.value = 'This document is compliant with ILPA Performance Template v1.1 standards.'
  noticeCell.font = { italic: true, size: 9, color: { argb: 'FF6B7280' } }
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export function downloadILPAPerformance(
  fund: Structure,
  methodology: PerformanceMethodology
) {
  generateILPAPerformanceTemplate(fund, methodology).then((buffer) => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const methodologyName = methodology === 'granular' ? 'Granular' : 'GrossUp'
    link.download = `ILPA_Performance_${methodologyName}_${fund.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  })
}
