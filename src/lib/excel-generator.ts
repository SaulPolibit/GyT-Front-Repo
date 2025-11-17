/**
 * Excel Report Generator
 * Generates professional Excel reports using ExcelJS
 */

import ExcelJS from 'exceljs'
import type { Report, Investment, Investor } from '@/lib/types'

interface ExcelGeneratorOptions {
  report: Report
  investments: Investment[]
  investors: Investor[]
}

export async function generateReportExcel(options: ExcelGeneratorOptions): Promise<Buffer> {
  const { report, investments, investors } = options

  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'Polibit Investment Manager'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.properties.date1904 = false

  // Get fundId from report - assuming report has a fundId field
  const fundId = report.fundId || ''

  // Create sheets
  addSummarySheet(workbook, report)
  addInvestmentsSheet(workbook, report, investments)

  if (investors.length > 0) {
    addInvestorsSheet(workbook, report, investors, fundId)
  }

  if (report.capitalCall || report.distribution) {
    addTransactionsSheet(workbook, report, investors)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

function addSummarySheet(workbook: ExcelJS.Workbook, report: Report) {
  const sheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: 'FF6b21a8' } }
  })

  sheet.columns = [
    { width: 25 },
    { width: 20 },
    { width: 25 },
    { width: 20 }
  ]

  // Header
  sheet.mergeCells('A1:D1')
  const headerCell = sheet.getCell('A1')
  headerCell.value = 'Polibit Investment Manager'
  headerCell.font = { size: 18, bold: true, color: { argb: 'FF6b21a8' } }
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 30

  // Report Title
  sheet.mergeCells('A2:D2')
  const titleCell = sheet.getCell('A2')
  titleCell.value = report.title
  titleCell.font = { size: 16, bold: true }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(2).height = 25

  // Date Range
  sheet.mergeCells('A3:D3')
  const dateCell = sheet.getCell('A3')
  dateCell.value = `${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}`
  dateCell.font = { size: 11, color: { argb: 'FF666666' } }
  dateCell.alignment = { horizontal: 'center' }

  sheet.addRow([])

  // Report Info Section
  const infoStartRow = 5

  sheet.getCell(`A${infoStartRow}`).value = 'Report Information'
  sheet.getCell(`A${infoStartRow}`).font = { size: 14, bold: true }
  sheet.mergeCells(`A${infoStartRow}:D${infoStartRow}`)

  sheet.addRow(['Report Type:', report.type, 'Status:', report.status])
  sheet.addRow(['Report ID:', report.id, 'Created By:', report.createdBy])
  sheet.addRow(['Generated:', formatDate(report.generatedDate), 'Published:', report.publishedDate ? formatDate(report.publishedDate) : 'Not Published'])
  sheet.addRow(['Recipients:', report.sentTo.length, '', ''])

  sheet.addRow([])

  // Key Metrics Section
  const metricsStartRow = sheet.lastRow!.number + 1

  sheet.getCell(`A${metricsStartRow}`).value = 'Key Metrics'
  sheet.getCell(`A${metricsStartRow}`).font = { size: 14, bold: true }
  sheet.mergeCells(`A${metricsStartRow}:D${metricsStartRow}`)

  const metricsRow1 = sheet.addRow(['Total AUM', formatCurrency(report.metrics.totalAUM), 'Avg IRR', `${report.metrics.avgIRR.toFixed(1)}%`])
  const metricsRow2 = sheet.addRow(['Total Investments', report.metrics.totalInvestments, 'Total Investors', report.metrics.totalInvestors])
  const metricsRow3 = sheet.addRow(['Total Distributions', formatCurrency(report.metrics.totalDistributions), '', ''])

  // Style metrics rows
  ;[metricsRow1, metricsRow2, metricsRow3].forEach(row => {
    row.eachCell((cell, colNumber) => {
      if (colNumber % 2 === 1) {
        cell.font = { bold: true }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        }
      }
      cell.alignment = { vertical: 'middle' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      }
    })
    row.height = 25
  })

  // Capital Call Info (if applicable)
  if (report.capitalCall) {
    sheet.addRow([])
    const ccRow = sheet.lastRow!.number + 1

    sheet.getCell(`A${ccRow}`).value = 'Capital Call Details'
    sheet.getCell(`A${ccRow}`).font = { size: 14, bold: true }
    sheet.mergeCells(`A${ccRow}:D${ccRow}`)

    sheet.addRow(['Total Call Amount:', formatCurrency(report.capitalCall.totalCallAmount), 'Call Number:', report.capitalCall.callNumber])
    sheet.addRow(['Due Date:', formatDate(report.capitalCall.dueDate), 'Related Investment:', report.capitalCall.relatedInvestmentName])
    sheet.addRow(['Purpose:', report.capitalCall.purpose, '', ''])
  }

  // Distribution Info (if applicable)
  if (report.distribution) {
    sheet.addRow([])
    const distRow = sheet.lastRow!.number + 1

    sheet.getCell(`A${distRow}`).value = 'Distribution Details'
    sheet.getCell(`A${distRow}`).font = { size: 14, bold: true }
    sheet.mergeCells(`A${distRow}:D${distRow}`)

    sheet.addRow(['Total Distribution:', formatCurrency(report.distribution.totalDistributionAmount), 'Distribution Number:', report.distribution.distributionNumber])
    sheet.addRow(['Distribution Date:', formatDate(report.distribution.distributionDate), 'Source:', report.distribution.source])
  }
}

