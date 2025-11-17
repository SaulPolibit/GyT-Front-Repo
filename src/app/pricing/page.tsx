import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Header } from "@/components/header";

export default function Pricing() {
  const pricingTiers = [
    {
      name: "Starter",
      price: "",
      period: "",
      description: "Perfect for emerging investment managers",
      target: "Up to $10M AUM",
      users: "Up to 50 investors",
      emissions: "Up to 5 emissions",
      popular: false,
      features: [
        "Digital subscriptions & investor onboarding",
        "White label investor portal",
        "E-commerce-style investment checkout",
        "Basic return calculations",
        "Multi-payment rails (ACH, cards, stablecoins)",
        "Investor reporting & dashboards",
        "Document management & e-signatures",
        "KYC/AML verification (300+ watchlists)",
        "Email support"
      ]
    },
    {
      name: "Growth",
      price: "",
      period: "",
      description: "For growing investment managers scaling operations",
      target: "Up to $50M AUM",
      users: "Up to 100 investors",
      emissions: "Up to 10 emissions",
      popular: true,
      features: [
        "Everything in Starter, plus:",
        "Advanced return automation (multi-tier, catch-up, side letters)",
        "Multi-fund management",
        "Automated tax reporting",
        "Multi-jurisdiction compliance validation",
        "Custom reporting & analytics",
        "Real-time performance dashboards",
        "Priority support"
      ]
    },
    {
      name: "Enterprise",
      price: "",
      period: "",
      description: "Institutional-grade platform for large managers",
      target: "Up to $100M AUM",
      users: "Up to 200 investors",
      emissions: "Up to 20 emissions",
      popular: false,
      features: [
        "Everything in Growth, plus:",
        "Multi-currency operations",
        "White-glove onboarding & migration",
        "Dedicated account manager",
        "Premium support",
        "Custom SLA agreements",
        "Private Secondary Market (peer-to-peer trading) (Coming Soon)",
        "Investment position collateralization (Coming Soon)"
      ]
    },
    {
      name: "Custom",
      price: "Contact",
      period: "Sales",
      description: "White-glove service and custom integrations",
      target: "$100M+ AUM",
      users: "Custom number of investors",
      emissions: "Custom number of emissions",
      popular: false,
      features: [
        "Everything in Enterprise, plus:",
        "Custom feature development",
        "Dedicated implementation team",
        "Custom integrations & workflows",
        "Personalized training & onboarding",
        "Strategic account management",
        "Custom SLA agreements",
        "Priority feature requests",
        "Direct engineering support"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Choose the plan that fits your fund size and unlock institutional-grade investment management
          </p>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative hover:shadow-xl transition-shadow flex flex-col ${
                  tier.popular ? 'border-primary border-2 shadow-lg' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <CardDescription className="text-sm mb-4">{tier.description}</CardDescription>
                  {tier.price && (
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-primary">
                        {tier.price}
                        <span className="text-lg font-normal text-muted-foreground">{tier.period}</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{tier.target}</div>
                    <div className="text-sm text-muted-foreground">{tier.users}</div>
                    <div className="text-sm text-muted-foreground">{tier.emissions}</div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  <ul className="space-y-3 mb-8 flex-grow">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <div className={`w-2 h-2 rounded-full mr-3 mt-1.5 flex-shrink-0 ${
                          feature.startsWith("Everything in") ? "bg-muted" : "bg-green-500"
                        }`}></div>
                        <span className={feature.startsWith("Everything in") ? "font-medium" : ""}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-auto"
                    variant={tier.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/free-demo">
                      {tier.name === "Custom" ? "Contact Sales" : "Get Started"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">All Plans Include</h2>
            <p className="text-xl text-muted-foreground">Core features that set PoliBit apart</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: "🌍",
                title: "300+ International Watchlists",
                desc: "Comprehensive KYC/AML verification across OFAC, UN sanctions, and PEP databases"
              },
              {
                icon: "🛒",
                title: "E-Commerce Checkout",
                desc: "Familiar investment purchase experience with instant verification and payment"
              },
              {
                icon: "💳",
                title: "Multi-Payment Rails",
                desc: "ACH, cards, and stablecoins for up to 90% savings on cross-border transfers"
              },
              {
                icon: "🔐",
                title: "White Label Platform",
                desc: "Fully branded portal with your logo, colors, and custom domain"
              }
            ].map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardHeader>
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "What is an emission?",
                a: ["An emission represents a unique investment offering with its own specific terms and token structure. Each emission has distinct characteristics such as return terms, risk profiles, and investor rights.", "Examples include:\n• Real estate development Phase 1 with equity structure\n• Real estate development Phase 1 with debt structure\n• Private equity fund Series A round\n• Private equity fund Series B round\n• Private debt senior tranche\n• Private debt mezzanine tranche"]
              },
              {
                q: "Is there a setup fee?",
                a: "Yes, there is a one-time setup fee of $5,000 for your first emission and $3,000 for each additional emission. This covers platform configuration."
              },
              {
                q: "Can I upgrade or downgrade my plan?",
                a: "Yes, you can upgrade or downgrade at any time based on your AUM growth. Changes take effect at the start of your next billing cycle."
              },
              {
                q: "Do you offer annual billing?",
                a: "Yes, we offer annual billing with a discount. Contact our sales team to discuss annual contract options."
              },
              {
                q: "What happens if I exceed my plan's limits?",
                a: "If you exceed your plan's AUM, investor count, or emission limits, we offer flexible add-ons: $100/month per additional $1M AUM, $3/month per additional investor, and $3,000 one-time fee per additional emission. These add-ons allow you to scale gradually without needing to upgrade your entire plan immediately."
              },
              {
                q: "What if I manage more than $100M AUM?",
                a: "Our Custom tier is designed for institutional managers with $100M+ AUM. We'll create a custom package tailored to your specific needs, fund structure, and compliance requirements with white-glove service."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                  {Array.isArray(faq.a) ? (
                    <div className="mt-2 space-y-3">
                      {faq.a.map((paragraph, pIdx) => (
                        <CardDescription key={pIdx} className="text-base whitespace-pre-line">
                          {paragraph}
                        </CardDescription>
                      ))}
                    </div>
                  ) : (
                    <CardDescription className="mt-2 text-base">{faq.a}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Schedule a demo to see how PoliBit can transform your investment operations
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/free-demo">Schedule Your Free Demo</Link>
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
