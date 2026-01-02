# Testing Setup for Polibit

Complete testing environment for Next.js 15 with TypeScript, React Testing Library, and Jest.

## Installation

All testing dependencies have been installed:

- `jest` - Testing framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers
- `@testing-library/user-event` - User interaction simulation
- `jest-environment-jsdom` - DOM environment for tests
- `@types/jest` - TypeScript definitions

## Configuration Files

### `jest.config.ts`

Jest configuration optimized for Next.js 15:

- Uses `next/jest` for automatic Next.js integration
- Configured for TypeScript and JSX
- Path aliases (`@/`) mapped correctly
- Coverage collection from `src/**` files
- Ignores `.next/` and `node_modules/`

### `jest.setup.ts`

Global test setup including:

- `@testing-library/jest-dom` matchers
- Next.js router mocks (`useRouter`, `usePathname`, `useSearchParams`)
- localStorage mock
- `window.matchMedia` mock
- `IntersectionObserver` mock
- `ResizeObserver` mock

### `src/test-utils/index.tsx`

Custom testing utilities:

- `render()` - Enhanced render function with providers
- `mockLocalStorage()` - localStorage mock helpers
- `createMockStructure()` - Mock structure data factory
- `createMockInvestment()` - Mock investment data factory
- `createMockInvestor()` - Mock investor data factory
- Re-exports all React Testing Library utilities

## NPM Scripts

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Example Tests Created

### 1. UI Component Test
`src/components/ui/__tests__/button.test.tsx`

Tests the Button component:
- Different variants (default, destructive, outline, etc.)
- Different sizes (sm, default, lg, icon)
- Click events
- Disabled state
- Custom className
- asChild prop with Slot
- Type attribute

### 2. Business Logic Test
`src/lib/__tests__/investment-calculations.test.ts`

Tests investment calculation functions:
- `calculateValueAtDate()` - IRR-based value calculation
- `calculateTotalAUM()` - Total assets under management
- `calculateWeightedAvgIRR()` - Weighted average IRR
- `calculateTotalUnrealizedGains()` - Unrealized gains/losses
- `calculateTotalInvested()` - Total invested capital
- `calculatePortfolioMultiple()` - MOIC calculation
- `adjustAUMForTransactions()` - AUM adjustments
- `calculatePortfolioIRR()` - Portfolio-level IRR

### 3. Utility Test
`src/lib/__tests__/utils.test.ts`

Tests the `cn()` className merger utility:
- Basic class merging
- Conditional classes
- Tailwind conflict resolution
- Arrays, objects, undefined/null handling

## Writing New Tests

### Component Test Template

```tsx
import { render, screen } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import { YourComponent } from '../your-component'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByRole('...')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()

    render(<YourComponent onClick={handleClick} />)
    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalled()
  })
})
```

### Library Test Template

```tsx
import { yourFunction } from '../your-module'

describe('yourFunction', () => {
  it('calculates correctly', () => {
    const result = yourFunction(input)
    expect(result).toBe(expectedOutput)
  })

  it('handles edge cases', () => {
    expect(yourFunction(null)).toBe(defaultValue)
  })
})
```

## Test File Naming

Tests should be placed in `__tests__` directories:

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       └── __tests__/
│           └── button.test.tsx
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts
└── app/
    └── page.tsx (create tests in src/__tests__/ for pages)
```

## Testing Best Practices

1. **Test User Behavior** - Focus on what users see and do
2. **Avoid Implementation Details** - Don't test internal state
3. **Use Semantic Queries** - Prefer `getByRole`, `getByLabelText`, `getByText`
4. **Test Accessibility** - Ensure components are accessible
5. **Keep Tests Simple** - One assertion per test when possible
6. **Mock External Dependencies** - APIs, localStorage, etc.
7. **Clean Up** - Reset mocks between tests

## Common Testing Patterns

### Testing Forms

```tsx
it('submits form data', async () => {
  const user = userEvent.setup()
  const handleSubmit = jest.fn()

  render(<Form onSubmit={handleSubmit} />)

  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))

  expect(handleSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ email: 'test@example.com' })
  )
})
```

### Testing Async Data Loading

```tsx
import { waitFor } from '@testing-library/react'

it('loads and displays data', async () => {
  render(<DataComponent />)

  await waitFor(() => {
    expect(screen.getByText('Loaded data')).toBeInTheDocument()
  })
})
```

### Testing localStorage

```tsx
beforeEach(() => {
  localStorage.clear()
})

it('saves to localStorage', () => {
  const data = { id: '1', name: 'Test' }
  localStorage.setItem('key', JSON.stringify(data))

  const saved = JSON.parse(localStorage.getItem('key') || '{}')
  expect(saved).toEqual(data)
})
```

## Coverage Reports

After running `npm run test:coverage`, view the report:

```bash
# Open in browser
open coverage/lcov-report/index.html
```

Coverage goals:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Debugging Tests

```tsx
// Print current DOM
import { screen } from '@testing-library/react'
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))

// Use --verbose flag
npm test -- --verbose

// Run specific test file
npm test -- button.test.tsx

// Run tests matching pattern
npm test -- --testNamePattern="renders correctly"
```

## Next Steps

1. Write tests for critical business logic first
2. Add tests for complex components
3. Gradually increase coverage
4. Set up CI/CD to run tests automatically
5. Configure pre-commit hooks to run tests

## Additional Resources

- [React Testing Library Documentation](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
