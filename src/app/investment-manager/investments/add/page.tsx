"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building2, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Structure } from "@/lib/structures-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { getAuthToken, getAuthState, logout } from "@/lib/auth-storage"

export default function AddInvestmentPage() {
  const router = useRouter()

  // Check if user is guest
  const authState = getAuthState()
  const currentUserRole = authState.user?.role ?? null
  const isGuest = currentUserRole === 4

  const [structures, setStructures] = useState<Structure[]>([])
  const [selectedStructure, setSelectedStructure] = useState<string>("")
  const [capacityInfo, setCapacityInfo] = useState<{ canAdd: boolean; current: number; max: number } | null>(null)
  const [issuanceInfo, setIssuanceInfo] = useState<{ canAdd: boolean; current: number; max: number; required: number } | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [type, setType] = useState<"Real Estate" | "Private Equity" | "Private Debt">("Real Estate")
  const [sector, setSector] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [investmentType, setInvestmentType] = useState<"Equity" | "Debt" | "Mixed">("Equity")
  const [equityPosition, setEquityPosition] = useState("")
  const [debtPosition, setDebtPosition] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [maturityDate, setMaturityDate] = useState("")
  const [totalInvestmentSize, setTotalInvestmentSize] = useState("")
  const [fundCommitment, setFundCommitment] = useState("")
  const [visibilityType, setVisibilityType] = useState<"public" | "fund-specific" | "private">("public")

  useEffect(() => {
    async function fetchStructures() {
      try {
        const token = getAuthToken()
        if (!token) {
          console.error('No authentication token found')
          return
        }

        const apiUrl = getApiUrl(API_CONFIG.endpoints.getAllStructures)

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          // Handle 401 Unauthorized - Invalid or expired token
          if (response.status === 401) {
            console.log('[Auth] 401 Unauthorized - Clearing session and redirecting to login')
            logout()
            window.location.href = '/sign-in'
            return
          }
        } else {
          const result = await response.json()
          if (result.success && Array.isArray(result.data)) {
            setStructures(result.data)
          }
        }
      } catch (err) {
        console.error('Error fetching structures:', err)
      }
    }

    fetchStructures()
  }, [])

  // Check capacity when structure is selected
  useEffect(() => {
    if (selectedStructure && structures.length > 0) {
      const structure = structures.find(s => s.id === selectedStructure)
      if (structure) {
        const max = parseInt(structure.plannedInvestments || '0')
        const current = structure.currentInvestments || 0
        setCapacityInfo({
          canAdd: current < max,
          current: current,
          max: max
        })
      } else {
        setCapacityInfo(null)
      }
    } else {
      setCapacityInfo(null)
    }
  }, [selectedStructure, structures])

  // Check issuance capacity when structure or investment type changes
  useEffect(() => {
    if (selectedStructure && structures.length > 0) {
      const structure = structures.find(s => s.id === selectedStructure)
      if (structure) {
        const max = 50
        const current = 0
        const required = investmentType === 'Mixed' ? 2 : 1
        setIssuanceInfo({
          canAdd: current + required <= max,
          current: current,
          max: max,
          required: required
        })
      } else {
        setIssuanceInfo(null)
      }
    } else {
      setIssuanceInfo(null)
    }
  }, [selectedStructure, investmentType, structures])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStructure) {
      toast.error("Please select a fund/structure")
      return
    }

    // Check capacity before submitting
    if (capacityInfo && !capacityInfo.canAdd) {
      toast.error(`This fund has reached its maximum capacity of ${capacityInfo.max} investments. Currently has ${capacityInfo.current} investments.`)
      return
    }

    // Check issuance capacity before submitting
    if (issuanceInfo && !issuanceInfo.canAdd) {
      toast.error(`This fund has reached its maximum issuance capacity. Current: ${issuanceInfo.current} issuances, Max: ${issuanceInfo.max}, Required for ${investmentType}: ${issuanceInfo.required}`)
      return
    }

    if (!name || !totalInvestmentSize || !fundCommitment) {
      toast.error("Please fill in all required fields")
      return
    }

    const totalInvestmentSizeNum = parseFloat(totalInvestmentSize)
    const fundCommitmentNum = parseFloat(fundCommitment)
    const equityPositionNum = equityPosition ? parseFloat(equityPosition) : 0
    const debtPositionNum = debtPosition ? parseFloat(debtPosition) : 0
    const interestRateNum = interestRate ? parseFloat(interestRate) : 0

    // Calculate ownership percentage from EQUITY ONLY (not total fund commitment)
    const ownershipPercentageNum = totalInvestmentSizeNum > 0 && equityPositionNum > 0
      ? (equityPositionNum / totalInvestmentSizeNum) * 100
      : 0

    try {
      const currentDate = new Date().toISOString()

      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required. Please log in.')
        return
      }

      // Create flat structure payload
      const investmentData = {
        structureId: selectedStructure,
        fundId: selectedStructure,
        name,
        investmentName: name,
        description: description || `Investment in ${name}`,
        investmentType: investmentType.toUpperCase(),
        type,
        investmentDate: currentDate,
        originationDate: currentDate,
        fundCommitment: fundCommitmentNum,
        equityInvested: equityPositionNum,
        ownershipPercentage: ownershipPercentageNum,
        equityOwnershipPercent: ownershipPercentageNum,
        currentEquityValue: equityPositionNum,
        unrealizedGain: 0,
        principalProvided: debtPositionNum,
        interestRate: interestRateNum,
        maturityDate: maturityDate || currentDate,
        accruedInterest: 0,
        currentDebtValue: debtPositionNum,
        irr: 0,
        multiple: 1.0,
        currentValue: fundCommitmentNum,
        totalInvested: fundCommitmentNum,
        totalInvestmentSize: totalInvestmentSizeNum,
        lastValuationDate: currentDate,
        totalPropertyValue: type === 'Real Estate' ? totalInvestmentSizeNum : undefined,
        sector: sector || "General",
        geography: location,
        currency: "USD",
        visibilityType: visibilityType ?? 'private',
        notes: ""
      }

      const apiUrl = getApiUrl(API_CONFIG.endpoints.createInvestment)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(investmentData)
      })

      if (!response.ok) {
        // Handle 401 Unauthorized - Invalid or expired token
        if (response.status === 401) {
          console.log('[Auth] 401 Unauthorized - Clearing session and redirecting to login')
          logout()
          window.location.href = '/sign-in'
          return
        }

        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to create investment')
        return
      }

      const result = await response.json()

      if (result.success) {
        toast.success('Investment created successfully')
        router.push(`/investment-manager/investments/${result.data.id}`)
      } else {
        toast.error(result.message || 'Failed to create investment')
      }
    } catch (error) {
      console.error("Error creating investment:", error)
      toast.error("Failed to create investment. Please try again.")
    }
  }

  const getStructureLabel = (structure: Structure) => {
    const typeLabels: Record<string, string> = {
      fund: "Fund",
      sa: "SA/LLC",
      fideicomiso: "Trust",
      "private-debt": "Private Debt",
    }
    return `${structure.name} (${typeLabels[structure.type]})`
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/investment-manager/investments">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Investment</h1>
          <p className="text-muted-foreground">Create a new investment and assign to a fund or structure</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Investment details and classification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Investment Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Property Name or Company"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Asset Type</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as "Real Estate" | "Private Equity" | "Private Debt")}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="Real Estate">Real Estate</option>
                  <option value="Private Debt">Private Debt</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="e.g., Multifamily, Technology, Healthcare"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={selectedStructure && (structures.find(s => s.id === selectedStructure)?.jurisdiction?.toLowerCase() === 'united states' || structures.find(s => s.id === selectedStructure)?.jurisdiction?.toLowerCase() === 'us' || structures.find(s => s.id === selectedStructure)?.jurisdiction?.toLowerCase() === 'usa') ? "City, State, Country (e.g., Miami, Florida, United States)" : "City, Country (e.g., San Jose, Costa Rica)"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the investment opportunity, strategy, and key highlights..."
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fund Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Fund Assignment</CardTitle>
              <CardDescription>Select fund and investment capacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="structure">Select Fund/Structure *</Label>
                <select
                  id="structure"
                  value={selectedStructure}
                  onChange={(e) => setSelectedStructure(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                >
                  <option value="">-- Select a Fund --</option>
                  {structures.map((structure) => (
                    <option key={structure.id} value={structure.id}>
                      {getStructureLabel(structure)}
                    </option>
                  ))}
                </select>
                {structures.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No funds available. Please create a structure first.
                  </p>
                )}
              </div>

              {selectedStructure && (
                <div className={`p-4 rounded-lg border ${
                  capacityInfo && !capacityInfo.canAdd
                    ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                    : 'bg-muted/50 border-muted'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {structures.find(s => s.id === selectedStructure)?.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div>
                      <span className="text-muted-foreground">Total Commitment:</span>
                      <span className="ml-2 font-medium">
                        ${structures.find(s => s.id === selectedStructure)?.totalCommitment.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Investments:</span>
                      <span className="ml-2 font-medium">
                        {structures.find(s => s.id === selectedStructure)?.plannedInvestments}
                      </span>
                    </div>
                  </div>
                  {capacityInfo && (
                    <div className={`text-sm pt-2 border-t ${
                      capacityInfo.canAdd ? 'border-muted' : 'border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">Investment Capacity:</span>
                        <Badge variant={capacityInfo.canAdd ? "default" : "destructive"}>
                          {capacityInfo.current} / {capacityInfo.max} investments
                        </Badge>
                      </div>
                      {!capacityInfo.canAdd && (
                        <p className="text-red-600 dark:text-red-400 mb-2 text-xs font-medium">
                          ⚠️ This fund has reached maximum investment capacity
                        </p>
                      )}
                    </div>
                  )}
                  {issuanceInfo && (
                    <div className={`text-sm pt-2 border-t ${
                      issuanceInfo.canAdd ? 'border-muted' : 'border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Issuance Capacity:</span>
                        <Badge variant={issuanceInfo.canAdd ? "default" : "destructive"}>
                          {issuanceInfo.current} / {issuanceInfo.max} issuances
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">Required for {investmentType}:</span>
                        <span className="text-xs font-medium">{issuanceInfo.required} {issuanceInfo.required === 1 ? 'issuance' : 'issuances'}</span>
                      </div>
                      {!issuanceInfo.canAdd && (
                        <p className="text-red-600 dark:text-red-400 mt-2 text-xs font-medium">
                          ⚠️ Insufficient issuance capacity for this investment type
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Details - Hidden */}
          {false && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Investment Details</CardTitle>
                <CardDescription>Financial structure and positions</CardDescription>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="investmentType">Investment Type</Label>
                      <select
                        id="investmentType"
                        value={investmentType}
                        onChange={(e) => setInvestmentType(e.target.value as "Equity" | "Debt" | "Mixed")}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        <option value="Equity">Equity</option>
                        <option value="Debt">Debt</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="totalInvestmentSize">Total Investment Size ($) *</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>The total value/cost of the entire investment (property, company, or asset)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="totalInvestmentSize"
                        type="number"
                        value={totalInvestmentSize}
                        onChange={(e) => setTotalInvestmentSize(e.target.value)}
                        placeholder="5000000"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="fundCommitment">Fund Commitment ($) *</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How much your specific fund is contributing to this investment</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="fundCommitment"
                        type="number"
                        value={fundCommitment}
                        onChange={(e) => setFundCommitment(e.target.value)}
                        placeholder="2000000"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    {(investmentType === "Equity" || investmentType === "Mixed") && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="equityPosition">Equity Position ($)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The portion of your fund's commitment that is equity (ownership capital)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="equityPosition"
                          type="number"
                          value={equityPosition}
                          onChange={(e) => setEquityPosition(e.target.value)}
                          placeholder="1500000"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}

                    {(investmentType === "Debt" || investmentType === "Mixed") && (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="debtPosition">Debt Position ($)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>The portion of your fund's commitment that is debt (loan capital)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="debtPosition"
                            type="number"
                            value={debtPosition}
                            onChange={(e) => setDebtPosition(e.target.value)}
                            placeholder="500000"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="interestRate">Interest Rate (%)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Annual interest rate for the debt position</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="interestRate"
                            type="text"
                            inputMode="decimal"
                            value={interestRate}
                            onChange={(e) => {
                              const value = e.target.value.replace(',', '.')
                              // Allow empty, numbers, and one decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                const numValue = parseFloat(value)
                                if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 100)) {
                                  setInterestRate(value)
                                }
                              }
                            }}
                            placeholder="8.5"
                            pattern="[0-9]*\.?[0-9]*"
                            lang="en-US"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="maturityDate">Maturity Date</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Date when the debt principal is due to be repaid</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="maturityDate"
                            type="date"
                            value={maturityDate}
                            onChange={(e) => setMaturityDate(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </TooltipProvider>

                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md mt-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Note:</strong> For new investments, current value will initially match fund commitment.
                    Performance metrics (IRR, MOIC) will be calculated as the investment matures.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visibility & Access Control */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Visibility & Access Control</CardTitle>
              <CardDescription>Control who can see this investment in the marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility Level</Label>
                  <select
                    id="visibility"
                    value={visibilityType}
                    onChange={(e) => setVisibilityType(e.target.value as "public" | "fund-specific" | "private")}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="public">Public - Visible to all investors</option>
                    <option value="fund-specific">Fund-Specific - Only visible to investors in this fund</option>
                    <option value="private">Private - Hidden from marketplace (admin only)</option>
                  </select>
                </div>

                <div className="mt-4 p-3 rounded-md border bg-muted/50">
                  {visibilityType === 'public' && (
                    <div>
                      <p className="text-sm font-medium">Public Investment</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This investment will be visible to all investors in the marketplace, regardless of which funds they're invested in.
                      </p>
                    </div>
                  )}
                  {visibilityType === 'fund-specific' && (
                    <div>
                      <p className="text-sm font-medium">Fund-Specific Investment</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This investment will only be visible to investors who are already committed to the <strong>{structures.find(s => s.id === selectedStructure)?.name}</strong> fund.
                      </p>
                    </div>
                  )}
                  {visibilityType === 'private' && (
                    <div>
                      <p className="text-sm font-medium">Private Investment</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This investment will be hidden from the marketplace and only visible to administrators. Use this for internal tracking or pre-deal investments.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/investment-manager/investments">Cancel</Link>
          </Button>
          {!isGuest && (
            <Button type="submit">Create Investment</Button>
          )}
        </div>
      </form>
    </div>
  )
}
