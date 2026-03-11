import jsPDF from 'jspdf'
import { formatCurrencySmart, formatCurrencyILPA } from './format-utils'
import type { DrawdownNoticeTemplate } from './types'

// ============================================================
// ILPA Capital Call Template v2.0 — Schedule Data
// ============================================================

export interface ILPASectionA {
  fundName: string
  gpCoInvestmentPercent: number
  fundCapitalCommitments: number
  closingBreakdowns?: { initial?: number; subsequent?: number; total?: number }
  // 2.07 Cumulative fund-level prior contributions & distributions
  cumulativeFundContributionsPrior: number
  cumulativeFundDistributionsPrior: number
  // 2.08 Current notice breakdown
  currentNoticeInvestments: number
  currentNoticeFundExpenses: number
  currentNoticeReserves: number
  currentNoticeManagementFees: number
  currentNoticeOther: number
  currentNoticeTotalContributions: number
  currentNoticeTotalDistributions: number
}

export interface ILPASectionB {
  investorLpId?: string
  investorName: string
  investorCommitment: number
  investorPercentOfFund: number
  investorPercentOfNAV?: number | null  // NA if NAV engine not built
  // 2.12 Investor capital commitments breakdown
  investorClosingBreakdowns?: { initial?: number; subsequent?: number; total?: number }
  // 2.13-2.14 Cumulative investor-level prior
  cumulativeInvestorContributionsPrior: number
  cumulativeInvestorDistributionsPrior: number
  // 2.15-2.18 Current notice investor amounts
  currentInvestorContributions: number
  currentInvestorDistributions: number
  // 2.19-2.23 Investor balances
  unfundedCommitment: number
  aggregateContributions: number
  aggregateDistributions: number
  aggregateNetCashFlow: number
  investorNAV?: number | null
}

export interface ILPASectionCTransaction {
  description: string
  transactionType: string
  investorAmount: number
  impactOnUnfunded: number
}

export interface ILPASectionD {
  feePeriodText: string
  feePeriodFraction: number
  feeRateOnNic: number
  feeRateOnUnfunded: number
  adjustedNic: number
  unfundedCommitment: number
  nicFeeSubtotal: number
  unfundedFeeSubtotal: number
  grossFee: number
  feeDiscount: number
  feeDiscountPercent: number
  feeOffset: number
  netFees: number
  vatRate: number
  vatAmount: number
  totalFeesWithVat: number
}

export interface ILPAScheduleData {
  sectionA: ILPASectionA
  sectionB: ILPASectionB
  sectionC: ILPASectionCTransaction[]
  sectionD?: ILPASectionD  // Only renders when fees > 0
}

export interface DrawdownNoticeData {
  template: DrawdownNoticeTemplate
  capitalCall: {
    callNumber: number
    callDate: string
    dueDate: string
    currency: string
    totalCallAmount: number
  }
  investor: {
    name: string
    email: string
    addressLine1?: string
    addressLine2?: string
    investorPortion: number
    commitment: number
    calledCapitalToDate: number
  }
  structure: {
    name: string
    currency: string
    localBankName?: string
    localAccountBank?: string
    localRoutingBank?: string
    localAccountHolder?: string
    localBankAddress?: string
    localTaxId?: string
    internationalBankName?: string
    internationalAccountBank?: string
    internationalSwift?: string
    internationalHolderName?: string
    internationalBankAddress?: string
  }
  firm: {
    firmName: string
    firmAddress?: string
    firmEmail?: string
    firmPhone?: string
    firmWebsite?: string
    firmLogo?: string | null
  }
  ilpaData?: ILPAScheduleData
}

/**
 * Replace all {{PLACEHOLDER}} tokens in a string with actual values.
 */
