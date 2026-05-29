import test from "node:test";
import assert from "node:assert/strict";
import { OmiCentralInversionKernel } from "../src/omi/inversion-kernel.js";

test("16-bit Delta Law executes an exact period 8 rotation orbit cycle matching Prime 73 fields", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiCentralInversionKernel(sab);

  let state = 0x4321;
  const history = [state];

  for (let i = 0; i < 8; i++) {
    state = kernel.executeDeltaLawStep(state);
    history.push(state);
  }

  assert.equal(history[0], history[8], "Delta law must return to origin after 8 steps");
  assert.equal(kernel.PRIME_IDEAL, 73);
});

test("period 8 holds across multiple seeds", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiCentralInversionKernel(sab);

  for (const seed of [0x0000, 0xFFFF, 0x5A3C, 0x1234]) {
    let state = seed;
    for (let i = 0; i < 8; i++) state = kernel.executeDeltaLawStep(state);
    assert.equal(state, seed, `period 8 failed for seed 0x${seed.toString(16)}`);
  }
});

test("Central Inversion operator performs a fully reversible byte-level mirror flip", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiCentralInversionKernel(sab);

  const initial = 0x1234;
  const inverted = kernel.invertBitRegister(initial);
  const restored = kernel.invertBitRegister(inverted);

  assert.notEqual(inverted, initial);
  assert.equal(restored, initial);
});

test("OmiCentralInversionKernel verifies unescaped token addresses carrying the inverse gate", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiCentralInversionKernel(sab);

  const validToken = "\u03bf-ffff-127-0-0-1-0x02-0x5a3c-slot720-\u039f";
  const resultCell = kernel.parseInversionAddress(validToken);
  const header = kernel.car(resultCell);

  assert.equal(header.valid, true);
  assert.equal(header.hasCentralInversionGate, true);
  assert.equal(header.targetTimelineSlot, 720);
});

test("parseInversionAddress returns false for token without inversion gate", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiCentralInversionKernel(sab);

  const token = "\u03bf-ffff-127-0-0-1-0x02-slot720-\u039f";
  const header = kernel.car(kernel.parseInversionAddress(token));

  assert.equal(header.valid, true);
  assert.equal(header.hasCentralInversionGate, false);
});

test("parseInversionAddress returns error for empty token", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiCentralInversionKernel(sab);

  const header = kernel.car(kernel.parseInversionAddress(""));
  assert.equal(header.valid, false);
  assert.equal(header.error, "Empty Token");
});

test("parseInversionAddress CDR carries Float64Array when gate present", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiCentralInversionKernel(sab);

  const token = "\u03bf-ffff-127-0-0-1-0x02-0x5a3c-slot720-\u039f";
  const cdr = kernel.cdr(kernel.parseInversionAddress(token));

  assert.ok(cdr instanceof Float64Array);
  assert.equal(cdr[0], 0x5A3C);
});

test("cons/car/cdr cell primitives work on inversion kernel", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiCentralInversionKernel(sab);

  const cell = kernel.cons("mirror", 0x5A3C);
  assert.equal(kernel.car(cell), "mirror");
  assert.equal(kernel.cdr(cell), 0x5A3C);
});
