import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  modemFrameToMemory,
  modemFrameToOWord,
  modemRoundTripToGeometryReceipts,
} from "../src/omi/tetragrammatron-modem.js";
import {
  TETRA_DESCRIPTOR,
  createTetragrammatronMemory,
  writeDescriptor,
} from "../src/omi/tetragrammatron-meta-memory.js";
import {
  claimFrameSlot,
  createBackendEvent,
  emitBackendEvent,
  readClaimedReceipt,
  readCurrentDescriptor,
  workerRuntimeTick,
} from "../src/omi/tetragrammatron-worker-runtime.js";

const SAMPLE_OUTPUT = [
  "▶ Worker runtime",
  "  ✔ accepted route writes memory (0.42ms)",
  "  ✖ rejected route remains candidate (0.21ms)",
].join("\n");

function preparedMemory(frameIndex = 0) {
  const memory = createTetragrammatronMemory();
  const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
  const frame = result.frames[frameIndex];
  modemFrameToMemory(memory, frame, { workerId: 3 });
  return { memory, frame };
}

describe("Tetragrammatron worker runtime", () => {
  it("reads the current descriptor as a backend-friendly object", () => {
    const { memory, frame } = preparedMemory(1);
    const descriptor = readCurrentDescriptor(memory);

    assert.equal(descriptor.version, 1);
    assert.equal(descriptor.activeBackend, 3);
    assert.equal(descriptor.slot5040, frame.slot5040);
    assert.equal(descriptor.local240, frame.local240);
    assert.equal(descriptor.baseQ, frame.baseQ);
    assert.equal(descriptor.fiberQ, frame.fiberQ);
    assert.equal(descriptor.status, "passed");
    assert.equal(descriptor.receiptState, "accepted");
    assert.equal(Object.isFrozen(descriptor), true);
  });

  it("claims the routed frame slot instead of the incidental next cursor", () => {
    const { memory, frame } = preparedMemory(1);
    writeDescriptor(memory, TETRA_DESCRIPTOR.CURSOR, 1234);

    const claimed = claimFrameSlot(memory, 9);
    const descriptor = readCurrentDescriptor(memory);

    assert.equal(claimed, frame.slot5040);
    assert.equal(descriptor.claimedSlot, frame.slot5040);
    assert.equal(descriptor.slot5040, frame.slot5040);
    assert.equal(descriptor.cursor, frame.slot5040 + 1);
    assert.equal(descriptor.activeBackend, 9);
  });

  it("reads the claimed .o receipt from history", () => {
    const { memory, frame } = preparedMemory(1);
    const word = modemFrameToOWord(frame);
    const expectedReceipt = BigInt.asIntN(64, word & ((1n << 64n) - 1n));

    const receipt = readClaimedReceipt(memory, frame.slot5040);

    assert.equal(receipt.slot, frame.slot5040);
    assert.equal(receipt.receipt64, expectedReceipt);
    assert.equal(receipt.receipt, expectedReceipt.toString());
    assert.equal(receipt.empty, false);
    assert.equal(Object.isFrozen(receipt), true);
  });

  it("creates and emits a backend event", () => {
    const { memory, frame } = preparedMemory(1);
    const descriptor = readCurrentDescriptor(memory);
    const receipt = readClaimedReceipt(memory, frame.slot5040);
    const emitted = [];

    const event = emitBackendEvent(memory, {
      descriptor,
      receipt,
      workerId: 44,
      backendId: 45,
      timestamp: 123,
      emit: (ev) => emitted.push(ev),
    });

    assert.equal(event.type, "tetragrammatron-backend-event");
    assert.equal(event.workerId, 44);
    assert.equal(event.backendId, 45);
    assert.equal(event.slot, frame.slot5040);
    assert.equal(event.receiptState, "accepted");
    assert.equal(event.status, "passed");
    assert.equal(event.route.slot5040, frame.slot5040);
    assert.equal(event.timestamp, 123);
    assert.deepEqual(emitted, [event]);
    assert.equal(Object.isFrozen(event), true);
  });

  it("workerRuntimeTick returns accepted for an accepted receipt frame", () => {
    const { memory, frame } = preparedMemory(1);
    writeDescriptor(memory, TETRA_DESCRIPTOR.CURSOR, 17);
    const events = [];

    const result = workerRuntimeTick(memory, {
      workerId: 77,
      timestamp: 456,
      emit: (event) => events.push(event),
    });

    assert.equal(result.state, "accepted");
    assert.equal(result.accepted, true);
    assert.equal(result.candidate, false);
    assert.equal(result.rejected, false);
    assert.equal(result.claimedSlot, frame.slot5040);
    assert.equal(result.descriptor.activeBackend, 77);
    assert.equal(result.event.slot, frame.slot5040);
    assert.equal(result.snapshot.receipts[0].slot, frame.slot5040);
    assert.equal(events.length, 1);
    assert.doesNotThrow(() => JSON.stringify(result.snapshot));
  });

  it("workerRuntimeTick returns candidate for candidate receipt frames", () => {
    const { memory, frame } = preparedMemory(2);
    const result = workerRuntimeTick(memory, { workerId: 5, timestamp: 789 });

    assert.equal(frame.event.status, "failed");
    assert.equal(result.state, "candidate");
    assert.equal(result.accepted, false);
    assert.equal(result.candidate, true);
    assert.equal(result.rejected, false);
    assert.equal(result.event.status, "failed");
    assert.equal(result.event.receiptState, "candidate");
  });

  it("workerRuntimeTick returns rejected when descriptor error code is set", () => {
    const { memory } = preparedMemory(1);
    writeDescriptor(memory, TETRA_DESCRIPTOR.ERROR_CODE, 0x8b);

    const result = workerRuntimeTick(memory, { workerId: 6 });

    assert.equal(result.state, "rejected");
    assert.equal(result.accepted, false);
    assert.equal(result.candidate, false);
    assert.equal(result.rejected, true);
    assert.equal(result.event.receiptState, "rejected");
  });

  it("createBackendEvent can be used directly without dispatch", () => {
    const { memory, frame } = preparedMemory(1);
    const event = createBackendEvent(memory, { timestamp: 999 });

    assert.equal(event.slot, frame.slot5040);
    assert.equal(event.route.local240, frame.local240);
    assert.equal(event.timestamp, 999);
  });
});