function replacePlaceholders(text: string, data: DrawdownNoticeData): string {
  const { capitalCall, investor, structure, firm } = data

  const contributedCapital = investor.calledCapitalToDate + investor.investorPortion
  const unfundedCapital = investor.commitment - contributedCapital
  const commitmentPercent = investor.commitment > 0
    ? ((contributedCapital / investor.commitment) * 100).toFixed(2)
    : '0.00'

  const currency = structure.currency || capitalCall.currency || 'USD'

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Build LP address from available fields
  const addressParts = [investor.addressLine1, investor.addressLine2].filter(Boolean)
  const lpAddress = addressParts.join(', ')

  const replacements: Record<string, string> = {
    '{{LP_NAME}}': investor.name || '',
    '{{LP_EMAIL}}': investor.email || '',
    '{{LP_ADDRESS}}': lpAddress,
    '{{FUND_NAME}}': structure.name || '',
    '{{CURRENCY}}': currency,
    '{{CALL_NUMBER}}': String(capitalCall.callNumber || ''),
    '{{NOTICE_DATE}}': formatDate(capitalCall.callDate),
    '{{DEADLINE_DATE}}': formatDate(capitalCall.dueDate),
    '{{TOTAL_CALL_AMOUNT}}': formatCurrencySmart(capitalCall.totalCallAmount, currency),
    '{{INVESTOR_PORTION}}': formatCurrencySmart(investor.investorPortion, currency),
    '{{COMMITTED_CAPITAL}}': formatCurrencySmart(investor.commitment, currency),
    '{{CONTRIBUTED_CAPITAL}}': formatCurrencySmart(contributedCapital, currency),
    '{{UNFUNDED_CAPITAL}}': formatCurrencySmart(unfundedCapital, currency),
    '{{COMMITMENT_PERCENT}}': `${commitmentPercent}%`,
    '{{BANK_NAME}}': structure.localBankName || structure.internationalBankName || '',
    '{{ACCOUNT_NUMBER}}': structure.localAccountBank || structure.internationalAccountBank || '',
    '{{ROUTING_NUMBER}}': structure.localRoutingBank || structure.internationalSwift || '',
    '{{ACCOUNT_HOLDER}}': structure.localAccountHolder || structure.internationalHolderName || '',
    '{{TAX_ID}}': structure.localTaxId || '',
    '{{GP_NAME}}': firm.firmName || '',
    '{{GP_ADDRESS}}': firm.firmAddress || '',
    '{{GP_EMAIL}}': firm.firmEmail || '',
    '{{GP_PHONE}}': firm.firmPhone || '',
    '{{GP_WEBSITE}}': firm.firmWebsite || '',
  }

  let result = text
  for (const [token, value] of Object.entries(replacements)) {
    result = result.replaceAll(token, value)
  }
  return result
}

