# Architecture Overview

Comprehensive guide to the Polibit investment management platform architecture.

## System Design Philosophy

**Core Principles:**
1. **Hierarchical Structure**: Support multi-level fund structures (Master → Child → Sub-child)
2. **Two-Tier Economics**: Simple economics at lower levels, complex waterfall at top level
3. **Bottom-to-Top Operations**: Capital flows from bottom to top (L2 → L1)
4. **Separation of Concerns**: Business logic in `/lib`, UI in `/app/investment-manager`
5. **Type Safety**: Strong TypeScript typing throughout

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 15 App Router                    │
│                     (Server Components)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   Investment Manager UI      │  │       LP Portal UI           │
│   (GP/Admin Interface)       │  │   (Investor Interface)       │
│  ┌──────────────┐            │  │  ┌──────────────┐            │
│  │  Structures  │            │  │  │  Dashboard   │            │
│  │   Investors  │            │  │  │   Metrics    │            │
│  │  Investments │            │  │  │  Structures  │            │
│  │ Capital Calls│            │  │  │Capital Calls │            │
│  │Distributions │            │  │  │Distributions │            │
│  │   Reports    │            │  │  │  Documents   │            │
│  └──────────────┘            │  │  └──────────────┘            │
└──────────────────────────────┘  └──────────────────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Storage    │  │ Calculations │  │  Generators  │     │
│  │   (CRUD)     │  │  (Finance)   │  │  (Reports)   │     │
│  │              │  │              │  │              │     │
│  │ + LP Portal  │  │ + LP Metrics │  │              │     │
│  │   Helpers    │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Persistence Layer                    │
│                      (localStorage)                          │
│  • polibit_structures  • polibit_investors                  │
│  • polibit_investments • polibit_capital_calls              │
│  • polibit_distributions • polibit_firm_settings            │
│  • polibit_current_investor_email (LP session)              │
│  • polibit_investor_avatars (LP profiles)                   │
└─────────────────────────────────────────────────────────────┘
```

## Hierarchy System

### Three-Level Structure

```
Level 1: Master Trust (Polibit Energy I)
├── Complex waterfall calculations
├── GP carried interest
├── American/European waterfall options
└── Aggregates all lower-level economics
    │
    ├── Level 2: Investment Trust (Polibit Energy I - Investor Fund)
    │   ├── Simple 8-10% preferred + pro-rata
    │   ├── "Dumb pipe" pass-through economics
    │   ├── ownershipOfParent: 28.89% (of Master)
    │   └── Paid FIRST in distributions
    │       │
    │       └── Level 3: Project Fund (Specific Investment SPV)
    │           ├── Single investment focus
    │           ├── Simple economics
    │           └── Reports up to Level 2
    │
    └── Level 1 Direct Investors
        ├── Metropolitan Pension Fund (40%)
        ├── Rodriguez Capital Partners (24%)
        └── Receive REMAINDER after Level 2
```

### Key Hierarchy Concepts

**hierarchyLevel:**
- `1` = Master (top-level aggregator)
- `2` = Investment Trust (intermediate)
- `3` = Project Fund (leaf node)

**ownershipOfParent:**
- Field on child structures
- Indicates % ownership of parent structure
- Example: Investment Trust owns 28.89% of Master Trust
- Critical for capital call/distribution calculations

**parentId:**
- Links child structure to parent
- Enables tree traversal
- Used for hierarchy navigation

### Master-Only Aggregation Rule

**CRITICAL**: Summary metrics aggregate ONLY from master structures to avoid duplication.

**Implementation:**
```typescript
// Filter to master structures only
const masterStructuresOnly = structures.filter(s =>
  s.hierarchyLevel === 1 || !s.parentStructureId
)

// Calculate metrics from masters only
const totalCapital = masterStructuresOnly.reduce((acc, s) => {
  const amount = s.currency === 'USD' ? s.totalCommitment : s.totalCommitment / 20
  return acc + amount
}, 0)

const totalInvestors = masterStructuresOnly.reduce((acc, s) => acc + s.investors, 0)

