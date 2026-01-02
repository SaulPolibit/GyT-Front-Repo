import {
  calculateValueAtDate,
  calculateTotalAUM,
  calculateWeightedAvgIRR,
  calculateTotalUnrealizedGains,
  calculateTotalInvested,
  calculatePortfolioMultiple,
  adjustAUMForTransactions,
  calculatePortfolioIRR,
  type Investment,
} from '../investment-calculations'

describe('Investment Calculations', () => {
  const mockInvestment: Investment = {
    id: 'inv-1',
    totalFundPosition: {
      totalInvested: 100000,
      currentValue: 150000,
      irr: 15,
      multiple: 1.5,
    },
    acquisitionDate: '2022-01-01',
    lastValuationDate: '2024-01-01',
  }

  const mockInvestment2: Investment = {
    id: 'inv-2',
    totalFundPosition: {
      totalInvested: 200000,
      currentValue: 280000,
      irr: 20,
      multiple: 1.4,
    },
    acquisitionDate: '2023-01-01',
    lastValuationDate: '2024-01-01',
  }

  describe('calculateValueAtDate', () => {
    it('calculates investment value at a future date using IRR', () => {
      const value = calculateValueAtDate(mockInvestment, '2024-01-01')
      // Expected: 100000 * (1.15)^2 ≈ 132250
      expect(value).toBeGreaterThan(130000)
      expect(value).toBeLessThan(135000)
    })

    it('returns principal amount at acquisition date', () => {
      const value = calculateValueAtDate(mockInvestment, '2022-01-01')
      expect(value).toBeCloseTo(100000, -2)
    })

    it('handles negative IRR correctly', () => {
      const negativeIrrInvestment: Investment = {
        ...mockInvestment,
        totalFundPosition: {
          ...mockInvestment.totalFundPosition,
          irr: -10,
        },
      }
      const value = calculateValueAtDate(negativeIrrInvestment, '2023-01-01')
      // Value should be less than principal with negative IRR
      expect(value).toBeLessThan(100000)
    })
  })

  describe('calculateTotalAUM', () => {
    it('calculates total AUM for included investments', () => {
      const investments = [mockInvestment, mockInvestment2]
      const totalAUM = calculateTotalAUM(investments, ['inv-1', 'inv-2'], '2024-01-01')
      expect(totalAUM).toBeGreaterThan(0)
    })

    it('only includes specified investment IDs', () => {
      const investments = [mockInvestment, mockInvestment2]
      const totalAUM = calculateTotalAUM(investments, ['inv-1'], '2024-01-01')
      const singleValue = calculateValueAtDate(mockInvestment, '2024-01-01')
      expect(totalAUM).toBe(singleValue)
    })

    it('returns 0 for empty investment list', () => {
      const totalAUM = calculateTotalAUM([], [], '2024-01-01')
      expect(totalAUM).toBe(0)
    })
  })

  describe('calculateWeightedAvgIRR', () => {
    it('calculates weighted average IRR', () => {
      const investments = [mockInvestment, mockInvestment2]
      const weightedIRR = calculateWeightedAvgIRR(investments, ['inv-1', 'inv-2'], '2024-01-01')
      // Should be between 15 and 20 (the two IRRs)
      expect(weightedIRR).toBeGreaterThanOrEqual(15)
      expect(weightedIRR).toBeLessThanOrEqual(20)
    })

    it('returns 0 for empty investment list', () => {
      const weightedIRR = calculateWeightedAvgIRR([], [], '2024-01-01')
      expect(weightedIRR).toBe(0)
    })

    it('rounds to 1 decimal place', () => {
      const investments = [mockInvestment]
      const weightedIRR = calculateWeightedAvgIRR(investments, ['inv-1'], '2024-01-01')
      const decimalPlaces = (weightedIRR.toString().split('.')[1] || '').length
      expect(decimalPlaces).toBeLessThanOrEqual(1)
    })
  })

  describe('calculateTotalUnrealizedGains', () => {
    it('calculates total unrealized gains', () => {
      const investments = [mockInvestment]
      const gains = calculateTotalUnrealizedGains(investments, ['inv-1'], '2024-01-01')
      expect(gains).toBeGreaterThan(0)
    })

    it('handles losses (negative gains)', () => {
      const losingInvestment: Investment = {
        ...mockInvestment,
        totalFundPosition: {
          ...mockInvestment.totalFundPosition,
          irr: -20,
        },
      }
      const investments = [losingInvestment]
      const gains = calculateTotalUnrealizedGains(investments, ['inv-1'], '2024-01-01')
      expect(gains).toBeLessThan(0)
    })
  })

  describe('calculateTotalInvested', () => {
    it('sums total invested capital', () => {
      const investments = [mockInvestment, mockInvestment2]
      const totalInvested = calculateTotalInvested(investments, ['inv-1', 'inv-2'])
      expect(totalInvested).toBe(300000) // 100000 + 200000
    })

    it('only includes specified investment IDs', () => {
      const investments = [mockInvestment, mockInvestment2]
      const totalInvested = calculateTotalInvested(investments, ['inv-1'])
      expect(totalInvested).toBe(100000)
    })
  })

  describe('calculatePortfolioMultiple', () => {
    it('calculates MOIC (Multiple on Invested Capital)', () => {
      const investments = [mockInvestment]
      const multiple = calculatePortfolioMultiple(investments, ['inv-1'], '2024-01-01')
      expect(multiple).toBeGreaterThan(1) // Should have positive returns
    })

    it('returns 0 when total invested is 0', () => {
      const multiple = calculatePortfolioMultiple([], [], '2024-01-01')
      expect(multiple).toBe(0)
    })

    it('rounds to 2 decimal places', () => {
      const investments = [mockInvestment]
      const multiple = calculatePortfolioMultiple(investments, ['inv-1'], '2024-01-01')
      const decimalPlaces = (multiple.toString().split('.')[1] || '').length
      expect(decimalPlaces).toBeLessThanOrEqual(2)
    })
  })

  describe('adjustAUMForTransactions', () => {
    it('subtracts distributions from base AUM', () => {
      const adjustedAUM = adjustAUMForTransactions(1000000, 0, 100000)
      expect(adjustedAUM).toBe(900000)
    })

    it('does not add capital calls (already reflected in investments)', () => {
      const adjustedAUM = adjustAUMForTransactions(1000000, 50000, 0)
      expect(adjustedAUM).toBe(1000000) // Capital calls not added
    })

    it('handles both capital calls and distributions', () => {
      const adjustedAUM = adjustAUMForTransactions(1000000, 50000, 100000)
      expect(adjustedAUM).toBe(900000) // Only distributions subtracted
    })
  })

  describe('calculatePortfolioIRR', () => {
    it('calculates portfolio-level IRR', () => {
      const investments = [mockInvestment]
      const irr = calculatePortfolioIRR(investments, ['inv-1'], '2024-01-01')
      expect(irr).toBeGreaterThan(0)
    })

    it('returns 0 for empty investment list', () => {
      const irr = calculatePortfolioIRR([], [], '2024-01-01')
      expect(irr).toBe(0)
    })

    it('rounds to 1 decimal place', () => {
      const investments = [mockInvestment]
      const irr = calculatePortfolioIRR(investments, ['inv-1'], '2024-01-01')
      const decimalPlaces = (irr.toString().split('.')[1] || '').length
      expect(decimalPlaces).toBeLessThanOrEqual(1)
    })
  })
})