/**
 * Format a date string to "Month Day, Year" format.
 */
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ============================================================
// PAGE 1 — Drawdown Notice (template-driven, fits 1 page)
// ============================================================
function renderPage1(doc: jsPDF, data: DrawdownNoticeData): void {
  const { template, capitalCall, investor, firm } = data

  const textColor: [number, number, number] = [33, 33, 33]
  const grayColor: [number, number, number] = [100, 100, 100]

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 25
  const marginRight = 25
  const contentWidth = pageWidth - marginLeft - marginRight

  let y = 20

  // === HEADER: Logo left, Fund name italic right ===
  // Firm logo / name on the left
  doc.setTextColor(...textColor)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(firm.firmName.toUpperCase(), marginLeft, y)

  // Fund name + subtitle on the right (italic)
  const headerSubtitle = replacePlaceholders(template.headerSubtitle, data)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...grayColor)
  doc.text(data.structure.name, pageWidth - marginRight, y, { align: 'right' })
  if (headerSubtitle) {
    doc.text(headerSubtitle, pageWidth - marginRight, y + 5, { align: 'right' })
  }

  y += 16

  // Thin separator line
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(marginLeft, y, pageWidth - marginRight, y)
  y += 12

  // === CENTERED TITLE (underlined) ===
  const headerTitle = replacePlaceholders(template.headerTitle, data)
  doc.setTextColor(...textColor)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  const titleWidth = doc.getTextWidth(headerTitle)
  const titleX = (pageWidth - titleWidth) / 2
  doc.text(headerTitle, titleX, y)
  // Underline
  doc.setLineWidth(0.5)
  doc.setDrawColor(33, 33, 33)
  doc.line(titleX, y + 1.5, titleX + titleWidth, y + 1.5)
  y += 14

  // === STRUCTURED FIELDS: To, From, Date of Notice, Drawdown Date ===
  const labelX = marginLeft
  const valueX = marginLeft + 38
  doc.setFontSize(10)

  // To:
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...textColor)
  doc.text('To:', labelX, y)
  doc.setFont('helvetica', 'normal')
  doc.text(investor.name, valueX, y)
  y += 5
  // Address lines
  if (investor.addressLine1) {
    doc.setFontSize(9)
    doc.setTextColor(...grayColor)
    doc.text(investor.addressLine1, valueX, y)
    y += 4.5
  }
  if (investor.addressLine2) {
    doc.setFontSize(9)
    doc.setTextColor(...grayColor)
    doc.text(investor.addressLine2, valueX, y)
    y += 4.5
  }
  if (investor.email) {
    doc.setFontSize(9)
    doc.setTextColor(...grayColor)
    doc.text(investor.email, valueX, y)
    y += 4.5
  }
  y += 3

  // From:
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...textColor)
  doc.text('From:', labelX, y)
  doc.setFont('helvetica', 'normal')
  doc.text(firm.firmName, valueX, y)
  y += 7

  // Date of Notice:
  doc.setFont('helvetica', 'bold')
  doc.text('Date of Notice:', labelX, y)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(capitalCall.callDate), valueX + 20, y)
  y += 7

  // Drawdown Date:
  doc.setFont('helvetica', 'bold')
  doc.text('Drawdown Date:', labelX, y)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(capitalCall.dueDate), valueX + 20, y)
  y += 12

  // === LEGAL DESCRIPTION (prose body with embedded amounts) ===
  const legalText = replacePlaceholders(template.legalDescription, data)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...textColor)

  const textLines = doc.splitTextToSize(legalText, contentWidth)
  for (const line of textLines) {
    doc.text(line, marginLeft, y)
    y += 4.8
  }
  y += 6

  // === DEADLINE (bold + underlined) ===
  const deadlineStr = `Payment must be received by wire transfer on or before ${formatDate(capitalCall.dueDate)}.`
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...textColor)
  doc.text(deadlineStr, marginLeft, y)
  const dlWidth = doc.getTextWidth(deadlineStr)
  doc.setLineWidth(0.3)
  doc.line(marginLeft, y + 1.2, marginLeft + dlWidth, y + 1.2)
  y += 8

  // === APPENDIX REFERENCE ===
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Please see Appendix A attached hereto for bank account details and wire instructions.', marginLeft, y)
  y += 10

  // === CONTACT PARAGRAPH ===
  const contactParts: string[] = []
  if (firm.firmEmail) contactParts.push(firm.firmEmail)
  if (firm.firmPhone) contactParts.push(firm.firmPhone)
  if (contactParts.length > 0) {
    const contactText = `If you have any questions regarding this drawdown, please contact us at ${contactParts.join(' or ')}.`
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    const contactLines = doc.splitTextToSize(contactText, contentWidth)
    for (const line of contactLines) {
      doc.text(line, marginLeft, y)
      y += 4.8
    }
    y += 6
  }

  // === SIGNATURE BLOCK ===
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...textColor)
  doc.text('Yours faithfully,', marginLeft, y)
  y += 12

  // Signature line
  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.3)
  doc.line(marginLeft, y, marginLeft + 55, y)
  y += 5

  // "The Manager" or signatory info from template
  if (template.footerSignatoryName) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(template.footerSignatoryName, marginLeft, y)
    y += 5
  }
  if (template.footerSignatoryTitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(template.footerSignatoryTitle, marginLeft, y)
    y += 5
  }
  if (template.footerCompanyName) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(template.footerCompanyName, marginLeft, y)
  }

  // === FOOTER (bottom of page): Address + Website ===
  const pageHeight = doc.internal.pageSize.getHeight()
  const footerY = pageHeight - 12
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)

  // Thin line above footer
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.line(marginLeft, footerY - 4, pageWidth - marginRight, footerY - 4)

  const footerParts: string[] = []
  if (firm.firmAddress) footerParts.push(firm.firmAddress)
  if (firm.firmWebsite) footerParts.push(firm.firmWebsite)
  if (firm.firmEmail) footerParts.push(firm.firmEmail)

  if (footerParts.length > 0) {
    const footerText = footerParts.join('  |  ')
    doc.text(footerText, pageWidth / 2, footerY, { align: 'center' })
  }
}

