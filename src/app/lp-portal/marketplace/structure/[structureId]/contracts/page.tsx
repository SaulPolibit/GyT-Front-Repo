'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IconCheck, IconAlertCircle, IconFileText, IconChevronRight } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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

export default function ContractsPage({ params }: ContractsPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const structureId = resolvedParams.structureId

  const [contracts, setContracts] = useState<ContractAssignment[]>([])
  const [currentContractIndex, setCurrentContractIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContracts()
  }, [structureId])

  const loadContracts = () => {
    const storedAssignments = localStorage.getItem('contract_assignments')

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

      setContracts(structureContracts)
      const firstUnsigned = structureContracts.findIndex((c: ContractAssignment) => !c.signed)
      if (firstUnsigned !== -1) {
        setCurrentContractIndex(firstUnsigned)
      }
    }

    setLoading(false)
  }

  const handleContractSigned = (contractIndex: number) => {
    const contract = contracts[contractIndex]
    const signedContracts = JSON.parse(localStorage.getItem(`signed_contracts_${structureId}`) || '[]')
    signedContracts.push(contract.templateId)
    localStorage.setItem(`signed_contracts_${structureId}`, JSON.stringify(signedContracts))

    const updatedContracts = [...contracts]
    updatedContracts[contractIndex].signed = true
    setContracts(updatedContracts)
    toast.success(`${contract.templateName} signed successfully`)

    const nextUnsigned = updatedContracts.findIndex((c, i) => i > contractIndex && !c.signed)
    if (nextUnsigned !== -1) {
      setCurrentContractIndex(nextUnsigned)
    } else {
      checkAndProceed(updatedContracts)
    }
  }

  const handleSkipOptional = () => {
    const currentContract = contracts[currentContractIndex]
    if (currentContract.required && currentContract.blocking) {
      toast.error('This contract is required and cannot be skipped')
      return
    }

    const nextUnsigned = contracts.findIndex((c, i) => i > currentContractIndex && !c.signed)
    if (nextUnsigned !== -1) {
      setCurrentContractIndex(nextUnsigned)
    } else {
      checkAndProceed(contracts)
    }
  }

  const checkAndProceed = (contractList: ContractAssignment[]) => {
    const unsignedBlocking = contractList.filter(c => c.blocking && c.required && !c.signed)
    if (unsignedBlocking.length > 0) {
      toast.error('Please sign all required contracts before proceeding')
      return
    }
    router.push(`/lp-portal/marketplace/structure/${structureId}/checkout`)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading contracts...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (contracts.length === 0) {
    router.push(`/lp-portal/marketplace/structure/${structureId}/checkout`)
    return null
  }

  const currentContract = contracts[currentContractIndex]
  const requiredContracts = contracts.filter(c => c.required)
  const optionalContracts = contracts.filter(c => !c.required)
  const signedCount = contracts.filter(c => c.signed).length
  const progress = (signedCount / contracts.length) * 100

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contract Signing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Please review and sign the required documents before proceeding to checkout
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
                      {contract.signed ? (
                        <IconCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted" />
                      )}
                      <span className={contract.signed ? 'text-muted-foreground line-through' : ''}>
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
                      {contract.signed ? (
                        <IconCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted" />
                      )}
                      <span className={contract.signed ? 'text-muted-foreground line-through' : ''}>
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

        {!contracts.every(c => c.signed) && (
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
              {currentContract.signed ? (
                <Alert>
                  <IconCheck className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    This contract has been signed
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="bg-muted rounded-lg p-8 text-center">
                    <IconFileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      DocuSeal embed integration will be displayed here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Template URL: {currentContract.docusealUrl}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    {!currentContract.required && !currentContract.blocking && (
                      <Button variant="outline" onClick={handleSkipOptional}>
                        Skip (Optional)
                      </Button>
                    )}
                    <Button className="flex-1" onClick={() => handleContractSigned(currentContractIndex)}>
                      Mark as Signed
                      <IconChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {currentContract.blocking && currentContract.required && (
                    <Alert>
                      <IconAlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This contract is required and must be signed before you can proceed to checkout
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {contracts.every(c => c.signed) && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                    <IconCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900">All Contracts Signed!</h3>
                  <p className="text-sm text-green-700">
                    You can now proceed to complete your checkout
                  </p>
                </div>
                <Button onClick={() => checkAndProceed(contracts)}>
                  Proceed to Checkout
                  <IconChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
