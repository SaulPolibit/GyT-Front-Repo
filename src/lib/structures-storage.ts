// Investor Pre-Registration Interface
export interface InvestorPreRegistration {
  // Investor type
  investorType: 'individual' | 'institution' | 'fund-of-funds' | 'family-office'

  // For individual investors
  firstName?: string
  lastName?: string

  // For entity investors (institution, fund-of-funds, family-office)
  entityName?: string
  entityType?: string  // LLC, Corporation, Trust, Partnership, etc.
  contactFirstName?: string  // Required for entities - portal user
  contactLastName?: string   // Required for entities - portal user
  taxId?: string  // Optional for entities

  // Common fields
  email: string
  hierarchyLevel?: number  // Which level (0-N) investor will participate in
  customTerms?: {
    managementFee?: number
    performanceFee?: number
    hurdleRate?: number
    preferredReturn?: number
  }
  source: 'manual' | 'csv'
  addedAt: Date
}

// Structure data type
export interface Structure {
  id: string
  name: string
  type: 'fund' | 'sa' | 'fideicomiso' | 'private-debt'
  subtype: string
  jurisdiction: string
  totalCommitment: number
  currency: string
  investors: number
  createdDate: Date
  status: 'active' | 'fundraising' | 'closed'
  // Additional fields from onboarding
  inceptionDate?: Date
  currentStage?: string
  fundTerm?: string
  fundType?: string
  minCheckSize?: number
  maxCheckSize?: number
  economicTermsApplication?: string
  distributionModel?: string
  managementFee?: string
  performanceFee?: string
  hurdleRate?: string
  preferredReturn?: string
  waterfallStructure?: string
  waterfallScenarios?: Array<{id: string; name: string; managementFee: string; gpSplit: string; irrHurdle: string; preferredReturn: string; isExpanded: boolean}>
  distributionFrequency?: string
  defaultTaxRate?: string
  debtInterestRate?: string
  debtGrossInterestRate?: string
  // V3 Additional fields
  plannedInvestments?: string
  financingStrategy?: string
  equitySubtype?: string
  debtSubtype?: string
  usState?: string
  usStateOther?: string
  capitalCallNoticePeriod?: string
  capitalCallDefaultPercentage?: string
  capitalCallPaymentDeadline?: string
  determinedTier?: string
  calculatedIssuances?: number
  tokenName?: string
  tokenSymbol?: string
  tokenValue?: number
  totalTokens?: number
  minTokensPerInvestor?: number
  maxTokensPerInvestor?: number
  preRegisteredInvestors?: InvestorPreRegistration[]
  uploadedFundDocuments?: { name: string; addedAt: Date }[]
  uploadedInvestorDocuments?: { name: string; addedAt: Date }[]
  // Hierarchy fields for multi-level structures
  hierarchyMode?: boolean                        // Enable/disable hierarchy features
  hierarchySetupApproach?: 'all-at-once' | 'incremental'  // How hierarchy is being set up
  hierarchyLevels?: number                       // How many levels in the hierarchy
  numberOfLevels?: number                        // Total number of levels in hierarchy (e.g., 3, 4, 5)
  hierarchyStructures?: {                        // Configuration for each level in hierarchy
    level: number
    name: string
    type: string
    applyWaterfall: boolean
    applyEconomicTerms: boolean
    waterfallAlgorithm: 'american' | 'european' | null
  }[]
  parentStructureId?: string | null              // Link to parent structure
  parentStructureOwnershipPercentage?: number | null  // Percentage ownership of parent
  childStructureIds?: string[]                   // Array of child structure IDs
  hierarchyLevel?: number                        // Depth in tree (1 = root/master, 2, 3, ...)
  hierarchyPath?: string[]                       // Full path from root to this node
  applyWaterfallAtThisLevel?: boolean           // Waterfall calculations enabled here
  applyEconomicTermsAtThisLevel?: boolean       // Economic terms apply here
  waterfallAlgorithm?: 'american' | 'european' | null  // Algorithm if enabled
  incomeFlowTarget?: string | null               // Where income flows (parent ID or 'investors')
  // ILPA Performance Methodology
  performanceMethodology?: 'granular' | 'grossup'  // Granular (detailed capital calls) or Gross Up (simplified)
  calculationLevel?: 'fund-level' | 'portfolio-level'  // Fund-to-Investor or Fund-to-Investment
  // NAV (Net Asset Value) Tracking - Optional
  currentNav?: number  // Latest NAV value
  navHistory?: {
    date: string
    totalNav: number
    navPerShare?: number
    notes?: string
  }[]
  // Legal & Terms - Comprehensive legal agreement content
  legalTerms?: {
    // Partnership Agreement (3 core sections)
    managementControl?: string
    capitalContributions?: string
    allocationsDistributions?: string

    // Limited Partner Rights & Obligations
    limitedPartnerRights?: string[]
    limitedPartnerObligations?: string[]

    // Voting Rights
    votingRights?: {
      votingThreshold?: number
      mattersRequiringConsent?: string[]
    }

    // Redemption & Withdrawal
    redemptionTerms?: {
      lockUpPeriod?: string
      withdrawalConditions?: string[]
      withdrawalProcess?: string[]
    }

    // Transfer Restrictions
    transferRestrictions?: {
      generalProhibition?: string
      permittedTransfers?: string[]
      transferRequirements?: string[]
    }

    // Reporting Commitments
    reportingCommitments?: {
      quarterlyReports?: string
      annualReports?: string
      taxForms?: string
      capitalNotices?: string
      additionalCommunications?: string[]
    }

    // Liability Limitations
    liabilityLimitations?: {
      limitedLiabilityProtection?: string
      exceptionsToLimitedLiability?: string[]
      maximumExposureNote?: string
    }

    // Indemnification
    indemnification?: {
      partnershipIndemnifiesLPFor?: string[]
      lpIndemnifiesPartnershipFor?: string[]
      indemnificationProcedures?: string
    }

    // Additional Provisions (preserve existing fields)
    amendments?: string
    dissolution?: string
    disputes?: string
    governingLaw?: string
    additionalProvisions?: string
  }
}

