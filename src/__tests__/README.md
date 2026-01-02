# Testing Guide

This directory contains test utilities for the Polibit application.

## Test Structure

All tests are located in the `__tests__/` directory at the project root:

```
__tests__/
├── app/                         # App page tests
│   ├── page.test.tsx
│   ├── sign-up/
│   │   └── page.test.tsx
│   └── lp-portal/
│       ├── page.test.tsx
│       ├── search/
│       │   └── page.test.tsx
│       └── support/
│           └── page.test.tsx
├── components/                  # Component tests
│   └── ui/
│       └── button.test.tsx
└── lib/                        # Library and utility tests
    ├── utils.test.ts
    └── investment-calculations.test.ts

src/
└── test-utils/                 # Testing utilities and helpers
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Patterns

### Component Testing

Test UI components in isolation using React Testing Library:

```tsx
import { render, screen } from '@/test-utils'
import { Button } from '../button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Library/Utility Testing

Test pure functions and business logic:

```tsx
import { calculateValueAtDate } from '../investment-calculations'

describe('Investment Calculations', () => {
  it('calculates value correctly', () => {
    const value = calculateValueAtDate(mockInvestment, '2024-01-01')
    expect(value).toBeGreaterThan(0)
  })
})
```

### Testing with localStorage

Use the mock localStorage provided in test setup:

```tsx
beforeEach(() => {
  localStorage.clear()
})

it('saves data to localStorage', () => {
  const data = { id: '1', name: 'Test' }
  localStorage.setItem('key', JSON.stringify(data))
  expect(localStorage.getItem).toHaveBeenCalledWith('key')
})
```

### Testing Next.js Navigation

The router is mocked in `jest.setup.ts`:

```tsx
import { useRouter } from 'next/navigation'

const router = useRouter()
router.push('/dashboard')
expect(router.push).toHaveBeenCalledWith('/dashboard')
```

## Test Utilities

The `test-utils` directory provides helpers:

- `render()` - Custom render with providers
- `mockLocalStorage()` - localStorage mock utilities
- `createMockStructure()` - Create mock structure data
- `createMockInvestment()` - Create mock investment data
- `createMockInvestor()` - Create mock investor data

## Best Practices

1. **Arrange, Act, Assert** - Structure tests clearly
2. **Test Behavior, Not Implementation** - Focus on what users see
3. **Use Data Testids Sparingly** - Prefer accessible queries (role, label, text)
4. **Mock External Dependencies** - API calls, localStorage, etc.
5. **Clean Up** - Clear mocks and storage between tests
6. **Descriptive Test Names** - Use clear, specific descriptions

## Example Test Structure

```tsx
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, clear storage, etc.
  })

  // Teardown
  afterEach(() => {
    // Clean up
  })

  describe('Feature Group', () => {
    it('does something specific', () => {
      // Arrange
      const props = { ... }

      // Act
      render(<Component {...props} />)

      // Assert
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})
```

## Coverage Goals

- **Components**: Aim for 80%+ coverage
- **Utilities**: Aim for 90%+ coverage
- **Business Logic**: Aim for 95%+ coverage

## Common Testing Scenarios

### User Interactions

```tsx
import userEvent from '@testing-library/user-event'

it('handles click events', async () => {
  const user = userEvent.setup()
  const handleClick = jest.fn()

  render(<Button onClick={handleClick}>Click</Button>)
  await user.click(screen.getByRole('button'))

  expect(handleClick).toHaveBeenCalled()
})
```

### Form Submissions

```tsx
it('submits form data', async () => {
  const user = userEvent.setup()
  const handleSubmit = jest.fn()

  render(<Form onSubmit={handleSubmit} />)

  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))

  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
  })
})
```

### Async Operations

```tsx
import { waitFor } from '@testing-library/react'

it('loads data asynchronously', async () => {
  render(<DataComponent />)

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

## Debugging Tests

```tsx
import { screen } from '@testing-library/react'

// Print current DOM
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))
```

## Additional Resources

- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
