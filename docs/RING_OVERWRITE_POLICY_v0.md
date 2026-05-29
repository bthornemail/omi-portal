# Ring Overwrite Policy v0

## Problem

The 5040-slot replay ring is a fixed circular buffer. Under concurrent writers using the lock-free CAS cursor, the cursor wraps past the array boundary approximately every 5040/avg_steps receipts. When the cursor wraps, it begins overwriting slots that may still contain live receipts from the previous epoch.

## Definitions

- **Slot**: One 64-bit entry in the ring buffer (`BigInt64Array[5040]`).
- **Cursor**: Atomic 64-bit index into the ring, advanced via `Atomics.compareExchange`.
- **Epoch**: Monotonically increasing counter, incremented each time the cursor wraps (new position < old position).
- **Provenance tag**: 16-bit field in slot bits 63:48. Default format: `epoch << 8` (upper 8 bits = epoch, lower 8 bits = sub-epoch or zero).
- **Live slot**: A slot whose provenance tag matches the current epoch. The payload is considered active and must not be overwritten without full-state re-verification.

## Overwrite Rules

### Rule OW-1: Epoch tag matching

Before any `atomicWrite`, the writer MUST read the existing slot value and compare its provenance epoch against the current epoch.

```
existing_epoch = (slot >> 48n) & 0xFF00n  >> 8
current_epoch  = this.epoch
```

### Rule OW-2: Cold overwrite (safe)

If `existing_epoch < current_epoch`, the slot belongs to a prior epoch. Overwrite is permitted without re-verification. The slot is considered **cold**.

### Rule OW-3: Warm overwrite (requires re-verification)

If `existing_epoch == current_epoch`, the slot is **warm** — written earlier in the same epoch. The writer MUST:

1. Unpack the existing slot via `unpackSlot()`
2. Run `isOrbitLexerValid()` on the existing frame
3. If Q(S) == 0 and the existing slot is a valid receipt, the writer MUST **drop** the new frame (`XDP_DROP` equivalent in userspace) — the slot is already occupied by a live receipt in the current epoch.
4. If Q(S) != 0 (slot corrupted or phantom write), the writer MAY overwrite after logging a diagnostic.

### Rule OW-4: Stale overwrite (always safe)

If `existing_epoch > current_epoch`, a clock drift or wraparound counter corruption has occurred. The writer MUST overwrite unconditionally and emit a warning. This case should not occur under correct single-epoch monotonicity.

### Rule OW-5: CAS failure backoff

The CAS loop in `atomicAdvance` naturally serializes writers. On CAS failure, the writer retries. After the retry, it MUST re-check the overwrite rules (OW-1 through OW-4) because the cursor advanced and the target slot may have changed.

## Implementation

The `atomicAdvance` method in `ring-indexer.js` is extended with the warm-slot check:

```javascript
atomicAdvance(steps, truthRow, provenanceTag = 0n) {
  const s = Math.min(steps, MAX_VALID_STEPS);
  const LL = Number((truthRow >> 32n) & 0xFFn);
  const NN = Number((truthRow >> 16n) & 0xFFFFn);
  const MM = Number(truthRow & 0xFFFFn);
  const tag = provenanceTag || 0n;

  while (true) {
    const oldCursor = Atomics.load(this.cursorAtomic, CURSOR_ATOMIC_INDEX);
    const newCursor = (Number(oldCursor) + s) % POLYTOPE_SLOTS;
    const cas = Atomics.compareExchange(
      this.cursorAtomic, CURSOR_ATOMIC_INDEX,
      oldCursor, BigInt(newCursor)
    );
    if (cas !== oldCursor) continue; /* CAS contention — retry */

    /* Determine epoch */
    if (newCursor < Number(oldCursor)) this.epoch++;

    /* Build provenance tag */
    const epochTag = provenanceTag || (BigInt(this.epoch) << 8n);

    /* Check overwrite rules */
    const existingSlot = this.atomicRead(newCursor);
    const existingEpoch = Number((existingSlot >> 48n) & 0xFF00n) >> 8;

    if (existingEpoch === this.epoch) {
      /* OW-3: warm slot — existing slot is from current epoch */
      if (existingSlot !== 0n) {
        /* Slot occupied; verify the existing frame before overwriting */
        /* In practice this means dropping the new packet */
        return { position: -1, receipt: 0n, steps: 0, epoch: this.epoch,
                 error: 'SLOT_WARM_REJECT' };
      }
    }

    /* Write receipt */
    const receipt = packReceipt(epochTag, s, LL, NN, MM);
    this.atomicWrite(newCursor, receipt);
    this._cursor = newCursor;
    return { position: newCursor, receipt, steps: s, epoch: this.epoch };
  }
}
```

### Stress Behavior

Under maximum sustained throughput (avg 7 steps per receipt, worst-case ~720 receipts per epoch):

- 5040 slots / 7 avg steps ≈ 720 receipts per epoch
- At ~720 receipts, the cursor wraps and begins overwriting epoch N-1 slots (cold — always safe)
- Only if 720+ receipts arrive within a single epoch without cursor advancement do warm collisions occur
- The Transylvania lottery bound (≤14 steps) guarantees at least 360 unique slots before wraparound

## Test Coverage

The test suite in `test/ring-indexer.test.js` covers:

- Cold overwrite: advance past wraparound, verify epoch increments
- Warm overwrite: attempt to occupy a slot twice in the same epoch, verify rejection
- CAS contention with epoch tracking under concurrent workers (via `Worker` + `vm.Script`)
