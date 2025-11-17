import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Header } from "@/components/header";

export default function RealEstate() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Real Estate Investment Management Platform</h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Streamline your real estate investments from acquisition to disposition with comprehensive digital workflows, automated reporting, and investor transparency.
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
            <h2 className="text-4xl font-bold mb-4">Complete Real Estate Investment Suite</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage real estate investments professionally and efficiently
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Property Acquisition",
                desc: "Streamline your property acquisition process with digital workflows and automated due diligence.",
                features: ["Deal pipeline management", "Due diligence checklists", "Market analysis tools", "Acquisition financing", "Document management"]
              },
              {
                title: "Syndication Management",
                desc: "Raise capital efficiently with automated subscription flows and investor management.",
                features: ["Digital subscription documents", "Investor accreditation", "Capital call automation", "Investment tracking", "Regulatory compliance"]
              },
              {
                title: "Investor Relations",
                desc: "Keep your investors informed with automated reporting and transparent communication.",
                features: ["Investor portal access", "Quarterly reports", "Performance dashboards", "Document sharing", "Communication center"]
              },
              {
                title: "Financial Management",
                desc: "Automate financial processes from rent collection to distribution calculations.",
                features: ["Rent roll management", "Cash flow analysis", "Return calculations", "Distribution automation", "Financial reporting"]
              },
              {
                title: "Compliance & Reporting",
                desc: "Stay compliant with automated tax reporting and regulatory documentation.",
                features: ["Automated tax document generation", "Tax reporting", "Regulatory compliance", "Audit trail management", "Compliance reporting"]
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
            <h2 className="text-4xl font-bold mb-4">Why Real Estate Professionals Choose PoliBit</h2>
            <p className="text-xl text-muted-foreground">Discover the advantages that set us apart in real estate investment management</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Increased Operational Efficiency",
                desc: "Reduce manual processes by up to 80% with automated workflows for acquisition, management, and disposition.",
                features: ["Automated document generation", "Streamlined approval processes", "Real-time collaboration tools", "Integrated communication systems"]
              },
              {
                title: "Enhanced Investor Transparency",
                desc: "Build stronger investor relationships with real-time reporting and transparent communication channels.",
                features: ["24/7 investor portal access", "Real-time performance updates", "Automated quarterly reports", "Document sharing platform"]
              },
              {
                title: "Scalable Growth Platform",
                desc: "Scale your real estate portfolio efficiently without proportional increases in operational overhead.",
                features: ["Multi-property management", "Investor base expansion tools", "Portfolio-level analytics", "Enterprise-grade infrastructure"]
              },
              {
                title: "Risk Management & Compliance",
                desc: "Minimize regulatory risks with built-in compliance features and comprehensive audit trails.",
                features: ["Automated compliance monitoring", "Risk assessment tools", "Audit trail management", "Regulatory reporting automation"]
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
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Real Estate Operations?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join real estate professionals who have modernized their investment management with PoliBit
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