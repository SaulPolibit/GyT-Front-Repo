# Waterfall Calculations Documentation

Comprehensive guide to waterfall distribution algorithms in the Polibit investment management platform.

## Overview

Waterfall calculations determine how profits are distributed among Limited Partners (LPs) and General Partners (GPs) based on predefined tiers and hurdle rates.

**Key Concepts:**
- **Return of Capital (ROC)**: Return LPs' contributed capital first
- **Preferred Return**: Guaranteed minimum return to LPs (typically 8%)
- **GP Catch-Up**: GP receives additional allocation to reach target carried interest
- **Carried Interest (Carry)**: GP's profit share after hurdle rates are met

## Supported Waterfall Types

### 1. American Waterfall (Deal-by-Deal)

Distributions are calculated on a deal-by-deal basis, with catch-up after each investment.

**Tiers:**
1. Return of Capital (100% LP)
2. Preferred Return - 8% (100% LP)
3. Profit Split - 80/20 (80% LP, 20% GP)

**Characteristics:**
- Simpler structure (3 tiers)
- No GP catch-up tier
- GP participates in profits immediately after preferred return
- Commonly used in real estate funds

###2. European Waterfall (Whole Fund)

Distributions are calculated across the entire fund, with GP catch-up tier.

**Tiers:**
1. Return of Capital (100% LP)
2. Preferred Return - 8% (100% LP)
3. GP Catch-Up (100% GP until reaching 20% total)
4. Carried Interest - 80/20 (80% LP, 20% GP)

**Characteristics:**
- More complex (4 tiers)
- Includes GP catch-up mechanism
- GP reaches target carry percentage before continuing splits
- Commonly used in private equity funds

## File Structure

```
src/lib/
└── waterfall-calculations.ts    # Core waterfall algorithms

Usage in:
└── src/app/investment-manager/
    ├── operations/distributions/create/page.tsx
    └── waterfalls/page.tsx       # Waterfall calculator tool
```

## Data Structures

### Waterfall Configuration

```typescript
interface WaterfallTier {
  name: string
  type: 'capital_return' | 'preferred_return' | 'catch_up' | 'profit'
  targetAmount?: number | null
  targetRate?: number
  lpPercentage: number
  gpPercentage: number
}

interface WaterfallConfig {
  tiers: WaterfallTier[]
}
```

### American Waterfall Definition

```typescript
export const AMERICAN_WATERFALL: WaterfallConfig = {
  tiers: [
    {
      name: 'Return of Capital',
      type: 'capital_return',
      targetAmount: null, // All contributed capital
      lpPercentage: 100,
      gpPercentage: 0
    },
    {
      name: 'Preferred Return (8%)',
      type: 'preferred_return',
      targetRate: 0.08, // 8% annual
      lpPercentage: 100,
      gpPercentage: 0
    },
    {
      name: 'Profit Split',
      type: 'profit',
      lpPercentage: 80,
      gpPercentage: 20
    }
  ]
}
```

### European Waterfall Definition

```typescript
export const EUROPEAN_WATERFALL: WaterfallConfig = {
  tiers: [
    {
      name: 'Return of Capital',
      type: 'capital_return',
      targetAmount: null,
      lpPercentage: 100,
      gpPercentage: 0
    },
    {
      name: 'Preferred Return (8%)',
      type: 'preferred_return',
      targetRate: 0.08,
      lpPercentage: 100,
      gpPercentage: 0
    },
    {
      name: 'GP Catch-Up',
      type: 'catch_up',
      lpPercentage: 0,
      gpPercentage: 100,
      targetGPPercentage: 20 // GP catches up to 20% of total
    },
    {
      name: 'Carried Interest (80/20)',
      type: 'profit',
      lpPercentage: 80,
      gpPercentage: 20
    }
  ]
}
```

### Investor Capital Account

```typescript
interface InvestorCapitalAccount {
  investorId: string
  investorName: string
  capitalContributed: number
  capitalReturned: number
  preferredReturnAccrued: number
  preferredReturnPaid: number
  distributionsReceived: number
}
```

### Waterfall Result