const totalInvestments = masterStructuresOnly.reduce((acc, s) =>
  acc + parseInt(s.plannedInvestments || '0'), 0
)
```

**Rationale:**
- Master structures hold the definitive Total Commitment and Investor counts
- Child structures may have blank values initially (until GP allocates capital)
- Counting both masters and children would double-count totals
- Summary cards show accurate platform-wide totals

**Example:**
```
Master Structure (Polibit Energy I):
  - Total Commitment: $50M
  - Investors: 5
  - Planned Investments: 10

Child Structure (Polibit Energy I - Investor Fund):
  - Total Commitment: $0 (blank initially)
  - Investors: 0 (blank initially)
  - Planned Investments: 0 (blank initially)

Summary Cards Show:
  - Total Capital: $50M (master only, no duplication)
  - Total Investors: 5 (master only)
  - Planned Investments: 10 (master only)
```

**Code Location**: `src/app/investment-manager/structures/page.tsx:113-131`

## Two-Tier Economics Model

### Level 2: Investment Trust (Simple)

**Characteristics:**
- "Dumb pipe" pass-through
- Simple preferred return (8-10%)
- Pro-rata distribution
- No GP carried interest
- No complex waterfall

**Distribution Formula:**
```typescript
Level 2 Total = Total Amount × (Level 2 Ownership of Master / 100)

Individual Allocation = Level 2 Total × (Investor Ownership % / Total L2 Ownership %)
```

**Example:**
```
Total Distribution: $5,000,000
Level 2 Ownership: 28.89%
Level 2 Total: $1,444,500

Sarah Johnson (11.11% of L2): $1,444,500 × (11.11% / 72.22%) = $222,154
Anderson Family (44.44% of L2): $1,444,500 × (44.44% / 72.22%) = $888,617
David Chen (16.67% of L2): $1,444,500 × (16.67% / 72.22%) = $333,729
```

### Level 1: Master Trust (Complex)

**Characteristics:**
- "Smart aggregator"
- Complex waterfall calculation
- GP carried interest
- American/European waterfall options
- Receives remainder after Level 2

**Distribution Formula:**
```typescript
Level 1 Total = Total Amount - Level 2 Total

// Then apply waterfall to Level 1 Total
Waterfall Result = calculateWaterfall(
  algorithm,
  Level 1 Total,
  capitalAccounts,
  fundCreationDate,
  distributionDate
)
```

**Waterfall Tiers (American):**
1. **Return of Capital (ROC)**: Return contributed capital first
2. **Preferred Return (8%)**: 8% annual return on invested capital
3. **Profit Split (80/20)**: Remaining profits split 80% LP / 20% GP

**Example:**
```
Level 1 Total: $3,555,500 (after Level 2)

Tier 1 - ROC: $2,000,000 (return capital)
Tier 2 - Preferred: $800,000 (8% preferred)
Tier 3 - Profit: $755,500 (80% = $604,400 to LPs, 20% = $151,100 to GP)

