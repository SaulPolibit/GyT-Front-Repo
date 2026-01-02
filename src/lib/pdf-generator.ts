/**
 * PDF Report Generator
 * Generates professional PDF reports using PDFKit
 */

import PDFDocument from 'pdfkit'
import type { Report, Investment, Investor } from '@/lib/types'

interface PDFGeneratorOptions {
  report: Report
  investments: Investment[]
  investors: Investor[]
  firmName?: string
}

export async function generateReportPDF(options: PDFGeneratorOptions): Promise<Buffer> {
  const { report, investments, investors, firmName = 'Investment Manager' } = options

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
      addHeader(doc, report, firmName)

      // Report Summary
      addReportSummary(doc, report)

      // Metrics Table
      addMetricsTable(doc, report)

      // Investments Section
      if (investments.length > 0) {
        addInvestmentsSection(doc, report, investments)
      }

      // Investors Section (for Capital Calls and Distributions)
      if (report.capitalCall || report.distribution) {
        addInvestorAllocationsSection(doc, report, investors)
      }

      // Footer
      addFooter(doc, firmName)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

function addHeader(doc: PDFKit.PDFDocument, report: Report, firmName: string) {
  // Company logo/name
  doc.fontSize(24)
     .fillColor('#6b21a8') // Primary purple
     .text(firmName, 50, 50)

  // Report title
  doc.fontSize(20)
     .fillColor('#000000')
     .text(report.title, 50, 90)

  // Date range
  doc.fontSize(10)
     .fillColor('#666666')
     .text(
       `${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}`,
       50,
       120
     )

  // Status badge
  doc.fontSize(10)
     .fillColor('#6b21a8')
     .text(`Status: ${report.status}`, 400, 120)

  // Divider line
  doc.moveTo(50, 140)
     .lineTo(562, 140)
     .stroke('#cccccc')

  doc.moveDown(3)
}

function addReportSummary(doc: PDFKit.PDFDocument, report: Report) {
  const startY = doc.y

  doc.fontSize(14)
     .fillColor('#000000')
     .text('Report Summary', 50, startY)

  doc.moveDown(0.5)

  doc.fontSize(10)
     .fillColor('#666666')

  const summaryY = doc.y

  // Left column
  doc.text(`Report Type: ${report.type}`, 50, summaryY)
  doc.text(`Generated: ${formatDate(report.generatedDate)}`, 50, summaryY + 15)
  if (report.publishedDate) {
    doc.text(`Published: ${formatDate(report.publishedDate)}`, 50, summaryY + 30)
  }

  // Right column
  doc.text(`Created By: ${report.createdBy}`, 320, summaryY)
  doc.text(`Report ID: ${report.id}`, 320, summaryY + 15)

  doc.moveDown(3)
}

function addMetricsTable(doc: PDFKit.PDFDocument, report: Report) {
  const startY = doc.y

  doc.fontSize(14)
     .fillColor('#000000')
     .text('Key Metrics', 50, startY)

  doc.moveDown(0.5)

  // Table background
  const tableY = doc.y
  doc.rect(50, tableY, 512, 120)
     .fillAndStroke('#f9fafb', '#e5e7eb')

  // Table content
  doc.fontSize(10)
     .fillColor('#000000')

  const rowHeight = 30
  const colWidth = 128

  // Row 1
  let currentY = tableY + 10
  doc.font('Helvetica-Bold').text('Total AUM', 60, currentY)
  doc.font('Helvetica-Bold').text('Avg IRR', 60 + colWidth, currentY)
  doc.font('Helvetica-Bold').text('Investments', 60 + colWidth * 2, currentY)
  doc.font('Helvetica-Bold').text('Investors', 60 + colWidth * 3, currentY)

  currentY += 15
  doc.font('Helvetica').fillColor('#666666')
  doc.text(formatCurrency(report.metrics.totalAUM), 60, currentY)
  doc.text(`${report.metrics.avgIRR.toFixed(1)}%`, 60 + colWidth, currentY)
  doc.text(report.metrics.totalInvestments.toString(), 60 + colWidth * 2, currentY)
  doc.text(report.metrics.totalInvestors.toString(), 60 + colWidth * 3, currentY)

  // Row 2
  currentY += rowHeight
  doc.font('Helvetica-Bold').fillColor('#000000')
  doc.text('Total Distributions', 60, currentY)
  doc.text('Period Start', 60 + colWidth, currentY)
  doc.text('Period End', 60 + colWidth * 2, currentY)
  doc.text('Recipients', 60 + colWidth * 3, currentY)

  currentY += 15
  doc.font('Helvetica').fillColor('#666666')
  doc.text(formatCurrency(report.metrics.totalDistributions), 60, currentY)
  doc.text(formatDate(report.periodStart), 60 + colWidth, currentY)
  doc.text(formatDate(report.periodEnd), 60 + colWidth * 2, currentY)
  doc.text(report.sentTo.length.toString(), 60 + colWidth * 3, currentY)

  doc.y = tableY + 130
  doc.moveDown(2)
}

function addInvestmentsSection(
  doc: PDFKit.PDFDocument,
  report: Report,
  investments: Investment[]
) {
  // Check if we need a new page
  if (doc.y > 600) {
    doc.addPage()
  }

  const startY = doc.y

  doc.fontSize(14)
     .fillColor('#000000')
     .text('Portfolio Investments', 50, startY)

  doc.moveDown(0.5)

  // Get included investments
  const includedInvestments = investments.filter(inv =>
    report.includesInvestments.includes(inv.id)
  )

  // Table header
  const tableY = doc.y
  doc.fontSize(9)
     .font('Helvetica-Bold')
     .fillColor('#000000')

  doc.text('Investment', 50, tableY)
  doc.text('Type', 200, tableY)
  doc.text('Sector', 280, tableY)
  doc.text('Invested', 360, tableY)
  doc.text('Current Value', 450, tableY)

  // Divider
  doc.moveTo(50, tableY + 15)
     .lineTo(562, tableY + 15)
     .stroke('#cccccc')

  let currentY = tableY + 20

  // Table rows
  doc.font('Helvetica').fillColor('#333333')

  includedInvestments.forEach((investment, index) => {
    // Check if we need a new page
    if (currentY > 700) {
      doc.addPage()
      currentY = 50

      // Repeat header
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
      doc.text('Investment', 50, currentY)
      doc.text('Type', 200, currentY)
      doc.text('Sector', 280, currentY)
      doc.text('Invested', 360, currentY)
      doc.text('Current Value', 450, currentY)
      doc.moveTo(50, currentY + 15).lineTo(562, currentY + 15).stroke('#cccccc')
      currentY += 20
      doc.font('Helvetica').fillColor('#333333')
    }

    doc.text(investment.name.substring(0, 25), 50, currentY, { width: 140 })
    doc.text(investment.type, 200, currentY)
    doc.text(investment.sector, 280, currentY)
    doc.text(
      formatCurrency(investment.totalFundPosition.totalInvested),
      360,
      currentY
    )
    doc.text(
      formatCurrency(investment.totalFundPosition.currentValue),
      450,
      currentY
    )

    currentY += 20

    // Add subtle divider between rows
    if (index < includedInvestments.length - 1) {
      doc.moveTo(50, currentY - 5)
         .lineTo(562, currentY - 5)
         .stroke('#f0f0f0')
    }
  })

  doc.y = currentY
  doc.moveDown(2)
}

function addInvestorAllocationsSection(
  doc: PDFKit.PDFDocument,
  report: Report,
  investors: Investor[]
) {
  // Check if we need a new page
  if (doc.y > 600) {
    doc.addPage()
  }

  const allocations = report.capitalCall?.investorAllocations ||
                     report.distribution?.investorAllocations

  if (!allocations || allocations.length === 0) return

  const startY = doc.y
  const isCapitalCall = !!report.capitalCall

  doc.fontSize(14)
     .fillColor('#000000')
     .text(
       isCapitalCall ? 'Capital Call Allocations' : 'Distribution Allocations',
       50,
       startY
     )

  doc.moveDown(0.5)

  // Summary box
  const summaryY = doc.y
  doc.rect(50, summaryY, 512, 60)
     .fillAndStroke('#f0f7ff', '#6b21a8')

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#6b21a8')
     .text('Total Amount', 60, summaryY + 10)

  const totalAmount = report.capitalCall?.totalCallAmount ||
                     report.distribution?.totalDistributionAmount || 0

  doc.fontSize(18)
     .fillColor('#000000')
     .text(formatCurrency(totalAmount), 60, summaryY + 25)

  if (report.capitalCall) {
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Due Date: ${formatDate(report.capitalCall.dueDate)}`, 320, summaryY + 15)
    doc.text(`Purpose: ${report.capitalCall.purpose}`, 320, summaryY + 30, {
      width: 200
    })
  } else if (report.distribution) {
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Distribution Date: ${formatDate(report.distribution.distributionDate)}`, 320, summaryY + 15)
    doc.text(`Source: ${report.distribution.source}`, 320, summaryY + 30)
  }

  doc.y = summaryY + 70
  doc.moveDown(1)

  // Allocations table
  const tableY = doc.y
  doc.fontSize(9)
     .font('Helvetica-Bold')
     .fillColor('#000000')

  doc.text('Investor', 50, tableY)
  doc.text('Type', 220, tableY)
  doc.text('Ownership', 320, tableY)
  doc.text('Amount', 400, tableY)
  doc.text('Status', 490, tableY)

  // Divider
  doc.moveTo(50, tableY + 15)
     .lineTo(562, tableY + 15)
     .stroke('#cccccc')

  let currentY = tableY + 20

  doc.font('Helvetica').fillColor('#333333')

  allocations.forEach((allocation, index) => {
    if (currentY > 700) {
      doc.addPage()
      currentY = 50
    }

    doc.text(allocation.investorName, 50, currentY, { width: 160 })
    doc.text(allocation.investorType, 220, currentY)
    doc.text(`${allocation.ownershipPercent.toFixed(2)}%`, 320, currentY)
    doc.text(formatCurrency(allocation.amount), 400, currentY)
    doc.text(allocation.status || 'Pending', 490, currentY)

    currentY += 20

    if (index < allocations.length - 1) {
      doc.moveTo(50, currentY - 5)
         .lineTo(562, currentY - 5)
         .stroke('#f0f0f0')
    }
  })

  doc.y = currentY
}

function addFooter(doc: PDFKit.PDFDocument, firmName: string) {
  const pages = doc.bufferedPageRange()

  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i)

    // Footer line
    doc.moveTo(50, 750)
       .lineTo(562, 750)
       .stroke('#cccccc')

    // Footer text
    doc.fontSize(8)
       .fillColor('#999999')
       .text(
         `Generated by ${firmName}`,
         50,
         760,
         { align: 'left' }
       )

    doc.text(
      `Page ${i + 1} of ${pages.count}`,
      0,
      760,
      { align: 'center', width: 612 }
    )

    doc.text(
      new Date().toLocaleDateString('en-US'),
      0,
      760,
      { align: 'right', width: 562 }
    )
  }
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
