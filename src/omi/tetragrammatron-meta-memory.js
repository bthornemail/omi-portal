export const TETRAGRAMMATRON_DESCRIPTOR_CELLS = 64;
export const TETRAGRAMMATRON_DESCRIPTOR_BYTES = TETRAGRAMMATRON_DESCRIPTOR_CELLS * 4;
export const TETRAGRAMMATRON_HISTORY_SLOTS = 5040;
export const TETRAGRAMMATRON_HISTORY_BYTES = TETRAGRAMMATRON_HISTORY_SLOTS * 8;

export const TETRA_DESCRIPTOR = Object.freeze({
  ROOT: 0x00,
  VERSION: 0x01,
  WORKER_COUNT: 0x02,
  LITTLE_ENDIAN: 0x03,
  ACTIVE_BACKEND: 0x04,
  ACTIVE_PHASE: 0x05,
  POLYBIUS_ROW: 0x06,
  POLYBIUS_COL: 0x07,

  STATUS: 0x08,
  PAYLOAD_VIEW: 0x09,
  CURSOR: 0x0A,
  CLAIMED_SLOT: 0x0B,
  WRITE_LOCK: 0x0C,
  READ_LOCK: 0x0D,
  ERROR_CODE: 0x0E,
  RECEIPT_STATE: 0x0F,

  PROMOTE_BOUNDARY: 0x10,
  RESET_BOUNDARY: 0x11,
  LOCAL240: 0x12,
  SLOT5040: 0x13,
  CHART11: 0x14,
  BASE_Q: 0x15,
  FIBER_Q: 0x16,
  FANO7: 0x17,
  ROLE3: 0x18,
});

export const TETRAGRAMMATRON_DESCRIPTOR = Object.freeze({
  ...TETRA_DESCRIPTOR,
  PROTOCOL_VERSION: TETRA_DESCRIPTOR.VERSION,
  ACTIVE_BACKEND_ID: TETRA_DESCRIPTOR.ACTIVE_BACKEND,
  ACTIVE_QUQUART_PHASE: TETRA_DESCRIPTOR.ACTIVE_PHASE,
  ACTIVE_POLYBIUS_ROW: TETRA_DESCRIPTOR.POLYBIUS_ROW,
  ACTIVE_POLYBIUS_COL: TETRA_DESCRIPTOR.POLYBIUS_COL,
  STATUS_WORD: TETRA_DESCRIPTOR.STATUS,
  PAYLOAD_VIEW_MODE: TETRA_DESCRIPTOR.PAYLOAD_VIEW,
  CURRENT_CURSOR: TETRA_DESCRIPTOR.CURSOR,
  HARD_RESET_BOUNDARY: TETRA_DESCRIPTOR.RESET_BOUNDARY,
  BASEQ: TETRA_DESCRIPTOR.BASE_Q,
  FIBERQ: TETRA_DESCRIPTOR.FIBER_Q,
  WORKER_LANES_START: 0x20,
  WORKER_LANES_END: 0x2F,
  BACKEND_LANES_START: 0x30,
  BACKEND_LANES_END: 0x3F,
});

export const TETRAGRAMMATRON_DESCRIPTOR_LABELS = Object.freeze(
  Object.fromEntries(
    Object.entries(TETRA_DESCRIPTOR)
      .filter(([, value]) => Number.isInteger(value))
      .map(([label, value]) => [value, label.toLowerCase()])
  )
);

const DEFAULT_PROTOCOL_VERSION = 1;
const LITTLE_ENDIAN_FLAG = 1;
const PROMOTE_BOUNDARY = 720;
const HARD_RESET_BOUNDARY = 5040;

function descriptorView(target) {
  if (target?.i32 instanceof Int32Array) return target.i32;
  if (target instanceof Int32Array) return target;
  throw new TypeError("Expected Tetragrammatron memory object or Int32Array descriptor view");
}

function historyView(target) {
  if (target?.history64 instanceof BigInt64Array) return target.history64;
  if (target instanceof BigInt64Array) return target;
  throw new TypeError("Expected Tetragrammatron memory object or BigInt64Array history view");
}

function assertDescriptorIndex(index) {
  const cell = Number(index);
  if (!Number.isInteger(cell) || cell < 0 || cell >= TETRAGRAMMATRON_DESCRIPTOR_CELLS) {
    throw new RangeError(`Descriptor cell out of range: ${index}`);
  }
  return cell;
}

function normalizeHistorySlot(slot) {
  const n = Number(slot);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new TypeError(`Invalid Tetragrammatron history slot: ${slot}`);
  }
  return ((n % TETRAGRAMMATRON_HISTORY_SLOTS) + TETRAGRAMMATRON_HISTORY_SLOTS) %
    TETRAGRAMMATRON_HISTORY_SLOTS;
}

