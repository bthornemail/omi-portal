# OMI Memory Layout

OMI keeps DOM/CSSOM identity strings and binary memory views aligned. This document fixes the sizing rules for ArrayBuffer and SharedArrayBuffer usage.

## JavaScript Buffer Math

Constructor arguments are easy to mix up:

```js
new ArrayBuffer(32)        // 32 bytes
new SharedArrayBuffer(128) // 128 bytes
new Float32Array(32 * 8)   // 256 Float32 elements = 1024 bytes
```

A `Float32` is 4 bytes. Therefore:

```text
32 Float32 slots = 32 * 4 = 128 bytes
64 Float32 slots = 64 * 4 = 256 bytes
```

So an OMI 32-cell Float32 pre-header should use:

```js
const buffer = new ArrayBuffer(128);
const preHeader = new Float32Array(buffer); // length 32
```

or, for workers:

```js
const buffer = new SharedArrayBuffer(128);
const preHeader = new Float32Array(buffer); // length 32
```

## Recommended Buffer Tiers

| Allocation | Bytes | Best View | Meaning |
| --- | ---: | --- | --- |
| `ArrayBuffer(32)` | 32 | `Uint8Array(32)` or `Float32Array(8)` | compact byte header or 8 Float32 slots |
| `SharedArrayBuffer(128)` | 128 | `Float32Array(32)` | canonical 32-slot pre-header for `0x00..0x1f` |
| `SharedArrayBuffer(256)` | 256 | `Float32Array(64)` | full RS descriptor table for `0x00..0x3f` |
| `SharedArrayBuffer(5040)` | 5040 | `Float32Array(1260)` | byte-sized 5040 cycle workspace, not 5040 float slots |
| `SharedArrayBuffer(5040 * 4)` | 20160 | `Float32Array(5040)` | one Float32 per 5040 tick |
| `SharedArrayBuffer(5040 * 8)` | 40320 | `Float64Array(5040)` or `BigInt64Array(5040)` | one 64-bit slot per 5040 tick |

## Canonical Pre-Header

Use `SharedArrayBuffer(128)` when the first 32 descriptors are represented as Float32 slots:

```js
const sab = new SharedArrayBuffer(128);
const header = new Float32Array(sab);

header[0x00] = 0; // null/root
header[0x03] = 1; // little-endian flag
header[0x09] = 1; // Float32 payload view
header[0x10] = 720; // promote boundary
header[0x11] = 5040; // hard reset boundary
```

For precise byte-level writes, pair the same buffer with `DataView`:

```js
const view = new DataView(sab);
view.setFloat32(0x03 * 4, 1, true);
view.setFloat32(0x04 * 4, 0, false);
```

## Full Descriptor Block

Use `SharedArrayBuffer(256)` to represent all RS descriptors `0x00..0x3f` as Float32 slots:

```js
const rsBlock = new SharedArrayBuffer(64 * 4);
const rs = new Float32Array(rsBlock); // length 64
```

The lower half, `0x00..0x1f`, is the pre-header. The upper half, `0x20..0x3f`, is the extended record descriptor space.

## 5040 Cycle History

Use the history buffer according to the slot width needed:

```js
const f32History = new SharedArrayBuffer(5040 * 4);
const f32Ticks = new Float32Array(f32History); // 5040 slots

const u64History = new SharedArrayBuffer(5040 * 8);
const u64Ticks = new BigInt64Array(u64History); // 5040 slots
```

`SharedArrayBuffer(5040 * 8)` is the correct full block history allocation when every tick needs one 64-bit value. It also supports two Float32 values per tick:

```js
const pairHistory = new Float32Array(u64History); // 10080 Float32 slots
const tick = 720;
const a = pairHistory[tick * 2];
const b = pairHistory[tick * 2 + 1];
```

## Recommended v1 Layout

For OMI v1, use two buffers:

```js
const descriptorBlock = new SharedArrayBuffer(64 * 4); // 0x00..0x3f Float32 descriptors
const historyBlock = new SharedArrayBuffer(5040 * 8); // 5040 64-bit history slots
```

This gives a compact control plane and a deterministic 7! history plane without conflating byte counts and typed-array element counts.
