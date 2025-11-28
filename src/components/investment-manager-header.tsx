"use client"

import { usePathname, useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTranslation } from "@/hooks/useTranslation"
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

export function InvestmentManagerHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const { user, logout, getUserName } = useAuth()

  const getTitle = () => {
    if (pathname === "/investment-manager") {
      return t.dashboard.title
    }
    if (pathname === "/investment-manager/structures") {
      return t.nav.structures
    }
    if (pathname === "/investment-manager/documents") {
      return t.nav.documents
    }
    if (pathname === "/investment-manager/chat") {
      return t.nav.chat
    }
    if (pathname === "/investment-manager/settings") {
      return t.nav.settings
    }
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/sign-in')
  }

  const title = getTitle()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {title && (
          <h1 className="text-base font-medium text-slate-900 dark:text-slate-100">{title}</h1>
        )}
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
