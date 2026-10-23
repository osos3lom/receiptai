/**
 * Receipt Text Normalization, Extraction & Audit Utilities
 * Supports digital SaaS invoices, Arabic tax invoices (ZATCA), and English thermal receipts.
 */

export type ExpenseCategory =
  | "Software & Subscriptions"
  | "Office & IT Equipment"
  | "Travel & Transportation"
  | "Meals & Entertainment"
  | "Utilities & Telecom"
  | "General Business Expense"

export interface ParsedReceipt {
  store: string
  date: string
  referenceNumber?: string
  paymentMethod?: string
  category: ExpenseCategory
  subTotal: string
  vatPercent: string
  vatAmount: string
  total: string
  currency: string
  rawText: string
  lineItems: Array<{ description: string; amount: string }>
  isMathBalanced: boolean
  mathDifference: number
  confidence: {
    overall: number
    store: number
    date: number
    total: number
    tax: number
  }
}

/** Converts Eastern Arabic numerals (٠-٩) to Western standard (0-9) */
export function normalizeDigits(text: string): string {
  if (!text) return ""
  return text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
}

/** Determines standard business expense category based on merchant & item text */
export function detectExpenseCategory(text: string, store: string): ExpenseCategory {
  const combined = (text + " " + store).toLowerCase()

  if (
    /(domain|\.com|\.sa|\.ae|hosting|cloud|renewal|software|subscription|email|server|godaddy|aws|google|microsoft|masaravenue|adobe|slack|github)/i.test(
      combined
    )
  ) {
    return "Software & Subscriptions"
  }

  if (
    /(uber|careem|taxi|flight|airline|delta|emirates|saudia|hotel|booking|transport|fuel|petrol|بنزين|طيران|فندق)/i.test(
      combined
    )
  ) {
    return "Travel & Transportation"
  }

  if (
    /(coffee|cafe|starbucks|restaurant|lunch|dinner|burger|al\s*baik|مقهى|مطعم|كافيه|شاورما|وجبة)/i.test(
      combined
    )
  ) {
    return "Meals & Entertainment"
  }

  if (
    /(electronics|hardware|mouse|keyboard|silicon\s*valley|jarir|extra|apple|laptop|cable|شاحن|كمبيوتر|إلكترونيات|مكتبة)/i.test(
      combined
    )
  ) {
    return "Office & IT Equipment"
  }

  if (/(stc|mobily|zain|telecom|electric|water|utilities|كهرباء|مياه|اتصالات)/i.test(combined)) {
    return "Utilities & Telecom"
  }

  return "General Business Expense"
}

