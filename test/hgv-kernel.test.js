import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { OmiHgvKernel } from "../src/omi/hgv-kernel.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("HGV Kernel: 2-of-5 barycentric valid position 9 (11000)", () => {
  const kernel = new OmiHgvKernel();
  const result = kernel.evaluateBarycentric2of5(new Uint8Array([1, 1, 0, 0, 0]));
  assert.ok(result.valid);
  assert.equal(result.position, 9);
  assert.equal(result.canvasPresetColorId, "3");
});

test("HGV Kernel: 2-of-5 barycentric valid position 7 (10010)", () => {
  const kernel = new OmiHgvKernel();
  const result = kernel.evaluateBarycentric2of5(new Uint8Array([1, 0, 0, 1, 0]));
  assert.ok(result.valid);
  assert.equal(result.position, 7);
  assert.equal(result.canvasPresetColorId, "3");
});

test("HGV Kernel: 2-of-5 rejects invalid mask (3 ones)", () => {
  const kernel = new OmiHgvKernel();
  const result = kernel.evaluateBarycentric2of5(new Uint8Array([1, 1, 1, 0, 0]));
  assert.equal(result.valid, false);
  assert.equal(result.reason, "NOT_2OF5_BARYCENTRIC");
  assert.equal(result.canvasPresetColorId, "1");
});

test("HGV Kernel: 2-of-5 rejects dimension mismatch", () => {
  const kernel = new OmiHgvKernel();
  const result = kernel.evaluateBarycentric2of5(new Uint8Array([1, 1, 0]));
  assert.equal(result.valid, false);
  assert.equal(result.reason, "INPUT_DIMENSION_MISMATCH");
});

test("HGV Kernel: BCD allocation produces non-zero float for valid position", () => {
  const kernel = new OmiHgvKernel();
  const result = kernel.allocateBCD(new Uint8Array([1, 2, 3, 4, 5]), 2);
  assert.ok(result.bits !== 0);
  assert.ok(typeof result.floatValue === "number");
  assert.equal(result.canvasPresetColorId, "5");
});

test("HGV Kernel: BCD zero input maps to purple preset", () => {
  const kernel = new OmiHgvKernel();
  const result = kernel.allocateBCD(new Uint8Array([0, 0, 0, 0, 0]), 0);
  assert.equal(result.bits, 0);
  assert.equal(result.floatValue, 0);
  assert.equal(result.canvasPresetColorId, "6");
});

test("HGV Kernel: gauge coupling from layer9 to BCD allocates value", () => {
  const kernel = new OmiHgvKernel();
  const layer9 = kernel.evaluateBarycentric2of5(new Uint8Array([1, 0, 1, 0, 0]));
  const buf = new ArrayBuffer(4);
  const coupled = kernel.gaugeCoupling(layer9, buf);
  assert.ok(coupled.coupled);
  assert.ok(coupled.couplingStrength > 0);
});

test("HGV Kernel: gauge coupling invalid layer9 returns eviction", () => {
  const kernel = new OmiHgvKernel();
  const buf = new ArrayBuffer(4);
  const invalid = { valid: false, reason: "NOT_2OF5_BARYCENTRIC" };
  const coupled = kernel.gaugeCoupling(invalid, buf);
  assert.equal(coupled.coupled, false);
  assert.equal(coupled.reason, "LAYER9_INVALID_EVICTION");
});

test("HGV Kernel: full evaluateHgv completes pipeline", () => {
  const kernel = new OmiHgvKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const result = kernel.evaluateHgv(S, new Uint8Array([0, 0, 1, 1, 0]));
  assert.ok(result.accepted);
  assert.ok(result.layer9.valid);
  assert.ok(typeof result.layer10.floatValue === "number");
  assert.ok(typeof result.timelineSlot === "number");
});

test("HGV Kernel: evicts structurally invalid frames", () => {
  const kernel = new OmiHgvKernel();
  const S = parseOmiAddressToSegments("omi-0000-0000-0000-0000-0000-0000-0000-0000/48");
  const result = kernel.evaluateHgv(S, new Uint8Array([1, 1, 0, 0, 0]));
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});
