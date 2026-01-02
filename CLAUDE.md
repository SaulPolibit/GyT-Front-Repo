# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Git & Version Control Policy

**IMPORTANT - Commit Behavior:**
- **NEVER create git commits automatically** unless the user explicitly requests it
- **NEVER push to remote** unless the user explicitly asks for it
- Only make code changes and leave git operations to the user
- If the user wants commits, they will explicitly say "create a commit" or "commit these changes"
- Focus on code changes only - the user manages version control

## Project Overview

Polibit: Next.js investment management platform for real estate, private equity, and private debt. Dual-purpose: marketing website + comprehensive fund administration platform.

## Tech Stack

- **Framework**: Next.js 15.5.4 (App Router), TypeScript
- **UI**: shadcn/ui, Tailwind CSS, OKLCH color space
- **Data**: TanStack Table, Recharts, localStorage (demo)
- **Key Libraries**: Zod, Sonner, dnd-kit, Playwright

## Key Technical Rules

**Next.js 15 Compatibility:**
- Dynamic params must be awaited: `const { slug } = await params;`
- Params type: `Promise<{ slug: string }>`

**Component Pattern:**
- Server components by default
- Client components only when needed (interactive features)
- Use shadcn/ui components consistently

**Color System (OKLCH):**
- Primary: `oklch(0.2521 0.1319 280.76)` - Dark purple/violet
- All colors in `src/app/globals.css`

## Content Guidelines

**Platform Messaging:**
"Streamline real estate, equity and debt investments with digital workflows that reduce costs, improve transparency, and scale across global markets."

**Critical Terminology:**
- Use "compliance validation" NOT "compliance as a service"
- "Private Secondary Market (peer-to-peer trading)"
- "Third-party position collateralization"

**Platform Metrics:**
- $5M+ AUM, 3 Live Countries, 500+ Active Investors
- 98% Client Satisfaction, 300+ Watchlists (KYC/AML)

## Website Structure

**Marketing Pages:**
- Homepage, About, Pricing (4 tiers: $1.25K-$5K+/month)
- Blog (15 posts, category filtering, `/blog/[slug]`)
- Feature pages (fundraising, investor portal, fund admin, reporting)
- Vertical pages (real estate, PE, private debt)
- Customer Success Stories (Mexico, Guatemala, Panama - real data only)

**Authentication:**
- `/sign-in`, `/sign-up` - Form validation, redirects to `/investment-manager`
- Uses Field components: `FieldLabel`, `FieldDescription`, `FieldGroup`

## Investment Manager Platform

Comprehensive fund administration dashboard at `/investment-manager/*`

### Core Features

**1. Structure Management** (`/structures`, `/onboarding`)
- 7-step onboarding wizard for fund creation
- Types: Fund, SA/LLC, Fideicomiso/Trust, Private Debt
- Capacity tracking: investments & issuances
- Token economics generation

**Key Rules:**
- Mixed investments = 2 issuances, Equity/Debt = 1
- Edit mode must account for current item in capacity checks
- Merge static JSON + localStorage for accurate counts

**2. Investment Management** (`/investments`)
- Full CRUD: add, edit, delete, view
- Types: EQUITY, DEBT, MIXED
- Jurisdiction-aware geography parsing:
  - US: "City, State, Country" (3 parts)
  - Non-US: "City, Country" (2 parts)
- **Critical**: Ownership calculated from equity position ONLY

**Investment Data Structure:**
```typescript
interface Investment {
  id: string
  fundId: string
  type: 'Real Estate' | 'Private Equity' | 'Private Debt'
  investmentType: 'EQUITY' | 'DEBT' | 'MIXED'
  totalInvestmentSize: number
  fundCommitment: number
  ownershipPercentage: number  // equity only!
  geography: { city, state, country }
  fundEquityPosition: { ... } | null
  fundDebtPosition: { ... } | null
  totalFundPosition: { irr, multiple, unrealizedGain }
}
```

**3. Investor Management** (`/investors`)
- LP relationship tracking
- Multi-structure allocations
- Contact info, documents, transactions

**4. Reports System** (`/reports`)
- Quarterly Reports (PDF, Excel, CSV)
- K-1 Tax Forms (IRS Schedule K-1 Form 1065)
- Custom Report Builder

**Report Libraries:**
```
src/lib/
├── report-calculations.ts     # NAV, IRR, MOIC
├── pdf-generator.ts          # jsPDF
├── excel-generator.ts        # xlsx
├── csv-generator.ts
├── k1-generator.ts
└── k1-calculations.ts
```

