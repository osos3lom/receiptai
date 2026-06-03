import { google } from "googleapis";
import { ImageAnnotatorClient } from "@google-cloud/vision";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = process.env.TELEGRAM_TOKEN!;
    const chatId = body?.message?.chat?.id;
    const photo = body?.message?.photo;

    if (!chatId || !photo) return new Response("No photo", { status: 200 });

    // Get highest resolution
    const fileId = photo.at(-1).file_id;
    const fileInfo = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
    ).then((r) => r.json());
    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.result.file_path}`;

    // Download binary image
    const imageResp = await fetch(fileUrl);
    const buffer = Buffer.from(await imageResp.arrayBuffer());

    // OCR with Vision API (Arabic + English)
    const vision = new ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
        private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      },
    });

    const [result] = await vision.annotateImage({
      image: { content: buffer },
      features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
    });

    const allText = result.fullTextAnnotation?.text || "(no text)";

    // -------------------------------------------------------------
    // 🧠 Text Parsing Logic
    // -------------------------------------------------------------
    const normalizeDigits = (txt: string) =>
      txt.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
    const textNorm = normalizeDigits(allText);

    // 1️⃣ Sub‑Total detection
    const subTotalRegex =
      /(Sub\s*Total|المجموع\s*الجزئي|إجمالي\s*المنتجات)\D*([\d.,]+)/i;
    const subMatch = textNorm.match(subTotalRegex);
    const subTotal = subMatch ? subMatch[2].replace(/,/g, "") : "";

    // 2️⃣ VAT detection (Arabic + English)
    const vatRegex =
      /(VAT|ضريبة\s*القيمة\s*المضافة)\s*(?:%|بنسبة)?\s*(\d{1,2})?\D*([\d.,]+)/i;
    const vatMatch = textNorm.match(vatRegex);
    const vatPercent = vatMatch ? vatMatch[2] || "15" : "15";
    const vatAmount = vatMatch ? vatMatch[3].replace(/,/g, "") : "";

    // 3️⃣ Total detection — prioritizing "Total Order Value" or Arabic equivalents
    const totalPriorityRegex =
      /(Total\s*(Order|Amount|Value|Due)?\s*(in\s*Saudi\s*Riyals)?|الإجمالي\s*العام|إجمالي\s*الطلب|إجمالي\s*الطلب\s*بالريال)\D*([\d.,]+)/i;
    const totalPriorityMatch = textNorm.match(totalPriorityRegex);

    let total = totalPriorityMatch ? totalPriorityMatch[4] : "";

    // 4️⃣ Fallback: if still no total, take highest number AFTER VAT line only
    if (!total) {
      const afterVat = textNorm.split(vatMatch ? vatMatch[0] : "VAT").pop() || "";
      const candidates = Array.from(
        afterVat.matchAll(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g)
      ).map((m) => parseFloat(m[1].replace(/,/g, "")));
      if (candidates.length) total = Math.max(...candidates).toFixed(2);
    }

    // Basic vendor/date/currency helpers
    const storeRegex =
      /(Silicon\s*Valley|وادي\s*السيليكون|مؤسسة\s*ماجد\s*سليمان\s*السالم|Electronics|Trading|Company|Est|EST)/i;
    const dateRegex =
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/;
    const currencyRegex = /(SAR|ر\.س|ريال|رس)/i;

    const store = textNorm.match(storeRegex)?.[0]?.trim() || "غير معروف";
    const date = textNorm.match(dateRegex)?.[1] || "";
    const currency = textNorm.match(currencyRegex)?.[1]?.toUpperCase() || "SAR";

    // -------------------------------------------------------------
    // 🧾 Telegram message summary
    // -------------------------------------------------------------
    const parsedText = `🏬 *Store:* ${store}
📆 *Date:* ${date}
💵 *Sub‑Total:* ${subTotal || "—"} ${currency}
🧾 *VAT (${vatPercent}%):* ${vatAmount || "—"} ${currency}
💰 *Total:* ${total || "—"} ${currency}`;

    // -------------------------------------------------------------
    // ✅ Append structured row to Google Sheets
    // -------------------------------------------------------------
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
        private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: "Receipts!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            new Date().toISOString(),
            store,
            subTotal,
            vatAmount,
            vatPercent,
            total,
            currency,
            fileUrl,
          ],
        ],
      },
    });

    // -------------------------------------------------------------
    // ✅ Reply to user on Telegram
    // -------------------------------------------------------------
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: parsedText,
        parse_mode: "Markdown",
      }),
    });

    return new Response("OK");
  } catch (err) {
    console.error("Telegram receipt error:", err);
    return new Response("Internal Server Error", { status: 200 });
  }
}
