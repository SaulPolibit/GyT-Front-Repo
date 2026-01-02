import { render, screen, waitFor } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import SignUpPage from '@/app/sign-up/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    login: jest.fn(),
    isLoggedIn: false,
  })),
}))

jest.mock('@/lib/auth-storage', () => ({
  getRedirectPath: jest.fn((role) =>
    role === 'investment-manager' ? '/investment-manager' : '/lp-portal/portfolio'
  ),
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

describe('SignUpPage', () => {
  const mockPush = jest.fn()
  const mockLogin = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })

    const { useAuth } = require('@/hooks/useAuth')
    useAuth.mockReturnValue({
      login: mockLogin,
      isLoggedIn: false,
    })
  })

  it('renders the sign up form', () => {
    render(<SignUpPage />)

    expect(screen.getByText(/create your account/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
  })

  it('renders role selection radio buttons', () => {
    render(<SignUpPage />)

    expect(screen.getByLabelText(/fund manager \/ gp/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/investor \/ lp/i)).toBeInTheDocument()
  })

  it('has correct default role selected', () => {
    render(<SignUpPage />)

    const managerRadio = screen.getByRole('radio', { name: /fund manager \/ gp/i })
    expect(managerRadio).toBeChecked()
  })

  it('allows changing role selection', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const lpRadio = screen.getByRole('radio', { name: /investor \/ lp/i })
    await user.click(lpRadio)

    expect(lpRadio).toBeChecked()
  })

  it('shows error when submitting without email', async () => {
    const { toast } = require('sonner')
    const user = userEvent.setup()
    render(<SignUpPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    await user.type(nameInput, 'John Doe')

    const signUpButton = screen.getByRole('button', { name: /create account/i })
    await user.click(signUpButton)

    expect(toast.error).toHaveBeenCalledWith('Please enter your email')
  })

  it('shows error when submitting without name', async () => {
    const { toast } = require('sonner')
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'test@example.com')

    const signUpButton = screen.getByRole('button', { name: /create account/i })
    await user.click(signUpButton)

    expect(toast.error).toHaveBeenCalledWith('Please enter your name')
  })

  it('successfully creates account with valid data', async () => {
    const { toast } = require('sonner')
    const user = userEvent.setup()
    render(<SignUpPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')

    const signUpButton = screen.getByRole('button', { name: /create account/i })
    await user.click(signUpButton)

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'john@example.com',
      name: 'John Doe',
      role: 'investment-manager',
    })
    expect(toast.success).toHaveBeenCalledWith('Account created! Welcome, John Doe!')
    expect(mockPush).toHaveBeenCalledWith('/investment-manager')
  })

  it('redirects to LP portal when LP role is selected', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const lpRadio = screen.getByRole('radio', { name: /investor \/ lp/i })
    await user.click(lpRadio)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)

    await user.type(nameInput, 'Jane Doe')
    await user.type(emailInput, 'jane@example.com')

    const signUpButton = screen.getByRole('button', { name: /create account/i })
    await user.click(signUpButton)

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'jane@example.com',
      name: 'Jane Doe',
      role: 'lp-portal',
    })
    expect(mockPush).toHaveBeenCalledWith('/lp-portal/portfolio')
  })

  it('allows submission with Enter key', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com{Enter}')

    expect(mockLogin).toHaveBeenCalled()
  })

  it('redirects if already logged in', () => {
    const { useAuth } = require('@/hooks/useAuth')
    useAuth.mockReturnValue({
      login: mockLogin,
      isLoggedIn: true,
    })

    render(<SignUpPage />)

    expect(mockPush).toHaveBeenCalledWith('/investment-manager')
  })

  it('renders link to sign in page', () => {
    render(<SignUpPage />)

    const signInLink = screen.getByRole('link', { name: /sign in/i })
    expect(signInLink).toHaveAttribute('href', '/sign-in')
  })
})
