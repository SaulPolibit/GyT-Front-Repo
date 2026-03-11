"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  RotateCcw,
  FileCheck,
} from "lucide-react"
import type { ApprovalStatus } from "@/lib/types"

interface ApprovalActionsProps {
  currentStatus: ApprovalStatus
  onApprove: (notes?: string) => Promise<void>
  onReject: (reason: string) => Promise<void>
  onRequestChanges: (notes: string) => Promise<void>
  onSubmitForReview?: () => Promise<void>
  onSubmitForCFO?: () => Promise<void>
  isProcessing?: boolean
  disabled?: boolean
  requireCFOApproval?: boolean
  isCFO?: boolean
}

export function ApprovalActions({
  currentStatus,
  onApprove,
  onReject,
  onRequestChanges,
  onSubmitForReview,
  onSubmitForCFO,
  isProcessing = false,
  disabled = false,
  requireCFOApproval = true,
  isCFO = false,
}: ApprovalActionsProps) {
  const [showRejectDialog, setShowRejectDialog] = React.useState(false)
  const [showChangesDialog, setShowChangesDialog] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState("")
  const [changesNotes, setChangesNotes] = React.useState("")
  const [approvalNotes, setApprovalNotes] = React.useState("")

  const handleApprove = async () => {
    await onApprove(approvalNotes || undefined)
    setApprovalNotes("")
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    await onReject(rejectReason)
    setRejectReason("")
    setShowRejectDialog(false)
  }

  const handleRequestChanges = async () => {
    if (!changesNotes.trim()) return
    await onRequestChanges(changesNotes)
    setChangesNotes("")
    setShowChangesDialog(false)
  }

  // Render different actions based on current status
  const renderActions = () => {
    switch (currentStatus) {
      case 'draft':
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              This item is in draft status. Submit for review when ready.
            </p>
            {onSubmitForReview && (
              <Button
                onClick={onSubmitForReview}
                disabled={isProcessing || disabled}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
            )}
          </div>
        )

      case 'pending_review':
        // Legacy status - show as awaiting CFO for backwards compatibility
        return (
          <div className="flex items-center gap-2 text-muted-foreground bg-muted p-3 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">Awaiting CFO approval (legacy status)</span>
          </div>
        )

      case 'pending_cfo':
        return (
          <div className="flex flex-col gap-3">
            {isCFO ? (
              <>
                <p className="text-sm text-muted-foreground">
                  As CFO, provide final approval or reject this item.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing || disabled}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Final Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowChangesDialog(true)}
                    disabled={isProcessing || disabled}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isProcessing || disabled}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground bg-muted p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">Awaiting CFO approval</span>
              </div>
            )}
          </div>
        )

      case 'approved':
        return (
          <div className="flex items-center gap-2 text-foreground bg-muted p-3 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">This item has been approved</span>
          </div>
        )

      case 'rejected':
        return (
          <div className="flex items-center gap-2 text-foreground bg-muted p-3 rounded-lg">
            <XCircle className="h-5 w-5" />
            <span className="text-sm font-medium">This item has been rejected</span>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <div className="space-y-4">
        {renderActions()}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <XCircle className="h-5 w-5" />
              Reject Item
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this item. This will be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Rejection Reason *</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectReason.trim()}
            >
              {isProcessing ? "Processing..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <RotateCcw className="h-5 w-5" />
              Request Changes
            </DialogTitle>
            <DialogDescription>
              Describe the changes required. The item will be returned to the creator for revision.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="changes-notes">Required Changes *</Label>
            <Textarea
              id="changes-notes"
              value={changesNotes}
              onChange={(e) => setChangesNotes(e.target.value)}
              placeholder="Describe what needs to be changed..."
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowChangesDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestChanges}
              disabled={isProcessing || !changesNotes.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isProcessing ? "Processing..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Status badge component for approval status
export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const config: Record<ApprovalStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    draft: { label: "Draft", variant: "secondary", className: "bg-gray-100 text-gray-800" },
    pending_review: { label: "Pending Review", variant: "outline", className: "bg-muted text-foreground border-border" },
    pending_cfo: { label: "Pending", variant: "outline", className: "bg-muted text-foreground border-border" },
    approved: { label: "Approved", variant: "default", className: "bg-muted text-foreground" },
    rejected: { label: "Rejected", variant: "destructive", className: "bg-muted text-foreground" },
  }

  const { label, variant, className } = config[status] || config.draft

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

export default ApprovalActions
