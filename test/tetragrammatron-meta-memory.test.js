import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TETRA_DESCRIPTOR,
  TETRAGRAMMATRON_DESCRIPTOR,
  TETRAGRAMMATRON_DESCRIPTOR_BYTES,
  TETRAGRAMMATRON_DESCRIPTOR_CELLS,
  TETRAGRAMMATRON_HISTORY_BYTES,
  TETRAGRAMMATRON_HISTORY_SLOTS,
  claimTetragrammatronSlot,
  createTetragrammatronMemory,
  readDescriptor,
  readTetragrammatronReceipt,
  snapshotTetragrammatronMemory,
  writeDescriptor,
  writeTetragrammatronReceipt,
} from "../src/omi/tetragrammatron-meta-memory.js";

describe("Tetragrammatron meta-memory: construction", () => {
  it("creates canonical descriptor and history buffers", () => {
    const memory = createTetragrammatronMemory();

    assert.equal(memory.descriptorBlock.byteLength, TETRAGRAMMATRON_DESCRIPTOR_BYTES);
    assert.equal(memory.historyBlock.byteLength, TETRAGRAMMATRON_HISTORY_BYTES);
    assert.equal(memory.f32.length, TETRAGRAMMATRON_DESCRIPTOR_CELLS);
    assert.equal(memory.i32.length, TETRAGRAMMATRON_DESCRIPTOR_CELLS);
    assert.equal(memory.u32.length, TETRAGRAMMATRON_DESCRIPTOR_CELLS);
    assert.equal(memory.dv.byteLength, TETRAGRAMMATRON_DESCRIPTOR_BYTES);
    assert.equal(memory.history64.length, TETRAGRAMMATRON_HISTORY_SLOTS);
  });

  it("initializes canonical descriptor defaults", () => {
    const memory = createTetragrammatronMemory({ workerCount: 3 });

    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.PROTOCOL_VERSION), 1);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.WORKER_COUNT), 3);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.LITTLE_ENDIAN), 1);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.PROMOTE_BOUNDARY), 720);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.HARD_RESET_BOUNDARY), 5040);
  });

  it("exposes frozen compact descriptor slot constants", () => {
    assert.equal(Object.isFrozen(TETRA_DESCRIPTOR), true);
    assert.equal(TETRA_DESCRIPTOR.VERSION, 0x01);
    assert.equal(TETRA_DESCRIPTOR.CURSOR, 0x0A);
    assert.equal(TETRA_DESCRIPTOR.ACTIVE_BACKEND, 0x04);
    assert.equal(TETRA_DESCRIPTOR.BASE_Q, 0x15);
    assert.equal(TETRAGRAMMATRON_DESCRIPTOR.PROTOCOL_VERSION, TETRA_DESCRIPTOR.VERSION);
  });

  it("can wrap caller-provided SharedArrayBuffers", () => {
    const descriptorBlock = new SharedArrayBuffer(TETRAGRAMMATRON_DESCRIPTOR_BYTES);
    const historyBlock = new SharedArrayBuffer(TETRAGRAMMATRON_HISTORY_BYTES);
    const memory = createTetragrammatronMemory({ descriptorBlock, historyBlock });

    assert.equal(memory.descriptorBlock, descriptorBlock);
    assert.equal(memory.historyBlock, historyBlock);
  });
});

describe("Tetragrammatron meta-memory: descriptor I/O", () => {
  it("reads and writes deterministic descriptor cells", () => {
    const memory = createTetragrammatronMemory();
    const value = writeDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.STATUS_WORD, 0x7c00);

    assert.equal(value, 0x7c00);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.STATUS_WORD), 0x7c00);
    assert.equal(readDescriptor(memory.i32, TETRAGRAMMATRON_DESCRIPTOR.STATUS_WORD), 0x7c00);
  });

  it("rejects descriptor indexes outside the 64-cell plane", () => {
    const memory = createTetragrammatronMemory();

    assert.throws(() => readDescriptor(memory, -1), RangeError);
    assert.throws(() => writeDescriptor(memory, 64, 1), RangeError);
  });
});

