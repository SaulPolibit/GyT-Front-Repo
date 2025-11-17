"use client"

import * as React from "react"

interface BreadcrumbContextType {
  customBreadcrumbs: { [key: string]: string }
  setCustomBreadcrumb: (path: string, label: string) => void
  clearCustomBreadcrumb: (path: string) => void
}

const BreadcrumbContext = React.createContext<BreadcrumbContextType | undefined>(undefined)

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [customBreadcrumbs, setCustomBreadcrumbs] = React.useState<{ [key: string]: string }>({})

  const setCustomBreadcrumb = React.useCallback((path: string, label: string) => {
    setCustomBreadcrumbs(prev => ({ ...prev, [path]: label }))
  }, [])

  const clearCustomBreadcrumb = React.useCallback((path: string) => {
    setCustomBreadcrumbs(prev => {
      const newBreadcrumbs = { ...prev }
      delete newBreadcrumbs[path]
      return newBreadcrumbs
    })
  }, [])

  const value = React.useMemo(
    () => ({ customBreadcrumbs, setCustomBreadcrumb, clearCustomBreadcrumb }),
    [customBreadcrumbs, setCustomBreadcrumb, clearCustomBreadcrumb]
  )

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  const context = React.useContext(BreadcrumbContext)
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider')
  }
  return context
}
