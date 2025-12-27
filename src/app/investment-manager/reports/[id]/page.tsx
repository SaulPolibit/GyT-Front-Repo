"use client"

import { use, useState, useEffect } from "react"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from 'sonner'
import { useAuth } from "@/hooks/useAuth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Send, Calendar, Users, FileText, TrendingUp, Building2, DollarSign, Loader2, Calculator } from "lucide-react"
import reportsData from "@/data/reports.json"
import investmentsData from "@/data/investments.json"
import investorsData from "@/data/investors.json"
import type { Report, Investment, Investor } from "@/lib/types"
import {
  calculateWaterfall,
  STANDARD_WATERFALL,
  formatWaterfallCurrency,
  type WaterfallDistribution,
  type InvestorCapitalAccount,
} from "@/lib/waterfall-calculations"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ReportDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { logout } = useAuth()
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false)
  const [waterfallResult, setWaterfallResult] = useState<WaterfallDistribution | null>(null)

  const reports = reportsData as Report[]
  const report = reports.find((r) => r.id === id)

  if (!report) {
    notFound()
  }

  const investments = investmentsData as Investment[]
  const investors = investorsData as Investor[]

  // Calculate waterfall for distribution reports
  useEffect(() => {
    if (report.distribution) {
      const capitalAccounts: InvestorCapitalAccount[] = investors.map(investor => {
        // Get aggregated capital from all fund ownerships
        const totalCalledCapital = investor.fundOwnerships?.reduce((sum, fo) => sum + fo.calledCapital, 0) || 0

        return {
          investorId: investor.id,
          investorName: investor.name,
          capitalContributed: totalCalledCapital,
          capitalReturned: investor.totalDistributed * 0.3,
          preferredReturnAccrued: 0,
          preferredReturnPaid: investor.totalDistributed * 0.2,
          distributionsReceived: investor.totalDistributed,
        }
      })

      const result = calculateWaterfall(
        STANDARD_WATERFALL,
        report.distribution.totalDistributionAmount,
        capitalAccounts,
        '2022-01-01', // Fund start date
        report.distribution.distributionDate
      )

      setWaterfallResult(result)
    }
  }, [report, investors])

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true)
      const response = await fetch(`/api/reports/${id}/export/pdf`)

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {
        // Check if it's an expired token error
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Report Detail] 401 Unauthorized - clearing session and redirecting to login')
            logout()
            router.push('/sign-in')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

      if (!response.ok) throw new Error('Failed to download PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  const handleDownloadExcel = async () => {
    try {
      setIsDownloadingExcel(true)
      const response = await fetch(`/api/reports/${id}/export/excel`)

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {
        // Check if it's an expired token error
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Report Detail] 401 Unauthorized - clearing session and redirecting to login')
            logout()
            router.push('/sign-in')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

      if (!response.ok) throw new Error('Failed to download Excel')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading Excel:', error)
      toast.error('Failed to download Excel. Please try again.')
    } finally {
      setIsDownloadingExcel(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'default'
      case 'Sent': return 'default'
      case 'In Review': return 'outline'
      case 'Draft': return 'secondary'
      default: return 'secondary'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Quarterly': return 'default'
      case 'Annual': return 'default'
      case 'Monthly': return 'outline'
      case 'Capital Call': return 'destructive'
      case 'Distribution': return 'default'
      case 'Custom': return 'secondary'
      default: return 'secondary'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Real Estate': return <Building2 className="h-4 w-4" />
      case 'Private Equity': return <TrendingUp className="h-4 w-4" />
      case 'Private Debt': return <DollarSign className="h-4 w-4" />
      default: return null
    }
  }

  // Get related investments and investors
  const relatedInvestments = investments.filter(inv =>
    report.includesInvestments.includes(inv.id)
  )
  const relatedInvestors = investors.filter(inv =>
    report.includesInvestors.includes(inv.id)
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/investment-manager/reports">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{report.title}</h1>
              <Badge variant={getTypeColor(report.type)}>
                {report.type}
              </Badge>
              <Badge variant={getStatusColor(report.status)}>
                {report.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(report.periodStart)} - {formatDate(report.periodEnd)}</span>
              </div>
              <span>•</span>
              <div>Generated on {formatDate(report.generatedDate)}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloadingPDF}>
            {isDownloadingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleDownloadExcel} disabled={isDownloadingExcel}>
            {isDownloadingExcel ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Excel...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Excel
              </>
            )}
          </Button>
          {report.status === "Draft" && (
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Publish & Send
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total AUM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(report.metrics.totalAUM)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average IRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{report.metrics.avgIRR.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Distributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(report.metrics.totalDistributions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.sentTo.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Capital Call Details */}
      {report.capitalCall && (
        <Card>
          <CardHeader>
            <CardTitle>Capital Call Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Call Amount</div>
                <div className="text-lg font-semibold">{formatCurrency(report.capitalCall.totalCallAmount)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Call Number</div>
                <div className="text-lg font-semibold">#{report.capitalCall.callNumber}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Due Date</div>
                <div className="text-lg font-semibold">{formatDate(report.capitalCall.dueDate)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Related Investment</div>
                <div className="text-sm font-semibold">{report.capitalCall.relatedInvestmentName || 'Multiple'}</div>
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-semibold mb-1">Purpose</div>
              <p className="text-sm text-muted-foreground">{report.capitalCall.purpose}</p>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-semibold mb-3">Investor Allocations</div>
              <div className="space-y-2">
                {report.capitalCall.investorAllocations.map((allocation) => (
                  <div key={allocation.investorId} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium">{allocation.investorName}</div>
                      <div className="text-sm text-muted-foreground">{allocation.investorType} • {allocation.ownershipPercent.toFixed(2)}% ownership</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(allocation.amount)}</div>
                        <Badge variant={allocation.status === 'Paid' ? 'default' : 'outline'} className="text-xs">
                          {allocation.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution Details */}
      {report.distribution && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Distribution</div>
                <div className="text-lg font-semibold text-green-600">{formatCurrency(report.distribution.totalDistributionAmount)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Distribution Number</div>
                <div className="text-lg font-semibold">#{report.distribution.distributionNumber}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Distribution Date</div>
                <div className="text-lg font-semibold">{formatDate(report.distribution.distributionDate)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Source</div>
                <div className="text-sm font-semibold">{report.distribution.source}</div>
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-semibold mb-3">Investor Allocations</div>
              <div className="space-y-2">
                {report.distribution.investorAllocations.map((allocation) => (
                  <div key={allocation.investorId} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium">{allocation.investorName}</div>
                      <div className="text-sm text-muted-foreground">{allocation.investorType} • {allocation.ownershipPercent.toFixed(2)}% ownership</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{formatCurrency(allocation.amount)}</div>
                        <Badge variant={allocation.status === 'Paid' ? 'default' : 'outline'} className="text-xs">
                          {allocation.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waterfall Breakdown */}
      {report.distribution && waterfallResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Waterfall Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total to LPs</div>
                <div className="text-2xl font-bold text-primary">
                  {formatWaterfallCurrency(
                    waterfallResult.tierDistributions.reduce((sum, tier) => sum + tier.lpAmount, 0)
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(
                    (waterfallResult.tierDistributions.reduce((sum, tier) => sum + tier.lpAmount, 0) /
                      waterfallResult.totalDistributable) *
                    100
                  ).toFixed(1)}% of total
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total to GP</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatWaterfallCurrency(waterfallResult.gpAllocation.totalAmount)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {((waterfallResult.gpAllocation.totalAmount / waterfallResult.totalDistributable) * 100).toFixed(1)}% of total
                </div>
              </div>
            </div>

            <Separator />

            {waterfallResult.tierDistributions.map((tier, index) => (
              <div key={tier.tierId}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{tier.tierName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {tier.tierType.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatWaterfallCurrency(tier.amountDistributed)}</p>
                    <p className="text-xs text-muted-foreground">
                      {((tier.amountDistributed / waterfallResult.totalDistributable) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Limited Partners</p>
                    <p className="font-semibold">{formatWaterfallCurrency(tier.lpAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">General Partner</p>
                    <p className="font-semibold">{formatWaterfallCurrency(tier.gpAmount)}</p>
                  </div>
                </div>

                {index < waterfallResult.tierDistributions.length - 1 && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Included Investments */}
      <Card>
        <CardHeader>
          <CardTitle>Included Investments ({relatedInvestments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {relatedInvestments.length > 0 ? (
            <div className="space-y-2">
              {relatedInvestments.map((investment) => (
                <Link key={investment.id} href={`/investment-manager/investments/${investment.id}`}>
                  <div className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(investment.type)}
                      <div>
                        <div className="font-medium">{investment.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {investment.type} • {investment.sector}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(investment.totalFundPosition.currentValue)}</div>
                      <div className="text-sm text-muted-foreground">IRR: {investment.totalFundPosition.irr.toFixed(1)}%</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No investments included in this report
            </div>
          )}
        </CardContent>
      </Card>

      {/* Included Investors */}
      <Card>
        <CardHeader>
          <CardTitle>Included Investors ({relatedInvestors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {relatedInvestors.length > 0 ? (
            <div className="space-y-2">
              {relatedInvestors.map((investor) => (
                <Link key={investor.id} href={`/investment-manager/investors/${investor.id}`}>
                  <div className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer">
                    <div>
                      <div className="font-medium">{investor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {investor.type} • {investor.fundOwnerships?.length || 0} structure{(investor.fundOwnerships?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(investor.currentValue)}</div>
                      <div className="text-sm text-muted-foreground">IRR: {investor.irr.toFixed(1)}%</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No investors included in this report
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipients */}
      {report.sentTo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recipients ({report.sentTo.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.sentTo.map((recipient) => (
                <div key={recipient.investorId} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{recipient.investorName}</div>
                    <div className="text-sm text-muted-foreground">Sent on {formatDate(recipient.sentDate)}</div>
                  </div>
                  <Badge variant={recipient.opened ? 'default' : 'secondary'}>
                    {recipient.opened ? 'Opened' : 'Not Opened'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Report ID</div>
              <div className="font-medium">{report.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Created By</div>
              <div className="font-medium">{report.createdBy}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Generated Date</div>
              <div className="font-medium">{formatDate(report.generatedDate)}</div>
            </div>
            {report.publishedDate && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Published Date</div>
                <div className="font-medium">{formatDate(report.publishedDate)}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
