import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Header } from "@/components/header";

export default function CaseStudies() {
  const caseStudies = [
    {
      id: 1,
      title: "Vertical Housing Developer Saves 6% in Interest with Tokenized Financing",
      company: "Real Estate Developer, Mexico",
      industry: "Real Estate",
      metrics: [
        { label: "Tokenized Capital", value: "$220K" },
        { label: "Investors", value: "60+" },
        { label: "Interest Savings", value: "6 percentage points" },
        { label: "Transfer Cost Savings", value: "$3K/quarter" }
      ],
      challenge: "A Mexican developer with 10+ years of experience in boutique vertical housing faced challenges managing multiple investors without scalable systems. Traditional banking offered 24% interest rates, and international investor management created high transfer costs and operational complexity.",
      solution: "PoliBit implemented individual property tokenization using a commercial loan structure, allowing the developer to advance complete project cash flow as if 100% of the property had been sold. Automated due diligence, contract signing, and stablecoin payments for international distributions.",
      results: "Placed 400 tokens across 60+ investors ($3.6K average ticket) with 95% international investors from Central America and Europe. Saved 6 percentage points in interest costs (18% investor rates vs. 24% bank rates) and $3K quarterly in international transfer costs through automated stablecoin payments.",
      quote: "The automated capital raising process saved us significant time - no delays in due diligence or contract signing. We're managing 60+ investors seamlessly while saving thousands in transfer costs every quarter.",
      flag: "🇲🇽"
    },
    {
      id: 2,
      title: "Development Company Digitizes $2M+ Portfolio, Eliminates Manual Processes",
      company: "Real Estate Development Company, Guatemala",
      industry: "Real Estate",
      metrics: [
        { label: "Portfolio Digitized", value: "$2M+" },
        { label: "Active Projects", value: "2 Residential" },
        { label: "Manual Errors", value: "Eliminated" },
        { label: "Operational Time", value: "Significantly Reduced" }
      ],
      challenge: "A 20-year veteran Guatemalan developer struggled with manual investor management across multiple projects. Returns were calculated manually in Excel with potential errors, legal documents required manual preparation per client, email-based communication scattered information, and due diligence took months due to incomplete paperwork.",
      solution: "Deployed PoliBit's centralized platform with automated return calculations based on specific contract conditions, real-time access to movement history and reports, and professional investor relationship management replacing dispersed information between financial and legal teams.",
      results: "Tokenized $2M+ across two active residential projects. Replaced email-based communication with centralized platform, automated calculations eliminated operational errors, and significantly reduced operational time while improving investment control and investor transparency.",
      quote: "Moving from Excel to PoliBit was transformative. No more calculation errors, and our investors now have real-time access to their investment data. Our financial and legal teams finally work from the same platform.",
      flag: "🇬🇹"
    },
    {
      id: 3,
      title: "Real Estate Fund Tokenizes $4.5M with Multi-Country Compliance",
      company: "Real Estate Fund, Panama",
      industry: "Real Estate",
      metrics: [
        { label: "Fund Size", value: "$4.5M" },
        { label: "Countries", value: "2 (Panama & Guatemala)" },
        { label: "Reporting", value: "Real-Time" },
        { label: "Manual Processes", value: "Eliminated" }
      ],
      challenge: "A renowned Guatemalan developer established a $4.5M private real estate investment fund in Panama to finance mixed-use development in Guatemala. Previously operated with completely manual processes: email reports, no traceability, high operational risk, and dispersed communication across team members.",
      solution: "Implemented complete tokenization of the $4.5M fund with integrated legal solution aligned with Panamanian and Guatemalan regulatory frameworks. Deployed centralized investor platform with automated reporting, month-to-month information generation, and automated segmentation by investor and investment projects.",
      results: "Successfully tokenized entire $4.5M fund with full legal compliance across two countries. Eliminated communication dispersion, enabled real-time visibility for clients, and strengthened investor confidence through improved financial governance and automated reporting.",
      quote: "PoliBit gave us the infrastructure to operate professionally across borders. Our investors trust the platform's transparency and automation. We went from email reports with no traceability to real-time investor visibility.",
      flag: "🇵🇦"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Customer Success Stories</h1>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
            See how investment professionals are transforming their operations and scaling globally with PoliBit
          </p>
        </div>
      </section>

      {/* Customer Success Stories - Single Column */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-8">
            {caseStudies.map((study) => (
              <Card key={study.id} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary">{study.industry}</Badge>
                    <span className="text-4xl">{study.flag}</span>
                  </div>
                  <CardTitle className="text-3xl mb-3">{study.title}</CardTitle>
                  <CardDescription className="text-lg">{study.company}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-6 mb-8 p-6 bg-muted/50 rounded-lg">
                    {study.metrics.map((metric, idx) => (
                      <div key={idx} className="text-center">
                        <div className="text-3xl font-bold text-primary mb-1">{metric.value}</div>
                        <div className="text-sm text-muted-foreground">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Challenge */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-base text-primary mb-3">Challenge</h4>
                    <p className="text-base text-muted-foreground leading-relaxed">{study.challenge}</p>
                  </div>

                  {/* Solution */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-base text-primary mb-3">Solution</h4>
                    <p className="text-base text-muted-foreground leading-relaxed">{study.solution}</p>
                  </div>

                  {/* Results */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-base text-primary mb-3">Results</h4>
                    <p className="text-base text-muted-foreground leading-relaxed">{study.results}</p>
                  </div>

                  {/* Quote */}
                  <div className="mt-8 p-6 bg-primary/5 border-l-4 border-primary rounded">
                    <p className="text-base italic text-muted-foreground leading-relaxed">&quot;{study.quote}&quot;</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Investment Operations?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join investment professionals who are already saving time and scaling globally with PoliBit
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