import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { OmiOctonionFanoKernel } from "../src/omi/octonion-kernel.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("Octonion Core: S15->S8 bundle maps to Tetragrammatron Fano WordNet", () => {
  const kernel = new OmiOctonionFanoKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateOctonionBundle(S, 0x1A2B, 0x3C4D, 8);

  assert.ok(metrics.accepted);
  assert.equal(metrics.objectModelLayerKey, "OCTONION_FANO_PROLOG_WORDNET");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.ok(metrics.fanoPointIndex >= 1 && metrics.fanoPointIndex <= 7);
  assert.ok(typeof metrics.timelineSlot === "number");
});

test("Octonion Core: S4 quaternionic node maps to green preset", () => {
  const kernel = new OmiOctonionFanoKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateOctonionBundle(S, 0x1A2B, 0x3C4D, 4);

  assert.ok(metrics.accepted);
  assert.equal(metrics.objectModelLayerKey, "QUTERNIONIC_S4_24CELL_NODE");
  assert.equal(metrics.canvasPresetColorId, "4");
  assert.ok(metrics.simulatedAdderResult.sum >= 5);
});

test("Octonion Core: evicts invalid Adams fibration dimensions", () => {
  const kernel = new OmiOctonionFanoKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateOctonionBundle(S, 0x1A2B, 0x3C4D, 1);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "OUTSIDE_ADAMS_FIBRATION_DIMENSIONS");
});

test("Octonion Core: evicts structurally invalid frames", () => {
  const kernel = new OmiOctonionFanoKernel();
  const S = parseOmiAddressToSegments("omi-0000-0000-0000-0000-0000-0000-0000-0000/48");
  const metrics = kernel.evaluateOctonionBundle(S, 0x1A2B, 0x3C4D, 8);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test("Octonion Core: layer 7 routes to Tetragrammatron same as layer 8", () => {
  const kernel = new OmiOctonionFanoKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateOctonionBundle(S, 0xA5A5, 0x5A5A, 7);

  assert.ok(metrics.accepted);
  assert.equal(metrics.objectModelLayerKey, "OCTONION_FANO_PROLOG_WORDNET");
  assert.equal(metrics.canvasPresetColorId, "6");
});
