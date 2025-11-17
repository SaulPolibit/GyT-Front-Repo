'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { IconPlus, IconTrendingUp, IconEdit, IconTrash, IconClock, IconCircleCheck, IconCircleX } from '@tabler/icons-react'
import { getDistributions, getDistributionSummary, deleteDistribution, type Distribution } from '@/lib/distributions-storage'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function DistributionsPage() {
  const router = useRouter()
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [distributionSummary, setDistributionSummary] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalDistributionAmount: 0,
    totalReturnOfCapital: 0,
    totalIncome: 0,
    totalCapitalGain: 0
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [distributionToDelete, setDistributionToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setDistributions(getDistributions())
    setDistributionSummary(getDistributionSummary())
  }

  const handleDelete = (id: string) => {
    setDistributionToDelete(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (distributionToDelete) {
      deleteDistribution(distributionToDelete)
      toast.success('Distribution deleted successfully')
      loadData()
      setDistributionToDelete(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      'Pending': { variant: 'secondary', icon: IconClock },
      'Processing': { variant: 'outline', icon: IconClock },
      'Completed': { variant: 'default', icon: IconCircleCheck },
      'Failed': { variant: 'destructive', icon: IconCircleX },
    }

    const config = statusConfig[status] || { variant: 'secondary' as const, icon: IconClock }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    )
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
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Distributions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {distributionSummary.total} distribution{distributionSummary.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => router.push('/investment-manager/operations/distributions/create')}>
          <IconPlus className="w-4 h-4 mr-2" />
          Add Distribution
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Distributed</CardDescription>
            <CardTitle className="text-2xl font-semibold text-green-600">
              {formatCurrency(distributionSummary.totalDistributionAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Return of Capital</CardDescription>
            <CardTitle className="text-2xl font-semibold text-blue-600">
              {formatCurrency(distributionSummary.totalReturnOfCapital)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Income</CardDescription>
            <CardTitle className="text-2xl font-semibold text-purple-600">
              {formatCurrency(distributionSummary.totalIncome)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Capital Gains</CardDescription>
            <CardTitle className="text-2xl font-semibold text-primary">
              {formatCurrency(distributionSummary.totalCapitalGain)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Distributions Grid */}
      {distributions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconTrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Distributions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first distribution
            </p>
            <Button onClick={() => router.push('/investment-manager/operations/distributions/create')}>
              <IconPlus className="w-4 h-4 mr-2" />
              Create Distribution
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {distributions.map((dist) => (
            <Card key={dist.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/investment-manager/operations/distributions/${dist.id}`)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">
                      {dist.fundName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Distribution #{dist.distributionNumber}
                    </CardDescription>
                  </div>
                  {getStatusBadge(dist.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">{formatDate(dist.distributionDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="text-sm font-medium">{dist.source}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(dist.totalDistributionAmount, dist.currency)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {dist.isReturnOfCapital && (
                    <Badge variant="outline" className="text-xs">ROC</Badge>
                  )}
                  {dist.isIncome && (
                    <Badge variant="outline" className="text-xs">Income</Badge>
                  )}
                  {dist.isCapitalGain && (
                    <Badge variant="outline" className="text-xs">Capital Gain</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/investment-manager/operations/distributions/${dist.id}`)}
                  >
                    <IconEdit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(dist.id)}
                  >
                    <IconTrash className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
