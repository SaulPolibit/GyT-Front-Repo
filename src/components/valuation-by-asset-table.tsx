"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { ValuationByAsset } from "@/lib/nav-calculations"

interface ValuationByAssetTableProps {
  valuationByAsset: ValuationByAsset[]
}

export function ValuationByAssetTable({
  valuationByAsset,
}: ValuationByAssetTableProps) {
  const [showAll, setShowAll] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ValuationByAsset
    direction: 'asc' | 'desc'
  }>({ key: 'currentValue', direction: 'desc' })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const sortedAssets = [...valuationByAsset].sort((a, b) => {
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    return 0
  })

  const displayedAssets = showAll ? sortedAssets : sortedAssets.slice(0, 5)

  const getMethodVariant = (method: string) => {
    switch (method) {
      case 'Market':
        return 'default'
      case 'DCF':
        return 'secondary'
      case 'Comparables':
        return 'outline'
      case 'Cost':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const handleSort = (key: keyof ValuationByAsset) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Holdings by Value</h3>
        {valuationByAsset.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                Show Less <ChevronUp className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                View All ({valuationByAsset.length}) <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Asset Name
                {sortConfig.key === 'name' && (
                  sortConfig.direction === 'desc' ? ' ↓' : ' ↑'
                )}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('type')}
              >
                Type
                {sortConfig.key === 'type' && (
                  sortConfig.direction === 'desc' ? ' ↓' : ' ↑'
                )}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort('currentValue')}
              >
                Value
                {sortConfig.key === 'currentValue' && (
                  sortConfig.direction === 'desc' ? ' ↓' : ' ↑'
                )}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort('percentOfNAV')}
              >
                % of NAV
                {sortConfig.key === 'percentOfNAV' && (
                  sortConfig.direction === 'desc' ? ' ↓' : ' ↑'
                )}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('valuationMethod')}
              >
                Method
                {sortConfig.key === 'valuationMethod' && (
                  sortConfig.direction === 'desc' ? ' ↓' : ' ↑'
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell>{asset.type}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(asset.currentValue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercentage(asset.percentOfNAV)}
                </TableCell>
                <TableCell>
                  <Badge variant={getMethodVariant(asset.valuationMethod)}>
                    {asset.valuationMethod}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
