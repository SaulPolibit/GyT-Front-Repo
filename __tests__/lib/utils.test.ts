import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('merges class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500')
      expect(result).toContain('text-red-500')
      expect(result).toContain('bg-blue-500')
    })

    it('handles conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
    })

    it('handles false conditional classes', () => {
      const isActive = false
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).not.toContain('active-class')
    })

    it('merges Tailwind conflicting classes correctly', () => {
      // Later class should override earlier class
      const result = cn('p-4', 'p-8')
      expect(result).toBe('p-8')
    })

    it('handles arrays of classes', () => {
      const result = cn(['text-red-500', 'bg-blue-500'])
      expect(result).toContain('text-red-500')
      expect(result).toContain('bg-blue-500')
    })

    it('handles undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'another-class')
      expect(result).toContain('base-class')
      expect(result).toContain('another-class')
    })

    it('handles empty strings', () => {
      const result = cn('base-class', '', 'another-class')
      expect(result).toContain('base-class')
      expect(result).toContain('another-class')
    })

    it('handles object notation for conditional classes', () => {
      const result = cn({
        'active-class': true,
        'inactive-class': false,
      })
      expect(result).toContain('active-class')
      expect(result).not.toContain('inactive-class')
    })
  })
})
