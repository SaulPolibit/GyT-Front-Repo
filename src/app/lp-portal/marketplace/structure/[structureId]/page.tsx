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
} from "lucide-react"
import { getStructureById } from "@/lib/structures-storage"
import type { Structure } from "@/lib/structures-storage"

interface Props {
  params: Promise<{ structureId: string }>
}

export default function MarketplaceStructureDetailPage({ params }: Props) {
  const { structureId } = use(params)
  const [structure, setStructure] = React.useState<Structure | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    const struct = getStructureById(structureId)
    setStructure(struct)
    setLoading(false)
  }, [structureId, refreshKey])

  // Listen for storage events to refresh when data changes
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'polibit_structures') {
        setRefreshKey(prev => prev + 1)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

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
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Structure not found</p>
            <p className="text-sm text-muted-foreground">
              The fund structure you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Back Button and Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <a href="/lp-portal/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </a>
        </Button>
        <div className="flex gap-2">
          <Button asChild>
            <a href={`/lp-portal/marketplace/structure/${structureId}/checkout`}>
              Buy Tokens
            </a>
          </Button>
        </div>
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
            <p className="text-xs text-muted-foreground">{structure.subtype}</p>
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
            <CardTitle className="text-sm font-medium">Investors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{structure.investors || 0}</div>
            <p className="text-xs text-muted-foreground">Current count</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jurisdiction</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{structure.jurisdiction}</div>
            <p className="text-xs text-muted-foreground">Legal location</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="terms">Economic Terms</TabsTrigger>
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
                  <p className="text-xs text-muted-foreground mb-1">Fund Type</p>
                  <p className="text-sm font-semibold">{structure.fundType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge variant={getStatusBadgeVariant(structure.status)}>
                    {structure.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Stage</p>
                  <p className="text-sm font-semibold">{structure.currentStage || 'N/A'}</p>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Economic Terms Tab */}
        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Economic Terms</CardTitle>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Documents coming soon</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Fund documents, prospectus, and legal materials will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
