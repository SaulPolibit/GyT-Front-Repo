# Investment Manager & LP Portal Integration

Comprehensive guide to the data relationship and integration between Investment Manager and LP Portal.

## Overview

The **Investment Manager** and **LP Portal** are two interconnected applications that share the same underlying data layer. Investment Manager is the GP/admin interface for fund management, while LP Portal is the investor-facing interface for portfolio tracking.

```
┌─────────────────────────────────────────────────────────────┐
│                    Investment Manager                        │
│              (GP/Admin Interface)                           │
│  • Create & manage structures (funds/SPVs/trusts)          │
│  • Manage investor relationships                            │
│  • Track investments & valuations                           │
│  • Process capital calls & distributions                    │
│  • Update NAV (Net Asset Value)                            │
│  • Generate reports & tax documents                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared Data Layer                         │
│                      (localStorage)                          │
│  • polibit_structures                                       │
│  • polibit_investors                                        │
│  • polibit_investments                                      │
│  • polibit_capital_calls                                    │
│  • polibit_distributions                                    │
│  • polibit_firm_settings                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       LP Portal                              │
│              (Investor Interface)                           │
│  • View portfolio summary & performance                     │
│  • Track fund ownership & valuations                        │
│  • Review capital calls & distributions                     │
│  • Access documents & reports                               │
│  • Complete onboarding workflows                            │
│  • Customize dashboard with metrics                         │
└─────────────────────────────────────────────────────────────┘
```

## Data Architecture

### Shared Storage Keys

Both applications use the same localStorage keys:

| Key | Purpose | Created By | Read By |
|-----|---------|------------|---------|
| `polibit_structures` | Funds, SPVs, Trusts | Investment Manager | Both |
| `polibit_investors` | LP relationships & allocations | Investment Manager | Both |
| `polibit_investments` | Portfolio investments | Investment Manager | Investment Manager |
| `polibit_capital_calls` | Capital call notices | Investment Manager | Both |
| `polibit_distributions` | Distribution payments | Investment Manager | Both |
| `polibit_firm_settings` | Firm configuration | Investment Manager | Investment Manager |
| `polibit_current_investor_email` | Active LP session | LP Portal | LP Portal |
| `polibit_investor_avatars` | LP profile images | LP Portal | LP Portal |

### Data Flow Patterns

#### Investment Manager → LP Portal (Primary Flow)

```typescript
// 1. Investment Manager creates a structure
Investment Manager → structures-storage.ts → saveStructure()
  → localStorage.setItem('polibit_structures', [...structures])

// 2. LP Portal reads the same data
LP Portal → lp-portal-helpers.ts → getInvestorStructures()
  → structures-storage.ts → getStructures()
  → localStorage.getItem('polibit_structures')
```

#### LP Portal → Investment Manager (Secondary Flow)

```typescript
// LP completes onboarding for a specific fund
LP Portal → lp-portal-helpers.ts → updateStructureOnboardingStatus()
  → investors-storage.ts → updateInvestor()
  → localStorage.setItem('polibit_investors', [...investors])

// Investment Manager sees updated status
Investment Manager → investors-storage.ts → getInvestors()
  → localStorage.getItem('polibit_investors')
```

## Key Integration Points

### 1. Structure (Fund) Management

**Investment Manager Side:**
```typescript
// Location: /app/investment-manager/structures
// Creates and manages fund structures

interface Structure {
  id: string
  name: string
  type: 'Fund' | 'SA/LLC' | 'Fideicomiso/Trust' | 'Private Debt'
  totalCommitment: number
  currentNav?: number        // Updated via NAV tracking
  navHistory?: NavUpdate[]   // Historical NAV entries
  hierarchyLevel?: number
  parentStructureId?: string
  // ... more fields
}

// Update NAV in Investment Manager
updateStructureNav(structureId, { totalNav: 15000000 })
```

**LP Portal Side:**
```typescript
// Location: /app/lp-portal/dashboard
// Reads structures and calculates current value

// Get investor's structures (filters by onboardingStatus === 'Active')
const structures = getInvestorStructures(investor)

// Calculate current value using NAV
structures.map(ownership => {
  const structure = getStructures().find(s => s.id === ownership.fundId)

  // Use NAV if available, otherwise fall back to totalCommitment
  const baseValue = structure.currentNav ?? structure.totalCommitment
  const currentValue = baseValue * (ownership.ownershipPercent / 100)

  return { ...ownership, currentValue }
})
```

