"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { getAuthToken, getAuthState, logout } from "@/lib/auth-storage"

type InvestorType = 'Individual' | 'Institution' | 'Family Office' | 'Fund of Funds'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: number
}

interface Structure {
  id: string
  name: string
  type: string
  subtype?: string
}

export default function AddInvestorPage() {
  const router = useRouter()

  // Check if user is guest
  const authState = getAuthState()
  const currentUserRole = authState.user?.role ?? null
  const isGuest = currentUserRole === 4

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [structures, setStructures] = useState<Structure[]>([])
  const [users, setUsers] = useState<User[]>([])

  // Form state
  const [userMode, setUserMode] = useState<'create' | 'existing'>('create')
  const [investorType, setInvestorType] = useState<InvestorType>('Individual')
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedStructure, setSelectedStructure] = useState("")

  // New user fields (when userMode === 'create')
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)

  // Common fields
  const [email, setEmail] = useState("")

  // Type-specific required fields (for existing user mode)
  const [fullName, setFullName] = useState("")
  const [institutionName, setInstitutionName] = useState("")
  const [fundName, setFundName] = useState("")
  const [officeName, setOfficeName] = useState("")

  // Custom terms (per-investor overrides, dynamic based on structure type)
  const [feeDiscount, setFeeDiscount] = useState("")
  const [vatExempt, setVatExempt] = useState(false)
  const [preferredReturnOverride, setPreferredReturnOverride] = useState("")
  const [performanceFeeOverride, setPerformanceFeeOverride] = useState("")
  const [interestRateOverride, setInterestRateOverride] = useState("")
  const [grossInterestRateOverride, setGrossInterestRateOverride] = useState("")

  // Closing Tranche (tracks which closing round investor joined)
  const [closingTranche, setClosingTranche] = useState<'initial' | 'second' | 'third' | 'final' | 'custom' | ''>('')
  const [closingDate, setClosingDate] = useState("")
  const [closingTrancheCustomName, setClosingTrancheCustomName] = useState("")

  // Load structures and non-investor users
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        const token = getAuthToken()
        if (!token) {
          setError('Authentication required. Please log in.')
          setIsLoading(false)
          return
        }

        // Fetch structures
        const structuresUrl = getApiUrl(API_CONFIG.endpoints.getAllStructures)
        const structuresResponse = await fetch(structuresUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        // Handle 401 Unauthorized - session expired or invalid
        if (structuresResponse.status === 401) {
          try {
            const errorData = await structuresResponse.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Investors Add] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

        if (!structuresResponse.ok) {
          throw new Error('Failed to fetch structures')
        }

        const structuresResult = await structuresResponse.json()
        if (structuresResult.success && Array.isArray(structuresResult.data)) {
          setStructures(structuresResult.data)
        }

        // Fetch existing investor users (role 3 only)
        const usersUrl = getApiUrl(API_CONFIG.endpoints.getUsersByRole('3'))
        const usersResponse = await fetch(usersUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        // Handle 401 Unauthorized - session expired or invalid
        if (usersResponse.status === 401) {
          try {
            const errorData = await usersResponse.json()
            if (errorData.error === "Invalid or expired token") {
              console.log('[Investors Add] 401 Unauthorized - clearing session and redirecting to login')
              logout()
              router.push('/sign-in')
              return
            }
          } catch (e) {
            console.log('Error: ', e)
          }
        }

        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users')
        }

        const usersResult = await usersResponse.json()
        if (usersResult.success && Array.isArray(usersResult.data)) {
          setUsers(usersResult.data)
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data')
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update email when user is selected (for existing user mode)
  useEffect(() => {
    if (userMode === 'existing' && selectedUserId) {
      const user = users.find(u => u.id === selectedUserId)
      if (user) {
        setEmail(user.email)
      }
    }
  }, [selectedUserId, users, userMode])

  // Determine which custom terms to show based on selected structure type
  const selectedStructureData = structures.find(s => s.id === selectedStructure)
  const structureType = selectedStructureData?.type || ''
  const structureSubtype = selectedStructureData?.subtype || ''

  const isFullFeatured = structureType === 'fund' ||
    (structureType === 'fideicomiso' && structureSubtype === 'multi-property')
  const isPrivateDebt = structureType === 'private-debt'
  const isSimple = structureType === 'sa' ||
    (structureType === 'fideicomiso' && structureSubtype !== 'multi-property')

  // Fund & Multi-Property Trust: fee discount, VAT, preferred return, performance fee
  // SA/LLC & Single-Property Trust: fee discount, VAT, preferred return
  // Private Debt: fee discount, VAT, interest rate, gross interest rate
  const showPreferredReturn = isFullFeatured || isSimple
  const showPerformanceFee = isFullFeatured
  const showInterestRates = isPrivateDebt

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStructure) {
      toast.error("Please select a structure")
      return
    }

    // Validate based on user mode
    if (userMode === 'create') {
      if (!email) {
        toast.error("Please enter email")
        return
      }
      if (!newFirstName) {
        toast.error("Please enter first name")
        return
      }
      if (!newPassword) {
        toast.error("Please enter a password")
        return
      }
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters")
        return
      }
      // Validate type-specific required fields for new user
      // Individual uses firstName (already validated above)
      if (investorType === 'Institution' && !institutionName) {
        toast.error("Please enter institution name")
        return
      }
      if (investorType === 'Family Office' && !officeName) {
        toast.error("Please enter office name")
        return
      }
      if (investorType === 'Fund of Funds' && !fundName) {
        toast.error("Please enter fund name")
        return
      }
    } else {
      if (!selectedUserId) {
        toast.error("Please select a user")
        return
      }
    }

    try {
      setIsSubmitting(true)

      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required. Please log in.')
        setIsSubmitting(false)
        return
      }

      // Build payload - custom terms always included (per-structure)
      const payload: any = {
        structureId: selectedStructure,
        // Custom terms
        feeDiscount: feeDiscount ? parseFloat(feeDiscount) : 0,
        vatExempt,
        customTerms: {
          ...(showPreferredReturn && preferredReturnOverride ? { preferredReturn: parseFloat(preferredReturnOverride) } : {}),
          ...(showPerformanceFee && performanceFeeOverride ? { performanceFee: parseFloat(performanceFeeOverride) } : {}),
          ...(showInterestRates && interestRateOverride ? { interestRate: parseFloat(interestRateOverride) } : {}),
          ...(showInterestRates && grossInterestRateOverride ? { grossInterestRate: parseFloat(grossInterestRateOverride) } : {}),
        },
        // Closing Tranche (tracks which closing round investor joined)
        ...(closingTranche ? { closingTranche } : {}),
        ...(closingDate ? { closingDate } : {}),
        ...(closingTranche === 'custom' && closingTrancheCustomName ? { closingTrancheCustomName } : {}),
      }

      if (userMode === 'create') {
        // New user: send account data with investor type and type-specific fields
        payload.createUser = true
        payload.firstName = newFirstName
        payload.lastName = newLastName
        payload.email = email
        payload.password = newPassword
        payload.sendWelcomeEmail = sendWelcomeEmail
        payload.investorType = investorType
        // Add type-specific required fields
        if (investorType === 'Institution') {
          payload.institutionName = institutionName
        } else if (investorType === 'Family Office') {
          payload.officeName = officeName
        } else if (investorType === 'Fund of Funds') {
          payload.fundName = fundName
        }
        // Individual uses firstName which is already sent
      } else {
        // Existing user: only send userId (API uses existing user's investorType)
        payload.userId = selectedUserId
      }

      const apiUrl = getApiUrl(API_CONFIG.endpoints.createInvestor)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {
        try {
          const errorData = await response.json()
          if (errorData.error === "Invalid or expired token") {
            console.log('[Investors Add] 401 Unauthorized - clearing session and redirecting to login')
            logout()
            router.push('/sign-in')
            return
          }
        } catch (e) {
          console.log('Error: ', e)
        }
      }

      // Handle 403 Subscription Limit Exceeded
      if (response.status === 403) {
        const errorData = await response.json()
        if (errorData.error === 'Subscription Limit Exceeded') {
          toast.error(`Subscription Limit Reached`, {
            description: `You have ${errorData.currentCount}/${errorData.limit} investors. ${errorData.upgradeOption ? `Upgrade to ${errorData.upgradeOption.name} for more.` : 'Contact support to increase your limit.'}`,
            duration: 8000
          })
          setIsSubmitting(false)
          return
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create investor')
      }

      const result = await response.json()

      if (result.userCreated) {
        toast.success(result.emailSent
          ? 'Investor and user account created. Welcome email sent.'
          : 'Investor and user account created successfully.')
      } else {
        toast.success('Investor created successfully')
      }
      router.push('/investment-manager/investors')
    } catch (err: any) {
      console.error('Error creating investor:', err)
      toast.error(err.message || 'Failed to create investor')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading...</h3>
            <p className="text-muted-foreground">Please wait while we fetch the data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/investment-manager/investors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Investor</h1>
          <p className="text-muted-foreground mt-1">
            Add a new investor to a structure
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Investor Information</CardTitle>
            <CardDescription>
              Select investor type and fill in the required information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Structure Selection */}
            <div className="space-y-2">
              <Label htmlFor="structure">Structure *</Label>
              <Select value={selectedStructure} onValueChange={setSelectedStructure}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a structure" />
                </SelectTrigger>
                <SelectContent>
                  {structures.map((structure) => (
                    <SelectItem key={structure.id} value={structure.id}>
                      {structure.name} ({structure.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Mode Toggle */}
            <div className="space-y-4">
              <Label>User Account *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={userMode === 'create' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setUserMode('create'); setSelectedUserId(""); setFullName(""); setInstitutionName(""); setFundName(""); setOfficeName("") }}
                >
                  Create New User
                </Button>
                <Button
                  type="button"
                  variant={userMode === 'existing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setUserMode('existing'); setNewFirstName(""); setNewLastName(""); setNewPassword("") }}
                >
                  Select Existing User
                </Button>
              </div>

              {userMode === 'create' ? (
                <div className="space-y-6 p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    A new user account will be created with investor access to the LP Portal.
                  </p>

                  {/* Account Credentials */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newFirstName">First Name *</Label>
                      <Input
                        id="newFirstName"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        placeholder="First name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newLastName">Last Name</Label>
                      <Input
                        id="newLastName"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">Email *</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="investor@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Password *</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sendWelcomeEmail" className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="sendWelcomeEmail"
                        checked={sendWelcomeEmail}
                        onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                        className="rounded"
                      />
                      Send welcome email with login credentials
                    </Label>
                  </div>

                  {/* Investor Type Selection */}
                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="investorType">Investor Type *</Label>
                    <Select value={investorType} onValueChange={(value) => setInvestorType(value as InvestorType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investor type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Institution">Institution</SelectItem>
                        <SelectItem value="Family Office">Family Office</SelectItem>
                        <SelectItem value="Fund of Funds">Fund of Funds</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Additional profile details and bank information can be managed by the investor in their LP Portal settings.
                    </p>
                  </div>

                  {/* Type-specific required fields for new user */}
                  {investorType === 'Institution' && (
                    <div className="space-y-2">
                      <Label htmlFor="institutionNameCreate">Institution Name *</Label>
                      <Input
                        id="institutionNameCreate"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="Institution name"
                        required
                      />
                    </div>
                  )}
                  {investorType === 'Family Office' && (
                    <div className="space-y-2">
                      <Label htmlFor="officeNameCreate">Office Name *</Label>
                      <Input
                        id="officeNameCreate"
                        value={officeName}
                        onChange={(e) => setOfficeName(e.target.value)}
                        placeholder="Family office name"
                        required
                      />
                    </div>
                  )}
                  {investorType === 'Fund of Funds' && (
                    <div className="space-y-2">
                      <Label htmlFor="fundNameCreate">Fund Name *</Label>
                      <Input
                        id="fundNameCreate"
                        value={fundName}
                        onChange={(e) => setFundName(e.target.value)}
                        placeholder="Fund name"
                        required
                      />
                    </div>
                  )}

                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="existingUser">Select User *</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an existing investor" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select an existing investor user to assign to this structure. Profile data is already stored on their account.
                  </p>
                </div>
              )}
            </div>

            {/* Custom terms (per-investor overrides, dynamic based on structure type) */}
            {selectedStructure && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium">Custom terms</h3>
              <p className="text-xs text-muted-foreground">
                Per-investor overrides for the selected structure
              </p>
              <div className="space-y-4">
                {/* VAT Exempt - always shown */}
                <div className="space-y-2">
                  <Label htmlFor="vatExempt" className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="vatExempt"
                      checked={vatExempt}
                      onChange={(e) => setVatExempt(e.target.checked)}
                      className="rounded"
                    />
                    VAT Exempt
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Exempts this investor from VAT on fees
                  </p>
                </div>

                {/* Closing Tranche - tracks which closing round investor joined */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">Closing Tranche</h4>
                  <p className="text-xs text-muted-foreground">
                    Track which closing round this investor joined (for capital call tracking)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="closingTranche">Closing Round</Label>
                      <Select value={closingTranche} onValueChange={(value) => setClosingTranche(value as typeof closingTranche)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select closing round" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="initial">Initial Closing</SelectItem>
                          <SelectItem value="second">Second Closing</SelectItem>
                          <SelectItem value="third">Third Closing</SelectItem>
                          <SelectItem value="final">Final Closing</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="closingDate">Closing Date</Label>
                      <Input
                        id="closingDate"
                        type="date"
                        value={closingDate}
                        onChange={(e) => setClosingDate(e.target.value)}
                      />
                    </div>
                  </div>
                  {closingTranche === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="closingTrancheCustomName">Custom Closing Name</Label>
                      <Input
                        id="closingTrancheCustomName"
                        value={closingTrancheCustomName}
                        onChange={(e) => setClosingTrancheCustomName(e.target.value)}
                        placeholder="e.g., Extension Round, Bridge Closing"
                      />
                    </div>
                  )}
                </div>

                {/* Management Fee Discount - always shown, first field after tranche info */}
                <div className="space-y-2">
                  <Label htmlFor="feeDiscount">Management Fee Discount (%)</Label>
                  <Input
                    id="feeDiscount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={feeDiscount}
                    onChange={(e) => setFeeDiscount(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentage discount applied to the structure&apos;s management fee for this investor (0-100%)
                  </p>
                </div>

                {/* Preferred Return Override - Fund, Multi-Property Trust, SA/LLC, Single-Property Trust */}
                {showPreferredReturn && (
                  <div className="space-y-2">
                    <Label htmlFor="preferredReturnOverride">Preferred Return Override (%)</Label>
                    <Input
                      id="preferredReturnOverride"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={preferredReturnOverride}
                      onChange={(e) => setPreferredReturnOverride(e.target.value)}
                      placeholder="Leave empty to use structure default"
                    />
                    <p className="text-xs text-muted-foreground">
                      Override the preferred return rate for this investor
                    </p>
                  </div>
                )}

                {/* Performance Fee Override - Fund & Multi-Property Trust only */}
                {showPerformanceFee && (
                  <div className="space-y-2">
                    <Label htmlFor="performanceFeeOverride">Performance Fee Override (%)</Label>
                    <Input
                      id="performanceFeeOverride"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={performanceFeeOverride}
                      onChange={(e) => setPerformanceFeeOverride(e.target.value)}
                      placeholder="Leave empty to use structure default"
                    />
                    <p className="text-xs text-muted-foreground">
                      Override the carried interest / performance fee for this investor
                    </p>
                  </div>
                )}

                {/* Interest Rate Override - Private Debt only */}
                {showInterestRates && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="interestRateOverride">Interest Rate Override (%)</Label>
                      <Input
                        id="interestRateOverride"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={interestRateOverride}
                        onChange={(e) => setInterestRateOverride(e.target.value)}
                        placeholder="Leave empty to use structure default"
                      />
                      <p className="text-xs text-muted-foreground">
                        Override the base interest rate (brute) for this investor
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grossInterestRateOverride">Gross Interest Rate Override (%)</Label>
                      <Input
                        id="grossInterestRateOverride"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={grossInterestRateOverride}
                        onChange={(e) => setGrossInterestRateOverride(e.target.value)}
                        placeholder="Leave empty to use structure default"
                      />
                      <p className="text-xs text-muted-foreground">
                        Override the annual gross interest rate for this investor
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/investment-manager/investors')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {!isGuest && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Investor'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