```typescript
interface WaterfallResult {
  totalDistributed: number
  lpAllocations: InvestorAllocation[]
  gpAllocation: GPAllocation
  tierDistributions: TierDistribution[]
}

interface InvestorAllocation {
  investorId: string
  investorName: string
  capitalReturn: number
  preferredReturn: number
  profit: number
  totalAmount: number
}

interface GPAllocation {
  catchUp: number
  carriedInterest: number
  totalAmount: number
}

interface TierDistribution {
  tierName: string
  tierType: string
  amountDistributed: number
  lpAmount: number
  gpAmount: number
}
```

## Core Algorithm

### Main Calculation Function

**Location**: `src/lib/waterfall-calculations.ts`

```typescript
export function calculateWaterfall(
  waterfallConfig: WaterfallConfig,
  totalDistribution: number,
  capitalAccounts: InvestorCapitalAccount[],
  fundInceptionDate: string,
  distributionDate: string
): WaterfallResult {
  let remainingDistribution = totalDistribution
  const lpAllocations: Map<string, InvestorAllocation> = new Map()
  const tierDistributions: TierDistribution[] = []
  let gpTotalCatchUp = 0
  let gpTotalCarry = 0

  // Initialize LP allocations
  capitalAccounts.forEach(account => {
    lpAllocations.set(account.investorId, {
      investorId: account.investorId,
      investorName: account.investorName,
      capitalReturn: 0,
      preferredReturn: 0,
      profit: 0,
      totalAmount: 0
    })
  })

  // Process each tier sequentially
  for (const tier of waterfallConfig.tiers) {
    if (remainingDistribution <= 0) break

    const tierResult = processTier(
      tier,
      remainingDistribution,
      capitalAccounts,
      lpAllocations,
      fundInceptionDate,
      distributionDate
    )

    // Update remaining distribution
    remainingDistribution -= tierResult.amountDistributed

    // Record tier distribution
    tierDistributions.push({
      tierName: tier.name,
      tierType: tier.type,
      amountDistributed: tierResult.amountDistributed,
      lpAmount: tierResult.lpAmount,
      gpAmount: tierResult.gpAmount
    })

    // Track GP allocations
    if (tier.type === 'catch_up') {
      gpTotalCatchUp += tierResult.gpAmount
    } else if (tier.type === 'profit') {
      gpTotalCarry += tierResult.gpAmount
    }
  }

  return {
    totalDistributed: totalDistribution - remainingDistribution,
    lpAllocations: Array.from(lpAllocations.values()),
    gpAllocation: {
      catchUp: gpTotalCatchUp,
      carriedInterest: gpTotalCarry,
      totalAmount: gpTotalCatchUp + gpTotalCarry
    },
    tierDistributions
  }
}
```

### Tier Processing

```typescript
function processTier(
  tier: WaterfallTier,
  availableAmount: number,
  capitalAccounts: InvestorCapitalAccount[],
  lpAllocations: Map<string, InvestorAllocation>,
  fundInceptionDate: string,
  distributionDate: string
): TierResult {
  switch (tier.type) {
    case 'capital_return':
      return processCapitalReturn(tier, availableAmount, capitalAccounts, lpAllocations)

    case 'preferred_return':
      return processPreferredReturn(
        tier,
        availableAmount,
        capitalAccounts,
        lpAllocations,
        fundInceptionDate,
        distributionDate
      )

    case 'catch_up':
      return processCatchUp(tier, availableAmount, lpAllocations)

    case 'profit':
      return processProfit(tier, availableAmount, capitalAccounts, lpAllocations)

    default:
      throw new Error(`Unknown tier type: ${tier.type}`)
  }
}
```

### Capital Return Processing

