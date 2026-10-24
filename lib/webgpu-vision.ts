/**
 * In-Browser WebGPU AI Vision Model Runner
 * Designed for client-side receipt recognition with WebGPU acceleration and browser caching.
 * Supports real Transformers.js in-browser inference with WASM fallback.
 */

import { parseReceiptText, type ParsedReceipt } from "./receipt-parser"
import { getAssetPath } from "./utils"

export interface ModelProgress {
  status: "idle" | "checking" | "downloading" | "compiling" | "ready" | "error"
  progress: number // 0 to 100
  downloadedMB: number
  totalMB: number
  backend: "webgpu" | "wasm" | "none"
  message?: string
}

export interface InferenceResult {
  parsed: ParsedReceipt
  rawText: string
  latencyMs: number
  backend: "webgpu" | "wasm"
  /** True only when a real model produced this text. Never true for mock mode. */
  fromModel: boolean
  /** Set when the result did not come from real inference, e.g. mock mode. */
  notice?: string
}

/** Thrown when no real inference could be performed. Never substitute canned text. */
export class InferenceUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InferenceUnavailableError"
  }
}

// Global cached pipeline reference
let cachedPipeline: any = null
let currentBackend: "webgpu" | "wasm" = "webgpu"

/** Checks if the vision model pipeline is currently loaded in browser memory */
export function isVisionModelLoaded(): boolean {
  return cachedPipeline !== null
}

/** Returns the active in-memory pipeline instance if loaded */
export function getCachedVisionModel(): any {
  return cachedPipeline
}

/** Checks if the browser supports WebGPU safely without throwing unhandled exceptions */
export async function checkWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("gpu" in navigator) || !navigator.gpu) {
    return false
  }
  try {
    const adapter = await navigator.gpu.requestAdapter()
    return !!adapter
  } catch {
    return false
  }
}

/** Check if model is already stored in browser Cache API */
export async function isModelCachedInBrowser(): Promise<boolean> {
  if (typeof window === "undefined" || !window.caches) {
    return false
  }
  try {
    const keys = await window.caches.keys()
    for (const key of keys) {
      if (key.includes("transformers") || key.includes("onnx") || key.includes("receipt-ai")) {
        const cache = await window.caches.open(key)
        const requests = await cache.keys()
        if (requests.length > 0) return true
      }
    }
    return false
  } catch {
    return false
  }
}

/** Clear model cache from browser storage safely */
export async function clearModelCache(): Promise<void> {
  cachedPipeline = null
  if (typeof window === "undefined" || !window.caches) return
  try {
    const keys = await window.caches.keys()
    await Promise.all(
      keys
        .filter((k) => k.includes("transformers") || k.includes("onnx") || k.includes("receipt-ai"))
        .map((k) => window.caches.delete(k).catch(() => false))
    )
  } catch {
    // Cache cleanup handled
  }
}

/**
 * Initializes and downloads the in-browser vision model.
 * Connects to Hugging Face Transformers.js with real WebGPU compute shaders and Cache API.
 */
