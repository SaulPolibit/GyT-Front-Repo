/**
 * Custom Report PDF Generator
 * Generates customizable PDF reports based on selected data fields
 */

import PDFDocument from 'pdfkit'
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
  firmName?: string
}

export async function generateCustomPDF(data: CustomReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
        autoFirstPage: true,
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Cover page
      addCoverPage(doc, data)

      // Portfolio Summary (if any fields selected)
      if (shouldIncludePortfolioSummary(data.includeFields)) {
        doc.addPage()
        addPortfolioSummary(doc, data)
      }

      // Investment Details
      if (shouldIncludeInvestmentDetails(data.includeFields) && data.investments.length > 0) {
        doc.addPage()
        addInvestmentDetails(doc, data)
      }

      // Performance Metrics
      if (shouldIncludePerformanceMetrics(data.includeFields) && data.investments.length > 0) {
        doc.addPage()
        addPerformanceMetrics(doc, data)
      }

      // Investor Information
      if (shouldIncludeInvestorInfo(data.includeFields) && data.investors.length > 0) {
        doc.addPage()
        addInvestorInformation(doc, data)
      }

      // Financial Details
      if (shouldIncludeFinancialDetails(data.includeFields)) {
        doc.addPage()
        addFinancialDetails(doc, data)
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

function addCoverPage(doc: PDFKit.PDFDocument, data: CustomReportData) {
  doc.fontSize(32)
     .fillColor('#2521A0')
     .text(data.title, 50, 200, { align: 'center', width: 512 })

  doc.fontSize(16)
     .fillColor('#666666')
     .text(`${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}`, 50, 280, { align: 'center', width: 512 })

  doc.fontSize(12)
     .text(`Generated: ${formatDate(data.generatedDate)}`, 50, 320, { align: 'center', width: 512 })

  doc.fontSize(10)
     .fillColor('#999999')
     .text(data.firmName || 'Investment Manager', 50, 700, { align: 'center', width: 512 })
}

function addPortfolioSummary(doc: PDFKit.PDFDocument, data: CustomReportData) {
  addSectionHeader(doc, 'Portfolio Summary')

  const { metrics, includeFields } = data
  let currentY = 140

  if (includeFields.totalAUM) {
    addMetricRow(doc, 'Total Assets Under Management', formatCurrency(metrics.totalAUM), currentY)
    currentY += 30
  }

  if (includeFields.totalInvestments) {
    addMetricRow(doc, 'Total Investments', metrics.totalInvestments.toString(), currentY)
    currentY += 30
  }

  if (includeFields.totalInvestors) {
    addMetricRow(doc, 'Total Investors', metrics.totalInvestors.toString(), currentY)
    currentY += 30
  }

  if (includeFields.avgIRR) {
    addMetricRow(doc, 'Average IRR', `${metrics.avgIRR.toFixed(2)}%`, currentY)
    currentY += 30
  }

  if (includeFields.avgMultiple) {
    addMetricRow(doc, 'Average Multiple', `${metrics.avgMultiple.toFixed(2)}x`, currentY)
    currentY += 30
  }
}

function addInvestmentDetails(doc: PDFKit.PDFDocument, data: CustomReportData) {
  addSectionHeader(doc, 'Investment Details')

  const { investments, includeFields } = data
  let currentY = 140

  if (includeFields.investmentBreakdown) {
    doc.fontSize(14).fillColor('#000000').text('Investment Breakdown', 50, currentY)
    currentY += 25

    investments.forEach((investment, index) => {
      if (currentY > 700) {
        doc.addPage()
        currentY = 50
      }

      doc.fontSize(11).font('Helvetica-Bold').text(investment.name, 60, currentY)
      currentY += 15

      doc.fontSize(9).font('Helvetica')
      doc.text(`Type: ${investment.type}`, 70, currentY)
      currentY += 12
      doc.text(`Sector: ${investment.sector}`, 70, currentY)
      currentY += 12
      doc.text(`Status: ${investment.status}`, 70, currentY)
      currentY += 12
      doc.text(`Current Value: ${formatCurrency(investment.totalFundPosition.currentValue)}`, 70, currentY)
      currentY += 25
    })
  }

  if (includeFields.assetAllocation) {
    if (currentY > 650) {
      doc.addPage()
      currentY = 50
    }

    doc.fontSize(14).font('Helvetica-Bold').text('Asset Allocation', 50, currentY)
    currentY += 25

    const typeBreakdown = investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + inv.totalFundPosition.currentValue
      return acc
    }, {} as Record<string, number>)

    Object.entries(typeBreakdown).forEach(([type, value]) => {
      const percentage = (value / data.metrics.totalAUM) * 100
      doc.fontSize(10).font('Helvetica')
      doc.text(`${type}: ${formatCurrency(value)} (${percentage.toFixed(1)}%)`, 60, currentY)
      currentY += 15
    })
  }

  if (includeFields.geographicDistribution) {
    if (currentY > 650) {
      doc.addPage()
      currentY = 50
    }

    currentY += 10
    doc.fontSize(14).font('Helvetica-Bold').text('Geographic Distribution', 50, currentY)
    currentY += 25

    const countryBreakdown = investments.reduce((acc, inv) => {
      const country = inv.geography.country
      acc[country] = (acc[country] || 0) + inv.totalFundPosition.currentValue
      return acc
    }, {} as Record<string, number>)

    Object.entries(countryBreakdown).forEach(([country, value]) => {
      const percentage = (value / data.metrics.totalAUM) * 100
      doc.fontSize(10).font('Helvetica')
      doc.text(`${country}: ${formatCurrency(value)} (${percentage.toFixed(1)}%)`, 60, currentY)
      currentY += 15
    })
  }

  if (includeFields.sectorBreakdown) {
    if (currentY > 650) {
      doc.addPage()
      currentY = 50
    }

    currentY += 10
    doc.fontSize(14).font('Helvetica-Bold').text('Sector Breakdown', 50, currentY)
    currentY += 25

    const sectorBreakdown = investments.reduce((acc, inv) => {
      acc[inv.sector] = (acc[inv.sector] || 0) + inv.totalFundPosition.currentValue
      return acc
    }, {} as Record<string, number>)

    Object.entries(sectorBreakdown).forEach(([sector, value]) => {
      const percentage = (value / data.metrics.totalAUM) * 100
      doc.fontSize(10).font('Helvetica')
      doc.text(`${sector}: ${formatCurrency(value)} (${percentage.toFixed(1)}%)`, 60, currentY)
      currentY += 15
    })
  }
}

