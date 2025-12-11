"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from 'sonner'
import { deleteInvestment } from "@/lib/investments-storage"
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
import { ArrowLeft, MapPin, Building2, TrendingUp, TrendingDown, DollarSign, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react"
import type { Investment } from "@/lib/types"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { getAuthToken } from "@/lib/auth-storage"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InvestmentDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [investment, setInvestment] = useState<Investment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Load investment from API on mount
  useEffect(() => {
    async function fetchInvestment() {
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

        const apiUrl = getApiUrl(API_CONFIG.endpoints.getSingleInvestment(id))

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.message || 'Failed to fetch investment')
          setIsLoading(false)
          return
        }

        const result = await response.json()

        if (result.success && result.data) {
          setInvestment(result.data)
        } else {
          setError('Investment not found')
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching investment:', err)
        setError('Failed to load investment data')
        setIsLoading(false)
      }
    }

    fetchInvestment()
  }, [id])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading investment details...</p>
      </div>
    )
  }

  // Show error state
  if (error || !investment) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Investment</h3>
            <p className="text-muted-foreground mb-4 max-w-md">{error || 'Investment not found'}</p>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/investment-manager/investments')} variant="outline">
                Back to Investments
              </Button>
              <Button onClick={() => window.location.reload()} variant="default">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleEdit = () => {
    router.push(`/investment-manager/investments/${id}/edit`)
  }

  const confirmDelete = () => {
    try {
      deleteInvestment(id)
      toast.success('Investment deleted successfully')
      router.push('/investment-manager/investments')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete investment. Please try again.')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default'
      case 'Closed': return 'secondary'
      case 'Pending': return 'outline'
      default: return 'secondary'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Real Estate': return <Building2 className="h-5 w-5" />
      case 'Private Equity': return <TrendingUp className="h-5 w-5" />
      case 'Private Debt': return <DollarSign className="h-5 w-5" />
      default: return null
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/investment-manager/investments">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{investment.name}</h1>
              <Badge variant={getStatusColor(investment.status)}>
                {investment.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                {getTypeIcon(investment.type)}
                <span>{investment.type}</span>
              </div>
              <span>•</span>
              <span>{investment.sector}</span>
              {investment.geography && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {investment.geography.city}, {investment.geography.state}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(investment.totalFundPosition?.currentValue || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(investment.totalFundPosition?.totalInvested || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unrealized Gain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(investment.totalFundPosition?.unrealizedGain || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(investment.totalFundPosition?.unrealizedGain || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${(investment.totalFundPosition?.irr || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(investment.totalFundPosition?.irr || 0) >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {formatPercent(investment.totalFundPosition?.irr)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Investment ID</div>
                <div className="font-medium">{investment.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Fund</div>
                <div className="font-medium">{investment.fundId}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Investment Type</div>
                <div className="font-medium">
                  <Badge variant="outline">{investment.investmentType}</Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Ownership Percentage</div>
                <div className="font-medium">{investment.ownershipPercentage ? investment.ownershipPercentage.toFixed(2) : '0.00'}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Multiple</div>
                <div className={`font-medium ${(investment.totalFundPosition?.multiple || 0) >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {(investment.totalFundPosition?.multiple || 0).toFixed(2)}x
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Investment Size</div>
                <div className="font-medium">{formatCurrency(investment.totalInvestmentSize || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Fund Commitment</div>
                <div className="font-medium">{formatCurrency(investment.fundCommitment || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Acquisition Date</div>
                <div className="font-medium">{formatDate(investment.acquisitionDate)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Last Valuation</div>
                <div className="font-medium">{formatDate(investment.lastValuationDate)}</div>
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground mb-2">Description</div>
              <p className="text-sm leading-relaxed">{investment.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        {investment.address && (
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Address</div>
                <div className="space-y-1">
                  <div className="font-medium">{investment.address.street}</div>
                  <div className="text-sm">
                    {investment.address.city}, {investment.address.state} {investment.address.zipCode}
                  </div>
                  <div className="text-sm">{investment.address.country}</div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Country</div>
                  <div className="font-medium">{investment.geography.country}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">State</div>
                  <div className="font-medium">{investment.geography.state}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">City</div>
                  <div className="font-medium">{investment.geography.city}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Fund Position Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Invested</div>
                <div className="text-lg font-semibold">{formatCurrency(investment.totalFundPosition?.totalInvested || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Current Value</div>
                <div className="text-lg font-semibold">{formatCurrency(investment.totalFundPosition?.currentValue || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Unrealized Gain</div>
                <div className={`text-lg font-semibold ${(investment.totalFundPosition?.unrealizedGain || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(investment.totalFundPosition?.unrealizedGain || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Gain %</div>
                <div className={`text-lg font-semibold ${(investment.totalFundPosition?.unrealizedGain || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(investment.totalFundPosition?.totalInvested ? ((investment.totalFundPosition?.unrealizedGain || 0) / investment.totalFundPosition.totalInvested) * 100 : 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">IRR</div>
                <div className={`text-lg font-semibold ${(investment.totalFundPosition?.irr || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(investment.totalFundPosition?.irr)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Multiple (MOIC)</div>
                <div className={`text-lg font-semibold ${(investment.totalFundPosition?.multiple || 0) >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {(investment.totalFundPosition?.multiple || 0).toFixed(2)}x
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fund Equity Position */}
        {investment.fundEquityPosition && (
          <Card>
            <CardHeader>
              <CardTitle>Fund Equity Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Ownership %</div>
                  <div className="text-lg font-semibold">{investment.fundEquityPosition.ownershipPercent}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Equity Invested</div>
                  <div className="text-lg font-semibold">{formatCurrency(investment.fundEquityPosition.equityInvested)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current Value</div>
                  <div className="text-lg font-semibold text-green-600">{formatCurrency(investment.fundEquityPosition.currentEquityValue)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Unrealized Gain</div>
                  <div className={`text-lg font-semibold ${investment.fundEquityPosition.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(investment.fundEquityPosition.unrealizedGain)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fund Debt Position */}
        {investment.fundDebtPosition && (
          <Card>
            <CardHeader>
              <CardTitle>Fund Debt Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Principal Provided</div>
                  <div className="text-lg font-semibold">{formatCurrency(investment.fundDebtPosition.principalProvided)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Interest Rate</div>
                  <div className="text-lg font-semibold">{investment.fundDebtPosition.interestRate}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Accrued Interest</div>
                  <div className="text-lg font-semibold text-green-600">{formatCurrency(investment.fundDebtPosition.accruedInterest)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current Value</div>
                  <div className="text-lg font-semibold text-green-600">{formatCurrency(investment.fundDebtPosition.currentDebtValue)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Origination</div>
                  <div className="text-sm font-medium">{formatDate(investment.fundDebtPosition.originationDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Maturity</div>
                  <div className="text-sm font-medium">{formatDate(investment.fundDebtPosition.maturityDate)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* External Debt - REMOVED: Polibit does not support external debt yet */}
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documents</CardTitle>
            <Button variant="outline" size="sm">
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {investment.documents && investment.documents.length > 0 ? (
            <div className="space-y-2">
              {investment.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                  <div>
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {doc.type} • Uploaded {formatDate(doc.uploadedDate)} by {doc.uploadedBy}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Download</Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No documents uploaded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this investment? This action cannot be undone.
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
    </div>
  )
}
