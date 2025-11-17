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
  IconFileText,
  IconLayoutDashboard,
  IconBuilding,
  IconMail,
  IconBell,
  IconShield,
  IconSettings
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
    title: 'Dashboard Overview',
    icon: IconLayoutDashboard,
    content: [
      {
        question: 'What can I see on my investor dashboard?',
        answer: 'Your dashboard provides a comprehensive view of your portfolio including total commitment across all funds, called capital, current value, and unrealized gains. You can also see performance metrics like IRR, MOIC, and TVPI for each of your investments.'
      },
      {
        question: 'How do I view my portfolio summary?',
        answer: 'The portfolio page displays all your fund investments in a card-based grid. Each card shows key metrics including commitment, called capital, ownership percentage, and current value. Use the search and filter options to find specific structures.'
      },
      {
        question: 'How often is my portfolio data updated?',
        answer: 'Your portfolio data is updated whenever the fund manager makes changes to valuations, capital calls, or distributions. You\'ll receive notifications for important updates like new capital calls or distribution payments.'
      },
      {
        question: 'Can I filter my portfolio by fund type?',
        answer: 'Yes! Use the type filter dropdown to view only Real Estate Funds, Private Equity Funds, Private Debt Funds, SPVs, or all types together. You can also search by fund name.'
      }
    ]
  },
  {
    id: 'portfolio',
    title: 'Portfolio & Holdings',
    icon: IconBuilding,
    content: [
      {
        question: 'How do I view details of a specific fund?',
        answer: 'Click "View Details" on any fund card in your portfolio. This opens a comprehensive data room with tabs for Overview, Capital Calls, Distributions, Documents, and Legal & Terms showing all information about your investment.'
      },
      {
        question: 'What is the difference between commitment and called capital?',
        answer: 'Your commitment is the total amount you agreed to invest in the fund. Called capital is the amount actually requested by the fund manager through capital calls. The uncalled portion is your remaining commitment that may be called in the future.'
      },
      {
        question: 'How is my ownership percentage calculated?',
        answer: 'Your ownership percentage is calculated based on your commitment divided by the total fund size. For example, a $1M commitment in a $10M fund gives you 10% ownership.'
      },
      {
        question: 'What does current value represent?',
        answer: 'Current value is the estimated market value of your investment based on the fund\'s Net Asset Value (NAV). It reflects unrealized gains or losses from the fund\'s underlying investments.'
      },
      {
        question: 'Can I see the fund\'s underlying investments?',
        answer: 'Yes! In the fund data room, navigate to the Overview tab to see portfolio holdings, investment details, and performance metrics for the fund\'s underlying assets.'
      }
    ]
  },
  {
    id: 'capital-calls',
    title: 'Capital Calls & Payments',
    icon: IconMail,
    content: [
      {
        question: 'What is a capital call?',
        answer: 'A capital call is a request from the fund manager for you to fund a portion of your commitment. It\'s used to finance new investments, pay fund expenses, or meet other capital needs.'
      },
      {
        question: 'How do I know when I have a capital call?',
        answer: 'You\'ll receive an email notification and see a notification in your portal. Capital calls appear in the Capital Calls section with details including amount due, due date, and purpose.'
      },
      {
        question: 'How do I pay a capital call?',
        answer: 'Click on the capital call notice to view payment instructions. You can pay via wire transfer or ACH using the bank account information provided. Upload proof of payment for record-keeping.'
      },
      {
        question: 'What happens if I miss a capital call deadline?',
        answer: 'Missing a capital call can result in penalties, interest charges, or dilution of your ownership percentage. Contact your fund manager immediately if you cannot meet a deadline to discuss alternatives.'
      },
      {
        question: 'Can I see my capital call history?',
        answer: 'Yes! The Capital Calls page shows all historical calls with amounts, payment status, dates, and purposes. You can also see this in each fund\'s data room under the Capital Calls tab.'
      }
    ]
  },
  {
    id: 'distributions',
    title: 'Distributions & Returns',
    icon: IconChartLine,
    content: [
      {
        question: 'What are distributions?',
        answer: 'Distributions are payments made to you from the fund\'s profits or asset sales. They can be return of capital, preferred return, or profit distributions based on the fund\'s waterfall structure.'
      },
      {
        question: 'How do I track my distributions?',
        answer: 'The Distributions page shows all payments you\'ve received including amounts, dates, types (capital return, profit, etc.), and status. Each fund\'s data room also has a Distributions tab with detailed history.'
      },
      {
        question: 'What is the difference between return of capital and profit distribution?',
        answer: 'Return of capital is getting back your original investment with no tax on that portion. Profit distribution is your share of gains, which is taxable. Your K-1 tax form will categorize these properly.'
      },
      {
        question: 'When will I receive distributions?',
        answer: 'Distribution timing depends on the fund\'s strategy and underlying investments. Some funds distribute quarterly, others annually, and some only upon asset exits. Check your fund documents or ask your manager.'
      },
      {
        question: 'How are distribution amounts calculated?',
        answer: 'Distributions are calculated based on the fund\'s waterfall structure, which typically includes: 1) Return of capital to all LPs, 2) Preferred return to LPs, 3) GP catch-up, 4) Carried interest split. Your portion is based on your ownership percentage.'
      }
    ]
  },
  {
    id: 'performance',
    title: 'Performance Metrics',
    icon: IconChartLine,
    content: [
      {
        question: 'What is IRR and how is it calculated?',
        answer: 'IRR (Internal Rate of Return) is the annualized rate of return on your investment. It accounts for the timing of capital calls and distributions. A higher IRR indicates better performance. It\'s calculated using the cash flows (calls and distributions) and current value.'
      },
      {
        question: 'What is MOIC?',
        answer: 'MOIC (Multiple on Invested Capital) shows how many times you\'ve multiplied your invested capital. For example, 2.5x MOIC means you\'ve made 2.5 times your investment. It equals (distributions received + current value) / capital called.'
      },
      {
        question: 'What do TVPI, DPI, and RVPI mean?',
        answer: 'TVPI (Total Value to Paid-In) = total value / called capital. DPI (Distributions to Paid-In) = distributions / called capital. RVPI (Residual Value to Paid-In) = current value / called capital. TVPI = DPI + RVPI.'
      },
      {
        question: 'How do I compare performance across my funds?',
        answer: 'Use the Portfolio page to see all your funds side by side. Each card shows key metrics like IRR, MOIC, and unrealized gains. You can sort by performance or filter by fund type to make comparisons.'
      },
      {
        question: 'Why do performance metrics change?',
        answer: 'Metrics update when the fund manager revalues assets (typically quarterly), when you make capital contributions, or when you receive distributions. Market conditions and portfolio performance drive these changes.'
      }
    ]
  },
  {
    id: 'reports',
    title: 'Reports & Statements',
    icon: IconFileText,
    content: [
      {
        question: 'What reports will I receive?',
        answer: 'You\'ll receive quarterly fund reports showing performance, NAV, capital calls, distributions, and portfolio holdings. Annually, you\'ll receive K-1 tax forms for your tax filing.'
      },
      {
        question: 'Where can I access my reports?',
        answer: 'Navigate to the Reports section to view and download all quarterly reports, K-1 forms, and other documents. You can filter by fund structure and date range. All reports are available in PDF format.'
      },
      {
        question: 'What is a K-1 tax form?',
        answer: 'A K-1 (Schedule K-1 Form 1065) reports your share of the fund\'s income, deductions, and credits. You need this to file your taxes. It shows ordinary income, capital gains, and other tax items from your fund investment.'
      },
      {
        question: 'When will I receive my K-1?',
        answer: 'K-1 forms are typically distributed by March 15th following the tax year end, though some funds may need extensions until September. Check with your fund manager for specific timing.'
      },
      {
        question: 'Can I download reports in different formats?',
        answer: 'Most reports are available as PDF for viewing and printing. Some funds may also provide Excel files for custom analysis. Check the Reports section for available formats.'
      }
    ]
  },
  {
    id: 'documents',
    title: 'Documents & Legal',
    icon: IconFileText,
    content: [
      {
        question: 'Where can I find my fund documents?',
        answer: 'All fund documents are in the Documents section and in each fund\'s data room. This includes subscription agreements, partnership agreements, private placement memorandums, and side letters.'
      },
      {
        question: 'What key legal terms should I understand?',
        answer: 'In each fund\'s data room, the Legal & Terms tab shows important details like your subscription terms, fee schedules, voting rights, redemption terms, transfer restrictions, and liability limitations.'
      },
      {
        question: 'Can I see my custom economic terms?',
        answer: 'Yes! If you negotiated custom terms (reduced fees, different carry structure, etc.), these are displayed in the fund data room Overview tab, showing how your terms differ from standard fund terms.'
      },
      {
        question: 'How do I update my investor information?',
        answer: 'Navigate to Settings to update your contact information, payment methods, legal entity details, and tax information. Some changes may require fund manager approval.'
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications & Alerts',
    icon: IconBell,
    content: [
      {
        question: 'What types of notifications will I receive?',
        answer: 'You\'ll receive notifications for capital calls, distribution payments, new quarterly reports, K-1 availability, new documents uploaded, and important fund announcements.'
      },
      {
        question: 'How do I manage my notification preferences?',
        answer: 'Go to Settings > Notifications to customize which alerts you receive and how (email, SMS, or portal only). You can set preferences for each notification type.'
      },
      {
        question: 'Can I get urgent alerts via text message?',
        answer: 'Yes! Enable SMS notifications in your settings for urgent capital calls, payment due reminders, and security alerts. Regular updates will still come via email.'
      },
      {
        question: 'How do I ensure I don\'t miss important deadlines?',
        answer: 'Enable all capital call notifications and set up SMS alerts for urgent items. Portal notifications also appear in real-time when you\'re logged in.'
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Account',
    icon: IconShield,
    content: [
      {
        question: 'How do I keep my account secure?',
        answer: 'Enable two-factor authentication (2FA) in Settings > Security. Use a strong, unique password and never share your login credentials. Review active sessions regularly and log out from devices you no longer use.'
      },
      {
        question: 'What is two-factor authentication?',
        answer: '2FA adds an extra security layer by requiring both your password and a verification code from your phone. Enable it in Settings > Security to protect your account from unauthorized access.'
      },
      {
        question: 'How do I change my password?',
        answer: 'Navigate to Settings > Security and click "Change Password". You\'ll need to enter your current password and create a new one that meets security requirements.'
      },
      {
        question: 'Can I see where my account has been accessed from?',
        answer: 'Yes! Go to Settings > Security to view active sessions showing device type, location, and last activity. You can remotely log out any suspicious sessions.'
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings & Preferences',
    icon: IconSettings,
    content: [
      {
        question: 'How do I update my payment information?',
        answer: 'Go to Settings > Payment to manage bank accounts for capital call payments. You can add multiple accounts, set a primary account, and view payment history.'
      },
      {
        question: 'How do I update my legal entity information?',
        answer: 'Navigate to Settings > Legal Info to update your entity name, type, tax ID, and address. Some changes may require uploading supporting documentation.'
      },
      {
        question: 'Can I change my display preferences?',
        answer: 'Yes! Go to Settings > Preferences to customize your language, timezone, currency display, and date formats. These settings affect how data is displayed throughout the portal.'
      },
      {
        question: 'How do I manage my KYC/AML documentation?',
        answer: 'In Settings > Legal Info, you can view your KYC/AML verification status and upload required documents like passports, proof of address, and accreditation certificates.'
      }
    ]
  },
  {
    id: 'common-tasks',
    title: 'Common Tasks & Workflows',
    icon: IconFileText,
    content: [
      {
        question: 'How do I respond to a capital call?',
        answer: '1) Check your email or portal for the capital call notice, 2) Review the amount and due date, 3) Access payment instructions in the notice, 4) Make payment via wire/ACH to the specified account, 5) Upload proof of payment through the portal.'
      },
      {
        question: 'How do I track my overall portfolio performance?',
        answer: '1) Visit the Portfolio page to see all your funds, 2) Review summary metrics at the top (total commitment, called capital, current value), 3) Click into individual funds for detailed performance, 4) Check the Reports section for quarterly statements.'
      },
      {
        question: 'How do I prepare for tax season?',
        answer: '1) Download your K-1 forms from the Reports section (available by March 15), 2) Review the K-1 for your share of income, deductions, and credits, 3) Provide the K-1 to your tax preparer, 4) Keep quarterly reports for reference.'
      },
      {
        question: 'How do I stay informed about my investments?',
        answer: '1) Enable email notifications for quarterly reports and important updates, 2) Log in monthly to review your portfolio dashboard, 3) Read quarterly reports when they\'re published, 4) Attend investor meetings if offered by your fund.'
      },
      {
        question: 'What should I do if I can\'t meet a capital call?',
        answer: '1) Contact your fund manager immediately (don\'t wait until the deadline), 2) Explain your situation and ask about payment plan options, 3) Understand potential consequences (penalties, dilution), 4) Consider partial payment if possible to show good faith.'
      }
    ]
  }
]

export default function LPHelpPage() {
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Get Help</h1>
        <p className="text-muted-foreground mt-1">
          Learn how to use the Investor Portal. Find answers to common questions about your portfolio, capital calls, distributions, and more.
        </p>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
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
        <div className="text-sm text-muted-foreground">
          Found {filteredSections.reduce((acc, section) => acc + section.content.length, 0)} results
          {' '}in {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Help Sections */}
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

      {/* Contact Support */}
      <Card className="bg-primary/5 border-primary/20 mt-8">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconMail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Still need help?</CardTitle>
              <CardDescription className="mt-2">
                If you couldn't find the answer you were looking for, contact your fund manager or our support team for assistance.
              </CardDescription>
              <Button className="mt-4" asChild>
                <a href="mailto:support@polibit.io">Contact Support</a>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
