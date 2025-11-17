import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Header } from "@/components/header";

import data from "../dashboard/investment-data.json";
import Link from "next/link";

export default function Platform() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Complete Multi-Asset Investment Platform</h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            White label platform for real estate, private equity, and private debt with end-to-end automation, cross-border capabilities, and institutional-grade operations
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/free-demo">See Demo</Link>
          </Button>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto px-2">
            <div className="bg-background/95 backdrop-blur rounded-xl border shadow-2xl overflow-hidden">
              <div className="h-[600px] md:h-[700px] lg:h-[800px] w-full">
                <SidebarProvider
                  className="h-full"
                  style={{
                    "--sidebar-width": "12rem",
                    "--header-height": "calc(var(--spacing) * 12)",
                  } as React.CSSProperties}
                >
                  <AppSidebar className="hidden md:flex pointer-events-none" />
                  <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-border shrink-0 pointer-events-none">
                      <SiteHeader />
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 p-2 md:p-4 min-w-0 overflow-y-scroll scrollbar-visible">
                      <div className="space-y-4 md:space-y-6 min-w-0 pointer-events-none" style={{ minHeight: '1500px', paddingBottom: '100px' }}>
                        <div className="min-w-0">
                          <SectionCards />
                        </div>
                        <div className="px-0 lg:px-2 min-w-0">
                          <ChartAreaInteractive />
                        </div>
                        <div className="min-h-[800px]">
                          <DataTable data={data} />
                        </div>
                      </div>
                    </div>
                  </main>
                </SidebarProvider>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Walkthrough */}
      <section id="platform-walkthrough" className="py-20 bg-background scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How PoliBit Works: End-to-End Platform Walkthrough</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See the complete investor journey and investment manager experience from login to distribution
            </p>
          </div>

          {/* Investor Experience */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">1</div>
              <h3 className="text-3xl font-bold">Investor Experience</h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Secure Login & MFA",
                  highlights: ["Email/password login", "SMS code verification", "Institutional security standards"]
                },
                {
                  step: "2",
                  title: "KYC/AML Verification",
                  highlights: ["QR code scan with phone", "Live ID photo capture", "Live selfie verification", "300+ international watchlists", "OFAC, UN sanctions, PEP databases"]
                },
                {
                  step: "3",
                  title: "Browse Opportunities",
                  highlights: ["Investment information", "Performance data", "Target returns & risk profiles", "Due diligence materials"]
                },
                {
                  step: "4",
                  title: "E-Commerce Checkout",
                  highlights: ["Select investment amount", "Review summary & fees", "Apply discounts/early-bird terms", "See projected returns"]
                },
                {
                  step: "5",
                  title: "Digital Contract Signing",
                  highlights: ["Review subscription agreements", "Upload accreditation docs", "IP address & timestamp recorded", "Legally binding (ESIGN, eIDAS)"]
                },
                {
                  step: "6",
                  title: "Multi-Rail Payments",
                  highlights: ["ACH, cards, wire transfers", "Stablecoin payments", "Up to 90% cost savings", "Instant webhook verification"]
                },
                {
                  step: "7",
                  title: "Automated Approval",
                  highlights: ["Email notification", "Instant token assignment", "Blockchain confirmation", "Complete audit trail"]
                },
                {
                  step: "8",
                  title: "Portfolio & Wallet",
                  highlights: ["Embedded blockchain wallet", "Real-time performance metrics", "Transaction history", "Blockchain transparency"]
                },
                {
                  step: "9",
                  title: "Returns & Distributions",
                  highlights: ["Automated return calculations", "Distribution history", "Stablecoin to embedded wallet", "Cash-on-cash, IRR, equity multiple"]
                },
                {
                  step: "10",
                  title: "Communications & Docs",
                  highlights: ["Project updates & milestones", "In-platform chat support", "K-1s & quarterly reports", "24/7 document access"]
                }
              ].map((item) => (
                <Card key={item.step} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                        {item.step}
                      </div>
                      <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {item.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start text-sm text-muted-foreground">
                          <span className="text-primary mr-2 flex-shrink-0">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Investment Manager Experience */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">2</div>
              <h3 className="text-3xl font-bold">Investment Manager Experience</h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Administrator Dashboard",
                  highlights: ["Real-time fund visibility", "Investors by project", "Capital commitments & calls", "KYC verification status", "Document repository"]
                },
                {
                  step: "2",
                  title: "One-Click Approvals",
                  highlights: ["Dedicated approval queue", "Automated webhook verification", "Instant token assignment", "Complete audit trail", "Regulatory compliance tracking"]
                },
                {
                  step: "3",
                  title: "Investor Support Center",
                  highlights: ["Built-in chat system", "Full conversation history", "Broadcast announcements", "Response time analytics", "Compliance interaction logs"]
                },
                {
                  step: "4",
                  title: "Return Automation",
                  highlights: ["Multi-tier preferred returns", "8%, 12% hurdles, 80/20 splits", "Catch-up provisions", "Deal-by-deal & whole-fund", "Side letters & clawbacks"]
                },
                {
                  step: "5",
                  title: "Multi-Rail Distributions",
                  highlights: ["Automated return calculations", "Stablecoin to embedded wallets", "Up to 90% cost savings", "ACH/wire batching", "Automated reconciliation"]
                },
                {
                  step: "6",
                  title: "Institutional Administration",
                  highlights: ["Manage multiple funds and investment vehicles (SPVs, trusts/fideicomisos, corporations/S.A., etc.) simultaneously", "Automated tax reporting", "Multi-jurisdiction compliance validation", "Private Secondary Market (peer-to-peer trading) & ROFR", "Comprehensive audit trails"]
                },
                {
                  step: "7",
                  title: "White-Label & API",
                  highlights: ["Custom branding & domain", "Logo, colors, typography", "REST API integrations", "Banking & accounting systems", "Payment rail configuration"]
                }
              ].map((item) => (
                <Card key={item.step} className="hover:shadow-lg transition-shadow border-t-4 border-t-green-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                        {item.step}
                      </div>
                      <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {item.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start text-sm text-muted-foreground">
                          <span className="text-green-600 mr-2 flex-shrink-0">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Investment Operations?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            See how PoliBit&apos;s white label platform automates complex operations, enables cross-border payments, and validates institutional-grade compliance requirements
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/free-demo">Schedule Your Demo</Link>
          </Button>
        </div>
      </section>

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
                <Link href="/contact" className="block hover:text-white transition-colors">Contact</Link>
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