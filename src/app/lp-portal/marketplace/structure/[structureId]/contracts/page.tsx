'use client'

import { useState, useEffect, use, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IconCheck, IconAlertCircle, IconFileText, IconChevronRight, IconLoader2 } from '@tabler/icons-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { getAuthToken, logout } from '@/lib/auth-storage'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "docuseal-form": any
    }
  }
}

interface ContractAssignment {
  id: string
  templateId: string
  templateName: string
  docusealUrl: string
  required: boolean
  blocking: boolean
  signed: boolean
}

interface ContractsPageProps {
  params: Promise<{ structureId: string }>
}

interface CreditCheckResult {
  allowed: boolean
  cost: number
  balance: number
  model: string | null
  tier?: string
  message?: string
}

export default function ContractsPage({ params }: ContractsPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedParams = use(params)
  const structureId = resolvedParams.structureId

  const [contracts, setContracts] = useState<ContractAssignment[]>([])
  const [currentContractIndex, setCurrentContractIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [structure, setStructure] = useState<any>(null)
  const [useLegacyFlow, setUseLegacyFlow] = useState(false)
  const [legacySigned, setLegacySigned] = useState(false)
  const [signedContractIds, setSignedContractIds] = useState<Set<string>>(new Set())
  const [creditsChecked, setCreditsChecked] = useState(false)
  const [creditsDeducted, setCreditsDeducted] = useState(false)
  const [creditError, setCreditError] = useState<string | null>(null)
  const [creditInfo, setCreditInfo] = useState<CreditCheckResult | null>(null)

  const tokens = searchParams.get('tokens') || ''
  const email = searchParams.get('email') || ''
  const amount = searchParams.get('amount') || ''

  const DEFAULT_DOCUSEAL_TEMPLATE = 'https://docuseal.com/d/aMG1nBCP9Vn7Uh'

  // Determine which template URL to use for legacy flow
  const currentTemplateUrl = useMemo(() => {
    if (useLegacyFlow) {
      // Check if tax jurisdiction is Mexico to determine template priority
      const isMexico = structure?.jurisdiction?.toLowerCase() === 'mexico' ||
                       structure?.jurisdiction?.toLowerCase() === 'méxico' ||
                       structure?.taxJurisdiction?.toLowerCase() === 'mexico' ||
                       structure?.taxJurisdiction?.toLowerCase() === 'méxico'

      if (isMexico) {
        // For Mexico, prioritize national template
        return structure?.contractTemplateUrlNational ||
               structure?.contractTemplateUrlInternational ||
               DEFAULT_DOCUSEAL_TEMPLATE
      } else {
        // For international, prioritize international template
        return structure?.contractTemplateUrlInternational ||
               structure?.contractTemplateUrlNational ||
               DEFAULT_DOCUSEAL_TEMPLATE
      }
    }
    return contracts[currentContractIndex]?.docusealUrl || ''
  }, [useLegacyFlow, currentContractIndex, contracts, structure])

  const hasTemplateError = !currentTemplateUrl || currentTemplateUrl.trim() === ''

  const allContractsSigned = useMemo(() => {
    if (useLegacyFlow) return legacySigned
    return contracts.every((c, idx) => signedContractIds.has(c.id) || idx !== currentContractIndex)
  }, [useLegacyFlow, legacySigned, contracts, signedContractIds, currentContractIndex])

  // Check credits on mount
  useEffect(() => {
    const checkCredits = async () => {
      try {
        const token = getAuthToken()
        if (!token) {
          setCreditsChecked(true)
          return
        }

        const response = await fetch(getApiUrl(API_CONFIG.endpoints.checkSigningCredits), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        const data: CreditCheckResult = await response.json()

        console.log('[Contracts] Credit check result:', data)
        setCreditInfo(data)

        if (!data.allowed) {
          setCreditError(data.message || 'Insufficient credits for document signing')
        }

        setCreditsChecked(true)
      } catch (error) {
        console.error('[Contracts] Error checking credits:', error)
        setCreditsChecked(true) // Allow to proceed if check fails
      }
    }

    checkCredits()
  }, [])

  // Deduct credits when DocuSeal form is loaded
  const deductCredits = async () => {
    if (creditsDeducted) return true // Already deducted

    try {
      const token = getAuthToken()
      if (!token) return false

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.deductSigningCredits), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()

      console.log('[Contracts] Credit deduction result:', data)

      if (data.success && data.deducted) {
        setCreditsDeducted(true)
        console.log(`[Contracts] Deducted $${(data.cost / 100).toFixed(2)} for document signing. New balance: $${(data.newBalance / 100).toFixed(2)}`)
        return true
      } else if (data.success && !data.deducted) {
        // No PAYG subscription, allow to proceed
        setCreditsDeducted(true)
        return true
      } else {
        setCreditError(data.message || 'Failed to deduct credits')
        return false
      }
    } catch (error) {
      console.error('[Contracts] Error deducting credits:', error)
      return false
    }
  }

  const isCurrentSigned = useMemo(() => {
    if (useLegacyFlow) return legacySigned
    const current = contracts[currentContractIndex]
    return current ? signedContractIds.has(current.id) : false
  }, [useLegacyFlow, legacySigned, contracts, currentContractIndex, signedContractIds])

  // Load DocuSeal script and deduct credits
  useEffect(() => {
    const loadFormAndDeductCredits = async () => {
      // Wait for credit check to complete
      if (!creditsChecked) return

      // Don't load if there's a credit error
      if (creditError) return

      // Deduct credits before loading the form (for PAYG model)
      if (!creditsDeducted && creditInfo?.model === 'payg') {
        const success = await deductCredits()
        if (!success) {
          console.log('[Contracts] Credit deduction failed, not loading form')
          return
        }
      }

      // Check if script is already loaded
      if (document.querySelector('script[src="https://cdn.docuseal.com/js/form.js"]')) {
        console.log('[Contracts] DocuSeal script already loaded')
        return
      }

      const script = document.createElement("script")
      script.src = "https://cdn.docuseal.com/js/form.js"
      script.async = true
      script.onload = () => {
        console.log('[Contracts] DocuSeal script loaded successfully')
      }
      script.onerror = () => {
        console.error('[Contracts] Failed to load DocuSeal script')
      }
      document.head.appendChild(script)
    }

    loadFormAndDeductCredits()
  }, [creditsChecked, creditError, creditsDeducted, creditInfo])

  // Listen for DocuSeal completion events
  useEffect(() => {
    if (loading || !structure) return

    let formElement: Element | null = null
    let intervalId: ReturnType<typeof setInterval> | null = null

    const onCompleted = () => {
      if (useLegacyFlow) {
        setLegacySigned(true)
        toast.success('Contract signed successfully')
      } else {
        const current = contracts[currentContractIndex]
        if (current) {
          setSignedContractIds(prev => new Set(prev).add(current.id))
          toast.success(`${current.templateName} signed successfully`)
        }
      }
    }

    const attachListener = () => {
      formElement = document.querySelector('docuseal-form')
      if (formElement) {
        formElement.addEventListener('completed', onCompleted)
        formElement.addEventListener('complete', onCompleted)
        if (intervalId) clearInterval(intervalId)
        return true
      }
      return false
    }

    if (!attachListener()) {
      intervalId = setInterval(attachListener, 500)
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin && event.origin.includes("docuseal")) {
        const d = event.data
        if (d?.status === "completed" || d?.type === "completed" ||
            d?.completed || d?.submission_completed || d?.event === "completed" ||
            (typeof d === "string" && d.includes("completed"))) {
          onCompleted()
        }
      }
    }

    window.addEventListener("message", handleMessage, false)

    // Expose manual trigger for testing
    ;(window as any).markAsSigned = () => onCompleted()

    return () => {
      if (intervalId) clearInterval(intervalId)
      if (formElement) {
        formElement.removeEventListener('completed', onCompleted)
        formElement.removeEventListener('complete', onCompleted)
      }
      window.removeEventListener("message", handleMessage)
    }
  }, [loading, structure, useLegacyFlow, currentContractIndex, contracts])

  // Fetch structure and contracts
  useEffect(() => {
    const loadContracts = async () => {
      setLoading(true)

      try {
        const token = getAuthToken()
        if (!token) {
          router.push('/lp-portal/login')
          return
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }

        // Fetch structure
        const structureRes = await fetch(getApiUrl(API_CONFIG.endpoints.getSingleStructure(structureId)), { headers })

        if (structureRes.status === 401) {
          logout()
          router.push('/lp-portal/login')
          return
        }

        if (!structureRes.ok) {
          throw new Error(`Failed to fetch structure`)
        }

        const structureData = await structureRes.json()
        const mappedStructure = {
          ...structureData.data,
          currency: structureData.data.baseCurrency,
          jurisdiction: structureData.data.taxJurisdiction,
          contractTemplateUrlNational: structureData.data.contractTemplateUrlNational,
          contractTemplateUrlInternational: structureData.data.contractTemplateUrlInternational,
        }
        setStructure(mappedStructure)

        // Try localStorage first
        const storedAssignments = localStorage.getItem('contract_assignments')
        let hasLocalStorageContracts = false

        if (storedAssignments) {
          const allAssignments = JSON.parse(storedAssignments)
          const structureContracts = allAssignments
            .filter((a: any) => a.structureId === structureId && a.triggerPoint === 'post_payment')
            .map((a: any) => {
              const templates = JSON.parse(localStorage.getItem('contract_templates') || '[]')
              const template = templates.find((t: any) => t.id === a.templateId)
              const signedContracts = JSON.parse(localStorage.getItem(`signed_contracts_${structureId}`) || '[]')
              const isSigned = signedContracts.includes(a.templateId)

              return {
                id: a.id,
                templateId: a.templateId,
                templateName: template?.name || a.templateName,
                docusealUrl: template?.docusealUrl || '',
                required: a.required,
                blocking: a.blocking,
                signed: isSigned,
              }
            })

          if (structureContracts.length > 0) {
            hasLocalStorageContracts = true
            setContracts(structureContracts)
            setUseLegacyFlow(false)
            const firstUnsigned = structureContracts.findIndex((c: ContractAssignment) => !c.signed)
            if (firstUnsigned !== -1) {
              setCurrentContractIndex(firstUnsigned)
            }
          }
        }

        // If no localStorage contracts, check structure template URLs
        if (!hasLocalStorageContracts) {
          const hasTemplateUrl = mappedStructure.contractTemplateUrlInternational ||
                                 mappedStructure.contractTemplateUrlNational

          if (hasTemplateUrl) {
            setUseLegacyFlow(true)
          } else {
            // No contracts anywhere, redirect to payment
            redirectToPayment()
            return
          }
        }

      } catch (error) {
        console.error('[Contracts] Error loading:', error)
        redirectToPayment()
      } finally {
        setLoading(false)
      }
    }

    loadContracts()
  }, [structureId, router])

  const redirectToPayment = () => {
    const queryString = `tokens=${tokens}&email=${email}&amount=${amount}`
    router.push(`/lp-portal/marketplace/structure/${structureId}/payment?${queryString}`)
  }

  const handleNextContract = () => {
    if (currentContractIndex < contracts.length - 1) {
      setCurrentContractIndex(prev => prev + 1)
    }
  }

  const handleSkipOptional = () => {
    const currentContract = contracts[currentContractIndex]
    if (currentContract && !currentContract.required) {
      handleNextContract()
    }
  }

  const handleProceedToPayment = () => {
    redirectToPayment()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <IconLoader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading contracts...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!structure) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <IconAlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-semibold mb-2">Error loading structure</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Legacy flow - single contract from structure template URLs
  if (useLegacyFlow) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Contract Signing</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Please review and sign the required documents before proceeding to payment
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Investment Agreement</CardTitle>
              <CardDescription>Required contract for {structure.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditError && (
                <Alert variant="destructive">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {creditError}
                  </AlertDescription>
                </Alert>
              )}

              {!hasTemplateError && !creditError ? (
                <div className="border rounded-lg overflow-hidden bg-muted/30" style={{ height: '600px' }}>
                  {/* @ts-expect-error - DocuSeal is a custom web component */}
                  <docuseal-form
                    data-src={currentTemplateUrl}
                    data-email={email}
                    className="w-full h-full"
                  />
                </div>
              ) : !creditError && (
                <div className="bg-muted rounded-lg p-8 text-center">
                  <IconFileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Contract template not configured for this structure
                  </p>
                </div>
              )}

              {!hasTemplateError && !legacySigned && !creditError && (
                <Alert>
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete the contract signing above to proceed to payment
                  </AlertDescription>
                </Alert>
              )}

              {legacySigned && (
                <Alert>
                  <IconCheck className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Contract signed successfully! You can now proceed to payment.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`/lp-portal/marketplace/structure/${structureId}/checkout`}>
                    Cancel
                  </a>
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  disabled={!legacySigned || !!creditError}
                  onClick={handleProceedToPayment}
                >
                  <IconCheck className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Multi-contract flow
  if (contracts.length === 0) {
    return null
  }

  const currentContract = contracts[currentContractIndex]
  const requiredContracts = contracts.filter(c => c.required)
  const optionalContracts = contracts.filter(c => !c.required)
  const signedCount = Array.from(signedContractIds).filter(id =>
    contracts.some(c => c.id === id)
  ).length
  const progress = contracts.length > 0 ? (signedCount / contracts.length) * 100 : 0

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contract Signing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Please review and sign the required documents before proceeding to payment
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{signedCount} of {contracts.length} signed</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredContracts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Required Contracts</CardTitle>
                <CardDescription>Must be signed to proceed</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {requiredContracts.map((contract) => (
                    <li key={contract.id} className="flex items-center gap-2 text-sm">
                      {signedContractIds.has(contract.id) ? (
                        <IconCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted" />
                      )}
                      <span className={signedContractIds.has(contract.id) ? 'text-muted-foreground line-through' : ''}>
                        {contract.templateName}
                      </span>
                      {contract.blocking && <Badge variant="destructive" className="ml-auto text-xs">Blocking</Badge>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {optionalContracts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Optional Contracts</CardTitle>
                <CardDescription>Can be skipped</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {optionalContracts.map((contract) => (
                    <li key={contract.id} className="flex items-center gap-2 text-sm">
                      {signedContractIds.has(contract.id) ? (
                        <IconCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted" />
                      )}
                      <span className={signedContractIds.has(contract.id) ? 'text-muted-foreground line-through' : ''}>
                        {contract.templateName}
                      </span>
                      <Badge variant="secondary" className="ml-auto text-xs">Optional</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {currentContract && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{currentContract.templateName}</CardTitle>
                  <CardDescription>
                    Contract {currentContractIndex + 1} of {contracts.length}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {currentContract.required ? (
                    <Badge variant="default">Required</Badge>
                  ) : (
                    <Badge variant="secondary">Optional</Badge>
                  )}
                  {currentContract.blocking && <Badge variant="destructive">Blocking</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditError && (
                <Alert variant="destructive">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {creditError}
                  </AlertDescription>
                </Alert>
              )}

              {!hasTemplateError && !creditError ? (
                <div className="border rounded-lg overflow-hidden bg-muted/30" style={{ height: '600px' }}>
                  {/* @ts-expect-error - DocuSeal is a custom web component */}
                  <docuseal-form
                    key={currentTemplateUrl}
                    data-src={currentTemplateUrl}
                    data-email={email}
                    className="w-full h-full"
                  />
                </div>
              ) : !creditError && (
                <div className="bg-muted rounded-lg p-8 text-center">
                  <IconFileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Contract template not available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Template URL: {currentContract.docusealUrl}
                  </p>
                </div>
              )}

              {!isCurrentSigned && !creditError && (
                <Alert>
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete the contract signing above to continue
                  </AlertDescription>
                </Alert>
              )}

              {isCurrentSigned && (
                <Alert>
                  <IconCheck className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    This contract has been signed
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <a href={`/lp-portal/marketplace/structure/${structureId}/checkout`}>
                    Cancel
                  </a>
                </Button>

                {!currentContract.required && !currentContract.blocking && !isCurrentSigned && !creditError && (
                  <Button variant="outline" onClick={handleSkipOptional}>
                    Skip (Optional)
                  </Button>
                )}

                {isCurrentSigned && currentContractIndex < contracts.length - 1 && !creditError && (
                  <Button onClick={handleNextContract}>
                    Next Contract
                    <IconChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {isCurrentSigned && currentContractIndex === contracts.length - 1 && (
                  <Button className="flex-1" disabled={!!creditError} onClick={handleProceedToPayment}>
                    <IconCheck className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
