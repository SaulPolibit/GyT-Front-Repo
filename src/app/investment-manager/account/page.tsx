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
import { CheckCircle2, User, Mail, Lock, Globe, ArrowLeft, Camera, Wallet, Copy, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { useTranslation } from '@/hooks/useTranslation'
import { useRouter, useSearchParams } from 'next/navigation'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken, updateUserProfile } from '@/lib/auth-storage'
import { Suspense } from 'react'

function AccountPageContent() {
  const [showSuccess, setShowSuccess] = useState(false)
  const { userData, updateUserData } = useUser()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Wallet state
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoadingWallet, setIsLoadingWallet] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [copiedWallet, setCopiedWallet] = useState(false)

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

  // Load wallet address from localStorage on mount
  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      const authState = localStorage.getItem('auth_state')
      if (authState) {
        const parsedState = JSON.parse(authState)
        if (parsedState.user?.walletAddress) {
          setWalletAddress(parsedState.user.walletAddress)
        }
      }
    }
  }, [])

  // Handle OAuth callback for wallet linking
  useEffect(() => {
    const code = searchParams.get('code')
    const storedVerifier = sessionStorage.getItem('prospera_code_verifier')
    const storedNonce = sessionStorage.getItem('prospera_nonce')

    if (code && storedVerifier && storedNonce) {
      console.log('[Wallet Link] OAuth callback detected')
      handleWalletCallback(code, storedVerifier, storedNonce)
    }
  }, [searchParams])

  const handleCreateWallet = async () => {
    try {
      setIsLoadingWallet(true)
      setWalletError(null)

      console.log('[Wallet Link] Requesting auth URL...')

      // Construct the full redirect URI for this page
      const redirectUri = `${window.location.origin}/investment-manager/account`

      const response = await fetch(getApiUrl('/api/custom/prospera/auth-url'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectUri }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate auth URL')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to generate auth URL')
      }

      // Store verifier and nonce for callback
      sessionStorage.setItem('prospera_code_verifier', data.codeVerifier)
      sessionStorage.setItem('prospera_nonce', data.nonce)

      console.log('[Wallet Link] Redirecting to Próspera OAuth...')

      // Redirect to Próspera OAuth
      window.location.href = data.authUrl
    } catch (error) {
      console.error('[Wallet Link] Error:', error)
      setWalletError(error instanceof Error ? error.message : 'Failed to initiate wallet creation')
      setIsLoadingWallet(false)
    }
  }

  const handleWalletCallback = async (code: string, codeVerifier: string, nonce: string) => {
    setIsLoadingWallet(true)
    setWalletError(null)

    try {
      console.log('[Wallet Link] Processing OAuth callback...')

      const token = getAuthToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Construct the redirect URI (must match what was used in the auth request)
      const redirectUri = `${window.location.origin}/investment-manager/account`

      const response = await fetch(getApiUrl('/api/custom/prospera/link-wallet'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, codeVerifier, nonce, redirectUri }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to link wallet')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to link wallet')
      }

      console.log('[Wallet Link] Wallet linked successfully')

      // Update local state
      setWalletAddress(data.walletAddress)

      // Update localStorage
      updateUserProfile({ walletAddress: data.walletAddress })

      // Clear OAuth params from URL
      window.history.replaceState({}, '', '/investment-manager/account')

      // Clear session storage
      sessionStorage.removeItem('prospera_code_verifier')
      sessionStorage.removeItem('prospera_nonce')

      toast.success('Wallet created and linked successfully!')
    } catch (error) {
      console.error('[Wallet Link] Error:', error)
      setWalletError(error instanceof Error ? error.message : 'Failed to link wallet')

      // Clear URL params even on error
      window.history.replaceState({}, '', '/investment-manager/account')
    } finally {
      setIsLoadingWallet(false)
    }
  }

  const handleCopyWallet = async () => {
    if (!walletAddress) return

    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopiedWallet(true)
      toast.success('Wallet address copied to clipboard')

      setTimeout(() => {
        setCopiedWallet(false)
      }, 2000)
    } catch (error) {
      console.error('Error copying wallet address:', error)
      toast.error('Failed to copy wallet address')
    }
  }

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

        {/* Language Preferences - Hidden */}
        {false && (
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
        )}

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

        {/* Wallet Information */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle>Wallet Information</CardTitle>
            </div>
            <CardDescription>
              Your Crossmint blockchain wallet linked to Próspera
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingWallet ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="ml-3 text-muted-foreground">Creating wallet...</span>
              </div>
            ) : walletAddress ? (
              <>
                <div className="space-y-2">
                  <Label>Wallet Address</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-sm">
                      <span className="flex-1 truncate" title={walletAddress}>
                        {walletAddress}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyWallet}
                      title="Copy wallet address"
                    >
                      {copiedWallet ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This is your EVM-compatible smart wallet address on Polygon. Use it to receive digital assets.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Wallet Type</span>
                    <span className="font-medium">EVM Smart Wallet</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-medium">Polygon (Amoy Testnet)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">Crossmint</span>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm text-blue-900">
                    <strong className="font-semibold">Note:</strong> This wallet was created and linked to your Próspera account. Keep your wallet address safe and only share it with trusted parties.
                  </p>
                </div>
              </>
            ) : (
              <>
                {walletError && (
                  <Alert className="border-red-200 bg-red-50 mb-4">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {walletError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
                  <Wallet className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-900 mb-2">
                    <strong className="font-semibold">No wallet found</strong>
                  </p>
                  <p className="text-xs text-yellow-800 mb-4">
                    Create a blockchain wallet linked to your Próspera account to receive and manage digital assets.
                  </p>
                  <Button
                    onClick={handleCreateWallet}
                    disabled={isLoadingWallet}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoadingWallet ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Wallet...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 mr-2" />
                        Create Wallet with eProspera
                      </>
                    )}
                  </Button>
                </div>
              </>
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

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AccountPageContent />
    </Suspense>
  )
}
