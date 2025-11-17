'use client'

import * as React from 'react'
import { LPSearchCommand } from '@/components/lp-search-command'

export default function LPSearchPage() {
  const [open, setOpen] = React.useState(true)

  React.useEffect(() => {
    // Keep dialog open when page loads
    setOpen(true)
  }, [])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground mt-1">
          Search for structures, documents, and pages. Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd> to open search anywhere.
        </p>
      </div>

      <LPSearchCommand open={open} onOpenChange={setOpen} />
    </div>
  )
}
