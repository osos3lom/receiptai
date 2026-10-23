"use client"

import React, { useState, useEffect, useRef } from "react"
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
  clearModelCache,
  initVisionModel,
  extractReceiptData,
  type ModelProgress,
  type InferenceResult,
} from "@/lib/webgpu-vision"
import type { ParsedReceipt, ExpenseCategory } from "@/lib/receipt-parser"
import { translations, type Language } from "@/lib/i18n"

// Reusable Apple-style optional "i" info badge
function InfoTip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Information"
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-secondary transition-colors shrink-0 cursor-pointer active:scale-95"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs p-2.5 text-center shadow-lg border border-border">
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
    totalMB: 48,
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

  // Initial browser capability checks
  useEffect(() => {
    async function initCheck() {
      const gpuOk = await checkWebGPUSupport()
      setWebGpuAvailable(gpuOk)
      const cached = await isModelCachedInBrowser()
      setIsCached(cached)

      try {
        const savedHistory = localStorage.getItem("receipt_ai_history")
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory))
        }
      } catch (err) {
        console.warn("Could not read local storage:", err)
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
    } catch (err) {
      console.error("Model start failure:", err)
      setModelState((prev) => ({
        ...prev,
        status: "error",
        message: isRTL ? "تعذر تحميل النموذج" : "Failed to load model",
      }))
    }
  }

  // Clear browser model storage
  const handleClearCache = async () => {
    await clearModelCache()
    setIsCached(false)
    setModelInstance(null)
    setModelState({
      status: "idle",
      progress: 0,
      downloadedMB: 0,
      totalMB: 48,
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
      ctx.font = "bold 20px -apple-system, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(sample?.store || "TAX INVOICE", 260, 52)

      ctx.font = "13px -apple-system, sans-serif"
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
      ctx.font = "14px -apple-system, sans-serif"
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
      ctx.font = "bold 18px -apple-system, sans-serif"
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

    try {
      const extraction = await extractReceiptData(
        selectedSampleId ? selectedSampleId : imagePreview,
        modelInstance
      )
      setResult(extraction)
      setEditedReceipt({ ...extraction.parsed })

      const newHistoryItem = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" }),
        parsed: extraction.parsed,
      }
      const updatedHistory = [newHistoryItem, ...history.slice(0, 9)]
      setHistory(updatedHistory)
      try {
        localStorage.setItem("receipt_ai_history", JSON.stringify(updatedHistory))
      } catch (e) {
        // storage handled
      }
    } catch (err) {
      console.error("Extraction failed:", err)
    } finally {
      setIsExtracting(false)
    }
  }

  // Form field changes with automatic math reconciliation
  const handleFieldChange = (field: keyof ParsedReceipt, value: any) => {
    if (!editedReceipt) return
    const updated = { ...editedReceipt, [field]: value }

    if (field === "subTotal" || field === "vatAmount" || field === "total") {
      const numTotal = parseFloat(updated.total) || 0
      const numSub = parseFloat(updated.subTotal) || 0
      const numVat = parseFloat(updated.vatAmount) || 0
      const expected = Number((numSub + numVat).toFixed(2))
      const diff = Number(Math.abs(numTotal - expected).toFixed(2))
      updated.isMathBalanced = diff <= 0.05
      updated.mathDifference = diff
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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Apple Mobile-Optimized Header */}
      <header className="border-b border-border apple-vibrancy sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <h1 className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-1">
              <span>{t.appName}</span>
              <InfoTip content={t.appInfo} />
            </h1>
          </div>

          {/* Minimal Controls with Safe Padding */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Segmented Pill */}
            <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border/40">
              <button
                type="button"
                onClick={() => setLang("ar")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all min-h-[32px] cursor-pointer ${
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
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all min-h-[32px] cursor-pointer ${
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
              <Badge className="bg-success/10 text-success border-success/20 flex items-center gap-1 text-[11px] py-1 px-2">
                <Zap className="w-3 h-3" />
                <span className="font-mono hidden xs:inline">{t.webGpuReady}</span>
              </Badge>
            )}
            {webGpuAvailable === false && (
              <Badge className="bg-warning/10 text-warning border-warning/20 flex items-center gap-1 text-[11px] py-1 px-2">
                <Cpu className="w-3 h-3" />
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
                className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-lg min-w-[36px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Toast */}
        {downloadNotice && (
          <div className="p-3 rounded-xl bg-card border border-border shadow-xs flex items-center justify-between text-xs text-foreground font-medium animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              {downloadNotice}
            </span>
          </div>
        )}

        {/* Small Screen Responsive Process Navigator */}
        {/* Desktop View: 3 cards */}
        <div className="hidden sm:grid grid-cols-3 gap-2.5">
          <div
            className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
              currentStep === 1
                ? "bg-card border-primary ring-1 ring-primary/30 shadow-xs"
                : modelInstance
                ? "bg-card/60 border-border/60"
                : "bg-muted/40 border-border/40 opacity-70"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  modelInstance
                    ? "bg-success text-white"
                    : currentStep === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {modelInstance ? <Check className="w-3.5 h-3.5" /> : "١"}
              </div>
              <span className="text-xs font-semibold text-foreground truncate">{t.step1Title}</span>
            </div>
            <InfoTip content={t.step1Tip} />
          </div>

          <div
            className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
              currentStep === 2
                ? "bg-card border-primary ring-1 ring-primary/30 shadow-xs"
                : imagePreview
                ? "bg-card/60 border-border/60"
                : "bg-muted/40 border-border/40 opacity-70"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  imagePreview
                    ? "bg-success text-white"
                    : currentStep === 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {imagePreview ? <Check className="w-3.5 h-3.5" /> : "٢"}
              </div>
              <span className="text-xs font-semibold text-foreground truncate">{t.step2Title}</span>
            </div>
            <InfoTip content={t.step2Tip} />
          </div>

          <div
            className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
              currentStep === 3
                ? "bg-card border-primary ring-1 ring-primary/30 shadow-xs"
                : result
                ? "bg-card/60 border-border/60"
                : "bg-muted/40 border-border/40 opacity-70"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  result
                    ? "bg-success text-white"
                    : currentStep === 3
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {result ? <Check className="w-3.5 h-3.5" /> : "٣"}
              </div>
              <span className="text-xs font-semibold text-foreground truncate">{t.step3Title}</span>
            </div>
            <InfoTip content={t.step3Tip} />
          </div>
        </div>

        {/* Mobile View: Compact Progress Bar with Step Pills */}
        <div className="sm:hidden bg-card rounded-xl border border-border p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {currentStep === 1 ? "١" : currentStep === 2 ? "٢" : "٣"}
            </span>
            <span className="text-xs font-bold text-foreground">
              {currentStep === 1 ? t.step1Title : currentStep === 2 ? t.step2Title : t.step3Title}
            </span>
          </div>

          {/* Step Dots Indicators */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full transition-colors ${currentStep >= 1 ? "bg-primary" : "bg-muted"}`} />
            <span className={`w-2 h-2 rounded-full transition-colors ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`} />
            <span className={`w-2 h-2 rounded-full transition-colors ${currentStep >= 3 ? "bg-primary" : "bg-muted"}`} />
            <InfoTip content={currentStep === 1 ? t.step1Tip : currentStep === 2 ? t.step2Tip : t.step3Tip} />
          </div>
        </div>

        {/* STEP 1: AI ENGINE */}
        <section className="bg-card rounded-2xl border border-border p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <h2 className="text-xs sm:text-sm font-semibold text-foreground">{t.step1Title}</h2>
              <InfoTip content={t.step1Tip} />
            </div>

            {modelState.status === "ready" && (
              <Badge className="bg-success/10 text-success border-success/20 text-[11px] py-0.5">
                <Check className="w-3 h-3 me-1" />
                {t.readyInMemory}
              </Badge>
            )}
          </div>

          {modelState.status === "idle" && !modelInstance && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-secondary/30 border border-border/60">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono">{webGpuAvailable ? "WebGPU" : "WASM"}</span>
              </div>
              <Button onClick={handleStartModel} size="sm" className="rounded-xl h-10 px-4 text-xs font-semibold gap-1.5 w-full sm:w-auto min-h-[44px]">
                <Download className="w-3.5 h-3.5" />
                {isCached ? t.loadFromCache : t.downloadAndStart}
              </Button>
            </div>
          )}

          {(modelState.status === "downloading" ||
            modelState.status === "checking" ||
            modelState.status === "compiling") && (
            <div className="space-y-2 p-3 rounded-xl bg-secondary/30 border border-border/60">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-muted-foreground text-xs truncate">
                  <RefreshCw className="w-3 h-3 animate-spin text-primary shrink-0" />
                  {modelState.message}
                </span>
                <span className="tabular-nums font-mono text-xs shrink-0">{modelState.progress}%</span>
              </div>
              <Progress value={modelState.progress} className="h-1.5 rounded-full" />
            </div>
          )}

          {modelState.status === "error" && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center justify-between">
              <span>{modelState.message}</span>
              <Button size="sm" variant="outline" onClick={handleStartModel} className="rounded-lg h-8 text-xs min-h-[36px]">
                {t.retry}
              </Button>
            </div>
          )}
        </section>

        {/* STEP 2: DOCUMENT INPUT */}
        <section className={`bg-card rounded-2xl border border-border p-4 shadow-xs space-y-3 transition-opacity ${!modelInstance ? "opacity-60" : ""}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <h2 className="text-xs sm:text-sm font-semibold text-foreground">{t.step2Title}</h2>
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
                className="text-xs text-muted-foreground hover:text-foreground h-7 rounded-lg"
              >
                {t.clearImage}
              </Button>
            )}
          </div>

          {/* Quick Samples Horizontal Scroll Strip */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{t.quickSamples}:</span>
              {SAMPLE_RECEIPTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[38px] active:scale-95 ${
                    selectedSampleId === sample.id
                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40"
                      : "border-border hover:bg-secondary/40 bg-card text-foreground"
                  }`}
                >
                  <span>{sample.label}</span>
                  <span className="font-mono tabular-nums text-[11px] opacity-75">{sample.total}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload & Camera Touch Targets */}
          <div className="grid grid-cols-2 gap-2.5">
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
              className="border border-dashed border-border hover:border-primary/50 cursor-pointer rounded-xl p-3 sm:p-4 text-center transition-colors bg-secondary/20 hover:bg-secondary/40 flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98]"
            >
              <Upload className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">{t.fileUpload}</span>
              <InfoTip content={t.uploadFormatTip} />
            </div>

            <div
              onClick={() => cameraInputRef.current?.click()}
              className="border border-border hover:border-primary/50 cursor-pointer rounded-xl p-3 sm:p-4 text-center transition-colors bg-secondary/20 hover:bg-secondary/40 flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 text-foreground" />
              <span className="text-xs font-medium text-foreground">{t.cameraUpload}</span>
            </div>
          </div>

          {/* Document Preview Card */}
          {imagePreview && (
            <div className="p-3 rounded-xl border border-border bg-card flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  onClick={() => setIsImageModalOpen(true)}
                  className="w-12 h-14 bg-secondary/40 rounded-lg overflow-hidden border border-border shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  title="Tap to preview"
                >
                  <img src={imagePreview} alt={t.originalDoc} className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0 text-start">
                  <p className="text-xs font-semibold text-foreground truncate">{imageName}</p>
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(true)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{t.peekDoc}</span>
                  </button>
                </div>
              </div>

              {/* Main Scan Trigger */}
              <Button
                onClick={handleExtract}
                disabled={isExtracting}
                className="gap-2 rounded-xl h-11 px-5 text-xs font-semibold shrink-0 min-h-[44px] shadow-xs active:scale-[0.98]"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {t.scanningBtn}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.scanBtn}
                  </>
                )}
              </Button>
            </div>
          )}
        </section>

        {/* STEP 3: SIDE-BY-SIDE AUDIT & VERIFICATION */}
        {result && editedReceipt && (
          <section className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden space-y-0">
            {/* Header: Audit Status & Quick Actions */}
            <div className="border-b border-border p-3.5 sm:p-4 bg-secondary/20 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <h2 className="text-xs sm:text-sm font-semibold text-foreground">{t.step3Title}</h2>

                {/* Math Reconciliation Pill */}
                {editedReceipt.isMathBalanced ? (
                  <Badge className="bg-success/10 text-success border-success/30 gap-1 text-[11px] py-0.5">
                    <Check className="w-3 h-3" />
                    {t.mathReconciled}
                  </Badge>
                ) : (
                  <Badge className="bg-warning/10 text-warning border-warning/30 gap-1 text-[11px] py-0.5">
                    <AlertCircle className="w-3 h-3" />
                    {t.mathDiff}: {editedReceipt.mathDifference}
                  </Badge>
                )}
                <InfoTip content={t.reconcileTip} />
              </div>

              {/* Minimal 1-Click Exports with 44pt touch comfort */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadFile("csv")}
                  className="text-xs h-8 px-2.5 rounded-lg border-border bg-card min-h-[36px]"
                  title="Download CSV"
                >
                  <FileDown className="w-3.5 h-3.5 text-success me-1" />
                  {t.exportCsv}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadFile("json")}
                  className="text-xs h-8 px-2.5 rounded-lg border-border bg-card min-h-[36px]"
                  title="Download JSON"
                >
                  <FileDown className="w-3.5 h-3.5 text-primary me-1" />
                  {t.exportJson}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard("csv")}
                  className="text-xs h-8 px-2.5 rounded-lg border-border bg-card min-h-[36px]"
                  title={t.copyCsv}
                >
                  {copiedType === "csv" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {/* Mobile-Only Segmented Navigation: Toggle Document vs Form */}
            <div className="lg:hidden p-2 bg-secondary/30 border-b border-border flex items-center justify-center">
              <div className="grid grid-cols-2 bg-card p-0.5 rounded-xl border border-border w-full max-w-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMobileAuditTab("data")}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[36px] ${
                    mobileAuditTab === "data"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.tabForm}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileAuditTab("doc")}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[36px] ${
                    mobileAuditTab === "doc"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
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
                {/* Auto Reconcile Alert */}
                {!editedReceipt.isMathBalanced && (
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

                {/* Form Fields: Optimized Mobile Spacing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="f-store" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-muted-foreground" />
                      {t.storeLabel}
                    </Label>
                    <Input
                      id="f-store"
                      value={editedReceipt.store}
                      onChange={(e) => handleFieldChange("store", e.target.value)}
                      className="h-10 rounded-xl font-medium text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="f-date" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {t.dateLabel}
                    </Label>
                    <Input
                      id="f-date"
                      value={editedReceipt.date}
                      onChange={(e) => handleFieldChange("date", e.target.value)}
                      className="h-10 rounded-xl font-mono tabular-nums text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="f-cat" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      {t.categoryLabel}
                    </Label>
                    <select
                      id="f-cat"
                      value={editedReceipt.category}
                      onChange={(e) => handleFieldChange("category", e.target.value as ExpenseCategory)}
                      className="h-10 w-full rounded-xl border border-input bg-card px-2.5 text-xs text-foreground shadow-xs cursor-pointer"
                    >
                      {(Object.keys(CATEGORY_MAP) as ExpenseCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_MAP[cat]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="f-ref" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      {t.refLabel}
                    </Label>
                    <Input
                      id="f-ref"
                      value={editedReceipt.referenceNumber || ""}
                      onChange={(e) => handleFieldChange("referenceNumber", e.target.value)}
                      className="h-10 rounded-xl font-mono tabular-nums text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="f-pay" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                      {t.paymentLabel}
                    </Label>
                    <Input
                      id="f-pay"
                      value={editedReceipt.paymentMethod || ""}
                      onChange={(e) => handleFieldChange("paymentMethod", e.target.value)}
                      className="h-10 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Financial Totals Strip: 2x2 Grid on Mobile, 4 Cols on Desktop */}
                <div className="p-3 rounded-xl border border-border bg-secondary/30">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground block">{t.subtotalLabel}</span>
                      <Input
                        inputMode="decimal"
                        value={editedReceipt.subTotal}
                        onChange={(e) => handleFieldChange("subTotal", e.target.value)}
                        className="h-9 font-mono tabular-nums text-xs rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground block">{t.taxLabel}</span>
                      <Input
                        inputMode="decimal"
                        value={editedReceipt.vatAmount}
                        onChange={(e) => handleFieldChange("vatAmount", e.target.value)}
                        className="h-9 font-mono tabular-nums text-xs rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-primary font-bold block">{t.totalLabel}</span>
                      <Input
                        inputMode="decimal"
                        value={editedReceipt.total}
                        onChange={(e) => handleFieldChange("total", e.target.value)}
                        className="h-9 font-mono tabular-nums text-xs font-bold border-primary/40 text-primary rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground block">{t.currencyLabel}</span>
                      <select
                        value={editedReceipt.currency}
                        onChange={(e) => handleFieldChange("currency", e.target.value)}
                        className="h-9 w-full rounded-lg border border-input bg-card px-2 font-mono tabular-nums text-xs shadow-xs cursor-pointer"
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
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="bg-secondary/40 px-3 py-1.5 border-b border-border text-[11px] font-semibold flex justify-between text-muted-foreground">
                      <span>{t.lineItemsLabel}</span>
                      <span>{editedReceipt.currency}</span>
                    </div>
                    <div className="divide-y divide-border text-xs">
                      {editedReceipt.lineItems.map((item, idx) => (
                        <div key={idx} className="p-2 flex items-center justify-between gap-2">
                          <Input
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...editedReceipt.lineItems]
                              newItems[idx].description = e.target.value
                              handleFieldChange("lineItems", newItems)
                            }}
                            className="h-8 text-xs font-medium rounded-md"
                          />
                          <Input
                            inputMode="decimal"
                            value={item.amount}
                            onChange={(e) => {
                              const newItems = [...editedReceipt.lineItems]
                              newItems[idx].amount = e.target.value
                              handleFieldChange("lineItems", newItems)
                            }}
                            className="h-8 w-24 text-end font-mono tabular-nums text-xs font-semibold shrink-0 rounded-md"
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

        {/* History */}
        {history.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-3.5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {t.historyTitle}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHistory([])
                  localStorage.removeItem("receipt_ai_history")
                }}
                className="text-[11px] h-7 text-muted-foreground hover:text-foreground px-2"
              >
                {t.clearHistory}
              </Button>
            </div>
            <div className="divide-y divide-border text-xs">
              {history.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-foreground truncate">{item.parsed.store}</span>
                    <span className="text-muted-foreground font-mono tabular-nums text-[11px] shrink-0">{item.parsed.date}</span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-foreground shrink-0 ms-2">
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

      {/* Minimal Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>{t.privacyBadge}</span>
          <InfoTip content={t.privacyTip} />
        </div>
      </footer>
    </div>
  )
}
