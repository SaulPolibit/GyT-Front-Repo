'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, Trash2, Calendar, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { updateStructureNav, deleteNavEntry, Structure, NavUpdate } from '@/lib/structures-storage'
import { getInvestmentsByFundId } from '@/lib/investments-storage'
import { format } from 'date-fns'

interface StructureValuationSectionProps {
  structure: Structure
  onUpdate: () => void
}

export function StructureValuationSection({ structure, onUpdate }: StructureValuationSectionProps) {
  const [open, setOpen] = React.useState(false)
  const [totalNav, setTotalNav] = React.useState('')
  const [navPerShare, setNavPerShare] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [deleteEntryDate, setDeleteEntryDate] = React.useState<string | null>(null)

  const navHistory = structure.navHistory || []
  const hasNav = structure.currentNav !== undefined

  // Calculate reconciliation with investments
  const investments = getInvestmentsByFundId(structure.id)
  const totalInvestmentValue = investments.reduce(
    (sum, inv) => sum + (inv.totalFundPosition?.currentValue || 0),
    0
  )
  const navValue = structure.currentNav || 0
  const difference = navValue - totalInvestmentValue
  const percentageDiff = totalInvestmentValue > 0
    ? Math.abs(difference / totalInvestmentValue) * 100
    : 0
  const showWarning = hasNav && percentageDiff > 5

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: structure.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const navData = {
        totalNav: parseFloat(totalNav),
        navPerShare: navPerShare ? parseFloat(navPerShare) : undefined,
        notes: notes || undefined,
      }

      const result = updateStructureNav(structure.id, navData)

      if (result) {
        setTotalNav('')
        setNavPerShare('')
        setNotes('')
        setOpen(false)
        onUpdate()
      } else {
        toast.error('Failed to update NAV. Please try again.')
      }
    } catch (error) {
      console.error('Error updating NAV:', error)
      toast.error('Failed to update NAV. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (entryDate: string) => {
    setDeleteEntryDate(entryDate)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (deleteEntryDate) {
      const success = deleteNavEntry(structure.id, deleteEntryDate)
      if (success) {
        toast.success('NAV entry deleted successfully')
        onUpdate()
      } else {
        toast.error('Failed to delete NAV entry. Please try again.')
      }
      setShowDeleteDialog(false)
      setDeleteEntryDate(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Valuation (NAV)</CardTitle>
            <CardDescription>
              Track Net Asset Value for accurate performance reporting
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Update NAV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Update Net Asset Value</DialogTitle>
                  <DialogDescription>
                    Add a new NAV entry to track fund valuation over time
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalNav">
                      Total NAV <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="totalNav"
                      type="number"
                      step="0.01"
                      placeholder="50000000"
                      value={totalNav}
                      onChange={(e) => setTotalNav(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Current total fund NAV in {structure.currency || 'USD'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="navPerShare">NAV per Share / Unit (Optional)</Label>
                    <Input
                      id="navPerShare"
                      type="number"
                      step="0.0001"
                      placeholder="12.50"
                      value={navPerShare}
                      onChange={(e) => setNavPerShare(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      NAV divided by total shares or units outstanding
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Q1 2025 valuation based on property appraisals..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Context about this valuation update
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !totalNav}>
                    {isSubmitting ? 'Updating...' : 'Update NAV'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {hasNav ? (
          <div className="space-y-6">
            {/* Current NAV Display */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current NAV</div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(structure.currentNav!)}
                  </div>
                  {structure.navHistory && structure.navHistory.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Last updated: {formatDate(structure.navHistory[structure.navHistory.length - 1].date)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Active
                  </Badge>
                </div>
              </div>
            </div>

            {/* Reconciliation Card */}
            {investments.length > 0 && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  showWarning
                    ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800'
                    : percentageDiff > 0
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                    : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {showWarning ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    ) : percentageDiff > 0 ? (
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold mb-2">
                      {showWarning
                        ? 'NAV Reconciliation Warning'
                        : 'NAV Reconciliation'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sum of Investment Values:</span>
                        <span className="font-medium">{formatCurrency(totalInvestmentValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Structure NAV:</span>
                        <span className="font-medium">{formatCurrency(navValue)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="text-muted-foreground">Difference:</span>
                        <span className={`font-semibold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                          {totalInvestmentValue > 0 && (
                            <span className="text-xs ml-1">
                              ({percentageDiff.toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    {showWarning && (
                      <p className="text-xs text-muted-foreground mt-3">
                        ⚠️ The difference exceeds 5%. This may indicate a data quality issue or could represent fund-level items like cash reserves, accrued expenses, or management fees.
                      </p>
                    )}
                    {!showWarning && difference !== 0 && (
                      <p className="text-xs text-muted-foreground mt-3">
                        💡 This difference typically represents fund-level items such as cash reserves, accrued management fees, expenses, or other liabilities not captured at the investment level.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NAV History Table */}
            <div>
              <h4 className="text-sm font-semibold mb-3">NAV History</h4>
              {navHistory.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Date</th>
                        <th className="text-right p-3 text-sm font-medium">Total NAV</th>
                        <th className="text-right p-3 text-sm font-medium">NAV per Share</th>
                        <th className="text-left p-3 text-sm font-medium">Notes</th>
                        <th className="text-center p-3 text-sm font-medium w-[80px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...navHistory].reverse().map((entry, index) => (
                        <tr key={index} className="border-t hover:bg-muted/20">
                          <td className="p-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(entry.date)}
                            </div>
                          </td>
                          <td className="p-3 text-sm text-right font-medium">
                            {formatCurrency(entry.totalNav)}
                          </td>
                          <td className="p-3 text-sm text-right text-muted-foreground">
                            {entry.navPerShare ? formatCurrency(entry.navPerShare) : '—'}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground max-w-[200px] truncate">
                            {entry.notes || '—'}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(entry.date)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No NAV history yet</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No NAV Data</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Track your fund's Net Asset Value for accurate performance reporting and unrealized gain calculations.
              Click "Update NAV" to add your first valuation entry.
            </p>
            <Badge variant="outline">Optional Feature</Badge>
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete NAV Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this NAV entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteEntryDate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
