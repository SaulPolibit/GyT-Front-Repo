"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Header } from "@/components/header";

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("All Posts");

  const categories = [
    "All Posts",
    "Fundraising",
    "Cross-Border Payments",
    "Compliance & Regulation",
    "Platform Features",
    "Industry Insights",
    "Fund Administration"
  ];

  const blogPosts = [
    {
      id: 25,
      slug: "fund-audit-preparation-year-end-close-best-practices",
      title: "Fund Audit Preparation & Year-End Close: Best Practices to Reduce Complexity by 70%",
      category: "Fund Administration",
      date: "August 15, 2025",
      excerpt: "Year-end close and fund audits create operational bottlenecks for GPs managing complex waterfall structures and multi-jurisdiction portfolios. Learn how automated workflows reduce audit prep time by 70% while ensuring accuracy.",
      readTime: "10 min read",
      featured: false
    },
    {
      id: 24,
      slug: "portfolio-company-monitoring-value-creation-tracking",
      title: "Portfolio Company Monitoring & Value Creation Tracking: How 82% of PE Firms Use AI for Real-Time KPIs",
      category: "Fund Administration",
      date: "June 28, 2025",
      excerpt: "82% of PE and VC firms now use AI for portfolio monitoring, up from 47% in 2023. Learn how real-time KPI tracking and predictive analytics reduce reporting time by 40% while enabling proactive value creation.",
      readTime: "10 min read",
      featured: false
    },
    {
      id: 23,
      slug: "subscription-line-financing-nav-loans-capital-efficiency",
      title: "Subscription Line Financing & NAV Loans: Navigating the $100B Market for Capital Efficiency",
      category: "Fund Administration",
      date: "May 15, 2025",
      excerpt: "The NAV finance market reached $100 billion globally as spreads decreased 40 basis points in 2024. Discover how subscription lines and NAV loans boost IRR, mitigate J-curves, and enable non-dilutive capital for PE funds.",
      readTime: "11 min read",
      featured: false
    },
    {
      id: 22,
      slug: "co-investment-management-syndication-gp-allocation",
      title: "Co-Investment Management & Syndication: Best Practices for GP Allocation and Fairness",
      category: "Fund Administration",
      date: "April 22, 2025",
      excerpt: "Co-investment activity reached $7.3B through July 2024 as GPs balance LP allocation fairness with operational efficiency. Learn how to structure syndication workflows, manage capacity constraints, and maintain alignment.",
      readTime: "10 min read",
      featured: false
    },
    {
      id: 21,
      slug: "ilpa-reporting-templates-standardizing-lp-communications",
      title: "ILPA Reporting Templates: Standardizing LP Communications Across Private Markets",
      category: "Fund Administration",
      date: "October 28, 2025",
      excerpt: "ILPA's updated 2025 reporting templates standardize quarterly LP communications, enabling faster performance comparisons and reducing operational burden. Learn how automation helps GPs comply with evolving institutional standards.",
      readTime: "9 min read",
      featured: false
    },
    {
      id: 1,
      slug: "fund-administration-automation-reduces-costs",
      title: "How Fund Administration Automation Reduces Costs by 60% in Private Markets",
      category: "Fund Administration",
      date: "March 20, 2025",
      excerpt: "Fund administration automation eliminates manual errors, accelerates reporting, and cuts operational costs. Learn how modern platforms streamline PE and real estate fund operations.",
      readTime: "8 min read",
      featured: true
    },
    {
      id: 2,
      slug: "real-asset-tokenization-unlocking-global-liquidity",
      title: "Real Asset Tokenization: How Blockchain is Unlocking $230T in Global Liquidity",
      category: "Industry Insights",
      date: "March 18, 2025",
      excerpt: "Asset tokenization is transforming real estate, private equity, and debt markets. Discover how blockchain enables fractional ownership, instant settlement, and new liquidity.",
      readTime: "10 min read",
      featured: true
    },
    {
      id: 3,
      slug: "lps-demand-real-time-portfolio-access",
      title: "Why 76% of LPs Now Demand Real-Time Portfolio Access (And How to Deliver It)",
      category: "Platform Features",
      date: "March 15, 2025",
      excerpt: "Limited partners expect instant portfolio visibility, not quarterly PDF reports. Learn how modern investor portals boost transparency, reduce inquiries, and build LP confidence.",
      readTime: "7 min read",
      featured: true
    },
    {
      id: 4,
      slug: "managing-global-investor-bases-cross-border-compliance",
      title: "Managing Global Investor Bases: 7 Cross-Border Compliance Challenges Solved",
      category: "Compliance & Regulation",
      date: "March 12, 2025",
      excerpt: "International investors bring capital—and compliance complexity. Navigate multi-jurisdiction KYC/AML, tax reporting, and payment processing with modern infrastructure.",
      readTime: "9 min read",
      featured: false
    },
    {
      id: 5,
      slug: "real-time-analytics-transform-pe-decisions",
      title: "From Gut Instinct to Data-Driven: How Real-Time Analytics Transform PE Decisions",
      category: "Platform Features",
      date: "March 10, 2025",
      excerpt: "Real-time analytics enable investment managers to spot portfolio risks early, optimize capital deployment, and demonstrate value to LPs with data—not narratives.",
      readTime: "8 min read",
      featured: false
    },
    {
      id: 6,
      slug: "evergreen-funds-vs-closed-end-hybrid-structures",
      title: "Evergreen Funds vs. Closed-End: Why 47% of Investors Prefer Hybrid Structures",
      category: "Industry Insights",
      date: "March 8, 2025",
      excerpt: "Investor demand for liquidity is reshaping fund structures. Explore evergreen funds, continuation vehicles, and hybrid models gaining traction in 2025.",
      readTime: "9 min read",
      featured: false
    },
    {
      id: 7,
      slug: "emerging-managers-compete-institutional-infrastructure",
      title: "How Emerging Managers Compete with Institutional Infrastructure on Startup Budgets",
      category: "Fundraising",
      date: "March 5, 2025",
      excerpt: "First-time fund managers face institutional LP expectations without institutional budgets. Modern platforms deliver enterprise-grade operations at emerging manager pricing.",
      readTime: "8 min read",
      featured: false
    },
    {
      id: 8,
      slug: "digital-subscription-management-cuts-onboarding-time",
      title: "Digital Subscription Management: How Modern Platforms Cut Investor Onboarding Time by 75%",
      category: "Platform Features",
      date: "March 3, 2025",
      excerpt: "Discover how digital subscription management automates investor onboarding, reduces processing time by 75%, and ensures KYC/AML compliance across 300+ watchlists.",
      readTime: "8 min read",
      featured: false
    },
    {
      id: 9,
      slug: "capital-call-crisis-manual-processes-cost-50k",
      title: "The Capital Call Crisis: Why Manual Processes Are Costing Fund Managers $50K+ Annually",
      category: "Fund Administration",
      date: "February 28, 2025",
      excerpt: "Manual capital call management creates calculation errors, payment delays, and reconciliation nightmares. Learn how automation saves fund managers $50K+ annually.",
      readTime: "9 min read",
      featured: false
    },
    {
      id: 10,
      slug: "waterfall-calculation-errors-cost-100k-remediation",
      title: "Waterfall Calculation Errors Cost Funds $100K+ in Remediation—Here's How to Prevent Them",
      category: "Fund Administration",
      date: "February 25, 2025",
      excerpt: "Waterfall distribution errors create costly remediation, tax complications, and LP disputes. Learn how automated calculations prevent mistakes and protect fund integrity.",
      readTime: "10 min read",
      featured: false
    },
    {
      id: 11,
      slug: "multi-currency-fund-management-save-90-percent",
      title: "Multi-Currency Fund Management: How to Save 90% on Cross-Border Payments",
      category: "Cross-Border Payments",
      date: "February 22, 2025",
      excerpt: "International investors and cross-border payments create massive fee burdens. Learn how stablecoin payment rails reduce costs by 90% while accelerating settlement.",
      readTime: "9 min read",
      featured: false
    },
    {
      id: 12,
      slug: "investor-portal-revolution-lps-demand-transparency",
      title: "The Investor Portal Revolution: Why LPs Now Demand Real-Time Transparency",
      category: "Platform Features",
      date: "February 20, 2025",
      excerpt: "Limited partners increasingly demand real-time portfolio access and transparency. Learn why investor portals are becoming table-stakes for fundraising success.",
      readTime: "9 min read",
      featured: false
    },
    {
      id: 13,
      slug: "fund-formation-budget-15k-instead-150k",
      title: "Fund Formation on a Budget: How Emerging Managers Launch with $15K Instead of $150K",
      category: "Industry Insights",
      date: "February 18, 2025",
      excerpt: "Traditional fund formation costs $75K-$150K, pricing out emerging managers. Learn how modern platforms enable professional launches at 80-90% lower cost.",
      readTime: "9 min read",
      featured: false
    },
    {
      id: 14,
      slug: "nav-calculation-accuracy-40-percent-get-it-wrong",
      title: "NAV Calculation Accuracy: Why 40% of Private Funds Get Quarterly Valuations Wrong",
      category: "Fund Administration",
      date: "February 15, 2025",
      excerpt: "NAV calculation errors create audit issues, LP disputes, and compliance risks. Learn how automation eliminates the 40% error rate in manual quarterly valuations.",
      readTime: "10 min read",
      featured: false
    },
    {
      id: 15,
      slug: "digital-signatures-legal-enforceability-esign-eidas",
      title: "Digital Signatures with Legal Enforceability: ESIGN and eIDAS",
      category: "Compliance & Regulation",
      date: "February 12, 2025",
      excerpt: "What makes a digital signature legally binding? Understanding IP recording, document sealing, and electronic signature compliance standards.",
      readTime: "10 min read",
      featured: false
    },
    {
      id: 16,
      slug: "side-letter-chaos-fund-managers-lose-track-investor-privileges",
      title: "Side Letter Chaos: Fund Managers Struggle with Investor Privilege Tracking",
      category: "Compliance & Regulation",
      date: "November 3, 2025",
      excerpt: "Manual side letter management creates compliance nightmares and MFN clause violations. Learn how digital systems track investor privileges and prevent costly disputes.",
      readTime: "9 min read",
      featured: false
    },
    {
      id: 17,
      slug: "hidden-cost-investor-relations-quarterly-reporting-challenge",
      title: "The Hidden Cost of Investor Relations: 70% of GPs Name Quarterly Reporting as Top Challenge",
      category: "Fund Administration",
      date: "October 28, 2025",
      excerpt: "Quarterly reporting consumes 35% of GP operational time while LPs demand faster delivery. Discover how automation transforms investor relations efficiency.",
      readTime: "8 min read",
      featured: false
    },
    {
      id: 18,
      slug: "gp-led-secondaries-surge-75b-market-liquidity-options",
      title: "GP-Led Secondaries Surge: $75B Market Creates New Liquidity Options for Stalled Exits",
      category: "Industry Insights",
      date: "October 15, 2025",
      excerpt: "Continuation vehicles offer exit alternatives as traditional IPO/M&A markets slow. Explore how GP-led secondaries provide liquidity while extending hold periods.",
      readTime: "10 min read",
      featured: false
    },
    {
      id: 19,
      slug: "portfolio-company-distress-pe-restructuring-playbook-2025",
      title: "Portfolio Company Distress: Private Equity's Restructuring Playbook for 2025",
      category: "Industry Insights",
      date: "September 20, 2025",
      excerpt: "Rising interest rates and market volatility trigger portfolio company stress. Learn PE's restructuring strategies from covenant amendments to distressed exchanges.",
      readTime: "10 min read",
      featured: false
    },
    {
      id: 20,
      slug: "esg-reporting-without-mandates-89-percent-investors-demand",
      title: "ESG Reporting Without Mandates: Why 88% of Institutional Investors Increased ESG Use",
      category: "Compliance & Regulation",
      date: "September 5, 2025",
      excerpt: "Despite regulatory rollbacks, LP investors drive ESG disclosure requirements. Navigate investor-led ESG demands with practical reporting frameworks.",
      readTime: "9 min read",
      featured: false
    }
  ];

  // Filter posts by selected category
  const filteredPosts = selectedCategory === "All Posts"
    ? blogPosts
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const recentPosts = filteredPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">PoliBit Blog</h1>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
            Insights on cross-border payments, institutional-grade fund administration, and modern investment technology
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === selectedCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Featured Articles</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {featuredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span className="text-sm text-muted-foreground">{post.readTime}</span>
                  </div>
                  <CardTitle className="text-xl mb-2 line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-3">
                    {post.date}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                  {post.slug ? (
                    <Button variant="link" className="mt-4 px-0" asChild>
                      <Link href={`/blog/${post.slug}`}>Read More →</Link>
                    </Button>
                  ) : (
                    <Button variant="link" className="mt-4 px-0" disabled>
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section className={`py-16 ${featuredPosts.length > 0 ? 'bg-muted/30' : ''}`}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">{featuredPosts.length > 0 ? 'Recent Posts' : 'All Posts'}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {recentPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{post.category}</Badge>
                    <span className="text-sm text-muted-foreground">{post.readTime}</span>
                  </div>
                  <CardTitle className="text-lg mb-2 line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-3">
                    {post.date}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-3">{post.excerpt}</p>
                  {post.slug ? (
                    <Button variant="link" className="mt-4 px-0 text-sm" asChild>
                      <Link href={`/blog/${post.slug}`}>Read More →</Link>
                    </Button>
                  ) : (
                    <Button variant="link" className="mt-4 px-0 text-sm" disabled>
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        </section>
      )}

      {/* No Posts Message */}
      {featuredPosts.length === 0 && recentPosts.length === 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xl text-muted-foreground">No posts found in this category.</p>
          </div>
        </section>
      )}


      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold mb-4">Industries</h3>
              <div className="space-y-2">
                <Link href="/real-estate-investment-platform" className="block hover:text-white transition-colors">Real Estate</Link>
                <Link href="/private-equity-investment-platform" className="block hover:text-white transition-colors">Private Equity</Link>
                <Link href="/private-debt-investment-platform" className="block hover:text-white transition-colors">Private Debt</Link>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Features</h3>
              <div className="space-y-2">
                <Link href="/investment-platform" className="block hover:text-white transition-colors">Platform Overview</Link>
                <Link href="/fundraising-and-capital-raising" className="block hover:text-white transition-colors">Fundraising & Capital Raising</Link>
                <Link href="/investor-portal" className="block hover:text-white transition-colors">Investor Portal</Link>
                <Link href="/fund-administration-and-operations" className="block hover:text-white transition-colors">Fund Administration & Operations</Link>
                <Link href="/investment-reporting-and-analytics" className="block hover:text-white transition-colors">Reporting & Analytics</Link>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Resources</h3>
              <div className="space-y-2">
                <Link href="/blog" className="block hover:text-white transition-colors">Blog</Link>
                <Link href="/customer-success-stories" className="block hover:text-white transition-colors">Customer Success Stories</Link>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Company</h3>
              <div className="space-y-2">
                <Link href="/about-us" className="block hover:text-white transition-colors">About Us</Link>
                <Link href="/free-demo" className="block hover:text-white transition-colors">Contact</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-12 pt-8 text-center">
            <p>&copy; 2025 PoliBit. All rights reserved. | <Link href="/privacy-policy">Privacy Policy</Link> | <Link href="/terms-of-service">Terms of Service</Link></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
