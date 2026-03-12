'use client'

/**
 * NeoPay 3D Secure iFrame Component
 * Handles 3D Secure authentication steps
 */
import { useEffect, useRef, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Shield } from 'lucide-react'

interface NeoPay3DSIframeProps {
  accessToken: string
  deviceDataCollectionUrl: string
  step: 2 | 4
  onComplete: (success: boolean) => void
  onError: (error: string) => void
}

export function NeoPay3DSIframe({
  accessToken,
  deviceDataCollectionUrl,
  step,
  onComplete,
  onError,
}: NeoPay3DSIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Listen for messages from the iframe
  const handleMessage = useCallback((event: MessageEvent) => {
    // Validate origin (adjust based on NeoPay's domain)
    // if (!event.origin.includes('visanet.com.gt')) return

    try {
      const data = typeof event.data === 'string'
        ? JSON.parse(event.data)
        : event.data

      console.log('[3DS] Received message:', data)

      if (data.MessageType === 'profile.completed' || data.status === 'true') {
        setIsLoading(false)
        onComplete(true)
      } else if (data.MessageType === 'profile.failed' || data.status === 'false') {
        setIsLoading(false)
        onComplete(false)
      }
    } catch (e) {
      // Not a JSON message, might be a regular postMessage
      if (event.data === 'true' || event.data?.status === 'true') {
        setIsLoading(false)
        onComplete(true)
      }
    }
  }, [onComplete])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Submit form when component mounts
  useEffect(() => {
    if (formRef.current && iframeRef.current) {
      // Small delay to ensure iframe is ready
      const timer = setTimeout(() => {
        formRef.current?.submit()
      }, 100)

      // Timeout for step 2 (device data collection should be quick)
      if (step === 2) {
        const timeout = setTimeout(() => {
          console.log('[3DS] Step 2 timeout - assuming success')
          onComplete(true)
        }, 10000) // 10 seconds max for step 2

        return () => {
          clearTimeout(timer)
          clearTimeout(timeout)
        }
      }

      return () => clearTimeout(timer)
    }
  }, [step, onComplete])

  // For Step 4, the iframe should be visible for PIN entry
  const isVisible = step === 4

  return (
    <Card className={isVisible ? '' : 'sr-only'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {step === 2 ? 'Verifying your card...' : 'Enter your verification code'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && step === 2 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Processing secure verification...</span>
          </div>
        )}

        {/* Hidden form for submission */}
        <form
          ref={formRef}
          method="POST"
          action={deviceDataCollectionUrl}
          target="neopay-3ds-iframe"
          className="hidden"
        >
          <input type="hidden" name="JWT" value={accessToken} />
        </form>

        {/* iFrame */}
        <iframe
          ref={iframeRef}
          name="neopay-3ds-iframe"
          title="3D Secure Verification"
          className={isVisible ? 'w-full h-[400px] border rounded' : 'w-0 h-0'}
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
        />

        {step === 4 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Enter the verification code sent to your phone or email,
            then click Submit in the form above.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