export function createTetragrammatronMemory(options = {}) {
  const descriptorBlock = options.descriptorBlock ??
    new SharedArrayBuffer(TETRAGRAMMATRON_DESCRIPTOR_BYTES);
  const historyBlock = options.historyBlock ??
    new SharedArrayBuffer(TETRAGRAMMATRON_HISTORY_BYTES);

  if (descriptorBlock.byteLength < TETRAGRAMMATRON_DESCRIPTOR_BYTES) {
    throw new TypeError(
      `Tetragrammatron descriptorBlock must be at least ${TETRAGRAMMATRON_DESCRIPTOR_BYTES} bytes`
    );
  }
  if (historyBlock.byteLength < TETRAGRAMMATRON_HISTORY_BYTES) {
    throw new TypeError(
      `Tetragrammatron historyBlock must be at least ${TETRAGRAMMATRON_HISTORY_BYTES} bytes`
    );
  }

  const memory = {
    descriptorBlock,
    historyBlock,
    f32: new Float32Array(descriptorBlock, 0, TETRAGRAMMATRON_DESCRIPTOR_CELLS),
    i32: new Int32Array(descriptorBlock, 0, TETRAGRAMMATRON_DESCRIPTOR_CELLS),
    u32: new Uint32Array(descriptorBlock, 0, TETRAGRAMMATRON_DESCRIPTOR_CELLS),
    dv: new DataView(descriptorBlock, 0, TETRAGRAMMATRON_DESCRIPTOR_BYTES),
    history64: new BigInt64Array(historyBlock, 0, TETRAGRAMMATRON_HISTORY_SLOTS),
    descriptor: TETRAGRAMMATRON_DESCRIPTOR,
    descriptorLabels: TETRAGRAMMATRON_DESCRIPTOR_LABELS,
  };

  if (options.initialize !== false) initializeDescriptor(memory.i32, options);
  return memory;
}

function initializeDescriptor(i32, options) {
  Atomics.store(i32, TETRA_DESCRIPTOR.ROOT, Number(options.root ?? 0));
  Atomics.store(
    i32,
    TETRA_DESCRIPTOR.VERSION,
    Number(options.protocolVersion ?? DEFAULT_PROTOCOL_VERSION)
  );
  Atomics.store(i32, TETRA_DESCRIPTOR.WORKER_COUNT, Number(options.workerCount ?? 0));
  Atomics.store(i32, TETRA_DESCRIPTOR.LITTLE_ENDIAN, LITTLE_ENDIAN_FLAG);
  Atomics.store(i32, TETRA_DESCRIPTOR.PROMOTE_BOUNDARY, PROMOTE_BOUNDARY);
  Atomics.store(i32, TETRA_DESCRIPTOR.RESET_BOUNDARY, HARD_RESET_BOUNDARY);
}

export function readDescriptor(target, index) {
  const i32 = descriptorView(target);
  return Atomics.load(i32, assertDescriptorIndex(index));
}

export function writeDescriptor(target, index, value) {
  const i32 = descriptorView(target);
  const cell = assertDescriptorIndex(index);
  const stored = Number(value) | 0;
  Atomics.store(i32, cell, stored);
  return stored;
}

export function claimTetragrammatronSlot(target, workerId = 0) {
  const i32 = descriptorView(target);
  const rawSlot = Atomics.add(i32, TETRA_DESCRIPTOR.CURSOR, 1);
  const slot = normalizeHistorySlot(rawSlot);
  Atomics.store(i32, TETRA_DESCRIPTOR.CLAIMED_SLOT, slot);
  Atomics.store(i32, TETRA_DESCRIPTOR.ACTIVE_BACKEND, Number(workerId) | 0);
  Atomics.store(i32, TETRA_DESCRIPTOR.SLOT5040, slot);
  return slot;
}

export function writeTetragrammatronReceipt(target, slot, receipt64) {
  const history64 = historyView(target);
  const index = normalizeHistorySlot(slot);
  const value = BigInt(receipt64);
  Atomics.store(history64, index, value);
  return value;
}

export function readTetragrammatronReceipt(target, slot) {
  const history64 = historyView(target);
  return Atomics.load(history64, normalizeHistorySlot(slot));
}

export function snapshotTetragrammatronMemory(target, options = {}) {
  const memory = target?.i32 && target?.history64
    ? target
    : { i32: descriptorView(target), history64: target?.history64 ?? null };
  const history64 = target?.history64 instanceof BigInt64Array
    ? target.history64
    : target instanceof BigInt64Array
      ? target
      : memory.history64;

  const descriptors = Array.from(
    { length: TETRAGRAMMATRON_DESCRIPTOR_CELLS },
    (_, i) => Atomics.load(memory.i32, i)
  );

  const receiptSlots = options.receiptSlots ?? [
    Atomics.load(memory.i32, TETRA_DESCRIPTOR.CLAIMED_SLOT),
  ];
  const receipts = [];
  if (history64) {
    for (const rawSlot of receiptSlots) {
      const slot = normalizeHistorySlot(rawSlot);
      receipts.push({ slot, value: Atomics.load(history64, slot).toString() });
    }
  }

  return {
    descriptorBytes: TETRAGRAMMATRON_DESCRIPTOR_BYTES,
    historyBytes: TETRAGRAMMATRON_HISTORY_BYTES,
    descriptors,
    cursor: descriptors[TETRA_DESCRIPTOR.CURSOR],
    claimedSlot: descriptors[TETRA_DESCRIPTOR.CLAIMED_SLOT],
    slot5040: descriptors[TETRA_DESCRIPTOR.SLOT5040],
    local240: descriptors[TETRA_DESCRIPTOR.LOCAL240],
    receipts,
  };
}
