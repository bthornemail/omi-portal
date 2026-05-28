import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { OmiChiralFifoEngine } from "../src/runtime/chiral-fifo-engine.js";

function makeSAB() {
  return new SharedArrayBuffer(5040 * 8);
}

test("OmiChiralFifoEngine constructs with SAB", () => {
  const sab = makeSAB();
  const engine = new OmiChiralFifoEngine(sab);
  assert.ok(engine instanceof OmiChiralFifoEngine);
  assert.equal(engine.PIPE_PATH_LEFT, "/tmp/omi-bus/chiral_left.fifo");
  assert.equal(engine.PIPE_PATH_RIGHT, "/tmp/omi-bus/chiral_right.fifo");
});

test("constructor throws on undersized SAB", () => {
  assert.throws(() => new OmiChiralFifoEngine(new SharedArrayBuffer(16)), TypeError);
});

test("processAnalogFFTChunk stores left-chiral value at slot 0", () => {
  const sab = makeSAB();
  const engine = new OmiChiralFifoEngine(sab);
  const freq = [1.0, 0.5, 0.25, 0.125];
  const result = engine.processAnalogFFTChunk(0, freq, true);
  assert.ok(result);
  assert.equal(result.car.targetSlotIndex, 0);
  assert.equal(result.car.isLeftChiral, true);
  assert.ok(result.car.id.includes("archimedean-snub"));
  assert.ok(result.car.id.startsWith("omi-ffff-127-0-0-1-0x02"));
  // Left-chiral negates the phase energy
  const val = engine.readSlot(0);
  assert.ok(val < 0);
});

test("processAnalogFFTChunk stores right-chiral value at slot 1", () => {
  const sab = makeSAB();
  const engine = new OmiChiralFifoEngine(sab);
  const freq = [1.0, 0.5, 0.25, 0.125];
  const result = engine.processAnalogFFTChunk(1, freq, false);
  assert.ok(result);
  assert.equal(result.car.targetSlotIndex, 1);
  assert.equal(result.car.isLeftChiral, false);
  assert.ok(result.car.id.includes("catalan-dual"));
  assert.ok(result.car.id.startsWith("omi-ffff-127-0-0-1-0x04"));
  const val = engine.readSlot(1);
  assert.ok(val > 0);
});

test("processAnalogFFTChunk returns null for out-of-range slot", () => {
  const sab = makeSAB();
  const engine = new OmiChiralFifoEngine(sab);
  assert.equal(engine.processAnalogFFTChunk(-1, [1.0]), null);
  assert.equal(engine.processAnalogFFTChunk(5040, [1.0]), null);
});

test("readSlot returns correct stored values", () => {
  const sab = makeSAB();
  const engine = new OmiChiralFifoEngine(sab);
  engine.view.setFloat64(16, Math.PI, true);
  assert.equal(engine.readSlot(2), Math.PI);
  assert.equal(engine.readSlot(-1), null);
  assert.equal(engine.readSlot(5040), null);
});

test("cons / car / cdr Lisp primitives work", () => {
  const sab = makeSAB();
  const engine = new OmiChiralFifoEngine(sab);
  const cell = engine.cons("a", "b");
  assert.equal(engine.car(cell), "a");
  assert.equal(engine.cdr(cell), "b");
});

test("initNamedPipes creates FIFO files", async () => {
  const sab = makeSAB();
  const engine = new OmiChiralFifoEngine(sab);
  await engine.initNamedPipes();
  assert.ok(fs.existsSync(engine.PIPE_PATH_LEFT));
  assert.ok(fs.existsSync(engine.PIPE_PATH_RIGHT));
});

test("processAnalogFFTChunk accumulates phase energy from shorter arrays", () => {
  const sab = makeSAB();
  const engine = new OmiChiralFifoEngine(sab);
  // Only 2 frequency values
  const freq = [0.5, 1.0];
  const result = engine.processAnalogFFTChunk(100, freq, false);
  assert.ok(result);
  const expected = 0.5 * Math.sin(Math.PI / 4) + 1.0 * Math.sin(2 * Math.PI / 4);
  assert.equal(engine.readSlot(100), expected);
});

test("left vs right chiral produce opposite signs for same input", () => {
  const sab = makeSAB();
  const engine = new OmiChiralFifoEngine(sab);
  const freq = [2.0, 1.0, 0.5, 0.25];
  engine.processAnalogFFTChunk(10, freq, true);
  engine.processAnalogFFTChunk(11, freq, false);
  const left = engine.readSlot(10);
  const right = engine.readSlot(11);
  assert.equal(left, -right);
});
