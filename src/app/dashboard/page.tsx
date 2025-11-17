import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./investment-data.json"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "12rem",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto">
          <div className="@container/main flex flex-col gap-2 min-w-0">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 min-w-0">
              <div className="px-4 lg:px-6 min-w-0">
                <SectionCards />
              </div>
              <div className="px-4 lg:px-6 min-w-0">
                <ChartAreaInteractive />
              </div>
              <div className="min-w-0">
                <DataTable data={data} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
