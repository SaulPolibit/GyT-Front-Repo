'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { useTranslation } from "@/hooks/useTranslation"

export default function LPPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()
  useEffect(() => {
    console.error('[LPPortalError]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">{t.lpError.title}</CardTitle>
          <CardDescription>
            {t.lpError.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={reset} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            {t.lpError.reloadPage}
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href="/lp-portal">{t.lpError.backToPortal}</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
