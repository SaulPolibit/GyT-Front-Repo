/**
 * Theme Font Configuration
 * Curated list of Google Fonts suitable for finance/investment platforms
 */

export interface ThemeFont {
  name: string
  value: string
  category: 'sans-serif' | 'serif'
  description: string
}

export const THEME_FONTS: ThemeFont[] = [
  {
    name: 'Geist Sans',
    value: 'Geist',
    category: 'sans-serif',
    description: 'Default — clean and modern geometric sans',
  },
  {
    name: 'Inter',
    value: 'Inter',
    category: 'sans-serif',
    description: 'Highly legible, designed for screens',
  },
  {
    name: 'DM Sans',
    value: 'DM Sans',
    category: 'sans-serif',
    description: 'Low-contrast geometric sans-serif',
  },
  {
    name: 'Plus Jakarta Sans',
    value: 'Plus Jakarta Sans',
    category: 'sans-serif',
    description: 'Modern variable font with friendly geometry',
  },
  {
    name: 'Space Grotesk',
    value: 'Space Grotesk',
    category: 'sans-serif',
    description: 'Proportional sans with a technical feel',
  },
  {
    name: 'Outfit',
    value: 'Outfit',
    category: 'sans-serif',
    description: 'Geometric sans-serif with rounded terminals',
  },
  {
    name: 'Manrope',
    value: 'Manrope',
    category: 'sans-serif',
    description: 'Semi-condensed with a professional tone',
  },
  {
    name: 'Sora',
    value: 'Sora',
    category: 'sans-serif',
    description: 'Clean geometric with subtle personality',
  },
  {
    name: 'Poppins',
    value: 'Poppins',
    category: 'sans-serif',
    description: 'Geometric with friendly, rounded forms',
  },
  {
    name: 'Lora',
    value: 'Lora',
    category: 'serif',
    description: 'Well-balanced contemporary serif',
  },
  {
    name: 'Source Serif 4',
    value: 'Source Serif 4',
    category: 'serif',
    description: 'Transitional serif for elegant, formal branding',
  },
]

/**
 * Generate Google Fonts <link> URL for a given font name
 */
export function getFontUrl(fontName: string): string | null {
  if (!fontName || fontName === 'Geist') return null
  const fontParam = fontName.replace(/\s+/g, '+')
  return `https://fonts.googleapis.com/css2?family=${fontParam}:wght@300;400;500;600;700&display=swap`
}
