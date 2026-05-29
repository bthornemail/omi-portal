import { POLYTOPE_SLOTS, BYTES_PER_SLOT, tickFactorials } from '../runtime/polytope-sab.js';
import { fanoTruthResolver, GENESIS_REPLAY_RING_INDEX, deltaC } from './delta-orbital-lexer.js';

export const BOOT_SLOT = GENESIS_REPLAY_RING_INDEX;

export const SLOT_DIVIDEND_MASK = 0xFFFFn << 48n;
export const SLOT_STEPS_MASK   = 0xFFn << 40n;
export const SLOT_LL_MASK     = 0xFFn << 32n;
export const SLOT_NN_MASK     = 0xFFFFn << 16n;
export const SLOT_MM_MASK     = 0xFFFFn;

export const MAX_VALID_STEPS = 14;

export function packReceipt(provenance, steps, LL, NN, MM) {
  const clampedSteps = Math.min(Math.max(0, steps), MAX_VALID_STEPS);
  const p = BigInt(provenance) & 0xFFFFn;
  const s = BigInt(clampedSteps) & 0xFFn;
  const l = BigInt(LL) & 0xFFn;
  const n = BigInt(NN) & 0xFFFFn;
  const m = BigInt(MM) & 0xFFFFn;
  return (p << 48n) | (s << 40n) | (l << 32n) | (n << 16n) | m;
}

export function unpackSlot(slotValue) {
  const provenance = Number((slotValue >> 48n) & 0xFFFFn);
  const steps = Number((slotValue >> 40n) & 0xFFn);
  const LL = Number((slotValue >> 32n) & 0xFFn);
  const NN = Number((slotValue >> 16n) & 0xFFFFn);
  const MM = Number(slotValue & 0xFFFFn);
  return { provenance, steps, LL, NN, MM };
}

export const CURSOR_ATOMIC_BYTES = 8;
export const CURSOR_ATOMIC_INDEX = 0;

export class OmiRingIndexer {
  constructor(bufferOrSize = 5040) {
    const ringSize = typeof bufferOrSize === 'number'
      ? bufferOrSize * BYTES_PER_SLOT
      : bufferOrSize.byteLength;
    const ringBuf = bufferOrSize instanceof SharedArrayBuffer ||
                    bufferOrSize instanceof ArrayBuffer
      ? bufferOrSize
      : new SharedArrayBuffer(ringSize);

    this.sab = ringBuf;
    this.slots = new BigInt64Array(ringBuf);

    const SabT = typeof SharedArrayBuffer !== 'undefined'
      ? SharedArrayBuffer : ArrayBuffer;
    this.cursorSab = new SabT(CURSOR_ATOMIC_BYTES);
    this.cursorAtomic = new BigInt64Array(this.cursorSab);
    this.cursorAtomic[0] = BigInt(BOOT_SLOT);
    this._cursor = BOOT_SLOT;
    this.epoch = 0;
  }

  get position() {
    if (this.cursorSab instanceof SharedArrayBuffer) {
      return Number(Atomics.load(this.cursorAtomic, CURSOR_ATOMIC_INDEX));
    }
    return Number(this.cursorAtomic[CURSOR_ATOMIC_INDEX]);
  }

  set position(value) {
    const v = BigInt(((value % POLYTOPE_SLOTS) + POLYTOPE_SLOTS) % POLYTOPE_SLOTS);
    if (this.cursorSab instanceof SharedArrayBuffer) {
      Atomics.store(this.cursorAtomic, CURSOR_ATOMIC_INDEX, v);
    } else {
      this.cursorAtomic[CURSOR_ATOMIC_INDEX] = v;
    }
    this._cursor = Number(v);
  }

  readSlot(index) {
    const i = ((index % POLYTOPE_SLOTS) + POLYTOPE_SLOTS) % POLYTOPE_SLOTS;
    return this.slots[i];
  }