function addInvestmentsSheet(
  workbook: ExcelJS.Workbook,
  report: Report,
  investments: Investment[]
) {
  const sheet = workbook.addWorksheet('Investments', {
    properties: { tabColor: { argb: 'FF6b21a8' } }
  })

  // Header
  sheet.columns = [
    { header: 'Investment Name', key: 'name', width: 30 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Sector', key: 'sector', width: 25 },
    { header: 'Acquisition Date', key: 'acquisitionDate', width: 18 },
    { header: 'Total Invested', key: 'totalInvested', width: 18 },
    { header: 'Current Value', key: 'currentValue', width: 18 },
    { header: 'IRR (%)', key: 'irr', width: 12 },
    { header: 'Multiple', key: 'multiple', width: 12 }
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6b21a8' }
  }
  headerRow.height = 25
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  // Filter included investments
  const includedInvestments = investments.filter(inv =>
    report.includesInvestments.includes(inv.id)
  )

  // Add data rows
  includedInvestments.forEach(investment => {
    const row = sheet.addRow({
      name: investment.name,
      type: investment.type,
      sector: investment.sector,
      acquisitionDate: formatDate(investment.acquisitionDate),
      totalInvested: investment.totalFundPosition.totalInvested,
      currentValue: investment.totalFundPosition.currentValue,
      irr: investment.totalFundPosition.irr,
      multiple: investment.totalFundPosition.multiple
    })

    // Format currency columns
    row.getCell('totalInvested').numFmt = '$#,##0'
    row.getCell('currentValue').numFmt = '$#,##0'
    row.getCell('irr').numFmt = '0.0'
    row.getCell('multiple').numFmt = '0.00'

    // Style row
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      }
    })
  })

  // Add totals row
  const totalRow = sheet.addRow({
    name: 'TOTAL',
    type: '',
    sector: '',
    acquisitionDate: '',
    totalInvested: { formula: `SUM(E2:E${sheet.lastRow!.number})` },
    currentValue: { formula: `SUM(F2:F${sheet.lastRow!.number})` },
    irr: { formula: `AVERAGE(G2:G${sheet.lastRow!.number})` },
    multiple: { formula: `AVERAGE(H2:H${sheet.lastRow!.number})` }
  })

  totalRow.font = { bold: true }
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }
  }
  totalRow.getCell('totalInvested').numFmt = '$#,##0'
  totalRow.getCell('currentValue').numFmt = '$#,##0'
  totalRow.getCell('irr').numFmt = '0.0'
  totalRow.getCell('multiple').numFmt = '0.00'

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
}

function addInvestorsSheet(
  workbook: ExcelJS.Workbook,
  report: Report,
  investors: Investor[],
  fundId: string
) {
  const sheet = workbook.addWorksheet('Investors', {
    properties: { tabColor: { argb: 'FF6b21a8' } }
  })

  // Header
  sheet.columns = [
    { header: 'Investor Name', key: 'name', width: 30 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Ownership %', key: 'ownershipPercent', width: 15 },
    { header: 'Commitment', key: 'commitment', width: 18 },
    { header: 'Called Capital', key: 'calledCapital', width: 18 },
    { header: 'Funded %', key: 'fundedPercent', width: 15 },
    { header: 'Current Balance', key: 'currentBalance', width: 18 }
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6b21a8' }
  }
  headerRow.height = 25
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  // Filter included investors
  const includedInvestors = investors.filter(inv =>
    report.includesInvestors.includes(inv.id)
  )

  // Add data rows
  includedInvestors.forEach(investor => {
    const fundOwnership = investor.fundOwnerships?.find(fo => fo.fundId === fundId)
    const capitalHistory = investor.capitalAccountHistory || []
    const currentBalance = capitalHistory.length > 0
      ? capitalHistory[capitalHistory.length - 1].runningBalance
      : (fundOwnership?.calledCapital || 0)

    const row = sheet.addRow({
      name: investor.name,
      type: investor.type,
      email: investor.email || 'N/A',
      ownershipPercent: fundOwnership?.ownershipPercent || 0,
      commitment: fundOwnership?.commitment || 0,
      calledCapital: fundOwnership?.calledCapital || 0,
      fundedPercent: fundOwnership?.fundedPercent || 0,
      currentBalance: currentBalance
    })

    // Format columns
    row.getCell('ownershipPercent').numFmt = '0.00'
    row.getCell('commitment').numFmt = '$#,##0'
    row.getCell('calledCapital').numFmt = '$#,##0'
    row.getCell('fundedPercent').numFmt = '0.0'
    row.getCell('currentBalance').numFmt = '$#,##0'

    // Style row
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      }
    })
  })

  // Add totals row
  const totalRow = sheet.addRow({
    name: 'TOTAL',
    type: '',
    email: '',
    ownershipPercent: { formula: `SUM(D2:D${sheet.lastRow!.number})` },
    commitment: { formula: `SUM(E2:E${sheet.lastRow!.number})` },
    calledCapital: { formula: `SUM(F2:F${sheet.lastRow!.number})` },
    fundedPercent: { formula: `AVERAGE(G2:G${sheet.lastRow!.number})` },
    currentBalance: { formula: `SUM(H2:H${sheet.lastRow!.number})` }
  })

  totalRow.font = { bold: true }
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }
  }
  totalRow.getCell('ownershipPercent').numFmt = '0.00'
  totalRow.getCell('commitment').numFmt = '$#,##0'
  totalRow.getCell('calledCapital').numFmt = '$#,##0'
  totalRow.getCell('fundedPercent').numFmt = '0.0'
  totalRow.getCell('currentBalance').numFmt = '$#,##0'

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
}

