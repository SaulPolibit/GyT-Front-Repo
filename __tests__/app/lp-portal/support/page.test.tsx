import { render, screen } from '@/test-utils'
import SupportPage from '@/app/lp-portal/support/page'

describe('SupportPage', () => {
  it('renders the page title', () => {
    render(<SupportPage />)

    expect(screen.getByRole('heading', { name: /get help/i, level: 1 })).toBeInTheDocument()
  })

  it('renders support options cards', () => {
    render(<SupportPage />)

    expect(screen.getByText('Chat Support')).toBeInTheDocument()
    expect(screen.getByText('Email Support')).toBeInTheDocument()
    expect(screen.getByText('Phone Support')).toBeInTheDocument()
  })

  it('renders support form fields', () => {
    render(<SupportPage />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<SupportPage />)

    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument()
  })

  it('renders all support option buttons', () => {
    render(<SupportPage />)

    expect(screen.getByRole('button', { name: /start chat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send email/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+1 \(555\) 123-4567/i })).toBeInTheDocument()
  })

  it('renders FAQ section', () => {
    render(<SupportPage />)

    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
    expect(screen.getByText(/this section is under construction/i)).toBeInTheDocument()
  })

  it('has correct form input placeholders', () => {
    render(<SupportPage />)

    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Brief description of your issue')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/please provide as much detail as possible/i)).toBeInTheDocument()
  })

  it('renders support icons', () => {
    const { container } = render(<SupportPage />)

    // Check that icons are rendered (lucide-react icons)
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })
})
