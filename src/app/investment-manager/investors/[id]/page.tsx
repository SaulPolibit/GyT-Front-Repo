"use client"

import { use, useState, useEffect } from "react"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from 'sonner'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, User, Users, Building, Briefcase, Mail, Phone, MapPin, Calendar, TrendingUp, TrendingDown, Pencil, Trash2, FileText, Download, Loader2, AlertCircle, Upload, Eye } from "lucide-react"
import type { Investor, CapitalCall, Distribution } from "@/lib/types"
import { getStructures, type Structure } from "@/lib/structures-storage"
import { getCapitalCalls } from "@/lib/capital-calls-storage"
import { getDistributions } from "@/lib/distributions-storage"
import { calculateIRR } from "@/lib/performance-calculations"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { getAuthToken, getAuthState } from "@/lib/auth-storage"
import { InvestorStripeAdmin } from "@/components/investor-stripe-admin"

// Helper function to handle 401 authentication errors
const handleAuthError = (response: Response, errorData: any) => {
  if (response.status === 401) {
    // Check for the specific error message pattern
    if (errorData.error?.includes('Invalid or expired token') ||
        errorData.message?.includes('Please provide a valid authentication token')) {
      // Clear all localStorage data
      localStorage.clear()
      // Redirect to login
      window.location.href = '/sign-in'
      return true
    }
  }
  return false
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InvestorDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  // Check if user is guest
  const authState = getAuthState()
  const currentUserRole = authState.user?.role ?? null
  const isGuest = currentUserRole === 4

  const [investor, setInvestor] = useState<Investor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [structures, setStructures] = useState<Structure[]>([])
  const [capitalCalls, setCapitalCalls] = useState<CapitalCall[]>([])
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [isDownloadingK1, setIsDownloadingK1] = useState(false)
  const [k1Year, setK1Year] = useState(2024)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [showDeleteDocumentDialog, setShowDeleteDocumentDialog] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState({
    documentType: '',
    documentName: '',
    tags: '',
    metadata: '',
    notes: '',
    file: null as File | null,
  })

  // Load investor from API on mount
  useEffect(() => {
    async function fetchInvestor() {
      try {
        setIsLoading(true)
        setError(null)

        // Get authentication token
        const token = getAuthToken()

        if (!token) {
          setError('Authentication required. Please log in.')
          setIsLoading(false)
          return
        }

        const apiUrl = getApiUrl(API_CONFIG.endpoints.getInvestorWithStructures(id))

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 404) {
            setInvestor(null)
            setIsLoading(false)
            return
          }
          const errorData = await response.json()

          // Handle 401 authentication errors
          if (handleAuthError(response, errorData)) {
            return // Exit early as we're redirecting
          }

          setError(errorData.message || 'Failed to fetch investor')
          setIsLoading(false)
          return
        }

        const result = await response.json()

        if (result.success && result.data) {
          // Map API response to expected Investor type
          const apiData = result.data

          // Safely construct name with null checks
          const firstName = apiData.firstName ?? ''
          const lastName = apiData.lastName ?? ''
          const fullName = `${firstName} ${lastName}`.trim()
          const investorName = apiData.name || fullName || apiData.email || 'Unnamed'

          // Safely construct address only if at least one field has a value
          let address = null
          if (apiData.addressLine1 || apiData.city || apiData.state || apiData.postalCode || apiData.country) {
            address = {
              street: apiData.addressLine1 ?? '',
              city: apiData.city ?? '',
              state: apiData.state ?? '',
              zipCode: apiData.postalCode ?? '',
              country: apiData.country ?? ''
            }
          } else if (apiData.address) {
            address = apiData.address
          }

          // Safely map structures to fundOwnerships with null checks
          const structures = apiData.structures || apiData.fundOwnerships || []
          const fundOwnerships = Array.isArray(structures) ? structures.map((struct: any) => {
            if (!struct) return null
            return {
              fundId: struct.structure_id ?? struct.id ?? struct.fundId ?? '',
              fundName: struct.name ?? struct.structure_name ?? struct.fundName ?? 'Unknown Structure',
              fundType: struct.type ?? struct.fundType ?? 'fund',
              commitment: struct.commitment ?? struct.totalCommitment ?? 0,
              investedDate: struct.investedDate ?? struct.createdAt ?? null,
              customTerms: struct.customTerms ?? null,
              hierarchyLevel: struct.hierarchyLevel ?? undefined,
            }
          }).filter(Boolean) : []

          const mappedInvestor = {
            ...apiData,
            // Map name fields
            name: investorName,
            // Map status and type fields with null handling
            status: apiData.kycStatus ?? apiData.status ?? 'Pending',
            type: apiData.investorType ?? 'n/d',
            // Map phone field
            phone: apiData.phoneNumber ?? apiData.phone ?? null,
            // Map date fields
            investorSince: apiData.createdAt ?? apiData.investorSince ?? new Date().toISOString(),
            // Set address
            address: address,
            // Set fundOwnerships
            fundOwnerships: fundOwnerships,
            // Set default values for missing fields
            preferredContactMethod: apiData.preferredContactMethod ?? 'Email',
            lastContactDate: apiData.lastContactDate ?? apiData.lastLogin ?? null,
            k1Status: apiData.k1Status ?? 'Not Started',
            k1DeliveryDate: apiData.k1DeliveryDate ?? null,
            documents: Array.isArray(apiData.documents) ? apiData.documents : [],
            notes: apiData.notes ?? apiData.investmentPreferences ?? null,
            taxId: apiData.taxId ?? null,
          }
          setInvestor(mappedInvestor)
        } else {
          setError('Invalid response format from API')
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching investor:', err)
        setError('Failed to load investor')
        setIsLoading(false)
      }
    }

    fetchInvestor()
  }, [id])

  // Load structures, capital calls, and distributions from localStorage
  useEffect(() => {
    const storedStructures = getStructures()
    const storedCapitalCalls = getCapitalCalls()
    const storedDistributions = getDistributions()
    setStructures(storedStructures)
    setCapitalCalls(storedCapitalCalls)
    setDistributions(storedDistributions)
  }, [])

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setIsLoadingDocuments(true)
      const token = getAuthToken()

      if (!token) {
        console.error('No authentication token found')
        setIsLoadingDocuments(false)
        return
      }

      const documentsUrl = getApiUrl(API_CONFIG.endpoints.getEntityDocuments('Investor', id))
      const response = await fetch(documentsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Handle 401 authentication errors
        if (handleAuthError(response, errorData)) {
          return // Exit early as we're redirecting
        }

        console.error('Failed to fetch documents:', response.status)
        setIsLoadingDocuments(false)
        return
      }

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        setDocuments(result.data)
      } else {
        setDocuments([])
      }

      setIsLoadingDocuments(false)
    } catch (error) {
      console.error('Error fetching documents:', error)
      setIsLoadingDocuments(false)
    }
  }

  // Load documents when investor is loaded
  useEffect(() => {
    if (investor) {
      fetchDocuments()
    }
  }, [investor?.id])

  // Show loading state while fetching investor
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading investor...</h3>
            <p className="text-muted-foreground">Please wait while we fetch the data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Investor</h3>
            <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Only call notFound() after we've checked the API
  if (!investor) {
    notFound()
  }

  // Use the mapped investor name (already constructed during API mapping)
  const investorName = investor.name || 'Unnamed Investor'

  const handleDownloadK1 = async (year: number) => {
    try {
      setIsDownloadingK1(true)
      const response = await fetch(`/api/investors/${id}/k1/${year}`)
      if (!response.ok) throw new Error('Failed to download K-1')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `K1-${year}-${investorName.replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading K-1:', error)
      toast.error('Failed to download K-1. Please try again.')
    } finally {
      setIsDownloadingK1(false)
    }
  }

  const handleEdit = () => {
    router.push(`/investment-manager/investors/${id}/edit`)
  }

  const confirmDelete = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required. Please log in.')
        return
      }

      const deleteUrl = getApiUrl(API_CONFIG.endpoints.deleteInvestor(id))
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle 401 authentication errors
        if (handleAuthError(response, errorData)) {
          return // Exit early as we're redirecting
        }

        throw new Error(errorData.message || 'Failed to delete investor')
      }

      toast.success('Investor deleted successfully')
      // router.push('/investment-manager/investors')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete investor. Please try again.')
    }
  }

  const handleUploadDocument = async () => {
    try {
      // Validate required fields
      if (!uploadForm.file) {
        toast.error('Please select a file to upload')
        return
      }
      if (!uploadForm.documentType) {
        toast.error('Please select a document type')
        return
      }
      if (!uploadForm.documentName) {
        toast.error('Please enter a document name')
        return
      }

      setIsUploading(true)

      // Get authentication token
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required. Please log in.')
        setIsUploading(false)
        return
      }

      // Create FormData
      const formData = new FormData()
      formData.append('entityType', 'Investor')
      formData.append('entityId', id)
      formData.append('documentType', uploadForm.documentType)
      formData.append('documentName', uploadForm.documentName)
      formData.append('tags', uploadForm.tags)
      formData.append('metadata', uploadForm.metadata)
      formData.append('notes', uploadForm.notes)
      formData.append('file', uploadForm.file)

      // Upload document
      const uploadUrl = getApiUrl(API_CONFIG.endpoints.uploadDocument)
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type header - browser will set it with boundary for FormData
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle 401 authentication errors
        if (handleAuthError(response, errorData)) {
          return // Exit early as we're redirecting
        }

        throw new Error(errorData.message || 'Failed to upload document')
      }

      await response.json()

      toast.success('Document uploaded successfully')

      // Reset form
      setUploadForm({
        documentType: '',
        documentName: '',
        tags: '',
        metadata: '',
        notes: '',
        file: null,
      })

      // Close dialog
      setShowUploadDialog(false)

      // Refresh documents list
      await fetchDocuments()

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required. Please log in.')
        return
      }

      const deleteUrl = getApiUrl(API_CONFIG.endpoints.deleteDocument(documentId))
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle 401 authentication errors
        if (handleAuthError(response, errorData)) {
          return // Exit early as we're redirecting
        }

        throw new Error(errorData.message || 'Failed to delete document')
      }

      toast.success('Document deleted successfully')

      // Close dialog
      setShowDeleteDocumentDialog(false)
      setSelectedDocumentId(null)

      // Refresh documents list
      await fetchDocuments()

    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete document')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Individual': return <User className="h-5 w-5" />
      case 'Institution': return <Building className="h-5 w-5" />
      case 'Family Office': return <Users className="h-5 w-5" />
      case 'Fund of Funds': return <Briefcase className="h-5 w-5" />
      default: return null
    }
  }

  const formatStatus = (status: string): string => {
    if (!status) return 'Pending'
    const normalized = status.toLowerCase()

    // KYC/Onboarding statuses
    if (normalized === 'not started') return 'Not Started'
    if (normalized === 'in progress') return 'In Progress'
    if (normalized === 'completed') return 'Completed'
    if (normalized === 'approved') return 'Approved'
    if (normalized === 'rejected') return 'Rejected'

    // Standard statuses
    if (normalized === 'kyc/kyb') return 'KYC/KYB'
    if (normalized === 'pending') return 'Pending'
    if (normalized === 'contracts') return 'Contracts'
    if (normalized === 'commitment') return 'Commitment'
    if (normalized === 'active') return 'Active'
    if (normalized === 'inactive') return 'Inactive'

    return status
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = formatStatus(status)
    switch (normalizedStatus) {
      // KYC/Onboarding statuses
      case 'Not Started': return 'secondary'
      case 'In Progress': return 'outline'
      case 'Completed': return 'default'
      case 'Approved': return 'default'
      case 'Rejected': return 'destructive'

      // Standard statuses
      case 'Pending': return 'outline'
      case 'KYC/KYB': return 'outline'
      case 'Contracts': return 'outline'
      case 'Commitment': return 'outline'
      case 'Active': return 'default'
      case 'Inactive': return 'secondary'

      default: return 'secondary'
    }
  }

  const getK1StatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'default'
      case 'Completed': return 'default'
      case 'In Progress': return 'outline'
      case 'Not Started': return 'secondary'
      case 'Amended': return 'outline'
      default: return 'secondary'
    }
  }

  // Calculate actual called capital from capital call transactions
  const calculateCalledCapital = (fundId: string): number => {
    const fundCapitalCalls = capitalCalls.filter(cc =>
      cc.fundId === fundId &&
      cc.status !== 'Draft' &&
      cc.status !== 'Cancelled'
    )

    return fundCapitalCalls.reduce((sum, cc) => {
      const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
      return sum + (allocation?.amountPaid || 0)
    }, 0)
  }

  // Create a map of fundId to actual called capital for all structures
  const calledCapitalMap = new Map<string, number>()
  investor.fundOwnerships?.forEach(ownership => {
    calledCapitalMap.set(ownership.fundId, calculateCalledCapital(ownership.fundId))
  })

  // Calculate ownership % for each structure (called capital / total fund size)
  const ownershipPercentMap = new Map<string, number>()
  investor.fundOwnerships?.forEach(ownership => {
    const structure = structures.find(s => s.id === ownership.fundId)
    const calledCapital = calledCapitalMap.get(ownership.fundId) || 0
    const ownershipPercent = structure && structure.totalCommitment > 0
      ? (calledCapital / structure.totalCommitment) * 100
      : 0
    ownershipPercentMap.set(ownership.fundId, ownershipPercent)
  })

  // Calculate current value for each structure (NAV * ownership %)
  const currentValueMap = new Map<string, number>()
  investor.fundOwnerships?.forEach(ownership => {
    const structure = structures.find(s => s.id === ownership.fundId)
    const ownershipPercent = ownershipPercentMap.get(ownership.fundId) || 0
    const baseValue = structure ? (structure.currentNav ?? structure.totalCommitment) : 0
    const currentValue = baseValue * (ownershipPercent / 100)
    currentValueMap.set(ownership.fundId, currentValue)
  })

  // Calculate unrealized gain for each structure (current value - called capital)
  const unrealizedGainMap = new Map<string, number>()
  investor.fundOwnerships?.forEach(ownership => {
    const currentValue = currentValueMap.get(ownership.fundId) || 0
    const calledCapital = calledCapitalMap.get(ownership.fundId) || 0
    const unrealizedGain = currentValue - calledCapital
    unrealizedGainMap.set(ownership.fundId, unrealizedGain)
  })

  // Calculate total distributed from distribution transactions (fallback)
  const calculatedTotalDistributed = distributions
    .filter(dist => dist.status === 'Completed')
    .reduce((sum, dist) => {
      const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
      return sum + (allocation?.finalAllocation || 0)
    }, 0)

  // Calculate total portfolio metrics using API data first, then fallback to calculated values
  const totalCommitment = (investor as any).totalCommitment ??
                         (investor as any).commitment ??
                         (investor.fundOwnerships?.reduce((sum, fo) => sum + fo.commitment, 0) || 0)

  const totalCalledCapital = (investor as any).totalContributed ??
                            (investor as any).contributed ??
                            (Array.from(calledCapitalMap.values()).reduce((sum, called) => sum + called, 0))

  const totalDistributed = (investor as any).totalDistributed ??
                          (investor as any).distributed ??
                          calculatedTotalDistributed

  const totalUncalledCapital = totalCommitment - totalCalledCapital
  const totalCurrentValue = Array.from(currentValueMap.values()).reduce((sum, value) => sum + value, 0)
  const totalUnrealizedGain = Array.from(unrealizedGainMap.values()).reduce((sum, gain) => sum + gain, 0)

  // Calculate IRR from cash flows
  const calculateInvestorIRR = (): number => {
    const cashFlows: { date: Date; amount: number }[] = []

    // Add capital calls as negative cash flows
    capitalCalls
      .filter(cc => cc.status !== 'Draft' && cc.status !== 'Cancelled')
      .forEach(cc => {
        const allocation = cc.investorAllocations.find(alloc => alloc.investorId === investor.id)
        if (allocation && allocation.amountPaid > 0) {
          cashFlows.push({
            date: new Date(cc.callDate),
            amount: -allocation.amountPaid, // Negative = money out
          })
        }
      })

    // Add distributions as positive cash flows
    distributions
      .filter(dist => dist.status === 'Completed')
      .forEach(dist => {
        const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investor.id)
        if (allocation && allocation.finalAllocation > 0) {
          cashFlows.push({
            date: new Date(dist.distributionDate),
            amount: allocation.finalAllocation, // Positive = money in
          })
        }
      })

    // Add current value as final positive cash flow at today's date
    // Only add if there's unrealized value (current value > total distributed)
    const unrealizedValue = totalCurrentValue - totalDistributed
    if (unrealizedValue > 0) {
      cashFlows.push({
        date: new Date(),
        amount: unrealizedValue, // Unrealized portfolio value only
      })
    }

    // Need at least 2 cash flows and must have both negative and positive
    if (cashFlows.length < 2) return 0

    const hasNegative = cashFlows.some(cf => cf.amount < 0)
    const hasPositive = cashFlows.some(cf => cf.amount > 0)
    if (!hasNegative || !hasPositive) return 0

    try {
      const irr = calculateIRR(cashFlows)
      // Sanity check: IRR shouldn't be astronomical
      if (Math.abs(irr) > 1000) return 0
      return irr
    } catch (error) {
      console.error('IRR calculation error:', error)
      return 0
    }
  }

  const investorIRR = calculateInvestorIRR()

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/investment-manager/investors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{investorName}</h1>
              <Badge variant={getStatusColor(investor.status)}>
                {formatStatus(investor.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                {getTypeIcon(investor.type)}
                <span>{String(investor.type || 'N/A')}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Investor since {formatDate(investor.investorSince)}
              </div>
            </div>
          </div>
        </div>
        {!isGuest && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Portfolio Overview - Aggregated Totals */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Commitment</div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalCommitment)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Called</div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalCalledCapital)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Uncalled</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalUncalledCapital)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Structures</div>
              <div className="text-2xl font-bold">
                {investor.fundOwnerships?.length || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unrealized Gain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalUnrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalUnrealizedGain)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Structure Allocations */}
      {investor.fundOwnerships && Array.isArray(investor.fundOwnerships) && investor.fundOwnerships.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Structure Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investor.fundOwnerships.map((ownership, index) => {
                if (!ownership) return null

                // Get actual calculated values from maps
                const actualCalledCapital = calledCapitalMap.get(ownership.fundId) || 0
                const actualUncalledCapital = ownership.commitment - actualCalledCapital
                const actualOwnershipPercent = ownershipPercentMap.get(ownership.fundId) || 0
                const calledPercentage = ownership.commitment > 0
                  ? (actualCalledCapital / ownership.commitment) * 100
                  : 0

                return (
                <div key={`${ownership.fundId}-${index}`} className="p-4 border rounded bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-lg">{ownership.fundName}</div>
                    <Badge variant="default" className="text-base px-3 py-1">
                      {actualOwnershipPercent.toFixed(2)}%
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Commitment</div>
                      <div className="font-semibold">{formatCurrency(ownership.commitment)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Called</div>
                      <div className="font-semibold">{formatCurrency(actualCalledCapital)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Uncalled</div>
                      <div className="font-semibold">{formatCurrency(actualUncalledCapital)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Called %</div>
                      <div className="font-semibold">
                        {calledPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {(() => {
                    // Safety check: ensure structures is an array
                    if (!structures || !Array.isArray(structures)) {
                      return null
                    }

                    // Find the structure to get its default terms
                    const structure = structures.find(s => s.id === ownership.fundId)
                    if (!structure) return null

                    // Get custom terms for THIS structure specifically
                    // Prefer per-structure customTerms, fall back to global customTerms (deprecated)
                    const structureSpecificTerms = ownership.customTerms || investor.customTerms

                    // DEBUG LOGGING
                    console.log('=== Economic Terms Comparison ===')
                    console.log('Structure:', structure.name, '(ID:', structure.id, ')')
                    console.log('Structure defaults:', {
                      managementFee: structure.managementFee,
                      performanceFee: structure.performanceFee,
                      hurdleRate: structure.hurdleRate,
                      preferredReturn: structure.preferredReturn
                    })
                    console.log('Ownership-specific custom terms:', ownership.customTerms)
                    console.log('Global custom terms (deprecated):', investor.customTerms)
                    console.log('Using terms:', structureSpecificTerms)

                    // Only show as "custom" if THIS STRUCTURE has custom terms that differ from defaults
                    // Use Number() to handle string/number comparison
                    const mgmtFeeCheck = structureSpecificTerms?.managementFee !== undefined && Number(structureSpecificTerms.managementFee) !== Number(structure.managementFee)
                    const perfFeeCheck = structureSpecificTerms?.performanceFee !== undefined && Number(structureSpecificTerms.performanceFee) !== Number(structure.performanceFee)
                    const hurdleCheck = structureSpecificTerms?.hurdleRate !== undefined && Number(structureSpecificTerms.hurdleRate) !== Number(structure.hurdleRate)
                    const prefReturnCheck = structureSpecificTerms?.preferredReturn !== undefined && Number(structureSpecificTerms.preferredReturn) !== Number(structure.preferredReturn)

                    console.log('Comparison results:')
                    console.log('  - Management Fee differs:', mgmtFeeCheck, `(${Number(structureSpecificTerms?.managementFee)} vs ${Number(structure.managementFee)})`)
                    console.log('  - Performance Fee differs:', perfFeeCheck, `(${Number(structureSpecificTerms?.performanceFee)} vs ${Number(structure.performanceFee)})`)
                    console.log('  - Hurdle Rate differs:', hurdleCheck, `(${Number(structureSpecificTerms?.hurdleRate)} vs ${Number(structure.hurdleRate)})`)
                    console.log('  - Preferred Return differs:', prefReturnCheck, `(${Number(structureSpecificTerms?.preferredReturn)} vs ${Number(structure.preferredReturn)})`)

                    const hasCustomTermsForThisStructure = structureSpecificTerms && (
                      mgmtFeeCheck || perfFeeCheck || hurdleCheck || prefReturnCheck
                    )

                    console.log('Has custom terms for this structure:', hasCustomTermsForThisStructure)
                    console.log('===================================\n')

                    // Determine which terms to show: custom terms override structure defaults
                    const effectiveTerms = {
                      managementFee: structureSpecificTerms?.managementFee ?? structure.managementFee,
                      performanceFee: structureSpecificTerms?.performanceFee ?? structure.performanceFee,
                      hurdleRate: structureSpecificTerms?.hurdleRate ?? structure.hurdleRate,
                      preferredReturn: structureSpecificTerms?.preferredReturn ?? structure.preferredReturn
                    }

                    return (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium">Economic Terms</div>
                            {hasCustomTermsForThisStructure && (
                              <Badge variant="secondary" className="text-xs">
                                Custom Terms Applied
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {effectiveTerms.managementFee !== undefined && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Management Fee</div>
                                <div className="font-semibold text-primary">{effectiveTerms.managementFee}%</div>
                              </div>
                            )}
                            {effectiveTerms.performanceFee !== undefined && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Performance Fee</div>
                                <div className="font-semibold text-primary">{effectiveTerms.performanceFee}%</div>
                              </div>
                            )}
                            {effectiveTerms.hurdleRate !== undefined && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Hurdle Rate</div>
                                <div className="font-semibold text-primary">{effectiveTerms.hurdleRate}%</div>
                              </div>
                            )}
                            {effectiveTerms.preferredReturn !== undefined && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Preferred Return</div>
                                <div className="font-semibold text-primary">{effectiveTerms.preferredReturn}%</div>
                              </div>
                            )}
                          </div>
                          {hasCustomTermsForThisStructure && (
                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-900 dark:text-blue-100">
                              Custom terms override this structure's defaults for this investor
                            </div>
                          )}
                          {!hasCustomTermsForThisStructure && (
                            <div className="mt-3 text-xs text-muted-foreground">
                              Using structure's default economic terms
                            </div>
                          )}
                        </div>
                      </>
                    )
                  })()}
                  {ownership.hierarchyLevel !== undefined && (
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="outline">Level {ownership.hierarchyLevel}</Badge>
                      {ownership.investedDate && (
                        <span className="text-xs text-muted-foreground">
                          Since {formatDate(ownership.investedDate)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Investor ID</div>
                <div className="font-medium">{String(investor.id)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Type</div>
                <div className="flex items-center gap-2">
                  {getTypeIcon(investor.type)}
                  <span className="font-medium">{String(investor.type || 'N/A')}</span>
                </div>
              </div>
            </div>
            <Separator />
            {investor.type !== 'individual' && investor.contactFirstName && investor.contactLastName && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Contact Person</div>
                <div className="font-medium">{String(investor.contactFirstName)} {String(investor.contactLastName)}</div>
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{String(investor.email || '')}</div>
                </div>
              </div>
              {investor.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{String(investor.phone)}</div>
                  </div>
                </div>
              )}
              {investor.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="font-medium space-y-1">
                      {investor.address.street && <div>{String(investor.address.street)}</div>}
                      {(investor.address.city || investor.address.state || investor.address.zipCode) && (
                        <div>
                          {investor.address.city && String(investor.address.city)}
                          {investor.address.city && investor.address.state && ', '}
                          {investor.address.state && String(investor.address.state)}
                          {investor.address.state && investor.address.zipCode && ' '}
                          {investor.address.zipCode && String(investor.address.zipCode)}
                        </div>
                      )}
                      {investor.address.country && <div>{String(investor.address.country)}</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Preferred Contact</div>
                <div className="font-medium">{String(investor.preferredContactMethod || 'Email')}</div>
              </div>
              {investor.lastContactDate && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Last Contact</div>
                  <div className="font-medium">{formatDate(investor.lastContactDate)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary - Aggregated */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Commitment</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(totalCommitment)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Called</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(totalCalledCapital)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Uncalled</div>
                <div className="text-lg font-semibold text-blue-600">
                  {formatCurrency(totalUncalledCapital)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Distributed</div>
                <div className="text-lg font-semibold text-green-600">{formatCurrency(totalDistributed)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Current Value</div>
                <div className="text-lg font-semibold">{formatCurrency(totalCurrentValue)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Net Cash Flow</div>
                <div className={`text-lg font-semibold ${(totalDistributed - totalCalledCapital) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalDistributed - totalCalledCapital)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Unrealized Gain</div>
                <div className={`text-lg font-semibold ${totalUnrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalUnrealizedGain)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">IRR</div>
                <div className={`text-lg font-semibold ${investorIRR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(investorIRR)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Connect Account */}
        <InvestorStripeAdmin
          investorId={investor.id}
          investorEmail={investor.email || ''}
          investorName={investor.name || ''}
          stripeAccountId={investor.stripeAccountId}
          stripeOnboardingComplete={investor.stripeOnboardingComplete}
          stripeAccountStatus={investor.stripeAccountStatus}
        />

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tax Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadK1(k1Year)}
                disabled={isDownloadingK1 || investor.k1Status !== 'Delivered'}
              >
                {isDownloadingK1 ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download K-1
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {investor.taxId && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Tax ID</div>
                  <div className="font-medium">{String(investor.taxId)}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground mb-1">K-1 Status</div>
                <Badge variant={getK1StatusColor(investor.k1Status)}>
                  {String(investor.k1Status || 'Not Started')}
                </Badge>
              </div>
              {investor.k1DeliveryDate && (
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground mb-1">K-1 Delivery Date</div>
                  <div className="font-medium">{formatDate(investor.k1DeliveryDate)}</div>
                </div>
              )}
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
              {investor.k1Status === 'Delivered' ? (
                `Download Schedule K-1 (Form 1065) for tax year ${k1Year}. This form reports your share of the partnership's income, deductions, and credits.`
              ) : (
                'K-1 form will be available for download once it has been generated and delivered.'
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Notes */}
      {investor.notes && typeof investor.notes !== 'object' && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{String(investor.notes)}</p>
          </CardContent>
        </Card>
      )}
      {investor.notes && typeof investor.notes === 'object' && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(investor.notes, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documents</CardTitle>
            {!isGuest && (
              <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingDocuments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="font-medium">{doc.documentName || doc.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {doc.documentType || doc.type}
                      {doc.createdAt && ` • Uploaded ${formatDate(doc.createdAt)}`}
                      {doc.uploadedBy && ` by ${doc.uploadedBy}`}
                    </div>
                    {doc.tags && (
                      <div className="flex gap-1 mt-1">
                        {(typeof doc.tags === 'string' ? doc.tags.split(',') : doc.tags).map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {doc.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {doc.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (doc.filePath) {
                          window.open(doc.filePath, '_blank')
                        } else {
                          toast.error('Document file path not available')
                        }
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!isGuest && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDocumentId(doc.id)
                          setShowDeleteDocumentDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm mt-1">Click "Upload Document" to add files</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for {investorName}. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setUploadForm({ ...uploadForm, file })
                  // Auto-fill document name from filename if empty
                  if (file && !uploadForm.documentName) {
                    setUploadForm({ ...uploadForm, file, documentName: file.name })
                  }
                }}
                disabled={isUploading}
              />
              {uploadForm.file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadForm.file.name} ({(uploadForm.file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select
                value={uploadForm.documentType}
                onValueChange={(value) => setUploadForm({ ...uploadForm, documentType: value })}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ID">ID Document</SelectItem>
                  <SelectItem value="Proof of Address">Proof of Address</SelectItem>
                  <SelectItem value="Tax Document">Tax Document</SelectItem>
                  <SelectItem value="Bank Statement">Bank Statement</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Agreement">Agreement</SelectItem>
                  <SelectItem value="Subscription Document">Subscription Document</SelectItem>
                  <SelectItem value="KYC Document">KYC Document</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Document Name */}
            <div className="space-y-2">
              <Label htmlFor="documentName">Document Name *</Label>
              <Input
                id="documentName"
                placeholder="e.g., Passport Copy, Utility Bill, etc."
                value={uploadForm.documentName}
                onChange={(e) => setUploadForm({ ...uploadForm, documentName: e.target.value })}
                disabled={isUploading}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                placeholder="e.g., urgent, verified, reviewed (comma-separated)"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Metadata */}
            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata (Optional)</Label>
              <Input
                id="metadata"
                placeholder="Additional metadata as JSON string"
                value={uploadForm.metadata}
                onChange={(e) => setUploadForm({ ...uploadForm, metadata: e.target.value })}
                disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground">
                Optional: JSON format metadata
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this document..."
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                disabled={isUploading}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false)
                // Reset form when closing
                setUploadForm({
                  documentType: '',
                  documentName: '',
                  tags: '',
                  metadata: '',
                  notes: '',
                  file: null,
                })
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadDocument} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this investor? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={showDeleteDocumentDialog} onOpenChange={setShowDeleteDocumentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDocumentId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedDocumentId && handleDeleteDocument(selectedDocumentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