// ============================================================
// PAGE 2 — Schedule of Capital Calls (no template)
// ============================================================
function renderPage2Schedule(doc: jsPDF, data: DrawdownNoticeData): void {
  const { capitalCall, investor, structure } = data

  const currency = structure.currency || capitalCall.currency || 'USD'
  const textColor: [number, number, number] = [33, 33, 33]
  const headerBg: [number, number, number] = [26, 26, 46] // Navy #1a1a2e
  const lightGray: [number, number, number] = [245, 245, 245]
  const borderColor: [number, number, number] = [200, 200, 200]

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 25
  const marginRight = 25
  const contentWidth = pageWidth - marginLeft - marginRight

  let y = 25

  // === PAGE TITLE ===
  doc.setTextColor(...textColor)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Schedule — Capital Call Details', marginLeft, y)
  y += 4

  // Subtitle
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Capital Call No. ${capitalCall.callNumber}  |  ${structure.name}  |  ${formatDate(capitalCall.callDate)}`, marginLeft, y + 5)
  y += 14

  // Separator
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.line(marginLeft, y, pageWidth - marginRight, y)
  y += 10

  // === SUMMARY TABLE ===
  const contributedCapital = investor.calledCapitalToDate + investor.investorPortion
  const unfundedCapital = investor.commitment - contributedCapital
  const commitmentPercent = investor.commitment > 0
    ? ((contributedCapital / investor.commitment) * 100).toFixed(2)
    : '0.00'
  const drawdownPercent = investor.commitment > 0
    ? ((investor.investorPortion / investor.commitment) * 100).toFixed(2)
    : '0.00'

  const colLabelX = marginLeft + 3
  const colValueX = pageWidth - marginRight - 3
  const rowHeight = 8

  // Table header
  doc.setFillColor(...headerBg)
  doc.rect(marginLeft, y, contentWidth, rowHeight, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Description', colLabelX, y + 5.5)
  doc.text('Amount', colValueX, y + 5.5, { align: 'right' })
  y += rowHeight

  // Table rows
  const rows: [string, string, boolean?][] = [
    ['Investor', investor.name],
    ['Committed Capital', formatCurrencySmart(investor.commitment, currency)],
    ['Ownership (%)', commitmentPercent + '%'],
    ['', ''], // separator
    ['Previously Called Capital', formatCurrencySmart(investor.calledCapitalToDate, currency)],
    ['Unfunded Commitment', formatCurrencySmart(unfundedCapital, currency)],
    ['', ''], // separator
    ['Total Capital Call (Fund)', formatCurrencySmart(capitalCall.totalCallAmount, currency)],
    ['Your Capital Call Amount', formatCurrencySmart(investor.investorPortion, currency), true],
    ['', ''], // separator
    ['Cumulative Called (after this call)', formatCurrencySmart(contributedCapital, currency)],
    ['Remaining Unfunded Commitment', formatCurrencySmart(investor.commitment - contributedCapital, currency)],
    ['Commitment Called (%)', commitmentPercent + '%'],
    ['Total Drawdown (%)', drawdownPercent + '%'],
  ]

  let altRow = false
  for (const [label, value, highlight] of rows) {
    // Separator row
    if (!label && !value) {
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.2)
      doc.line(marginLeft, y + 3, pageWidth - marginRight, y + 3)
      y += 6
      altRow = false
      continue
    }

    // Alternating row bg
    if (altRow) {
      doc.setFillColor(...lightGray)
      doc.rect(marginLeft, y, contentWidth, rowHeight, 'F')
    }
    altRow = !altRow

    doc.setFontSize(9)
    doc.setTextColor(...textColor)

    if (highlight) {
      doc.setFont('helvetica', 'bold')
    } else {
      doc.setFont('helvetica', 'normal')
    }

    doc.text(label, colLabelX, y + 5.5)
    doc.text(value, colValueX, y + 5.5, { align: 'right' })

    y += rowHeight
  }

  // Bottom border
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.5)
  doc.line(marginLeft, y, pageWidth - marginRight, y)
  y += 12

  // Additional notes from template
  if (data.template.footerAdditionalNotes) {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(130, 130, 130)
    const noteLines = doc.splitTextToSize(
      replacePlaceholders(data.template.footerAdditionalNotes, data),
      contentWidth
    )
    for (const line of noteLines) {
      doc.text(line, marginLeft, y)
      y += 4
    }
  }
}

// ============================================================
// PAGE 2 (ILPA) — Sections A + B + Investor Balances
// ============================================================
function renderPage2ILPASchedule(doc: jsPDF, data: DrawdownNoticeData): void {
  const ilpa = data.ilpaData!
  const { sectionA, sectionB } = ilpa
  const currency = data.structure.currency || data.capitalCall.currency || 'USD'
  const fmt = (v: number) => formatCurrencyILPA(v, currency)
  const fmtOrNA = (v: number | null | undefined) => v == null ? 'NA' : fmt(v)

  const textColor: [number, number, number] = [33, 33, 33]
  const headerBg: [number, number, number] = [26, 26, 46]
  const lightGray: [number, number, number] = [245, 245, 245]
  const borderColor: [number, number, number] = [200, 200, 200]
  const white: [number, number, number] = [255, 255, 255]

  const pageWidth = doc.internal.pageSize.getWidth()
  const ml = 15 // reduced margins for wider ILPA tables
  const mr = 15
  const cw = pageWidth - ml - mr
  const rh = 5.5 // row height
  const fs = 7.5 // font size
  const colLabelX = ml + 2
  const colMidX = ml + cw * 0.6  // contributions column
  const colRightX = ml + cw - 2  // distributions column

  let y = 18

  // === Page Title ===
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('ILPA Capital Call Schedule', ml, y)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Capital Call No. ${data.capitalCall.callNumber}  |  ${data.structure.name}  |  ${formatDate(data.capitalCall.callDate)}`,
    ml, y + 5
  )
  y += 12

  // ── Helper: section header bar ──
  const sectionHeader = (label: string) => {
    doc.setFillColor(...headerBg)
    doc.rect(ml, y, cw, rh + 1, 'F')
    doc.setFontSize(fs + 0.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...white)
    doc.text(label, colLabelX, y + rh - 1)
    y += rh + 1
  }

  // ── Helper: key-value row ──
  let altRow = false
  const kvRow = (num: string, label: string, value: string, bold = false) => {
    if (altRow) {
      doc.setFillColor(...lightGray)
      doc.rect(ml, y, cw, rh, 'F')
    }
    altRow = !altRow
    doc.setFontSize(fs)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(`${num}  ${label}`, colLabelX, y + rh - 1.5)
    doc.text(value, colRightX, y + rh - 1.5, { align: 'right' })
    y += rh
  }

  // ── Helper: two-column row (contributions | distributions) ──
  const twoColRow = (num: string, label: string, contrib: string, distrib: string, bold = false) => {
    if (altRow) {
      doc.setFillColor(...lightGray)
      doc.rect(ml, y, cw, rh, 'F')
    }
    altRow = !altRow
    doc.setFontSize(fs)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(`${num}  ${label}`, colLabelX, y + rh - 1.5)
    doc.text(contrib, colMidX, y + rh - 1.5, { align: 'right' })
    doc.text(distrib, colRightX, y + rh - 1.5, { align: 'right' })
    y += rh
  }

  // ── Helper: two-column header ──
  const twoColHeader = () => {
    doc.setFillColor(60, 60, 80)
    doc.rect(ml, y, cw, rh, 'F')
    doc.setFontSize(fs)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...white)
    doc.text('', colLabelX, y + rh - 1.5)
    doc.text('Contributions', colMidX, y + rh - 1.5, { align: 'right' })
    doc.text('Distributions', colRightX, y + rh - 1.5, { align: 'right' })
    y += rh
    altRow = false
  }

  // ════════════════════════════════════════════
  // SECTION A — Fund Cash Flow
  // ════════════════════════════════════════════
  sectionHeader('Section A — Fund Cash Flow')
  altRow = false

  kvRow('2.01', 'Name of Fund / Partnership', sectionA.fundName)
  kvRow('2.02', 'GP Co-Investment (%)', `${sectionA.gpCoInvestmentPercent.toFixed(2)}%`)
  kvRow('2.03', 'Fund Capital Commitments', fmt(sectionA.fundCapitalCommitments))
  kvRow('2.04', 'Notice Date', formatDate(data.capitalCall.callDate))
  kvRow('2.05', 'Due Date', formatDate(data.capitalCall.dueDate))

  // 2.06 Closing breakdowns
  if (sectionA.closingBreakdowns) {
    kvRow('2.06.1', 'Initial Closing', fmtOrNA(sectionA.closingBreakdowns.initial))
    kvRow('2.06.2', 'Subsequent Closings', fmtOrNA(sectionA.closingBreakdowns.subsequent))
    kvRow('2.06.3', 'Total All Closings', fmtOrNA(sectionA.closingBreakdowns.total))
  } else {
    kvRow('2.06', 'Closing Breakdowns', 'NA')
  }

  // Two-column: Cumulative Prior (2.07) + Current Notice (2.08)
  y += 2
  twoColHeader()
  twoColRow('2.07', 'Cumulative Prior (Fund)', fmt(sectionA.cumulativeFundContributionsPrior), fmt(sectionA.cumulativeFundDistributionsPrior))

  // 2.08 Current notice breakdown
  twoColRow('2.08', 'Current Notice — Total', fmt(sectionA.currentNoticeTotalContributions), fmt(sectionA.currentNoticeTotalDistributions), true)
  twoColRow('2.08.1', '  Portfolio Investments', fmt(sectionA.currentNoticeInvestments), fmt(0))
  twoColRow('2.08.2', '  Fund Expenses', fmt(sectionA.currentNoticeFundExpenses), fmt(0))
  twoColRow('2.08.3', '  Reserves', fmt(sectionA.currentNoticeReserves), fmt(0))
  twoColRow('2.08.4', '  Management Fees', fmt(sectionA.currentNoticeManagementFees), fmt(0))
  twoColRow('2.08.5', '  Other', fmt(sectionA.currentNoticeOther), fmt(0))

  // Bottom border for Section A
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.line(ml, y, ml + cw, y)
  y += 6

  // ════════════════════════════════════════════
  // SECTION B — Investor Information
  // ════════════════════════════════════════════
  sectionHeader('Section B — Investor Information')
  altRow = false

  kvRow('2.09', 'Limited Partner Name', sectionB.investorName)
  if (sectionB.investorLpId) {
    kvRow('2.09.1', 'LP ID', sectionB.investorLpId)
  }
  kvRow('2.10', 'LP % of Fund', `${sectionB.investorPercentOfFund.toFixed(4)}%`)
  kvRow('2.11', 'LP % of NAV', sectionB.investorPercentOfNAV != null ? `${sectionB.investorPercentOfNAV.toFixed(4)}%` : 'NA')
  kvRow('2.12', 'LP Capital Commitment', fmt(sectionB.investorCommitment))

  // Two-column: Cumulative Investor Prior (2.13-2.14) + Current (2.15-2.18)
  y += 2
  twoColHeader()
  twoColRow('2.13', 'Cumulative LP Contributions (Prior)', fmt(sectionB.cumulativeInvestorContributionsPrior), '')
  twoColRow('2.13.1', '  Cash', fmt(sectionB.cumulativeInvestorContributionsPrior), '')
  twoColRow('2.13.2', '  Withheld', fmt(0), '')
  twoColRow('2.14', 'Cumulative LP Distributions (Prior)', '', fmt(sectionB.cumulativeInvestorDistributionsPrior))
  twoColRow('2.14.1', '  Cash', '', fmt(sectionB.cumulativeInvestorDistributionsPrior))
  twoColRow('2.14.2', '  Withheld', '', fmt(0))

  // Separator
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.2)
  doc.line(ml, y, ml + cw, y)
  y += 1

  twoColRow('2.15', 'Current Notice — LP Contributions', fmt(sectionB.currentInvestorContributions), '', true)
  twoColRow('2.16', 'Current Notice — LP Distributions', '', fmt(sectionB.currentInvestorDistributions), true)

  // Bottom border for contributions/distributions
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.line(ml, y, ml + cw, y)
  y += 6

  // ── Investor Balances (2.19–2.23) ──
  sectionHeader('Investor Balances')
  altRow = false
  kvRow('2.19', 'Unfunded Commitment', fmt(sectionB.unfundedCommitment))
  kvRow('2.20', 'Aggregate Contributions', fmt(sectionB.aggregateContributions))
  kvRow('2.21', 'Aggregate Distributions', fmt(sectionB.aggregateDistributions))
  kvRow('2.22', 'Aggregate Net Cash Flow', fmt(sectionB.aggregateNetCashFlow))
  kvRow('2.23', 'Investor NAV', fmtOrNA(sectionB.investorNAV))

  // Bottom border
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.5)
  doc.line(ml, y, ml + cw, y)
}

