export type Language = "ar" | "en"

export interface TranslationDictionary {
  appName: string
  appInfo: string
  webGpuReady: string
  webGpuTip: string
  wasmFallback: string
  wasmTip: string
  purgeCache: string
  purgeTip: string
  purged: string
  privacyBadge: string
  privacyTip: string

  // Step 1
  step1Title: string
  step1Tip: string
  loadFromCache: string
  downloadAndStart: string
  readyInMemory: string
  retrying: string
  retry: string

  // Step 2
  step2Title: string
  step2Tip: string
  quickSamples: string
  fileUpload: string
  cameraUpload: string
  uploadFormatTip: string
  clearImage: string
  scanBtn: string
  scanningBtn: string

  // Step 3
  step3Title: string
  step3Tip: string
  mathReconciled: string
  mathDiff: string
  reconcileTip: string
  autoReconcile: string
  confidence: string
  confidenceTip: string

  // Mobile Tabs
  tabDocument: string
  tabForm: string
  peekDoc: string

  // Exports
  exportCsv: string
  exportJson: string
  copyCsv: string
  copyJson: string
  copied: string
  downloaded: string

  // Viewer
  originalDoc: string
  zoomIn: string
  zoomOut: string
  resetZoom: string
  latencyTip: string

  // Form Fields
  storeLabel: string
  dateLabel: string
  categoryLabel: string
  refLabel: string
  paymentLabel: string
  subtotalLabel: string
  taxLabel: string
  totalLabel: string
  currencyLabel: string
  lineItemsLabel: string
  amountLabel: string

  // History
  historyTitle: string
  clearHistory: string

  // Samples
  sampleSaasLabel: string
  sampleArabicLabel: string
  sampleEnglishLabel: string

  // Categories
  catSoftware: string
  catOffice: string
  catTravel: string
  catMeals: string
  catUtilities: string
  catGeneral: string
}