function addPerformanceMetrics(doc: PDFKit.PDFDocument, data: CustomReportData) {
  addSectionHeader(doc, 'Performance Metrics')

  const { investments, includeFields } = data
  let currentY = 140

  if (includeFields.individualIRR) {
    doc.fontSize(14).font('Helvetica-Bold').text('Individual IRR', 50, currentY)
    currentY += 25

    investments.forEach(inv => {
      if (currentY > 720) {
        doc.addPage()
        currentY = 50
      }
      doc.fontSize(10).font('Helvetica')
      doc.text(`${inv.name}: ${inv.totalFundPosition.irr.toFixed(2)}%`, 60, currentY)
      currentY += 15
    })
    currentY += 10
  }

  if (includeFields.individualMultiples) {
    if (currentY > 680) {
      doc.addPage()
      currentY = 50
    }

    doc.fontSize(14).font('Helvetica-Bold').text('Individual Multiples', 50, currentY)
    currentY += 25

    investments.forEach(inv => {
      if (currentY > 720) {
        doc.addPage()
        currentY = 50
      }
      doc.fontSize(10).font('Helvetica')
      doc.text(`${inv.name}: ${inv.totalFundPosition.multiple.toFixed(2)}x`, 60, currentY)
      currentY += 15
    })
    currentY += 10
  }

  if (includeFields.unrealizedGains) {
    if (currentY > 680) {
      doc.addPage()
      currentY = 50
    }

    doc.fontSize(14).font('Helvetica-Bold').text('Unrealized Gains', 50, currentY)
    currentY += 25

    investments.forEach(inv => {
      if (currentY > 720) {
        doc.addPage()
        currentY = 50
      }
      doc.fontSize(10).font('Helvetica')
      doc.text(`${inv.name}: ${formatCurrency(inv.totalFundPosition.unrealizedGain)}`, 60, currentY)
      currentY += 15
    })
  }
}