// ============================================================
// PAGE 3 (ILPA) — Section C (Transactions) + Section D (Fees)
// ============================================================
function renderPage3SectionCD(doc: jsPDF, data: DrawdownNoticeData): void {
  const ilpa = data.ilpaData!
  const currency = data.structure.currency || data.capitalCall.currency || 'USD'
  const fmt = (v: number) => formatCurrencyILPA(v, currency)

  const textColor: [number, number, number] = [33, 33, 33]
  const headerBg: [number, number, number] = [26, 26, 46]
  const lightGray: [number, number, number] = [245, 245, 245]
  const borderColor: [number, number, number] = [200, 200, 200]
  const white: [number, number, number] = [255, 255, 255]

  const pageWidth = doc.internal.pageSize.getWidth()
  const ml = 15
  const mr = 15
  const cw = pageWidth - ml - mr
  const rh = 5.5
  const fs = 7.5

  // Column positions for 4-column table
  const col1X = ml + 2
  const col2X = ml + cw * 0.42
  const col3X = ml + cw * 0.68
  const col4X = ml + cw - 2

  let y = 18

  // === Page Title ===
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('ILPA Capital Call Schedule (cont.)', ml, y)
  y += 8

  // ════════════════════════════════════════════
  // SECTION C — Transaction Details
  // ════════════════════════════════════════════
  doc.setFillColor(...headerBg)
  doc.rect(ml, y, cw, rh + 1, 'F')
  doc.setFontSize(fs + 0.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...white)
  doc.text('Section C — Transaction Details', col1X, y + rh - 1)
  y += rh + 1

  // Column headers
  doc.setFillColor(60, 60, 80)
  doc.rect(ml, y, cw, rh, 'F')
  doc.setFontSize(fs)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...white)
  doc.text('Description', col1X, y + rh - 1.5)
  doc.text('Type', col2X, y + rh - 1.5)
  doc.text('Amount', col3X, y + rh - 1.5, { align: 'right' })
  doc.text('Impact on Unfunded', col4X, y + rh - 1.5, { align: 'right' })
  y += rh

  // Transaction rows
  let altRow = false
  let totalAmount = 0
  let totalImpact = 0

  for (const tx of ilpa.sectionC) {
    if (altRow) {
      doc.setFillColor(...lightGray)
      doc.rect(ml, y, cw, rh, 'F')
    }
    altRow = !altRow
    doc.setFontSize(fs)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', 'normal')
    doc.text(tx.description, col1X, y + rh - 1.5)
    doc.text(tx.transactionType, col2X, y + rh - 1.5)
    doc.text(fmt(tx.investorAmount), col3X, y + rh - 1.5, { align: 'right' })
    doc.text(fmt(tx.impactOnUnfunded), col4X, y + rh - 1.5, { align: 'right' })
    totalAmount += tx.investorAmount
    totalImpact += tx.impactOnUnfunded
    y += rh
  }

  // TOTAL row
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.line(ml, y, ml + cw, y)
  doc.setFillColor(235, 235, 240)
  doc.rect(ml, y, cw, rh + 0.5, 'F')
  doc.setFontSize(fs)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...textColor)
  doc.text('TOTAL', col1X, y + rh - 1)
  doc.text(fmt(totalAmount), col3X, y + rh - 1, { align: 'right' })
  doc.text(fmt(totalImpact), col4X, y + rh - 1, { align: 'right' })
  y += rh + 0.5

  // Bottom border
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.5)
  doc.line(ml, y, ml + cw, y)
  y += 10

  // ════════════════════════════════════════════
  // SECTION D — Fee Side Calculations (only if fees exist)
  // ════════════════════════════════════════════
  if (!ilpa.sectionD) return

  const d = ilpa.sectionD
  const colLabelX = ml + 2
  const colValueX = ml + cw - 2

  doc.setFillColor(...headerBg)
  doc.rect(ml, y, cw, rh + 1, 'F')
  doc.setFontSize(fs + 0.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...white)
  doc.text('Section D — Fee Calculations', colLabelX, y + rh - 1)
  y += rh + 1

  altRow = false
  const feeRow = (label: string, value: string, bold = false) => {
    if (altRow) {
      doc.setFillColor(...lightGray)
      doc.rect(ml, y, cw, rh, 'F')
    }
    altRow = !altRow
    doc.setFontSize(fs)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(label, colLabelX, y + rh - 1.5)
    doc.text(value, colValueX, y + rh - 1.5, { align: 'right' })
    y += rh
  }

  feeRow('Fee Period', d.feePeriodText)
  feeRow('Fee Period Fraction', d.feePeriodFraction.toFixed(4))

  if (d.feeRateOnNic > 0) {
    feeRow('NIC (Net Invested Capital)', fmt(d.adjustedNic))
    feeRow(`NIC Fee Rate`, `${d.feeRateOnNic.toFixed(2)}%`)
    feeRow('NIC Fee Subtotal', fmt(d.nicFeeSubtotal))
  }
  if (d.feeRateOnUnfunded > 0) {
    feeRow('Unfunded Commitment', fmt(d.unfundedCommitment))
    feeRow(`Unfunded Fee Rate`, `${d.feeRateOnUnfunded.toFixed(2)}%`)
    feeRow('Unfunded Fee Subtotal', fmt(d.unfundedFeeSubtotal))
  }

  // Separator
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.2)
  doc.line(ml, y, ml + cw, y)
  y += 1

  feeRow('Gross Management Fee', fmt(d.grossFee))
  if (d.feeDiscountPercent > 0) {
    feeRow(`Fee Discount (${d.feeDiscountPercent.toFixed(1)}%)`, fmt(-d.feeDiscount))
  }
  if (d.feeOffset > 0) {
    feeRow('GP Fee Offset', fmt(-d.feeOffset))
  }
  feeRow('Net Management Fee', fmt(d.netFees), true)

  if (d.vatRate > 0) {
    feeRow(`VAT (${d.vatRate.toFixed(1)}%)`, fmt(d.vatAmount))
  }
  feeRow('Total Fees (incl. VAT)', fmt(d.totalFeesWithVat), true)

  // Bottom border
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.5)
  doc.line(ml, y, ml + cw, y)
}

