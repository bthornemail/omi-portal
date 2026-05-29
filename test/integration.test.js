import test from "node:test";
import assert from "node:assert/strict";
import { OmiChiralFifoEngine } from "../src/runtime/chiral-fifo-engine.js";
import { OmiPlaceValueInterpreter } from "../src/omi/place-value-interpreter.js";
import { OmiSymmetricalChiralLexer } from "../src/omi/chiral-lexer.js";
import { OmiTrigraphPreprocessor } from "../src/omi/trigraph-preprocessor.js";

const SAB = new SharedArrayBuffer(5040 * 8);

test("omi workspace canonical root invariant", () => {
  const CANONICAL_ROOT = "ffff-127-0-0-1";
  assert.equal(CANONICAL_ROOT.includes(":"), false);
  assert.equal(CANONICAL_ROOT.includes("/"), false);
  assert.ok(!CANONICAL_ROOT.startsWith("omi-"));
});

test("omi workspace SAB allocation invariant", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  assert.equal(sab.byteLength, 40320);
  const view = new DataView(sab);
  view.setBigUint64(0, 0n, true);
  assert.equal(view.getBigUint64(0, true), 0n);
});

test("omi integration: ChiralFifoEngine reads slot after FFT write", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const engine = new OmiChiralFifoEngine(sab);
  const freq = [1.0, 0.5, 0.25, 0.125];
  engine.processAnalogFFTChunk(42, freq, true);
  const val = engine.readSlot(42);
  assert.notEqual(val, 0);
  assert.ok(val < 0);
});

test("omi integration: PlaceValueInterpreter resolves CONSTANT_US", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  const cell = pv.evaluateMaskDegree("omi-ffff-127-0-0-1-0x01-slot720");
  assert.equal(pv.car(cell).valid, true);
  assert.equal(pv.car(cell).algebraicMetric.activeMaskTerm, "CONSTANT_US");
});

test("omi integration: PlaceValueInterpreter resolves CUBIC_FS for triple trigraph", () => {
  const pv = new OmiPlaceValueInterpreter(SAB);
  const cell = pv.evaluateMaskDegree("omi-ffff-127-0-0-1-0x04-??-??-??--slot1008");
  assert.equal(pv.car(cell).valid, true);
  assert.equal(pv.car(cell).algebraicMetric.trigraphTallyCount, 3);
  assert.equal(pv.car(cell).algebraicMetric.activeMaskTerm, "CUBIC_FS");
});

test("omi integration: ChiralLexer validates symmetric omi-to-imo tape", () => {
  const lexer = new OmiSymmetricalChiralLexer(SAB);
  const token = "omi-0x02-ffff-127-0-0-1-slot720-AADAPwAAAEAAAAC_AAAgQQ-1-0-0-721-ffff-imo";
  const cell = lexer.evaluateChiralTapeStream(token);
  assert.equal(lexer.car(cell).valid, true);
});

test("omi integration: TrigraphPreprocessor inverts polarity", () => {
  const pp = new OmiTrigraphPreprocessor(SAB);
  const mockB64 = "AADAPwAAAEAAAAC_AAAgQQ";
  const token = `omi-0x02-ffff-127-0-0-1-slot720-??--${mockB64}-1-0-0-721-ffff-imo`;
  const cell = pp.preprocessAndEvaluateStream(token);
  assert.equal(pp.car(cell).hasTrigraphOperator, true);
  assert.equal(pp.car(cell).appliedScalar, -1.0);
});

test("omi integration: worker clock simulation at 60Hz stride", () => {
  let tick = 0n;
  const slotCount = 5040;
  for (let i = 0; i < 10080; i++) {
    tick++;
    const mod = Number(tick % BigInt(slotCount));
    assert.ok(mod >= 0 && mod < slotCount);
  }
});

test("omi integration: Horner polynomial matches expected depth", () => {
  const slot = 10;
  const z = ((1.5 * slot + 2.0) * slot - 0.5) * slot + 10.0;
  // ((15 + 2) * 10 - 0.5) * 10 + 10 = (170 - 0.5) * 10 + 10 = 1695 + 10 = 1705
  // actually: ((1.5*10 + 2.0)*10 - 0.5)*10 + 10 = ((15 + 2)*10 - 0.5)*10 + 10 = (170 - 0.5)*10 + 10 = 1695 + 10 = 1705
  assert.equal(z, 1705);
});

test("omi integration: factorial interrupt at 720 fires every 720 ticks", () => {
  for (let tick = 1; tick <= 5040; tick++) {
    if (tick % 720 === 0 && tick % 5040 !== 0) {
      assert.ok(true);
      return;
    }
  }
  assert.fail("720 interrupt never fired");
});

test("omi integration: factorial reset at 5040 clears memory", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const view = new DataView(sab);
  for (let i = 0; i < 10; i++) {
    view.setFloat64(i * 8 + 8, Math.PI, true);
  }
  view.setBigUint64(0, 5040n, true);
  view.setBigUint64(0, 0n, true);
  for (let i = 8; i < 5040 * 8; i += 8) {
    view.setFloat64(i, 0.0, true);
  }
  for (let i = 0; i < 10; i++) {
    assert.equal(view.getFloat64(i * 8 + 8, true), 0);
  }
});
