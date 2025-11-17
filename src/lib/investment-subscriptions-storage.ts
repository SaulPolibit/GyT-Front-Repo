import { InvestmentSubscription } from './types'

const STORAGE_KEY = 'polibit_investment_subscriptions'

/**
 * Get all investment subscriptions
 */
export function getInvestmentSubscriptions(): InvestmentSubscription[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

/**
 * Get subscription by ID
 */
export function getInvestmentSubscriptionById(
  id: string
): InvestmentSubscription | null {
  const subscriptions = getInvestmentSubscriptions()
  return subscriptions.find((s) => s.id === id) || null
}

/**
 * Get subscriptions by investor ID
 */
export function getInvestmentSubscriptionsByInvestor(
  investorId: string
): InvestmentSubscription[] {
  const subscriptions = getInvestmentSubscriptions()
  return subscriptions.filter((s) => s.investorId === investorId)
}

/**
 * Get subscriptions by fund ID
 */
export function getInvestmentSubscriptionsByFund(
  fundId: string
): InvestmentSubscription[] {
  const subscriptions = getInvestmentSubscriptions()
  return subscriptions.filter((s) => s.fundId === fundId)
}

/**
 * Get subscriptions by investment ID
 */
export function getInvestmentSubscriptionsByInvestment(
  investmentId: string
): InvestmentSubscription[] {
  const subscriptions = getInvestmentSubscriptions()
  return subscriptions.filter((s) => s.investmentId === investmentId)
}

/**
 * Get pending subscriptions (for admin approval)
 */
export function getPendingInvestmentSubscriptions(): InvestmentSubscription[] {
  const subscriptions = getInvestmentSubscriptions()
  return subscriptions.filter((s) => s.status === 'pending')
}

/**
 * Create a new investment subscription
 */
export function createInvestmentSubscription(
  subscription: Omit<InvestmentSubscription, 'id' | 'createdAt' | 'submittedAt'>
): InvestmentSubscription {
  const subscriptions = getInvestmentSubscriptions()

  const newSubscription: InvestmentSubscription = {
    ...subscription,
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  }

  subscriptions.push(newSubscription)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
  return newSubscription
}

/**
 * Update investment subscription status
 */
export function updateInvestmentSubscriptionStatus(
  id: string,
  status: InvestmentSubscription['status'],
  approvalReason?: string,
  adminNotes?: string
): InvestmentSubscription | null {
  const subscriptions = getInvestmentSubscriptions()
  const index = subscriptions.findIndex((s) => s.id === id)

  if (index === -1) return null

  const updated = { ...subscriptions[index], status, approvalReason, adminNotes }

  if (status === 'approved') {
    updated.approvedAt = new Date().toISOString()
  } else if (status === 'rejected') {
    updated.rejectedAt = new Date().toISOString()
  }

  subscriptions[index] = updated
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
  return updated
}

/**
 * Mark subscription as having linked fund ownership
 */
export function markSubscriptionLinked(
  id: string
): InvestmentSubscription | null {
  const subscriptions = getInvestmentSubscriptions()
  const index = subscriptions.findIndex((s) => s.id === id)

  if (index === -1) return null

  subscriptions[index].linkedFundOwnershipCreated = true
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
  return subscriptions[index]
}

/**
 * Delete investment subscription
 */
export function deleteInvestmentSubscription(id: string): boolean {
  const subscriptions = getInvestmentSubscriptions()
  const filtered = subscriptions.filter((s) => s.id !== id)

  if (filtered.length === subscriptions.length) return false

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

/**
 * Clear all investment subscriptions (for testing)
 */
export function clearInvestmentSubscriptions(): void {
  localStorage.removeItem(STORAGE_KEY)
}
