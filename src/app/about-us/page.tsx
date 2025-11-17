import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import Image from "next/image";
import Link from "next/link";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Building the Future of Investment Management</h1>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
            We&apos;re transforming how investment professionals manage multi-asset portfolios by replacing outdated processes with intelligent digital workflows that scale across global markets.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Story</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Born from real-world experience in real estate development and technology innovation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                PoliBit was founded by two entrepreneurs who witnessed firsthand the inefficiencies plaguing traditional investment management. While leading large-scale real estate developments and building technology companies, they saw how manual processes, disconnected systems, and outdated workflows were holding back investment professionals.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                The problem wasn&apos;t just inefficiency—it was about missed opportunities. Investment managers were spending countless hours on administrative tasks instead of focusing on what matters: sourcing deals, building relationships with investors, and driving portfolio performance.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Today, PoliBit serves investment managers across real estate, private equity, and private debt, helping them modernize operations, improve transparency, and scale their businesses globally.
              </p>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">3</div>
                    <div className="text-muted-foreground">Live Countries</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">500+</div>
                    <div className="text-muted-foreground">Active Investors</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">$5M+</div>
                    <div className="text-muted-foreground">Assets Under Management</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide how we build products and serve our clients
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: "🎯",
                title: "Professional-Grade Quality",
                desc: "We build institutional-quality tools that investment professionals trust with their most critical operations and investor relationships."
              },
              {
                icon: "🚀",
                title: "Relentless Innovation",
                desc: "The investment management industry deserves modern technology. We constantly push boundaries to deliver workflows that weren't possible before."
              },
              {
                icon: "🤝",
                title: "Client Partnership",
                desc: "Our success is measured by your success. We work closely with investment managers to understand their challenges and deliver solutions that drive real results."
              },
              {
                icon: "🌍",
                title: "Global Scalability",
                desc: "Investment opportunities don't stop at borders. We build for international markets from day one, supporting multi-currency and cross-border operations."
              },
              {
                icon: "🔒",
                title: "Security First",
                desc: "Managing investments requires absolute trust. We implement bank-grade security and compliance standards to protect your data and your investors."
              },
              {
                icon: "📊",
                title: "Transparency & Insight",
                desc: "Better data leads to better decisions. We provide real-time visibility into operations, performance, and investor relations."
              }
            ].map((value) => (
              <Card key={value.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-2">{value.icon}</div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{value.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Meet Our Founders</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A powerful combination of industry expertise, technical innovation, and entrepreneurial drive
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src="/images/gabriela-mena.webp"
                    alt="Gabriela Mena"
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <CardTitle className="text-2xl">Gabriela Mena</CardTitle>
                <CardDescription className="text-primary font-semibold text-lg">CEO & Co-Founder</CardDescription>
                <div className="flex justify-center mt-2">
                  <a
                    href="https://www.linkedin.com/in/gabriela-menarchila/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">→</span>
                    <span>Architect with MBA in Entrepreneurship</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">→</span>
                    <span>Led over 90,000 m² in real estate developments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">→</span>
                    <span>Innovation strategist with 50+ design sprints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">→</span>
                    <span>Scaled a fintech achieving 35% monthly growth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">→</span>
                    <span>FoundHer of the Year 2024</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src="/images/martha-mena.webp"
                    alt="Martha Mena"
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <CardTitle className="text-2xl">Martha Mena</CardTitle>
                <CardDescription className="text-primary font-semibold text-lg">CTO & Co-Founder</CardDescription>
                <div className="flex justify-center mt-2">
                  <a
                    href="https://www.linkedin.com/in/marsanem/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">→</span>
                    <span>Full-stack developer and Web3 specialist</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">→</span>
                    <span>Led engineering teams at scale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">→</span>
                    <span>Co-founder of startup with successful exit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">→</span>
                    <span>Master&apos;s in Software Engineering</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">→</span>
                    <span>Expert in end-to-end product development</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Recognition & Milestones</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { year: "2025", title: "Shark Tank Guatemala Winners" },
              { year: "2025", title: "Polygon Grant Winners" },
              { year: "2025", title: "Top 5 Finalist at GRI Awards Mexico" },
              { year: "2024", title: "FoundHer of the Year at Chany Ventures" },
              { year: "2024", title: "PropTech LatAm Awards Winner" },
              { year: "2024", title: "UFM Acton Pitch Competition Winners" }
            ].map((achievement, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="text-primary font-bold text-lg mb-2">{achievement.year}</div>
                  <div className="text-sm font-semibold">{achievement.title}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Join Us in Transforming Investment Management</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Whether you&apos;re managing real estate syndications, private equity funds, or debt portfolios, PoliBit helps you operate more efficiently and scale globally.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/free-demo">Schedule a Demo</Link>
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