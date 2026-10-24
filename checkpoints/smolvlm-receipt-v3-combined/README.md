---
base_model: HuggingFaceTB/SmolVLM-256M-Instruct
library_name: peft
pipeline_tag: image-text-to-text
language:
  - ar
  - en
tags:
  - lora
  - receipt-understanding
  - key-information-extraction
  - zatca
---

# SmolVLM-256M Receipt Extractor (LoRA) — v3 combined

Extracts structured fields from Arabic and English receipts as JSON: store, tax number,
date, subtotal, VAT percent, VAT amount, total, currency and line items.

## Model details

- **Base model:** `HuggingFaceTB/SmolVLM-256M-Instruct` (Idefics3 architecture)
- **Method:** LoRA, r=16, alpha=32, dropout=0.05
- **Adapted modules:** 211 explicit fully-qualified Linear layers — text attention (120),
  text MLP (90) and the modality connector (1). The vision tower is **not** adapted.
  Targets are listed by full name rather than by suffix, because suffix matching on
  `q/k/v/o_proj` silently adapts the vision encoder as well.
- **Trainable parameters:** 5,090,304 of 261,575,232 (1.95%)
- **Precision:** FP16 with gradient checkpointing, trained on one RTX 2080 Ti (11 GB)

## Intended use

In-browser receipt field extraction for bookkeeping, where documents must not leave the
device. **Not suitable for unattended accounting**: see the measured accuracy below.
Every extraction should be reviewed by a person before it reaches a ledger.

## Training data

| Source | Rows | Label provenance |
|---|---|---|
| `synthetic_v2` | 2,000 | Generator-produced, exact by construction |
| `teacher_distilled` | 687 | Gemini-distilled from real CORU scans, QC-gated |

2,275 train / 275 validation / 137 test, disjoint by image SHA-256. The 50-receipt gold
evaluation set is excluded from all splits by hash.

Teacher labels passed two gates. **Math reconciliation** allows a bounded residual, because
real receipts carry delivery and service lines the schema does not model (verified example:
items 542.05 + delivery 15 + tax 77.99 = total 635.04). **Grounding** drops any numeric
value that does not appear in the transcribed text: 175 subtotals, 145 VAT amounts and 15
totals were back-computed by the teacher rather than read, and were removed. `vat_percent`
is dropped whenever `vat_amount` is, since the rate is not knowable without the amount.

Synthetic data spans 24 merchants, 5 VAT regimes (SAR 15/5/0%, AED 5%, EGP 14%), discounts,
service charges, cash-rounding drift and refunds, rendered across varied widths, fonts and
layouts, then augmented with perspective, rotation, uneven lighting, shadow, defocus, sensor
noise, JPEG recompression and surface compositing.

## Training procedure

Loss is computed **only over the assistant's JSON answer**; the prompt and image placeholder
tokens are masked to -100. This is load-bearing: for a typical receipt the prefix is ~1,733
tokens of which ~1,088 are image placeholders, so an unmasked objective puts the large
majority of loss mass on tokens the model must never predict.

| Hyperparameter | Value |
|---|---|
| Epochs | 3 (early stopping, patience 1) |
| Effective batch size | 8 (per-device 1 × grad accum 8) |
| Learning rate | 2e-4, cosine with 3% warmup |
| Gradient clipping | 1.0 |
| Optimizer | AdamW, weight decay 0.01 |
| Seed | 42 |
| Supervised token fraction | 32.3% |

| Epoch | Train loss | Val loss |
|---|---|---|
| 1 | 0.4598 | 0.2328 |
| 2 | 0.1919 | 0.1944 |
| 3 | 0.1672 | **0.1909** |

Runtime 158.9 minutes. Full configuration in `training_run.json`.

## Evaluation

Two held-out sets. Fields with fewer than 5 gold examples are excluded from the gate score.

**In-domain — 50 synthetic gold receipts**

