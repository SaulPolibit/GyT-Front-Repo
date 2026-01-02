import { redirect } from 'next/navigation'
import LPPortalRoot from '@/app/lp-portal/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('LPPortalRoot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to portfolio page', () => {
    LPPortalRoot()

    expect(redirect).toHaveBeenCalledWith('/lp-portal/portfolio')
  })

  it('redirects immediately without rendering', () => {
    const result = LPPortalRoot()

    // Server component redirect should be called
    expect(redirect).toHaveBeenCalledTimes(1)
    expect(result).toBeUndefined()
  })
})
