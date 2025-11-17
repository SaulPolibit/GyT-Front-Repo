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
  IconListDetails,
  IconUsers,
  IconFileDescription,
  IconFolder,
  IconMessage,
  IconCurrencyDollar,
  IconChartLine,
} from '@tabler/icons-react'
import { getStructures } from '@/lib/structures-storage'
import { getInvestments } from '@/lib/investments-storage'
import { getInvestors } from '@/lib/investors-storage'

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState('')

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

  const structures = getStructures()
  const investments = getInvestments()
  const investors = getInvestors()

  // Mock documents data
  const documents = [
    { id: '1', name: 'Q4 2024 Quarterly Report', type: 'Financial Report', structureId: '1' },
    { id: '2', name: 'Limited Partnership Agreement', type: 'Legal Document', structureId: '1' },
    { id: '3', name: 'Private Placement Memorandum', type: 'Legal Document', structureId: '1' },
  ]

  // Filter results based on search query
  const filteredStructures = structures.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredInvestments = investments.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.sector?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredInvestors = investors.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDocuments = documents.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Navigation pages
  const pages = [
    { name: 'Dashboard', url: '/investment-manager', icon: IconChartLine },
    { name: 'Structures', url: '/investment-manager/structures', icon: IconBuilding },
    { name: 'Investments', url: '/investment-manager/investments', icon: IconListDetails },
    { name: 'Investors', url: '/investment-manager/investors', icon: IconUsers },
    { name: 'Reports', url: '/investment-manager/reports', icon: IconFolder },
    { name: 'Documents', url: '/investment-manager/documents', icon: IconFileDescription },
    { name: 'Chat', url: '/investment-manager/chat', icon: IconMessage },
    { name: 'Capital Calls', url: '/investment-manager/operations/capital-calls', icon: IconCurrencyDollar },
    { name: 'Distributions', url: '/investment-manager/operations/distributions', icon: IconCurrencyDollar },
  ]

  const filteredPages = pages.filter(p =>
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
                onSelect={() => handleSelect(`/investment-manager/structures/${structure.id}`)}
              >
                <IconBuilding className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{structure.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {structure.type} • {structure.jurisdiction}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredInvestments.length > 0 && (
          <CommandGroup heading="Investments">
            {filteredInvestments.map((investment) => (
              <CommandItem
                key={investment.id}
                onSelect={() => handleSelect(`/investment-manager/investments/${investment.id}`)}
              >
                <IconListDetails className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{investment.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {investment.type} • {investment.sector}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredInvestors.length > 0 && (
          <CommandGroup heading="Investors">
            {filteredInvestors.map((investor) => (
              <CommandItem
                key={investor.id}
                onSelect={() => handleSelect(`/investment-manager/investors/${investor.id}`)}
              >
                <IconUsers className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{investor.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {investor.email}
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
                onSelect={() => handleSelect('/investment-manager/documents')}
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