/** Parses raw OCR text into structured receipt fields */
export function parseReceiptText(rawText: string): ParsedReceipt {
  const normalized = normalizeDigits(rawText)

  // 1️⃣ Sub-Total detection
  const subTotalRegex =
    /(?:Sub\s*Total|المجموع\s*الجزئي|إجمالي\s*المنتجات|Subtotal|المبلغ\s*الخاضع\s*للضريبة)\D*([\d]+(?:[.,]\d{1,2})?)/i
  const subMatch = normalized.match(subTotalRegex)
  let subTotal = subMatch ? subMatch[1].replace(/,/g, "") : ""

  // 2️⃣ VAT / Taxes & Fees detection (Arabic + English)
  const vatRegex =
    /(?:VAT|ضريبة\s*القيمة\s*المضافة|Taxes?\s*(?:&|and)?\s*Fees?|Tax|ضريبة|الضريبة|الرسوم)\s*(?:%|بنسبة)?\s*(\d{1,2})?\D*([\d]+(?:[.,]\d{1,2})?)/i
  const vatMatch = normalized.match(vatRegex)
  const vatPercent = vatMatch ? vatMatch[1] || "15" : "15"
  const vatAmount = vatMatch ? vatMatch[2].replace(/,/g, "") : ""

  // 3️⃣ Total detection (must NOT match 'Subtotal' or 'Sub Total')
  const totalPriorityRegex =
    /(?:(?<!sub[-\s]*)\bTotal(?:\s*\([A-Za-z]{3}\))?(?:\s*(?:Order|Amount|Value|Due|Net))?(?:\s*in\s*Saudi\s*Riyals)?|الإجمالي\s*العام|إجمالي\s*الطلب|إجمالي\s*الفاتورة|المبلغ\s*الإجمالي|المبلغ\s*الكلي|صافي\s*المبلغ|Grand\s*Total)\D*([\d]+(?:[.,]\d{1,2})?)/i
  const totalPriorityMatch = normalized.match(totalPriorityRegex)

  let total = totalPriorityMatch ? totalPriorityMatch[1].replace(/,/g, "") : ""

  // Fallback: If no explicit total found, look for largest reasonable amount after VAT/Tax line
  if (!total) {
    const numbers = Array.from(
      normalized.matchAll(/(?:[\$€£]|SAR|AED|SR)?\s*([\d]{1,4}(?:[.,]\d{2}))/g)
    )
      .map((m) => parseFloat(m[1].replace(/,/g, "")))
      .filter((n) => !isNaN(n) && n > 0 && n < 100000)

    if (numbers.length > 0) {
      total = Math.max(...numbers).toFixed(2)
    }
  }

  // 4️⃣ Reference / Confirmation # detection
  const refRegex =
    /(?:Confirmation\s*(?:#|No|Number)?|Invoice\s*(?:#|No|Number)?|Order\s*(?:#|No|Number)?|Ref\s*(?:#|No|Number)?|رقم\s*الفاتورة|رقم\s*المرجع|الرقم\s*المرجعي)\s*[:#\-]?\s*([A-Za-z0-9\-_]{4,30})/i
  const refMatch = normalized.match(refRegex)
  const referenceNumber = refMatch ? refMatch[1].trim() : ""

  // 5️⃣ Payment Method detection
  const paymentRegex =
    /(?:Payment(?:\s*Method)?|طريقة\s*الدفع)\s*[:\-]?\s*(Visa|Mastercard|Mada|مدى|Amex|American\s*Express|Apple\s*Pay|Cash|نقدا|Credit\s*Card|Debit\s*Card)/i
  const paymentMatch = normalized.match(paymentRegex)
  let paymentMethod = paymentMatch ? paymentMatch[1].trim() : ""
  if (!paymentMethod) {
    const paymentFallback = /\b(Visa|Mastercard|Mada|Apple\s*Pay|Amex|مدى)\b/i
    const fallbackMatch = normalized.match(paymentFallback)
    if (fallbackMatch) paymentMethod = fallbackMatch[1].trim()
  }

  // 6️⃣ Currency detection (Strict word boundaries to avoid matching substrings like 'sar' in 'masaravenue')
  const currencyRegex = /\b(AED|SAR|USD|EUR|GBP|KWD|QAR|BHD|OMR)\b|(\$|€|£|ر\.س|ريال|درهم)/gi
  const currencyMatches = Array.from(normalized.matchAll(currencyRegex))
  let currency = "SAR"
  if (currencyMatches.length > 0) {
    const lastMatch = currencyMatches[currencyMatches.length - 1][0].toUpperCase()
    if (lastMatch === "$" || lastMatch === "USD") currency = "USD"
    else if (lastMatch === "€" || lastMatch === "EUR") currency = "EUR"
    else if (lastMatch === "£" || lastMatch === "GBP") currency = "GBP"
    else if (lastMatch === "AED" || lastMatch === "درهم") currency = "AED"
    else if (lastMatch === "KWD") currency = "KWD"
    else if (lastMatch === "SAR" || lastMatch === "ر.س" || lastMatch === "ريال") currency = "SAR"
    else currency = lastMatch
  }

  // 7️⃣ Store / Vendor Name detection with header blacklist
  const GENERIC_TITLES =
    /^(receipt|invoice|tax\s*invoice|bill|statement|order\s*confirmation|فاتورة|فاتورة\s*ضريبية|فاتورة\s*ضريبية\s*مبسطة|إيصال|سند|confirmation|payment\s*receipt)$/i
  const IGNORE_PATTERNS =
    /^(a\s*copy\s*of|dear\s*customer|customer\s*copy|نسخة\s*العميل|thank\s*you|شكرا|confirmation\s*#|date:|payment:|payment\s*method|الرقم\s*الضريبي)/i

  const storeKeywords =
    /(?:Silicon\s*Valley|وادي\s*السيليكون|مؤسسة\s*ماجد|Jarir|جرير|Extra|اكسترا|Panda|بنده|Lulu|لولو|Carrefour|كارفور|Starbucks|ستاربكس|Al\s*Baik|البيك|Apple|Google|Microsoft|Amazon|GoDaddy|Hosting|Superstore|Store|Trading|Company|Est|Market|Supermarket|سوبرماركت|مطعم|مكتبة|مؤسسة|شركة)/i

  const rawLines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !/^\d+$/.test(l))

  let store = ""

  // First, look for a line containing a known merchant brand or keyword that isn't generic
  for (const line of rawLines) {
    if (GENERIC_TITLES.test(line) || IGNORE_PATTERNS.test(line)) continue
    if (storeKeywords.test(line)) {
      store = line
      break
    }
  }

  // Fallback to first non-generic candidate line
  if (!store) {
    for (const line of rawLines) {
      if (GENERIC_TITLES.test(line)) continue
      if (IGNORE_PATTERNS.test(line)) continue
      if (line.includes("@")) continue // Skip email addresses
      if (line.match(refRegex) || line.match(paymentRegex)) continue
      store = line
      break
    }
  }
  if (!store) store = "Merchant / Store"

  // 8️⃣ Date detection
  const dateRegex =
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/
  const dateMatch = normalized.match(dateRegex)
  const date = dateMatch ? dateMatch[1] : new Date().toISOString().split("T")[0]

  // Calculate Subtotal if missing
  if (!subTotal) {
    if (total && vatAmount && parseFloat(total) > parseFloat(vatAmount)) {
      subTotal = (parseFloat(total) - parseFloat(vatAmount)).toFixed(2)
    } else {
      subTotal = total
    }
  }

  // 9️⃣ Multi-line and Single-line Line Items Parsing
  const lineItems: Array<{ description: string; amount: string }> = []
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean)

  const isSummaryLine = (txt: string) =>
    /(total|vat|subtotal|sub-total|tax|taxes|fees|discount|مجموع|ضريبة|رسوم|إجمالي|صافي|confirmation|payment|date)/i.test(
      txt
    )

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i]

    // Pattern 1: Same-line item e.g. "Wireless Mouse 39.99"
    const singleLineMatch = currentLine.match(
      /^(.+?)(?:\s+(?:AED|SAR|USD|\$|EUR|€))?\s+([\d]+\.\d{2})$/i
    )
    if (
      singleLineMatch &&
      !isSummaryLine(singleLineMatch[1]) &&
      !/^(AED|SAR|USD|EUR|GBP)$/i.test(singleLineMatch[1].trim())
    ) {
      lineItems.push({
        description: singleLineMatch[1].trim(),
        amount: singleLineMatch[2],
      })
      continue
    }

    // Pattern 2: Multi-line digital card
    const priceMatch = currentLine.match(/^(?:(?:AED|SAR|USD|\$|EUR|€)\s*)?([\d]+\.\d{2})$/i)
    if (priceMatch && !isSummaryLine(currentLine)) {
      const price = priceMatch[1]
      const descCandidates: string[] = []
      let lookback = 1
      while (i - lookback >= 0 && lookback <= 2) {
        const prev = lines[i - lookback]
        if (!isSummaryLine(prev) && !prev.match(/[\d]+\.\d{2}$/) && !prev.includes("@")) {
          descCandidates.unshift(prev)
        } else {
          break
        }
        lookback++
      }

      if (descCandidates.length > 0) {
        lineItems.push({
          description: descCandidates.join(" — "),
          amount: price,
        })
      }
    }
  }

  // 🔟 Mathematical Reconciliation Check (Subtotal + VAT == Total)
  const numTotal = parseFloat(total) || 0
  const numSubTotal = parseFloat(subTotal) || 0
  const numVat = parseFloat(vatAmount) || 0
  const expectedTotal = Number((numSubTotal + numVat).toFixed(2))
  const mathDiff = Number(Math.abs(numTotal - expectedTotal).toFixed(2))
  const isMathBalanced = mathDiff <= 0.05

  // 1️⃣1️⃣ Expense Categorization
  const category = detectExpenseCategory(normalized, store)

  // 1️⃣2️⃣ Confidence Scores
  const hasStore = store !== "Merchant / Store"
  const hasDate = Boolean(dateMatch)
  const hasTotal = Boolean(totalPriorityMatch)
  const hasTax = Boolean(vatMatch)

  const confidence = {
    overall: Math.round(
      (hasStore ? 25 : 10) +
        (hasDate ? 25 : 15) +
        (hasTotal ? 25 : 10) +
        (isMathBalanced ? 25 : 15)
    ),
    store: hasStore ? 94 : 65,
    date: hasDate ? 98 : 70,
    total: hasTotal ? 99 : 75,
    tax: hasTax ? 95 : 70,
  }

  return {
    store,
    date,
    referenceNumber,
    paymentMethod,
    category,
    subTotal,
    vatPercent,
    vatAmount: vatAmount || "0.00",
    total: total || "0.00",
    currency,
    rawText,
    lineItems,
    isMathBalanced,
    mathDifference: mathDiff,
    confidence,
  }
}
