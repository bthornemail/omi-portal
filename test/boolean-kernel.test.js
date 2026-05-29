import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OmiBooleanKernelEngine } from "../src/omi/boolean-kernel.js";

describe("OmiBooleanKernelEngine", () => {
  it("constructs with SAB", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    assert.ok(engine);
    assert.equal(engine.BYTE_TRUE, 0x03);
    assert.equal(engine.BYTE_FALSE, 0xBF);
    assert.equal(engine.UNICODE_OMICRON, "\u03bf");
  });

  it("validates true-byte token (0x03 high byte)", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    const mockB64 = "AADAPwAAAEAAAAC_AAAgQQ";
    const token = `\u03bf-0x03-ffff-127-0-0-1-slot720-??--${mockB64}-\u03bf-imo`;
    const cell = engine.evaluateBooleanTapeStream(token);
    const header = engine.car(cell);
    assert.ok(header.valid);
    assert.equal(header.truthTable.extractedHighByte, 0x03);
    assert.equal(header.truthTable.extractedLowByte, 0xBF);
    assert.ok(header.truthTable.isHighByteTrue);
    assert.ok(header.truthTable.isLowByteFalse);
    assert.equal(header.evaluation.opcodeInt, 0x03);
    assert.equal(header.evaluation.polynomialOrderDegree, 1);
    assert.ok(header.evaluation.hasPhaseInversion);
    assert.equal(header.metadata.addressSubnet, "ffff-127-0-0-1");
    assert.equal(header.metadata.timelineSlot, "slot720");
  });

  it("validates false-bound token with Degree 3 trigraph mask", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    const mockB64 = "AADAPwAAAEAAAAC_AAAgQQ";
    const token = `\u03bf-0x01-ffff-127-0-0-1-slot1440-??-??-??--${mockB64}-\u03bf-imo`;
    const cell = engine.evaluateBooleanTapeStream(token);
    const header = engine.car(cell);
    assert.ok(header.valid);
    assert.equal(header.truthTable.extractedHighByte, 0x03);
    assert.equal(header.truthTable.extractedLowByte, 0xBF);
    assert.equal(header.evaluation.polynomialOrderDegree, 3);
    assert.equal(header.metadata.timelineSlot, "slot1440");
  });

  it("rejects non-omicron prefix", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    const token = "omi-0x03-ffff-127-0-0-1-slot720-\u03bf-imo";
    const cell = engine.evaluateBooleanTapeStream(token);
    const header = engine.car(cell);
    assert.equal(header.valid, false);
    assert.equal(header.error, "Missing U+03BF Invariant Prefix Code");
  });

  it("rejects missing imo suffix", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    const token = "\u03bf-0x03-ffff-127-0-0-1-slot720";
    const cell = engine.evaluateBooleanTapeStream(token);
    const header = engine.car(cell);
    assert.equal(header.valid, false);
  });

  it("rejects non-local address", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    const token = "\u03bf-0x03-c0a8-0001-0001-slot720-\u03bf-imo";
    const cell = engine.evaluateBooleanTapeStream(token);
    const header = engine.car(cell);
    assert.equal(header.valid, false);
  });

  it("extracts truth table from omicron code point", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    const token = `\u03bf-0x01-ffff-127-0-0-1-slot0-\u03bf-imo`;
    const cell = engine.evaluateBooleanTapeStream(token);
    const header = engine.car(cell);
    assert.ok(header.valid);
    assert.equal(header.truthTable.extractedHighByte, 0x03);
    assert.equal(header.truthTable.extractedLowByte, 0xBF);
  });

  it("delta law returns to origin after 8 steps", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    let state = 0x1234;
    for (let i = 0; i < 8; i++) {
      state = engine.executeDeltaLawStep(state);
    }
    assert.equal(state, 0x1234);
  });

  it("delta law produces different intermediate states", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    let state = 0x1234;
    const history = [state];
    for (let i = 0; i < 7; i++) {
      state = engine.executeDeltaLawStep(state);
      history.push(state);
    }
    const unique = new Set(history);
    assert.ok(unique.size > 1, "should produce multiple distinct intermediate values");
  });

  it("delta law self-corrects period 8 for different seeds", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    for (const seed of [0x0000, 0xFFFF, 0x1234, 0x5A3C]) {
      let state = seed;
      for (let i = 0; i < 8; i++) {
        state = engine.executeDeltaLawStep(state);
      }
      assert.equal(state, seed, `seed 0x${seed.toString(16)} should return after 8 steps`);
    }
  });

  it("cons/car/cdr lisp primitives", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    const cell = engine.cons({ a: 1 }, { b: 2 });
    assert.deepEqual(engine.car(cell), { a: 1 });
    assert.deepEqual(engine.cdr(cell), { b: 2 });
  });

  it("decodePayloadBits produces Float32Array from base64", () => {
    const sab = new SharedArrayBuffer(5040 * 8);
    const engine = new OmiBooleanKernelEngine(sab);
    const b64 = "AADAPwAAAEAAAAC_AAAgQQ";
    const result = engine.decodePayloadBits(b64);
    assert.ok(result instanceof Float32Array);
    assert.equal(result.length, 4);
    assert.equal(Math.round(result[0] * 10) / 10, 1.5);
    assert.equal(result[1], 2.0);
    assert.equal(result[2], -0.5);
    assert.equal(result[3], 10.0);
  });
});
