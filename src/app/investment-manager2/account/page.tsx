"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle2, User, Mail, Lock, Globe, ArrowLeft, Camera } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { useTranslation } from '@/hooks/useTranslation'

export default function AccountPage() {
  const [showSuccess, setShowSuccess] = useState(false)
  const { userData, updateUserData } = useUser()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [accountData, setAccountData] = useState({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    languagePreference: userData.languagePreference,
    avatar: userData.avatar
  })

  // Update local state when userData changes
  useEffect(() => {
    setAccountData(prev => ({
      ...prev,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      languagePreference: userData.languagePreference,
      avatar: userData.avatar
    }))
  }, [userData])

  const updateField = (field: string, value: string) => {
    setAccountData(prev => ({ ...prev, [field]: value }))
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // Create object URL for preview
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setAccountData(prev => ({ ...prev, avatar: base64String }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveChanges = () => {
    // Validate passwords match if changing password
    if (accountData.newPassword && accountData.newPassword !== accountData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    // Save to UserContext (which saves to localStorage)
    updateUserData({
      firstName: accountData.firstName,
      lastName: accountData.lastName,
      email: accountData.email,
      languagePreference: accountData.languagePreference as 'english' | 'spanish',
      avatar: accountData.avatar
    })

    // Here you would typically also make an API call to save changes to backend
    console.log('Account changes saved:', accountData)

    // Show success message
    setShowSuccess(true)

    // Clear password fields
    setAccountData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }))

    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/investment-manager">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.account.backToDashboard}
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{t.account.title}</h1>
              <p className="text-sm text-muted-foreground">{t.account.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {t.account.actions.successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Picture */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <CardTitle>{t.account.profilePicture.title}</CardTitle>
            </div>
            <CardDescription>
              {t.account.profilePicture.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={accountData.avatar} alt="Profile" />
                <AvatarFallback className="text-2xl">
                  {accountData.firstName.charAt(0)}{accountData.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {t.account.profilePicture.uploadButton}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t.account.profilePicture.fileInfo}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>{t.account.personalInfo.title}</CardTitle>
            </div>
            <CardDescription>
              {t.account.personalInfo.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t.account.personalInfo.firstName} *</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={accountData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t.account.personalInfo.lastName} *</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={accountData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <Label htmlFor="email">{t.account.personalInfo.email} *</Label>
              </div>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={accountData.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t.account.personalInfo.emailDescription}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Language Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>{t.account.language.title}</CardTitle>
            </div>
            <CardDescription>
              {t.account.language.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">{t.account.language.platformLanguage} *</Label>
              <Select
                value={accountData.languagePreference}
                onValueChange={(value) => updateField('languagePreference', value)}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t.account.language.languageDescription}
              </p>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-700 text-sm">
                <strong>{t.account.language.noteTitle}</strong> {accountData.languagePreference === 'english' ? t.account.language.noteEnglish : t.account.language.noteSpanish}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Password Management */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>{t.account.password.title}</CardTitle>
            </div>
            <CardDescription>
              {t.account.password.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t.account.password.currentPassword}</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder={t.account.password.currentPasswordPlaceholder}
                value={accountData.currentPassword}
                onChange={(e) => updateField('currentPassword', e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t.account.password.newPassword}</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder={t.account.password.newPasswordPlaceholder}
                value={accountData.newPassword}
                onChange={(e) => updateField('newPassword', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t.account.password.passwordRequirement}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.account.password.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t.account.password.confirmPasswordPlaceholder}
                value={accountData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
              />
            </div>

            {accountData.newPassword && accountData.confirmPassword &&
             accountData.newPassword !== accountData.confirmPassword && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-sm">
                  {t.account.password.passwordMismatch}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Link href="/investment-manager">
            <Button variant="outline">{t.account.actions.cancel}</Button>
          </Link>
          <Button onClick={handleSaveChanges} className="bg-primary hover:bg-primary/90">
            {t.account.actions.saveChanges}
          </Button>
        </div>

        {/* Additional Information */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>{t.account.support.needHelp}</strong> {t.account.support.contactText} <a href="mailto:support@polibit.io" className="text-primary hover:underline">support@polibit.io</a>
          </p>
        </div>
      </div>
    </div>
  )
}