const STORAGE_KEY = 'polibit_structures'

// Helper function to generate URL-safe slug from structure name
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
}

// Get all structures from localStorage
export function getStructures(): Structure[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const structures = JSON.parse(stored)
    // Parse dates back to Date objects
    return structures.map((s: any) => ({
      ...s,
      createdDate: new Date(s.createdDate),
      inceptionDate: s.inceptionDate ? new Date(s.inceptionDate) : undefined,
      preRegisteredInvestors: s.preRegisteredInvestors?.map((inv: any) => ({
        ...inv,
        addedAt: new Date(inv.addedAt)
      })),
      uploadedFundDocuments: s.uploadedFundDocuments?.map((doc: any) => ({
        ...doc,
        addedAt: new Date(doc.addedAt)
      })),
      uploadedInvestorDocuments: s.uploadedInvestorDocuments?.map((doc: any) => ({
        ...doc,
        addedAt: new Date(doc.addedAt)
      }))
    }))
  } catch (error) {
    console.error('Error loading structures:', error)
    return []
  }
}

// Save a new structure (can be a single structure or create multi-level hierarchy)
export function saveStructure(structure: Omit<Structure, 'id' | 'createdDate'>): Structure {
  // If hierarchyMode is enabled and this is a root structure (no parent), create multi-level hierarchy
  // Multi-level hierarchy is only supported for Fund, SA/LLC, and Trust (NOT Private Debt)
  const supportsHierarchy = structure.type === 'fund' || structure.type === 'sa' || structure.type === 'fideicomiso'

  if (structure.hierarchyMode && !structure.parentStructureId && structure.hierarchyLevel === 1 && supportsHierarchy) {
    return createMultiLevelStructure(structure)
  }

  // If hierarchyMode is requested but structure type doesn't support it, log warning and create single structure
  if (structure.hierarchyMode && !supportsHierarchy) {
    console.warn(`[saveStructure] Multi-level hierarchy not supported for structure type: ${structure.type}. Creating single structure instead.`)
  }

  // Otherwise, create single structure
  return saveSingleStructure(structure)
}

// Helper: Save a single structure
function saveSingleStructure(structure: Omit<Structure, 'id' | 'createdDate'>): Structure {
  const structures = getStructures()

  // Generate slug from name
  let slug = generateSlugFromName(structure.name)

  // Handle duplicates by appending number
  let counter = 1
  let finalSlug = slug
  while (structures.some(s => s.id === finalSlug)) {
    finalSlug = `${slug}-${counter}`
    counter++
  }

  const newStructure: Structure = {
    ...structure,
    id: finalSlug,
    createdDate: new Date(),
  }

  structures.push(newStructure)

  // If this structure has a parent, update the parent's childStructureIds
  if (newStructure.parentStructureId) {
    const parentIndex = structures.findIndex(s => s.id === newStructure.parentStructureId)
    if (parentIndex !== -1) {
      if (!structures[parentIndex].childStructureIds) {
        structures[parentIndex].childStructureIds = []
      }
      if (!structures[parentIndex].childStructureIds!.includes(finalSlug)) {
        structures[parentIndex].childStructureIds!.push(finalSlug)
      }
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(structures))
  } catch (error) {
    console.error('Error saving structure:', error)
    throw error
  }

  return newStructure
}

