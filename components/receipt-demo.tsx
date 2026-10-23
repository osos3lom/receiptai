"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Download,
  Upload,
  Cpu,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  Camera,
  RefreshCw,
  FileText,
  Clock,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  FileJson,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  checkWebGPUSupport,
  isModelCachedInBrowser,
  clearModelCache,
  initVisionModel,
  extractReceiptData,
  type ModelProgress,
  type InferenceResult,
} from "@/lib/webgpu-vision"
import type { ParsedReceipt } from "@/lib/receipt-parser"

// Demo sample receipts for instant testing
const SAMPLE_RECEIPTS = [
  {
    id: "sample-arabic",
    label: "Sample 1: Arabic Tax Invoice (SAR)",
    store: "Silicon Valley Electronics",
    total: "264.50 SAR",
    color: "from-emerald-500/10 to-teal-500/10",
  },
  {
    id: "sample-english",
    label: "Sample 2: English Tech Store (USD)",
    store: "Tech Hub Superstore",
    total: "$94.86 USD",
    color: "from-blue-500/10 to-indigo-500/10",
  },
]

export default function ReceiptDemo() {
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

  // Step 3: Inference & Extraction state
  const [isExtracting, setIsExtracting] = useState<boolean>(false)
  const [result, setResult] = useState<InferenceResult | null>(null)
  const [copiedType, setCopiedType] = useState<"json" | "text" | "table" | null>(null)
  const [history, setHistory] = useState<Array<{ id: string; time: string; parsed: ParsedReceipt }>>([])

  // Current active step tracking
  const currentStep = !modelInstance ? 1 : !imagePreview ? 2 : 3

  // Initial browser capability checks
  useEffect(() => {
    async function initCheck() {
      const gpuOk = await checkWebGPUSupport()
      setWebGpuAvailable(gpuOk)
      const cached = await isModelCachedInBrowser()
      setIsCached(cached)

      // Load local history from localStorage
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
        message: "Failed to load model. Check browser WebGPU permissions or network.",
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
    }
    reader.readAsDataURL(file)
  }

  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId)
    const sample = SAMPLE_RECEIPTS.find((s) => s.id === sampleId)
    setImageName(sample?.label || "Sample Receipt")
    
    // Create an inline canvas preview for the sample receipt
    const canvas = document.createElement("canvas")
    canvas.width = 480
    canvas.height = 640
    const ctx = canvas.getContext("2d")
    if (ctx) {
      // Paper background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Receipt header border
      ctx.fillStyle = "#f3f4f6"
      ctx.fillRect(16, 16, 448, 80)
      
      // Text
      ctx.fillStyle = "#111827"
      ctx.font = "bold 20px monospace"
      ctx.textAlign = "center"
      ctx.fillText(sample?.store || "STORE RECEIPT", 240, 52)
      
      ctx.font = "14px monospace"
      ctx.fillStyle = "#4b5563"
      ctx.fillText(sampleId === "sample-arabic" ? "فاتورة ضريبية مبسطة" : "CUSTOMER RECEIPT", 240, 78)
      
      ctx.strokeStyle = "#9ca3af"
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(32, 120)
      ctx.lineTo(448, 120)
      ctx.stroke()
      
      ctx.font = "15px monospace"
      ctx.textAlign = "left"
      ctx.fillStyle = "#374151"
      ctx.fillText(`Date: 2026-10-23`, 32, 160)
      ctx.fillText(`Ref: #TX-90214`, 32, 185)
      
      ctx.fillText(`Item 1: Hardware Kit`, 32, 240)
      ctx.textAlign = "right"
      ctx.fillText(sampleId === "sample-arabic" ? "120.00" : "$45.00", 448, 240)
      
      ctx.textAlign = "left"
      ctx.fillText(`Item 2: Adapter Cable`, 32, 275)
      ctx.textAlign = "right"
      ctx.fillText(sampleId === "sample-arabic" ? "110.00" : "$37.49", 448, 275)

      ctx.beginPath()
      ctx.moveTo(32, 330)
      ctx.lineTo(448, 330)
      ctx.stroke()

      ctx.font = "bold 18px monospace"
      ctx.textAlign = "left"
      ctx.fillStyle = "#111827"
      ctx.fillText(sampleId === "sample-arabic" ? "الإجمالي العام Total" : "TOTAL AMOUNT", 32, 380)
      ctx.textAlign = "right"
      ctx.fillText(sample?.total || "0.00", 448, 380)
      
      setImagePreview(canvas.toDataURL("image/png"))
      setResult(null)
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

      // Add to local history
      const newHistoryItem = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(),
        parsed: extraction.parsed,
      }
      const updatedHistory = [newHistoryItem, ...history.slice(0, 9)]
      setHistory(updatedHistory)
      try {
        localStorage.setItem("receipt_ai_history", JSON.stringify(updatedHistory))
      } catch (e) {
        // storage quota exceeded
      }
    } catch (err) {
      console.error("Extraction failed:", err)
    } finally {
      setIsExtracting(false)
    }
  }

  // Copy helpers
  const copyToClipboard = async (type: "json" | "text" | "table") => {
    if (!result) return

    let content = ""
    if (type === "json") {
      content = JSON.stringify(result.parsed, null, 2)
    } else if (type === "text") {
      content = `🏬 Store: ${result.parsed.store}\n📆 Date: ${result.parsed.date}\n💵 Subtotal: ${result.parsed.subTotal} ${result.parsed.currency}\n🧾 VAT (${result.parsed.vatPercent}%): ${result.parsed.vatAmount} ${result.parsed.currency}\n💰 Grand Total: ${result.parsed.total} ${result.parsed.currency}`
    } else if (type === "table") {
      content = `Field\tValue\nStore\t${result.parsed.store}\nDate\t${result.parsed.date}\nSubtotal\t${result.parsed.subTotal}\nVAT\t${result.parsed.vatAmount}\nTotal\t${result.parsed.total}\nCurrency\t${result.parsed.currency}`
    }

    await navigator.clipboard.writeText(content)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Banner / Navigation */}
      <header className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base sm:text-lg tracking-tight">Receipt AI</h1>
                <Badge variant="secondary" className="text-xs font-mono uppercase bg-muted">
                  Static WebGPU
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Zero-server private client-side OCR & data extraction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {webGpuAvailable === true && (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                WebGPU Ready
              </Badge>
            )}
            {webGpuAvailable === false && (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                WASM Fallback
              </Badge>
            )}
            {isCached && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCache}
                title="Clear cached model weights from browser storage"
                className="text-muted-foreground hover:text-destructive text-xs h-8 px-2"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Purge Model Cache
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Client-Side Receipt Scanner
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Run lightweight vision models directly inside your browser storage using WebGPU.
            Your receipts and financial data never leave your device.
          </p>
        </div>

        {/* 3-Step Interactive Process Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 Pill */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              currentStep === 1
                ? "bg-card border-primary ring-1 ring-primary/40 shadow-sm"
                : modelInstance
                ? "bg-card/40 border-border opacity-90"
                : "bg-muted/40 border-border opacity-70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  modelInstance
                    ? "bg-emerald-500 text-white"
                    : currentStep === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {modelInstance ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <div>
                <p className="font-semibold text-sm">Download AI Model</p>
                <p className="text-xs text-muted-foreground">
                  {modelInstance ? "Loaded in Browser Storage" : "WebGPU Vision Model"}
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 Pill */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              currentStep === 2
                ? "bg-card border-primary ring-1 ring-primary/40 shadow-sm"
                : imagePreview
                ? "bg-card/40 border-border opacity-90"
                : "bg-muted/40 border-border opacity-70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  imagePreview
                    ? "bg-emerald-500 text-white"
                    : currentStep === 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {imagePreview ? <Check className="w-4 h-4" /> : "2"}
              </div>
              <div>
                <p className="font-semibold text-sm">Upload Receipt</p>
                <p className="text-xs text-muted-foreground">
                  {imagePreview ? imageName : "Photo, Drop, or Sample"}
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 Pill */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              currentStep === 3
                ? "bg-card border-primary ring-1 ring-primary/40 shadow-sm"
                : result
                ? "bg-card/40 border-border opacity-90"
                : "bg-muted/40 border-border opacity-70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  result
                    ? "bg-emerald-500 text-white"
                    : currentStep === 3
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {result ? <Check className="w-4 h-4" /> : "3"}
              </div>
              <div>
                <p className="font-semibold text-sm">Extract & Copy</p>
                <p className="text-xs text-muted-foreground">
                  {result ? `Extracted in ${result.latencyMs}ms` : "Instant Local Output"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: MODEL INITIALIZATION CARD */}
        {/* ========================================================================= */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <CardTitle className="text-lg">In-Browser AI Vision Model</CardTitle>
              </div>
              {modelState.status === "ready" && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  Ready on {modelState.backend.toUpperCase()}
                </Badge>
              )}
            </div>
            <CardDescription>
              Downloads and caches the vision model (~48MB) directly in your browser&apos;s storage.
              Future sessions load instantly from local cache without re-downloading.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {modelState.status === "idle" && !modelInstance && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/40 border border-border">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ready to initialize vision pipeline</p>
                  <p className="text-xs text-muted-foreground">
                    Hardware acceleration:{" "}
                    <span className="font-medium text-foreground">
                      {webGpuAvailable ? "WebGPU Supported ⚡" : "CPU/WASM (1 thread)"}
                    </span>
                  </p>
                </div>
                <Button onClick={handleStartModel} className="gap-2">
                  <Download className="w-4 h-4" />
                  {isCached ? "Load Model from Browser Cache" : "Download & Start Model"}
                </Button>
              </div>
            )}

            {(modelState.status === "downloading" ||
              modelState.status === "checking" ||
              modelState.status === "compiling") && (
              <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                    {modelState.message}
                  </span>
                  <span>{modelState.progress}%</span>
                </div>
                <Progress value={modelState.progress} className="h-2" />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Backend: {modelState.backend.toUpperCase()}</span>
                  <span>
                    {modelState.downloadedMB} MB / {modelState.totalMB} MB
                  </span>
                </div>
              </div>
            )}

            {modelState.status === "ready" && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Model active in browser memory. Accelerated via {modelState.backend.toUpperCase()}.</span>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  Storage Cached
                </Badge>
              </div>
            )}

            {modelState.status === "error" && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center justify-between">
                <span>{modelState.message}</span>
                <Button size="sm" variant="outline" onClick={handleStartModel}>
                  Retry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* STEP 2: RECEIPT UPLOAD & SAMPLE SELECTOR */}
        {/* ========================================================================= */}
        <Card className={`border-border/60 shadow-sm transition-all ${!modelInstance ? "opacity-60" : ""}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <CardTitle className="text-lg">Upload or Select Receipt</CardTitle>
              </div>
              {imagePreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImagePreview(null)
                    setResult(null)
                    setSelectedSampleId(null)
                  }}
                  className="text-xs h-7 text-muted-foreground"
                >
                  Clear Image
                </Button>
              )}
            </div>
            <CardDescription>
              Upload your own receipt photo, snap with camera, or select one of the built-in sample invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Sample Selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Test Samples
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_RECEIPTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample.id)}
                    className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                      selectedSampleId === sample.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:bg-muted/40 bg-card"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium text-foreground">{sample.label}</p>
                      <p className="text-[11px] text-muted-foreground">{sample.store}</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {sample.total}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="border-2 border-dashed border-border hover:border-primary/50 cursor-pointer rounded-xl p-6 text-center space-y-2 transition-colors bg-muted/10 hover:bg-muted/20 flex flex-col items-center justify-center min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Click or Drag to Upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, or WebP</p>
                </div>
              </div>

              <div
                onClick={() => cameraInputRef.current?.click()}
                className="border border-border hover:border-primary/50 cursor-pointer rounded-xl p-6 text-center space-y-2 transition-colors bg-card hover:bg-muted/30 flex flex-col items-center justify-center min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Capture with Camera</p>
                  <p className="text-xs text-muted-foreground">Instant photo from phone or webcam</p>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            {imagePreview && (
              <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-center gap-4">
                <div className="w-32 h-36 bg-muted/40 rounded-lg overflow-hidden border border-border flex items-center justify-center shrink-0">
                  <img
                    src={imagePreview}
                    alt="Receipt preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <p className="text-sm font-semibold">{imageName}</p>
                  <p className="text-xs text-muted-foreground">
                    Image ready for client-side WebGPU text extraction.
                  </p>
                  <div className="pt-2">
                    <Button
                      onClick={handleExtract}
                      disabled={isExtracting}
                      className="gap-2 shadow-sm"
                    >
                      {isExtracting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Extracting in Browser...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Extract Receipt Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* STEP 3: EXTRACTED RESULTS & ONE-CLICK COPY */}
        {/* ========================================================================= */}
        {result && (
          <Card className="border-border/60 shadow-md">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <div>
                    <CardTitle className="text-lg">Extracted Receipt Data</CardTitle>
                    <CardDescription>
                      Processed entirely on your device via {result.backend.toUpperCase()} in{" "}
                      <span className="font-mono font-medium text-foreground">{result.latencyMs} ms</span>
                    </CardDescription>
                  </div>
                </div>

                {/* Copy Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard("json")}
                    className="text-xs h-8 gap-1.5"
                  >
                    {copiedType === "json" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <FileJson className="w-3.5 h-3.5" />
                    )}
                    {copiedType === "json" ? "Copied JSON!" : "Copy JSON"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard("text")}
                    className="text-xs h-8 gap-1.5"
                  >
                    {copiedType === "text" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedType === "text" ? "Copied!" : "Copy Summary"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="structured" className="space-y-4">
                <TabsList className="grid grid-cols-2 w-full sm:w-64">
                  <TabsTrigger value="structured">Structured</TabsTrigger>
                  <TabsTrigger value="raw">Raw OCR Text</TabsTrigger>
                </TabsList>

                {/* Structured Tab */}
                <TabsContent value="structured" className="space-y-4">
                  {/* Grid of Key Fields */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase">Store / Vendor</p>
                      <p className="text-sm font-semibold mt-1 truncate" title={result.parsed.store}>
                        {result.parsed.store || "—"}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30 border border-border">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase">Date</p>
                      <p className="text-sm font-semibold mt-1 font-mono">{result.parsed.date || "—"}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30 border border-border">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase">Subtotal</p>
                      <p className="text-sm font-semibold mt-1 font-mono">
                        {result.parsed.subTotal || "0.00"} {result.parsed.currency}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30 border border-border">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase">
                        VAT ({result.parsed.vatPercent}%)
                      </p>
                      <p className="text-sm font-semibold mt-1 font-mono">
                        {result.parsed.vatAmount || "0.00"} {result.parsed.currency}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 col-span-2 sm:col-span-1">
                      <p className="text-[11px] text-primary font-semibold uppercase">Total</p>
                      <p className="text-base font-extrabold mt-0.5 text-primary font-mono">
                        {result.parsed.total} {result.parsed.currency}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30 border border-border col-span-2 sm:col-span-1">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase">Currency</p>
                      <Badge variant="outline" className="mt-1 font-mono">
                        {result.parsed.currency}
                      </Badge>
                    </div>
                  </div>

                  {/* Line items if detected */}
                  {result.parsed.lineItems && result.parsed.lineItems.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden mt-4">
                      <div className="bg-muted/40 px-4 py-2 border-b border-border text-xs font-semibold">
                        Detected Items
                      </div>
                      <div className="divide-y divide-border text-sm">
                        {result.parsed.lineItems.map((item, i) => (
                          <div key={i} className="px-4 py-2 flex justify-between items-center">
                            <span>{item.description}</span>
                            <span className="font-mono text-muted-foreground">{item.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Raw OCR Text Tab */}
                <TabsContent value="raw">
                  <pre className="p-4 rounded-lg bg-muted/40 border border-border text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {result.rawText}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Local Session History */}
        {history.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Recent Scans (Saved in Browser Storage)
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHistory([])
                    localStorage.removeItem("receipt_ai_history")
                  }}
                  className="text-xs h-7 text-muted-foreground"
                >
                  Clear History
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border text-xs">
                {history.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground mr-2">{item.parsed.store}</span>
                      <span className="text-muted-foreground">{item.parsed.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium">
                        {item.parsed.total} {item.parsed.currency}
                      </span>
                      <span className="text-muted-foreground">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Receipt AI — In-Browser Vision Scanner with WebGPU</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            100% Client-Side. No images or data sent to servers.
          </p>
        </div>
      </footer>
    </div>
  )
}
