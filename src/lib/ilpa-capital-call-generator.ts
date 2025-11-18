import ExcelJS from 'exceljs'
import type { CapitalCall } from './types'
import { getStructureById } from './structures-storage'

export async function generateILPACapitalCallTemplate(capitalCall: CapitalCall): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'Polibit'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.lastModifiedBy = 'Polibit'

  const fund = getStructureById(capitalCall.fundId)
  if (!fund) {
    throw new Error('Fund not found')
  }

  const worksheet = workbook.addWorksheet('Capital Call Notice')

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
    ['Capital Call Number', `#${capitalCall.callNumber}`],
    ['Call Date', new Date(capitalCall.callDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Due Date', new Date(capitalCall.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Notice Period (Days)', capitalCall.noticePeriodDays.toString()],
    ['Total Call Amount', `${capitalCall.currency} ${capitalCall.totalCallAmount.toLocaleString()}`],
    ['Purpose', capitalCall.purpose],
    ['Transaction Type (ILPA)', capitalCall.transactionType],
    ['Use of Proceeds', capitalCall.useOfProceeds],
  ]

  if (capitalCall.managementFeeIncluded && capitalCall.managementFeeAmount) {
    fundInfo.push(['Management Fee Included', 'Yes'])
    fundInfo.push(['Management Fee Amount', `${capitalCall.currency} ${capitalCall.managementFeeAmount.toLocaleString()}`])
  } else {
    fundInfo.push(['Management Fee Included', 'No'])
  }

  if (capitalCall.relatedInvestmentName) {
    fundInfo.push(['Related Investment', capitalCall.relatedInvestmentName])
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

  // SECTION 2: LP-LEVEL INFORMATION
  const section2Cell = worksheet.getCell(`A${currentRow}`)
  section2Cell.value = 'Section 2: LP-Level Information & Unfunded Commitment Reconciliation'
  section2Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  // LP Table Headers
  const lpHeaders = ['LP Name', 'Commitment', 'Ownership %', 'Call Amount', 'Called to Date', 'Uncalled']
  lpHeaders.forEach((header, index) => {
    const col = String.fromCharCode(65 + index)
    const cell = worksheet.getCell(`${col}${currentRow}`)
    cell.value = header
    cell.style = headerStyle
  })
  currentRow++

  // LP Data
  capitalCall.investorAllocations.forEach((allocation) => {
    worksheet.getCell(`A${currentRow}`).value = allocation.investorName
    worksheet.getCell(`B${currentRow}`).value = allocation.commitment
    worksheet.getCell(`C${currentRow}`).value = `${allocation.ownershipPercent.toFixed(2)}%`
    worksheet.getCell(`D${currentRow}`).value = allocation.callAmount
    worksheet.getCell(`E${currentRow}`).value = allocation.calledCapitalToDate
    worksheet.getCell(`F${currentRow}`).value = allocation.uncalledCapital

    // Apply number formatting
    worksheet.getCell(`B${currentRow}`).numFmt = '#,##0'
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
  const totalCallAmount = capitalCall.investorAllocations.reduce((sum, a) => sum + a.callAmount, 0)
  const totalCalledToDate = capitalCall.investorAllocations.reduce((sum, a) => sum + a.calledCapitalToDate, 0)
  const totalUncalled = capitalCall.investorAllocations.reduce((sum, a) => sum + a.uncalledCapital, 0)

  worksheet.getCell(`A${currentRow}`).value = 'TOTAL'
  worksheet.getCell(`A${currentRow}`).style = { ...labelStyle, font: { bold: true, color: { argb: 'FF2D1B69' } } }
  worksheet.getCell(`B${currentRow}`).value = fund.totalCommitment
  worksheet.getCell(`C${currentRow}`).value = '100.00%'
  worksheet.getCell(`D${currentRow}`).value = totalCallAmount
  worksheet.getCell(`E${currentRow}`).value = totalCalledToDate
  worksheet.getCell(`F${currentRow}`).value = totalUncalled

  worksheet.getCell(`B${currentRow}`).numFmt = '#,##0'
  worksheet.getCell(`D${currentRow}`).numFmt = '#,##0'
  worksheet.getCell(`E${currentRow}`).numFmt = '#,##0'
  worksheet.getCell(`F${currentRow}`).numFmt = '#,##0'

  for (let col = 0; col < lpHeaders.length; col++) {
    const colLetter = String.fromCharCode(65 + col)
    const cell = worksheet.getCell(`${colLetter}${currentRow}`)
    cell.style = { ...dataStyle, fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFEDE9FE' } } }
  }

  currentRow += 2

  // SECTION 3: TRANSACTION DETAILS
  const section3Cell = worksheet.getCell(`A${currentRow}`)
  section3Cell.value = 'Section 3: Transaction Details'
  section3Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  const transactionInfo = [
    ['Transaction Type', capitalCall.transactionType],
    ['Description', capitalCall.purpose],
    ['Transaction Amount', `${capitalCall.currency} ${capitalCall.totalCallAmount.toLocaleString()}`],
    ['Impact to Unfunded Commitment', 'Decrease'],
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

  currentRow++

  // SECTION 4: PAYMENT INSTRUCTIONS
  const section4Cell = worksheet.getCell(`A${currentRow}`)
  section4Cell.value = 'Section 4: Payment Instructions'
  section4Cell.style = headerStyle
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  const paymentInfo = [
    ['Payment Due Date', new Date(capitalCall.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Payment Method', 'Wire Transfer / ACH / Check'],
    ['Currency', capitalCall.currency],
    ['Bank Name', '[Bank Name - To be configured in Fund Settings]'],
    ['Account Number', '[Account Number - To be configured in Fund Settings]'],
    ['Routing Number', '[Routing Number - To be configured in Fund Settings]'],
    ['SWIFT Code', '[SWIFT Code - To be configured in Fund Settings]'],
    ['Reference', `Capital Call #${capitalCall.callNumber} - ${fund.name}`],
  ]

  paymentInfo.forEach(([label, value]) => {
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

export function downloadILPACapitalCall(capitalCall: CapitalCall) {
  generateILPACapitalCallTemplate(capitalCall).then((buffer) => {
    const blob = new Blob([buffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ILPA_Capital_Call_${capitalCall.callNumber}_${capitalCall.fundName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  })
}