**Key Connection:**
- Investment Manager updates `structure.currentNav`
- LP Portal calculates `currentValue` using updated NAV
- Changes are **instant** (same localStorage)

### 2. Investor Management

**Investment Manager Side:**
```typescript
// Location: /app/investment-manager/investors
// Creates and manages investor relationships

interface Investor {
  id: string
  name: string
  email: string              // Used for LP Portal authentication
  status: 'Active' | 'Pending' | 'KYC/KYB' | ...
  fundOwnerships: {
    fundId: string           // Links to Structure.id
    fundName: string
    commitment: number
    calledCapital: number
    onboardingStatus: string // Per-structure status
    ownershipPercent: number
    hierarchyLevel?: number
  }[]
}

// Add investor to a fund
addInvestorToFund(investorId, fundId, {
  commitment: 500000,
  ownershipPercent: 1.25,
  onboardingStatus: 'Pending'
})
```

**LP Portal Side:**
```typescript
// Location: /app/lp-portal/dashboard
// Authenticates and displays investor data

// Get investor by email (from sign-in)
const email = getCurrentInvestorEmail()  // localStorage
const investor = getInvestorByEmail(email)

// Filter to only show Active structures
const activeStructures = investor.fundOwnerships.filter(
  ownership => ownership.onboardingStatus === 'Active'
)

// LP can update their onboarding status
updateStructureOnboardingStatus(
  investorId,
  fundId,
  'Active',  // Completed onboarding
  { calledCapital: 125000 }
)
```

**Key Connection:**
- Investor.email links LP Portal authentication to Investment Manager data
- Investor.fundOwnerships creates the many-to-many relationship (investors ↔ structures)
- onboardingStatus controls visibility in LP Portal (only 'Active' shows)

### 3. Capital Calls

**Investment Manager Side:**
```typescript
// Location: /app/investment-manager/operations/capital-calls
// Creates capital call notices

interface CapitalCall {
  id: string
  fundId: string             // Links to Structure.id
  totalAmount: number
  callDate: string
  dueDate: string
  status: 'Draft' | 'Sent' | 'In Progress' | 'Completed'
  investorAllocations: {
    investorId: string       // Links to Investor.id
    investorName: string
    amountDue: number
    amountPaid: number
    amountOutstanding: number
    status: 'Pending' | 'Sent' | 'Paid' | 'Overdue'
    hierarchyLevel?: number
  }[]
}

// Create capital call for $12.5M
createCapitalCall({
  fundId: 'structure-123',
  totalAmount: 12500000,
  investorAllocations: [
    { investorId: 'inv-1', amountDue: 500000, status: 'Sent' },
    { investorId: 'inv-2', amountDue: 2000000, status: 'Sent' }
  ]
})
```

**LP Portal Side:**
```typescript
// Location: /app/lp-portal/dashboard
// Displays investor-specific capital calls

// Get capital calls for logged-in investor
const investorCapitalCalls = getInvestorCapitalCalls(investor.id)

// Filter by investor allocation
function getInvestorCapitalCalls(investorId: string) {
  return allCapitalCalls
    .filter(cc => cc.investorAllocations.some(
      alloc => alloc.investorId === investorId
    ))
    .map(cc => {
      const allocation = cc.investorAllocations.find(
        alloc => alloc.investorId === investorId
      )
      return { ...cc, myAllocation: allocation }
    })
}

// LP sees pending capital calls
const pendingCalls = investorCapitalCalls.filter(
  cc => cc.myAllocation.status === 'Pending' || cc.myAllocation.status === 'Sent'
)
```

**Key Connection:**
- CapitalCall.fundId links to structures
- CapitalCall.investorAllocations creates investor-specific allocations
- LP Portal filters all capital calls to show only relevant ones
- Investment Manager updates status → LP Portal sees real-time updates

### 4. Distributions

**Investment Manager Side:**
```typescript
// Location: /app/investment-manager/operations/distributions
// Creates distribution payments

interface Distribution {
  id: string
  fundId: string             // Links to Structure.id
  totalAmount: number
  distributionDate: string
  status: 'Draft' | 'Pending' | 'Completed'
  type: 'Income' | 'Capital Gain' | 'Return of Capital' | 'Mixed'
  investorAllocations: {
    investorId: string       // Links to Investor.id
    investorName: string
    finalAllocation: number
    paymentStatus: 'Pending' | 'Sent' | 'Completed'
    hierarchyLevel?: number
  }[]
}

// Create distribution for $5M
createDistribution({
  fundId: 'structure-123',
  totalAmount: 5000000,
  type: 'Income',
  investorAllocations: [
    { investorId: 'inv-1', finalAllocation: 200000, paymentStatus: 'Completed' },
    { investorId: 'inv-2', finalAllocation: 800000, paymentStatus: 'Completed' }
  ]
})
```

