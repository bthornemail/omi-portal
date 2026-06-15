import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import {
  TETRA_DESCRIPTOR,
  createTetragrammatronMemory,
  writeDescriptor,
  claimTetragrammatronSlot,
  writeTetragrammatronReceipt,
  readTetragrammatronReceipt,
  snapshotTetragrammatronMemory,
} from "../src/omi/tetragrammatron-meta-memory.js";

import { QuquartMachine } from "../src/omi/ququart-machine.js";

const ROOT = process.cwd();
const BIN = join(ROOT, ".cache", "omi-metacompiler");
const SELF_DECL = "omi-docs/metacompiler/omi-metacompiler-self.omilisp";

function run(args) {
  const result = spawnSync(BIN, args, { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `omi-metacompiler ${args.join(" ")} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }
  return result.stdout;
}

function parseHexHash(h) {
  const clean = String(h).replace(/^0x/, "");
  return Number(BigInt("0x" + clean) & 0xffffffffn) >>> 0;
}

function admitCompilation(memory, compilation) {
  const sourceHash32 = parseHexHash(compilation.sourceHash);
  const normalizedHash32 = parseHexHash(compilation.normalizedHash);
  const tapeHash32 = parseHexHash(compilation.tapeHash);

  writeDescriptor(memory, TETRA_DESCRIPTOR.ACTIVE_PHASE, 1);
  writeDescriptor(memory, TETRA_DESCRIPTOR.STATUS, 1);
  writeDescriptor(memory, TETRA_DESCRIPTOR.RECEIPT_STATE, 1);
  writeDescriptor(memory, TETRA_DESCRIPTOR.BASE_Q, 0);
  writeDescriptor(memory, TETRA_DESCRIPTOR.FIBER_Q, 1);
  writeDescriptor(memory, TETRA_DESCRIPTOR.CHART11, 5);
  writeDescriptor(memory, TETRA_DESCRIPTOR.FANO7, sourceHash32 % 7);
  writeDescriptor(memory, TETRA_DESCRIPTOR.ROLE3, normalizedHash32 % 3);
  writeDescriptor(memory, TETRA_DESCRIPTOR.LOCAL240, tapeHash32 % 240);

  const slot = claimTetragrammatronSlot(memory, 0);

  const receipt64 = QuquartMachine.mix64(
    BigInt(sourceHash32) ^
    (BigInt(normalizedHash32) << 17n) ^
    (BigInt(tapeHash32) << 31n) ^
    BigInt(slot)
  );

  writeTetragrammatronReceipt(memory, slot, receipt64);
  const readback = readTetragrammatronReceipt(memory, slot);

  assert.equal(readback, receipt64, "receipt readback must match written value");

  return { sourceHash32, normalizedHash32, tapeHash32, slot, receipt64 };
}

assert.ok(existsSync(BIN), "build-omi-metacompiler must create .cache/omi-metacompiler");

const compilation = JSON.parse(run(["compile", SELF_DECL]));
assert.equal(compilation.source, SELF_DECL);
assert.ok(compilation.sourceHash, "compilation must include sourceHash");
assert.ok(compilation.normalizedHash, "compilation must include normalizedHash");
assert.ok(compilation.tapeHash, "compilation must include tapeHash");

const first = admitCompilation(createTetragrammatronMemory(), compilation);
const second = admitCompilation(createTetragrammatronMemory(), compilation);

assert.equal(
  first.receipt64,
  second.receipt64,
  "repeated admission with fresh memory must produce identical meta-memory receipt"
);

const thirdMemory = createTetragrammatronMemory();
const third = admitCompilation(thirdMemory, compilation);
const snapshot = snapshotTetragrammatronMemory(thirdMemory, {
  receiptSlots: [third.slot],
});
assert.equal(snapshot.local240, third.tapeHash32 % 240);
assert.equal(snapshot.claimedSlot, third.slot);
assert.equal(snapshot.receipts[0].value, third.receipt64.toString());

console.log("[omi-meta-memory-admission-proof] accepted");
