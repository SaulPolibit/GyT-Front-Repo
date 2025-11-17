"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownToLine, ArrowUpFromLine, Calendar, DollarSign, FileText, AlertCircle } from "lucide-react"

interface CapitalHistoryEntry {
  investorId: string
  type: "capital_call" | "distribution"
  date: string
  amount: number
  description: string
}

interface Investor {
  name: string
  type: string
  email: string
  commitment: number
  ownershipPercent: number
  taxId: string
}

interface Step5Props {
  data: CapitalHistoryEntry[]
  onAdd: (entry: CapitalHistoryEntry) => void
  investors: Investor[]
}

export function Step5CapitalHistory({ data, onAdd, investors }: Step5Props) {
  const [formData, setFormData] = useState<CapitalHistoryEntry>({
    investorId: "",
    type: "capital_call",
    date: "",
    amount: 0,
    description: "",
  })

  const handleAddTransaction = () => {
    if (!formData.investorId || !formData.date || formData.amount <= 0) {
      return
    }

    onAdd(formData)

    // Reset form
    setFormData({
      investorId: "",
      type: "capital_call",
      date: "",
      amount: 0,
      description: "",
    })
  }

  // Calculate investor summaries
  const investorSummaries = investors.map((investor, index) => {
    const investorTransactions = data.filter((entry) => entry.investorId === index.toString())
    const capitalCalls = investorTransactions
      .filter((t) => t.type === "capital_call")
      .reduce((sum, t) => sum + t.amount, 0)
    const distributions = investorTransactions
      .filter((t) => t.type === "distribution")
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      investorId: index.toString(),
      name: investor.name,
      commitment: investor.commitment,
      capitalCalled: capitalCalls,
      distributionsReceived: distributions,
      uncalledCapital: investor.commitment - capitalCalls,
      netCashFlow: capitalCalls - distributions,
    }
  })

  const totalCapitalCalled = data
    .filter((t) => t.type === "capital_call")
    .reduce((sum, t) => sum + t.amount, 0)
  const totalDistributions = data
    .filter((t) => t.type === "distribution")
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Warning if no investors */}
      {investors.length === 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-1">No investors added yet</h4>
                <p className="text-sm text-muted-foreground">
                  Please add investors in Step 3 before recording capital account transactions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Transaction Form */}
      {investors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Transaction</CardTitle>
            <CardDescription>Record capital calls and distributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="transactionInvestor">Select Investor *</Label>
                <Select
                  value={formData.investorId}
                  onValueChange={(value) => setFormData({ ...formData, investorId: value })}
                >
                  <SelectTrigger id="transactionInvestor">
                    <SelectValue placeholder="Choose an investor" />
                  </SelectTrigger>
                  <SelectContent>
                    {investors.map((investor, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {investor.name} - {investor.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionType">Transaction Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as "capital_call" | "distribution" })
                  }
                >
                  <SelectTrigger id="transactionType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="capital_call">
                      <div className="flex items-center gap-2">
                        <ArrowDownToLine className="h-4 w-4 text-destructive" />
                        <span>Capital Call (LP → Fund)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="distribution">
                      <div className="flex items-center gap-2">
                        <ArrowUpFromLine className="h-4 w-4 text-green-600" />
                        <span>Distribution (Fund → LP)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionDate">Transaction Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="transactionDate"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionAmount">Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="transactionAmount"
                    type="number"
                    placeholder="500000"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="pl-10"
                    min="0"
                    step="10000"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="transactionDescription">Description / Memo</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="transactionDescription"
                    placeholder="e.g., Q1 2024 Capital Call, Distribution from Property Sale"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleAddTransaction} className="w-full mt-4">
              Add Transaction
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                ${(totalCapitalCalled / 1000000).toFixed(2)}M
              </div>
              <div className="text-sm text-muted-foreground">Total Capital Called</div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/5">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                ${(totalDistributions / 1000000).toFixed(2)}M
              </div>
              <div className="text-sm text-muted-foreground">Total Distributions</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold mb-1">{data.length}</div>
              <div className="text-sm text-muted-foreground">Total Transactions</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs: Transaction History vs Investor Summaries */}
      {data.length > 0 && (
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
            <TabsTrigger value="summaries">Investor Summaries</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History ({data.length})</CardTitle>
                <CardDescription>All capital calls and distributions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Investor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((transaction, index) => {
                      const investor = investors[parseInt(transaction.investorId)]
                      return (
                        <TableRow key={index}>
                          <TableCell className="text-sm">
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">{investor?.name || "Unknown"}</TableCell>
                          <TableCell>
                            {transaction.type === "capital_call" ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <ArrowDownToLine className="h-3 w-3" />
                                Capital Call
                              </Badge>
                            ) : (
                              <Badge className="flex items-center gap-1 w-fit bg-green-600">
                                <ArrowUpFromLine className="h-3 w-3" />
                                Distribution
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transaction.description || "-"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summaries">
            <Card>
              <CardHeader>
                <CardTitle>Investor Capital Account Summaries</CardTitle>
                <CardDescription>Aggregated capital account data by investor</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead className="text-right">Commitment</TableHead>
                      <TableHead className="text-right">Called</TableHead>
                      <TableHead className="text-right">Uncalled</TableHead>
                      <TableHead className="text-right">Distributions</TableHead>
                      <TableHead className="text-right">Net Cash Flow</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investorSummaries.map((summary) => (
                      <TableRow key={summary.investorId}>
                        <TableCell className="font-medium">{summary.name}</TableCell>
                        <TableCell className="text-right">
                          ${summary.commitment.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${summary.capitalCalled.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${summary.uncalledCapital.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${summary.distributionsReceived.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span
                            className={
                              summary.netCashFlow > 0 ? "text-primary" : "text-green-600"
                            }
                          >
                            ${Math.abs(summary.netCashFlow).toLocaleString()}
                            {summary.netCashFlow > 0 ? " in" : " out"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Info Box */}
      <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
        <h4 className="font-semibold mb-2">Why capital account history is critical</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • <strong>Waterfall calculations</strong> require accurate capital account data to
            determine return of capital and preferred return tiers
          </li>
          <li>
            • <strong>Capital called</strong> determines how much investors have contributed vs
            their commitment
          </li>
          <li>
            • <strong>Distributions</strong> are used to calculate investor returns and tax
            reporting
          </li>
          <li>
            • <strong>Transaction history</strong> provides audit trail for compliance and investor
            reporting
          </li>
        </ul>
      </div>
    </div>
  )
}