describe("Tetragrammatron meta-memory: slot claims", () => {
  it("atomically claims the current cursor slot and records worker state", () => {
    const memory = createTetragrammatronMemory();

    assert.equal(claimTetragrammatronSlot(memory, 7), 0);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.CURRENT_CURSOR), 1);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.CLAIMED_SLOT), 0);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.ACTIVE_BACKEND_ID), 7);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.SLOT5040), 0);

    assert.equal(claimTetragrammatronSlot(memory.i32, 8), 1);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.CLAIMED_SLOT), 1);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.ACTIVE_BACKEND_ID), 8);
  });

  it("wraps claims through the 5040-slot history plane", () => {
    const memory = createTetragrammatronMemory();
    writeDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.CURRENT_CURSOR, 5039);

    assert.equal(claimTetragrammatronSlot(memory, 1), 5039);
    assert.equal(claimTetragrammatronSlot(memory, 1), 0);
    assert.equal(readDescriptor(memory, TETRAGRAMMATRON_DESCRIPTOR.CURRENT_CURSOR), 5041);
  });
});

describe("Tetragrammatron meta-memory: receipts", () => {
  it("writes and reads BigInt64 receipts", () => {
    const memory = createTetragrammatronMemory();
    const receipt = 0x1234_5678_9abcn;

    assert.equal(writeTetragrammatronReceipt(memory, 42, receipt), receipt);
    assert.equal(readTetragrammatronReceipt(memory, 42), receipt);
    assert.equal(readTetragrammatronReceipt(memory.history64, 42), receipt);
  });

  it("normalizes receipt slots modulo 5040", () => {
    const memory = createTetragrammatronMemory();

    writeTetragrammatronReceipt(memory, 5040, 99n);
    writeTetragrammatronReceipt(memory, -1, 77n);

    assert.equal(readTetragrammatronReceipt(memory, 0), 99n);
    assert.equal(readTetragrammatronReceipt(memory, 5039), 77n);
  });
});

describe("Tetragrammatron meta-memory: snapshots", () => {
  it("returns a serializable descriptor and receipt sample", () => {
    const memory = createTetragrammatronMemory();
    const slot = claimTetragrammatronSlot(memory, 11);
    writeTetragrammatronReceipt(memory, slot, 123456789n);

    const snapshot = snapshotTetragrammatronMemory(memory);

    assert.equal(snapshot.descriptorBytes, TETRAGRAMMATRON_DESCRIPTOR_BYTES);
    assert.equal(snapshot.historyBytes, TETRAGRAMMATRON_HISTORY_BYTES);
    assert.equal(snapshot.descriptors.length, TETRAGRAMMATRON_DESCRIPTOR_CELLS);
    assert.equal(snapshot.descriptors[TETRA_DESCRIPTOR.VERSION], 1);
    assert.equal(snapshot.descriptors[TETRA_DESCRIPTOR.ACTIVE_BACKEND], 11);
    assert.equal(snapshot.cursor, 1);
    assert.equal(snapshot.claimedSlot, slot);
    assert.equal(snapshot.slot5040, slot);
    assert.equal(snapshot.local240, 0);
    assert.deepEqual(snapshot.receipts, [{ slot, value: "123456789" }]);
    assert.doesNotThrow(() => JSON.stringify(snapshot));
  });

  it("can sample explicit receipt slots", () => {
    const memory = createTetragrammatronMemory();
    writeTetragrammatronReceipt(memory, 5, 55n);
    writeTetragrammatronReceipt(memory, 6, 66n);

    const snapshot = snapshotTetragrammatronMemory(memory, { receiptSlots: [5, 6] });

    assert.deepEqual(snapshot.receipts, [
      { slot: 5, value: "55" },
      { slot: 6, value: "66" },
    ]);
  });
});
