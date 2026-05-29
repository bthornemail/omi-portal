import { POLYTOPE_SLOTS, BYTES_PER_SLOT, tickFactorials } from '../runtime/polytope-sab.js';
import { fanoTruthResolver, GENESIS_REPLAY_RING_INDEX, deltaC } from './delta-orbital-lexer.js';

export const BOOT_SLOT = GENESIS_REPLAY_RING_INDEX;

export const SLOT_DIVIDEND_MASK = 0xFFFFn << 48n;
export const SLOT_STEPS_MASK   = 0xFFn << 40n;
export const SLOT_LL_MASK     = 0xFFn << 32n;
export const SLOT_NN_MASK     = 0xFFFFn << 16n;
export const SLOT_MM_MASK     = 0xFFFFn;

export const MAX_VALID_STEPS = 14;

export function packReceipt(truthRowBigInt, steps, provenanceTag = 0n) {
  const s = BigInt(Math.min(steps, MAX_VALID_STEPS)) & 0xFFn;
  const p = provenanceTag & 0xFFFFn;
  const row48 = truthRowBigInt & 0xFFFFFFFFFFFFn;
  return (p << 48n) | (s << 40n) | row48;
}

export function unpackSlot(slotValue) {
  const provenance = Number((slotValue >> 48n) & 0xFFFFn);
  const steps = Number((slotValue >> 40n) & 0xFFn);
  const LL = Number((slotValue >> 32n) & 0xFFn);
  const NN = Number((slotValue >> 16n) & 0xFFFFn);
  const MM = Number(slotValue & 0xFFFFn);
  return { provenance, steps, LL, NN, MM };
}

export class OmiRingIndexer {
  constructor(bufferOrSize = 5040) {
    const size = typeof bufferOrSize === 'number'
      ? bufferOrSize * BYTES_PER_SLOT
      : bufferOrSize.byteLength;
    const buf = bufferOrSize instanceof SharedArrayBuffer ||
                bufferOrSize instanceof ArrayBuffer
      ? bufferOrSize
      : new SharedArrayBuffer(size);

    this.sab = buf;
    this.slots = new BigInt64Array(buf);
    this.cursor = BOOT_SLOT;
    this.epoch = 0;
  }

  get position() {
    return this.cursor;
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
    if (this.slots.buffer instanceof SharedArrayBuffer) {
      return Atomics.load(this.slots, i);
    }
    return this.slots[i];
  }

  atomicWrite(index, value) {
    const i = ((index % POLYTOPE_SLOTS) + POLYTOPE_SLOTS) % POLYTOPE_SLOTS;
    if (this.slots.buffer instanceof SharedArrayBuffer) {
      Atomics.store(this.slots, i, value);
    } else {
      this.slots[i] = value;
    }
    return i;
  }

  advance(steps, truthRow, provenanceTag = 0n) {
    const s = Math.min(steps, MAX_VALID_STEPS);
    this.cursor = (this.cursor + s) % POLYTOPE_SLOTS;
    const receipt = packReceipt(truthRow, s, provenanceTag);
    this.writeSlot(this.cursor, receipt);
    return { position: this.cursor, receipt, steps: s };
  }

  atomicAdvance(steps, truthRow, provenanceTag = 0n) {
    const s = Math.min(steps, MAX_VALID_STEPS);
    const next = (this.cursor + s) % POLYTOPE_SLOTS;
    const receipt = packReceipt(truthRow, s, provenanceTag);
    this.atomicWrite(next, receipt);
    this.cursor = next;
    return { position: this.cursor, receipt, steps: s };
  }

  bootstrapGenesis(LL = 0x01, bootAddress = 0x7C00) {
    const C = (LL * 0x1337) & 0xFFFF;
    const rotl1 = ((bootAddress << 1) | (bootAddress >> 15)) & 0xFFFF;
    const rotl3 = ((bootAddress << 3) | (bootAddress >> 13)) & 0xFFFF;
    const rotr2 = ((bootAddress >> 2) | (bootAddress << 14)) & 0xFFFF;
    const MM = (rotl1 ^ rotl3 ^ rotr2 ^ C) & 0xFFFF;

    const truthRow = (BigInt(LL) << 32n) | (BigInt(bootAddress) << 16n) | BigInt(MM);

    this.cursor = BOOT_SLOT;
    this.writeSlot(this.cursor, packReceipt(truthRow, 1, 0n));

    return {
      position: this.cursor,
      LL, NN: bootAddress, MM,
      steps: 1
    };
  }

  getFactorials() {
    return tickFactorials(this.cursor);
  }

  getReceiptChain(length = 7) {
    const chain = [];
    let pos = this.cursor;
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
    this.cursor = i;
    return this.cursor;
  }
}

export function createRingIndexer(buffer) {
  return new OmiRingIndexer(buffer);
}
