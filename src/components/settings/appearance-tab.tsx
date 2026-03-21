"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Palette, Type, RotateCcw, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/useTranslation"

import type { ThemeConfig } from "@/lib/theme-utils"
import { applyThemeToDOM, removeThemeFromDOM } from "@/lib/theme-utils"
import { generateThemePalette } from "@/lib/theme-colors"
import { THEME_FONTS, getFontUrl } from "@/lib/theme-fonts"
import { THEME_PRESETS } from "@/lib/theme-presets"
import { getAuthToken } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"

interface AppearanceTabProps {
  initialThemeConfig?: ThemeConfig | null
}

const RADIUS_STEPS = [0, 0.25, 0.5, 0.65, 0.75, 1.0, 1.5]

export function AppearanceTab({ initialThemeConfig }: AppearanceTabProps) {
  const { t } = useTranslation()
  const [themeConfig, setThemeConfig] = React.useState<ThemeConfig>({
    primaryColor: initialThemeConfig?.primaryColor || '#1a0a4e',
    fontFamily: initialThemeConfig?.fontFamily || 'Geist',
    borderRadius: initialThemeConfig?.borderRadius ?? 0.65,
    presetName: initialThemeConfig?.presetName || 'default-purple',
  })
  const [saving, setSaving] = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)

  // Track the initial config to detect changes
  const initialRef = React.useRef(JSON.stringify(initialThemeConfig || null))

  React.useEffect(() => {
    const current = JSON.stringify({
      primaryColor: themeConfig.primaryColor,
      fontFamily: themeConfig.fontFamily,
      borderRadius: themeConfig.borderRadius,
      presetName: themeConfig.presetName,
    })
    const initial = initialRef.current === 'null'
      ? JSON.stringify({
          primaryColor: '#1a0a4e',
          fontFamily: 'Geist',
          borderRadius: 0.65,
          presetName: 'default-purple',
        })
      : initialRef.current
    setHasChanges(current !== initial)
  }, [themeConfig])

  // Apply live preview whenever config changes
  React.useEffect(() => {
    applyThemeToDOM(themeConfig)
  }, [themeConfig])

  const updateConfig = (updates: Partial<ThemeConfig>) => {
    setThemeConfig(prev => ({ ...prev, ...updates }))
  }

  const handlePresetSelect = (preset: typeof THEME_PRESETS[number]) => {
    updateConfig({
      primaryColor: preset.primaryColor,
      presetName: preset.id,
    })
  }

  const handleColorChange = (color: string) => {
    updateConfig({
      primaryColor: color,
      presetName: null, // Clear preset when manually picking color
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error(t.settings.appearance.authenticationRequired)
        return
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.updateFirmSettings),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ themeConfig }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to save theme settings')
      }

      initialRef.current = JSON.stringify(themeConfig)
      setHasChanges(false)
      toast.success(t.settings.appearance.themeSaved)
    } catch (error) {
      console.error('Error saving theme:', error)
      toast.error(t.settings.appearance.failedToSaveTheme)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    const defaultConfig: ThemeConfig = {
      primaryColor: '#1a0a4e',
      fontFamily: 'Geist',
      borderRadius: 0.65,
      presetName: 'default-purple',
    }
    setThemeConfig(defaultConfig)
    removeThemeFromDOM()

    // Save the reset to backend
    setSaving(true)
    try {
      const token = getAuthToken()
      if (!token) return

      await fetch(
        getApiUrl(API_CONFIG.endpoints.updateFirmSettings),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ themeConfig: null }),
        }
      )
      initialRef.current = 'null'
      setHasChanges(false)
      toast.success(t.settings.appearance.themeResetToDefaults)
    } catch {
      toast.error(t.settings.appearance.failedToSaveTheme)
    } finally {
      setSaving(false)
    }
  }

  // Generate palette for preview
  const palette = React.useMemo(
    () => generateThemePalette(themeConfig.primaryColor),
    [themeConfig.primaryColor]
  )

  const currentRadiusIndex = RADIUS_STEPS.indexOf(themeConfig.borderRadius ?? 0.65)

  return (
    <div className="space-y-6">
      {/* Theme Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t.settings.appearance.themePresets}
          </CardTitle>
          <CardDescription>
            {t.settings.appearance.themePresetsDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:shadow-md",
                  themeConfig.presetName === preset.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                {themeConfig.presetName === preset.id && (
                  <div className="absolute top-1.5 right-1.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className="h-10 w-10 rounded-full border shadow-sm"
                  style={{ backgroundColor: preset.primaryColor }}
                />
                <div className="text-center">
                  <p className="text-xs font-medium">{preset.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Brand Color */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t.settings.appearance.brandColor}
          </CardTitle>
          <CardDescription>
            {t.settings.appearance.brandColorDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="color"
                value={themeConfig.primaryColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-12 w-12 cursor-pointer rounded-lg border-2 border-border p-0.5"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="hexInput" className="text-xs text-muted-foreground">
                {t.settings.appearance.hexCode}
              </Label>
              <Input
                id="hexInput"
                value={themeConfig.primaryColor}
                onChange={(e) => {
                  const val = e.target.value
                  if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                    if (val.length === 7) {
                      handleColorChange(val)
                    } else {
                      setThemeConfig(prev => ({ ...prev, primaryColor: val }))
                    }
                  }
                }}
                className="font-mono text-sm"
                maxLength={7}
                placeholder="#1a0a4e"
              />
            </div>
          </div>

          {/* Generated Palette Preview */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t.settings.appearance.generatedPalette}</Label>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: 'Primary', value: palette.light['--primary'] },
                { label: 'Ring', value: palette.light['--ring'] },
                { label: 'Chart 1', value: palette.light['--chart-1'] },
                { label: 'Chart 2', value: palette.light['--chart-2'] },
                { label: 'Chart 3', value: palette.light['--chart-3'] },
                { label: 'Chart 4', value: palette.light['--chart-4'] },
                { label: 'Chart 5', value: palette.light['--chart-5'] },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div
                    className="h-8 w-8 rounded-md border shadow-sm"
                    style={{ backgroundColor: value }}
                    title={label}
                  />
                  <span className="text-[9px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            {t.settings.appearance.typography}
          </CardTitle>
          <CardDescription>
            {t.settings.appearance.typographyDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.settings.appearance.fontFamily}</Label>
            <Select
              value={themeConfig.fontFamily || 'Geist'}
              onValueChange={(value) => updateConfig({ fontFamily: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <div className="flex flex-col">
                      <span>{font.name}</span>
                      <span className="text-xs text-muted-foreground">{font.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font preview */}
          <div className="rounded-lg border p-4 bg-card">
            <p
              className="text-lg font-medium"
              style={{
                fontFamily: themeConfig.fontFamily === 'Geist'
                  ? undefined
                  : `'${themeConfig.fontFamily}', sans-serif`,
              }}
            >
              The quick brown fox jumps over the lazy dog
            </p>
            <p
              className="text-sm text-muted-foreground mt-1"
              style={{
                fontFamily: themeConfig.fontFamily === 'Geist'
                  ? undefined
                  : `'${themeConfig.fontFamily}', sans-serif`,
              }}
            >
              $1,234,567.89 — 12.5% IRR — Q4 2025 Distribution Notice
            </p>
          </div>

          {/* Preload selected font for preview */}
          {themeConfig.fontFamily && themeConfig.fontFamily !== 'Geist' && (
            <FontPreloader fontName={themeConfig.fontFamily} />
          )}
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings.appearance.borderRadius}</CardTitle>
          <CardDescription>
            {t.settings.appearance.borderRadiusDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t.settings.appearance.radius}</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {themeConfig.borderRadius ?? 0.65}rem
              </span>
            </div>
            <Slider
              value={[currentRadiusIndex >= 0 ? currentRadiusIndex : 3]}
              onValueChange={([idx]) => updateConfig({ borderRadius: RADIUS_STEPS[idx] })}
              min={0}
              max={RADIUS_STEPS.length - 1}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
              <span>{t.settings.appearance.sharp}</span>
              <span>{t.settings.appearance.rounded}</span>
            </div>
          </div>

          {/* Radius preview */}
          <div className="flex items-center gap-3 pt-2">
            <div
              className="h-10 px-4 bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium"
              style={{ borderRadius: `${themeConfig.borderRadius ?? 0.65}rem` }}
            >
              {t.settings.appearance.buttonPreview}
            </div>
            <div
              className="h-16 w-32 border bg-card flex items-center justify-center text-xs text-muted-foreground"
              style={{ borderRadius: `${themeConfig.borderRadius ?? 0.65}rem` }}
            >
              {t.settings.appearance.cardPreview}
            </div>
            <div
              className="h-10 w-32 border bg-background flex items-center justify-center text-xs text-muted-foreground"
              style={{ borderRadius: `calc(${themeConfig.borderRadius ?? 0.65}rem - 2px)` }}
            >
              {t.settings.appearance.inputPreview}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings.appearance.preview}</CardTitle>
          <CardDescription>
            {t.settings.appearance.previewDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Light mode preview */}
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-background p-3 space-y-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">{t.settings.appearance.lightMode}</div>
                {/* Mini sidebar */}
                <div className="flex gap-2">
                  <div className="w-16 rounded-md bg-sidebar border p-2 space-y-1.5">
                    <div className="h-2 rounded bg-sidebar-primary w-full" />
                    <div className="h-1.5 rounded bg-sidebar-accent w-full" />
                    <div className="h-1.5 rounded bg-sidebar-accent w-full" />
                    <div className="h-1.5 rounded bg-sidebar-accent w-full" />
                  </div>
                  <div className="flex-1 space-y-2">
                    {/* Header bar */}
                    <div className="h-6 rounded-md bg-primary flex items-center px-2">
                      <span className="text-[9px] text-primary-foreground font-medium">Dashboard</span>
                    </div>
                    {/* Cards */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-md border bg-card p-2 space-y-1">
                        <div className="h-1.5 rounded bg-muted w-3/4" />
                        <div className="h-3 rounded bg-primary/20 w-full" />
                      </div>
                      <div className="rounded-md border bg-card p-2 space-y-1">
                        <div className="h-1.5 rounded bg-muted w-3/4" />
                        <div className="h-3 rounded bg-primary/20 w-full" />
                      </div>
                    </div>
                    {/* Button row */}
                    <div className="flex gap-1.5">
                      <div
                        className="h-5 px-2 bg-primary text-primary-foreground flex items-center text-[8px] font-medium"
                        style={{ borderRadius: `${(themeConfig.borderRadius ?? 0.65) * 0.6}rem` }}
                      >
                        Primary
                      </div>
                      <div
                        className="h-5 px-2 bg-secondary text-secondary-foreground flex items-center text-[8px] font-medium border"
                        style={{ borderRadius: `${(themeConfig.borderRadius ?? 0.65) * 0.6}rem` }}
                      >
                        Secondary
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark mode preview */}
            <div
              className="rounded-lg border overflow-hidden"
              style={{
                '--background': palette.dark['--background'],
                '--foreground': palette.dark['--foreground'],
                '--card': palette.dark['--card'],
                '--card-foreground': palette.dark['--card-foreground'],
                '--popover': palette.dark['--popover'],
                '--popover-foreground': palette.dark['--popover-foreground'],
                '--sidebar': palette.dark['--sidebar'],
                '--sidebar-foreground': palette.dark['--sidebar-foreground'],
                '--primary': palette.dark['--primary'],
                '--primary-foreground': palette.dark['--primary-foreground'],
                '--secondary': palette.dark['--secondary'],
                '--secondary-foreground': palette.dark['--secondary-foreground'],
                '--muted': palette.dark['--muted'],
                '--muted-foreground': palette.dark['--muted-foreground'],
                '--sidebar-primary': palette.dark['--sidebar-primary'],
                '--sidebar-accent': palette.dark['--sidebar-accent'],
                '--sidebar-accent-foreground': palette.dark['--sidebar-accent-foreground'],
                '--border': palette.dark['--border'],
              } as React.CSSProperties}
            >
              <div className="p-3 space-y-3" style={{ backgroundColor: palette.dark['--background'], color: palette.dark['--foreground'] }}>
                <div className="text-xs font-medium mb-2" style={{ color: palette.dark['--muted-foreground'] }}>{t.settings.appearance.darkMode}</div>
                <div className="flex gap-2">
                  <div className="w-16 rounded-md p-2 space-y-1.5" style={{ backgroundColor: palette.dark['--sidebar'], borderColor: palette.dark['--border'], borderWidth: '1px' }}>
                    <div className="h-2 rounded w-full" style={{ backgroundColor: palette.dark['--sidebar-primary'] }} />
                    <div className="h-1.5 rounded w-full" style={{ backgroundColor: palette.dark['--sidebar-accent'] }} />
                    <div className="h-1.5 rounded w-full" style={{ backgroundColor: palette.dark['--sidebar-accent'] }} />
                    <div className="h-1.5 rounded w-full" style={{ backgroundColor: palette.dark['--sidebar-accent'] }} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 rounded-md flex items-center px-2" style={{ backgroundColor: palette.dark['--primary'] }}>
                      <span className="text-[9px] font-medium" style={{ color: palette.dark['--primary-foreground'] }}>Dashboard</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-md p-2 space-y-1" style={{ backgroundColor: palette.dark['--card'], borderColor: palette.dark['--border'], borderWidth: '1px' }}>
                        <div className="h-1.5 rounded w-3/4" style={{ backgroundColor: palette.dark['--muted'] }} />
                        <div className="h-3 rounded w-full" style={{ backgroundColor: palette.dark['--primary'], opacity: 0.2 }} />
                      </div>
                      <div className="rounded-md p-2 space-y-1" style={{ backgroundColor: palette.dark['--card'], borderColor: palette.dark['--border'], borderWidth: '1px' }}>
                        <div className="h-1.5 rounded w-3/4" style={{ backgroundColor: palette.dark['--muted'] }} />
                        <div className="h-3 rounded w-full" style={{ backgroundColor: palette.dark['--primary'], opacity: 0.2 }} />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div
                        className="h-5 px-2 flex items-center text-[8px] font-medium"
                        style={{ backgroundColor: palette.dark['--primary'], color: palette.dark['--primary-foreground'], borderRadius: `${(themeConfig.borderRadius ?? 0.65) * 0.6}rem` }}
                      >
                        Primary
                      </div>
                      <div
                        className="h-5 px-2 flex items-center text-[8px] font-medium"
                        style={{ backgroundColor: palette.dark['--secondary'], color: palette.dark['--secondary-foreground'], borderColor: palette.dark['--border'], borderWidth: '1px', borderRadius: `${(themeConfig.borderRadius ?? 0.65) * 0.6}rem` }}
                      >
                        Secondary
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart color swatches */}
          <div className="mt-4 space-y-2">
            <Label className="text-xs text-muted-foreground">{t.settings.appearance.chartColors}</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="h-6 w-12 rounded-md"
                    style={{ backgroundColor: `var(--chart-${i})` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{t.settings.appearance.chartNumber.replace('{number}', i.toString())}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={saving}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {t.settings.appearance.resetToDefault}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.settings.appearance.saving}
            </>
          ) : (
            t.settings.appearance.saveTheme
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * Helper component to preload a Google Font for the preview
 */
function FontPreloader({ fontName }: { fontName: string }) {
  const url = getFontUrl(fontName)
  if (!url) return null

  return (
    // eslint-disable-next-line @next/next/no-page-custom-font
    <link rel="stylesheet" href={url} />
  )
}
