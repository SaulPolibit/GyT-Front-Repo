"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Camera, Save } from "lucide-react"
import { getCurrentUser, getAuthToken } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { toast } from "sonner"

export default function AccountPage() {
  const [loading, setLoading] = React.useState(true)
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatarUrl: '',
    languagePreference: 'en',
  })
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = () => {
    const user = getCurrentUser()

    if (user) {
      // Parse full name into first and last name
      const nameParts = user.name?.split(' ') || ['', '']
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      setFormData({
        firstName,
        lastName,
        email: user.email || '',
        phone: user.phoneNumber || '',
        avatarUrl: '',
        languagePreference: user.appLanguage || 'en',
      })
    }

    setLoading(false)
  }

  const handleProfileUpdate = async () => {
    const token = getAuthToken()

    if (!token) {
      toast.error('Authentication required. Please log in again.')
      return
    }

    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        appLanguage: formData.languagePreference,
      }

      // Only include phone if it's not empty
      if (formData.phone) {
        payload.address = formData.phone // Using address field for phone number as per API spec
      }

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.updateUserProfile), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const result = await response.json()

      if (result.success) {
        // Update localStorage with new user data
        const currentUser = getCurrentUser()
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phoneNumber: formData.phone,
            appLanguage: formData.languagePreference,
          }
          localStorage.setItem('polibit_user', JSON.stringify(updatedUser))
        }

        toast.success('Profile updated successfully')
      } else {
        toast.error(result.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    const token = getAuthToken()

    if (!token) {
      toast.error('Authentication required. Please log in again.')
      return
    }

    try {
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.updateUserProfile), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to change password')
      }

      const result = await response.json()

      if (result.success) {
        toast.success('Password changed successfully')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        toast.error(result.message || 'Failed to change password')
      }
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Failed to change password')
    }
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Read file and convert to data URL
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setFormData({ ...formData, avatarUrl: dataUrl })
      toast.success('Photo updated! Click "Save Changes" to apply.')
    }
    reader.onerror = () => {
      toast.error('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const getInitials = (firstName: string, lastName: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading account details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile information and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.avatarUrl || '/avatars/investor.jpg'} alt={`${formData.firstName} ${formData.lastName}`} />
                <AvatarFallback>{getInitials(formData.firstName, formData.lastName)}</AvatarFallback>
              </Avatar>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button variant="outline" size="sm" onClick={handlePhotoClick}>
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or GIF (max 5MB)
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <Button onClick={handleProfileUpdate} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Language Preference</CardTitle>
              <CardDescription>
                Choose your preferred language
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.languagePreference}
                  onValueChange={(value) => setFormData({ ...formData, languagePreference: value })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleProfileUpdate} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Preference
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>

              <Button onClick={handlePasswordChange} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