// Helper: Create a multi-level hierarchy (N levels) from a single structure input
function createMultiLevelStructure(baseStructure: Omit<Structure, 'id' | 'createdDate'>): Structure {
  const numberOfLevels = baseStructure.numberOfLevels || 4 // Default to 4 if not specified
  const hierarchyConfig = baseStructure.hierarchyStructures || []

  console.log(`[createMultiLevelStructure] Creating ${numberOfLevels}-level hierarchy for: ${baseStructure.name}`)

  if (numberOfLevels < 2) {
    console.warn(`[createMultiLevelStructure] numberOfLevels must be >= 2. Creating single structure.`)
    return saveSingleStructure(baseStructure)
  }

  if (hierarchyConfig.length === 0) {
    console.warn(`[createMultiLevelStructure] No hierarchy configuration provided. Using default settings.`)
  }

  const baseSlug = generateSlugFromName(baseStructure.name)
  const createdLevels: Structure[] = []
  let previousLevel: Structure | null = null

  // Create N levels dynamically using configuration from hierarchyStructures
  for (let levelNum = 1; levelNum <= numberOfLevels; levelNum++) {
    // Get configuration for this level (array is 0-indexed, levels are 1-indexed)
    const levelConfig = hierarchyConfig[levelNum - 1]

    // Use checkbox values from UI configuration, or fallback to defaults
    const applyEconomicTerms = levelConfig?.applyEconomicTerms ?? (levelNum <= 2)
    const applyWaterfall = levelConfig?.applyWaterfall ?? (levelNum <= 2)
    const waterfallAlgo = levelConfig?.waterfallAlgorithm ?? (applyWaterfall ? 'american' : null)

    // Determine structure type for this level
    // Use type from hierarchy config if provided, otherwise inherit from master
    const levelType = levelConfig?.type || baseStructure.type
    const levelSubtype = baseStructure.subtype

    // Generate unique name by appending level label
    const levelLabel = levelConfig?.name || `Level ${levelNum}`
    const levelName = levelNum === 1
      ? baseStructure.name
      : `${baseStructure.name} - ${levelLabel}`

    // Build hierarchy path
    const hierarchyPath = [...createdLevels.map(l => l.id), `${baseSlug}-level-${levelNum}`]

    // Calculate commitment (decreases at each level)
    const commitmentMultiplier = 1 - (levelNum - 1) * 0.2
    const totalCommitment = baseStructure.totalCommitment * Math.max(commitmentMultiplier, 0.3)

    const levelStructure = saveSingleStructure({
      ...baseStructure,
      name: levelName,
      type: levelType,
      subtype: levelSubtype,
      hierarchyLevel: levelNum,
      hierarchyPath,
      parentStructureId: previousLevel?.id || null,
      childStructureIds: [],
      totalCommitment,
      // Use checkbox values from structure setup UI
      applyWaterfallAtThisLevel: applyWaterfall,
      applyEconomicTermsAtThisLevel: applyEconomicTerms,
      waterfallAlgorithm: waterfallAlgo,
      incomeFlowTarget: previousLevel?.id || 'investors',
    })

    createdLevels.push(levelStructure)
    previousLevel = levelStructure

    const investabilityLabel = applyEconomicTerms ? '✅ Investable (Economic Terms)' : '❌ Operational only'
    const waterfallLabel = applyWaterfall ? `Waterfall: ${waterfallAlgo}` : 'Distribution: Pro-Rata'
    console.log(`  ✓ Created Level ${levelNum}: ${levelStructure.name} (ID: ${levelStructure.id})`)
    console.log(`    ${investabilityLabel} | ${waterfallLabel}`)
  }

  // Repair hierarchy to ensure parent-child relationships are correct
  repairHierarchyRelationships()

  // Auto-assign pre-registered investors to investable levels
  if (baseStructure.preRegisteredInvestors && baseStructure.preRegisteredInvestors.length > 0) {
    console.log(`[createMultiLevelStructure] Auto-assigning ${baseStructure.preRegisteredInvestors.length} pre-registered investors...`)

    const { saveInvestor } = require('./investors-storage')
    const investableLevels = createdLevels.filter(level => level.applyEconomicTermsAtThisLevel)

    baseStructure.preRegisteredInvestors.forEach((preInvestor) => {
      // Determine which level this investor should be assigned to
      let targetLevel: Structure | null = null

      if (preInvestor.hierarchyLevel !== undefined) {
        // If specific level is set, use that level
        const foundLevel = createdLevels.find(l => l.hierarchyLevel === preInvestor.hierarchyLevel)
        if (foundLevel && foundLevel.applyEconomicTermsAtThisLevel) {
          targetLevel = foundLevel
        } else {
          console.warn(`  ⚠ Investor ${preInvestor.email} assigned to level ${preInvestor.hierarchyLevel} but that level is not investable. Skipping.`)
          return
        }
      } else {
        // No specific level set, default to first investable level (typically master level)
        targetLevel = investableLevels[0] || null
      }

      if (!targetLevel) {
        console.warn(`  ⚠ No investable level found for investor ${preInvestor.email}. Skipping.`)
        return
      }

      // Create ONE investor record for this pre-registered investor
      try {
        // Determine investor name and type based on investorType
        let investorName: string
        let investorType: 'individual' | 'institution' | 'fund-of-funds' | 'family-office'

        if (preInvestor.investorType === 'individual') {
          investorName = `${preInvestor.firstName} ${preInvestor.lastName}`
          investorType = 'individual'
        } else {
          // Entity investor
          investorName = preInvestor.entityName || 'Unknown Entity'
          investorType = preInvestor.investorType
        }

        // Pre-registered investors have $0 commitment until they complete onboarding
        const commitment = 0
        const ownershipPercent = 0

        saveInvestor({
          name: investorName,
          email: preInvestor.email,
          phone: '',
          type: investorType,
          status: 'Pending', // Pre-registered investors are Pending until they complete onboarding
          fundOwnerships: [{
            fundId: targetLevel.id,
            fundName: targetLevel.name,
            commitment,
            ownershipPercent,
            calledCapital: 0,
            uncalledCapital: 0,
            hierarchyLevel: targetLevel.hierarchyLevel,
            investedDate: new Date().toISOString()
          }],
          customTerms: preInvestor.customTerms,
          currentValue: 0,
          unrealizedGain: 0,
          totalDistributed: 0,
          netCashFlow: 0,
          irr: 0,
          taxId: preInvestor.taxId || '',
          k1Status: 'Not Started', // Consistent with other pre-registered investors
          country: baseStructure.jurisdiction,
          city: '',
          address: '',
          investorSince: new Date().toISOString(),
          // Store entity-specific fields if applicable
          ...(investorType !== 'individual' && {
            entityName: preInvestor.entityName,
            entityType: preInvestor.entityType,
            contactFirstName: preInvestor.contactFirstName,
            contactLastName: preInvestor.contactLastName,
          }),
        })

        console.log(`  ✓ Created ${investorType} investor ${preInvestor.email} for ${targetLevel.name} (Level ${targetLevel.hierarchyLevel})`)
      } catch (error) {
        console.error(`  ✗ Failed to create investor ${preInvestor.email}:`, error)
      }
    })
  }

  console.log(`[createMultiLevelStructure] ✅ ${numberOfLevels}-level hierarchy complete! Root ID: ${createdLevels[0].id}`)

  // Return the root structure (Level 1)
  return createdLevels[0]
}

