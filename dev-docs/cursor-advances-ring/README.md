# Face 6 — cursor advances ring

**Atomic Ledger — Lock-Free CAS Cursor Updates over 5040 Disjoint SAB Slots**

## 🟢 What

The atomic ledger is the **concurrency backbone** of the OMI protocol. It maintains a fixed-size ring buffer of 5040 slots (`7!` = master Fano permutation cycle) where each slot holds a 64-bit receipt proving that a specific frame was ingested, resolved, and committed.

Two operations define this face:

1. **`advance(steps)`** — move the cursor forward by `k` slots (the step count from the projective resolver), write the receipt at the new cursor position.
2. **`atomicAdvance(steps)`** — same as advance, but uses `Atomics.compareExchange` on a dedicated cursor cell so that multiple producers (e.g., concurrent WebSocket streams, parallel eBPF ring buffers) can safely contend for the next slot without locks.

```
CURSOR ──► [ slot 1503 ] [ slot 1504 ◀══ BOOT ] [ slot 1505 ] ... [ slot 5039 ] [ slot 0 ] ...
                ▲                                            ▲                      ▲
                └── readSlot(n) returns BigInt64             5040-reset clears ring
```

The slot layout is: **`48-bit provenance | 8-bit steps | 8-bit LL | 16-bit NN | 16-bit MM`** packed into a single `BigInt64`.

## 🔵 How

### Source file map

| File | Role |
|------|------|
| `src/omi/ring-indexer.js` | `OmiRingIndexer` — lock-free cursor via CAS, slot read/write, genesis bootstrap, receipt chain traversal, epoch overwrite detection (OW-1 through OW-5) |
| `src/runtime/polytope-sab.js` | `POLYTOPE_SLOTS = 5040`, `tickFactorials()` — factorial decomposition (720p/120b/24c/6f/2e), `OmiPolytopeFactorialBuffer` — GC lifecycle (720-sweep, 5040-reset) |
| `src/runtime/chiral-smith.js` | `createSmithMatrix()` — Int32Array over 5040 slots; Smith chart reflection coefficient from slot bits |

### CAS cursor — the lock-free protocol

```javascript
// Dedicated cursor slot at a fixed offset (separate from main ring)
const CURSOR_ATOMIC_BYTES = 8;
const CURSOR_SAB_OFFSET = RING_BYTE_LENGTH;  // after main ring

atomicAdvance(steps, provenanceTag = 0) {
  while (true) {
    const currentCursor = Atomics.load(this.cursorView, 0);
    const nextSlot = Number(currentCursor + BigInt(steps)) % 5040;
    const receipt = packReceipt(provenanceTag, steps, LL, NN, MM);

    // CAS: if cursor hasn't changed, write receipt and advance
    const prev = Atomics.compareExchange(
      this.cursorView, 0, currentCursor, BigInt(nextSlot)
    );
    if (prev === currentCursor) {
      this.writeSlot(nextSlot, receipt);
      return nextSlot;
    }
    // CAS failed — another producer moved the cursor; retry
  }
}
```

### Receipt packing

```javascript
function packReceipt(provenanceTag, steps, LL, NN, MM) {
  const p = BigInt(provenanceTag & 0xFFFF) << 48n;
  const s = BigInt(steps & 0xFF) << 40n;
  const l = BigInt(LL & 0xFF) << 32n;
  const n = BigInt(NN & 0xFFFF) << 16n;
  const m = BigInt(MM & 0xFFFF);
  return p | s | l | n | m;
}
```

### Epoch overwrite policy

Five overwrite rules (OW-1 through OW-5) govern when a slot can be safely overwritten:

| Rule | Condition | Action |
|------|-----------|--------|
| OW-1 | Existing slot has readable epoch | Read provenance epoch |
| OW-2 | Cold overwrite (slot empty / stale epoch < current) | Overwrite silently |
| OW-3 | Warm overwrite (same epoch, same slot) | Reject (concurrent write detected) |
| OW-4 | Stale overwrite (stored epoch > current) | Reject (clock skew) |
| OW-5 | CAS serialization under load | Retry, preserve epoch ordering |

### Test tour

| Test file | What it verifies |
|-----------|-----------------|
| `test/ring-indexer.test.js` | Receipt pack/unpack, CAS cursor advance, genesis bootstrap at slot 1504, receipt chain traversal, epoch overwrite OW-1..5, wraparound stress (504 single-step advances) |
| `test/polytope-sab.test.js` | 5040×8 byte buffer, tick factorial decomposition, GC 720-sweep / 5040-reset |
| `test/chiral-smith.test.js` | Smith matrix tick load/store, canvas graph hash |

## 🔴 Extend

### FACTS.omi rules

- **Rule 0x75**: Factorial ring at stride 720 MUST run GC sweep
- **Rule 0x76**: Hard reset at stride 5040 MUST clear all slots

### Extension points

- **Custom receipt format**: Change `packReceipt` to include additional fields (e.g., source port, error code). Must keep total ≤ 64 bits for atomic write.
- **Multi-ring topology**: Create a ring indexer array (one per service bus ::1..::12). Each ring has its own CAS cursor.
- **Non-5040 ring size**: Change `POLYTOPE_SLOTS`. Must maintain factorial stride decomposability (must be divisible by 720, 120, 24, 6, 2).

### Performance constraints

- `Atomics.compareExchange` is the only serialization point — all other operations are wait-free.
- 5040 slots × 8 bytes = 40320 bytes per ring — fits in L1 cache on modern CPUs.
- CAS retry is rare under light contention (< 0.1% on dual-producer benchmarks).
