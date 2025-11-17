"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, DollarSign, Calendar, Trash2, TrendingUp, TrendingDown } from "lucide-react"

interface Investment {
  name: string
  type: string
  sector: string
  acquisitionDate: string
  acquisitionCost: number
  currentValue: number
}

interface Step4Props {
  data: Investment[]
  onAdd: (investment: Investment) => void
  onRemove: (index: number) => void
}

export function Step4Portfolio({ data, onAdd, onRemove }: Step4Props) {
  const [formData, setFormData] = useState<Investment>({
    name: "",
    type: "Real Estate",
    sector: "",
    acquisitionDate: "",
    acquisitionCost: 0,
    currentValue: 0,
  })

  const handleAddInvestment = () => {
    if (!formData.name || !formData.acquisitionDate || formData.acquisitionCost <= 0) {
      return
    }

    onAdd(formData)

    // Reset form
    setFormData({
      name: "",
      type: "Real Estate",
      sector: "",
      acquisitionDate: "",
      acquisitionCost: 0,
      currentValue: 0,
    })
  }

  const totalAcquisitionCost = data.reduce((sum, inv) => sum + inv.acquisitionCost, 0)
  const totalCurrentValue = data.reduce((sum, inv) => sum + inv.currentValue, 0)
  const totalUnrealizedGain = totalCurrentValue - totalAcquisitionCost
  const portfolioReturn = totalAcquisitionCost > 0 ? (totalUnrealizedGain / totalAcquisitionCost) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Add Individual Investment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Portfolio Investment
          </CardTitle>
          <CardDescription>Add investments one at a time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="investmentName">Investment Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="investmentName"
                  placeholder="e.g., Downtown Office Tower"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentType">Investment Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="investmentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Private Equity">Private Equity</SelectItem>
                  <SelectItem value="Private Debt">Private Debt</SelectItem>
                  <SelectItem value="Venture Capital">Venture Capital</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Sector / Industry *</Label>
              <Input
                id="sector"
                placeholder="e.g., Office, Technology, Healthcare"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">Acquisition Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="acquisitionDate"
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionCost">Acquisition Cost *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="acquisitionCost"
                  type="number"
                  placeholder="5000000"
                  value={formData.acquisitionCost || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, acquisitionCost: parseFloat(e.target.value) || 0 })
                  }
                  className="pl-10"
                  min="0"
                  step="100000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentValue"
                  type="number"
                  placeholder="6000000"
                  value={formData.currentValue || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })
                  }
                  className="pl-10"
                  min="0"
                  step="100000"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave blank if same as acquisition cost
              </p>
            </div>
          </div>

          <Button onClick={handleAddInvestment} className="w-full mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Investment
          </Button>
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      {data.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{data.length}</div>
                <div className="text-xs text-muted-foreground">Investments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  ${(totalAcquisitionCost / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-muted-foreground">Total Invested</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  ${(totalCurrentValue / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-muted-foreground">Current Value</div>
              </div>
              <div>
                <div
                  className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                    portfolioReturn >= 0 ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {portfolioReturn >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  {portfolioReturn.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Return</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investment List */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Investments ({data.length})</CardTitle>
            <CardDescription>All investments in your fund</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Acq. Date</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((investment, index) => {
                  const gain = investment.currentValue - investment.acquisitionCost
                  const gainPercent =
                    investment.acquisitionCost > 0
                      ? (gain / investment.acquisitionCost) * 100
                      : 0

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{investment.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{investment.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {investment.sector}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(investment.acquisitionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(investment.acquisitionCost / 1000000).toFixed(2)}M
                      </TableCell>
                      <TableCell className="text-right">
                        ${(investment.currentValue / 1000000).toFixed(2)}M
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={gain >= 0 ? "text-green-600" : "text-destructive"}>
                          {gain >= 0 ? "+" : ""}
                          {gainPercent.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
        <h4 className="font-semibold mb-2">Why investment data matters</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • <strong>Acquisition cost</strong> is your fund's basis for calculating returns and
            taxes
          </li>
          <li>
            • <strong>Current value</strong> determines NAV and is used in performance calculations
          </li>
          <li>
            • <strong>Acquisition date</strong> is critical for IRR calculations and holding period
          </li>
          <li>
            • <strong>Sector/Type</strong> data enables portfolio diversification analysis
          </li>
        </ul>
      </div>
    </div>
  )
}