// Update an existing structure
export function updateStructure(id: string, updates: Partial<Structure>): Structure | null {
  const structures = getStructures()
  const index = structures.findIndex(s => s.id === id)

  if (index === -1) return null

  structures[index] = { ...structures[index], ...updates }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(structures))
  } catch (error) {
    console.error('Error updating structure:', error)
    throw error
  }

  return structures[index]
}

// Delete a structure and all associated data
export async function deleteStructure(id: string): Promise<boolean> {
  const structures = getStructures()
  const structure = structures.find(s => s.id === id)

  if (!structure) return false

  try {
    // 1. If this structure has child structures, delete them recursively first
    if (structure.childStructureIds && structure.childStructureIds.length > 0) {
      console.log(`[deleteStructure] Deleting ${structure.childStructureIds.length} child structures for ${structure.name}`)
      for (const childId of structure.childStructureIds) {
        await deleteStructure(childId)
      }
    }

    // 2. Delete all investors associated with this structure
    if (typeof window !== 'undefined') {
      const { getInvestorsByFundId, deleteInvestor } = await import('./investors-storage')
      const associatedInvestors = getInvestorsByFundId(id)

      for (const investor of associatedInvestors) {
        deleteInvestor(investor.id)
      }
    }

    // 2.5. Delete all capital calls associated with this structure
    if (typeof window !== 'undefined') {
      const { getCapitalCallsByFundId, deleteCapitalCall } = await import('./capital-calls-storage')
      const associatedCapitalCalls = getCapitalCallsByFundId(id)

      for (const capitalCall of associatedCapitalCalls) {
        deleteCapitalCall(capitalCall.id)
      }
      console.log(`[deleteStructure] Deleted ${associatedCapitalCalls.length} capital calls for ${structure.name}`)
    }

    // 2.6. Delete all distributions associated with this structure
    if (typeof window !== 'undefined') {
      const { getDistributionsByFundId, deleteDistribution } = await import('./distributions-storage')
      const associatedDistributions = getDistributionsByFundId(id)

      for (const distribution of associatedDistributions) {
        deleteDistribution(distribution.id)
      }
      console.log(`[deleteStructure] Deleted ${associatedDistributions.length} distributions for ${structure.name}`)
    }

    // 3. Delete uploaded documents from filesystem (API call)
    if (structure.uploadedFundDocuments?.length || structure.uploadedInvestorDocuments?.length) {
      try {
        await fetch(`/api/structures/${id}/documents`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.warn('Failed to delete uploaded documents:', error)
      }
    }

    // 4. If this structure has a parent, remove it from parent's childStructureIds
    if (structure.parentStructureId) {
      const updatedStructures = getStructures()
      const parent = updatedStructures.find(s => s.id === structure.parentStructureId)
      if (parent && parent.childStructureIds) {
        parent.childStructureIds = parent.childStructureIds.filter(childId => childId !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStructures))
      }
    }

    // 5. Delete the structure from localStorage
    const filtered = getStructures().filter(s => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

    console.log(`[deleteStructure] Deleted structure: ${structure.name} (${id})`)
    return true
  } catch (error) {
    console.error('Error deleting structure:', error)
    throw error
  }
}

// Get a single structure by ID
export function getStructureById(id: string): Structure | null {
  const structures = getStructures()
  return structures.find(s => s.id === id) || null
}

// Get current investor count for a structure
export function getStructureInvestorCount(structureId: string): number {
  if (typeof window === 'undefined') return 0

  try {
    const { getInvestorsByFundId } = require('./investors-storage')
    const investors = getInvestorsByFundId(structureId)
    return investors.length
  } catch {
    return 0
  }
}

// Get current investment count for a structure
export function getStructureInvestmentCount(structureId: string): number {
  if (typeof window === 'undefined') return 0

  try {
    const { getInvestmentsByFundId } = require('./investments-storage')
    const investments = getInvestmentsByFundId(structureId)
    return investments.length
  } catch {
    return 0
  }
}

// Check if structure can accept more investors
export function canAddInvestor(structureId: string): { canAdd: boolean; current: number; max: number } {
  const structure = getStructureById(structureId)
  if (!structure) return { canAdd: false, current: 0, max: 0 }

  const current = getStructureInvestorCount(structureId)
  const max = structure.investors

  return { canAdd: current < max, current, max }
}

// Check if structure can accept more investments
export function canAddInvestment(structureId: string): { canAdd: boolean; current: number; max: number } {
  const structure = getStructureById(structureId)
  if (!structure) return { canAdd: false, current: 0, max: 0 }

  const current = getStructureInvestmentCount(structureId)
  const max = parseInt(structure.plannedInvestments || '0')

  return { canAdd: current < max, current, max }
}

// Get current issuance count for a structure
export function getStructureIssuanceCount(structureId: string): number {
  if (typeof window === 'undefined') return 0

  try {
    const { getInvestmentsByFundId } = require('./investments-storage')
    const investments = getInvestmentsByFundId(structureId)

    console.log(`[DEBUG] getStructureIssuanceCount for ${structureId}:`, {
      investmentsFound: investments.length,
      investments: investments.map(inv => ({
        id: inv.id,
        name: inv.name,
        fundId: inv.fundId,
        investmentType: inv.investmentType
      }))
    })

    // Calculate total issuances based on investment types
    // Mixed = 2 issuances, Equity = 1, Debt = 1
    const totalIssuances = investments.reduce((sum, inv) => {
      const invType = inv.investmentType?.toUpperCase()
      if (invType === 'MIXED') return sum + 2
      if (invType === 'EQUITY') return sum + 1
      if (invType === 'DEBT') return sum + 1
      return sum
    }, 0)

    console.log(`[DEBUG] Total issuances calculated: ${totalIssuances}`)

    return totalIssuances
  } catch (error) {
    console.error('[DEBUG] Error in getStructureIssuanceCount:', error)
    return 0
  }
}

// Check if structure can accept more issuances (considering the investment type)
export function canAddIssuance(structureId: string, investmentType: 'Equity' | 'Debt' | 'Mixed'): { canAdd: boolean; current: number; max: number; required: number } {
  const structure = getStructureById(structureId)
  if (!structure) return { canAdd: false, current: 0, max: 0, required: 0 }

  const current = getStructureIssuanceCount(structureId)
  const max = structure.calculatedIssuances || 0

  // Calculate how many issuances this investment would require
  const required = investmentType === 'Mixed' ? 2 : 1

  return { canAdd: (current + required) <= max, current, max, required }
}

// Migration function to update old structures with new fields
export function migrateStructures(): void {
  if (typeof window === 'undefined') return

  try {
    const structures = getStructures()
    let hasChanges = false

    const migratedStructures = structures.map(structure => {
      let needsMigration = false
      let migratedStructure = { ...structure }

      // Migrate SA/LLC subtypes - SA/LLC no longer has subtypes
      if (structure.type === 'sa' && structure.subtype) {
        hasChanges = true
        needsMigration = true
        // SA/LLC no longer supports subtypes, remove it
        migratedStructure.subtype = ''
        console.log(`Migrated structure "${structure.name}" - removed SA/LLC subtype "${structure.subtype}"`)
      }

      // Check if structure needs migration (missing new fields)
      if (!structure.plannedInvestments) {
        hasChanges = true
        needsMigration = true

        // Calculate token value (round to nearest 1000, 10000, 100000)
        const aum = structure.totalCommitment
        const targetTokens = 1000
        let tokenValue = Math.round(aum / targetTokens)

        if (tokenValue >= 100000) tokenValue = Math.round(tokenValue / 100000) * 100000
        else if (tokenValue >= 10000) tokenValue = Math.round(tokenValue / 10000) * 10000
        else if (tokenValue >= 1000) tokenValue = Math.round(tokenValue / 1000) * 1000
        else if (tokenValue >= 100) tokenValue = Math.round(tokenValue / 100) * 100

        // Calculate total tokens
        const totalTokens = Math.round(aum / tokenValue)

        migratedStructure = {
          ...migratedStructure,
          // Add default values for V3 fields
          plannedInvestments: '1',
          financingStrategy: 'equity',
          capitalCallNoticePeriod: '10',
          capitalCallDefaultPercentage: '25',
          capitalCallPaymentDeadline: '15',
          determinedTier: structure.totalCommitment <= 10000000 ? 'starter' :
                         structure.totalCommitment <= 50000000 ? 'growth' :
                         structure.totalCommitment <= 100000000 ? 'enterprise' : 'custom',
          calculatedIssuances: 1,
          tokenName: `${structure.name} Token`,
          tokenSymbol: structure.name.split(' ').map(w => w[0]).join('').substring(0, 5).toUpperCase(),
          tokenValue: tokenValue,
          totalTokens: totalTokens,
          preRegisteredInvestors: [],
          uploadedFundDocuments: [],
          uploadedInvestorDocuments: []
        }
      }

      // Ensure tokenValue is always set (even if structure was partially migrated)
      if (!migratedStructure.tokenValue || migratedStructure.tokenValue === 0) {
        hasChanges = true
        const aum = structure.totalCommitment
        const targetTokens = 1000
        let tokenValue = Math.round(aum / targetTokens)

        if (tokenValue >= 100000) tokenValue = Math.round(tokenValue / 100000) * 100000
        else if (tokenValue >= 10000) tokenValue = Math.round(tokenValue / 10000) * 10000
        else if (tokenValue >= 1000) tokenValue = Math.round(tokenValue / 1000) * 1000
        else if (tokenValue >= 100) tokenValue = Math.round(tokenValue / 100) * 100

        const totalTokens = Math.round(aum / tokenValue)

        migratedStructure = {
          ...migratedStructure,
          tokenValue: tokenValue,
          totalTokens: totalTokens,
        }
      }

      // Migrate to hierarchy support (add default values)
      if (structure.hierarchyMode === undefined) {
        hasChanges = true
        migratedStructure = {
          ...migratedStructure,
          hierarchyMode: false,
          parentStructureId: migratedStructure.parentStructureId ?? null,  // Preserve existing parentStructureId
          childStructureIds: migratedStructure.childStructureIds ?? [],
          hierarchyLevel: migratedStructure.hierarchyLevel ?? 0,
          hierarchyPath: migratedStructure.hierarchyPath ?? [structure.id],
          applyWaterfallAtThisLevel: true,
          applyEconomicTermsAtThisLevel: true,
          waterfallAlgorithm: null,
          incomeFlowTarget: 'investors'
        }
      }

      return migratedStructure
    })

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedStructures))
      console.log('Structures migrated successfully')
    }
  } catch (error) {
    console.error('Error migrating structures:', error)
  }
}