```typescript
function processCapitalReturn(
  tier: WaterfallTier,
  availableAmount: number,
  capitalAccounts: InvestorCapitalAccount[],
  lpAllocations: Map<string, InvestorAllocation>
): TierResult {
  // Calculate total unreturned capital
  const totalUnreturnedCapital = capitalAccounts.reduce((sum, account) =>
    sum + (account.capitalContributed - account.capitalReturned), 0
  )

  // Amount to distribute in this tier
  const amountToDistribute = Math.min(availableAmount, totalUnreturnedCapital)

  // Allocate pro-rata based on unreturned capital
  let totalDistributed = 0
  capitalAccounts.forEach(account => {
    const unreturnedCapital = account.capitalContributed - account.capitalReturned
    if (unreturnedCapital > 0) {
      const allocation = (unreturnedCapital / totalUnreturnedCapital) * amountToDistribute
      const lpAlloc = lpAllocations.get(account.investorId)!
      lpAlloc.capitalReturn += allocation
      lpAlloc.totalAmount += allocation
      totalDistributed += allocation
    }
  })

  return {
    amountDistributed: totalDistributed,
    lpAmount: totalDistributed,
    gpAmount: 0
  }
}
```

### Preferred Return Processing

```typescript
function processPreferredReturn(
  tier: WaterfallTier,
  availableAmount: number,
  capitalAccounts: InvestorCapitalAccount[],
  lpAllocations: Map<string, InvestorAllocation>,
  fundInceptionDate: string,
  distributionDate: string
): TierResult {
  const preferredRate = tier.targetRate || 0.08 // Default 8%

  // Calculate years since fund inception
  const inceptionDate = new Date(fundInceptionDate)
  const distDate = new Date(distributionDate)
  const yearsElapsed = (distDate.getTime() - inceptionDate.getTime()) /
    (1000 * 60 * 60 * 24 * 365.25)

  // Calculate total preferred return owed
  let totalPreferredOwed = 0
  const preferredByInvestor: Map<string, number> = new Map()

  capitalAccounts.forEach(account => {
    const capitalAtRisk = account.capitalContributed - account.capitalReturned
    const preferredOwed = Math.max(0,
      (capitalAtRisk * preferredRate * yearsElapsed) - account.preferredReturnPaid
    )
    preferredByInvestor.set(account.investorId, preferredOwed)
    totalPreferredOwed += preferredOwed
  })

  // Amount to distribute in this tier
  const amountToDistribute = Math.min(availableAmount, totalPreferredOwed)

  // Allocate pro-rata based on preferred owed
  let totalDistributed = 0
  capitalAccounts.forEach(account => {
    const preferredOwed = preferredByInvestor.get(account.investorId) || 0
    if (preferredOwed > 0 && totalPreferredOwed > 0) {
      const allocation = (preferredOwed / totalPreferredOwed) * amountToDistribute
      const lpAlloc = lpAllocations.get(account.investorId)!
      lpAlloc.preferredReturn += allocation
      lpAlloc.totalAmount += allocation
      totalDistributed += allocation
    }
  })

  return {
    amountDistributed: totalDistributed,
    lpAmount: totalDistributed,
    gpAmount: 0
  }
}
```

### GP Catch-Up Processing

```typescript
function processCatchUp(
  tier: WaterfallTier,
  availableAmount: number,
  lpAllocations: Map<string, InvestorAllocation>
): TierResult {
  const targetGPPercentage = tier.targetGPPercentage || 0.20 // Default 20%

  // Calculate total distributed to LPs so far
  let totalLPDistributed = 0
  lpAllocations.forEach(alloc => {
    totalLPDistributed += alloc.totalAmount
  })

  // Calculate how much GP needs to catch up to reach target percentage
  // GP wants: targetGPPercentage × (totalLPDistributed + gpCatchUp)
  // Solving: gpCatchUp = targetGPPercentage × totalLPDistributed / (1 - targetGPPercentage)
  const gpCatchUpNeeded = (targetGPPercentage * totalLPDistributed) / (1 - targetGPPercentage)

  // Amount to distribute (cannot exceed available)
  const amountToDistribute = Math.min(availableAmount, gpCatchUpNeeded)

  return {
    amountDistributed: amountToDistribute,
    lpAmount: 0,
    gpAmount: amountToDistribute
  }
}
```

### Profit Split Processing