**LP Portal Side:**
```typescript
// Location: /app/lp-portal/dashboard
// Displays investor-specific distributions

// Get distributions for logged-in investor
const investorDistributions = getInvestorDistributions(investor.id)

// Calculate Total Distributed (lifetime)
const totalDistributed = allDistributions
  .filter(dist => dist.investorAllocations.some(
    alloc => alloc.investorId === investor.id
  ))
  .reduce((sum, dist) => {
    const allocation = dist.investorAllocations.find(
      alloc => alloc.investorId === investor.id
    )
    return sum + (allocation?.finalAllocation || 0)
  }, 0)

// Calculate Distributions YTD
const currentYear = new Date().getFullYear()
const distributionsYTD = allDistributions
  .filter(dist => new Date(dist.distributionDate).getFullYear() === currentYear)
  .filter(dist => dist.investorAllocations.some(
    alloc => alloc.investorId === investor.id
  ))
  .reduce((sum, dist) => {
    const allocation = dist.investorAllocations.find(
      alloc => alloc.investorId === investor.id
    )
    return sum + (allocation?.finalAllocation || 0)
  }, 0)
```

**Key Connection:**
- Distribution.fundId links to structures
- Distribution.investorAllocations creates investor-specific allocations
- LP Portal calculates metrics from distribution records
- Investment Manager creates → LP Portal displays and calculates

### 5. NAV (Net Asset Value) Tracking

**Investment Manager Side:**
```typescript
// Location: /app/investment-manager/structures/[id]
// Updates NAV for structures

// NAV Update Interface
interface NavUpdate {
  date: string
  totalNav: number
  navPerShare?: number
  notes?: string
}

// Update structure NAV
updateStructureNav('structure-123', {
  totalNav: 15000000,
  navPerShare: 12.50,
  notes: 'Q1 2025 valuation based on property appraisals'
})

// Structure NAV fields
interface Structure {
  currentNav?: number        // Latest NAV value
  navHistory?: NavUpdate[]   // Historical NAV entries
}
```

**LP Portal Side:**
```typescript
// Location: /app/lp-portal/dashboard
// Uses NAV for current value calculations

function getInvestorStructures(investor: Investor) {
  return investor.fundOwnerships.map(ownership => {
    const structure = getStructures().find(s => s.id === ownership.fundId)

    // Calculate ownership % from called capital
    const ownershipPercent = structure.totalCommitment > 0
      ? (ownership.calledCapital / structure.totalCommitment) * 100
      : 0

    // Use NAV if available, otherwise fall back to totalCommitment
    const baseValue = structure.currentNav ?? structure.totalCommitment
    const currentValue = baseValue * (ownershipPercent / 100)

    return {
      ...ownership,
      currentValue,
      unrealizedGain: currentValue - ownership.calledCapital
    }
  })
}
```

**Key Connection:**
- Investment Manager updates `structure.currentNav`
- LP Portal reads NAV for current value calculations
- If NAV not set, falls back to totalCommitment
- NAV updates are instant across both interfaces

## Authentication & Access Control

### Investment Manager
- **Route**: `/investment-manager/*`
- **Authentication**: Form-based (username/password) - redirects to dashboard
- **Access Level**: Full admin access to all data
- **Users**: GP partners, fund administrators

### LP Portal
- **Route**: `/lp-portal/*`
- **Authentication**: Email-based lookup (no password in demo)
- **Access Level**: Filtered to investor's own data only
- **Users**: Limited Partners (LPs), individual investors

### Current Investor Session

```typescript
// LP Portal session management
export function getCurrentInvestorEmail(): string {
  return localStorage.getItem('polibit_current_investor_email') || ''
}

export function setCurrentInvestorEmail(email: string): void {
  localStorage.setItem('polibit_current_investor_email', email)
}

// Sign-in flow
// 1. LP enters email
// 2. System looks up investor by email
const investor = getInvestorByEmail(email)
// 3. If found, store email and redirect to dashboard
setCurrentInvestorEmail(email)
// 4. Dashboard loads investor-specific data
```