// Hierarchy utility functions

// Get full hierarchy tree starting from root structure
export function getStructureHierarchy(rootId: string): Structure | null {
  const structure = getStructureById(rootId)
  if (!structure) return null

  const buildTree = (struct: Structure): Structure => {
    const children = (struct.childStructureIds || [])
      .map(childId => getStructureById(childId))
      .filter((child): child is Structure => child !== null)
      .map(child => buildTree(child))

    return {
      ...struct,
      children: children as any // Add children for tree representation
    }
  }

  return buildTree(structure)
}

// Get all ancestor structures up to root
export function getStructureAncestors(id: string): Structure[] {
  const structure = getStructureById(id)
  if (!structure) return []

  const ancestors: Structure[] = []
  let current = structure

  while (current.parentStructureId) {
    const parent = getStructureById(current.parentStructureId)
    if (!parent) break
    ancestors.push(parent)
    current = parent
  }

  return ancestors.reverse() // Root first
}

// Get all descendant structures recursively
export function getStructureDescendants(id: string): Structure[] {
  const structure = getStructureById(id)
  if (!structure) {
    console.log(`[getStructureDescendants] Structure not found for ID: ${id}`)
    return []
  }

  console.log(`[getStructureDescendants] Starting with: ${structure.name} (ID: ${id})`)
  console.log(`[getStructureDescendants] childStructureIds:`, structure.childStructureIds)

  const descendants: Structure[] = []

  const collectDescendants = (struct: Structure, depth = 0) => {
    const indent = '  '.repeat(depth)
    console.log(`${indent}[collectDescendants] Checking: ${struct.name} (Level ${struct.hierarchyLevel})`)
    console.log(`${indent}  childStructureIds:`, struct.childStructureIds)

    const children = (struct.childStructureIds || [])
      .map(childId => {
        const child = getStructureById(childId)
        if (!child) {
          console.log(`${indent}  WARNING: Child structure not found for ID: ${childId}`)
        }
        return child
      })
      .filter((child): child is Structure => child !== null)

    console.log(`${indent}  Found ${children.length} children`)

    children.forEach(child => {
      console.log(`${indent}  Adding child: ${child.name} (Level ${child.hierarchyLevel})`)
      descendants.push(child)
      collectDescendants(child, depth + 1)
    })
  }

  collectDescendants(structure)
  console.log(`[getStructureDescendants] Total descendants found: ${descendants.length}`)
  return descendants
}

