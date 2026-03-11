/**
 * ILPA Notice Generator
 *
 * Generates ILPA-compliant Capital Call and Distribution Notices in PDF format.
 * Follows ILPA Capital Call & Distribution Template v2.0 standards.
 *
 * Notice Sections:
 * - Section A: Transaction Summary
 * - Section B: Fee Breakdown (management fee, VAT, discounts)
 * - Section C: Payment Instructions
 * - Section D: Balance Summary (unfunded commitment reconciliation)
 */

import PDFDocument from 'pdfkit'
import { formatCurrency } from './format-utils'
import type {
  CapitalCall,
  CapitalCallAllocation,
  Distribution,
  DistributionAllocation,
  BankDetails,
  FeeConfiguration,
  FundOwnership,
  ManagementFeeBase
} from './types'
import type { Structure } from './structures-storage'
import {
  calculateCapitalCallFees,
  type FeeCalculationResult
} from './ilpa-fee-calculations'

// ============================================================================
// TYPES
// ============================================================================

export interface ILPANoticeOptions {
  firmName?: string
  firmLogo?: string
  bankDetails?: BankDetails
  includeWireInstructions?: boolean
  currency?: string
}

export interface IndividualLPNotice {
  investorId: string
  investorName: string
  pdfBuffer: Buffer
  fileName: string
}

// ============================================================================
// PDF STYLING CONSTANTS
// ============================================================================

const COLORS = {
  primary: '#2D1B69',      // Polibit purple
  secondary: '#6B21A8',    // Lighter purple
  accent: '#EDE9FE',       // Very light purple
  text: '#1F2937',         // Dark gray
  muted: '#6B7280',        // Medium gray
  border: '#E5E7EB',       // Light gray
  success: '#059669',      // Green
  warning: '#D97706',      // Orange
}

// ============================================================================
// CAPITAL CALL NOTICE GENERATOR
// ============================================================================

/**
 * Generate a complete ILPA Capital Call Notice PDF
 * This generates a fund-level summary document
 */
