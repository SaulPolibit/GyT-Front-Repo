import { render, screen } from '@/test-utils'
import LPSearchPage from '@/app/lp-portal/search/page'

// Mock the search command component
jest.mock('@/components/lp-search-command', () => ({
  LPSearchCommand: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <div data-testid="search-command" data-open={open}>
      Search Command Component
    </div>
  ),
}))

describe('LPSearchPage', () => {
  it('renders the page title', () => {
    render(<LPSearchPage />)

    expect(screen.getByRole('heading', { name: /search/i, level: 1 })).toBeInTheDocument()
  })

  it('renders search description with keyboard shortcut', () => {
    render(<LPSearchPage />)

    expect(screen.getByText(/search for structures, documents, and pages/i)).toBeInTheDocument()
    expect(screen.getByText('⌘')).toBeInTheDocument()
    expect(screen.getByText('K')).toBeInTheDocument()
  })

  it('renders search command component', () => {
    render(<LPSearchPage />)

    expect(screen.getByTestId('search-command')).toBeInTheDocument()
  })

  it('keeps search dialog open by default', () => {
    render(<LPSearchPage />)

    const searchCommand = screen.getByTestId('search-command')
    expect(searchCommand).toHaveAttribute('data-open', 'true')
  })

  it('has correct layout classes', () => {
    const { container } = render(<LPSearchPage />)

    const mainDiv = container.querySelector('.space-y-6')
    expect(mainDiv).toBeInTheDocument()
    expect(mainDiv).toHaveClass('p-4', 'md:p-6')
  })
})
