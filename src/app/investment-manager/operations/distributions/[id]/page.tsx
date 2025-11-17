'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { IconArrowLeft, IconEdit, IconTrash, IconSend, IconFileTypography } from '@tabler/icons-react'
import { getDistributionById, deleteDistribution, type Distribution } from '@/lib/distributions-storage'
import { downloadILPADistribution } from '@/lib/ilpa-distribution-generator'
import { toast } from 'sonner'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function DistributionDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [distribution, setDistribution] = useState<Distribution | null>(null)
  const [id, setId] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      const dist = getDistributionById(p.id)
      setDistribution(dist)
    })
  }, [params])

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    deleteDistribution(id)
    toast.success('Distribution deleted successfully')
    router.push('/investment-manager/operations/distributions')
  }

  const handleExportILPA = () => {
    if (distribution) {
      downloadILPADistribution(distribution)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Pending': 'secondary',
      'Processing': 'outline',
      'Completed': 'default',
      'Failed': 'destructive',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  if (!distribution) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Distribution not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Distribution #{distribution.distributionNumber}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{distribution.fundName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" onClick={handleExportILPA}>
            <IconFileTypography className="w-4 h-4 mr-2" />
            Export ILPA Template
          </Button>
          <Button variant="outline" onClick={() => router.push(`/investment-manager/operations/distributions/create?edit=${id}`)}>
            <IconEdit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <IconTrash className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Status</CardDescription>
            <div className="mt-2">{getStatusBadge(distribution.status)}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Distribution</CardDescription>
            <CardTitle className="text-2xl font-semibold text-green-600">
              {formatCurrency(distribution.totalDistributionAmount, distribution.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Return of Capital</CardDescription>
            <CardTitle className="text-2xl font-semibold text-blue-600">
              {formatCurrency(distribution.returnOfCapitalAmount || 0, distribution.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Income + Gains</CardDescription>
            <CardTitle className="text-2xl font-semibold text-purple-600">
              {formatCurrency((distribution.incomeAmount || 0) + (distribution.capitalGainAmount || 0), distribution.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Distribution Date</p>
              <p className="font-medium">{formatDate(distribution.distributionDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Record Date</p>
              <p className="font-medium">{formatDate(distribution.recordDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Date</p>
              <p className="font-medium">{formatDate(distribution.paymentDate)}</p>
            </div>
            {distribution.processedDate && (
              <div>
                <p className="text-sm text-muted-foreground">Processed Date</p>
                <p className="font-medium">{formatDate(distribution.processedDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Source & Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Source</p>
              <p className="font-medium">{distribution.source}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Source Description</p>
              <p className="font-medium">{distribution.sourceDescription}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transaction Type</p>
              <p className="font-medium">{distribution.transactionType}</p>
            </div>
            {distribution.relatedInvestmentName && (
              <div>
                <p className="text-sm text-muted-foreground">Related Investment</p>
                <p className="font-medium">{distribution.relatedInvestmentName}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Distribution Type</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {distribution.isReturnOfCapital && <Badge variant="outline">Return of Capital</Badge>}
                {distribution.isIncome && <Badge variant="outline">Income</Badge>}
                {distribution.isCapitalGain && <Badge variant="outline">Capital Gain</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Breakdown */}
      {(distribution.returnOfCapitalAmount || distribution.incomeAmount || distribution.capitalGainAmount) && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {distribution.isReturnOfCapital && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Return of Capital</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {formatCurrency(distribution.returnOfCapitalAmount || 0, distribution.currency)}
                  </p>
                </div>
              )}
              {distribution.isIncome && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Income</p>
                  <p className="text-2xl font-semibold text-purple-600">
                    {formatCurrency(distribution.incomeAmount || 0, distribution.currency)}
                  </p>
                </div>
              )}
              {distribution.isCapitalGain && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Capital Gain</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {formatCurrency(distribution.capitalGainAmount || 0, distribution.currency)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investor Allocations */}
      <Card>
        <CardHeader>
          <CardTitle>Investor Allocations</CardTitle>
          <CardDescription>
            {distribution.investorAllocations.length} investor{distribution.investorAllocations.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Ownership</TableHead>
                <TableHead className="text-right">Base Allocation</TableHead>
                <TableHead className="text-right">Final Allocation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distribution.investorAllocations.map((allocation) => (
                <TableRow key={allocation.investorId}>
                  <TableCell className="font-medium">{allocation.investorName}</TableCell>
                  <TableCell>{allocation.investorType}</TableCell>
                  <TableCell className="text-right">{allocation.ownershipPercent.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(allocation.baseAllocation, distribution.currency)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(allocation.finalAllocation, distribution.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={allocation.status === 'Completed' ? 'default' : allocation.status === 'Failed' ? 'destructive' : 'secondary'}>
                      {allocation.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Distribution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this distribution? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
