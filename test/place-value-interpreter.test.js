import test from "node:test";
import assert from "node:assert/strict";
import { OmiPlaceValueInterpreter } from "../src/omi/place-value-interpreter.js";

const SAB = new SharedArrayBuffer(5040 * 8);

function writeSlot(sab, slot, value) {
  new DataView(sab).setFloat64(slot * 8, value, true);
}

test("OmiPlaceValueInterpreter constructs with SAB", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  assert.ok(pv instanceof OmiPlaceValueInterpreter);
  assert.equal(pv.CANONICAL_ROOT, "omi-ffff-127-0-0-1");
});

test("constructor throws on undersized SAB", () => {
  assert.throws(() => new OmiPlaceValueInterpreter(new SharedArrayBuffer(16)), TypeError);
});

test("evaluateMaskDegree returns CONSTANT_US for no trigraph", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  const token = "omi-ffff-127-0-0-1-0x01-slot720";
  const cell = pv.evaluateMaskDegree(token);
  const h = pv.car(cell);
  assert.equal(h.valid, true);
  assert.equal(h.algebraicMetric.trigraphTallyCount, 0);
  assert.equal(h.algebraicMetric.activeMaskTerm, "CONSTANT_US");
  assert.equal(h.memoryTarget.absoluteSlotIndex, 720);
});

test("evaluateMaskDegree returns LINEAR_RS for one trigraph", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  const token = "omi-ffff-127-0-0-1-0x01-??--slot720";
  const cell = pv.evaluateMaskDegree(token);
  const h = pv.car(cell);
  assert.equal(h.valid, true);
  assert.equal(h.algebraicMetric.trigraphTallyCount, 1);
  assert.equal(h.algebraicMetric.activeMaskTerm, "LINEAR_RS");
});

test("evaluateMaskDegree returns QUADRATIC_GS for two trigraphs", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  const token = "omi-ffff-127-0-0-1-0x02-??-??--slot1440";
  const cell = pv.evaluateMaskDegree(token);
  const h = pv.car(cell);
  assert.equal(h.valid, true);
  assert.equal(h.algebraicMetric.trigraphTallyCount, 2);
  assert.equal(h.algebraicMetric.activeMaskTerm, "QUADRATIC_GS");
});

test("evaluateMaskDegree returns CUBIC_FS for three trigraphs", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  const token = "omi-ffff-127-0-0-1-0x04-??-??-??--slot1008";
  const cell = pv.evaluateMaskDegree(token);
  const h = pv.car(cell);
  assert.equal(h.valid, true);
  assert.equal(h.algebraicMetric.trigraphTallyCount, 3);
  assert.equal(h.algebraicMetric.activeMaskTerm, "CUBIC_FS");
});

test("evaluateMaskDegree rejects token with tally > 3", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  const token = "omi-ffff-127-0-0-1-0x04-??-??-??-??--slot5040";
  const cell = pv.evaluateMaskDegree(token);
  assert.equal(pv.car(cell).valid, false);
});

test("evaluateMaskDegree rejects non-root prefix", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  const token = "omi-0000-0-0-0-1-0x01-slot720";
  const cell = pv.evaluateMaskDegree(token);
  assert.equal(pv.car(cell).valid, false);
});

test("evaluateMaskDegree reads Float64 value from SAB slot", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  writeSlot(sab, 100, Math.PI);
  const pv = new OmiPlaceValueInterpreter(sab);
  const token = "omi-ffff-127-0-0-1-0x01-slot100";
  const cell = pv.evaluateMaskDegree(token);
  const payload = pv.cdr(cell);
  assert.ok(payload instanceof Float64Array);
  assert.equal(payload[0], Math.PI);
});

test("evaluateMaskDegree returns zero for unwritten slot", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  const token = "omi-ffff-127-0-0-1-0x01-slot999";
  const cell = pv.evaluateMaskDegree(token);
  const payload = pv.cdr(cell);
  assert.equal(payload[0], 0);
});

test("evaluateMaskDegree uses slot 0 when no slot token found", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  const token = "omi-ffff-127-0-0-1-0x01";
  const cell = pv.evaluateMaskDegree(token);
  assert.equal(pv.car(cell).valid, true);
  assert.equal(pv.car(cell).memoryTarget.absoluteSlotIndex, 0);
});

test("cons / car / cdr lisp primitives", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  const cell = pv.cons("a", "b");
  assert.equal(pv.car(cell), "a");
  assert.equal(pv.cdr(cell), "b");
});