```typescript
function processProfit(
  tier: WaterfallTier,
  availableAmount: number,
  capitalAccounts: InvestorCapitalAccount[],
  lpAllocations: Map<string, InvestorAllocation>
): TierResult {
  const lpPercentage = tier.lpPercentage / 100
  const gpPercentage = tier.gpPercentage / 100

  // All remaining amount is profit to split
  const amountToDistribute = availableAmount

  const lpAmount = amountToDistribute * lpPercentage
  const gpAmount = amountToDistribute * gpPercentage

  // Calculate total capital contributed by all LPs
  const totalCapitalContributed = capitalAccounts.reduce((sum, account) =>
    sum + account.capitalContributed, 0
  )

  // Allocate LP profit pro-rata based on capital contributed
  capitalAccounts.forEach(account => {
    const capitalFraction = account.capitalContributed / totalCapitalContributed
    const allocation = lpAmount * capitalFraction
    const lpAlloc = lpAllocations.get(account.investorId)!
    lpAlloc.profit += allocation
    lpAlloc.totalAmount += allocation
  })

  return {
    amountDistributed: amountToDistribute,
    lpAmount,
    gpAmount
  }
}
```

## Example Calculations

### Example 1: American Waterfall - Small Distribution

**Setup:**
```typescript
Fund Created: 2020-01-01
Distribution Date: 2025-01-01 (5 years later)
Distribution Amount: $5,000,000

Investors:
  - Metropolitan Pension: $20M contributed
  - Rodriguez Capital: $12M contributed
Total LP Capital: $32M

Waterfall: American (3 tiers)
Preferred Rate: 8% annually
```

**Calculation:**

**Tier 1: Return of Capital**
- Target: $32,000,000 (all contributed capital)
- Available: $5,000,000
- Amount Used: $5,000,000 (partial return)

Allocations:
- Metropolitan: $5M × ($20M / $32M) = $3,125,000
- Rodriguez: $5M × ($12M / $32M) = $1,875,000

**Tier 2: Preferred Return**
- Not reached (distribution exhausted)

**Tier 3: Profit Split**
- Not reached

**Result:**
```typescript
{
  totalDistributed: 5000000,
  lpAllocations: [
    {
      investorId: 'metro',
      investorName: 'Metropolitan Pension',
      capitalReturn: 3125000,
      preferredReturn: 0,
      profit: 0,
      totalAmount: 3125000
    },
    {
      investorId: 'rodriguez',
      investorName: 'Rodriguez Capital',
      capitalReturn: 1875000,
      preferredReturn: 0,
      profit: 0,
      totalAmount: 1875000
    }
  ],
  gpAllocation: {
    catchUp: 0,
    carriedInterest: 0,
    totalAmount: 0
  },
  tierDistributions: [
    {
      tierName: 'Return of Capital',
      tierType: 'capital_return',
      amountDistributed: 5000000,
      lpAmount: 5000000,
      gpAmount: 0
    },
    {
      tierName: 'Preferred Return (8%)',
      tierType: 'preferred_return',
      amountDistributed: 0,
      lpAmount: 0,
      gpAmount: 0
    },
    {
      tierName: 'Profit Split',
      tierType: 'profit',
      amountDistributed: 0,
      lpAmount: 0,
      gpAmount: 0
    }
  ]
}
```

### Example 2: American Waterfall - All Tiers Reached

**Setup:**
```typescript
Distribution Amount: $50,000,000
LP Capital Contributed: $32,000,000
5 years elapsed
```

**Calculation:**

**Tier 1: Return of Capital**
- Target: $32,000,000
- Available: $50,000,000
- Amount Used: $32,000,000 ✓

Allocations:
- Metropolitan: $32M × 62.5% = $20,000,000
- Rodriguez: $32M × 37.5% = $12,000,000

Remaining: $18,000,000

**Tier 2: Preferred Return (8% for 5 years)**
- Calculation: $32M × 8% × 5 years = $12,800,000
- Available: $18,000,000
- Amount Used: $12,800,000 ✓

Allocations:
- Metropolitan: $12.8M × 62.5% = $8,000,000
- Rodriguez: $12.8M × 37.5% = $4,800,000

Remaining: $5,200,000

**Tier 3: Profit Split (80/20)**
- Available: $5,200,000
- LP Share (80%): $4,160,000
- GP Share (20%): $1,040,000

