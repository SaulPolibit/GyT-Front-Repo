"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Camera, Save, Wallet, Copy, CheckCircle2 } from "lucide-react"
import { getCurrentUser, getAuthToken, updateUserProfile } from "@/lib/auth-storage"
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
    walletAddress: '',
  })
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [copiedWallet, setCopiedWallet] = React.useState(false)
  const [walletBalances, setWalletBalances] = React.useState<any[]>([])
  const [loadingBalances, setLoadingBalances] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    loadUserData()
  }, [])

  React.useEffect(() => {
    if (formData.walletAddress) {
      loadWalletBalances()
    }
  }, [formData.walletAddress])

  const loadUserData = () => {
    const user = getCurrentUser()
    console.log('[Account] Loading user data from localStorage:', user)

    if (user) {
      // Construct full image URL if profileImage exists
      let avatarUrl = ''
      if (user.profileImage) {
        console.log('[Account] User has profileImage:', user.profileImage)
        // If profileImage starts with http:// or https://, use it as-is
        // Otherwise, prepend the API base URL
        avatarUrl = user.profileImage.startsWith('http')
          ? user.profileImage
          : `${API_CONFIG.baseUrl}${user.profileImage}`
        console.log('[Account] Constructed avatarUrl:', avatarUrl)
      } else {
        console.log('[Account] No profileImage in user object')
      }

      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phoneNumber || '', // Load phone number from localStorage
        avatarUrl: avatarUrl,
        languagePreference: user.appLanguage || 'en',
        walletAddress: user.walletAddress || '',
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
        phoneNumber: formData.phone || undefined,
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
        toast.success('Profile updated successfully')

        // Update localStorage with new user data
        updateUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        })
      } else {
        toast.error(result.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleLanguageUpdate = async () => {
    const token = getAuthToken()

    if (!token) {
      toast.error('Authentication required. Please log in again.')
      return
    }

    try {
      const payload = {
        appLanguage: formData.languagePreference,
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
        throw new Error('Failed to update language preference')
      }

      const result = await response.json()

      if (result.success) {
        toast.success('Language preference updated successfully')

        // Update localStorage with new language preference
        updateUserProfile({
          appLanguage: formData.languagePreference,
        })
      } else {
        toast.error(result.message || 'Failed to update language preference')
      }
    } catch (error) {
      console.error('Error updating language preference:', error)
      toast.error('Failed to update language preference')
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

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const token = getAuthToken()

    if (!token) {
      toast.error('Authentication required. Please log in again.')
      return
    }

    try {
      // Create FormData and append the file
      const formData = new FormData()
      formData.append('profileImage', file)

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.uploadProfileImage), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload profile image')
      }

      const result = await response.json()

      if (result.success && result.data.profileImage) {
        console.log('[Account] Profile image upload response:', result.data)

        // Construct full image URL
        const fullImageUrl = result.data.profileImage.startsWith('http')
          ? result.data.profileImage
          : `${API_CONFIG.baseUrl}${result.data.profileImage}`

        console.log('[Account] Full image URL:', fullImageUrl)
        console.log('[Account] Saving to localStorage:', result.data.profileImage)

        // Update state with new image URL
        setFormData(prev => ({ ...prev, avatarUrl: fullImageUrl }))

        // Update localStorage with new profile image
        updateUserProfile({
          profileImage: result.data.profileImage,
        })
        console.log('[Account] Profile image updated in auth state')

        toast.success('Profile photo updated successfully')
      } else {
        toast.error(result.message || 'Failed to upload profile image')
      }
    } catch (error) {
      console.error('Error uploading profile image:', error)
      toast.error('Failed to upload profile image')
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleCopyWallet = async () => {
    if (!formData.walletAddress) return

    try {
      await navigator.clipboard.writeText(formData.walletAddress)
      setCopiedWallet(true)
      toast.success('Wallet address copied to clipboard')

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedWallet(false)
      }, 2000)
    } catch (error) {
      console.error('Error copying wallet address:', error)
      toast.error('Failed to copy wallet address')
    }
  }

  const loadWalletBalances = async () => {
    if (!formData.walletAddress) return

    setLoadingBalances(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No authentication token found')
        return
      }

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getWalletBalances), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch wallet balances')
      }

      const data = await response.json()
      if (data.success && data.data) {
        setWalletBalances(data.data.balances || [])
      }
    } catch (error) {
      console.error('Error loading wallet balances:', error)
      toast.error('Failed to load wallet balances')
    } finally {
      setLoadingBalances(false)
    }
  }

  const formatWalletAddress = (address: string) => {
    if (!address) return ''
    if (address.length <= 13) return address
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
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
                <AvatarImage src={formData.avatarUrl || '/avatars/investor.jpg'} alt={`${formData.firstName} ${formData.lastName}`} className="object-cover" />
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
          {/* Language Preference temporarily hidden - platform is English-only for now */}
          {/* <Card>
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

              <Button onClick={handleLanguageUpdate} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Preference
              </Button>
            </CardContent>
          </Card> */}

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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Wallet Information</CardTitle>
              <CardDescription>
                Your Crossmint blockchain wallet address
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.walletAddress ? (
            <>
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-sm">
                    <span className="flex-1 truncate" title={formData.walletAddress}>
                      {formData.walletAddress}
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
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Token Balances</Label>
                {loadingBalances ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading balances...</span>
                  </div>
                ) : walletBalances.length > 0 ? (
                  (() => {
                    // Filter for USDT and ERC-3643 tokens
                    const filteredBalances = walletBalances.filter(balance => {
                      const isUSDT = balance.token?.symbol?.toUpperCase() === 'USDT'
                      const isERC3643 = balance.token?.standard === 'ERC3643' || balance.token?.type === 'ERC3643'
                      return isUSDT || isERC3643
                    })

                    return filteredBalances.length > 0 ? (
                      <div className="space-y-2">
                        {filteredBalances.map((balance, index) => {
                          const isERC3643 = balance.token?.standard === 'ERC3643' || balance.token?.type === 'ERC3643'

                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-primary">
                                    {balance.token?.symbol?.substring(0, 2) || 'TK'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-sm">
                                    {balance.token?.name || balance.token?.symbol || 'Unknown Token'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {balance.token?.symbol || 'N/A'}
                                    {isERC3643 && <span className="ml-1 text-blue-600">(ERC-3643)</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-sm">
                                  {balance.amount || balance.balance || '0'}
                                </div>
                                {balance.token?.contractAddress && (
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {balance.token.contractAddress.substring(0, 6)}...
                                    {balance.token.contractAddress.substring(balance.token.contractAddress.length - 4)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-muted rounded-md text-center">
                        <p className="text-sm text-muted-foreground">
                          No USDT or ERC-3643 tokens found
                        </p>
                      </div>
                    )
                  })()
                ) : (
                  <div className="p-3 bg-muted rounded-md text-center">
                    <p className="text-sm text-muted-foreground">
                      No tokens found in wallet
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm text-blue-900">
                  <strong className="font-semibold">Note:</strong> This wallet was automatically created for you when you logged in with Prospera. Keep your wallet address safe and only share it with trusted parties.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
              <Wallet className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-900 mb-2">
                <strong className="font-semibold">No wallet found</strong>
              </p>
              <p className="text-xs text-yellow-800">
                Your wallet will be created automatically the next time you log in with Prospera.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
