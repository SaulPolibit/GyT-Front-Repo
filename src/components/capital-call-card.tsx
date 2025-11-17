import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CapitalCall } from "@/lib/types"
import { format } from "date-fns"

interface CapitalCallCardProps {
  capitalCall: CapitalCall
  investorId: string
}

export function CapitalCallCard({ capitalCall, investorId }: CapitalCallCardProps) {
  const allocation = capitalCall.investorAllocations.find(a => a.investorId === investorId)

  if (!allocation) return null

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'default'
      case 'Pending':
        return 'secondary'
      case 'Overdue':
        return 'destructive'
      case 'Partial':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {capitalCall.fundName} - Call #{capitalCall.callNumber}
          </CardTitle>
          <Badge variant={getStatusVariant(allocation.status)}>
            {allocation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-semibold">
            ${allocation.callAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Due Date</span>
          <span>{format(new Date(capitalCall.dueDate), 'MMM dd, yyyy')}</span>
        </div>
        {allocation.status === 'Partial' && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Outstanding</span>
            <span className="font-semibold text-orange-600">
              ${allocation.amountOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        {capitalCall.purpose && (
          <div className="text-sm text-muted-foreground mt-2">
            <span className="font-medium">Purpose:</span> {capitalCall.purpose}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
