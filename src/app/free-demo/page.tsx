"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";

export default function FreeDemo() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtherAssetManagement, setShowOtherAssetManagement] = useState(false);
  const [showOtherMotivation, setShowOtherMotivation] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      company: formData.get("company"),
      companyWebsite: formData.get("companyWebsite"),
      tokenizationExpertise: formData.get("tokenizationExpertise"),
      estimatedAssetValue: formData.get("estimatedAssetValue"),
      currentAssetManagement: formData.get("currentAssetManagement"),
      otherAssetManagement: formData.get("otherAssetManagement"),
      tokenizationMotivation: formData.get("tokenizationMotivation"),
      otherMotivation: formData.get("otherMotivation"),
      existingInvestorNetwork: formData.get("existingInvestorNetwork"),
    };

    try {
      const response = await fetch("/api/send-demo-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again or contact us directly.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">See PoliBit in Action</h1>
            <p className="text-xl opacity-90 mb-8">
              Schedule a personalized demo and discover how PoliBit can transform your investment management operations.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">$5M+</div>
                <div className="text-sm opacity-90">Assets Under Management</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">60+</div>
                <div className="text-sm opacity-90">Active Investors</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">98%</div>
                <div className="text-sm opacity-90">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Left Column - Benefits */}
              <div>
                <h2 className="text-3xl font-bold mb-6">What You&apos;ll Learn</h2>
                <div className="space-y-4">
                  {[
                    "Complete platform walkthrough tailored to your tokenization needs",
                    "Asset tokenization process and blockchain integration",
                    "Digital subscription and investor onboarding workflows",
                    "Automated return calculations and distribution management",
                    "White label investor portal and CRM capabilities",
                    "Real-time reporting and analytics dashboard",
                    "Multi-jurisdiction compliance validation (KYC/AML)",
                    "Integration options with your existing tools",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <p className="text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    &quot;PoliBit transformed our fundraising process. We reduced capital call time by 60% and eliminated manual reporting errors completely.&quot;
                  </p>
                  <p className="text-sm font-semibold mt-3">— Investment Manager, Real Estate Fund</p>
                </div>
              </div>

              {/* Right Column - Form */}
              <div className="bg-card border rounded-lg p-8 shadow-lg">
                {!submitted ? (
                  <>
                    <h3 className="text-2xl font-bold mb-6">Request Your Free Demo</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input id="firstName" name="firstName" required placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input id="lastName" name="lastName" required placeholder="Doe" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="john@company.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name *</Label>
                        <Input id="company" name="company" required placeholder="Your Company" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyWebsite">Company Website</Label>
                        <Input
                          id="companyWebsite"
                          name="companyWebsite"
                          type="url"
                          placeholder="https://www.example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tokenizationExpertise">Tokenization Expertise Level *</Label>
                        <Select name="tokenizationExpertise" required>
                          <SelectTrigger id="tokenizationExpertise">
                            <SelectValue placeholder="Select your expertise level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estimatedAssetValue">Estimated Asset Tokenization Value *</Label>
                        <Input
                          id="estimatedAssetValue"
                          name="estimatedAssetValue"
                          required
                          placeholder="e.g., $5M"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currentAssetManagement">Current Asset Management Method *</Label>
                        <Select
                          name="currentAssetManagement"
                          required
                          onValueChange={(value) => setShowOtherAssetManagement(value === "other")}
                        >
                          <SelectTrigger id="currentAssetManagement">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excel">Excel / Spreadsheets</SelectItem>
                            <SelectItem value="manual">Manual Processes</SelectItem>
                            <SelectItem value="saas">SaaS Platform</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {showOtherAssetManagement && (
                        <div className="space-y-2">
                          <Label htmlFor="otherAssetManagement">Please specify *</Label>
                          <Input
                            id="otherAssetManagement"
                            name="otherAssetManagement"
                            required={showOtherAssetManagement}
                            placeholder="Describe your current method"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="tokenizationMotivation">Motivation for Tokenization *</Label>
                        <Select
                          name="tokenizationMotivation"
                          required
                          onValueChange={(value) => setShowOtherMotivation(value === "other")}
                        >
                          <SelectTrigger id="tokenizationMotivation">
                            <SelectValue placeholder="Select your primary motivation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retail-investors">Access to broader investor base (retail)</SelectItem>
                            <SelectItem value="accredited-investors">Access to broader investor base (accredited, institutional)</SelectItem>
                            <SelectItem value="ma">Mergers & Acquisitions</SelectItem>
                            <SelectItem value="audit">Audit or Reporting Requirements</SelectItem>
                            <SelectItem value="liquidity">Liquidity or secondary market needs</SelectItem>
                            <SelectItem value="efficiency">Portfolio digitization or operational efficiency</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {showOtherMotivation && (
                        <div className="space-y-2">
                          <Label htmlFor="otherMotivation">Please specify *</Label>
                          <Input
                            id="otherMotivation"
                            name="otherMotivation"
                            required={showOtherMotivation}
                            placeholder="Describe your motivation"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="existingInvestorNetwork">Existing Investor Network *</Label>
                        <Select name="existingInvestorNetwork" required>
                          <SelectTrigger id="existingInvestorNetwork">
                            <SelectValue placeholder="Select your investor network" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="institutional">Yes, institutional investors</SelectItem>
                            <SelectItem value="accredited">Yes, accredited investors</SelectItem>
                            <SelectItem value="retail">Yes, retail investors</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-start space-x-2 pt-2">
                        <Checkbox id="terms" required />
                        <label
                          htmlFor="terms"
                          className="text-sm text-muted-foreground leading-tight cursor-pointer"
                        >
                          I agree to receive communications from PoliBit and accept
                          the Privacy Policy and Terms of Service
                        </label>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                          {error}
                        </div>
                      )}

                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? "Sending..." : "Schedule My Demo"}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        We&apos;ll contact you within 24 hours to schedule your personalized
                        demo
                      </p>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
                    <p className="text-muted-foreground mb-6">
                      Your demo request has been successfully submitted. We&apos;ll be in
                      touch soon to schedule your personalized demo.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/">Return to Homepage</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
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
