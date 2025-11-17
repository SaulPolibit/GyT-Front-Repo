/**
 * Custom Report Excel Generator
 * Generates customizable Excel workbooks based on selected data fields
 */

import ExcelJS from 'exceljs'
import type { Investor, Investment, Report } from '@/lib/types'

interface CustomReportData {
  title: string
  periodStart: string
  periodEnd: string
  generatedDate: string
  investors: Investor[]
  investments: Investment[]
  reports: Report[]
  includeFields: Record<string, boolean>
  metrics: {
    totalAUM: number
    totalInvestments: number
    totalInvestors: number
    avgIRR: number
    avgMultiple: number
    totalDistributions: number
    totalUnrealizedGains: number
  }
}

export async function generateCustomExcel(data: CustomReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Polibit Investment Manager'
  workbook.created = new Date()

  // Summary Sheet (always included)
  addSummarySheet(workbook, data)

  // Investment Details Sheets
  if (shouldIncludeInvestmentDetails(data.includeFields) && data.investments.length > 0) {
    addInvestmentsSheet(workbook, data)
  }

  // Performance Metrics Sheet
  if (shouldIncludePerformanceMetrics(data.includeFields) && data.investments.length > 0) {
    addPerformanceSheet(workbook, data)
  }

  // Investor Information Sheets
  if (shouldIncludeInvestorInfo(data.includeFields) && data.investors.length > 0) {
    addInvestorsSheet(workbook, data)
  }

  // Financial Details Sheet
  if (shouldIncludeFinancialDetails(data.includeFields)) {
    addFinancialsSheet(workbook, data)
  }

  // Convert workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

function addSummarySheet(workbook: ExcelJS.Workbook, data: CustomReportData) {
  const sheet = workbook.addWorksheet('Summary')

  // Title
  sheet.mergeCells('A1:D1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = data.title
  titleCell.font = { size: 18, bold: true, color: { argb: 'FF2521A0' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.getRow(1).height = 30

  // Period
  sheet.mergeCells('A2:D2')
  const periodCell = sheet.getCell('A2')
  periodCell.value = `Period: ${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}`
  periodCell.font = { size: 12 }
  periodCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // Generated date
  sheet.mergeCells('A3:D3')
  const dateCell = sheet.getCell('A3')
  dateCell.value = `Generated: ${formatDate(data.generatedDate)}`
  dateCell.font = { size: 10, color: { argb: 'FF666666' } }
  dateCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // Metrics
  let currentRow = 5

  if (data.includeFields.totalAUM) {
    sheet.getCell(`A${currentRow}`).value = 'Total AUM'
    sheet.getCell(`B${currentRow}`).value = data.metrics.totalAUM
    sheet.getCell(`B${currentRow}`).numFmt = '"$"#,##0'
    currentRow++
  }

  if (data.includeFields.totalInvestments) {
    sheet.getCell(`A${currentRow}`).value = 'Total Investments'
    sheet.getCell(`B${currentRow}`).value = data.metrics.totalInvestments
    currentRow++
  }

  if (data.includeFields.totalInvestors) {
    sheet.getCell(`A${currentRow}`).value = 'Total Investors'
    sheet.getCell(`B${currentRow}`).value = data.metrics.totalInvestors
    currentRow++
  }

  if (data.includeFields.avgIRR) {
    sheet.getCell(`A${currentRow}`).value = 'Average IRR'
    sheet.getCell(`B${currentRow}`).value = data.metrics.avgIRR / 100
    sheet.getCell(`B${currentRow}`).numFmt = '0.00%'
    currentRow++
  }

  if (data.includeFields.avgMultiple) {
    sheet.getCell(`A${currentRow}`).value = 'Average Multiple'
    sheet.getCell(`B${currentRow}`).value = data.metrics.avgMultiple
    sheet.getCell(`B${currentRow}`).numFmt = '0.00"x"'
    currentRow++
  }

  // Style metrics
  for (let i = 5; i < currentRow; i++) {
    sheet.getCell(`A${i}`).font = { bold: true }
    sheet.getCell(`B${i}`).font = { size: 12 }
  }

  // Column widths
  sheet.getColumn(1).width = 25
  sheet.getColumn(2).width = 20
}

function addInvestmentsSheet(workbook: ExcelJS.Workbook, data: CustomReportData) {
  const sheet = workbook.addWorksheet('Investments')

  // Headers
  const headers = ['Name', 'Type', 'Sector', 'Status', 'Geography']

  if (data.includeFields.investmentBreakdown) {
    headers.push('Total Invested', 'Current Value', 'Unrealized Gain')
  }

  if (data.includeFields.individualIRR) {
    headers.push('IRR')
  }

  if (data.includeFields.individualMultiples) {
    headers.push('Multiple')
  }

  sheet.addRow(headers)

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2521A0' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 20

  // Data rows
  data.investments.forEach((inv) => {
    const row: any[] = [
      inv.name,
      inv.type,
      inv.sector,
      inv.status,
      `${inv.geography.city}, ${inv.geography.country}`,
    ]

    if (data.includeFields.investmentBreakdown) {
      row.push(
        inv.totalFundPosition.totalInvested,
        inv.totalFundPosition.currentValue,
        inv.totalFundPosition.unrealizedGain
      )
    }

    if (data.includeFields.individualIRR) {
      row.push(inv.totalFundPosition.irr / 100)
    }

    if (data.includeFields.individualMultiples) {
      row.push(inv.totalFundPosition.multiple)
    }

    sheet.addRow(row)
  })

  // Format columns
  let colIndex = 1
  sheet.getColumn(colIndex++).width = 30 // Name
  sheet.getColumn(colIndex++).width = 15 // Type
  sheet.getColumn(colIndex++).width = 20 // Sector
  sheet.getColumn(colIndex++).width = 12 // Status
  sheet.getColumn(colIndex++).width = 25 // Geography

  if (data.includeFields.investmentBreakdown) {
    sheet.getColumn(colIndex).numFmt = '"$"#,##0'
    sheet.getColumn(colIndex++).width = 15 // Total Invested
    sheet.getColumn(colIndex).numFmt = '"$"#,##0'
    sheet.getColumn(colIndex++).width = 15 // Current Value
    sheet.getColumn(colIndex).numFmt = '"$"#,##0'
    sheet.getColumn(colIndex++).width = 15 // Unrealized Gain
  }

  if (data.includeFields.individualIRR) {
    sheet.getColumn(colIndex).numFmt = '0.00%'
    sheet.getColumn(colIndex++).width = 12 // IRR
  }

  if (data.includeFields.individualMultiples) {
    sheet.getColumn(colIndex).numFmt = '0.00"x"'
    sheet.getColumn(colIndex++).width = 12 // Multiple
  }
}

function addPerformanceSheet(workbook: ExcelJS.Workbook, data: CustomReportData) {
  const sheet = workbook.addWorksheet('Performance')

  // Headers
  const headers = ['Investment Name']

  if (data.includeFields.individualIRR) headers.push('IRR')
  if (data.includeFields.individualMultiples) headers.push('Multiple')
  if (data.includeFields.unrealizedGains) headers.push('Unrealized Gain')

  sheet.addRow(headers)

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2521A0' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 20

  // Data rows
  data.investments.forEach((inv) => {
    const row: any[] = [inv.name]

    if (data.includeFields.individualIRR) {
      row.push(inv.totalFundPosition.irr / 100)
    }

    if (data.includeFields.individualMultiples) {
      row.push(inv.totalFundPosition.multiple)
    }

    if (data.includeFields.unrealizedGains) {
      row.push(inv.totalFundPosition.unrealizedGain)
    }

    sheet.addRow(row)
  })

  // Format columns
  let colIndex = 1
  sheet.getColumn(colIndex++).width = 30 // Name

  if (data.includeFields.individualIRR) {
    sheet.getColumn(colIndex).numFmt = '0.00%'
    sheet.getColumn(colIndex++).width = 12
  }

  if (data.includeFields.individualMultiples) {
    sheet.getColumn(colIndex).numFmt = '0.00"x"'
    sheet.getColumn(colIndex++).width = 12
  }

  if (data.includeFields.unrealizedGains) {
    sheet.getColumn(colIndex).numFmt = '"$"#,##0'
    sheet.getColumn(colIndex++).width = 18
  }
}

function addInvestorsSheet(workbook: ExcelJS.Workbook, data: CustomReportData) {
  const sheet = workbook.addWorksheet('Investors')

  // Headers
  const headers = ['Name', 'Type', 'Status']

  if (data.includeFields.investorAllocations) {
    headers.push('Ownership %', 'Commitment', 'Called Capital')
  }

  if (data.includeFields.investorList) {
    headers.push('Current Value', 'IRR', 'Total Distributed')
  }

  sheet.addRow(headers)

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2521A0' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 20

  // Data rows
  data.investors.forEach((investor) => {
    // Aggregate ownership across all funds
    const totalOwnership = investor.fundOwnerships?.reduce((sum, fo) => sum + fo.ownershipPercent, 0) || 0
    const totalCommitment = investor.fundOwnerships?.reduce((sum, fo) => sum + fo.commitment, 0) || 0
    const totalCalledCapital = investor.fundOwnerships?.reduce((sum, fo) => sum + fo.calledCapital, 0) || 0

    const row: any[] = [investor.name, investor.type, investor.status]

    if (data.includeFields.investorAllocations) {
      row.push(
        totalOwnership / 100,
        totalCommitment,
        totalCalledCapital
      )
    }

    if (data.includeFields.investorList) {
      row.push(
        investor.currentValue,
        investor.irr / 100,
        investor.totalDistributed
      )
    }

    sheet.addRow(row)
  })

  // Format columns
  let colIndex = 1
  sheet.getColumn(colIndex++).width = 25 // Name
  sheet.getColumn(colIndex++).width = 20 // Type
  sheet.getColumn(colIndex++).width = 12 // Status

  if (data.includeFields.investorAllocations) {
    sheet.getColumn(colIndex).numFmt = '0.00%'
    sheet.getColumn(colIndex++).width = 15 // Ownership %
    sheet.getColumn(colIndex).numFmt = '"$"#,##0'
    sheet.getColumn(colIndex++).width = 15 // Commitment
    sheet.getColumn(colIndex).numFmt = '"$"#,##0'
    sheet.getColumn(colIndex++).width = 15 // Called Capital
  }

  if (data.includeFields.investorList) {
    sheet.getColumn(colIndex).numFmt = '"$"#,##0'
    sheet.getColumn(colIndex++).width = 18 // Current Value
    sheet.getColumn(colIndex).numFmt = '0.00%'
    sheet.getColumn(colIndex++).width = 12 // IRR
    sheet.getColumn(colIndex).numFmt = '"$"#,##0'
    sheet.getColumn(colIndex++).width = 18 // Total Distributed
  }
}

function addFinancialsSheet(workbook: ExcelJS.Workbook, data: CustomReportData) {
  const sheet = workbook.addWorksheet('Financials')

  // Title
  sheet.mergeCells('A1:B1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = 'Financial Summary'
  titleCell.font = { size: 14, bold: true }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.getRow(1).height = 25

  let currentRow = 3

  if (data.includeFields.cashFlows) {
    sheet.getCell(`A${currentRow}`).value = 'Total Distributions'
    sheet.getCell(`B${currentRow}`).value = data.metrics.totalDistributions
    sheet.getCell(`B${currentRow}`).numFmt = '"$"#,##0'
    currentRow++

    sheet.getCell(`A${currentRow}`).value = 'Total Unrealized Gains'
    sheet.getCell(`B${currentRow}`).value = data.metrics.totalUnrealizedGains
    sheet.getCell(`B${currentRow}`).numFmt = '"$"#,##0'
    currentRow += 2
  }

  if (data.includeFields.valuationHistory) {
    sheet.getCell(`A${currentRow}`).value = 'Current Portfolio Value'
    sheet.getCell(`B${currentRow}`).value = data.metrics.totalAUM
    sheet.getCell(`B${currentRow}`).numFmt = '"$"#,##0'
    currentRow++

    sheet.getCell(`A${currentRow}`).value = 'Number of Investments'
    sheet.getCell(`B${currentRow}`).value = data.metrics.totalInvestments
    currentRow++

    sheet.getCell(`A${currentRow}`).value = 'Average IRR'
    sheet.getCell(`B${currentRow}`).value = data.metrics.avgIRR / 100
    sheet.getCell(`B${currentRow}`).numFmt = '0.00%'
    currentRow++
  }

  // Style
  for (let i = 3; i < currentRow; i++) {
    sheet.getCell(`A${i}`).font = { bold: true }
  }

  sheet.getColumn(1).width = 30
  sheet.getColumn(2).width = 20
}

function shouldIncludeInvestmentDetails(fields: Record<string, boolean>): boolean {
  return fields.investmentBreakdown || fields.assetAllocation || fields.geographicDistribution || fields.sectorBreakdown
}

function shouldIncludePerformanceMetrics(fields: Record<string, boolean>): boolean {
  return fields.individualIRR || fields.individualMultiples || fields.unrealizedGains || fields.realizedGains
}

function shouldIncludeInvestorInfo(fields: Record<string, boolean>): boolean {
  return fields.investorList || fields.investorAllocations || fields.capitalCalls || fields.distributions
}

function shouldIncludeFinancialDetails(fields: Record<string, boolean>): boolean {
  return fields.cashFlows || fields.valuationHistory || fields.feeBreakdown || fields.expenseRatios
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
