import ExcelJS from 'exceljs'
import { getInvestments } from './investments-storage'
import { getStructures } from './structures-storage'
import { getInvestors } from './investors-storage'

// ILPA Portfolio Company Metrics Template Generator
// Following ILPA v1.0 standard structure

export interface ILPAReportConfig {
  fundId?: string // 'all' or specific structure ID
  reportingDate: string
  gpName: string
  fundName: string
  fundCurrency: string
}

// Map investment data to ILPA template structure
export function mapInvestmentToILPA(investment: any, structure: any) {
  const isExited = investment.status === 'Exited' || investment.status === 'Liquidated'

  return {
    // Basic Information
    position: investment.name,
    positionIdentifier: investment.id,
    companyReportingCurrency: structure?.currency || 'USD',
    positionStatus: isExited ? 'Fully Exited, No Escrow' : 'Active',
    positionTypeCurrent: investment.investmentType === 'EQUITY' ? 'Equity - Private' :
                         investment.investmentType === 'DEBT' ? 'Debt' : 'Equity - Private',

    // Transaction Description (at entry)
    positionTypeEntry: investment.investmentType === 'EQUITY' ? 'Equity - Private' :
                       investment.investmentType === 'DEBT' ? 'Debt' : 'Equity - Private',
    purchaseProcess: 'Proprietary Sourcing', // Default value
    purchaseType: 'Growth Capital', // Default value
    investmentStrategy: investment.type === 'Private Equity' ? 'Buyout' :
                        investment.type === 'Real Estate' ? 'Real Estate' : 'Growth',
    dealRole: 'Lead', // Default value
    initialInvestmentDate: investment.acquisitionDate,
    dealTeamLead: '', // Can be populated from structure settings
    dealTeamMembers: '',
    sellerNames: '',
    transactionNotes: investment.description || '',

    // Company Information
    naicsSector: mapSectorToNAICS(investment.sector),
    naicsIndustryGroup: '',
    alternateIndustryCode1: '',
    alternateIndustryCode2: '',
    companyDescription: investment.description || '',

    // Company KPIs (at entry) - from fundEquityPosition
    ebitdaEntry: '', // Not captured in current system
    revenueEntry: '',
    capexEntry: '',
    totalEquityEntry: investment.fundEquityPosition?.equityInvested || 0,
    totalNetDebtEntry: investment.fundDebtPosition?.principalProvided || 0,
    minorityInterestsEntry: 0,
    totalEnterpriseValueEntry: investment.totalInvestmentSize || 0,
    cashEntry: 0,
    managementOwnershipEntry: 0,
    numberOfEmployeesEntry: '',

    // Position Metrics (at entry)
    totalInvestedFund: investment.fundCommitment || 0,
    totalInvestedLPCoInvestors: 0,
    totalInvestedOtherAffiliated: 0,
    totalInvestedNonAffiliated: 0,
    fullyDilutedOwnershipFund: investment.ownershipPercentage || 0,
    fullyDilutedOwnershipAffiliated: 0,
    numberOfLPCoInvestors: 0,

    // Company Information (current/at exit)
    hqState: investment.geography?.state || '',
    hqCountry: investment.geography?.country || '',
    primaryMarket: investment.geography?.country || '',
    topSecondaryMarkets: '',
    countryOfIncorporation: investment.geography?.country || '',
    publiclyListed: 'No',
    ipoDate: '',

    // Position Performance (current/at exit)
    totalCommitment: investment.fundCommitment || 0,
    totalInvested: investment.fundCommitment || 0,
    currentCost: investment.fundCommitment || 0,
    reportedValue: investment.totalFundPosition?.currentValue || 0,
    realizedProceeds: isExited ? (investment.totalFundPosition?.currentValue || 0) : 0,
    grossIRR: investment.totalFundPosition?.irr || 0,
    multipleTotalReturn: investment.totalFundPosition?.multiple || 0,
    multipleRealizations: isExited ? (investment.totalFundPosition?.multiple || 0) : 0,
    multipleUnrealized: !isExited ? (investment.totalFundPosition?.multiple || 0) : 0,
    lineOfCreditOutstanding: 'No',
    eciGeneration: 'No',

    // Current Company KPIs
    ebitdaCurrent: '',
    revenueCurrent: '',
    capexCurrent: '',
    totalEquityCurrent: investment.fundEquityPosition?.currentEquityValue || 0,
    totalNetDebtCurrent: investment.fundDebtPosition?.currentDebtValue || 0,

    // Debt Position Details (if applicable)
    debtInterestRate: investment.fundDebtPosition?.interestRate || '',
    debtMaturityDate: investment.fundDebtPosition?.maturityDate || '',
    debtAccruedInterest: investment.fundDebtPosition?.accruedInterest || 0,
  }
}

