# Distribution Ownership Percent Fix

## Problem

When creating distributions for hierarchical structures (e.g., Polibit Energy I), Level 1 (Master Trust) investors showed **0.00% ownership** despite having allocation amounts.

### Example from Bug Report

**Level 1: Master Trust (Remainder After Level 2)**
- Tony Bravo: **0.00%** ownership - $6,605 allocation
- Metropolitan Pension Fund: **0.00%** ownership - $440,310 allocation
- Rodriguez Capital Partners: **0.00%** ownership - $264,186 allocation

All showed 0% but had correct dollar amounts.

## Root Cause

The waterfall calculation in `/src/lib/waterfall-calculations.ts` only calculated and set `ownershipPercent` in the **CARRIED_INTEREST (Profit Split)** tier.

### Original Behavior by Tier

| Tier Type | Sets ownershipPercent? | Lines |
|-----------|----------------------|-------|
| **RETURN_OF_CAPITAL** | ❌ NO | 127-154 |
| **PREFERRED_RETURN** | ❌ NO | 156-191 |
| **CATCH_UP** | N/A (GP only) | 193-225 |
| **CARRIED_INTEREST** | ✅ YES | 227-256 |

### Why This Caused the Bug

When a distribution only reaches the **Return of Capital** tier (as in the bug example):
1. Distribution amount: $1,000,000
2. Waterfall processes Return of Capital: $1,000,000
3. Remaining for other tiers: $0
4. Profit Split tier never executes
5. **Result**: `ownershipPercent` stays at 0 (initial value from line 98)

### Code Flow

```typescript
// Line 98: Initialize with 0
ownershipPercent: 0, // Will be calculated dynamically per tier

// Return of Capital tier (original code)
allocation.tierAllocations.push({ ... })
allocation.totalAllocation += investorShare
// ❌ Missing: allocation.ownershipPercent = ...

// Only Profit Split tier set it (line 253)
allocation.ownershipPercent = ownershipPercent  // ✅ But never reached!
```

## Solution

Added `ownershipPercent` calculation to **RETURN_OF_CAPITAL** and **PREFERRED_RETURN** tiers.

### Changes Made

#### 1. RETURN_OF_CAPITAL Tier (lines 138-161)

**Added:**
```typescript
// Calculate total capital contributed for ownership percentage
const totalCapitalContributed = capitalAccounts.reduce(
  (sum, account) => sum + account.capitalContributed,
  0
)

// ... inside forEach loop ...

// Calculate ownership percent based on capital contributed
if (totalCapitalContributed > 0) {
  const ownershipPercent = (account.capitalContributed / totalCapitalContributed) * 100
  allocation.ownershipPercent = ownershipPercent
}
```

#### 2. PREFERRED_RETURN Tier (lines 184-210)

**Added:**
```typescript
// Calculate total capital contributed for ownership percentage
const totalCapitalContributed = capitalAccounts.reduce(
  (sum, account) => sum + account.capitalContributed,
  0
)

// ... inside forEach loop ...

// Calculate ownership percent based on capital contributed
if (totalCapitalContributed > 0) {
  const ownershipPercent = (account.capitalContributed / totalCapitalContributed) * 100
  allocation.ownershipPercent = ownershipPercent
}
```

## Why This Formula is Correct

### For Waterfall Distributions

The waterfall uses **capital-contributed-based ownership** (Formula #3 from `docs/ownership-percent-calculation-analysis.md`):

```typescript
ownershipPercent = (capitalContributed / totalCapitalContributed) * 100
```

### Rationale

In the distribution creation code (`operations/distributions/create/page.tsx:213`):
```typescript
capitalContributed: commitment,
```

So `capitalContributed` equals the investor's commitment, which is the correct basis for ownership in distributions.

## Impact

### Before Fix
- Return of Capital distributions: **0% ownership** shown
- Preferred Return distributions: **0% ownership** shown
- Profit Split distributions: ✅ Correct ownership shown

### After Fix
- Return of Capital distributions: ✅ **Correct ownership** shown
- Preferred Return distributions: ✅ **Correct ownership** shown
- Profit Split distributions: ✅ **Correct ownership** shown (unchanged)

## Testing

To verify the fix:

1. Navigate to **Operations > Distributions > Create Distribution**
2. Select a hierarchical structure (e.g., Polibit Energy I)
3. Enter distribution amount
4. Enable waterfall
5. Proceed to **Step 3: Investor Allocations**
6. Verify Level 1 investors now show **correct ownership percentages** (not 0.00%)

### Expected Result

**Level 1: Master Trust**
- Tony Bravo: **X.XX%** ownership (calculated from commitment)
- Metropolitan Pension Fund: **XX.XX%** ownership
- Rodriguez Capital Partners: **XX.XX%** ownership

## Related Issues

This fix is related to but different from the capital call ownership issue:

- **Capital Calls**: Investors have `ownershipPercent: 0` in their **fundOwnerships** array (data issue)
- **Distributions**: Waterfall calculation wasn't **setting** the calculated ownership (code bug)

Both show 0% ownership but for different reasons:
- Capital calls: Need to run `scripts/fix-tony-bravo-ownership.js` to fix data
- Distributions: Fixed by this code change

## Files Modified

- `/src/lib/waterfall-calculations.ts` - Added ownership calculation to Return of Capital and Preferred Return tiers

## Related Documentation

- `docs/ownership-percent-calculation-analysis.md` - Comprehensive ownership formula analysis
- `scripts/README-tony-bravo-ownership.md` - Capital call ownership fix documentation
