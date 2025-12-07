'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
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
import { IconArrowLeft, IconEdit, IconTrash, IconSend, IconDownload, IconFileTypography } from '@tabler/icons-react'
import { getCapitalCallById, deleteCapitalCall, markCapitalCallAsSent, type CapitalCall } from '@/lib/capital-calls-storage'
import { downloadILPACapitalCall } from '@/lib/ilpa-capital-call-generator'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CapitalCallDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [capitalCall, setCapitalCall] = useState<CapitalCall | null>(null)
  const [id, setId] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      const call = getCapitalCallById(p.id)
      setCapitalCall(call)
    })
  }, [params])

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    deleteCapitalCall(id)
    toast.success('Capital call deleted successfully')
    router.push('/investment-manager/operations/capital-calls')
  }

  const handleSend = () => {
    setShowSendDialog(true)
  }

  const confirmSend = () => {
    markCapitalCallAsSent(id)
    const updated = getCapitalCallById(id)
    setCapitalCall(updated)
    setShowSendDialog(false)
    toast.success('Capital call notice sent to all investors!')
  }

  const handleExportILPA = () => {
    if (capitalCall) {
      downloadILPACapitalCall(capitalCall)
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
    // Typed status mapping for CapitalCallStatus: 'Draft' | 'Sent' | 'Partially Paid' | 'Fully Paid' | 'Overdue' | 'Cancelled'
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Draft': 'secondary',
      'Sent': 'default',
      'Partially Paid': 'outline',
      'Fully Paid': 'default',
      'Overdue': 'destructive',
      'Cancelled': 'secondary',
    }
    // Status must be one of the valid CapitalCallStatus values
    const validStatus = ['Draft', 'Sent', 'Partially Paid', 'Fully Paid', 'Overdue', 'Cancelled'].includes(status)
    return <Badge variant={validStatus ? variants[status] : 'secondary'}>{status}</Badge>
  }

  if (!capitalCall) {
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
            <p className="text-muted-foreground">Capital call not found</p>
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
              Capital Call #{capitalCall.callNumber}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{capitalCall.fundName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {capitalCall.status === 'Draft' && (
            <Button onClick={handleSend}>
              <IconSend className="w-4 h-4 mr-2" />
              Send to Investors
            </Button>
          )}
          <Button variant="default" onClick={handleExportILPA}>
            <IconFileTypography className="w-4 h-4 mr-2" />
            Export ILPA Template
          </Button>
          <Button variant="outline" onClick={() => router.push(`/investment-manager/operations/capital-calls/create?edit=${id}`)}>
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
            <div className="mt-2">{getStatusBadge(capitalCall.status)}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Total Call Amount</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {formatCurrency(capitalCall.totalCallAmount, capitalCall.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Paid</CardDescription>
            <CardTitle className="text-2xl font-semibold text-green-600">
              {formatCurrency(capitalCall.totalPaidAmount, capitalCall.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-normal">Outstanding</CardDescription>
            <CardTitle className="text-2xl font-semibold text-orange-600">
              {formatCurrency(capitalCall.totalOutstandingAmount, capitalCall.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Call Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Call Date</p>
              <p className="font-medium">{formatDate(capitalCall.callDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{formatDate(capitalCall.dueDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Notice Period</p>
              <p className="font-medium">{capitalCall.noticePeriodDays} days</p>
            </div>
            {capitalCall.sentDate && (
              <div>
                <p className="text-sm text-muted-foreground">Sent Date</p>
                <p className="font-medium">{formatDate(capitalCall.sentDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purpose & Investment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Purpose</p>
              <p className="font-medium">{capitalCall.purpose}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transaction Type</p>
              <p className="font-medium">{capitalCall.transactionType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Use of Proceeds</p>
              <p className="font-medium">{capitalCall.useOfProceeds}</p>
            </div>
            {capitalCall.relatedInvestmentName && (
              <div>
                <p className="text-sm text-muted-foreground">Related Investment</p>
                <p className="font-medium">{capitalCall.relatedInvestmentName}</p>
              </div>
            )}
            {capitalCall.managementFeeIncluded && (
              <div>
                <p className="text-sm text-muted-foreground">Management Fee</p>
                <p className="font-medium">{formatCurrency(capitalCall.managementFeeAmount || 0, capitalCall.currency)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investor Allocations */}
      <Card>
        <CardHeader>
          <CardTitle>Investor Allocations</CardTitle>
          <CardDescription>
            {capitalCall.investorAllocations.length} investor{capitalCall.investorAllocations.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Ownership</TableHead>
                <TableHead className="text-right">Call Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capitalCall.investorAllocations.map((allocation) => (
                <TableRow key={allocation.investorId}>
                  <TableCell className="font-medium">{allocation.investorName}</TableCell>
                  <TableCell>{allocation.investorType}</TableCell>
                  <TableCell className="text-right">{allocation.ownershipPercent.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(allocation.callAmount, capitalCall.currency)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(allocation.amountPaid, capitalCall.currency)}</TableCell>
                  <TableCell className="text-right text-orange-600">{formatCurrency(allocation.amountOutstanding, capitalCall.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={allocation.status === 'Paid' ? 'default' : allocation.status === 'Overdue' ? 'destructive' : 'secondary'}>
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
            <AlertDialogTitle>Delete Capital Call</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this capital call? This action cannot be undone.
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

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Capital Call Notice</AlertDialogTitle>
            <AlertDialogDescription>
              Send this capital call notice to all investors? They will receive notification and instructions for payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSend}>
              Send Notice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
