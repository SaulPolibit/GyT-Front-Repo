import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Header } from "@/components/header";

export default function Fundraising() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Fundraising & Capital Raising Solutions</h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Raise capital faster with cross-border payment capabilities, automated international investor verification, and e-commerce-style investment workflows that eliminate manual processes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/free-demo">See Demo</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-ring hover:bg-primary-foreground hover:text-primary" asChild>
                <Link href="/investment-platform#platform-walkthrough">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Complete Fundraising Toolkit</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to raise capital efficiently, from prospect management to final closing, with complete transparency at every step.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: "📋",
                title: "Digital Subscriptions",
                desc: "Streamline investor onboarding with customizable digital subscription flows, e-signatures, and automated document collection that eliminates double manual processes.",
                benefits: ["Customizable subscription workflows", "Electronic signature with IP recording", "Automated document generation & signing", "Document sealing for security", "Mobile-optimized experience"]
              },
              {
                icon: "✅",
                title: "International Investor Verification",
                desc: "Automated KYC/AML verification against 300+ international watchlists with multi-factor authentication and SEC compliance for global investor onboarding.",
                benefits: ["Verification against 300+ international watchlists", "Address and phone verification", "Multi-factor authentication", "SEC Rule 506(b) & 506(c) compliance", "Automated international investor screening", "Digital attestation with immutable records"]
              },
              {
                icon: "💼",
                title: "Data Rooms & Deal Marketing",
                desc: "Create compelling investment presentations with secure data rooms, analytics tracking, and investor engagement insights.",
                benefits: ["Customizable data room templates", "Investor engagement analytics", "Document view tracking", "Secure access controls", "Marketing performance metrics"]
              },
              {
                icon: "💳",
                title: "E-Commerce Style Investment Purchase",
                desc: "Modern checkout experience for investment purchases with multiple payment rails, instant verification, and seamless cross-border transactions.",
                benefits: ["E-commerce-style investment checkout", "Multiple payment methods: ACH, cards, and stablecoins", "Instant payment verification via webhooks", "Cross-border stablecoin payments", "Automated payment reconciliation"]
              },
              {
                icon: "📞",
                title: "Capital Calls & Commitments",
                desc: "Automate capital call calculations, investor notifications, and cross-border payment collection with support for fiat and stablecoin distributions.",
                benefits: ["Automated capital call calculations", "Multi-currency commitment support", "International payment processing", "Stablecoin distributions for global investors", "Real-time payment tracking"]
              },
              {
                icon: "👥",
                title: "Investor CRM & Pipeline",
                desc: "Manage your entire investor pipeline from prospecting to closing with comprehensive CRM tools and relationship tracking.",
                benefits: ["Complete investor lifecycle management", "Deal pipeline tracking", "Communication history & notes", "Automated follow-up workflows", "Investment preference tracking"]
              },
              {
                icon: "📊",
                title: "Fundraising Analytics",
                desc: "Track fundraising performance with real-time analytics, conversion metrics, and verified fundraising data.",
                benefits: ["Real-time fundraising dashboards", "Conversion rate tracking", "Investor engagement metrics", "Pipeline performance analysis", "Predictive fundraising insights"]
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
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Streamlined Capital Raising Process</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our proven 4-step process reduces fundraising time by 60% while increasing investor conversion rates through transparency and automation.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { 
                num: "1", 
                title: "Setup & Marketing", 
                desc: "Create compelling data rooms, configure subscription flows, and launch your fundraising campaign with verified deal terms." 
              },
              { 
                num: "2", 
                title: "Investor Onboarding", 
                desc: "Automated investor accreditation, KYC/AML verification, and digital subscription completion with immutable record-keeping." 
              },
              { 
                num: "3", 
                title: "Capital Collection", 
                desc: "Execute capital calls, process payments, and track commitments with smart contract automation and real-time verification." 
              },
              { 
                num: "4", 
                title: "Closing & Reporting", 
                desc: "Generate closing documents, distribute final reports, and maintain complete audit trails for transparency." 
              }
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Subscription Demo */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Digital Subscription Workflows</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Transform your investor onboarding experience with intelligent workflows that adapt to different investor types and compliance requirements.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Smart questionnaires that adapt based on responses",
                  "Integrated e-signature and document collection",
                  "Automated accreditation verification",
                  "Real-time compliance checking",
                  "Mobile-optimized investor experience",
                  "Digital verification at each step"
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2"></div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" asChild>
                <Link href="/free-demo">Try Interactive Demo</Link>
              </Button>
            </div>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Sample Subscription Flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: "1. Investor Information", desc: "Basic contact details and investment entity setup" },
                  { title: "2. Accreditation Verification", desc: "Automated verification with document upload" },
                  { title: "3. Investment Details", desc: "Investment amount and entity structure" },
                  { title: "4. Document Signing", desc: "Electronic signature of subscription documents" },
                  { title: "5. Payment Selection", desc: "Choose payment method: ACH, wire, Stripe, or stablecoin" },
                  { title: "6. Investment Confirmation ✓", desc: "Investment recorded with instant verification and confirmation ID: INV-1a2b3c", highlight: true }
                ].map((flow) => (
                  <div 
                    key={flow.title} 
                    className={`p-4 rounded-lg border-l-4 ${
                      flow.highlight 
                        ? 'bg-green-50 border-green-500 dark:bg-green-950/20' 
                        : 'bg-muted border-primary'
                    } hover:translate-x-1 transition-transform`}
                  >
                    <div className="font-semibold">{flow.title}</div>
                    <div className="text-sm text-muted-foreground">{flow.desc}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "$220K+", label: "Capital Raised per Project" },
              { value: "60+", label: "International Investors" },
              { value: "Up to 90%", label: "Lower Cross-Border Transfer Costs" },
              { value: "95%", label: "International Investor Rate" }
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="opacity-90 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Seamless Integration & Automation</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with your existing tech stack and automate repetitive tasks to focus on what matters most - building investor relationships.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: "🔌",
                title: "CRM & Marketing Integration",
                desc: "Seamlessly connect with Salesforce, HubSpot, Mailchimp, and other leading platforms.",
                features: ["Bi-directional data sync", "Automated lead nurturing", "Email marketing integration", "Activity tracking & analytics"]
              },
              {
                icon: "🏦",
                title: "Cross-Border Payment Integration",
                desc: "Multiple payment rails including stablecoins for international investors, eliminating high international transfer fees.",
                features: ["Stablecoin payments for cross-border transactions", "Traditional wire and ACH transfers", "Multi-currency support", "Up to 90% lower international transfer costs"]
              },
              {
                icon: "📋",
                title: "Legal & Compliance Tools",
                desc: "Integrate with leading legal platforms for document generation and compliance management.",
                features: ["Digital signature integration", "Automated document generation", "Compliance monitoring", "Audit trail management"]
              },
              {
                icon: "📊",
                title: "Analytics & Reporting",
                desc: "Export data to your preferred analytics tools or use our comprehensive reporting suite.",
                features: ["Real-time dashboards", "Custom report builder", "API access for data export", "Performance benchmarking"]
              }
            ].map((integration) => (
              <Card key={integration.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-2xl">
                    {integration.icon}
                  </div>
                  <CardTitle className="text-xl">{integration.title}</CardTitle>
                  <CardDescription className="mt-2">{integration.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {integration.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Enterprise-Grade Security & Compliance</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built with institutional-grade security standards and digital immutability to protect your investors and meet regulatory requirements.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 text-2xl text-white">
                  🛡️
                </div>
                <CardTitle className="text-xl text-blue-900 dark:text-blue-100">Digital Security</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  All transaction data is cryptographically secured and stored immutably in secure databases.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {["Immutable transaction records", "Multi-signature security", "Smart contract auditing", "Decentralized verification"].map((item) => (
                    <li key={item} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-2xl">
                  ⚖️
                </div>
                <CardTitle className="text-xl">Regulatory Compliance</CardTitle>
                <CardDescription className="mt-2">
                  Built-in compliance with SEC regulations, Blue Sky laws, and international requirements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {["Rule 506(b) & 506(c) compliance", "Blue Sky filing management", "KYC/AML verification", "International compliance"].map((item) => (
                    <li key={item} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-2xl">
                  🔐
                </div>
                <CardTitle className="text-xl">Data Protection</CardTitle>
                <CardDescription className="mt-2">
                  Enterprise-grade security with encryption, access controls, and regular audits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {["End-to-end encryption", "Role-based access control", "Regular security audits", "GDPR & CCPA compliance"].map((item) => (
                    <li key={item} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Capital Raising?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join investment professionals who have streamlined their fundraising with PoliBit&apos;s advanced digital platform.
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