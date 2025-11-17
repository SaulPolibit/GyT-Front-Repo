import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Header } from "@/components/header";

export default function PrivateDebt() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Private Debt Fund Management Platform</h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Optimize your private credit operations with specialized debt fund administration, borrower management, and sophisticated risk monitoring tools for modern debt managers.
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
            <h2 className="text-4xl font-bold mb-4">Complete Private Debt Operations Suite</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From origination to workout, manage every aspect of your debt funds with specialized credit management tools
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Loan Origination & Underwriting",
                desc: "Streamline loan origination with digital workflows and comprehensive risk assessment tools.",
                features: ["Digital loan applications", "Credit risk modeling", "Automated underwriting", "Due diligence workflows", "Approval process management"]
              },
              {
                title: "Portfolio Monitoring & Surveillance",
                desc: "Monitor loan performance with real-time dashboards and early warning systems.",
                features: ["Real-time portfolio monitoring", "Covenant tracking", "Early warning systems", "Performance analytics", "Risk dashboard reporting"]
              },
              {
                title: "Cash Flow & Payment Management",
                desc: "Automate payment processing and cash flow management across your debt portfolio.",
                features: ["Automated payment processing", "Interest calculations", "Principal tracking", "Cash flow forecasting", "Distribution automation"]
              },
              {
                title: "Risk Management & Analytics",
                desc: "Comprehensive risk management with advanced analytics and stress testing capabilities.",
                features: ["Credit risk assessment", "Concentration analysis", "Stress testing tools", "Default probability modeling", "Loss given default analysis"]
              },
              {
                title: "Borrower Relations & Servicing",
                desc: "Maintain strong borrower relationships with comprehensive loan servicing and communication tools.",
                features: ["Borrower portal access", "Loan servicing automation", "Payment scheduling", "Account management", "Customer support tools"]
              },
              {
                title: "Regulatory Compliance & Reporting",
                desc: "Ensure regulatory compliance with automated reporting and comprehensive audit trails.",
                features: ["Regulatory reporting automation", "Compliance monitoring", "Audit trail management", "Risk-based reporting", "Documentation management"]
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
            <h2 className="text-4xl font-bold mb-4">Why Private Debt Managers Choose PoliBit</h2>
            <p className="text-xl text-muted-foreground">Discover the specialized advantages that drive superior debt fund performance and risk management</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Enhanced Risk Management",
                desc: "Sophisticated risk analytics and monitoring tools to optimize portfolio performance and minimize losses.",
                features: ["Advanced credit risk modeling", "Real-time risk monitoring", "Early warning systems", "Stress testing capabilities"]
              },
              {
                title: "Operational Excellence",
                desc: "Streamline debt fund operations with automated loan servicing and payment management.",
                features: ["Automated loan processing", "Streamlined workflows", "Reduced operational overhead", "Improved accuracy"]
              },
              {
                title: "Superior Investor Reporting",
                desc: "Deliver institutional-quality reporting with comprehensive analytics and transparent performance metrics.",
                features: ["Detailed portfolio analytics", "Risk-adjusted returns", "Comprehensive fund reports", "Transparent communication"]
              },
              {
                title: "Scalable Credit Platform",
                desc: "Scale your debt fund operations efficiently as you grow AUM and expand your lending portfolio.",
                features: ["Multi-strategy support", "Portfolio scaling tools", "Institutional infrastructure", "Growth-ready systems"]
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
          <h2 className="text-4xl font-bold mb-4">Ready to Optimize Your Debt Fund Operations?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join leading private debt managers who trust PoliBit for specialized credit fund management
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