'use client'

import * as React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { IconGripVertical, IconTrash, IconEdit } from '@tabler/icons-react'
import { DashboardWidget } from '@/lib/dashboard-storage'

interface DraggableChartCardProps {
  widget: DashboardWidget
  onDelete?: (widgetId: string) => void
  onEdit?: (widgetId: string) => void
  children: React.ReactNode
  title?: string
  description?: string
  isDraggable?: boolean
}

export function DraggableChartCard({
  widget,
  onDelete,
  onEdit,
  children,
  title,
  description,
  isDraggable = true,
}: DraggableChartCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: !isDraggable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Card className={`${isDragging ? 'shadow-lg' : ''}`}>
        {/* Drag handle and actions */}
        {isDraggable && (
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {/* Drag handle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <IconGripVertical className="h-4 w-4" />
            </Button>

            {/* Edit button (for all widgets) */}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onEdit(widget.id)}
              >
                <IconEdit className="h-4 w-4" />
              </Button>
            )}

            {/* Delete button (for all widgets) */}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Card content */}
        {title || description ? (
          <>
            <CardHeader>
              {title && <CardTitle className="pr-24">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>{children}</CardContent>
          </>
        ) : (
          <div className="p-6">{children}</div>
        )}
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chart? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) {
                  onDelete(widget.id)
                }
                setShowDeleteDialog(false)
              }}
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

// Non-draggable version for default widgets that shouldn't be moved
export function StaticChartCard({
  children,
  title,
  description,
}: {
  children: React.ReactNode
  title?: string
  description?: string
}) {
  return (
    <Card>
      {title || description ? (
        <>
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </>
      ) : (
        <div className="p-6">{children}</div>
      )}
    </Card>
  )
}
