import { NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing GOOGLE_SHEET_ID environment variable" }, { status: 500 })
    }

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Receipts!A:F",
    })

    const rows = res.data.values || []

    // Skip header row and map to receipt objects
    const receipts = rows.slice(1).map((row, index) => ({
      id: index + 1,
      date: row[0] || "",
      vendor: row[1] || "",
      total: row[2] || "",
      currency: row[3] || "",
      notes: row[4] || "",
      image: row[5] || "",
    }))

    return NextResponse.json(receipts)
  } catch (error) {
    console.error("Error fetching receipts:", error)
    return NextResponse.json({ error: "Failed to fetch receipts from Google Sheets" }, { status: 500 })
  }
}