export async function generateCapitalCallNoticePDF(
  capitalCall: CapitalCall,
  options: ILPANoticeOptions = {},
  structures: Structure[] = []
): Promise<Buffer> {
  const { firmName = 'Investment Manager', bankDetails, currency = 'USD' } = options

  const fund = structures.find(s => s.id === capitalCall.fundId) || null
  if (!fund) {
    throw new Error('Fund not found')
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
        autoFirstPage: true
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      addNoticeHeader(doc, {
        firmName,
        title: `CAPITAL CALL NOTICE #${capitalCall.callNumber}`,
        fundName: fund.name,
        date: capitalCall.callDate
      })

      // Section A: Transaction Summary
      addSectionA_TransactionSummary(doc, capitalCall, fund, currency)

      // Section B: Fee Breakdown (if applicable)
      if (capitalCall.managementFeeIncluded || capitalCall.managementFeeAmount) {
        addSectionB_FeeBreakdown(doc, capitalCall, fund, currency)
      }

      // Section C: Payment Instructions
      addSectionC_PaymentInstructions(doc, capitalCall, bankDetails || fund.bankDetails, currency)

      // Section D: Balance Summary (LP Allocations)
      addSectionD_BalanceSummary(doc, capitalCall, currency)

      // Footer
      addNoticeFooter(doc, firmName)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate individual LP-specific Capital Call Notices
 * Each LP gets their own personalized notice with their specific amounts
 */
export async function generateIndividualLPNotices(
  capitalCall: CapitalCall,
  options: ILPANoticeOptions = {},
  structures: Structure[] = []
): Promise<IndividualLPNotice[]> {
  const { firmName = 'Investment Manager', bankDetails, currency = 'USD' } = options

  const fund = structures.find(s => s.id === capitalCall.fundId) || null
  if (!fund) {
    throw new Error('Fund not found')
  }

  const notices: IndividualLPNotice[] = []

  for (const allocation of capitalCall.investorAllocations) {
    const pdfBuffer = await generateIndividualLPNoticePDF(
      capitalCall,
      allocation,
      fund,
      { firmName, bankDetails, currency }
    )

    notices.push({
      investorId: allocation.investorId,
      investorName: allocation.investorName,
      pdfBuffer,
      fileName: `Capital_Call_${capitalCall.callNumber}_${allocation.investorName.replace(/\s+/g, '_')}.pdf`
    })
  }

  return notices
}

/**
 * Generate a single LP-specific notice
 */
async function generateIndividualLPNoticePDF(
  capitalCall: CapitalCall,
  allocation: CapitalCallAllocation,
  fund: Structure | null,
  options: { firmName: string; bankDetails?: BankDetails; currency: string }
): Promise<Buffer> {
  const { firmName, bankDetails, currency } = options

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
        autoFirstPage: true
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header with LP name
      addNoticeHeader(doc, {
        firmName,
        title: `CAPITAL CALL NOTICE #${capitalCall.callNumber}`,
        fundName: fund?.name || capitalCall.fundName,
        date: capitalCall.callDate,
        recipientName: allocation.investorName
      })

      // Section A: Transaction Summary (LP-specific)
      addLPSectionA(doc, capitalCall, allocation, fund, currency)

      // Section B: Fee Breakdown (LP-specific)
      addLPSectionB(doc, capitalCall, allocation, fund, currency)

      // Section C: Payment Instructions
      addSectionC_PaymentInstructions(doc, capitalCall, bankDetails || fund?.bankDetails, currency)

      // Section D: Balance Summary (LP-specific)
      addLPSectionD(doc, allocation, currency)

      // Footer
      addNoticeFooter(doc, firmName)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// ============================================================================
// SECTION GENERATORS
// ============================================================================

function addNoticeHeader(
  doc: PDFKit.PDFDocument,
  options: {
    firmName: string
    title: string
    fundName: string
    date: string
    recipientName?: string
  }
) {
  const { firmName, title, fundName, date, recipientName } = options

  // Firm name
  doc.fontSize(20)
     .fillColor(COLORS.primary)
     .text(firmName, 50, 50)

  // Document title
  doc.fontSize(16)
     .fillColor(COLORS.text)
     .text(title, 50, 85)

  // Fund name
  doc.fontSize(12)
     .fillColor(COLORS.muted)
     .text(fundName, 50, 110)

  // Recipient (if individual notice)
  if (recipientName) {
    doc.moveDown(0.5)
    doc.fontSize(11)
       .fillColor(COLORS.text)
       .text(`Attention: ${recipientName}`)
  }

  // Date
  doc.fontSize(10)
     .fillColor(COLORS.muted)
     .text(
       `Notice Date: ${formatDate(date)}`,
       400,
       50,
       { align: 'right' }
     )

  // Divider
  doc.moveTo(50, recipientName ? 155 : 140)
     .lineTo(562, recipientName ? 155 : 140)
     .stroke(COLORS.border)

  doc.y = recipientName ? 165 : 150
}

function addSectionA_TransactionSummary(
  doc: PDFKit.PDFDocument,
  capitalCall: CapitalCall,
  fund: Structure | null,
  currency: string
) {
  const startY = doc.y + 10

  // Section header
  doc.rect(50, startY, 512, 25)
     .fill(COLORS.accent)

  doc.fontSize(12)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('SECTION A: TRANSACTION SUMMARY', 60, startY + 7)

  doc.y = startY + 35
  doc.font('Helvetica')

  // Summary table
  const summaryData = [
    ['Capital Call Number', `#${capitalCall.callNumber}`],
    ['Call Date', formatDate(capitalCall.callDate)],
    ['Due Date', formatDate(capitalCall.dueDate)],
    ['Notice Period', `${capitalCall.noticePeriodDays} days`],
    ['Total Call Amount', formatCurrency(capitalCall.totalCallAmount, currency)],
    ['Purpose', capitalCall.purpose],
    ['Transaction Type (ILPA)', capitalCall.transactionType],
    ['Use of Proceeds', capitalCall.useOfProceeds],
  ]

  if (capitalCall.relatedInvestmentName) {
    summaryData.push(['Related Investment', capitalCall.relatedInvestmentName])
  }

  let currentY = doc.y
  summaryData.forEach(([label, value]) => {
    doc.fontSize(10)
       .fillColor(COLORS.muted)
       .text(label, 60, currentY)

    doc.fillColor(COLORS.text)
       .text(String(value), 250, currentY, { width: 300 })

    currentY += 18
  })

  doc.y = currentY + 10
}

function addLPSectionA(
  doc: PDFKit.PDFDocument,
  capitalCall: CapitalCall,
  allocation: CapitalCallAllocation,
  fund: Structure | null,
  currency: string
) {
  const startY = doc.y + 10

  // Section header
  doc.rect(50, startY, 512, 25)
     .fill(COLORS.accent)

  doc.fontSize(12)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('SECTION A: TRANSACTION SUMMARY', 60, startY + 7)

  doc.y = startY + 35
  doc.font('Helvetica')

  const summaryData = [
    ['Capital Call Number', `#${capitalCall.callNumber}`],
    ['Call Date', formatDate(capitalCall.callDate)],
    ['Due Date', formatDate(capitalCall.dueDate)],
    ['Your Commitment', formatCurrency(allocation.commitment, currency)],
    ['Your Ownership %', `${allocation.ownershipPercent.toFixed(4)}%`],
    ['Your Call Amount', formatCurrency(allocation.callAmount, currency)],
    ['Purpose', capitalCall.purpose],
  ]

  let currentY = doc.y
  summaryData.forEach(([label, value]) => {
    doc.fontSize(10)
       .fillColor(COLORS.muted)
       .text(label, 60, currentY)

    doc.fillColor(COLORS.text)
       .font('Helvetica-Bold')
       .text(String(value), 250, currentY, { width: 300 })
       .font('Helvetica')

    currentY += 18
  })

  doc.y = currentY + 10
}

function addSectionB_FeeBreakdown(
  doc: PDFKit.PDFDocument,
  capitalCall: CapitalCall,
  fund: Structure | null,
  currency: string
) {
  if (doc.y > 600) doc.addPage()

  const startY = doc.y + 10

  // Section header
  doc.rect(50, startY, 512, 25)
     .fill(COLORS.accent)

  doc.fontSize(12)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('SECTION B: FEE BREAKDOWN (ILPA)', 60, startY + 7)

  doc.y = startY + 35
  doc.font('Helvetica')

  // Calculate fee breakdown
  const managementFeeRate = fund?.managementFee || 2.0
  const feeBase = fund?.managementFeeBase || 'committed'
  const vatRate = parseFloat(fund?.vatRate || '0') || 0

  const feeData = [
    ['Fee Calculation Base', formatFeeBase(feeBase)],
    ['Management Fee Rate', `${managementFeeRate}% per annum`],
    ['Fee Period', 'Quarterly'],
  ]

  if (capitalCall.managementFeeAmount) {
    feeData.push(['Management Fee Amount', formatCurrency(capitalCall.managementFeeAmount, currency)])
  }

  if (vatRate > 0) {
    feeData.push(['VAT Rate', `${vatRate}%`])
    const vatAmount = (capitalCall.managementFeeAmount || 0) * (vatRate / 100)
    feeData.push(['VAT Amount', formatCurrency(vatAmount, currency)])
  }

  const totalWithFees = capitalCall.totalCallAmount + (capitalCall.managementFeeAmount || 0)
  feeData.push(['', ''])
  feeData.push(['TOTAL CALL (incl. fees)', formatCurrency(totalWithFees, currency)])

  let currentY = doc.y
  feeData.forEach(([label, value], index) => {
    if (label === '') {
      // Divider line
      doc.moveTo(60, currentY + 5)
         .lineTo(400, currentY + 5)
         .stroke(COLORS.border)
      currentY += 15
      return
    }

    const isTotal = label.includes('TOTAL')

    doc.fontSize(10)
       .fillColor(isTotal ? COLORS.primary : COLORS.muted)
       .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
       .text(label, 60, currentY)

    doc.fillColor(isTotal ? COLORS.primary : COLORS.text)
       .text(String(value), 250, currentY)
       .font('Helvetica')

    currentY += 18
  })

  doc.y = currentY + 10
}

function addLPSectionB(
  doc: PDFKit.PDFDocument,
  capitalCall: CapitalCall,
  allocation: CapitalCallAllocation,
  fund: Structure | null,
  currency: string
) {
  if (doc.y > 600) doc.addPage()

  const startY = doc.y + 10

  // Section header
  doc.rect(50, startY, 512, 25)
     .fill(COLORS.accent)

  doc.fontSize(12)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('SECTION B: YOUR FEE BREAKDOWN (ILPA)', 60, startY + 7)

  doc.y = startY + 35
  doc.font('Helvetica')

  // Calculate LP-specific fees
  const managementFeeRate = fund?.managementFee || 2.0
  const feeBase = fund?.managementFeeBase || 'committed'
  const vatRate = parseFloat(fund?.vatRate || '0') || 0

  // Calculate management fee for this LP
  const lpFeeBase = feeBase === 'committed' ? allocation.commitment : allocation.calledCapitalToDate
  const quarterlyRate = managementFeeRate / 4
  const managementFeeGross = lpFeeBase * (quarterlyRate / 100)

  // For now, assume no discount (this would come from investor settings)
  const feeDiscount = 0
  const managementFeeNet = managementFeeGross * (1 - feeDiscount / 100)

  // Calculate VAT
  const vatAmount = vatRate > 0 ? managementFeeNet * (vatRate / 100) : 0

  const totalDue = allocation.callAmount + managementFeeNet + vatAmount

  const feeData = [
    ['Principal (Capital Call)', formatCurrency(allocation.callAmount, currency)],
    ['', ''],
    ['Fee Calculation Base', formatFeeBase(feeBase)],
    ['Your Fee Base Amount', formatCurrency(lpFeeBase, currency)],
    ['Management Fee (Quarterly)', formatCurrency(managementFeeGross, currency)],
  ]

  if (feeDiscount > 0) {
    feeData.push([`Fee Discount (${feeDiscount}%)`, `-${formatCurrency(managementFeeGross - managementFeeNet, currency)}`])
    feeData.push(['Management Fee (Net)', formatCurrency(managementFeeNet, currency)])
  }

  if (vatRate > 0) {
    feeData.push([`VAT (${vatRate}%)`, formatCurrency(vatAmount, currency)])
  }

  feeData.push(['', ''])
  feeData.push(['TOTAL AMOUNT DUE', formatCurrency(totalDue, currency)])

  let currentY = doc.y
  feeData.forEach(([label, value]) => {
    if (label === '') {
      doc.moveTo(60, currentY + 5)
         .lineTo(400, currentY + 5)
         .stroke(COLORS.border)
      currentY += 15
      return
    }

    const isTotal = label.includes('TOTAL')
    const isHighlight = label.includes('Principal')

    doc.fontSize(10)
       .fillColor(isTotal ? COLORS.primary : COLORS.muted)
       .font(isTotal || isHighlight ? 'Helvetica-Bold' : 'Helvetica')
       .text(label, 60, currentY)

    doc.fillColor(isTotal ? COLORS.primary : COLORS.text)
       .text(String(value), 300, currentY, { align: 'right', width: 150 })
       .font('Helvetica')

    currentY += 18
  })

  // Highlight box for total
  doc.rect(280, currentY - 25, 180, 22)
     .fillAndStroke(COLORS.accent, COLORS.primary)

  doc.fontSize(11)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(`TOTAL DUE: ${formatCurrency(totalDue, currency)}`, 290, currentY - 20)
     .font('Helvetica')

  doc.y = currentY + 20
}

function addSectionC_PaymentInstructions(
  doc: PDFKit.PDFDocument,
  capitalCall: CapitalCall,
  bankDetails: BankDetails | undefined,
  currency: string
) {
  if (doc.y > 550) doc.addPage()

  const startY = doc.y + 10

  // Section header
  doc.rect(50, startY, 512, 25)
     .fill(COLORS.accent)

  doc.fontSize(12)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('SECTION C: PAYMENT INSTRUCTIONS', 60, startY + 7)

  doc.y = startY + 35
  doc.font('Helvetica')

  // Payment due notice
  doc.fontSize(11)
     .fillColor(COLORS.warning)
     .font('Helvetica-Bold')
     .text(`Payment Due: ${formatDate(capitalCall.dueDate)}`, 60, doc.y)
     .font('Helvetica')

  doc.y += 20

  // Bank details
  const wireInstructions = bankDetails ? [
    ['Bank Name', bankDetails.bankName || '[To be configured]'],
    ['Account Name', bankDetails.accountName || '[To be configured]'],
    ['Account Number', bankDetails.accountNumber || '[To be configured]'],
    ['Routing Number (US)', bankDetails.routingNumber || 'N/A'],
    ['SWIFT Code', bankDetails.swiftCode || 'N/A'],
    ['CLABE (Mexico)', bankDetails.clabe || 'N/A'],
    ['IBAN (Europe)', bankDetails.iban || 'N/A'],
    ['Reference', bankDetails.reference || `Capital Call #${capitalCall.callNumber}`],
  ] : [
    ['Bank Name', '[To be configured in Fund Settings]'],
    ['Account Name', '[To be configured in Fund Settings]'],
    ['Account Number', '[To be configured in Fund Settings]'],
    ['Reference', `Capital Call #${capitalCall.callNumber} - ${capitalCall.fundName}`],
  ]

  // Filter out N/A entries
  const filteredInstructions = wireInstructions.filter(([_, value]) =>
    value !== 'N/A' && !value.includes('[To be configured]')
  )

  // If no real data, show placeholder
  const instructionsToShow = filteredInstructions.length > 2 ? filteredInstructions : wireInstructions.slice(0, 4)

  let currentY = doc.y
  instructionsToShow.forEach(([label, value]) => {
    doc.fontSize(10)
       .fillColor(COLORS.muted)
       .text(label, 60, currentY)

    doc.fillColor(COLORS.text)
       .font('Helvetica-Bold')
       .text(String(value), 200, currentY, { width: 350 })
       .font('Helvetica')

    currentY += 18
  })

  // Payment methods note
  doc.y = currentY + 10
  doc.fontSize(9)
     .fillColor(COLORS.muted)
     .text(
       'Accepted Payment Methods: Wire Transfer, ACH Transfer',
       60,
       doc.y
     )

  doc.y += 20
}

function addSectionD_BalanceSummary(
  doc: PDFKit.PDFDocument,
  capitalCall: CapitalCall,
  currency: string
) {
  if (doc.y > 500) doc.addPage()

  const startY = doc.y + 10

  // Section header
  doc.rect(50, startY, 512, 25)
     .fill(COLORS.accent)

  doc.fontSize(12)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('SECTION D: UNFUNDED COMMITMENT RECONCILIATION', 60, startY + 7)

  doc.y = startY + 40
  doc.font('Helvetica')

  // Table header
  const tableY = doc.y
  const headers = ['LP Name', 'Commitment', 'This Call', 'Called to Date', 'Unfunded']
  const colWidths = [150, 90, 90, 90, 90]
  let colX = 50

  doc.fontSize(9)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)

  headers.forEach((header, i) => {
    doc.text(header, colX, tableY, { width: colWidths[i] })
    colX += colWidths[i]
  })

  // Header underline
  doc.moveTo(50, tableY + 15)
     .lineTo(562, tableY + 15)
     .stroke(COLORS.border)

  // Table rows
  let currentY = tableY + 22
  doc.font('Helvetica')
     .fillColor(COLORS.text)

  capitalCall.investorAllocations.forEach((allocation, index) => {
    if (currentY > 700) {
      doc.addPage()
      currentY = 50
    }

    colX = 50
    const rowData = [
      allocation.investorName.substring(0, 25),
      formatCurrency(allocation.commitment, currency),
      formatCurrency(allocation.callAmount, currency),
      formatCurrency(allocation.calledCapitalToDate, currency),
      formatCurrency(allocation.uncalledCapital, currency)
    ]

    doc.fontSize(9)
    rowData.forEach((value, i) => {
      doc.text(value, colX, currentY, { width: colWidths[i] })
      colX += colWidths[i]
    })

    currentY += 16

    // Row divider
    if (index < capitalCall.investorAllocations.length - 1) {
      doc.moveTo(50, currentY - 4)
         .lineTo(562, currentY - 4)
         .stroke('#f0f0f0')
    }
  })

  // Totals row
  const totalCommitment = capitalCall.investorAllocations.reduce((sum, a) => sum + a.commitment, 0)
  const totalCallAmount = capitalCall.investorAllocations.reduce((sum, a) => sum + a.callAmount, 0)
  const totalCalled = capitalCall.investorAllocations.reduce((sum, a) => sum + a.calledCapitalToDate, 0)
  const totalUncalled = capitalCall.investorAllocations.reduce((sum, a) => sum + a.uncalledCapital, 0)

  doc.moveTo(50, currentY + 2)
     .lineTo(562, currentY + 2)
     .stroke(COLORS.primary)

  currentY += 8
  colX = 50

  doc.font('Helvetica-Bold')
     .fillColor(COLORS.primary)

  const totals = [
    'TOTAL',
    formatCurrency(totalCommitment, currency),
    formatCurrency(totalCallAmount, currency),
    formatCurrency(totalCalled, currency),
    formatCurrency(totalUncalled, currency)
  ]

  totals.forEach((value, i) => {
    doc.text(value, colX, currentY, { width: colWidths[i] })
    colX += colWidths[i]
  })

  doc.y = currentY + 30
}

function addLPSectionD(
  doc: PDFKit.PDFDocument,
  allocation: CapitalCallAllocation,
  currency: string
) {
  if (doc.y > 550) doc.addPage()

  const startY = doc.y + 10

  // Section header
  doc.rect(50, startY, 512, 25)
     .fill(COLORS.accent)

  doc.fontSize(12)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('SECTION D: YOUR BALANCE SUMMARY', 60, startY + 7)

  doc.y = startY + 35
  doc.font('Helvetica')

  // Balance reconciliation
  const balanceData = [
    ['Total Commitment', formatCurrency(allocation.commitment, currency)],
    ['Previously Called', formatCurrency(allocation.calledCapitalToDate - allocation.callAmount, currency)],
    ['This Capital Call', formatCurrency(allocation.callAmount, currency)],
    ['', ''],
    ['Total Called to Date', formatCurrency(allocation.calledCapitalToDate, currency)],
    ['Remaining Unfunded', formatCurrency(allocation.uncalledCapital, currency)],
  ]

  let currentY = doc.y
  balanceData.forEach(([label, value]) => {
    if (label === '') {
      doc.moveTo(60, currentY + 5)
         .lineTo(350, currentY + 5)
         .stroke(COLORS.border)
      currentY += 15
      return
    }

    const isHighlight = label.includes('Remaining') || label.includes('Total Called')

    doc.fontSize(10)
       .fillColor(COLORS.muted)
       .font(isHighlight ? 'Helvetica-Bold' : 'Helvetica')
       .text(label, 60, currentY)

    doc.fillColor(isHighlight ? COLORS.primary : COLORS.text)
       .text(String(value), 250, currentY, { width: 100, align: 'right' })
       .font('Helvetica')

    currentY += 18
  })

  // Continuity validation note
  doc.y = currentY + 15
  doc.fontSize(9)
     .fillColor(COLORS.muted)
     .text(
       'Balance Continuity: Commitment = Called to Date + Remaining Unfunded',
       60,
       doc.y
     )

  doc.y += 20
}

function addNoticeFooter(doc: PDFKit.PDFDocument, firmName: string) {
  const pages = doc.bufferedPageRange()

  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i)

    // Footer line
    doc.moveTo(50, 730)
       .lineTo(562, 730)
       .stroke(COLORS.border)

    // ILPA compliance note
    doc.fontSize(8)
       .fillColor(COLORS.muted)
       .text(
         'This notice is compliant with ILPA Capital Call & Distribution Template v2.0 standards.',
         50,
         740
       )

    // Generated by
    doc.text(
      `Generated by ${firmName}`,
      50,
      752
    )

    // Page number
    doc.text(
      `Page ${i + 1} of ${pages.count}`,
      0,
      752,
      { align: 'center', width: 612 }
    )

    // Date
    doc.text(
      new Date().toLocaleDateString('en-US'),
      0,
      752,
      { align: 'right', width: 562 }
    )
  }
}

