import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { AuthRedirectHandler } from "@/components/auth-redirect-handler";
import "./globals.css";

// Force dynamic rendering for pages that need server-side data
export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let firmName = 'PoliBit'
  let firmLogo = null

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    // Skip API call during build if API URL is not available
    if (apiUrl) {
      const response = await fetch(`${apiUrl}/api/firm-settings/logo`, {
        next: { revalidate: 3600 } // Cache for 1 hour, revalidate in background
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          if (result.data.firmName) {
            firmName = result.data.firmName
          }
          if (result.data.firmLogo) {
            firmLogo = result.data.firmLogo
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch firm settings for metadata:', error)
  }

  const description = "Automate investment operations from fundraising to distributions. Streamline real estate, equity and debt investments with digital workflows. $5M+ AUM, 500+ investors across 3 countries."

  return {
    title: firmName,
    description: description,
    ...(firmLogo && {
      icons: {
        icon: firmLogo,
        apple: firmLogo,
      },
    }),
    openGraph: {
      title: firmName,
      description: description,
      url: "https://www.polibit.io",
      siteName: firmName,
      ...(firmLogo && {
        images: [
          {
            url: firmLogo,
            width: 1200,
            height: 630,
            alt: `${firmName} - Investment Management Platform`,
          },
        ],
      }),
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: firmName,
      description: description,
      ...(firmLogo && {
        images: [firmLogo],
      }),
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
  }
}

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
        <AuthRedirectHandler />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
