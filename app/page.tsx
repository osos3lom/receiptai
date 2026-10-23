import React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Receipt,
  ArrowLeft,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  Terminal,
  ExternalLink,
  ChevronLeft,
} from "lucide-react"

const WHATSAPP_NUMBER = "966506542290"
const WHATSAPP_MSG =
  "مرحباً أ. أسامة، اطلعت على Receipt AI وأرغب بالاستفسار عن أتمتة الفواتير وربط النظام لشركتنا."
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 antialiased">
      {/* ── Apple-Inspired Minimal Navigation ── */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/icon.svg"
              alt="Receipt AI Logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-xl shadow-xs transition-transform group-hover:scale-105"
              priority
            />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                قارئ الفواتير
              </span>
              <span className="text-[11px] font-mono text-muted-foreground/80">
                Receipt AI
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/articles"
              className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors hidden sm:inline-flex"
            >
              المقالات
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>أتمتة الشركات</span>
            </a>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-xs hover:bg-primary/90 transition-all active:scale-95"
            >
              <span>جرب المحرك</span>
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── SECTION 1: HERO (Show, Don't Tell) ── */}
        <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 border-b border-border/40 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* App Icon Showcase */}
            <div className="flex justify-center">
              <div className="relative group cursor-default">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-primary/30 via-emerald-500/20 to-sky-400/30 blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Image
                  src="/icon.svg"
                  alt="Receipt AI Icon"
                  width={80}
                  height={80}
                  className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl shadow-xl shadow-primary/10 border border-border/50 transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
            </div>

            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/50 text-[11px] font-medium text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>ذكاء اصطناعي محلي ١٠٠٪ داخل المتصفح عبر WebGPU</span>
            </div>

            {/* Apple Headline: 6 words */}
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.15]">
              فواتيرك مؤتمتة.{" "}
              <span className="text-muted-foreground">بثانية واحدة.</span>
            </h1>

            {/* Subhead: 1 crisp sentence */}
            <p className="max-w-xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
              استخراج وتدقيق بيانات الفواتير والمصروفات مباشرة داخل جهازك دون رفع أي مستند لخوادم سحابية.
            </p>

            {/* The Two Primary Action Pills */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-full shadow-xs hover:bg-primary/90 transition-all active:scale-95 min-h-[44px]"
              >
                <Sparkles className="w-4 h-4" />
                <span>جرب المحرك مجاناً</span>
              </Link>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-secondary/70 hover:bg-secondary text-foreground font-semibold text-sm px-6 py-3 rounded-full border border-border transition-all active:scale-95 min-h-[44px]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-[#25D366]"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.33 7.34 9 7.42 8.73 7.71C8.45 8.01 7.68 8.74 7.68 10.21C7.68 11.69 8.76 13.11 8.91 13.31C9.06 13.51 11 16.5 13.94 17.77C14.64 18.07 15.18 18.25 15.61 18.39C16.31 18.61 16.95 18.58 17.45 18.5C18.01 18.42 19.18 17.79 19.42 17.11C19.67 16.44 19.67 15.86 19.59 15.74C19.52 15.62 19.32 15.55 19.02 15.4C18.73 15.25 17.29 14.54 17.02 14.44C16.76 14.34 16.56 14.29 16.37 14.59C16.17 14.88 15.6 15.55 15.43 15.75C15.25 15.94 15.08 15.97 14.78 15.82C14.49 15.67 13.54 15.36 12.41 14.35C11.53 13.57 10.94 12.6 10.79 12.35C10.64 12.1 10.77 11.97 10.92 11.82C11.05 11.69 11.21 11.47 11.36 11.3C11.5 11.13 11.55 11.01 11.65 10.81C11.75 10.61 11.7 10.44 11.63 10.29C11.55 10.14 10.97 8.72 10.72 8.13C10.49 7.55 10.25 7.63 10.07 7.62C9.9 7.61 9.71 7.61 9.51 7.61L9.53 7.34Z" />
                </svg>
                <span>أتمتة لشركتك (واتساب)</span>
              </a>
            </div>

            {/* ── Visual Artifact (Show, Don't Tell) ── */}
            <div className="pt-8">
              <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card/70 backdrop-blur-md p-4 sm:p-5 shadow-xs text-start space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
                    <span className="text-[11px] font-mono text-muted-foreground ms-2">
                      معالجة فورية • 0.8s
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    ✓ مدقق رياضياً
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                    <span className="text-[10px] text-muted-foreground block">المورد</span>
                    <span className="font-semibold text-foreground truncate block">شركة التقنية المتقدمة</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                    <span className="text-[10px] text-muted-foreground block">الرقم الضريبي</span>
                    <span className="font-mono text-foreground text-[11px] block">310245892100003</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                    <span className="text-[10px] text-muted-foreground block">ختم ZATCA QR</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] block">مشفر ومطابق ✓</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-[10px] text-primary block">الإجمالي النهائي</span>
                    <span className="font-mono font-bold text-foreground text-xs block">2,645.00 SAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: BENTO GRID (Solutions in Icons & Visuals) ── */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 border-b border-border/40">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                حلول مصممة لأتمتة أعمالك
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                ربط مباشر، خصوصية معزولة، وترخيص فوري لأنظمتك.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: On-Device AI & WebGPU */}
              <div className="group rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <Image
                      src="/brand-scanner-webgpu.jpg"
                      alt="WebGPU On-Device AI Scanner"
                      width={640}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
                    <span className="absolute bottom-3 start-3 text-[10px] font-semibold text-emerald-400 bg-background/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>WebGPU • معالجة فورية</span>
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-base text-foreground">
                      بيئة معزولة دون إنترنت
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      امتثال بنكي ورقابي صارم. المستندات تُعالج بالكامل على عتاد جهازك ولا تغادر شبكتكم الداخلية أبداً.
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-0">
                  <div className="flex items-center gap-2 pt-3 border-t border-border/40 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>100% On-Device • Zero Cloud Storage</span>
                  </div>
                </div>
              </div>

              {/* Card 2: ZATCA Compliance */}
              <div className="group rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:border-sky-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <Image
                      src="/brand-zatca-verification.jpg"
                      alt="ZATCA Compliance Verification"
                      width={640}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
                    <span className="absolute bottom-3 start-3 text-[10px] font-semibold text-sky-400 bg-background/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-sky-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                      <span>ZATCA Phase 2 • تدقيق فوري</span>
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-base text-foreground">
                      مطابقة واعتماد أختام ZATCA
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      فك تشفير أختام QR المشفرة من هيئة الزكاة والضريبة والجمارك ومطابقة الحسابات الرياضية والضريبة تلقائياً.
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-0">
                  <div className="flex items-center gap-2 pt-3 border-t border-border/40 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                    <CheckCircle2 className="w-4 h-4 text-sky-500" />
                    <span>تشفير Base64 • مدقق رياضياً 100%</span>
                  </div>
                </div>
              </div>

              {/* Card 3: ERP Accounting Sync */}
              <div className="group rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <Image
                      src="/brand-erp-integration.jpg"
                      alt="ERP Accounting Automation"
                      width={640}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
                    <span className="absolute bottom-3 start-3 text-[10px] font-semibold text-primary bg-background/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-primary/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      <span>تزامن القيود • أتمتة شاملة</span>
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-base text-foreground">
                      الربط مع أنظمة المحاسبة وERP
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      تصدير فوري لقيود الفواتير والمصروفات دون أي إدخال يدوي، متوافق مع البرامج المحاسبية المعتمدة.
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-0">
                  <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/40">
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-mono font-medium">Odoo</span>
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-mono font-medium">Zoho</span>
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-mono font-medium">SAP</span>
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-mono font-medium">Excel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: THE NUMBERS & CONVERSION ── */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-card/20">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* 4 Apple-Style Large Numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-2xl border border-border/60 bg-card/40 space-y-1">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-foreground block">
                  0.8s
                </span>
                <span className="text-xs text-muted-foreground">سرعة المعالجة لكل فاتورة</span>
              </div>
              <div className="p-4 rounded-2xl border border-border/60 bg-card/40 space-y-1">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-emerald-500 block">
                  100%
                </span>
                <span className="text-xs text-muted-foreground">خصوصية محلية بلا خوادم</span>
              </div>
              <div className="p-4 rounded-2xl border border-border/60 bg-card/40 space-y-1">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-foreground block">
                  0 SAR
                </span>
                <span className="text-xs text-muted-foreground">تكلفة استهلاك الـ APIs</span>
              </div>
              <div className="p-4 rounded-2xl border border-border/60 bg-card/40 space-y-1">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-primary block">
                  ZATCA
                </span>
                <span className="text-xs text-muted-foreground">مطابقة واعتماد ضريبي</span>
              </div>
            </div>

            {/* Minimal Conversion Strip */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start shadow-xs">
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground">
                  جاهز لأتمتة فواتير منشأتك؟
                </h3>
                <p className="text-xs text-muted-foreground">
                  تواصل مباشرة مع المهندس أسامة عالم عبر واتساب لمناقشة الربط والتطبيق.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/demo"
                  className="px-4 py-2 rounded-full border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  جرب المحرك
                </Link>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold shadow-xs transition-transform active:scale-95 inline-flex items-center gap-1.5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.33 7.34 9 7.42 8.73 7.71C8.45 8.01 7.68 8.74 7.68 10.21C7.68 11.69 8.76 13.11 8.91 13.31C9.06 13.51 11 16.5 13.94 17.77C14.64 18.07 15.18 18.25 15.61 18.39C16.31 18.61 16.95 18.58 17.45 18.5C18.01 18.42 19.18 17.79 19.42 17.11C19.67 16.44 19.67 15.86 19.59 15.74C19.52 15.62 19.32 15.55 19.02 15.4C18.73 15.25 17.29 14.54 17.02 14.44C16.76 14.34 16.56 14.29 16.37 14.59C16.17 14.88 15.6 15.55 15.43 15.75C15.25 15.94 15.08 15.97 14.78 15.82C14.49 15.67 13.54 15.36 12.41 14.35C11.53 13.57 10.94 12.6 10.79 12.35C10.64 12.1 10.77 11.97 10.92 11.82C11.05 11.69 11.21 11.47 11.36 11.3C11.5 11.13 11.55 11.01 11.65 10.81C11.75 10.61 11.7 10.44 11.63 10.29C11.55 10.14 10.97 8.72 10.72 8.13C10.49 7.55 10.25 7.63 10.07 7.62C9.9 7.61 9.71 7.61 9.51 7.61L9.53 7.34Z" />
                  </svg>
                  <span>واتساب</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Apple-Style Subtle Footer ── */}
      <footer className="border-t border-border/40 py-5 text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>خصوصية ١٠٠٪ داخل المتصفح</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/articles"
              className="hover:text-foreground transition-colors underline underline-offset-4"
            >
              المقالات والأدلة
            </Link>
            <span>•</span>
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
