import type { NAVComponents } from "@/lib/nav-calculations"

interface NavComponentsBreakdownProps {
  navComponents: NAVComponents
}

export function NavComponentsBreakdown({
  navComponents,
}: NavComponentsBreakdownProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return (value / total) * 100
  }

  const assetsPercentage = calculatePercentage(
    navComponents.totalAssets,
    navComponents.totalAssets
  )
  const liabilitiesPercentage = calculatePercentage(
    navComponents.totalLiabilities,
    navComponents.totalAssets
  )

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">NAV Components</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Assets</span>
            <span className="font-semibold">{formatCurrency(navComponents.totalAssets)}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${assetsPercentage}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground pl-2">
            <span>Cash: {formatCurrency(navComponents.cash)}</span>
            <span>Investments: {formatCurrency(navComponents.investments)}</span>
            <span>Other: {formatCurrency(navComponents.otherAssets)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Liabilities</span>
            <span className="font-semibold">{formatCurrency(navComponents.totalLiabilities)}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-destructive"
              style={{ width: `${liabilitiesPercentage}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Net Asset Value</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(navComponents.netAssetValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
