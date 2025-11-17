/**
 * K-1 PDF Generator
 * Generates IRS Form 1065 Schedule K-1 (Form 1065) PDF documents
 */

import PDFDocument from 'pdfkit'
import type { K1Data } from '@/lib/k1-calculations'
import { formatK1Amount, formatK1Percentage } from '@/lib/k1-calculations'

export async function generateK1PDF(k1Data: K1Data): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
        autoFirstPage: true
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Form Header
      addFormHeader(doc, k1Data)

      // Part I - Information About the Partnership
      addPartI(doc, k1Data)

      // Part II - Information About the Partner
      addPartII(doc, k1Data)

      // Part III - Partner's Share of Current Year Income, Deductions, Credits, and Other Items
      addPartIII(doc, k1Data)

      // Add footer with disclaimer
      addFooter(doc, k1Data)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

function addFormHeader(doc: PDFKit.PDFDocument, k1Data: K1Data) {
  // IRS Form Title
  doc.fontSize(16)
     .fillColor('#000000')
     .text('Schedule K-1', 40, 40, { continued: true })
     .fontSize(12)
     .text(' (Form 1065)', { continued: false })

  doc.fontSize(10)
     .text(`Partner's Share of Income, Deductions, Credits, etc.`, 40, 62)

  doc.fontSize(9)
     .fillColor('#666666')
     .text(`For calendar year ${k1Data.taxYear} or tax year beginning ______, ${k1Data.taxYear}, ending ______, ${k1Data.taxYear}`, 40, 78)

  // Form number
  doc.fontSize(8)
     .fillColor('#000000')
     .text('Form 1065', 500, 40, { align: 'right' })
  doc.text(`Tax Year ${k1Data.taxYear}`, 500, 52, { align: 'right' })

  // Horizontal line
  doc.moveTo(40, 100)
     .lineTo(572, 100)
     .stroke('#000000')

  doc.moveDown(2)
}

function addPartI(doc: PDFKit.PDFDocument, k1Data: K1Data) {
  const startY = 110

  doc.fontSize(11)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('Part I - Information About the Partnership', 40, startY)

  doc.font('Helvetica')
     .fontSize(9)

  const lineHeight = 15
  let currentY = startY + 20

  // Partnership name
  doc.text('A  Partnership\'s name:', 40, currentY)
  doc.text(k1Data.partnershipInfo.name, 200, currentY)
  currentY += lineHeight

  // Partnership EIN
  doc.text('B  Partnership\'s EIN:', 40, currentY)
  doc.text(k1Data.partnershipInfo.ein, 200, currentY)
  currentY += lineHeight

  // Partnership address
  doc.text('C  Partnership\'s address:', 40, currentY)
  doc.text(k1Data.partnershipInfo.address.street, 200, currentY)
  currentY += lineHeight
  doc.text(`${k1Data.partnershipInfo.address.city}, ${k1Data.partnershipInfo.address.state} ${k1Data.partnershipInfo.address.zipCode}`, 200, currentY)
  currentY += lineHeight + 5

  // IRS Center
  doc.text('D  IRS Center where partnership filed return:', 40, currentY)
  doc.text('Austin, TX', 200, currentY)

  currentY += lineHeight + 10

  // Divider
  doc.moveTo(40, currentY)
     .lineTo(572, currentY)
     .stroke('#CCCCCC')

  doc.y = currentY + 10
}

function addPartII(doc: PDFKit.PDFDocument, k1Data: K1Data) {
  const startY = doc.y

  doc.fontSize(11)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('Part II - Information About the Partner', 40, startY)

  doc.font('Helvetica')
     .fontSize(9)

  const lineHeight = 15
  let currentY = startY + 20

  // Partner name
  doc.text('E  Partner\'s name:', 40, currentY)
  doc.text(k1Data.partnerInfo.name, 200, currentY)
  currentY += lineHeight

  // Partner TIN
  doc.text('F  Partner\'s identifying number:', 40, currentY)
  doc.text(k1Data.partnerInfo.taxId, 200, currentY)
  currentY += lineHeight

  // Partner address
  doc.text('G  Partner\'s address:', 40, currentY)
  doc.text(k1Data.partnerInfo.address.street, 200, currentY)
  currentY += lineHeight
  doc.text(`${k1Data.partnerInfo.address.city}, ${k1Data.partnerInfo.address.state} ${k1Data.partnerInfo.address.zipCode}`, 200, currentY)
  currentY += lineHeight + 5

  // Partner type
  doc.text('H  General partner or LLC member-manager', 40, currentY)
  doc.text('☐', 300, currentY)
  doc.text('Limited partner or other LLC member', 340, currentY)
  doc.text('☑', 500, currentY)
  currentY += lineHeight

  // Partner's share percentages
  currentY += 5
  doc.font('Helvetica-Bold').text('I  Partner\'s share of:', 40, currentY)
  doc.font('Helvetica')
  currentY += lineHeight

  doc.text('Profit sharing', 60, currentY)
  doc.text(formatK1Percentage(k1Data.partnerInfo.profitSharingPercent), 200, currentY)
  currentY += lineHeight

  doc.text('Loss sharing', 60, currentY)
  doc.text(formatK1Percentage(k1Data.partnerInfo.lossSharingPercent), 200, currentY)
  currentY += lineHeight

  doc.text('Capital sharing', 60, currentY)
  doc.text(formatK1Percentage(k1Data.partnerInfo.capitalSharingPercent), 200, currentY)
  currentY += lineHeight

  // Partner's capital account analysis
  currentY += 5
  doc.font('Helvetica-Bold').text('J  Partner\'s capital account analysis:', 40, currentY)
  doc.font('Helvetica')
  currentY += lineHeight

  doc.text('Beginning capital account', 60, currentY)
  doc.text(`$${formatK1Amount(k1Data.capitalAccount.beginningBalance)}`, 350, currentY, { align: 'right', width: 180 })
  currentY += lineHeight

  doc.text('Capital contributed during the year', 60, currentY)
  doc.text(`$${formatK1Amount(k1Data.capitalAccount.capitalContributed)}`, 350, currentY, { align: 'right', width: 180 })
  currentY += lineHeight

  doc.text('Current year net income (loss)', 60, currentY)
  doc.text(`$${formatK1Amount(k1Data.capitalAccount.currentYearIncrease)}`, 350, currentY, { align: 'right', width: 180 })
  currentY += lineHeight

  doc.text('Withdrawals and distributions', 60, currentY)
  doc.text(`($${formatK1Amount(k1Data.capitalAccount.withdrawalsDistributions)})`, 350, currentY, { align: 'right', width: 180 })
  currentY += lineHeight

  doc.font('Helvetica-Bold')
  doc.text('Ending capital account', 60, currentY)
  doc.text(`$${formatK1Amount(k1Data.capitalAccount.endingBalance)}`, 350, currentY, { align: 'right', width: 180 })
  doc.font('Helvetica')

  currentY += lineHeight + 10

  // Divider
  doc.moveTo(40, currentY)
     .lineTo(572, currentY)
     .stroke('#CCCCCC')

  doc.y = currentY + 10
}

