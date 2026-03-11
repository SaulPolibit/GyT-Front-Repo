"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle,
  XCircle,
  Clock,
  Send,
  RotateCcw,
  FileCheck,
  User,
  MessageSquare,
} from "lucide-react"
import type { ApprovalStatus } from "@/lib/types"

export interface ApprovalHistoryEntry {
  id: string
  action: 'created' | 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'changes_requested' | 'cfo_submitted' | 'cfo_approved'
  fromStatus?: ApprovalStatus
  toStatus: ApprovalStatus
  userId: string
  userName: string
  timestamp: string
  notes?: string
}

interface ApprovalHistoryProps {
  history: ApprovalHistoryEntry[]
  className?: string
}

export function ApprovalHistory({ history, className }: ApprovalHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Approval History</CardTitle>
          <CardDescription>No approval history available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getActionIcon = (action: ApprovalHistoryEntry['action']) => {
    switch (action) {
      case 'created':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'submitted':
        return <Send className="h-4 w-4 text-muted-foreground" />
      case 'reviewed':
        return <FileCheck className="h-4 w-4 text-muted-foreground" />
      case 'approved':
      case 'cfo_approved':
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-muted-foreground" />
      case 'changes_requested':
        return <RotateCcw className="h-4 w-4 text-muted-foreground" />
      case 'cfo_submitted':
        return <FileCheck className="h-4 w-4 text-muted-foreground" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionLabel = (action: ApprovalHistoryEntry['action']) => {
    switch (action) {
      case 'created':
        return 'Created'
      case 'submitted':
        return 'Submitted for Review'
      case 'reviewed':
        return 'Reviewed'
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'changes_requested':
        return 'Changes Requested'
      case 'cfo_submitted':
        return 'Sent to CFO'
      case 'cfo_approved':
        return 'CFO Approved'
      default:
        return action
    }
  }

  const getActionColor = (action: ApprovalHistoryEntry['action']) => {
    switch (action) {
      case 'approved':
      case 'cfo_approved':
        return 'bg-muted border-border'
      case 'rejected':
        return 'bg-muted border-border'
      case 'changes_requested':
        return 'bg-muted border-border'
      case 'cfo_submitted':
        return 'bg-muted border-border'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className={`overflow-hidden ${className || ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Approval History
        </CardTitle>
        <CardDescription>
          {history.length} event{history.length !== 1 ? 's' : ''} recorded
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <ScrollArea className="h-full max-h-[250px] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

            {/* Timeline entries */}
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative pl-8">
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center ${getActionColor(entry.action)}`}>
                    {getActionIcon(entry.action)}
                  </div>

                  {/* Entry content */}
                  <div className={`rounded-lg border p-3 ${getActionColor(entry.action)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {getActionLabel(entry.action)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <User className="h-3 w-3" />
                      <span>{entry.userName}</span>
                    </div>

                    {entry.notes && (
                      <div className="mt-2 text-sm text-muted-foreground bg-white/50 rounded p-2">
                        <div className="flex items-start gap-1">
                          <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{entry.notes}</span>
                        </div>
                      </div>
                    )}

                    {entry.fromStatus && entry.toStatus && entry.fromStatus !== entry.toStatus && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <StatusBadge status={entry.fromStatus} size="sm" />
                        <span className="text-muted-foreground">→</span>
                        <StatusBadge status={entry.toStatus} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Small status badge for timeline
function StatusBadge({ status, size = 'default' }: { status: ApprovalStatus; size?: 'default' | 'sm' }) {
  const config: Record<ApprovalStatus, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
    pending_review: { label: "Pending Review", className: "bg-muted text-foreground" },
    pending_cfo: { label: "Pending", className: "bg-muted text-foreground" },
    approved: { label: "Approved", className: "bg-muted text-foreground" },
    rejected: { label: "Rejected", className: "bg-muted text-foreground" },
  }

  const { label, className } = config[status] || config.draft
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span className={`rounded-full font-medium ${className} ${sizeClass}`}>
      {label}
    </span>
  )
}

export default ApprovalHistory
