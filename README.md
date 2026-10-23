# Receipt AI — In-Browser WebGPU Vision Scanner

A private, client-side receipt and invoice data extractor powered by WebGPU and in-browser AI vision models. **100% serverless, zero external API costs, and deployable as a static site on GitHub Pages.**

---

## ⚡ Features

- **🚀 WebGPU Hardware Acceleration**: Runs AI vision inference locally inside your browser with automatic CPU/WASM fallback.
- **🔒 100% Private**: Your receipt photos and financial documents never leave your browser or device.
- **💾 Browser Storage Caching**: Model weights (~48 MB) are cached locally in the browser Cache API / IndexedDB. Repeat visits initialize immediately without re-downloading.
- **📄 Interactive 3-Step Demo**:
  1. **Download & Start Model**: Real-time download progress bar and WebGPU shader pre-warming.
  2. **Upload Receipt**: Drag & drop, camera capture, file upload, or 1-click test samples (Arabic & English tax invoices).
  3. **Extract & Copy**: Structured breakdown of Store/Vendor, Date, Subtotal, VAT (rate & amount), Total, and Currency with 1-click copy options (**JSON**, **Summary Text**, **Table**).
- **🌐 Static GitHub Pages Ready**: Built with `output: 'export'`, single-threaded WASM fallback for environments without COOP/COEP headers, and automated GitHub Actions deployment.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    User([User]) -->|Step 1: Download/Start| ModelInit[Browser Cache / WebGPU Session]
    ModelInit -->|Store Weights| Cache[(Browser Cache API)]
    User -->|Step 2: Upload / Camera / Sample| Canvas[Image / Canvas Preview]
    Canvas -->|Step 3: WebGPU Inference| Runner[lib/webgpu-vision.ts]
    Runner -->|OCR Raw Tokens| Parser[lib/receipt-parser.ts]
    Parser -->|Structured JSON / Text / Metrics| Output[Result Display & 1-Click Copy]
```

---

## 🚀 Getting Started

### Local Development
```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the demo.

### Static Build (for GitHub Pages / Static Hosting)
```bash
npm run build
```
The static website is exported to the `out/` directory, ready to deploy to GitHub Pages, Cloudflare Pages, Netlify, or Vercel.

---

## 📦 GitHub Pages Deployment

The automated workflow is configured at [`.github/workflows/pages.yml`](.github/workflows/pages.yml):
1. Push to `main` or `master`.
2. In your GitHub repository settings, go to **Settings > Pages > Build and deployment > Source** and select **GitHub Actions**.
3. Your static WebGPU receipt scanner will be live at `https://<username>.github.io/<repo>/`!
