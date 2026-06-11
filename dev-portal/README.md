# OMI Portal Runtime

A TypeScript + React static portal for inspecting the OMI deterministic runtime model:

```text
zero-basis address
→ Omi-Gauge cell
→ Omi-Plane Capsule scalar
→ UTF-16 surrogate RPC pair
→ Omi-CONS CAR/CDR/CID
→ SpectralDOM projection
→ export/import receipt snapshot
```

This package is intentionally inspectable. The algorithmic code is in `src/core`, the React UI is in `src/components`, and the service worker is in `public/omi-sw.js`.

## Quick start

```bash
npm install
npm run dev
npm run test:algorithms
npm run build
```

## Core files

| File | Purpose |
|---|---|
| `src/core/gauge.ts` | 16×64×64 Omi-Gauge page math, bitboard helpers, row tables. |
| `src/core/delta.ts` | Delta law: `rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C`. |
| `src/core/nomogram.ts` | Omi-SlideRule / Omi-Nomogram pure function selectors. |
| `src/core/surrogate.ts` | Supplementary scalar ↔ UTF-16 surrogate RPC pair. |
| `src/core/cons.ts` | Omi-CONS CAR/CDR/CID computations. |
| `src/core/exportImport.ts` | JSON snapshot export/import with receipt hash. |
| `src/core/runtime.ts` | Minimal deterministic runtime state and cell touch logic. |

## Canonical formulas

### Omi-Gauge cell

```ts
cell = (row << 12) | (x << 6) | y
```

Where:

```text
row = 0..15
x   = 0..63
y   = 0..63
```

### Omi-Plane Capsule scalar

```ts
U = 0x10000 + (page << 16) + cell
```

### UTF-16 surrogate RPC pair

```ts
Uprime = U - 0x10000
W1 = 0xD800 + (Uprime >> 10)
W2 = 0xDC00 + (Uprime & 0x3FF)
```

### Omi-CONS

```ts
CAR = source OR continuation
CDR = source XOR continuation
CID = source XNOR continuation
```

## Memory sizes

One Omi-Gauge page:

```text
64 × 64 × 16 = 65,536 cells
```

Sixteen pages:

```text
16 × 65,536 = 1,048,576 cells
```

Practical storage:

```text
bitboard for 16 pages = 128 KiB
Uint32 rewrite table  = 4 MiB
```

## Root row table

```text
0x0 = axioms
0x1 = rules
0x2 = facts
0x3 = closures
0x4 = combinators
0x5 = cons
0x6 = car
0x7 = cdr
0x8 = encode
0x9 = decode
0xA = frame
0xB = buffer
0xC = file
0xD = group
0xE = record
0xF = unit
```

## Local root LUT

```text
0x0000 = axiomatic-algorithms
0x0001 = logic-rules
0x0002 = configuration-facts
0x0003 = event-closures
0x0004 = intent-combinators
0x0005 = element-constructions
0x0006 = block-node
0x0007 = edge-node
0x0008 = graph-node
0x0009 = data-view
0x000A = data-source
0x000B = data-input
0x000C = data-sink
0x000D = data-output
0x000E = done-statement
0x000F = unit-boundary
```

## Service worker

The service worker caches the portal shell and fetched assets so the app remains inspectable offline after first load.

## Export / import

The UI exports a JSON snapshot:

```ts
{
  version: 1,
  rootAddress,
  createdAt,
  bitboardBase64,
  rewritesBase64,
  receipt,
  cells
}
```

Import restores the bitboard and rewrite table.

## Determinism rule

```text
same zero-basis address
same Delta law
same Omi-Gauge cell formula
same Omi-Nomogram selector
same Omi-CONS payload
same receipt rule
= same runtime projection
```
