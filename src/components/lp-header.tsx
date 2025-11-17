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

export function LPHeader() {
  const pathname = usePathname()
  const { customBreadcrumbs } = useBreadcrumb()

  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)

    // Path mapping
    const pathMap: { [key: string]: string } = {
      'portfolio': 'Portfolio',
      'dashboard': 'Dashboard',
      'documents': 'Documents',
      'chat': 'Chat',
      'updates': 'Updates',
      'support': 'Get Help',
      'account': 'Account',
      'onboarding': 'Onboarding',
      'commitments': 'Commitments',
      'activity': 'Activity',
      'capital-calls': 'Capital Calls',
      'distributions': 'Distributions',
      'search': 'Search',
      'reports': 'Reports',
    }

    // If just /lp-portal or /lp-portal/, show Portfolio
    if (segments.length === 1 && segments[0] === 'lp-portal') {
      return 'Portfolio'
    }

    // Get the last segment (current page)
    const lastSegment = segments[segments.length - 1]

    // Check for custom breadcrumb
    const customLabel = customBreadcrumbs[pathname]
    if (customLabel) return customLabel

    // Return mapped label or capitalize the segment
    return pathMap[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')
  }

  const pageTitle = getPageTitle()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
