/**
 * In-Browser WebGPU AI Vision Model Runner
 * Designed for client-side receipt recognition with WebGPU acceleration and browser caching.
 * Uses @huggingface/transformers v3.x via ESM CDN with single-file browser pipeline,
 * pre-allocated scratch buffers, shader pre-warming, and auto-start resilience.
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
  return cachedPipeline !== null && (typeof cachedPipeline === "function" || !!cachedPipeline.ready)
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
 * Loads Transformers.js v3.x from ESM CDN in browser, with fallback to bundled npm module
 */
async function loadTransformersLibrary(): Promise<any> {
  if (typeof window !== "undefined") {
    try {
      // Use ESM CDN for single-file browser runtime
      // @ts-ignore
      const cdn = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3")
      if (cdn && (cdn.pipeline || cdn.AutoModelForVision2Seq)) {
        return cdn
      }
    } catch (e) {
      console.warn("ESM CDN import failed, falling back to npm package:", e)
    }
  }
  return await import("@huggingface/transformers")
}

/** Converts various image input formats into Transformers.js RawImage */
async function toRawImage(RawImage: any, input: string | HTMLCanvasElement | Blob): Promise<any> {
  if (input instanceof Blob) {
    return await RawImage.fromBlob(input)
  }
  if (typeof HTMLCanvasElement !== "undefined" && input instanceof HTMLCanvasElement) {
    return RawImage.fromCanvas(input)
  }
  if (typeof input === "string") {
    if (input.startsWith("data:")) {
      const res = await fetch(input)
      const blob = await res.blob()
      return await RawImage.fromBlob(blob)
    }
    return await RawImage.fromURL(input)
  }
  return await RawImage.read(input)
}

/**
 * Initializes and downloads the in-browser vision model.
 * Connects to Hugging Face Transformers.js with real WebGPU compute shaders and Cache API.
 */
export async function initVisionModel(
  onProgress?: (p: ModelProgress) => void
): Promise<any> {
  const notify = onProgress || (() => {})
  const fileBytes = new Map<string, { loaded: number; total: number }>()
  let bytesLoaded = 0
  let bytesTotal = 0

  if (cachedPipeline) {
    notify({
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

    cachedPipeline = {
      isMock: true,
      ready: true,
      backend: currentBackend,
      version: "2.1-mock",
    }

    notify({
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
    const lib = await loadTransformersLibrary()
    const { pipeline, AutoProcessor, AutoModelForVision2Seq, RawImage, env } = lib
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

    // Attempt 1: High-level single-file pipeline with task "image-to-text"
    let pipe: any = null
    try {
      pipe = await pipeline("image-to-text", "receipt-ai-webgpu", {
        dtype: "q4f16",
        device: currentBackend,
        progress_callback: progressCallback,
      })
    } catch (pipelineErr) {
      console.warn("Pipeline init fallback to direct processor/model:", pipelineErr)
      if (AutoProcessor && AutoModelForVision2Seq) {
        const processor = await AutoProcessor.from_pretrained("receipt-ai-webgpu", {
          progress_callback: progressCallback,
        })
        const model = await AutoModelForVision2Seq.from_pretrained("receipt-ai-webgpu", {
          dtype: "q4f16",
          device: currentBackend,
          progress_callback: progressCallback,
        })
        pipe = {
          processor,
          model,
          RawImage,
          ready: true,
          backend: currentBackend,
        }
      } else {
        throw pipelineErr
      }
    }

    // WebGPU Shader Pre-Warming (AIBaloot Pattern)
    // Run a dummy 1-token pass so WebGPU JIT compiles all compute shaders in advance.
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      try {
        notify({
          status: "compiling",
          progress: 98,
          downloadedMB: bytesLoaded ? Math.round(bytesLoaded / (1024 * 1024)) : 185,
          totalMB: bytesTotal ? Math.round(bytesTotal / (1024 * 1024)) : 185,
          backend: currentBackend,
          message: "Pre-warming WebGPU shaders...",
        })

        const scratch = document.createElement("canvas")
        scratch.width = 16
        scratch.height = 16
        const ctx = scratch.getContext("2d", { alpha: false })
        if (ctx) {
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, 16, 16)
          if (typeof pipe === "function") {
            await pipe(scratch, { max_new_tokens: 1, do_sample: false }).catch(() => {})
          }
        }
      } catch {
        // Non-fatal pre-warm
      }
    }

    cachedPipeline = pipe
  } catch (err) {
    console.error("Vision model initialization failed:", err)
    cachedPipeline = null
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

  return cachedPipeline
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
  let activeModel = model || getCachedVisionModel()
  if (!activeModel || (typeof activeModel !== "function" && !activeModel.model && !activeModel.ready)) {
    activeModel = await initVisionModel(onProgress)
  }

  let rawExtractedText = ""

  // Execute real model inference if available and not a mock descriptor
  if (activeModel && !activeModel.isMock) {
    try {
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

      if (typeof activeModel === "function") {
        const output = await activeModel(imageSource, {
          prompt: messages,
          max_new_tokens: 768,
          do_sample: false,
        })

        if (Array.isArray(output) && output[0]?.generated_text) {
          rawExtractedText =
            typeof output[0].generated_text === "string"
              ? output[0].generated_text
              : JSON.stringify(output[0].generated_text)
        } else if (typeof output === "string") {
          rawExtractedText = output
        } else if (typeof output === "object" && output !== null) {
          if ("generated_text" in output && typeof output.generated_text === "string") {
            rawExtractedText = output.generated_text
          } else {
            rawExtractedText = JSON.stringify(output)
          }
        }
      } else if (activeModel.model && activeModel.processor) {
        const rawImg = await toRawImage(activeModel.RawImage, imageSource)
        const prompt = activeModel.processor.apply_chat_template(messages, { add_generation_prompt: true })
        const inputs = await activeModel.processor(prompt, [rawImg])
        const genIds = await activeModel.model.generate({ ...inputs, max_new_tokens: 768, do_sample: false })
        const promptLen = inputs.input_ids.dims.at(-1)
        const newTokens = genIds.slice(null, [promptLen, null])
        const decoded = activeModel.processor.batch_decode(newTokens, { skip_special_tokens: true })
        rawExtractedText = (decoded[0] || "").trim()
      }
    } catch (e) {
      console.warn("Client inference failed:", e)
      throw new InferenceUnavailableError(
        "The vision model failed while reading this image. Nothing was extracted."
      )
    }
  } else if (activeModel?.isMock) {
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
