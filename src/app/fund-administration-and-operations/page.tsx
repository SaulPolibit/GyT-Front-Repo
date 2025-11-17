import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Header } from "@/components/header";

export default function FundAdministration() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Institutional-Grade Fund Administration</h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Handle sophisticated return structures, complex calculations, and multi-fund operations at scale with accuracy and audit trails that withstand regulatory examination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/free-demo">Get Free Demo</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-ring hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/investment-platform">Explore Platform</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">Up to 90%</div>
              <div className="text-muted-foreground">Lower Cross-Border Transfer Costs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">80%</div>
              <div className="text-muted-foreground">Reduction in Manual Processes</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">Automated</div>
              <div className="text-muted-foreground">Return Calculations</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">Real-Time</div>
              <div className="text-muted-foreground">Payment Reconciliation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comprehensive Fund Operations Automation</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline every aspect of fund administration with intelligent automation and cross-border capabilities
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: "💰",
                title: "Automated Return Calculations",
                desc: "Calculate returns for any investment structure - from simple fixed-interest debt to complex multi-tier waterfalls with preferred returns, catch-ups, and clawback provisions.",
                benefits: [
                  { header: "Return Calculation Capabilities", items: ["Simple fixed-interest and equity distributions to complex multi-tier waterfalls", "Multi-tier hurdles (8%, 12%, splits), catch-ups, carried interest, and clawback provisions"] },
                  { header: "Structure Flexibility", items: ["Deal-by-deal vs. whole-fund structures, European vs. American methodologies", "Multiple share classes, side letters, and special term accommodations"] },
                  { header: "Specialized Structures", items: ["Real estate promotes with IRR-based tiers and promote structures", "Construction loans, mezzanine debt, and priority layer calculations"] },
                  { header: "Advanced Features", items: ["Mid-stream investor entries at different valuations", "GP recapture and complex clawback provisions"] }
                ]
              },
              {
                icon: "💳",
                title: "Multi-Rail Payment Processing",
                desc: "Process distributions through multiple payment methods including ACH, cards, and stablecoins for seamless cross-border payments.",
                benefits: ["Multiple payment methods: ACH, cards, and stablecoins", "Cross-border stablecoin payments", "Automated payment reconciliation", "Instant payment verification via webhooks", "Up to 90% lower international transfer costs"]
              },
              {
                icon: "📊",
                title: "Capital Account Management",
                desc: "Automatically track capital contributions, distributions, and investor account balances with real-time accuracy.",
                benefits: ["Real-time capital account tracking", "Contribution and distribution history", "Commitment vs. funded tracking", "Multi-investment portfolio support", "Automated account statements"]
              },
              {
                icon: "🔄",
                title: "Transaction Processing & Reconciliation",
                desc: "Automate transaction processing with instant verification and reconciliation across multiple payment rails.",
                benefits: ["Automated transaction recording", "Real-time payment reconciliation", "Bank integration support", "Multi-currency transaction handling", "Automated error detection and alerts"]
              },
              {
                icon: "📝",
                title: "Compliance & Tax Administration",
                desc: "Streamline tax reporting and regulatory compliance with automated document generation and comprehensive audit trails.",
                benefits: ["Automated tax document generation", "Multi-jurisdiction tax reporting", "Regulatory compliance tracking", "Investment performance reporting", "Complete audit trail documentation"]
              },
              {
                icon: "🌍",
                title: "International Operations Support",
                desc: "Manage global fund operations with multi-currency support, cross-border payments, and international compliance.",
                benefits: ["Multi-currency display and calculations", "Cross-border payment optimization", "International tax compliance", "Multi-country regulatory support", "Global investor base management"]
              },
              {
                icon: "🔄",
                title: "Private Secondary Market (peer-to-peer trading) & Liquidity",
                badge: "Coming Soon",
                desc: "Enable peer-to-peer trading of investment positions, providing liquidity options for investors and reducing redemption pressure on the fund.",
                benefits: ["P2P secondary trading marketplace", "Transfer and assignment processing", "Lock-up period configuration", "Right of first refusal (ROFR) management", "GP approval workflows for transfers", "Automated transfer documentation"]
              },
              {
                icon: "🏦",
                title: "Collateralization & Asset-Backed Financing",
                badge: "Coming Soon",
                desc: "Enable your investors to use their investment positions as collateral for debt financing while maintaining automated tracking and compliance.",
                benefits: ["Enable third-party position collateralization for investors", "Lien tracking and management", "Collateral valuation monitoring", "Automated lender reporting", "Margin call alerts and management", "Release of collateral processing"]
              }
            ].map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-2xl">
                    {feature.icon}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    {feature.badge && (
                      <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">{feature.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feature.benefits.map((item, idx) => (
                      typeof item === 'string' ? (
                        <div key={idx} className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                          {item}
                        </div>
                      ) : (
                        <div key={idx} className="space-y-2">
                          <div className="font-semibold text-sm">{item.header}</div>
                          <ul className="space-y-2">
                            {item.items.map((subItem, subIdx) => (
                              <li key={subIdx} className="flex items-start text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0 mt-1.5"></div>
                                <span>{subItem}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Investment Managers Choose PoliBit for Administration & Operations</h2>
            <p className="text-xl text-muted-foreground">Transform fund operations from manual burden to competitive advantage</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Eliminate Manual Processes",
                desc: "Reduce operational burden by 80% with automated return calculations, payment processing, and compliance reporting.",
                features: ["Automated return calculations", "One-click distribution processing", "Automated tax document generation", "Real-time payment reconciliation"]
              },
              {
                title: "Institutional-Grade Accuracy",
                desc: "Handle sophisticated structures with zero calculation errors, supporting complex return structures that simple platforms can't manage.",
                features: ["Multi-tier preferred returns and catch-up provisions", "Side letter accommodations", "Deal-by-deal and whole-fund structures", "Mid-stream investor entries and exits", "Clawback provisions and GP recapture"]
              },
              {
                title: "Scale Without Complexity",
                desc: "Manage multiple funds and investment vehicles with different terms, investors, and compliance requirements without adding headcount.",
                features: ["Manage multiple funds and investment vehicles (SPVs, trusts/fideicomisos, corporations/S.A., etc.) simultaneously", "Zero calculation errors across complex structures", "Investors with different entry dates and terms", "Real-time multi-fund consolidated reporting"]
              },
              {
                title: "Regulatory Compliance Built-In",
                desc: "Complete audit trails and compliance reporting that withstands regulatory examination, not just basic bookkeeping.",
                features: ["Comprehensive audit trail documentation", "Industry standard compliance reporting", "Regulatory guideline adherence", "Automated tax document generation", "Multi-jurisdiction compliance validation support"]
              }
            ].map((benefit) => (
              <Card key={benefit.title} className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  <CardDescription className="mt-2">{benefit.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {benefit.features.map((item) => (
                      <li key={item} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready for Institutional-Grade Fund Administration?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join investment managers who trust PoliBit for sophisticated return automation and comprehensive compliance
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/free-demo">Schedule Your Free Demo Today</Link>
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
