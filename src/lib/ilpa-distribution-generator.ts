import ExcelJS from 'exceljs'
import type { Distribution } from './types'
import { getStructureById } from './structures-storage'

export async function generateILPADistributionTemplate(distribution: Distribution): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'Polibit'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.lastModifiedBy = 'Polibit'

  const fund = getStructureById(distribution.fundId)
  if (!fund) {
    throw new Error('Fund not found')
  }

  const worksheet = workbook.addWorksheet('Distribution Notice')

  worksheet.getColumn('A').width = 35
  worksheet.getColumn('B').width = 20
  worksheet.getColumn('C').width = 20
  worksheet.getColumn('D').width = 20

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
  titleCell.value = 'ILPA Capital Call & Distribution Template v2.0'
  titleCell.style = titleStyle
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow += 2

  // SECTION 1: FUND-LEVEL INFORMATION
  const section1Cell = worksheet.getCell(`A${currentRow}`)
  section1Cell.value = 'Section 1: Fund-Level Information'
  section1Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  const fundInfo = [
    ['Fund Name', fund.name],
    ['Fund Size (Total Commitment)', `${fund.currency} ${fund.totalCommitment.toLocaleString()}`],
    ['Fund Currency', fund.currency],
    ['Distribution Number', `#${distribution.distributionNumber}`],
    ['Distribution Date', new Date(distribution.distributionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Record Date', new Date(distribution.recordDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Payment Date', new Date(distribution.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Total Distribution Amount', `${distribution.currency} ${distribution.totalDistributionAmount.toLocaleString()}`],
    ['Source', distribution.source],
    ['Source Description', distribution.sourceDescription],
  ]

  if (distribution.relatedInvestmentName) {
    fundInfo.push(['Related Investment', distribution.relatedInvestmentName])
  }

  fundInfo.forEach(([label, value]) => {
    const labelCell = worksheet.getCell(`A${currentRow}`)
    const valueCell = worksheet.getCell(`B${currentRow}`)
    labelCell.value = label
    valueCell.value = value
    labelCell.style = labelStyle
    valueCell.style = dataStyle
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`)
    currentRow++
  })

  currentRow++

  // SECTION 2: TAX CLASSIFICATION BREAKDOWN
  const section2Cell = worksheet.getCell(`A${currentRow}`)
  section2Cell.value = 'Section 2: Tax Classification Breakdown'
  section2Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  const taxInfo = [
    ['Return of Capital (ROC)', distribution.isReturnOfCapital ? `${distribution.currency} ${(distribution.returnOfCapitalAmount || 0).toLocaleString()}` : 'N/A'],
    ['Income', distribution.isIncome ? `${distribution.currency} ${(distribution.incomeAmount || 0).toLocaleString()}` : 'N/A'],
    ['Capital Gains', distribution.isCapitalGain ? `${distribution.currency} ${(distribution.capitalGainAmount || 0).toLocaleString()}` : 'N/A'],
    ['Total', `${distribution.currency} ${distribution.totalDistributionAmount.toLocaleString()}`],
  ]

  taxInfo.forEach(([label, value]) => {
    const labelCell = worksheet.getCell(`A${currentRow}`)
    const valueCell = worksheet.getCell(`B${currentRow}`)
    labelCell.value = label
    valueCell.value = value
    labelCell.style = labelStyle
    valueCell.style = dataStyle
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`)
    currentRow++
  })

  currentRow++

  // SECTION 3: LP-LEVEL DISTRIBUTIONS
  const section3Cell = worksheet.getCell(`A${currentRow}`)
  section3Cell.value = 'Section 3: LP-Level Distribution Allocations'
  section3Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  // LP Table Headers
  const lpHeaders = ['LP Name', 'Ownership %', 'Distribution Amount', 'ROC', 'Income', 'Capital Gains']
  lpHeaders.forEach((header, index) => {
    const col = String.fromCharCode(65 + index)
    const cell = worksheet.getCell(`${col}${currentRow}`)
    cell.value = header
    cell.style = headerStyle
  })
  currentRow++

  // LP Data
  distribution.investorAllocations.forEach((allocation) => {
    const rocAmount = distribution.isReturnOfCapital ? allocation.amount * ((distribution.returnOfCapitalAmount || 0) / distribution.totalDistributionAmount) : 0
    const incomeAmount = distribution.isIncome ? allocation.amount * ((distribution.incomeAmount || 0) / distribution.totalDistributionAmount) : 0
    const capitalGainAmount = distribution.isCapitalGain ? allocation.amount * ((distribution.capitalGainAmount || 0) / distribution.totalDistributionAmount) : 0

    worksheet.getCell(`A${currentRow}`).value = allocation.investorName
    worksheet.getCell(`B${currentRow}`).value = `${allocation.ownershipPercent.toFixed(2)}%`
    worksheet.getCell(`C${currentRow}`).value = allocation.amount
    worksheet.getCell(`D${currentRow}`).value = rocAmount
    worksheet.getCell(`E${currentRow}`).value = incomeAmount
    worksheet.getCell(`F${currentRow}`).value = capitalGainAmount

    // Apply number formatting
    worksheet.getCell(`C${currentRow}`).numFmt = '#,##0'
    worksheet.getCell(`D${currentRow}`).numFmt = '#,##0'
    worksheet.getCell(`E${currentRow}`).numFmt = '#,##0'
    worksheet.getCell(`F${currentRow}`).numFmt = '#,##0'

    // Apply borders
    for (let col = 0; col < lpHeaders.length; col++) {
      const colLetter = String.fromCharCode(65 + col)
      worksheet.getCell(`${colLetter}${currentRow}`).style = dataStyle
    }

    currentRow++
  })

  // Totals Row
  const totalDistributed = distribution.investorAllocations.reduce((sum, a) => sum + a.amount, 0)
  const totalROC = distribution.returnOfCapitalAmount || 0
  const totalIncome = distribution.incomeAmount || 0
  const totalCapitalGains = distribution.capitalGainAmount || 0

  worksheet.getCell(`A${currentRow}`).value = 'TOTAL'
  worksheet.getCell(`A${currentRow}`).style = { ...labelStyle, font: { bold: true, color: { argb: 'FF2D1B69' } } }
  worksheet.getCell(`B${currentRow}`).value = '100.00%'
  worksheet.getCell(`C${currentRow}`).value = totalDistributed
  worksheet.getCell(`D${currentRow}`).value = totalROC
  worksheet.getCell(`E${currentRow}`).value = totalIncome
  worksheet.getCell(`F${currentRow}`).value = totalCapitalGains

  worksheet.getCell(`C${currentRow}`).numFmt = '#,##0'
  worksheet.getCell(`D${currentRow}`).numFmt = '#,##0'
  worksheet.getCell(`E${currentRow}`).numFmt = '#,##0'
  worksheet.getCell(`F${currentRow}`).numFmt = '#,##0'

  for (let col = 0; col < lpHeaders.length; col++) {
    const colLetter = String.fromCharCode(65 + col)
    const cell = worksheet.getCell(`${colLetter}${currentRow}`)
    cell.style = { ...dataStyle, fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFEDE9FE' } } }
  }

  currentRow += 2

  // SECTION 4: TRANSACTION DETAILS
  const section4Cell = worksheet.getCell(`A${currentRow}`)
  section4Cell.value = 'Section 4: Transaction Details'
  section4Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  const transactionInfo = [
    ['Transaction Type', 'Distribution'],
    ['Description', distribution.sourceDescription],
    ['Transaction Amount', `${distribution.currency} ${distribution.totalDistributionAmount.toLocaleString()}`],
    ['Impact to Unfunded Commitment', 'None'],
    ['Inside/Outside Fund', 'Inside Fund'],
  ]

  transactionInfo.forEach(([label, value]) => {
    const labelCell = worksheet.getCell(`A${currentRow}`)
    const valueCell = worksheet.getCell(`B${currentRow}`)
    labelCell.value = label
    valueCell.value = value
    labelCell.style = labelStyle
    valueCell.style = dataStyle
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`)
    currentRow++
  })

  currentRow += 2

  // SECTION 5: PAYMENT INSTRUCTIONS
  const section5Cell = worksheet.getCell(`A${currentRow}`)
  section5Cell.value = 'Section 5: Distribution Details'
  section5Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  const distributionDetails = [
    ['Payment Date', new Date(distribution.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Payment Method', 'Wire Transfer / ACH / Check'],
    ['Currency', distribution.currency],
    ['Status', distribution.status],
  ]

  distributionDetails.forEach(([label, value]) => {
    const labelCell = worksheet.getCell(`A${currentRow}`)
    const valueCell = worksheet.getCell(`B${currentRow}`)
    labelCell.value = label
    valueCell.value = value
    labelCell.style = labelStyle
    valueCell.style = dataStyle
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`)
    currentRow++
  })

  currentRow += 2

  // Footer
  const footerCell = worksheet.getCell(`A${currentRow}`)
  footerCell.value = `Generated by Polibit on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
  footerCell.font = { italic: true, size: 9, color: { argb: 'FF6B7280' } }
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  const noticeCell = worksheet.getCell(`A${currentRow}`)
  noticeCell.value = 'This document is compliant with ILPA Capital Call & Distribution Template v2.0 standards.'
  noticeCell.font = { italic: true, size: 9, color: { argb: 'FF6B7280' } }
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export function downloadILPADistribution(distribution: Distribution) {
  generateILPADistributionTemplate(distribution).then((buffer) => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ILPA_Distribution_${distribution.distributionNumber}_${distribution.fundName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  })
}