function addInvestorInformation(doc: PDFKit.PDFDocument, data: CustomReportData) {
  addSectionHeader(doc, 'Investor Information')

  const { investors, includeFields } = data
  let currentY = 140

  if (includeFields.investorList) {
    doc.fontSize(14).font('Helvetica-Bold').text('Investor List', 50, currentY)
    currentY += 25

    investors.forEach(investor => {
      if (currentY > 700) {
        doc.addPage()
        currentY = 50
      }

      doc.fontSize(11).font('Helvetica-Bold').text(investor.name, 60, currentY)
      currentY += 15
      doc.fontSize(9).font('Helvetica')
      doc.text(`Type: ${investor.type}`, 70, currentY)
      currentY += 12
      doc.text(`Status: ${investor.status}`, 70, currentY)
      currentY += 12
      doc.text(`Current Value: ${formatCurrency(investor.currentValue)}`, 70, currentY)
      currentY += 12
      doc.text(`IRR: ${investor.irr.toFixed(2)}%`, 70, currentY)
      currentY += 20
    })
  }

  if (includeFields.investorAllocations) {
    if (currentY > 650) {
      doc.addPage()
      currentY = 50
    }

    doc.fontSize(14).font('Helvetica-Bold').text('Investor Allocations', 50, currentY)
    currentY += 25

    investors.forEach(investor => {
      if (currentY > 720) {
        doc.addPage()
        currentY = 50
      }
      // Aggregate ownership across all funds
      const totalOwnership = investor.fundOwnerships?.reduce((sum, fo) => sum + fo.ownershipPercent, 0) || 0
      doc.fontSize(10).font('Helvetica')
      doc.text(
        `${investor.name}: ${totalOwnership.toFixed(2)}% (${formatCurrency(investor.currentValue)})`,
        60,
        currentY
      )
      currentY += 15
    })
  }
}

function addFinancialDetails(doc: PDFKit.PDFDocument, data: CustomReportData) {
  addSectionHeader(doc, 'Financial Details')

  const { metrics, includeFields } = data
  let currentY = 140

  if (includeFields.cashFlows) {
    doc.fontSize(14).font('Helvetica-Bold').text('Cash Flows', 50, currentY)
    currentY += 25

    doc.fontSize(10).font('Helvetica')
    doc.text(`Total Distributions: ${formatCurrency(metrics.totalDistributions)}`, 60, currentY)
    currentY += 15
    doc.text(`Total Unrealized Gains: ${formatCurrency(metrics.totalUnrealizedGains)}`, 60, currentY)
    currentY += 30
  }

  if (includeFields.valuationHistory) {
    doc.fontSize(14).font('Helvetica-Bold').text('Current Valuation', 50, currentY)
    currentY += 25

    doc.fontSize(10).font('Helvetica')
    doc.text(`Total AUM: ${formatCurrency(metrics.totalAUM)}`, 60, currentY)
    currentY += 15
    doc.text(`Number of Investments: ${metrics.totalInvestments}`, 60, currentY)
    currentY += 15
    doc.text(`Average IRR: ${metrics.avgIRR.toFixed(2)}%`, 60, currentY)
  }
}

function addSectionHeader(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(20)
     .fillColor('#2521A0')
     .text(title, 50, 80)

  doc.moveTo(50, 110)
     .lineTo(562, 110)
     .stroke('#2521A0')
}

function addMetricRow(doc: PDFKit.PDFDocument, label: string, value: string, y: number) {
  doc.fontSize(12)
     .fillColor('#666666')
     .text(label, 70, y)

  doc.fontSize(16)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text(value, 350, y)

  doc.font('Helvetica')
}

function shouldIncludePortfolioSummary(fields: Record<string, boolean>): boolean {
  return fields.totalAUM || fields.totalInvestments || fields.totalInvestors || fields.avgIRR || fields.avgMultiple
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
    month: 'long',
    day: 'numeric',
  })
}
