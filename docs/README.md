# Polibit Investment Management Platform Documentation

Comprehensive documentation for the Polibit investment management platform, covering both Investment Manager (GP interface) and LP Portal (investor interface).

## Table of Contents

### Core Documentation
1. [Architecture Overview](./architecture.md) - System design, hierarchy model, data flow
2. [Investment Manager ↔ LP Portal Integration](./investment-manager-lp-portal-integration.md) - Data relationship between GP and LP interfaces
3. [Data Models & Storage](./data-models.md) - TypeScript types, localStorage schemas

### Investment Manager (GP Interface)
4. [Structure Management](./structures.md) - Fund/SPV/Trust setup and hierarchy
5. [Investor Management](./investors.md) - LP relationships and allocations
6. [Investment Management](./investments.md) - Portfolio tracking and valuations
7. [Capital Operations](./capital-operations.md) - Capital calls and distributions
8. [Waterfall Calculations](./waterfalls.md) - American/European waterfall algorithms
9. [Reports & Analytics](./reports.md) - Performance, K-1, ILPA reports

### LP Portal (Investor Interface)
10. [LP Portal Overview](./lp-portal.md) - Dashboard, metrics, and investor experience
11. [LP Onboarding](./lp-onboarding.md) - Multi-step onboarding workflow

### UI & Components
12. [UI Components](./components.md) - Reusable components and patterns

## Quick Start

**Key Concepts:**
- **Hierarchy System**: Master (L1) → Investment Trust (L2) → Project Fund (L3)
- **Two-Tier Economics**: Simple distributions at L2, complex waterfall at L1
- **Bottom-to-Top Cascade**: L2 paid first, L1 receives remainder
- **Waterfall Tiers**: ROC → Preferred Return → GP Catch-Up → Carry

**Core Technologies:**
- Next.js 15.5.4 with App Router
- TypeScript
- shadcn/ui components
- localStorage for data persistence
- Recharts for visualizations
- TanStack Table for data tables

## File Structure

```
src/
├── app/
│   ├── investment-manager/          # GP/Admin Interface
│   │   ├── page.tsx                 # Dashboard
│   │   ├── layout.tsx               # Sidebar layout
│   │   ├── structures/              # Structure management
│   │   │   ├── page.tsx            # List view (with type & status filters)
│   │   │   ├── [id]/page.tsx       # Detail view (includes NAV section)
│   │   │   ├── [id]/edit/page.tsx  # Edit master structure
│   │   │   └── [id]/[childSlug]/
│   │   │       ├── page.tsx        # Child structure detail
│   │   │       └── edit/page.tsx   # Edit child structure
│   │   ├── structure-setup/        # Onboarding wizard
│   │   │   ├── page.tsx           # 7-step wizard
│   │   │   └── components/        # Step components
│   │   ├── investors/             # Investor management
│   │   │   ├── page.tsx          # List view (with type & status filters)
│   │   │   ├── add/page.tsx      # Add investor
│   │   │   ├── [id]/page.tsx     # Detail view
│   │   │   └── [id]/edit/page.tsx # Edit investor
│   │   ├── investments/          # Investment management
│   │   │   ├── page.tsx         # Portfolio view (with type & status filters)
│   │   │   ├── add/page.tsx     # Add investment
│   │   │   ├── [id]/page.tsx    # Detail view
│   │   │   └── [id]/edit/page.tsx # Edit investment
│   │   ├── operations/          # Capital operations
│   │   │   ├── capital-calls/
│   │   │   │   ├── page.tsx    # List view
│   │   │   │   ├── create/page.tsx # 4-step wizard
│   │   │   │   └── [id]/page.tsx # Detail view
│   │   │   └── distributions/
│   │   │       ├── page.tsx    # List view
│   │   │       ├── create/page.tsx # 4-step wizard
│   │   │       └── [id]/page.tsx # Detail view
│   │   ├── reports/            # Reports & analytics
│   │   │   ├── page.tsx       # Report list
│   │   │   ├── builder/page.tsx # Custom report builder
│   │   │   ├── performance/page.tsx # Performance reports
│   │   │   └── [id]/page.tsx  # Report detail
│   │   ├── waterfalls/        # Waterfall calculator
│   │   │   └── page.tsx
│   │   ├── capital-overview/  # Capital activity
│   │   │   ├── commitments/page.tsx
│   │   │   └── activity/page.tsx
│   │   └── settings/page.tsx  # Firm settings
│   │
│   ├── lp-portal/                  # LP/Investor Interface
│   │   ├── page.tsx                # Landing page (redirects to sign-in)
│   │   ├── layout.tsx              # Main layout
│   │   ├── sign-in/page.tsx        # Email-based sign-in
│   │   ├── sign-up/page.tsx        # New investor registration
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Main dashboard with metrics
│   │   │   └── layout.tsx         # Dashboard layout with sidebar
│   │   ├── structures/
│   │   │   └── [id]/page.tsx      # Fund detail view
│   │   ├── capital-calls/
│   │   │   └── page.tsx           # Capital calls list
│   │   ├── distributions/
│   │   │   └── page.tsx           # Distributions list
│   │   ├── documents/
│   │   │   └── page.tsx           # Documents & reports
│   │   ├── account/
│   │   │   └── page.tsx           # Profile settings
│   │   └── invitations/
│   │       └── [id]/page.tsx      # Onboarding workflow
│   │
│   └── sign-in/page.tsx            # Investment Manager sign-in
│       sign-up/page.tsx            # Investment Manager sign-up
│
├── lib/                            # Core business logic
│   ├── types.ts                   # TypeScript interfaces
│   ├── structures-storage.ts      # Structure CRUD + NAV
│   ├── investors-storage.ts       # Investor CRUD + hierarchy
│   ├── investments-storage.ts     # Investment CRUD
│   ├── capital-calls-storage.ts   # Capital call CRUD
│   ├── distributions-storage.ts   # Distribution CRUD
│   ├── lp-portal-helpers.ts       # LP Portal data helpers
│   ├── lp-metric-calculations.ts  # LP metric calculations
│   ├── waterfall-calculations.ts  # Waterfall algorithms
│   ├── nav-calculations.ts        # NAV calculations
│   ├── investment-calculations.ts # IRR, MOIC
│   ├── performance-calculations.ts # Fund performance
│   ├── report-calculations.ts     # Report data
│   ├── k1-calculations.ts         # K-1 tax forms
│   ├── k1-generator.ts            # K-1 generation
│   ├── pdf-generator.ts           # PDF reports
│   ├── excel-generator.ts         # Excel exports
│   ├── csv-generator.ts           # CSV exports
│   ├── ilpa-*.ts                  # ILPA reporting
│   └── custom-report-*.ts         # Custom report generators
│
└── components/                     # UI components
    ├── app-sidebar.tsx            # Investment Manager navigation
    ├── lp-portal-sidebar.tsx      # LP Portal navigation
    ├── structure-valuation-section.tsx # NAV tracking UI
    ├── ui/                        # shadcn/ui components
    └── *.tsx                      # Custom components
```

