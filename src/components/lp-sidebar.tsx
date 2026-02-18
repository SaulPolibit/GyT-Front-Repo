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
import { useFirmLogo, useNotificationSettings, useUnreadNotificationCount } from "@/lib/swr-hooks"
import { NotificationsPanel } from "@/components/notifications-panel"

interface LPSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSearchClick?: () => void
}

export function LPSidebar({ onSearchClick, ...props }: LPSidebarProps) {
  // Use SWR for cached firm logo (reduces API requests)
  const { firmLogo } = useFirmLogo()

  // Notification settings and unread count
  const { pushNotificationsEnabled } = useNotificationSettings()
  const { count: unreadCount } = useUnreadNotificationCount()

  // Notifications panel state
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = React.useState(false)

  const handleNotificationsClick = () => {
    setIsNotificationsPanelOpen(!isNotificationsPanelOpen)
  }

  // Check environment variables for navigation visibility
  const showDashboardReports = process.env.NEXT_PUBLIC_SHOW_DASHBOARD_REPORTS !== 'false'
  const showManagementSection = process.env.NEXT_PUBLIC_SHOW_MANAGEMENT_SECTION !== 'false'

  // Build navigation arrays based on environment variables
  const allNavMain = [
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
  ]

  // Filter out Dashboard and Reports if environment variable is set to false
  const navMain = showDashboardReports
    ? allNavMain
    : allNavMain.filter(item => item.title !== "Dashboard" && item.title !== "Reports")

  const data = {
    navMain,
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
      // Notifications - only show if portal notifications are enabled
      ...(pushNotificationsEnabled ? [{
        title: "Notifications",
        url: "#",
        icon: Bell,
        onClick: handleNotificationsClick,
        badge: unreadCount > 0 ? unreadCount : undefined,
      }] : []),
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
    <>
      <Sidebar collapsible="offcanvas" {...props} className="h-full overflow-hidden">
        <SidebarHeader className="shrink-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="/lp-portal" className="flex items-center justify-center">
                  {firmLogo ? (
                    <img
                      src={firmLogo}
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
          {showManagementSection && <NavManagement items={data.navManagement} />}
          <NavSecondary items={data.navSecondary} className="mt-auto" onSearchClick={onSearchClick} />
        </SidebarContent>
        <SidebarFooter className="shrink-0">
          <LPNavUser />
        </SidebarFooter>
      </Sidebar>

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={isNotificationsPanelOpen}
        onClose={() => setIsNotificationsPanelOpen(false)}
      />
    </>
  )
}
