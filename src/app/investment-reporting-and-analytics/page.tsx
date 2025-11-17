import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Header } from "@/components/header";

export default function ReportingAnalytics() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Investment Reporting & Analytics</h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Deliver institutional-quality reporting with real-time analytics and automated report generation that eliminates manual work and strengthens investor confidence.
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
              <div className="text-4xl font-bold text-primary mb-2">Real-Time</div>
              <div className="text-muted-foreground">Portfolio Analytics</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">Automated</div>
              <div className="text-muted-foreground">Report Generation</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">90%</div>
              <div className="text-muted-foreground">Faster Reporting Cycles</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">Multi-Currency</div>
              <div className="text-muted-foreground">Global Reporting</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comprehensive Reporting & Analytics Suite</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From real-time dashboards to automated investor reports, deliver transparency and insights effortlessly
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: "📊",
                title: "Real-Time Performance Dashboards",
                desc: "Monitor portfolio performance with live dashboards that provide instant visibility into fund metrics and investment performance.",
                benefits: ["Live portfolio valuation and performance", "Real-time cash position tracking", "Investment-level performance metrics", "Customizable dashboard views", "Multi-fund consolidated reporting"]
              },
              {
                icon: "📄",
                title: "Automated Investor Reporting",
                desc: "Generate professional quarterly and annual reports automatically, eliminating hours of manual report preparation.",
                benefits: ["Automated quarterly report generation", "Customizable report templates", "One-click report distribution", "Historical report archive", "Investor-specific reporting views"]
              },
              {
                icon: "💹",
                title: "Portfolio Analytics & Insights",
                desc: "Deep analytics on portfolio performance, concentration, and trends to support data-driven investment decisions.",
                benefits: ["Portfolio concentration analysis", "Performance attribution reporting", "Investment trend analytics", "Risk metrics and monitoring", "Comparative performance analysis"]
              },
              {
                icon: "🌍",
                title: "Multi-Currency & International Reporting",
                desc: "Support global investors with multi-currency reporting and international accounting standards compliance.",
                benefits: ["Multi-currency display and reporting", "Automated currency conversion", "International accounting standards", "Cross-border transaction reporting", "Global investor base analytics"]
              },
              {
                icon: "📈",
                title: "Custom Report Builder",
                desc: "Create custom reports tailored to your specific needs with flexible data selection and formatting options.",
                benefits: ["Drag-and-drop report builder", "Custom metrics and calculations", "Flexible date range selection", "Export to Excel, PDF, and CSV", "Scheduled report delivery"]
              },
              {
                icon: "🔍",
                title: "Transaction & Audit Trail Reporting",
                desc: "Complete transparency with detailed transaction history and comprehensive audit trails for compliance and reconciliation.",
                benefits: ["Complete transaction history", "Audit trail documentation", "Reconciliation reports", "Capital activity tracking", "Distribution history reports"]
              }
            ].map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-2xl">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="mt-2">{feature.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((item) => (
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

      {/* Benefits Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Investment Managers Choose PoliBit for Reporting & Analytics</h2>
            <p className="text-xl text-muted-foreground">Transform reporting from time-consuming burden to strategic advantage</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Eliminate Manual Report Preparation",
                desc: "Reduce reporting time by 90% with automated report generation and one-click distribution to investors.",
                features: ["No more manual Excel report creation", "Automated data aggregation", "One-click report distribution", "90% faster reporting cycles"]
              },
              {
                title: "Real-Time Transparency",
                desc: "Give investors and internal teams instant access to current portfolio performance and metrics.",
                features: ["Live portfolio dashboards", "Real-time performance updates", "Instant data availability", "24/7 investor access"]
              },
              {
                title: "Global Investor Support",
                desc: "Serve international investors with multi-currency reporting and localized financial presentations.",
                features: ["Multi-currency reporting", "International accounting standards", "Cross-border transaction reporting", "Global investor analytics"]
              },
              {
                title: "Data-Driven Decision Making",
                desc: "Make informed investment decisions with comprehensive analytics and portfolio insights.",
                features: ["Portfolio concentration analysis", "Performance attribution", "Risk metrics monitoring", "Investment trend analytics"]
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
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Investment Reporting?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join investment managers who are delivering institutional-quality reporting with PoliBit&apos;s automated analytics
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