| Field | base | **v3** |
|---|---|---|
| Store | 0% | **100%** |
| Date | 18% | **100%** |
| Total | 4% | **100%** |
| Subtotal | 2% | **100%** |
| VAT amount | 2% | **100%** |
| Line-item F1 | 0.0 | **97.7** |
| **Gate score** | 4.7 | **99.3** |

**Out-of-domain — 37 real held-out CORU scans**

| Field | base | synthetic-only | **v3** |
|---|---|---|---|
| Store | 8.1% | 0% | **29.7%** |
| Date | 0% | 10.8% | **46.0%** |
| Total | 11.1% | 41.7% | **63.9%** |
| Subtotal | 0% | 32.0% | **56.0%** |
| VAT amount | 8.0% | 28.0% | **68.0%** |
| All money fields | 0% | 8.1% | **32.4%** |
| Line-item F1 | 0.0 | 0.0 | **5.3** |
| **Gate score** | 5.4 | 22.5 | **52.7** |

Reproduce with:

```
python data-pipeline/run_eval.py --arm adapter --checkpoint checkpoints/smolvlm-receipt-v3-combined
python data-pipeline/eval_harness.py --gold data-pipeline/output/gold_eval/manifest.jsonl \
    --pred data-pipeline/output/eval_runs/pred_adapter.jsonl
python data-pipeline/compare_arms.py --candidate v3_real
```

## Limitations and risks

- **The in-domain score is mostly lookup, not reading.** Every one of the 12 gold merchants and
  21 gold line-item descriptions also appears verbatim in the training data, so store and
  line-item scores measure recall of a fixed catalogue. Random 15-digit tax numbers (96%) are
  the one in-domain field that cannot be memorized.
- **Roughly half of fields on a real receipt are correct, with wide error bars.** Gate score
  52.7, bootstrap 95% CI [42.9, 62.5] on n=37, measured as agreement with Gemini rather than
  against verified truth. This is a review aid, not an automation.
- **It invents subtotal and VAT.** On the 12 real receipts where the reference has no printed
  subtotal or VAT, the model stated one on 11 (91.7%). It learned from synthetic data, where
  every receipt prints a VAT breakdown, that every receipt does. "Reference has none" comes
  from Gemini grounding, so human labels are needed to confirm the rate. The browser parser
  therefore cannot treat a stated subtotal or VAT as evidence that it was printed.
- **Line-item extraction does not work on real receipts** (F1 5.3 against 97.7 in-domain).
  The gap is the clearest evidence of remaining renderer overfitting.
- **Tax numbers are unmeasured.** Only 1 of 37 real receipts prints one; the field is
  excluded from the gate for lack of support.
- **The real evaluation set is teacher-referenced, not human-verified**, so it carries the
  teacher's error rate. A human-verified set belongs at
  `data-pipeline/output/coru_images/manual_gold.jsonl` before any public accuracy claim.
- **Arabic merchant names are the weakest field** at 29.7%, which matters because store
  identity drives expense categorization downstream.
- Real receipts are drawn from CORU, which is predominantly Egyptian. Saudi ZATCA coverage
  comes mostly from synthetic data, so ZATCA-specific performance is less well evidenced
  than the name of the project suggests.

## Next step if higher accuracy is needed

CORU ships 5,838 real bounding boxes that this pipeline does not use. A two-stage design —
detect field regions from those boxes, then read each crop at native resolution — addresses
both the line-item failure and the token-budget ceiling of a 256M model on dense bilingual
text.

### Framework versions

- Training and evaluation: Transformers 4.57.6, PEFT 0.21.2, PyTorch 2.6.0+cu124. Pinned in
  `data-pipeline/requirements.lock.txt`. Installing the ONNX export tooling replaced the earlier
  Transformers 5.20.2 at 2026-10-23 23:59, before any v2/v3 run started. Re-running 6 gold
  receipts reproduced the saved completions token-for-token (greedy decoding).
