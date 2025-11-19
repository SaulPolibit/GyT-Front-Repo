"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { IconBuilding, IconUpload, IconUserPlus, IconDotsVertical, IconShieldCheck } from '@tabler/icons-react'
import { getFirmSettings, saveFirmSettings, FirmSettings } from '@/lib/firm-settings-storage'
import { getUsers, deleteUser, User, getRoleLabel, updateUser } from '@/lib/user-management-storage'
import { getNotificationSettings, saveNotificationSettings, updateEventSetting, NotificationSettings, NotificationEvent, getFrequencyLabel } from '@/lib/notification-settings-storage'
import { InviteUserModal } from '@/components/invite-user-modal'
import { PermissionsMatrixDialog } from '@/components/permissions-matrix-dialog'
import { seedDemoData, verifyDemoData } from '@/lib/demo-data-seeder'

export default function SettingsPage() {
  const [settings, setSettings] = useState<FirmSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // User Management state
  const [users, setUsers] = useState<User[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  // Notification Settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)

  useEffect(() => {
    const loadedSettings = getFirmSettings()
    setSettings(loadedSettings)

    const loadedUsers = getUsers()
    setUsers(loadedUsers)

    const loadedNotifications = getNotificationSettings()
    setNotificationSettings(loadedNotifications)
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      if (settings) {
        setSettings({
          ...settings,
          firmLogo: reader.result as string
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!settings) return

    setIsSaving(true)
    setSaveMessage('')

    try {
      saveFirmSettings(settings)
      setSaveMessage('Settings saved successfully!')

      // Trigger a page reload to update the sidebar
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveMessage('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // User Management handlers
  const handleUserInvited = () => {
    const loadedUsers = getUsers()
    setUsers(loadedUsers)
  }

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId)
    setDeleteUserDialogOpen(true)
  }

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete)
      const loadedUsers = getUsers()
      setUsers(loadedUsers)
      toast.success('User removed successfully')
      setDeleteUserDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Notification Settings handlers
  const handleUpdateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    if (!notificationSettings) return
    const newSettings = saveNotificationSettings(updates)
    setNotificationSettings(newSettings)
  }

  const handleUpdateEventSetting = (eventId: string, updates: Partial<NotificationEvent>) => {
    const newSettings = updateEventSetting(eventId, updates)
    setNotificationSettings(newSettings)
  }

  const handleSeedDemoData = () => {
    try {
      seedDemoData()
      // Verify the data was saved
      setTimeout(() => {
        verifyDemoData()
      }, 100)
      toast.success('Demo data loaded successfully! Refresh the page to see the data.')
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error seeding demo data:', error)
      toast.error('Failed to load demo data. Check browser console for details.')
    }
  }

  const renderEventSetting = (event: NotificationEvent) => {
    return (
      <div key={event.id} className="flex items-center justify-between py-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label htmlFor={event.id}>{event.name}</Label>
            <Switch
              id={event.id}
              checked={event.enabled}
              onCheckedChange={(checked) =>
                handleUpdateEventSetting(event.id, { enabled: checked })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {event.description}
          </p>
        </div>

        {event.enabled && (
          <Select
            value={event.frequency}
            onValueChange={(value) =>
              handleUpdateEventSetting(event.id, { frequency: value as any })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real-time">Real-time</SelectItem>
              <SelectItem value="daily-digest">Daily Digest</SelectItem>
              <SelectItem value="weekly-summary">Weekly Summary</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    )
  }

  if (!settings || !notificationSettings) {
    return <div className="flex-1 p-6">Loading...</div>
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your investment firm settings and preferences
        </p>
      </div>

      {/* Firm Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Firm Branding</CardTitle>
          <CardDescription>
            Customize your firm's name and logo that appears in the sidebar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Firm Name */}
          <div className="space-y-2">
            <Label htmlFor="firmName">Firm Name</Label>
            <Input
              id="firmName"
              value={settings.firmName}
              onChange={(e) => setSettings({ ...settings, firmName: e.target.value })}
              placeholder="e.g., Polibit Capital"
            />
            <p className="text-xs text-muted-foreground">
              This name will appear at the top of the sidebar
            </p>
          </div>

          {/* Firm Logo */}
          <div className="space-y-2">
            <Label htmlFor="firmLogo">Firm Logo</Label>
            <div className="flex items-center gap-4">
              {settings.firmLogo ? (
                <div className="w-12 h-12 rounded border flex items-center justify-center overflow-hidden bg-white">
                  <img src={settings.firmLogo} alt="Firm logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded border flex items-center justify-center bg-muted">
                  <IconBuilding className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1">
                <Input
                  id="firmLogo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('firmLogo')?.click()}
                >
                  <IconUpload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or SVG. Max size 5MB.
                </p>
              </div>

              {settings.firmLogo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettings({ ...settings, firmLogo: null })}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Firm Details */}
      <Card>
        <CardHeader>
          <CardTitle>Firm Details</CardTitle>
          <CardDescription>
            Additional information about your investment firm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firmEmail">Firm Email</Label>
              <Input
                id="firmEmail"
                type="email"
                value={settings.firmEmail || ''}
                onChange={(e) => setSettings({ ...settings, firmEmail: e.target.value })}
                placeholder="contact@firm.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firmPhone">Firm Phone</Label>
              <Input
                id="firmPhone"
                type="tel"
                value={settings.firmPhone || ''}
                onChange={(e) => setSettings({ ...settings, firmPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firmWebsite">Website</Label>
            <Input
              id="firmWebsite"
              type="url"
              value={settings.firmWebsite || ''}
              onChange={(e) => setSettings({ ...settings, firmWebsite: e.target.value })}
              placeholder="https://www.firm.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firmAddress">Address</Label>
            <Input
              id="firmAddress"
              value={settings.firmAddress || ''}
              onChange={(e) => setSettings({ ...settings, firmAddress: e.target.value })}
              placeholder="123 Main St, City, State, ZIP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firmDescription">Description</Label>
            <textarea
              id="firmDescription"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={settings.firmDescription || ''}
              onChange={(e) => setSettings({ ...settings, firmDescription: e.target.value })}
              placeholder="Brief description of your investment firm..."
            />
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage platform users and their access levels
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPermissionsDialog(true)}
              >
                <IconShieldCheck className="h-4 w-4 mr-2" />
                View Permissions
              </Button>
              <Button size="sm" onClick={() => setShowInviteModal(true)}>
                <IconUserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Roles Explanation */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Platform Roles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Polibit offers four user roles with different permissions:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Admin</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Full access to entire platform and configurations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Fund Manager</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Can create structures, investors, investments and view everything
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Focused on capital calls and distributions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Read-Only</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View only access, perfect for auditors or advisors
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* User List */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Active Users</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === 'active'
                            ? 'default'
                            : user.status === 'pending'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setShowPermissionsDialog(true)}
                          >
                            View Permissions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600"
                          >
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure email notifications for important events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableEmail">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="enableEmail"
                checked={notificationSettings.enableEmailNotifications}
                onCheckedChange={(checked) =>
                  handleUpdateNotificationSettings({ enableEmailNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableInApp">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications in the platform
                </p>
              </div>
              <Switch
                id="enableInApp"
                checked={notificationSettings.enableInAppNotifications}
                onCheckedChange={(checked) =>
                  handleUpdateNotificationSettings({ enableInAppNotifications: checked })
                }
              />
            </div>
          </div>

          <Separator />

          {/* Frequency Descriptions */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
            <p><strong>Real-time:</strong> Immediate notifications when event occurs</p>
            <p><strong>Daily Digest:</strong> Daily summary of events (sent at 9:00 AM)</p>
            <p><strong>Weekly Summary:</strong> Weekly summary (sent on Mondays)</p>
            <p><strong>Disabled:</strong> Do not receive notifications for this event</p>
          </div>

          <Separator />

          {/* Event categories */}
          <div className="space-y-6">
            {/* Capital Operations */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Capital Operations</h4>
              <div className="space-y-4">
                {renderEventSetting(notificationSettings.capitalCallIssued)}
                {renderEventSetting(notificationSettings.distributionExecuted)}
                {renderEventSetting(notificationSettings.paymentOverdue)}
                {renderEventSetting(notificationSettings.paymentReceived)}
              </div>
            </div>

            {/* Reports */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Reports</h4>
              <div className="space-y-4">
                {renderEventSetting(notificationSettings.reportGenerated)}
                {renderEventSetting(notificationSettings.quarterlyReportDue)}
              </div>
            </div>

            {/* Investors */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Investors</h4>
              <div className="space-y-4">
                {renderEventSetting(notificationSettings.newInvestorAdded)}
                {renderEventSetting(notificationSettings.investorDocumentUploaded)}
              </div>
            </div>

            {/* System */}
            <div>
              <h4 className="text-sm font-semibold mb-4">System</h4>
              <div className="space-y-4">
                {renderEventSetting(notificationSettings.systemMaintenance)}
                {renderEventSetting(notificationSettings.securityAlert)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Data */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100">Demo Data Setup</CardTitle>
          <CardDescription className="text-amber-800 dark:text-amber-200">
            Load realistic sample data for demonstrations and testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            This will create sample structures, investors, capital calls, and distributions.
            Perfect for showcasing the platform to clients or for testing features.
          </p>
          <div className="bg-white dark:bg-slate-950 p-3 rounded border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">Sample Data Includes:</p>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 ml-4 list-disc">
              <li>3 Fund Structures (Real Estate, Tech, Private Debt)</li>
              <li>5 Investors with varied fund commitments</li>
              <li>2 Capital Calls with payment history</li>
              <li>3 Distributions showing different scenarios</li>
            </ul>
          </div>
          <Button onClick={handleSeedDemoData} variant="outline" className="w-full border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900">
            Load Demo Data
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {saveMessage && (
            <p className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage}
            </p>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Modals */}
      <InviteUserModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onUserInvited={handleUserInvited}
      />

      <PermissionsMatrixDialog
        open={showPermissionsDialog}
        onOpenChange={setShowPermissionsDialog}
      />

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user? This action cannot be undone and will revoke their access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