  writeSlot(index, value) {
    const i = ((index % POLYTOPE_SLOTS) + POLYTOPE_SLOTS) % POLYTOPE_SLOTS;
    this.slots[i] = value;
    return i;
  }

  atomicRead(index) {
    const i = ((index % POLYTOPE_SLOTS) + POLYTOPE_SLOTS) % POLYTOPE_SLOTS;
    if (this.sab instanceof SharedArrayBuffer) {
      return Atomics.load(this.slots, i);
    }
    return this.slots[i];
  }

  atomicWrite(index, value) {
    const i = ((index % POLYTOPE_SLOTS) + POLYTOPE_SLOTS) % POLYTOPE_SLOTS;
    if (this.sab instanceof SharedArrayBuffer) {
      Atomics.store(this.slots, i, value);
    } else {
      this.slots[i] = value;
    }
    return i;
  }

  advance(steps, truthRow, provenanceTag = 0n) {
    const s = Math.min(steps, MAX_VALID_STEPS);
    const oldPos = this._cursor;
    const newPos = (oldPos + s) % POLYTOPE_SLOTS;
    if (newPos < oldPos) this.epoch++;
    this._cursor = newPos;
    const LL = Number((truthRow >> 32n) & 0xFFn);
    const NN = Number((truthRow >> 16n) & 0xFFFFn);
    const MM = Number(truthRow & 0xFFFFn);
    const tag = provenanceTag || (BigInt(this.epoch) << 8n);
    const receipt = packReceipt(tag, s, LL, NN, MM);
    this.writeSlot(this._cursor, receipt);
    return { position: this._cursor, receipt, steps: s, epoch: this.epoch };
  }

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
      if (cas === oldCursor) {
        if (newCursor < Number(oldCursor)) this.epoch++;
        const epochTag = provenanceTag || (BigInt(this.epoch) << 8n);
        const receipt = packReceipt(epochTag, s, LL, NN, MM);
        this.atomicWrite(newCursor, receipt);
        this._cursor = newCursor;
        return { position: newCursor, receipt, steps: s, epoch: this.epoch };
      }
    }
  }

  bootstrapGenesis(LL = 0x01, bootAddress = 0x7C00) {
    const C = (LL * 0x1337) & 0xFFFF;
    const rotl1 = ((bootAddress << 1) | (bootAddress >> 15)) & 0xFFFF;
    const rotl3 = ((bootAddress << 3) | (bootAddress >> 13)) & 0xFFFF;
    const rotr2 = ((bootAddress >> 2) | (bootAddress << 14)) & 0xFFFF;
    const MM = (rotl1 ^ rotl3 ^ rotr2 ^ C) & 0xFFFF;

    this.cursorAtomic[CURSOR_ATOMIC_INDEX] = BigInt(BOOT_SLOT);
    this._cursor = BOOT_SLOT;
    this.writeSlot(this._cursor, packReceipt(0n, 1, LL, bootAddress, MM));

    return {
      position: this._cursor,
      LL, NN: bootAddress, MM,
      steps: 1
    };
  }

  getFactorials() {
    return tickFactorials(this.position);
  }

  getReceiptChain(length = 7) {
    const chain = [];
    let pos = this.position;
    for (let i = 0; i < length; i++) {
      const slotValue = this.readSlot(pos);
      chain.push({ index: pos, slotValue, ...unpackSlot(slotValue) });
      if (pos === 0) pos = POLYTOPE_SLOTS - 1;
      else pos--;
    }
    return chain;
  }

  rewind(toIndex) {
    const i = ((toIndex % POLYTOPE_SLOTS) + POLYTOPE_SLOTS) % POLYTOPE_SLOTS;
    this._cursor = i;
    this.cursorAtomic[CURSOR_ATOMIC_INDEX] = BigInt(i);
    return this._cursor;
  }
}

export function createRingIndexer(buffer) {
  return new OmiRingIndexer(buffer);
}
