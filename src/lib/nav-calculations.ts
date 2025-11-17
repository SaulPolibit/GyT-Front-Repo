export interface Holding {
  id: string
  name: string
  type: 'Real Estate' | 'Private Equity' | 'Private Debt'
  costBasis: number
  currentValue: number
  acquisitionDate: string
  lastValuationDate: string
  valuationMethod: 'Market' | 'DCF' | 'Comparables' | 'Cost'
}

export interface Assets {
  cash: number
  otherAssets: number
}

export interface Liabilities {
  debtOutstanding: number
  otherLiabilities: number
}

export interface Transaction {
  date: string
  type: 'capital_call' | 'distribution' | 'acquisition' | 'disposal'
  amount: number
}

export interface FundInfo {
  totalSharesOutstanding: number
  fundInceptionDate: string
}

export interface FundData {
  fundInfo: FundInfo
  holdings: Holding[]
  assets: Assets
  liabilities: Liabilities
  transactions: Transaction[]
}

export interface NAVHistoryPoint {
  date: string
  nav: number
  navPerShare: number
  percentChange: number
}

export interface NAVComponents {
  totalAssets: number
  totalLiabilities: number
  netAssetValue: number
  cash: number
  investments: number
  otherAssets: number
}

export interface PerformanceMetrics {
  mtdReturn: number
  qtdReturn: number
  ytdReturn: number
  inceptionReturn: number
  irr: number
}

export interface ValuationByAsset extends Holding {
  unrealizedGain: number
  percentOfNAV: number
}

export function calculateTotalAssets(data: FundData): number {
  const investmentValue = data.holdings.reduce(
    (sum, holding) => sum + holding.currentValue,
    0
  )
  return investmentValue + data.assets.cash + data.assets.otherAssets
}

export function calculateTotalLiabilities(data: FundData): number {
  return data.liabilities.debtOutstanding + data.liabilities.otherLiabilities
}

export function calculateCurrentNAV(data: FundData): number {
  return calculateTotalAssets(data) - calculateTotalLiabilities(data)
}

export function calculateNAVPerShare(data: FundData): number {
  const nav = calculateCurrentNAV(data)
  return nav / data.fundInfo.totalSharesOutstanding
}

export function calculateUnrealizedGain(holding: Holding): number {
  return holding.currentValue - holding.costBasis
}

export function calculatePercentOfNAV(
  holdingValue: number,
  totalNAV: number
): number {
  if (totalNAV === 0) return 0
  return (holdingValue / totalNAV) * 100
}

export function calculateNAVComponents(data: FundData): NAVComponents {
  const investmentValue = data.holdings.reduce(
    (sum, holding) => sum + holding.currentValue,
    0
  )
  const totalAssets = calculateTotalAssets(data)
  const totalLiabilities = calculateTotalLiabilities(data)

  return {
    totalAssets,
    totalLiabilities,
    netAssetValue: totalAssets - totalLiabilities,
    cash: data.assets.cash,
    investments: investmentValue,
    otherAssets: data.assets.otherAssets,
  }
}

export function calculateValuationByAsset(
  data: FundData
): ValuationByAsset[] {
  const totalNAV = calculateCurrentNAV(data)

  return data.holdings.map((holding) => ({
    ...holding,
    unrealizedGain: calculateUnrealizedGain(holding),
    percentOfNAV: calculatePercentOfNAV(holding.currentValue, totalNAV),
  }))
}

export function calculatePercentageChange(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) return 0
  return ((currentValue - previousValue) / previousValue) * 100
}

export function calculateMTDReturn(navHistory: NAVHistoryPoint[]): number {
  if (navHistory.length < 2) return 0

  const currentMonth = new Date(navHistory[navHistory.length - 1].date).getMonth()
  const monthStartIndex = navHistory.findIndex(
    (point) => new Date(point.date).getMonth() === currentMonth
  )

  if (monthStartIndex === -1 || monthStartIndex === navHistory.length - 1) return 0

  const monthStart = navHistory[monthStartIndex]
  const current = navHistory[navHistory.length - 1]

  return calculatePercentageChange(current.nav, monthStart.nav)
}

