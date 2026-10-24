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
  layaEngineTitle: string
  layaCatLabel: string
  layaComplianceLabel: string
  layaCompliancePassed: string
  layaComplianceFailed: string
  layaConfidenceLabel: string
  step3Tip: string
  mathReconciled: string
  mathDiff: string
  mathUnverified: string
  fieldsNotFound: string
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
    appInfo: "استخراج بيانات الفواتير محلياً وفورياً داخل المتصفح دون خوادم سحابية.",
    webGpuReady: "WebGPU",
    webGpuTip: "تسريع عتاد WebGPU مفعّل لأقصى سرعة.",
    wasmFallback: "WASM",
    wasmTip: "يعمل عبر معالج المتصفح (WebAssembly).",
    purgeCache: "مسح الذاكرة",
    purgeTip: "حذف النموذج المخزن مؤقتاً (~١٨٥ م.ب).",
    purged: "تم مسح الذاكرة",
    privacyBadge: "خصوصية ١٠٠٪",
    privacyTip: "جميع الفحوصات تتم داخل جهازك فقط.",

    step1Title: "المحرك",
    step1Tip: "يتم تشغيل النموذج في المتصفح للعمل بدون إنترنت.",
    loadFromCache: "بدء المحرك",
    downloadAndStart: "بدء المحرك (~١٨٥ م.ب)",
    readyInMemory: "جاهز",
    retrying: "إعادة المحاولة...",
    retry: "إعادة المحاولة",

    step2Title: "الفاتورة",
    step2Tip: "ارفع فاتورة أو اختر عينة جاهزة.",
    quickSamples: "عينات",
    fileUpload: "رفع صورة",
    cameraUpload: "الكاميرا",
    uploadFormatTip: "يدعم PNG و JPG و WebP.",
    clearImage: "إلغاء",
    scanBtn: "فحص الفاتورة",
    scanningBtn: "جارِ الفحص...",

    step3Title: "التدقيق",
    layaEngineTitle: "محرك لايا للالتزام",
    layaCatLabel: "فئة المستند",
    layaComplianceLabel: "التزام هيئة الزكاة (ZATCA)",
    layaCompliancePassed: "متوافق",
    layaComplianceFailed: "غير متوافق",
    layaConfidenceLabel: "مستوى الثقة",
    step3Tip: "مقارنة الحقول المستخرجة وتدقيق الضريبة.",
    mathReconciled: "متطابق ضريبياً",
    mathDiff: "فارق حسابي",
    mathUnverified: "تعذّر التحقق الحسابي",
    fieldsNotFound: "لم تُقرأ هذه الحقول من الإيصال، أدخلها يدوياً:",
    reconcileTip: "المجموع الفرعي + الضريبة = الإجمالي.",
    autoReconcile: "مطابقة",
    confidence: "الدقة",
    confidenceTip: "نسبة ثقة محرك الذكاء الاصطناعي.",

    tabDocument: "المستند",
    tabForm: "البيانات",
    peekDoc: "معاينة",

    exportCsv: "CSV",
    exportJson: "JSON",
    copyCsv: "نسخ الجدول",
    copyJson: "نسخ JSON",
    copied: "تم النسخ",
    downloaded: "تم التحميل",

    originalDoc: "الفاتورة الأصلية",
    zoomIn: "تكبير",
    zoomOut: "تصغير",
    resetZoom: "إعادة ضبط",
    latencyTip: "زمن الفحص محلياً في جهازك.",

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
    appInfo: "Private in-browser invoice extraction via WebGPU.",
    webGpuReady: "WebGPU",
    webGpuTip: "Hardware acceleration active for maximum AI speed.",
    wasmFallback: "WASM",
    wasmTip: "Running on browser CPU mode.",
    purgeCache: "Purge Cache",
    purgeTip: "Delete cached AI weights (~185 MB).",
    purged: "Cache cleared",
    privacyBadge: "100% Private",
    privacyTip: "All OCR and parsing happens on your device only.",

    step1Title: "AI Engine",
    step1Tip: "Downloads model to browser storage for instant offline access.",
    loadFromCache: "Start Engine",
    downloadAndStart: "Start Engine (~185 MB)",
    readyInMemory: "Ready",
    retrying: "Retrying...",
    retry: "Retry",

    step2Title: "Receipt",
    step2Tip: "Upload receipt or pick a sample.",
    quickSamples: "Samples",
    fileUpload: "Upload",
    cameraUpload: "Camera",
    uploadFormatTip: "Supports PNG, JPG, WebP.",
    clearImage: "Clear",
    scanBtn: "Scan Receipt",
    scanningBtn: "Scanning...",

    step3Title: "Audit",
    layaEngineTitle: "Laya AI Compliance Engine",
    layaCatLabel: "DOCUMENT CATEGORY",
    layaComplianceLabel: "ZATCA COMPLIANCE",
    layaCompliancePassed: "Compliant",
    layaComplianceFailed: "Non-Compliant",
    layaConfidenceLabel: "Confidence Score",
    step3Tip: "Validate extracted fields and tax math.",
    mathReconciled: "Matched",
    mathDiff: "Diff",
    mathUnverified: "Can't verify math",
    fieldsNotFound: "Not read from this receipt, enter manually:",
    reconcileTip: "Subtotal + VAT = Grand Total.",
    autoReconcile: "Auto-Match",
    confidence: "Confidence",
    confidenceTip: "Vision model certainty score.",

    tabDocument: "Document",
    tabForm: "Data",
    peekDoc: "Preview",

    exportCsv: "CSV",
    exportJson: "JSON",
    copyCsv: "Copy CSV",
    copyJson: "Copy JSON",
    copied: "Copied",
    downloaded: "Downloaded",

    originalDoc: "Original Receipt",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    resetZoom: "Reset",
    latencyTip: "Local latency on your hardware.",

    storeLabel: "Merchant",
    dateLabel: "Date",
    categoryLabel: "Category",
    refLabel: "Tax / Ref #",
    paymentLabel: "Payment",
    subtotalLabel: "Subtotal",
    taxLabel: "Tax",
    totalLabel: "Grand Total",
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
