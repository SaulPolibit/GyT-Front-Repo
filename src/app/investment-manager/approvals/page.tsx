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
import { getAuthToken, getAuthState } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"

interface Payment {
  id: string
  email: string
  submissionId: string
  paymentImage?: string | null
  transactionHash?: string | null
  paymentTransactionHash?: string | null
  mintTransactionHash?: string | null
  amount: number
  tokens?: number
  structureId: string
  contractId: string
  status: 'pending' | 'approved' | 'rejected'
  tokenId?: string | null
  userId?: string | null
  paymentMethod?: 'local-bank-transfer' | 'international-bank-transfer' | 'usdc' | 'credit-card'
  investorName?: string
  investor?: {
    id: string
    email: string
    walletAddress?: string | null
  }
  structure?: {
    id: string
    name: string
    type?: string
  }
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

  // Check if user is guest
  const authState = getAuthState()
  const currentUserRole = authState.user?.role ?? null
  const isGuest = currentUserRole === 4

  const [payments, setPayments] = React.useState<Payment[]>([])
  const [stats, setStats] = React.useState<PaymentStats | null>(null)
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null)
  const [showDetailDialog, setShowDetailDialog] = React.useState(false)
  const [adminNotes, setAdminNotes] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("pending")
  const [blockchainAddresses, setBlockchainAddresses] = React.useState<{
    identityRegistryAddress: string | null
    tokenAddress: string | null
  } | null>(null)
  const [userData, setUserData] = React.useState<{
    walletAddress: string | null
  } | null>(null)
  const [isLoadingPaymentDetails, setIsLoadingPaymentDetails] = React.useState(false)

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

      // Fetch structure details to get blockchain addresses
      let identityRegistryAddress: string | null = null
      let tokenAddress: string | null = null
      let userWalletAddress: string | null = null

      try {
        const structureResponse = await fetch(getApiUrl(API_CONFIG.endpoints.getSingleStructure(selectedPayment.structureId)), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (structureResponse.ok) {
          const structureResult = await structureResponse.json()
          if (structureResult.success && structureResult.data) {
            identityRegistryAddress = structureResult.data.smartContract?.identityRegistryAddress
            tokenAddress = structureResult.data.smartContract?.contractAddress
            console.log('[Approvals] Structure blockchain addresses:', { identityRegistryAddress, tokenAddress })
          }
        }
      } catch (err) {
        console.warn('[Approvals] Failed to fetch structure details:', err)
      }

      // Register user and mint tokens before approving payment
      let mintTransactionHash: string | null = null

      // Get user wallet address from fetched user data
      userWalletAddress = userData?.walletAddress ?? null

      // Validate required blockchain addresses before proceeding
      const missingAddresses: string[] = []

      if (!userWalletAddress || userWalletAddress.trim() === '') {
        missingAddresses.push('User wallet address')
      }
      if (!identityRegistryAddress || identityRegistryAddress.trim() === '') {
        missingAddresses.push('Identity registry address')
      }
      if (!tokenAddress || tokenAddress.trim() === '') {
        missingAddresses.push('Token contract address')
      }
      if (!selectedPayment.tokens) {
        missingAddresses.push('Tokens amount missing')
      }

      if (missingAddresses.length > 0) {
        toast({
          title: "Cannot Approve Payment",
          description: `Missing required blockchain configuration: ${missingAddresses.join(', ')}. Please ensure the structure has been deployed on the blockchain and the user has a wallet address configured.`,
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }

      // Step 1: Register user on identity registry
      try {
        console.log('[Approvals] Registering user on identity registry:', {
          identityRegistryAddress,
          userAddress: userWalletAddress,
          country: "Mexico",
          investorType: 0
        })

        const registerResponse = await fetch(getApiUrl(API_CONFIG.endpoints.registerUserOnBlockchain), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identityAddress: identityRegistryAddress,
            userAddress: userWalletAddress,
            country: "Mexico",
            investorType: 0
          }),
        })

        const registerData = await registerResponse.json()

        if (!registerData.success) {
          console.warn('[Approvals] Failed to register user:', registerData.message)
        } else {
          console.log('[Approvals] User registered successfully:', registerData)
        }
      } catch (registerError) {
        console.error('[Approvals] Error registering user:', registerError)
        // Don't fail the approval if registration fails

        toast({
          title: "Cannot Approve Payment",
          description: `[Approvals] Error registering user: ${registerError}.`,
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }

      // Step 2: Mint tokens and capture transaction hash
      try {
        console.log('[Approvals] Minting tokens:', {
          contractAddress: tokenAddress,
          userAddress: userWalletAddress,
          amount: selectedPayment.tokens
        })

        const mintResponse = await fetch(getApiUrl(API_CONFIG.endpoints.mintTokensOnBlockchain), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractAddress: tokenAddress,
            userAddress: userWalletAddress,
            amount: selectedPayment.tokens
          }),
        })

        const mintData = await mintResponse.json()

        if (!mintData.success) {
          console.warn('[Approvals] Failed to mint tokens:', mintData.message)
        } else {
          console.log('[Approvals] Tokens minted successfully:', mintData)
          // Capture mint transaction hash from response
          if (mintData.mintTransactionHash) {
            mintTransactionHash = mintData.mintTransactionHash
            console.log('[Approvals] Mint transaction hash:', mintTransactionHash)
          }

          // Step 3: Update payment after successful minting
          try {
            const updatePaymentResponse = await fetch(getApiUrl(API_CONFIG.endpoints.getPaymentById(selectedPayment.id)), {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tokens: selectedPayment.tokens,
                mintTransactionHash: mintTransactionHash,
                status: 'approved',
                adminNotes: adminNotes || undefined,
              }),
            })
            if (!updatePaymentResponse.ok) {
              throw new Error(`Failed to update payment: ${updatePaymentResponse.statusText}`)
            }
            console.log('[Approvals] Payment updated successfully after minting')

            // Close modal
            setShowDetailDialog(false)
            setSelectedPayment(null)
            setAdminNotes("")

            // Show success toast
            toast({
              title: "Payment Approved Successfully",
              description: `Payment from ${selectedPayment.email} has been approved and tokens have been minted.`,
            })

            // Reload payments and stats
            await loadPayments()
            await loadStats()
          } catch (updateError) {
            console.error('[Approvals] Error updating payment after minting:', updateError)
            throw updateError
          }

          setIsProcessing(false)
        }
      } catch (mintError) {
        console.error('[Approvals] Error minting tokens:', mintError)
        // Don't fail the approval if minting fails
        toast({
          title: "Cannot Approve Payment",
          description: `Error minting tokens: ${mintError}.`,
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }


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

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getPaymentById(selectedPayment.id)), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          adminNotes: adminNotes,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to reject payment: ${response.statusText}`)
      }

      toast({
        title: "Payment Rejected",
        description: `Payment from ${selectedPayment.email} has been rejected.`,
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

  const handleViewDetails = async (payment: Payment) => {
    setSelectedPayment(payment)
    setAdminNotes(payment.adminNotes || "")
    setShowDetailDialog(true)
    setBlockchainAddresses(null)
    setUserData(null)
    setIsLoadingPaymentDetails(true)

    const token = getAuthToken()
    if (!token) {
      setIsLoadingPaymentDetails(false)
      return
    }

    // Fetch structure details to get blockchain addresses
    try {
      const structureResponse = await fetch(getApiUrl(API_CONFIG.endpoints.getSingleStructure(payment.structureId)), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (structureResponse.ok) {
        const structureResult = await structureResponse.json()
        if (structureResult.success && structureResult.data) {
          setBlockchainAddresses({
            identityRegistryAddress: structureResult.data.smartContract?.identityRegistryAddress || null,
            tokenAddress: structureResult.data.smartContract?.contractAddress || null,
          })
        } else {
          // Set empty object if no smart contract data exists
          setBlockchainAddresses({
            identityRegistryAddress: null,
            tokenAddress: null,
          })
        }
      } else {
        // Set empty object if request failed
        setBlockchainAddresses({
          identityRegistryAddress: null,
          tokenAddress: null,
        })
      }
    } catch (err) {
      console.warn('[Approvals] Failed to fetch structure details:', err)
      // Set empty object if request failed
      setBlockchainAddresses({
        identityRegistryAddress: null,
        tokenAddress: null,
      })
    }

    // Fetch user data to get wallet address
    if (payment.userId) {
      try {
        const userResponse = await fetch(getApiUrl(API_CONFIG.endpoints.getUserById(payment.userId)), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (userResponse.ok) {
          const userResult = await userResponse.json()
          if (userResult.success && userResult.data) {
            setUserData({
              walletAddress: userResult.data.walletAddress || null,
            })
          } else {
            // Set empty object if no user data exists
            setUserData({
              walletAddress: null,
            })
          }
        } else {
          // Set empty object if request failed
          setUserData({
            walletAddress: null,
          })
        }
      } catch (err) {
        console.warn('[Approvals] Failed to fetch user details:', err)
        // Set empty object if request failed
        setUserData({
          walletAddress: null,
        })
      }
    } else {
      // Set empty object if no userId exists
      setUserData({
        walletAddress: null,
      })
    }

    setIsLoadingPaymentDetails(false)
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
                                <p className="text-xs text-muted-foreground">{payment.email}</p>
                                <small>{payment.userId}</small>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{payment.structure?.name || payment.structureName || 'N/A'}</p>
                              <p className="font-medium">{payment.structureId || 'N/A'}</p>
                            </TableCell>
                            <TableCell className="text-right">{payment.tokens || payment.ticketsPurchased || 'N/A'}</TableCell>
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
                  <p className="text-sm text-muted-foreground">{selectedPayment.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Structure</Label>
                  <p className="font-semibold">{selectedPayment.structure?.name || selectedPayment.structureName || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{selectedPayment.structureId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tokens</Label>
                  <p className="font-semibold text-lg">{selectedPayment.tokens || selectedPayment.ticketsPurchased || 'N/A'}</p>
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
                <div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">User</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.userId}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Payment</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.id}</p>
                </div>
              </div>

              {/* Blockchain Transactions */}
              {(selectedPayment.paymentTransactionHash || selectedPayment.mintTransactionHash) && (
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Blockchain Transactions</Label>
                  <div className="space-y-3">
                    {selectedPayment.paymentTransactionHash && selectedPayment.paymentTransactionHash.trim() !== '' && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Payment Transaction Hash</Label>
                        <a
                          href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL || 'https://amoy.polygonscan.com/tx/'}${selectedPayment.paymentTransactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono bg-muted p-2 rounded break-all block hover:bg-muted/80 transition-colors text-primary hover:underline mt-1"
                        >
                          {selectedPayment.paymentTransactionHash}
                        </a>
                      </div>
                    )}

                    {selectedPayment.mintTransactionHash && selectedPayment.mintTransactionHash.trim() !== '' && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Token Mint Transaction Hash</Label>
                        <a
                          href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL || 'https://amoy.polygonscan.com/tx/'}${selectedPayment.mintTransactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono bg-muted p-2 rounded break-all block hover:bg-muted/80 transition-colors text-primary hover:underline mt-1"
                        >
                          {selectedPayment.mintTransactionHash}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

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

              {/* Blockchain Configuration Warning */}
              {selectedPayment.status === 'pending' && !isLoadingPaymentDetails && (() => {
                const userWalletAddress = userData?.walletAddress
                const missingFields: string[] = []

                if (!userWalletAddress || userWalletAddress.trim() === '') {
                  missingFields.push('User wallet address')
                }
                if (!blockchainAddresses?.identityRegistryAddress || blockchainAddresses.identityRegistryAddress.trim() === '') {
                  missingFields.push('Identity registry address')
                }
                if (!blockchainAddresses?.tokenAddress || blockchainAddresses.tokenAddress.trim() === '') {
                  missingFields.push('Token contract address')
                }

                if (missingFields.length > 0) {
                  return (
                    <Card className="border-amber-200 bg-amber-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-amber-900 flex items-center gap-2 text-base">
                          <AlertCircle className="h-5 w-5" />
                          Blockchain Configuration Required
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-amber-800 mb-2">
                          Cannot approve payment. The following blockchain configuration is missing:
                        </p>
                        <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                          {missingFields.map((field, index) => (
                            <li key={index}>{field}</li>
                          ))}
                        </ul>
                        <p className="text-sm text-amber-800 mt-3">
                          Please ensure the structure has been properly deployed on the blockchain with all required smart contracts and the user has a wallet address configured.
                        </p>
                      </CardContent>
                    </Card>
                  )
                }
                return null
              })()}

              {/* Loading indicator for payment details */}
              {isLoadingPaymentDetails && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-blue-800">Loading payment details and blockchain configuration...</p>
                    </div>
                  </CardContent>
                </Card>
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
              {selectedPayment.status === 'pending' && (() => {
                const userWalletAddress = userData?.walletAddress
                const canApprove = !isLoadingPaymentDetails &&
                                  userWalletAddress &&
                                  userWalletAddress.trim() !== '' &&
                                  blockchainAddresses?.identityRegistryAddress &&
                                  blockchainAddresses.identityRegistryAddress.trim() !== '' &&
                                  blockchainAddresses?.tokenAddress &&
                                  blockchainAddresses.tokenAddress.trim() !== ''

                return (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      className={isGuest ? "w-full" : "flex-1"}
                      onClick={() => setShowDetailDialog(false)}
                      disabled={isProcessing}
                    >
                      {isGuest ? 'Close' : 'Cancel'}
                    </Button>
                    {!isGuest && (
                      <>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={handleReject}
                          disabled={isProcessing || isLoadingPaymentDetails}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={handleApprove}
                          disabled={isProcessing || !canApprove}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isLoadingPaymentDetails ? 'Loading...' : 'Approve'}
                        </Button>
                      </>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