// Validate hierarchy integrity (no circular references)
export function validateHierarchyIntegrity(id: string): { valid: boolean; error?: string } {
  const structure = getStructureById(id)
  if (!structure) return { valid: false, error: 'Structure not found' }

  // Check for circular references by walking up the tree
  const visited = new Set<string>()
  let current = structure

  while (current.parentStructureId) {
    if (visited.has(current.id)) {
      return { valid: false, error: `Circular reference detected at ${current.name}` }
    }
    visited.add(current.id)

    const parent = getStructureById(current.parentStructureId)
    if (!parent) {
      return { valid: false, error: `Parent structure ${current.parentStructureId} not found` }
    }
    current = parent
  }

  // Validate hierarchy path matches actual parent chain
  const ancestors = getStructureAncestors(id)
  const expectedPath = [...ancestors.map(a => a.id), id]
  const actualPath = structure.hierarchyPath || []

  if (JSON.stringify(expectedPath) !== JSON.stringify(actualPath)) {
    return { valid: false, error: 'Hierarchy path mismatch' }
  }

  return { valid: true }
}

// Get income flow path from property to investors
export function getIncomeFlowPath(propertyId: string): { path: Structure[]; flowDescription: string } {
  const structure = getStructureById(propertyId)
  if (!structure) return { path: [], flowDescription: 'Invalid structure' }

  const ancestors = getStructureAncestors(propertyId)
  const path = [structure, ...ancestors]

  const flowSteps = path.map(s => s.name).join(' → ')
  const flowDescription = `${flowSteps} → Investors`

  return { path, flowDescription }
}