export const translations: Record<Language, TranslationDictionary> = {
  ar: {
    appName: "قارئ الفواتير",
    appInfo: "استخراج بيانات الفواتير محلياً وفورياً داخل المتصفح بتقنية WebGPU دون إرسال أي مستند لخوادم خارجية.",
    webGpuReady: "WebGPU",
    webGpuTip: "تسريع العتاد عبر WebGPU مفعّل لأقصى سرعة استخراج بالذكاء الاصطناعي.",
    wasmFallback: "WASM",
    wasmTip: "يعمل حالياً عبر محاكي WebAssembly للمعالجات العادية.",
    purgeCache: "مسح الذاكرة",
    purgeTip: "حذف أوزان النموذج المخزنة مؤقتاً في متصفحك (~٤٨ ميجابايت).",
    purged: "تم مسح الذاكرة المؤقتة",
    privacyBadge: "خصوصية ١٠٠٪",
    privacyTip: "جميع الفحوصات تتم بالكامل داخل ذاكرة جهازك. لا ترفع الصور لأي خادم.",

    step1Title: "المحرك الذكي",
    step1Tip: "يتم تحميل نموذج الرؤية وتخزينه في ذاكرة المتصفح للاستخدام الفوري بدون إنترنت لاحقاً.",
    loadFromCache: "تشغيل من الذاكرة",
    downloadAndStart: "بدء المحرك (~٤٨ م.ب)",
    readyInMemory: "جاهز في الذاكرة",
    retrying: "إعادة المحاولة...",
    retry: "إعادة المحاولة",

    step2Title: "مستند الفاتورة",
    step2Tip: "اختر صورة فاتورة ضريبية، أو التقطها بالكاميرا، أو جرب إحدى العينات الجاهزة.",
    quickSamples: "عينات جاهزة",
    fileUpload: "رفع صورة",
    cameraUpload: "الكاميرا",
    uploadFormatTip: "يدعم صيغ PNG و JPG و WebP بجودة عالية للتعرف البصري.",
    clearImage: "إلغاء",
    scanBtn: "فحص واستخراج",
    scanningBtn: "جارِ الفحص...",

    step3Title: "المطابقة والتدقيق",
    step3Tip: "مقارنة الحقول المستخرجة مع الفاتورة الأصلية جنباً إلى جنب مع تدقيق المعادلة الضريبية.",
    mathReconciled: "متطابق ضريبياً",
    mathDiff: "فارق حسابي",
    reconcileTip: "يتم فحص (المجموع الفرعي + الضريبة = الإجمالي) للتأكد من سلامة الحسابات.",
    autoReconcile: "مطابقة تلقائية",
    confidence: "الدقة",
    confidenceTip: "نسبة ثقة محرك الذكاء الاصطناعي في صحة الكلمات المستخرجة.",

    tabDocument: "المستند",
    tabForm: "البيانات",
    peekDoc: "معاينة الفاتورة",

    exportCsv: "CSV",
    exportJson: "JSON",
    copyCsv: "نسخ الجدول",
    copyJson: "نسخ JSON",
    copied: "تم النسخ",
    downloaded: "تم التحميل",

    originalDoc: "المستند الأصلي",
    zoomIn: "تكبير",
    zoomOut: "تصغير",
    resetZoom: "إعادة ضبط",
    latencyTip: "زمن استجابة فحص الفاتورة داخل جهازك بالمللي ثانية.",

    storeLabel: "المتجر",
    dateLabel: "التاريخ",
    categoryLabel: "التصنيف",
    refLabel: "المرجع / الضريبي",
    paymentLabel: "الدفع",
    subtotalLabel: "المجموع الفرعي",
    taxLabel: "الضريبة",
    totalLabel: "الإجمالي النهائي",
    currencyLabel: "العملة",
    lineItemsLabel: "البنود",
    amountLabel: "المبلغ",

    historyTitle: "السجل",
    clearHistory: "مسح السجل",

    sampleSaasLabel: "سحابية (درهم)",
    sampleArabicLabel: "ضريبية (ريال)",
    sampleEnglishLabel: "إلكترونيات (دولار)",

    catSoftware: "برمجيات",
    catOffice: "مكتب وتقنية",
    catTravel: "سفر",
    catMeals: "وجبات",
    catUtilities: "اتصالات",
    catGeneral: "عام",
  },
  en: {
    appName: "Receipt AI",
    appInfo: "Extract invoice data privately and instantly in your browser via WebGPU without server uploads.",
    webGpuReady: "WebGPU",
    webGpuTip: "Hardware acceleration active for maximum AI extraction speed.",
    wasmFallback: "WASM",
    wasmTip: "Running on CPU/WebAssembly single-threaded fallback mode.",
    purgeCache: "Purge Cache",
    purgeTip: "Delete cached AI vision weights (~48 MB) from your browser storage.",
    purged: "Cache cleared",
    privacyBadge: "100% Private",
    privacyTip: "All OCR and parsing happens entirely on your device. Zero cloud uploads.",

    step1Title: "AI Engine",
    step1Tip: "Downloads and caches the vision model in browser storage for instant offline-ready access.",
    loadFromCache: "Load Cached Model",
    downloadAndStart: "Start Engine (~48 MB)",
    readyInMemory: "Active in Memory",
    retrying: "Retrying...",
    retry: "Retry",

    step2Title: "Document",
    step2Tip: "Upload receipt image, take a camera snap, or choose a pre-loaded sample.",
    quickSamples: "Samples",
    fileUpload: "Upload",
    cameraUpload: "Camera",
    uploadFormatTip: "Supports PNG, JPG, WebP with high-resolution text clarity.",
    clearImage: "Clear",
    scanBtn: "Scan & Extract",
    scanningBtn: "Scanning...",

    step3Title: "Audit",
    step3Tip: "Side-by-side inspection of extracted data against original document with math reconciliation.",
    mathReconciled: "Reconciled",
    mathDiff: "Difference",
    reconcileTip: "Validates that Subtotal + VAT equals Grand Total within 0.05 tolerance.",
    autoReconcile: "Auto-Reconcile",
    confidence: "Confidence",
    confidenceTip: "Vision model certainty score for extracted tokens.",

    tabDocument: "Document",
    tabForm: "Data",
    peekDoc: "Peek Document",

    exportCsv: "CSV",
    exportJson: "JSON",
    copyCsv: "Copy CSV",
    copyJson: "Copy JSON",
    copied: "Copied",
    downloaded: "Downloaded",

    originalDoc: "Document",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    resetZoom: "Reset",
    latencyTip: "Inference latency executed on your local GPU/CPU.",

    storeLabel: "Merchant",
    dateLabel: "Date",
    categoryLabel: "Category",
    refLabel: "Tax / Ref #",
    paymentLabel: "Payment",
    subtotalLabel: "Subtotal",
    taxLabel: "Tax",
    totalLabel: "Total",
    currencyLabel: "Currency",
    lineItemsLabel: "Items",
    amountLabel: "Amount",

    historyTitle: "History",
    clearHistory: "Clear",

    sampleSaasLabel: "Cloud (AED)",
    sampleArabicLabel: "Tax (SAR)",
    sampleEnglishLabel: "Store (USD)",

    catSoftware: "Software",
    catOffice: "Office & IT",
    catTravel: "Travel",
    catMeals: "Meals",
    catUtilities: "Telecom",
    catGeneral: "General",
  },
}
