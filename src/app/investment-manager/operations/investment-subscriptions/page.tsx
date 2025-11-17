"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertCircle,
  Check,
  X,
  DollarSign,
  Users,
  Building2,
} from "lucide-react"
import { getPendingInvestmentSubscriptions, updateInvestmentSubscriptionStatus, getInvestmentSubscriptionsByInvestor, markSubscriptionLinked } from "@/lib/investment-subscriptions-storage"
import { getInvestmentById } from "@/lib/investments-storage"
import { getInvestorById, addFundOwnershipToInvestor } from "@/lib/investors-storage"
import { getStructureById } from "@/lib/structures-storage"
import type { InvestmentSubscription } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function InvestmentSubscriptionsPage() {
  const { toast } = useToast()
  const [subscriptions, setSubscriptions] = React.useState<InvestmentSubscription[]>([])
  const [statusFilter, setStatusFilter] = React.useState('pending')
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [selectedSub, setSelectedSub] = React.useState<InvestmentSubscription | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = React.useState(false)
  const [showRejectionDialog, setShowRejectionDialog] = React.useState(false)
  const [adminNotes, setAdminNotes] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const allSubscriptions = statusFilter === 'pending'
      ? getPendingInvestmentSubscriptions()
      : statusFilter === 'all'
      ? (() => {
          const all: InvestmentSubscription[] = []
          // Get all subscriptions (from all statuses)
          const pending = getPendingInvestmentSubscriptions()
          all.push(...pending)
          // For demo, we'd need to add approved/rejected retrieval
          return all
        })()
      : getPendingInvestmentSubscriptions().filter(s => s.status === statusFilter)

    setSubscriptions(allSubscriptions)
  }, [refreshKey, statusFilter])

  const handleApprove = async (subscription: InvestmentSubscription) => {
    if (!subscription) return

    setLoading(true)
    try {
      // 1. Update subscription status
      updateInvestmentSubscriptionStatus(
        subscription.id,
        'approved',
        'Investment subscription approved',
        adminNotes
      )

      // 2. Auto-link investor to fund
      const investor = getInvestorById(subscription.investorId)
      if (investor) {
        addFundOwnershipToInvestor(
          subscription.investorId,
          subscription.fundId,
          subscription.requestedAmount
        )

        // 3. Mark subscription as linked
        markSubscriptionLinked(subscription.id)

        toast({
          title: "Subscription Approved & Linked",
          description: `Investment subscription from ${investor.name} has been approved and investor has been added to the fund.`,
        })
      } else {
        toast({
          title: "Subscription Approved (Linking Failed)",
          description: `Investment subscription was approved but investor linking failed. Please manually add the investor to the fund.`,
          variant: "destructive",
        })
      }

      setShowApprovalDialog(false)
      setAdminNotes('')
      setSelectedSub(null)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Approval error:', error)
      toast({
        title: "Error",
        description: "Failed to approve subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (subscription: InvestmentSubscription) => {
    if (!subscription) return

    setLoading(true)
    try {
      updateInvestmentSubscriptionStatus(
        subscription.id,
        'rejected',
        adminNotes || 'Investment subscription was rejected',
        adminNotes
      )

      toast({
        title: "Subscription Rejected",
        description: `Investment subscription from ${getInvestorById(subscription.investorId)?.name} has been rejected.`,
      })

      setShowRejectionDialog(false)
      setAdminNotes('')
      setSelectedSub(null)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateString
    }
  }

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'approved':
        return 'default'
      case 'rejected':
        return 'destructive'
      case 'completed':
        return 'default'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investment Subscriptions</h1>
        <p className="text-muted-foreground">
          Review and manage investor subscription requests for marketplace investments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getPendingInvestmentSubscriptions().length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting admin action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getPendingInvestmentSubscriptions().reduce((sum, sub) => sum + sub.requestedAmount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Capital requested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(getPendingInvestmentSubscriptions().map(s => s.investorId)).size}
            </div>
            <p className="text-xs text-muted-foreground">Requesting investments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No subscriptions found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'pending' ? 'No pending subscription requests' : 'No subscriptions match the selected filter'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            const investment = getInvestmentById(subscription.investmentId)
            const investor = getInvestorById(subscription.investorId)
            const fund = getStructureById(subscription.fundId)

            return (
              <Card key={subscription.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {investment?.name || 'Unknown Investment'}
                        </CardTitle>
                        <Badge variant={getStatusBadgeVariant(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {investor?.name || 'Unknown Investor'} • {fund?.name || 'Unknown Fund'}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(subscription.requestedAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested: {formatDate(subscription.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Investor</p>
                      <p className="text-sm font-semibold">{investor?.name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{investor?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Investment</p>
                      <p className="text-sm font-semibold">{investment?.name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{investment?.type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Fund</p>
                      <p className="text-sm font-semibold">{fund?.name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">Commitment</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Currency</p>
                      <p className="text-sm font-semibold">{subscription.currency}</p>
                      {subscription.approvalReason && (
                        <p className="text-xs text-muted-foreground">{subscription.approvalReason.substring(0, 20)}...</p>
                      )}
                    </div>
                  </div>

                  {/* Admin Notes Display */}
                  {subscription.adminNotes && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Admin Notes</p>
                      <p className="text-sm">{subscription.adminNotes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {subscription.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedSub(subscription)
                          setShowApprovalDialog(true)
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedSub(subscription)
                          setShowRejectionDialog(true)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Approval Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Investment Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSub && (
                <div className="space-y-3 mt-2">
                  <p>
                    Approve {getInvestorById(selectedSub.investorId)?.name}'s subscription request for {getInvestmentById(selectedSub.investmentId)?.name}?
                  </p>
                  <p className="font-semibold">
                    Amount: {formatCurrency(selectedSub.requestedAmount)}
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="approval-notes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="approval-notes"
                      placeholder="Add any notes for the investor..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={() => selectedSub && handleApprove(selectedSub)}
            >
              {loading ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Dialog */}
      <AlertDialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Investment Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSub && (
                <div className="space-y-3 mt-2">
                  <p>
                    Reject {getInvestorById(selectedSub.investorId)?.name}'s subscription request for {getInvestmentById(selectedSub.investmentId)?.name}?
                  </p>
                  <p className="font-semibold">
                    Amount: {formatCurrency(selectedSub.requestedAmount)}
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Please provide a reason for the rejection..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={loading || !adminNotes.trim()}
                onClick={() => selectedSub && handleReject(selectedSub)}
              >
                {loading ? 'Rejecting...' : 'Reject'}
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
