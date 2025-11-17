import type { Investment } from './types'

const STORAGE_KEY = 'polibit_investments'

// Get all investments from localStorage
export function getInvestments(): Investment[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const investments = JSON.parse(stored)
    return investments
  } catch (error) {
    console.error('Error loading investments:', error)
    return []
  }
}

// Save a new investment
export function saveInvestment(investment: Omit<Investment, 'id'>): Investment {
  const investments = getInvestments()

  // Generate unique ID with timestamp + random component to prevent collisions
  let newId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Ensure ID is truly unique
  while (investments.some(inv => inv.id === newId)) {
    newId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const newInvestment: Investment = {
    ...investment,
    id: newId,
  }

  investments.push(newInvestment)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investments))
  } catch (error) {
    console.error('Error saving investment:', error)
    throw error
  }

  return newInvestment
}

// Update an existing investment
export function updateInvestment(id: string, updates: Partial<Investment>): Investment | null {
  const investments = getInvestments()
  const index = investments.findIndex(inv => inv.id === id)

  if (index === -1) return null

  investments[index] = { ...investments[index], ...updates }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investments))
  } catch (error) {
    console.error('Error updating investment:', error)
    throw error
  }

  return investments[index]
}

// Delete an investment
export function deleteInvestment(id: string): boolean {
  const investments = getInvestments()
  const filtered = investments.filter(inv => inv.id !== id)

  if (filtered.length === investments.length) return false

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting investment:', error)
    throw error
  }
}

// Get a single investment by ID
export function getInvestmentById(id: string): Investment | null {
  const investments = getInvestments()
  return investments.find(inv => inv.id === id) || null
}

// Get investments by fund ID (includes both static and dynamic)
export function getInvestmentsByFundId(fundId: string): Investment[] {
  if (typeof window === 'undefined') return []

  try {
    // Load static investments from JSON
    const investmentsData = require('@/data/investments.json')
    const staticInvestments = investmentsData as Investment[]

    // Load dynamic investments from localStorage
    const dynamicInvestments = getInvestments()

    // Merge both sources
    const allInvestments = [...staticInvestments, ...dynamicInvestments]

    // Filter by fundId
    return allInvestments.filter(inv => inv.fundId === fundId)
  } catch (error) {
    console.error('Error loading investments by fund ID:', error)
    return []
  }
}

export function clearInvestments(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
