/**
 * In-Browser WebGPU AI Vision Model Runner
 * Designed for client-side receipt recognition with WebGPU acceleration and browser caching.
 * Uses AutoProcessor + AutoModelForVision2Seq for SmolVLM / Idefics3 architecture.
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

export interface VisionEngineInstance {
  processor: any
  model: any
  RawImage: any
  ready: boolean
  backend: "webgpu" | "wasm"
  isMock?: boolean
}

/** Thrown when no real inference could be performed. Never substitute canned text. */
export class InferenceUnavailableError extends Error {
  /** Set when the loaded engine was discarded, so the caller must start it again before retrying. */
  readonly engineDropped: boolean

  constructor(message: string, engineDropped = false) {
    super(message)
    this.name = "InferenceUnavailableError"
    this.engineDropped = engineDropped
  }
}

// Global cached pipeline reference
let cachedEngine: VisionEngineInstance | null = null
let currentBackend: "webgpu" | "wasm" = "webgpu"

/** A receipt JSON payload fits well inside this, and a smaller budget keeps the GPU responsive. */
const MAX_NEW_TOKENS = 384
/** A lost GPU device never settles the generate promise, so the read needs its own deadline. */
const GENERATE_TIMEOUT_MS = 120_000
/** The encoder squashes to 512px anyway, so a larger source only costs memory and CPU. */
const MAX_SOURCE_EDGE = 1024

/** True when the error is a dropped or hung GPU device rather than a model-level failure */
function isDeviceLost(err: unknown): boolean {
  const text = err instanceof Error ? `${err.name} ${err.message}` : String(err)
  return /device.{0,12}(is )?lost|DEVICE_HUNG|device removed/i.test(text)
}

