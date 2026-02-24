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
import { useFirmLogo, useNotificationSettings, useUnreadNotificationCount, useUnreadMessageCount } from "@/lib/swr-hooks"
import { NotificationsPanel } from "@/components/notifications-panel"
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications"
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages"
import { getCurrentUser } from "@/lib/auth-storage"

interface LPSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSearchClick?: () => void
}

export function LPSidebar({ onSearchClick, ...props }: LPSidebarProps) {
  const currentUser = getCurrentUser()

  // Use SWR for cached firm logo (reduces API requests)
  const { firmLogo } = useFirmLogo()

  // Notification settings and unread count
  const { pushNotificationsEnabled } = useNotificationSettings()
  const { count: unreadCount, mutate: mutateUnreadCount } = useUnreadNotificationCount()

  // Unread message count for chat
  const { conversationsWithUnread, mutate: mutateUnreadMessages } = useUnreadMessageCount()

  // Realtime notification count (additions since last SWR fetch)
  const [realtimeNotificationCount, setRealtimeNotificationCount] = React.useState(0)

  // Realtime message count (new messages since last SWR fetch)
  const [realtimeMessageCount, setRealtimeMessageCount] = React.useState(0)

  // Subscribe to realtime notifications
  useRealtimeNotifications({
    userId: currentUser?.id || null,
    onNewNotification: React.useCallback(() => {
      setRealtimeNotificationCount(prev => prev + 1)
    }, []),
    onNotificationRead: React.useCallback(() => {
      // Revalidate SWR count and reset realtime additions
      mutateUnreadCount()
      setRealtimeNotificationCount(0)
    }, [mutateUnreadCount]),
  })

  // Subscribe to realtime messages for chat badge
  useRealtimeMessages({
    userId: currentUser?.id || null,
    onNewMessage: React.useCallback(() => {
      setRealtimeMessageCount(prev => prev + 1)
    }, []),
  })

  // Reset realtime message count when SWR data is refreshed
  React.useEffect(() => {
    setRealtimeMessageCount(0)
  }, [conversationsWithUnread])

  // Listen for messages-read event from chat page
  React.useEffect(() => {
    const handleMessagesRead = () => {
      setRealtimeMessageCount(0)
      mutateUnreadMessages()
    }
    window.addEventListener('messages-read', handleMessagesRead)
    return () => window.removeEventListener('messages-read', handleMessagesRead)
  }, [mutateUnreadMessages])

  // Combined unread count (SWR + realtime additions)
  const totalUnreadCount = (unreadCount || 0) + realtimeNotificationCount

  // Combined unread message count (SWR + realtime additions)
  const totalUnreadMessages = (conversationsWithUnread || 0) + realtimeMessageCount

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
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
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
        badge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
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
