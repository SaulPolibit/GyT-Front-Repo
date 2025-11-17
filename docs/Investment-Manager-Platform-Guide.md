# Polibit Investment Manager Platform
## Complete User Manual

**Document Version:** 2.0
**Last Updated:** November 2025
**For:** Fund Managers, LPs, and Platform Administrators

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Structures Management](#structures-management)
5. [Investments](#investments)
6. [Investors](#investors)
7. [Reports](#reports)
8. [Performance Analytics](#performance-analytics)
9. [Documents](#documents)
10. [Chat](#chat)
11. [Capital Operations](#capital-operations)
12. [Capital Management](#capital-management)
13. [Settings](#settings)
14. [Appendix](#appendix)

---

## Introduction

### What is Polibit Investment Manager?

Polibit Investment Manager is a comprehensive fund administration platform designed for real estate, private equity, and private debt investment managers. The platform streamlines fund operations, investor relations, and performance reporting.

### Key Features

- **Fund Structure Management**: Create and manage funds, SPVs, trusts, and multi-level hierarchies
- **Investor Relations**: Track LP commitments, allocations, and communications
- **Portfolio Tracking**: Monitor investments with real-time performance metrics
- **Cap Tables**: View ownership tables showing investor allocations across structures
- **Automated Reporting**: Generate quarterly, annual, and custom reports
- **Capital Operations**: Manage capital calls and distributions with waterfall calculations
- **Performance Analytics**: Calculate IRR, MOIC, DPI, RVPI, and TVPI automatically

### Who Should Use This Manual?

- **General Partners (GPs)**: Fund managers operating the platform
- **Fund Administrators**: Staff handling day-to-day operations
- **Limited Partners (LPs)**: Investors accessing the LP portal (separate guide available)

---

## Getting Started

### Logging In

1. Navigate to your dedicated platform URL: `[yourfund].polibit.io`
2. Enter your email address and password
3. Click **"Sign In"**
4. You will be redirected to the Dashboard

**[IMAGE PLACEHOLDER 1: Login Screen]**

### First-Time Setup

After logging in for the first time:

1. Complete your firm profile (Settings > Firm Settings)
2. Upload your firm logo
3. Set default economic terms for your funds
4. Add team members (Settings > Users)

### Navigation Overview

The platform uses a persistent left sidebar for navigation:

**Main Sections:**
- Dashboard
- Structures
- Investments
- Investors
- Reports
- Performance
- Documents
- Chat

**Management:**
- Capital (Commitments, Activity)

**Operations:**
- Capital Calls
- Distributions

**[IMAGE PLACEHOLDER 2: Navigation Sidebar]**

---

## Dashboard

### Overview

The Dashboard provides a fully customizable, real-time snapshot of your fund's performance, portfolio, and capital activity. You can add charts, metrics, and tables from preset templates or build custom visualizations.

**Location:** Click **Dashboard** in the left sidebar or navigate to `/investment-manager`

**[IMAGE PLACEHOLDER 3: Dashboard Overview]**

---

### Default Dashboard Layout

**Top Metrics (4 Cards):**

1. **Total Investment Value**
   - Current portfolio value across all investments
   - Shows growth percentage vs. previous period
   - Example: $15,000,000 (+0.0%)

2. **Unrealized Gains**
   - Unrealized portfolio gains across all investments
   - Percentage change indicator
   - Example: $12,500 (+1.7%)

3. **Total Distributions**
   - Lifetime total cash flow distributed to investors
   - Example: $100,000 (Lifetime)

4. **YTD Performance**
   - Year-to-date return percentage
   - Example: +1.1% (Year-to-date return)

**Main Charts:**

**Portfolio Performance (Large Area Chart):**
- Tracks Net Asset Value trend over time (monthly)
- Shows two data series:
  - Total Value (blue filled area)
  - Unrealized Gain (light blue line at bottom)
- X-axis: Jan through Dec
- Y-axis: Dollar values ($0 to $1.6M scale)
- Hover for exact values at any point in time

**Capital Calls Timeline (Large Bar Chart):**
- Visualizes historical and projected capital calls
- Two bar types:
  - Called (blue bars): Capital already called
  - Uncalled (gray bars): Projected future calls
- X-axis: Jan through Dec
- Y-axis: Dollar amounts ($0 to $6.0M scale)
- Helps plan future capital requirements

**IRR Comparison (Bottom Chart):**
- Internal Rate of Return by investment
- Bar chart comparing performance across portfolio
- Identifies top performers and underperformers

---

### Filtering Dashboard Data

**Structure Filter (Top Left):**
- Dropdown: "Filter by Structure"
- Options:
  - All Structures (default)
  - Individual fund/structure names
- When you select a specific structure, all metrics and charts update to show only that fund's data

---

### Adding Graphs and Metrics

**Add a Graph Button (Top Right):**

Click the **"+ Add a Graph"** button to open the customization modal.

**[IMAGE PLACEHOLDER 3a: Add a Graph Modal]**

---

### Graph Customization Options

The "Add a Graph" modal has three tabs:

#### **Tab 1: Templates**

**Pre-built chart templates** organized by category:

**Category Tabs:**
- **All Templates** (12 templates)
- **Performance** (4 templates)
- **Financial** (1 template)
- **Portfolio** (5 templates)
- **Operations** (2 templates)

**Available Template Cards:**

1. **Portfolio Performance** (Area chart)
   - Track your portfolio value over time

2. **Capital Calls Timeline** (Bar chart)
   - Visualize capital call history and projections

3. **Investment Distribution** (Pie chart)
   - View breakdown of investments by asset class

4. **IRR Comparison** (Bar chart)
   - Compare IRR across investments

5. **Distribution History** (Line chart)
   - Track distributions to investors over time

6. **Top Investments** (Bar chart)
   - View your highest performing investments

7. **Asset Allocation** (Donut chart)
   - Donut chart of asset allocation

8. **Performance Metrics** (Line chart)
   - Key performance indicators dashboard

9. **Holdings by Value** (Table)
   - Detailed table of all portfolio holdings

10. **Active Investments** (Table)
    - Table of currently active investments

11. **Performance Comparison** (Radar chart)
    - Radar chart comparing performance metrics

12. **Goal Progress** (Radial chart)
    - Track progress toward investment goals

**How to Use Templates:**
1. Select category tab or browse "All Templates"
2. Click on any template card
3. Template is instantly added to your dashboard

**Filters for Templates:**
- **Structure:** Filter template data by specific fund (All Structures default)
- **Chart Size:** Large, Medium, or Small

---

#### **Tab 2: Metrics**

**Individual metric cards** to add key statistics to your dashboard:

**Category Tabs:**
- **All Metrics** (33 metrics)
- **Portfolio** (4 metrics)
- **Capital** (4 metrics)
- **Performance** (3 metrics)
- **Investors** (1 metric)
- **Comparison** (1 metric)

**Available Metric Cards:**

**Portfolio Metrics:**
1. **Total Investment Value**: $15,000,000 (+0.0%)
   - Current portfolio value

2. **Total Invested Capital**: $15,000,000 (Initial)
   - Original investment amount

3. **Unrealized Gains**: $12,500 (+1.7%)
   - Unrealized portfolio gains

4. **Total Distributions**: $100,000 (Lifetime)
   - Total cash flow distributed

**Performance Metrics:**
5. **Average IRR**: +0.0% (Portfolio)
   - Across 1 investments

6. **YTD Performance**: Percentage return year-to-date

**Capital Metrics:**
7. **Total Commitment**: $48,550,000
   - Total commitment across all structures

8. **Total Called Capital**: $750,000 (2%)
   - Of total commitment

9. **Total Investors**: 12
   - Active investors

10. **Active Structures**: 15
    - Active structures

**How to Use Metrics:**
1. Select category tab or browse "All Metrics"
2. Click on any metric card
3. Metric card is added to your dashboard
4. Choose card size: Small, Medium, or Large

**Each metric card shows:**
- Main value (large number)
- Percentage change or category badge
- Description label
- Icon indicator

---

#### **Tab 3: Custom Chart**

**Build completely custom charts** from scratch:

**Configuration Options:**

**1. Chart Title** (Text input)
- Enter custom name for your chart
- Example: "Portfolio Performance"

**2. Description** (Optional text input)
- Add subtitle or explanation
- Example: "Track performance over time"

**3. Filter by Structure** (Dropdown)
- All Structures (default)
- Or select specific fund

**4. Chart Type** (Dropdown options)
- **Line Chart** - Show trends over time
- **Bar Chart** - Compare values
- **Area Chart** - Filled trend visualization
- **Pie Chart** - Proportional breakdown
- **Donut Chart** - Ring-style proportions
- **Table** - Detailed data table
- **Radar Chart** - Multi-dimensional comparison
- **Radial Chart** - Circular progress

**5. Data Source** (Dropdown)
- **Net Asset Value** - Portfolio NAV over time
- **Capital Calls** - Call history
- **Distributions** - Distribution data
- **IRR by Investment** - Performance comparison
- **Asset Allocation** - Portfolio composition
- Other data sources...

**6. Chart Size** (Dropdown)
- **Large (Full Width)** - Takes full dashboard width
- **Medium (Half Width)** - Takes 50% width
- **Small (Quarter Width)** - Takes 25% width

**7. Metrics** (Checkboxes)
Select which data series to display on the chart:
- ☐ Total Value
- ☐ Unrealized Gain
- ☐ NAV per Share
- Additional metric options based on data source

**Preview Panel:**
- Right side of modal
- Shows real-time preview as you configure
- "Select metrics to see preview" when no metrics chosen

**Buttons:**
- **Cancel** - Close without adding
- **Add Chart** - Add custom chart to dashboard

---

### How to Use the Dashboard

**Daily Workflow:**
1. Check top 4 metric cards for key performance indicators
2. Review Portfolio Performance chart for NAV trends
3. Check Capital Calls Timeline for upcoming capital needs
4. Examine IRR Comparison to identify top/bottom performers
5. Add custom charts or metrics as needed for deeper analysis

**Customization Tips:**
- Add multiple charts to create comprehensive views
- Use Structure filter to focus on specific funds
- Combine metric cards with charts for context
- Save frequently-used custom charts as templates
- Resize charts to fit your preferred layout
- Drag and drop to reorder dashboard elements

**Best Practices:**
- Start with default dashboard, add charts as needed
- Use Templates for quick standard visualizations
- Use Metrics for at-a-glance key statistics
- Use Custom Charts for specific analysis needs
- Filter by structure when managing multiple funds
- Review dashboard daily for portfolio health checks

---

## Structures Management

### What Are Structures?

Structures are the investment vehicles you manage:
- **Funds**: Traditional limited partnerships
- **SA/LLCs**: Special purpose vehicles
- **Trusts (Fideicomisos)**: Trust structures
- **Private Debt Vehicles**: Lending funds

**Location:** Click **Structures** in the left sidebar

**[IMAGE PLACEHOLDER 4: Structures List Page]**

---

### Creating a New Structure

**Step 1: Start the Creation Process**
1. Navigate to **Structures**
2. Click **"Create Structure"** button
3. Select structure type:
   - Fund
   - SA / LLC
   - Fideicomiso / Trust
   - Private Debt

**Step 2: Basic Information**
- **Structure Name**: E.g., "Polibit Real Estate Fund I"
- **Jurisdiction**: Select country (US, Mexico, etc.)
- **US State**: If US jurisdiction, select state
- **Inception Date**: When the fund started
- **Current Stage**: Fundraising, Active, Closed

**Step 3: Capital Structure**
- **Total Commitment**: Total fund size (e.g., $50,000,000)
- **Number of Investors**: Target investor count
- **Min Check Size**: Minimum investment amount
- **Max Check Size**: Maximum investment amount
- **Currency**: USD, MXN, etc.

**Step 4: Fund Details** (For funds only)
- **Fund Type**: Closed-end, Open-end, Evergreen
- **Fund Term**: Duration in years (e.g., 10 years)

**Step 5: Economic Terms**
- **Management Fee**: Annual fee % (e.g., 2%)
- **Performance Fee**: Carried interest % (e.g., 20%)
- **Hurdle Rate**: Preferred return threshold % (e.g., 8%)
- **Preferred Return**: % return to LPs before carry (e.g., 8%)
- **Waterfall Structure**: American, European, or Hybrid

**Step 6: Investment Strategy**
- **Planned Investments**: Number of target investments
- **Financing Strategy**: Equity, Debt, or Mixed

**Step 7: Multi-Level Setup** (Optional)
- **Number of Levels**: 1, 2, or 3
- **Level Names**: Master Fund, Investor Fund, Project Fund
- **Income Flow Configuration**: Define how profits flow between levels

**[IMAGE PLACEHOLDER 5: Structure Creation Wizard]**

**Step 8: Review & Create**
- Review all entered information
- Click **"Create Structure"**
- Structure is now created and appears in your list

---

### Viewing Structure Details

Click on any structure name to view complete details:

**Structure Detail Page Shows:**

**1. Header Section**
- Structure name
- Status badge (Fundraising, Active, Closed)
- Hierarchy level (for multi-level structures)
- Edit and Delete buttons

**2. Key Metrics**
- Total Commitment
- Number of Investors
- Inception Date
- Current Stage

**3. Level Configuration** (For multi-level structures)
- Waterfall calculation status (Enabled/Disabled)
- Economic terms application
- Income flow target
- Position in hierarchy

**4. Basic Information Card**
- Structure type
- Subtype
- Jurisdiction
- US State (if applicable)
- Created date
- Inception date

**5. Capital Structure Card**
- Total commitment
- Number of investors
- Min/Max check sizes
- Planned investments
- Financing strategy

**6. Economic Terms Card**
- Management fee
- Performance fee
- Hurdle rate
- Preferred return
- Waterfall structure

**7. Cap Table** ⭐
Shows all investors allocated to this structure with:
- Investor name and type
- Commitment amount
- Called capital (from actual capital call transactions)
- Uncalled capital
- Called percentage
- **Ownership percentage** (calculated as: Called Capital / Total Fund Size × 100)
- Economic terms (structure defaults or custom investor terms)
- Custom terms indicator badge
- Clickable rows to view investor details

**How Ownership is Calculated:**
- Based on **actual capital called**, not commitments
- Updates automatically after each capital call
- Example: If investor has $1M called and fund total is $10M called → 10% ownership

**Custom Terms:**
- Yellow badge shows when investor has negotiated custom economic terms
- Shows side-by-side comparison of structure defaults vs. investor-specific terms
- Applies to: management fee, performance fee, hurdle rate, preferred return

**[IMAGE PLACEHOLDER 6: Structure Detail Page with Cap Table]**

**8. Pre-Registered Investors**
- Investors who have been added but not yet onboarded
- Can be imported from CSV
- Shows commitment amounts and email addresses
- Custom economic terms preserved from CSV import

**9. Investments** (If any)
- Portfolio investments tied to this structure
- Shows investment name, type, sector, geography
- Fund commitment and current value per investment

**10. Documents**
- Fund documents (PPMs, LPAs, amendments)
- Investor documents (subscription agreements)
- Upload and download capabilities

---

### Multi-Level Structures

For complex fund structures with multiple tiers:

**Example: Master-Feeder Structure**
- **Level 1 (Master)**: Polibit Energy Fund I
  - Total fund at the top level
  - No direct investments
- **Level 2 (Intermediate)**: Investor Fund
  - Where LPs invest
  - Income flows up to Master
- **Level 3 (Property)**: Project Fund
  - Holds actual investments
  - Income flows up to Level 2

**How to Navigate:**
1. Click on the **Master Structure** (Level 1)
2. View list of child structures in the hierarchy section
3. Click on any **child structure name** to view its details
4. Each level has its own Cap Table showing investors at that level

**Income Flow Configuration:**
- Define at structure creation
- Determines how distributions flow between levels
- Can apply waterfall calculations at each level or only at top level

**[IMAGE PLACEHOLDER 7: Multi-Level Structure Hierarchy]**

---

### Editing a Structure

1. Navigate to the structure detail page
2. Click **"Edit"** button in the top right
3. Modify any fields (same wizard as creation)
4. Click **"Save Changes"**

**Note:** Some fields cannot be changed after investments or capital calls have been made.

---

### Deleting a Structure

1. Navigate to the structure detail page
2. Click **"Delete"** button
3. Confirm deletion (cannot be undone)

**Warning:** Deleting a structure will also delete:
- All associated investor allocations
- Pre-registered investors
- Uploaded documents

---

## Investments

### What Are Investments?

Investments are the portfolio assets your fund acquires:
- Real estate properties
- Private equity holdings
- Private debt positions
- Mixed equity/debt investments

**Location:** Click **Investments** in the left sidebar

**[IMAGE PLACEHOLDER 8: Investments Portfolio View]**

---

### Adding a New Investment

**Step 1: Start Creation**
1. Navigate to **Investments**
2. Click **"Add Investment"**

**Step 2: Basic Details**
- **Investment Name**: E.g., "Sunset Plaza Office Building"
- **Type**: Real Estate, Private Equity, Private Debt
- **Investment Type**: Equity, Debt, or Mixed
- **Sector**: Office, Multifamily, Technology, Healthcare, etc.
- **Status**: Active, Exited, Under Review

**Step 3: Geography**
- **City**: E.g., "Los Angeles"
- **State**: (US only) E.g., "California"
- **Country**: E.g., "United States"

**Jurisdiction-Aware Parsing:**
- **US investments**: "City, State, Country" (3 parts)
- **Non-US investments**: "City, Country" (2 parts)

**Step 4: Investment Structure**
- **Allocated Fund**: Select which structure owns this investment
- **Total Investment Size**: Overall deal size (e.g., $20M)
- **Fund Commitment**: Your fund's investment amount (e.g., $5M)
- **Acquisition Date**: When investment was made
- **Maturity Date**: (For debt) Expected repayment date

**Step 5: Positions**

**For Equity Investments:**
- **Equity Amount**: Investment amount
- **Ownership %**: Your fund's ownership stake
- **Entry Valuation**: Initial property/company value
- **Current Valuation**: Latest value

**For Debt Investments:**
- **Principal Amount**: Loan amount
- **Interest Rate**: Annual rate %
- **Payment Frequency**: Monthly, Quarterly, etc.
- **Maturity Date**: Loan end date

**For Mixed Investments:**
- Enter both equity AND debt positions
- System creates **2 issuances** for mixed structure

**Step 6: Performance Metrics** (Auto-calculated)
- **IRR**: Internal Rate of Return
- **MOIC**: Multiple on Invested Capital
- **Unrealized Gain/Loss**: Current value vs. invested capital

**[IMAGE PLACEHOLDER 9: Add Investment Form]**

**Step 7: Save**
- Click **"Create Investment"**
- Investment appears in portfolio list

---

### Viewing Investment Details

Click on any investment to view:

**Investment Detail Page Shows:**

**1. Header**
- Investment name
- Type and sector badges
- Status badge
- Geography display
- Edit and Delete buttons

**2. Overview Card**
- Total investment size
- Fund commitment
- Ownership percentage (for equity)
- Acquisition date
- Maturity date (for debt)

**3. Equity Position** (If applicable)
- Investment amount
- Ownership %
- Entry valuation
- Current valuation
- Unrealized gain/loss

**4. Debt Position** (If applicable)
- Principal amount
- Interest rate
- Payment frequency
- Maturity date
- Interest income earned

**5. Performance Metrics**
- **IRR**: Calculated from cash flows
- **MOIC**: Total value / invested capital
- **Cash-on-Cash Return**: Distributions / invested capital

**6. Cash Flows** (Timeline view)
- Initial investment (outflow)
- Interest payments (inflow)
- Distributions (inflow)
- Principal repayments (inflow)
- Current NAV (terminal value)

**7. Documents**
- Purchase agreements
- Appraisals
- Financial statements
- Property management reports

**[IMAGE PLACEHOLDER 10: Investment Detail Page]**

---

### Key Investment Rules

**Ownership Calculation:**
- For **Equity investments**: Based on equity position ONLY
- For **Debt investments**: No ownership percentage
- For **Mixed investments**: Ownership from equity portion only

**Capacity Validation:**
- System checks against fund's "Planned Investments" limit
- Mixed investments count as **2 investments** (1 equity + 1 debt)
- Edit mode accounts for current investment when checking capacity

**Example:**
- Fund has capacity for 5 investments
- Currently has 3 investments
- Adding a **Mixed investment** requires 2 slots (would result in 5 total) ✅
- Adding another standard investment after that would exceed capacity ❌

---

## Investors

### What Are Investors?

Investors (Limited Partners/LPs) are individuals or entities that commit capital to your funds.

**Location:** Click **Investors** in the left sidebar

**[IMAGE PLACEHOLDER 11: Investors Directory]**

---

### Adding a New Investor

**Step 1: Start Creation**
1. Navigate to **Investors**
2. Click **"Add Investor"**

**Step 2: Basic Information**
- **Investor Type**: Individual, Institution, Family Office, Fund of Funds
- **Name**: Full legal name
- **Email**: Primary contact email
- **Phone**: Contact number

**Step 3: Address**
- Street address
- City
- State
- Country
- Postal code

**Step 4: Tax Information**
- **Tax ID**: SSN (individuals) or EIN (entities)
- **K-1 Status**: Pending, In Progress, Delivered
- **K-1 Delivery Date**: When tax form was sent (if applicable)

**Step 5: Fund Allocations**

This is where you assign the investor to one or more structures:

**For Each Structure:**
- **Select Fund**: Choose from dropdown
- **Commitment Amount**: Total commitment (e.g., $500,000)
- **Called Capital**: Amount called so far (default: $0)
- **Uncalled Capital**: Remaining commitment (auto-calculated)
- **Hierarchy Level**: Which level of multi-tier structure (if applicable)
- **Invested Date**: When investor joined

**Custom Economic Terms (Optional):**
Check box to override structure defaults:
- Management Fee %
- Performance Fee %
- Hurdle Rate %
- Preferred Return %

**[IMAGE PLACEHOLDER 12: Add Investor Form with Fund Allocations]**

**Step 6: Investment Sophistication** (Compliance)
- Accredited Investor status
- Qualified Purchaser status
- KYC/AML status
- Investor classification

**Step 7: Save**
- Click **"Create Investor"**
- Investor appears in directory

---

### Viewing Investor Details

Click on any investor name to view complete profile:

**Investor Detail Page Shows:**

**1. Header**
- Investor name
- Type badge (Individual, Institution, etc.)
- Edit and Delete buttons

**2. Contact Information Card**
- Email
- Phone
- Full address

**3. Financial Summary Card** ⭐
- **Total Commitment**: Sum across all fund allocations
- **Total Called**: Capital called to date
- **Total Uncalled**: Remaining commitment
- **Current Value**: Latest NAV of positions
- **Unrealized Gain/Loss**: Current value vs. called capital
- **IRR**: Investor-level return (if calculable)

**4. Structure Allocations** ⭐

Shows all funds this investor participates in:

**For Each Structure:**
- Fund name (clickable to structure detail)
- Commitment amount
- Called capital
- Uncalled capital
- Called percentage
- **Ownership %**: Based on actual called capital
- Economic terms:
  - Structure defaults OR
  - Custom terms (if negotiated)
  - Visual badge showing "Custom Terms Applied"
- Hierarchy level
- Investment date

**Example:**
```
Polibit Real Estate Fund I                    0.63%

Commitment: $500,000
Called: $250,000  |  Uncalled: $250,000  |  Called %: 50.0%

Economic Terms:        [Custom Terms Applied]
Management Fee: 1.5%   |   Performance Fee: 25%
Hurdle Rate: 0%        |   Preferred Return: 9%

Level 0  |  Since October 16, 2025
```

**[IMAGE PLACEHOLDER 13: Investor Detail with Structure Allocations]**

**5. Transaction History**
- Capital calls received
- Distributions paid
- Management fees charged
- Performance fees charged

**6. Tax Information**
- Tax ID
- **K-1 Status**: Pending / In Progress / Delivered
- **K-1 Delivery Date**
- **Download K-1 Button**:
  - ✅ **Enabled** when status is "Delivered"
  - ⚫ **Disabled (gray)** when status is "Pending" or "In Progress"

**7. Documents**
- Subscription agreement
- KYC/AML forms
- Side letters (if applicable)
- Tax documents

**8. Notes**
- Internal notes about investor
- Communication log
- Follow-up reminders

---

### Investor vs. Structure Views

The platform provides **two complementary views**:

**Structure → Cap Table** (Structure-Centric)
- Navigate to: Structures > [Fund Name] > Cap Table
- Question: "Who are all the LPs in this fund?"
- Shows: All investors in one structure

**Investor → Structure Allocations** (Investor-Centric)
- Navigate to: Investors > [Investor Name] > Structure Allocations
- Question: "What funds does this LP participate in?"
- Shows: All structures one investor is in

Both views show the same data from different perspectives.

---

## Reports

### Overview

Generate professional reports for investor communications and internal analysis.

**Location:** Click **Reports** in the left sidebar

**[IMAGE PLACEHOLDER 14: Reports Library]**

---

### Available Report Types

**1. Quarterly Reports**
- Fund performance summary
- Portfolio breakdown
- NAV calculations
- Capital activity (calls and distributions)
- Performance metrics (IRR, MOIC, DPI, RVPI, TVPI)

**2. Annual Reports**
- Year-end fund performance
- Complete investment portfolio
- Full year capital activity
- Annual returns

**3. Monthly Reports**
- Regular performance updates
- Monthly NAV changes
- Recent transactions

**4. Capital Call Reports**
- Documentation for capital call requests
- Investor allocations
- Payment instructions
- Due dates

**5. Distribution Reports**
- Distribution notices
- Waterfall allocation breakdown
- Tax withholding information
- Payment details

**6. Custom Reports**
- Build your own reports using drag-and-drop interface
- Select components (performance, portfolio, cash flows, etc.)
- Save templates for reuse

---

### Generating a Quarterly Report

**Step 1: Navigate to Reports**
1. Click **Reports** in sidebar
2. View list of all previously generated reports

**Step 2: Filter and Search**
- Filter by report type (Quarterly, Annual, etc.)
- Filter by status (Published, Draft)
- Search by title

**Step 3: Generate New Report**
1. Click **"Generate Report"** or **"New Report"**
2. Select **Report Type**: Quarterly
3. Select **Reporting Period**: Q1 2025, Q2 2025, etc.
4. Select **Fund Structure**: Choose which fund
5. Click **"Generate"**

**Step 4: Review Output**
- System processes calculations (10-30 seconds)
- Preview report on screen
- Review for accuracy

**Step 5: Export or Distribute**
- **Export to PDF**: Investor-ready format
- **Export to Excel**: Detailed analysis with raw data
- **Export to CSV**: Data integration
- **Send to LP Portal**: Automatically publish for investors
- **Email Distribution**: Send to investor distribution list

**[IMAGE PLACEHOLDER 15: Report Generation Interface]**

---

### Report Contents

**Quarterly Report Includes:**

**Page 1: Executive Summary**
- Fund performance highlights
- Key metrics (NAV, IRR, MOIC)
- Quarter activity summary

**Page 2: Portfolio Overview**
- List of all investments
- Current valuations
- Unrealized gains/losses
- Geographic/sector breakdown

**Page 3: Capital Activity**
- Capital calls issued this quarter
- Distributions made this quarter
- Management fees charged
- Net capital deployed

**Page 4: Performance Metrics**
- IRR calculation with cash flow timeline
- MOIC breakdown (distributions + NAV / invested capital)
- DPI (distributions to paid-in capital)
- RVPI (residual value to paid-in capital)
- TVPI (total value to paid-in capital)

**Page 5: Individual Investor Summary**
- Commitment amount
- Called capital to date
- Distributions received
- Current NAV
- Personal IRR

**[IMAGE PLACEHOLDER 16: Sample Quarterly Report Pages]**

---

### Custom Report Builder

**How to Use:**

**Step 1: Start Builder**
1. Navigate to **Reports** > **Custom Report Builder**
2. Click **"Create Custom Report"**

**Step 2: Select Components**

Available widgets:
- Fund-level performance metrics
- Investment-by-investment detail table
- Cash flow statements
- Valuation tables by asset type
- Geographic breakdown chart
- Sector breakdown chart
- Time-series performance graphs
- Investor capital account statements

**Step 3: Configure Layout**
- Drag and drop components onto canvas
- Resize and reorder sections
- Set filters (date range, fund, asset type)

**Step 4: Save Template**
- Give template a name
- Save for future reuse
- Share with team members

**Step 5: Generate and Export**
- Click **"Generate Report"**
- Export to PDF, Excel, or CSV

**[IMAGE PLACEHOLDER 17: Custom Report Builder Interface]**

---

## Performance Analytics

### Overview

Real-time performance analysis with industry-standard metrics.

**Location:** Click **Performance** in the left sidebar

**[IMAGE PLACEHOLDER 18: Performance Analytics Dashboard]**

---

### Key Performance Metrics

### 1. IRR (Internal Rate of Return)

**What it is:**
The annualized rate of return that makes the net present value (NPV) of all cash flows equal to zero. Accounts for the timing of cash flows.

**How Polibit Calculates It:**
1. Aggregates all capital calls (negative cash flows)
2. Aggregates all distributions (positive cash flows)
3. Includes current NAV as terminal cash flow
4. Uses XIRR formula for irregular cash flow timing

**Formula:**
```
Σ [Cash Flow / (1 + IRR)^((Date - Start Date) / 365)] = 0
```

**Where to Find:**
- Fund-level: Dashboard or Performance tab
- Investment-level: Investments > [Investment Name] > Performance
- Investor-level: Investors > [Investor Name] > Financial Summary

**Interpretation:**
- **15% IRR** = Fund generating 15% annualized return
- **Higher IRR** = Better performance
- Compare to target IRR (typically 15-25% for PE/VC, 10-18% for real estate)

**[IMAGE PLACEHOLDER 19: IRR Calculation Dashboard]**

---

### 2. MOIC (Multiple on Invested Capital)

**What it is:**
Total value (distributions + NAV) divided by total capital invested. Shows overall multiple return.

**How Polibit Calculates It:**
```
MOIC = (Total Distributions + Current NAV) / Total Capital Called
```

**Example:**
- Capital Called: $10M
- Distributions Paid: $8M
- Current NAV: $7M
- **MOIC = ($8M + $7M) / $10M = 1.5x**

**Interpretation:**
- **1.0x** = Break-even (got money back)
- **1.5x** = Made 50% profit
- **2.0x** = Doubled money
- **3.0x** = Tripled money

Target MOIC varies by fund type:
- **PE/VC**: 2.5x - 3.0x+
- **Real Estate**: 1.8x - 2.5x
- **Debt Funds**: 1.3x - 1.6x

**[IMAGE PLACEHOLDER 20: MOIC Breakdown Chart]**

---

### 3. DPI (Distributions to Paid-In Capital)

**What it is:**
Cash distributions returned to investors divided by capital called. Shows **realized returns**.

**Formula:**
```
DPI = Total Distributions / Total Capital Called
```

**Interpretation:**
- **0.5x DPI** = Have returned 50% of invested capital in cash
- **1.0x DPI** = Investors have their money back in cash
- **2.0x DPI** = Investors have received 2x their capital back

**Why it Matters:**
- DPI shows **actual cash returned** (not just paper gains)
- Higher DPI = More liquidity provided to investors
- Mature funds should have higher DPI

---

### 4. RVPI (Residual Value to Paid-In Capital)

**What it is:**
Current NAV (unrealized value) divided by capital called. Shows **remaining value**.

**Formula:**
```
RVPI = Current NAV / Total Capital Called
```

**Interpretation:**
- **1.5x RVPI** = Remaining positions worth 1.5x invested capital
- RVPI decreases as assets are sold (value moves to DPI)
- Early-stage funds have high RVPI
- Mature funds have low RVPI (most value realized)

---

### 5. TVPI (Total Value to Paid-In Capital)

**What it is:**
Total value (distributions + NAV) divided by capital called. Equivalent to MOIC.

**Formula:**
```
TVPI = (Total Distributions + Current NAV) / Total Capital Called

TVPI = DPI + RVPI
```

**Interpretation:**
- **2.5x TVPI** = Total value is 2.5x invested capital
- Combines realized (DPI) and unrealized (RVPI) value
- Most commonly cited performance metric

**Example Fund Lifecycle:**

| Year | DPI | RVPI | TVPI |
|------|-----|------|------|
| Year 1 | 0.0x | 1.0x | 1.0x (early stage) |
| Year 3 | 0.2x | 1.5x | 1.7x (growing) |
| Year 5 | 0.8x | 1.5x | 2.3x (distributions starting) |
| Year 8 | 1.8x | 0.5x | 2.3x (mostly realized) |
| Year 10 | 2.2x | 0.1x | 2.3x (fully realized) |

**[IMAGE PLACEHOLDER 21: DPI/RVPI/TVPI Chart Over Time]**

---

### Performance Attribution

**What it is:**
Analysis showing which investments contribute most to overall fund returns.

**Where to Find:**
Performance > Attribution Analysis

**What it Shows:**
- Investment-by-investment IRR contribution
- MOIC by asset
- Sector performance breakdown
- Geography performance breakdown
- Winners vs. underperformers

**How to Use:**
1. Identify top performers (replicate success)
2. Identify underperformers (address issues)
3. Analyze sector trends
4. Inform future investment strategy

**[IMAGE PLACEHOLDER 22: Performance Attribution Analysis]**

---

### Benchmarking

Compare your fund's performance to:
- Target IRR (set at fund creation)
- Industry benchmarks (if configured)
- Prior fund vintages (for multi-fund managers)
- Public market equivalents

---

## Documents

### Overview

Centralized repository for all fund and investor documents.

**Location:** Click **Documents** in the left sidebar

**[IMAGE PLACEHOLDER 23: Documents Library]**

---

### Document Types

**Fund Documents:**
- Private Placement Memorandums (PPMs)
- Limited Partnership Agreements (LPAs)
- Side letters
- Fund amendments
- Annual audits
- Tax returns

**Investor Documents:**
- Subscription agreements
- KYC/AML forms
- Accreditation letters
- W-9 / W-8 forms
- Passport/ID copies

**Investment Documents:**
- Purchase agreements
- Loan documents
- Appraisals
- Property reports
- Financial statements

---

### Uploading Documents

**Step 1: Navigate to Documents**
1. Click **Documents** in sidebar

**Step 2: Select Category**
- Fund Documents
- Investor Documents
- Investment Documents

**Step 3: Upload**
1. Click **"Upload Document"**
2. Drag and drop files OR click to browse
3. Select document type
4. Add tags (optional)
5. Set access permissions:
   - **All Users**: Everyone can view
   - **Specific Investors**: Only selected LPs
   - **Admin Only**: Internal documents

**Step 4: Save**
- Document is uploaded and cataloged
- Appears in document library

**[IMAGE PLACEHOLDER 24: Document Upload Interface]**

---

### Organizing Documents

**Folders:**
- Organize by fund, investor, or document type
- Create custom folder structures
- Move documents between folders

**Tags:**
- Add multiple tags per document
- Filter by tags
- Common tags: "Legal", "Tax", "Compliance", "Quarterly"

**Search:**
- Full-text search across all documents
- Filter by date uploaded
- Filter by file type (PDF, Excel, Word)

---

### Sharing Documents

**Via Investor Portal:**
- Documents marked as "Investor Accessible" appear in LP portal
- Investors can download directly

**Via Email:**
- Select document(s)
- Click **"Share"**
- Enter email addresses
- System sends secure download link

**Via Direct Download:**
- Click document name
- File downloads to your computer

---

## Chat

### Overview

The Chat feature provides a built-in messaging system for direct communication with your investors. Have real-time conversations, answer questions, and provide updates without leaving the platform.

**Location:** Click **Chat** in the left sidebar

**[IMAGE PLACEHOLDER 23a: Chat Interface]**

---

### Chat Interface Layout

The Chat interface has two panels:

**Left Panel: Conversations List**
- All investor conversations in one place
- Unread message counter at the top
- Search and filter capabilities
- Preview of recent messages

**Right Panel: Active Conversation**
- Full message thread with selected investor
- Investor profile information and status
- Message composition area

---

### Conversations List (Left Panel)

**Header:**
- **"Messages"** title
- **Unread counter**: Shows total unread conversations (e.g., "9 unread conversations")
- **Menu icon** (three dots) for additional options

**Search Bar:**
- Type to search through conversations
- Searches investor names and message content
- Real-time filtering as you type

**Filter by Structure:**
- Dropdown: "All Structures"
- Filter conversations by fund/structure
- Useful when managing multiple funds

**Conversation List:**

Each conversation card shows:

1. **Investor Avatar**
   - Circular avatar with initials
   - Color-coded by investor

2. **Investor Name**
   - Full name displayed prominently
   - Example: "Tony Bravo", "Jeff Bezos Family Office"

3. **Fund Association**
   - Shows which fund the investor is in
   - Examples:
     - "Polibit Real Estate I"
     - "No Structure" (if not allocated to a fund yet)

4. **Message Preview**
   - Last message snippet
   - Example: "Thank you for the recent upda..."
   - Truncated to fit one line

5. **Timestamp**
   - Time since last message
   - Examples: "0m ago", "5m ago", "2h ago"

6. **Unread Badge**
   - Blue pill badge showing unread count
   - Examples: "2 new", "1 new"
   - Only appears when there are unread messages

7. **Online Status Indicator**
   - Green dot for online investors
   - Gray for offline

**Example Conversation Cards:**
```
T   Tony Bravo                              0m ago
    Polibit Real Estate I
    Thank you for the recent upda...
    [2 new]

J   Jeff Bezos Family Office               0m ago
    No Structure
    Thank you for the recent upda...

J   Johnny Depp                            0m ago
    No Structure
    Thank you for the recent upda...
    [1 new]
```

---

### Active Conversation (Right Panel)

**Conversation Header:**

1. **Investor Profile**
   - Avatar with initials
   - Full investor name
   - Fund name (if associated)
   - Online status: Green "Online" or gray "Offline"

2. **Action Buttons**
   - **View Profile**: Opens investor detail page in new tab
   - **Menu** (three dots): Additional conversation options

**Example Header:**
```
T   Tony Bravo
    Polibit Real Estate I  •  Online        [View Profile]  [•••]
```

---

### Message Thread

**Message Display:**

**Investor Messages (Left-aligned, white background):**
- Avatar with investor initials
- Message text
- Timestamp (e.g., "8:45 PM")

**Your Replies (Right-aligned, purple background):**
- "OM" avatar (Orbis Manager or your firm initials)
- Message text in white text on purple background
- Timestamp with checkmark (message delivered)

**Message Types:**

1. **Regular Messages**
   - Standard text messages
   - Multi-line support

2. **Typing Indicator**
   - Three animated dots "..."
   - Shows when investor is typing

3. **Today Separator**
   - "Today" label divides messages by date
   - Helps organize conversation timeline

**Example Conversation:**
```
Today

T  Hi, I just received the Q4 quarterly report. Thank you for
   the detailed update!
   8:45 PM

OM You're welcome, Tony! I'm glad you found it helpful.
   Please let me know if you have any questions.
   8:55 PM ✓

T  Yes, I do have a question. When can we expect the K-1 tax
   forms for 2024?
   9:15 PM

T  Also, I noticed the NAV increased this quarter. That's
   great news!
   9:25 PM

T  ...
```

---

### Sending Messages

**Message Composition Area (Bottom):**

1. **Attachment Button**
   - Paperclip icon on the left
   - Click to attach files or documents
   - Supports PDFs, images, spreadsheets

2. **Text Input Field**
   - Placeholder: "Type your message..."
   - Multi-line text support
   - Auto-expands as you type

3. **Send Button**
   - Purple circular button with paper plane icon
   - Click to send message
   - Keyboard shortcut: Enter (or Shift+Enter for new line)

**How to Send a Message:**
1. Click in the text input field
2. Type your message
3. (Optional) Click paperclip to attach files
4. Click send button or press Enter
5. Message appears in thread immediately

---

### Chat Features

**Real-Time Communication:**
- Messages deliver instantly
- No page refresh needed
- Online status updates in real-time
- Typing indicators show when investor is responding

**Conversation Management:**
- **Mark as Read/Unread**: Right-click conversation
- **Archive Conversations**: Remove from main list
- **Search Messages**: Find specific conversations quickly
- **Filter by Fund**: View only specific fund conversations

**Notifications:**
- Desktop notifications for new messages (if enabled)
- Unread badge on Chat navigation item
- Sound alerts for incoming messages (optional)

**Message History:**
- Complete conversation history preserved
- Scroll up to view older messages
- Search within conversation
- Download conversation transcript

---

### Common Use Cases

**1. Answering Investor Questions**
- Investor asks about quarterly report
- You respond directly in chat
- Faster than email, documented for compliance

**2. K-1 Tax Form Inquiries**
- Investor asks: "When can we expect K-1 forms?"
- Provide update on delivery timeline
- Follow up when K-1 is ready for download

**3. NAV Updates**
- Investor notices NAV increase
- Explain performance drivers
- Share additional context beyond quarterly report

**4. Document Sharing**
- Investor requests specific document
- Attach and send directly in chat
- No need for separate email

**5. General Updates**
- Thank investors for feedback on reports
- Announce upcoming capital calls
- Share important fund news

---

### Best Practices

**Response Time:**
- Reply to investor messages within 24 hours
- Use "Online" status when actively monitoring chat
- Set expectations for response time in your signature

**Professional Communication:**
- Maintain professional tone
- Use proper grammar and formatting
- Avoid jargon unless necessary
- Be clear and concise

**Record Keeping:**
- All messages are automatically saved
- Export conversations for compliance
- Important decisions should be documented in formal notices
- Use chat for informal Q&A and quick updates

**Security:**
- Never share sensitive data (SSNs, account numbers) in chat
- Use document upload for secure file sharing
- Remind investors not to share passwords or PINs
- All messages are encrypted in transit and at rest

---

### Conversation Organization

**Sorting Options:**
- Most recent conversations at top
- Unread messages prioritized
- Sort by: Recent Activity, Name, Fund

**Filtering:**
- Filter by fund/structure
- Show only unread
- Show only online investors
- Search by investor name

**Archiving:**
- Archive old or resolved conversations
- Keeps conversation list clean
- Archived messages remain searchable
- Restore from archive anytime

---

### Chat vs. Formal Communication

**When to Use Chat:**
✅ Quick investor questions
✅ Clarifications on reports
✅ Informal updates
✅ Document requests
✅ Schedule coordination

**When to Use Formal Communication (Email/Portal):**
📧 Capital call notices
📧 Distribution announcements
📧 Legal documents
📧 Quarterly/annual reports
📧 Material fund changes

Chat complements but does not replace formal investor communications required by your fund documents.

---

## Capital Operations

### Capital Calls

**What is a Capital Call?**
A request for limited partners to fund a portion of their committed capital.

**Location:** Operations > Capital Calls

**[IMAGE PLACEHOLDER 25: Capital Calls List]**

---

### Creating a Capital Call

**Step 1: Start Process**
1. Navigate to **Operations** > **Capital Calls**
2. Click **"Create Capital Call"**

**Step 2: Select Fund**
- Choose which structure is calling capital
- System loads all investors in that fund

**Step 3: Call Details**
- **Call Name**: E.g., "Capital Call #5 - Q4 2025"
- **Call Date**: When call is issued
- **Due Date**: When payment is due
- **Call Amount**: Total amount to call
- **Call Percentage**: % of commitments to call (e.g., 25%)

**Step 4: Investor Allocations**

System auto-calculates each investor's share:

**Pro-Rata Calculation:**
```
Investor's Call Amount = (Investor Commitment / Total Commitments) × Total Call Amount
```

**Example:**
- Total Fund: $50M commitment
- Capital Call: $10M (20% call)
- Investor A: $5M commitment
- **Investor A's Call: ($5M / $50M) × $10M = $1M**

**Review Allocations:**
- View table showing each investor's:
  - Commitment amount
  - Unfunded balance
  - Call amount
  - Call percentage
- Adjust individual amounts if needed (custom allocations)

**[IMAGE PLACEHOLDER 26: Capital Call Creation - Allocations]**

**Step 5: Payment Instructions**
- Bank name
- Account number
- Routing number
- Wire instructions
- Payment reference

**Step 6: Notice Generation**
1. Click **"Generate Notices"**
2. System creates PDF notice for each investor
3. Preview notices before sending

**Step 7: Send to Investors**
- Click **"Send Capital Call"**
- Notices emailed to all LPs
- Published to investor portal
- Status changes to "Issued"

---

### Tracking Capital Call Payments

**Payment Tracking:**
1. Navigate to capital call detail page
2. View payment status for each investor:
   - ⏳ **Pending**: Not yet paid
   - ✅ **Paid**: Payment received
   - ⚠️ **Overdue**: Past due date

**Marking Payments:**
1. Click on investor row
2. Mark as "Paid"
3. Enter payment date
4. Enter payment amount (if different from called amount)

**Automated Tracking:**
- System tracks outstanding balance
- Sends reminder emails for overdue payments
- Updates investor's "Called Capital" when marked paid

**[IMAGE PLACEHOLDER 27: Capital Call Payment Tracking]**

---

### Capital Call Impact

**After Capital Call is Paid:**
- Investor's **Called Capital** increases
- Investor's **Uncalled Capital** decreases
- Investor's **Ownership %** recalculates (called capital / total fund called)
- Fund's total called capital increases
- Available for investment deployment

---

### Distributions

**What is a Distribution?**
Payment of profits or return of capital to limited partners, typically from investment exits or income.

**Location:** Operations > Distributions

**[IMAGE PLACEHOLDER 28: Distributions List]**

---

### Creating a Distribution

**Step 1: Start Process**
1. Navigate to **Operations** > **Distributions**
2. Click **"Create Distribution"**

**Step 2: Select Fund**
- Choose which structure is distributing
- System loads all investors

**Step 3: Distribution Details**
- **Distribution Name**: E.g., "Q4 2025 Distribution"
- **Distribution Date**: When payment is made
- **Source**: Exit Proceeds, Operating Income, Return of Capital
- **Total Distribution Amount**: E.g., $5M

**Step 4: Waterfall Calculation** ⭐

The system automatically applies the fund's waterfall structure:

**American Waterfall (Deal-by-Deal):**

**Tier 1: Return of Capital**
- 100% to LPs until all contributed capital returned
- **Example**: $3M to LPs

**Tier 2: Preferred Return**
- LPs receive hurdle rate return (e.g., 8% annually)
- Compounded on unreturned capital
- **Example**: $800K to LPs

**Tier 3: GP Catch-Up**
- GP receives 100% until their carried interest percentage is achieved
- **Example**: $300K to GP (now at 20% of total)

**Tier 4: Remaining Profits**
- Split per LP agreement (typically 80% LP / 20% GP)
- **Example**: $900K remaining → $720K to LPs, $180K to GP

**Total Distribution: $5M**
- **LPs receive**: $4.52M (90.4%)
- **GP receives**: $480K (9.6%)

**European Waterfall (Whole-Fund):**
- All capital across entire fund must be returned first
- Then preferred return on all capital
- Then GP catch-up
- Then profit split

**[IMAGE PLACEHOLDER 29: Waterfall Calculation Breakdown]**

**Step 5: Investor Allocations**

System shows allocation to each LP:
- Base allocation (pro-rata by ownership)
- Waterfall adjustments
- Custom terms adjustments (if applicable)
- Final distribution amount

**Step 6: Generate Distribution Notices**
1. Click **"Generate Notices"**
2. System creates PDF notice for each investor showing:
   - Distribution amount
   - Source (exit proceeds, income, etc.)
   - Tax withholding (if applicable)
   - Payment method
3. Preview notices

**Step 7: Execute Distribution**
- Click **"Execute Distribution"**
- Notices sent to all LPs
- Status changes to "Paid"
- System updates:
  - Investor's total distributions received
  - Fund's DPI calculation
  - Investor's current value

---

### Distribution Impact

**After Distribution:**
- Investor's **Total Distributions** increases
- **DPI** increases (distributions / called capital)
- **RVPI** may decrease (if return of capital)
- **TVPI** reflects new total value
- **IRR** recalculates with new cash flow

---

## Capital Management

### Commitments

**What are Commitments?**
The total amount each investor has agreed to invest in a fund over its lifetime.

**Location:** Capital > Commitments

**[IMAGE PLACEHOLDER 30: Commitments Overview]**

---

### Viewing Commitments

**Commitments Page Shows:**

**Summary Metrics:**
- Total Commitments across all funds
- Total Called to date
- Total Uncalled (remaining)
- Called percentage

**By Fund:**
- Fund name
- Total commitments
- Called capital
- Uncalled capital
- Number of investors
- Called %

**By Investor:**
- Investor name
- Total commitment (across all funds)
- Called capital
- Uncalled capital
- Commitment status

**Filters:**
- By fund structure
- By investor type
- By commitment status (Active, Fully Called, etc.)

---

### Managing Commitments

**Increasing Commitment:**
1. Navigate to investor detail page
2. Find fund allocation
3. Click **"Edit Allocation"**
4. Update commitment amount
5. Save

**Decreasing Commitment:**
- Only allowed if not yet called
- Requires investor agreement

**Commitment Status:**
- **Active**: Capital can still be called
- **Fully Called**: 100% of commitment called
- **Partially Called**: Some capital called, some remaining
- **Suspended**: Temporarily unable to call capital

---

### Activity

**What is Activity?**
Complete transaction ledger of all capital movements.

**Location:** Capital > Activity

**[IMAGE PLACEHOLDER 31: Capital Activity Feed]**

---

### Activity Feed Shows

**All Transactions:**
1. **Capital Calls**
   - Call date
   - Amount called from each investor
   - Payment status

2. **Distributions**
   - Distribution date
   - Amount distributed to each investor
   - Source (exit, income, etc.)

3. **Management Fees**
   - Fee calculation
   - Amount charged
   - Date charged

4. **Performance Fees** (Carried Interest)
   - Calculation basis
   - Amount charged
   - Waterfall tier reached

5. **Transfers**
   - LP transfers (secondary sales)
   - Adjustments
   - Corrections

**Filters:**
- By date range
- By transaction type
- By fund structure
- By investor

**Export:**
- Export to Excel for reconciliation
- Generate cash flow statements
- Prepare audit materials

---

### Reconciliation

Use Activity feed to reconcile:
- Investor capital accounts
- Bank statements
- Fund accounting records
- Tax filings

**Reconciliation Process:**
1. Export activity to Excel
2. Sum capital calls = Total called capital
3. Sum distributions = Total distributions
4. Compare to bank statements
5. Investigate discrepancies

---

## Settings

### Firm Settings

**Location:** Click **Settings** in sidebar > Firm Settings

**Configure:**

**1. Firm Information**
- Firm name
- Legal entity name
- Address
- Phone and email
- Website

**2. Branding**
- Upload firm logo
- Set color scheme
- Customize email templates
- White-label investor portal

**3. Default Economic Terms**
Set defaults for new structures:
- Management fee % (default: 2%)
- Performance fee % (default: 20%)
- Hurdle rate % (default: 8%)
- Preferred return % (default: 8%)

**4. Currency Settings**
- Default currency (USD, MXN, EUR, etc.)
- Exchange rate sources
- Multi-currency support

**5. Fiscal Year**
- Set fiscal year end date
- Tax year configuration

**[IMAGE PLACEHOLDER 32: Firm Settings Page]**

---

### User Management

**Location:** Settings > Users

**Add New User:**
1. Click **"Add User"**
2. Enter email address
3. Enter name
4. Select role:
   - **Admin**: Full access
   - **Fund Manager**: Create/edit structures, investors, investments
   - **Operations**: Manage capital calls and distributions
   - **Read-Only**: View-only access
5. Send invitation email

**User Permissions:**

| Feature | Admin | Fund Manager | Operations | Read-Only |
|---------|-------|--------------|------------|-----------|
| Create Structures | ✅ | ✅ | ❌ | ❌ |
| Add Investors | ✅ | ✅ | ❌ | ❌ |
| Add Investments | ✅ | ✅ | ❌ | ❌ |
| Issue Capital Calls | ✅ | ✅ | ✅ | ❌ |
| Execute Distributions | ✅ | ✅ | ✅ | ❌ |
| Generate Reports | ✅ | ✅ | ✅ | ✅ |
| View Performance | ✅ | ✅ | ✅ | ✅ |
| Manage Settings | ✅ | ❌ | ❌ | ❌ |

---

### Notification Settings

**Location:** Settings > Notifications

**Configure Email Alerts:**
- New capital call issued
- Distribution executed
- Report generated
- Investor onboarded
- Payment overdue
- Quarterly report due

**Frequency:**
- Real-time (immediate)
- Daily digest
- Weekly summary

---

### Security Settings

**Location:** Settings > Security

**Configure:**
- Two-factor authentication (2FA)
- Password policies
- Session timeout
- IP whitelisting
- Audit log retention

---

## Appendix

### A. Glossary of Terms

**AUM (Assets Under Management):** Total market value of assets managed by the fund

**Capital Call:** Request for limited partners to fund a portion of their commitment

**Cap Table:** Capitalization table showing investor ownership in a fund

**Carried Interest:** Performance fee paid to GP (typically 20%)

**Commitment:** Total amount an investor agrees to invest over fund lifetime

**Distribution:** Payment of profits or return of capital to investors

**DPI:** Distributions to Paid-In Capital (realized returns)

**GP (General Partner):** Fund manager

**Hurdle Rate:** Minimum return threshold before GP receives carried interest

**IRR:** Internal Rate of Return (annualized return)

**LP (Limited Partner):** Investor in the fund

**Management Fee:** Annual fee charged by GP (typically 2%)

**MOIC:** Multiple on Invested Capital (total value / invested capital)

**NAV (Net Asset Value):** Current market value of fund's assets

**Preferred Return:** Minimum return LPs receive before GP gets carried interest

**RVPI:** Residual Value to Paid-In Capital (unrealized value)

**SPV (Special Purpose Vehicle):** Entity created for a specific investment

**TVPI:** Total Value to Paid-In Capital (realized + unrealized value)

**Waterfall:** Profit distribution mechanism defining LP/GP split

---

### B. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Global search |
| `Ctrl/Cmd + N` | Create new (context-dependent) |
| `Ctrl/Cmd + S` | Save current form |
| `Ctrl/Cmd + E` | Edit current item |
| `Esc` | Close modal/drawer |
| `?` | Show keyboard shortcuts |

---

### C. NAV Calculation Methodology

**Net Asset Value Formula:**
```
NAV = Gross Asset Value - Liabilities - Accrued Fees + Accrued Income
```

**Valuation Methods by Asset Type:**

**Real Estate:**
- Appraisal-based fair value
- Updated quarterly or annually
- Third-party appraisers

**Private Equity:**
- Transaction multiples
- DCF (Discounted Cash Flow) models
- Mark-to-market for public comps

**Private Debt:**
- Yield-based valuation
- Credit adjustments for risk
- Accrued interest

**Public Securities:**
- Market-based pricing
- End-of-quarter closing prices

---

### D. Waterfall Calculation Examples

See [Distributions](#distributions) section for detailed waterfall examples.

---

### E. Support and Training

**Getting Help:**
- **In-App Chat**: Click chat icon in sidebar
- **Email Support**: support@polibit.io
- **Knowledge Base**: help.polibit.io
- **Video Tutorials**: tutorials.polibit.io

**Training Sessions:**
- **Onboarding Training**: 2-hour live session for new clients
- **Advanced Features**: Monthly webinars
- **Custom Training**: Available on request

**Response Times:**
- **Critical Issues**: < 2 hours
- **General Support**: < 24 hours
- **Feature Requests**: Reviewed weekly

---

### F. System Requirements

**Browser Compatibility:**
- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Internet Connection:**
- Minimum: 5 Mbps download / 1 Mbps upload
- Recommended: 25 Mbps download / 5 Mbps upload

**Screen Resolution:**
- Minimum: 1280x720
- Recommended: 1920x1080 or higher

---

### G. Data Security

**Infrastructure:**
- AWS cloud hosting
- SOC 2 Type II certified
- 256-bit SSL encryption
- Automated daily backups

**Data Privacy:**
- GDPR compliant
- CCPA compliant
- Data residency options available

**Access Control:**
- Role-based permissions
- Two-factor authentication
- Audit logging
- IP whitelisting

---

### H. API Documentation

For developers integrating with Polibit:
- API documentation: api.polibit.io
- Webhooks available for events
- REST API with JSON responses
- Rate limits: 1000 requests/hour

---

**End of User Manual**

*For questions or feedback on this manual, contact: documentation@polibit.io*

---

**Document Version:** 2.0
**Last Updated:** November 2025
**Next Review:** February 2026

© 2025 Polibit. All rights reserved.
