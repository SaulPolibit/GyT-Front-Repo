"use client"

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getRoleDescription, inviteUser } from '@/lib/user-management-storage'

interface InviteUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserInvited?: () => void
}

export function InviteUserModal({ open, onOpenChange, onUserInvited }: InviteUserModalProps) {
  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState<number>(4) // Default to Read-Only
  const [isInviting, setIsInviting] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleInvite = async () => {
    setError('')

    // Validate email
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setIsInviting(true)

    try {
      // Invite user (creates pending user)
      inviteUser(email, role, 'current-user') // TODO: Get actual current user

      // Reset form
      setEmail('')
      setRole(4) // Read-Only

      // Close modal
      onOpenChange(false)

      // Notify parent
      onUserInvited?.()
    } catch (err) {
      console.error('Error inviting user:', err)
      setError('Failed to invite user. Please try again.')
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation to join your investment management platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role.toString()} onValueChange={(value) => setRole(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Admin</SelectItem>
                <SelectItem value="2">Operations</SelectItem>
                <SelectItem value="4">Read-Only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getRoleDescription(role)}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isInviting}
          >
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={isInviting}>
            {isInviting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
