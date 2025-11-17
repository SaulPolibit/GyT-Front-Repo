'use client'

import * as React from 'react'
import { IconChevronDown, IconChevronRight, IconFolder, IconChartBar } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

interface DashboardSectionHeaderProps {
  title: string
  collapsed: boolean
  onToggle: () => void
  structureId: string
}

export function DashboardSectionHeader({ title, collapsed, onToggle, structureId }: DashboardSectionHeaderProps) {
  const isAllStructures = structureId === 'all'

  return (
    <div className="px-4 lg:px-6 mb-4">
      <div className="flex items-center gap-3 py-3 px-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onToggle}
        >
          {collapsed ? (
            <IconChevronRight className="h-5 w-5" />
          ) : (
            <IconChevronDown className="h-5 w-5" />
          )}
        </Button>

        <div className="flex items-center gap-2 flex-1">
          {isAllStructures ? (
            <IconChartBar className="h-5 w-5 text-primary" />
          ) : (
            <IconFolder className="h-5 w-5 text-primary" />
          )}
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
      </div>
    </div>
  )
}
