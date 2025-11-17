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
import { getInvestorByEmail, getCurrentInvestorEmail, getInvestorAvatar, setInvestorAvatar } from "@/lib/lp-portal-helpers"
import { getInvestors, updateInvestor } from "@/lib/investors-storage"
import { toast } from "sonner"

export default function AccountPage() {
  const [currentEmail, setCurrentEmail] = React.useState('')
  const [currentInvestorId, setCurrentInvestorId] = React.useState('')
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    avatarUrl: '',
    languagePreference: 'english',
  })
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const email = getCurrentInvestorEmail()
    setCurrentEmail(email)

    const investor = getInvestorByEmail(email)
    if (investor) {
      setCurrentInvestorId(investor.id)
      const savedAvatar = getInvestorAvatar(investor.id)
      setFormData({
        name: investor.name,
        email: investor.email,
        phone: investor.phone || '',
        avatarUrl: savedAvatar || '',
        languagePreference: 'english',
      })
    } else {
      // Set default values if no investor found
      setFormData({
        name: 'Investor',
        email: email,
        phone: '',
        avatarUrl: '',
        languagePreference: 'english',
      })
    }
  }, [])

  const handleProfileUpdate = () => {
    const investor = getInvestorByEmail(currentEmail)
    if (!investor) {
      toast.error('No investor profile found. Please contact your fund administrator to set up your account.')
      return
    }

    const updated = updateInvestor(investor.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
    })

    if (updated) {
      // Save avatar separately
      if (formData.avatarUrl) {
        setInvestorAvatar(investor.id, formData.avatarUrl)
      }

      toast.success('Profile updated successfully')
      if (formData.email !== currentEmail) {
        localStorage.setItem('polibit_current_investor_email', formData.email)
        setCurrentEmail(formData.email)
      }
    } else {
      toast.error('Failed to update profile')
    }
  }

  const handlePasswordChange = () => {
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

    toast.success('Password changed successfully')
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
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

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    return parts.length > 1
      ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
      : name.substring(0, 2).toUpperCase()
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
                <AvatarImage src={formData.avatarUrl || '/avatars/investor.jpg'} alt={formData.name} />
                <AvatarFallback>{getInitials(formData.name)}</AvatarFallback>
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

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
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
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Español</SelectItem>
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