## Development Workflow

**Adding a New Feature:**
1. Check relevant documentation file
2. Review data models in `types.ts`
3. Add/update storage functions in `*-storage.ts`
4. Create page components in `app/investment-manager/`
5. Update CLAUDE.md with any new patterns

**Common Tasks:**
- Structure CRUD: `structures-storage.ts`
- Investor CRUD: `investors-storage.ts`
- Hierarchy loading: `getInvestorsByHierarchy()`
- Waterfall calculation: `calculateWaterfall()`
- Report generation: `*-generator.ts` files

## Key Conventions

**Next.js 15 App Router:**
- Dynamic params must be awaited: `const { id } = await params;`
- Server components by default
- Client components with `'use client'`

**Data Persistence:**
- localStorage with keys: `polibit_structures`, `polibit_investors`, etc.
- CRUD pattern: `getItems()`, `saveItem()`, `updateItem()`, `deleteItem()`

**Ownership Calculation:**
- Based on equity position ONLY, not total fund commitment
- For hierarchies: Use `_hierarchyOwnership` field with ownership within structure

**Geography Parsing:**
- US: "City, State, Country" (3 parts)
- Non-US: "City, Country" (2 parts)
- Check structure jurisdiction before parsing

**Filtering System:**
- All list pages (Structures, Investments, Investors) support dual filtering
- **Row 1**: Search box + Type filters (Fund/SA/Trust, Real Estate/PE/Debt, Individual/Institution)
- **Row 2**: Status filters matching badge statuses
- Filters work cumulatively (search AND type AND status)
- Status filter options:
  - **Structures**: Active, Fundraising, Closed
  - **Investments**: Active, Pending, Closed, Exited
  - **Investors**: Active, Pending, KYC/KYB, Contracts, Payments, Inactive

## Important Business Rules

1. **Capacity Validation**: Check both investment AND issuance capacity
2. **Issuance Counting**: Mixed = 2, Equity = 1, Debt = 1
3. **Edit Mode**: Account for current item when checking limits
4. **Data Merging**: Merge static JSON + localStorage for accurate counts
5. **Hierarchy Ownership**: `ownershipOfParent` field required for child structures
6. **Two-Stage Operations**: L2 gets paid/called first, L1 receives remainder
7. **Master-Only Aggregation**: Summary metrics (Total Capital, Total Investors, Planned Investments) aggregate ONLY from master structures (hierarchyLevel 1 or no parent), not child structures, to avoid duplication

## Support & References

- Project README: `/README.md`
- Claude Instructions: `/CLAUDE.md`
- TypeScript Types: `/src/lib/types.ts`
- Component Docs: Individual documentation files in `/docs`

---

## Platform Access

### Investment Manager
- **Route**: `/investment-manager/*`
- **Sign In**: `/sign-in` (form-based authentication)
- **Users**: GP partners, fund administrators
- **Access**: Full admin access to all structures, investors, and operations

### LP Portal
- **Route**: `/lp-portal/*`
- **Sign In**: `/lp-portal/sign-in` (email-based lookup)
- **Users**: Limited Partners (LPs), individual investors
- **Access**: Filtered to investor's own portfolio data only

## Data Integration

Both Investment Manager and LP Portal share the same underlying data layer (localStorage), ensuring real-time synchronization:

- **Investment Manager creates structure** → LP Portal sees it instantly (if onboarded)
- **Investment Manager updates NAV** → LP Portal current value updates instantly
- **Investment Manager creates capital call** → LP Portal shows pending call instantly
- **Investment Manager processes distribution** → LP Portal metrics update instantly
- **LP Portal completes onboarding** → Investment Manager sees status change instantly

For detailed integration information, see [Investment Manager ↔ LP Portal Integration](./investment-manager-lp-portal-integration.md).

---

**Last Updated**: 2025-11-01
**Version**: 1.1.0
