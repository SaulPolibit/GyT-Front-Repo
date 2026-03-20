"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTranslation } from "@/hooks/useTranslation"
import { useAuth } from "@/hooks/useAuth"
import { User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"

export function InvestmentManagerHeader() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { getUserName } = useAuth()

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
