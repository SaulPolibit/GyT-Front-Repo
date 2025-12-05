"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CreditCard,
  Bell,
  Shield,
  Plus,
  Trash2,
  Check,
  FileText,
  Building2,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Globe,
} from "lucide-react"
import { getCurrentUser, getAuthToken } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { toast } from "sonner"

export default function LPSettingsPage() {
  const router = useRouter()
  const [investor, setInvestor] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("payment")

  // Notification settings
  const [emailNotifications, setEmailNotifications] = React.useState(true)
  const [smsNotifications, setSmsNotifications] = React.useState(false)
  const [portalNotifications, setPortalNotifications] = React.useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false)

  // Communication preferences
  const [preferredContactMethod, setPreferredContactMethod] = React.useState('email')
  const [reportDeliveryFormat, setReportDeliveryFormat] = React.useState('both')
  const [notificationFrequency, setNotificationFrequency] = React.useState('immediate')

  // Legal info - editable fields
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [addressLine1, setAddressLine1] = React.useState('')
  const [addressLine2, setAddressLine2] = React.useState('')
  const [city, setCity] = React.useState('')
  const [state, setState] = React.useState('')
  const [postalCode, setPostalCode] = React.useState('')
  const [country, setCountry] = React.useState('')

  React.useEffect(() => {
    loadInvestorData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadInvestorData = async () => {
    setLoading(true)

    try {
      const user = getCurrentUser()
      const token = getAuthToken()

      if (!user?.email || !token) {
        console.error('[Settings] No user or token found')
        router.push('/lp-portal/login')
        return
      }

      // Search for investor by email
      const searchResponse = await fetch(
        getApiUrl(API_CONFIG.endpoints.searchInvestors(user.email)),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!searchResponse.ok) {
        throw new Error('Failed to fetch investor data')
      }

      const searchData = await searchResponse.json()

      if (!searchData.success || !searchData.data || searchData.data.length === 0) {
        console.error('[Settings] No investor found')
        router.push('/lp-portal/portfolio')
        return
      }

      const investorData = searchData.data[0]

      // Load full investor profile
      const profileResponse = await fetch(
        getApiUrl(API_CONFIG.endpoints.getInvestorById(investorData.id)),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.success && profileData.data) {
          setInvestor(profileData.data)

          // Set legal info fields
          setPhoneNumber(profileData.data.phoneNumber || '')
          setAddressLine1(profileData.data.addressLine1 || '')
          setAddressLine2(profileData.data.addressLine2 || '')
          setCity(profileData.data.city || '')
          setState(profileData.data.state || '')
          setPostalCode(profileData.data.postalCode || '')
          setCountry(profileData.data.country || '')
        }
      } else {
        setInvestor(investorData)
      }

      // Load notification settings
      const notifResponse = await fetch(
        getApiUrl(API_CONFIG.endpoints.getNotificationSettings),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (notifResponse.ok) {
        const notifData = await notifResponse.json()
        if (notifData.success && notifData.data) {
          setEmailNotifications(notifData.data.emailNotifications ?? true)
          setSmsNotifications(notifData.data.smsNotifications ?? false)
          setPortalNotifications(notifData.data.pushNotifications ?? true)

          // Load communication preferences if available
          if (notifData.data.preferredContactMethod) {
            setPreferredContactMethod(notifData.data.preferredContactMethod)
          }
          if (notifData.data.reportDeliveryFormat) {
            setReportDeliveryFormat(notifData.data.reportDeliveryFormat)
          }
          if (notifData.data.notificationFrequency) {
            setNotificationFrequency(notifData.data.notificationFrequency)
          }
        }
      }
    } catch (error) {
      console.error('[Settings] Error loading investor data:', error)
      toast.error('Failed to load investor data')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePaymentMethod = () => {
    toast.success("Payment method saved successfully")
  }

  const handleRemovePaymentMethod = () => {
    toast.success("Payment method removed")
  }

  const handleUpdateNotifications = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.updateNotificationSettings),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailNotifications,
            portfolioNotifications: emailNotifications, // Portfolio updates via email
            reportNotifications: emailNotifications, // Quarterly reports and K-1s
            investorActivityNotifications: emailNotifications, // Capital calls and distributions
            systemUpdateNotifications: emailNotifications, // General announcements
            marketingEmailNotifications: emailNotifications, // Marketing emails
            pushNotifications: portalNotifications,
            smsNotifications,
            // Communication preferences
            preferredContactMethod,
            reportDeliveryFormat,
            notificationFrequency,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update notification settings')
      }

      toast.success("Notification preferences updated")
    } catch (error) {
      console.error('[Settings] Error updating notifications:', error)
      toast.error('Failed to update notification preferences')
    }
  }

  const handleEnable2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled)
    toast.success(twoFactorEnabled ? "2FA disabled" : "2FA enabled")
  }

  const handleUpdateLegalInfo = async () => {
    try {
      const token = getAuthToken()
      if (!token || !investor?.id) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.updateInvestorById(investor.id)),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update legal information')
      }

      toast.success("Legal information updated successfully")
    } catch (error) {
      console.error('[Settings] Error updating legal info:', error)
      toast.error('Failed to update legal information')
    }
  }

  if (loading || !investor) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p>Loading investor data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your payment methods, notifications, security, and legal information
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="legal">Legal Info</TabsTrigger>
        </TabsList>

        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Manage your bank accounts and payment methods for capital calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Saved Payment Methods */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Saved Payment Methods</h3>

                {/* Bank Account 1 - Primary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">Chase Bank - Checking</p>
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Account ending in ••••4532</p>
                        <p className="text-xs text-muted-foreground mt-1">Routing: ••••6789</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Verified on Jan 15, 2024
                    </div>
                  </div>
                </div>

                {/* Bank Account 2 */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-md">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Bank of America - Savings</p>
                        <p className="text-sm text-muted-foreground">Account ending in ••••7821</p>
                        <p className="text-xs text-muted-foreground mt-1">Routing: ••••1234</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Set as Primary</Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Verified on Dec 10, 2023
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full" variant="outline" onClick={handleSavePaymentMethod}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Bank Account
              </Button>

              <Separator />

              {/* Wire Transfer Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Wire Transfer Instructions</h3>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Bank Name</Label>
                      <p className="text-sm font-medium mt-1">Chase Bank</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Account Type</Label>
                      <p className="text-sm font-medium mt-1">Checking</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Account Number</Label>
                      <p className="text-sm font-medium mt-1">••••••••4532</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Routing Number</Label>
                      <p className="text-sm font-medium mt-1">021000021</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">SWIFT Code</Label>
                      <p className="text-sm font-medium mt-1">CHASUS33</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Account Holder</Label>
                      <p className="text-sm font-medium mt-1">{investor.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment History */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Recent Payments</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="text-sm font-medium">Capital Call #1</p>
                      <p className="text-xs text-muted-foreground">Jan 15, 2024</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">$125,000.00</p>
                      <p className="text-xs text-green-600">Completed</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">Initial Commitment</p>
                      <p className="text-xs text-muted-foreground">Dec 10, 2023</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Setup</p>
                      <p className="text-xs text-green-600">Verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how and when you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                {emailNotifications && (
                  <div className="ml-6 space-y-3 border-l-2 pl-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Capital call notices</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Distribution notices</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Quarterly reports</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">K-1 tax forms available</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Document uploads</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">General announcements</Label>
                      <Switch />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* SMS Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive text alerts for urgent notifications
                    </p>
                  </div>
                  <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                </div>

                {smsNotifications && (
                  <div className="ml-6 space-y-3 border-l-2 pl-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Urgent capital calls</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Payment confirmations</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Security alerts</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Portal Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Portal Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notifications in the investor portal
                  </p>
                </div>
                <Switch checked={portalNotifications} onCheckedChange={setPortalNotifications} />
              </div>

              <Separator />

              {/* Communication Preferences */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Communication Preferences</h3>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Preferred Contact Method</Label>
                    <Select value={preferredContactMethod} onValueChange={setPreferredContactMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="portal">Portal Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Report Delivery Format</Label>
                    <Select value={reportDeliveryFormat} onValueChange={setReportDeliveryFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Only</SelectItem>
                        <SelectItem value="excel">Excel Only</SelectItem>
                        <SelectItem value="both">Both PDF & Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Notification Frequency</Label>
                    <Select value={notificationFrequency} onValueChange={setNotificationFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={handleUpdateNotifications}>Save Notification Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Manage your account security and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Multi-Factor Authentication */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Multi-Factor Authentication (MFA)</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account with two-factor authentication
                    </p>
                  </div>
                  <Switch checked={twoFactorEnabled} onCheckedChange={handleEnable2FA} />
                </div>

                {twoFactorEnabled && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900 dark:text-green-100">MFA is enabled</p>
                        <p className="text-green-700 dark:text-green-300 mt-1">
                          You&apos;ll be asked for a verification code when signing in
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Information Tab */}
        <TabsContent value="legal" className="space-y-4">
          {/* Legal Entity Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Legal Entity Information
              </CardTitle>
              <CardDescription>
                Your legal entity details and registration information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Investor Type</Label>
                  <Input value={investor.type ? investor.type.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Individual'} disabled />
                </div>

                {investor.entityName && (
                  <>
                    <div className="space-y-2">
                      <Label>Entity Name</Label>
                      <Input value={investor.entityName} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Entity Type</Label>
                      <Input value={investor.entityType || 'N/A'} disabled />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Legal Name</Label>
                  <Input value={investor.name || 'N/A'} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={investor.email || 'N/A'} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Enter phone number" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
              <CardDescription>
                Your registered address for legal and compliance purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Street Address Line 1</Label>
                  <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Enter street address" />
                </div>
                <div className="space-y-2">
                  <Label>Street Address Line 2</Label>
                  <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Apartment, suite, unit, etc. (optional)" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter city" />
                  </div>
                  <div className="space-y-2">
                    <Label>State/Province</Label>
                    <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Enter state/province" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Enter postal code" />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Enter country" />
                  </div>
                </div>
              </div>
              <Button onClick={handleUpdateLegalInfo}>Update Address</Button>
            </CardContent>
          </Card>

          {/* Tax Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tax Information
              </CardTitle>
              <CardDescription>
                Your tax identification and W-9 documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Tax ID / EIN</Label>
                  <Input value={investor.taxId ? `•••-••-${investor.taxId.slice(-4)}` : 'Not provided'} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Tax Classification</Label>
                  <Select defaultValue={investor.type === 'individual' || !investor.type ? 'individual' : 'entity'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual/Sole Proprietor</SelectItem>
                      <SelectItem value="c-corp">C Corporation</SelectItem>
                      <SelectItem value="s-corp">S Corporation</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="llc">Limited Liability Company</SelectItem>
                      <SelectItem value="trust">Trust/Estate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">W-9 Form</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">W-9 Form (2024).pdf</p>
                        <p className="text-xs text-muted-foreground">Uploaded on Jan 15, 2024</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Updated W-9
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KYC/AML Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                KYC/AML Documentation Status
              </CardTitle>
              <CardDescription>
                Know Your Customer and Anti-Money Laundering compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">KYC/AML Verified</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Your identity and documentation have been verified and approved
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Verified on: January 15, 2024
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Submitted Documents</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Government ID (Driver's License)</p>
                        <p className="text-xs text-muted-foreground">Uploaded on Jan 10, 2024</p>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Proof of Address (Utility Bill)</p>
                        <p className="text-xs text-muted-foreground">Uploaded on Jan 10, 2024</p>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Annual Review</h4>
                <p className="text-sm text-muted-foreground">
                  Your KYC/AML documentation will need to be reviewed annually to maintain compliance.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-400">Next review due: January 15, 2025</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accreditation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Investor Accreditation Status
              </CardTitle>
              <CardDescription>
                Your status as an accredited investor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Accredited Investor Status Verified</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      You are verified as an accredited investor and qualified purchaser
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Verified on: December 10, 2023
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Accreditation Criteria Met</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Income Requirement</p>
                      <p className="text-muted-foreground text-xs">
                        Individual income exceeding $200,000 (or $300,000 joint) in each of the prior two years
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Net Worth Requirement</p>
                      <p className="text-muted-foreground text-xs">
                        Net worth exceeding $1,000,000 (excluding primary residence)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Annual Certification</h4>
                <p className="text-sm text-muted-foreground">
                  Accredited investor status must be recertified annually.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-400">Next certification due: December 10, 2024</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
