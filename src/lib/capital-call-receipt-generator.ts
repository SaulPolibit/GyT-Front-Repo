import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface CapitalCallReceiptData {
  capitalCall: {
    id: string
    fundName: string
    callNumber: number
    callDate: string
    dueDate: string
    purpose: string
    useOfProceeds?: string
    currency: string
  }
  investorAllocation: {
    investorName: string
    investorType: string
    callAmount: number
    amountPaid: number
    amountOutstanding: number
    status: string
    paidDate?: string
    paymentMethod?: string
    transactionReference?: string
    bankDetails?: string
    commitment: number
    calledCapitalToDate?: number
    uncalledCapital?: number
  }
  investorName: string
  firmName: string
}

export function generateCapitalCallReceiptPDF(data: CapitalCallReceiptData): void {
  const doc = new jsPDF()
  const { capitalCall, investorAllocation, investorName, firmName } = data

  // Colors
  const primaryColor: [number, number, number] = [99, 102, 241] // Indigo
  const successColor: [number, number, number] = [34, 197, 94] // Green
  const textColor: [number, number, number] = [55, 65, 81] // Gray-700

  // Header with firm branding (white-label)
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(firmName.toUpperCase(), 20, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Investment Management Platform', 20, 28)

  // Payment Completed Banner
  if (investorAllocation.status === 'Paid') {
    doc.setFillColor(...successColor)
    doc.rect(20, 50, 170, 15, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('✓ PAYMENT COMPLETED', 25, 59)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const paidDate = investorAllocation.paidDate
      ? new Date(investorAllocation.paidDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A'
    doc.text(`Payment processed on ${paidDate}`, 25, 62)
  }

  let yPos = 75

  // Title
  doc.setTextColor(...textColor)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Capital Call Receipt', 20, yPos)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Receipt #${capitalCall.id.slice(0, 12)}`, 20, yPos + 6)

  yPos += 20

  // Two-column layout
  const col1X = 20
  const col2X = 110
  const colWidth = 80

  // Capital Call Information
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Capital Call Information', col1X, yPos)

  yPos += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const callInfo = [
    ['Fund:', capitalCall.fundName],
    ['Call Number:', `#${capitalCall.callNumber}`],
    ['Call Date:', new Date(capitalCall.callDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Due Date:', new Date(capitalCall.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Purpose:', capitalCall.purpose],
  ]

  if (capitalCall.useOfProceeds) {
    callInfo.push(['Use of Proceeds:', capitalCall.useOfProceeds])
  }

  callInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, col1X, yPos)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(value, colWidth - 25)
    doc.text(lines, col1X + 25, yPos)
    yPos += 6
  })

  // Payment Details (right column)
  yPos = 95 + 8
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Details', col2X, 95)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const paymentInfo = [
    ['Investor:', investorName],
    ['Investor Type:', investorAllocation.investorType],
    ['Call Amount:', formatCurrency(investorAllocation.callAmount, capitalCall.currency)],
    ['Amount Paid:', formatCurrency(investorAllocation.amountPaid, capitalCall.currency)],
    ['Outstanding:', formatCurrency(investorAllocation.amountOutstanding, capitalCall.currency)],
    ['Status:', investorAllocation.status],
  ]

  if (investorAllocation.paidDate) {
    paymentInfo.push(['Payment Date:', new Date(investorAllocation.paidDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })])
  }

  paymentInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, col2X, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, col2X + 30, yPos)
    yPos += 6
  })

  // Transaction Information (if paid)
  if (investorAllocation.status === 'Paid' && investorAllocation.paymentMethod) {
    yPos += 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Transaction Information', col1X, yPos)

    yPos += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    const transactionInfo: [string, string][] = []

    if (investorAllocation.paymentMethod) {
      transactionInfo.push(['Payment Method:', investorAllocation.paymentMethod])
    }

    if (investorAllocation.transactionReference) {
      transactionInfo.push(['Transaction Ref:', investorAllocation.transactionReference])
    }

    if (investorAllocation.bankDetails) {
      transactionInfo.push(['Bank Details:', investorAllocation.bankDetails])
    }

    transactionInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, col1X, yPos)
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(value, 150)
      doc.text(lines, col1X + 35, yPos)
      yPos += 6
    })
  }

  // Commitment Overview
  yPos += 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Commitment Overview', col1X, yPos)

  yPos += 8
  doc.setFontSize(9)

  // Create a table for commitment overview
  const commitmentData = [
    ['Total Commitment', formatCurrency(investorAllocation.commitment, capitalCall.currency)],
    ['Called to Date', formatCurrency(investorAllocation.calledCapitalToDate || investorAllocation.amountPaid, capitalCall.currency)],
    ['Uncalled Capital', formatCurrency(investorAllocation.uncalledCapital || (investorAllocation.commitment - investorAllocation.amountPaid), capitalCall.currency)],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Amount']],
    body: commitmentData,
    theme: 'striped',
    headStyles: { fillColor: primaryColor, fontSize: 10 },
    margin: { left: col1X, right: col1X },
    styles: { fontSize: 9 },
  })

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 20
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(128, 128, 128)
  doc.text(`This is an official receipt generated by ${firmName} Investment Management Platform`, 20, finalY)
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, finalY + 4)

  // Horizontal line above footer
  doc.setDrawColor(200, 200, 200)
  doc.line(20, finalY - 5, 190, finalY - 5)

  // Page number
  doc.text('Page 1 of 1', 180, finalY + 4)

  // Save the PDF
  const fileName = `Capital_Call_Receipt_${capitalCall.fundName.replace(/\s+/g, '_')}_Call${capitalCall.callNumber}_${investorName.replace(/\s+/g, '_')}.pdf`
  doc.save(fileName)
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
