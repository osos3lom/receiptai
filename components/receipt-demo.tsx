"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { getAssetPath } from "@/lib/utils"
import {
  Download,
  Upload,
  Cpu,
  Sparkles,
  Check,
  Trash2,
  Camera,
  RefreshCw,
  Clock,
  ShieldCheck,
  Receipt,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Globe,
  Info,
  Store,
  Calendar,
  Tag,
  Hash,
  CreditCard,
  Copy,
  FileText,
  SlidersHorizontal,
  Eye,
  Maximize2,
  X,
  ExternalLink,
  ArrowRight,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import {
  checkWebGPUSupport,
  isModelCachedInBrowser,
  isVisionModelLoaded,
  getCachedVisionModel,
  clearModelCache,
  initVisionModel,
  extractReceiptData,
  type ModelProgress,
  type InferenceResult,
} from "@/lib/webgpu-vision"
import type { ParsedReceipt, ExpenseCategory } from "@/lib/receipt-parser"
import { translations, type Language } from "@/lib/i18n"

// Safe storage access guards to prevent DOMException in restricted/private browser modes
function safeGetStorage(key: string, type: "local" | "session" = "local"): string | null {
  try {
    if (typeof window === "undefined") return null
    const storage = type === "local" ? window.localStorage : window.sessionStorage
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function safeSetStorage(key: string, value: string, type: "local" | "session" = "local"): void {
  try {
    if (typeof window === "undefined") return
    const storage = type === "local" ? window.localStorage : window.sessionStorage
    storage?.setItem(key, value)
  } catch {
    // Restricted storage handled
  }
}

function safeRemoveStorage(key: string, type: "local" | "session" = "local"): void {
  try {
    if (typeof window === "undefined") return
    const storage = type === "local" ? window.localStorage : window.sessionStorage
    storage?.removeItem(key)
  } catch {
    // Restricted storage handled
  }
}

// Reusable Apple-style optional "i" info badge
function InfoTip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Information"
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0 cursor-pointer active:scale-95"
        >
          <Info className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs sm:text-sm p-3 text-center shadow-lg border border-border font-medium leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

export default function ReceiptDemo() {
  // Locale State: Arabic First by Default
  const [lang, setLang] = useState<Language>("ar")
  const t = translations[lang]
  const isRTL = lang === "ar"

  // Step 1: Model state
  const [webGpuAvailable, setWebGpuAvailable] = useState<boolean | null>(null)
  const [isCached, setIsCached] = useState<boolean>(false)
  const [modelState, setModelState] = useState<ModelProgress>({
    status: "idle",
    progress: 0,
    downloadedMB: 0,
    totalMB: 185,
    backend: "none",
  })
  const [modelInstance, setModelInstance] = useState<any>(null)

  // Step 2: Upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageName, setImageName] = useState<string>("")
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Step 3: Inference, Reviewer & Side-by-Side state
  const [isExtracting, setIsExtracting] = useState<boolean>(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [result, setResult] = useState<InferenceResult | null>(null)
  const [editedReceipt, setEditedReceipt] = useState<ParsedReceipt | null>(null)
  const [imageZoom, setImageZoom] = useState<number>(1)
  const [copiedType, setCopiedType] = useState<"json" | "csv" | null>(null)
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ id: string; time: string; parsed: ParsedReceipt }>>([])

  // Mobile UX: Responsive Segmented View Mode in Step 3 ('data' or 'doc')
  const [mobileAuditTab, setMobileAuditTab] = useState<"data" | "doc">("data")
  // Mobile UX: Fullscreen image peek modal
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false)

  // Current active step tracking
  const currentStep = !modelInstance ? 1 : !imagePreview ? 2 : 3

  // Quick test sample definitions
  const SAMPLE_RECEIPTS = [
    {
      id: "sample-arabic",
      label: t.sampleArabicLabel,
      store: "شركة وادي السيليكون",
      total: "264.50 SAR",
      ref: "SA-908124",
    },
    {
      id: "sample-saas",
      label: t.sampleSaasLabel,
      store: "masaravenue.com",
      total: "204.98 AED",
      ref: "4074958385",
    },
    {
      id: "sample-english",
      label: t.sampleEnglishLabel,
      store: "Tech Hub Store",
      total: "$94.86 USD",
      ref: "TH-89241",
    },
  ]

  const CATEGORY_MAP: Record<ExpenseCategory, string> = {
    "Software & Subscriptions": t.catSoftware,
    "Office & IT Equipment": t.catOffice,
    "Travel & Transportation": t.catTravel,
    "Meals & Entertainment": t.catMeals,
    "Utilities & Telecom": t.catUtilities,
    "General Business Expense": t.catGeneral,
  }

  // Update HTML document direction and language when toggled
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = isRTL ? "rtl" : "ltr"
  }, [lang, isRTL])

  // Initial browser capability & engine status checks (zero console warnings)
  useEffect(() => {
    async function initCheck() {
      const gpuOk = await checkWebGPUSupport()
      setWebGpuAvailable(gpuOk)
      const cached = await isModelCachedInBrowser()
      setIsCached(cached)

      const savedHistory = safeGetStorage("receipt_ai_history", "local")
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory)
          if (Array.isArray(parsed)) {
            setHistory(parsed)
          }
        } catch {
          // Handled silently
        }
      }

      // Restore engine reference if already active in memory
      if (isVisionModelLoaded()) {
        const cachedModel = getCachedVisionModel()
        if (cachedModel) {
          setModelInstance(cachedModel)
          setModelState({
            status: "ready",
            progress: 100,
            downloadedMB: 185,
            totalMB: 185,
            backend: cachedModel.backend || (gpuOk ? "webgpu" : "wasm"),
          })
          setIsCached(true)
        }
      }
    }
    initCheck()
  }, [])

  // Sync edited receipt when new result arrives
  useEffect(() => {
    if (result) {
      setEditedReceipt({ ...result.parsed })
      setMobileAuditTab("data")
    }
  }, [result])

  // Step 1 Handler: Download and initialize model
  const handleStartModel = async () => {
    try {
      const model = await initVisionModel((progress) => {
        setModelState(progress)
      })
      setModelInstance(model)
      setIsCached(true)
      safeSetStorage("receipt_ai_started", "true", "session")
    } catch {
      setModelState((prev) => ({
        ...prev,
        status: "error",
        message: isRTL ? "تعذر تشغيل المحرك" : "Failed to start model",
      }))
    }
  }

  // Clear browser model storage
  const handleClearCache = async () => {
    await clearModelCache()
    setIsCached(false)
    setModelInstance(null)
    safeRemoveStorage("receipt_ai_started", "session")
    setModelState({
      status: "idle",
      progress: 0,
      downloadedMB: 0,
      totalMB: 185,
      backend: "none",
    })
    setDownloadNotice(t.purged)
    setTimeout(() => setDownloadNotice(null), 3000)
  }

  // Step 2 Handlers: Image selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageName(file.name)
    setSelectedSampleId(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setImagePreview(dataUrl)
      setResult(null)
      setEditedReceipt(null)
      setImageZoom(1)
    }
    reader.readAsDataURL(file)
  }

  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId)
    const sample = SAMPLE_RECEIPTS.find((s) => s.id === sampleId)
    setImageName(sample?.label || "Sample")
    setImageZoom(1)

    // Draw preview canvas
    const canvas = document.createElement("canvas")
    canvas.width = 520
    canvas.height = 620
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#f4f4f6"
      ctx.fillRect(16, 16, 488, 88)

      ctx.fillStyle = "#1d1d1f"
      ctx.font = 'bold 20px "IBM Plex Sans Arabic", -apple-system, sans-serif'
      ctx.textAlign = "center"
      ctx.fillText(sample?.store || "TAX INVOICE", 260, 52)

      ctx.font = '13px "IBM Plex Sans Arabic", -apple-system, sans-serif'
      ctx.fillStyle = "#6e6e73"
      ctx.fillText(
        sampleId === "sample-arabic"
          ? "فاتورة ضريبية مبسطة • الدفع: مدى • الرقم: SA-908124"
          : sampleId === "sample-saas"
          ? "Confirmation: 4074958385 • Payment: Visa"
          : "Tax Invoice • Payment: Apple Pay",
        260,
        80
      )

      ctx.strokeStyle = "#d2d2d7"
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(32, 130)
      ctx.lineTo(488, 130)
      ctx.stroke()

      ctx.setLineDash([])
      ctx.font = '14px "IBM Plex Sans Arabic", -apple-system, sans-serif'
      ctx.fillStyle = "#1d1d1f"

      if (sampleId === "sample-arabic") {
        ctx.textAlign = "right"
        ctx.fillText("بند ١: مجموعة الأجهزة الإلكترونية الأساسية", 488, 175)
        ctx.textAlign = "left"
        ctx.fillText("120.00 SAR", 32, 175)

        ctx.textAlign = "right"
        ctx.fillText("بند ٢: كابل بيانات عالي السرعة", 488, 225)
        ctx.textAlign = "left"
        ctx.fillText("110.00 SAR", 32, 225)

        ctx.textAlign = "right"
        ctx.fillText("ضريبة القيمة المضافة (١٥٪)", 488, 275)
        ctx.textAlign = "left"
        ctx.fillText("34.50 SAR", 32, 275)
      } else if (sampleId === "sample-saas") {
        ctx.textAlign = "left"
        ctx.fillText("masaravenue.com Domain Renewal", 32, 175)
        ctx.textAlign = "right"
        ctx.fillText("78.51 AED", 488, 175)

        ctx.textAlign = "left"
        ctx.fillText("Cloud Workspace Pro (Quarterly)", 32, 225)
        ctx.textAlign = "right"
        ctx.fillText("99.00 AED", 488, 225)

        ctx.textAlign = "left"
        ctx.fillText("VAT & Taxes (5%)", 32, 275)
        ctx.textAlign = "right"
        ctx.fillText("27.47 AED", 488, 275)
      } else {
        ctx.textAlign = "left"
        ctx.fillText("Item 1: Tech Hardware Accessory", 32, 175)
        ctx.textAlign = "right"
        ctx.fillText("$45.00", 488, 175)

        ctx.textAlign = "left"
        ctx.fillText("Item 2: High-Speed Cable", 32, 225)
        ctx.textAlign = "right"
        ctx.fillText("$37.49", 488, 225)

        ctx.textAlign = "left"
        ctx.fillText("Sales Tax", 32, 275)
        ctx.textAlign = "right"
        ctx.fillText("$12.37", 488, 275)
      }

      ctx.strokeStyle = "#d2d2d7"
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(32, 320)
      ctx.lineTo(488, 320)
      ctx.stroke()

      ctx.setLineDash([])
      ctx.font = 'bold 18px "IBM Plex Sans Arabic", -apple-system, sans-serif'
      ctx.fillStyle = "#0071e3"
      if (sampleId === "sample-arabic") {
        ctx.textAlign = "right"
        ctx.fillText("الإجمالي المستحق", 488, 370)
        ctx.textAlign = "left"
        ctx.fillText(sample?.total || "264.50 SAR", 32, 370)
      } else {
        ctx.textAlign = "left"
        ctx.fillText("Grand Total", 32, 370)
        ctx.textAlign = "right"
        ctx.fillText(sample?.total || "0.00", 488, 370)
      }

      setImagePreview(canvas.toDataURL("image/png"))
      setResult(null)
      setEditedReceipt(null)
    }
  }

  // Step 3 Handler: Run in-browser WebGPU extraction
  const handleExtract = async () => {
    if (!imagePreview) return
    setIsExtracting(true)

    setExtractError(null)

    try {
      // Always pass the actual image data. Passing the sample's string id used to route
      // into a hardcoded text fallback, so sample receipts never reached the model.
      const extraction = await extractReceiptData(imagePreview, modelInstance)
      setResult(extraction)
      setEditedReceipt({ ...extraction.parsed })

      const newHistoryItem = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" }),
        parsed: extraction.parsed,
      }
      const updatedHistory = [newHistoryItem, ...history.slice(0, 9)]
      setHistory(updatedHistory)
      safeSetStorage("receipt_ai_history", JSON.stringify(updatedHistory), "local")
    } catch (err) {
      // Surface the failure. Silently swallowing it left the previous result on screen
      // as though it belonged to the newly uploaded image.
      setResult(null)
      setEditedReceipt(null)
      setExtractError(
        err instanceof Error
          ? err.message
          : isRTL
            ? "تعذر استخراج البيانات من هذه الصورة."
            : "Could not extract data from this image."
      )
    } finally {
      setIsExtracting(false)
    }
  }

  // Form field changes with automatic math reconciliation
  const handleFieldChange = (field: keyof ParsedReceipt, value: any) => {
    if (!editedReceipt) return
    const updated = { ...editedReceipt, [field]: value }

    if (field === "subTotal" || field === "vatAmount" || field === "total") {
      // The check only means something once all three figures exist.
      const allPresent = [updated.total, updated.subTotal, updated.vatAmount].every(
        (v) => String(v ?? "").trim() !== ""
      )
      updated.mathCheckable = allPresent
      if (allPresent) {
        const numTotal = parseFloat(updated.total) || 0
        const numSub = parseFloat(updated.subTotal) || 0
        const numVat = parseFloat(updated.vatAmount) || 0
        const expected = Number((numSub + numVat).toFixed(2))
        const diff = Number(Math.abs(numTotal - expected).toFixed(2))
        updated.isMathBalanced = diff <= 0.05
        updated.mathDifference = diff
      } else {
        updated.isMathBalanced = false
        updated.mathDifference = 0
      }
    }

    // Drop a field from the "not read" list once the user has filled it in.
    if (updated.missingFields && updated.missingFields.length > 0) {
      const keyFor: Partial<Record<keyof ParsedReceipt, string>> = {
        store: "store",
        date: "date",
        total: "total",
        subTotal: "subtotal",
        vatAmount: "vat_amount",
        currency: "currency",
      }
      const key = keyFor[field]
      if (key && String(value ?? "").trim() !== "") {
        updated.missingFields = updated.missingFields.filter((k) => k !== key)
      }
    }

    setEditedReceipt(updated)
  }

  // Auto-balance math
  const handleAutoReconcile = () => {
    if (!editedReceipt) return
    const numSub = parseFloat(editedReceipt.subTotal) || 0
    const numVat = parseFloat(editedReceipt.vatAmount) || 0
    const reconciledTotal = (numSub + numVat).toFixed(2)
    handleFieldChange("total", reconciledTotal)
  }

  // Copy helpers
  const copyToClipboard = async (type: "json" | "csv") => {
    const data = editedReceipt || result?.parsed
    if (!data) return

    let content = ""
    if (type === "json") {
      content = JSON.stringify(data, null, 2)
    } else if (type === "csv") {
      const header = "Store,Date,Category,Reference,Payment,Subtotal,Tax,Total,Currency,AuditStatus\n"
      const row = `"${data.store}","${data.date}","${data.category}","${data.referenceNumber || ""}","${data.paymentMethod || ""}","${data.subTotal}","${data.vatAmount}","${data.total}","${data.currency}","${data.isMathBalanced ? "Verified" : "Discrepancy"}"`
      content = "\uFEFF" + header + row
    }

    await navigator.clipboard.writeText(content)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  // Direct file downloads
  const handleDownloadFile = (format: "csv" | "json") => {
    const data = editedReceipt || result?.parsed
    if (!data) return

    const sanitizedStore = (data.store || "receipt").replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, "_").toLowerCase()
    const filename = `${sanitizedStore}_${data.date || "invoice"}.${format}`

    let content = ""
    let mimeType = ""

    if (format === "csv") {
      const header = "Store,Date,Category,Reference,Payment,Subtotal,Tax,Total,Currency,AuditStatus\n"
      const row = `"${data.store}","${data.date}","${data.category}","${data.referenceNumber || ""}","${data.paymentMethod || ""}","${data.subTotal}","${data.vatAmount}","${data.total}","${data.currency}","${data.isMathBalanced ? "Verified" : "Discrepancy"}"`
      content = "\uFEFF" + header + row
      mimeType = "text/csv;charset=utf-8;"
    } else {
      content = JSON.stringify(data, null, 2)
      mimeType = "application/json;charset=utf-8;"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setDownloadNotice(`${t.downloaded}: ${filename}`)
    setTimeout(() => setDownloadNotice(null), 3000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans w-full max-w-full overflow-x-clip">
      {/* Apple Mobile-Optimized Header */}
      <header className="border-b border-border apple-vibrancy sticky top-0 z-40 transition-colors w-full max-w-full overflow-hidden">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground px-2.5 sm:px-3 py-2 rounded-xl border border-border/70 hover:bg-secondary/70 transition-colors min-h-[40px] sm:min-h-[44px] shrink-0"
              title={lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-0 ltr:rotate-180" />
              <span className="hidden xs:inline">{lang === "ar" ? "الرئيسية" : "Home"}</span>
            </Link>
            <Image
              src={getAssetPath("/icon.svg")}
              alt="Receipt AI Logo"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl shadow-xs shrink-0"
              priority
            />
            <h1 className="font-extrabold text-xs sm:text-lg tracking-tight text-foreground flex items-center gap-1 truncate min-w-0">
              <span className="truncate">{t.appName}</span>
              <InfoTip content={t.appInfo} />
            </h1>
          </div>

          {/* Minimal Controls with Safe Padding */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Segmented Pill */}
            <div className="flex items-center bg-secondary/80 p-0.5 rounded-xl border border-border/50">
              <button
                type="button"
                onClick={() => setLang("ar")}
                className={`px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[40px] cursor-pointer ${
                  lang === "ar"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="العربية"
              >
                ع
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[40px] cursor-pointer ${
                  lang === "en"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="English"
              >
                EN
              </button>
            </div>

            {/* Hardware Status Pill */}
            {webGpuAvailable === true && (
              <Badge className="bg-success/15 text-success border-success/30 flex items-center gap-1 text-xs font-bold py-1.5 px-2.5 min-h-[38px]">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-mono hidden xs:inline">{t.webGpuReady}</span>
              </Badge>
            )}
            {webGpuAvailable === false && (
              <Badge className="bg-warning/15 text-warning border-warning/30 flex items-center gap-1 text-xs font-bold py-1.5 px-2.5 min-h-[38px]">
                <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-mono hidden xs:inline">{t.wasmFallback}</span>
              </Badge>
            )}

            {/* Purge Cache Button */}
            {isCached && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearCache}
                title={t.purgeCache}
                aria-label={t.purgeCache}
                className="text-muted-foreground hover:text-destructive h-10 w-10 rounded-xl min-w-[40px]"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}

            {/* Articles Link */}
            <Link
              href="/articles"
              className="hidden sm:inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-xl border border-border/60 hover:bg-secondary/60 min-h-[40px]"
              title={lang === "ar" ? "المقالات والأدلة" : "Articles & Guides"}
            >
              <span>{lang === "ar" ? "المقالات" : "Articles"}</span>
            </Link>

            {/* Business Inquiries Header Link */}
            <a
              href="https://www.osamamaalam.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl border border-border/60 hover:bg-secondary/60 min-h-[40px]"
              title={lang === "ar" ? "استفسارات تجارية" : "Business Inquiries"}
            >
              <span>{lang === "ar" ? "استفسارات تجارية" : "Inquiries"}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl mx-auto w-full max-w-full px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 min-w-0 overflow-x-clip">
        {/* Toast */}
        {downloadNotice && (
          <div className="p-3 rounded-xl bg-card border border-border shadow-xs flex items-center justify-between text-xs text-foreground font-medium animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              {downloadNotice}
            </span>
          </div>
        )}

        {/* Desktop View: Guided 3-Step Process Navigator with Constraints */}
        <div className="hidden sm:grid grid-cols-3 gap-3">
          {/* Step 1 Pill */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between ${
              !modelInstance
                ? "bg-card border-primary ring-2 ring-primary/30 shadow-xs"
                : "bg-card/70 border-success/30 shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base shrink-0 ${
                  modelInstance
                    ? "bg-success text-white shadow-xs"
                    : "bg-primary text-primary-foreground shadow-xs animate-pulse"
                }`}
              >
                {modelInstance ? <Check className="w-5 h-5 stroke-[2.5]" /> : "١"}
              </div>
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-bold text-foreground truncate block">{t.step1Title}</span>
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  {modelInstance ? (lang === "ar" ? "جاهز" : "Ready") : (lang === "ar" ? "مطلوب" : "Required")}
                </span>
              </div>
            </div>
            <InfoTip content={t.step1Tip} />
          </div>

          {/* Step 2 Pill */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between ${
              !modelInstance
                ? "bg-muted/40 border-border/40 opacity-60"
                : !imagePreview
                ? "bg-card border-primary ring-2 ring-primary/30 shadow-xs"
                : "bg-card/70 border-success/30 shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base shrink-0 ${
                  !modelInstance
                    ? "bg-muted text-muted-foreground"
                    : imagePreview
                    ? "bg-success text-white shadow-xs"
                    : "bg-primary text-primary-foreground shadow-xs animate-pulse"
                }`}
              >
                {!modelInstance ? <Lock className="w-4 h-4 sm:w-5 sm:h-5" /> : imagePreview ? <Check className="w-5 h-5 stroke-[2.5]" /> : "٢"}
              </div>
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-bold text-foreground truncate block">{t.step2Title}</span>
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  {!modelInstance
                    ? (lang === "ar" ? "مقفلة" : "Locked")
                    : imagePreview
                    ? (lang === "ar" ? "جاهز" : "Ready")
                    : (lang === "ar" ? "ارفع صورة" : "Upload")}
                </span>
              </div>
            </div>
            <InfoTip content={t.step2Tip} />
          </div>

          {/* Step 3 Pill */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between ${
              !result
                ? "bg-muted/40 border-border/40 opacity-60"
                : "bg-card border-success/40 ring-2 ring-success/20 shadow-xs"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base shrink-0 ${
                  result
                    ? "bg-success text-white shadow-xs"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {result ? <Check className="w-5 h-5 stroke-[2.5]" /> : !imagePreview ? <Lock className="w-4 h-4 sm:w-5 sm:h-5" /> : "٣"}
              </div>
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-bold text-foreground truncate block">{t.step3Title}</span>
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  {result
                    ? (lang === "ar" ? "مكتمل" : "Audited")
                    : (lang === "ar" ? "مقفلة" : "Locked")}
                </span>
              </div>
            </div>
            <InfoTip content={t.step3Tip} />
          </div>
        </div>

        {/* Mobile View: High-Legibility Progress Bar with Active Constraints for iPhone */}
        <div className="sm:hidden bg-card rounded-2xl border-2 border-border/80 p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-base font-black shadow-xs shrink-0">
              {currentStep === 1 ? "١" : currentStep === 2 ? "٢" : "٣"}
            </span>
            <div>
              <span className="text-base font-extrabold text-foreground block">
                {currentStep === 1 ? t.step1Title : currentStep === 2 ? t.step2Title : t.step3Title}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground block">
                {currentStep === 1
                  ? (lang === "ar" ? "١. تشغيل المحرك" : "1. Start Engine")
                  : currentStep === 2
                  ? (lang === "ar" ? "٢. رفع الفاتورة" : "2. Upload Receipt")
                  : (lang === "ar" ? "٣. تدقيق البيانات" : "3. Audit")}
              </span>
            </div>
          </div>

          {/* Step Dots Indicators */}
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full transition-colors ${currentStep >= 1 ? "bg-primary" : "bg-muted"}`} />
            <span className={`w-3 h-3 rounded-full transition-colors ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`} />
            <span className={`w-3 h-3 rounded-full transition-colors ${currentStep >= 3 ? "bg-primary" : "bg-muted"}`} />
            <InfoTip content={currentStep === 1 ? t.step1Tip : currentStep === 2 ? t.step2Tip : t.step3Tip} />
          </div>
        </div>

        {/* STEP 1: AI ENGINE */}
        <section className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-xs space-y-4 w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <span>{t.step1Title}</span>
                  {!modelInstance && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {lang === "ar" ? "مطلوب" : "Required"}
                    </span>
                  )}
                </h2>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {lang === "ar" ? "WebGPU • محلي ١٠٠٪" : "WebGPU • 100% Private"}
                </span>
              </div>
              <InfoTip content={t.step1Tip} />
            </div>

            {modelState.status === "ready" && (
              <Badge className="bg-success/15 text-success border-success/30 text-xs sm:text-sm font-bold py-1.5 px-3">
                <Check className="w-4 h-4 me-1 stroke-[2.5]" />
                {t.readyInMemory}
              </Badge>
            )}
          </div>

          {modelState.status === "idle" && !modelInstance && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border/70">
              <div className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-mono text-foreground text-sm sm:text-base">{webGpuAvailable ? "WebGPU Engine" : "WASM Engine"}</span>
              </div>
              <Button onClick={handleStartModel} className="rounded-2xl h-14 sm:h-16 px-6 text-base sm:text-lg font-extrabold gap-2.5 w-full sm:w-auto min-h-[56px] shadow-sm active:scale-95">
                <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                {isCached ? t.loadFromCache : t.downloadAndStart}
              </Button>
            </div>
          )}

          {(modelState.status === "downloading" ||
            modelState.status === "checking" ||
            modelState.status === "compiling") && (
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border/70">
              <div className="flex justify-between text-sm sm:text-base font-bold">
                <span className="flex items-center gap-2 text-foreground truncate">
                  <RefreshCw className="w-5 h-5 animate-spin text-primary shrink-0" />
                  {modelState.message}
                </span>
                <span className="tabular-nums font-mono text-base sm:text-lg font-black text-primary shrink-0">{modelState.progress}%</span>
              </div>
              <Progress value={modelState.progress} className="h-3 rounded-full" />
            </div>
          )}

          {modelState.status === "error" && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-bold flex items-center justify-between">
              <span>{modelState.message}</span>
              <Button size="sm" variant="outline" onClick={handleStartModel} className="rounded-xl h-12 px-5 text-sm font-bold min-h-[48px]">
                {t.retry}
              </Button>
            </div>
          )}
        </section>

        {/* STEP 2: DOCUMENT INPUT (Constrained until Step 1 is Ready) */}
        <section
          className={`bg-card rounded-2xl border p-4 sm:p-6 shadow-xs space-y-4 transition-all w-full max-w-full min-w-0 overflow-hidden ${
            !modelInstance
              ? "border-border/50 bg-card/60 opacity-80"
              : "border-primary/40 ring-1 ring-primary/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <span>{t.step2Title}</span>
                  {!modelInstance ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>{lang === "ar" ? "مقفلة" : "Locked"}</span>
                    </span>
                  ) : imagePreview ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>{lang === "ar" ? "جاهز" : "Ready"}</span>
                    </span>
                  ) : null}
                </h2>
              </div>
              <InfoTip content={t.step2Tip} />
            </div>
            {imagePreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImagePreview(null)
                  setResult(null)
                  setEditedReceipt(null)
                  setSelectedSampleId(null)
                }}
                className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground h-10 px-3.5 rounded-xl min-h-[40px]"
              >
                {t.clearImage}
              </Button>
            )}
          </div>

          {/* Constraint Guard: Locked Notice if Step 1 is not completed */}
          {!modelInstance ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-secondary/30 border-2 border-dashed border-border/80 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {lang === "ar" ? "شغّل المحرك أولاً" : "Start engine first"}
              </h3>
              <Button
                onClick={handleStartModel}
                className="rounded-2xl h-12 sm:h-14 px-6 text-sm sm:text-base font-bold gap-2 min-h-[48px] shadow-sm active:scale-95"
              >
                <Cpu className="w-5 h-5" />
                <span>{lang === "ar" ? "بدء المحرك" : "Start Engine"}</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Quick Samples Horizontal Scroll Strip */}
              <div className="space-y-2 w-full max-w-full min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar w-full max-w-full min-w-0 touch-pan-x overscroll-x-contain">
                  <span className="text-xs sm:text-sm font-bold text-muted-foreground whitespace-nowrap shrink-0">{t.quickSamples}:</span>
                  {SAMPLE_RECEIPTS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSample(sample.id)}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[44px] active:scale-95 ${
                        selectedSampleId === sample.id
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-xs"
                          : "border-border hover:bg-secondary/40 bg-card text-foreground"
                      }`}
                    >
                      <span>{sample.label}</span>
                      <span className="font-mono tabular-nums text-xs opacity-90 font-black">{sample.total}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload & Camera Touch Targets */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/60 cursor-pointer rounded-2xl p-4 sm:p-6 text-center transition-all bg-secondary/20 hover:bg-secondary/40 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 min-h-[84px] sm:min-h-[92px] active:scale-[0.98]"
                >
                  <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
                  <div className="flex items-center gap-1">
                    <span className="text-base sm:text-lg font-bold text-foreground">{t.fileUpload}</span>
                    <InfoTip content={t.uploadFormatTip} />
                  </div>
                </div>

                <div
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-2 border-border hover:border-primary/60 cursor-pointer rounded-2xl p-4 sm:p-6 text-center transition-all bg-secondary/20 hover:bg-secondary/40 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 min-h-[84px] sm:min-h-[92px] active:scale-[0.98]"
                >
                  <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-foreground shrink-0" />
                  <span className="text-base sm:text-lg font-bold text-foreground">{t.cameraUpload}</span>
                </div>
              </div>

              {/* Document Preview Card & Main Action Button */}
              {imagePreview && (
                <div className="p-4 rounded-2xl border-2 border-primary/30 bg-card flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3.5 shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      onClick={() => setIsImageModalOpen(true)}
                      className="w-16 h-20 bg-secondary/40 rounded-xl overflow-hidden border border-border shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                      title="Tap to preview"
                    >
                      <img src={imagePreview} alt={t.originalDoc} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 text-start space-y-1">
                      <p className="text-sm sm:text-base font-bold text-foreground truncate">{imageName}</p>
                      <button
                        type="button"
                        onClick={() => setIsImageModalOpen(true)}
                        className="text-xs sm:text-sm text-primary font-bold hover:underline flex items-center gap-1.5 cursor-pointer min-h-[32px]"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{t.peekDoc}</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Scan Trigger: Prominently Guided */}
                  <Button
                    onClick={handleExtract}
                    disabled={isExtracting}
                    className="gap-2.5 rounded-2xl h-14 sm:h-16 px-7 text-base sm:text-lg font-black shrink-0 min-h-[56px] w-full xs:w-auto shadow-md ring-4 ring-primary/20 active:scale-[0.98]"
                  >
                    {isExtracting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        {t.scanningBtn}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>{t.scanBtn}</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {extractError && (
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-bold"
                >
                  {extractError}
                </div>
              )}
            </>
          )}
        </section>

        {/* STEP 3: SIDE-BY-SIDE AUDIT & VERIFICATION */}
        {result && editedReceipt && (
          <section className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden space-y-0 w-full max-w-full min-w-0">
            {/* Header: Audit Status & Quick Actions */}
            <div className="border-b border-border p-4 sm:p-5 bg-secondary/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <h2 className="text-sm sm:text-base font-bold text-foreground">{t.step3Title}</h2>

                {/* Math Reconciliation Pill */}
                {editedReceipt.mathCheckable === false ? (
                  <Badge variant="outline" className="gap-1.5 text-xs sm:text-sm font-bold py-1 px-3 text-muted-foreground">
                    <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                    {t.mathUnverified}
                  </Badge>
                ) : editedReceipt.isMathBalanced ? (
                  <Badge className="bg-success/15 text-success border-success/30 gap-1.5 text-xs sm:text-sm font-bold py-1 px-3">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    {t.mathReconciled}
                  </Badge>
                ) : (
                  <Badge className="bg-warning/15 text-warning border-warning/30 gap-1.5 text-xs sm:text-sm font-bold py-1 px-3">
                    <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                    {t.mathDiff}: {editedReceipt.mathDifference}
                  </Badge>
                )}
                <InfoTip content={t.reconcileTip} />
              </div>

              {/* Minimal 1-Click Exports with 44pt touch comfort */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadFile("csv")}
                  className="text-xs sm:text-sm font-bold h-10 px-3 rounded-xl border-border bg-card min-h-[40px] shadow-2xs"
                  title="Download CSV"
                >
                  <FileDown className="w-4 h-4 text-success me-1.5" />
                  {t.exportCsv}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadFile("json")}
                  className="text-xs sm:text-sm font-bold h-10 px-3 rounded-xl border-border bg-card min-h-[40px] shadow-2xs"
                  title="Download JSON"
                >
                  <FileDown className="w-4 h-4 text-primary me-1.5" />
                  {t.exportJson}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard("csv")}
                  className="text-xs sm:text-sm font-bold h-10 px-3 rounded-xl border-border bg-card min-h-[40px] shadow-2xs"
                  title={t.copyCsv}
                >
                  {copiedType === "csv" ? <Check className="w-4 h-4 text-success stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Mobile-Only Segmented Navigation: Toggle Document vs Form */}
            <div className="lg:hidden p-2.5 bg-secondary/30 border-b border-border flex items-center justify-center">
              <div className="grid grid-cols-2 bg-card p-1 rounded-xl border border-border w-full max-w-sm shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMobileAuditTab("data")}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px] ${
                    mobileAuditTab === "data"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.tabForm}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileAuditTab("doc")}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px] ${
                    mobileAuditTab === "doc"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>{t.tabDocument}</span>
                </button>
              </div>
            </div>

            {/* Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-border">
              {/* DOCUMENT PANE (5 cols on desktop; toggled on mobile) */}
              <div
                className={`lg:col-span-5 p-4 bg-secondary/15 flex-col justify-between space-y-3 ${
                  mobileAuditTab === "doc" ? "flex" : "hidden lg:flex"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground text-xs">{t.originalDoc}</span>
                  <div className="flex items-center gap-0.5 bg-card rounded-lg p-0.5 border border-border">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setImageZoom((z) => Math.max(0.7, z - 0.2))}
                      className="h-8 w-8 rounded-md"
                      title={t.zoomOut}
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </Button>
                    <span className="font-mono text-xs tabular-nums w-10 text-center">{Math.round(imageZoom * 100)}%</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setImageZoom((z) => Math.min(2.5, z + 0.2))}
                      className="h-8 w-8 rounded-md"
                      title={t.zoomIn}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setImageZoom(1)}
                      className="h-8 w-8 rounded-md"
                      title={t.resetZoom}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="w-full h-[320px] sm:h-[400px] bg-card rounded-xl border border-border overflow-auto flex items-center justify-center p-2 relative">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt={t.originalDoc}
                      style={{ transform: `scale(${imageZoom})`, transformOrigin: "top center" }}
                      className="max-w-full max-h-full object-contain transition-transform duration-150"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono tabular-nums">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{result.latencyMs} ms ({result.backend.toUpperCase()})</span>
                  </div>

                  {/* Switch back to form button on mobile */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMobileAuditTab("data")}
                    className="lg:hidden text-xs text-primary h-7 px-2 font-medium"
                  >
                    {t.tabForm} &rarr;
                  </Button>
                </div>
              </div>

              {/* AUDIT FORM PANE (7 cols on desktop; toggled on mobile) */}
              <div
                className={`lg:col-span-7 p-3.5 sm:p-5 space-y-3.5 text-start ${
                  mobileAuditTab === "data" ? "block" : "hidden lg:block"
                }`}
              >
                {/* Fields the model did not return stay blank; say so instead of implying a reading */}
                {editedReceipt.missingFields && editedReceipt.missingFields.length > 0 && (
                  <div
                    role="status"
                    className="p-3 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-1.5 text-xs"
                  >
                    <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium">
                      {t.fieldsNotFound} {editedReceipt.missingFields.join(", ")}
                    </span>
                  </div>
                )}

                {/* Auto Reconcile Alert: only when all three figures were read and disagree */}
                {editedReceipt.mathCheckable !== false && !editedReceipt.isMathBalanced && (
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-between gap-2 text-xs">
                    <span className="text-foreground font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                      {editedReceipt.subTotal} + {editedReceipt.vatAmount} ≠ {editedReceipt.total}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAutoReconcile}
                      className="text-xs h-8 px-2.5 rounded-lg border-warning/40 font-semibold shrink-0 min-h-[36px]"
                    >
                      {t.autoReconcile}
                    </Button>
                  </div>
                )}

                {/* Form Fields: Optimized for Readability & Touch Targets on iPhone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="f-store" className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <Store className="w-5 h-5 text-primary shrink-0" />
                      <span>{t.storeLabel}</span>
                    </Label>
                    <Input
                      id="f-store"
                      value={editedReceipt.store}
                      onChange={(e) => handleFieldChange("store", e.target.value)}
                      className="h-13 sm:h-14 text-base sm:text-lg font-bold rounded-2xl px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="f-date" className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary shrink-0" />
                      <span>{t.dateLabel}</span>
                    </Label>
                    <Input
                      id="f-date"
                      value={editedReceipt.date}
                      onChange={(e) => handleFieldChange("date", e.target.value)}
                      className="h-13 sm:h-14 text-base sm:text-lg font-bold font-mono tabular-nums rounded-2xl px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="f-cat" className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary shrink-0" />
                      <span>{t.categoryLabel}</span>
                    </Label>
                    <select
                      id="f-cat"
                      value={editedReceipt.category}
                      onChange={(e) => handleFieldChange("category", e.target.value as ExpenseCategory)}
                      className="h-13 sm:h-14 w-full rounded-2xl border border-input bg-card px-4 text-base font-bold text-foreground shadow-xs cursor-pointer"
                    >
                      {(Object.keys(CATEGORY_MAP) as ExpenseCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_MAP[cat]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="f-ref" className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <Hash className="w-5 h-5 text-primary shrink-0" />
                      <span>{t.refLabel}</span>
                    </Label>
                    <Input
                      id="f-ref"
                      value={editedReceipt.referenceNumber || ""}
                      onChange={(e) => handleFieldChange("referenceNumber", e.target.value)}
                      className="h-13 sm:h-14 text-base sm:text-lg font-bold font-mono tabular-nums rounded-2xl px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="f-pay" className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary shrink-0" />
                      <span>{t.paymentLabel}</span>
                    </Label>
                    <Input
                      id="f-pay"
                      value={editedReceipt.paymentMethod || ""}
                      onChange={(e) => handleFieldChange("paymentMethod", e.target.value)}
                      className="h-13 sm:h-14 text-base sm:text-lg font-bold rounded-2xl px-4"
                    />
                  </div>
                </div>

                {/* Financial Totals Strip: Prominent High-Visibility Display on iPhone */}
                <div className="p-4 sm:p-5 rounded-2xl border-2 border-border/80 bg-secondary/30 shadow-xs space-y-3">
                  {/* Hero Total Field */}
                  <div className="p-3.5 rounded-xl bg-primary/10 border-2 border-primary/40 space-y-1.5">
                    <span className="text-xs sm:text-sm font-black text-primary uppercase tracking-wide block">{t.totalLabel}</span>
                    <Input
                      inputMode="decimal"
                      value={editedReceipt.total}
                      onChange={(e) => handleFieldChange("total", e.target.value)}
                      className="h-14 sm:h-18 font-mono tabular-nums text-2xl sm:text-3xl font-black text-primary border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1.5">
                      <span className="text-xs sm:text-sm font-bold text-muted-foreground block">{t.subtotalLabel}</span>
                      <Input
                        inputMode="decimal"
                        value={editedReceipt.subTotal}
                        onChange={(e) => handleFieldChange("subTotal", e.target.value)}
                        className="h-12 sm:h-13 font-mono tabular-nums text-base sm:text-lg font-bold rounded-xl px-3.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs sm:text-sm font-bold text-muted-foreground block">{t.taxLabel}</span>
                      <Input
                        inputMode="decimal"
                        value={editedReceipt.vatAmount}
                        onChange={(e) => handleFieldChange("vatAmount", e.target.value)}
                        className="h-12 sm:h-13 font-mono tabular-nums text-base sm:text-lg font-bold rounded-xl px-3.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs sm:text-sm font-bold text-muted-foreground block">{t.currencyLabel}</span>
                      <select
                        value={editedReceipt.currency}
                        onChange={(e) => handleFieldChange("currency", e.target.value)}
                        className="h-12 sm:h-13 w-full rounded-xl border border-input bg-card px-3.5 font-mono tabular-nums text-base font-bold shadow-xs cursor-pointer"
                      >
                        <option value="SAR">SAR</option>
                        <option value="AED">AED</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="KWD">KWD</option>
                        <option value="QAR">QAR</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                {editedReceipt.lineItems && editedReceipt.lineItems.length > 0 && (
                  <div className="border border-border rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-secondary/50 px-4 py-3 border-b border-border text-xs sm:text-sm font-bold flex justify-between text-foreground">
                      <span>{t.lineItemsLabel}</span>
                      <span className="font-mono">{editedReceipt.currency}</span>
                    </div>
                    <div className="divide-y divide-border text-sm font-semibold">
                      {editedReceipt.lineItems.map((item, idx) => (
                        <div key={idx} className="p-2.5 sm:p-3 flex items-center justify-between gap-3">
                          <Input
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...editedReceipt.lineItems]
                              newItems[idx].description = e.target.value
                              handleFieldChange("lineItems", newItems)
                            }}
                            className="h-12 text-sm sm:text-base font-medium rounded-xl"
                          />
                          <Input
                            inputMode="decimal"
                            value={item.amount}
                            onChange={(e) => {
                              const newItems = [...editedReceipt.lineItems]
                              newItems[idx].amount = e.target.value
                              handleFieldChange("lineItems", newItems)
                            }}
                            className="h-12 w-32 sm:w-36 text-end font-mono tabular-nums text-sm sm:text-base font-black shrink-0 rounded-xl"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Step 3 Post-Extraction High-Conversion Banner */}
        {result && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-card to-emerald-500/10 border border-primary/20 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
            <div className="text-center sm:text-start space-y-0.5">
              <p className="text-sm sm:text-base font-bold text-foreground">
                {lang === "ar"
                  ? "أتمتة فواتير شركتك مع نظام ERP / Odoo"
                  : "Integrate Receipt AI into your ERP or Odoo"}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === "ar"
                  ? "معالجة محلية داخل خوادمكم بخصوصية تامة"
                  : "Private on-premise local processing"}
              </p>
            </div>
            <a
              href={`https://wa.me/966506542290?text=${encodeURIComponent(
                lang === "ar"
                  ? "مرحباً أ. أسامة، جربت محرك Receipt AI وأرغب بمناقشة ربط أتمتة الفواتير لنظام شركتنا."
                  : "Hello Osama, I tested Receipt AI and would like to discuss receipt automation integration for our company."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold px-6 py-3 rounded-xl shadow-xs transition-all active:scale-95 shrink-0 min-h-[48px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.33 7.34 9 7.42 8.73 7.71C8.45 8.01 7.68 8.74 7.68 10.21C7.68 11.69 8.76 13.11 8.91 13.31C9.06 13.51 11 16.5 13.94 17.77C14.64 18.07 15.18 18.25 15.61 18.39C16.31 18.61 16.95 18.58 17.45 18.5C18.01 18.42 19.18 17.79 19.42 17.11C19.67 16.44 19.67 15.86 19.59 15.74C19.52 15.62 19.32 15.55 19.02 15.4C18.73 15.25 17.29 14.54 17.02 14.44C16.76 14.34 16.56 14.29 16.37 14.59C16.17 14.88 15.6 15.55 15.43 15.75C15.25 15.94 15.08 15.97 14.78 15.82C14.49 15.67 13.54 15.36 12.41 14.35C11.53 13.57 10.94 12.6 10.79 12.35C10.64 12.1 10.77 11.97 10.92 11.82C11.05 11.69 11.21 11.47 11.36 11.3C11.5 11.13 11.55 11.01 11.65 10.81C11.75 10.61 11.7 10.44 11.63 10.29C11.55 10.14 10.97 8.72 10.72 8.13C10.49 7.55 10.25 7.63 10.07 7.62C9.9 7.61 9.71 7.61 9.51 7.61L9.53 7.34Z" />
              </svg>
              <span>{lang === "ar" ? "واتساب" : "WhatsApp"}</span>
            </a>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{t.historyTitle}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHistory([])
                  safeRemoveStorage("receipt_ai_history", "local")
                }}
                className="text-xs sm:text-sm font-semibold h-8 text-muted-foreground hover:text-foreground px-3"
              >
                {t.clearHistory}
              </Button>
            </div>
            <div className="divide-y divide-border text-xs sm:text-sm font-medium">
              {history.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-bold text-foreground text-sm truncate">{item.parsed.store}</span>
                    <span className="text-muted-foreground font-mono tabular-nums text-xs shrink-0">{item.parsed.date}</span>
                  </div>
                  <span className="font-mono tabular-nums font-black text-sm sm:text-base text-foreground shrink-0 ms-2">
                    {item.parsed.total} {item.parsed.currency}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Fullscreen Document Peek Modal for Small Screens */}
      {isImageModalOpen && imagePreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-white">
            <span className="text-xs font-semibold">{t.originalDoc}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsImageModalOpen(false)}
              className="text-white hover:bg-white/10 h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
            <img src={imagePreview} alt={t.originalDoc} className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}

      {/* Footer with Creator Attribution & Business Inquiries */}
      <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground bg-card/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
            <span>{t.privacyBadge}</span>
            <InfoTip content={t.privacyTip} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span>{lang === "ar" ? "طُوّر هذا العرض التجريبي بواسطة أسامه عالم" : "Demo created by Osama Alam"}</span>
            <span className="text-border/80 hidden sm:inline">•</span>
            <a
              href="https://www.osamamaalam.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors underline underline-offset-4 decoration-border hover:decoration-primary inline-flex items-center gap-1"
            >
              <span>{lang === "ar" ? "للاستفسارات والمشاريع التجارية" : "Business Inquiries"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
