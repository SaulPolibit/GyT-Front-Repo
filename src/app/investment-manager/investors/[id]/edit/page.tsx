"use client"

import { use, useState, useEffect } from "react"
import { useRouter, notFound } from "next/navigation"
import Link from "next/link"
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Building2, Loader2 } from "lucide-react"
import { getInvestors, updateInvestor } from "@/lib/investors-storage"
import { getStructures, canAddInvestor, getStructureById, getStructureHierarchy, getStructureDescendants, repairHierarchyRelationships, createSampleHierarchies } from "@/lib/structures-storage"
import investorsData from "@/data/investors.json"
import type { Structure } from "@/lib/structures-storage"
import type { Investor, InvestorType } from "@/lib/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditInvestorPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [structures, setStructures] = useState<Structure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [type, setType] = useState<InvestorType>("Individual")
  const [taxId, setTaxId] = useState("")
  const [status, setStatus] = useState<string>("Pending")
  const [selectedStructures, setSelectedStructures] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [preferredContactMethod, setPreferredContactMethod] = useState<"Email" | "Phone">("Email")

  // Address state
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [country, setCountry] = useState("United States")

  // Per-structure custom terms state
  // Map of structureId -> custom terms
  const [structureCustomTerms, setStructureCustomTerms] = useState<Record<string, {
    hasCustomTerms: boolean
    managementFee: string
    performanceFee: string
    hurdleRate: string
    preferredReturn: string
  }>>({})

  // @deprecated - old global custom terms (kept for backward compatibility during migration)
  const [hasCustomTerms, setHasCustomTerms] = useState(false)
  const [customManagementFee, setCustomManagementFee] = useState("")
  const [customPerformanceFee, setCustomPerformanceFee] = useState("")
  const [customHurdleRate, setCustomHurdleRate] = useState("")
  const [customPreferredReturn, setCustomPreferredReturn] = useState("")

  // Available structure levels (including all levels in hierarchies)
  const [availableStructureLevels, setAvailableStructureLevels] = useState<Array<{
    structure: Structure
    displayName: string
  }>>([])


  // Load investor data and structures
  useEffect(() => {
    const dynamicInvestors = getInvestors()
    const staticInvestors = investorsData as Investor[]
    const allInvestors = [...staticInvestors, ...dynamicInvestors]
    const investor = allInvestors.find((inv) => inv.id === id)

    if (!investor) {
      notFound()
    }

    // Populate form with existing data
    setName(investor.name)
    setEmail(investor.email)
    setPhone(investor.phone || "")
    setType(investor.type)
    setTaxId(investor.taxId || "")

    // Normalize status to proper case (handle both 'active' and 'Active')
    const normalizeStatus = (status: string): string => {
      if (!status) return "Pending"
      // Convert to proper case: 'active' -> 'Active', 'kyc/kyb' -> 'KYC/KYB'
      if (status.toLowerCase() === 'kyc/kyb') return 'KYC/KYB'
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    }
    setStatus(normalizeStatus(investor.status || "Pending"))
    // Load all structures the investor is assigned to
    setSelectedStructures(investor.fundOwnerships?.map(fo => fo.fundId) || (investor.fundOwnership?.fundId ? [investor.fundOwnership.fundId] : []))
    setNotes(investor.notes || "")
    setPreferredContactMethod(investor.preferredContactMethod || "Email")

    if (investor.address) {
      setStreet(investor.address.street)
      setCity(investor.address.city)
      setState(investor.address.state)
      setZipCode(investor.address.zipCode)
      setCountry(investor.address.country)
    }

    // Load per-structure custom terms
    const initialStructureTerms: Record<string, {
      hasCustomTerms: boolean
      managementFee: string
      performanceFee: string
      hurdleRate: string
      preferredReturn: string
    }> = {}

    if (investor.fundOwnerships && Array.isArray(investor.fundOwnerships)) {
      investor.fundOwnerships.forEach(ownership => {
        if (ownership.customTerms) {
          initialStructureTerms[ownership.fundId] = {
            hasCustomTerms: true,
            managementFee: ownership.customTerms.managementFee?.toString() || "",
            performanceFee: ownership.customTerms.performanceFee?.toString() || "",
            hurdleRate: ownership.customTerms.hurdleRate?.toString() || "",
            preferredReturn: ownership.customTerms.preferredReturn?.toString() || ""
          }
        } else {
          initialStructureTerms[ownership.fundId] = {
            hasCustomTerms: false,
            managementFee: "",
            performanceFee: "",
            hurdleRate: "",
            preferredReturn: ""
          }
        }
      })
    }

    setStructureCustomTerms(initialStructureTerms)

    // @deprecated - Load old global custom terms (for backward compatibility)
    if (investor.customTerms) {
      setHasCustomTerms(true)
      setCustomManagementFee(investor.customTerms.managementFee?.toString() || "")
      setCustomPerformanceFee(investor.customTerms.performanceFee?.toString() || "")
      setCustomHurdleRate(investor.customTerms.hurdleRate?.toString() || "")
      setCustomPreferredReturn(investor.customTerms.preferredReturn?.toString() || "")
    }

    // Create sample hierarchies if they don't exist (one-time setup)
    console.log('[Edit Investor] Creating sample hierarchies...')
    createSampleHierarchies()

    // Repair hierarchy relationships (one-time operation)
    console.log('[Edit Investor] Running hierarchy repair...')
    const repairResult = repairHierarchyRelationships()
    console.log('[Edit Investor] Repair result:', repairResult)

    const allStructures = getStructures()
    setStructures(allStructures)

    // Build available structure levels list
    buildAvailableStructureLevels(allStructures)

    setIsLoading(false)
  }, [id])

  // Initialize custom terms for newly selected structures
  useEffect(() => {
    selectedStructures.forEach(structureId => {
      setStructureCustomTerms(prev => {
        // Only update if this structure doesn't have custom terms yet
        if (!prev[structureId]) {
          return {
            ...prev,
            [structureId]: {
              hasCustomTerms: false,
              managementFee: "",
              performanceFee: "",
              hurdleRate: "",
              preferredReturn: ""
            }
          }
        }
        return prev
      })
    })
  }, [selectedStructures])

  // Build list of all available structure levels (for dropdown)
  const buildAvailableStructureLevels = (allStructures: Structure[]) => {
    const levels: Array<{ structure: Structure; displayName: string }> = []

    const typeLabels: Record<string, string> = {
      fund: "Fund",
      sa: "SA/LLC",
      fideicomiso: "Trust",
      "private-debt": "Private Debt",
    }

    // Separate regular structures from hierarchy structures
    const regularStructures: Structure[] = []
    const hierarchyRoots: Structure[] = []

    allStructures.forEach(structure => {
      if (structure.hierarchyMode) {
        // Find the root of this hierarchy
        let rootStructure = structure
        while (rootStructure.parentStructureId) {
          const parent = allStructures.find(s => s.id === rootStructure.parentStructureId)
          if (!parent) break
          rootStructure = parent
        }

        // Add root if not already in list
        if (!hierarchyRoots.find(r => r.id === rootStructure.id)) {
          hierarchyRoots.push(rootStructure)
        }
      } else {
        // Regular structure (no hierarchy)
        if (structure.applyEconomicTermsAtThisLevel) {
          regularStructures.push(structure)
        }
      }
    })

    // Sort regular structures and hierarchy roots by creation date
    regularStructures.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime())
    hierarchyRoots.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime())

    // Combine all structures maintaining order
    const allSorted = [...regularStructures, ...hierarchyRoots].sort((a, b) =>
      new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
    )

    // Build dropdown list
    allSorted.forEach(structure => {
      if (structure.hierarchyMode) {
        // This is a hierarchy root - add it and all its investable descendants
        const descendants = getStructureDescendants(structure.id)
        const allLevels = [structure, ...descendants]

        // Filter to only levels where economic terms apply
        const investableLevels = allLevels.filter(
          level => level.applyEconomicTermsAtThisLevel
        )

        // Sort by hierarchy level
        investableLevels.sort((a, b) => (a.hierarchyLevel || 0) - (b.hierarchyLevel || 0))

        console.log(`[Hierarchy] ${structure.name}: ${investableLevels.length} investable levels`)

        // Add master structure first, then indented children
        investableLevels.forEach((level, idx) => {
          const isRoot = idx === 0
          const indent = isRoot ? '' : '  ↳ '
          const levelNum = level.hierarchyLevel || 1

          // Get level name from hierarchyStructures array (0-indexed, so levelNum - 1)
          const levelConfig = structure.hierarchyStructures?.[levelNum - 1]
          const levelLabel = levelConfig?.name || `Level ${levelNum}`

          const typeLabel = typeLabels[level.type]
          const displayName = `${indent}${level.name} - ${levelLabel} (${typeLabel})`

          // For child structures, override totalCommitment with parent's value
          const structureToDisplay = isRoot ? level : {
            ...level,
            totalCommitment: structure.totalCommitment,
            currency: structure.currency
          }

          levels.push({ structure: structureToDisplay, displayName })
        })
      } else {
        // Regular structure
        levels.push({
          structure,
          displayName: `${structure.name} (${typeLabels[structure.type]})`
        })
      }
    })

    console.log('[Dropdown] Final structure list (grouped hierarchies):')
    levels.forEach((l, idx) => {
      console.log(`  ${idx + 1}. ${l.displayName}`)
    })

    setAvailableStructureLevels(levels)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedStructures.length === 0) {
      toast.error("Please select at least one fund/structure")
      return
    }

    if (!name || !email) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)

    try {
      const dynamicInvestors = getInvestors()
      const staticInvestors = investorsData as Investor[]
      const allInvestors = [...staticInvestors, ...dynamicInvestors]
      const investor = dynamicInvestors.find((inv) => inv.id === id)

      if (!investor) {
        toast.error("This investor cannot be edited (static data)")
        setIsSaving(false)
        return
      }

      // Build fundOwnerships array for all selected structures with per-structure custom terms
      const fundOwnerships = selectedStructures.map(structureId => {
        const selectedLevel = availableStructureLevels.find(l => l.structure.id === structureId)
        const fundName = selectedLevel?.structure.name || structureId

        // Find existing ownership to preserve commitment data, or create new
        const existingOwnership = allInvestors.find(inv => inv.id === id)?.fundOwnerships?.find(fo => fo.fundId === structureId)

        // Get custom terms for THIS structure
        const structureTerms = structureCustomTerms[structureId]
        const customTermsForStructure = structureTerms?.hasCustomTerms ? {
          managementFee: structureTerms.managementFee ? parseFloat(structureTerms.managementFee) : undefined,
          performanceFee: structureTerms.performanceFee ? parseFloat(structureTerms.performanceFee) : undefined,
          hurdleRate: structureTerms.hurdleRate ? parseFloat(structureTerms.hurdleRate) : undefined,
          preferredReturn: structureTerms.preferredReturn ? parseFloat(structureTerms.preferredReturn) : undefined,
        } : undefined

        // Calculate ownership percent if not already set
        const commitment = existingOwnership?.commitment || 0
        let ownershipPercent = existingOwnership?.ownershipPercent || 0

        // If ownership percent is 0 but commitment is set, calculate it
        if (ownershipPercent === 0 && commitment > 0) {
          const structure = selectedLevel?.structure
          if (structure && structure.totalCommitment > 0) {
            ownershipPercent = (commitment / structure.totalCommitment) * 100
          }
        }

        // Build the ownership object
        const ownership: any = {
          fundId: structureId,
          fundName: fundName,
          commitment,
          ownershipPercent,
          calledCapital: existingOwnership?.calledCapital || 0,
          uncalledCapital: existingOwnership?.uncalledCapital || 0,
          hierarchyLevel: selectedLevel?.structure.hierarchyLevel,
          investedDate: existingOwnership?.investedDate || new Date().toISOString(),
          customTerms: customTermsForStructure
        }

        // Only preserve existing onboardingStatus if it exists
        // Don't default to 'Active' - let the onboarding flow manage this
        if (existingOwnership?.onboardingStatus) {
          ownership.onboardingStatus = existingOwnership.onboardingStatus
        }

        return ownership
      })

      const updated = updateInvestor(id, {
        name,
        email,
        phone: phone || undefined,
        type,
        taxId: taxId || undefined,
        status,
        fundOwnerships: fundOwnerships,
        hierarchyLevel: undefined, // Remove single hierarchyLevel as it's now per-ownership
        customTerms: undefined, // @deprecated - Use per-structure customTerms in fundOwnerships instead
        notes: notes || undefined,
        preferredContactMethod,
        address: street ? {
          street,
          city,
          state,
          zipCode,
          country,
        } : undefined,
      })

      if (updated) {
        router.push(`/investment-manager/investors/${id}`)
      } else {
        throw new Error("Update failed")
      }
    } catch (error) {
      console.error("Error updating investor:", error)
      toast.error("Failed to update investor. Please try again.")
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading investor data...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/investment-manager/investors/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Investor</h1>
          <p className="text-muted-foreground">Update investor details and information</p>
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

              <div className="space-y-2">
                <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                <select
                  id="preferredContact"
                  value={preferredContactMethod}
                  onChange={(e) => setPreferredContactMethod(e.target.value as "Email" | "Phone")}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Investor Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="Pending">Pending</option>
                  <option value="KYC/KYB">KYC/KYB</option>
                  <option value="Contracts">Contracts</option>
                  <option value="Payments">Payments</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
              <div className="space-y-3">
                <Label>Select Fund/Structure Levels (Multiple) *</Label>
                {availableStructureLevels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No funds available. Please create a structure first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-2">
                    {availableStructureLevels.map((level) => (
                      <label
                        key={level.structure.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStructures.includes(level.structure.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStructures([...selectedStructures, level.structure.id])
                            } else {
                              setSelectedStructures(selectedStructures.filter(id => id !== level.structure.id))
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{level.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            {level.structure.totalCommitment ? `Total: ${level.structure.currency} ${level.structure.totalCommitment.toLocaleString()}` : ''}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Select one or more structures to assign this investor. For multi-level hierarchies, all levels where economic terms and waterfall calculations apply are shown.
                </p>
              </div>

              {selectedStructures.length > 0 && (
                <div className="space-y-3">
                  <Label>Selected Structures ({selectedStructures.length})</Label>
                  {selectedStructures.map((structureId, index) => {
                    const selectedLevel = availableStructureLevels.find(l => l.structure.id === structureId)
                    if (!selectedLevel) return null

                    return (
                      <div key={`${structureId}-${index}`} className="p-4 rounded-lg border bg-muted/50 border-muted">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{selectedLevel.structure.name}</span>
                          {selectedLevel.structure.hierarchyLevel !== undefined && (
                            <Badge variant="outline">Level {selectedLevel.structure.hierarchyLevel}</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <div>
                            <span className="text-muted-foreground">Total Commitment:</span>
                            <span className="ml-2 font-medium">
                              ${selectedLevel.structure.totalCommitment.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Investors:</span>
                            <span className="ml-2 font-medium">
                              {selectedLevel.structure.investors}
                            </span>
                          </div>
                        </div>
                        {selectedLevel.structure.applyEconomicTermsAtThisLevel && (
                          <div className="flex gap-2 mt-2">
                            <Badge variant="default" className="text-xs">✓ Economic Terms Apply</Badge>
                            {selectedLevel.structure.applyWaterfallAtThisLevel && (
                              <Badge variant="default" className="text-xs">✓ Waterfall Calculations</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> Financial metrics (commitment, capital calls, distributions) are managed through fund operations.
                </p>
              </div>
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

          {/* Per-Structure Custom Economic Terms */}
          {selectedStructures.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Custom Economic Terms (Optional)</CardTitle>
                <CardDescription>Override fund-level terms for this investor per structure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedStructures.map((structureId, index) => {
                  const selectedLevel = availableStructureLevels.find(l => l.structure.id === structureId)
                  if (!selectedLevel) return null

                  const structureTerms = structureCustomTerms[structureId] || {
                    hasCustomTerms: false,
                    managementFee: "",
                    performanceFee: "",
                    hurdleRate: "",
                    preferredReturn: ""
                  }

                  return (
                    <div key={`${structureId}-${index}`} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{selectedLevel.structure.name}</span>
                          {selectedLevel.structure.hierarchyLevel !== undefined && (
                            <Badge variant="outline">Level {selectedLevel.structure.hierarchyLevel}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`hasCustomTerms-${structureId}`}
                          checked={structureTerms.hasCustomTerms}
                          onChange={(e) => {
                            setStructureCustomTerms({
                              ...structureCustomTerms,
                              [structureId]: {
                                ...structureTerms,
                                hasCustomTerms: e.target.checked
                              }
                            })
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`hasCustomTerms-${structureId}`} className="cursor-pointer">
                          This investor has custom economic terms for this structure
                        </Label>
                      </div>

                      {structureTerms.hasCustomTerms && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                          <div className="space-y-2">
                            <Label htmlFor={`customManagementFee-${structureId}`}>Management Fee (%)</Label>
                            <Input
                              id={`customManagementFee-${structureId}`}
                              type="number"
                              step="0.01"
                              value={structureTerms.managementFee}
                              onChange={(e) => {
                                setStructureCustomTerms({
                                  ...structureCustomTerms,
                                  [structureId]: {
                                    ...structureTerms,
                                    managementFee: e.target.value
                                  }
                                })
                              }}
                              placeholder="e.g., 1.5"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`customPerformanceFee-${structureId}`}>Performance Fee (%)</Label>
                            <Input
                              id={`customPerformanceFee-${structureId}`}
                              type="number"
                              step="0.01"
                              value={structureTerms.performanceFee}
                              onChange={(e) => {
                                setStructureCustomTerms({
                                  ...structureCustomTerms,
                                  [structureId]: {
                                    ...structureTerms,
                                    performanceFee: e.target.value
                                  }
                                })
                              }}
                              placeholder="e.g., 20"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`customHurdleRate-${structureId}`}>Hurdle Rate (%)</Label>
                            <Input
                              id={`customHurdleRate-${structureId}`}
                              type="number"
                              step="0.01"
                              value={structureTerms.hurdleRate}
                              onChange={(e) => {
                                setStructureCustomTerms({
                                  ...structureCustomTerms,
                                  [structureId]: {
                                    ...structureTerms,
                                    hurdleRate: e.target.value
                                  }
                                })
                              }}
                              placeholder="e.g., 8"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`customPreferredReturn-${structureId}`}>Preferred Return (%)</Label>
                            <Input
                              id={`customPreferredReturn-${structureId}`}
                              type="number"
                              step="0.01"
                              value={structureTerms.preferredReturn}
                              onChange={(e) => {
                                setStructureCustomTerms({
                                  ...structureCustomTerms,
                                  [structureId]: {
                                    ...structureTerms,
                                    preferredReturn: e.target.value
                                  }
                                })
                              }}
                              placeholder="e.g., 8"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Notes (Optional)</CardTitle>
              <CardDescription>Additional information about this investor</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or observations about this investor..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild disabled={isSaving}>
            <Link href={`/investment-manager/investors/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
