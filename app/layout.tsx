import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://osos3lom.github.io/receiptai"),
  title: "قارئ الفواتير الذكي — Receipt AI | محلي وفوري بخصوصية تامة",
  description: "استخراج بيانات الفواتير والمستندات الضريبية ومطابقتها محلياً بخصوصية تامة داخل المتصفح بتقنية WebGPU والذكاء الاصطناعي دون رفع أي بيانات.",
  keywords: [
    "قارئ الفواتير",
    "Receipt AI",
    "فاتورة ضريبية",
    "استخراج بيانات الفاتورة",
    "WebGPU OCR",
    "ZATCA receipt reader",
    "AI receipt scanner",
    "هيئة الزكاة والضريبة والجمارك",
    "تدقيق الفواتير",
  ],
  authors: [{ name: "Osama 3alam", url: "https://github.com/osos3lom" }],
  creator: "Osama 3alam",
  publisher: "Osama 3alam",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://osos3lom.github.io/receiptai/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "قارئ الفواتير الذكي — Receipt AI",
    description: "استخراج وتدقيق بيانات الفواتير والمستندات الضريبية محلياً بخصوصية تامة 100% داخل المتصفح بتقنية WebGPU.",
    url: "https://osos3lom.github.io/receiptai/",
    siteName: "Receipt AI",
    locale: "ar_SA",
    alternateLocale: ["en_US"],
    type: "website",
    images: [
      {
        url: "https://osos3lom.github.io/receiptai/app-icon.jpg",
        width: 1200,
        height: 630,
        alt: "قارئ الفواتير الذكي — Receipt AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "قارئ الفواتير الذكي — Receipt AI",
    description: "استخراج وتدقيق بيانات الفواتير والمستندات الضريبية محلياً بخصوصية تامة 100% داخل المتصفح.",
    images: ["https://osos3lom.github.io/receiptai/app-icon.jpg"],
    creator: "@osos3lom",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/app-icon.jpg" },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Receipt AI",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Receipt AI — قارئ الفواتير الذكي",
  alternateName: ["قارئ الفواتير الذكي", "ReceiptAI"],
  url: "https://osos3lom.github.io/receiptai/",
  description: "استخراج بيانات الفواتير والمستندات الضريبية ومطابقتها محلياً بخصوصية تامة داخل المتصفح بتقنية WebGPU والذكاء الاصطناعي.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "All modern browsers",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "SAR",
  },
  featureList: [
    "WebGPU on-device OCR inference",
    "ZATCA tax receipt parsing and QR verification",
    "Offline-first processing",
    "Zero-server-upload 100% privacy",
    "Bilingual Arabic and English interface",
  ],
  author: {
    "@type": "Person",
    name: "Osama 3alam",
    url: "https://github.com/osos3lom",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen selection:bg-primary/20 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