// Repair hierarchy relationships for existing structures
// This function rebuilds childStructureIds arrays based on parentStructureId references
export function repairHierarchyRelationships(): { repaired: number; errors: string[] } {
  if (typeof window === 'undefined') return { repaired: 0, errors: [] }

  try {
    const structures = getStructures()
    const errors: string[] = []
    let repaired = 0

    console.log('[repairHierarchyRelationships] Starting repair...')
    console.log('[repairHierarchyRelationships] Total structures:', structures.length)

    // First, initialize all childStructureIds arrays
    structures.forEach(s => {
      if (!s.childStructureIds) {
        s.childStructureIds = []
      } else {
        // Clear existing childStructureIds to rebuild from scratch
        s.childStructureIds = []
      }
    })

    // Rebuild childStructureIds based on parentStructureId references
    structures.forEach(structure => {
      if (structure.parentStructureId) {
        console.log(`[repairHierarchyRelationships] Processing: ${structure.name}`)
        console.log(`  parentStructureId: ${structure.parentStructureId}`)
        console.log(`  hierarchyLevel: ${structure.hierarchyLevel}`)

        const parent = structures.find(s => s.id === structure.parentStructureId)
        if (parent) {
          if (!parent.childStructureIds!.includes(structure.id)) {
            parent.childStructureIds!.push(structure.id)
            repaired++
            console.log(`  ✓ Added to parent: ${parent.name}`)
          }
        } else {
          const error = `Parent structure not found: ${structure.parentStructureId} for child ${structure.name}`
          errors.push(error)
          console.error(`  ✗ ${error}`)
        }
      }
    })

    // Save repaired structures
    localStorage.setItem(STORAGE_KEY, JSON.stringify(structures))

    console.log('[repairHierarchyRelationships] Repair complete!')
    console.log(`  Relationships repaired: ${repaired}`)
    console.log(`  Errors: ${errors.length}`)

    return { repaired, errors }
  } catch (error) {
    console.error('[repairHierarchyRelationships] Error during repair:', error)
    throw error
  }
}

