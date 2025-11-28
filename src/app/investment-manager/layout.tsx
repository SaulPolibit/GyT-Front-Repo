'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { InvestmentManagerHeader } from "@/components/investment-manager-header"
import { SearchCommand } from "@/components/search-command"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { UserProvider } from "@/contexts/UserContext"
import { AuthGuard } from "@/components/auth-guard"
import { useState } from "react"

export default function InvestmentManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <AuthGuard requiredRole="investment-manager">
      <UserProvider>
        <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
        <SidebarProvider
          style={
            {
              "--sidebar-width": "12rem",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" onSearchClick={() => setSearchOpen(true)} />
          <SidebarInset className="min-w-0 flex-1 flex flex-col overflow-hidden">
            <InvestmentManagerHeader />
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </UserProvider>
    </AuthGuard>
  )
}
