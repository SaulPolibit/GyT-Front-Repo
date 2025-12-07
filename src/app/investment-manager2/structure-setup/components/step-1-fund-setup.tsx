import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Calendar, DollarSign } from "lucide-react"

interface FundSetupData {
  name: string
  type: string
  inceptionDate: string
  committedCapital: number
  status: string
  fundId: string
}

interface Step1Props {
  data: FundSetupData
  onChange: (data: Partial<FundSetupData>) => void
}

export function Step1FundSetup({ data, onChange }: Step1Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fund Name */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="fundName">
            Fund Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="fundName"
              placeholder="e.g., Growth Capital Fund I"
              value={data.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="pl-10"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The official name of your fund as it appears in legal documents
          </p>
        </div>

        {/* Fund Type */}
        <div className="space-y-2">
          <Label htmlFor="fundType">
            Fund Type <span className="text-destructive">*</span>
          </Label>
          <Select value={data.type} onValueChange={(value) => onChange({ type: value })}>
            <SelectTrigger id="fundType">
              <SelectValue placeholder="Select fund type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Real Estate">Real Estate</SelectItem>
              <SelectItem value="Private Equity">Private Equity</SelectItem>
              <SelectItem value="Private Debt">Private Debt</SelectItem>
              <SelectItem value="Multi-Strategy">Multi-Strategy</SelectItem>
              <SelectItem value="Venture Capital">Venture Capital</SelectItem>
              <SelectItem value="Infrastructure">Infrastructure</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Primary asset class or investment strategy
          </p>
        </div>

        {/* Inception Date */}
        <div className="space-y-2">
          <Label htmlFor="inceptionDate">
            Inception Date <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="inceptionDate"
              type="date"
              value={data.inceptionDate}
              onChange={(e) => onChange({ inceptionDate: e.target.value })}
              className="pl-10"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Date when the fund was legally formed
          </p>
        </div>

        {/* Total Committed Capital */}
        <div className="space-y-2">
          <Label htmlFor="committedCapital">
            Total Committed Capital <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="committedCapital"
              type="number"
              placeholder="100000000"
              value={data.committedCapital || ""}
              onChange={(e) => onChange({ committedCapital: parseFloat(e.target.value) || 0 })}
              className="pl-10"
              min="0"
              step="1000000"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Total capital commitments from all Limited Partners (LPs)
          </p>
        </div>

        {/* Fund Status */}
        <div className="space-y-2">
          <Label htmlFor="status">
            Current Status <span className="text-destructive">*</span>
          </Label>
          <Select value={data.status} onValueChange={(value) => onChange({ status: value })}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fundraising">Fundraising</SelectItem>
              <SelectItem value="Active">Active (Investment Period)</SelectItem>
              <SelectItem value="Harvesting">Harvesting (Post-Investment)</SelectItem>
              <SelectItem value="Liquidating">Liquidating</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Current lifecycle stage of the fund
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
        <h4 className="font-semibold mb-2">Why this information matters</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Fund name</strong> will appear on all investor reports and statements (a unique Fund ID will be auto-generated)</li>
          <li>• <strong>Fund type</strong> determines appropriate benchmarks and compliance requirements</li>
          <li>• <strong>Inception date</strong> is critical for calculating IRR and preferred return accruals</li>
          <li>• <strong>Committed capital</strong> establishes ownership percentages and capital call limits</li>
        </ul>
      </div>
    </div>
  )
}