## Data Filtering & Visibility

### Investment Manager Views
- **Structures**: All structures (masters + children)
- **Investors**: All investors across all structures
- **Investments**: All investments across all structures
- **Capital Calls**: All capital calls with full investor allocations
- **Distributions**: All distributions with full investor allocations

### LP Portal Views
- **Structures**: Only structures where `onboardingStatus === 'Active'`
- **Capital Calls**: Only calls where investor has an allocation
- **Distributions**: Only distributions where investor has an allocation
- **Metrics**: Calculated from investor's filtered data only

### Onboarding Status Filter

```typescript
// Investment Manager: All fund ownerships
investor.fundOwnerships = [
  { fundId: 'fund-1', onboardingStatus: 'Active' },      // ✅ LP sees this
  { fundId: 'fund-2', onboardingStatus: 'Pending' },     // ❌ LP doesn't see
  { fundId: 'fund-3', onboardingStatus: 'KYC/KYB' },     // ❌ LP doesn't see
  { fundId: 'fund-4', onboardingStatus: 'Active' }       // ✅ LP sees this
]

// LP Portal: Only Active
const activeStructures = investor.fundOwnerships.filter(
  ownership => ownership.onboardingStatus === 'Active'
)
// Result: fund-1 and fund-4 only
```

## Real-Time Data Synchronization

### Immediate Updates

Since both applications use localStorage, all changes are **instant**:

```typescript
// Scenario 1: Investment Manager updates NAV
Investment Manager → updateStructureNav(id, { totalNav: 20000000 })
  → localStorage.setItem('polibit_structures', updatedStructures)
LP Portal → Refresh page → getInvestorStructures()
  → Instantly sees new currentValue based on updated NAV ✅

// Scenario 2: Investment Manager creates distribution
Investment Manager → createDistribution({ ... })
  → localStorage.setItem('polibit_distributions', [...distributions, newDist])
LP Portal → Refresh page → getInvestorDistributions()
  → Instantly sees new distribution in list ✅

// Scenario 3: LP completes onboarding
LP Portal → updateStructureOnboardingStatus(investorId, fundId, 'Active')
  → localStorage.setItem('polibit_investors', updatedInvestors)
Investment Manager → Refresh investors page
  → Instantly sees investor status changed to 'Active' ✅
```

### No Polling or WebSockets Required

Since this is a demo application using localStorage:
- No backend API calls
- No polling intervals
- No WebSocket connections
- Changes are immediate within the same browser
- **Note**: Different browsers/devices do NOT sync (localStorage is per-browser)

## Helper Functions & Libraries

### LP Portal Helpers

**File**: `src/lib/lp-portal-helpers.ts`

```typescript
// Get investor by email (authentication)
export function getInvestorByEmail(email: string): Investor | null

// Get investor's structures (filtered to Active only)
export function getInvestorStructures(investor: Investor): InvestorStructure[]

// Get investor's capital calls
export function getInvestorCapitalCalls(investorId: string): CapitalCall[]

// Get investor's distributions
export function getInvestorDistributions(investorId: string): Distribution[]

// Calculate portfolio metrics
export function calculateInvestorMetrics(investor: Investor): PortfolioMetrics

// Get pending invitations (non-Active structures)
export function getPendingInvitations(investor: Investor): PendingInvitation[]

// Update onboarding status for specific structure
export function updateStructureOnboardingStatus(
  investorId: string,
  fundId: string,
  newStatus: 'Pending' | 'KYC/KYB' | 'Contracts' | 'Commitment' | 'Active'
): boolean
```

### Storage Modules

**Shared by both applications:**

```typescript
// src/lib/structures-storage.ts
export function getStructures(): Structure[]
export function getStructureById(id: string): Structure | null
export function saveStructure(structure: Omit<Structure, 'id'>): Structure
export function updateStructure(id: string, updates: Partial<Structure>): Structure | null
export function updateStructureNav(id: string, navData: NavUpdate): Structure | null

// src/lib/investors-storage.ts
export function getInvestors(): Investor[]
export function getInvestorById(id: string): Investor | null
export function saveInvestor(investor: Omit<Investor, 'id'>): Investor
export function updateInvestor(id: string, updates: Partial<Investor>): Investor | null

// src/lib/capital-calls-storage.ts
export function getCapitalCalls(): CapitalCall[]
export function getCapitalCallById(id: string): CapitalCall | null
export function saveCapitalCall(call: Omit<CapitalCall, 'id'>): CapitalCall

// src/lib/distributions-storage.ts
export function getDistributions(): Distribution[]
export function getDistributionById(id: string): Distribution | null
export function saveDistribution(dist: Omit<Distribution, 'id'>): Distribution
```

