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
  Building2,
  Bell,
  Shield,
  Users,
  CheckCircle,
  Upload,
  Mail,
  Send,
  AlertCircle,
} from "lucide-react"
import { getCurrentUser, getAuthToken, getSupabaseAuth } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { toast } from "sonner"
import { sendInvestorActivityEmail } from "@/lib/email-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IconDotsVertical, IconUserPlus, IconShieldCheck } from '@tabler/icons-react'
import { getFirmSettings, saveFirmSettings, FirmSettings } from '@/lib/firm-settings-storage'
import { getUsers, deleteUser, User, getRoleLabel } from '@/lib/user-management-storage'
import { AddUserModal } from '@/components/add-user-modal'
import { PermissionsMatrixDialog } from '@/components/permissions-matrix-dialog'
import { getNotificationSettings, saveNotificationSettings } from '@/lib/notification-settings-storage'

export default function InvestmentManagerSettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState("firm")

  // Firm settings
  const [settings, setSettings] = React.useState<FirmSettings | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [logoFile, setLogoFile] = React.useState<File | null>(null)

  // User management
  const [users, setUsers] = React.useState<User[]>([])
  const [currentUserRole, setCurrentUserRole] = React.useState<number | null>(null)
  const [showAddUserModal, setShowAddUserModal] = React.useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = React.useState(false)
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = React.useState(false)
  const [userToDelete, setUserToDelete] = React.useState<string | null>(null)

  // Notification settings
  const [emailNotifications, setEmailNotifications] = React.useState(true)
  const [smsNotifications, setSmsNotifications] = React.useState(false)
  const [portalNotifications, setPortalNotifications] = React.useState(true)

  // Email notification sub-settings
  const [capitalCallNotices, setCapitalCallNotices] = React.useState(true)
  const [distributionNotices, setDistributionNotices] = React.useState(true)
  const [quarterlyReports, setQuarterlyReports] = React.useState(true)
  const [investorActivity, setInvestorActivity] = React.useState(true)
  const [documentUploads, setDocumentUploads] = React.useState(false)
  const [generalAnnouncements, setGeneralAnnouncements] = React.useState(false)

  // SMS notification sub-settings
  const [urgentCapitalCalls, setUrgentCapitalCalls] = React.useState(true)
  const [paymentConfirmations, setPaymentConfirmations] = React.useState(true)
  const [securityAlerts, setSecurityAlerts] = React.useState(true)

  // Communication preferences
  const [preferredContactMethod, setPreferredContactMethod] = React.useState('email')
  const [reportDeliveryFormat, setReportDeliveryFormat] = React.useState('both')
  const [notificationFrequency, setNotificationFrequency] = React.useState('immediate')

  // Environment variable to control advanced notifications visibility
  const showAdvancedNotifications = process.env.NEXT_PUBLIC_SHOW_ADVANCED_NOTIFICATIONS_IM !== 'false'

  // Security settings
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

  // Email configuration state (legacy SMTP - kept for backwards compatibility)
  const [emailConfig, setEmailConfig] = React.useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
    smtpSecure: true,
    encryption: 'tls' as 'tls' | 'ssl' | 'none',
    testEmail: '',
  })
  const [isSendingTest, setIsSendingTest] = React.useState(false)
  const [isSavingEmail, setIsSavingEmail] = React.useState(false)

  // Email Domain state (Resend-based)
  interface EmailDomainType {
    id: string
    resendDomainId: string
    domainName: string
    status: 'pending' | 'verified' | 'failed'
    region: string
    dnsRecords: Array<{
      type: string
      name: string
      value: string
      priority?: number
      ttl?: string
      status?: string
    }>
    fromEmail: string | null
    fromName: string | null
    replyToEmail: string | null
    isActive: boolean
    createdAt: string
    verifiedAt: string | null
  }
  const [emailDomains, setEmailDomains] = React.useState<EmailDomainType[]>([])
  const [selectedDomain, setSelectedDomain] = React.useState<EmailDomainType | null>(null)
  const [newDomainName, setNewDomainName] = React.useState('')
  const [isAddingDomain, setIsAddingDomain] = React.useState(false)
  const [isVerifyingDomain, setIsVerifyingDomain] = React.useState(false)
  const [isDeletingDomain, setIsDeletingDomain] = React.useState(false)
  const [domainEmailConfig, setDomainEmailConfig] = React.useState({
    fromEmail: '',
    fromName: '',
    replyToEmail: ''
  })
  const [isSavingDomainConfig, setIsSavingDomainConfig] = React.useState(false)

  React.useEffect(() => {
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSettings = async () => {
    setLoading(true)

    try {
      const user = getCurrentUser()
      const token = getAuthToken()

      if (!user || !token) {
        console.error('[Settings] No user or token found')
        // router.push('/sign-in')
        return
      }

      // Load firm settings from API
      const firmResponse = await fetch(
        getApiUrl(API_CONFIG.endpoints.getFirmSettings),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (firmResponse.ok) {
        const firmData = await firmResponse.json()
        if (firmData.success && firmData.data) {
          setSettings({
            firmName: firmData.data.firmName || 'My Firm',
            firmLogo: firmData.data.firmLogo || null,
            firmDescription: firmData.data.firmDescription || null,
            firmWebsite: firmData.data.firmWebsite || null,
            firmAddress: firmData.data.firmAddress || null,
            firmPhone: firmData.data.firmPhone || null,
            firmEmail: firmData.data.firmEmail || null,
            updatedAt: firmData.data.updatedAt ? new Date(firmData.data.updatedAt) : new Date(),
          })
        }
      } else {
        // Fallback to localStorage if API fails
        const loadedSettings = getFirmSettings()
        setSettings(loadedSettings)
      }

      // Get current user role
      const userRole = user.role ?? null
      setCurrentUserRole(userRole)

      // Load users from API (only for root users)
      if (userRole === 0) {
        try {
          const usersResponse = await fetch(
            getApiUrl(API_CONFIG.endpoints.getAllUsers),
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )

          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            if (usersData.success && usersData.data) {
              // Map API data to match User interface
              const mappedUsers = usersData.data.map((user: any) => ({
                ...user,
                status: user.isActive !== undefined
                  ? (user.isActive ? 'active' : 'inactive')
                  : (user.status || 'active')
              }))
              setUsers(mappedUsers)
            }
          } else {
            // Fallback to localStorage if API fails
            const loadedUsers = getUsers()
            setUsers(loadedUsers)
          }
        } catch (error) {
          console.error('[Settings] Error loading users:', error)
          // Fallback to localStorage
          const loadedUsers = getUsers()
          setUsers(loadedUsers)
        }
      }

      // Load notification settings from API
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
          setInvestorActivity(notifData.data.investorActivityNotifications ?? true)
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

      // Load email configuration from API using user-specific endpoint
      if (user.id) {
        const emailConfigResponse = await fetch(
          getApiUrl(API_CONFIG.endpoints.getUserEmailSettings(user.id)),
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (emailConfigResponse.ok) {
          const emailData = await emailConfigResponse.json()
          if (emailData.success && emailData.data) {
            setEmailConfig({
              smtpHost: emailData.data.smtpHost || '',
              smtpPort: emailData.data.smtpPort || '587',
              smtpUsername: emailData.data.smtpUsername || '',
              smtpPassword: '', // Don't load password for security
              fromEmail: emailData.data.fromEmail || '',
              fromName: emailData.data.fromName || '',
              replyToEmail: emailData.data.replyToEmail || '',
              smtpSecure: emailData.data.smtpSecure ?? true,
              encryption: emailData.data.encryption || 'tls',
              testEmail: '',
            })
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
          console.log('[Settings] MFA Status:', mfaData.data)
        }
      }
    } catch (error) {
      console.error('[Settings] Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Store the file for upload
    setLogoFile(file)

    // Create preview URL
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

  const handleSaveFirmSettings = async () => {
    if (!settings) return

    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const formData = new FormData()

      // Add text fields
      formData.append('firmName', settings.firmName || '')
      formData.append('firmDescription', settings.firmDescription || '')
      formData.append('firmWebsite', settings.firmWebsite || '')
      formData.append('firmAddress', settings.firmAddress || '')
      formData.append('firmPhone', settings.firmPhone || '')
      formData.append('firmEmail', settings.firmEmail || '')

      // Add logo file if available
      if (logoFile) {
        formData.append('firmLogo', logoFile)
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.updateFirmSettings),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update firm settings')
      }

      // Also save to localStorage as backup
      saveFirmSettings(settings)

      toast.success('Firm settings saved successfully!')

      // Send email notification about firm settings update
      const notificationSettings = getNotificationSettings()
      const user = getCurrentUser()

      if (user?.id && user?.email && notificationSettings.generalAnnouncements) {
        try {
          const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })

          await sendInvestorActivityEmail(
            user.id,
            user.email,
            {
              investorName: user.email,
              activityType: 'Firm Settings Updated',
              activityDescription: `Your firm settings have been successfully updated. Changes include firm name, contact information, and other administrative details. If you did not make these changes, please contact support immediately.`,
              date: currentDate,
              fundManagerName: 'Polibit Team',
              fundManagerEmail: 'support@polibit.com',
            }
          )
        } catch (emailError) {
          console.error('[Settings] Error sending firm settings update notification:', emailError)
          // Don't throw - email failure shouldn't block the settings update
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    }
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
            investorActivityNotifications: investorActivity,
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
      console.error('[Settings] Error verifying MFA:', error)
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

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {

        // Check if it's an expired token error
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Settings] 401 Unauthorized - clearing session and redirecting to login')
            localStorage.clear()
            toast.error('Session expired. Please login again.')
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
        const user = getCurrentUser()
        if (user?.id && user?.email && notificationSettings.generalAnnouncements) {
          try {
            const currentDate = new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })

            await sendInvestorActivityEmail(
              user.id,
              user.email,
              {
                investorName: user.email,
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
      console.error('[Settings] Error unenrolling from MFA:', error)
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
        const user = getCurrentUser()
        if (user?.id && user?.email && notificationSettings.generalAnnouncements) {
          try {
            const currentDate = new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })

            await sendInvestorActivityEmail(
              user.id,
              user.email,
              {
                investorName: user.email,
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
      console.error('[Settings] Error retrying enrollment:', error)
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
      // router.push('/sign-in')
      return
    }

    // Get Supabase tokens from auth state
    const supabaseAuth = getSupabaseAuth()

    if (!supabaseAuth?.accessToken || !supabaseAuth?.refreshToken) {
      toast.error('Session expired. Please login again.')
      // router.push('/sign-in')
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

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {

        // Check if it's an expired token error
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Settings] 401 Unauthorized - clearing session and redirecting to login')
            localStorage.clear()
            toast.error('Session expired. Please login again.')
            // router.push('/sign-in')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

      const data = await response.json()

      // If enrollment fails because factor already exists, show verification dialog
      if (!data.success && data.error && data.error.includes('already exists')) {
        console.log('[Settings] Factor already exists, need to verify MFA first...')
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
        const user = getCurrentUser()
        if (user?.id && user?.email && notificationSettings.generalAnnouncements) {
          try {
            const currentDate = new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })

            await sendInvestorActivityEmail(
              user.id,
              user.email,
              {
                investorName: user.email,
                activityType: 'Multi-Factor Authentication Enabled',
                activityDescription: 'Two-factor authentication (2FA) has been successfully enabled on your account. This adds an extra layer of security to protect your account. If you did not make this change, please contact support immediately.',
                date: currentDate,
                fundManagerName: 'Polibit Security Team',
                fundManagerEmail: 'security@polibit.com',
              }
            )
          } catch (emailError) {
            console.error('[Settings] Error sending MFA enable notification:', emailError)
            // Don't throw - email failure shouldn't block the MFA enable flow
          }
        }
      } else {
        throw new Error(data.message || 'Failed to enroll in MFA')
      }
    } catch (error) {
      console.error('[Settings] Error enrolling in MFA:', error)
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

  const handleUserAdded = async () => {
    // Reload users from API
    try {
      const token = getAuthToken()
      if (token) {
        const usersResponse = await fetch(
          getApiUrl(API_CONFIG.endpoints.getAllUsers),
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          if (usersData.success && usersData.data) {
            const mappedUsers = usersData.data.map((user: any) => ({
              ...user,
              status: user.isActive !== undefined
                ? (user.isActive ? 'active' : 'inactive')
                : (user.status || 'active')
            }))
            setUsers(mappedUsers)
            return
          }
        }
      }
    } catch (error) {
      console.error('[Settings] Error reloading users:', error)
    }

    // Fallback to localStorage
    const loadedUsers = getUsers()
    setUsers(loadedUsers)
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: 'active' | 'inactive' | 'pending') => {
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const isActive = currentStatus === 'active'
      const newStatus = isActive ? 'inactive' : 'active'

      const response = await fetch(
        getApiUrl(`/api/users/${userId}/status`),
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: !isActive,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update user status')
      }

      // Update users list with the new status
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      )

      toast.success(`User ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`)
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId)
    setDeleteUserDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.deleteUser(userToDelete)),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      // Update users list by filtering out the deleted user
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete))

      // Also remove from localStorage as backup
      deleteUser(userToDelete)

      toast.success('User removed successfully')
      setDeleteUserDialogOpen(false)
      setUserToDelete(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to remove user')
    }
  }

  const getRoleLabelFromInt = (role: number): string => {
    switch (role) {
      case 0:
        return 'Root'
      case 1:
        return 'Admin'
      case 2:
        return 'Operations'
      case 3:
        return 'Investor'
      case 4:
        return 'Read-Only'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleSaveEmailConfig = async () => {
    try {
      setIsSavingEmail(true)
      const user = getCurrentUser()
      const token = getAuthToken()

      if (!token || !user?.id) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.updateUserEmailSettings(user.id)),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            smtpHost: emailConfig.smtpHost,
            smtpPort: parseInt(emailConfig.smtpPort),
            smtpSecure: emailConfig.smtpSecure,
            encryption: emailConfig.encryption,
            smtpUsername: emailConfig.smtpUsername,
            smtpPassword: emailConfig.smtpPassword || undefined,
            fromEmail: emailConfig.fromEmail,
            fromName: emailConfig.fromName,
            replyToEmail: emailConfig.replyToEmail,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save email configuration')
      }

      toast.success('Email configuration saved successfully!')
    } catch (error) {
      console.error('Error saving email config:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save email configuration')
    } finally {
      setIsSavingEmail(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!emailConfig.testEmail) {
      toast.error('Please enter a test email address')
      return
    }

    try {
      setIsSendingTest(true)
      const user = getCurrentUser()
      const token = getAuthToken()

      if (!token || !user?.id) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.sendTestEmail(user.id)),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: emailConfig.testEmail,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send test email')
      }

      toast.success(`Test email sent to ${emailConfig.testEmail}!`)
    } catch (error) {
      console.error('Error sending test email:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send test email')
    } finally {
      setIsSendingTest(false)
    }
  }

  // Email Domain Functions (Resend-based)
  const loadEmailDomains = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.getEmailDomains),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setEmailDomains(data.data)
          // Select first domain if available
          if (data.data.length > 0 && !selectedDomain) {
            const firstDomain = data.data[0]
            setSelectedDomain(firstDomain)
            setDomainEmailConfig({
              fromEmail: firstDomain.fromEmail || '',
              fromName: firstDomain.fromName || '',
              replyToEmail: firstDomain.replyToEmail || ''
            })
          }
        }
      }
    } catch (error) {
      console.error('Error loading email domains:', error)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomainName.trim()) {
      toast.error('Please enter a domain name')
      return
    }

    try {
      setIsAddingDomain(true)
      const token = getAuthToken()

      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.createEmailDomain),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domainName: newDomainName.toLowerCase().trim()
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add domain')
      }

      toast.success('Domain added! Please add the DNS records to verify.')
      setNewDomainName('')
      setSelectedDomain(data.data)
      setDomainEmailConfig({
        fromEmail: '',
        fromName: '',
        replyToEmail: ''
      })
      await loadEmailDomains()
    } catch (error) {
      console.error('Error adding domain:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add domain')
    } finally {
      setIsAddingDomain(false)
    }
  }

  const handleVerifyDomain = async () => {
    if (!selectedDomain) return

    try {
      setIsVerifyingDomain(true)
      const token = getAuthToken()

      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.verifyEmailDomain(selectedDomain.id)),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed')
      }

      if (data.verified) {
        toast.success('Domain verified successfully!')
      } else {
        toast.error('DNS records not yet verified. Please ensure all records are added correctly.')
      }

      setSelectedDomain(data.data)
      await loadEmailDomains()
    } catch (error) {
      console.error('Error verifying domain:', error)
      toast.error(error instanceof Error ? error.message : 'Verification failed')
    } finally {
      setIsVerifyingDomain(false)
    }
  }

  const handleSaveDomainEmailConfig = async () => {
    if (!selectedDomain) return

    if (!domainEmailConfig.fromEmail) {
      toast.error('From Email is required')
      return
    }

    // Validate that fromEmail uses the domain
    const emailDomain = domainEmailConfig.fromEmail.split('@')[1]
    if (emailDomain?.toLowerCase() !== selectedDomain.domainName.toLowerCase()) {
      toast.error(`From email must use the domain ${selectedDomain.domainName}`)
      return
    }

    try {
      setIsSavingDomainConfig(true)
      const token = getAuthToken()

      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.updateEmailDomainConfig(selectedDomain.id)),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(domainEmailConfig),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save configuration')
      }

      toast.success('Email configuration saved!')
      setSelectedDomain(data.data)
      await loadEmailDomains()
    } catch (error) {
      console.error('Error saving email config:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration')
    } finally {
      setIsSavingDomainConfig(false)
    }
  }

  const handleDeleteDomain = async () => {
    if (!selectedDomain) return

    if (!confirm(`Are you sure you want to delete the domain "${selectedDomain.domainName}"? This cannot be undone.`)) {
      return
    }

    try {
      setIsDeletingDomain(true)
      const token = getAuthToken()

      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.deleteEmailDomain(selectedDomain.id)),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to delete domain')
      }

      toast.success('Domain deleted successfully')
      setSelectedDomain(null)
      setDomainEmailConfig({
        fromEmail: '',
        fromName: '',
        replyToEmail: ''
      })
      await loadEmailDomains()
    } catch (error) {
      console.error('Error deleting domain:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete domain')
    } finally {
      setIsDeletingDomain(false)
    }
  }

  const handleSelectDomain = (domain: EmailDomainType) => {
    setSelectedDomain(domain)
    setDomainEmailConfig({
      fromEmail: domain.fromEmail || '',
      fromName: domain.fromName || '',
      replyToEmail: domain.replyToEmail || ''
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  // Load email domains on mount
  React.useEffect(() => {
    if (currentUserRole === 0 || currentUserRole === 1) {
      loadEmailDomains()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserRole])

  if (loading || !settings) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p>Loading settings...</p>
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
          Manage your firm settings, users, notifications, and security
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`grid w-full ${currentUserRole === 0 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <TabsTrigger value="firm">Firm</TabsTrigger>
          {currentUserRole === 0 && <TabsTrigger value="users">Users</TabsTrigger>}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Firm Settings Tab */}
        <TabsContent value="firm" className="space-y-4">
          {/* Firm Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Firm Branding
              </CardTitle>
              <CardDescription>
                Customize your firm's name and logo that appears in the sidebar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="space-y-2">
                <Label htmlFor="firmLogo">Firm Logo</Label>
                <div className="flex items-center gap-4">
                  {settings.firmLogo ? (
                    <div className="w-12 h-12 rounded border flex items-center justify-center overflow-hidden bg-white">
                      <img src={settings.firmLogo} alt="Firm logo" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded border flex items-center justify-center bg-muted">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
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
                      <Upload className="h-4 w-4 mr-2" />
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

              <Button onClick={handleSaveFirmSettings}>Save Firm Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
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
                  <Button size="sm" onClick={() => setShowAddUserModal(true)}>
                    <IconUserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    {users
                    .filter((user) => {
                      const userRole = typeof user.role === 'number' ? user.role : -1
                      // Always hide Investors (role 3)
                      if (userRole === 3) return false
                      // If current user is Admin (role 1), also hide Root users (role 0)
                      if (currentUserRole === 1 && userRole === 0) return false
                      return true
                    })
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {typeof user.role === 'number' ? getRoleLabelFromInt(user.role) : getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.status === 'active' ? 'default' : 'outline'}
                          >
                            {user.status === 'active' ? 'Active' : user.status === 'pending' ? 'Pending' : 'Inactive'}
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
                                onClick={() => handleToggleUserStatus(user.id, user.status)}
                              >
                                {user.status === 'active' ? 'Disable User' : 'Enable User'}
                              </DropdownMenuItem>
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
                      <Label className="text-sm font-normal">Investor activity</Label>
                      <Switch checked={investorActivity} onCheckedChange={setInvestorActivity} />
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

              {showAdvancedNotifications && (
                <>
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
                        Show notifications in the platform
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
                </>
              )}

              <Button onClick={handleUpdateNotifications}>Save Notification Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Configuration Tab */}
        <TabsContent value="email" className="space-y-4">
          {/* Add Domain Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Domain Configuration
              </CardTitle>
              <CardDescription>
                Configure your email domain for white-label email sending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Domain */}
              {currentUserRole === 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Add New Domain</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="yourdomain.com"
                      value={newDomainName}
                      onChange={(e) => setNewDomainName(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button onClick={handleAddDomain} disabled={isAddingDomain || !newDomainName.trim()}>
                      {isAddingDomain ? 'Adding...' : 'Add Domain'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your domain to send emails from (e.g., yourdomain.com)
                  </p>
                </div>
              )}

              {/* Domain List */}
              {emailDomains.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Your Domains</h3>
                  <div className="grid gap-2">
                    {emailDomains.map((domain) => (
                      <div
                        key={domain.id}
                        onClick={() => handleSelectDomain(domain)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedDomain?.id === domain.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{domain.domainName}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              domain.status === 'verified'
                                ? 'bg-green-100 text-green-700'
                                : domain.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {domain.status}
                            </span>
                          </div>
                          {domain.fromEmail && (
                            <span className="text-sm text-muted-foreground">{domain.fromEmail}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {emailDomains.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No email domains configured yet.</p>
                  {currentUserRole === 0 && (
                    <p className="text-sm">Add a domain above to get started.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Domain Details */}
          {selectedDomain && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedDomain.domainName}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedDomain.status === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : selectedDomain.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedDomain.status}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {selectedDomain.status === 'verified'
                        ? 'Domain is verified and ready to send emails'
                        : 'Add the DNS records below to verify your domain'}
                    </CardDescription>
                  </div>
                  {currentUserRole === 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteDomain}
                      disabled={isDeletingDomain}
                    >
                      {isDeletingDomain ? 'Deleting...' : 'Delete Domain'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Verify Domain Section - visible until verified */}
                {selectedDomain.status !== 'verified' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Domain Verification</h3>
                      <Button
                        onClick={handleVerifyDomain}
                        disabled={isVerifyingDomain}
                        size="sm"
                      >
                        {isVerifyingDomain ? 'Verifying...' : 'Verify Domain'}
                      </Button>
                    </div>

                    {/* DNS Records - only show if records exist */}
                    {selectedDomain.dnsRecords && selectedDomain.dnsRecords.length > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Add these DNS records to your domain provider (Cloudflare, GoDaddy, etc.):
                        </p>
                        <div className="space-y-3">
                          {selectedDomain.dnsRecords.map((record, index) => (
                            <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 rounded">
                                  {record.type}
                                </span>
                                {record.status && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    record.status === 'verified'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {record.status}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Name: </span>
                                  <code className="bg-background px-1 rounded">{record.name}</code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 ml-1"
                                    onClick={() => copyToClipboard(record.name)}
                                  >
                                    <span className="text-xs">📋</span>
                                  </Button>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">TTL: </span>
                                  <span>{record.ttl || 'Auto'}</span>
                                </div>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Value: </span>
                                <code className="bg-background px-1 rounded text-xs break-all">{record.value}</code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 ml-1"
                                  onClick={() => copyToClipboard(record.value)}
                                >
                                  <span className="text-xs">📋</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click &quot;Verify Domain&quot; to check DNS verification status.
                      </p>
                    )}
                  </div>
                )}

                {/* Email Configuration */}
                {selectedDomain.status === 'verified' && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold">Email Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="domainFromEmail">From Email *</Label>
                          <Input
                            id="domainFromEmail"
                            type="email"
                            value={domainEmailConfig.fromEmail}
                            onChange={(e) => setDomainEmailConfig({ ...domainEmailConfig, fromEmail: e.target.value })}
                            placeholder={`notifications@${selectedDomain.domainName}`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Must use @{selectedDomain.domainName}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="domainFromName">From Name</Label>
                          <Input
                            id="domainFromName"
                            value={domainEmailConfig.fromName}
                            onChange={(e) => setDomainEmailConfig({ ...domainEmailConfig, fromName: e.target.value })}
                            placeholder="Your Company Name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="domainReplyTo">Reply-To Email</Label>
                        <Input
                          id="domainReplyTo"
                          type="email"
                          value={domainEmailConfig.replyToEmail}
                          onChange={(e) => setDomainEmailConfig({ ...domainEmailConfig, replyToEmail: e.target.value })}
                          placeholder="support@yourcompany.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          Where replies will be sent (can be any email)
                        </p>
                      </div>

                      <Button
                        onClick={handleSaveDomainEmailConfig}
                        disabled={isSavingDomainConfig}
                      >
                        {isSavingDomainConfig ? 'Saving...' : 'Save Email Configuration'}
                      </Button>
                    </div>
                  </>
                )}

                {/* Test Email Section */}
                {selectedDomain.status === 'verified' && selectedDomain.fromEmail && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold">Test Email</h3>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="test@example.com"
                          value={emailConfig.testEmail}
                          onChange={(e) => setEmailConfig({ ...emailConfig, testEmail: e.target.value })}
                          className="max-w-sm"
                        />
                        <Button
                          onClick={handleSendTestEmail}
                          disabled={isSendingTest || !emailConfig.testEmail}
                          variant="outline"
                        >
                          {isSendingTest ? 'Sending...' : 'Send Test'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
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
      </Tabs>

      {/* Modals */}
      <AddUserModal
        open={showAddUserModal}
        onOpenChange={setShowAddUserModal}
        onUserAdded={handleUserAdded}
        currentUserRole={currentUserRole ?? 1}
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
