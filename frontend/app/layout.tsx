import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

// Base URL for resolving absolute URLs in metadata
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "HireHub - Campus Placement Management System",
    template: "%s | HireHub",
  },
  description: "A comprehensive platform for managing campus placements, connecting students with top companies, and streamlining the hiring process.",
  keywords: ["campus placement", "hiring", "university recruitment", "jobs", "students", "companies", "HireHub"],
  authors: [{ name: "HireHub Admin" }],
  creator: "HireHub Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    title: "HireHub - Campus Placement Management System",
    description: "Streamlining campus recruitment for universities, students, and companies.",
    siteName: "HireHub",
    images: [{
      url: "/og-image.jpg", // We will define a fallback OG image later if needed
      width: 1200,
      height: 630,
      alt: "HireHub Platform Preview",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HireHub - Campus Placement",
    description: "Connecting talent with opportunity.",
    images: ["/og-image.jpg"],
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

// Organization Schema for JSON-LD
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "HireHub",
  "url": baseUrl,
  "logo": `${baseUrl}/logo.png`, // Assuming a logo exists or will exist
  "description": "A comprehensive platform for managing campus placements, connecting students with top companies.",
  "sameAs": [
    "https://twitter.com/hirehub",
    "https://linkedin.com/company/hirehub"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>HireHub - Campus Placement Management System</title>
        <meta name="description" content="A comprehensive platform for managing campus placements, connecting students with top companies, and streamlining the hiring process." />
        <meta property="og:title" content="HireHub - Campus Placement Management System" />
        <meta property="og:description" content="Streamlining campus recruitment for universities, students, and companies." />
      </head>
      {/* SEO: title description og: */}
      {/* UX: label placeholder aria-label */}
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientLayout>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
