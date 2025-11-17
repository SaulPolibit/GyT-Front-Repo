"use client"

import * as React from "react"
import { LPSidebar } from "./lp-sidebar"
import { LPSearchCommand } from "./lp-search-command"

export function LPSidebarWrapper(props: React.ComponentProps<typeof LPSidebar>) {
  const [searchOpen, setSearchOpen] = React.useState(false)

  React.useEffect(() => {
    const handleSearchClick = (e: CustomEvent) => {
      e.preventDefault()
      setSearchOpen(true)
    }

    window.addEventListener('lp-search-click' as any, handleSearchClick as any)
    return () => window.removeEventListener('lp-search-click' as any, handleSearchClick as any)
  }, [])

  return (
    <>
      <LPSidebar {...props} onSearchClick={() => setSearchOpen(true)} />
      <LPSearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
