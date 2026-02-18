"use client"

import * as React from "react"
import {
  Building2,
  Camera,
  BarChart3,
  LayoutDashboard,
  Database,
  Sparkles,
  FileText,
  FileText as FileWord,
  Folder,
  HelpCircle,
  Share2,
  List,
  FileText as Report,
  Search,
  Settings,
  Users,
  MessageSquare,
  DollarSign,
  TrendingUp,
  CheckCircle,
  CreditCard,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavManagement } from "@/components/nav-management"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useTranslation } from "@/hooks/useTranslation"
import { getCurrentUser } from "@/lib/auth-storage"
import { useFirmLogo } from "@/lib/swr-hooks"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSearchClick?: () => void
}

export function AppSidebar({ onSearchClick, ...props }: AppSidebarProps) {
  const { t } = useTranslation()
  const currentUser = getCurrentUser()

  // Use SWR for cached firm logo (reduces API requests)
  const { firmLogo } = useFirmLogo()

  const isRootUser = currentUser?.role === 0
  const isAdminOrRoot = currentUser?.role === 0 || currentUser?.role === 1

  const data = {
    navMain: [
      // Dashboard - root and admin
      ...(isAdminOrRoot ? [{
        title: t.nav.dashboard,
        url: "/investment-manager",
        icon: LayoutDashboard,
      }] : []),
      {
        title: t.nav.structures,
        url: "/investment-manager/structures",
        icon: Building2,
      },
      {
        title: t.nav.investments,
        url: "/investment-manager/investments",
        icon: List,
      },
      {
        title: t.nav.investors,
        url: "/investment-manager/investors",
        icon: Users,
      },
      {
        title: "Approvals",
        url: "/investment-manager/approvals",
        icon: CheckCircle,
      },
      // Settings - root and admin have access to subscription tab
      ...(isAdminOrRoot ? [{
        title: "Settings",
        url: "/investment-manager/settings?tab=subscription",
        icon: Settings,
      }] : []),
      // Reports - root only
      ...(isRootUser ? [{
        title: t.nav.reports,
        url: "/investment-manager/reports",
        icon: Folder,
      }] : []),
      // Performance - root only
      ...(isRootUser ? [{
        title: t.nav.performance,
        url: "/investment-manager/reports/performance",
        icon: TrendingUp,
      }] : []),
      {
        title: t.nav.documents,
        url: "/investment-manager/documents",
        icon: FileText,
      },
      {
        title: t.nav.chat,
        url: "/investment-manager/chat",
        icon: MessageSquare,
      },
    ],
    navManagement: [
      {
        title: t.nav.capital,
        icon: DollarSign,
        isActive: true,
        url: "#",
        items: [
          {
            title: t.nav.commitments,
            url: "/investment-manager/capital-overview/commitments",
          },
          {
            title: t.nav.activity,
            url: "/investment-manager/capital-overview/activity",
          },
        ],
      },
      {
        title: t.nav.operations,
        icon: Sparkles,
        url: "#",
        items: [
          {
            title: t.nav.capitalCalls,
            url: "/investment-manager/operations/capital-calls",
          },
          {
            title: t.nav.distributions,
            url: "/investment-manager/operations/distributions",
          },
          ...(currentUser?.role === 0 ? [{
            title: "Contracts Management",
            url: "/investment-manager/operations/contracts-management",
          }] : []),
        ],
      },
    ],
    navClouds: [
      {
        title: t.nav.capital,
        icon: DollarSign,
        isActive: true,
        url: "#",
        items: [
          {
            title: t.nav.commitments,
            url: "/investment-manager/capital-overview/commitments",
          },
          {
            title: t.nav.activity,
            url: "/investment-manager/capital-overview/activity",
          },
        ],
      },
      {
        title: t.nav.operations,
        icon: Sparkles,
        url: "#",
        items: [
          {
            title: t.nav.capitalCalls,
            url: "/investment-manager/operations/capital-calls",
          },
          {
            title: t.nav.distributions,
            url: "/investment-manager/operations/distributions",
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: t.nav.settings,
        url: "/investment-manager/settings",
        icon: Settings,
      },
      {
        title: t.nav.getHelp,
        url: "/investment-manager/help",
        icon: HelpCircle,
      },
      {
        title: t.nav.search,
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
                <a href="#" className="flex items-center justify-center">
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
          {isRootUser && <NavManagement items={data.navManagement} />}
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter className="shrink-0">
          <NavUser />
        </SidebarFooter>
      </Sidebar>
  )
}
