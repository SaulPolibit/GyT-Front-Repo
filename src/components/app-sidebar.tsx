"use client"

import * as React from "react"
import {
  IconBuilding,
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconMessage,
  IconCurrencyDollar,
  IconChartLine,
} from "@tabler/icons-react"

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
import { getFirmSettings, FirmSettings } from "@/lib/firm-settings-storage"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSearchClick?: () => void
}

export function AppSidebar({ onSearchClick, ...props }: AppSidebarProps) {
  const { t } = useTranslation()
  const [firmSettings, setFirmSettings] = React.useState<FirmSettings | null>(null)

  React.useEffect(() => {
    setFirmSettings(getFirmSettings())
  }, [])

  const data = {
    navMain: [
      {
        title: t.nav.dashboard,
        url: "/investment-manager",
        icon: IconDashboard,
      },
      {
        title: t.nav.structures,
        url: "/investment-manager/structures",
        icon: IconBuilding,
      },
      {
        title: t.nav.investments,
        url: "/investment-manager/investments",
        icon: IconListDetails,
      },
      {
        title: t.nav.investors,
        url: "/investment-manager/investors",
        icon: IconUsers,
      },
      {
        title: t.nav.reports,
        url: "/investment-manager/reports",
        icon: IconFolder,
      },
      {
        title: t.nav.performance,
        url: "/investment-manager/reports/performance",
        icon: IconChartLine,
      },
      {
        title: t.nav.documents,
        url: "/investment-manager/documents",
        icon: IconFileDescription,
      },
      {
        title: t.nav.chat,
        url: "/investment-manager/chat",
        icon: IconMessage,
      },
    ],
    navManagement: [
      {
        title: t.nav.capital,
        icon: IconCurrencyDollar,
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
        icon: IconFileAi,
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
    navClouds: [
      {
        title: t.nav.capital,
        icon: IconCurrencyDollar,
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
        icon: IconFileAi,
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
        icon: IconSettings,
      },
      {
        title: t.nav.getHelp,
        url: "/investment-manager/help",
        icon: IconHelp,
      },
      {
        title: t.nav.search,
        url: "#",
        icon: IconSearch,
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
                <a href="#">
                  {firmSettings?.firmLogo ? (
                    <img
                      src={firmSettings.firmLogo}
                      alt="Firm logo"
                      className="!size-5 object-contain rounded"
                    />
                  ) : (
                    <IconInnerShadowTop className="!size-5" />
                  )}
                  <span className="text-base font-semibold">
                    {firmSettings?.firmName || 'Polibit'}
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto">
          <NavMain items={data.navMain} />
          <NavManagement items={data.navManagement} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter className="shrink-0">
          <NavUser />
        </SidebarFooter>
      </Sidebar>
  )
}
