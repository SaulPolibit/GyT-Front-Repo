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
import { ArrowLeft, Building2 } from "lucide-react"
import { saveInvestor } from "@/lib/investors-storage"
import { getStructures, canAddInvestor, getStructureInvestorCount } from "@/lib/structures-storage"
import type { Structure } from "@/lib/structures-storage"
import type { InvestorType } from "@/lib/types"

export default function AddInvestorPage() {
  const router = useRouter()
  const [structures, setStructures] = useState<Structure[]>([])
  const [selectedStructure, setSelectedStructure] = useState<string>("")
  const [capacityInfo, setCapacityInfo] = useState<{ canAdd: boolean; current: number; max: number } | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [type, setType] = useState<InvestorType>("Individual")
  const [taxId, setTaxId] = useState("")

  // Address state
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [country, setCountry] = useState("United States")

  // Hierarchy level state
  const [hierarchyLevel, setHierarchyLevel] = useState<number | undefined>(undefined)

  // Custom terms state
  const [hasCustomTerms, setHasCustomTerms] = useState(false)
  const [customManagementFee, setCustomManagementFee] = useState("")
  const [customPerformanceFee, setCustomPerformanceFee] = useState("")
  const [customHurdleRate, setCustomHurdleRate] = useState("")
  const [customPreferredReturn, setCustomPreferredReturn] = useState("")

  useEffect(() => {
    const allStructures = getStructures()
    setStructures(allStructures)
  }, [])

  // Pre-fill data from pre-registered investor when email matches
  useEffect(() => {
    if (!selectedStructure || !email) return

    const structure = structures.find(s => s.id === selectedStructure)
    if (!structure?.preRegisteredInvestors) return

    const preRegistered = structure.preRegisteredInvestors.find(
      inv => inv.email.toLowerCase() === email.toLowerCase()
    )

    if (preRegistered) {
      // Pre-fill name if not already filled
      if (!name) {
        setName(`${preRegistered.firstName} ${preRegistered.lastName}`)
      }

      // Pre-fill custom terms if they exist
      if (preRegistered.customTerms) {
        setHasCustomTerms(true)
        setCustomManagementFee(preRegistered.customTerms.managementFee?.toString() || "")
        setCustomPerformanceFee(preRegistered.customTerms.performanceFee?.toString() || "")
        setCustomHurdleRate(preRegistered.customTerms.hurdleRate?.toString() || "")
        setCustomPreferredReturn(preRegistered.customTerms.preferredReturn?.toString() || "")
      }

      // Pre-fill hierarchy level if it exists
      if (preRegistered.hierarchyLevel) {
        setHierarchyLevel(preRegistered.hierarchyLevel)
      }
    }
  }, [selectedStructure, email, structures])

  // Check capacity when structure is selected
  useEffect(() => {
    if (selectedStructure) {
      const capacity = canAddInvestor(selectedStructure)
      setCapacityInfo(capacity)
    } else {
      setCapacityInfo(null)
    }
  }, [selectedStructure])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStructure) {
      toast.error("Please select a fund/structure")
      return
    }

    // Check capacity before submitting
    if (capacityInfo && !capacityInfo.canAdd) {
      toast.error(`This fund has reached its maximum capacity of ${capacityInfo.max} investors. Currently has ${capacityInfo.current} investors.`)
      return
    }

    if (!name || !email) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const newInvestor = saveInvestor({
        name,
        email,
        phone: phone || undefined,
        type,
        status: "Pending",
        fundOwnership: {
          fundId: selectedStructure,
          commitment: 0,
          ownershipPercent: 0,
          calledCapital: 0,
          uncalledCapital: 0,
        },
        hierarchyLevel: hierarchyLevel,
        customTerms: hasCustomTerms ? {
          managementFee: customManagementFee ? parseFloat(customManagementFee) : undefined,
          performanceFee: customPerformanceFee ? parseFloat(customPerformanceFee) : undefined,
          hurdleRate: customHurdleRate ? parseFloat(customHurdleRate) : undefined,
          preferredReturn: customPreferredReturn ? parseFloat(customPreferredReturn) : undefined,
        } : undefined,
        currentValue: 0,
        unrealizedGain: 0,
        totalDistributed: 0,
        netCashFlow: 0,
        irr: 0,
        taxId: taxId || undefined,
        k1Status: "Not Started",
        address: street ? {
          street,
          city,
          state,
          zipCode,
          country,
        } : undefined,
        preferredContactMethod: "Email",
        investorSince: new Date().toISOString(),
        notes: undefined,
        documents: [],
      })

      router.push(`/investment-manager/investors/${newInvestor.id}`)
    } catch (error) {
      console.error("Error creating investor:", error)
      toast.error("Failed to create investor. Please try again.")
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
          <Link href="/investment-manager/investors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Investor</h1>
          <p className="text-muted-foreground">Create a new investor and assign to a fund or structure</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Investor details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Investor Type</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as InvestorType)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="Individual">Individual</option>
                  <option value="Institution">Institution</option>
                  <option value="Family Office">Family Office</option>
                  <option value="Fund of Funds">Fund of Funds</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / SSN</Label>
                <Input
                  id="taxId"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="123-45-6789"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fund Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Fund Assignment</CardTitle>
              <CardDescription>Select fund to assign investor</CardDescription>
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

              {/* Hierarchy Level (conditional) */}
              {selectedStructure && structures.find(s => s.id === selectedStructure)?.hierarchyMode &&
               structures.find(s => s.id === selectedStructure)?.hierarchyStructures &&
               (structures.find(s => s.id === selectedStructure)?.hierarchyStructures?.length || 0) > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="hierarchyLevel">Participating Hierarchy Level *</Label>
                  <select
                    id="hierarchyLevel"
                    value={hierarchyLevel || ""}
                    onChange={(e) => setHierarchyLevel(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                  >
                    <option value="">-- Select Level --</option>
                    {structures.find(s => s.id === selectedStructure)?.hierarchyStructures?.map((level, index) => (
                      <option key={index} value={index + 1}>
                        Level {index + 1}: {level.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Select which hierarchy level this investor participates in
                  </p>
                </div>
              )}

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
                      <span className="text-muted-foreground">Max Investors:</span>
                      <span className="ml-2 font-medium">
                        {structures.find(s => s.id === selectedStructure)?.investors}
                      </span>
                    </div>
                  </div>
                  {capacityInfo && (
                    <div className={`text-sm pt-2 border-t ${
                      capacityInfo.canAdd ? 'border-muted' : 'border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Current Capacity:</span>
                        <Badge variant={capacityInfo.canAdd ? "default" : "destructive"}>
                          {capacityInfo.current} / {capacityInfo.max} investors
                        </Badge>
                      </div>
                      {!capacityInfo.canAdd && (
                        <p className="text-red-600 dark:text-red-400 mt-2 text-xs font-medium">
                          ⚠️ This fund has reached maximum capacity
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> Commitment amount and ownership percentage will be captured during the investor onboarding process.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Custom Economic Terms */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Custom Economic Terms (Optional)</CardTitle>
              <CardDescription>Override fund-level terms for this investor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasCustomTerms"
                  checked={hasCustomTerms}
                  onChange={(e) => setHasCustomTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="hasCustomTerms" className="cursor-pointer">
                  This investor has custom economic terms
                </Label>
              </div>

              {hasCustomTerms && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="customManagementFee">Management Fee (%)</Label>
                    <Input
                      id="customManagementFee"
                      type="number"
                      step="0.01"
                      value={customManagementFee}
                      onChange={(e) => setCustomManagementFee(e.target.value)}
                      placeholder="e.g., 1.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customPerformanceFee">Performance Fee (%)</Label>
                    <Input
                      id="customPerformanceFee"
                      type="number"
                      step="0.01"
                      value={customPerformanceFee}
                      onChange={(e) => setCustomPerformanceFee(e.target.value)}
                      placeholder="e.g., 20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customHurdleRate">Hurdle Rate (%)</Label>
                    <Input
                      id="customHurdleRate"
                      type="number"
                      step="0.01"
                      value={customHurdleRate}
                      onChange={(e) => setCustomHurdleRate(e.target.value)}
                      placeholder="e.g., 8"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customPreferredReturn">Preferred Return (%)</Label>
                    <Input
                      id="customPreferredReturn"
                      type="number"
                      step="0.01"
                      value={customPreferredReturn}
                      onChange={(e) => setCustomPreferredReturn(e.target.value)}
                      placeholder="e.g., 8"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Address (Optional)</CardTitle>
              <CardDescription>Investor mailing address</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="123 Main St, Suite 100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State / Province</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="NY"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP / Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="10001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/investment-manager/investors">Cancel</Link>
          </Button>
          <Button type="submit">Create Investor</Button>
        </div>
      </form>
    </div>
  )
}