Metropolitan: $604,400 × (40% / 64%) = $377,750
Rodriguez: $604,400 × (24% / 64%) = $226,650
```

## Capital Operations Flow

### Capital Calls (Bottom-to-Top)

```
┌─────────────────────────────────────────┐
│  GP Creates Capital Call: $12,500,000  │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   STEP 1: Calculate Level 2 Share      │
│   L2 Share = $12.5M × 28.89% = $3.61M  │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  STEP 2: Allocate Within Level 2        │
│  Pro-rata based on L2 ownership %       │
│  • Sarah: $3.61M × 11.11% = $401K      │
│  • Anderson: $3.61M × 44.44% = $1.61M  │
│  • David: $3.61M × 16.67% = $602K      │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   STEP 3: Calculate Level 1 Share      │
│   L1 Share = $12.5M - $3.61M = $8.89M  │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  STEP 4: Allocate Within Level 1        │
│  Pro-rata based on L1 ownership %       │
│  • Metropolitan: $8.89M × 40% = $3.56M │
│  • Rodriguez: $8.89M × 24% = $2.13M    │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  RESULT: Total = $12,500,000            │
│  Level 2 Investors: 3 ($3.61M)         │
│  Level 1 Investors: 2 ($8.89M)         │
└─────────────────────────────────────────┘
```

### Distributions (Bottom-to-Top with Waterfall)

```
┌─────────────────────────────────────────┐
│  GP Creates Distribution: $5,000,000   │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   STEP 1: Level 2 Paid First            │
│   L2 Share = $5M × 28.89% = $1.44M     │
│   Simple pro-rata within L2             │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   STEP 2: Level 1 Gets Remainder        │
│   L1 Share = $5M - $1.44M = $3.56M     │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   STEP 3: Apply Waterfall to L1         │
│   • Return of Capital                   │
│   • 8% Preferred Return                 │
│   • Profit Split (80/20)                │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  RESULT: Waterfall Tiers Applied        │
│  ✓ Tier 1: ROC ($2M)                   │
│  ✓ Tier 2: Preferred ($800K)           │
│  ✓ Tier 3: Profit ($760K)              │
│  ✗ Tier 4: Carry (not reached)         │
└─────────────────────────────────────────┘
```

## Data Flow Architecture

### Structure Management

```typescript
// Create Structure Flow
User Input → Validation → Structure Object → localStorage
                                ↓
                    Update Parent (if child)
                                ↓
                    Link Investors (if migrating)
```

### Investor Management with Hierarchy

```typescript
// Get Investors for Master Structure
getInvestorsByHierarchy(masterId) →
    1. Get direct L1 investors
    2. Find L2 child structures
    3. Get L2 investors with ownership data
    4. Combine with hierarchy metadata
    5. Return enriched investor list

// Result Structure:
[
  {
    investor: { id, name, type, ... },
    hierarchyLevel: 1,
    structureId: "master-id",
    structureName: "Master Trust",
    ownershipPercent: 40.0,
    commitment: 20000000
  },
  {
    investor: { id, name, type, ... },
    hierarchyLevel: 2,
    structureId: "child-id",
    structureName: "Investment Trust",
    ownershipPercent: 11.11,
    commitment: 2000000
  }
]
```

### Capital Operations Pipeline

```typescript
// Distribution Creation Flow
1. Select Fund (Master or Single-level)
2. Load Investors (via getInvestorsByHierarchy if Master)
3. Enter Distribution Amount
4. Calculate Allocations:
   if (hierarchyMaster) {
     - Split by ownershipOfParent
     - Calculate L2 allocations (pro-rata within L2)
     - Calculate L1 remainder
     - Apply waterfall to L1 (if enabled)
   } else {
     - Simple pro-rata across all investors
   }
5. Review Summary (2-tier breakdown if hierarchy)
6. Save Distribution
```

## Component Architecture

### Page Structure Pattern

```typescript
// Standard Page Component
export default async function Page({ params }: Props) {
  // 1. Await params (Next.js 15 requirement)
  const { id } = await params

  // 2. Server component logic (data fetching)

  // 3. Return Client Component
  return <ClientComponent id={id} />
}
```

### Wizard Pattern (4-Step Process)

```typescript
// Capital Call / Distribution Wizard
Step 1: Fund & Amount
  - Select fund
  - Enter total amount
  - Load investors via hierarchy function

Step 2: Details & Purpose
  - Dates, notice period
  - Purpose, use of proceeds
  - Related investment (optional)

Step 3: Investor Allocations
  - Show Level 2 section (blue)
  - Show Level 1 section (purple)
  - Display calculation method for each

Step 4: Review & Send
  - Comprehensive summary
  - Two-tier breakdown
  - Individual allocations
  - Send or save as draft
```

### List Page Filter Pattern

All list pages (Structures, Investments, Investors) follow a consistent dual-filter pattern:

```typescript
// State Management
const [searchQuery, setSearchQuery] = useState('')
const [selectedFilter, setSelectedFilter] = useState('all')  // Type filter
const [selectedStatus, setSelectedStatus] = useState('all')  // Status filter

