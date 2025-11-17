import type { Investor } from './types'

const STORAGE_KEY = 'polibit_investors'

// Get all investors from localStorage
export function getInvestors(): Investor[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const investors = JSON.parse(stored)
    // Parse dates back to Date objects
    return investors.map((inv: any) => ({
      ...inv,
      investorSince: inv.investorSince,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      k1DeliveryDate: inv.k1DeliveryDate || undefined,
      lastContactDate: inv.lastContactDate || undefined,
    }))
  } catch (error) {
    console.error('Error loading investors:', error)
    return []
  }
}

// Save a new investor
export function saveInvestor(investor: Omit<Investor, 'id' | 'createdAt' | 'updatedAt'>): Investor {
  const investors = getInvestors()

  const now = new Date().toISOString()

  // Generate unique ID with timestamp + random component to prevent collisions
  let newId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  // Ensure ID is truly unique
  while (investors.some(inv => inv.id === newId)) {
    newId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  // Auto-sync data from pre-registered investors if not already provided
  let finalCustomTerms = investor.customTerms

  // For new investors with fundOwnerships, check pre-registration for each structure
  const { getStructureById } = require('./structures-storage')

  // Check the first (or only) structure assignment for pre-registration data
  if (investor.fundOwnerships && investor.fundOwnerships.length > 0) {
    const firstOwnership = investor.fundOwnerships[0]
    const structure = getStructureById(firstOwnership.fundId)

    if (structure?.preRegisteredInvestors) {
      const preRegistered = structure.preRegisteredInvestors.find(
        pre => pre.email.toLowerCase() === investor.email.toLowerCase()
      )

      if (preRegistered) {
        // Sync custom terms
        if (preRegistered.customTerms && !finalCustomTerms) {
          finalCustomTerms = preRegistered.customTerms
          console.log(`Auto-synced custom terms for ${investor.email} from pre-registration`)
        }
      }
    }
  }

  const newInvestor: Investor = {
    ...investor,
    customTerms: finalCustomTerms,
    id: newId,
    createdAt: now,
    updatedAt: now,
  }

  investors.push(newInvestor)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investors))
  } catch (error) {
    console.error('Error saving investor:', error)
    throw error
  }

  return newInvestor
}

// Update an existing investor
export function updateInvestor(id: string, updates: Partial<Investor>): Investor | null {
  const investors = getInvestors()
  const index = investors.findIndex(inv => inv.id === id)

  if (index === -1) return null

  investors[index] = {
    ...investors[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investors))
  } catch (error) {
    console.error('Error updating investor:', error)
    throw error
  }

  return investors[index]
}

// Delete an investor
export function deleteInvestor(id: string): boolean {
  const investors = getInvestors()
  const filtered = investors.filter(inv => inv.id !== id)

  if (filtered.length === investors.length) return false

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting investor:', error)
    throw error
  }
}

// Get a single investor by ID
export function getInvestorById(id: string): Investor | null {
  const investors = getInvestors()
  return investors.find(inv => inv.id === id) || null
}

// Get investors by fund ID
export function getInvestorsByFundId(fundId: string): Investor[] {
  const investors = getInvestors()
  return investors.filter(inv =>
    inv.fundOwnerships && inv.fundOwnerships.some(fo => fo.fundId === fundId)
  )
}

// Check if investor exists by email
export function investorExistsByEmail(email: string): boolean {
  const investors = getInvestors()
  return investors.some(inv => inv.email.toLowerCase() === email.toLowerCase())
}

// Get investor by email
export function getInvestorByEmail(email: string): Investor | null {
  const investors = getInvestors()
  return investors.find(inv => inv.email.toLowerCase() === email.toLowerCase()) || null
}

// Sync custom terms from pre-registered investors to actual investors
export function syncCustomTermsFromPreRegistered(): { updated: number; investors: string[] } {
  if (typeof window === 'undefined') return { updated: 0, investors: [] }

  const { getStructures } = require('./structures-storage')
  const investors = getInvestors()
  const structures = getStructures()

  let updated = 0
  const updatedNames: string[] = []

  investors.forEach(investor => {
    // Check all structures this investor is invested in
    if (!investor.fundOwnerships || investor.fundOwnerships.length === 0) return

    // Check each structure for pre-registration data
    investor.fundOwnerships.forEach(ownership => {
      const structure = structures.find(s => s.id === ownership.fundId)
      if (!structure?.preRegisteredInvestors) return

      // Find matching pre-registered investor by email
      const preRegistered = structure.preRegisteredInvestors.find(
        pre => pre.email.toLowerCase() === investor.email.toLowerCase()
      )

      // If found and has custom terms, update the investor
      if (preRegistered?.customTerms && !investor.customTerms) {
        updateInvestor(investor.id, {
          customTerms: preRegistered.customTerms
        })
        updated++
        updatedNames.push(investor.name)
      }
    })
  })

  return { updated, investors: updatedNames }
}

