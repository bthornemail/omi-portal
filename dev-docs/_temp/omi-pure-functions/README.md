# OMI Pure Functions Kernel

Single-purpose package for the algorithmic OMI layer.

```text
omi-0000-0000-0000-000b-0000-0000-0000-0000/48 MUST pos-part
```

## Contents

- `omi-pure-functions.mjs` — dependency-free ES module.
- `omi-pure-functions.d.ts` — TypeScript declarations.

## Doctrine

```text
Algorithms define the invariant.
Artifacts are verifiable instances.
Representations are projections.
```

## Included pure functions

- fixed-width masks, rotations, ones/twos complement
- Delta law: `rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C`
- period/orbit helpers: `BLOCK_73`, `orbit36`, Base36 values
- mixed-radix encode/decode
- Unicode plane/offset and UTF-16 surrogate decomposition
- 16xy gauge cells: `row * 4096 + x * 64 + y`
- 4y² lower gauge cells
- two-cube mirror, delta, diagonal rejection, local240 bijection
- quadratic projection: `Q_xy(x,y)=60x²+16xy+4y²`
- 5040 replay-ring slot encode/decode
- closure7 / phase7 / Fano XOR line check
- CAR/CDR/CID witness helpers
- XOR and GF(256) root16 fragment replay helpers
- 32-bit post-address DataView header packing
- FS/GS/RS/US pure projection selector

## Example

```js
import {
  delta,
  qxy,
  slot5040,
  local240,
  byteFromNibbles,
  formatOmiAddress,
} from "./omi-pure-functions.mjs";

const x1 = delta(0x0000);
const local = local240(byteFromNibbles(0x7, 0xc));
const slot = slot5040(0, 0, local);

console.log(x1.toString(16), qxy(3, 3), slot);
console.log(formatOmiAddress([0,0,0,0x000b,0,0,0,0], 48));
```

## Boundary

This package intentionally does not include DOM, filesystem, network, time, random, browser APIs, or Node APIs. It can be used inside browser, Node, workers, tests, or POSIX-generated JS fixtures as a deterministic reference.
