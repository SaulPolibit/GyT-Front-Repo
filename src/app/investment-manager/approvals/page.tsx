"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuthToken } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"

interface Payment {
  id: string
  email: string
  submissionId: string
  paymentImage?: string | null
  transactionHash?: string | null
  amount: number
  structureId: string
  contractId: string
  status: 'pending' | 'approved' | 'rejected'
  tokenId?: string | null
  userId?: string | null
  paymentMethod?: 'local-bank-transfer' | 'international-bank-transfer' | 'usdc' | 'credit-card'
  investorName?: string
  structureName?: string
  ticketsPurchased?: number
  walletAddress?: string | null
  receiptFileName?: string | null
  processedBy?: string | null
  processedAt?: string | null
  adminNotes?: string | null
  submittedAt?: string
  createdAt: string
  updatedAt: string
}

interface PaymentStats {
  total: number
  pending: number
  approved: number
  rejected: number
  totalAmount: number
  pendingAmount: number
  approvedAmount: number
}

export default function ApprovalsPage() {
  const { toast } = useToast()
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [stats, setStats] = React.useState<PaymentStats | null>(null)
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null)
  const [showDetailDialog, setShowDetailDialog] = React.useState(false)
  const [adminNotes, setAdminNotes] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("pending")

  React.useEffect(() => {
    loadPayments()
    loadStats()
  }, [])

  const loadPayments = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = getAuthToken()

      if (!token) {
        setError('No authentication token found')
        setIsLoading(false)
        return
      }

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getAllPayments), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[Approvals] API Response:', data)

      setPayments(data.data || [])
    } catch (err) {
      console.error('[Approvals] Error fetching payments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch payments')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getPaymentStats), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`)
      }

      const data = await response.json()
      setStats(data.data)
    } catch (err) {
      console.error('[Approvals] Error fetching stats:', err)
    }
  }

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'local-bank-transfer':
        return 'Local Bank Transfer'
      case 'international-bank-transfer':
        return 'International Wire'
      case 'usdc':
        return 'USDC'
      default:
        return method
    }
  }

  const handleApprove = async () => {
    if (!selectedPayment) return

    setIsProcessing(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.approvePayment(selectedPayment.id)), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminNotes: adminNotes || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to approve payment: ${response.statusText}`)
      }

      toast({
        title: "Payment Approved",
        description: `Payment from ${selectedPayment.investorName || selectedPayment.email} has been approved.`,
      })

      await loadPayments()
      await loadStats()
      setShowDetailDialog(false)
      setSelectedPayment(null)
      setAdminNotes("")
    } catch (error) {
      console.error('[Approvals] Error approving payment:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedPayment || !adminNotes.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.rejectPayment(selectedPayment.id)), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminNotes: adminNotes,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to reject payment: ${response.statusText}`)
      }

      toast({
        title: "Payment Rejected",
        description: `Payment from ${selectedPayment.investorName || selectedPayment.email} has been rejected.`,
        variant: "destructive",
      })

      await loadPayments()
      await loadStats()
      setShowDetailDialog(false)
      setSelectedPayment(null)
      setAdminNotes("")
    } catch (error) {
      console.error('[Approvals] Error rejecting payment:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setAdminNotes(payment.adminNotes || "")
    setShowDetailDialog(true)
  }

  const filteredPayments = React.useMemo(() => {
    switch (activeTab) {
      case 'all':
        return payments
      case 'pending':
        return payments.filter(p => p.status === 'pending')
      case 'approved':
        return payments.filter(p => p.status === 'approved')
      case 'rejected':
        return payments.filter(p => p.status === 'rejected')
      default:
        return payments
    }
  }, [payments, activeTab])

  const localStats = React.useMemo(() => {
    return {
      total: payments.length,
      pending: payments.filter(p => p.status === 'pending').length,
      approved: payments.filter(p => p.status === 'approved').length,
      rejected: payments.filter(p => p.status === 'rejected').length,
    }
  }, [payments])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Approvals</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve investor payment submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Transactions</CardDescription>
            <CardTitle className="text-3xl">{localStats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{localStats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600">{localStats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600">{localStats.rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Review and process investor payments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-semibold mb-2">Loading payments...</p>
              <p className="text-sm text-muted-foreground">Please wait</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Error loading payments</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => loadPayments()}>Try Again</Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">
                  Pending {localStats.pending > 0 && <Badge className="ml-2 h-5 min-w-5">{localStats.pending}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">No payments found</p>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === 'pending'
                        ? 'There are no pending payments to review'
                        : `No ${activeTab} payments`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Investor</TableHead>
                          <TableHead>Structure</TableHead>
                          <TableHead className="text-right">Tickets</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{payment.investorName || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">{payment.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{payment.structureName || 'N/A'}</p>
                            </TableCell>
                            <TableCell className="text-right">{payment.ticketsPurchased || 'N/A'}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>{payment.paymentMethod ? getPaymentMethodLabel(payment.paymentMethod) : 'N/A'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {payment.submittedAt ? formatDate(payment.submittedAt) : formatDate(payment.createdAt)}
                            </TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(payment)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Review payment details and approve or reject the payment
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Investor</Label>
                  <p className="font-semibold">{selectedPayment.investorName || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayment.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Structure</Label>
                  <p className="font-semibold">{selectedPayment.structureName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tickets Purchased</Label>
                  <p className="font-semibold text-lg">{selectedPayment.ticketsPurchased || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Amount</Label>
                  <p className="font-semibold text-lg">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Method</Label>
                  <p className="font-semibold">{selectedPayment.paymentMethod ? getPaymentMethodLabel(selectedPayment.paymentMethod) : 'N/A'}</p>
                </div>
                {selectedPayment.walletAddress && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                    <p className="font-semibold text-xs font-mono">{selectedPayment.walletAddress}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted</Label>
                  <p className="font-semibold text-sm">{selectedPayment.submittedAt ? formatDate(selectedPayment.submittedAt) : formatDate(selectedPayment.createdAt)}</p>
                </div>
                {selectedPayment.processedAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Processed</Label>
                    <p className="font-semibold text-sm">{formatDate(selectedPayment.processedAt)}</p>
                  </div>
                )}
              </div>

              {/* Receipt */}
              {selectedPayment.paymentImage && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Payment Receipt</Label>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    {selectedPayment.receiptFileName && (
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">{selectedPayment.receiptFileName}</span>
                      </div>
                    )}
                    {selectedPayment.paymentImage.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={selectedPayment.paymentImage}
                        alt="Receipt"
                        className="max-w-full rounded border"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">
                          {selectedPayment.receiptFileName || 'Receipt file'}
                        </p>
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedPayment.paymentImage} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            View Receipt
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-semibold">
                  {selectedPayment.status === 'pending' ? 'Notes (optional for approval, required for rejection)' : 'Admin Notes'}
                </Label>
                <Textarea
                  id="notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this payment..."
                  rows={3}
                  className="mt-2"
                  disabled={selectedPayment.status !== 'pending'}
                />
              </div>

              {/* Actions */}
              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDetailDialog(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleReject}
                    disabled={isProcessing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
