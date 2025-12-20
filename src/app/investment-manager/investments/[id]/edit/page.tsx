"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Info, Loader2, Building2, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Structure } from "@/lib/structures-storage"
import type { Investment, AssetSector } from "@/lib/types"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { getAuthToken } from "@/lib/auth-storage"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditInvestmentPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [investment, setInvestment] = useState<Investment | null>(null)
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
  const [currentValue, setCurrentValue] = useState("")
  const [status, setStatus] = useState<"Active" | "Pending" | "Closed" | "Exited">("Active")
  const [visibilityType, setVisibilityType] = useState<"public" | "fund-specific" | "private">("public")

  useEffect(() => {
    // Load structures from API
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

        if (response.ok) {
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

  useEffect(() => {
    // Load investment data from API
    async function fetchInvestment() {
      try {
        setIsLoading(true)
        setError(null)

        // Get authentication token
        const token = getAuthToken()

        if (!token) {
          setError('Authentication required. Please log in.')
          setIsLoading(false)
          return
        }

        const apiUrl = getApiUrl(API_CONFIG.endpoints.getSingleInvestment(id))

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.message || 'Failed to fetch investment')
          setIsLoading(false)
          return
        }

        const result = await response.json()

        if (result.success && result.data) {
          const foundInvestment = result.data
          setInvestment(foundInvestment)
          setSelectedStructure(foundInvestment.fundId || foundInvestment.structureId || "")

          // Pre-fill form fields - handle both formats
          const invName = foundInvestment.name || foundInvestment.investmentName || ""
          setName(invName)
          setType(foundInvestment.type || "Real Estate")
          setSector(foundInvestment.sector || "")
          setStatus(foundInvestment.status || "Active")

          // Handle geography as string or object
          if (typeof foundInvestment.geography === 'string') {
            setLocation(foundInvestment.geography)
          } else if (foundInvestment.geography) {
            setLocation(`${foundInvestment.geography.city || ''}, ${foundInvestment.geography.state || ''}`)
          } else {
            setLocation("")
          }

          setDescription(foundInvestment.description || "")
          setInvestmentType(foundInvestment.investmentType === 'EQUITY' ? 'Equity' :
                            foundInvestment.investmentType === 'DEBT' ? 'Debt' : 'Mixed')
          setTotalInvestmentSize(foundInvestment.totalInvestmentSize?.toString() || "")
          setFundCommitment(foundInvestment.fundCommitment?.toString() || "")
          setCurrentValue(foundInvestment.currentValue?.toString() || foundInvestment.currentEquityValue?.toString() || "")
          setEquityPosition(foundInvestment.equityInvested?.toString() || "")
          setDebtPosition(foundInvestment.principalProvided?.toString() || "")
          setInterestRate(foundInvestment.interestRate?.toString() || "")

          if (foundInvestment.maturityDate) {
            // Convert ISO date to YYYY-MM-DD format for input
            const date = new Date(foundInvestment.maturityDate)
            setMaturityDate(date.toISOString().split('T')[0])
          }

          setVisibilityType(foundInvestment.visibilityType || "public")
        } else {
          setError('Investment not found')
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching investment:', err)
        setError('Failed to load investment data')
        setIsLoading(false)
      }
    }

    fetchInvestment()
  }, [id])

  // Check capacity when structure is selected
  useEffect(() => {
    if (selectedStructure && investment && structures.length > 0) {
      // Find the selected structure from API-fetched structures
      const structure = structures.find(s => s.id === selectedStructure)

      if (structure) {
        // Use data from API structure
        const max = parseInt(structure.plannedInvestments || '0')
        const current = structure.investors || 0

        // For edit mode, we need to account for this investment already being in the count
        if (investment.fundId === selectedStructure) {
          setCapacityInfo({
            canAdd: true,
            current: current,
            max: max
          })
        } else {
          setCapacityInfo({
            canAdd: current < max,
            current: current,
            max: max
          })
        }
      } else {
        setCapacityInfo(null)
      }
    } else {
      setCapacityInfo(null)
    }
  }, [selectedStructure, investment, structures])

  // Check issuance capacity when structure or investment type changes
  useEffect(() => {
    if (selectedStructure && investment && structures.length > 0) {
      // Find the selected structure from API-fetched structures
      const structure = structures.find(s => s.id === selectedStructure)

      if (structure) {
        // Use data from API structure - default max to 50 if not provided
        const max = 50
        // Since API doesn't provide currentIssuances, we'll default to 0
        // In a real scenario, this would come from the API
        const current = 0
        const required = investmentType === 'Mixed' ? 2 : 1

        // For edit mode, if the investment type hasn't changed, we're okay
        if (investment.fundId === selectedStructure &&
            investment.investmentType === investmentType.toUpperCase()) {
          setIssuanceInfo({
            canAdd: true,
            current: current,
            max: max,
            required: required
          })
        } else {
          setIssuanceInfo({
            canAdd: current + required <= max,
            current: current,
            max: max,
            required: required
          })
        }
      } else {
        setIssuanceInfo(null)
      }
    } else {
      setIssuanceInfo(null)
    }
  }, [selectedStructure, investmentType, investment, structures])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!investment) return

    if (!selectedStructure) {
      toast.error("Please select a fund/structure")
      return
    }

    // Check capacity before submitting (only if changing structure)
    if (investment.fundId !== selectedStructure && capacityInfo && !capacityInfo.canAdd) {
      toast.error(`This fund has reached its maximum capacity of ${capacityInfo.max} investments. Currently has ${capacityInfo.current} investments.`)
      return
    }

    // Check issuance capacity before submitting (only if changing type or structure)
    if ((investment.fundId !== selectedStructure || investment.investmentType !== investmentType.toUpperCase()) &&
        issuanceInfo && !issuanceInfo.canAdd) {
      toast.error(`This fund has reached its maximum issuance capacity. Current: ${issuanceInfo.current} issuances, Max: ${issuanceInfo.max}, Required for ${investmentType}: ${issuanceInfo.required}`)
      return
    }

    if (!name || !totalInvestmentSize || !fundCommitment) {
      toast.error("Please fill in all required fields")
      return
    }

    const totalInvestmentSizeNum = parseFloat(totalInvestmentSize)
    const fundCommitmentNum = parseFloat(fundCommitment)
    const currentValueNum = currentValue ? parseFloat(currentValue) : fundCommitmentNum
    const equityPositionNum = equityPosition ? parseFloat(equityPosition) : 0
    const debtPositionNum = debtPosition ? parseFloat(debtPosition) : 0
    const interestRateNum = interestRate ? parseFloat(interestRate) : 0

    // Calculate ownership percentage from EQUITY ONLY (not total fund commitment)
    const ownershipPercentageNum = totalInvestmentSizeNum > 0 && equityPositionNum > 0
      ? (equityPositionNum / totalInvestmentSizeNum) * 100
      : 0

    // Calculate unrealized gain
    const unrealizedGain = currentValueNum - fundCommitmentNum

    // Calculate multiple
    const multiple = fundCommitmentNum > 0 ? currentValueNum / fundCommitmentNum : 1.0

    try {
      const currentDate = new Date().toISOString()

      const updateData = {
        fundId: selectedStructure,
        name,
        type,
        sector: (sector || "Multifamily") as AssetSector,
        status,
        description: description || investment.description || `Investment in ${name}`,
        investmentType: investmentType.toUpperCase() as 'EQUITY' | 'DEBT' | 'MIXED',
        totalInvestmentSize: totalInvestmentSizeNum,
        fundCommitment: fundCommitmentNum,
        ownershipPercentage: ownershipPercentageNum,
        totalPropertyValue: type === 'Real Estate' ? totalInvestmentSizeNum : undefined,
        totalCompanyValue: type === 'Private Equity' ? totalInvestmentSizeNum : undefined,
        totalProjectValue: type === 'Private Debt' ? totalInvestmentSizeNum : undefined,
        geography: location,
        equityInvested: equityPositionNum,
        currentEquityValue: investmentType === 'Equity' ? currentValueNum : equityPositionNum,
        principalProvided: debtPositionNum,
        interestRate: interestRateNum,
        originationDate: investment.fundDebtPosition?.originationDate || currentDate,
        maturityDate: maturityDate || investment.fundDebtPosition?.maturityDate || currentDate,
        accruedInterest: investment.fundDebtPosition?.accruedInterest || 0,
        currentDebtValue: investmentType === 'Debt' ? currentValueNum : debtPositionNum,
        totalInvested: fundCommitmentNum,
        currentValue: currentValueNum,
        unrealizedGain: unrealizedGain,
        irr: investment.totalFundPosition?.irr || 0,
        multiple: multiple,
        lastValuationDate: currentDate,
        updatedAt: currentDate,
        visibilityType: visibilityType ?? 'private',
      }

      // Get authentication token
      const token = getAuthToken()

      if (!token) {
        toast.error('Authentication required. Please log in.')
        return
      }

      // Call PUT endpoint to update investment
      const apiUrl = getApiUrl(API_CONFIG.endpoints.updateInvestment(id))

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to update investment')
        return
      }

      const result = await response.json()

      if (result.success) {
        toast.success('Investment updated successfully')
        router.push(`/investment-manager/investments/${id}`)
      } else {
        toast.error(result.message || 'Failed to update investment')
      }
    } catch (error) {
      console.error("Error updating investment:", error)
      toast.error("Failed to update investment. Please try again.")
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading investment details...</p>
      </div>
    )
  }

  if (error || !investment) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {error ? 'Error Loading Investment' : 'Investment not found'}
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              {error || "The investment you're trying to edit doesn't exist."}
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/investment-manager/investments">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Investments
                </Link>
              </Button>
              {error && (
                <Button onClick={() => window.location.reload()} variant="default">
                  Try Again
                </Button>
              )}
            </div>
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
          <Link href={`/investment-manager/investments/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Investment</h1>
          <p className="text-muted-foreground">Update investment details and financials</p>
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
                  <option value="Private Equity">Private Equity</option>
                  <option value="Private Debt">Private Debt</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "Active" | "Pending" | "Closed" | "Exited")}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Closed">Closed</option>
                  <option value="Exited">Exited</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibilityType">Visibility Type</Label>
                <select
                  id="visibilityType"
                  value={visibilityType}
                  onChange={(e) => setVisibilityType(e.target.value as "public" | "fund-specific" | "private")}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="public">Public</option>
                  <option value="fund-specific">Fund Specific</option>
                  <option value="private">Private</option>
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

          {/* Investment Details */}
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

                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="currentValue">Current Value ($)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The current market value of your fund's position in this investment</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="currentValue"
                      type="number"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      placeholder="2500000"
                      min="0"
                      step="0.01"
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
                          type="number"
                          value={interestRate}
                          onChange={(e) => setInterestRate(e.target.value)}
                          placeholder="8.5"
                          min="0"
                          step="0.01"
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
                  <strong>Note:</strong> Update the current value to reflect the latest market valuation.
                  Performance metrics (IRR, MOIC) will be automatically recalculated.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href={`/investment-manager/investments/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  )
}
