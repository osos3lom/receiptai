import React from "react"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { getAssetPath } from "@/lib/utils"
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Tag,
  ChevronLeft,
  Receipt,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { getAllArticles } from "@/lib/articles-data"

export const metadata: Metadata = {
  title: "المقالات والأدلة التقنية — قارئ الفواتير الذكي Receipt AI",
  description: "أدلة شاملة حول الفوترة الإلكترونية للمرحلة الثانية من زاتكا، تقنية WebGPU لاستخراج الفواتير محلياً، وأتمتة قيود المحاسبة مع أنظمة ERP.",
  alternates: {
    canonical: "https://osos3lom.github.io/receiptai/articles/",
  },
  openGraph: {
    title: "المقالات والأدلة التقنية — قارئ الفواتير الذكي",
    description: "أدلة تقنية حول الفوترة الإلكترونية، فك تشفير أختام ZATCA، وتقنيات الذكاء الاصطناعي المحلية للمحاسبة.",
    url: "https://osos3lom.github.io/receiptai/articles/",
    siteName: "Receipt AI",
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: "https://osos3lom.github.io/receiptai/app-icon.jpg",
        width: 1200,
        height: 630,
        alt: "مقالات وأدلة Receipt AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "المقالات والأدلة التقنية — Receipt AI",
    description: "أدلة حول الفوترة الإلكترونية، أختام ZATCA، وتقنية WebGPU.",
    images: ["https://osos3lom.github.io/receiptai/app-icon.jpg"],
  },
}

export default function ArticlesPage() {
  const articles = getAllArticles()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 antialiased">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl border border-border/60 hover:bg-secondary/60 transition-colors min-h-[38px] active:scale-95"
            >
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
              <span>الرئيسية</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                المقالات والأدلة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full shadow-xs hover:bg-primary/90 transition-all active:scale-95 min-h-[38px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>جرب المحرك</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-6 sm:py-14 pb-28 sm:pb-16 space-y-8 sm:space-y-10">
        {/* Hero Section */}
        <div className="space-y-3.5 text-center sm:text-start max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-secondary/60 text-xs sm:text-sm font-bold text-muted-foreground">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>المعرفة التقنية والامتثال الضريبي</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.25] break-words">
            أدلة تقنية في الفوترة والذكاء الاصطناعي
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground leading-relaxed font-medium break-words">
            مقالات وشروحات مفصلة لمطابقة فواتير زاتكا (ZATCA)، تقنيات WebGPU المحلية، وأتمتة قيود المحاسبة للشركات.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="group rounded-2xl border-2 border-border/80 bg-card overflow-hidden shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between hover:shadow-md"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <Image
                    src={getAssetPath(article.image)}
                    alt={article.title.ar}
                    width={600}
                    height={375}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 end-3 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-foreground border border-border/60 shadow-xs">
                    {article.category.ar}
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground font-mono font-bold">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{article.date}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{article.readTime.ar}</span>
                    </span>
                  </div>

                  <h2 className="font-black text-lg sm:text-xl text-foreground leading-snug group-hover:text-primary transition-colors">
                    <Link href={`/articles/${article.slug}`}>
                      {article.title.ar}
                    </Link>
                  </h2>

                  <p className="text-sm sm:text-base text-muted-foreground line-clamp-3 leading-relaxed font-medium">
                    {article.description.ar}
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 pt-0">
                <Link
                  href={`/articles/${article.slug}`}
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-black text-primary group-hover:underline pt-3.5 border-t border-border/50 w-full justify-between min-h-[44px]"
                >
                  <span>قراءة المقال بالكامل</span>
                  <ChevronLeft className="w-5 h-5 rtl:rotate-0 ltr:rotate-180 group-hover:-translate-x-1.5 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-r from-primary/10 via-card to-emerald-500/10 p-6 sm:p-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 text-center sm:text-start shadow-xs">
          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground">
              جرّب المحرك الذكي على فواتيرك الآن
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
              فحص واستخراج فوري للبيانات محلياً داخل متصفحك دون رفع أي مستند.
            </p>
          </div>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black text-base sm:text-lg px-7 py-3.5 rounded-xl sm:rounded-full shadow-xs hover:bg-primary/90 transition-all active:scale-95 shrink-0 min-h-[48px]"
          >
            <Sparkles className="w-5 h-5" />
            <span>تجربة المحرك الحية</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-5 text-xs text-muted-foreground bg-card/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>خصوصية ١٠٠٪ داخل المتصفح</span>
          </div>

          <div className="flex items-center gap-2">
            <span>طُوّر بواسطة أسامه عالم</span>
            <span>•</span>
            <a
              href="https://www.osamamaalam.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline underline-offset-4"
            >
              osamamaalam.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
