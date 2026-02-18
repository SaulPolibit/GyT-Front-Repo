"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  onSearchClick,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    onClick?: () => void
    badge?: number
  }[]
  onSearchClick?: () => void
} & Omit<React.ComponentPropsWithoutRef<typeof SidebarGroup>, 'onSearchClick'>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.onClick ? (
                <SidebarMenuButton onClick={item.onClick}>
                  <item.icon />
                  <span>{item.title}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <SidebarMenuBadge className="bg-muted-foreground/20 text-muted-foreground">
                      {item.badge > 99 ? '99+' : item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <SidebarMenuBadge className="bg-muted-foreground/20 text-muted-foreground">
                        {item.badge > 99 ? '99+' : item.badge}
                      </SidebarMenuBadge>
                    )}
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
