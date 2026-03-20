"use client"

import * as React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import { useBreadcrumb } from "@/contexts/lp-breadcrumb-context"
import { useAuth } from "@/hooks/useAuth"
import { User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useTranslation } from "@/hooks/useTranslation"

export function LPHeader() {
  const pathname = usePathname()
  const { customBreadcrumbs } = useBreadcrumb()
  const { getUserName } = useAuth()
  const { t } = useTranslation()

  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)

    // Path mapping
    const pathMap: { [key: string]: string } = {
      'portfolio': t.nav.portfolio,
      'dashboard': t.nav.dashboard,
      'documents': t.nav.documents,
      'chat': t.nav.chat,
      'updates': t.nav.notifications,
      'support': t.nav.getHelp,
      'account': t.nav.account,
      'onboarding': t.nav.onboarding,
      'commitments': t.nav.commitments,
      'activity': t.nav.activity,
      'capital-calls': t.nav.capitalCalls,
      'distributions': t.nav.distributions,
      'search': t.nav.search,
      'reports': t.nav.reports,
    }

    // If just /lp-portal or /lp-portal/, show Portfolio
    if (segments.length === 1 && segments[0] === 'lp-portal') {
      return t.nav.portfolio
    }

    // Check for custom breadcrumb first
    const customLabel = customBreadcrumbs[pathname]
    if (customLabel) return customLabel

    // Get the last segment (current page)
    const lastSegment = segments[segments.length - 1]

    // If the last segment is a UUID, use the parent segment's label instead
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(lastSegment) && segments.length >= 2) {
      const parentSegment = segments[segments.length - 2]
      return pathMap[parentSegment] || parentSegment.charAt(0).toUpperCase() + parentSegment.slice(1).replace(/-/g, ' ')
    }

    // Return mapped label or capitalize the segment
    return pathMap[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')
  }

  const pageTitle = getPageTitle()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          <div className="flex items-center gap-2 px-2 text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{getUserName() || 'User'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
