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
import { getCurrentUser, getAuthToken, getSupabaseAuth } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { sendInvestorActivityEmail } from "@/lib/email-service"
import { getNotificationSettings, saveNotificationSettings } from "@/lib/notification-settings-storage"

export default function LPSettingsPage() {
  const router = useRouter()
  const [investor, setInvestor] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("payment")

  // Notification settings
  const [emailNotifications, setEmailNotifications] = React.useState(true)
  const [smsNotifications, setSmsNotifications] = React.useState(false)
  const [portalNotifications, setPortalNotifications] = React.useState(true)

  // Email notification sub-settings
  const [capitalCallNotices, setCapitalCallNotices] = React.useState(true)
  const [distributionNotices, setDistributionNotices] = React.useState(true)
  const [quarterlyReports, setQuarterlyReports] = React.useState(true)
  const [k1TaxForms, setK1TaxForms] = React.useState(true)
  const [documentUploads, setDocumentUploads] = React.useState(false)
  const [generalAnnouncements, setGeneralAnnouncements] = React.useState(false)

  // SMS notification sub-settings
  const [urgentCapitalCalls, setUrgentCapitalCalls] = React.useState(true)
  const [paymentConfirmations, setPaymentConfirmations] = React.useState(true)
  const [securityAlerts, setSecurityAlerts] = React.useState(true)

  // MFA settings
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false)
  const [mfaQrCode, setMfaQrCode] = React.useState<string | null>(null)
  const [mfaSecret, setMfaSecret] = React.useState<string | null>(null)
  const [mfaFactorId, setMfaFactorId] = React.useState<string | null>(null)
  const [isEnrollingMfa, setIsEnrollingMfa] = React.useState(false)
  const [showMfaVerifyDialog, setShowMfaVerifyDialog] = React.useState(false)
  const [showMfaConfirmDialog, setShowMfaConfirmDialog] = React.useState(false)
  const [mfaVerifyCode, setMfaVerifyCode] = React.useState('')
  const [isVerifyingMfa, setIsVerifyingMfa] = React.useState(false)
  const [pendingAction, setPendingAction] = React.useState<'unenroll' | 'retry-enroll' | null>(null)

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

  // W-9 upload state
  const [isUploadingW9, setIsUploadingW9] = React.useState(false)
  const w9InputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    loadInvestorData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadInvestorData = async () => {
    setLoading(true)

    try {
      const user = getCurrentUser()
      const token = getAuthToken()

      if (!user?.id || !token) {
        console.error('[Settings] No user or token found')
        router.push('/lp-portal/login')
        return
      }

      // Load user profile using user ID
      const profileResponse = await fetch(
        getApiUrl(API_CONFIG.endpoints.getUserById(user.id)),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user data')
      }

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
      } else {
        console.error('[Settings] Failed to load user data')
        // Don't redirect, just show error
        toast.error('Failed to load user data')
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
          // Main notification toggles
          setEmailNotifications(notifData.data.emailNotifications ?? true)
          setSmsNotifications(notifData.data.smsNotifications ?? false)
          setPortalNotifications(notifData.data.pushNotifications ?? true)

          // Email notification sub-settings
          setCapitalCallNotices(notifData.data.capitalCallNotices ?? true)
          setDistributionNotices(notifData.data.distributionNotices ?? true)
          setQuarterlyReports(notifData.data.quarterlyReports ?? true)
          setK1TaxForms(notifData.data.k1TaxForms ?? true)
          setDocumentUploads(notifData.data.documentUploads ?? false)
          setGeneralAnnouncements(notifData.data.generalAnnouncements ?? false)

          // SMS notification sub-settings
          setUrgentCapitalCalls(notifData.data.urgentCapitalCalls ?? true)
          setPaymentConfirmations(notifData.data.paymentConfirmations ?? true)
          setSecurityAlerts(notifData.data.securityAlerts ?? true)

          // Communication preferences
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

      // Load MFA status
      const mfaStatusResponse = await fetch(
        getApiUrl(API_CONFIG.endpoints.mfaStatus),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (mfaStatusResponse.ok) {
        const mfaData = await mfaStatusResponse.json()
        if (mfaData.success && mfaData.data) {
          setTwoFactorEnabled(mfaData.data.mfaEnabled || false)
          if (mfaData.data.mfaFactorId) {
            setMfaFactorId(mfaData.data.mfaFactorId)
          }
          console.log('[LP Settings] MFA Status:', mfaData.data)
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
            // Main notification toggles
            emailNotifications,
            smsNotifications,
            pushNotifications: portalNotifications,

            // Email notification sub-settings
            capitalCallNotices,
            distributionNotices,
            quarterlyReports,
            k1TaxForms,
            documentUploads,
            generalAnnouncements,

            // SMS notification sub-settings
            urgentCapitalCalls,
            paymentConfirmations,
            securityAlerts,

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

      // Fetch and save updated notification settings to localStorage
      try {
        console.log('[Settings] Fetching updated notification settings...')
        const notificationResponse = await fetch(getApiUrl(API_CONFIG.endpoints.getNotificationSettings), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (notificationResponse.ok) {
          const notificationData = await notificationResponse.json()
          console.log('[Settings] Notification settings fetched:', notificationData)

          if (notificationData.success && notificationData.data) {
            saveNotificationSettings(notificationData.data)
            console.log('[Settings] Notification settings saved to localStorage')
          }
        } else {
          console.warn('[Settings] Failed to fetch notification settings:', await notificationResponse.text())
        }
      } catch (notificationError) {
        console.error('[Settings] Error fetching notification settings:', notificationError)
        // Don't fail the update if notification settings fetch fails
      }
    } catch (error) {
      console.error('[Settings] Error updating notifications:', error)
      toast.error('Failed to update notification preferences')
    }
  }

  const handleVerifyMfa = async () => {
    if (!mfaVerifyCode || mfaVerifyCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    setIsVerifyingMfa(true)

    try {
      const token = getAuthToken()
      const supabaseAuth = getSupabaseAuth()

      if (!token || !supabaseAuth?.accessToken || !supabaseAuth?.refreshToken) {
        toast.error('Session expired. Please login again.')
        return
      }

      // Step 1: Create MFA challenge
      const challengeResponse = await fetch(
        getApiUrl(API_CONFIG.endpoints.mfaChallenge),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabaseAccessToken: supabaseAuth.accessToken,
            supabaseRefreshToken: supabaseAuth.refreshToken,
            factorId: mfaFactorId || undefined,
          }),
        }
      )

      if (!challengeResponse.ok) {
        throw new Error('Failed to create MFA challenge')
      }

      const challengeData = await challengeResponse.json()

      if (!challengeData.success || !challengeData.data?.challengeId) {
        throw new Error('Failed to create MFA challenge')
      }

      // Step 2: Verify the MFA code
      const verifyResponse = await fetch(
        getApiUrl(API_CONFIG.endpoints.mfaVerify),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabaseAccessToken: supabaseAuth.accessToken,
            supabaseRefreshToken: supabaseAuth.refreshToken,
            factorId: mfaFactorId || challengeData.data.factorId,
            challengeId: challengeData.data.challengeId,
            code: mfaVerifyCode,
          }),
        }
      )

      if (!verifyResponse.ok) {
        throw new Error('Invalid MFA code')
      }

      const verifyData = await verifyResponse.json()

      if (!verifyData.success) {
        throw new Error('Invalid MFA code')
      }

      // Step 3: Proceed with pending action
      toast.success('MFA verified successfully')
      setShowMfaVerifyDialog(false)
      setMfaVerifyCode('')

      if (pendingAction === 'unenroll') {
        await performUnenroll()
      } else if (pendingAction === 'retry-enroll') {
        await performRetryEnroll()
      }
    } catch (error) {
      console.error('[LP Settings] Error verifying MFA:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to verify MFA code')
    } finally {
      setIsVerifyingMfa(false)
    }
  }

  const performUnenroll = async () => {
    try {
      setIsEnrollingMfa(true)
      const token = getAuthToken()
      const supabaseAuth = getSupabaseAuth()

      if (!token || !supabaseAuth?.accessToken || !supabaseAuth?.refreshToken) {
        toast.error('Session expired.')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.mfaUnenroll),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabaseAccessToken: supabaseAuth.accessToken,
            supabaseRefreshToken: supabaseAuth.refreshToken,
            factorId: mfaFactorId || undefined,
            factorType: 'totp'
          }),
        }
      )

      if (response.status === 401) {

        // Check if it's an expired token error
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Account] 401 Unauthorized - clearing session and redirecting to login')
            localStorage.clear()
            toast.error('Session expired. Please login again.')
            router.push('/lp-portal/login')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

      if (!response.ok) {
        throw new Error('Failed to unenroll from MFA')
      }

      const data = await response.json()

      if (data.success) {
        setTwoFactorEnabled(false)
        setMfaQrCode(null)
        setMfaSecret(null)
        setMfaFactorId(null)
        toast.success("2FA disabled successfully")

        // Send email notification about MFA disable
        const notificationSettings = getNotificationSettings()
        if (investor?.id && investor?.email && investor?.name && notificationSettings.generalAnnouncements) {
          try {
            const currentDate = new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })

            await sendInvestorActivityEmail(
              investor.id,
              investor.email,
              {
                investorName: investor.name,
                activityType: 'Multi-Factor Authentication Disabled',
                activityDescription: 'Two-factor authentication (2FA) has been disabled on your account. If you did not make this change, please contact support immediately to secure your account.',
                date: currentDate,
                fundManagerName: 'Polibit Security Team',
                fundManagerEmail: 'security@polibit.com',
              }
            )
          } catch (emailError) {
            console.error('[Settings] Error sending MFA disable notification:', emailError)
          }
        }
      } else {
        throw new Error(data.message || 'Failed to disable MFA')
      }
    } catch (error) {
      console.error('[LP Settings] Error unenrolling from MFA:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to disable 2FA')
    } finally {
      setIsEnrollingMfa(false)
      setPendingAction(null)
    }
  }

  const performRetryEnroll = async () => {
    try {
      setIsEnrollingMfa(true)
      const token = getAuthToken()
      const supabaseAuth = getSupabaseAuth()

      if (!token || !supabaseAuth?.accessToken || !supabaseAuth?.refreshToken) {
        toast.error('Session expired.')
        return
      }

      // First unenroll
      const unenrollResponse = await fetch(
        getApiUrl(API_CONFIG.endpoints.mfaUnenroll),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabaseAccessToken: supabaseAuth.accessToken,
            supabaseRefreshToken: supabaseAuth.refreshToken,
            factorType: 'totp'
          }),
        }
      )

      if (!unenrollResponse.ok) {
        throw new Error('Failed to reset existing MFA configuration')
      }

      // Then retry enrollment
      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.mfaEnroll),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabaseAccessToken: supabaseAuth.accessToken,
            supabaseRefreshToken: supabaseAuth.refreshToken,
            factorType: 'totp',
            friendlyName: 'Authenticator App'
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to enroll in MFA after reset')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setTwoFactorEnabled(true)
        setMfaQrCode(data.data.qrCode)
        setMfaSecret(data.data.secret)
        setMfaFactorId(data.data.factorId)
        toast.success("2FA enrollment successful. Scan the QR code with your authenticator app.")

        // Send email notification about MFA enable
        const notificationSettings = getNotificationSettings()
        if (investor?.id && investor?.email && investor?.name && notificationSettings.generalAnnouncements) {
          try {
            const currentDate = new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })

            await sendInvestorActivityEmail(
              investor.id,
              investor.email,
              {
                investorName: investor.name,
                activityType: 'Multi-Factor Authentication Enabled',
                activityDescription: 'Two-factor authentication (2FA) has been successfully enabled on your account. This adds an extra layer of security to protect your account. If you did not make this change, please contact support immediately.',
                date: currentDate,
                fundManagerName: 'Polibit Security Team',
                fundManagerEmail: 'security@polibit.com',
              }
            )
          } catch (emailError) {
            console.error('[Settings] Error sending MFA enable notification:', emailError)
          }
        }
      } else {
        throw new Error(data.message || 'Failed to enroll in MFA')
      }
    } catch (error) {
      console.error('[LP Settings] Error retrying enrollment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to enable 2FA')
      setTwoFactorEnabled(false)
    } finally {
      setIsEnrollingMfa(false)
      setPendingAction(null)
    }
  }

  const handleEnable2FA = async (confirmed?: boolean) => {
    // If currently enabled, disable it - show verification dialog
    if (twoFactorEnabled) {
      setPendingAction('unenroll')
      setShowMfaVerifyDialog(true)
      return
    }

    // Show confirmation dialog before enabling 2FA
    if (!confirmed) {
      setShowMfaConfirmDialog(true)
      return
    }

    const token = getAuthToken()

    if (!token) {
      toast.error('Authentication required')
      router.push('/lp-portal/login')
      return
    }

    // Get Supabase tokens from auth state
    const supabaseAuth = getSupabaseAuth()

    if (!supabaseAuth?.accessToken || !supabaseAuth?.refreshToken) {
      toast.error('Session expired. Please login again.')
      router.push('/lp-portal/login')
      return
    }

    const supabaseAccessToken = supabaseAuth.accessToken
    const supabaseRefreshToken = supabaseAuth.refreshToken

    // Enable 2FA - call enrollment endpoint
    try {
      setIsEnrollingMfa(true)

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.mfaEnroll),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabaseAccessToken,
            supabaseRefreshToken,
            factorType: 'totp',
            friendlyName: 'Authenticator App'
          }),
        }
      )

      if (response.status === 401) {

        // Check if it's an expired token error
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Account] 401 Unauthorized - clearing session and redirecting to login')
            localStorage.clear()
            toast.error('Session expired. Please login again.')
            router.push('/lp-portal/login')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

      const data = await response.json()

      // If enrollment fails because factor already exists, show verification dialog
      if (!data.success && data.error && data.error.includes('already exists')) {
        console.log('[LP Settings] Factor already exists, need to verify MFA first...')
        toast.info('An MFA factor already exists. Please verify your current MFA code to continue.')
        setIsEnrollingMfa(false)
        setPendingAction('retry-enroll')
        setShowMfaVerifyDialog(true)
        return
      }

      if (data.success && data.data) {
        setTwoFactorEnabled(true)
        setMfaQrCode(data.data.qrCode)
        setMfaSecret(data.data.secret)
        setMfaFactorId(data.data.factorId)
        toast.success("2FA enrollment initiated. Scan the QR code with your authenticator app.")

        // Send email notification about MFA enable
        const notificationSettings = getNotificationSettings()
        if (investor?.id && investor?.email && investor?.name && notificationSettings.generalAnnouncements) {
          try {
            const currentDate = new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })

            await sendInvestorActivityEmail(
              investor.id,
              investor.email,
              {
                investorName: investor.name,
                activityType: 'Multi-Factor Authentication Enabled',
                activityDescription: 'Two-factor authentication (2FA) has been successfully enabled on your account. This adds an extra layer of security to protect your account. If you did not make this change, please contact support immediately.',
                date: currentDate,
                fundManagerName: 'Polibit Security Team',
                fundManagerEmail: 'security@polibit.com',
              }
            )
          } catch (emailError) {
            console.error('[Settings] Error sending MFA enable notification:', emailError)
          }
        }
      } else {
        throw new Error(data.message || 'Failed to enroll in MFA')
      }
    } catch (error) {
      console.error('[LP Settings] Error enrolling in MFA:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to enable 2FA')
      setTwoFactorEnabled(false)
    } finally {
      setIsEnrollingMfa(false)
    }
  }

  const handleConfirmEnable2FA = () => {
    setShowMfaConfirmDialog(false)
    handleEnable2FA(true)
  }

  const handleCancelEnable2FA = () => {
    setShowMfaConfirmDialog(false)
  }

  const handleUpdateLegalInfo = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.updateUserProfile),
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
        throw new Error('Failed to update user profile')
      }

      toast.success("Profile updated successfully")

      // Send email notification about profile update
      const notificationSettings = getNotificationSettings()
      if (investor?.id && investor?.email && investor?.name && notificationSettings.generalAnnouncements) {
        try {
          const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })

          await sendInvestorActivityEmail(
            investor.id,
            investor.email,
            {
              investorName: investor.name,
              activityType: 'Profile Settings Updated',
              activityDescription: 'Your profile settings have been successfully updated. The following information was modified: contact details and address information.',
              date: currentDate,
              fundManagerName: 'Polibit Team',
              fundManagerEmail: 'support@polibit.com',
            }
          )
        } catch (emailError) {
          // Don't fail the whole operation if email fails
          console.error('[Settings] Error sending notification email:', emailError)
        }
      }
    } catch (error) {
      console.error('[Settings] Error updating user profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleW9Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    setIsUploadingW9(true)

    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        getApiUrl('/api/users/w9-form'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to upload W-9 form')
      }

      const data = await response.json()

      if (data.success) {
        toast.success('W-9 form uploaded successfully')
        // Reload investor data to get updated W-9 info
        await loadInvestorData()
      } else {
        throw new Error(data.message || 'Failed to upload W-9 form')
      }
    } catch (error) {
      console.error('[Settings] Error uploading W-9 form:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload W-9 form')
    } finally {
      setIsUploadingW9(false)
      // Reset the file input
      if (w9InputRef.current) {
        w9InputRef.current.value = ''
      }
    }
  }

  const handleW9UploadClick = () => {
    w9InputRef.current?.click()
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
                      <Switch checked={capitalCallNotices} onCheckedChange={setCapitalCallNotices} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Distribution notices</Label>
                      <Switch checked={distributionNotices} onCheckedChange={setDistributionNotices} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Quarterly reports</Label>
                      <Switch checked={quarterlyReports} onCheckedChange={setQuarterlyReports} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">K-1 tax forms available</Label>
                      <Switch checked={k1TaxForms} onCheckedChange={setK1TaxForms} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Document uploads</Label>
                      <Switch checked={documentUploads} onCheckedChange={setDocumentUploads} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">General announcements</Label>
                      <Switch checked={generalAnnouncements} onCheckedChange={setGeneralAnnouncements} />
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
                      <Switch checked={urgentCapitalCalls} onCheckedChange={setUrgentCapitalCalls} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Payment confirmations</Label>
                      <Switch checked={paymentConfirmations} onCheckedChange={setPaymentConfirmations} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Security alerts</Label>
                      <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
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
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={() => handleEnable2FA()}
                    disabled={isEnrollingMfa}
                  />
                </div>

                {isEnrollingMfa && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <p className="text-sm">Enrolling in MFA...</p>
                  </div>
                )}

                {twoFactorEnabled && mfaQrCode && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-sm flex-1">
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          Scan the QR code with your authenticator app
                        </p>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                          Use Google Authenticator, Authy, or any TOTP-compatible app
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg">
                      <img
                        src={mfaQrCode}
                        alt="MFA QR Code"
                        className="w-64 h-64"
                      />
                      {mfaSecret && (
                        <div className="text-center space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Or enter this code manually:
                          </p>
                          <code className="block text-sm font-mono bg-muted px-3 py-2 rounded border">
                            {mfaSecret}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {twoFactorEnabled && !mfaQrCode && (
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
                  <Input
                    value={investor.taxClassification || 'Not provided'}
                    disabled
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">W-9 Form</h4>

                  {investor.w9Form && investor.w9Form.trim() !== '' ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">W-9 Form.pdf</p>
                          <p className="text-xs text-muted-foreground">On file</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(investor.w9Form, '_blank')}
                        >
                          See
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed rounded-lg text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No W-9 form uploaded</p>
                    </div>
                  )}

                  <input
                    ref={w9InputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleW9Upload}
                    className="hidden"
                  />

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleW9UploadClick}
                    disabled={isUploadingW9}
                  >
                    {isUploadingW9 ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {investor.w9Form && investor.w9Form.trim() !== '' ? 'Upload Updated W-9' : 'Upload W-9'}
                      </>
                    )}
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

      {/* MFA Confirmation Dialog */}
      <Dialog open={showMfaConfirmDialog} onOpenChange={setShowMfaConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Multi-Factor Authentication?</DialogTitle>
            <DialogDescription>
              You&apos;re about to enable MFA for your account. This will add an extra layer of security by requiring a code from your authenticator app when you sign in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">What you&apos;ll need:</p>
                  <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
                    <li>An authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Your phone or device to scan the QR code</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Important:</p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Once enabled, you&apos;ll need your authenticator app code each time you sign in. Make sure to complete the setup process.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelEnable2FA}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmEnable2FA}
            >
              Enable MFA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MFA Verification Dialog */}
      <Dialog open={showMfaVerifyDialog} onOpenChange={setShowMfaVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify MFA Code</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mfaCode">Authentication Code</Label>
              <Input
                id="mfaCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={mfaVerifyCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setMfaVerifyCode(value)
                }}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
                disabled={isVerifyingMfa}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && mfaVerifyCode.length === 6) {
                    handleVerifyMfa()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the code shown in your authenticator app
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMfaVerifyDialog(false)
                setMfaVerifyCode('')
                setPendingAction(null)
              }}
              disabled={isVerifyingMfa}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyMfa}
              disabled={isVerifyingMfa || mfaVerifyCode.length !== 6}
            >
              {isVerifyingMfa ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
