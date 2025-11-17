# Ownership Percent Calculation - Comprehensive Analysis

## Executive Summary

The codebase uses **THREE different methods** to calculate `ownershipPercent` depending on the context:

1. **Commitment-Based**: Used for capital calls, investor management, and most UI displays
2. **Called-Capital-Based**: Used in Cap Table to show actual ownership
3. **Capital-Contributed-Based**: Used in waterfall calculations for distributions

## The Three Formulas

### 1. Commitment-Based Ownership (Most Common)

```typescript
ownershipPercent = (investor.commitment / structure.totalCommitment) * 100
```

**Purpose**: Shows investor's **potential/committed** ownership stake

**Used in**:
- `/src/app/investment-manager/investors/[id]/edit/page.tsx` (line 347)
- `/src/app/investment-manager/investors/page.tsx` (line 92)
- `/src/app/investment-manager/investors/[id]/page.tsx` (line 195)
- `/src/app/investment-manager/structure-setup/components/step-3-limited-partners.tsx` (lines 48, 85)
- `/src/lib/metric-calculations.ts` (line 116)
- `/src/lib/k1-calculations.ts` (line 187)
- **Capital call wizard** (should use this, but Tony Bravo has 0)

**Context**: Used when showing investors their ownership stake based on what they committed to invest, regardless of how much has actually been called.

### 2. Called-Capital-Based Ownership (Cap Table)

```typescript
ownershipPercent = (investor.calledCapital / structure.totalCommitment) * 100
```

**Purpose**: Shows investor's **actual** ownership based on capital called to date

**Used in**:
- `/src/components/structure-cap-table.tsx` (lines 113-115)

**Context**: Used in Cap Table because ownership is typically determined by how much capital has actually been called and invested, not just committed. This reflects the **current** ownership distribution.

**Example**:
- Investor A: Committed $1M, Called $500K → 5% ownership (if total commitment is $10M)
- Investor B: Committed $2M, Called $0 → 0% ownership
- As more capital is called, ownership percentages adjust

### 3. Capital-Contributed-Based Ownership (Waterfall)

```typescript
ownershipPercent = (investor.capitalContributed / totalCapitalContributed) * 100
```

**Purpose**: **Dynamic** ownership calculation for distribution allocations

**Used in**:
- `/src/lib/waterfall-calculations.ts` (line 244)

**Context**: Used in waterfall distributions to determine how proceeds should be split among investors based on who actually contributed capital. This can change tier by tier in a waterfall.

## Tony Bravo's Issue

### Problem
Tony Bravo shows `0.00%` ownership in capital call wizard despite $99,070 allocation.

### Root Cause
Tony Bravo's investor record has:
```typescript
fundOwnerships: [{
  fundId: "master-trust-id",
  commitment: 500000,
  ownershipPercent: 0,  // <-- INCORRECT
  calledCapital: 0,
  uncalledCapital: 500000
}]
```

### Why Capital Call Amount is Correct

The capital call allocation uses **pro-rata based on commitment**, NOT ownership percent:

```typescript
// From capital-calls/create/page.tsx:214-216
const callAmount = totalCommitments > 0
  ? formData.totalCallAmount * (commitment / totalCommitments)
  : 0
```

So Tony's $99,070 allocation is calculated correctly based on his commitment relative to other investors' commitments.

### Why Display Shows 0%

The **displayed** ownership percent comes directly from the investor record:

```typescript
// From capital-calls/create/page.tsx:133, 169
const ownershipPercent = investor._hierarchyOwnership?.ownershipPercent || 0
```

This is pulled from the investor's `fundOwnerships` array, which has `ownershipPercent: 0`.

## When Each Formula Should Be Used