// Combined Filter Logic
const filteredItems = items.filter((item) => {
  const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       item.otherField.toLowerCase().includes(searchQuery.toLowerCase())

  const matchesType = selectedFilter === 'all' || item.type === selectedFilter

  const matchesStatus = selectedStatus === 'all' ||
                       item.status.toLowerCase() === selectedStatus.toLowerCase()

  return matchesSearch && matchesType && matchesStatus
})
```

**UI Layout:**
```tsx
<div className="flex flex-col gap-4">
  {/* Row 1: Search + Type Filters + View Toggle */}
  <div className="flex items-center gap-4">
    <div className="relative flex-1 max-w-md">
      <Search className="..." />
      <Input placeholder="Search..." value={searchQuery} onChange={...} />
    </div>

    <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
      <TabsList>
        <TabsTrigger value="all">All Types</TabsTrigger>
        <TabsTrigger value="option1">Option 1</TabsTrigger>
        <TabsTrigger value="option2">Option 2</TabsTrigger>
      </TabsList>
    </Tabs>

    <ToggleGroup>{/* Grid/List view toggle */}</ToggleGroup>
  </div>

  {/* Row 2: Status Filters */}
  <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
    <TabsList>
      <TabsTrigger value="all">All Status</TabsTrigger>
      <TabsTrigger value="active">Active</TabsTrigger>
      <TabsTrigger value="pending">Pending</TabsTrigger>
      {/* More status options */}
    </TabsList>
  </Tabs>
</div>
```

**Status Filter Options by Page:**

**Structures** (`/structures/page.tsx:36-81`):
- All Status, Active, Fundraising, Closed

**Investments** (`/investments/page.tsx:20-38`):
- All Status, Active, Pending, Closed, Exited

**Investors** (`/investors/page.tsx:31-39`):
- All Status, Active, Pending, KYC/KYB, Contracts, Payments, Inactive

**Key Features:**
- Filters work cumulatively (AND logic)
- Search applies to multiple fields (name, location, email, etc.)
- Type and status filters are independent
- All filters clear with "All" option
- Status filters match badge colors/labels on items

### Storage Layer Pattern

```typescript
// Standard CRUD Pattern
interface StorageModule {
  getItems(): Item[]
  getItemById(id: string): Item | null
  saveItem(item: Omit<Item, 'id'>): Item
  updateItem(id: string, updates: Partial<Item>): Item | null
  deleteItem(id: string): boolean
}

// Hierarchy-Specific Functions
getInvestorsByHierarchy(masterId: string): HierarchyInvestor[]
getStructureHierarchy(structureId: string): Structure[]
```

## State Management

### React State Pattern

```typescript
// Component State
const [structures, setStructures] = useState<Structure[]>([])
const [selectedFund, setSelectedFund] = useState<Structure | null>(null)
const [investors, setInvestors] = useState<any[]>([])
const [allocations, setAllocations] = useState<Allocation[]>([])

// Memoized Calculations
const calculatedAllocations = useMemo(() => {
  // Complex calculation logic
  return allocations
}, [dependencies])

// Effect for Side Effects
useEffect(() => {
  setAllocations(calculatedAllocations)
}, [calculatedAllocations])
```

### localStorage Management

```typescript
// Storage Keys
const STORAGE_KEYS = {
  structures: 'polibit_structures',
  investors: 'polibit_investors',
  investments: 'polibit_investments',
  capitalCalls: 'polibit_capital_calls',
  distributions: 'polibit_distributions',
  firmSettings: 'polibit_firm_settings',
}

// Read Pattern
const items = JSON.parse(localStorage.getItem(key) || '[]')

// Write Pattern
localStorage.setItem(key, JSON.stringify(items))
```

## Routing Architecture

### Next.js 15 App Router Structure

```
/investment-manager
├── /structures
│   ├── /[id]                    # Structure detail
│   │   ├── /edit               # Edit master structure
│   │   └── /[childSlug]        # Child structure
│   │       ├── (detail)        # Child detail
│   │       └── /edit          # Edit child structure
│   └── (list)                  # Structure list
├── /investors/[id]             # Dynamic investor routes
├── /investments/[id]           # Dynamic investment routes
├── /operations
│   ├── /capital-calls
│   │   ├── /create            # 4-step wizard
│   │   └── /[id]              # Detail view
│   └── /distributions
│       ├── /create            # 4-step wizard
│       └── /[id]              # Detail view
└── /reports/[id]              # Dynamic report routes
```

## Security & Validation

### Input Validation

```typescript
// Capacity Validation
const totalInvestments = getCurrentInvestmentCount()
const maxCapacity = structure.investmentCapacity

