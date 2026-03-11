/**
 * Theme Utilities
 * TypeScript types, DOM helpers, and CSS generation for the theming system
 */

import { generateThemePalette } from './theme-colors'
import { getFontUrl } from './theme-fonts'

export interface ThemeConfig {
  primaryColor: string
  fontFamily?: string | null
  borderRadius?: number | null
  presetName?: string | null
}

/**
 * Apply a theme configuration to the DOM for live preview.
 * Injects a <style> tag so .dark {} rules keep correct specificity.
 */
export function applyThemeToDOM(config: ThemeConfig): void {
  const root = document.documentElement

  // Generate CSS with both :root and .dark blocks
  const css = generateCSSString(config)

  // Inject or update the <style id="theme-overrides"> tag
  let style = document.getElementById('theme-overrides') as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = 'theme-overrides'
    document.head.appendChild(style)
  }
  style.textContent = css

  // Apply mode-independent properties as inline styles
  if (config.borderRadius != null) {
    root.style.setProperty('--radius', `${config.borderRadius}rem`)
  }

  if (config.fontFamily && config.fontFamily !== 'Geist') {
    root.style.setProperty('--font-geist-sans', `'${config.fontFamily}', sans-serif`)

    // Load the font if not already loaded
    const fontUrl = getFontUrl(config.fontFamily)
    if (fontUrl && !document.querySelector(`link[href="${fontUrl}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = fontUrl
      document.head.appendChild(link)
    }
  } else {
    root.style.removeProperty('--font-geist-sans')
  }
}

/**
 * Remove all theme overrides from the DOM (reset to CSS defaults).
 */
export function removeThemeFromDOM(): void {
  const root = document.documentElement

  // Remove all custom properties we set
  const propsToRemove = [
    '--background', '--foreground',
    '--card', '--card-foreground',
    '--popover', '--popover-foreground',
    '--sidebar', '--sidebar-foreground',
    '--primary', '--primary-foreground', '--ring',
    '--sidebar-primary', '--sidebar-primary-foreground', '--sidebar-ring',
    '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5',
    '--secondary', '--secondary-foreground',
    '--accent', '--accent-foreground',
    '--muted', '--muted-foreground',
    '--sidebar-accent', '--sidebar-accent-foreground',
    '--border', '--input', '--sidebar-border',
    '--radius', '--font-geist-sans',
  ]

  for (const prop of propsToRemove) {
    root.style.removeProperty(prop)
  }

  // Remove the injected style tag
  document.getElementById('theme-overrides')?.remove()
}

/**
 * Generate a CSS string suitable for server-side <style> injection.
 * This is used by the root layout to prevent flash of default theme.
 */
export function generateCSSString(config: ThemeConfig): string {
  const palette = generateThemePalette(config.primaryColor)

  let css = ':root {\n'

  // Font override
  if (config.fontFamily && config.fontFamily !== 'Geist') {
    css += `  --font-geist-sans: '${config.fontFamily}', sans-serif;\n`
  }

  // Light mode variables
  for (const [key, value] of Object.entries(palette.light)) {
    css += `  ${key}: ${value};\n`
  }

  // Border radius
  if (config.borderRadius != null) {
    css += `  --radius: ${config.borderRadius}rem;\n`
  }

  css += '}\n\n.dark {\n'

  // Dark mode variables
  for (const [key, value] of Object.entries(palette.dark)) {
    css += `  ${key}: ${value};\n`
  }

  css += '}\n'

  return css
}
