"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Info, CheckCircle2, AlertCircle } from 'lucide-react'
import { getStructureById, updateStructure } from '@/lib/structures-storage'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string; childSlug: string }>
}

export default function EditChildStructurePage({ params }: PageProps) {
  const router = useRouter()
  const [parentId, setParentId] = useState<string>('')
  const [childSlug, setChildSlug] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as 'active' | 'fundraising' | 'closed',
    totalCommitment: 0,
    investors: 0,
    managementFee: '',
    performanceFee: '',
    hurdleRate: '',
    preferredReturn: '',
    waterfallStructure: '',
    distributionFrequency: '',
    // Hierarchy fields
    hierarchyMode: false,
    hierarchySetupApproach: 'all-at-once' as 'all-at-once' | 'incremental',
    hierarchyLevels: 2,
    hierarchyStructures: [] as {
      level: number
      name: string
      type: string
      applyWaterfall: boolean
      waterfallAlgorithm: 'american' | 'european' | null
      applyEconomicTerms: boolean
    }[]
  })

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setParentId(resolvedParams.id)
      setChildSlug(resolvedParams.childSlug)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!childSlug) return

    const structure = getStructureById(childSlug)
    if (!structure) {
      setError('Structure not found')
      setLoading(false)
      return
    }

    // Initialize form with existing structure data
    setFormData({
      name: structure.name,
      status: structure.status,
      totalCommitment: structure.totalCommitment,
      investors: structure.investors,
      managementFee: structure.managementFee || '',
      performanceFee: structure.performanceFee || '',
      hurdleRate: structure.hurdleRate || '',
      preferredReturn: structure.preferredReturn || '',
      waterfallStructure: structure.waterfallStructure || '',
      distributionFrequency: structure.distributionFrequency || '',
      hierarchyMode: structure.hierarchyMode || false,
      hierarchySetupApproach: structure.hierarchySetupApproach || 'all-at-once',
      hierarchyLevels: structure.hierarchyLevels || 2,
      hierarchyStructures: structure.hierarchyStructures || []
    })

    setLoading(false)
  }, [childSlug])

  // Initialize hierarchy structures when levels change
  useEffect(() => {
    if (formData.hierarchyMode && formData.hierarchySetupApproach === 'all-at-once') {
      const currentLevels = formData.hierarchyStructures.length
      const targetLevels = formData.hierarchyLevels

      if (currentLevels !== targetLevels) {
        const structure = getStructureById(childSlug)
        const newStructures = Array.from({ length: targetLevels }, (_, index) => {
          const existing = formData.hierarchyStructures[index]
          if (existing) return existing

          return {
            level: index + 1,
            name: index === 0
              ? `${structure?.name} - Master Level`
              : index === targetLevels - 1
              ? `${structure?.name} - Property Level`
              : `${structure?.name} - Level ${index + 1}`,
            type: structure?.type || 'fund',
            applyWaterfall: false,
            waterfallAlgorithm: null as 'american' | 'european' | null,
            applyEconomicTerms: false
          }
        })

        setFormData(prev => ({
          ...prev,
          hierarchyStructures: newStructures
        }))
      }
    }
  }, [formData.hierarchyMode, formData.hierarchySetupApproach, formData.hierarchyLevels, childSlug])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const success = updateStructure(childSlug, {
        name: formData.name,
        status: formData.status,
        totalCommitment: formData.totalCommitment,
        investors: formData.investors,
        managementFee: formData.managementFee,
        performanceFee: formData.performanceFee,
        hurdleRate: formData.hurdleRate,
        preferredReturn: formData.preferredReturn,
        waterfallStructure: formData.waterfallStructure,
        distributionFrequency: formData.distributionFrequency,
        hierarchyMode: formData.hierarchyMode,
        hierarchySetupApproach: formData.hierarchySetupApproach,
        hierarchyLevels: formData.hierarchyLevels,
        hierarchyStructures: formData.hierarchyStructures
      })

      if (success) {
        router.push(`/investment-manager/structures/${parentId}/${childSlug}`)
      } else {
        setError('Failed to update structure')
      }
    } catch (err) {
      setError('An error occurred while saving')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <p>Loading...</p>
      </div>
    )
  }

  if (error && !formData.name) {
    return (
      <div className="flex-1 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href={`/investment-manager/structures/${parentId}/${childSlug}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Structure
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/investment-manager/structures/${parentId}/${childSlug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Structure</h1>
            <p className="text-muted-foreground">{formData.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/investment-manager/structures/${parentId}/${childSlug}`}>Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update structure details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Structure Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fundraising">Fundraising</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalCommitment">Total Commitment *</Label>
              <Input
                id="totalCommitment"
                type="number"
                value={formData.totalCommitment}
                onChange={(e) => setFormData({ ...formData, totalCommitment: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investors">Number of Investors *</Label>
              <Input
                id="investors"
                type="number"
                value={formData.investors}
                onChange={(e) => setFormData({ ...formData, investors: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Economic Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Economic Terms</CardTitle>
          <CardDescription>Fee structure and performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="managementFee">Management Fee</Label>
              <Input
                id="managementFee"
                value={formData.managementFee}
                onChange={(e) => setFormData({ ...formData, managementFee: e.target.value })}
                placeholder="e.g., 2%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="performanceFee">Performance Fee</Label>
              <Input
                id="performanceFee"
                value={formData.performanceFee}
                onChange={(e) => setFormData({ ...formData, performanceFee: e.target.value })}
                placeholder="e.g., 20%"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hurdleRate">Hurdle Rate</Label>
              <Input
                id="hurdleRate"
                value={formData.hurdleRate}
                onChange={(e) => setFormData({ ...formData, hurdleRate: e.target.value })}
                placeholder="e.g., 8%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredReturn">Preferred Return</Label>
              <Input
                id="preferredReturn"
                value={formData.preferredReturn}
                onChange={(e) => setFormData({ ...formData, preferredReturn: e.target.value })}
                placeholder="e.g., 8%"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Model */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution Model</CardTitle>
          <CardDescription>Waterfall structure and distribution frequency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="waterfallStructure">Waterfall Structure</Label>
            <Select
              value={formData.waterfallStructure}
              onValueChange={(value) => setFormData({ ...formData, waterfallStructure: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select waterfall structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="american">American (Deal-by-Deal)</SelectItem>
                <SelectItem value="european">European (Whole Fund)</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="distributionFrequency">Distribution Frequency</Label>
            <Select
              value={formData.distributionFrequency}
              onValueChange={(value) => setFormData({ ...formData, distributionFrequency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select distribution frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="upon-exit">Upon Exit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Level Hierarchy Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Level Hierarchy</CardTitle>
          <CardDescription>Configure hierarchical structure with cascade distributions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="hierarchyMode"
              checked={formData.hierarchyMode}
              onCheckedChange={(checked) => setFormData({ ...formData, hierarchyMode: checked as boolean })}
            />
            <div className="flex-1">
              <Label htmlFor="hierarchyMode" className="cursor-pointer font-medium">
                Enable Multi-Level Hierarchy
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Create a hierarchical structure with multiple levels for complex fund arrangements
              </p>
            </div>
          </div>

          {formData.hierarchyMode && (
            <div className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="hierarchySetupApproach">Setup Approach *</Label>
                <RadioGroup
                  value={formData.hierarchySetupApproach}
                  onValueChange={(value: any) => setFormData({ ...formData, hierarchySetupApproach: value })}
                >
                  <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                    <RadioGroupItem value="all-at-once" id="all-at-once" />
                    <div className="flex-1">
                      <Label htmlFor="all-at-once" className="cursor-pointer font-medium">
                        Configure All Levels at Once
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Define all hierarchy levels and their relationships in one setup
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {formData.hierarchySetupApproach === 'all-at-once' && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="hierarchyLevels">Number of Hierarchy Levels *</Label>
                    <Select
                      value={formData.hierarchyLevels.toString()}
                      onValueChange={(value) => setFormData({ ...formData, hierarchyLevels: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} Levels
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.hierarchyStructures.length > 0 && (
                    <div className="space-y-3 pt-3 border-t">
                      <h4 className="text-sm font-semibold">Hierarchy Level Configuration</h4>
                      {formData.hierarchyStructures.map((structure, index) => (
                        <Card key={index} className="border-primary/20">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    Level {index + 1} of {formData.hierarchyLevels}
                                  </Badge>
                                  {structure.name}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {index === 0 && 'Top-level structure (receives distributions from children)'}
                                  {index === formData.hierarchyLevels - 1 && 'Property/Investment level (income entry point)'}
                                  {index > 0 && index < formData.hierarchyLevels - 1 && `Intermediate level`}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`level-${index}-name`} className="text-xs">
                                Level Name *
                              </Label>
                              <Input
                                id={`level-${index}-name`}
                                value={structure.name}
                                onChange={(e) => {
                                  const newStructures = [...formData.hierarchyStructures]
                                  newStructures[index] = { ...structure, name: e.target.value }
                                  setFormData({ ...formData, hierarchyStructures: newStructures })
                                }}
                                placeholder="e.g., Master Trust, Investor Trust, Project Trust"
                                className="h-8 text-xs"
                              />
                            </div>

                            {/* Waterfall Configuration */}
                            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <Checkbox
                                  id={`level-${index}-waterfall`}
                                  checked={structure.applyWaterfall}
                                  disabled={index === formData.hierarchyLevels - 1}
                                  onCheckedChange={(checked) => {
                                    const newStructures = [...formData.hierarchyStructures]
                                    newStructures[index] = {
                                      ...structure,
                                      applyWaterfall: checked as boolean,
                                      waterfallAlgorithm: checked ? 'american' : null
                                    }
                                    setFormData({ ...formData, hierarchyStructures: newStructures })
                                  }}
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`level-${index}-waterfall`}
                                    className={`cursor-pointer text-xs font-medium ${index === formData.hierarchyLevels - 1 ? 'text-muted-foreground' : ''}`}
                                  >
                                    Apply Waterfall at This Level
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {index === formData.hierarchyLevels - 1
                                      ? 'Waterfall not applicable at property level - income enters here'
                                      : 'Calculate distributions using waterfall algorithm before passing to next level'}
                                  </p>
                                </div>
                              </div>

                              {structure.applyWaterfall && (
                                <div className="pl-6 pt-2">
                                  <RadioGroup
                                    value={structure.waterfallAlgorithm || 'american'}
                                    onValueChange={(value: any) => {
                                      const newStructures = [...formData.hierarchyStructures]
                                      newStructures[index] = {
                                        ...structure,
                                        waterfallAlgorithm: value
                                      }
                                      setFormData({ ...formData, hierarchyStructures: newStructures })
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="american" id={`level-${index}-american`} />
                                      <Label htmlFor={`level-${index}-american`} className="cursor-pointer text-xs font-normal">
                                        American (deal-by-deal)
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="european" id={`level-${index}-european`} />
                                      <Label htmlFor={`level-${index}-european`} className="cursor-pointer text-xs font-normal">
                                        European (whole fund)
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                              )}
                            </div>

                            {/* Economic Terms Configuration */}
                            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <Checkbox
                                  id={`level-${index}-economic`}
                                  checked={structure.applyEconomicTerms}
                                  disabled={index === formData.hierarchyLevels - 1}
                                  onCheckedChange={(checked) => {
                                    const newStructures = [...formData.hierarchyStructures]
                                    newStructures[index] = { ...structure, applyEconomicTerms: checked as boolean }
                                    setFormData({ ...formData, hierarchyStructures: newStructures })
                                  }}
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`level-${index}-economic`}
                                    className={`cursor-pointer text-xs font-medium ${index === formData.hierarchyLevels - 1 ? 'text-muted-foreground' : ''}`}
                                  >
                                    Apply Economic Terms at This Level
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {index === formData.hierarchyLevels - 1
                                      ? 'Economic terms not applicable at property level - income enters here'
                                      : 'Calculate management fees, performance fees, and carry at this level'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" asChild>
          <Link href={`/investment-manager/structures/${parentId}/${childSlug}`}>Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