LP Allocations:
- Metropolitan: $4.16M × 62.5% = $2,600,000
- Rodriguez: $4.16M × 37.5% = $1,560,000

**Result:**
```typescript
{
  totalDistributed: 50000000,
  lpAllocations: [
    {
      investorId: 'metro',
      investorName: 'Metropolitan Pension',
      capitalReturn: 20000000,
      preferredReturn: 8000000,
      profit: 2600000,
      totalAmount: 30600000
    },
    {
      investorId: 'rodriguez',
      investorName: 'Rodriguez Capital',
      capitalReturn: 12000000,
      preferredReturn: 4800000,
      profit: 1560000,
      totalAmount: 18360000
    }
  ],
  gpAllocation: {
    catchUp: 0,
    carriedInterest: 1040000,
    totalAmount: 1040000
  },
  tierDistributions: [
    {
      tierName: 'Return of Capital',
      amountDistributed: 32000000,
      lpAmount: 32000000,
      gpAmount: 0
    },
    {
      tierName: 'Preferred Return (8%)',
      amountDistributed: 12800000,
      lpAmount: 12800000,
      gpAmount: 0
    },
    {
      tierName: 'Profit Split',
      amountDistributed: 5200000,
      lpAmount: 4160000,
      gpAmount: 1040000
    }
  ]
}
```

### Example 3: European Waterfall with Catch-Up

**Setup:**
```typescript
Distribution Amount: $50,000,000
Same investors and capital as above
```

**Calculation:**

**Tiers 1 & 2: Same as American**
- Return of Capital: $32,000,000
- Preferred Return: $12,800,000
- Remaining: $5,200,000

**Tier 3: GP Catch-Up (100% to GP)**
- Total distributed to LPs so far: $44,800,000
- GP wants 20% of total
- GP needs: 20% × $44.8M / 80% = $11,200,000
- Available: $5,200,000
- Amount Used: $5,200,000 (partial catch-up) ✓

GP Catch-Up: $5,200,000

**Tier 4: Carried Interest (80/20)**
- Not reached (distribution exhausted)

**Current GP Position:**
- GP has: $5,200,000
- Total distributed: $50,000,000
- GP percentage: $5.2M / $50M = 10.4%
- (Still below target 20%, so catch-up not complete)

**Result:**
```typescript
{
  totalDistributed: 50000000,
  lpAllocations: [
    {
      investorId: 'metro',
      investorName: 'Metropolitan Pension',
      capitalReturn: 20000000,
      preferredReturn: 8000000,
      profit: 0,
      totalAmount: 28000000
    },
    {
      investorId: 'rodriguez',
      investorName: 'Rodriguez Capital',
      capitalReturn: 12000000,
      preferredReturn: 4800000,
      profit: 0,
      totalAmount: 16800000
    }
  ],
  gpAllocation: {
    catchUp: 5200000,
    carriedInterest: 0,
    totalAmount: 5200000
  }
}
```

## Integration with Distributions

### Usage in Distribution Creation

**Location**: `src/app/investment-manager/operations/distributions/create/page.tsx`

