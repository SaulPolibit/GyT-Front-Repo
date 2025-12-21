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

interface Transaction {
  id: string
  investorId: string
  structureId: string
  investorEmail: string
  investorName: string
  structureName: string
  ticketsPurchased: number
  totalAmount: number
  paymentMethod: 'local-bank-transfer' | 'international-bank-transfer' | 'usdc'
  receiptUrl?: string | null
  receiptFileName?: string | null
  walletAddress?: string | null
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  processedAt?: string | null
  processedBy?: string | null
  adminNotes?: string | null
  createdAt: string
  updatedAt: string
}

interface TransactionStats {
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
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [stats, setStats] = React.useState<TransactionStats | null>(null)
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null)
  const [showDetailDialog, setShowDetailDialog] = React.useState(false)
  const [adminNotes, setAdminNotes] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("pending")

  React.useEffect(() => {
    loadTransactions()
    loadStats()
  }, [])

  const loadTransactions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = getAuthToken()

      if (!token) {
        setError('No authentication token found')
        setIsLoading(false)
        return
      }

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getAllTransactions), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[Approvals] API Response:', data)

      setTransactions(data.data || [])
    } catch (err) {
      console.error('[Approvals] Error fetching transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getTransactionStats), {
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

  const getStatusBadge = (status: Transaction['status']) => {
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
    if (!selectedTransaction) return

    setIsProcessing(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.approveTransaction(selectedTransaction.id)), {
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
        throw new Error(`Failed to approve transaction: ${response.statusText}`)
      }

      toast({
        title: "Transaction Approved",
        description: `Payment from ${selectedTransaction.investorName} has been approved.`,
      })

      await loadTransactions()
      await loadStats()
      setShowDetailDialog(false)
      setSelectedTransaction(null)
      setAdminNotes("")
    } catch (error) {
      console.error('[Approvals] Error approving transaction:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve transaction",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedTransaction || !adminNotes.trim()) {
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

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.rejectTransaction(selectedTransaction.id)), {
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
        throw new Error(`Failed to reject transaction: ${response.statusText}`)
      }

      toast({
        title: "Transaction Rejected",
        description: `Payment from ${selectedTransaction.investorName} has been rejected.`,
        variant: "destructive",
      })

      await loadTransactions()
      await loadStats()
      setShowDetailDialog(false)
      setSelectedTransaction(null)
      setAdminNotes("")
    } catch (error) {
      console.error('[Approvals] Error rejecting transaction:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject transaction",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setAdminNotes(transaction.adminNotes || "")
    setShowDetailDialog(true)
  }

  const filteredTransactions = React.useMemo(() => {
    switch (activeTab) {
      case 'all':
        return transactions
      case 'pending':
        return transactions.filter(t => t.status === 'pending')
      case 'approved':
        return transactions.filter(t => t.status === 'approved')
      case 'rejected':
        return transactions.filter(t => t.status === 'rejected')
      default:
        return transactions
    }
  }, [transactions, activeTab])

  const localStats = React.useMemo(() => {
    return {
      total: transactions.length,
      pending: transactions.filter(t => t.status === 'pending').length,
      approved: transactions.filter(t => t.status === 'approved').length,
      rejected: transactions.filter(t => t.status === 'rejected').length,
    }
  }, [transactions])

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
              <p className="text-lg font-semibold mb-2">Loading transactions...</p>
              <p className="text-sm text-muted-foreground">Please wait</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Error loading transactions</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => loadTransactions()}>Try Again</Button>
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
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">No transactions found</p>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === 'pending'
                        ? 'There are no pending transactions to review'
                        : `No ${activeTab} transactions`
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
                        {filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{transaction.investorName}</p>
                                <p className="text-xs text-muted-foreground">{transaction.investorEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{transaction.structureName}</p>
                            </TableCell>
                            <TableCell className="text-right">{transaction.ticketsPurchased}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(transaction.totalAmount)}
                            </TableCell>
                            <TableCell>{getPaymentMethodLabel(transaction.paymentMethod)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(transaction.submittedAt)}
                            </TableCell>
                            <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(transaction)}
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
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Review payment details and approve or reject the transaction
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Investor</Label>
                  <p className="font-semibold">{selectedTransaction.investorName}</p>
                  <p className="text-sm text-muted-foreground">{selectedTransaction.investorEmail}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Structure</Label>
                  <p className="font-semibold">{selectedTransaction.structureName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tickets Purchased</Label>
                  <p className="font-semibold text-lg">{selectedTransaction.ticketsPurchased}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Amount</Label>
                  <p className="font-semibold text-lg">{formatCurrency(selectedTransaction.totalAmount)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Method</Label>
                  <p className="font-semibold">{getPaymentMethodLabel(selectedTransaction.paymentMethod)}</p>
                </div>
                {selectedTransaction.walletAddress && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                    <p className="font-semibold text-xs font-mono">{selectedTransaction.walletAddress}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted</Label>
                  <p className="font-semibold text-sm">{formatDate(selectedTransaction.submittedAt)}</p>
                </div>
                {selectedTransaction.processedAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Processed</Label>
                    <p className="font-semibold text-sm">{formatDate(selectedTransaction.processedAt)}</p>
                  </div>
                )}
              </div>

              {/* Receipt */}
              {selectedTransaction.receiptUrl && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Payment Receipt</Label>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    {selectedTransaction.receiptFileName && (
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">{selectedTransaction.receiptFileName}</span>
                      </div>
                    )}
                    {selectedTransaction.receiptUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={selectedTransaction.receiptUrl}
                        alt="Receipt"
                        className="max-w-full rounded border"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">
                          {selectedTransaction.receiptFileName || 'Receipt file'}
                        </p>
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedTransaction.receiptUrl} target="_blank" rel="noopener noreferrer">
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
                  {selectedTransaction.status === 'pending' ? 'Notes (optional for approval, required for rejection)' : 'Admin Notes'}
                </Label>
                <Textarea
                  id="notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this transaction..."
                  rows={3}
                  className="mt-2"
                  disabled={selectedTransaction.status !== 'pending'}
                />
              </div>

              {/* Actions */}
              {selectedTransaction.status === 'pending' && (
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
