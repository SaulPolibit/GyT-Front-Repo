"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UserPlus, Upload, Mail, DollarSign, Trash2, FileText, AlertCircle } from "lucide-react"

interface Investor {
  name: string
  type: string
  email: string
  commitment: number
  ownershipPercent: number
  taxId: string
}

interface Step3Props {
  data: Investor[]
  onAdd: (investor: Investor) => void
  onRemove: (index: number) => void
  fundCommittedCapital: number
}

export function Step3LimitedPartners({ data, onAdd, onRemove, fundCommittedCapital }: Step3Props) {
  const [formData, setFormData] = useState<Investor>({
    name: "",
    type: "Individual",
    email: "",
    commitment: 0,
    ownershipPercent: 0,
    taxId: "",
  })

  const [bulkImportError, setBulkImportError] = useState<string>("")

  const handleAddInvestor = () => {
    if (!formData.name || !formData.email || formData.commitment <= 0) {
      return
    }

    const ownershipPercent =
      fundCommittedCapital > 0 ? (formData.commitment / fundCommittedCapital) * 100 : 0

    onAdd({
      ...formData,
      ownershipPercent,
    })

    // Reset form
    setFormData({
      name: "",
      type: "Individual",
      email: "",
      commitment: 0,
      ownershipPercent: 0,
      taxId: "",
    })
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())

        // Skip header row
        const dataLines = lines.slice(1)

        dataLines.forEach((line) => {
          const [name, type, email, commitment, taxId] = line.split(",").map((s) => s.trim())

          if (name && email && commitment) {
            const commitmentNum = parseFloat(commitment)
            const ownershipPercent =
              fundCommittedCapital > 0 ? (commitmentNum / fundCommittedCapital) * 100 : 0

            onAdd({
              name,
              type: type || "Individual",
              email,
              commitment: commitmentNum,
              ownershipPercent,
              taxId: taxId || "",
            })
          }
        })

        setBulkImportError("")
      } catch (error) {
        setBulkImportError("Error parsing CSV file. Please check the format.")
      }
    }
    reader.readAsText(file)
  }

  const totalCommitments = data.reduce((sum, investor) => sum + investor.commitment, 0)
  const allocationPercentage =
    fundCommittedCapital > 0 ? (totalCommitments / fundCommittedCapital) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Add Individual Investor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Individual Investor
          </CardTitle>
          <CardDescription>Enter investor details one at a time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="investorName">Investor Name *</Label>
              <Input
                id="investorName"
                placeholder="e.g., John Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investorType">Investor Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="investorType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Institution">Institution</SelectItem>
                  <SelectItem value="Family Office">Family Office</SelectItem>
                  <SelectItem value="Endowment">Endowment</SelectItem>
                  <SelectItem value="Pension Fund">Pension Fund</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investorEmail">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="investorEmail"
                  type="email"
                  placeholder="investor@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investorCommitment">Capital Commitment *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="investorCommitment"
                  type="number"
                  placeholder="1000000"
                  value={formData.commitment || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, commitment: parseFloat(e.target.value) || 0 })
                  }
                  className="pl-10"
                  min="0"
                  step="100000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investorTaxId">Tax ID / EIN</Label>
              <Input
                id="investorTaxId"
                placeholder="XX-XXXXXXX"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleAddInvestor} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Investor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk CSV Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import from CSV
          </CardTitle>
          <CardDescription>Upload a CSV file with multiple investors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csvUpload">Upload CSV File</Label>
            <Input
              id="csvUpload"
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="mt-2"
            />
            {bulkImportError && (
              <div className="flex items-start gap-2 mt-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>{bulkImportError}</span>
              </div>
            )}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              <span className="font-semibold">CSV Format:</span>
            </div>
            <code className="text-xs">
              Name, Type, Email, Commitment, TaxID
              <br />
              John Smith, Individual, john@example.com, 1000000, 12-3456789
              <br />
              ABC Corp, Institution, contact@abc.com, 5000000, 98-7654321
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Investor List */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Limited Partners ({data.length})</CardTitle>
            <CardDescription>
              Total commitments: ${totalCommitments.toLocaleString()} (
              {allocationPercentage.toFixed(1)}% of fund)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Commitment</TableHead>
                  <TableHead className="text-right">Ownership %</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((investor, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{investor.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{investor.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{investor.email}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${investor.commitment.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {investor.ownershipPercent.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Validation Warning */}
      {allocationPercentage > 100 && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h4 className="font-semibold text-destructive">Over-committed</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Total investor commitments (${totalCommitments.toLocaleString()}) exceed fund size (
                ${fundCommittedCapital.toLocaleString()}). Please adjust commitments or fund size.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
        <h4 className="font-semibold mb-2">Why investor data matters</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • <strong>Commitments</strong> determine each LP's ownership percentage and capital
            call amounts
          </li>
          <li>
            • <strong>Ownership %</strong> is used to calculate profit distributions in waterfall
          </li>
          <li>
            • <strong>Tax ID</strong> is required for K-1 tax form generation
          </li>
          <li>
            • <strong>Email</strong> is used for investor portal access and communications
          </li>
        </ul>
      </div>
    </div>
  )
}