// ============================================================
// Appendix — Bank Account Details (no template)
// ============================================================
function renderAppendix(doc: jsPDF, data: DrawdownNoticeData): void {
  const { structure } = data

  const textColor: [number, number, number] = [33, 33, 33]
  const grayColor: [number, number, number] = [100, 100, 100]
  const borderColor: [number, number, number] = [200, 200, 200]
  const headerBg: [number, number, number] = [26, 26, 46]

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 25
  const marginRight = 25
  const contentWidth = pageWidth - marginLeft - marginRight

  let y = 25

  // === PAGE TITLE ===
  doc.setTextColor(...textColor)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Appendix A — Bank Account Details', marginLeft, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text('Wire transfer instructions for capital call payment.', marginLeft, y + 3)
  y += 14

  // Separator
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.line(marginLeft, y, pageWidth - marginRight, y)
  y += 10

  const labelX = marginLeft + 3
  const valueX = marginLeft + 55
  const rowHeight = 8

  // === LOCAL BANK DETAILS ===
  const hasLocal = structure.localBankName || structure.localAccountBank
  if (hasLocal) {
    // Section header
    doc.setFillColor(...headerBg)
    doc.rect(marginLeft, y, contentWidth, rowHeight, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Local / Domestic Wire Instructions', labelX, y + 5.5)
    y += rowHeight + 2

    const localRows = [
      ['Bank Name', structure.localBankName],
      ['Account Number', structure.localAccountBank],
      ['Routing Number', structure.localRoutingBank],
      ['Account Holder', structure.localAccountHolder],
      ['Bank Address', structure.localBankAddress],
      ['Tax ID / RFC', structure.localTaxId],
    ].filter(([, val]) => val) as [string, string][]

    for (const [label, value] of localRows) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...textColor)
      doc.text(`${label}:`, labelX, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.text(value, valueX, y + 5)
      y += 7
    }
    y += 8
  }

  // === INTERNATIONAL BANK DETAILS ===
  const hasIntl = structure.internationalBankName || structure.internationalAccountBank
  if (hasIntl) {
    // Section header
    doc.setFillColor(...headerBg)
    doc.rect(marginLeft, y, contentWidth, rowHeight, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('International Wire Instructions', labelX, y + 5.5)
    y += rowHeight + 2

    const intlRows = [
      ['Bank Name', structure.internationalBankName],
      ['Account Number', structure.internationalAccountBank],
      ['SWIFT / BIC', structure.internationalSwift],
      ['Account Holder', structure.internationalHolderName],
      ['Bank Address', structure.internationalBankAddress],
    ].filter(([, val]) => val) as [string, string][]

    for (const [label, value] of intlRows) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...textColor)
      doc.text(`${label}:`, labelX, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.text(value, valueX, y + 5)
      y += 7
    }
    y += 8
  }

  // === PAYMENT INSTRUCTIONS NOTE ===
  if (data.template.paymentInstructionsNote) {
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.2)
    doc.line(marginLeft, y, pageWidth - marginRight, y)
    y += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...grayColor)
    const noteText = replacePlaceholders(data.template.paymentInstructionsNote, data)
    const noteLines = doc.splitTextToSize(noteText, contentWidth)
    for (const line of noteLines) {
      doc.text(line, marginLeft, y)
      y += 4.5
    }
  }

  // === IMPORTANT NOTE BOX ===
  y += 8
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.5)
  doc.rect(marginLeft, y, contentWidth, 20)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...textColor)
  doc.text('Important:', marginLeft + 4, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Please include your investor name and capital call number as reference in your wire transfer.', marginLeft + 4, y + 12)
  doc.text(`Reference: Capital Call No. ${data.capitalCall.callNumber} — ${data.investor.name}`, marginLeft + 4, y + 17)
}

