# Face 11 — significand encodes chroma

**Chromatic Reconstruction — Continuous-to-Clamped HSV→RGBA Exponential Alpha**

## 🟢 What

This face is the **chromatic rendering layer** — it transforms the 16-bit binary16 payload word (NN) into a compliant `#RRGGBBAA` hex color string for JSON Canvas visualization. It bridges two color models simultaneously:

1. **Continuous HSV** — the 10-bit significand maps to a 360° hue angle on the ROYGBIV spectrum; the 5-bit exponent maps to Value (brightness) across 32 discrete steps.
2. **Clamped RGBA** — the same 10 significand bits are split into pairwise RGB sub-fields (3+3+4 bits) and XOR'd with the exponent-derived luminance scale; the 1 sign bit controls the exponential alpha channel.

```
                         [ NN — 16-bit binary16 word ]
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
    [ 1 sign bit ]          [ 5 exponent bits ]      [ 10 significand bits ]
    sign=0 → alpha=FF       luminance=0..31          hue=0..360° (continuous)
    sign=1 → alpha=33       scale×255/31 → 0..255    R=bits[9:7]<<5  (discrete)
                                                     G=bits[6:4]<<5
                                                     B=bits[3:0]<<4
                                                    final = channel ⊕ luminance
                                                             │
                                                             ▼
                                                  #RRGGBBAA  hex string
```

This produces a valid JSON Canvas `color` attribute that simultaneously encodes the sign, exponent, and significand of the original half-precision value — a **bitboard in hex clothing**.

## 🔵 How

### Source file map

| File | Role |
|------|------|
| `src/canvas/omicron-canvas.js` | `OmiContinuousClampedEncoder` — HSV→RGBA with exponential alpha; `OmiFp16CanvasEncoder` — binary16 sign→unicode, exponent→tetrahedral routing, significand→hue |
| `src/canvas/smith-canvas.js` | `ChiralSmithCanvas` — Smith chart rendering with 5040-slot scatter, impedance Z / admittance Y |
| `src/canvas/json-canvas.js` | JSON Canvas 4-channel color mapping (FS=#38bdf8, GS=#a78bfa, RS=#facc15, US=#22c55e) |

### The continuous-to-clamped encoder

```javascript
export class OmiContinuousClampedEncoder {
  encodeContinuousClampedColor(S) {
    const rowData = extractTruthRow(S);
    const word = rowData.NN & 0xFFFF;

    // 1. Sign bit → exponential alpha
    const signBit = (word >> 15) & 0x01;
    const alphaHex = signBit === 0 ? "ff" : "33";
    // 0 (positive) → full opacity #..FF
    // 1 (negative) → attenuated #..33

    // 2. Exponent bits → luminance scale (HSV Value)
    const exponentBits = (word >> 10) & 0x1F;
    const luminanceScale = Math.round((exponentBits / 31) * 255) & 0xFF;

    // 3. Significand bits → continuous hue + discrete RGB
    const significandBits = word & 0x03FF;

    // Continuous: 1024 steps → 360°
    const hueAngleDegrees = Math.round((significandBits * 360) / 1024);

    // Discrete: pairwise RGB sub-fields
    const rByte = ((significandBits >> 7) & 0x07) << 5;  // bits 9-7
    const gByte = ((significandBits >> 4) & 0x07) << 5;  // bits 6-4
    const bByte = (significandBits & 0x0F) << 4;          // bits 3-0

    // XOR with luminance scale for channel mixing
    const finalR = (rByte ^ luminanceScale) & 0xFF;
    const finalG = (gByte ^ luminanceScale) & 0xFF;
    const finalB = (bByte ^ luminanceScale) & 0xFF;

    const rgbHex = finalR.toString(16).padStart(2, '0')
                 + finalG.toString(16).padStart(2, '0')
                 + finalB.toString(16).padStart(2, '0');

    return {
      hueAngleDegrees,
      significandBits,
      alphaHex,
      canonicalHexColorString: `#${rgbHex}${alphaHex}`,
      timelineSlot: rowData.NN % 5040
    };
  }
}
```

### Example: genesis token (NN = 0x7C00)

```
0x7C00 = 0b 0 11111 00 0000 0000
            ↑ ↑↑↑↑↑ ↑↑ ↑↑↑↑ ↑↑↑↑
            │ └──┬──┘ └──┬─────┘
            │   31        0
         sign=0

  alphaHex = "ff"           (positive)
  hueAngleDegrees = 0       (significand = 0 → red)
  canonicalHexColorString = "#0000FFff"  (R=0x00, G=0x00, B=0x1F^0x1F=0x00)
```

### Example: negative token (NN = 0xFC00)

```
0xFC00 = 0b 1 11111 00 0000 0000
            ↑ ↑↑↑↑↑ ↑↑ ↑↑↑↑ ↑↑↑↑
         sign=1  31     0

  alphaHex = "33"           (negative, attenuated)
  canonicalHexColorString = "#0000FF33"  (same RGB, different alpha)
```

### Test tour

| Test file | What it verifies |
|-----------|-----------------|
| `test/chromatic-rgba.test.js` | Positive binary16 → alpha `ff`, hue 0°; negative sign → alpha `33`, hex suffix `33` |
| `test/fp16-canvas.test.js` | Sign→Greek/Coptic unicode, exponent→tetrahedral vertex, significand→hue/offsets/NBD device |
| `test/preset-color.test.js` | Nonogram preset color mapping (5/6/1) |
| `test/canvas-spec.test.js` | FP16 color classification, tetrahedral canvas JSON, metadata dividend HSL |

## 🔴 Extend

### FACTS.omi rules

- **Rule 0x83**: Sign bit MUST control alpha: 0→0xFF, 1→0x33
- **Rule 0x84**: 5 exponent bits MUST map to HSV Value across 32 tiers
- **Rule 0x85**: 10 significand bits MUST determine both continuous hue and clamped pairwise RGB

### Extension points

- **Alternative alpha mapping**: Change the 0xFF / 0x33 constants for different opacity scaling. Sign bit could also map to four alpha tiers (e.g., 0xFF, 0xAA, 0x55, 0x00) for 2-bit sign enrichment.
- **Significand bit reallocation**: Adjust the R/G/B bit split (3+3+4) to different widths (e.g., 4+3+3, 2+4+4) for alternative color channel emphasis.
- **Luminance blending formula**: Replace XOR with addition, multiplication, or a programmable LUT for different visual styles while maintaining determinism.

### Performance constraints

- Entire encoding: 3 bit-shifts, 5 AND-masks, 1 multiplication, 1 division, 3 XORs — no floating point, no branching on variable values.
- Hex string construction: 3 `toString(16)` + `padStart` calls per invocation — no string concatenation beyond the final template literal.
- Smith chart rendering: pre-computed grid, 5040-point scatter is GPU-accelerated via SVG/CSSOM — no CPU hit.