// Map sector to NAICS code
function mapSectorToNAICS(sector: string): string {
  const naicsMapping: Record<string, string> = {
    'Technology': '51: Information',
    'Healthcare': '62: Health Care and Social Assistance',
    'Financial Services': '52: Finance and Insurance',
    'Real Estate': '53: Real Estate and Rental and Leasing',
    'Consumer': '44-45: Retail Trade',
    'Industrial': '31-33: Manufacturing',
    'Energy': '21: Mining, Quarrying, and Oil and Gas Extraction',
  }

  return naicsMapping[sector] || ''
}

// Generate ILPA Excel Report
export async function generateILPAExcelReport(config: ILPAReportConfig): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()

  // Get data
  const investments = getInvestments()
  const structures = getStructures()
  const structure = config.fundId && config.fundId !== 'all'
    ? structures.find(s => s.id === config.fundId)
    : null

  // Filter investments by fund
  const filteredInvestments = config.fundId && config.fundId !== 'all'
    ? investments.filter(inv => inv.fundId === config.fundId)
    : investments

  // Create Fund Level sheet
  const fundLevelSheet = workbook.addWorksheet('2. Fund Level')
  fundLevelSheet.columns = [
    { key: 'label', width: 30 },
    { key: 'value', width: 40 },
    { key: 'format', width: 20 },
  ]

  fundLevelSheet.addRows([
    { label: '', value: 'ILPA Portfolio Company Metrics Template (v. 1.0) - Generated by Polibit', format: '' },
    { label: '', value: '', format: '' },
    { label: 'Fund Details:', value: '', format: '' },
    { label: 'GP', value: config.gpName, format: '(open text)' },
    { label: 'Fund', value: config.fundName, format: '(open text)' },
    { label: 'Reporting Date', value: new Date(config.reportingDate), format: '(mm/dd/yyyy)' },
    { label: 'Fund Reporting Currency', value: config.fundCurrency, format: '(dropdown)' },
  ])

  // Style Fund Level sheet
  fundLevelSheet.getRow(1).font = { bold: true, size: 10 }
  fundLevelSheet.getRow(3).font = { bold: true }
  fundLevelSheet.getColumn(1).font = { bold: true }

  // Create PortCo Template_Option 1 sheet (main sheet)
  const portCoSheet = workbook.addWorksheet('3. PortCo Template_Option 1')

  // Define columns for ILPA Option 1 template
  portCoSheet.columns = [
    // Basic
    { header: 'Position', key: 'position', width: 20 },
    { header: 'Position Identifier', key: 'positionIdentifier', width: 15 },
    { header: 'Company Reporting Currency', key: 'companyReportingCurrency', width: 15 },
    { header: 'Position Status', key: 'positionStatus', width: 20 },
    { header: 'Position Type\n(current/at exit)', key: 'positionTypeCurrent', width: 18 },

    // Transaction Description (at entry)
    { header: 'Position Type\n(at entry)', key: 'positionTypeEntry', width: 18 },
    { header: 'Purchase Process', key: 'purchaseProcess', width: 18 },
    { header: 'Purchase Type', key: 'purchaseType', width: 18 },
    { header: 'Investment Strategy', key: 'investmentStrategy', width: 18 },
    { header: 'Deal Role', key: 'dealRole', width: 12 },
    { header: 'Initial Investment Date', key: 'initialInvestmentDate', width: 15 },
    { header: 'Deal Team Lead', key: 'dealTeamLead', width: 18 },
    { header: 'Deal Team Members', key: 'dealTeamMembers', width: 20 },
    { header: 'Seller Name(s)', key: 'sellerNames', width: 18 },
    { header: 'Transaction Notes', key: 'transactionNotes', width: 25 },

    // Company Information
    { header: 'NAICS Sector', key: 'naicsSector', width: 25 },
    { header: 'NAICS Industry Group', key: 'naicsIndustryGroup', width: 25 },
    { header: 'Company Description', key: 'companyDescription', width: 30 },

    // Financial Metrics (at entry)
    { header: 'Total Invested (Fund)', key: 'totalInvestedFund', width: 18 },
    { header: 'Ownership % (Fund)', key: 'fullyDilutedOwnershipFund', width: 15 },
    { header: 'Total Enterprise Value', key: 'totalEnterpriseValueEntry', width: 20 },

    // Performance (current/at exit)
    { header: 'Reported Value', key: 'reportedValue', width: 18 },
    { header: 'Realized Proceeds', key: 'realizedProceeds', width: 18 },
    { header: 'Gross IRR (%)', key: 'grossIRR', width: 12 },
    { header: 'Multiple (Total)', key: 'multipleTotalReturn', width: 12 },
    { header: 'HQ Country', key: 'hqCountry', width: 15 },
    { header: 'Primary Market', key: 'primaryMarket', width: 15 },
  ]

  // Add header formatting
  portCoSheet.getRow(1).font = { bold: true, size: 10 }
  portCoSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  portCoSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' } // Light blue
  }
  portCoSheet.getRow(1).height = 40

  // Map and add investment data
  const ilpaData = filteredInvestments.map(inv => mapInvestmentToILPA(inv, structure))

  ilpaData.forEach(data => {
    portCoSheet.addRow(data)
  })

  // Format number columns
  const numberColumns = ['totalInvestedFund', 'reportedValue', 'realizedProceeds', 'totalEnterpriseValueEntry']
  numberColumns.forEach(colKey => {
    const col = portCoSheet.getColumn(colKey)
    if (col) {
      col.numFmt = '$#,##0'
    }
  })

  // Format percentage columns
  const percentageColumns = ['fullyDilutedOwnershipFund', 'grossIRR']
  percentageColumns.forEach(colKey => {
    const col = portCoSheet.getColumn(colKey)
    if (col) {
      col.numFmt = '0.00%'
    }
  })

  // Format multiple columns
  const multipleColumns = ['multipleTotalReturn']
  multipleColumns.forEach(colKey => {
    const col = portCoSheet.getColumn(colKey)
    if (col) {
      col.numFmt = '0.00x'
    }
  })

  // Freeze header row
  portCoSheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ]

  return workbook
}

