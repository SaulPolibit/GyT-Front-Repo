'use client'

/**
 * NeoPay Hook
 * Handles payment processing with NeoPay gateway
 */
import { useState, useCallback } from 'react'
import { useAuthFetch } from './useAuthFetch'

interface CardInfo {
  cardNumber: string
  cardExpiration: string // YYMM format
  cvv: string
  cardHolderName: string
}

interface BillingInfo {
  firstName: string
  lastName: string
  company?: string
  addressOne: string
  addressTwo?: string
  locality: string
  administrativeArea: string
  postalCode: string
  country: string
  email: string
  phoneNumber: string
}

interface ChargeParams {
  amount: number
  card: CardInfo
  structureId?: string
  investmentId?: string
  orderInfo?: string
  additionalData?: string
}

interface Charge3DSParams extends ChargeParams {
  billingInfo: BillingInfo
  urlCommerce: string
}

interface Secure3DData {
  referenceId: string
  accessToken: string
  deviceDataCollectionUrl: string
}

interface ChargeResult {
  success: boolean
  transactionId?: string
  authorizationCode?: string
  referenceNumber?: string
  amountApproved?: number
  isPartialApproval?: boolean
  error?: string
  // For 3DS
  nextStep?: number
  secure3d?: Secure3DData
  needsAdditionalAuth?: boolean
}

interface VoucherData {
  paymentMethod: string
  date: string
  time: string
  amount: number
  currency: string
  cardHolderName: string
  cardNumber: string
  cardType: string
  referenceNumber: string
  authorizationCode: string
  affiliation: string
  auditNumber: string
  transactionType: string
  legend: string
  status: string
}

interface Transaction {
  id: string
  userId: string
  structureId?: string
  investmentId?: string
  systemsTraceNo: string
  messageTypeId: string
  processingCode: string
  cardType?: string
  cardLastFour?: string
  cardHolderName?: string
  amountRequested: number
  amountApproved?: number
  currency: string
  typeOperation?: number
  responseCode?: string
  responseMessage?: string
  authIdResponse?: string
  retrievalRefNo?: string
  status: string
  is3dSecure: boolean
  secure3dStep?: number
  createdAt: string
  updatedAt: string
}

interface UseNeoPayReturn {
  isLoading: boolean
  error: string | null
  // Simple charge
  charge: (params: ChargeParams) => Promise<ChargeResult>
  // 3D Secure
  charge3DS: (params: Charge3DSParams) => Promise<ChargeResult>
  continue3DS_Step3: (transactionId: string, referenceId: string) => Promise<ChargeResult>
  continue3DS_Step5: (transactionId: string, referenceId: string) => Promise<ChargeResult>
  // Void
  voidTransaction: (transactionId: string, reason?: string) => Promise<ChargeResult>
  // Utilities
  getVoucher: (transactionId: string) => Promise<VoucherData | null>
  getTransactions: (options?: { status?: string; limit?: number }) => Promise<Transaction[]>
  getTransaction: (transactionId: string) => Promise<Transaction | null>
  getStats: (options?: { dateFrom?: string; dateTo?: string }) => Promise<any>
  checkHealth: () => Promise<{ service: string; status: string; environment: string; configured: boolean }>
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'

export function useNeoPay(): UseNeoPayReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { authFetch } = useAuthFetch()

