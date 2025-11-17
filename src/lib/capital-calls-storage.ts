import type { CapitalCall, CapitalCallStatus } from './types'

// Re-export types for convenience
export type { CapitalCall, CapitalCallStatus }

const STORAGE_KEY = 'polibit_capital_calls'

// Get all capital calls from localStorage
export function getCapitalCalls(): CapitalCall[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading capital calls:', error)
    return []
  }
}

// Save a new capital call
export function saveCapitalCall(capitalCall: Omit<CapitalCall, 'id' | 'createdAt' | 'updatedAt'>): CapitalCall {
  const capitalCalls = getCapitalCalls()

  const now = new Date().toISOString()
  const newId = `cc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  // Ensure ID is unique
  let finalId = newId
  while (capitalCalls.some(cc => cc.id === finalId)) {
    finalId = `cc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  const newCapitalCall: CapitalCall = {
    ...capitalCall,
    id: finalId,
    createdAt: now,
    updatedAt: now,
  }

  capitalCalls.push(newCapitalCall)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capitalCalls))
  } catch (error) {
    console.error('Error saving capital call:', error)
    throw error
  }

  return newCapitalCall
}

// Update an existing capital call
export function updateCapitalCall(id: string, updates: Partial<CapitalCall>): CapitalCall | null {
  const capitalCalls = getCapitalCalls()
  const index = capitalCalls.findIndex(cc => cc.id === id)

  if (index === -1) return null

  capitalCalls[index] = {
    ...capitalCalls[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capitalCalls))
  } catch (error) {
    console.error('Error updating capital call:', error)
    throw error
  }

  return capitalCalls[index]
}

// Delete a capital call
export function deleteCapitalCall(id: string): boolean {
  const capitalCalls = getCapitalCalls()
  const filtered = capitalCalls.filter(cc => cc.id !== id)

  if (filtered.length === capitalCalls.length) return false

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting capital call:', error)
    throw error
  }
}

// Get a single capital call by ID
export function getCapitalCallById(id: string): CapitalCall | null {
  const capitalCalls = getCapitalCalls()
  return capitalCalls.find(cc => cc.id === id) || null
}

// Get capital calls by fund ID
export function getCapitalCallsByFundId(fundId: string): CapitalCall[] {
  const capitalCalls = getCapitalCalls()
  return capitalCalls.filter(cc => cc.fundId === fundId)
}

// Get capital calls by status
export function getCapitalCallsByStatus(status: CapitalCallStatus): CapitalCall[] {
  const capitalCalls = getCapitalCalls()
  return capitalCalls.filter(cc => cc.status === status)
}

// Get next call number for a fund
export function getNextCallNumber(fundId: string): number {
  const fundCalls = getCapitalCallsByFundId(fundId)
  if (fundCalls.length === 0) return 1

  const maxCallNumber = Math.max(...fundCalls.map(cc => cc.callNumber))
  return maxCallNumber + 1
}

// Update payment status for an investor allocation
export function updateInvestorPayment(
  capitalCallId: string,
  investorId: string,
  amountPaid: number,
  paymentDetails?: {
    paymentMethod?: string
    transactionReference?: string
    bankDetails?: string
  }
): CapitalCall | null {
  const capitalCall = getCapitalCallById(capitalCallId)
  if (!capitalCall) return null

  const allocationIndex = capitalCall.investorAllocations.findIndex(
    alloc => alloc.investorId === investorId
  )

  if (allocationIndex === -1) return null

  const allocation = capitalCall.investorAllocations[allocationIndex]
  const newAmountPaid = allocation.amountPaid + amountPaid
  const newAmountOutstanding = allocation.callAmount - newAmountPaid

  capitalCall.investorAllocations[allocationIndex] = {
    ...allocation,
    amountPaid: newAmountPaid,
    amountOutstanding: newAmountOutstanding,
    status: newAmountOutstanding === 0 ? 'Paid' : newAmountPaid > 0 ? 'Partial' : 'Pending',
    paidDate: newAmountOutstanding === 0 ? new Date().toISOString() : allocation.paidDate,
    ...paymentDetails
  }

  // Update call-level totals
  const totalPaid = capitalCall.investorAllocations.reduce((sum, alloc) => sum + alloc.amountPaid, 0)
  const totalOutstanding = capitalCall.totalCallAmount - totalPaid

  // Update call status
  let newStatus: CapitalCallStatus = capitalCall.status
  if (totalOutstanding === 0) {
    newStatus = 'Fully Paid'
  } else if (totalPaid > 0) {
    newStatus = 'Partially Paid'
  }

  return updateCapitalCall(capitalCallId, {
    investorAllocations: capitalCall.investorAllocations,
    totalPaidAmount: totalPaid,
    totalOutstandingAmount: totalOutstanding,
    status: newStatus
  })
}

// Mark capital call as sent
export function markCapitalCallAsSent(capitalCallId: string): CapitalCall | null {
  return updateCapitalCall(capitalCallId, {
    status: 'Sent',
    sentDate: new Date().toISOString()
  })
}

// Cancel capital call
export function cancelCapitalCall(capitalCallId: string, reason: string): CapitalCall | null {
  return updateCapitalCall(capitalCallId, {
    status: 'Cancelled',
    cancelledDate: new Date().toISOString(),
    cancelledReason: reason
  })
}

// Get overdue capital calls
export function getOverdueCapitalCalls(): CapitalCall[] {
  const capitalCalls = getCapitalCalls()
  const now = new Date()

  return capitalCalls.filter(cc => {
    if (cc.status === 'Fully Paid' || cc.status === 'Cancelled') return false
    const dueDate = new Date(cc.dueDate)
    return dueDate < now
  })
}

// Get summary statistics
export function getCapitalCallSummary() {
  const capitalCalls = getCapitalCalls()

  return {
    total: capitalCalls.length,
    draft: capitalCalls.filter(cc => cc.status === 'Draft').length,
    sent: capitalCalls.filter(cc => cc.status === 'Sent').length,
    partiallyPaid: capitalCalls.filter(cc => cc.status === 'Partially Paid').length,
    fullyPaid: capitalCalls.filter(cc => cc.status === 'Fully Paid').length,
    overdue: getOverdueCapitalCalls().length,
    totalCallAmount: capitalCalls.reduce((sum, cc) => sum + cc.totalCallAmount, 0),
    totalPaidAmount: capitalCalls.reduce((sum, cc) => sum + cc.totalPaidAmount, 0),
    totalOutstandingAmount: capitalCalls.reduce((sum, cc) => sum + cc.totalOutstandingAmount, 0)
  }
}
