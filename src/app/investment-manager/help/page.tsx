'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconChartLine,
  IconTable,
  IconPlus,
  IconEdit,
  IconTrash,
  IconFilter,
  IconLayoutDashboard,
  IconBuilding,
  IconUsers,
  IconFileText,
  IconCalculator,
  IconMail
} from '@tabler/icons-react'

interface HelpSection {
  id: string
  title: string
  icon: any
  content: {
    question: string
    answer: string
  }[]
}

const helpSections: HelpSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard & Customization',
    icon: IconLayoutDashboard,
    content: [
      {
        question: 'How do I add a new chart or metric to my dashboard?',
        answer: 'Click the "Add a Graph" button in the top right corner of your dashboard. You can choose from pre-built templates or create a custom chart by selecting your data source, chart type, and metrics. Charts can be resized (small, medium, large) to fit your layout needs.'
      },
      {
        question: 'How do I rearrange widgets on my dashboard?',
        answer: 'All dashboard widgets are draggable. Simply click and hold on any chart or metric card, then drag it to your desired position. The layout will automatically adjust. Your changes are saved automatically.'
      },
      {
        question: 'How do I delete a chart or metric card?',
        answer: 'Hover over any widget and click the trash icon in the top right corner.'
      },
      {
        question: 'How do I edit an existing chart?',
        answer: 'Hover over the chart and click the pencil/edit icon in the top right corner. You can modify the chart type, data source, metrics, date range, and other settings. Click "Save Changes" to apply your updates.'
      },
      {
        question: 'What chart types are available?',
        answer: 'You can create: Line Charts (trends over time), Bar Charts (comparisons), Area Charts (cumulative values), Pie Charts (proportional distribution), Donut Charts (proportions with center space), and Data Tables (structured data with sorting and pagination).'
      },
      {
        question: 'How do I filter my dashboard by structure?',
        answer: 'Use the "Filter by Structure" dropdown at the top of the dashboard. You can view data for all structures combined or filter to a specific fund, SPV, trust, or private debt vehicle. Charts and metrics will update automatically.'
      }
    ]
  },
  {
    id: 'charts',
    title: 'Charts & Visualizations',
    icon: IconChartLine,
    content: [
      {
        question: 'What data sources can I use for charts?',
        answer: 'Available data sources include: Net Asset Value (NAV over time), Investments (portfolio data), Investors (LP commitments and performance), Capital Calls (call history), Distributions (distribution history), and Performance (fund metrics like IRR, MOIC, DPI).'
      },
      {
        question: 'How do I choose the right chart type?',
        answer: 'Use Line/Area charts for trends over time, Bar charts for comparing values across categories, Pie/Donut charts for showing proportional distributions, and Tables for detailed data that needs sorting or filtering.'
      },
      {
        question: 'Can I customize chart colors?',
        answer: 'Charts automatically use your platform\'s color scheme for consistency. Each metric in a multi-metric chart gets a unique color that matches the legend.'
      },
      {
        question: 'How do I export chart data?',
        answer: 'Currently, charts are displayed within the dashboard. For exporting data, use the Reports section to generate PDF, Excel, or CSV exports of your portfolio data.'
      }
    ]
  },
  {
    id: 'tables',
    title: 'Data Tables',
    icon: IconTable,
    content: [
      {
        question: 'How do I sort table columns?',
        answer: 'Click on any column header to sort by that column. Click once for ascending order, twice for descending order, and a third time to remove sorting. You\'ll see arrow indicators showing the current sort direction.'
      },
      {
        question: 'How does table pagination work?',
        answer: 'Tables display 10 rows per page by default. Use the "Previous" and "Next" buttons at the bottom of the table to navigate between pages. The current page and total pages are displayed in the center.'
      },
      {
        question: 'What data can I view in tables?',
        answer: 'Tables can display: Holdings by Value (asset name, type, value, % of NAV, valuation method), Active Investments (investment name, type, status, amount, value, IRR), and custom metrics you configure.'
      },
      {
        question: 'Can I filter table data?',
        answer: 'Use the "Filter by Structure" dropdown at the top of the dashboard to filter all tables by specific fund structures. Individual column filtering is not currently available but may be added in future updates.'
      }
    ]
  },
  {
    id: 'structures',
    title: 'Structures & Funds',
    icon: IconBuilding,
    content: [
      {
        question: 'How do I create a new fund structure?',
        answer: 'Navigate to Structures and click "Add Structure" or use the onboarding wizard for new funds. You\'ll complete 7 steps: Fund Setup, Economic Terms, Limited Partners, Portfolio Strategy, Capital History, Review, and Documents.'
      },
      {
        question: 'What types of structures can I create?',
        answer: 'You can create: Funds (VC, PE, Real Estate, Hedge Fund, Fund of Funds), SPVs/LLCs (Single Property, REIT, LP Aggregator, Co-Investment, Syndication), Trusts (Real Estate, Debt Fund, Mixed Assets), and Private Debt vehicles (Senior Debt, Mezzanine, Bridge Loans, Distressed Debt).'
      },
      {
        question: 'What are investment and issuance capacities?',
        answer: 'Investment capacity is the maximum number of investments a fund can hold. Issuance capacity tracks equity and debt emissions. Mixed investments (equity + debt) count as 2 issuances, while pure equity or debt count as 1 issuance each.'
      },
      {
        question: 'Can I pre-register investors during fund setup?',
        answer: 'Yes! Step 3 of the onboarding wizard allows you to pre-register LPs by uploading a CSV file or entering them manually. You can set custom economic terms per investor if needed.'
      }
    ]
  },
  {
    id: 'investments',
    title: 'Investment Tracking',
    icon: IconChartLine,
    content: [
      {
        question: 'How do I add a new investment?',
        answer: 'Go to Investments and click "Add Investment". Select the fund structure, enter investment details (name, type, sector, location), choose investment type (equity, debt, or mixed), and input financial details. The system will calculate ownership percentage and metrics automatically.'
      },
      {
        question: 'What\'s the difference between equity, debt, and mixed investments?',
        answer: 'Equity investments track ownership percentage and unrealized gains. Debt investments track principal, interest rate, and maturity date. Mixed investments combine both equity and debt positions in a single deal.'
      },
      {
        question: 'How is ownership percentage calculated?',
        answer: 'Ownership is calculated based on your equity position only, not total fund commitment. For example, if you invest $1M in equity for a $10M deal, you own 10%, regardless of any debt you may also provide.'
      },
      {
        question: 'Can I edit investment values later?',
        answer: 'Yes, click on any investment and select "Edit". You can update the current value, status, and other details. The system will recalculate IRR, MOIC, and unrealized gains automatically.'
      },
      {
        question: 'What happens when I reach investment capacity?',
        answer: 'The system will prevent adding new investments if your fund has reached its maximum investment capacity. You can edit the fund structure to increase capacity or mark existing investments as "Exited" to free up slots.'
      }
    ]
  },
  {
    id: 'investors',
    title: 'Investor Management',
    icon: IconUsers,
    content: [
      {
        question: 'How do I add a new investor?',
        answer: 'Navigate to Investors and click "Add Investor". Enter basic information (name, email, type), select fund structures to allocate to, enter commitment amounts, and upload any required documents.'
      },
      {
        question: 'Can an investor be allocated to multiple structures?',
        answer: 'Yes! During investor creation, you can allocate the same LP to multiple funds, SPVs, or trusts. Each allocation can have its own commitment amount and ownership percentage.'
      },
      {
        question: 'How do I view an investor\'s portfolio?',
        answer: 'Click on any investor in the Investors list to view their detail page. You\'ll see total commitment, structure allocations, documents, and transaction history all in one place.'
      },
      {
        question: 'Can I update investor information later?',
        answer: 'Yes, click on the investor and select "Edit". You can update contact information, add new structure allocations, adjust commitments, and upload additional documents.'
      }
    ]
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    icon: IconFileText,
    content: [
      {
        question: 'What types of reports can I generate?',
        answer: 'You can generate: Quarterly Reports (standard fund performance), K-1 Tax Forms (annual tax documents for LPs), and Custom Reports (configurable metrics and date ranges).'
      },
      {
        question: 'How do I create a quarterly report?',
        answer: 'Go to Reports, click "Generate New Report", select "Quarterly Report" as the type, choose your fund structure and date range, then click "Generate". The report will be created with NAV, capital calls, distributions, and performance metrics.'
      },
      {
        question: 'What export formats are available?',
        answer: 'All reports can be exported as PDF (formatted and print-ready), Excel (with formulas and formatting), or CSV (raw data for analysis).'
      },
      {
        question: 'How do I generate K-1 tax forms?',
        answer: 'Navigate to Reports, select "K-1 Tax Forms", choose the tax year and fund structure. The system will automatically calculate each investor\'s share of income, deductions, and capital gains, generating IRS-compliant Schedule K-1 forms.'
      },
      {
        question: 'Can I create custom reports with specific metrics?',
        answer: 'Yes! Use the Custom Report Builder to select specific metrics, date ranges, and multiple funds for comparison. You can save report templates for reuse and apply white-label branding.'
      }
    ]
  },
  {
    id: 'waterfalls',
    title: 'Waterfall Calculations',
    icon: IconCalculator,
    content: [
      {
        question: 'What is a waterfall calculation?',
        answer: 'A waterfall determines how profits are distributed between LPs and GPs. It typically includes: Return of Capital (LPs get capital back first), Preferred Return (LPs receive hurdle rate), GP Catch-Up (GP catches up to carry %), and Carried Interest (remaining profits split per carry %).'
      },
      {
        question: 'What waterfall types are supported?',
        answer: 'The platform supports American Waterfall (deal-by-deal distributions), European Waterfall (whole-fund distributions), and Hybrid Waterfall (combination of both).'
      },
      {
        question: 'How do I run a waterfall calculation?',
        answer: 'Go to Waterfalls, enter the total distribution amount, capital contributed, preferred return rate, and GP carry percentage. The system will calculate tier-by-tier allocations and show the LP vs GP split.'
      },
      {
        question: 'Can I model different scenarios?',
        answer: 'Yes! Adjust the distribution amount or waterfall parameters to see how different scenarios affect LP and GP distributions. This helps with planning and investor communications.'
      }
    ]
  },
  {
    id: 'common-tasks',
    title: 'Common Tasks & Workflows',
    icon: IconEdit,
    content: [
      {
        question: 'How do I set up a new fund from scratch?',
        answer: 'Use the onboarding wizard: 1) Enter fund basics (name, type, jurisdiction, commitment), 2) Set economic terms (fees, waterfall, hurdle rate), 3) Pre-register LPs, 4) Define investment strategy, 5) Input capital history, 6) Review and confirm, 7) Upload fund documents.'
      },
      {
        question: 'How do I track a new investment from start to finish?',
        answer: 'First, ensure the fund has available investment capacity. Then: 1) Add the investment with all details, 2) The system calculates ownership and metrics, 3) Track performance by editing current value over time, 4) View in dashboard charts and tables, 5) Include in quarterly reports.'
      },
      {
        question: 'How do I prepare for quarterly LP reporting?',
        answer: '1) Update all investment current values, 2) Review NAV calculations in the dashboard, 3) Generate a Quarterly Report for the period, 4) Review the report for accuracy, 5) Export as PDF for distribution, 6) Optionally export Excel/CSV for detailed analysis.'
      },
      {
        question: 'How do I manage multiple fund structures efficiently?',
        answer: 'Use the "Filter by Structure" dropdown to focus on one fund at a time. Each structure maintains its own investors, investments, and reports. You can switch between structures quickly without losing your dashboard customizations.'
      }
    ]
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['dashboard']))

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedSections(new Set(helpSections.map(s => s.id)))
  }

  const collapseAll = () => {
    setExpandedSections(new Set())
  }

  // Filter sections based on search query
  const filteredSections = React.useMemo(() => {
    if (!searchQuery.trim()) return helpSections

    const query = searchQuery.toLowerCase()
    return helpSections
      .map(section => ({
        ...section,
        content: section.content.filter(
          item =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        )
      }))
      .filter(section => section.content.length > 0)
  }, [searchQuery])

  return (
    <div className="@container/main flex flex-col gap-2 min-w-0">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="px-4 lg:px-6">
          <div className="flex flex-col gap-2 mb-6">
            <h1 className="text-3xl font-bold">Get Help</h1>
            <p className="text-muted-foreground">
              Learn how to use the Investment Manager platform. Find answers to common questions and step-by-step guides.
            </p>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>

          {/* Results count */}
          {searchQuery && (
            <div className="mb-4 text-sm text-muted-foreground">
              Found {filteredSections.reduce((acc, section) => acc + section.content.length, 0)} results
              {' '}in {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Help Sections */}
        <div className="px-4 lg:px-6">
          <div className="flex flex-col gap-4">
            {filteredSections.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <IconSearch className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No results found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search query or browse all sections
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredSections.map((section) => {
                const isExpanded = expandedSections.has(section.id)
                const Icon = section.icon

                return (
                  <Card key={section.id}>
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{section.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {section.content.length} article{section.content.length !== 1 ? 's' : ''}
                            </CardDescription>
                          </div>
                        </div>
                        {isExpanded ? (
                          <IconChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <IconChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="space-y-6">
                          {section.content.map((item, idx) => (
                            <div key={idx} className="border-l-2 border-primary/20 pl-4 py-2">
                              <h4 className="font-semibold mb-2 text-base">{item.question}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Contact Support */}
        <div className="px-4 lg:px-6 mt-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconMail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">Still need help?</CardTitle>
                  <CardDescription className="mt-2">
                    If you couldn't find the answer you were looking for, our support team is here to help.
                  </CardDescription>
                  <Button className="mt-4" asChild>
                    <a href="mailto:support@polibit.io">Contact Support</a>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