**5. Waterfall Calculator** (`/waterfalls`)
- American, European, Hybrid waterfalls
- 4-tier structure: Return of Capital → Preferred Return → GP Catch-Up → Carry

### Data Architecture

**Storage (localStorage):**
```
src/lib/
├── structures-storage.ts     # Fund/SPV/Trust CRUD
├── investments-storage.ts    # Portfolio management
├── investors-storage.ts      # LP relationships
└── firm-settings-storage.ts
```

**Calculation Libraries:**
```
src/lib/
├── nav-calculations.ts
├── investment-calculations.ts
├── waterfall-calculations.ts
└── report-calculations.ts
```

**Standard CRUD Pattern:**
```typescript
getItems(): Item[]
saveItem(item: Omit<Item, 'id'>): Item
updateItem(id: string, updates: Partial<Item>): Item | null
deleteItem(id: string): boolean
getItemById(id: string): Item | null
```

### Dashboard Components

**Layout:**
- AppSidebar: Collapsible, offcanvas mode
- SidebarProvider with CSS variables
- Recharts for interactive charts
- TanStack Table for data tables

**Data Visualization:**
```tsx
<SidebarProvider
  style={{
    "--sidebar-width": "12rem",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties}
>
  <AppSidebar variant="inset" />
  <SidebarInset>
    {/* Content */}
  </SidebarInset>
</SidebarProvider>
```

## Development Workflows

**Adding Pages:**
1. Server components by default
2. Import shadcn/ui from `@/components/ui/`
3. Maintain purple color scheme
4. Mobile responsive

**Adding Blog Posts:**
1. Update `blogPosts` in `/blog/page.tsx`
2. Add content to `blogPostsData` in `/blog/[slug]/page.tsx`
3. Include Key Takeaways sections, CTA boxes
4. Real data only - no fictional case studies

**Adding Investment Manager Features:**
1. Check jurisdiction for geography parsing (US vs non-US)
2. Ownership from equity position ONLY
3. Validate both investment AND issuance capacity
4. Account for current item in edit mode
5. Merge static + localStorage data

**Sales Deck Generation:**
```bash
npm run generate-pdf   # → polibit-sales-deck.pdf
npm run generate-pptx  # → polibit-sales-deck.pptx
```

## Critical Investment Manager Rules

1. **Geography Parsing**: Check structure jurisdiction
   - US: "City, State, Country"
   - Non-US: "City, Country"

2. **Ownership Calculation**: Equity position only, never total fund commitment

3. **Capacity Validation**: Check investment AND issuance capacity

4. **Issuance Counting**: Mixed = 2, Equity = 1, Debt = 1

5. **Edit Mode**: Account for current item when checking limits

6. **Data Merging**: Merge static JSON + localStorage for accurate counts

## Common Patterns

**Feature Card:**
```tsx
<Card className="hover:shadow-xl transition-shadow">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>
```

**CTA Section:**
```tsx
<section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
  <div className="container mx-auto px-4 text-center">
    <h2 className="text-4xl font-bold mb-4">Title</h2>
    <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">Description</p>
    <Button size="lg" variant="secondary" asChild>
      <a href="/link">CTA Text</a>
    </Button>
  </div>
</section>
```

**Form with Field Components:**
```tsx
<Card>
  <CardContent>
    <form action="/destination">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" required />
        </Field>
        <Button type="submit">Submit</Button>
      </FieldGroup>
    </form>
  </CardContent>
</Card>
```

## Testing Checklist

**Marketing:**
- Navigation links, mobile responsiveness
- Purple color consistency
- Blog category filtering
- Compliance language ("compliance validation")
- "Coming Soon" features at bottom

**Investment Manager:**
- Capacity validation (investments & issuances)
- Geography parsing (US vs non-US)
- Ownership from equity only
- Mixed = 2 issuances
- Edit mode capacity checks
- Static + localStorage data merged
- CRUD operations work

## Future Enhancements

**Backend Migration:**
- Move from localStorage to database
- Real authentication (OAuth, sessions, password reset)
- API routes for form submissions

**Testing:**
- Unit tests, integration tests, E2E tests

**Performance:**
- Analytics, lazy loading, code splitting
- Next.js Image optimization

---

**Note**: Next.js 15 App Router - always use async components for dynamic routes and await params.
