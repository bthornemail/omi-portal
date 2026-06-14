import {
  TETRA_DESCRIPTOR,
  claimTetragrammatronSlot,
  readDescriptor,
  readTetragrammatronReceipt,
  snapshotTetragrammatronMemory,
  writeDescriptor,
} from "./tetragrammatron-meta-memory.js";

const STATUS_LABELS = Object.freeze(["passed", "failed", "running", "candidate"]);
const RECEIPT_LABELS = Object.freeze(["candidate", "accepted", "rejected"]);

function receiptStateFromCode(code, errorCode = 0) {
  if (Number(errorCode) !== 0) return "rejected";
  return RECEIPT_LABELS[Number(code)] ?? "candidate";
}

function statusFromCode(code) {
  return STATUS_LABELS[Number(code)] ?? "candidate";
}

function readDescriptorCell(memory, cell) {
  return readDescriptor(memory, cell);
}

export function readCurrentDescriptor(memory) {
  const descriptor = {
    version: readDescriptorCell(memory, TETRA_DESCRIPTOR.VERSION),
    workerCount: readDescriptorCell(memory, TETRA_DESCRIPTOR.WORKER_COUNT),
    littleEndian: readDescriptorCell(memory, TETRA_DESCRIPTOR.LITTLE_ENDIAN),
    activeBackend: readDescriptorCell(memory, TETRA_DESCRIPTOR.ACTIVE_BACKEND),
    activePhase: readDescriptorCell(memory, TETRA_DESCRIPTOR.ACTIVE_PHASE),
    polybiusRow: readDescriptorCell(memory, TETRA_DESCRIPTOR.POLYBIUS_ROW),
    polybiusCol: readDescriptorCell(memory, TETRA_DESCRIPTOR.POLYBIUS_COL),
    statusCode: readDescriptorCell(memory, TETRA_DESCRIPTOR.STATUS),
    payloadView: readDescriptorCell(memory, TETRA_DESCRIPTOR.PAYLOAD_VIEW),
    cursor: readDescriptorCell(memory, TETRA_DESCRIPTOR.CURSOR),
    claimedSlot: readDescriptorCell(memory, TETRA_DESCRIPTOR.CLAIMED_SLOT),
    writeLock: readDescriptorCell(memory, TETRA_DESCRIPTOR.WRITE_LOCK),
    readLock: readDescriptorCell(memory, TETRA_DESCRIPTOR.READ_LOCK),
    errorCode: readDescriptorCell(memory, TETRA_DESCRIPTOR.ERROR_CODE),
    receiptCode: readDescriptorCell(memory, TETRA_DESCRIPTOR.RECEIPT_STATE),
    local240: readDescriptorCell(memory, TETRA_DESCRIPTOR.LOCAL240),
    slot5040: readDescriptorCell(memory, TETRA_DESCRIPTOR.SLOT5040),
    chart11: readDescriptorCell(memory, TETRA_DESCRIPTOR.CHART11),
    baseQ: readDescriptorCell(memory, TETRA_DESCRIPTOR.BASE_Q),
    fiberQ: readDescriptorCell(memory, TETRA_DESCRIPTOR.FIBER_Q),
    fano7: readDescriptorCell(memory, TETRA_DESCRIPTOR.FANO7),
    role3: readDescriptorCell(memory, TETRA_DESCRIPTOR.ROLE3),
  };

  return Object.freeze({
    ...descriptor,
    status: statusFromCode(descriptor.statusCode),
    receiptState: receiptStateFromCode(descriptor.receiptCode, descriptor.errorCode),
  });
}

export function claimFrameSlot(memory, workerId = 0) {
  const routedSlot = readDescriptor(memory, TETRA_DESCRIPTOR.SLOT5040);
  writeDescriptor(memory, TETRA_DESCRIPTOR.CURSOR, routedSlot);
  return claimTetragrammatronSlot(memory, workerId);
}

export function readClaimedReceipt(memory, slot = readDescriptor(memory, TETRA_DESCRIPTOR.CLAIMED_SLOT)) {
  const receipt64 = readTetragrammatronReceipt(memory, slot);
  return Object.freeze({
    slot,
    receipt64,
    receipt: receipt64.toString(),
    empty: receipt64 === 0n,
  });
}

export function createBackendEvent(memory, options = {}) {
  const descriptor = options.descriptor ?? readCurrentDescriptor(memory);
  const receipt = options.receipt ?? readClaimedReceipt(memory, descriptor.claimedSlot);
  const event = {
    type: "tetragrammatron-backend-event",
    backendId: Number(options.backendId ?? descriptor.activeBackend) | 0,
    workerId: Number(options.workerId ?? descriptor.activeBackend) | 0,
    slot: receipt.slot,
    receipt: receipt.receipt,
    receiptState: descriptor.receiptState,
    status: descriptor.status,
    route: {
      phase: descriptor.activePhase,
      polybiusRow: descriptor.polybiusRow,
      polybiusCol: descriptor.polybiusCol,
      local240: descriptor.local240,
      slot5040: descriptor.slot5040,
      chart11: descriptor.chart11,
      baseQ: descriptor.baseQ,
      fiberQ: descriptor.fiberQ,
      fano7: descriptor.fano7,
      role3: descriptor.role3,
    },
    timestamp: Number(options.timestamp ?? Date.now()),
  };
  return Object.freeze(event);
}

export function emitBackendEvent(memory, options = {}) {
  const event = createBackendEvent(memory, options);
  if (typeof options.emit === "function") options.emit(event);
  if (typeof options.dispatchEvent === "function") options.dispatchEvent(event);
  return event;
}

export function workerRuntimeTick(memory, options = {}) {
  const workerId = Number(options.workerId ?? 0) | 0;
  const before = readCurrentDescriptor(memory);
  const claimedSlot = claimFrameSlot(memory, workerId);
  const after = readCurrentDescriptor(memory);
  const receipt = readClaimedReceipt(memory, claimedSlot);
  const event = emitBackendEvent(memory, {
    ...options,
    workerId,
    descriptor: after,
    receipt,
  });
  const snapshot = snapshotTetragrammatronMemory(memory, { receiptSlots: [claimedSlot] });

  return Object.freeze({
    state: after.receiptState,
    accepted: after.receiptState === "accepted",
    candidate: after.receiptState === "candidate",
    rejected: after.receiptState === "rejected",
    workerId,
    claimedSlot,
    before,
    descriptor: after,
    receipt,
    event,
    snapshot,
  });
}