function addTransactionsSheet(
  workbook: ExcelJS.Workbook,
  report: Report,
  investors: Investor[]
) {
  const sheet = workbook.addWorksheet('Transactions', {
    properties: { tabColor: { argb: 'FF6b21a8' } }
  })

  const allocations = report.capitalCall?.investorAllocations ||
                     report.distribution?.investorAllocations

  if (!allocations || allocations.length === 0) return

  const isCapitalCall = !!report.capitalCall

  // Header
  sheet.columns = [
    { header: 'Investor Name', key: 'investorName', width: 30 },
    { header: 'Investor Type', key: 'investorType', width: 20 },
    { header: 'Ownership %', key: 'ownershipPercent', width: 15 },
    { header: 'Amount', key: 'amount', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Transaction Type', key: 'transactionType', width: 20 }
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6b21a8' }
  }
  headerRow.height = 25
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  // Add transaction summary header
  sheet.insertRow(1, [])
  sheet.mergeCells('A1:F1')
  const summaryCell = sheet.getCell('A1')
  summaryCell.value = isCapitalCall
    ? `Capital Call #${report.capitalCall!.callNumber} - ${formatCurrency(report.capitalCall!.totalCallAmount)}`
    : `Distribution #${report.distribution!.distributionNumber} - ${formatCurrency(report.distribution!.totalDistributionAmount)}`
  summaryCell.font = { size: 14, bold: true }
  summaryCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 30

  // Add additional info row
  sheet.insertRow(2, [])
  sheet.mergeCells('A2:F2')
  const infoCell = sheet.getCell('A2')

  if (isCapitalCall) {
    infoCell.value = `Due Date: ${formatDate(report.capitalCall!.dueDate)} | Purpose: ${report.capitalCall!.purpose}`
  } else {
    infoCell.value = `Distribution Date: ${formatDate(report.distribution!.distributionDate)} | Source: ${report.distribution!.source}`
  }

  infoCell.font = { size: 11, color: { argb: 'FF666666' } }
  infoCell.alignment = { horizontal: 'center' }
  sheet.getRow(2).height = 20

  // Add empty row
  sheet.insertRow(3, [])

  // Data starts at row 4, but header is at row 4, data at row 5
  // Update the header row styling
  const dataHeaderRow = sheet.getRow(4)
  dataHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  dataHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6b21a8' }
  }
  dataHeaderRow.height = 25
  dataHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }

  // Add data rows
  allocations.forEach(allocation => {
    const row = sheet.addRow({
      investorName: allocation.investorName,
      investorType: allocation.investorType,
      ownershipPercent: allocation.ownershipPercent,
      amount: allocation.amount,
      status: allocation.status || 'Pending',
      transactionType: isCapitalCall ? 'Capital Call' : 'Distribution'
    })

    // Format columns
    row.getCell('ownershipPercent').numFmt = '0.00'
    row.getCell('amount').numFmt = '$#,##0'

    // Style row
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      }
    })
  })

  // Add totals row
  const lastDataRow = sheet.lastRow!.number
  const totalRow = sheet.addRow({
    investorName: 'TOTAL',
    investorType: '',
    ownershipPercent: { formula: `SUM(C5:C${lastDataRow})` },
    amount: { formula: `SUM(D5:D${lastDataRow})` },
    status: '',
    transactionType: ''
  })

  totalRow.font = { bold: true }
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }
  }
  totalRow.getCell('ownershipPercent').numFmt = '0.00'
  totalRow.getCell('amount').numFmt = '$#,##0'

  // Freeze header rows
  sheet.views = [{ state: 'frozen', ySplit: 4 }]
}

// Utility functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