// ============================================================
// MAIN EXPORT — Generate Drawdown Notice PDF
// 4-page ILPA format (if ilpaData present) or 3-page legacy
// ============================================================
export function generateDrawdownNoticePDF(data: DrawdownNoticeData): jsPDF {
  const doc = new jsPDF()

  // Page 1 — Drawdown Notice (template-driven)
  renderPage1(doc, data)

  if (data.ilpaData) {
    // ILPA 4-page format
    // Page 2 — Sections A + B (Fund Cash Flow + Investor Info)
    doc.addPage()
    renderPage2ILPASchedule(doc, data)

    // Page 3 — Sections C + D (Transactions + Fee Calculations)
    doc.addPage()
    renderPage3SectionCD(doc, data)

    // Page 4 — Appendix A (Bank Details)
    doc.addPage()
    renderAppendix(doc, data)
  } else {
    // Legacy 3-page format
    doc.addPage()
    renderPage2Schedule(doc, data)

    doc.addPage()
    renderAppendix(doc, data)
  }

  return doc
}

/**
 * Generate and download a Drawdown Notice PDF for a single investor.
 */
export function downloadDrawdownNoticePDF(data: DrawdownNoticeData): void {
  const doc = generateDrawdownNoticePDF(data)
  const callNum = data.capitalCall.callNumber
  const investorName = data.investor.name.replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`Drawdown_Notice_CC${callNum}_${investorName}.pdf`)
}

/**
 * Generate Drawdown Notice PDFs for all investors and download them.
 * If single investor, downloads directly. If multiple, downloads individually.
 */
export function downloadAllDrawdownNotices(
  template: DrawdownNoticeTemplate,
  capitalCall: DrawdownNoticeData['capitalCall'],
  investors: DrawdownNoticeData['investor'][],
  structure: DrawdownNoticeData['structure'],
  firm: DrawdownNoticeData['firm'],
  ilpaDataPerInvestor?: ILPAScheduleData[],
): void {
  for (let i = 0; i < investors.length; i++) {
    const data: DrawdownNoticeData = {
      template,
      capitalCall,
      investor: investors[i],
      structure,
      firm,
      ilpaData: ilpaDataPerInvestor?.[i],
    }
    downloadDrawdownNoticePDF(data)
  }
}