/** Rejects if the underlying promise never settles, which a lost GPU device causes */
async function withDeadline<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Inference did not finish within ${Math.round(ms / 1000)}s. The GPU device may be lost.`)),
          ms
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/** Checks if the vision model pipeline is currently loaded in browser memory */
export function isVisionModelLoaded(): boolean {
  return cachedEngine !== null && !!cachedEngine.ready
}

/** Returns the active in-memory pipeline instance if loaded */
export function getCachedVisionModel(): VisionEngineInstance | null {
  return cachedEngine
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
  cachedEngine = null
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
 * Loads Transformers.js v3.x from ESM CDN in browser, with fallback to bundled npm module
 */
async function loadTransformersLibrary(): Promise<any> {
  if (typeof window !== "undefined") {
    try {
      // Use ESM CDN for single-file browser runtime
      // @ts-ignore
      const cdn = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3")
      if (cdn && (cdn.AutoProcessor || cdn.pipeline)) {
        return cdn
      }
    } catch (e) {
      console.warn("ESM CDN import failed, falling back to npm package:", e)
    }
  }
  return await import("@huggingface/transformers")
}

/** Caps the longest edge so the preprocessor never builds a multi-megapixel working tensor */
async function capLongestEdge(image: any): Promise<any> {
  const longest = Math.max(image.width || 0, image.height || 0)
  if (!longest || longest <= MAX_SOURCE_EDGE) {
    return image
  }
  const scale = MAX_SOURCE_EDGE / longest
  return await image.resize(Math.round(image.width * scale), Math.round(image.height * scale))
}

/** Converts various image input formats into Transformers.js RawImage safely */
async function toRawImage(RawImage: any, input: string | HTMLCanvasElement | Blob): Promise<any> {
  if (!input) {
    throw new Error("No image source provided for vision model.")
  }
  if (input instanceof RawImage) {
    return await capLongestEdge(input)
  }
  if (input instanceof Blob) {
    return await capLongestEdge(await RawImage.fromBlob(input))
  }
  if (typeof HTMLCanvasElement !== "undefined" && input instanceof HTMLCanvasElement) {
    return await capLongestEdge(RawImage.fromCanvas(input))
  }
  if (typeof input === "string") {
    if (input.startsWith("data:")) {
      const res = await fetch(input)
      const blob = await res.blob()
      return await capLongestEdge(await RawImage.fromBlob(blob))
    }
    return await capLongestEdge(await RawImage.read(input))
  }
  return await capLongestEdge(await RawImage.read(input))
}

/**
 * Initializes and downloads the in-browser vision model.
 * Connects to Hugging Face Transformers.js with real WebGPU compute shaders and Cache API.
 */
export async function initVisionModel(
  onProgress?: (p: ModelProgress) => void
): Promise<VisionEngineInstance> {
  const notify = onProgress || (() => {})
  const fileBytes = new Map<string, { loaded: number; total: number }>()
  let bytesLoaded = 0
  let bytesTotal = 0

  if (cachedEngine && cachedEngine.ready) {
    notify({
      status: "ready",
      progress: 100,
      downloadedMB: 0,
      totalMB: 0,
      backend: currentBackend,
      message: "Ready (cached in memory)",
    })
    return cachedEngine
  }

  const hasWebGPU = await checkWebGPUSupport()
  currentBackend = hasWebGPU ? "webgpu" : "wasm"

  notify({
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

    cachedEngine = {
      processor: null,
      model: null,
      RawImage: null,
      isMock: true,
      ready: true,
      backend: currentBackend,
    }

    notify({
      status: "ready",
      progress: 100,
      downloadedMB: 0,
      totalMB: 0,
      backend: currentBackend,
      message: "MOCK MODE - no model loaded, extraction is disabled",
    })
    return cachedEngine
  }

  try {
    const lib = await loadTransformersLibrary()
    const { AutoProcessor, AutoModelForVision2Seq, RawImage, env } = lib
    if (env) {
      env.allowLocalModels = true
      // Must carry the GitHub Pages basePath so the site can resolve local models
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

    notify({
      status: "downloading",
      progress: 15,
      downloadedMB: 0,
      totalMB: 0,
      backend: currentBackend,
      message: "Fetching model weights...",
    })

    const progressCallback = (info: any) => {
      if (info.status === "progress" && info.total) {
        fileBytes.set(info.file || "weights", { loaded: info.loaded, total: info.total })
        bytesLoaded = 0
        bytesTotal = 0
        for (const b of fileBytes.values()) {
          bytesLoaded += b.loaded
          bytesTotal += b.total
        }
        const pct = bytesTotal > 0 ? Math.round((bytesLoaded / bytesTotal) * 100) : 0
        notify({
          status: "downloading",
          progress: Math.min(95, Math.max(15, pct)),
          downloadedMB: Math.round(bytesLoaded / (1024 * 1024)),
          totalMB: Math.round(bytesTotal / (1024 * 1024)),
          backend: currentBackend,
          message: `Downloading: ${info.file || "weights"} (${pct}%)`,
        })
      }
    }

    // Load fine-tuned WebGPU vision model and processor (SmolVLM-256M in q4f16)
    const processor = await AutoProcessor.from_pretrained("receipt-ai-webgpu", {
      progress_callback: progressCallback,
    })

    const model = await AutoModelForVision2Seq.from_pretrained("receipt-ai-webgpu", {
      dtype: "q4f16",
      device: currentBackend,
      progress_callback: progressCallback,
    })

    const engine: VisionEngineInstance = {
      processor,
      model,
      RawImage,
      ready: true,
      backend: currentBackend,
      isMock: false,
    }

    cachedEngine = engine
  } catch (err) {
    console.error("Vision model initialization failed:", err)
    cachedEngine = null
    notify({
      status: "error",
      progress: 0,
      downloadedMB: 0,
      totalMB: 0,
      backend: "none",
      message: err instanceof Error ? err.message : "Could not load the vision model.",
    })
    throw err
  }

  notify({
    status: "ready",
    progress: 100,
    downloadedMB: bytesLoaded ? Math.round(bytesLoaded / (1024 * 1024)) : 185,
    totalMB: bytesTotal ? Math.round(bytesTotal / (1024 * 1024)) : 185,
    backend: currentBackend,
    message: `Ready (${currentBackend.toUpperCase()})`,
  })

  return cachedEngine
}

/**
 * Runs receipt extraction on an image element, Blob, or URL.
 * Automatically initializes the engine if not already active.
 */
export async function extractReceiptData(
  imageSource: string | HTMLCanvasElement | Blob,
  model?: any,
  onProgress?: (p: ModelProgress) => void
): Promise<InferenceResult> {
  const startTime = performance.now()

  // Auto-healing: If model reference was not provided or not ready, automatically initialize
  let activeEngine = model || getCachedVisionModel()
  if (!activeEngine || (!activeEngine.ready && !activeEngine.isMock)) {
    activeEngine = await initVisionModel(onProgress)
  }

  let rawExtractedText = ""

  if (activeEngine && !activeEngine.isMock) {
    try {
      const rawImg = await toRawImage(activeEngine.RawImage, imageSource)

      const messages = [
        {
          role: "user",
          content: [
            { type: "image" },
            {
              type: "text",
              text: "Extract all receipt fields as JSON matching schema: store, tax_number, date, subtotal, vat_percent, vat_amount, total, currency, line_items.",
            },
          ],
        },
      ]

      const prompt = activeEngine.processor.apply_chat_template(messages, { add_generation_prompt: true })

      // Image splitting tiles the receipt into 512px patches at a 2048px working size, so a
      // single page becomes 17 vision passes and ~1100 image tokens. That overruns the GPU
      // watchdog and the device is lost mid-generate (DXGI_ERROR_DEVICE_HUNG). One global
      // patch keeps the encoder at 64 image tokens, which is what this model was served for.
      const inputs = await activeEngine.processor(prompt, [rawImg], {
        do_image_splitting: false,
      })

      const generatedIds: any = await withDeadline(
        activeEngine.model.generate({
          ...inputs,
          max_new_tokens: MAX_NEW_TOKENS,
          do_sample: false,
        }),
        GENERATE_TIMEOUT_MS
      )

      // Extract only newly generated token IDs by slicing past prompt length
      const promptLen = inputs.input_ids.dims.at(-1)
      const newTokens = generatedIds.slice(null, [promptLen, null])
      const decoded = activeEngine.processor.batch_decode(newTokens, { skip_special_tokens: true })
      rawExtractedText = (decoded[0] || "").trim()
    } catch (e) {
      console.warn("Client inference failed:", e)

      // A lost or hung GPU device leaves every ONNX session in this engine unusable, so drop
      // the cached engine and let the next attempt rebuild it instead of failing forever.
      if (isDeviceLost(e)) {
        cachedEngine = null
        throw new InferenceUnavailableError(
          "The GPU driver dropped the model mid-read. Start the engine again and retry, or use a smaller image.",
          true
        )
      }

      throw new InferenceUnavailableError(
        "The vision model failed while reading this image. Nothing was extracted."
      )
    }
  } else if (activeEngine?.isMock) {
    throw new InferenceUnavailableError(
      "Mock mode is active, so no model is loaded. Reload without ?mock=1 to extract."
    )
  } else {
    throw new InferenceUnavailableError(
      "No vision model is loaded. Start the engine before extracting."
    )
  }

  // An empty or near-empty transcription means the model could not read the document
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