  /**
   * Process simple charge (without 3D Secure)
   */
  const charge = useCallback(async (params: ChargeParams): Promise<ChargeResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await authFetch<any>(`${API_BASE}/api/neopay/charge`, {
        method: 'POST',
        body: JSON.stringify({
          amount: params.amount,
          cardNumber: params.card.cardNumber.replace(/\s/g, ''),
          cardExpiration: params.card.cardExpiration,
          cvv: params.card.cvv,
          cardHolderName: params.card.cardHolderName,
          structureId: params.structureId,
          investmentId: params.investmentId,
          orderInfo: params.orderInfo,
          additionalData: params.additionalData,
        }),
      })

      if (fetchError) {
        setError(fetchError)
        return { success: false, error: fetchError }
      }

      return {
        success: data?.success ?? false,
        transactionId: data?.data?.transactionId,
        authorizationCode: data?.data?.authorizationCode,
        referenceNumber: data?.data?.referenceNumber,
        amountApproved: data?.data?.amountApproved,
        isPartialApproval: data?.data?.isPartialApproval,
        error: data?.error,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [authFetch])

  /**
   * Start 3D Secure payment (Step 1)
   */
  const charge3DS = useCallback(async (params: Charge3DSParams): Promise<ChargeResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await authFetch<any>(`${API_BASE}/api/neopay/charge-3ds`, {
        method: 'POST',
        body: JSON.stringify({
          amount: params.amount,
          cardNumber: params.card.cardNumber.replace(/\s/g, ''),
          cardExpiration: params.card.cardExpiration,
          cvv: params.card.cvv,
          cardHolderName: params.card.cardHolderName,
          billingInfo: params.billingInfo,
          urlCommerce: params.urlCommerce,
          structureId: params.structureId,
          investmentId: params.investmentId,
          orderInfo: params.orderInfo,
          additionalData: params.additionalData,
        }),
      })

      if (fetchError) {
        setError(fetchError)
        return { success: false, error: fetchError }
      }

      return {
        success: data?.success ?? false,
        transactionId: data?.data?.transactionId,
        nextStep: data?.data?.nextStep,
        secure3d: data?.data?.secure3d,
        error: data?.error,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [authFetch])

  /**
   * Continue 3D Secure (Step 3 - after iFrame)
   */
  const continue3DS_Step3 = useCallback(async (
    transactionId: string,
    referenceId: string
  ): Promise<ChargeResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await authFetch<any>(`${API_BASE}/api/neopay/charge-3ds/step3`, {
        method: 'POST',
        body: JSON.stringify({ transactionId, referenceId }),
      })

      if (fetchError) {
        setError(fetchError)
        return { success: false, error: fetchError }
      }

      return {
        success: data?.success ?? false,
        transactionId: data?.data?.transactionId,
        authorizationCode: data?.data?.authorizationCode,
        referenceNumber: data?.data?.referenceNumber,
        amountApproved: data?.data?.amountApproved,
        isPartialApproval: data?.data?.isPartialApproval,
        nextStep: data?.data?.nextStep,
        secure3d: data?.data?.secure3d,
        needsAdditionalAuth: !!data?.data?.nextStep,
        error: data?.error,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [authFetch])

  /**
   * Finalize 3D Secure (Step 5 - after PIN)
   */
  const continue3DS_Step5 = useCallback(async (
    transactionId: string,
    referenceId: string
  ): Promise<ChargeResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await authFetch<any>(`${API_BASE}/api/neopay/charge-3ds/step5`, {
        method: 'POST',
        body: JSON.stringify({ transactionId, referenceId }),
      })

      if (fetchError) {
        setError(fetchError)
        return { success: false, error: fetchError }
      }

      return {
        success: data?.success ?? false,
        transactionId: data?.data?.transactionId,
        authorizationCode: data?.data?.authorizationCode,
        referenceNumber: data?.data?.referenceNumber,
        amountApproved: data?.data?.amountApproved,
        isPartialApproval: data?.data?.isPartialApproval,
        error: data?.error,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [authFetch])

  /**
   * Void a transaction
   */
  const voidTransaction = useCallback(async (
    transactionId: string,
    reason?: string
  ): Promise<ChargeResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await authFetch<any>(`${API_BASE}/api/neopay/void`, {
        method: 'POST',
        body: JSON.stringify({ transactionId, reason }),
      })

      if (fetchError) {
        setError(fetchError)
        return { success: false, error: fetchError }
      }

      return {
        success: data?.success ?? false,
        transactionId: data?.data?.voidTransactionId,
        authorizationCode: data?.data?.authorizationCode,
        referenceNumber: data?.data?.referenceNumber,
        error: data?.error,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [authFetch])

  /**
   * Get voucher for transaction
   */
  const getVoucher = useCallback(async (transactionId: string): Promise<VoucherData | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await authFetch<any>(
        `${API_BASE}/api/neopay/transactions/${transactionId}/voucher`
      )

      if (fetchError) {
        setError(fetchError)
        return null
      }

      return data?.data ?? null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [authFetch])

  /**
   * Get transaction history
   */
  const getTransactions = useCallback(async (
    options: { status?: string; limit?: number } = {}
  ): Promise<Transaction[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.status) params.set('status', options.status)
      if (options.limit) params.set('limit', options.limit.toString())

      const { data, error: fetchError } = await authFetch<any>(
        `${API_BASE}/api/neopay/transactions?${params.toString()}`
      )

      if (fetchError) {
        setError(fetchError)
        return []
      }

      return data?.data ?? []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [authFetch])

  /**
   * Get single transaction
   */
  const getTransaction = useCallback(async (transactionId: string): Promise<Transaction | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await authFetch<any>(
        `${API_BASE}/api/neopay/transactions/${transactionId}`
      )

      if (fetchError) {
        setError(fetchError)
        return null
      }

      return data?.data ?? null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [authFetch])

  /**
   * Get transaction statistics
   */
  const getStats = useCallback(async (
    options: { dateFrom?: string; dateTo?: string } = {}
  ): Promise<any> => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.dateFrom) params.set('dateFrom', options.dateFrom)
      if (options.dateTo) params.set('dateTo', options.dateTo)

      const { data, error: fetchError } = await authFetch<any>(
        `${API_BASE}/api/neopay/stats?${params.toString()}`
      )

      if (fetchError) {
        setError(fetchError)
        return null
      }

      return data?.data ?? null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [authFetch])

  /**
   * Check service health (no auth required)
   */
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/neopay/health`)
      return await response.json()
    } catch (err) {
      return { service: 'NeoPay', status: 'error', environment: 'unknown', configured: false }
    }
  }, [])

  return {
    isLoading,
    error,
    charge,
    charge3DS,
    continue3DS_Step3,
    continue3DS_Step5,
    voidTransaction,
    getVoucher,
    getTransactions,
    getTransaction,
    getStats,
    checkHealth,
  }
}