export function calculateQTDReturn(navHistory: NAVHistoryPoint[]): number {
  if (navHistory.length < 2) return 0

  const currentDate = new Date(navHistory[navHistory.length - 1].date)
  const currentQuarter = Math.floor(currentDate.getMonth() / 3)

  const quarterStartIndex = navHistory.findIndex((point) => {
    const pointDate = new Date(point.date)
    const pointQuarter = Math.floor(pointDate.getMonth() / 3)
    return pointQuarter === currentQuarter && pointDate.getFullYear() === currentDate.getFullYear()
  })

  if (quarterStartIndex === -1 || quarterStartIndex === navHistory.length - 1) return 0

  const quarterStart = navHistory[quarterStartIndex]
  const current = navHistory[navHistory.length - 1]

  return calculatePercentageChange(current.nav, quarterStart.nav)
}

export function calculateYTDReturn(navHistory: NAVHistoryPoint[]): number {
  if (navHistory.length < 2) return 0

  const currentYear = new Date(navHistory[navHistory.length - 1].date).getFullYear()
  const yearStartIndex = navHistory.findIndex(
    (point) => new Date(point.date).getFullYear() === currentYear
  )

  if (yearStartIndex === -1 || yearStartIndex === navHistory.length - 1) return 0

  const yearStart = navHistory[yearStartIndex]
  const current = navHistory[navHistory.length - 1]

  return calculatePercentageChange(current.nav, yearStart.nav)
}

export function calculateInceptionReturn(
  navHistory: NAVHistoryPoint[]
): number {
  if (navHistory.length < 2) return 0

  const inception = navHistory[0]
  const current = navHistory[navHistory.length - 1]

  return calculatePercentageChange(current.nav, inception.nav)
}

export function calculateIRR(
  transactions: Transaction[],
  currentNAV: number
): number {
  if (transactions.length === 0) return 0

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const inceptionDate = new Date(sortedTransactions[0].date)
  const currentDate = new Date()
  const yearsElapsed =
    (currentDate.getTime() - inceptionDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)

  const totalContributed = sortedTransactions
    .filter((t) => t.type === 'capital_call')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDistributed = sortedTransactions
    .filter((t) => t.type === 'distribution')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  if (totalContributed === 0) return 0

  const totalValue = currentNAV + totalDistributed

  const simpleReturn = (totalValue - totalContributed) / totalContributed
  const annualizedReturn = Math.pow(1 + simpleReturn, 1 / yearsElapsed) - 1

  return annualizedReturn * 100
}

export function calculatePerformanceMetrics(
  data: FundData,
  navHistory: NAVHistoryPoint[]
): PerformanceMetrics {
  const currentNAV = calculateCurrentNAV(data)

  return {
    mtdReturn: calculateMTDReturn(navHistory),
    qtdReturn: calculateQTDReturn(navHistory),
    ytdReturn: calculateYTDReturn(navHistory),
    inceptionReturn: calculateInceptionReturn(navHistory),
    irr: calculateIRR(data.transactions, currentNAV),
  }
}

export function generateNAVHistory(
  data: FundData,
  months: number = 12
): NAVHistoryPoint[] {
  const history: NAVHistoryPoint[] = []
  const currentDate = new Date()
  const inceptionDate = new Date(data.fundInfo.fundInceptionDate)

  const currentNAV = calculateCurrentNAV(data)
  const currentNavPerShare = calculateNAVPerShare(data)

  const actualMonths = Math.min(
    months,
    Math.ceil(
      (currentDate.getTime() - inceptionDate.getTime()) /
        (30 * 24 * 60 * 60 * 1000)
    )
  )

  for (let i = actualMonths - 1; i >= 0; i--) {
    const date = new Date(currentDate)
    date.setMonth(date.getMonth() - i)
    date.setDate(1)

    const growthFactor = (actualMonths - i) / actualMonths
    const seedValue = (i * 2654435761) % 2147483647
    const volatility = ((seedValue / 2147483647) - 0.5) * 0.04
    const trendGrowth = 0.08

    const historicalNAV =
      currentNAV / (1 + trendGrowth * growthFactor) * (1 + volatility)
    const historicalNavPerShare = historicalNAV / data.fundInfo.totalSharesOutstanding

    const percentChange =
      history.length > 0
        ? calculatePercentageChange(
            historicalNAV,
            history[history.length - 1].nav
          )
        : 0

    history.push({
      date: date.toISOString().split('T')[0],
      nav: historicalNAV,
      navPerShare: historicalNavPerShare,
      percentChange,
    })
  }

  history.push({
    date: currentDate.toISOString().split('T')[0],
    nav: currentNAV,
    navPerShare: currentNavPerShare,
    percentChange: history.length > 0
      ? calculatePercentageChange(
          currentNAV,
          history[history.length - 1].nav
        )
      : 0,
  })

  return history
}
