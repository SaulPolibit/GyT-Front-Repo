import Link from "next/link";
import { Header } from "@/components/header";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

    <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
      <div className="container mx-auto px-4 ">
        <h1 className="text-5xl font-semibold mt-10 mb-4">Comprehensive Privacy Policy</h1>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          To comply with the Federal Law on Protection of Personal Data Held by Private Parties (hereinafter the “Law”), its Regulations and other applicable legal provisions, this Privacy Notice is made known to you, in order to inform you of the information that we will collect from you, the purposes thereof and other obligations contemplated in the Law. You are informed that you have the right to self-determine the legal treatment and control of the information you provide us, so that the data is used for the purpose for which it was intended, preserving its confidentiality and privacy.
        </p>

       <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          Responsible for the Processing of your Personal Data</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          POLIBIT, SAPI DE CV, commercially known as “PoliBit” (hereinafter “PoliBit”), with address at Calle San Juan Capistrano, number 107, Fraccionamiento Nuevo Bernardez, Guadalupe, Zacatecas, Mexico, CP 98610, is responsible for the treatment of your personal data collected by PoliBit, whether through electronic means, paper format, application or website of www.polibit.io, telephone or other means that has the purpose of obtaining personal data, as well as safeguarding the privacy of the data that you provide us as a client or potential client.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Department of Personal Data Protection</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          Address: Calle San Juan Capistrano, number 107, Fraccionamiento Nuevo Bernardez, Guadalupe, Zacatecas, Mexico, CP 98610<br />
          Email: <a href="mailto:admin@polibit.io" className="underline">admin@polibit.io</a><br />
          Telephone: +52 4924910708
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Non-Sensitive Personal Data Collected</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          The personal data that PoliBit may request are: full name, telephone number, email, address, proof of address, official identification with photo, tax ID, date of birth, and sex. In terms of article 8 of the Law, tacit consent is assumed if you do not express opposition after receiving this notice.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Sensitive Personal Data</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          PoliBit will not collect any sensitive data from you.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Purposes for which your Personal Data is Collected and Used</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          Data collected is used for verification, internal dashboards, trend analysis, client profiling, platform optimization, hiring services, and other lawful activities under PoliBit’s corporate purpose.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Transfer of Personal Data within PoliBit</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          PoliBit may share personal data with its departments, subsidiaries, affiliates, or controllers within or outside Mexico for the purposes stated in this Privacy Notice and to comply with contractual obligations.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Transfer of Personal Data with Third Parties</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          Data may be shared with companies for verification, billing, regulatory compliance (CNBV), developers, DocuSign, payment gateways, and fraud prevention services.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Obtaining Personal Data and Source</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          Data is collected directly, via website, email, telephone, or lawful public sources. Any identifiable personal information provided on our site may be collected.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Limitation of Use or Disclosure</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          To limit use or disclosure, you may register with PROFECO’s Public Registry or PoliBit’s exclusion list to avoid marketing or advertising communications.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        ARCO Rights (Access, Rectification, Cancellation, Opposition)</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          You may exercise your ARCO rights by submitting a written or emailed request with identification and details. PoliBit will respond within 20 business days. Requests may be denied under certain legal conditions.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Revocation of Consent</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          You may revoke your consent at any time by written request to the Department of Personal Data Protection. PoliBit may still retain data where legally required.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Blocking and Deletion of Data</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          Once the purposes of processing are fulfilled, and absent legal requirements, your data will be blocked and subsequently deleted.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Security and Storage</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          PoliBit implements technical and administrative security measures, using encrypted databases to protect against unauthorized processing or leaks.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Modifications</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          PoliBit reserves the right to modify this Privacy Notice at any time. Continued use of our services constitutes acceptance of such modifications.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
        Cookies and Web Beacons</p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          Our website may use cookies and web beacons to store browsing information. You may disable these technologies at any time.
        </p>

        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">Legal Provisions
        </p>
        <p className="text-lg opacity-90 max-w-4xl mx-auto mb-8">
          This Privacy Notice complies with the Law, its Regulations, and all applicable legal provisions.
        </p>

        <p className="text-lg font-semibold mt-10 opacity-100 max-w-4xl mx-auto">
          AS I NAVIGATE THROUGH THE SITE I EXPRESSLY CONSENT THAT ALL MY PERSONAL DATA BE PROCESSED IN ACCORDANCE WITH THE TERMS AND CONDITIONS OF THIS PRIVACY NOTICE, INCLUDING, WITHOUT LIMITATION, THE TRANSFER OF THE SAME IN ACCORDANCE WITH WHAT IS ESTABLISHED HERE.
        </p>
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