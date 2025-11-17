'use client'

import { useState, useEffect } from 'react'
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
import { IconPlus, IconTrendingDown, IconEdit, IconTrash, IconFileText, IconSend, IconClock, IconCircleCheck, IconAlertCircle, IconCircleX } from '@tabler/icons-react'
import { getCapitalCalls, getCapitalCallSummary, deleteCapitalCall, type CapitalCall } from '@/lib/capital-calls-storage'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function CapitalCallsPage() {
  const router = useRouter()
  const [capitalCalls, setCapitalCalls] = useState<CapitalCall[]>([])
  const [capitalCallSummary, setCapitalCallSummary] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    partiallyPaid: 0,
    fullyPaid: 0,
    overdue: 0,
    totalCallAmount: 0,
    totalPaidAmount: 0,
    totalOutstandingAmount: 0
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteCallId, setDeleteCallId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setCapitalCalls(getCapitalCalls())
    setCapitalCallSummary(getCapitalCallSummary())
  }

  const handleDelete = (id: string) => {
    setDeleteCallId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (deleteCallId) {
      deleteCapitalCall(deleteCallId)
      toast.success('Capital call deleted successfully')
      loadData()
      setShowDeleteDialog(false)
      setDeleteCallId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      'Draft': { variant: 'secondary', icon: IconFileText },
      'Sent': { variant: 'default', icon: IconSend },
      'Partially Paid': { variant: 'outline', icon: IconClock },
      'Fully Paid': { variant: 'default', icon: IconCircleCheck },
      'Overdue': { variant: 'destructive', icon: IconAlertCircle },
      'Cancelled': { variant: 'secondary', icon: IconCircleX },
    }

    const config = statusConfig[status] || { variant: 'secondary' as const, icon: IconFileText }
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
          <h1 className="text-2xl font-semibold tracking-tight">Capital Calls</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {capitalCallSummary.total} capital call{capitalCallSummary.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => router.push('/investment-manager/operations/capital-calls/create')}>
          <IconPlus className="w-4 h-4 mr-2" />
          Add Capital Call
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Called</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {formatCurrency(capitalCallSummary.totalCallAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Paid</CardDescription>
            <CardTitle className="text-2xl font-semibold text-green-600">
              {formatCurrency(capitalCallSummary.totalPaidAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Outstanding</CardDescription>
            <CardTitle className="text-2xl font-semibold text-orange-600">
              {formatCurrency(capitalCallSummary.totalOutstandingAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Collection Rate</CardDescription>
            <CardTitle className="text-2xl font-semibold text-primary">
              {capitalCallSummary.totalCallAmount > 0
                ? `${((capitalCallSummary.totalPaidAmount / capitalCallSummary.totalCallAmount) * 100).toFixed(1)}%`
                : '0%'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Capital Calls Grid */}
      {capitalCalls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconTrendingDown className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Capital Calls</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first capital call
            </p>
            <Button onClick={() => router.push('/investment-manager/operations/capital-calls/create')}>
              <IconPlus className="w-4 h-4 mr-2" />
              Create Capital Call
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capitalCalls.map((call) => (
            <Card key={call.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/investment-manager/operations/capital-calls/${call.id}`)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">
                      {call.fundName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Call #{call.callNumber}
                    </CardDescription>
                  </div>
                  {getStatusBadge(call.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Call Date</p>
                    <p className="text-sm font-medium">{formatDate(call.callDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm font-medium">{formatDate(call.dueDate)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-sm font-semibold">{formatCurrency(call.totalCallAmount, call.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Paid</span>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(call.totalPaidAmount, call.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Outstanding</span>
                    <span className="text-sm font-medium text-orange-600">{formatCurrency(call.totalOutstandingAmount, call.currency)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/investment-manager/operations/capital-calls/${call.id}`)}
                  >
                    <IconEdit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(call.id)}
                  >
                    <IconTrash className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Capital Call</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this capital call? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCallId(null)}>Cancel</AlertDialogCancel>
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