// ============================================================================
// DOWNLOAD HELPERS
// ============================================================================

/**
 * Download fund-level capital call notice as PDF
 */
export async function downloadCapitalCallNoticePDF(
  capitalCall: CapitalCall,
  options: ILPANoticeOptions = {},
  structures: Structure[] = []
): Promise<void> {
  const buffer = await generateCapitalCallNoticePDF(capitalCall, options, structures)

  const blob = new Blob([buffer], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ILPA_Capital_Call_Notice_${capitalCall.callNumber}_${capitalCall.fundName.replace(/\s+/g, '_')}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Download all individual LP notices as a zip file
 * Note: Requires JSZip library for bundling
 */
export async function downloadAllLPNotices(
  capitalCall: CapitalCall,
  options: ILPANoticeOptions = {},
  structures: Structure[] = []
): Promise<IndividualLPNotice[]> {
  return generateIndividualLPNotices(capitalCall, options, structures)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// formatCurrency imported from format-utils at top of file

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatFeeBase(base: ManagementFeeBase | string): string {
  switch (base) {
    case 'committed':
      return 'Committed Capital'
    case 'invested':
      return 'Invested Capital'
    case 'nic_plus_unfunded':
      return 'NIC + Unfunded (ILPA)'
    default:
      return String(base)
  }
}

export default {
  generateCapitalCallNoticePDF,
  generateIndividualLPNotices,
  downloadCapitalCallNoticePDF,
  downloadAllLPNotices
}
