# Polibit Investment Platform

> Modern investment management platform for real estate, private equity, and private debt funds. Built with Next.js 15, TypeScript, and shadcn/ui.


## 🚀 Overview

Polibit is an institutional-grade investment management platform that streamlines real estate, equity, and debt investments with digital workflows. The platform reduces costs, improves transparency, and scales across global markets.

**Key Value Proposition:**
- Multi-asset support (real estate, private equity, private debt)
- Cross-border payment optimization (90% savings with stablecoins)
- Automated fund administration and compliance validation
- White-label investor portals with real-time reporting

## 📊 Platform Metrics

- **$5M+** Assets Under Management
- **3** Live Countries
- **500+** Active Investors
- **98%** Client Satisfaction
- **300+** International Watchlists (KYC/AML)

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.4 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (Radix UI primitives)
- **Deployment:** Vercel-ready

## 🎨 Design System

### Color Palette (Polibit Brand)

```css
Primary Purple:   #6366F1  /* Logo, CTAs, primary elements */
Medium Purple:    #8B5CF6  /* Gradients, hover states */
Light Purple:     #E8E5F5  /* Backgrounds, cards */
Success Green:    #10B981  /* Success states */
Neutral Grays:    #F9FAFB, #6B7280, #374151
```

### UI Components

All components use shadcn/ui for consistency and accessibility:
- Button, Card, Badge, DropdownMenu
- Responsive grid layouts
- Mobile-first design
- Purple-themed focus states

## 📁 Project Structure