```typescript
import {
  calculateWaterfall,
  AMERICAN_WATERFALL,
  EUROPEAN_WATERFALL,
  type InvestorCapitalAccount
} from '@/lib/waterfall-calculations'

// Build capital accounts for Level 1 investors
const capitalAccounts: InvestorCapitalAccount[] = level1Investors.map(investor => ({
  investorId: investor.id,
  investorName: investor.name,
  capitalContributed: investor._hierarchyOwnership?.commitment || 0,
  capitalReturned: 0, // From previous distributions
  preferredReturnAccrued: 0,
  preferredReturnPaid: 0,
  distributionsReceived: 0,
}))

// Calculate waterfall for Level 1 remainder
const waterfallResult = calculateWaterfall(
  selectedFund.waterfallAlgorithm === 'american' ? AMERICAN_WATERFALL : EUROPEAN_WATERFALL,
  remainingForLevel1,
  capitalAccounts,
  selectedFund.createdAt || new Date().toISOString(),
  formData.distributionDate
)

// Store summary for UI display
setLevel1WaterfallSummary({
  tiers: waterfallResult.tierDistributions.map(tier => ({
    name: tier.tierName,
    type: tier.tierType,
    amount: tier.amountDistributed,
    lpAmount: tier.lpAmount,
    gpAmount: tier.gpAmount,
  })),
  gpCarry: waterfallResult.gpAllocation.totalAmount,
})

// Create allocations from waterfall result
waterfallResult.lpAllocations.forEach(lpAlloc => {
  allocations.push({
    investorId: lpAlloc.investorId,
    investorName: lpAlloc.investorName,
    allocationAmount: lpAlloc.totalAmount,
    hierarchyLevel: 1,
    // ... other fields
  })
})

// Add GP allocation if there's carried interest
if (waterfallResult.gpAllocation.totalAmount > 0) {
  allocations.push({
    investorId: 'gp',
    investorName: 'GP Carried Interest',
    allocationAmount: waterfallResult.gpAllocation.totalAmount,
    hierarchyLevel: 1,
    // ... other fields
  })
}
```

## UI Components

### Waterfall Tier Display

```typescript
// Show which tiers were reached
{level1WaterfallSummary.tiers.map((tier, idx) => (
  <div key={idx} className="flex justify-between items-center">
    <span className={tier.amount > 0 ? 'text-green-700 font-medium' : 'text-gray-400'}>
      {idx + 1}. {tier.name}
      {tier.amount > 0 ? ' ✓' : ' (not reached)'}
    </span>
    <span>{formatCurrency(tier.amount)}</span>
  </div>
))}
```

### Waterfall Summary

```typescript
<div className="bg-white p-3 rounded mb-3 border border-purple-100">
  <div className="text-xs font-semibold text-purple-900 mb-2">
    Waterfall Distribution Applied:
  </div>

  {/* Tier 1 */}
  <div className="flex justify-between">
    <span className="text-green-700 font-medium">
      1. Return of Capital ✓
    </span>
    <span>$32,000,000</span>
  </div>

  {/* Tier 2 */}
  <div className="flex justify-between">
    <span className="text-green-700 font-medium">
      2. Preferred Return (8%) ✓
    </span>
    <span>$12,800,000</span>
  </div>

  {/* Tier 3 */}
  <div className="flex justify-between">
    <span className="text-green-700 font-medium">
      3. Profit Split ✓
    </span>
    <span>$5,200,000</span>
  </div>

  {/* GP Carry */}
  <div className="flex justify-between mt-2 pt-2 border-t">
    <span className="font-semibold">GP Carried Interest:</span>
    <span className="font-semibold text-purple-600">$1,040,000</span>
  </div>
</div>
```

## Testing Scenarios

### Test Case 1: Partial ROC
- Distribution < Total Capital Contributed
- Only Tier 1 active
- Verify pro-rata allocation

### Test Case 2: ROC + Partial Preferred
- Distribution > Capital but < Capital + Full Preferred
- Tiers 1 & 2 active
- Verify time-based preferred calculation

### Test Case 3: All Tiers (American)
- Large distribution
- All 3 tiers active
- Verify GP carry calculation

### Test Case 4: GP Catch-Up (European)
- Medium distribution
- Verify catch-up calculation
- Verify GP doesn't exceed target percentage

### Test Case 5: Multiple Distributions
- Track capital returned and preferred paid
- Verify subsequent distributions account for previous ones

## Performance Considerations

**Optimization Techniques:**
1. Use Map for O(1) investor lookups
2. Calculate totals once, reuse in loops
3. Early exit when distribution exhausted
4. Memoize preferred return calculations

## Future Enhancements

**Planned Features:**
1. Custom waterfall configurations (user-defined tiers)
2. Multiple hurdle rates (8%, 12%, 15%)
3. Clawback provisions
4. Tax withholding integration
5. Multi-currency support
6. Historical waterfall tracking
7. Scenario modeling (what-if analysis)
8. Automated testing suite

---

**Last Updated**: 2025-10-24
**Version**: 1.0.0
