import test from "node:test";
import assert from "node:assert/strict";
import { OmiTrigraphPreprocessor } from "../src/omi/trigraph-preprocessor.js";

const SAB = new SharedArrayBuffer(5040 * 8);

test("OmiTrigraphPreprocessor constructs with SAB", () => {
  const pp = new OmiTrigraphPreprocessor(SAB);
  assert.ok(pp instanceof OmiTrigraphPreprocessor);
  assert.equal(pp.CANONICAL_ROOT, "ffff-127-0-0-1");
});

test("preprocessAndEvaluateStream returns valid for clean symmetric tape", () => {
  const pp = new OmiTrigraphPreprocessor(SAB);
  const mockB64 = "AADAPwAAAEAAAAC_AAAgQQ";
  const token = `omi-0x02-ffff-127-0-0-1-slot720-${mockB64}-1-0-0-721-ffff-imo`;
  const cell = pp.preprocessAndEvaluateStream(token);
  const header = pp.car(cell);
  const payload = pp.cdr(cell);
  assert.equal(header.valid, true);
  assert.equal(header.hasTrigraphOperator, false);
  assert.equal(header.appliedScalar, 1.0);
  assert.ok(payload instanceof Float32Array);
});

test("preprocessAndEvaluateStream inverts payload with ??- trigraph", () => {
  const pp = new OmiTrigraphPreprocessor(SAB);
  const mockB64 = "AACAPwAAgD8AAAAAAAAA";
  const token = `omi-0x02-ffff-127-0-0-1-slot720-??--${mockB64}-1-0-0-721-ffff-imo`;
  const cell = pp.preprocessAndEvaluateStream(token);
  const header = pp.car(cell);
  const payload = pp.cdr(cell);
  assert.equal(header.valid, true);
  assert.equal(header.hasTrigraphOperator, true);
  assert.equal(header.appliedScalar, -1.0);
  assert.ok(payload instanceof Float32Array);
  for (let i = 0; i < payload.length; i++) {
    assert.ok(payload[i] <= 0);
  }
});

test("preprocessAndEvaluateStream returns invalid for null input", () => {
  const pp = new OmiTrigraphPreprocessor(SAB);
  const cell = pp.preprocessAndEvaluateStream(null);
  assert.equal(pp.car(cell).valid, false);
});

test("trigraph toggles polarity from positive to negative", () => {
  const pp = new OmiTrigraphPreprocessor(SAB);
  const mockB64 = "AACAPwAAgD8AAAAAAAAA";
  const base = `omi-0x02-ffff-127-0-0-1-slot720-${mockB64}-1-0-0-721-ffff-imo`;
  const trig = `omi-0x02-ffff-127-0-0-1-slot720-??--${mockB64}-1-0-0-721-ffff-imo`;

  const baseCell = pp.preprocessAndEvaluateStream(base);
  const trigCell = pp.preprocessAndEvaluateStream(trig);
  const basePayload = pp.cdr(baseCell);
  const trigPayload = pp.cdr(trigCell);

  assert.notDeepEqual(basePayload, trigPayload);
  for (let i = 0; i < basePayload.length; i++) {
    assert.equal(basePayload[i], -trigPayload[i]);
  }
});

test("cons / car / cdr lisp primitives", () => {
  const pp = new OmiTrigraphPreprocessor(SAB);
  const cell = pp.cons("x", "y");
  assert.equal(pp.car(cell), "x");
  assert.equal(pp.cdr(cell), "y");
});
