# Capital Operations Documentation

Comprehensive guide to capital calls and distributions in the Polibit investment management platform.

## Overview

Capital operations are the core financial transactions between GPs (General Partners) and LPs (Limited Partners):

- **Capital Calls**: GP requests capital from LPs to fund investments
- **Distributions**: GP returns capital + profits to LPs from investment exits

Both operations support hierarchical fund structures with two-tier economics.

## Architecture

### File Structure

```
src/app/investment-manager/operations/
├── capital-calls/
│   ├── page.tsx              # List all capital calls
│   ├── create/page.tsx       # 4-step creation wizard
│   └── [id]/page.tsx         # Detail view
└── distributions/
    ├── page.tsx              # List all distributions
    ├── create/page.tsx       # 4-step creation wizard
    └── [id]/page.tsx         # Detail view

src/lib/
├── capital-calls-storage.ts  # CRUD operations
├── distributions-storage.ts  # CRUD operations
└── waterfall-calculations.ts # Waterfall algorithms
```

## Capital Calls

### Concept

A capital call is a request for LPs to contribute capital to the fund. LPs commit a total amount upfront but only contribute when called.

**Key Fields:**
- `callNumber`: Sequential number (#1, #2, etc.)
- `totalCallAmount`: Total amount being called
- `callDate`: When the call is issued
- `dueDate`: When payment is due
- `noticePeriodDays`: Days between call and due date (typically 10-14)
- `purpose`: Reason for the call (investment, fees, etc.)
- `status`: Draft, Sent, Partially Paid, Fully Paid

### Data Model

```typescript
interface CapitalCall {
  id: string
  fundId: string
  fundName: string
  callNumber: number
  totalCallAmount: number
  currency: string
  callDate: string
  dueDate: string
  noticePeriodDays: number
  purpose: string
  relatedInvestmentId?: string
  relatedInvestmentName?: string
  status: 'Draft' | 'Sent' | 'Partially Paid' | 'Fully Paid'
  sentDate?: string
  investorAllocations: CapitalCallAllocation[]
  totalPaidAmount: number
  totalOutstandingAmount: number
  transactionType: string
  useOfProceeds?: string
  managementFeeIncluded: boolean
  managementFeeAmount?: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface CapitalCallAllocation {
  investorId: string
  investorName: string
  investorType: string
  commitment: number
  ownershipPercent: number
  callAmount: number
  status: 'Pending' | 'Paid' | 'Overdue'
  amountPaid: number
  amountOutstanding: number
  noticeSent: boolean
  calledCapitalToDate: number
  uncalledCapital: number
  hierarchyLevel?: number
  structureName?: string
}
```

### Creation Wizard (4 Steps)

#### Step 1: Fund & Amount

**Purpose**: Select fund and specify total call amount

**UI Components:**
- Fund selector dropdown
- Auto-generated call number (sequential)
- Total call amount input
- Currency display (from fund settings)
- Alert showing fund info (investors count, total commitment)

**Code Location**: `src/app/investment-manager/operations/capital-calls/create/page.tsx:352-436`

**Key Logic:**
```typescript
// Load investors when fund selected
useEffect(() => {
  if (formData.fundId) {
    const fund = structures.find(s => s.id === formData.fundId)
    const isHierarchyMaster = fund.hierarchyLevel === 1

    if (isHierarchyMaster) {
      // Load all hierarchy investors
      const hierarchyData = getInvestorsByHierarchy(fund.id)
      fundInvestors = hierarchyData.map(item => ({
        ...item.investor,
        hierarchyLevel: item.hierarchyLevel,
        _hierarchyOwnership: {
          ownershipPercent: item.ownershipPercent,
          commitment: item.commitment,
          structureId: item.structureId
        }
      }))
    } else {
      // Single-level structure
      fundInvestors = getInvestorsByFundId(fund.id)
    }

    setInvestors(fundInvestors)
    setFormData(prev => ({
      ...prev,
      callNumber: getNextCallNumber(fund.id)
    }))
  }
}, [formData.fundId, structures])
```

#### Step 2: Details & Purpose

**Purpose**: Specify dates, purpose, and related investment

**UI Components:**
- Call date picker
- Notice period input (auto-calculates due date)
- Due date display
- Purpose textarea
- Use of proceeds dropdown (ILPA template field)
- Related investment selector (optional)
- Management fee checkbox with amount input

**Code Location**: `src/app/investment-manager/operations/capital-calls/create/page.tsx:439-576`

**Key Logic:**
```typescript
// Auto-calculate due date
const calculateDueDate = (callDate: string, noticePeriod: number): string => {
  const date = new Date(callDate)
  date.setDate(date.getDate() + noticePeriod)
  return date.toISOString().split('T')[0]
}

// Update due date when call date or notice period changes
if (field === 'callDate' || field === 'noticePeriodDays') {
  updated.dueDate = calculateDueDate(
    field === 'callDate' ? value : prev.callDate,
    field === 'noticePeriodDays' ? value : prev.noticePeriodDays
  )
}
```

#### Step 3: Investor Allocations

**Purpose**: Review how capital call is allocated to investors

**UI Components:**
- Alert explaining allocation method
- **For Hierarchical Structures**:
  - Level 2 section (blue theme) showing Investment Trust allocations
  - Level 1 section (purple theme) showing Master Trust allocations
  - Each section shows total, method, and individual allocations
- **For Single-Level Structures**:
  - Simple table with all investor allocations

**Code Location**: `src/app/investment-manager/operations/capital-calls/create/page.tsx:578-755`

**Visual Design:**
```typescript
// Level 2 Section (Blue)
<div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
  <div className="flex justify-between items-center mb-3">
    <h4 className="font-semibold text-blue-900 text-lg">
      Level 2: Investment Trust (Called First)
    </h4>
    <span className="text-lg font-bold text-blue-900">
      {formatCurrency(level2Total)}
    </span>
  </div>
  <div className="text-xs text-blue-700 mb-3">
    Pro-rata allocation within Level 2
  </div>
  {/* Table with Level 2 investors */}
</div>

// Level 1 Section (Purple)
<div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
  <div className="flex justify-between items-center mb-3">
    <h4 className="font-semibold text-purple-900 text-lg">
      Level 1: Master Trust (Remainder)
    </h4>
    <span className="text-lg font-bold text-purple-900">
      {formatCurrency(level1Total)}
    </span>
  </div>
  <div className="text-xs text-purple-700 mb-3">
    Pro-rata allocation within Level 1
  </div>
  {/* Table with Level 1 investors */}
</div>
```

#### Step 4: Review & Send

**Purpose**: Final review before saving or sending

**UI Components:**
- Fund information summary
- Dates overview
- Purpose display
- Use of proceeds badge
- Management fee alert (if included)
- **For Hierarchical Structures**:
  - Two-stage summary alert
  - Level 2 summary box (blue)
  - Level 1 summary box (purple)
  - Total summary box (gray)
- Save as Draft button
- Send to Investors button

**Code Location**: `src/app/investment-manager/operations/capital-calls/create/page.tsx:757-966`

**Summary Layout:**
```typescript
// Two-Stage Summary
<Alert>
  <AlertDescription>
    <strong>Two-Stage Capital Call Process:</strong>
    Capital is called from investors across two hierarchy levels,
    with Level 2 called first, then Level 1 receives the remainder.
  </AlertDescription>
</Alert>

// Level 2 Summary (Blue)
<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
  {/* Level 2 total and investors */}
</div>

// Level 1 Summary (Purple)
<div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
  {/* Level 1 total and investors */}
</div>

// Total Summary (Gray)
<div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
  <div className="flex justify-between items-center">
    <span className="font-bold">Total Capital Call</span>
    <span className="text-xl font-bold">{formatCurrency(total)}</span>
  </div>
  <div className="text-xs text-muted-foreground mt-1">
    {count} investors across 2 hierarchy levels
  </div>
</div>
```

### Allocation Calculation

#### Two-Stage Calculation (Hierarchical)

**Code Location**: `src/app/investment-manager/operations/capital-calls/create/page.tsx:101-232`

**Algorithm:**

```typescript
// Step 1: Separate investors by hierarchy level
const level1Investors = investors.filter(inv => inv.hierarchyLevel === 1)
const level2Investors = investors.filter(inv => inv.hierarchyLevel === 2)

// Step 2: Get Level 2 structure's ownership of Master
const level2Structure = structures.find(s => s.id === level2StructureId)
const level2OwnershipOfMaster = level2Structure?.ownershipOfParent || 0
// Example: 28.89%

// Step 3: Calculate total capital call for each level
const level2TotalCall = formData.totalCallAmount * (level2OwnershipOfMaster / 100)
const level1TotalCall = formData.totalCallAmount - level2TotalCall

// Example with $12,500,000 call:
// Level 2 Total: $12,500,000 × 0.2889 = $3,611,250
// Level 1 Total: $12,500,000 - $3,611,250 = $8,888,750

// Step 4: Allocate within Level 2 (pro-rata)
const level2TotalOwnership = level2Investors.reduce((sum, inv) =>
  sum + (inv._hierarchyOwnership?.ownershipPercent || 0), 0)
// Example: 11.11% + 44.44% + 16.67% = 72.22%

level2Investors.forEach(investor => {
  const ownershipPercent = investor._hierarchyOwnership?.ownershipPercent || 0
  const ownershipFraction = ownershipPercent / level2TotalOwnership
  const callAmount = level2TotalCall * ownershipFraction

  // Example: Sarah (11.11%)
  // Fraction: 11.11% / 72.22% = 0.1538
  // Call: $3,611,250 × 0.1538 = $555,538
})

// Step 5: Allocate within Level 1 (pro-rata)
const level1TotalOwnership = level1Investors.reduce((sum, inv) =>
  sum + (inv._hierarchyOwnership?.ownershipPercent || 0), 0)
// Example: 40% + 24% = 64%

level1Investors.forEach(investor => {
  const ownershipPercent = investor._hierarchyOwnership?.ownershipPercent || 0
  const ownershipFraction = ownershipPercent / level1TotalOwnership
  const callAmount = level1TotalCall * ownershipFraction

  // Example: Metropolitan (40%)
  // Fraction: 40% / 64% = 0.625
  // Call: $8,888,750 × 0.625 = $5,555,469
})
```

**Key Points:**
- Level 2 is called FIRST (paid from their portion of Master)
- Level 1 receives REMAINDER (not a direct percentage)
- Pro-rata within each level independently
- Totals exactly match the requested call amount

#### Single-Level Calculation

**Algorithm:**
```typescript
const allocations = investors.map(investor => {
  const ownership = investor.fundOwnerships?.find(fo => fo.fundId === fundId)
  const ownershipPercent = ownership?.ownershipPercent || 0
  const callAmount = totalCallAmount * (ownershipPercent / 100)

  return {
    investorId: investor.id,
    investorName: investor.name,
    callAmount,
    // ... other fields
  }
})
```

### Uncalled Capital Tracking

```typescript
const ownership = investor.fundOwnerships?.find(fo => fo.fundId === fundId)
const commitment = ownership?.commitment || 0
const calledToDate = ownership?.calledCapital || 0
const uncalledCapital = commitment - calledToDate - callAmount

allocation.calledCapitalToDate = calledToDate
allocation.uncalledCapital = uncalledCapital
```

**Example:**
```
Commitment: $20,000,000
Called to Date: $5,000,000
This Call: $3,000,000
Uncalled: $20M - $5M - $3M = $12,000,000
```

### Storage Operations

**Save Capital Call:**
```typescript
const handleSave = (sendNow: boolean = false) => {
  const capitalCall = {
    fundId: formData.fundId,
    fundName: formData.fundName,
    callNumber: formData.callNumber,
    totalCallAmount: formData.totalCallAmount,
    // ... other fields
    status: sendNow ? 'Sent' : 'Draft',
    sentDate: sendNow ? new Date().toISOString() : undefined,
    investorAllocations,
    totalPaidAmount: 0,
    totalOutstandingAmount: formData.totalCallAmount,
    createdBy: 'Gabriela Mena',
  }

  const saved = saveCapitalCall(capitalCall)

  router.push('/investment-manager/operations/capital-calls')
}
```

**Get Next Call Number:**
```typescript
export function getNextCallNumber(fundId: string): number {
  const calls = getCapitalCallsByFundId(fundId)
  if (calls.length === 0) return 1

  const maxCallNumber = Math.max(...calls.map(c => c.callNumber))
  return maxCallNumber + 1
}
```

## Distributions

### Concept

A distribution returns capital and/or profits to LPs from investment exits or cash flow.

**Key Fields:**
- `distributionNumber`: Sequential number (#1, #2, etc.)
- `totalDistributionAmount`: Total amount being distributed
- `distributionDate`: When distribution is made
- `distributionType`: Return of Capital, Profit, Recallable, Non-Recallable
- `applyWaterfall`: Whether to apply waterfall calculation at Level 1
- `waterfallAlgorithm`: american or european
- `status`: Draft, Processing, Completed

### Data Model

```typescript
interface Distribution {
  id: string
  fundId: string
  fundName: string
  distributionNumber: number
  totalDistributionAmount: number
  currency: string
  distributionDate: string
  distributionType: 'Return of Capital' | 'Profit Distribution' |
                     'Recallable Distribution' | 'Non-Recallable Distribution'
  status: 'Draft' | 'Processing' | 'Completed' | 'Failed'
  relatedInvestmentId?: string
  relatedInvestmentName?: string
  purpose?: string
  investorAllocations: DistributionAllocation[]
  applyWaterfall: boolean
  waterfallAlgorithm?: 'american' | 'european'
  createdBy: string
  processedDate?: string
  createdAt: string
  updatedAt: string
}

interface DistributionAllocation {
  investorId: string
  investorName: string
  investorType: string
  commitment: number
  ownershipPercent: number
  allocationAmount: number
  status: 'Pending' | 'Processed' | 'Failed'
  paymentMethod?: string
  paymentReference?: string
  processedDate?: string
  hierarchyLevel?: number
  structureName?: string
}
```

### Creation Wizard (4 Steps)

#### Step 1: Fund & Amount

Similar to capital calls, with additional fields:
- Distribution type selector
- Apply waterfall checkbox (for hierarchical Level 1)
- Waterfall algorithm selector (American/European)

**Code Location**: `src/app/investment-manager/operations/distributions/create/page.tsx:374-484`

#### Step 2: Details & Purpose

**UI Components:**
- Distribution date picker
- Related investment selector
- Purpose/notes textarea
- Payment method options

**Code Location**: `src/app/investment-manager/operations/distributions/create/page.tsx:487-569`

#### Step 3: Investor Allocations

**For Hierarchical Structures:**
- Alert explaining two-tier distribution method
- Level 2 section showing simple pro-rata
- Level 1 section showing waterfall (if enabled)
- Waterfall tier breakdown

**Code Location**: `src/app/investment-manager/operations/distributions/create/page.tsx:572-743`

**Waterfall Tier Display:**
```typescript
{level1WaterfallSummary && (
  <div className="bg-white p-3 rounded mb-3 border border-purple-100">
    <div className="text-xs font-semibold text-purple-900 mb-2">
      Waterfall Distribution Applied:
    </div>
    {level1WaterfallSummary.tiers.map((tier, idx) => (
      <div key={idx} className="flex justify-between">
        <span className={tier.amount > 0 ? 'text-green-700 font-medium' : 'text-gray-400'}>
          {idx + 1}. {tier.name}
          {tier.amount > 0 ? ' ✓' : ' (not reached)'}
        </span>
        <span>{formatCurrency(tier.amount)}</span>
      </div>
    ))}
  </div>
)}
```

#### Step 4: Review & Process

**Enhanced Summary:**
- Fund information
- Distribution details
- **For Hierarchical Structures**:
  - Two-stage distribution alert
  - Level 2 summary (blue) with method
  - Level 1 summary (purple) with waterfall breakdown
  - Waterfall tier details showing which tiers were reached
  - Total distribution summary

**Code Location**: `src/app/investment-manager/operations/distributions/create/page.tsx:746-1042`

### Allocation Calculation with Waterfall

#### Two-Stage Calculation

**Code Location**: `src/app/investment-manager/operations/distributions/create/page.tsx:116-301`

**Algorithm:**

```typescript
// Step 1: Calculate Level 2 distribution (PAID FIRST)
const level2Structure = structures.find(s => s.hierarchyLevel === 2 && s.parentId === masterId)
const level2OwnershipOfMaster = level2Structure?.ownershipOfParent || 0

const level2TotalFromMaster = totalDistributionAmount * (level2OwnershipOfMaster / 100)

// Example with $5,000,000 distribution:
// Level 2 Total: $5,000,000 × 0.2889 = $1,444,500

// Step 2: Allocate within Level 2 (simple pro-rata)
const level2TotalOwnership = level2Investors.reduce((sum, inv) =>
  sum + (inv._hierarchyOwnership?.ownershipPercent || 0), 0)

level2Investors.forEach(investor => {
  const ownershipPercent = investor._hierarchyOwnership?.ownershipPercent || 0
  const ownershipFraction = ownershipPercent / level2TotalOwnership
  const baseAllocation = level2TotalFromMaster * ownershipFraction

  level2Allocations.push({
    investorId: investor.id,
    investorName: investor.name,
    allocationAmount: baseAllocation,
    hierarchyLevel: 2,
    // ... other fields
  })
})

// Step 3: Calculate Level 1 remainder
const remainingForLevel1 = totalDistributionAmount - level2TotalFromMaster
// Example: $5,000,000 - $1,444,500 = $3,555,500

// Step 4: Apply waterfall to Level 1 (if enabled)
if (applyWaterfall && waterfallAlgorithm) {
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

  // Calculate waterfall
  const waterfallResult = calculateWaterfall(
    waterfallAlgorithm === 'american' ? AMERICAN_WATERFALL : EUROPEAN_WATERFALL,
    remainingForLevel1,
    capitalAccounts,
    selectedFund.createdAt,
    formData.distributionDate
  )

  // Store waterfall summary for UI
  const waterfallSummary = {
    tiers: waterfallResult.tierDistributions.map(tier => ({
      name: tier.tierName,
      type: tier.tierType,
      amount: tier.amountDistributed,
      lpAmount: tier.lpAmount,
      gpAmount: tier.gpAmount,
    })),
    gpCarry: waterfallResult.gpAllocation.totalAmount,
  }
  setLevel1WaterfallSummary(waterfallSummary)

  // Create allocations from waterfall result
  waterfallResult.lpAllocations.forEach(lpAlloc => {
    level1Allocations.push({
      investorId: lpAlloc.investorId,
      investorName: lpAlloc.investorName,
      allocationAmount: lpAlloc.totalAmount,
      hierarchyLevel: 1,
      // ... other fields
    })
  })

  // Add GP allocation if there's carried interest
  if (waterfallResult.gpAllocation.totalAmount > 0) {
    level1Allocations.push({
      investorId: 'gp',
      investorName: 'GP Carried Interest',
      allocationAmount: waterfallResult.gpAllocation.totalAmount,
      hierarchyLevel: 1,
      // ... other fields
    })
  }
} else {
  // Simple pro-rata within Level 1
  const level1TotalOwnership = level1Investors.reduce((sum, inv) =>
    sum + (inv._hierarchyOwnership?.ownershipPercent || 0), 0)

  level1Investors.forEach(investor => {
    const ownershipPercent = investor._hierarchyOwnership?.ownershipPercent || 0
    const ownershipFraction = ownershipPercent / level1TotalOwnership
    const allocationAmount = remainingForLevel1 * ownershipFraction

    level1Allocations.push({
      investorId: investor.id,
      investorName: investor.name,
      allocationAmount,
      hierarchyLevel: 1,
      // ... other fields
    })
  })
}

// Combine all allocations
const allAllocations = [...level2Allocations, ...level1Allocations]
setInvestorAllocations(allAllocations)
```

### Waterfall Integration

**Import:**
```typescript
import {
  calculateWaterfall,
  AMERICAN_WATERFALL,
  EUROPEAN_WATERFALL,
  type InvestorCapitalAccount
} from '@/lib/waterfall-calculations'
```

**American Waterfall Structure:**
```typescript
const AMERICAN_WATERFALL = {
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
      targetRate: 0.08,
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

**Example Calculation:**
```
Distribution: $5,000,000
Level 2: $1,444,500 (simple pro-rata)
Level 1: $3,555,500 (waterfall applied)

Level 1 Waterfall:
  Tier 1 - Return of Capital: $2,000,000 (100% to LPs)
    • Metropolitan (40%): $800,000
    • Rodriguez (24%): $480,000

  Tier 2 - Preferred Return (8%): $800,000 (100% to LPs)
    • Metropolitan (40%): $320,000
    • Rodriguez (24%): $192,000

  Tier 3 - Profit Split: $755,500 (80% LP / 20% GP)
    • LPs get: $604,400
      - Metropolitan (40%): $241,760
      - Rodriguez (24%): $145,056
    • GP gets: $151,100 (carried interest)

  Tier 4 - GP Catch-Up: $0 (not reached)

Total Level 1:
  • Metropolitan: $800K + $320K + $241,760 = $1,361,760
  • Rodriguez: $480K + $192K + $145,056 = $817,056
  • GP: $151,100
```

### State Management

**Waterfall Summary State:**
```typescript
const [level1WaterfallSummary, setLevel1WaterfallSummary] = useState<any>(null)

// Store summary after calculation
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

// Display in UI
{level1WaterfallSummary && (
  <div>
    {level1WaterfallSummary.tiers.map((tier, idx) => (
      <div key={idx}>
        {tier.name}: {formatCurrency(tier.amount)}
        {tier.amount > 0 ? ' ✓' : ' (not reached)'}
      </div>
    ))}
  </div>
)}
```

## Common Patterns

### Loading Hierarchy Investors

```typescript
useEffect(() => {
  if (formData.fundId) {
    const fund = structures.find(s => s.id === formData.fundId)
    const isHierarchyMaster = fund?.hierarchyLevel === 1

    if (isHierarchyMaster) {
      const hierarchyData = getInvestorsByHierarchy(fund.id)
      const enrichedInvestors = hierarchyData.map(item => ({
        ...item.investor,
        hierarchyLevel: item.hierarchyLevel,
        structureId: item.structureId,
        structureName: item.structureName,
        _hierarchyOwnership: {
          ownershipPercent: item.ownershipPercent,
          commitment: item.commitment,
          structureId: item.structureId
        }
      }))
      setInvestors(enrichedInvestors)
    } else {
      setInvestors(getInvestorsByFundId(fund.id))
    }
  }
}, [formData.fundId, structures])
```

### Memoized Allocation Calculation

```typescript
const calculatedAllocations = useMemo(() => {
  if (totalAmount <= 0 || investors.length === 0 || !selectedFund) {
    return []
  }

  // Calculation logic here

  return allocations
}, [totalAmount, formData.fundId, selectedFund, investors, structures])

useEffect(() => {
  setInvestorAllocations(calculatedAllocations)
}, [calculatedAllocations])
```

### Currency Formatting

```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: formData.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
```

## ILPA Compliance

**Use of Proceeds Categories:**
- Investment
- Management Fees
- Fund Expenses
- Working Capital
- Bridge Financing
- Other

**Transaction Types:**
- Capital Call
- Distribution
- Recallable Distribution
- Non-Recallable Distribution

**Reporting Fields:**
- Call/distribution number
- Notice period
- Related investment
- Purpose/notes

## Error Handling

### Validation Checks

```typescript
// Before saving
if (!formData.fundId || formData.totalCallAmount === 0) {
  alert('Please select a fund and enter a call amount')
  return
}

// Allocation validation
const totalAllocated = investorAllocations.reduce((sum, a) => sum + a.callAmount, 0)
if (Math.abs(totalAllocated - formData.totalCallAmount) > 1) {
  console.error('Allocation mismatch:', { totalAllocated, requested: formData.totalCallAmount })
}
```

### React Warnings Prevention

```typescript
// Use memoization to prevent dependency array warnings
const calculatedAllocations = useMemo(() => {
  // Complex calculation
  return result
}, [stableDependencies])

// Separate effect for state update
useEffect(() => {
  setAllocations(calculatedAllocations)
}, [calculatedAllocations])
```

## Testing Scenarios

### Capital Call Test Cases

1. **Single-Level Fund**
   - Total Call: $10M
   - 3 investors: 40%, 35%, 25%
   - Expected: $4M, $3.5M, $2.5M

2. **Hierarchical Fund (2 levels)**
   - Total Call: $12.5M
   - L2 owns 28.89% of Master
   - L2 Total: $3.61M (3 investors)
   - L1 Total: $8.89M (2 investors)
   - Verify totals match exactly

3. **Management Fee Included**
   - Base Call: $12M
   - Management Fee: $500K
   - Total: $12.5M
   - Verify allocations include fee

### Distribution Test Cases

1. **Simple Pro-Rata (No Waterfall)**
   - Total: $5M
   - L2: $1.44M (28.89%)
   - L1: $3.56M (pro-rata)

2. **Waterfall Applied**
   - Total: $5M
   - L2: $1.44M (simple)
   - L1: $3.56M (waterfall)
   - Verify tier breakdown
   - Verify GP carry if applicable

3. **All Tiers Reached**
   - Large distribution (e.g., $50M)
   - Verify all 4 tiers active
   - Verify GP catch-up and carry

## Performance Considerations

**Optimization Techniques:**

1. **Memoization**: Use `useMemo` for allocation calculations
2. **Stable Dependencies**: Avoid array/object dependencies in `useEffect`
3. **Conditional Rendering**: Only render hierarchy sections if applicable
4. **Data Filtering**: Filter investors by level only once

## Future Enhancements

**Planned Features:**
1. Batch capital calls (multiple investments)
2. Partial payment tracking
3. Payment gateway integration
4. Automated reminders/notifications
5. Multi-currency support
6. Offline mode with sync
7. Excel/CSV import for allocations
8. Historical distribution analysis
9. Tax withholding calculations
10. Wire transfer instructions

---

**Last Updated**: 2025-10-24
**Version**: 1.0.0
