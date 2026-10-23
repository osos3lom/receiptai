"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { getAssetPath } from "@/lib/utils"
import {
  Calendar,
  Clock,
  Sparkles,
  Share2,
  Check,
  ChevronLeft,
  ArrowRight,
  Tag,
  ArrowDown,
  Layers,
  ArrowLeftRight,
  Copy,
} from "lucide-react"
import type { Article } from "@/lib/articles-data"

interface ArticleReaderProps {
  article: Article
  relatedArticles: Article[]
}

// Cleans mathematical LaTeX notation into legible Unicode representations
function cleanMathFormula(latex: string): string {
  return latex
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\sum/g, "∑")
    .replace(/\\equiv/g, " ≡ ")
    .replace(/\\le/g, " ≤ ")
    .replace(/\\ge/g, " ≥ ")
    .replace(/\\ne/g, " ≠ ")
    .replace(/\\left\|/g, "|")
    .replace(/\\right\|/g, "|")
    .replace(/\\left\(/g, "(")
    .replace(/\\right\)/g, ")")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\\\/g, "")
    .replace(/\\%/g, "%")
    .replace(/\\times/g, "×")
    .trim()
}

// Formats inline markdown: **bold**, `code`, $$display_math$$, $inline_math$
function formatInline(text: string): React.ReactNode {
  if (!text) return null

  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\*\*[^*]+?\*\*|`[^`]+?`)/g
  const tokens: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index))
    }
    const raw = match[0]
    const key = `t-${match.index}`

    if (raw.startsWith("$$") && raw.endsWith("$$")) {
      const math = cleanMathFormula(raw.slice(2, -2))
      tokens.push(
        <span
          key={key}
          className="inline-flex max-w-full overflow-x-auto items-center my-2 px-3 py-1.5 rounded-xl bg-primary/10 border-2 border-primary/25 font-mono text-xs sm:text-sm md:text-base font-black text-primary shadow-2xs break-words"
          dir="ltr"
        >
          {math}
        </span>
      )
    } else if (raw.startsWith("$") && raw.endsWith("$")) {
      const math = cleanMathFormula(raw.slice(1, -1))
      tokens.push(
        <span
          key={key}
          className="inline-flex max-w-full overflow-x-auto items-center mx-1 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 font-mono text-xs sm:text-sm font-black text-primary"
          dir="ltr"
        >
          {math}
        </span>
      )
    } else if (raw.startsWith("**") && raw.endsWith("**")) {
      const boldText = raw.slice(2, -2).trim()
      tokens.push(
        <strong key={key} className="font-black text-foreground">
          {boldText}
        </strong>
      )
    } else if (raw.startsWith("`") && raw.endsWith("`")) {
      const codeText = raw.slice(1, -1).trim()
      tokens.push(
        <code
          key={key}
          className="mx-1 px-2 py-0.5 rounded-md bg-secondary border border-border/70 text-foreground font-mono text-xs sm:text-sm font-bold break-all"
          dir="ltr"
        >
          {codeText}
        </code>
      )
    }

    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex))
  }

  return tokens
}

// Mobile-friendly Code Block component with one-tap copy
function CodeBlock({ code, langTag }: { code: string; langTag: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Handled
    }
  }

  return (
    <div
      className="my-6 rounded-2xl border border-border/80 bg-slate-950 text-slate-100 overflow-hidden shadow-sm text-start"
      dir="ltr"
    >
      <div className="px-4 py-2.5 border-b border-slate-800 text-xs sm:text-sm font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>{langTag || "payload"}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white transition-all text-xs font-bold cursor-pointer min-h-[36px]"
          aria-label="نسخ الكود"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-bold">تم النسخ</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>نسخ الكود</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 sm:p-5 text-xs sm:text-sm md:text-base font-mono overflow-x-auto leading-relaxed text-slate-200 m-0 selection:bg-primary/30">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// Parses and renders Mermaid flowcharts as an Apple-style visual pipeline diagram
function renderVisualPipeline(code: string, isRTL: boolean) {
  const rawNodes = [...code.matchAll(/\["([^"]+)"\]/g)].map((m) => m[1])
  const uniqueSteps = Array.from(new Set(rawNodes))

  if (uniqueSteps.length === 0) {
    return (
      <div className="my-6 p-4 rounded-2xl bg-secondary/30 font-mono text-sm overflow-x-auto text-start" dir="ltr">
        <pre>{code}</pre>
      </div>
    )
  }

  return (
    <div className="my-6 sm:my-8 p-4 sm:p-7 rounded-2xl border-2 border-primary/25 bg-card/80 backdrop-blur-md shadow-xs space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
        <div className="flex items-center gap-2 text-primary font-black text-sm sm:text-base uppercase tracking-wide">
          <Layers className="w-5 h-5 text-primary shrink-0" />
          <span className="truncate">{isRTL ? "مخطط الأنابيب المعماري" : "Architectural Pipeline"}</span>
        </div>
        <span className="text-xs sm:text-sm font-mono font-black text-muted-foreground px-3 py-1 rounded-full bg-secondary border border-border shrink-0">
          {uniqueSteps.length} {isRTL ? "مراحل" : "Stages"}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {uniqueSteps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border border-border/80 bg-secondary/30 hover:border-primary/40 transition-colors">
              <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary text-primary-foreground font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs">
                {isRTL ? (idx + 1).toLocaleString("ar-SA") : idx + 1}
              </span>
              <div className="flex-1 text-sm sm:text-base md:text-lg font-extrabold text-foreground leading-snug break-words">
                {formatInline(step)}
              </div>
            </div>
            {idx < uniqueSteps.length - 1 && (
              <div className="flex justify-center -my-1 text-muted-foreground/60">
                <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// Parses list blocks keeping multi-line items and code/math attached to parent item
function parseListBlock(text: string): { label: string; details: string[] }[] {
  const lines = text.split("\n")
  const items: { label: string; details: string[] }[] = []
  let current: { label: string; details: string[] } | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const listMatch = line.match(/^(\d+\.|\*|-)\s+(.*)$/)
    if (listMatch) {
      if (current) items.push(current)
      current = { label: listMatch[2], details: [] }
    } else if (current) {
      current.details.push(line)
    }
  }
  if (current) items.push(current)
  return items
}

export default function ArticleReader({
  article,
  relatedArticles,
}: ArticleReaderProps) {
  const [lang, setLang] = useState<"ar" | "en">("ar")
  const [copied, setCopied] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Reading progress tracker for mobile & desktop
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100))
        setScrollProgress(progress)
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isRTL = lang === "ar"
  const title = article.title[lang]
  const description = article.description[lang]
  const readTime = article.readTime[lang]
  const category = article.category[lang]
  const content = article.content[lang]

  const handleShare = async () => {
    if (typeof window === "undefined") return
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Handled
    }
  }

  return (
    <>
      {/* Sleek Native-feeling Reading Progress Bar fixed at the top */}
      <div className="fixed top-0 inset-x-0 h-1 bg-transparent z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-primary via-emerald-500 to-primary transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <article className="space-y-6 sm:space-y-8 max-w-full overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
        {/* Top Meta & Language Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-black bg-primary/10 text-primary border border-primary/20">
              {category}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 font-mono font-semibold">
              <Calendar className="w-4 h-4" />
              <span>{article.date}</span>
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 font-mono font-semibold">
              <Clock className="w-4 h-4" />
              <span>{readTime}</span>
            </span>
          </div>

          {/* Language Switcher & Share with Apple HIG touch targets */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center bg-secondary p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setLang("ar")}
                className={`min-h-[42px] px-4 py-2 text-sm font-black rounded-lg transition-all cursor-pointer ${
                  lang === "ar"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={lang === "ar"}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`min-h-[42px] px-4 py-2 text-sm font-black rounded-lg transition-all cursor-pointer ${
                  lang === "en"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={lang === "en"}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="min-h-[42px] min-w-[42px] p-2.5 rounded-xl border border-border/70 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-2xs"
              title={lang === "ar" ? "مشاركة المقال" : "Share article"}
              aria-label={lang === "ar" ? "مشاركة المقال" : "Share article"}
            >
              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Article Header - Enlarged & Super Legible */}
        <header className="space-y-3 sm:space-y-4 text-start">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.25] break-words">
            {title}
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium break-words">
            {description}
          </p>
        </header>

        {/* Hero Image */}
        <div className="relative aspect-[16/10] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-border/80 shadow-xs bg-muted">
          <Image
            src={getAssetPath(article.image)}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 896px"
            className="object-cover"
          />
        </div>

        {/* Article Body - Enlarged Font Sizes for Maximum Readability */}
        <div className="space-y-6 sm:space-y-7 text-start">
          {content.split("\n\n").map((block, idx) => {
            const trimmed = block.trim()
            if (!trimmed) return null

            // Markdown H3 Heading
            if (trimmed.startsWith("### ")) {
              const rawHeading = trimmed.replace("### ", "").trim()
              return (
                <h2
                  key={idx}
                  className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground pt-6 sm:pt-8 pb-2.5 border-b-2 border-border/40 tracking-tight leading-snug break-words"
                >
                  {formatInline(rawHeading)}
                </h2>
              )
            }

            // Fenced Code Blocks (JSON vs Mermaid vs Generic)
            if (trimmed.startsWith("```")) {
              const lines = trimmed.split("\n")
              const langTag = lines[0].replace("```", "").trim()
              const codeContent = lines
                .slice(1, lines[lines.length - 1].startsWith("```") ? -1 : undefined)
                .join("\n")

              if (langTag === "mermaid") {
                return <div key={idx}>{renderVisualPipeline(codeContent, isRTL)}</div>
              }

              return <CodeBlock key={idx} code={codeContent} langTag={langTag} />
            }

            // Markdown Table with Mobile Horizontal Swipe Banner
            if (trimmed.includes("|") && trimmed.includes("---")) {
              const rows = trimmed.split("\n").filter((r) => r.trim().startsWith("|"))
              if (rows.length >= 2) {
                const headers = rows[0]
                  .split("|")
                  .map((c) => c.trim())
                  .filter(Boolean)
                const bodyRows = rows.slice(2).map((r) =>
                  r
                    .split("|")
                    .map((c) => c.trim())
                    .filter(Boolean)
                )

                return (
                  <div key={idx} className="my-6 rounded-2xl border-2 border-border/80 bg-card overflow-hidden shadow-xs">
                    {/* Mobile Swipe Notice */}
                    <div className="sm:hidden px-4 py-2.5 bg-secondary/80 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground font-bold">
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4 text-primary shrink-0" />
                        <span>{isRTL ? "اسحب أفقياً لاستعراض كامل الجدول" : "Swipe horizontally to view full table"}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {headers.length} {isRTL ? "أعمدة" : "cols"}
                      </span>
                    </div>

                    <div className="overflow-x-auto touch-pan-x">
                      <table className="w-full text-start text-sm sm:text-base min-w-[520px]">
                        <thead className="bg-secondary/70 border-b border-border text-foreground font-black">
                          <tr>
                            {headers.map((h, i) => (
                              <th key={i} className="px-4 py-3.5 text-start font-black whitespace-nowrap">
                                {formatInline(h)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 font-semibold">
                          {bodyRows.map((cols, rIdx) => (
                            <tr key={rIdx} className="hover:bg-secondary/20 transition-colors">
                              {cols.map((col, cIdx) => (
                                <td key={cIdx} className="px-4 py-3.5 text-start text-foreground/90 font-medium">
                                  {formatInline(col)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              }
            }

            // Markdown Blockquote / Alert Tip
            if (trimmed.startsWith("> [!TIP]") || trimmed.startsWith("> [!IMPORTANT]")) {
              const isTip = trimmed.startsWith("> [!TIP]")
              const text = trimmed.replace(/> \[[^\]]+\]/, "").trim()
              return (
                <div
                  key={idx}
                  className={`my-6 p-4.5 sm:p-5 rounded-2xl border-2 flex items-start gap-3.5 text-base sm:text-lg md:text-xl leading-relaxed shadow-2xs font-semibold ${
                    isTip
                      ? "bg-primary/5 border-primary/25 text-foreground"
                      : "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                  }`}
                >
                  <Sparkles className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <div className="break-words [overflow-wrap:anywhere]">{formatInline(text)}</div>
                </div>
              )
            }

            // Numbered / Bullet List Blocks
            if (/^(\d+\.|\*|-)\s+/.test(trimmed)) {
              const listItems = parseListBlock(trimmed)
              return (
                <div key={idx} className="space-y-4 my-6">
                  {listItems.map((item, i) => (
                    <div
                      key={i}
                      className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-secondary/20 space-y-2.5 shadow-2xs hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary text-primary-foreground font-black text-sm sm:text-base flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          {isRTL ? (i + 1).toLocaleString("ar-SA") : i + 1}
                        </span>
                        <div className="text-base sm:text-xl md:text-2xl font-black text-foreground leading-snug break-words">
                          {formatInline(item.label)}
                        </div>
                      </div>
                      {item.details.length > 0 && (
                        <div className="ps-11 sm:ps-13 space-y-2 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed font-medium break-words [overflow-wrap:anywhere]">
                          {item.details.map((detail, dIdx) => (
                            <div key={dIdx}>{formatInline(detail)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            }

            // Horizontal Rule Divider
            if (trimmed === "---") {
              return <hr key={idx} className="my-8 border-border/60" />
            }

            // Standard Body Paragraph - Ultra Large & Clean Font for iPhone
            return (
              <p
                key={idx}
                className="text-lg sm:text-xl md:text-2xl text-foreground/95 leading-[1.85] sm:leading-[1.9] font-medium break-words [overflow-wrap:anywhere]"
              >
                {formatInline(trimmed)}
              </p>
            )
          })}
        </div>

        {/* Keywords Tags */}
        <div className="pt-6 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-2.5">
            <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-bold text-muted-foreground">
              {lang === "ar" ? "الكلمات المفتاحية:" : "Keywords:"}
            </span>
            {article.keywords.map((kw, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-lg bg-secondary text-xs sm:text-sm font-bold text-muted-foreground border border-border/50"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Action CTA Bar */}
        <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-r from-primary/10 via-card to-emerald-500/10 p-5 sm:p-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 text-center sm:text-start shadow-xs">
          <div className="space-y-1.5">
            <p className="text-lg sm:text-2xl md:text-3xl font-black text-foreground">
              {lang === "ar" ? "تريد تجربة الفحص بنفسك الآن؟" : "Ready to test in-browser OCR?"}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
              {lang === "ar"
                ? "جرّب محرك Receipt AI مجاناً على فواتيرك عبر معالج جهازك وبخصوصية تامة."
                : "Try Receipt AI on your receipts locally with WebGPU speed and 100% privacy."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black text-base sm:text-lg px-6 py-3.5 rounded-xl sm:rounded-full shadow-xs hover:bg-primary/90 transition-all active:scale-95 min-h-[48px]"
            >
              <Sparkles className="w-5 h-5" />
              <span>{lang === "ar" ? "تجربة المحرك" : "Live Demo"}</span>
            </Link>
            <a
              href={`https://wa.me/966506542290?text=${encodeURIComponent(
                lang === "ar"
                  ? `مرحباً أ. أسامة، قرأت مقال "${title}" وأرغب بمناقشة تطبيق هذا النظام لشركتنا.`
                  : `Hello Osama, I read the article "${title}" and would like to discuss enterprise receipt integration.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-base sm:text-lg px-6 py-3.5 rounded-xl sm:rounded-full shadow-xs transition-all active:scale-95 min-h-[48px]"
            >
              <span>{lang === "ar" ? "تواصل واتساب" : "WhatsApp"}</span>
            </a>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="pt-6 sm:pt-8 space-y-4">
            <h3 className="text-lg sm:text-2xl font-black text-foreground">
              {lang === "ar" ? "مقالات ذات صلة" : "Related Articles"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/articles/${rel.slug}`}
                  className="group p-4.5 sm:p-5 rounded-2xl border-2 border-border/70 hover:border-primary/50 bg-card/60 transition-all space-y-2.5 block shadow-2xs active:scale-[0.99]"
                >
                  <span className="text-xs font-black text-primary uppercase tracking-wide">
                    {rel.category[lang]}
                  </span>
                  <p className="font-black text-base sm:text-xl text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {rel.title[lang]}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-primary group-hover:underline pt-1">
                    <span>{lang === "ar" ? "قراءة المقال" : "Read Article"}</span>
                    <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  )
}