| Context | Formula | Reason |
|---------|---------|--------|
| **Capital Calls** | Commitment-based | Investors need to know their committed ownership stake |
| **LP Portal - Portfolio** | Commitment-based | Shows investor's overall stake in the fund |
| **Investor Management** | Commitment-based | Default view of ownership based on commitments |
| **Cap Table** | Called-capital-based | Shows actual current ownership distribution |
| **Waterfall Distributions** | Capital-contributed-based | Dynamic allocation based on who contributed |
| **K-1 Tax Forms** | Commitment-based | Tax reporting based on committed ownership |
| **ILPA Reports** | Commitment-based | Standard fund reporting |

## Edge Cases & Special Scenarios

### 1. Pre-Onboarded Investors

When investors are added during structure setup:
- Initial `ownershipPercent: 0`
- Should be calculated when commitment is set
- Currently handled in edit investor page (lines 344-348)

### 2. LP Portal Onboarding

Token-based onboarding:
```typescript
ownershipPercent = (tokensToPurchase / structure.totalTokens) * 100
```
But then set to `0` until capital is called (line 264).

### 3. Hierarchical Structures

For Master Trust with child structures:
- Level 1 investors: `ownershipPercent` based on Master Trust total commitment
- Level 2 investors: `ownershipPercent` based on Investment Trust total commitment
- Each level maintains its own ownership percentages

### 4. Custom Terms

Investors with custom management fees or carry may have:
- Same `ownershipPercent` calculation
- Different economic terms applied to distributions

## Fixing Missing or Incorrect Ownership Percent

### When to Recalculate

An investor's `ownershipPercent` should be recalculated when:
1. Initial value is `0` and commitment > 0
2. Structure's total commitment changes
3. Investor's commitment is updated
4. During data migration or cleanup

### Safe Recalculation Logic

```typescript
// Only recalculate if currently 0 and should have a value
if (investor.fundOwnership.ownershipPercent === 0 && investor.fundOwnership.commitment > 0) {
  const structure = getStructureById(investor.fundOwnership.fundId)
  if (structure && structure.totalCommitment > 0) {
    investor.fundOwnership.ownershipPercent =
      (investor.fundOwnership.commitment / structure.totalCommitment) * 100
  }
}
```

### Already Implemented

The edit investor page (lines 344-348) already has this logic:
```typescript
if (ownershipPercent === 0 && commitment > 0) {
  const structure = selectedLevel?.structure
  if (structure && structure.totalCommitment > 0) {
    ownershipPercent = (commitment / structure.totalCommitment) * 100
  }
}
```

## Prevention Strategies

### 1. Add Investor Flow

Currently sets `ownershipPercent: 0` at creation:
```typescript
// investors/add/page.tsx:124
fundOwnership: {
  fundId: selectedStructure,
  commitment: 0,
  ownershipPercent: 0,  // <-- Should calculate after commitment is set
  calledCapital: 0,
  uncalledCapital: 0,
}
```

**Recommendation**: Calculate ownership when commitment is finalized during onboarding.

### 2. Structure Setup Flow

Already calculates correctly:
```typescript
// structure-setup/components/step-3-limited-partners.tsx:48
const ownershipPercent = fundCommittedCapital > 0
  ? (formData.commitment / fundCommittedCapital) * 100
  : 0
```

### 3. Data Validation

Add validation to ensure:
- `ownershipPercent > 0` when `commitment > 0`
- `ownershipPercent === 0` when `commitment === 0`
- Sum of all ownership percents ≈ 100% (allowing for rounding)

## Conclusion

**The formula `(commitment / totalCommitment) * 100` is correct for:**
- Capital calls
- Investor management
- Most UI displays

**Alternative formulas are correct for:**
- Cap Table: uses called capital
- Waterfall: uses contributed capital

**Tony Bravo's fix**: Use commitment-based formula to populate his missing ownership percent.

**Will this happen again?**
Yes, potentially, if:
1. Investors are added with commitment but ownership isn't calculated
2. Structure total commitment changes but investor ownership isn't updated
3. Data migration doesn't preserve ownership percent

**Solution**:
- Use the fix script for existing data
- Add validation in add/edit investor flows
- Consider auto-calculating ownership percent when commitment is set
