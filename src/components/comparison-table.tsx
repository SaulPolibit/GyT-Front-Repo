'use client'

import * as React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getStructures } from '@/lib/structures-storage'
import { calculateMetric } from '@/lib/metric-calculations'

export function ComparisonTable() {
  const structures = getStructures()

  // Calculate metrics for each structure
  const structureMetrics = structures.map(structure => {
    const totalValue = calculateMetric('total-investment-value', structure.id)
    const irr = calculateMetric('average-irr', structure.id)
    const investorCount = calculateMetric('investor-count', structure.id)
    const commitment = calculateMetric('total-commitment', structure.id)

    return {
      id: structure.id,
      name: structure.name,
      type: structure.type,
      totalValue,
      irr,
      investorCount,
      commitment,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Structures Comparison</CardTitle>
        <CardDescription>
          Compare key metrics across all fund structures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Structure</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold text-right">Total Value</TableHead>
                <TableHead className="font-semibold text-right">IRR</TableHead>
                <TableHead className="font-semibold text-right">Investors</TableHead>
                <TableHead className="font-semibold text-right">Commitment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {structureMetrics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No structures found. Create a structure to see comparison data.
                  </TableCell>
                </TableRow>
              ) : (
                structureMetrics.map(structure => (
                  <TableRow key={structure.id}>
                    <TableCell className="font-medium">{structure.name}</TableCell>
                    <TableCell className="capitalize">{structure.type}</TableCell>
                    <TableCell className="text-right font-mono">
                      {structure.totalValue.value}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {structure.irr.value}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {structure.investorCount.value}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {structure.commitment.value}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
