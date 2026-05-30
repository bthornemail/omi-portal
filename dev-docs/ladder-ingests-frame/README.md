# Face 2 — ladder ingests frame

**Data Link Layer — 1D Linear Ingestion Precision Ladder (Codabar → Code93)**

## 🟢 What

The data link layer defines how raw byte streams are framed, encoded with error correction, and validated before entering the algebraic filters. It implements a **precision ladder** — a cascade of 1D barcode encoding schemes ranging from simple 2-of-5 combinatorial codes through USS-16K (Code 16K) up to Reed–Solomon block coding over GF(256).

The core insight: every OMI address segment (16-bit word) can be projected onto a barcode carrier profile. This enables optical/scanning ingestion paths alongside the primary IPv6 wire profile.

Four carrier formats are supported, each with a distinct stride signature:

| Format | Stride | Segment-5 Modulator | ECC |
|--------|--------|---------------------|-----|
| USS-16K (Code 16K) | `0x13B0` | — | Hamming(15,10) |
| BEEtag | `0x0078` | — | Hamming(15,10) |
| MaxiCode | `0x02D0` | bit-0 = 1 | RS + Hamming |
| Aztec | `0x02D0` | bit-0 = 0 | RS per layer 1–32 |

## 🔵 How

### Source file map

| File | Role |
|------|------|
| `src/omi/barcode-ecc-tables.js` | Format tables: strides, 2-of-5 encode/decode, RS generator polynomials (GF(256)), Hamming(15,10) tables, Aztec codeword map |
| `src/omi/ecc-kernel.js` | `OmiBarcodeEccKernel` — bitboard packing, format detection, ECC syndrome calculation, 2-of-5 group decode, RS encode/decode, Hamming(15,10) SECDED |

### Key data structures

```javascript
// SEGMENT_TO_ECC_MASK — maps segment index to ECC bitboard mask
{ 0: 0xFFFF, 1: 0x00FF, 2: 0xFF00, 3: 0x0000, /* ... */ }

// 2-of-5 encoding table — 10 pairs covering all combinatorial states
[ [0,1], [0,2], [0,3], [0,4], [1,2], [1,3], [1,4], [2,3], [2,4], [3,4] ]

// Aztec RS correction — per layer (1–32): codeword count, RS correction count
{ layers: [{ codewords: 30, rs: 6 }, { codewords: 40, rs: 8 }, /* ... */] }
```

### Code path — format detection

```javascript
// From OmiBarcodeEccKernel constructor:
const stride = S[4];  // segment 4 stores the stride literal
if (stride === 0x13B0) format = "USS16K";
else if (stride === 0x0078) format = "BEETAG";
else if (stride === 0x02D0) format = (S[5] & 0x01) ? "MAXICODE" : "AZTEC";
```

### Hamming(15,10) encode

```javascript
// G = generator matrix (10x15). Encode: codeword = data × G (mod 2)
// Syndrome: s = received × H^T. If s ≠ 0, single-bit error correctable.
// SECDED: can detect 2-bit errors, correct 1-bit errors.
```

### Test tour

| Test file | What it verifies |
|-----------|-----------------|
| `test/barcode-ecc.test.js` | 2-of-5 round-trips, USS16K charset, RS over GF(256), Hamming(15,10) encode/decode/correct, format stride dispatch, segment-to-ECC mask mapping |

## 🔴 Extend

### FACTS.omi rules

- **Rule 0x6A**: 2-of-5 polyform selectors MUST pick exactly 2 bits from 5
- **Rule 0x6B**: Formats with known stride MUST detect via segment-4 comparison
- **Rule 0x6C**: Aztec RS layers MUST map to correction table before decode

### Extension points

- **Add a new barcode format**: Define its stride constant, add a format-specific ECC mask to `SEGMENT_TO_ECC_MASK`, and register a detect condition in the constructor.
- **Custom RS parameters**: Add a new entry to the Aztec RS table with `{ codewords, rs }`. The kernel auto-selects by layer count.
- **2-of-5 variant**: Add a new pair to `TWO_OF_FIVE_SELECTOR_PAIRS` for non-standard encoding. Must maintain exactly 2-of-5 constraint.

### Performance constraints

- All Galois field operations use precomputed log/antilog tables — no runtime exponentiation.
- Hamming encode/decode uses bitboard XOR (single instruction), never loops over bits.
- RS syndrome is O(n·k) with n < 32, k < 32 — worst case < 1024 GF multiplications.