if (totalInvestments >= maxCapacity) {
  throw new Error('Investment capacity reached')
}

// Ownership Validation
const totalOwnership = investors.reduce((sum, inv) =>
  sum + inv.ownershipPercent, 0)

if (totalOwnership > 100) {
  throw new Error('Total ownership cannot exceed 100%')
}
```

### Data Integrity

```typescript
// Edit Mode Capacity Check
const currentCount = investments.filter(
  inv => inv.fundId === fundId && inv.id !== currentItemId
).length

if (currentCount >= maxCapacity) {
  throw new Error('Cannot add: capacity reached')
}
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Use `useMemo` for expensive calculations
2. **Dependency Management**: Stable dependency arrays in `useEffect`
3. **Conditional Rendering**: Only render what's needed
4. **Data Merging**: Merge static + localStorage data efficiently
5. **Hierarchy Loading**: Load all levels in single pass

### Best Practices

```typescript
// ✅ Good: Memoized calculation
const allocations = useMemo(() => {
  return calculateAllocations(amount, investors)
}, [amount, investors])

// ❌ Bad: Calculation in render
const allocations = calculateAllocations(amount, investors)

// ✅ Good: Stable dependency array
useEffect(() => {
  setData(calculatedValue)
}, [calculatedValue])

// ❌ Bad: Array dependencies causing re-renders
useEffect(() => {
  // calculation
}, [investors, structures]) // Arrays change identity
```

## Future Architecture Enhancements

**Planned Improvements:**
1. **Database Migration**: Move from localStorage to PostgreSQL/Supabase
2. **Real-time Updates**: WebSocket support for multi-user environments
3. **API Layer**: RESTful API for external integrations
4. **Caching**: Redis for frequently accessed data
5. **Background Jobs**: Queue system for heavy calculations
6. **Audit Trail**: Track all changes with timestamps and user info

---

## LP Portal Integration

### Dual Interface Architecture

The platform provides two distinct user interfaces sharing the same data:

**Investment Manager** (`/investment-manager/*`):
- Full administrative access
- Create and manage structures, investors, investments
- Process capital calls and distributions
- Generate reports and tax documents
- Update NAV and valuations

**LP Portal** (`/lp-portal/*`):
- Investor-specific filtered views
- Portfolio dashboard with customizable metrics
- Capital call and distribution history
- Document access
- Onboarding workflows

### Data Filtering

```typescript
// Investment Manager: Sees all data
const allStructures = getStructures()  // Returns all structures
const allInvestors = getInvestors()    // Returns all investors

// LP Portal: Filtered by investor
const email = getCurrentInvestorEmail()
const investor = getInvestorByEmail(email)

const myStructures = getInvestorStructures(investor)
// → Only structures where investor.fundOwnerships.onboardingStatus === 'Active'

const myCapitalCalls = getInvestorCapitalCalls(investor.id)
// → Only capital calls where investor has an allocation

const myDistributions = getInvestorDistributions(investor.id)
// → Only distributions where investor has an allocation
```

### Real-Time Synchronization

Both interfaces use localStorage, ensuring instant updates:

```typescript
// Investment Manager updates NAV
Investment Manager → updateStructureNav(id, { totalNav: 20000000 })
  → localStorage.setItem('polibit_structures', structures)

// LP Portal immediately sees updated NAV
LP Portal (refresh) → getInvestorStructures()
  → Uses structure.currentNav for current value calculation ✓

// Same pattern for capital calls, distributions, etc.
```

For detailed integration information, see [Investment Manager ↔ LP Portal Integration](./investment-manager-lp-portal-integration.md).

---

**Last Updated**: 2025-11-01
**Version**: 1.1.0
