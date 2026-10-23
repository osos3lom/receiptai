/**
 * Receipt Text Normalization & Extraction Utilities
 * Supports both Arabic (Eastern numerals & Arabic tax invoices) and English receipts.
 */

export interface ParsedReceipt {
  store: string
  date: string
  subTotal: string
  vatPercent: string
  vatAmount: string
  total: string
  currency: string
  rawText: string
  lineItems: Array<{ description: string; amount: string }>
}

/** Converts Eastern Arabic numerals (٠-٩) to Western standard (0-9) */
export function normalizeDigits(text: string): string {
  if (!text) return ""
  return text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
}

/** Parses raw OCR text into structured receipt fields */
export function parseReceiptText(rawText: string): ParsedReceipt {
  const normalized = normalizeDigits(rawText)

  // 1️⃣ Sub-Total detection
  const subTotalRegex =
    /(?:Sub\s*Total|المجموع\s*الجزئي|إجمالي\s*المنتجات|Subtotal|المبلغ\s*الخاضع\s*للضريبة)\D*([\d]+(?:[.,]\d{1,2})?)/i
  const subMatch = normalized.match(subTotalRegex)
  const subTotal = subMatch ? subMatch[1].replace(/,/g, "") : ""

  // 2️⃣ VAT / Tax detection (Arabic + English)
  const vatRegex =
    /(?:VAT|ضريبة\s*القيمة\s*المضافة|Tax|ضريبة)\s*(?:%|بنسبة)?\s*(\d{1,2})?\D*([\d]+(?:[.,]\d{1,2})?)/i
  const vatMatch = normalized.match(vatRegex)
  const vatPercent = vatMatch ? vatMatch[1] || "15" : "15"
  const vatAmount = vatMatch ? vatMatch[2].replace(/,/g, "") : ""

  // 3️⃣ Total detection
  const totalPriorityRegex =
    /(?:Total\s*(?:Order|Amount|Value|Due|Net)?(?:\s*in\s*Saudi\s*Riyals)?|الإجمالي\s*العام|إجمالي\s*الطلب|إجمالي\s*الفاتورة|المبلغ\s*الإجمالي|صافي\s*المبلغ|Grand\s*Total)\D*([\d]+(?:[.,]\d{1,2})?)/i
  const totalPriorityMatch = normalized.match(totalPriorityRegex)

  let total = totalPriorityMatch ? totalPriorityMatch[1].replace(/,/g, "") : ""

  // Fallback: If no explicit total found, look for largest reasonable amount after VAT line
  if (!total) {
    const numbers = Array.from(
      normalized.matchAll(/(?:[\$€£]|SAR|ر\.س|SR)?\s*([\d]{1,4}(?:[.,]\d{2}))/g)
    )
      .map((m) => parseFloat(m[1].replace(/,/g, "")))
      .filter((n) => !isNaN(n) && n > 0 && n < 100000)

    if (numbers.length > 0) {
      total = Math.max(...numbers).toFixed(2)
    }
  }

  // 4️⃣ Store Name detection
  const storeRegex =
    /(?:Silicon\s*Valley|وادي\s*السيليكون|مؤسسة\s*ماجد\s*سليمان\s*السالم|Jarir|جرير|Extra|اكسترا|Panda|بنده|Lulu|لولو|Carrefour|كارفور|Starbucks|ستاربكس|Al\s*Baik|البيك|Apple|Store|Trading|Company|Est|Market|Supermarket|سوبرماركت|مطعم|مكتبة|مؤسسة|شركة)/i
  const storeMatch = normalized.match(storeRegex)
  
  // Try first non-empty header line if regex didn't match
  let store = storeMatch ? storeMatch[0].trim() : ""
  if (!store) {
    const lines = normalized.split("\n").map((l) => l.trim()).filter((l) => l.length > 2 && !/^\d+$/.test(l))
    store = lines[0] || "Store / Merchant"
  }

  // 5️⃣ Date detection
  const dateRegex =
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/
  const dateMatch = normalized.match(dateRegex)
  const date = dateMatch ? dateMatch[1] : new Date().toISOString().split("T")[0]

  // 6️⃣ Currency detection
  const currencyRegex = /(SAR|ر\.س|ريال|رس|USD|\$|EUR|€|GBP|£|AED|درهم|KWD)/i
  const currencyMatch = normalized.match(currencyRegex)
  let currency = "SAR"
  if (currencyMatch) {
    const matched = currencyMatch[1].toUpperCase()
    if (matched === "$" || matched === "USD") currency = "USD"
    else if (matched === "€" || matched === "EUR") currency = "EUR"
    else if (matched === "£" || matched === "GBP") currency = "GBP"
    else if (matched === "AED" || matched === "درهم") currency = "AED"
    else if (matched === "KWD") currency = "KWD"
    else currency = "SAR"
  }

  // 7️⃣ Extract candidate line items
  const lineItems: Array<{ description: string; amount: string }> = []
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    const itemMatch = line.match(/^(.+?)\s+([\d]+\.\d{2})$/)
    if (itemMatch && !/(total|vat|subtotal|tax|discount|مجموع|ضريبة)/i.test(itemMatch[1])) {
      lineItems.push({
        description: itemMatch[1].trim(),
        amount: itemMatch[2],
      })
    }
  }

  return {
    store,
    date,
    subTotal: subTotal || (total && vatAmount ? (parseFloat(total) - parseFloat(vatAmount)).toFixed(2) : total),
    vatPercent,
    vatAmount: vatAmount || (total && vatPercent ? ((parseFloat(total) * parseFloat(vatPercent)) / (100 + parseFloat(vatPercent))).toFixed(2) : "0.00"),
    total: total || "0.00",
    currency,
    rawText,
    lineItems,
  }
}
