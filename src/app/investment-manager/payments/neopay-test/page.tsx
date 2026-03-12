'use client'

/**
 * NeoPay Test Page
 * Test view for NeoPay payment components
 */
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { NeoPayCardForm } from '@/components/payments/neopay-card-form'
import { NeoPay3DSIframe } from '@/components/payments/neopay-3ds-iframe'
import { NeoPayVoucher } from '@/components/payments/neopay-voucher'
import { useNeoPay } from '@/hooks/use-neopay'
import {
  CreditCard,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Receipt
} from 'lucide-react'

type PaymentStep = 'form' | '3ds-step2' | '3ds-step4' | 'success' | 'error'

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

interface BillingInfo {
  firstName: string
  lastName: string
  addressOne: string
  locality: string
  administrativeArea: string
  postalCode: string
  country: string
  email: string
  phoneNumber: string
}

export default function NeoPayTestPage() {
  const {
    charge,
    charge3DS,
    continue3DS_Step3,
    continue3DS_Step5,
    getVoucher,
    checkHealth,
    isLoading,
    error: hookError
  } = useNeoPay()

  // Payment state
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('form')
  const [paymentMode, setPaymentMode] = useState<'simple' | '3ds'>('simple')
  const [amount, setAmount] = useState<number>(100)
  const [currency, setCurrency] = useState<string>('GTQ')

  // 3DS state
  const [transaction3DS, setTransaction3DS] = useState<{
    transactionId: string
    accessToken: string
    deviceDataCollectionUrl: string
    referenceId?: string
    acsUrl?: string
  } | null>(null)

  // Result state
  const [result, setResult] = useState<{
    success: boolean
    message: string
    transactionId?: string
    data?: Record<string, unknown>
  } | null>(null)

  // Voucher state
  const [voucher, setVoucher] = useState<VoucherData | null>(null)

  // Health check state
  const [healthStatus, setHealthStatus] = useState<{
    checked: boolean
    status?: string
    configured?: boolean
    environment?: string
  }>({ checked: false })

  // Billing info for 3DS
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    firstName: 'Juan',
    lastName: 'Perez',
    addressOne: '6ta Avenida 10-50 Zona 1',
    locality: 'Guatemala City',
    administrativeArea: 'Guatemala',
    postalCode: '01001',
    country: 'GT',
    email: 'test@example.com',
    phoneNumber: '50212345678',
  })

  // Check API health
  const handleCheckHealth = async () => {
    try {
      const response = await checkHealth()
      setHealthStatus({
        checked: true,
        status: response.status,
        configured: response.configured,
        environment: response.environment,
      })
    } catch (err) {
      setHealthStatus({
        checked: true,
        status: 'error',
        configured: false,
      })
    }
  }

  // Handle simple charge
  const handleSimpleCharge = async (cardData: {
    cardNumber: string
    cardExpiration: string
    cvv: string
    cardHolderName: string
  }) => {
    try {
      setResult(null)
      const response = await charge({
        amount,
        card: cardData,
      })

      if (response.success) {
        setResult({
          success: true,
          message: 'Payment approved successfully!',
          transactionId: response.transactionId,
        })
        setPaymentStep('success')

        // Load voucher
        if (response.transactionId) {
          const voucherData = await getVoucher(response.transactionId)
          if (voucherData) {
            setVoucher(voucherData as VoucherData)
          }
        }
      } else {
        setResult({
          success: false,
          message: response.error || 'Payment declined',
        })
        setPaymentStep('error')
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Payment failed',
      })
      setPaymentStep('error')
    }
  }

  // Handle 3DS charge - Step 1
  const handle3DSCharge = async (cardData: {
    cardNumber: string
    cardExpiration: string
    cvv: string
    cardHolderName: string
  }) => {
    try {
      setResult(null)
      const response = await charge3DS({
        amount,
        card: cardData,
        billingInfo,
        urlCommerce: window.location.origin + '/investment-manager/payments/neopay-test',
      })

      if (response.success && response.secure3d) {
        setTransaction3DS({
          transactionId: response.transactionId || '',
          accessToken: response.secure3d.accessToken,
          deviceDataCollectionUrl: response.secure3d.deviceDataCollectionUrl,
        })
        setPaymentStep('3ds-step2')
      } else {
        setResult({
          success: false,
          message: response.error || '3DS initialization failed',
        })
        setPaymentStep('error')
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : '3DS initialization failed',
      })
      setPaymentStep('error')
    }
  }

  // Handle 3DS Step 2 complete (device data collection)
  const handle3DSStep2Complete = async (success: boolean) => {
    if (!success || !transaction3DS) {
      setResult({
        success: false,
        message: 'Device data collection failed',
      })
      setPaymentStep('error')
      return
    }

    try {
      // Call Step 3 API
      const response = await continue3DS_Step3(
        transaction3DS.transactionId,
        transaction3DS.accessToken
      )

      if (response.success) {
        if (response.needsAdditionalAuth && response.secure3d) {
          // Need Step 4 (PIN entry)
          setTransaction3DS({
            ...transaction3DS,
            referenceId: response.secure3d.referenceId,
            acsUrl: response.secure3d.deviceDataCollectionUrl,
            accessToken: response.secure3d.accessToken,
          })
          setPaymentStep('3ds-step4')
        } else {
          // Payment approved without challenge
          setResult({
            success: true,
            message: 'Payment approved (frictionless)!',
            transactionId: response.transactionId,
          })
          setPaymentStep('success')

          // Load voucher
          if (response.transactionId) {
            const voucherData = await getVoucher(response.transactionId)
            if (voucherData) {
              setVoucher(voucherData as VoucherData)
            }
          }
        }
      } else {
        setResult({
          success: false,
          message: response.error || 'Step 3 validation failed',
        })
        setPaymentStep('error')
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Step 3 failed',
      })
      setPaymentStep('error')
    }
  }

  // Handle 3DS Step 4 complete (challenge/PIN)
  const handle3DSStep4Complete = async (success: boolean) => {
    if (!success || !transaction3DS) {
      setResult({
        success: false,
        message: 'Challenge verification failed',
      })
      setPaymentStep('error')
      return
    }

    try {
      // Call Step 5 API
      const response = await continue3DS_Step5(
        transaction3DS.transactionId,
        transaction3DS.referenceId || ''
      )

      if (response.success) {
        setResult({
          success: true,
          message: 'Payment approved with 3D Secure!',
          transactionId: response.transactionId,
        })
        setPaymentStep('success')

        // Load voucher
        if (response.transactionId) {
          const voucherData = await getVoucher(response.transactionId)
          if (voucherData) {
            setVoucher(voucherData as VoucherData)
          }
        }
      } else {
        setResult({
          success: false,
          message: response.error || 'Final authorization failed',
        })
        setPaymentStep('error')
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Final step failed',
      })
      setPaymentStep('error')
    }
  }

  // Reset to start
  const handleReset = () => {
    setPaymentStep('form')
    setResult(null)
    setVoucher(null)
    setTransaction3DS(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            NeoPay Test
          </h1>
          <p className="text-muted-foreground">
            Test the NeoPay payment integration
          </p>
        </div>
        <Button variant="outline" onClick={handleCheckHealth}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Check API Status
        </Button>
      </div>

      {/* Health Status */}
      {healthStatus.checked && (
        <Alert variant={healthStatus.status === 'operational' ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Status</AlertTitle>
          <AlertDescription className="flex items-center gap-4">
            <Badge variant={healthStatus.status === 'operational' ? 'default' : 'destructive'}>
              {healthStatus.status}
            </Badge>
            <span>Environment: {healthStatus.environment || 'unknown'}</span>
            <span>Configured: {healthStatus.configured ? 'Yes' : 'No'}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Hook Error */}
      {hookError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{hookError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Payment Form */}
        <div className="space-y-6">
          {paymentStep === 'form' && (
            <>
              {/* Payment Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Configuration</CardTitle>
                  <CardDescription>Set the payment amount and mode</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <Tabs value={paymentMode} onValueChange={(v) => setPaymentMode(v as 'simple' | '3ds')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="simple">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Simple Charge
                      </TabsTrigger>
                      <TabsTrigger value="3ds">
                        <Shield className="mr-2 h-4 w-4" />
                        3D Secure
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="3ds" className="mt-4">
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          3D Secure requires billing information for verification.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input
                              value={billingInfo.firstName}
                              onChange={(e) => setBillingInfo({ ...billingInfo, firstName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input
                              value={billingInfo.lastName}
                              onChange={(e) => setBillingInfo({ ...billingInfo, lastName: e.target.value })}
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label>Address</Label>
                            <Input
                              value={billingInfo.addressOne}
                              onChange={(e) => setBillingInfo({ ...billingInfo, addressOne: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>City</Label>
                            <Input
                              value={billingInfo.locality}
                              onChange={(e) => setBillingInfo({ ...billingInfo, locality: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Region</Label>
                            <Input
                              value={billingInfo.administrativeArea}
                              onChange={(e) => setBillingInfo({ ...billingInfo, administrativeArea: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Postal Code</Label>
                            <Input
                              value={billingInfo.postalCode}
                              onChange={(e) => setBillingInfo({ ...billingInfo, postalCode: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Country</Label>
                            <Input
                              value={billingInfo.country}
                              onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={billingInfo.email}
                              onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                              value={billingInfo.phoneNumber}
                              onChange={(e) => setBillingInfo({ ...billingInfo, phoneNumber: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Card Form */}
              <NeoPayCardForm
                onSubmit={paymentMode === 'simple' ? handleSimpleCharge : handle3DSCharge}
                isLoading={isLoading}
                amount={amount}
                currency={currency}
                submitLabel={paymentMode === '3ds' ? 'Pay with 3D Secure' : 'Pay Now'}
              />
            </>
          )}

          {/* 3DS Step 2 - Device Data Collection */}
          {paymentStep === '3ds-step2' && transaction3DS && (
            <NeoPay3DSIframe
              accessToken={transaction3DS.accessToken}
              deviceDataCollectionUrl={transaction3DS.deviceDataCollectionUrl}
              step={2}
              onComplete={handle3DSStep2Complete}
              onError={(err) => {
                setResult({ success: false, message: err })
                setPaymentStep('error')
              }}
            />
          )}

          {/* 3DS Step 4 - Challenge/PIN Entry */}
          {paymentStep === '3ds-step4' && transaction3DS && (
            <NeoPay3DSIframe
              accessToken={transaction3DS.accessToken}
              deviceDataCollectionUrl={transaction3DS.acsUrl || ''}
              step={4}
              onComplete={handle3DSStep4Complete}
              onError={(err) => {
                setResult({ success: false, message: err })
                setPaymentStep('error')
              }}
            />
          )}

          {/* Success State */}
          {paymentStep === 'success' && result && (
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  Payment Successful
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{result.message}</p>
                {result.transactionId && (
                  <p className="text-sm text-muted-foreground">
                    Transaction ID: <code className="bg-muted px-2 py-1 rounded">{result.transactionId}</code>
                  </p>
                )}
                <Button onClick={handleReset} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Make Another Payment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {paymentStep === 'error' && result && (
            <Card className="border-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-6 w-6" />
                  Payment Failed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{result.message}</p>
                {result.data && (
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
                <Button onClick={handleReset} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Voucher & Info */}
        <div className="space-y-6">
          {/* Voucher */}
          {voucher && paymentStep === 'success' && (
            <NeoPayVoucher
              voucher={voucher}
              onClose={() => setVoucher(null)}
            />
          )}

          {/* Test Card Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Test Cards
              </CardTitle>
              <CardDescription>
                Use these test card numbers for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Visa (Approved)</p>
                  <code className="text-xs">4111 1111 1111 1111</code>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">MasterCard (Approved)</p>
                  <code className="text-xs">5500 0000 0000 0004</code>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Visa (Declined)</p>
                  <code className="text-xs">4000 0000 0000 0002</code>
                </div>
                <Separator />
                <div className="text-muted-foreground">
                  <p><strong>Expiration:</strong> Any future date (e.g., 25/12)</p>
                  <p><strong>CVV:</strong> Any 3 digits (e.g., 123)</p>
                  <p><strong>Name:</strong> Any name in uppercase</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current State */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Payment Step:</span>
                  <Badge>{paymentStep}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Payment Mode:</span>
                  <Badge variant="outline">{paymentMode}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <Badge variant={isLoading ? 'default' : 'outline'}>
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'No'}
                  </Badge>
                </div>
                {transaction3DS && (
                  <div className="mt-4 p-3 bg-muted rounded text-xs">
                    <p className="font-medium mb-2">3DS Transaction:</p>
                    <p>ID: {transaction3DS.transactionId}</p>
                    {transaction3DS.referenceId && (
                      <p>Ref: {transaction3DS.referenceId}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