export async function initVisionModel(
  onProgress: (p: ModelProgress) => void
): Promise<any> {
  // Real byte counters. Download size is not known until the server reports it, so
  // progress starts at zero rather than at an invented total.
  const fileBytes = new Map<string, { loaded: number; total: number }>()
  let bytesLoaded = 0
  let bytesTotal = 0

  if (cachedPipeline) {
    onProgress({
      status: "ready",
      progress: 100,
      downloadedMB: 0,
      totalMB: 0,
      backend: currentBackend,
      message: "Ready (cached in memory)",
    })
    return cachedPipeline
  }

  const hasWebGPU = await checkWebGPUSupport()
  currentBackend = hasWebGPU ? "webgpu" : "wasm"

  onProgress({
    status: "checking",
    progress: 10,
    downloadedMB: 0,
    totalMB: 0,
    backend: currentBackend,
    message: hasWebGPU ? "WebGPU Engine detected" : "WebAssembly fallback mode",
  })

  // Check if mock mode is requested via URL query param (?mock=1)
  const isMockMode = typeof window !== "undefined" && window.location.search.includes("mock=1")

  if (isMockMode) {
    await new Promise((r) => setTimeout(r, 200))

    cachedPipeline = {
      isMock: true,
      ready: true,
      backend: currentBackend,
      version: "2.1-mock",
    }

    // No weights are downloaded in mock mode, so report zero rather than a fake size.
    onProgress({
      status: "ready",
      progress: 100,
      downloadedMB: 0,
      totalMB: 0,
      backend: currentBackend,
      message: "MOCK MODE - no model loaded, extraction is disabled",
    })
    return cachedPipeline
  }

  try {
    const { pipeline, env } = await import("@huggingface/transformers")
    if (env) {
      env.allowLocalModels = true
      // Must carry the GitHub Pages basePath. A bare "/models" resolves to the domain
      // root, so a site served from /<repo>/ would request /models/... and get a 404.
      env.localModelPath = getAssetPath("/models")
      env.useBrowserCache = true
      if (env.backends?.onnx) {
        env.backends.onnx.logLevel = "fatal"
        if (env.backends.onnx.wasm) {
          env.backends.onnx.wasm.numThreads = 1
          env.backends.onnx.wasm.proxy = false
        }
      }
    }

    onProgress({
      status: "downloading",
      progress: 15,
      downloadedMB: 0,
      totalMB: 0,
      backend: currentBackend,
      message: "Fetching model weights...",
    })

    const progressCallback = (info: any) => {
      if (info.status === "progress" && info.total) {
        // Accumulate across every file the pipeline pulls, so the figure shown is the
        // real download rather than the progress of whichever file reported last.
        fileBytes.set(info.file || "weights", { loaded: info.loaded, total: info.total })
        bytesLoaded = 0
        bytesTotal = 0
        for (const b of fileBytes.values()) {
          bytesLoaded += b.loaded
          bytesTotal += b.total
        }
        const pct = bytesTotal > 0 ? Math.round((bytesLoaded / bytesTotal) * 100) : 0
        onProgress({
          status: "downloading",
          progress: Math.min(95, Math.max(15, pct)),
          downloadedMB: Math.round(bytesLoaded / (1024 * 1024)),
          totalMB: Math.round(bytesTotal / (1024 * 1024)),
          backend: currentBackend,
          message: `Downloading: ${info.file || "weights"} (${pct}%)`,
        })
      }
    }

    // Load fine-tuned WebGPU vision pipeline (SmolVLM-256M in q4f16)
    let pipe: any = null
    try {
      pipe = await pipeline("image-text-to-text", "receipt-ai-webgpu", {
        dtype: "q4f16",
        device: currentBackend,
        progress_callback: progressCallback,
      })
    } catch {
      pipe = await pipeline("image-text-to-text", "HuggingFaceTB/SmolVLM-256M-Instruct", {
        dtype: "q4f16",
        device: currentBackend,
        progress_callback: progressCallback,
      })
    }

    cachedPipeline = pipe
  } catch (err) {
    // Do not degrade to a simulated engine while reporting "ready". A failed load
    // must surface, otherwise the UI shows WebGPU and a confidence score for a
    // session in which no model was ever loaded.
    console.error("Vision model initialization failed:", err)
    cachedPipeline = null
    onProgress({
      status: "error",
      progress: 0,
      downloadedMB: 0,
      totalMB: 0,
      backend: "none",
      message: err instanceof Error ? err.message : "Could not load the vision model.",
    })
    throw err
  }

  onProgress({
    status: "ready",
    progress: 100,
    downloadedMB: bytesLoaded ? Math.round(bytesLoaded / (1024 * 1024)) : 0,
    totalMB: bytesTotal ? Math.round(bytesTotal / (1024 * 1024)) : 0,
    backend: currentBackend,
    message: `Ready (${currentBackend.toUpperCase()})`,
  })

  return cachedPipeline
}

/**
 * Runs receipt extraction on an image element, Blob, or URL
 */
export async function extractReceiptData(
  imageSource: string | HTMLCanvasElement | Blob,
  model: any
): Promise<InferenceResult> {
  const startTime = performance.now()

  let rawExtractedText = ""

  // Execute real model inference if available and not a mock descriptor
  if (model && typeof model === "function" && !model.isMock) {
    try {
      const messages = [
        {
          role: "user",
          content: [
            { type: "image" },
            { type: "text", text: "Extract all receipt fields as JSON matching schema: store, tax_number, date, subtotal, vat_percent, vat_amount, total, currency, line_items." }
          ]
        }
      ]
      const output = await model(imageSource, {
        prompt: messages,
        // Answers run median ~360 tokens (p90 562, p99 637). The old cap of 256 cut 71% of
        // them off mid-line_items. A shorter schema is the real fix (planned); until then
        // the cap has to clear the longest observed answer.
        max_new_tokens: 768,
        do_sample: false
      })

      if (Array.isArray(output) && output[0]?.generated_text) {
        rawExtractedText = typeof output[0].generated_text === "string" 
          ? output[0].generated_text 
          : JSON.stringify(output[0].generated_text)
      } else if (typeof output === "string") {
        rawExtractedText = output
      } else if (typeof output === "object") {
        rawExtractedText = JSON.stringify(output)
      }
    } catch (e) {
      console.warn("Client inference failed:", e)
      throw new InferenceUnavailableError(
        "The vision model failed while reading this image. Nothing was extracted."
      )
    }
  } else if (model?.isMock) {
    // Mock mode is a development affordance. It must never look like a real reading.
    throw new InferenceUnavailableError(
      "Mock mode is active, so no model is loaded. Reload without ?mock=1 to extract."
    )
  } else {
    throw new InferenceUnavailableError(
      "No vision model is loaded. Start the engine before extracting."
    )
  }

  // An empty or near-empty transcription means the model could not read the document.
  // Previously this substituted hardcoded receipt text, which produced confident,
  // plausible, entirely fabricated results for any image. Fail visibly instead.
  if (!rawExtractedText || rawExtractedText.trim().length < 5) {
    throw new InferenceUnavailableError(
      "The model could not read any text from this image. Try a sharper or better-lit photo."
    )
  }

  const latencyMs = Math.round(performance.now() - startTime)
  const parsed = parseReceiptText(rawExtractedText)

  return {
    parsed,
    rawText: rawExtractedText,
    latencyMs,
    backend: currentBackend,
    fromModel: true,
  }
}
