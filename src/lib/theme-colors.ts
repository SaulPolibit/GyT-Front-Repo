/**
 * Theme Color Generation
 * Converts hex primary color → full OKLCH CSS variable palette
 * Uses culori for accurate color space conversions
 */

import { parse, converter } from 'culori'

const toOklch = converter('oklch')

export interface OklchColor {
  l: number
  c: number
  h: number
}

/**
 * Convert hex color to OKLCH components
 */
export function hexToOklch(hex: string): OklchColor {
  const parsed = parse(hex)
  if (!parsed) throw new Error(`Invalid hex color: ${hex}`)
  const oklch = toOklch(parsed)
  return {
    l: oklch.l ?? 0,
    c: oklch.c ?? 0,
    h: oklch.h ?? 0,
  }
}

/**
 * Format OKLCH components as a CSS string
 */
export function oklchToString(l: number, c: number, h: number): string {
  const hNorm = c < 0.001 ? 0 : ((h % 360) + 360) % 360
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${hNorm.toFixed(3)})`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export interface ThemePalette {
  light: Record<string, string>
  dark: Record<string, string>
}

/**
 * Generate a complete CSS variable palette from one primary hex color.
 * Returns both light and dark mode variable maps.
 */
export function generateThemePalette(primaryHex: string): ThemePalette {
  const { l, c, h } = hexToOklch(primaryHex)

  const light: Record<string, string> = {
    // Surface colors — noticeable hue tinting
    '--background':           oklchToString(0.985, 0.015, h),
    '--foreground':           oklchToString(0.141, 0.020, h),
    '--card':                 oklchToString(0.995, 0.012, h),
    '--card-foreground':      oklchToString(0.141, 0.020, h),
    '--popover':              oklchToString(0.995, 0.012, h),
    '--popover-foreground':   oklchToString(0.141, 0.020, h),
    '--sidebar':              oklchToString(0.975, 0.020, h),
    '--sidebar-foreground':   oklchToString(0.141, 0.020, h),
    '--primary': oklchToString(l, c, h),
    '--primary-foreground': oklchToString(0.969, Math.min(c * 0.12, 0.02), h),
    '--ring': oklchToString(clamp(l + 0.35, 0.5, 0.65), clamp(c * 1.5, 0.15, 0.3), h),
    '--sidebar-primary': oklchToString(clamp(l + 0.35, 0.5, 0.65), clamp(c * 1.5, 0.15, 0.3), h),
    '--sidebar-primary-foreground': oklchToString(0.969, Math.min(c * 0.12, 0.02), h),
    '--sidebar-ring': oklchToString(clamp(l + 0.35, 0.5, 0.65), clamp(c * 1.5, 0.15, 0.3), h),
    // Charts: smooth analogous gradient — small hue shifts, lightness varies light→dark
    '--chart-1': oklchToString(0.82, clamp(c * 0.6, 0.04, 0.10), (h - 15 + 360) % 360),
    '--chart-2': oklchToString(0.72, clamp(c * 0.8, 0.06, 0.14), (h - 7 + 360) % 360),
    '--chart-3': oklchToString(0.62, clamp(c * 1.0, 0.08, 0.18), h),
    '--chart-4': oklchToString(0.52, clamp(c * 1.2, 0.10, 0.22), (h + 7) % 360),
    '--chart-5': oklchToString(0.42, clamp(c * 1.4, 0.12, 0.26), (h + 15) % 360),
    // Near-neutrals tinted with primary hue
    '--secondary': oklchToString(0.967, 0.004, h),
    '--secondary-foreground': oklchToString(0.210, 0.010, h),
    '--accent': oklchToString(0.967, 0.004, h),
    '--accent-foreground': oklchToString(0.210, 0.010, h),
    '--muted': oklchToString(0.967, 0.004, h),
    '--muted-foreground': oklchToString(0.552, 0.020, h),
    '--sidebar-accent': oklchToString(0.967, 0.004, h),
    '--sidebar-accent-foreground': oklchToString(0.210, 0.010, h),
    '--border': oklchToString(0.920, 0.008, h),
    '--input': oklchToString(0.920, 0.008, h),
    '--sidebar-border': oklchToString(0.920, 0.008, h),
  }

  const dark: Record<string, string> = {
    // Surface colors — deep hue-shifted darks
    '--background':           oklchToString(0.145, 0.020, h),
    '--foreground':           oklchToString(0.985, 0.008, h),
    '--card':                 oklchToString(0.205, 0.018, h),
    '--card-foreground':      oklchToString(0.985, 0.008, h),
    '--popover':              oklchToString(0.205, 0.018, h),
    '--popover-foreground':   oklchToString(0.985, 0.008, h),
    '--sidebar':              oklchToString(0.195, 0.020, h),
    '--sidebar-foreground':   oklchToString(0.985, 0.008, h),
    '--primary': oklchToString(clamp(l + 0.29, 0.45, 0.58), clamp(c * 1.8, 0.2, 0.32), h),
    '--primary-foreground': oklchToString(0.969, Math.min(c * 0.12, 0.02), h),
    '--ring': oklchToString(clamp(l + 0.29, 0.45, 0.58), clamp(c * 1.8, 0.2, 0.32), h),
    '--sidebar-primary': oklchToString(clamp(l + 0.29, 0.45, 0.58), clamp(c * 1.8, 0.2, 0.32), h),
    '--sidebar-primary-foreground': oklchToString(0.969, Math.min(c * 0.12, 0.02), h),
    '--sidebar-ring': oklchToString(clamp(l + 0.29, 0.45, 0.58), clamp(c * 1.8, 0.2, 0.32), h),
    // Charts: smooth analogous gradient for dark mode
    '--chart-1': oklchToString(0.75, clamp(c * 0.7, 0.05, 0.12), (h - 15 + 360) % 360),
    '--chart-2': oklchToString(0.65, clamp(c * 0.9, 0.07, 0.16), (h - 7 + 360) % 360),
    '--chart-3': oklchToString(0.55, clamp(c * 1.1, 0.09, 0.20), h),
    '--chart-4': oklchToString(0.45, clamp(c * 1.3, 0.11, 0.24), (h + 7) % 360),
    '--chart-5': oklchToString(0.38, clamp(c * 1.5, 0.13, 0.28), (h + 15) % 360),
    '--secondary': oklchToString(0.274, 0.010, h),
    '--secondary-foreground': oklchToString(0.985, 0, 0),
    '--accent': oklchToString(0.274, 0.010, h),
    '--accent-foreground': oklchToString(0.985, 0, 0),
    '--muted': oklchToString(0.274, 0.010, h),
    '--muted-foreground': oklchToString(0.705, 0.020, h),
    '--sidebar-accent': oklchToString(0.274, 0.010, h),
    '--sidebar-accent-foreground': oklchToString(0.985, 0, 0),
    '--border': 'oklch(1 0 0 / 10%)',
    '--input': 'oklch(1 0 0 / 15%)',
    '--sidebar-border': 'oklch(1 0 0 / 10%)',
  }

  return { light, dark }
}
