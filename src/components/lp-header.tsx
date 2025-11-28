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
import { usePathname, useRouter } from "next/navigation"
import { useBreadcrumb } from "@/contexts/lp-breadcrumb-context"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"

export function LPHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { customBreadcrumbs } = useBreadcrumb()
  const { user, logout, getUserName } = useAuth()

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

  const handleLogout = () => {
    logout()
    router.push('/lp-portal/login')
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
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{getUserName() || 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
