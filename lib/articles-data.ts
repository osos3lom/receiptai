export interface Article {
  slug: string
  title: {
    ar: string
    en: string
  }
  description: {
    ar: string
    en: string
  }
  image: string
  date: string
  readTime: {
    ar: string
    en: string
  }
  category: {
    ar: string
    en: string
  }
  keywords: string[]
  content: {
    ar: string
    en: string
  }
}

export const ARTICLES: Article[] = [
  {
    slug: "zatca-phase-2-qr-code-verification-guide",
    title: {
      ar: "المعمارية التشفيرية لرموز الاستجابة السريعة في المرحلة الثانية من منظومة زاتكا: تحليل بنية TLV والمطابقة الآلية",
      en: "Cryptographic Architecture of ZATCA Phase 2 QR Codes: TLV Byte-Level Parsing and Invariant Verification",
    },
    description: {
      ar: "تحليل تشريحي متعمق لبنية الوسوم التسعة (TLV)، وسلاسل التوقيع الرقمي ECDSA، وتجزئة XML Canonicalization، مع آليات التحقق الحسابي والتشفيري على الحافة.",
      en: "A rigorous systems analysis of the 9 TLV tags, ECDSA digital signatures, XML canonicalization hashing, and edge-native deterministic verification routines.",
    },
    image: "/brand-zatca-verification.jpg",
    date: "2026-10-23",
    readTime: {
      ar: "٧ دقائق قراءة متخصصة",
      en: "7 min technical read",
    },
    category: {
      ar: "الامتثال التشفيري والأنظمة",
      en: "Cryptographic Compliance",
    },
    keywords: [
      "ZATCA phase 2 QR code verification",
      "TLV byte parsing",
      "ECDSA digital signature verification",
      "Base64 TLV invoice parser",
      "UBL 2.1 XML canonicalization",
      "فحص باركود الفاتورة الضريبية زاتكا",
      "المرحلة الثانية الفوترة الإلكترونية",
      "التوقيع الرقمي للفاتورة الإلكترونية",
    ],
    content: {
      ar: `
### الإطار التنظيمي والمعماري لمنظومة الربط والتكامل (Phase 2)

تُمثل المرحلة الثانية من منظومة الفوترة الإلكترونية التابعة لهيئة الزكاة والضريبة والجمارك (ZATCA) تحولاً جذرياً من مجرد أرشفة البيانات النصية إلى فرض بيئة تشفيرية غير قابلة للتلاعب (Cryptographic Tamper-Proofing). في هذا النموذج التشغيلي، لا يُعد رمز الاستجابة السريعة (QR Code) المطبوع على الفواتير الضريبية المبسطة واجهة استعلامية عبر بروتوكول HTTP، بل هو كبسولة بيانات ثنائية متسلسلة (Serialized Binary Payload) بصيغة Base64 تعتمد معيار **TLV (Tag-Length-Value)** وتحتوي على أختام إلكترونية ومفاتيح عمومية وشفرات تجزئة رياضية.

الهدف الأساسي لهذه المعمارية هو ضمان عدم قابلية الإنكار (Non-Repudiation) والتحقق من سلامة البيانات (Integrity) عبر خط أنابيب تنفيذي مستقل لا يتطلب بالضرورة اتصالاً سحابياً متزامناً للتحقق الأولي من صحة المعاملة.

---

### التشريح البايتي لهيكل الـ TLV ذي الوسوم التسعة

تتكون كتلة البيانات المفكوكة تشفيرياً من متوالية بايتية صارمة التنسيق؛ حيث يُخصص البايت الأول من كل مقطع لمعرّف الوسم (\`Tag\`)، يليه بايت واحد يحدد طول المحتوى بالبايت (\`Length\`) وفق ترميز UTF-8، ثم يليه مقطع القيمة الفعلي (\`Value\`) الممتد بطول $N$ من البايتات.

| الوسم (Tag) | معرّف الحقل (Field Identifier) | المعمارية التشفيرية والترميز | نطاق المرحلة |
| :---: | :--- | :--- | :---: |
| **0x01** | اسم المنشأة / المورد (\`Seller Name\`) | UTF-8 String متوافق مع قيود السجل التجاري | Phase 1 & 2 |
| **0x02** | الرقم الضريبي للمنشأة (\`VAT Number\`) | 15 عدداً تبدأ برقم \`3\` وتنتهي برقم \`3\` | Phase 1 & 2 |
| **0x03** | الطابع الزمني للعملية (\`Timestamp\`) | ISO-8601 (\`YYYY-MM-DDTHH:MM:SSZ\`) | Phase 1 & 2 |
| **0x04** | الإجمالي الكلي الشامل (\`Invoice Total\`) | تعبير عشري بدقة منزلتين (\`Scale 2\`) | Phase 1 & 2 |
| **0x05** | إجمالي الضريبة (\`VAT Total\`) | تعبير عشري يمثل استحقاق الـ 15% | Phase 1 & 2 |
| **0x06** | رمز تجزئة الفاتورة (\`XML Hash\`) | تشفير Base64 لتجزئة SHA-256 للمستند | **Phase 2 الحصرية** |
| **0x07** | التوقيع الرقمي (\`ECDSA Signature\`) | بصمة ASN.1 DER مشتقة من المنحنى البيضاوي | **Phase 2 الحصرية** |
| **0x08** | المفتاح العام للمنشأة (\`Public Key\`) | مفتاح مطابق لشهادة الـ CSID المعتمدة | **Phase 2 الحصرية** |
| **0x09** | الختم التشفيري للشهادة (\`CA Signature\`) | ختم الهيئة لشهادة المفتاح العام في المبسطة | **Phase 2 الحصرية** |

---

### خط أنابيب التحقق الآلي والاتساق الرياضي (Validation Pipeline)

يعتمد محرك **Receipt AI** نموذج فحص متعدد المراحل ينفذ محلياً داخل عتاد العميل دون تمرير أي بايت إلى خوادم وسيطة:

\`\`\`mermaid
flowchart TD
    A["استخراج السلسلة الخام (Raw Base64)"] --> B["تفكيك التشفير إلى تدفق بايتي (Byte Stream)"]
    B --> C["محلل الوسوم التسلسلية (TLV Parser)"]
    C --> D["المطابقة الحسابية للمعادلة الضريبية"]
    C --> E["التحقق من التوقيع الرقمي (ECDSA Verification)"]
    D --> F["مقاطعة الحقول المستخرجة بصرياً (OCR vs Tag Matching)"]
    E --> F
    F --> G["تقرير الاتساق والاعتماد الضريبي (Audit Report)"]
\`\`\`

1. **إعادة بناء المتوالية البايتية (Stream Unpacking):** يتم عزل الوسوم الأولية (1–5) وقراءة نصوصها بترميز UTF-8 مع احتساب الإزاحة البايتية (\`Byte Offset Pointer\`) بشكل قطعي يمنع فيضان المخزن المؤقت (Buffer Overflow).
2. **التحقق من التوقيع التشفيري (Cryptographic Signature Check):**
   تخضع التجزئة في الوسم 6 للتأكد من مطابقتها للتوقيع الرقمي المشفر بالوسم 7 باستخدام المفتاح العام للمنشأة (الوسم 8) عبر خوارزمية **ECDSA** المبنية على المنحنى البيضاوي (\`secp256k1\` أو \`prime256v1\`).
3. **التدقيق في محددات الاتساق المالي (Accounting Invariants):**
   يفرض المحرك معادلة توازن صارمة لا تقبل التسامح المحاسبي متى ما تجاوز الفارق الحد الأدنى للتقريب العشري:
   $$\\left| \\left( \\text{Subtotal} + \\text{VAT} \\right) - \\text{Total} \\right| \\le 0.05$$
4. **المطابقة التقاطعية مع نصوص الفاتورة (OCR Cross-Reconciliation):**
   تتم مطابقة البيانات الرقمية المفكوكة من الختم مع المبالغ والأرقام المستخرجة عبر نموذج الرؤية الحاسوبية من نص الفاتورة الورقية؛ مما يكشف فوراً أي محاولة تعديل يدوي أو إخفاء متعمد للبيانات الضريبية.
`,
      en: `
### Regulatory & Architectural Topology of ZATCA Phase 2

Phase 2 (The Integration Phase) of the Zakat, Tax and Customs Authority (ZATCA) mandate transitions e-invoicing from human-readable visual compliance to an automated, cryptographically sealed verification infrastructure. Within this operating model, the QR code on a simplified tax invoice ceases to be an informative hypermedia link; it functions as a serialized, self-contained binary payload encoded in **Base64** governed by the **TLV (Tag-Length-Value)** byte-stream specification.

This architecture establishes an edge-executable zero-trust framework: point-of-sale receipts and expenditure artifacts can be audited, validated for non-repudiation, and checked for cryptographic integrity entirely on edge devices without introducing synchronous network round-trips to centralized tax servers.

---

### Byte-Level Specification of the 9 TLV Tags

The decoded byte stream adheres to a deterministic, sequential TLV memory schema. The parsing engine reads a 1-byte field identifier (\`Tag\`), followed immediately by a 1-byte length boundary (\`Length\`), and subsequently extracts $N$ octets comprising the raw UTF-8 characters or cryptographic signature bytes (\`Value\`).

| Tag (Hex) | Field Identifier | Cryptographic Encoding & Invariant Rules | Scope |
| :---: | :--- | :--- | :---: |
| **0x01** | Seller Legal Entity Name | UTF-8 String conforming to registered commercial entity records | Phase 1 & 2 |
| **0x02** | 15-Digit Taxpayer ID | Numeric string strictly beginning and terminating with digit \`3\` | Phase 1 & 2 |
| **0x03** | Issuance Timestamp | Strict ISO-8601 representation (\`YYYY-MM-DDTHH:MM:SSZ\`) | Phase 1 & 2 |
| **0x04** | Total Invoice Amount | Decimal string enforced to 2 fractional digits (\`Scale 2\`) | Phase 1 & 2 |
| **0x05** | Total Tax Obligation | Explicit 15% VAT component calculated across taxable lines | Phase 1 & 2 |
| **0x06** | Canonical Invoice Digest | Base64-encoded SHA-256 digest of the canonicalized UBL 2.1 XML | **Phase 2 Exclusive** |
| **0x07** | ECDSA Digital Signature | Raw ASN.1 DER signature generated via device private key (CSID) | **Phase 2 Exclusive** |
| **0x08** | ECDSA Public Key | SubjectPublicKeyInfo bytes matching the provisioned EGS CSID | **Phase 2 Exclusive** |
| **0x09** | Technical CA Stamp | ZATCA Cryptographic Authority signature (Simplified Invoices) | **Phase 2 Exclusive** |

---

### In-Browser Verification Pipeline & Invariant Synthesis

**Receipt AI** constructs an execution pipeline directly on client hardware, eliminating intermediary cloud exposure:

\`\`\`mermaid
flowchart TD
    A["Raw Base64 Ingestion"] --> B["Binary Buffer Allocation & Stream Decode"]
    B --> C["Deterministic TLV Octet Walker"]
    C --> D["Tax Invariant Arithmetic Verification"]
    C --> E["ECDSA Signature Recovery & Curve Check"]
    D --> F["OCR-to-Tag Spatial Cross-Reconciliation"]
    E --> F
    F --> G["Audit Certification Output"]
\`\`\`

1. **Octet Walker Stream Unpacking:** The parser allocates an in-memory byte buffer, sequentially stepping the offset pointer ($Index \leftarrow Index + 2 + Length$). This deterministic iteration guarantees immunity against memory corruption or maliciously crafted payload buffer overruns.
2. **Cryptographic Signature Verification:**
   Tag 6 (SHA-256 Digest) is cryptographically validated against the ECDSA signature extracted from Tag 7 using the public key provisioned in Tag 8 over the \`secp256k1\` or \`prime256v1\` elliptic curve.
3. **Financial Invariant Arithmetic Enforcement:**
   The engine enforces mathematical reconciliation boundaries without tolerance beyond negligible rounding deltas:
   $$\\left| \\left( \\text{Subtotal} + \\text{VAT} \\right) - \\text{Total} \\right| \\le 0.05$$
4. **Spatial Cross-Reconciliation:**
   Extracted numerical tokens from the OCR neural inference stage are cross-checked against the immutable cryptographically sealed TLV tags, exposing discrepancies between physical printed characters and internal tax stamps.
`,
    },
  },
  {
    slug: "webgpu-browser-ai-invoice-data-privacy",
    title: {
      ar: "المعالجة العصبية الطرفية عبر WebGPU: المعمارية الأمنية لإنهاء مخاطر تسريب البيانات المالية السحابية",
      en: "Edge Neural Compute via WebGPU: Zero-Server Architecture for Enterprise Financial Data Privacy",
    },
    description: {
      ar: "تحليل معماري مقارن بين حلول التعرف البصري السحابية ومعالجة المصفوفات عبر WebGPU، موضحاً آليات عزل الذاكرة وخفض زمن الاستجابة إلى الصفر.",
      en: "A rigorous comparative systems analysis contrasting centralized cloud OCR pipelines with client-side WebGPU tensor execution, zero-copy buffer staging, and memory isolation perimeters.",
    },
    image: "/brand-scanner-webgpu.jpg",
    date: "2026-10-23",
    readTime: {
      ar: "٦ دقائق قراءة متخصصة",
      en: "6 min technical read",
    },
    category: {
      ar: "المعالجة الطرفية والأمن السيبراني",
      en: "Edge Compute & Security",
    },
    keywords: [
      "WebGPU neural compute",
      "In-browser OCR WebGPU",
      "Client-side private invoice scanning",
      "Zero-server OCR architecture",
      "Financial data isolation perimeter",
      "معالجة الفواتير الطرفية WebGPU",
      "أمان المستندات المحاسبية",
      "الذكاء الاصطناعي في المتصفح",
    ],
    content: {
      ar: `
### المعضلة البنيوية لأنظمة التعرف البصري السحابية (Centralized Cloud OCR)

تعتمد البنية التحتية لمعظم برمجيات فحص الفواتير والتحليل المحاسبي على نموذج خادم مركزي (Client-Server Request Lifecycle). في هذا التصميم، يُرسل العميل صورة المستند المحاسبي—متضمنةً كشوف الرواتب، أسماء الموردين، تفاصيل التكلفة، وأرقام الحسابات البنكية (IBAN)—عبر طلبات بروتوكول HTTP POST إلى واجهات برمجة تطبيقات (Cloud APIs) تابعة لأطراف ثالثة.

يولد هذا النموذج ثغرات معمارية ومخاطر حتمية على مستوى المؤسسات:
* **توسع محيط التهديد السيبراني (Expanded Attack Surface):** تخزين الصور المؤقت في ذاكرة الخوادم الخارجية يعرض الأسرار التجارية للاختراق عبر هجمات حقن الذاكرة أو تسريب وسائط التخزين.
* **انتهاك السيادة الرقمية (Data Sovereignty Breach):** خروج السجلات المالية للمنشأة من النطاق الجغرافي الوطني، مما يتعارض مع ضوابط الأمن السيبراني الصارمة الصادرة عن الهيئات الوطنية لتنظيم البيانات.
* **تكلفة المعالجة التراكمية (Marginal Inference Cost):** فرض رسوم استخدام متكررة ($0.05 - $0.20 لكل صفحة)، مما يرفع تكلفة أتمتة ملايين الفواتير إلى أرقام تعيق الجدوى الاقتصادية.

---

### نموذج الحساب المتوازي عبر WebGPU في بيئة المتصفح

تُعيد واجهة **WebGPU** تعريف حدود المعالجة الطرفية (Edge Compute)؛ حيث تتيح لصفحات الويب التواصل المنخفض المستوى وبزمن انتقال شبه منعدم مع أنوية المعالجة الرسومية للمستخدم (مثل Metal على macOS/iOS، وVulkan على Linux/Android، وDirect3D 12 على Windows).

| المتغير المعماري (Architectural Variable) | مسار الخوادم السحابية (Cloud Vision APIs) | مسار الحوسبة الطرفية عبر WebGPU (Receipt AI) |
| :--- | :--- | :--- |
| **محيط عزل الذاكرة (Memory Perimeter)** | خوادم وسيطة ومستودعات تخزين سحابية | **ذاكرة العميل الفيزيائية الحصرية (Local RAM/VRAM)** |
| **احتمالية تسريب البيانات عبر الشبكة** | حتمية (مستندات كاملة تُنقل عبر الشبكة العامة) | **صفر بالمطلق (Zero Network Transmission)** |
| **زمن استجابة الاستدلال (Inference Latency)** | 1800ms – 4500ms (تشمل وقت النقل والاصطفاف) | **أقل من 800ms عبر تسريع الأنوية المتوازية** |
| **الاعتمادية في بيئات انقطاع الشبكة** | انقطاع كامل للخدمة عند غياب الإنترنت | **استمرارية تشغيل حتمية 100% دون اتصال** |
| **تكلفة استهلاك الحوسبة لكل مستند** | تصاعدية طردية مع كل استدعاء للـ API | **صفر تكلفة بنية تحتية (Marginal Cost = 0)** |

---

### خط أنابيب الاستدلال العصبي داخل محرك Receipt AI

\`\`\`mermaid
flowchart LR
    A["تخزين الأوزان العصبية (CacheStorage)"] --> B["تخصيص الذاكرة الرسومية (GPUBuffer)"]
    B --> C["مترجم الشيدرات (WGSL Compute Shaders)"]
    C --> D["استخلاص التنسورات المتوازية (Tensor Inference)"]
    D --> E["تفكيك المحارف والكيانات المالية (Entity Extraction)"]
\`\`\`

1. **إدارة الأوزان العصبية والتخزين الثابت (Persistent Tensor Cache):**
   يتم تخزين مصفوفات النموذج العصبي المحسّن محلياً في واجهة \`CacheStorage\` الخاصة بمتصفح المستخدم، مما يمنع إعادة تنزيل الأوزان بعد الإقلاع الأول.
2. **المعالجة المتوازية الخالية من النسخ (Zero-Copy Buffer Staging):**
   تُحوّل بيانات الصورة المستهدفة إلى مخازن تخزين مسطحة (\`Storage Buffers\`)، وتُنفّذ عمليات التفاف المصفوفات الحسابية بواسطة شيدرات حوسبة مكتوبة بلغة **WGSL** وموزعة على آلاف خيوط المعالجة المتزامنة.
3. **توليد الكيانات المالية المنظمة (Structured Entity Serialization):**
   تتحول المخرجات التنبؤية فورياً إلى كائنات برمجية مهيكلة تلتزم بنموذج البيانات الداخلي دون تسجيل أي أثر للبيانات بعد انتهاء الجلسة.
`,
      en: `
### Structural Vulnerabilities of Centralized Cloud OCR Topologies

The predominant architecture for document vision parsing relies on a centralized multi-tenant client-server lifecycle. Under this paradigm, client workloads dispatch sensitive fiscal artifacts—including payroll journals, proprietary vendor pricing, bank identifiers (IBANs), and volume discounts—over public HTTP POST endpoints to third-party cloud infrastructure.

This topology introduces critical enterprise-grade fault domains:
* **Perimeter Attack Surface Amplification:** Transient document caching in multi-tenant cloud storage clusters exposes proprietary ledger records to unauthorized exfiltration, side-channel attacks, or memory introspection.
* **Data Sovereignty Violations:** Enterprise ledger assets frequently exit territorial and regulatory perimeters, conflicting directly with local data residency mandates and corporate compliance standards.
* **Prohibitive Marginal Inference Costs:** Metered API economics ($0.05 to $0.25 per page scanned) linearly escalate operational expenditure when ingesting tens of thousands of corporate receipts per month.

---

### Low-Level Tensor Execution via WebGPU Primitives

**WebGPU** fundamentally restructures the execution boundary by exposing explicit, zero-overhead access to native hardware acceleration primitives (Metal on macOS/iOS, Vulkan on Linux/Android, Direct3D 12 on Windows) within a sandboxed runtime environment.

| System Attribute | Centralized Cloud Vision Pipelines | In-Browser WebGPU Pipeline (Receipt AI) |
| :--- | :--- | :--- |
| **Data Isolation Perimeter** | Multi-tenant remote clusters & cold caches | **Hardware-confined local host RAM / VRAM only** |
| **Payload Egress Probability** | Inevitable (raw image buffers traverse the WAN) | **Absolute Zero (Zero packet transmission)** |
| **Total Inference Latency** | 1,800ms – 4,500ms (RTT + queuing latency) | **< 800ms via parallel compute workgroups** |
| **Offline Resilience** | Complete systemic failure upon network disruption | **100% deterministic offline continuity** |
| **Marginal Compute Cost** | Monotonically scales with document throughput | **Zero recurring infrastructure expense ($0.00)** |

---

### WebGPU Neural Execution Engine in Receipt AI

\`\`\`mermaid
flowchart LR
    A["Neural Weights (CacheStorage)"] --> B["Staging Buffers (GPUBuffer)"]
    B --> C["WGSL Compute Shader Dispatch"]
    C --> D["Parallel Workgroup Tensor Ops"]
    D --> E["Deterministic Entity Serialization"]
\`\`\`

1. **Persistent Weight Ingestion:**
   Quantized neural weight matrices are streamed once and persisted within the origin-isolated \`CacheStorage\` boundary, guaranteeing instant subsequent cold-starts.
2. **Zero-Copy Memory Staging & WGSL Dispatches:**
   Raw bitmap buffers map directly to uniform and storage buffer bindings without superfluous CPU-GPU round-tripping. Mathematical convolution passes execute via hardware-tuned **WGSL (WebGPU Shading Language)** compute kernels saturated across local GPU execution units.
3. **Deterministic Entity Output:**
   Token classification and bounding box regression yield structured financial models with zero external persistence, ensuring complete enterprise data confidentiality by design.
`,
    },
  },
  {
    slug: "erp-receipt-automation-odoo-sap",
    title: {
      ar: "أتمتة قيود اليومية المحاسبية: خط أنابيب التكامل بين استخراج الفواتير الطرفي وأنظمة ERP المؤسسية",
      en: "Automated Journal Entry Ingestion: Bridging Edge Document AI with Enterprise ERP Systems",
    },
    description: {
      ar: "دليل معماري وتنفيذي لإنشاء مسار تدفق متزن للبيانات المالية من المستند الخام إلى قيود اليومية المزدوجة في أنظمة Odoo وSAP دون تدخل بشري.",
      en: "An architectural blueprint for constructing zero-touch ingestion pipelines mapping raw receipt artifacts directly into balanced double-entry general ledger schemas across Odoo and SAP.",
    },
    image: "/brand-erp-integration.jpg",
    date: "2026-10-23",
    readTime: {
      ar: "٦ دقائق قراءة متخصصة",
      en: "6 min technical read",
    },
    category: {
      ar: "أتمتة الأنظمة وتكامل الـ ERP",
      en: "ERP Integration & Workflows",
    },
    keywords: [
      "ERP receipt automation Odoo SAP",
      "Automated journal entry ingestion",
      "Double-entry ledger reconciliation",
      "Chart of accounts mapping matrix",
      "Receipt AI ERP webhook integration",
      "أتمتة قيود اليومية المحاسبية",
      "ربط الفواتير مع أودو وساب",
      "التدقيق الضريبي التلقائي",
    ],
    content: {
      ar: `
### كسر اختناقات الإدخال اليدوي في دفاتر الأستاذ العام (General Ledger)

تُمثل عمليات الإدخال اليدوي لفواتير المصروفات والنثريات التشغيلية أحد أكبر الاختناقات الهيكلية في إدارة الحسابات الدائنة (Accounts Payable). تشير مؤشرات الأداء المؤسسية إلى أن فرق المحاسبة تستهلك ما يزيد عن **٣٥٪ من وقتها التشغيلي** في قراءة الأرقام ونقلها إلى قيود يومية، مما يرفع معدلات الخطأ البشري في موازين المراجعة ويعيق سرعة إقفال الفترات المالية الشهرية.

يكمن التحدي المعماري ليس في مجرد استخراج النصوص (OCR Extraction)، بل في تحويل البيانات غير المهيكلة إلى تدفق متسق يخضع لقوانين القيد المزدوج ويحقق شروط التوازن المحاسبي الصارمة قبل ترحيله إلى قاعدة بيانات النظام المالي.

---

### معمارية التكامل: من بكسلات الفاتورة إلى قيد اليومية المتوازن

\`\`\`mermaid
flowchart TD
    A["المستند المحاسبي (Raw Receipt)"] --> B["محرك الفحص العصبي (WebGPU Engine)"]
    B --> C["مصفوفة مطابقة شجرة الحسابات (COA Matrix)"]
    C --> D["محرك التحقق من اتساق القيد (Ledger Balancer)"]
    D --> E["محول الحمولات البرمجية (JSON/CSV Payload Formatter)"]
    E --> F["نظام المحاسبة المؤسسي (Odoo / SAP / Zoho)"]
\`\`\`

1. **الاستخلاص المحدد للكيانات (Deterministic Entity Extraction):**
   استخراج الحقول المحاسبية الحيوية بدقة قطعية: معرّف المورد، الرقم الضريبي (15 خانة)، التاريخ المحاسبي، رمز العملة، تفاصيل البنود، المجموع الفرعي، وقيمة الضريبة.
2. **محرك التطابق مع شجرة الحسابات (Chart of Accounts Mapping Matrix):**
   تخضع البنود المستخرجة لمصفوفة تصنيف تقيس دلالة الصنف وتعيّن حساب المصروف المقابل تلقائياً وفق دليل الحسابات المعتمد في المنشأة (مثل: \`501002 - مصروفات صيانة تقنية\`).
3. **إنفاذ توازن القيد المزدوج (Double-Entry Invariant Enforcement):**
   يتحقق النظام برمجياً من الشرط المحاسبي الحتمي الذي يمنع ترحيل أي قيد غير متزن:
   $$\\sum \\text{Debits} - \\sum \\text{Credits} \\equiv 0$$

---

### النموذج البرمجي لقيد اليومية المؤتمت (Automated Journal Schema)

عند معالجة فاتورة مشتريات إلكترونية صادرة بقيمة إجمالية **264.50 ريال**، يُولد خط التكامل حمولة برمجية متوازنة يتم دفعها عبر واجهة برمجة التطبيقات (API Webhook):

\`\`\`json
{
  "ref": "SA-908124",
  "date": "2026-10-23",
  "journal_id": "PURCHASE_GENERAL",
  "currency": "SAR",
  "line_ids": [
    {
      "account_code": "502010",
      "name": "معدات وأجهزة إلكترونية أساسية",
      "debit": 230.00,
      "credit": 0.00,
      "tax_tag": "VAT_INPUT_15"
    },
    {
      "account_code": "201030",
      "name": "ضريبة القيمة المضافة على المدخلات المستردة",
      "debit": 34.50,
      "credit": 0.00,
      "tax_tag": "TAX_RECOVERABLE"
    },
    {
      "account_code": "101010",
      "name": "النقدية بالصندوق / حساب المورد المعتمد",
      "debit": 0.00,
      "credit": 264.50,
      "tax_tag": null
    }
  ],
  "status": "draft"
}
\`\`\`

> [!IMPORTANT]
> صُمم محرك **Receipt AI** ليعمل كنواة إدخال عالية الكفاءة ومنعدمة التكلفة، حيث يمكن ربطه مباشرة بقواعد بيانات أنظمة ERP عبر مشغلات Webhooks مخصصة لتمكين الأتمتة الشاملة للعمليات المحاسبية.
`,
      en: `
### Resolving Ingestion Bottlenecks in the General Ledger

Manual transcription of operational receipts and petty cash slips constitutes one of the most severe structural bottlenecks across Accounts Payable (AP) operations. Enterprise benchmark telemetry indicates accounting personnel spend over **35% of cumulative operational bandwidth** manually parsing, verifying, and typing transaction parameters into enterprise general ledgers. This dynamic drives human transcription error rates in trial balances and delays fiscal reporting closures.

The engineering challenge extends far beyond raw optical character recognition (OCR); it demands transforming unstructured visual noise into an immutable, deterministically balanced schema satisfying double-entry ledger invariants prior to general ledger database persistence.

---

### Integration Architecture: Pixel Buffer to Balanced Journal Entry

\`\`\`mermaid
flowchart TD
    A["Raw Financial Artifact"] --> B["Edge Neural Engine (WebGPU)"]
    B --> C["Chart of Accounts Classifier Matrix"]
    C --> D["Double-Entry Invariant Balancer"]
    D --> E["Normalized Payload Formatter (JSON/CSV)"]
    E --> F["Enterprise ERP (Odoo ORM / SAP BAdI)"]
\`\`\`

1. **Deterministic Entity Extraction:**
   Isolates key financial primitives: verified Vendor Tax ID (15 digits), fiscal timestamp, ISO currency code, itemized charge matrices, net subtotal, and tax breakdowns.
2. **Chart of Accounts (COA) Classification Matrix:**
   Item descriptions pass through a classification matrix mapping semantic item tokens directly to pre-configured enterprise ledger codes (e.g., \`502010 - IT Hardware & Accessories\`).
3. **Double-Entry Invariant Enforcement:**
   The pipeline programmatically validates the fundamental mathematical invariant of double-entry accounting:
   $$\\sum \\text{Debits} - \\sum \\text{Credits} \\equiv 0$$
   Any payload exhibiting a non-zero residual ($\Delta \\ne 0$) is immediately flagged and sequestered into an exception staging queue before write-ahead database locking.

---

### Normalized Ingestion Schema

For an invoice artifact totaling **264.50 SAR**, the pipeline constructs an idempotent JSON payload dispatchable via transactional webhooks directly into the ERP accounting queue:

\`\`\`json
{
  "ref": "SA-908124",
  "date": "2026-10-23",
  "journal_id": "PURCHASE_GENERAL",
  "currency": "SAR",
  "line_ids": [
    {
      "account_code": "502010",
      "name": "Hardware Equipment & Accessories",
      "debit": 230.00,
      "credit": 0.00,
      "tax_tag": "VAT_INPUT_15"
    },
    {
      "account_code": "201030",
      "name": "Input VAT Recoverable (15%)",
      "debit": 34.50,
      "credit": 0.00,
      "tax_tag": "TAX_RECOVERABLE"
    },
    {
      "account_code": "101010",
      "name": "Cash Equivalents / Accounts Payable",
      "debit": 0.00,
      "credit": 264.50,
      "tax_tag": null
    }
  ],
  "status": "draft"
}
\`\`\`

> [!IMPORTANT]
> **Receipt AI** functions as a zero-latency, zero-leakage financial ingestion engine, capable of direct coupling with enterprise ERP systems (Odoo, SAP, Zoho Books) to eliminate manual bookkeeping while maintaining absolute data confidentiality.
`,
    },
  },
]

export function getAllArticles(): Article[] {
  return ARTICLES
}

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}

export function getAllArticleSlugs(): string[] {
  return ARTICLES.map((a) => a.slug)
}
