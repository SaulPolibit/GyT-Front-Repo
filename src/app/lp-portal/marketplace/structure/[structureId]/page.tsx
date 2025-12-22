"use client"

import * as React from "react"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Landmark,
  FileText,
  AlertCircle,
  ExternalLink,
  Download,
} from "lucide-react"
import type { Structure } from "@/lib/structures-storage"
import { getAuthToken } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { useAuth } from "@/hooks/useAuth"
import { useBreadcrumb } from "@/contexts/lp-breadcrumb-context"

interface Props {
  params: Promise<{ structureId: string }>
}

interface Document {
  id: string
  entityType: string
  entityId: string
  documentType: string
  documentName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  version: number
  isActive: boolean
  tags: string[]
  metadata: Record<string, any>
  notes: string
  userId: string
  createdAt: string
  updatedAt: string
}

export default function MarketplaceStructureDetailPage({ params }: Props) {
  const { structureId } = use(params)
  const { user } = useAuth()
  const { setCustomBreadcrumb, clearCustomBreadcrumb } = useBreadcrumb()
  const [structure, setStructure] = React.useState<Structure | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [documents, setDocuments] = React.useState<Document[]>([])
  const [documentsLoading, setDocumentsLoading] = React.useState(false)
  const [documentsError, setDocumentsError] = React.useState<string | null>(null)

  // Check if user can buy (KYC approved AND token deployed)
  const canBuy = user?.kycStatus === 'Approved' &&
                 structure?.smartContract?.deploymentResponse?.deployment?.tokenAddress &&
                 structure.smartContract.deploymentResponse.deployment.tokenAddress.trim() !== ''

  // Hide the structure ID in the breadcrumb
  React.useEffect(() => {
    setCustomBreadcrumb(`/lp-portal/marketplace/structure/${structureId}`, ' ')
    return () => clearCustomBreadcrumb(`/lp-portal/marketplace/structure/${structureId}`)
  }, [structureId, setCustomBreadcrumb, clearCustomBreadcrumb])

  React.useEffect(() => {
    const fetchStructure = async () => {
      setLoading(true)
      setError(null)

      try {
        const token = getAuthToken()

        if (!token) {
          setError('No authentication token found')
          setLoading(false)
          return
        }

        const response = await fetch(getApiUrl(API_CONFIG.endpoints.getSingleStructure(structureId)), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch structure: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('[Structure Detail] API Response:', data)

        // Map API fields to existing structure format
        const mappedStructure = {
          ...data.data,
          currency: data.data.baseCurrency,
          jurisdiction: data.data.taxJurisdiction,
          fundTerm: data.data.finalDate,
        }

        setStructure(mappedStructure)
      } catch (err) {
        console.error('[Structure Detail] Error fetching structure:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch structure')
        setStructure(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStructure()
  }, [structureId, refreshKey])

  // Fetch documents for this structure
  React.useEffect(() => {
    const fetchDocuments = async () => {
      setDocumentsLoading(true)
      setDocumentsError(null)

      try {
        const token = getAuthToken()

        if (!token) {
          setDocumentsError('No authentication token found')
          setDocumentsLoading(false)
          return
        }

        const response = await fetch(getApiUrl(API_CONFIG.endpoints.getStructureDocuments(structureId)), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch documents: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('[Structure Documents] API Response:', data)

        setDocuments(data.data || [])
      } catch (err) {
        console.error('[Structure Documents] Error fetching documents:', err)
        setDocumentsError(err instanceof Error ? err.message : 'Failed to fetch documents')
      } finally {
        setDocumentsLoading(false)
      }
    }

    fetchDocuments()
  }, [structureId])

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatDate = (dateString: string | Date | undefined) => {
    try {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return String(dateString)
    }
  }

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'fundraising':
        return 'secondary'
      case 'closed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" asChild>
          <a href="/lp-portal/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </a>
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading structure details...</p>
        </div>
      </div>
    )
  }

  if (!structure) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" asChild>
          <a href="/lp-portal/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </a>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold mb-2">
              {error ? 'Error loading structure' : 'Structure not found'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {error || "The fund structure you're looking for doesn't exist or has been removed."}
            </p>
            {error && (
              <Button onClick={() => setRefreshKey(prev => prev + 1)}>Try Again</Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Back Button and Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <a href="/lp-portal/marketplace">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </a>
          </Button>
          <div className="flex gap-2">
            {canBuy ? (
              <Button asChild>
                <a href={`/lp-portal/marketplace/structure/${structureId}/checkout`}>
                  Buy
                </a>
              </Button>
            ) : (
              <Button disabled title="KYC approval required to buy">
                Buy
              </Button>
            )}
          </div>
        </div>
        {!canBuy && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">KYC Approval Required</p>
                <p className="text-sm text-amber-800">
                  Tokens not available or you need to complete and have your KYC approved before you can purchase tokens.
                  {user?.kycStatus === null && ' Please complete your KYC verification.'}
                  {user?.kycStatus && user.kycStatus !== 'Approved' && ` Current status: ${user.kycStatus}`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{structure.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-2">
              <Building2 className="h-4 w-4" />
              {structure.type} - {structure.jurisdiction}
            </p>
          </div>
        </div>
        <Badge variant={getStatusBadgeVariant(structure.status)} className="text-base px-3 py-1">
          {structure.status}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Structure Type</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{structure.type}</div>
            <p className="text-xs text-muted-foreground">{structure.subtype || 'Standard'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commitment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(structure.totalCommitment)}</div>
            <p className="text-xs text-muted-foreground">{structure.currency}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jurisdiction</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{structure.jurisdiction}</div>
            <p className="text-xs text-muted-foreground">Registration</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="terms">Offering Terms</TabsTrigger>
          <TabsTrigger value="tokens">Token Info</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Structure Overview</CardTitle>
              <CardDescription>General information about this fund structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fund Name</p>
                  <p className="text-sm font-semibold">{structure.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Structure Type</p>
                  <p className="text-sm font-semibold capitalize">{structure.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge variant={getStatusBadgeVariant(structure.status)}>
                    {structure.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Jurisdiction</p>
                  <p className="text-sm font-semibold">{structure.jurisdiction}</p>
                </div>
              </div>

              <Separator />

              {/* Fund Details */}
              <div>
                <h3 className="font-semibold mb-4">Fund Details</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Commitment</p>
                    <p className="text-lg font-bold">{formatCurrency(structure.totalCommitment)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Currency</p>
                    <p className="text-sm font-semibold">{structure.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Investors</p>
                    <p className="text-sm font-semibold">{structure.investors || 0} LPs</p>
                  </div>
                  {structure.inceptionDate && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Inception Date</p>
                      <p className="text-sm font-semibold">{formatDate(structure.inceptionDate)}</p>
                    </div>
                  )}
                  {structure.fundTerm && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Fund Term</p>
                      <p className="text-sm font-semibold">{structure.fundTerm}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Investment Info */}
              {(structure.minCheckSize || structure.maxCheckSize) && (
                <div>
                  <h3 className="font-semibold mb-4">Investment Parameters</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {structure.minCheckSize && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Minimum Check Size</p>
                        <p className="text-lg font-bold">{formatCurrency(structure.minCheckSize)}</p>
                      </div>
                    )}
                    {structure.maxCheckSize && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Maximum Check Size</p>
                        <p className="text-lg font-bold">{formatCurrency(structure.maxCheckSize)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offering Terms Tab */}
        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offering Terms</CardTitle>
              <CardDescription>Fee structure and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {structure.managementFee && (
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Management Fee</p>
                    <p className="text-3xl font-bold text-primary">{structure.managementFee}</p>
                  </div>
                )}
                {structure.performanceFee && (
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Performance Fee</p>
                    <p className="text-3xl font-bold text-primary">{structure.performanceFee}</p>
                  </div>
                )}
                {structure.hurdleRate && (
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Hurdle Rate</p>
                    <p className="text-3xl font-bold">{structure.hurdleRate}</p>
                  </div>
                )}
                {structure.preferredReturn && (
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Preferred Return</p>
                    <p className="text-3xl font-bold">{structure.preferredReturn}</p>
                  </div>
                )}
              </div>

              <Separator />

              {structure.waterfallStructure && (
                <div>
                  <h3 className="font-semibold mb-2">Waterfall Structure</h3>
                  <p className="text-sm text-muted-foreground">{structure.waterfallStructure}</p>
                </div>
              )}

              {structure.distributionFrequency && (
                <div>
                  <h3 className="font-semibold mb-2">Distribution Frequency</h3>
                  <p className="text-sm text-muted-foreground">{structure.distributionFrequency}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Token Info Tab */}
        <TabsContent value="tokens" className="space-y-4">
          {structure.totalTokens && structure.totalTokens > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Token Economics</CardTitle>
                <CardDescription>Token supply and pricing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Token Name</p>
                    <p className="text-2xl font-bold">{structure.tokenName || 'N/A'}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Token Symbol</p>
                    <p className="text-2xl font-bold">{structure.tokenSymbol || 'N/A'}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Price Per Token</p>
                    <p className="text-2xl font-bold">{formatCurrency(structure.tokenValue || 1000)}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Tokens</p>
                    <p className="text-2xl font-bold">{structure.totalTokens.toLocaleString()}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-6">
                  {structure.minTokensPerInvestor && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Minimum Tokens Per Investor</p>
                      <p className="text-lg font-semibold">{structure.minTokensPerInvestor.toLocaleString()}</p>
                    </div>
                  )}
                  {structure.maxTokensPerInvestor && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Maximum Tokens Per Investor</p>
                      <p className="text-lg font-semibold">{structure.maxTokensPerInvestor.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Token information not available for this structure</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Structure-related documents and materials</CardDescription>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Loading documents...</p>
                </div>
              ) : documentsError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                  <p className="text-lg font-semibold mb-2">Error loading documents</p>
                  <p className="text-sm text-muted-foreground">{documentsError}</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No documents available</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Documents will appear here once they are uploaded.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{doc.documentName}</p>
                          <p className="text-sm text-muted-foreground">{doc.documentType}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.filePath, '_blank')}
                        className="flex items-center gap-2 flex-shrink-0"
                      >
                        See
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
