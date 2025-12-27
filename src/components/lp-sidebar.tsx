"use client"

import * as React from "react"
import {
  Home,
  Building2,
  FileText,
  Bell,
  HelpCircle,
  User,
  Landmark,
  DollarSign,
  Folder,
  Activity,
  TrendingUp,
  Send,
  Settings,
  Search,
  MessageSquare,
  LayoutDashboard,
  Store,
  Share2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import { NavManagement } from "@/components/nav-management"
import { NavSecondary } from "@/components/nav-secondary"
import { LPNavUser } from "@/components/lp-nav-user"
import { getFirmSettings, FirmSettings } from "@/lib/firm-settings-storage"

interface LPSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSearchClick?: () => void
}

export function LPSidebar({ onSearchClick, ...props }: LPSidebarProps) {
  const [firmSettings, setFirmSettings] = React.useState<FirmSettings | null>(null)

  React.useEffect(() => {
    setFirmSettings(getFirmSettings())
  }, [])

  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/lp-portal/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Marketplace",
        url: "/lp-portal/marketplace",
        icon: Store,
      },
      {
        title: "Portfolio",
        url: "/lp-portal/portfolio",
        icon: Home,
      },
      {
        title: "Reports",
        url: "/lp-portal/reports",
        icon: TrendingUp,
      },
      {
        title: "Documents",
        url: "/lp-portal/documents",
        icon: FileText,
      },
      {
        title: "Chat",
        url: "/lp-portal/chat",
        icon: MessageSquare,
      },
    ],
    navManagement: [
      {
        title: "Capital",
        url: "#",
        icon: DollarSign,
        items: [
          {
            title: "Commitments",
            url: "/lp-portal/commitments",
          },
          {
            title: "Activity",
            url: "/lp-portal/activity",
          },
        ],
      },
      {
        title: "Operations",
        url: "#",
        icon: Activity,
        items: [
          {
            title: "Capital Calls",
            url: "/lp-portal/capital-calls",
          },
          {
            title: "Distributions",
            url: "/lp-portal/distributions",
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "/lp-portal/settings",
        icon: Settings,
      },
      {
        title: "Get Help",
        url: "/lp-portal/help",
        icon: HelpCircle,
      },
      {
        title: "Search",
        url: "#",
        icon: Search,
        onClick: onSearchClick,
      },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props} className="h-full overflow-hidden">
      <SidebarHeader className="shrink-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/lp-portal" className="flex items-center justify-center">
                {firmSettings?.firmLogo ? (
                  <img
                    src={firmSettings.firmLogo}
                    alt="Firm logo"
                    className="h-8 w-auto object-contain rounded"
                  />
                ) : (
                  <Share2 className="!size-8" />
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto">
        <NavMain items={data.navMain} />
        <NavManagement items={data.navManagement} />
        <NavSecondary items={data.navSecondary} className="mt-auto" onSearchClick={onSearchClick} />
      </SidebarContent>
      <SidebarFooter className="shrink-0">
        <LPNavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
