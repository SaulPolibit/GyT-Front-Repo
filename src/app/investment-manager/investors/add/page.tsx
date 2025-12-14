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
import { getAuthToken } from "@/lib/auth-storage"

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
}

export default function AddInvestorPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [structures, setStructures] = useState<Structure[]>([])
  const [users, setUsers] = useState<User[]>([])

  // Form state
  const [investorType, setInvestorType] = useState<InvestorType>('Individual')
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedStructure, setSelectedStructure] = useState("")

  // Common fields
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [country, setCountry] = useState("United States")
  const [taxId, setTaxId] = useState("")
  const [kycStatus, setKycStatus] = useState("Not Started")
  const [accreditedInvestor, setAccreditedInvestor] = useState(false)
  const [riskTolerance, setRiskTolerance] = useState("")
  const [investmentPreferences, setInvestmentPreferences] = useState("")

  // Individual fields
  const [fullName, setFullName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [nationality, setNationality] = useState("")
  const [passportNumber, setPassportNumber] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")

  // Institution fields
  const [institutionName, setInstitutionName] = useState("")
  const [institutionType, setInstitutionType] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [legalRepresentative, setLegalRepresentative] = useState("")

  // Fund of Funds fields
  const [fundName, setFundName] = useState("")
  const [fundManager, setFundManager] = useState("")
  const [aum, setAum] = useState("")

  // Family Office fields
  const [officeName, setOfficeName] = useState("")
  const [familyName, setFamilyName] = useState("")
  const [principalContact, setPrincipalContact] = useState("")
  const [assetsUnderManagement, setAssetsUnderManagement] = useState("")

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

        if (!structuresResponse.ok) {
          throw new Error('Failed to fetch structures')
        }

        const structuresResult = await structuresResponse.json()
        if (structuresResult.success && Array.isArray(structuresResult.data)) {
          setStructures(structuresResult.data)
        }

        // Fetch non-investor users (users with role 0, 1, or 2)
        const usersUrl = getApiUrl(API_CONFIG.endpoints.getUsersByRole('0,1,2'))
        const usersResponse = await fetch(usersUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

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

  // Update email and name when user is selected (for Individual type)
  useEffect(() => {
    if (investorType === 'Individual' && selectedUserId) {
      const user = users.find(u => u.id === selectedUserId)
      if (user) {
        setEmail(user.email)
        setFullName(`${user.firstName} ${user.lastName}`.trim())
      }
    }
  }, [selectedUserId, investorType, users])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStructure) {
      toast.error("Please select a structure")
      return
    }

    // Validation based on investor type
    if (investorType === 'Individual') {
      if (!selectedUserId) {
        toast.error("Please select a user")
        return
      }
    } else {
      if (!email) {
        toast.error("Please enter email")
        return
      }

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
    }

    try {
      setIsSubmitting(true)

      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required. Please log in.')
        setIsSubmitting(false)
        return
      }

      // Build payload based on investor type
      const payload: any = {
        investorType,
        email,
        phoneNumber,
        country,
        taxId,
        kycStatus,
        accreditedInvestor,
        riskTolerance,
        investmentPreferences,
        structureId: selectedStructure,
        userId: selectedUserId || undefined, // Include userId for all types if selected
      }

      if (investorType === 'Individual') {
        payload.fullName = fullName
        payload.dateOfBirth = dateOfBirth
        payload.nationality = nationality
        payload.passportNumber = passportNumber
        payload.addressLine1 = addressLine1
        payload.addressLine2 = addressLine2
        payload.city = city
        payload.state = state
        payload.postalCode = postalCode
      } else if (investorType === 'Institution') {
        payload.institutionName = institutionName
        payload.institutionType = institutionType
        payload.registrationNumber = registrationNumber
        payload.legalRepresentative = legalRepresentative
      } else if (investorType === 'Fund of Funds') {
        payload.fundName = fundName
        payload.fundManager = fundManager
        payload.aum = aum ? parseFloat(aum) : undefined
      } else if (investorType === 'Family Office') {
        payload.officeName = officeName
        payload.familyName = familyName
        payload.principalContact = principalContact
        payload.assetsUnderManagement = assetsUnderManagement ? parseFloat(assetsUnderManagement) : undefined
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create investor')
      }

      const result = await response.json()

      toast.success('Investor created successfully')
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

            {/* Investor Type Selection */}
            <div className="space-y-2">
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
            </div>

            {/* User Selection - Always shown */}
            <div className="space-y-2">
              <Label htmlFor="user">Associate User {investorType === 'Individual' ? '*' : '(Optional)'}</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
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
                {investorType === 'Individual'
                  ? 'Email and name will be taken from the selected user'
                  : 'Optionally associate a user account with this investor'}
              </p>
            </div>

            {/* Individual: Additional fields */}
            {investorType === 'Individual' && (
              <>

                {/* Individual specific fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      placeholder="e.g., United States"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportNumber">Passport Number</Label>
                    <Input
                      id="passportNumber"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="Passport number"
                    />
                  </div>
                </div>

                {/* Address fields */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Address</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input
                        id="addressLine1"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Street address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2</Label>
                      <Input
                        id="addressLine2"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Apt, suite, etc. (optional)"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="State"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="Postal code"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Institution Fields */}
            {investorType === 'Institution' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="institution@example.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="institutionName">Institution Name *</Label>
                    <Input
                      id="institutionName"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder="Institution name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institutionType">Institution Type</Label>
                    <Input
                      id="institutionType"
                      value={institutionType}
                      onChange={(e) => setInstitutionType(e.target.value)}
                      placeholder="e.g., Bank, Insurance, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="Registration number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalRepresentative">Legal Representative</Label>
                    <Input
                      id="legalRepresentative"
                      value={legalRepresentative}
                      onChange={(e) => setLegalRepresentative(e.target.value)}
                      placeholder="Name of legal representative"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Family Office Fields */}
            {investorType === 'Family Office' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="office@example.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="officeName">Office Name *</Label>
                    <Input
                      id="officeName"
                      value={officeName}
                      onChange={(e) => setOfficeName(e.target.value)}
                      placeholder="Family office name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="familyName">Family Name</Label>
                    <Input
                      id="familyName"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="Family name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="principalContact">Principal Contact</Label>
                    <Input
                      id="principalContact"
                      value={principalContact}
                      onChange={(e) => setPrincipalContact(e.target.value)}
                      placeholder="Contact person name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assetsUnderManagement">Assets Under Management</Label>
                    <Input
                      id="assetsUnderManagement"
                      type="number"
                      value={assetsUnderManagement}
                      onChange={(e) => setAssetsUnderManagement(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Fund of Funds Fields */}
            {investorType === 'Fund of Funds' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="fund@example.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fundName">Fund Name *</Label>
                    <Input
                      id="fundName"
                      value={fundName}
                      onChange={(e) => setFundName(e.target.value)}
                      placeholder="Fund name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fundManager">Fund Manager</Label>
                    <Input
                      id="fundManager"
                      value={fundManager}
                      onChange={(e) => setFundManager(e.target.value)}
                      placeholder="Manager name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aum">AUM (Assets Under Management)</Label>
                    <Input
                      id="aum"
                      type="number"
                      value={aum}
                      onChange={(e) => setAum(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Common fields for all types */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="Tax ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kycStatus">KYC Status</Label>
                  <Select value={kycStatus} onValueChange={setKycStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                  <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk tolerance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conservative">Conservative</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="investmentPreferences">Investment Preferences</Label>
                  <Input
                    id="investmentPreferences"
                    value={investmentPreferences}
                    onChange={(e) => setInvestmentPreferences(e.target.value)}
                    placeholder="e.g., Real Estate, Technology, Healthcare"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accreditedInvestor" className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="accreditedInvestor"
                      checked={accreditedInvestor}
                      onChange={(e) => setAccreditedInvestor(e.target.checked)}
                      className="rounded"
                    />
                    Accredited Investor
                  </Label>
                </div>
              </div>
            </div>

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
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
