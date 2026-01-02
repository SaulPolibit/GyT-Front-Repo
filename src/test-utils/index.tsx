import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any custom options here
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult => {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Mock localStorage helpers
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
  }
}

// Helper to wait for async operations
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

// Helper to create mock structure data
export const createMockStructure = (overrides = {}) => ({
  id: 'mock-structure-id',
  name: 'Test Fund',
  type: 'Fund',
  status: 'active',
  createdAt: new Date().toISOString(),
  ...overrides,
})

// Helper to create mock investment data
export const createMockInvestment = (overrides = {}) => ({
  id: 'mock-investment-id',
  fundId: 'mock-structure-id',
  type: 'Real Estate',
  investmentType: 'EQUITY',
  totalInvestmentSize: 1000000,
  fundCommitment: 250000,
  ownershipPercentage: 25,
  geography: {
    city: 'New York',
    state: 'NY',
    country: 'USA',
  },
  ...overrides,
})

// Helper to create mock investor data
export const createMockInvestor = (overrides = {}) => ({
  id: 'mock-investor-id',
  name: 'Test Investor',
  email: 'investor@test.com',
  createdAt: new Date().toISOString(),
  ...overrides,
})

// Re-export everything from @testing-library/react
export * from '@testing-library/react'

// Override render method
export { customRender as render }
