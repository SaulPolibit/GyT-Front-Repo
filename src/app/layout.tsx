import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PoliBit - Investment Management Platform for Real Estate, PE & Private Debt",
  description: "Automate investment operations from fundraising to distributions. Streamline real estate, equity and debt investments with digital workflows. $5M+ AUM, 500+ investors across 3 countries.",
  openGraph: {
    title: "PoliBit - Investment Management Platform for Real Estate, PE & Private Debt",
    description: "Automate investment operations from fundraising to distributions. Streamline real estate, equity and debt investments with digital workflows. $5M+ AUM, 500+ investors across 3 countries.",
    url: "https://www.polibit.io",
    siteName: "PoliBit",
    images: [
      {
        url: "https://www.polibit.io/logo.png",
        width: 1200,
        height: 630,
        alt: "PoliBit - Investment Management Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PoliBit - Investment Management Platform for Real Estate, PE & Private Debt",
    description: "Automate investment operations from fundraising to distributions. Streamline real estate, equity and debt investments with digital workflows. $5M+ AUM, 500+ investors across 3 countries.",
    images: ["https://www.polibit.io/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PoliBit",
    "url": "https://www.polibit.io",
    "logo": "https://www.polibit.io/logo.png",
    "description": "Complete Multi-Asset Investment Platform for real estate, private equity, and private debt with end-to-end automation, cross-border capabilities, and institutional-grade operations",
    "sameAs": [
      "https://www.linkedin.com/company/polibit"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Sales",
      "email": "jl@polibit.io"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://t.contentsquare.net/uxa/543e45fcdd23b.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
