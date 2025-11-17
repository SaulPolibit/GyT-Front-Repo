# Tony Bravo Ownership Issue - Diagnosis & Fix

## Problem

Tony Bravo shows **0.00% ownership** in the capital call creation wizard despite being allocated $99,070 in the capital call.

## Root Cause

Tony Bravo's investor record in `localStorage` has an entry in his `fundOwnerships` array for the Master Trust structure with `ownershipPercent: 0`.

### Data Flow

1. Capital call creation page calls `getInvestorsByHierarchy(masterFundId)` (from `investors-storage.ts:194`)
2. This function retrieves each investor's `fundOwnerships` for structures in the hierarchy
3. At line 248 of `investors-storage.ts`, it extracts:
   ```typescript
   ownershipPercent: ownership.ownershipPercent,  // <-- This is 0 for Tony Bravo
   ```
4. This value is then used at line 78 of `capital-calls/create/page.tsx`:
   ```typescript
   _hierarchyOwnership: {
     ownershipPercent: item.ownershipPercent,  // <-- 0 from investor data
     commitment: item.commitment,
     structureId: item.structureId
   }
   ```
5. Finally displayed at line 873 and 905 in the review steps:
   ```typescript
   ({allocation.ownershipPercent.toFixed(2)}%)  // <-- Shows 0.00%
   ```

## Solution

### Step 1: Diagnose the Issue

Run the diagnostic script in the browser console:

```javascript
// Copy and paste the contents of scripts/diagnose-tony-bravo-ownership.js
```

This will show:
- Tony Bravo's current ownership percent for each fund
- His commitment amounts
- Related structure information
- Which fund ownerships have 0% or undefined ownership

### Step 2: Fix the Issue

Run the fix script in the browser console:

```javascript
// Copy and paste the contents of scripts/fix-tony-bravo-ownership.js
```

This script will:
1. Find Tony Bravo's investor record
2. For each fund ownership with 0% or undefined ownership:
   - Find the related structure
   - Calculate: `ownershipPercent = (commitment / totalCommitment) * 100`
   - Update the `ownershipPercent` field
3. Save the corrected data back to localStorage
4. Prompt you to refresh the page

### Step 3: Verify the Fix

1. Refresh the browser
2. Navigate to: **Operations > Capital Calls > Create Capital Call**
3. Select the Master Trust structure
4. Enter a total call amount
5. Proceed to Step 3 (Investor Allocations)
6. Verify Tony Bravo now shows correct ownership percent (not 0.00%)

## How to Run Scripts

1. Open the browser Developer Tools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Open the script file in your text editor
4. Copy the entire contents
5. Paste into the console
6. Press Enter to run

## Prevention

This issue occurs when an investor is added to a fund without properly calculating their ownership percent.

### Important: Three Different Ownership Formulas

The codebase uses **three different formulas** depending on context:

1. **Commitment-Based** (this issue):
   ```typescript
   ownershipPercent = (investor.commitment / structure.totalCommitment) * 100
   ```
   Used for: Capital calls, investor management, LP portal

2. **Called-Capital-Based** (Cap Table):
   ```typescript
   ownershipPercent = (investor.calledCapital / structure.totalCommitment) * 100
   ```
   Used for: Cap Table showing actual ownership distribution

3. **Capital-Contributed-Based** (Waterfall):
   ```typescript
   ownershipPercent = (investor.capitalContributed / totalCapitalContributed) * 100
   ```
   Used for: Distribution waterfall calculations

When adding investors to structures, ensure the `ownershipPercent` field is calculated using the **commitment-based formula** (#1), not set to 0 or left undefined.

See `docs/ownership-percent-calculation-analysis.md` for comprehensive details.

## Related Files

- **Data Storage**: `/src/lib/investors-storage.ts`
- **Capital Call Creation**: `/src/app/investment-manager/operations/capital-calls/create/page.tsx`
- **Type Definitions**: `/src/lib/types.ts` (see `Investor` interface, line 147-164)

## Type Reference

```typescript
// From src/lib/types.ts
fundOwnerships: {
  fundId: string
  fundName: string
  commitment: number
  ownershipPercent: number  // <-- This should never be 0 if commitment > 0
  calledCapital: number
  uncalledCapital: number
  hierarchyLevel?: number
  investedDate: string
  onboardingStatus?: InvestorStatus
  customTerms?: { ... }
}[]
```

## Notes

- The capital call **allocation amount** is calculated correctly based on commitment (pro-rata), so the $99,070 allocation is accurate
- Only the **displayed ownership percent** is incorrect (showing 0.00% instead of the actual percent)
- This is purely a display issue and does not affect the actual capital call amounts
