import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, AlertCircle, Building2, Users, TrendingUp, DollarSign, FileText } from "lucide-react"

interface OnboardingData {
  fundSetup: {
    name: string
    type: string
    inceptionDate: string
    committedCapital: number
    status: string
    fundId: string
  }
  economicTerms: {
    managementFeePercent: number
    carriedInterestPercent: number
    hurdleRate: number
    waterfallStructure: string
  }
  investors: Array<{
    name: string
    type: string
    email: string
    commitment: number
    ownershipPercent: number
    taxId: string
  }>
  investments: Array<{
    name: string
    type: string
    sector: string
    acquisitionDate: string
    acquisitionCost: number
    currentValue: number
  }>
  capitalHistory: Array<{
    investorId: string
    type: "capital_call" | "distribution"
    date: string
    amount: number
    description: string
  }>
  documents: Array<{
    type: string
    file: File | null
    uploadDate: string
  }>
}

interface Step6Props {
  data: OnboardingData
}

export function Step6Review({ data }: Step6Props) {
  // Calculate metrics
  const totalInvestorCommitments = data.investors.reduce((sum, inv) => sum + inv.commitment, 0)
  const totalPortfolioValue = data.investments.reduce((sum, inv) => sum + inv.currentValue, 0)
  const totalAcquisitionCost = data.investments.reduce((sum, inv) => sum + inv.acquisitionCost, 0)
  const totalCapitalCalled = data.capitalHistory
    .filter((t) => t.type === "capital_call")
    .reduce((sum, t) => sum + t.amount, 0)
  const totalDistributions = data.capitalHistory
    .filter((t) => t.type === "distribution")
    .reduce((sum, t) => sum + t.amount, 0)

  // Validation checks
  const validations = [
    {
      check: data.fundSetup.name,
      message: "Fund name is set",
      passed: data.fundSetup.name,
    },
    {
      check: data.fundSetup.committedCapital > 0,
      message: "Fund committed capital is set",
      passed: data.fundSetup.committedCapital > 0,
    },
    {
      check: data.investors.length > 0,
      message: "At least one investor added",
      passed: data.investors.length > 0,
    },
    {
      check: totalInvestorCommitments <= data.fundSetup.committedCapital,
      message: "Investor commitments do not exceed fund size",
      passed: totalInvestorCommitments <= data.fundSetup.committedCapital,
    },
    {
      check: data.investments.length > 0,
      message: "At least one investment added",
      passed: data.investments.length > 0,
    },
    {
      check: data.capitalHistory.length > 0,
      message: "Capital account history recorded",
      passed: data.capitalHistory.length > 0,
    },
  ]

  const allValidationsPassed = validations.every((v) => v.passed)

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      <Card
        className={
          allValidationsPassed
            ? "bg-green-500/5 border-green-500/50"
            : "bg-destructive/5 border-destructive/50"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allValidationsPassed ? (
              <>
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-600">Ready to Complete</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Validation Issues</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {validations.map((validation, index) => (
              <div key={index} className="flex items-center gap-3">
                {validation.passed ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={`text-sm ${
                    validation.passed ? "text-muted-foreground" : "text-destructive"
                  }`}
                >
                  {validation.message}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fund Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Fund Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Fund Name</div>
              <div className="font-semibold">{data.fundSetup.name || "Not set"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Fund ID</div>
              <div className="font-semibold text-muted-foreground italic">Will be auto-generated</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <Badge variant="secondary">{data.fundSetup.type || "Not set"}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant="secondary">{data.fundSetup.status || "Not set"}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Inception Date</div>
              <div className="font-semibold">
                {data.fundSetup.inceptionDate
                  ? new Date(data.fundSetup.inceptionDate).toLocaleDateString()
                  : "Not set"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Committed Capital</div>
              <div className="font-semibold text-primary">
                ${(data.fundSetup.committedCapital / 1000000).toFixed(2)}M
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Management Fee</div>
              <div className="text-xl font-bold text-primary">
                {data.economicTerms.managementFeePercent}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Carried Interest</div>
              <div className="text-xl font-bold text-primary">
                {data.economicTerms.carriedInterestPercent}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Hurdle Rate</div>
              <div className="text-xl font-bold text-primary">{data.economicTerms.hurdleRate}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investors Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Limited Partners ({data.investors.length})
          </CardTitle>
          <CardDescription>
            Total commitments: ${totalInvestorCommitments.toLocaleString()} (
            {data.fundSetup.committedCapital > 0
              ? ((totalInvestorCommitments / data.fundSetup.committedCapital) * 100).toFixed(1)
              : 0}
            % of fund)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.investors.map((investor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/30 rounded"
              >
                <div>
                  <div className="font-medium">{investor.name}</div>
                  <div className="text-xs text-muted-foreground">{investor.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${investor.commitment.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {investor.ownershipPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio ({data.investments.length} Investments)
          </CardTitle>
          <CardDescription>
            Total value: ${(totalPortfolioValue / 1000000).toFixed(2)}M | Cost: $
            {(totalAcquisitionCost / 1000000).toFixed(2)}M
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.investments.map((investment, index) => (
              <div key={index} className="p-3 bg-muted/30 rounded">
                <div className="font-medium">{investment.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="secondary">{investment.type}</Badge>
                  <div className="text-sm font-semibold">
                    ${(investment.currentValue / 1000000).toFixed(2)}M
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Capital Account Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Capital Account Activity
          </CardTitle>
          <CardDescription>{data.capitalHistory.length} transactions recorded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="p-4 bg-destructive/5 rounded">
              <div className="text-2xl font-bold text-destructive">
                ${(totalCapitalCalled / 1000000).toFixed(2)}M
              </div>
              <div className="text-sm text-muted-foreground">Capital Called</div>
            </div>
            <div className="p-4 bg-green-500/5 rounded">
              <div className="text-2xl font-bold text-green-600">
                ${(totalDistributions / 1000000).toFixed(2)}M
              </div>
              <div className="text-sm text-muted-foreground">Distributions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
          <CardDescription>
            {data.documents.length > 0
              ? `${data.documents.length} document(s) ready to upload`
              : "No documents added yet"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Next Steps Info */}
      <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
        <h4 className="font-semibold mb-2">What happens next?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Your fund, investors, and portfolio will be created in Polibit</li>
          <li>• Capital account history will be imported for accurate waterfall calculations</li>
          <li>• Investor portal access will be automatically configured</li>
          <li>• You can begin using reporting, distributions, and waterfall features immediately</li>
        </ul>
      </div>
    </div>
  )
}
