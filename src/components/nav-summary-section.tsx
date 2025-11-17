import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface NavSummarySectionProps {
  currentNAV: number
  navPerShare: number
  ytdReturn: number
}

export function NavSummarySection({
  currentNAV,
  navPerShare,
  ytdReturn,
}: NavSummarySectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const isPositive = ytdReturn >= 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Current NAV</p>
        <p className="text-3xl font-bold">{formatCurrency(currentNAV)}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">NAV per Share</p>
        <p className="text-3xl font-bold">{formatCurrency(navPerShare)}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">YTD Return</p>
        <div className="flex items-center gap-2">
          <p className="text-3xl font-bold">{formatPercentage(ytdReturn)}</p>
          <Badge variant={isPositive ? "default" : "destructive"}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </Badge>
        </div>
      </div>
    </div>
  )
}
