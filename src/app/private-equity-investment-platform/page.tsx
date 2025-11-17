import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Header } from "@/components/header";

export default function PrivateEquity() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Private Equity Fund Management Platform</h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Streamline your private equity operations with institutional-grade fund administration, LP relations, and portfolio management tools designed for modern investment managers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/free-demo">Get Free Demo</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-ring hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/investment-platform">Explore Features</Link>
            </Button>
          </div>
        </div>
      </section>


      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Complete Private Equity Operations Suite</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From fundraising to exit, manage every aspect of your private equity funds with institutional precision
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Fund Formation & Fundraising",
                desc: "Streamline fund formation with digital LP onboarding and automated subscription management.",
                features: ["LP subscription automation", "Commitment tracking", "Digital data rooms", "Regulatory compliance", "Fund closing management"]
              },
              {
                title: "Capital Call Management",
                desc: "Automate capital call processes with precise calculations and streamlined LP communications.",
                features: ["Automated capital call calculations", "LP notification systems", "Payment tracking", "Default management", "Wire transfer coordination"]
              },
              {
                title: "Portfolio Company Management",
                desc: "Track and optimize portfolio company performance with comprehensive monitoring tools.",
                features: ["Portfolio company tracking", "Performance monitoring", "Valuation management", "Board management tools", "Exit planning support"]
              },
              {
                title: "LP Relations & Reporting",
                desc: "Maintain exceptional LP relationships with transparent reporting and communication tools.",
                features: ["LP portal access", "Quarterly fund reports", "Performance dashboards", "Document management", "Communication center"]
              },
              {
                title: "Fund Accounting & NAV",
                desc: "Automate complex fund accounting with accurate NAV calculations and financial reporting.",
                features: ["NAV calculations", "Fund accounting automation", "Financial statement generation", "Cash flow management", "Audit trail maintenance"]
              },
              {
                title: "Compliance & Tax Services",
                desc: "Ensure regulatory compliance with automated tax reporting and audit support.",
                features: ["Automated tax document generation", "Tax reporting and calculations", "Regulatory filings", "Audit support", "Compliance monitoring"]
              }
            ].map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-primary rounded"></div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="mt-2">{feature.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item) => (
                      <li key={item} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
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
            <h2 className="text-4xl font-bold mb-4">Why Private Equity Firms Choose PoliBit</h2>
            <p className="text-xl text-muted-foreground">Discover the institutional-grade advantages that drive superior fund performance</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Institutional-Grade Operations",
                desc: "Deliver the operational excellence that sophisticated LPs expect with enterprise-level fund administration.",
                features: ["Automated fund accounting", "Professional reporting standards", "Institutional data security", "Scalable infrastructure"]
              },
              {
                title: "Enhanced LP Satisfaction",
                desc: "Strengthen LP relationships with transparent reporting and superior communication tools.",
                features: ["Real-time performance access", "Professional quarterly reports", "Responsive investor portal", "Proactive communication"]
              },
              {
                title: "Operational Efficiency Gains",
                desc: "Reduce operational overhead by up to 60% while improving accuracy and speed of fund operations.",
                features: ["Automated workflows", "Reduced manual processes", "Faster reporting cycles", "Streamlined operations"]
              },
              {
                title: "Scalable Fund Growth",
                desc: "Scale your fund operations efficiently as you grow AUM and expand your LP base.",
                features: ["Multi-fund management", "LP base expansion support", "Portfolio scaling tools", "Growth-ready infrastructure"]
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
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
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
          <h2 className="text-4xl font-bold mb-4">Ready to Elevate Your Fund Operations?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join leading private equity firms who trust PoliBit for institutional-grade fund management
          </p>
          <Button size="lg" variant="secondary">Schedule Your Free Demo Today</Button>
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