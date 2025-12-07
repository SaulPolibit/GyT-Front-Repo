"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Percent, TrendingUp, Target, GitBranch, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface WaterfallTier {
  id: string
  description: string
  lpPercent: number
  gpPercent: number
  notes?: string
}

interface EconomicTermsData {
  managementFeePercent: number
  carriedInterestPercent: number
  hurdleRate: number
  waterfallStructure: string
  customWaterfallTiers?: WaterfallTier[]
}

interface Step2Props {
  data: EconomicTermsData
  onChange: (data: Partial<EconomicTermsData>) => void
}

export function Step2EconomicTerms({ data, onChange }: Step2Props) {
  const addCustomTier = () => {
    const currentTiers = data.customWaterfallTiers || []
    const newTier: WaterfallTier = {
      id: `tier-${Date.now()}`,
      description: "",
      lpPercent: 0,
      gpPercent: 0,
      notes: "",
    }
    onChange({ customWaterfallTiers: [...currentTiers, newTier] })
  }

  const removeCustomTier = (tierId: string) => {
    const currentTiers = data.customWaterfallTiers || []
    onChange({
      customWaterfallTiers: currentTiers.filter((tier) => tier.id !== tierId),
    })
  }

  const updateCustomTier = (tierId: string, updates: Partial<WaterfallTier>) => {
    const currentTiers = data.customWaterfallTiers || []
    onChange({
      customWaterfallTiers: currentTiers.map((tier) =>
        tier.id === tierId ? { ...tier, ...updates } : tier
      ),
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Management Fee */}
        <div className="space-y-2">
          <Label htmlFor="managementFee">
            Management Fee <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="managementFee"
              type="number"
              placeholder="2.0"
              value={data.managementFeePercent || ""}
              onChange={(e) => onChange({ managementFeePercent: parseFloat(e.target.value) || 0 })}
              className="pl-10"
              min="0"
              max="5"
              step="0.1"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Annual fee as % of committed capital (typical: 1.5% - 2.5%)
          </p>
        </div>

        {/* Carried Interest */}
        <div className="space-y-2">
          <Label htmlFor="carriedInterest">
            Carried Interest (GP Share) <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="carriedInterest"
              type="number"
              placeholder="20"
              value={data.carriedInterestPercent || ""}
              onChange={(e) => onChange({ carriedInterestPercent: parseFloat(e.target.value) || 0 })}
              className="pl-10"
              min="0"
              max="50"
              step="1"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            GP profit share after hurdle (typical: 15% - 25%)
          </p>
        </div>

        {/* Hurdle Rate */}
        <div className="space-y-2">
          <Label htmlFor="hurdleRate">
            Preferred Return (Hurdle Rate) <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="hurdleRate"
              type="number"
              placeholder="8"
              value={data.hurdleRate || ""}
              onChange={(e) => onChange({ hurdleRate: parseFloat(e.target.value) || 0 })}
              className="pl-10"
              min="0"
              max="20"
              step="0.5"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum annual return to LPs before GP carry (typical: 6% - 10%)
          </p>
        </div>

        {/* Waterfall Structure */}
        <div className="space-y-2">
          <Label htmlFor="waterfallStructure">
            Waterfall Structure <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Select
              value={data.waterfallStructure}
              onValueChange={(value) => onChange({ waterfallStructure: value })}
            >
              <SelectTrigger id="waterfallStructure" className="pl-10">
                <SelectValue placeholder="Select waterfall structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (European 4-Tier)</SelectItem>
                <SelectItem value="american">American (3-Tier)</SelectItem>
                <SelectItem value="custom">Custom Structure</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            How profits are distributed between LPs and GP
          </p>
        </div>
      </div>

      {/* Waterfall Structure Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={data.waterfallStructure === "standard" ? "border-primary" : ""}>
          <CardHeader>
            <CardTitle className="text-base">Standard (European 4-Tier)</CardTitle>
            <CardDescription>Includes GP catch-up provision</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-primary">1.</span>
              <span>Return of capital to LPs</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-primary">2.</span>
              <span>Preferred return to LPs ({data.hurdleRate || 8}% annually)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-primary">3.</span>
              <span>GP catch-up to {data.carriedInterestPercent || 20}%</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-primary">4.</span>
              <span>
                Remaining profits split {100 - (data.carriedInterestPercent || 20)}/
                {data.carriedInterestPercent || 20}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={data.waterfallStructure === "american" ? "border-primary" : ""}>
          <CardHeader>
            <CardTitle className="text-base">American (3-Tier)</CardTitle>
            <CardDescription>No catch-up provision</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-primary">1.</span>
              <span>Return of capital to LPs</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-primary">2.</span>
              <span>Preferred return to LPs ({data.hurdleRate || 8}% annually)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-primary">3.</span>
              <span>
                All remaining profits split {100 - (data.carriedInterestPercent || 20)}/
                {data.carriedInterestPercent || 20}
              </span>
            </div>
            <div className="h-8 flex items-center text-muted-foreground italic">
              (Simpler, but GP gets less carry overall)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Waterfall Structure Builder */}
      {data.waterfallStructure === "custom" && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Custom Waterfall Structure</CardTitle>
                <CardDescription>Define your own distribution tiers</CardDescription>
              </div>
              <Button onClick={addCustomTier} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Tier
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(!data.customWaterfallTiers || data.customWaterfallTiers.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No custom tiers defined yet.</p>
                <p className="text-sm">Click &quot;Add Tier&quot; to create your custom waterfall structure.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {data.customWaterfallTiers.map((tier, index) => (
                  <div key={tier.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-primary">Tier {index + 1}</h4>
                      <Button
                        onClick={() => removeCustomTier(tier.id)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Tier Description */}
                      <div className="space-y-2">
                        <Label htmlFor={`tier-desc-${tier.id}`}>
                          Tier Description <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`tier-desc-${tier.id}`}
                          placeholder='e.g., "Return of capital to LPs" or "GP catch-up to 20%"'
                          value={tier.description}
                          onChange={(e) =>
                            updateCustomTier(tier.id, { description: e.target.value })
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Describe what happens in this tier of the waterfall
                        </p>
                      </div>

                      {/* LP and GP Split */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`tier-lp-${tier.id}`}>
                            LP Share (%) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`tier-lp-${tier.id}`}
                            type="number"
                            placeholder="80"
                            value={tier.lpPercent || ""}
                            onChange={(e) =>
                              updateCustomTier(tier.id, {
                                lpPercent: parseFloat(e.target.value) || 0,
                              })
                            }
                            min="0"
                            max="100"
                            step="1"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`tier-gp-${tier.id}`}>
                            GP Share (%) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`tier-gp-${tier.id}`}
                            type="number"
                            placeholder="20"
                            value={tier.gpPercent || ""}
                            onChange={(e) =>
                              updateCustomTier(tier.id, {
                                gpPercent: parseFloat(e.target.value) || 0,
                              })
                            }
                            min="0"
                            max="100"
                            step="1"
                            required
                          />
                        </div>
                      </div>

                      {/* Validation Display */}
                      {tier.lpPercent + tier.gpPercent !== 100 &&
                        tier.lpPercent > 0 &&
                        tier.gpPercent > 0 && (
                          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            ⚠️ Warning: LP and GP shares should typically add up to 100%. Current
                            total: {tier.lpPercent + tier.gpPercent}%
                          </div>
                        )}

                      {/* Additional Notes */}
                      <div className="space-y-2">
                        <Label htmlFor={`tier-notes-${tier.id}`}>Additional Notes (Optional)</Label>
                        <Textarea
                          id={`tier-notes-${tier.id}`}
                          placeholder="e.g., Conditions, thresholds, or special provisions for this tier"
                          value={tier.notes || ""}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            updateCustomTier(tier.id, { notes: e.target.value })
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Custom Structure Summary */}
                <div className="bg-primary/5 border-l-4 border-primary p-4 rounded mt-4">
                  <h4 className="font-semibold mb-2">Your Custom Waterfall Structure</h4>
                  <div className="space-y-2">
                    {data.customWaterfallTiers.map((tier, index) => (
                      <div key={tier.id} className="flex items-start gap-2 text-sm">
                        <span className="font-semibold text-primary">{index + 1}.</span>
                        <div className="flex-1">
                          <span>{tier.description || "Description pending"}</span>
                          {tier.lpPercent > 0 || tier.gpPercent > 0 ? (
                            <span className="text-muted-foreground ml-2">
                              (LP: {tier.lpPercent}% / GP: {tier.gpPercent}%)
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calculated Economics Preview */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Economic Terms Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {data.managementFeePercent || 0}%
              </div>
              <div className="text-xs text-muted-foreground">Management Fee</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {data.carriedInterestPercent || 0}%
              </div>
              <div className="text-xs text-muted-foreground">Carried Interest</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{data.hurdleRate || 0}%</div>
              <div className="text-xs text-muted-foreground">Hurdle Rate</div>
            </div>
            <div>
              <div className="text-sm font-bold text-primary capitalize">
                {data.waterfallStructure || "Not Set"}
              </div>
              <div className="text-xs text-muted-foreground">Structure</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
        <h4 className="font-semibold mb-2">Why economic terms matter</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • <strong>Management fee</strong> determines quarterly/annual fees charged to the fund
          </li>
          <li>
            • <strong>Carried interest</strong> determines GP profit share after hurdle is met
          </li>
          <li>
            • <strong>Hurdle rate</strong> ensures LPs receive minimum return before GP earns carry
          </li>
          <li>
            • <strong>Waterfall structure</strong> dramatically impacts how profits are distributed
          </li>
        </ul>
      </div>
    </div>
  )
}
