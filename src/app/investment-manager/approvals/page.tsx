"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
  ShoppingCart,
  Landmark,
  ArrowDownCircle,
  FileCheck,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuthToken, getAuthState, logout } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { sendPaymentCreatedNotificationEmail } from "@/lib/email-service"
import { useTranslation } from "@/hooks/useTranslation"

type ApprovalStatus = 'pending_cfo' | 'approved' | 'rejected'

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

// Capital Call types for approval workflow
interface CapitalCallApproval {
  id: string
  callNumber: string
  callDate: string
  dueDate: string
  totalCallAmount: number
  status: string
  approvalStatus: ApprovalStatus
  purpose: string
  notes?: string
  structureId: string
  structure?: {
    id: string
    name: string
    type?: string
  }
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface CapitalCallStats {
  total: number
  pendingReview: number
  pendingCfo: number
  approved: number
  rejected: number
  totalAmount: number
}

// Distribution types for approval workflow
interface DistributionApproval {
  id: string
  distributionNumber: string
  distributionDate: string
  totalAmount: number
  status: string
  approvalStatus: ApprovalStatus
  source: string
  notes?: string
  structureId: string
  structure?: {
    id: string
    name: string
    type?: string
  }
  waterfallApplied: boolean
  lpTotalAmount: number
  gpTotalAmount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface DistributionStats {
  total: number
  pendingReview: number
  pendingCfo: number
  approved: number
  rejected: number
  totalAmount: number
}

export default function ApprovalsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { t, language } = useTranslation()

  // Check if user is guest
  const authState = getAuthState()
  const currentUserRole = authState.user?.role ?? null
  const isGuest = currentUserRole === 4

  // ILPA: Approval type tab (marketplace, capital-calls, capital-call-payments, distributions)
  const [approvalType, setApprovalType] = React.useState<'marketplace' | 'capital-calls' | 'capital-call-payments' | 'distributions'>('marketplace')

  // Capital Calls approval state
  const [capitalCalls, setCapitalCalls] = React.useState<CapitalCallApproval[]>([])
  const [capitalCallStats, setCapitalCallStats] = React.useState<CapitalCallStats | null>(null)
  const [selectedCapitalCall, setSelectedCapitalCall] = React.useState<CapitalCallApproval | null>(null)
  const [showCapitalCallDialog, setShowCapitalCallDialog] = React.useState(false)
  const [capitalCallNotes, setCapitalCallNotes] = React.useState("")
  const [isCapitalCallProcessing, setIsCapitalCallProcessing] = React.useState(false)
  const [isCapitalCallsLoading, setIsCapitalCallsLoading] = React.useState(true)
  const [capitalCallsError, setCapitalCallsError] = React.useState<string | null>(null)
  const [capitalCallActiveTab, setCapitalCallActiveTab] = React.useState("pending")
  const isCFO = currentUserRole === 0 // Root user is CFO

  // Distribution approval state
  const [distributions, setDistributions] = React.useState<DistributionApproval[]>([])
  const [distributionStats, setDistributionStats] = React.useState<DistributionStats | null>(null)
  const [selectedDistribution, setSelectedDistribution] = React.useState<DistributionApproval | null>(null)
  const [showDistributionDialog, setShowDistributionDialog] = React.useState(false)
  const [distributionNotes, setDistributionNotes] = React.useState("")
  const [isDistributionProcessing, setIsDistributionProcessing] = React.useState(false)
  const [isDistributionsLoading, setIsDistributionsLoading] = React.useState(true)
  const [distributionsError, setDistributionsError] = React.useState<string | null>(null)
  const [distributionActiveTab, setDistributionActiveTab] = React.useState("pending")

