/**
 * Utility to clean up orphaned structures from localStorage
 *
 * Orphaned structures are structures that exist in localStorage but not in the backend API.
 * This can happen when structure creation fails during API calls after localStorage save.
 */

import { getStructures, deleteStructure } from './structures-storage'
import { getApiUrl } from './api-config'
import { getAuthState } from './auth-storage'

export interface CleanupResult {
  totalStructures: number
  orphanedStructures: string[]
  deletedStructures: string[]
  errors: string[]
}

/**
 * Find and delete orphaned structures
 * @param dryRun - If true, only reports orphaned structures without deleting
 * @returns Cleanup result with details of what was found and deleted
 */
export async function cleanupOrphanedStructures(dryRun: boolean = false): Promise<CleanupResult> {
  const result: CleanupResult = {
    totalStructures: 0,
    orphanedStructures: [],
    deletedStructures: [],
    errors: []
  }

  try {
    // Get all structures from localStorage
    const localStructures = getStructures()
    result.totalStructures = localStructures.length

    console.log(`[Cleanup] Found ${localStructures.length} structures in localStorage`)

    // Get auth token
    const authState = getAuthState()
    const authToken = authState.token || ''

    if (!authToken) {
      result.errors.push('No authentication token found. Cannot verify structures with API.')
      return result
    }

    // Check each structure against the API
    for (const structure of localStructures) {
      try {
        const response = await fetch(`${getApiUrl()}/api/structures/${structure.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.status === 404) {
          // Structure doesn't exist in API - it's orphaned
          console.log(`[Cleanup] Found orphaned structure: ${structure.name} (${structure.id})`)
          result.orphanedStructures.push(structure.id)

          if (!dryRun) {
            // Delete from localStorage
            const deleted = await deleteStructure(structure.id)
            if (deleted) {
              result.deletedStructures.push(structure.id)
              console.log(`[Cleanup] Deleted orphaned structure: ${structure.name} (${structure.id})`)
            } else {
              result.errors.push(`Failed to delete structure: ${structure.name} (${structure.id})`)
            }
          }
        } else if (!response.ok) {
          // Other error - log but don't delete
          console.warn(`[Cleanup] Error checking structure ${structure.id}: ${response.status}`)
          result.errors.push(`Error checking structure ${structure.id}: ${response.status}`)
        } else {
          console.log(`[Cleanup] Structure exists in API: ${structure.name} (${structure.id})`)
        }
      } catch (error) {
        console.error(`[Cleanup] Error checking structure ${structure.id}:`, error)
        result.errors.push(`Error checking structure ${structure.id}: ${error}`)
      }
    }

    console.log(`[Cleanup] Summary:`)
    console.log(`  - Total structures: ${result.totalStructures}`)
    console.log(`  - Orphaned structures: ${result.orphanedStructures.length}`)
    console.log(`  - Deleted structures: ${result.deletedStructures.length}`)
    console.log(`  - Errors: ${result.errors.length}`)

  } catch (error) {
    console.error('[Cleanup] Fatal error during cleanup:', error)
    result.errors.push(`Fatal error: ${error}`)
  }

  return result
}

/**
 * Browser console helper - run this in the console to clean up orphaned structures
 *
 * Usage:
 *   1. Dry run (see what would be deleted): window.cleanupStructures(true)
 *   2. Actually delete: window.cleanupStructures(false)
 */
if (typeof window !== 'undefined') {
  (window as any).cleanupStructures = async (dryRun: boolean = true) => {
    console.log(`[Cleanup] Starting cleanup (dryRun: ${dryRun})...`)
    const result = await cleanupOrphanedStructures(dryRun)

    console.log('\n=== CLEANUP RESULTS ===')
    console.log(`Total structures in localStorage: ${result.totalStructures}`)
    console.log(`Orphaned structures found: ${result.orphanedStructures.length}`)
    if (result.orphanedStructures.length > 0) {
      console.log('Orphaned structure IDs:', result.orphanedStructures)
    }

    if (dryRun) {
      console.log('\nThis was a DRY RUN. No structures were deleted.')
      console.log('To actually delete these structures, run: window.cleanupStructures(false)')
    } else {
      console.log(`\nDeleted structures: ${result.deletedStructures.length}`)
      if (result.deletedStructures.length > 0) {
        console.log('Deleted structure IDs:', result.deletedStructures)
      }
    }

    if (result.errors.length > 0) {
      console.log('\nErrors encountered:')
      result.errors.forEach(err => console.error('  -', err))
    }

    return result
  }
}
