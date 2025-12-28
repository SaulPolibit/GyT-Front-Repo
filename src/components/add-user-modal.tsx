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
import { getRoleDescription } from '@/lib/user-management-storage'
import { getAuthToken } from '@/lib/auth-storage'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { toast } from 'sonner'
import { IconEye, IconEyeOff } from '@tabler/icons-react'

interface AddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserAdded?: () => void
  currentUserRole: number // 0=Root, 1=Admin
}

export function AddUserModal({ open, onOpenChange, onUserAdded, currentUserRole }: AddUserModalProps) {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [role, setRole] = React.useState<number>(4) // Default to Read-Only
  const [isAdding, setIsAdding] = React.useState(false)
  const [error, setError] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    // Root (0) can add: Root, Admin, Operations, Read-Only
    // Admin (1) can add: Admin, Operations, Read-Only (NOT Root)
    if (currentUserRole === 0) {
      return [
        { value: 0, label: 'Root', description: getRoleDescription(0) },
        { value: 1, label: 'Admin', description: getRoleDescription(1) },
        { value: 2, label: 'Operations', description: getRoleDescription(2) },
        { value: 4, label: 'Read-Only', description: getRoleDescription(4) },
      ]
    } else {
      // Admin can't add Root users
      return [
        { value: 1, label: 'Admin', description: getRoleDescription(1) },
        { value: 2, label: 'Operations', description: getRoleDescription(2) },
        { value: 4, label: 'Read-Only', description: getRoleDescription(4) },
      ]
    }
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setRole(4)
    setError('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleAddUser = async () => {
    setError('')

    // Validate name
    if (!name.trim()) {
      setError('Please enter the user\'s name')
      return
    }

    // Validate email
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    // Validate password
    if (!password) {
      setError('Please enter a password')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate role (Admin cannot add Root)
    if (currentUserRole === 1 && role === 0) {
      setError('Admins cannot create Root users')
      return
    }

    setIsAdding(true)

    try {
      const token = getAuthToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.createUser),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' ') || '',
            email,
            password,
            role,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create user')
      }

      toast.success(`User ${name} created successfully`)

      // Reset form
      resetForm()

      // Close modal
      onOpenChange(false)

      // Notify parent
      onUserAdded?.()
    } catch (err) {
      console.error('Error adding user:', err)
      setError(err instanceof Error ? err.message : 'Failed to add user. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>
            Create a new user account for your investment management platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
                {getAvailableRoles().map((r) => (
                  <SelectItem key={r.value} value={r.value.toString()}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getRoleDescription(role)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>
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
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button onClick={handleAddUser} disabled={isAdding}>
            {isAdding ? 'Creating...' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
