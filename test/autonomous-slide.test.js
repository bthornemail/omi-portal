import test from "node:test";
import assert from "node:assert/strict";
import {
  AutonomousSlideEngine,
  add4Forward,
  emitSlideTelemetry,
  formatSlideTelemetry,
  gamma32,
  makeOmiCell,
  ringMask,
  rotl32,
  rotr32,
  stepOmiCell
} from "../src/omi/autonomous-slide.js";

test("ringMask maps four bounded ququart surfaces", () => {
  assert.equal(ringMask(0), 0x0000000f);
  assert.equal(ringMask(1), 0x000000ff);
  assert.equal(ringMask(2), 0x0000ffff);
  assert.equal(ringMask(3), 0xffffffff);
  assert.equal(ringMask(7), 0xffffffff);
});

test("rotl32 and rotr32 are deterministic unsigned rotations", () => {
  assert.equal(rotl32(0x80000001, 1), 0x00000003);
  assert.equal(rotr32(0x80000001, 1), 0xc0000000);
  assert.equal(rotl32(0x12345678, 0), 0x12345678);
  assert.equal(rotr32(0x12345678, 0), 0x12345678);
});

test("add4Forward performs inspectable 32-bit full-adder carry routing", () => {
  const wrapped = add4Forward(0xffffffff, 0x00000001);
  assert.equal(wrapped.out, 0x00000000);
  assert.equal(wrapped.carry, 1);

  const simple = add4Forward(0x00000020, 0x00000001);
  assert.equal(simple.out, 0x00000021);
  assert.equal(simple.carry, 0);
});

test("gamma32 mixes by rotations, fold constant, and XOR only", () => {
  const a = gamma32(0xffffffff, 0xffffffff, 0x00000000, 0x00000000);
  const b = gamma32(0xffffffff, 0xffffffff, 0x00000000, 0x00000000);
  assert.deepEqual(a, b);
  assert.equal(a.result, 0x30000020);
  assert.equal(a.carry, 0);
});

test("stepOmiCell commits non-zero deltas and reports ring residue", () => {
  const cell = makeOmiCell(0, 1, 2, 0);
  const next = stepOmiCell(cell, 0, 0, 0, 1);
  assert.equal(next.mask, 0x0000000f);
  assert.equal(next.newWord, 1);
  assert.equal(next.delta, 1);
  assert.equal(next.oldWord, 1);
  assert.equal(next.suboptimal, 1);
});

test("formatSlideTelemetry matches QED record layout", () => {
  const cell = stepOmiCell(makeOmiCell(3, 4, 5, 1), 0, 0, 0, 1);
  const telemetry = formatSlideTelemetry(cell);
  assert.equal(
    telemetry,
    "QED slot=3 port=4 pipe=5 ring=1 mask=0x000000FF old=0x00000000 new=0x00000021 delta=0x00000021 carry=0 surrogate=0 suboptimal=1"
  );
  assert.equal(emitSlideTelemetry(cell), telemetry);
});

test("AutonomousSlideEngine class facade mirrors function exports", () => {
  const cell = AutonomousSlideEngine.makeCell(1, 2, 3, 2);
  const next = AutonomousSlideEngine.stepCell(cell, 0, 0, 0, 0);
  assert.equal(AutonomousSlideEngine.getRingMask(2), 0x0000ffff);
  assert.equal(AutonomousSlideEngine.formatTelemetry(next), formatSlideTelemetry(next));
});
