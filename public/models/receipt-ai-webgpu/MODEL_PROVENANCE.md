# Model Provenance: Fine-Tuned Receipt-AI SmolVLM (WebGPU q4f16)

**These weights are the fine-tuned `smolvlm-receipt-v3-combined` model, merged and quantized to 4-bit (`q4f16`) for zero-server WebGPU browser execution.**

| Metric / Attribute | Value |
|---|---|
| **Base Model** | `HuggingFaceTB/SmolVLM-256M-Instruct` |
| **Fine-Tuning Checkpoint** | `checkpoints/smolvlm-receipt-v3-combined` |
| **Merged Checkpoint** | `checkpoints/smolvlm-receipt-merged` |
| **Training Data** | 2,275 training / 275 val samples (797 Gemini-distilled real scans + 2,000 synthetic ZATCA receipts) |
| **Quantization Format** | 4-bit block-wise symmetric quantization (`q4f16`, block size 32) |
| **Total Download Size** | **183.51 MB** (strictly $\le 199$ MB budget) |
| **Accuracy (In-Domain)** | **99.3%** field accuracy |
| **Accuracy (Real Scans)** | **52.7%** field accuracy (vs 5.4% base zero-shot) |
| **Runtime Engine** | Transformers.js / ONNX Runtime Web (`webgpu` / `wasm` fallback) |
| **Privacy Guarantee** | **100% Client-Side**. Images and extracted receipt fields never leave the user's browser. |

## Quantization & Injection Pipeline

The model was converted by injecting the fine-tuned FP16 merged weights directly into the Idefics3 ONNX computation graph using ONNX Runtime's native `quantize_matmul_4bits` kernel:
1. **Decoder Model (`decoder_model_merged_q4f16.onnx`, 73.47 MB)**:
   - All 210 transformer self-attention and MLP projection layers (`q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`) across 30 layers.
   - The LM head projection (`lm_head.weight`).
2. **Vision Model (`vision_encoder_q4f16.onnx`, 52.49 MB)**:
   - The cross-modal connector projection (`model.connector.modality_projection.proj.weight`).
   - SigLIP vision tower preserved intact.
3. **Embed Tokens (`embed_tokens_q4f16.onnx`, 54.14 MB)**:
   - Token embedding weights preserved intact.
4. **Tokenizer & Processor Configs**:
   - `tokenizer.json`, `tokenizer_config.json`, and `processor_config.json` synchronized from `smolvlm-receipt-v3-combined`.
