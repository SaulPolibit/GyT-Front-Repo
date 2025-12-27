"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, FileText, Download, Send, Eye, Calendar, Users, Loader2 } from "lucide-react"
import reportsData from "@/data/reports.json"
import type { Report } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"

export default function ReportsPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const reports = reportsData as Report[]
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [downloadingStates, setDownloadingStates] = useState<Record<string, 'pdf' | 'excel' | null>>({})

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || report.type === filterType
    const matchesStatus = filterStatus === "all" || report.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const totalReports = reports.length
  const publishedReports = reports.filter(r => r.status === "Published").length
  const draftReports = reports.filter(r => r.status === "Draft").length
  const totalRecipients = reports.reduce((sum, r) => sum + r.sentTo.length, 0)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    // Typed status mapping for ReportStatus: 'Draft' | 'In Review' | 'Published' | 'Sent'
    const validStatus = ['Draft', 'In Review', 'Published', 'Sent'].includes(status)
    switch (status) {
      case 'Published': return 'default'
      case 'Sent': return 'default'
      case 'In Review': return 'outline'
      case 'Draft': return 'secondary'
      default: return validStatus ? 'secondary' : 'secondary'
    }
  }

  const getTypeColor = (type: string) => {
    // Typed type mapping for ReportType: 'Quarterly' | 'Annual' | 'Monthly' | 'Custom' | 'Capital Call' | 'Distribution' | 'ILPA Performance' | 'ILPA Reporting'
    const validType = ['Quarterly', 'Annual', 'Monthly', 'Custom', 'Capital Call', 'Distribution', 'ILPA Performance', 'ILPA Reporting'].includes(type)
    switch (type) {
      case 'Quarterly': return 'default'
      case 'Annual': return 'default'
      case 'Monthly': return 'outline'
      case 'Capital Call': return 'destructive'
      case 'Distribution': return 'default'
      case 'ILPA Performance': return 'default'
      case 'ILPA Reporting': return 'default'
      case 'Custom': return 'secondary'
      default: return validType ? 'secondary' : 'secondary'
    }
  }

  const handleDownload = async (reportId: string, type: 'pdf' | 'excel') => {
    try {
      setDownloadingStates(prev => ({ ...prev, [reportId]: type }))
      const report = reports.find(r => r.id === reportId)
      if (!report) throw new Error('Report not found')

      const endpoint = type === 'pdf'
        ? `/api/reports/${reportId}/export/pdf`
        : `/api/reports/${reportId}/export/excel`

      const response = await fetch(endpoint)

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {
        // Check if it's an expired token error
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Reports] 401 Unauthorized - clearing session and redirecting to login')
            logout()
            router.push('/sign-in')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

      if (!response.ok) throw new Error(`Failed to download ${type.toUpperCase()}`)

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}.${type === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error(`Error downloading ${type.toUpperCase()}:`, error)
      toast.error(`Failed to download ${type.toUpperCase()}. Please try again.`)
    } finally {
      setDownloadingStates(prev => ({ ...prev, [reportId]: null }))
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/investment-manager/reports/builder">
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecipients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Type:</span>
            <Tabs value={filterType} onValueChange={setFilterType}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="Quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="Annual">Annual</TabsTrigger>
                <TabsTrigger value="Monthly">Monthly</TabsTrigger>
                <TabsTrigger value="Capital Call">Capital Call</TabsTrigger>
                <TabsTrigger value="Distribution">Distribution</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Tabs value={filterStatus} onValueChange={setFilterStatus}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="Published">Published</TabsTrigger>
                <TabsTrigger value="In Review">In Review</TabsTrigger>
                <TabsTrigger value="Draft">Draft</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{report.title}</CardTitle>
                    <Badge variant={getTypeColor(report.type)}>{report.type}</Badge>
                    <Badge variant={getStatusColor(report.status)}>{report.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {report.metrics.totalInvestors} investors
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {report.metrics.totalInvestments} investments
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total AUM</div>
                  <div className="text-sm font-semibold">{formatCurrency(report.metrics.totalAUM)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Avg IRR</div>
                  <div className="text-sm font-semibold text-green-600">{report.metrics.avgIRR.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Distributions</div>
                  <div className="text-sm font-semibold">{formatCurrency(report.metrics.totalDistributions)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Generated</div>
                  <div className="text-sm font-semibold">{formatDate(report.generatedDate)}</div>
                </div>
                {report.publishedDate && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Published</div>
                    <div className="text-sm font-semibold">{formatDate(report.publishedDate)}</div>
                  </div>
                )}
              </div>

              {/* Recipients */}
              {report.sentTo.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">
                    Recipients ({report.sentTo.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.sentTo.map((recipient) => (
                      <div
                        key={recipient.investorId}
                        className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm"
                      >
                        <span>{recipient.investorName}</span>
                        {recipient.opened && (
                          <Eye className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(report.id, 'pdf')}
                  disabled={downloadingStates[report.id] === 'pdf'}
                >
                  {downloadingStates[report.id] === 'pdf' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(report.id, 'excel')}
                  disabled={downloadingStates[report.id] === 'excel'}
                >
                  {downloadingStates[report.id] === 'excel' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Excel
                    </>
                  )}
                </Button>
                {report.status === "Draft" && (
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Publish & Send
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/investment-manager/reports/${report.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Generate your first report to get started'}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/investment-manager/reports/builder">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Report
                </Link>
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