// Get all investors across a hierarchy (including child structures)
export function getInvestorsByHierarchy(masterFundId: string): Array<{
  investor: Investor
  hierarchyLevel: number
  structureId: string
  structureName: string
  ownershipPercent: number
  commitment: number
}> {
  const { getStructures } = require('./structures-storage')
  const structures = getStructures()
  const investors = getInvestors()

  // Find the master structure
  const masterStructure = structures.find(s => s.id === masterFundId)
  if (!masterStructure) return []

  // Get all structures in this hierarchy
  const hierarchyStructures: any[] = []

  // Helper function to recursively find child structures
  const findChildren = (parentId: string) => {
    const children = structures.filter(s => s.parentStructureId === parentId)
    children.forEach(child => {
      hierarchyStructures.push(child)
      findChildren(child.id) // Recursively find grandchildren
    })
  }

  // Start with master
  hierarchyStructures.push(masterStructure)
  // Find all descendants
  findChildren(masterStructure.id)

  // Get all investors assigned to any structure in the hierarchy
  const result: Array<{
    investor: Investor
    hierarchyLevel: number
    structureId: string
    structureName: string
    ownershipPercent: number
    commitment: number
  }> = []

  hierarchyStructures.forEach(structure => {
    const structureInvestors = getInvestorsByFundId(structure.id)

    structureInvestors.forEach(investor => {
      const ownership = investor.fundOwnerships?.find(fo => fo.fundId === structure.id)
      if (ownership) {
        result.push({
          investor,
          hierarchyLevel: structure.hierarchyLevel,
          structureId: structure.id,
          structureName: structure.name,
          ownershipPercent: ownership.ownershipPercent,
          commitment: ownership.commitment
        })
      }
    })
  })

  // Sort by hierarchy level (Level 1 first, then Level 2, etc.)
  return result.sort((a, b) => a.hierarchyLevel - b.hierarchyLevel)
}

// Add a fund ownership to an investor (for subscription approval)
export function addFundOwnershipToInvestor(
  investorId: string,
  fundId: string,
  commitment: number
): Investor | null {
  const investor = getInvestorById(investorId)
  if (!investor) return null

  const { getStructureById } = require('./structures-storage')
  const structure = getStructureById(fundId)
  if (!structure) return null

  // Check if investor already owns this fund
  const hasExistingOwnership = investor.fundOwnerships?.some(fo => fo.fundId === fundId)
  if (hasExistingOwnership) {
    // Update existing ownership instead
    const updated = investor.fundOwnerships!.map(fo => {
      if (fo.fundId === fundId) {
        return {
          ...fo,
          commitment: fo.commitment + commitment,
          uncalledCapital: (fo.uncalledCapital || 0) + commitment,
        }
      }
      return fo
    })
    return updateInvestor(investorId, { fundOwnerships: updated })
  }

  // Create new fund ownership
  const newOwnership = {
    fundId,
    fundName: structure.name,
    commitment,
    ownershipPercent: 0, // Will be calculated by admin
    calledCapital: 0,
    uncalledCapital: commitment,
    investedDate: new Date().toISOString(),
  }

  const updatedOwnerships = [
    ...(investor.fundOwnerships || []),
    newOwnership
  ]

  return updateInvestor(investorId, { fundOwnerships: updatedOwnerships })
}

// MIGRATION UTILITY: Convert old fundOwnership (singular) to fundOwnerships (array)
export function migrateInvestorsToMultipleOwnerships(): { migrated: number; skipped: number } {
  if (typeof window === 'undefined') {
    return { migrated: 0, skipped: 0 }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { migrated: 0, skipped: 0 }

    const investors = JSON.parse(stored)
    let migrated = 0
    let skipped = 0

    const { getStructureById } = require('./structures-storage')

    const migratedInvestors = investors.map((inv: any) => {
      // Check if already migrated (has fundOwnerships array)
      if (inv.fundOwnerships && Array.isArray(inv.fundOwnerships)) {
        skipped++
        return inv
      }

      // Check if has old fundOwnership (singular)
      if (inv.fundOwnership && typeof inv.fundOwnership === 'object') {
        const structure = getStructureById(inv.fundOwnership.fundId)

        migrated++
        return {
          ...inv,
          fundOwnerships: [{
            fundId: inv.fundOwnership.fundId,
            fundName: structure?.name || 'Unknown Structure',
            commitment: inv.fundOwnership.commitment || 0,
            ownershipPercent: inv.fundOwnership.ownershipPercent || 0,
            calledCapital: inv.fundOwnership.calledCapital || 0,
            uncalledCapital: inv.fundOwnership.uncalledCapital || 0,
            hierarchyLevel: inv.hierarchyLevel,
            investedDate: inv.investorSince || inv.createdAt || new Date().toISOString()
          }]
          // Keep old fundOwnership temporarily for debugging (can be removed later)
        }
      }

      // No migration needed - might be corrupted data
      console.warn(`[Migration] Investor ${inv.id} has no fundOwnership data`)
      skipped++
      return inv
    })

    localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedInvestors))
    console.log(`[Migration] Migrated ${migrated} investors, skipped ${skipped}`)

    return { migrated, skipped }
  } catch (error) {
    console.error('Error migrating investors:', error)
    throw error
  }
}

export function clearInvestors(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
