'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconSearch, IconFileText, IconDownload, IconEye, IconCalendar, IconClock, IconLoader2, IconTrendingUp } from '@tabler/icons-react'
import reportsData from '@/data/reports.json'
import { getInvestorByEmail, getCurrentInvestorEmail } from '@/lib/lp-portal-helpers'
import type { Report } from '@/lib/types'

export default function LPReportsPage() {
  const reports = reportsData as Report[]
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [downloadingStates, setDownloadingStates] = useState<Record<string, 'pdf' | 'excel' | null>>({})
  const [investorName, setInvestorName] = useState('')
  const [investorReports, setInvestorReports] = useState<Report[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const email = getCurrentInvestorEmail()
    const investor = getInvestorByEmail(email)

    if (!investor) return

    setInvestorName(investor.name)

    // Filter reports where investor is a recipient
    // Check both investor.id and 'tony-bravo' identifier for demo purposes
    const filteredReports = reports.filter(report =>
      report.sentTo.some(recipient =>
        recipient.investorId === investor.id ||
        (investor.name === 'Tony Bravo' && recipient.investorId === 'tony-bravo')
      )
    )

    setInvestorReports(filteredReports)
  }

  const filteredReports = investorReports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || report.type === filterType
    return matchesSearch && matchesType
  })

  const email = getCurrentInvestorEmail()
  const currentInvestor = getInvestorByEmail(email)

  const totalReports = investorReports.length
  const openedReports = investorReports.filter(r =>
    r.sentTo.find(recipient =>
      recipient.investorId === currentInvestor?.id ||
      (currentInvestor?.name === 'Tony Bravo' && recipient.investorId === 'tony-bravo')
    )?.opened
  ).length
  const unreadReports = totalReports - openedReports

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

  const handleDownload = async (reportId: string, type: 'pdf' | 'excel') => {
    try {
      setDownloadingStates(prev => ({ ...prev, [reportId]: type }))
      const report = reports.find(r => r.id === reportId)
      if (!report) throw new Error('Report not found')

      const endpoint = type === 'pdf'
        ? `/api/reports/${reportId}/export/pdf`
        : `/api/reports/${reportId}/export/excel`

      const response = await fetch(endpoint)
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

  const getInvestorRecipient = (report: Report) => {
    return report.sentTo.find(r =>
      r.investorId === currentInvestor?.id ||
      (currentInvestor?.name === 'Tony Bravo' && r.investorId === 'tony-bravo')
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and download reports sent to you
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Reports</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {totalReports}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Opened</CardDescription>
            <CardTitle className="text-2xl font-semibold text-green-600">
              {openedReports}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Unread</CardDescription>
            <CardTitle className="text-2xl font-semibold text-orange-600">
              {unreadReports}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative flex-1 max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconTrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {searchQuery
                ? 'No reports match your search. Try adjusting your filters.'
                : 'You haven\'t received any reports yet. Reports will appear here when your fund managers send them.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const recipientInfo = getInvestorRecipient(report)
            const isOpened = recipientInfo?.opened || false

            return (
              <Card key={report.id} className={`hover:shadow-lg transition-shadow ${!isOpened ? 'border-primary/50' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{report.title}</CardTitle>
                        <Badge variant={getTypeColor(report.type)}>{report.type}</Badge>
                        {!isOpened && (
                          <Badge variant="outline" className="border-primary text-primary">
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <IconCalendar className="w-4 h-4" />
                          {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
                        </div>
                        {recipientInfo && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <IconClock className="w-4 h-4" />
                              Sent {formatDate(recipientInfo.sentDate)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
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
                      <div className="text-xs text-muted-foreground mb-1">Investments</div>
                      <div className="text-sm font-semibold">{report.metrics.totalInvestments}</div>
                    </div>
                  </div>

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
                          <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <IconDownload className="w-4 h-4 mr-2" />
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
                          <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <IconDownload className="w-4 h-4 mr-2" />
                          Excel
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/lp-portal/reports/${report.id}`}
                    >
                      <IconEye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