// Generate ILPA CSV Report
export function generateILPACSV(config: ILPAReportConfig): string {
  const investments = getInvestments()
  const structures = getStructures()
  const structure = config.fundId && config.fundId !== 'all'
    ? structures.find(s => s.id === config.fundId)
    : null

  const filteredInvestments = config.fundId && config.fundId !== 'all'
    ? investments.filter(inv => inv.fundId === config.fundId)
    : investments

  const ilpaData = filteredInvestments.map(inv => mapInvestmentToILPA(inv, structure))

  // CSV Headers
  const headers = [
    'Position',
    'Position Identifier',
    'Company Reporting Currency',
    'Position Status',
    'Position Type (current)',
    'Position Type (entry)',
    'Purchase Process',
    'Investment Strategy',
    'Initial Investment Date',
    'NAICS Sector',
    'Company Description',
    'Total Invested (Fund)',
    'Ownership % (Fund)',
    'Reported Value',
    'Realized Proceeds',
    'Gross IRR (%)',
    'Multiple (Total)',
    'HQ Country',
  ]

  // Build CSV
  let csv = headers.join(',') + '\n'

  ilpaData.forEach(data => {
    const row = [
      data.position,
      data.positionIdentifier,
      data.companyReportingCurrency,
      data.positionStatus,
      data.positionTypeCurrent,
      data.positionTypeEntry,
      data.purchaseProcess,
      data.investmentStrategy,
      data.initialInvestmentDate,
      `"${data.naicsSector}"`,
      `"${data.companyDescription}"`,
      data.totalInvestedFund,
      data.fullyDilutedOwnershipFund / 100, // Convert to decimal
      data.reportedValue,
      data.realizedProceeds,
      data.grossIRR,
      data.multipleTotalReturn,
      data.hqCountry,
    ]
    csv += row.join(',') + '\n'
  })

  return csv
}

// Generate ILPA PDF Report (summary version)
export function generateILPAPDFData(config: ILPAReportConfig) {
  const investments = getInvestments()
  const structures = getStructures()
  const structure = config.fundId && config.fundId !== 'all'
    ? structures.find(s => s.id === config.fundId)
    : null

  const filteredInvestments = config.fundId && config.fundId !== 'all'
    ? investments.filter(inv => inv.fundId === config.fundId)
    : investments

  const ilpaData = filteredInvestments.map(inv => mapInvestmentToILPA(inv, structure))

  return {
    config,
    structure,
    investments: ilpaData,
    summary: {
      totalInvestments: ilpaData.length,
      totalCommitted: ilpaData.reduce((sum, inv) => sum + inv.totalInvestedFund, 0),
      totalValue: ilpaData.reduce((sum, inv) => sum + inv.reportedValue, 0),
      totalRealized: ilpaData.reduce((sum, inv) => sum + inv.realizedProceeds, 0),
      weightedAvgIRR: ilpaData.reduce((sum, inv) => sum + inv.grossIRR, 0) / ilpaData.length,
      weightedAvgMultiple: ilpaData.reduce((sum, inv) => sum + inv.multipleTotalReturn, 0) / ilpaData.length,
    }
  }
}
