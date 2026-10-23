import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ArrowRight,
  Calendar,
  Clock,
  Sparkles,
  ChevronLeft,
  Share2,
  BookOpen,
  ShieldCheck,
  ExternalLink,
} from "lucide-react"
import {
  getArticleBySlug,
  getAllArticleSlugs,
  getAllArticles,
} from "@/lib/articles-data"
import ArticleReader from "./article-reader"

interface ArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    return {
      title: "المقال غير موجود — Receipt AI",
    }
  }

  const url = `https://osos3lom.github.io/receiptai/articles/${slug}/`

  return {
    title: `${article.title.ar} — قارئ الفواتير الذكي`,
    description: article.description.ar,
    keywords: article.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.title.ar,
      description: article.description.ar,
      url: url,
      siteName: "Receipt AI",
      locale: "ar_SA",
      type: "article",
      publishedTime: article.date,
      authors: ["Osama Alam"],
      images: [
        {
          url: `https://osos3lom.github.io/receiptai${article.image}`,
          width: 1200,
          height: 630,
          alt: article.title.ar,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title.ar,
      description: article.description.ar,
      images: [`https://osos3lom.github.io/receiptai${article.image}`],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const allArticles = getAllArticles()
  const relatedArticles = allArticles
    .filter((a) => a.slug !== article.slug)
    .slice(0, 2)

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: article.title.ar,
    description: article.description.ar,
    image: `https://osos3lom.github.io/receiptai${article.image}`,
    datePublished: article.date,
    dateModified: article.date,
    inLanguage: ["ar", "en"],
    author: {
      "@type": "Person",
      name: "Osama 3alam",
      url: "https://www.osamamaalam.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Receipt AI",
      url: "https://osos3lom.github.io/receiptai/",
      logo: {
        "@type": "ImageObject",
        url: "https://osos3lom.github.io/receiptai/app-icon.jpg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://osos3lom.github.io/receiptai/articles/${slug}/`,
    },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "الرئيسية",
        item: "https://osos3lom.github.io/receiptai/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "المقالات",
        item: "https://osos3lom.github.io/receiptai/articles/",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title.ar,
        item: `https://osos3lom.github.io/receiptai/articles/${slug}/`,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 antialiased">
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-border/40 bg-background/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl border border-border/60 hover:bg-secondary/60 transition-colors min-h-[38px] active:scale-95"
            >
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
              <span>المقالات</span>
            </Link>
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

      {/* Main Content & Reader */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-3.5 sm:px-6 py-6 sm:py-10 pb-28 sm:pb-14">
        <ArticleReader article={article} relatedArticles={relatedArticles} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-xs text-muted-foreground bg-card/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
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
