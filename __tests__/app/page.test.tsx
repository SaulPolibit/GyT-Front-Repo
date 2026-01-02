import { render, screen, waitFor } from '@/test-utils'
import { useRouter } from 'next/navigation'
import HomePage from '@/app/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('HomePage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('renders loading spinner', () => {
    const { container } = render(<HomePage />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('rounded-full', 'h-12', 'w-12', 'border-b-2')
  })

  it('redirects to LP Portal login page on mount', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/lp-portal/login')
    })
  })

  it('has correct layout classes', () => {
    const { container } = render(<HomePage />)

    const mainDiv = container.firstChild
    expect(mainDiv).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center')
  })
})
