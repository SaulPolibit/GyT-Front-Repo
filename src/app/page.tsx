"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarProvider,
} from "@/components/ui/sidebar";
import { UserProvider } from "@/contexts/UserContext";

import data from "./dashboard/investment-data.json";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight px-4">
              Automate your investment operations from fundraising to distributions
            </h1>
            <p className="text-lg md:text-xl mb-6 md:mb-8 opacity-90 max-w-3xl mx-auto px-4">
              Streamline real estate, equity and debt investments with digital workflows that reduce costs, improve transparency, and scale across global markets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button size="lg" variant="secondary" asChild>
              <Link href="/free-demo">Get Free Demo</Link>
            </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground text-ring hover:bg-primary-foreground hover:text-primary"
                asChild
              >
                <Link href="/investment-platform#platform-walkthrough">Learn More</Link>
              </Button>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-2">
            <div className="bg-background/95 backdrop-blur rounded-xl border shadow-2xl overflow-hidden">
              <div className="h-[600px] md:h-[700px] lg:h-[800px] w-full">
                <UserProvider>
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
                </UserProvider>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Lifecycle */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Complete Investment Lifecycle Management</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From initial fundraising to final distributions, manage every aspect of your investment operations
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Fundraising", desc: "Digital subscriptions and investor onboarding" },
              { step: "2", title: "Investment", desc: "Asset acquisition and portfolio management" },
              { step: "3", title: "Management", desc: "Performance monitoring and reporting" },
              { step: "4", title: "Distribution", desc: "Automated calculations and payments" }
            ].map((item) => (
              <Card key={item.step} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "$5M+", label: "Assets Under Management" },
              { value: "3", label: "Live Countries" },
              { value: "60+", label: "Active Investors" },
              { value: "98%", label: "Client Satisfaction" }
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comprehensive Platform Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run professional investment operations, from fundraising to distributions, integrated in one powerful platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Fundraising & Capital Raising", desc: "Digital subscriptions, investor onboarding, accreditation verification, and automated capital calls." },
              { title: "Investor Portal & CRM", desc: "White label investor portal with real-time reporting, document management, and transparent communication channels." },
              { title: "Return Automation", desc: "Automated distribution calculations with immutable records, supporting any return structure with complete transparency." },
              { title: "Asset Management", desc: "Track performance across your entire portfolio with real-time KPIs, NOI calculations, and market analytics." }
            ].map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-primary rounded"></div>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Client Results */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Recent Client Results</h2>
            <p className="text-xl text-muted-foreground">
              Real outcomes from investment professionals using our platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { flag: "🇲🇽", title: "Vertical Housing Developer", desc: "Tokenized $220K across 60+ investors achieving 6 percentage points interest savings. Saved $3K quarterly in international transfer costs with automated payments." },
              { flag: "🇬🇹", title: "Real Estate Development Company", desc: "Digitized $2M+ across two residential projects replacing manual Excel processes. Automated calculations eliminated operational errors and reduced management time." },
              { flag: "🇵🇦", title: "Real Estate Fund", desc: "Tokenized $4.5M fund with integrated legal compliance across two countries. Eliminated manual reporting while strengthening investor confidence through automation." }
            ].map((result) => (
              <Card key={result.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-4">{result.flag}</div>
                  <CardTitle className="text-xl">{result.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{result.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Modernize Your Investment Management?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join investment professionals who&apos;ve already saved thousands through automated investment operations.
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