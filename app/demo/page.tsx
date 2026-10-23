import type { Metadata } from "next"
import ReceiptDemo from "@/components/receipt-demo"

export const metadata: Metadata = {
  title: "التجربة الحية المباشرة — قارئ الفواتير الذكي Receipt AI",
  description: "جرب استخراج وتدقيق بيانات الفواتير والمستندات الضريبية محلياً داخل المتصفح عبر تقنية WebGPU مجاناً وبخصوصية تامة دون خوادم سحابية.",
  alternates: {
    canonical: "https://osos3lom.github.io/receiptai/demo/",
  },
  openGraph: {
    title: "التجربة الحية — قارئ الفواتير الذكي Receipt AI",
    description: "استخراج وتدقيق فوري لبيانات الفواتير الضريبية محلياً داخل المتصفح بتقنية WebGPU بخصوصية تامة.",
    url: "https://osos3lom.github.io/receiptai/demo/",
    siteName: "Receipt AI",
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: "https://osos3lom.github.io/receiptai/app-icon.jpg",
        width: 1200,
        height: 630,
        alt: "تجربة قارئ الفواتير الذكي — Receipt AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "التجربة الحية — قارئ الفواتير الذكي Receipt AI",
    description: "فحص وتدقيق فوري لبيانات الفواتير الضريبية محلياً داخل المتصفح بتقنية WebGPU.",
    images: ["https://osos3lom.github.io/receiptai/app-icon.jpg"],
  },
}

export default function DemoPage() {
  return <ReceiptDemo />
}
