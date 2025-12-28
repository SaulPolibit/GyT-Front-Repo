'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  IconBuilding,
  IconFileDescription,
  IconChartLine,
  IconMail,
  IconCurrencyDollar,
  IconHelp,
  IconSettings,
  IconLayoutDashboard,
  IconBriefcase,
} from '@tabler/icons-react'
import { getInvestorByEmail, getCurrentInvestorEmail, getInvestorStructures } from '@/lib/lp-portal-helpers'

interface LPSearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LPSearchCommand({ open, onOpenChange }: LPSearchCommandProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [investor, setInvestor] = React.useState<any>(null)
  const [structures, setStructures] = React.useState<any[]>([])

  // Check environment variables for feature visibility
  const showDashboardReports = process.env.NEXT_PUBLIC_SHOW_DASHBOARD_REPORTS !== 'false'
  const showManagementSection = process.env.NEXT_PUBLIC_SHOW_MANAGEMENT_SECTION !== 'false'

  React.useEffect(() => {
    const email = getCurrentInvestorEmail()
    const inv = getInvestorByEmail(email)
    if (inv) {
      setInvestor(inv)
      setStructures(getInvestorStructures(inv))
    }
  }, [])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  // Filter structures based on search query
  const filteredStructures = structures.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Mock documents data - in production this would come from storage
  const documents = [
    { id: '1', name: 'Q4 2024 Quarterly Report', type: 'Financial Report', structureId: 'polibit-real-estate-i' },
    { id: '2', name: 'Limited Partnership Agreement', type: 'Legal Document', structureId: 'polibit-real-estate-i' },
    { id: '3', name: 'Private Placement Memorandum', type: 'Offering Document', structureId: 'polibit-real-estate-i' },
    { id: '4', name: 'Subscription Agreement', type: 'Legal Document', structureId: 'polibit-real-estate-i' },
    { id: '5', name: 'K-1 Tax Form 2024', type: 'Tax Document', structureId: 'polibit-real-estate-i' },
  ]

  const filteredDocuments = documents.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Navigation pages for LP Portal - filtered by feature visibility
  const allPages = [
    { name: 'Dashboard', url: '/lp-portal/dashboard', icon: IconLayoutDashboard },
    { name: 'Portfolio', url: '/lp-portal/portfolio', icon: IconBriefcase },
    { name: 'Reports', url: '/lp-portal/reports', icon: IconFileDescription },
    { name: 'Documents', url: '/lp-portal/documents', icon: IconFileDescription },
    { name: 'Chat', url: '/lp-portal/chat', icon: IconMail },
    { name: 'Commitments', url: '/lp-portal/commitments', icon: IconChartLine },
    { name: 'Activity', url: '/lp-portal/activity', icon: IconChartLine },
    { name: 'Capital Calls', url: '/lp-portal/capital-calls', icon: IconCurrencyDollar },
    { name: 'Distributions', url: '/lp-portal/distributions', icon: IconCurrencyDollar },
    { name: 'Settings', url: '/lp-portal/settings', icon: IconSettings },
    { name: 'Get Help', url: '/lp-portal/help', icon: IconHelp },
  ]

  // Filter pages based on environment variables
  const visiblePages = allPages.filter(page => {
    // Hide Dashboard and Reports if disabled
    if (!showDashboardReports && (page.name === 'Dashboard' || page.name === 'Reports')) {
      return false
    }
    // Hide Management section pages if disabled
    if (!showManagementSection && ['Commitments', 'Activity', 'Capital Calls', 'Distributions'].includes(page.name)) {
      return false
    }
    return true
  })

  const filteredPages = visiblePages.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (url: string) => {
    onOpenChange(false)
    router.push(url)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search structures, investments, investors, documents..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {filteredPages.length > 0 && (
          <CommandGroup heading="Pages">
            {filteredPages.map((page) => {
              const Icon = page.icon
              return (
                <CommandItem
                  key={page.url}
                  onSelect={() => handleSelect(page.url)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{page.name}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {filteredStructures.length > 0 && (
          <CommandGroup heading="Structures">
            {filteredStructures.map((structure) => (
              <CommandItem
                key={structure.id}
                onSelect={() => handleSelect(`/lp-portal/portfolio/${structure.id}`)}
              >
                <IconBuilding className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{structure.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {structure.type} • ${structure.commitment.toLocaleString()} commitment
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredDocuments.length > 0 && (
          <CommandGroup heading="Documents">
            {filteredDocuments.map((doc) => (
              <CommandItem
                key={doc.id}
                onSelect={() => handleSelect('/lp-portal/documents')}
              >
                <IconFileDescription className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{doc.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {doc.type}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