  // Capital Call Payments state (investor payments for capital call notices)
  const [capitalCallPayments, setCapitalCallPayments] = React.useState<any[]>([])
  const [capitalCallPaymentStats, setCapitalCallPaymentStats] = React.useState<any>(null)
  const [isCapitalCallPaymentsLoading, setIsCapitalCallPaymentsLoading] = React.useState(true)
  const [capitalCallPaymentsError, setCapitalCallPaymentsError] = React.useState<string | null>(null)
  const [capitalCallPaymentActiveTab, setCapitalCallPaymentActiveTab] = React.useState("pending")
  const [selectedCapitalCallPayment, setSelectedCapitalCallPayment] = React.useState<any>(null)
  const [showCapitalCallPaymentDialog, setShowCapitalCallPaymentDialog] = React.useState(false)
  const [isCapitalCallPaymentProcessing, setIsCapitalCallPaymentProcessing] = React.useState(false)
  const [capitalCallPaymentNotes, setCapitalCallPaymentNotes] = React.useState("")

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

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {
        // Check if it's an expired token error
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Approvals] 401 Unauthorized - clearing session and redirecting to login')
            logout()
            router.push('/sign-in')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

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

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {
        // Check if it's an expired token error
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Approvals] 401 Unauthorized - clearing session and redirecting to login')
            logout()
            router.push('/sign-in')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`)
      }

      const data = await response.json()
      setStats(data.data)
    } catch (err) {
      console.error('[Approvals] Error fetching stats:', err)
    }
  }

  // ====================================================================================
  // CAPITAL CALLS API FUNCTIONS
  // ====================================================================================

  // Load capital calls pending approval
  const loadCapitalCalls = async () => {
    setIsCapitalCallsLoading(true)
    setCapitalCallsError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setCapitalCallsError('No authentication token found')
        setIsCapitalCallsLoading(false)
        return
      }

      const response = await fetch(getApiUrl('/api/capital-calls'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        logout()
        router.push('/sign-in')
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch capital calls: ${response.statusText}`)
      }

      const data = await response.json()
      setCapitalCalls(data.data || [])

      // Calculate stats
      const calls = data.data || []
      setCapitalCallStats({
        total: calls.length,
        pendingReview: 0,
        pendingCfo: calls.filter((c: CapitalCallApproval) => c.approvalStatus === 'pending_cfo').length,
        approved: calls.filter((c: CapitalCallApproval) => c.approvalStatus === 'approved').length,
        rejected: calls.filter((c: CapitalCallApproval) => c.approvalStatus === 'rejected').length,
        totalAmount: calls.reduce((sum: number, c: CapitalCallApproval) => sum + (c.totalCallAmount || 0), 0),
      })
    } catch (err) {
      console.error('[Approvals] Error fetching capital calls:', err)
      setCapitalCallsError(err instanceof Error ? err.message : 'Failed to fetch capital calls')
    } finally {
      setIsCapitalCallsLoading(false)
    }
  }

  // Handle capital call approval
  const handleCapitalCallApprove = async () => {
    if (!selectedCapitalCall) return

    setIsCapitalCallProcessing(true)
    try {
      const token = getAuthToken()
      if (!token) throw new Error('No authentication token found')

      const endpoint = selectedCapitalCall.approvalStatus === 'pending_cfo'
        ? `/api/capital-calls/${selectedCapitalCall.id}/cfo-approve`
        : `/api/capital-calls/${selectedCapitalCall.id}/approve`

      const response = await fetch(getApiUrl(endpoint), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: capitalCallNotes || undefined,
        }),
      })

      if (response.status === 401) {
        logout()
        router.push('/sign-in')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to approve capital call')
      }

      toast({
        title: "Approved",
        description: `Capital Call #${selectedCapitalCall.callNumber} has been approved.`,
      })

      setShowCapitalCallDialog(false)
      setSelectedCapitalCall(null)
      setCapitalCallNotes("")
      await loadCapitalCalls()
    } catch (error) {
      console.error('[Approvals] Error approving capital call:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve capital call",
        variant: "destructive",
      })
    } finally {
      setIsCapitalCallProcessing(false)
    }
  }

  // Handle capital call rejection
  const handleCapitalCallReject = async () => {
    if (!selectedCapitalCall || !capitalCallNotes.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      })
      return
    }

    setIsCapitalCallProcessing(true)
    try {
      const token = getAuthToken()
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(getApiUrl(`/api/capital-calls/${selectedCapitalCall.id}/reject`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: capitalCallNotes,
        }),
      })

      if (response.status === 401) {
        logout()
        router.push('/sign-in')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to reject capital call')
      }

      toast({
        title: "Rejected",
        description: `Capital Call #${selectedCapitalCall.callNumber} has been rejected.`,
        variant: "destructive",
      })

      setShowCapitalCallDialog(false)
      setSelectedCapitalCall(null)
      setCapitalCallNotes("")
      await loadCapitalCalls()
    } catch (error) {
      console.error('[Approvals] Error rejecting capital call:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject capital call",
        variant: "destructive",
      })
    } finally {
      setIsCapitalCallProcessing(false)
    }
  }

  const handleViewCapitalCallDetails = (capitalCall: CapitalCallApproval) => {
    setSelectedCapitalCall(capitalCall)
    setCapitalCallNotes("")
    setShowCapitalCallDialog(true)
  }

  // Load capital calls when tab changes
  React.useEffect(() => {
    if (approvalType === 'capital-calls') {
      loadCapitalCalls()
    }
  }, [approvalType])

  // Filter capital calls by tab
  const filteredCapitalCalls = React.useMemo(() => {
    switch (capitalCallActiveTab) {
      case 'all':
        return capitalCalls
      case 'pending':
      case 'pending_cfo':
        return capitalCalls.filter(c => c.approvalStatus === 'pending_cfo')
      case 'approved':
        return capitalCalls.filter(c => c.approvalStatus === 'approved')
      case 'rejected':
        return capitalCalls.filter(c => c.approvalStatus === 'rejected')
      default:
        return capitalCalls
    }
  }, [capitalCalls, capitalCallActiveTab])

  // ====================================================================================
  // CAPITAL CALL PAYMENTS API FUNCTIONS
  // ====================================================================================

  const loadCapitalCallPayments = async () => {
    setIsCapitalCallPaymentsLoading(true)
    setCapitalCallPaymentsError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setCapitalCallPaymentsError('No authentication token found')
        setIsCapitalCallPaymentsLoading(false)
        return
      }

      const response = await fetch(getApiUrl('/api/capital-calls/payments'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        logout()
        router.push('/sign-in')
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch capital call payments: ${response.statusText}`)
      }

      const data = await response.json()
      setCapitalCallPayments(data.data || [])
      setCapitalCallPaymentStats(data.stats || null)
    } catch (err) {
      console.error('[Approvals] Error fetching capital call payments:', err)
      setCapitalCallPaymentsError(err instanceof Error ? err.message : 'Failed to fetch capital call payments')
    } finally {
      setIsCapitalCallPaymentsLoading(false)
    }
  }

  // Load capital call payments when tab changes
  React.useEffect(() => {
    if (approvalType === 'capital-call-payments') {
      loadCapitalCallPayments()
    }
  }, [approvalType])

  // Filter capital call payments by approval status
  const filteredCapitalCallPayments = React.useMemo(() => {
    switch (capitalCallPaymentActiveTab) {
      case 'all':
        return capitalCallPayments
      case 'pending':
        return capitalCallPayments.filter(p => p.paymentApprovalStatus === 'pending')
      case 'approved':
        return capitalCallPayments.filter(p => p.paymentApprovalStatus === 'approved')
      case 'rejected':
        return capitalCallPayments.filter(p => p.paymentApprovalStatus === 'rejected')
      default:
        return capitalCallPayments
    }
  }, [capitalCallPayments, capitalCallPaymentActiveTab])

  const handleViewCapitalCallPaymentDetails = (payment: any) => {
    setSelectedCapitalCallPayment(payment)
    setShowCapitalCallPaymentDialog(true)
  }

  const handleApproveCapitalCallPayment = async () => {
    if (!selectedCapitalCallPayment) return
    setIsCapitalCallPaymentProcessing(true)
    try {
      const token = getAuthToken()
      const response = await fetch(getApiUrl(`/api/capital-calls/payments/${selectedCapitalCallPayment.id}/approve`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: capitalCallPaymentNotes || undefined }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || 'Failed to approve payment')
      }
      toast({ title: t.approvals.approved, description: `Payment from ${selectedCapitalCallPayment.investorName} approved.` })
      setShowCapitalCallPaymentDialog(false)
      setCapitalCallPaymentNotes("")
      loadCapitalCallPayments()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "Failed to approve payment" })
    } finally {
      setIsCapitalCallPaymentProcessing(false)
    }
  }

  const handleRejectCapitalCallPayment = async () => {
    if (!selectedCapitalCallPayment || !capitalCallPaymentNotes.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please provide a reason for rejection" })
      return
    }
    setIsCapitalCallPaymentProcessing(true)
    try {
      const token = getAuthToken()
      const response = await fetch(getApiUrl(`/api/capital-calls/payments/${selectedCapitalCallPayment.id}/reject`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: capitalCallPaymentNotes }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || 'Failed to reject payment')
      }
      toast({ title: t.approvals.rejected, description: `Payment from ${selectedCapitalCallPayment.investorName} rejected.` })
      setShowCapitalCallPaymentDialog(false)
      setCapitalCallPaymentNotes("")
      loadCapitalCallPayments()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "Failed to reject payment" })
    } finally {
      setIsCapitalCallPaymentProcessing(false)
    }
  }

  // ====================================================================================
  // DISTRIBUTION APPROVAL API FUNCTIONS
  // ====================================================================================

  // Load distributions pending approval
  const loadDistributions = async () => {
    setIsDistributionsLoading(true)
    setDistributionsError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setDistributionsError('No authentication token found')
        setIsDistributionsLoading(false)
        return
      }

      const response = await fetch(getApiUrl('/api/distributions'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        logout()
        router.push('/sign-in')
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch distributions: ${response.statusText}`)
      }

      const data = await response.json()
      setDistributions(data.data || [])

      // Calculate stats
      const dists = data.data || []
      setDistributionStats({
        total: dists.length,
        pendingReview: 0,
        pendingCfo: dists.filter((d: DistributionApproval) => d.approvalStatus === 'pending_cfo').length,
        approved: dists.filter((d: DistributionApproval) => d.approvalStatus === 'approved').length,
        rejected: dists.filter((d: DistributionApproval) => d.approvalStatus === 'rejected').length,
        totalAmount: dists.reduce((sum: number, d: DistributionApproval) => sum + (d.totalAmount || 0), 0),
      })
    } catch (err) {
      console.error('[Approvals] Error fetching distributions:', err)
      setDistributionsError(err instanceof Error ? err.message : 'Failed to fetch distributions')
    } finally {
      setIsDistributionsLoading(false)
    }
  }

  // Handle distribution approval
  const handleDistributionApprove = async () => {
    if (!selectedDistribution) return

    setIsDistributionProcessing(true)
    try {
      const token = getAuthToken()
      if (!token) throw new Error('No authentication token found')

      const endpoint = selectedDistribution.approvalStatus === 'pending_cfo'
        ? `/api/distributions/${selectedDistribution.id}/cfo-approve`
        : `/api/distributions/${selectedDistribution.id}/approve`

      const response = await fetch(getApiUrl(endpoint), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: distributionNotes || undefined,
        }),
      })

      if (response.status === 401) {
        logout()
        router.push('/sign-in')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to approve distribution')
      }

      toast({
        title: "Approved",
        description: `Distribution #${selectedDistribution.distributionNumber} has been approved.`,
      })

      setShowDistributionDialog(false)
      setSelectedDistribution(null)
      setDistributionNotes("")
      await loadDistributions()
    } catch (error) {
      console.error('[Approvals] Error approving distribution:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve distribution",
        variant: "destructive",
      })
    } finally {
      setIsDistributionProcessing(false)
    }
  }

  // Handle distribution rejection
  const handleDistributionReject = async () => {
    if (!selectedDistribution || !distributionNotes.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      })
      return
    }

    setIsDistributionProcessing(true)
    try {
      const token = getAuthToken()
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(getApiUrl(`/api/distributions/${selectedDistribution.id}/reject`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: distributionNotes,
        }),
      })

      if (response.status === 401) {
        logout()
        router.push('/sign-in')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to reject distribution')
      }

      toast({
        title: "Rejected",
        description: `Distribution #${selectedDistribution.distributionNumber} has been rejected.`,
        variant: "destructive",
      })

      setShowDistributionDialog(false)
      setSelectedDistribution(null)
      setDistributionNotes("")
      await loadDistributions()
    } catch (error) {
      console.error('[Approvals] Error rejecting distribution:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject distribution",
        variant: "destructive",
      })
    } finally {
      setIsDistributionProcessing(false)
    }
  }

  const handleViewDistributionDetails = (distribution: DistributionApproval) => {
    setSelectedDistribution(distribution)
    setDistributionNotes("")
    setShowDistributionDialog(true)
  }

  // Load distributions when tab changes
  React.useEffect(() => {
    if (approvalType === 'distributions') {
      loadDistributions()
    }
  }, [approvalType])

  // Filter distributions by tab
  const filteredDistributions = React.useMemo(() => {
    switch (distributionActiveTab) {
      case 'all':
        return distributions
      case 'pending':
      case 'pending_cfo':
        return distributions.filter(d => d.approvalStatus === 'pending_cfo')
      case 'approved':
        return distributions.filter(d => d.approvalStatus === 'approved')
      case 'rejected':
        return distributions.filter(d => d.approvalStatus === 'rejected')
      default:
        return distributions
    }
  }, [distributions, distributionActiveTab])

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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />{t.approvals.pending}</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />{t.approvals.approved}</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />{t.approvals.rejected}</Badge>
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

        // Handle 401 Unauthorized - session expired or invalid
        if (structureResponse.status === 401) {
          // Check if it's an expired token error
          try {
            const errorData = await structureResponse.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Approvals] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

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

        // Handle 401 Unauthorized - session expired or invalid
        if (registerResponse.status === 401) {
          // Check if it's an expired token error
          try {
            const errorData = await registerResponse.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Approvals] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

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

        // Handle 401 Unauthorized - session expired or invalid
        if (mintResponse.status === 401) {
          // Check if it's an expired token error
          try {
            const errorData = await mintResponse.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Approvals] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

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

            // Handle 401 Unauthorized - session expired or invalid
            if (updatePaymentResponse.status === 401) {
              // Check if it's an expired token error
              try {
                const errorData = await updatePaymentResponse.json()
                if (errorData.error === "Invalid or expired token") {
                  console.log('[Approvals] 401 Unauthorized - clearing session and redirecting to login')
                  logout()
                  router.push('/sign-in')
                  return
                }
              } catch (e) {
                console.log('Error: ', e)
              }
            }

            if (!updatePaymentResponse.ok) {
              throw new Error(`Failed to update payment: ${updatePaymentResponse.statusText}`)
            }
            console.log('[Approvals] Payment updated successfully after minting')

            // Send payment confirmation email if user has paymentConfirmations enabled
            const userIdToFetch = selectedPayment.userId
            if (userIdToFetch) {
              try {
                console.log('[Approvals] Fetching user notification settings for user:', userIdToFetch)
                const notificationSettingsResponse = await fetch(
                  getApiUrl(API_CONFIG.endpoints.getNotificationSettingsById(userIdToFetch)),
                  {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                )

                // Handle 401 Unauthorized - session expired or invalid
                if (notificationSettingsResponse.status === 401) {
                  // Check if it's an expired token error
                  try {
                    const errorData = await notificationSettingsResponse.json()
                    if (errorData.error === "Invalid or expired token") {
                      console.log('[Approvals] 401 Unauthorized - clearing session and redirecting to login')
                      logout()
                      router.push('/sign-in')
                      return
                    }
                  } catch (e) {
                    console.log('Error: ', e)
                  }
                }

                if (notificationSettingsResponse.ok) {
                  const notificationData = await notificationSettingsResponse.json()
                  console.log('[Approvals] User notification settings:', notificationData)

                  if (notificationData.success && notificationData.data?.paymentConfirmations) {
                    const currentDate = new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })

                    await sendPaymentCreatedNotificationEmail(
                      userIdToFetch,
                      selectedPayment.email,
                      {
                        investorName: selectedPayment.investorName || selectedPayment.email,
                        paymentAmount: selectedPayment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        paymentCurrency: selectedPayment.paymentMethod === 'usdc' ? 'USDC' : 'USD',
                        paymentMethod: selectedPayment.paymentMethod === 'usdc' ? 'Cryptocurrency (USDC)' : 'Bank Transfer',
                        paymentDate: currentDate,
                        paymentReference: selectedPayment.id,
                        structureName: selectedPayment.structure?.name || selectedPayment.structureName || 'N/A',
                        fundManagerName: 'Polibit Team',
                        fundManagerEmail: 'support@polibit.com',
                        additionalDetails: `Your payment has been approved and ${selectedPayment.tokens || 0} tokens have been minted to your account.${mintTransactionHash ? `\n\nMint Transaction Hash: ${mintTransactionHash}` : ''}${selectedPayment.paymentTransactionHash ? `\nPayment Transaction Hash: ${selectedPayment.paymentTransactionHash}` : ''}`
                      }
                    )
                    console.log('[Approvals] Payment approval notification email sent successfully')
                  } else {
                    console.log('[Approvals] User has paymentConfirmations disabled, skipping email notification')
                  }
                } else {
                  console.warn('[Approvals] Failed to fetch user notification settings')
                }
              } catch (emailError) {
                console.error('[Approvals] Error sending payment approval notification:', emailError)
                // Don't fail the approval if email fails
              }
            } else {
              console.warn('[Approvals] No user ID found to send notification')
            }

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

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {
        // Check if it's an expired token error
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Approvals] 401 Unauthorized - clearing session and redirecting to login')
            logout()
            router.push('/sign-in')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

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

      // Handle 401 Unauthorized - session expired or invalid
      if (structureResponse.status === 401) {
        // Check if it's an expired token error
        try {
          const errorData = await structureResponse.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Approvals] 401 Unauthorized - clearing session and redirecting to login')
            logout()
            router.push('/sign-in')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

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

        // Handle 401 Unauthorized - session expired or invalid
        if (userResponse.status === 401) {
          // Check if it's an expired token error
          try {
            const errorData = await userResponse.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Approvals] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

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
        <h1 className="text-3xl font-bold tracking-tight">{t.approvals.title}</h1>
        <p className="text-muted-foreground mt-2">
          {t.approvals.subtitle}
        </p>
      </div>

      {/* ILPA: Approval Type Tabs */}
      <Tabs value={approvalType} onValueChange={(value) => setApprovalType(value as typeof approvalType)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">{t.approvals.marketplace}</span>
            <span className="sm:hidden">{t.approvals.market}</span>
          </TabsTrigger>
          <TabsTrigger value="capital-calls" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">{t.approvals.capitalCallsTab}</span>
            <span className="sm:hidden">{t.approvals.callsTab}</span>
          </TabsTrigger>
          <TabsTrigger value="capital-call-payments" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{t.approvals.capitalCallPaymentsTab}</span>
            <span className="sm:hidden">{t.approvals.capitalCallPaymentsTabShort}</span>
          </TabsTrigger>
          <TabsTrigger value="distributions" className="flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t.approvals.distributionsTab}</span>
            <span className="sm:hidden">{t.approvals.distTab}</span>
          </TabsTrigger>
        </TabsList>

        {/* Marketplace Tab Content */}
        <TabsContent value="marketplace" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.totalTransactions}</CardDescription>
                <CardTitle className="text-3xl">{localStats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.pending}</CardDescription>
                <CardTitle className="text-3xl text-yellow-600">{localStats.pending}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.approved}</CardDescription>
                <CardTitle className="text-3xl text-green-600">{localStats.approved}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.rejected}</CardDescription>
                <CardTitle className="text-3xl text-red-600">{localStats.rejected}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t.approvals.transactions}</CardTitle>
              <CardDescription>{t.approvals.reviewPayments}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-lg font-semibold mb-2">{t.approvals.loadingPayments}</p>
                  <p className="text-sm text-muted-foreground">{t.approvals.pleaseWait}</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">{t.approvals.errorLoadingPayments}</p>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => loadPayments()}>{t.approvals.tryAgain}</Button>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="pending">
                      {t.approvals.pending} {localStats.pending > 0 && <Badge className="ml-2 h-5 min-w-5">{localStats.pending}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="all">{t.approvals.all}</TabsTrigger>
                    <TabsTrigger value="approved">{t.approvals.approved}</TabsTrigger>
                    <TabsTrigger value="rejected">{t.approvals.rejected}</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-6">
                    {filteredPayments.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-semibold mb-2">{t.approvals.noPaymentsFound}</p>
                        <p className="text-sm text-muted-foreground">
                          {activeTab === 'pending'
                            ? t.approvals.noPaymentsFound
                            : `${t.approvals.noPaymentsFound}`
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t.approvals.investor}</TableHead>
                              <TableHead>{t.approvals.structure}</TableHead>
                              <TableHead className="text-right">{t.approvals.tickets}</TableHead>
                              <TableHead className="text-right">{t.approvals.amount}</TableHead>
                              <TableHead>{t.approvals.paymentMethod}</TableHead>
                              <TableHead>{t.approvals.date}</TableHead>
                              <TableHead>{t.approvals.status}</TableHead>
                              <TableHead className="text-right">{t.approvals.actions}</TableHead>
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
                                  {t.approvals.view}
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
        </TabsContent>

        {/* Capital Calls Tab Content */}
        <TabsContent value="capital-calls" className="mt-6 space-y-6">
          {/* Capital Calls Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.capitalCallsTab}</CardDescription>
                <CardTitle className="text-3xl">{capitalCallStats?.total || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.pending}</CardDescription>
                <CardTitle className="text-3xl text-yellow-600">{capitalCallStats?.pendingCfo || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.amount}</CardDescription>
                <CardTitle className="text-3xl text-primary">{formatCurrency(capitalCallStats?.totalAmount || 0)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Capital Calls Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t.approvals.capitalCallApprovals}</CardTitle>
              <CardDescription>
                {t.approvals.capitalCallApprovalsDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCapitalCallsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-lg font-semibold mb-2">{t.approvals.loadingPayments}</p>
                  <p className="text-sm text-muted-foreground">{t.approvals.pleaseWait}</p>
                </div>
              ) : capitalCallsError ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">{t.approvals.errorLoadingPayments}</p>
                  <p className="text-sm text-muted-foreground mb-4">{capitalCallsError}</p>
                  <Button onClick={() => loadCapitalCalls()}>{t.approvals.tryAgain}</Button>
                </div>
              ) : (
                <Tabs value={capitalCallActiveTab} onValueChange={setCapitalCallActiveTab}>
                  <TabsList>
                    <TabsTrigger value="pending">
                      {t.approvals.pending} {(capitalCallStats?.pendingCfo || 0) > 0 && (
                        <Badge className="ml-2 h-5 min-w-5">{capitalCallStats?.pendingCfo || 0}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      {t.approvals.approved} {(capitalCallStats?.approved || 0) > 0 && (
                        <Badge variant="outline" className="ml-2 h-5 min-w-5 bg-green-50 text-green-700 border-green-200">{capitalCallStats?.approved || 0}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      {t.approvals.rejected} {(capitalCallStats?.rejected || 0) > 0 && (
                        <Badge variant="outline" className="ml-2 h-5 min-w-5 bg-red-50 text-red-700 border-red-200">{capitalCallStats?.rejected || 0}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="all">{t.approvals.all}</TabsTrigger>
                  </TabsList>

                  <TabsContent value={capitalCallActiveTab} className="mt-6">
                    {filteredCapitalCalls.length === 0 ? (
                      <div className="text-center py-12">
                        <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-semibold mb-2">{t.approvals.noCapitalCallsFound}</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {capitalCallActiveTab === 'pending'
                            ? t.approvals.noCapitalCallsPending
                            : `${t.approvals.noCapitalCallsIn} ${capitalCallActiveTab.replace('_', ' ')} ${t.approvals.statusSuffix}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.approvals.capitalCallWorkflow}
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t.approvals.callNumber}</TableHead>
                              <TableHead>{t.approvals.structure}</TableHead>
                              <TableHead className="text-right">{t.approvals.amount}</TableHead>
                              <TableHead>{t.approvals.dueDate}</TableHead>
                              <TableHead>{t.approvals.purpose}</TableHead>
                              <TableHead>{t.approvals.status}</TableHead>
                              <TableHead className="text-right">{t.approvals.actions}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCapitalCalls.map((capitalCall) => (
                              <TableRow key={capitalCall.id}>
                                <TableCell className="font-medium">#{capitalCall.callNumber}</TableCell>
                                <TableCell>
                                  <p className="font-medium">{capitalCall.structure?.name || 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground">{capitalCall.structure?.type}</p>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatCurrency(capitalCall.totalCallAmount)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(capitalCall.dueDate)}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {capitalCall.purpose || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {capitalCall.approvalStatus === 'pending_cfo' && (
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                      <Clock className="h-3 w-3 mr-1" />{t.approvals.pending}
                                    </Badge>
                                  )}
                                  {capitalCall.approvalStatus === 'approved' && (
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />{t.approvals.approved}
                                    </Badge>
                                  )}
                                  {capitalCall.approvalStatus === 'rejected' && (
                                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                                      <XCircle className="h-3 w-3 mr-1" />{t.approvals.rejected}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewCapitalCallDetails(capitalCall)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {t.approvals.review}
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
        </TabsContent>

        {/* Capital Call Payments Tab Content */}
        <TabsContent value="capital-call-payments" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.totalCapitalCallPayments}</CardDescription>
                <CardTitle className="text-3xl">{capitalCallPaymentStats?.total || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.pending}</CardDescription>
                <CardTitle className="text-3xl text-yellow-600">{capitalCallPaymentStats?.pending || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.approved}</CardDescription>
                <CardTitle className="text-3xl text-green-600">{capitalCallPaymentStats?.approved || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.totalAmount}</CardDescription>
                <CardTitle className="text-3xl text-primary">{formatCurrency(capitalCallPaymentStats?.totalPaidAmount || 0)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Capital Call Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t.approvals.capitalCallPayments}</CardTitle>
              <CardDescription>
                {t.approvals.capitalCallPaymentsDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCapitalCallPaymentsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-lg font-semibold mb-2">{t.approvals.loadingCapitalCallPayments}</p>
                  <p className="text-sm text-muted-foreground">{t.approvals.pleaseWait}</p>
                </div>
              ) : capitalCallPaymentsError ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">{t.approvals.errorLoadingCapitalCallPayments}</p>
                  <p className="text-sm text-muted-foreground mb-4">{capitalCallPaymentsError}</p>
                  <Button onClick={() => loadCapitalCallPayments()}>{t.approvals.tryAgain}</Button>
                </div>
              ) : (
                <Tabs value={capitalCallPaymentActiveTab} onValueChange={setCapitalCallPaymentActiveTab}>
                  <TabsList>
                    <TabsTrigger value="pending">
                      {t.approvals.pending} {(capitalCallPaymentStats?.pending || 0) > 0 && (
                        <Badge className="ml-2 h-5 min-w-5">{capitalCallPaymentStats?.pending || 0}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="all">{t.approvals.all}</TabsTrigger>
                    <TabsTrigger value="approved">
                      {t.approvals.approved} {(capitalCallPaymentStats?.approved || 0) > 0 && (
                        <Badge variant="outline" className="ml-2 h-5 min-w-5 bg-green-50 text-green-700 border-green-200">{capitalCallPaymentStats?.approved || 0}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      {t.approvals.rejected} {(capitalCallPaymentStats?.rejected || 0) > 0 && (
                        <Badge variant="outline" className="ml-2 h-5 min-w-5 bg-red-50 text-red-700 border-red-200">{capitalCallPaymentStats?.rejected || 0}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={capitalCallPaymentActiveTab} className="mt-6">
                    {filteredCapitalCallPayments.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-semibold mb-2">{t.approvals.noCapitalCallPayments}</p>
                        <p className="text-sm text-muted-foreground">
                          {capitalCallPaymentActiveTab === 'pending'
                            ? t.approvals.noCapitalCallPaymentsPending
                            : `${t.approvals.noCapitalCallPaymentsIn} ${capitalCallPaymentActiveTab}`
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>{t.approvals.investor}</TableHead>
                              <TableHead>{t.approvals.structure}</TableHead>
                              <TableHead>{t.approvals.callNumberLabel}</TableHead>
                              <TableHead className="text-right">{t.approvals.amountPaid}</TableHead>
                              <TableHead>{t.approvals.paymentMethod}</TableHead>
                              <TableHead>{t.approvals.date}</TableHead>
                              <TableHead>{t.approvals.status}</TableHead>
                              <TableHead className="text-right">{t.approvals.actions}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCapitalCallPayments.map((payment: any) => (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{payment.investorName}</p>
                                    <p className="text-xs text-muted-foreground">{payment.investorEmail}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{payment.structureName}</p>
                                    <p className="text-xs text-muted-foreground">{payment.structureType}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">#{payment.callNumber}</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatCurrency(payment.paidAmount)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {payment.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                                     payment.paymentMethod === 'stablecoin' ? 'Stablecoin' :
                                     payment.paymentMethod || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString(language === 'spanish' ? 'es-ES' : 'en-US') : '-'}
                                </TableCell>
                                <TableCell>
                                  {payment.paymentApprovalStatus === 'pending' && (
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                      <Clock className="h-3 w-3 mr-1" />{t.approvals.pending}
                                    </Badge>
                                  )}
                                  {payment.paymentApprovalStatus === 'approved' && (
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />{t.approvals.approved}
                                    </Badge>
                                  )}
                                  {payment.paymentApprovalStatus === 'rejected' && (
                                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                                      <XCircle className="h-3 w-3 mr-1" />{t.approvals.rejected}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewCapitalCallPaymentDetails(payment)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {payment.paymentApprovalStatus === 'pending' ? t.approvals.review : t.approvals.view}
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
        </TabsContent>

        {/* Distributions Tab Content */}
        <TabsContent value="distributions" className="mt-6 space-y-6">
          {/* Distributions Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.totalPending}</CardDescription>
                <CardTitle className="text-3xl">{distributionStats?.total || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.pendingReview}</CardDescription>
                <CardTitle className="text-3xl text-yellow-600">{distributionStats?.pendingReview || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.pending}</CardDescription>
                <CardTitle className="text-3xl text-blue-600">{distributionStats?.pendingCfo || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.approvals.totalAmount}</CardDescription>
                <CardTitle className="text-3xl text-primary">{formatCurrency(distributionStats?.totalAmount || 0)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Distributions Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t.approvals.distributionApprovals}</CardTitle>
              <CardDescription>
                {t.approvals.distributionApprovalsDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDistributionsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-lg font-semibold mb-2">{t.approvals.loadingDistributions}</p>
                  <p className="text-sm text-muted-foreground">{t.approvals.pleaseWait}</p>
                </div>
              ) : distributionsError ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">{t.approvals.errorLoadingDistributions}</p>
                  <p className="text-sm text-muted-foreground mb-4">{distributionsError}</p>
                  <Button onClick={() => loadDistributions()}>{t.approvals.tryAgain}</Button>
                </div>
              ) : (
                <Tabs value={distributionActiveTab} onValueChange={setDistributionActiveTab}>
                  <TabsList>
                    <TabsTrigger value="pending">
                      {t.approvals.pending} {(distributionStats?.pendingCfo || 0) > 0 && (
                        <Badge className="ml-2 h-5 min-w-5">{distributionStats?.pendingCfo || 0}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      {t.approvals.approved} {(distributionStats?.approved || 0) > 0 && (
                        <Badge variant="outline" className="ml-2 h-5 min-w-5 bg-green-50 text-green-700 border-green-200">{distributionStats?.approved || 0}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      {t.approvals.rejected} {(distributionStats?.rejected || 0) > 0 && (
                        <Badge variant="outline" className="ml-2 h-5 min-w-5 bg-red-50 text-red-700 border-red-200">{distributionStats?.rejected || 0}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="all">{t.approvals.all}</TabsTrigger>
                  </TabsList>

                  <TabsContent value={distributionActiveTab} className="mt-6">
                    {filteredDistributions.length === 0 ? (
                      <div className="text-center py-12">
                        <ArrowDownCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-semibold mb-2">{t.approvals.noDistributionsFound}</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {distributionActiveTab === 'pending'
                            ? t.approvals.noDistributionsPending
                            : `${t.approvals.noDistributionsIn} ${distributionActiveTab.replace('_', ' ')} ${t.approvals.statusSuffix}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.approvals.distributionWorkflow}
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t.approvals.distNumber}</TableHead>
                              <TableHead>{t.approvals.structure}</TableHead>
                              <TableHead className="text-right">{t.approvals.totalAmount}</TableHead>
                              <TableHead className="text-right">{t.approvals.lpAmount}</TableHead>
                              <TableHead>{t.approvals.date}</TableHead>
                              <TableHead>{t.approvals.status}</TableHead>
                              <TableHead className="text-right">{t.approvals.actions}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredDistributions.map((distribution) => (
                              <TableRow key={distribution.id}>
                                <TableCell className="font-medium">#{distribution.distributionNumber}</TableCell>
                                <TableCell>
                                  <p className="font-medium">{distribution.structure?.name || 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground">{distribution.structure?.type}</p>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatCurrency(distribution.totalAmount)}
                                </TableCell>
                                <TableCell className="text-right text-green-600">
                                  {formatCurrency(distribution.lpTotalAmount || 0)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(distribution.distributionDate)}
                                </TableCell>
                                <TableCell>
                                  {distribution.approvalStatus === 'pending_cfo' && (
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                      <Clock className="h-3 w-3 mr-1" />{t.approvals.pending}
                                    </Badge>
                                  )}
                                  {distribution.approvalStatus === 'approved' && (
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />{t.approvals.approved}
                                    </Badge>
                                  )}
                                  {distribution.approvalStatus === 'rejected' && (
                                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                                      <XCircle className="h-3 w-3 mr-1" />{t.approvals.rejected}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewDistributionDetails(distribution)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {t.approvals.review}
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
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.approvals.paymentDetails}</DialogTitle>
            <DialogDescription>
              {t.approvals.reviewPaymentDetails}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">{t.approvals.investor}</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t.approvals.structure}</Label>
                  <p className="font-semibold">{selectedPayment.structure?.name || selectedPayment.structureName || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{selectedPayment.structureId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t.approvals.tokens}</Label>
                  <p className="font-semibold text-lg">{selectedPayment.tokens || selectedPayment.ticketsPurchased || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t.approvals.amount}</Label>
                  <p className="font-semibold text-lg">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t.approvals.paymentMethod}</Label>
                  <p className="font-semibold">{selectedPayment.paymentMethod ? getPaymentMethodLabel(selectedPayment.paymentMethod) : 'N/A'}</p>
                </div>
                {selectedPayment.walletAddress && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                    <p className="text-sm font-mono bg-muted p-2 rounded break-all mt-1">
                      {selectedPayment.walletAddress}
                    </p>
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
