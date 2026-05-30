# Face 9 — normalizer extracts exponent

**BFP Normalization — CLZ Exponent Detection via Block Floating-Point**

## 🟢 What

The OMI protocol uses **block floating-point (BFP)** to represent numeric values across the truth row (LL, NN, MM) with a shared exponent. Instead of each value carrying its own exponent (as in IEEE 754), a group of significands shares one exponent determined by the **count-leading-zeros (CLZ)** of the peak amplitude.

This is the zero-float answer to dynamic range: a 16-bit word can represent values from 1 to 65535 with precision proportional to magnitude, using only integer shifts and XORs.

```
Step 1: peakAmplitude = max(NN, MM, LL)
Step 2: leadingZeros = CLZ(peakAmplitude)     // count leading zero bits
Step 3: sharedExponent = 16 - leadingZeros     // block exponent
Step 4: normalizedNN = NN << leadingZeros      // left-align significand
        normalizedMM = MM << leadingZeros
```

The exponent maps to a 360° hue angle (`exponent × 360 / 16`) for canvas rendering.

## 🔵 How

### Source file map

| File | Role |
|------|------|
| `src/canvas/omicron-canvas.js` | `extractBlockFloatingPoint(S)` — CLZ normalization, shared exponent, hue mapping; `convertSegmentToFp16Color(S)` — binary16 bit-field decomposition (1/5/10 split) |
| `src/omi/place-value-interpreter.js` | `OmiPlaceValueInterpreter` — trigraph tally → polynomial degree (0 constant → 3 cubic), Float64 coefficient read from SAB slot |

### CLZ normalization — the core algorithm

```javascript
export function extractBlockFloatingPoint(S) {
  const rowData = extractTruthRow(S);
  const sigNN = rowData.NN & 0xFFFF;
  const sigMM = rowData.MM & 0xFFFF;
  const lensLL = rowData.LL & 0xFF;

  const peakAmplitude = Math.max(sigNN, sigMM, lensLL);

  let leadingZerosCount = 0;
  let bitmask = 0x8000;
  while (leadingZerosCount < 16 && (peakAmplitude & bitmask) === 0) {
    leadingZerosCount++;
    bitmask >>= 1;
  }

  const sharedBlockExponent = 16 - leadingZerosCount;
  const normalizedNN = (sigNN << leadingZerosCount) & 0xFFFF;
  const normalizedMM = (sigMM << leadingZerosCount) & 0xFFFF;

  const hueAngleDegrees = (sharedBlockExponent * 360) / 16;

  return {
    sharedBlockExponent,      // 0..16
    leadingZerosCount,        // 0..16
    normalizedNN, normalizedMM,
    canvasColorHex: `hsl(${hueAngleDegrees}, 100%, 50%)`,
    targetSharedMemorySlot: (sharedBlockExponent * sigNN) % 5040
  };
}
```

### FP16 bit-field decomposition

```javascript
// convertSegmentToFp16Color splits a uint16 into IEEE 754 binary16 fields:
// [1 sign bit | 5 exponent bits | 10 significand bits]
const word = uint16Word & 0xFFFF;
const signBit    = (word >> 15) & 0x01;    // 1 bit
const exponent   = (word >> 10) & 0x1F;    // 5 bits
const fraction   = word & 0x03FF;          // 10 bits

// Color classification:
//   sign=0, exponent > 15 → positiveLarge  (#FF0000)
//   sign=0, exponent ≤ 15 → positiveSmall  (#0088FF)
//   sign=1               → negative        (#FFAA00)
//   otherwise            → neutral         (#34495E)
```

### Place-value interpreter

```javascript
// Trigraph tally → polynomial order degree:
//   ??- tally = 0 → CONSTANT_US  (degree 0, read slot value)
//   ??- tally = 1 → LINEAR_RS    (degree 1, linear coefficient)
//   ??- tally = 2 → QUADRATIC_GS (degree 2, quadratic coefficient)
//   ??- tally = 3 → CUBIC_FS     (degree 3, cubic coefficient)
//   tally > 3     → reject (max polynomial is cubic)
```

### Test tour

| Test file | What it verifies |
|-----------|-----------------|
| `test/bfp-canvas.test.js` | CLZ normalization (0x7C00 → 1 leading zero, shared exponent 15), zero NN/MM with LL=1, target slot computation |
| `test/fp16-canvas.test.js` | Binary16 field slicing, sign→Greek/Coptic unicode, exponent→tetrahedral vertex routing, significand→hue mapping |
| `test/place-value-interpreter.test.js` | Trigraph tally → degree, canonical root, max degree 3 enforcement |

## 🔴 Extend

### FACTS.omi rules

- **Rule 0x70**: FP16 sign bit 0 → Greek unicode (U+039F/U+03BF), bit 1 → Coptic (U+2C9E/U+2C9F)
- **Rule 0x71**: BFP shared exponent MUST derive from CLZ of peak amplitude

### Extension points

- **Custom exponent range**: Change the CLZ bit-width from 16 to 8 or 32 for different precision requirements. Update `normalizedNN`/`normalizedMM` masking accordingly.
- **Weighted peak**: Instead of `Math.max`, use a weighted combination of NN, MM, LL for the peak amplitude (e.g., `(NN*2 + MM + LL) / 4`).
- **Per-channel exponent**: Instead of a shared block exponent, compute separate exponents for NN and MM. This sacrifices the normalized comparison property but increases per-channel precision.

### Performance constraints

- CLZ loop is at most 16 iterations — in practice, typical values (0x7C00 → 1, 0x1434 → 3) take 1–3 iterations.
- All FP16 color operations are pure integer — no `Math.pow` or floating-point conversion.
- The place-value interpreter reads exactly one Float64 from the SAB per query — zero allocations.
