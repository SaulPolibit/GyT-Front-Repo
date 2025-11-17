import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Distribution } from "@/lib/types"
import { format } from "date-fns"

interface DistributionCardProps {
  distribution: Distribution
  investorId: string
}

export function DistributionCard({ distribution, investorId }: DistributionCardProps) {
  const allocation = distribution.investorAllocations.find(a => a.investorId === investorId)

  if (!allocation) return null

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'default'
      case 'Processing':
        return 'secondary'
      case 'Pending':
        return 'outline'
      case 'Failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getSourceLabel = (source: string) => {
    const labels: { [key: string]: string } = {
      'Operating Income': 'Income',
      'Exit Proceeds': 'Exit',
      'Refinancing': 'Refi',
      'Return of Capital': 'ROC',
      'Other': 'Other'
    }
    return labels[source] || source
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {distribution.fundName} - Distribution #{distribution.distributionNumber}
          </CardTitle>
          <Badge variant={getStatusVariant(allocation.status)}>
            {allocation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-semibold text-green-600">
            ${allocation.finalAllocation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Payment Date</span>
          <span>{format(new Date(distribution.paymentDate), 'MMM dd, yyyy')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Source</span>
          <Badge variant="outline" className="text-xs">
            {getSourceLabel(distribution.source)}
          </Badge>
        </div>
        {allocation.processedDate && (
          <div className="text-xs text-muted-foreground mt-2">
            Processed: {format(new Date(allocation.processedDate), 'MMM dd, yyyy')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