## Metric Calculations

### LP Portal Metrics

**File**: `src/lib/lp-metric-calculations.ts`

All LP Portal dashboard metrics are calculated from shared data:

```typescript
export function calculateLPMetric(metricId: string, fundId: string = 'all'): CalculatedMetric

// Portfolio Metrics
case 'total-commitment':          // Sum of investor.fundOwnerships.commitment
case 'current-portfolio-value':   // Sum using structure.currentNav
case 'total-return':              // Current value + distributions - called capital
case 'unrealized-gains':          // Current value - called capital

// Capital Metrics
case 'called-capital':            // Sum of investor.fundOwnerships.calledCapital
case 'uncalled-capital':          // Commitment - called capital
case 'pending-capital-calls':     // From capital-calls-storage filtered by investor

// Distribution Metrics
case 'total-distributed':         // Sum from distributions-storage (lifetime)
case 'distributions-ytd':         // Sum from distributions-storage (current year)
```

**Key Pattern**: All metrics pull from shared storage functions, filter by investor, and calculate.

## Example: Complete Data Flow

### Scenario: Investment Manager creates capital call → LP sees it

```typescript
// STEP 1: Investment Manager creates capital call
// Location: /app/investment-manager/operations/capital-calls/create
const capitalCall = {
  fundId: 'polibit-re-1',
  totalAmount: 12500000,
  callDate: '2025-01-15',
  dueDate: '2025-02-15',
  status: 'Sent',
  investorAllocations: [
    {
      investorId: 'tony-cueva',  // Tony's investor ID
      investorName: 'Tony Cueva',
      amountDue: 125000,
      amountOutstanding: 125000,
      status: 'Sent',
      hierarchyLevel: 1
    },
    // ... other investors
  ]
}

saveCapitalCall(capitalCall)
// → localStorage.setItem('polibit_capital_calls', [...calls, capitalCall])

// STEP 2: Tony signs into LP Portal
// Location: /app/lp-portal/sign-in
setCurrentInvestorEmail('tony.cueva@example.com')
// → localStorage.setItem('polibit_current_investor_email', 'tony.cueva@example.com')

// STEP 3: LP Portal dashboard loads
// Location: /app/lp-portal/dashboard
const email = getCurrentInvestorEmail()  // 'tony.cueva@example.com'
const investor = getInvestorByEmail(email)  // { id: 'tony-cueva', ... }

// STEP 4: Get Tony's capital calls
const capitalCalls = getInvestorCapitalCalls('tony-cueva')
// → Filters all capital calls where investorAllocations contains 'tony-cueva'
// → Returns: [{ ...capitalCall, myAllocation: { amountDue: 125000, ... } }]

// STEP 5: Calculate pending capital calls metric
const pendingCalls = capitalCalls.filter(cc =>
  cc.myAllocation.status === 'Sent' || cc.myAllocation.status === 'Pending'
)
const pendingAmount = pendingCalls.reduce((sum, cc) =>
  sum + cc.myAllocation.amountOutstanding, 0
)
// → Result: $125,000

// STEP 6: Display on dashboard
<MetricCard
  title="Pending Capital Calls"
  value={formatCurrency(pendingAmount)}
  badge={`${pendingCalls.length} call${pendingCalls.length !== 1 ? 's' : ''}`}
/>
// → Shows: "$125,000" with badge "1 call"
```

## Future Enhancements

### Database Migration
```typescript
// Current: localStorage
localStorage.getItem('polibit_structures')

// Future: PostgreSQL/Supabase
const { data } = await supabase
  .from('structures')
  .select('*')
  .eq('id', structureId)
```

### Real-Time Sync
```typescript
// Future: WebSocket for multi-user
supabase
  .channel('structures')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'structures' },
    payload => {
      // Update UI when Investment Manager changes NAV
      refreshStructures()
    }
  )
  .subscribe()
```

### Role-Based Access Control
```typescript
// Future: Row-level security
CREATE POLICY "Investors can view own data"
ON investors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "GPs can view all data"
ON investors FOR SELECT
USING (auth.jwt() ->> 'role' = 'gp');
```

---

**Last Updated**: 2025-11-01
**Version**: 1.0.0
