# Face 3 — plane isolates matrix

**Topographic Planes — 2D Matrix C0 Control Separation (Aztec, MaxiCode, JAB, BeeTag)**

## 🟢 What

This layer takes the verified 1D frame from Face 2 and projects it onto a **2D topographic plane** — an 8-segment instruction matrix (`S[0]` through `S[7]`, each a `uint16_t`). The matrix encodes both the structural identity and the routing topology of an OMI token.

The critical function of this face is **C0 control separation**: the high byte of each segment distinguishes between constant delimiters (fixed) and variable fields (free). This separation lets the algebraic filter in Face 4 compute a clean zero-sum error surface.

```
Segment Map (SEGMENT_LAYOUT):
  S0[15:8] = 0x01  (CBOS constant)
  S0[7:0]  = 0x00  (low byte = 0)
  S1       = 0x03BF (chiral delimiter, fixed)
  S2       = NNNN   (free variable — payload)
  S3[15:8] = 0x2B   (arithmetic operator marker)
  S3[7:0]  = LL     (free variable — Fano lens)
  S4[15:8] = 0x2F   (arithmetic operator marker)
  S4[7:0]  = LL     (LL coherence — must match S3)
  S5       = MMMM   (free variable — payload)
  S6       = 0x039F (cardinal delimiter, fixed)
  S7[15:8] = HH     (free variable — payload)
  S7[7:0]  = 0xFF   (closure byte, fixed)
```

A **quadratic lexer** verifies LL coherence (L0 = L3 = L4 = L7) and delimiter integrity. This is the entry gate before the algebraic filter.

## 🔵 How

### Source file map

| File | Role |
|------|------|
| `src/omi/quadratic-lexer.js` | `verifyInstructionLexer(S)` — LL coherence check, delimiter/invariant validation, 8-segment layout |
| `src/canvas/omicron-canvas.js` | `OmiJsonCanvasKernel` — renders 2D JSON Canvas node spec from verified matrix; `OmiTetrahedralCanvasKernel` — maps 4 tetrahedral axes to Cartesian positions |
| `src/canvas/json-canvas.js` | `toJSONCanvas()` — exports FS/GS/RS/US lane layout as JSON Canvas edges and nodes |

### Key data structures

```javascript
// SEGMENT_LAYOUT — authoritative 8-segment map
const SEGMENT_LAYOUT = Object.freeze({
  0: { role: "CBOS", domain: "CBOS", high: 0x01, low: 0x00 },
  1: { role: "CHIRAL_DELIMITER", value: 0x03BF },
  2: { role: "NN", domain: "US", free: true },
  3: { role: "L3", domain: "RS", high: 0x2B },
  4: { role: "L4", domain: "RS", high: 0x2F },
  5: { role: "MM", domain: "FS", free: true },
  6: { role: "CARDINAL_DELIMITER", value: 0x039F },
  7: { role: "CLOSURE", domain: "GS", low: 0xFF }
});

// LL coherence equation:
// L0 = extractLL(S0)  —— from S0 high byte
// L3 = S3 high byte   —— 0x2BLL
// L4 = S4 high byte   —— 0x2FLL
// L7 = S7 high byte   —— HH
// Constraint: L0 === L3 === L4 === L7
```

### Test tour

| Test file | What it verifies |
|-----------|-----------------|
| `test/quadratic-lexer.test.js` | LL coherence (L0/L3/L4/L7 matching), delimiter detection, segment layout round-trip, reject malformed |
| `test/canvas-spec.test.js` | Canvas node/edge generation, tetrahedral vertex layout, barycentric centroid |
| `test/fp16-canvas.test.js` | Binary16 bit-field enclosure, tetrahedral routing by exponent bits |

## 🔴 Extend

### FACTS.omi rules

- **Rule 0x62**: Fano selectors LL 0x01..0x07 MUST define primitive WordNet semantic relations
- **Rule 0x63**: Prolog unification MUST use pure bitwise masks, zero allocation

### Extension points

- **New segment domain**: Add a role in `SEGMENT_LAYOUT` and update `verifyInstructionLexer` to accept the new byte mask. Must maintain C0 separation invariant.
- **New canvas node type**: Extend `DELTA_TETRAHEDRAL_NODE_AXES` with a new axis. Must define `{ component, type, baseDomain, baseOrdinal }`.
- **Alternative separator delimiters**: Change `CHIRAL_DELIMITER` or `CARDINAL_DELIMITER` constants — all lexer logic auto-adapts.

### Performance constraints

- `verifyInstructionLexer` is O(1) — 6 sum-of-squares terms, 4 LL comparisons.
- All LL extraction uses bit masking, no branching on variable values.
- Canvas generation loops over exactly 4 tetrahedral vertices — no dynamic allocation.
