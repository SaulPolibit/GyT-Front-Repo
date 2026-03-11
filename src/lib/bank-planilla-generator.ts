/**
 * Bank Planilla Generator for Mexican SPEI Wire Transfers
 *
 * Generates CSV/TXT files compatible with Mexican banking systems
 * for batch wire transfer processing (distributions to investors)
 */

import type { Distribution, DistributionAllocation, Investor } from './types'

// SPEI Wire Transfer Record
export interface SPEIRecord {
  clabe: string              // 18-digit interbank account (CLABE)
  beneficiaryName: string    // Investor/Entity name
  amount: number             // Amount in MXN
  reference: string          // Payment reference (max 40 chars)
  rfc: string                // Mexican tax ID (RFC)
  email?: string             // Notification email
  concept?: string           // Payment concept/description
}

// Bank Planilla Export Options
export interface BankPlanillaOptions {
  format: 'csv' | 'txt' | 'xlsx'
  bankCode?: string          // Bank-specific format code
  includeHeaders?: boolean
  dateFormat?: string
  separator?: string         // For CSV: ',' or ';' or '\t'
}

// Bank Planilla Result
export interface BankPlanillaResult {
  content: string
  filename: string
  recordCount: number
  totalAmount: number
  errors: string[]
}

/**
 * Generate a bank planilla for distribution payments
 */
export function generateBankPlanilla(
  distribution: Distribution,
  allocations: DistributionAllocation[],
  investors: Investor[],
  options: BankPlanillaOptions = { format: 'csv', includeHeaders: true, separator: ',' }
): BankPlanillaResult {
  const errors: string[] = []
  const records: SPEIRecord[] = []

  // Create a map of investors for quick lookup
  const investorMap = new Map<string, Investor>()
  investors.forEach(inv => investorMap.set(inv.id, inv))

  // Process each allocation
  for (const allocation of allocations) {
    const investor = investorMap.get(allocation.investorId)

    if (!investor) {
      errors.push(`Investor not found: ${allocation.investorId}`)
      continue
    }

    // Validate CLABE
    const clabe = investor.bankDetails?.clabe
    if (!clabe) {
      errors.push(`Missing CLABE for investor: ${investor.name}`)
      continue
    }

    if (!isValidCLABE(clabe)) {
      errors.push(`Invalid CLABE for investor ${investor.name}: ${clabe}`)
      continue
    }

    // Get RFC (tax ID)
    const rfc = investor.taxId || ''
    if (!rfc) {
      errors.push(`Missing RFC for investor: ${investor.name} (will continue without)`)
    }

    // Get beneficiary name
    const beneficiaryName = investor.type === 'individual'
      ? investor.name
      : (investor.entityName || investor.name)

    // Create reference (max 40 chars for SPEI)
    const reference = `DIST-${distribution.distributionNumber}-${allocation.investorId.slice(0, 8)}`.substring(0, 40)

    records.push({
      clabe,
      beneficiaryName: sanitizeBeneficiaryName(beneficiaryName),
      amount: allocation.finalAllocation,
      reference,
      rfc: rfc || 'XAXX010101000', // Generic RFC if not provided
      email: investor.email,
      concept: `Distribution #${distribution.distributionNumber} - ${distribution.source}`
    })
  }

  // Generate output based on format
  let content: string
  let filename: string

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')

  switch (options.format) {
    case 'txt':
      content = generateTXTFormat(records, options)
      filename = `planilla_dist_${distribution.distributionNumber}_${dateStr}.txt`
      break
    case 'csv':
    default:
      content = generateCSVFormat(records, options)
      filename = `planilla_dist_${distribution.distributionNumber}_${dateStr}.csv`
      break
  }

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)

  return {
    content,
    filename,
    recordCount: records.length,
    totalAmount,
    errors
  }
}

/**
 * Generate CSV format for bank planilla
 */
function generateCSVFormat(records: SPEIRecord[], options: BankPlanillaOptions): string {
  const separator = options.separator || ','
  const lines: string[] = []

  // Headers
  if (options.includeHeaders !== false) {
    lines.push([
      'CLABE',
      'Beneficiario',
      'Importe',
      'Referencia',
      'RFC',
      'Email',
      'Concepto'
    ].join(separator))
  }

  // Data rows
  for (const record of records) {
    lines.push([
      record.clabe,
      `"${record.beneficiaryName}"`,
      record.amount.toFixed(2),
      record.reference,
      record.rfc,
      record.email || '',
      `"${record.concept || ''}"`
    ].join(separator))
  }

  return lines.join('\n')
}