function addPartIII(doc: PDFKit.PDFDocument, k1Data: K1Data) {
  // Check if we need a new page
  if (doc.y > 600) {
    doc.addPage()
  }

  const startY = doc.y

  doc.fontSize(11)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('Part III - Partner\'s Share of Current Year Income, Deductions, Credits, and Other Items', 40, startY, { width: 520 })

  doc.font('Helvetica')
     .fontSize(9)

  const lineHeight = 14
  let currentY = startY + 25

  // Income Section
  doc.font('Helvetica-Bold').text('Ordinary Business Income (Loss)', 40, currentY)
  doc.font('Helvetica')
  currentY += lineHeight

  addK1Line(doc, '1', 'Ordinary business income (loss)', k1Data.income.ordinaryBusinessIncome, currentY)
  currentY += lineHeight

  if (k1Data.income.netRentalRealEstateIncome !== 0) {
    addK1Line(doc, '2', 'Net rental real estate income (loss)', k1Data.income.netRentalRealEstateIncome, currentY)
    currentY += lineHeight
  }

  if (k1Data.income.guaranteedPayments !== 0) {
    addK1Line(doc, '4', 'Guaranteed payments', k1Data.income.guaranteedPayments, currentY)
    currentY += lineHeight
  }

  // Capital Gains Section
  if (k1Data.income.netLongTermCapitalGain !== 0) {
    currentY += 5
    doc.font('Helvetica-Bold').text('Capital Gains and Losses', 40, currentY)
    doc.font('Helvetica')
    currentY += lineHeight

    addK1Line(doc, '9a', 'Net long-term capital gain (loss)', k1Data.income.netLongTermCapitalGain, currentY)
    currentY += lineHeight
  }

  // Deductions Section
  if (k1Data.deductions.otherDeductions !== 0) {
    currentY += 5
    doc.font('Helvetica-Bold').text('Deductions', 40, currentY)
    doc.font('Helvetica')
    currentY += lineHeight

    addK1Line(doc, '13', 'Other deductions', k1Data.deductions.otherDeductions, currentY)
    currentY += lineHeight
  }

  // Other Information
  if (k1Data.otherInformation.investmentIncomeExpenses !== 0) {
    currentY += 5
    doc.font('Helvetica-Bold').text('Other Information', 40, currentY)
    doc.font('Helvetica')
    currentY += lineHeight

    addK1Line(doc, '20', 'Investment income/expenses', k1Data.otherInformation.investmentIncomeExpenses, currentY)
    currentY += lineHeight
  }

  doc.y = currentY + 10
}

function addK1Line(doc: PDFKit.PDFDocument, boxNumber: string, description: string, amount: number, y: number) {
  doc.fontSize(9)
  doc.text(boxNumber, 50, y, { width: 30 })
  doc.text(description, 85, y, { width: 350 })
  doc.text(`$${formatK1Amount(amount)}`, 440, y, { align: 'right', width: 120 })
}

function addFooter(doc: PDFKit.PDFDocument, k1Data: K1Data) {
  // Check if we need a new page
  if (doc.y > 680) {
    doc.addPage()
  }

  const footerY = doc.y + 20

  // Divider
  doc.moveTo(40, footerY)
     .lineTo(572, footerY)
     .stroke('#CCCCCC')

  doc.fontSize(8)
     .fillColor('#666666')
     .text('Note: This K-1 is generated for informational purposes. Please consult with your tax advisor.', 40, footerY + 10, { width: 532, align: 'center' })

  doc.text('Generated by Polibit Investment Manager', 40, footerY + 25, { width: 532, align: 'center' })
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 40, footerY + 35, { width: 532, align: 'center' })

  // Add page number at bottom
  const pages = doc.bufferedPageRange()
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i)
    doc.fontSize(8)
       .fillColor('#999999')
       .text(`Page ${i + 1} of ${pages.count}`, 40, 760, { align: 'center', width: 532 })
  }
}
