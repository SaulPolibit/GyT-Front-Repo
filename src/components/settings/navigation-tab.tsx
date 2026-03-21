"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Navigation, RotateCcw, Save, Loader2, ToggleLeft } from "lucide-react"
import { toast } from "sonner"
import { getAuthToken } from "@/lib/auth-storage"
import { useTranslation } from "@/hooks/useTranslation"
import {
  type NavVisibilityConfig,
  type NavItemVisibility,
  type LPNavItemVisibility,
  type FeatureFlags,
  DEFAULT_NAV_VISIBILITY,
  NAV_ITEMS_IM,
  NAV_ITEMS_LP,
  FEATURE_FLAGS_META,
  getNavVisibility,
  saveNavVisibility,
  fetchAndCacheNavVisibility,
  saveNavVisibilityToCache,
} from "@/lib/nav-visibility-storage"

export function NavigationTab() {
  const { t } = useTranslation()
  const [config, setConfig] = React.useState<NavVisibilityConfig>(getNavVisibility)
  const [isSaving, setIsSaving] = React.useState(false)

  // Fetch latest config from API on mount
  React.useEffect(() => {
    const token = getAuthToken()
    if (token) {
      fetchAndCacheNavVisibility(token).then(setConfig)
    }
  }, [])

  const handleIMToggle = (itemKey: string, role: keyof NavItemVisibility) => {
    setConfig(prev => ({
      ...prev,
      investmentManager: {
        ...prev.investmentManager,
        [itemKey]: {
          ...prev.investmentManager[itemKey],
          [role]: !prev.investmentManager[itemKey]?.[role],
        },
      },
    }))
  }

  const handleLPToggle = (itemKey: string, role: keyof LPNavItemVisibility) => {
    setConfig(prev => ({
      ...prev,
      lpPortal: {
        ...prev.lpPortal,
        [itemKey]: {
          ...prev.lpPortal[itemKey],
          [role]: !prev.lpPortal[itemKey]?.[role],
        },
      },
    }))
  }

  const handleFeatureToggle = (key: keyof FeatureFlags) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key],
      },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error(t.settings.navigation.authenticationRequired)
        return
      }

      const success = await saveNavVisibility(config, token)
      if (success) {
        toast.success(t.settings.navigation.navigationVisibilitySaved)
      } else {
        toast.error(t.settings.navigation.failedToSaveNavigationVisibility)
      }
    } catch {
      toast.error(t.settings.navigation.failedToSaveNavigationVisibility)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(DEFAULT_NAV_VISIBILITY)
    toast.info(t.settings.navigation.resetToDefaultsMessage)
  }

  // Group IM items by section
  const imSections = React.useMemo(() => {
    const groups: Record<string, typeof NAV_ITEMS_IM> = {}
    for (const item of NAV_ITEMS_IM) {
      const section = item.section || 'Other'
      if (!groups[section]) groups[section] = []
      groups[section].push(item)
    }
    return groups
  }, [])

  // Group LP items by section
  const lpSections = React.useMemo(() => {
    const groups: Record<string, typeof NAV_ITEMS_LP> = {}
    for (const item of NAV_ITEMS_LP) {
      const section = item.section || 'Other'
      if (!groups[section]) groups[section] = []
      groups[section].push(item)
    }
    return groups
  }, [])

  return (
    <div className="space-y-6">
      {/* Investment Manager Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            {t.settings.navigation.investmentManagerNavigation}
          </CardTitle>
          <CardDescription>
            {t.settings.navigation.investmentManagerNavigationDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{t.settings.navigation.navItem}</TableHead>
                  <TableHead className="text-center w-[100px]">{t.settings.navigation.admin}</TableHead>
                  <TableHead className="text-center w-[100px]">{t.settings.navigation.operations}</TableHead>
                  <TableHead className="text-center w-[100px]">{t.settings.navigation.readOnly}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(imSections).map(([section, items]) => (
                  <React.Fragment key={section}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={4} className="font-medium text-xs text-muted-foreground uppercase tracking-wider py-2">
                        {section}
                      </TableCell>
                    </TableRow>
                    {items.map(item => {
                      const vis = config.investmentManager[item.key] || { admin: false, operations: false, readOnly: false }
                      return (
                        <TableRow key={item.key}>
                          <TableCell className="font-medium">{item.label}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={vis.admin}
                              onCheckedChange={() => handleIMToggle(item.key, 'admin')}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={vis.operations}
                              onCheckedChange={() => handleIMToggle(item.key, 'operations')}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={vis.readOnly}
                              onCheckedChange={() => handleIMToggle(item.key, 'readOnly')}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* LP Portal Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            {t.settings.navigation.lpPortalNavigation}
          </CardTitle>
          <CardDescription>
            {t.settings.navigation.lpPortalNavigationDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{t.settings.navigation.navItem}</TableHead>
                  <TableHead className="text-center w-[100px]">{t.settings.navigation.investor}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(lpSections).map(([section, items]) => (
                  <React.Fragment key={section}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="font-medium text-xs text-muted-foreground uppercase tracking-wider py-2">
                        {section}
                      </TableCell>
                    </TableRow>
                    {items.map(item => {
                      const vis = config.lpPortal[item.key] || { investor: false }
                      return (
                        <TableRow key={item.key}>
                          <TableCell className="font-medium">{item.label}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={vis.investor}
                              onCheckedChange={() => handleLPToggle(item.key, 'investor')}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Feature Flags Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5" />
            {t.settings.navigation.featureFlags}
          </CardTitle>
          <CardDescription>
            {t.settings.navigation.featureFlagsDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {FEATURE_FLAGS_META.map(flag => (
              <div key={flag.key} className="flex items-start gap-3 p-3 rounded-lg border">
                <Checkbox
                  checked={config.features?.[flag.key] ?? true}
                  onCheckedChange={() => handleFeatureToggle(flag.key)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">{flag.label}</p>
                  <p className="text-xs text-muted-foreground">{flag.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t.settings.navigation.saveChanges}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          {t.settings.navigation.resetToDefaults}
        </Button>
      </div>
    </div>
  )
}