/**
 * Generate TXT format for bank planilla (fixed-width format)
 * This format is used by some Mexican banks for batch processing
 */
function generateTXTFormat(records: SPEIRecord[], options: BankPlanillaOptions): string {
  const lines: string[] = []

  // Header record (type H)
  const headerDate = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
  lines.push(`H${headerDate}${records.length.toString().padStart(6, '0')}${formatAmount(totalAmount)}`)

  // Detail records (type D)
  for (const record of records) {
    const line = [
      'D',                                              // Record type
      record.clabe.padEnd(18, ' '),                    // CLABE (18 chars)
      record.beneficiaryName.substring(0, 40).padEnd(40, ' '), // Name (40 chars)
      formatAmount(record.amount),                     // Amount (15 chars)
      record.reference.substring(0, 40).padEnd(40, ' '), // Reference (40 chars)
      record.rfc.padEnd(13, ' '),                      // RFC (13 chars)
    ].join('')
    lines.push(line)
  }

  // Trailer record (type T)
  lines.push(`T${records.length.toString().padStart(6, '0')}${formatAmount(totalAmount)}`)

  return lines.join('\n')
}

/**
 * Format amount for fixed-width format (15 chars, 2 decimals, no separator)
 */
function formatAmount(amount: number): string {
  return (amount * 100).toFixed(0).padStart(15, '0')
}

/**
 * Validate Mexican CLABE (18-digit interbank account)
 */
export function isValidCLABE(clabe: string): boolean {
  if (!clabe || clabe.length !== 18) return false
  if (!/^\d{18}$/.test(clabe)) return false

  // Validate check digit (position 18)
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7]
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += (parseInt(clabe[i]) * weights[i]) % 10
  }
  const checkDigit = (10 - (sum % 10)) % 10

  return parseInt(clabe[17]) === checkDigit
}

/**
 * Validate Mexican RFC (tax ID)
 */
export function isValidRFC(rfc: string): boolean {
  if (!rfc) return false

  // RFC for individuals: 13 chars (XXXX000000XXX)
  // RFC for entities: 12 chars (XXX000000XXX)
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i
  return rfcRegex.test(rfc)
}

/**
 * Sanitize beneficiary name for banking systems
 * - Remove accents
 * - Remove special characters except spaces
 * - Convert to uppercase
 * - Limit to 40 characters
 */
function sanitizeBeneficiaryName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove special chars
    .toUpperCase()
    .substring(0, 40)
    .trim()
}

/**
 * Download bank planilla as a file (browser)
 */
export function downloadBankPlanilla(result: BankPlanillaResult): void {
  const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = result.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate bank planilla for capital call refunds (if applicable)
 */
export function generateCapitalCallRefundPlanilla(
  refundData: {
    capitalCallId: string
    capitalCallNumber: number
    allocations: Array<{
      investorId: string
      refundAmount: number
    }>
  },
  investors: Investor[],
  options: BankPlanillaOptions = { format: 'csv', includeHeaders: true, separator: ',' }
): BankPlanillaResult {
  const errors: string[] = []
  const records: SPEIRecord[] = []

  const investorMap = new Map<string, Investor>()
  investors.forEach(inv => investorMap.set(inv.id, inv))

  for (const allocation of refundData.allocations) {
    const investor = investorMap.get(allocation.investorId)

    if (!investor) {
      errors.push(`Investor not found: ${allocation.investorId}`)
      continue
    }

    const clabe = investor.bankDetails?.clabe
    if (!clabe) {
      errors.push(`Missing CLABE for investor: ${investor.name}`)
      continue
    }

    const beneficiaryName = investor.type === 'individual'
      ? investor.name
      : (investor.entityName || investor.name)

    const reference = `REFUND-CC${refundData.capitalCallNumber}-${allocation.investorId.slice(0, 6)}`.substring(0, 40)

    records.push({
      clabe,
      beneficiaryName: sanitizeBeneficiaryName(beneficiaryName),
      amount: allocation.refundAmount,
      reference,
      rfc: investor.taxId || 'XAXX010101000',
      email: investor.email,
      concept: `Refund Capital Call #${refundData.capitalCallNumber}`
    })
  }

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const content = options.format === 'txt'
    ? generateTXTFormat(records, options)
    : generateCSVFormat(records, options)

  const filename = `planilla_refund_cc_${refundData.capitalCallNumber}_${dateStr}.${options.format}`

  return {
    content,
    filename,
    recordCount: records.length,
    totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
    errors
  }
}
