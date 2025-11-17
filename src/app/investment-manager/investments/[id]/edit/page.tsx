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
import { ArrowLeft, Info, Loader2, Building2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getInvestments, updateInvestment } from "@/lib/investments-storage"
import { getStructures, canAddInvestment, canAddIssuance } from "@/lib/structures-storage"
import type { Structure } from "@/lib/structures-storage"
import investmentsData from "@/data/investments.json"
import type { Investment } from "@/lib/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditInvestmentPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
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

  useEffect(() => {
    // Load structures
    const allStructures = getStructures()
    setStructures(allStructures)
  }, [])

  useEffect(() => {
    // Load investment data
    const staticInvestments = investmentsData as Investment[]
    const dynamicInvestments = getInvestments()
    const allInvestments = [...staticInvestments, ...dynamicInvestments]
    const foundInvestment = allInvestments.find((inv) => inv.id === id)

    if (foundInvestment) {
      setInvestment(foundInvestment)
      setSelectedStructure(foundInvestment.fundId || "")

      // Pre-fill form fields
      setName(foundInvestment.name)
      setType(foundInvestment.type)
      setSector(foundInvestment.sector || "")
      setLocation(foundInvestment.geography ? `${foundInvestment.geography.city}, ${foundInvestment.geography.state}` : "")
      setDescription(foundInvestment.description || "")
      setInvestmentType(foundInvestment.investmentType === 'EQUITY' ? 'Equity' :
                        foundInvestment.investmentType === 'DEBT' ? 'Debt' : 'Mixed')
      setTotalInvestmentSize(foundInvestment.totalInvestmentSize?.toString() || "")
      setFundCommitment(foundInvestment.fundCommitment?.toString() || "")
      setCurrentValue(foundInvestment.totalFundPosition?.currentValue?.toString() || "")

      if (foundInvestment.fundEquityPosition) {
        setEquityPosition(foundInvestment.fundEquityPosition.equityInvested.toString())
      }

      if (foundInvestment.fundDebtPosition) {
        setDebtPosition(foundInvestment.fundDebtPosition.principalProvided.toString())
        setInterestRate(foundInvestment.fundDebtPosition.interestRate?.toString() || "")
        if (foundInvestment.fundDebtPosition.maturityDate) {
          // Convert ISO date to YYYY-MM-DD format for input
          const date = new Date(foundInvestment.fundDebtPosition.maturityDate)
          setMaturityDate(date.toISOString().split('T')[0])
        }
      }
    }

    setIsLoading(false)
  }, [id])

  // Check capacity when structure is selected
  useEffect(() => {
    if (selectedStructure && investment) {
      const capacity = canAddInvestment(selectedStructure)
      // For edit mode, we need to account for this investment already being in the count
      if (capacity && investment.fundId === selectedStructure) {
        setCapacityInfo({
          canAdd: true,
          current: capacity.current,
          max: capacity.max
        })
      } else {
        setCapacityInfo(capacity)
      }
    } else {
      setCapacityInfo(null)
    }
  }, [selectedStructure, investment])

  // Check issuance capacity when structure or investment type changes
  useEffect(() => {
    if (selectedStructure && investment) {
      const issuance = canAddIssuance(selectedStructure, investmentType)
      // For edit mode, if the investment type hasn't changed, we're okay
      if (issuance && investment.fundId === selectedStructure &&
          investment.investmentType === investmentType.toUpperCase()) {
        setIssuanceInfo({
          canAdd: true,
          current: issuance.current,
          max: issuance.max,
          required: issuance.required
        })
      } else {
        setIssuanceInfo(issuance)
      }
    } else {
      setIssuanceInfo(null)
    }
  }, [selectedStructure, investmentType, investment])

  const handleSubmit = (e: React.FormEvent) => {
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

    // Get jurisdiction from selected structure
    const selectedStructureData = structures.find(s => s.id === selectedStructure)
    const isUSJurisdiction = selectedStructureData?.jurisdiction?.toLowerCase() === 'united states' ||
                             selectedStructureData?.jurisdiction?.toLowerCase() === 'us' ||
                             selectedStructureData?.jurisdiction?.toLowerCase() === 'usa'

    // Parse geography based on jurisdiction
    let geographyData
    if (isUSJurisdiction) {
      // US: City, State, Country (3 parts expected)
      const parts = location.split(',').map(p => p.trim())
      geographyData = {
        city: parts[0] || 'N/A',
        state: parts[1] || 'N/A',
        country: parts[2] || 'United States',
      }
    } else {
      // Non-US: City, Country (2 parts expected)
      const parts = location.split(',').map(p => p.trim())
      geographyData = {
        city: parts[0] || 'N/A',
        state: parts[1] || 'N/A',
        country: parts[1] || 'N/A',
      }
    }

    try {
      const currentDate = new Date().toISOString()

      // Determine fundEquityPosition based on investment type
      const fundEquityPosition = (investmentType === 'Equity' || investmentType === 'Mixed')
        ? {
            ownershipPercent: ownershipPercentageNum,
            equityInvested: equityPositionNum,
            currentEquityValue: investmentType === 'Equity' ? currentValueNum : equityPositionNum,
            unrealizedGain: investmentType === 'Equity' ? unrealizedGain : 0,
          }
        : null

      // Determine fundDebtPosition based on investment type
      const fundDebtPosition = (investmentType === 'Debt' || investmentType === 'Mixed')
        ? {
            principalProvided: debtPositionNum,
            interestRate: interestRateNum,
            originationDate: investment.fundDebtPosition?.originationDate || currentDate,
            maturityDate: maturityDate || investment.fundDebtPosition?.maturityDate || currentDate,
            accruedInterest: investment.fundDebtPosition?.accruedInterest || 0,
            currentDebtValue: investmentType === 'Debt' ? currentValueNum : debtPositionNum,
            unrealizedGain: investmentType === 'Debt' ? unrealizedGain : 0,
          }
        : null

      updateInvestment(id, {
        fundId: selectedStructure,
        name,
        type,
        sector: (sector || "Multifamily") as AssetSector,
        description: description || investment.description || `Investment in ${name}`,
        investmentType: investmentType.toUpperCase() as 'EQUITY' | 'DEBT' | 'MIXED',
        totalInvestmentSize: totalInvestmentSizeNum,
        fundCommitment: fundCommitmentNum,
        ownershipPercentage: ownershipPercentageNum,
        totalPropertyValue: type === 'Real Estate' ? totalInvestmentSizeNum : undefined,
        totalCompanyValue: type === 'Private Equity' ? totalInvestmentSizeNum : undefined,
        totalProjectValue: type === 'Private Debt' ? totalInvestmentSizeNum : undefined,
        geography: geographyData,
        fundEquityPosition,
        fundDebtPosition,
        totalFundPosition: {
          totalInvested: fundCommitmentNum,
          currentValue: currentValueNum,
          unrealizedGain: unrealizedGain,
          irr: investment.totalFundPosition?.irr || 0,
          multiple: multiple,
        },
        lastValuationDate: currentDate,
        updatedAt: currentDate,
      })

      router.push(`/investment-manager/investments/${id}`)
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

  if (!investment) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Investment not found</h3>
            <p className="text-muted-foreground mb-4">
              The investment you're trying to edit doesn't exist.
            </p>
            <Button asChild>
              <Link href="/investment-manager/investments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Investments
              </Link>
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
