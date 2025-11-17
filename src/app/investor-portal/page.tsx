import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Header } from "@/components/header";

export default function InvestorPortal() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">White Label Investor Portal</h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Empower your investors with 24/7 access to their portfolios through a branded, self-service portal that delivers transparency and reduces operational burden.
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
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Portfolio Access</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-muted-foreground">International Investor Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">Real-Time</div>
              <div className="text-muted-foreground">Performance Updates</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">60%</div>
              <div className="text-muted-foreground">Reduction in Support Inquiries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Complete Investor Self-Service Experience</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Give your investors the transparency and control they expect with a fully branded portal
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: "🎨",
                title: "White Label Portal Experience",
                desc: "Fully customizable investor portal that matches your brand identity and reinforces your professional image.",
                benefits: ["Custom branding with your logo and colors", "Branded domain (investors.yourfund.com)", "Personalized email communications", "Multi-language support for global investors", "Mobile-responsive design"]
              },
              {
                icon: "📊",
                title: "Real-Time Portfolio Access",
                desc: "Investors can view their complete investment portfolio, performance metrics, and account details 24/7 from anywhere.",
                benefits: ["Live portfolio valuation and performance", "Investment history and transaction details", "Capital commitment tracking", "Distribution payment history", "Document library access"]
              },
              {
                icon: "💳",
                title: "E-Commerce Style Investment Purchase",
                desc: "Allow investors to browse opportunities and complete investments with a modern checkout experience using multiple payment methods.",
                benefits: ["Investment opportunity marketplace", "Multiple payment methods: ACH, cards, and stablecoins", "Cross-border payment support for international investors", "Instant payment verification", "Automated subscription processing"]
              },
              {
                icon: "📄",
                title: "Digital Document Center",
                desc: "Centralized document management with digital signature capabilities for seamless investor communications.",
                benefits: ["Digital signature integration", "Automated document distribution", "Tax document delivery (K-1s, 1099s)", "Quarterly and annual reports", "Secure document storage"]
              },
              {
                icon: "🔔",
                title: "Automated Investor Communications",
                desc: "Keep investors informed with automated notifications and updates without manual effort from your team.",
                benefits: ["Capital call notifications", "Distribution announcements", "Portfolio update alerts", "Document availability notifications", "Custom announcement broadcasts"]
              },
              {
                icon: "🌍",
                title: "International Investor Support",
                desc: "Seamless experience for global investors with multi-currency, cross-border payments, and international compliance.",
                benefits: ["Multi-currency display and reporting", "Cross-border stablecoin payments", "International wire transfer support", "Multi-language interface", "Global time zone aware notifications"]
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
            <h2 className="text-4xl font-bold mb-4">Why Investment Managers Choose PoliBit&apos;s Investor Portal</h2>
            <p className="text-xl text-muted-foreground">Transform investor relations from operational burden to competitive advantage</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Reduced Operational Burden",
                desc: "Eliminate repetitive investor inquiries and manual processes, freeing your team to focus on investment strategy.",
                features: ["60% reduction in support inquiries", "Automated document distribution", "Self-service portfolio access", "Streamlined capital call communications"]
              },
              {
                title: "Enhanced Investor Satisfaction",
                desc: "Deliver the transparency and accessibility that modern investors expect, strengthening relationships and retention.",
                features: ["24/7 portfolio access from anywhere", "Real-time performance updates", "Instant document availability", "Professional branded experience"]
              },
              {
                title: "Global Investor Scalability",
                desc: "Support international investors seamlessly with multi-currency, cross-border payments, and localized experiences.",
                features: ["95% international investor rate", "Cross-border stablecoin payments", "Multi-language support", "Global compliance capabilities"]
              },
              {
                title: "Professional Brand Image",
                desc: "Present a sophisticated, institutional-grade experience that reinforces confidence in your fund management.",
                features: ["Fully white label branding", "Custom domain and emails", "Professional mobile experience", "Consistent brand touchpoints"]
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
          <h2 className="text-4xl font-bold mb-4">Ready to Elevate Your Investor Experience?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join investment managers who are delivering institutional-grade transparency with PoliBit&apos;s investor portal
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
