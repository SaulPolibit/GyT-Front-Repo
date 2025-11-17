import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { LPSidebarWrapper } from "@/components/lp-sidebar-wrapper"
import { LPHeader } from "@/components/lp-header"
import { Toaster } from "@/components/ui/sonner"
import { BreadcrumbProvider } from "@/contexts/lp-breadcrumb-context"

export default function LPPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BreadcrumbProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "12rem",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <LPSidebarWrapper variant="inset" />
        <SidebarInset className="min-w-0 flex-1 flex flex-col overflow-hidden">
          <LPHeader />
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </BreadcrumbProvider>
  )
}