// Create sample multi-level hierarchy structures for testing
export function createSampleHierarchies(): void {
  if (typeof window === 'undefined') return

  console.log('[createSampleHierarchies] Creating sample multi-level hierarchies...')

  // Get existing structures
  const existing = getStructures()

  // Check if hierarchies already exist
  const hasHierarchies = existing.some(s => s.hierarchyMode && s.hierarchyLevel && s.hierarchyLevel > 1)

  if (hasHierarchies) {
    console.log('[createSampleHierarchies] Multi-level hierarchies already exist. Skipping creation.')
    return
  }

  // Create Polibit Real Estate II (4 levels) - Now uses automatic creation!
  console.log('\n[createSampleHierarchies] Creating Polibit Real Estate II (4 levels)...')
  saveStructure({
    name: 'Polibit Real Estate II',
    type: 'fideicomiso',
    subtype: 'real-estate-trust',
    jurisdiction: 'Panama',
    totalCommitment: 50000000,
    currency: 'USD',
    investors: 80,
    status: 'active',
    hierarchyMode: true, // This triggers automatic multi-level creation!
    hierarchyLevel: 1,
    applyWaterfallAtThisLevel: true,
    applyEconomicTermsAtThisLevel: true,
    waterfallAlgorithm: 'american',
    incomeFlowTarget: 'investors',
    managementFee: '2',
    performanceFee: '20',
    hurdleRate: '8',
    preferredReturn: '8',
    plannedInvestments: '10',
    calculatedIssuances: 10,
  })

  // Create Polibit Real Estate III (4 levels) - Now uses automatic creation!
  console.log('\n[createSampleHierarchies] Creating Polibit Real Estate III (4 levels)...')
  saveStructure({
    name: 'Polibit Real Estate III',
    type: 'fideicomiso',
    subtype: 'real-estate-trust',
    jurisdiction: 'Panama',
    totalCommitment: 50000000,
    currency: 'USD',
    investors: 80,
    status: 'active',
    hierarchyMode: true, // This triggers automatic multi-level creation!
    hierarchyLevel: 1,
    applyWaterfallAtThisLevel: true,
    applyEconomicTermsAtThisLevel: true,
    waterfallAlgorithm: 'american',
    incomeFlowTarget: 'investors',
    managementFee: '2',
    performanceFee: '20',
    hurdleRate: '8',
    preferredReturn: '8',
    plannedInvestments: '10',
    calculatedIssuances: 10,
  })

  console.log('\n[createSampleHierarchies] ✅ Sample hierarchies created successfully!')
  console.log('  - Polibit Real Estate II: 4 levels (automatic)')
  console.log('  - Polibit Real Estate III: 4 levels (automatic)')
  console.log('  - Investable levels: Level 1 and Level 2 (with economic terms & waterfall)')
  console.log('  - Operational levels: Level 3 and Level 4 (no investor participation)')
}

// NAV (Net Asset Value) Management Functions
export interface NavUpdate {
  date: string
  totalNav: number
  navPerShare?: number
  notes?: string
}

export function updateStructureNav(
  structureId: string,
  navData: { totalNav: number; navPerShare?: number; notes?: string }
): Structure | null {
  if (typeof window === 'undefined') {
    console.error('updateStructureNav: window is undefined')
    return null
  }

  const structures = getStructures()
  const index = structures.findIndex(s => s.id === structureId)

  if (index === -1) {
    console.error('updateStructureNav: Structure not found with ID:', structureId)
    console.log('Available structure IDs:', structures.map(s => s.id))
    return null
  }

  const structure = structures[index]

  // Initialize navHistory if it doesn't exist
  if (!structure.navHistory) {
    structure.navHistory = []
  }

  // Create new NAV entry
  const navEntry: NavUpdate = {
    date: new Date().toISOString(),
    totalNav: navData.totalNav,
    navPerShare: navData.navPerShare,
    notes: navData.notes
  }

  // Add to history
  structure.navHistory.push(navEntry)

  // Update current NAV
  structure.currentNav = navData.totalNav

  // Save to localStorage
  structures[index] = structure
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(structures))
    return structure
  } catch (error) {
    console.error('Error updating NAV:', error)
    return null
  }
}

export function getStructureNavHistory(structureId: string): NavUpdate[] {
  const structure = getStructureById(structureId)
  if (!structure) return []
  return structure.navHistory || []
}

export function deleteNavEntry(structureId: string, entryDate: string): boolean {
  if (typeof window === 'undefined') return false

  const structures = getStructures()
  const index = structures.findIndex(s => s.id === structureId)

  if (index === -1) return false

  const structure = structures[index]

  if (!structure.navHistory) return false

  // Filter out the entry with matching date
  const originalLength = structure.navHistory.length
  structure.navHistory = structure.navHistory.filter(entry => entry.date !== entryDate)

  if (structure.navHistory.length === originalLength) return false

  // Update currentNav to the latest entry, or undefined if no history
  if (structure.navHistory.length > 0) {
    const latestNav = structure.navHistory[structure.navHistory.length - 1]
    structure.currentNav = latestNav.totalNav
  } else {
    structure.currentNav = undefined
  }

  // Save to localStorage
  structures[index] = structure
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(structures))
    return true
  } catch (error) {
    console.error('Error deleting NAV entry:', error)
    return false
  }
}

export function clearStructures(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