```
src/app/
├── page.tsx                                    # Homepage
├── about-us/page.tsx                          # About page
├── pricing/page.tsx                           # Pricing tiers ($1,250 - Custom)
├── blog/
│   ├── page.tsx                               # Blog listing (with filtering)
│   └── [slug]/page.tsx                        # Individual blog posts (15 posts)
├── investment-platform/page.tsx               # Platform overview
├── fundraising-and-capital-raising/page.tsx   # Fundraising features
├── investor-portal/page.tsx                   # Investor portal features
├── fund-administration-and-operations/page.tsx # Fund admin features
├── investment-reporting-and-analytics/page.tsx # Reporting & analytics
├── real-estate-investment-platform/page.tsx   # Real estate vertical
├── private-equity-investment-platform/page.tsx # Private equity vertical
├── private-debt-investment-platform/page.tsx  # Private debt vertical
└── free-demo/page.tsx                         # Demo request page

components/ui/                                  # shadcn/ui components
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Key Features

### Platform Features

1. **Digital Subscriptions & Onboarding**
   - E-commerce-style investment checkout
   - KYC/AML verification (300+ watchlists)
   - Automated investor onboarding

2. **Fund Administration**
   - Automated waterfall calculations
   - Multi-tier return structures
   - Tax reporting and compliance validation

3. **Cross-Border Payments**
   - Multi-rail payment processing (ACH, cards, stablecoins)
   - 90% savings on international transfers
   - Multi-currency operations

4. **Investor Portal**
   - White-label branded portals
   - Real-time performance dashboards
   - Mobile-optimized access

5. **Compliance & Reporting**
   - Multi-jurisdiction compliance validation
   - Automated tax document generation
   - Real-time analytics and reporting

### Asset Class Support

**Real Estate:**
- Property acquisition & syndication
- Investor relations & reporting
- Property & financial management

**Private Equity:**
- Fund formation & fundraising
- Capital call management
- Portfolio company oversight

**Private Debt:**
- Loan origination & underwriting
- Portfolio monitoring & surveillance
- Risk management & analytics

## 📊 Pricing Tiers

| Tier | Price | AUM | Investors | Emissions |
|------|-------|-----|-----------|-----------|
| **Starter** | $1,250/mo | Up to $10M | Up to 50 | Up to 5 |
| **Growth** | $2,500/mo | Up to $50M | Up to 100 | Up to 10 |
| **Enterprise** | $5,000/mo | Up to $100M | Up to 200 | Up to 20 |
| **Custom** | Contact Sales | $100M+ | Custom | Custom |

**Setup Fees:** $5,000 (first emission), $3,000 (additional emissions)

## 📚 Blog System

### Blog Categories

- Fundraising
- Cross-Border Payments
- Compliance & Regulation
- Platform Features
- Industry Insights
- Fund Administration

### Current Blog Posts (15 total)

1. Fund Administration Automation (8 min)
2. Real Asset Tokenization (10 min)
3. LP Real-Time Portfolio Access (7 min)
4. Global Investor Compliance (9 min)
5. Real-Time Analytics for PE (8 min)
6. Evergreen vs Closed-End Funds (9 min)
7. Emerging Manager Infrastructure (8 min)
8. Digital Subscription Management (8 min)
9. Capital Call Crisis (9 min)
10. Waterfall Calculation Errors (10 min)
11. Multi-Currency Fund Management (9 min)
12. Investor Portal Revolution (9 min)
13. Fund Formation on Budget (9 min)
14. NAV Calculation Accuracy (10 min)
15. Digital Signatures Legal Enforceability (10 min)

### Interactive Features

- **Category Filtering:** Client-side filtering with React state
- **Featured Posts:** Highlighted articles section
- **Recent Posts:** Dynamic display based on category
- **Empty States:** Handled for categories with no posts

## 🔧 Technical Details

### Next.js 15 Compatibility

**Important:** Next.js 15 requires async handling of dynamic params:

```typescript
// ✅ Correct
export default async function BlogPost({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const post = blogPostsData[slug];
  // ...
}

// ❌ Incorrect (causes errors)
export default function BlogPost({
  params
}: {
  params: { slug: string }
}) {
  const post = blogPostsData[params.slug]; // Error!
}
```

### Component Patterns

**Server Components (Default):**
- Better performance
- Direct data fetching
- No client-side JavaScript needed

**Client Components (When Needed):**
- Interactive features (blog filtering)
- State management
- Browser APIs

### Adding New Components

```bash
# Add shadcn/ui component
npx shadcn@latest add [component-name]

# Examples:
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add form
```

### Writing Blog Posts

**Template Structure:**
```typescript
{
  id: number,
  slug: "kebab-case-title",
  title: "Post Title",
  category: "Category Name",
  date: "Month DD, YYYY",
  readTime: "X min read",
  author: "Polibit Team",
  excerpt: "Brief summary...",
  content: `
    <p className="text-xl text-muted-foreground mb-8">
      Opening paragraph...
    </p>

    <h2 className="text-3xl font-bold mt-12 mb-6">Section Title</h2>

    <div class="bg-primary/5 border-l-4 border-primary p-6 my-8">
      <h3 class="text-xl font-bold mb-4">Key Takeaways</h3>
      <ul class="space-y-2">
        <li class="flex items-start">
          <span class="text-primary mr-2">•</span>
          <span>Takeaway point...</span>
        </li>
      </ul>
    </div>

    <div class="cta-box">
      <p>CTA text with <a href="/page">link</a></p>
    </div>
  `
}
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

```bash
# Build for production
npm run build

# Start production server
npm start
```

The project works on any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean
- AWS Amplify

## 🧪 Quality Checklist

### Before Deploying

- [ ] Test all navigation links
- [ ] Verify mobile responsiveness
- [ ] Check purple color consistency
- [ ] Test blog category filtering
- [ ] Validate all blog post slugs
- [ ] Test dynamic routes (blog posts)

### Content Validation

- [ ] Use consistent metrics ($5M+ AUM, 500+ investors)
- [ ] Proper feature naming across pages

## 🔮 Upcoming Features

### Coming Soon
- Private Secondary Market (peer-to-peer trading)
- Third-party position collateralization
- Enhanced multi-currency support
- Additional payment rails

### Technical Roadmap
- Move blog posts to CMS (currently in code)
- Add TypeScript interfaces for better type safety
- Implement API routes for form submissions
- Add analytics tracking
- Performance optimizations

## 📖 Documentation

- **CLAUDE.md** - Detailed technical documentation for AI assistance
- **README.md** - This file
- **Blog Content** - Located in `/src/app/blog/[slug]/page.tsx`

## 🤝 Contributing

When adding new features:

1. Follow existing component patterns
2. Use shadcn/ui for new components
3. Maintain purple color scheme
4. Ensure mobile responsiveness
5. Update documentation

### Adding New Pages

1. Create in appropriate `src/app/` directory
2. Use server components by default
3. Import UI components from `@/components/ui/`
4. Follow existing header/footer pattern
5. Maintain brand consistency

### Adding New Blog Posts

1. Add entry to `blogPosts` array in `/blog/page.tsx`
2. Add content to `blogPostsData` in `/blog/[slug]/page.tsx`
3. Use consistent formatting (Key Takeaways, CTA)
4. Follow content guidelines
5. Assign proper category

## 📄 License

All rights reserved. Polibit © 2025

## 🔗 Links

- **Website:** [polibit.io]
- **Documentation:** See CLAUDE.md
- **Support:** [Contact for Demo](mailto:gabriela@polibit.io)

---

**Built with ❤️ using Next.js, TypeScript, and shadcn/ui**
