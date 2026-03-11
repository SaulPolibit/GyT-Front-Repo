/**
 * Theme Presets
 * Pre-configured color themes as starting points for white-label customization
 */

export interface ThemePreset {
  name: string
  id: string
  primaryColor: string
  description: string
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Gray',
    id: 'gray',
    primaryColor: '#6b7280',
    description: 'Clean neutral default — no color tint',
  },
  {
    name: 'Default Purple',
    id: 'default-purple',
    primaryColor: '#1a0a4e',
    description: 'The original Polibit brand — deep violet',
  },
  {
    name: 'Ocean Blue',
    id: 'ocean-blue',
    primaryColor: '#0c3b6f',
    description: 'Trustworthy and institutional feel',
  },
  {
    name: 'Forest Green',
    id: 'forest-green',
    primaryColor: '#1a4d2e',
    description: 'Growth-oriented and sustainable',
  },
  {
    name: 'Deep Teal',
    id: 'deep-teal',
    primaryColor: '#0d4f4f',
    description: 'Sophisticated and balanced',
  },
  {
    name: 'Midnight',
    id: 'midnight',
    primaryColor: '#1a1a2e',
    description: 'Sleek, dark, and modern',
  },
  {
    name: 'Burgundy',
    id: 'burgundy',
    primaryColor: '#5c1a33',
    description: 'Premium and authoritative',
  },
  {
    name: 'Navy',
    id: 'navy',
    primaryColor: '#0a1f44',
    description: 'Classic finance and banking',
  },
  {
    name: 'Slate',
    id: 'slate',
    primaryColor: '#2d3748',
    description: 'Neutral and professional',
  },
]
