import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { OmiHgvPerceptron } from "../src/omi/hgv-perceptron.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("HGV Perceptron: layer 9 accepts valid 2-of-5 input", () => {
  const perceptron = new OmiHgvPerceptron();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const result = perceptron.evaluateLayer9(S, new Uint8Array([0, 0, 1, 1, 0]));
  assert.ok(result.accepted);
  assert.equal(result.position, 2);
  assert.ok(result.eventStrength > 0);
});

test("HGV Perceptron: layer 9 rejects non-2-of-5 input", () => {
  const perceptron = new OmiHgvPerceptron();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const result = perceptron.evaluateLayer9(S, new Uint8Array([1, 1, 1, 0, 0]));
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "LAYER9_NOT_2OF5_BARYCENTRIC");
});

test("HGV Perceptron: layer 9 rejects structural eviction", () => {
  const perceptron = new OmiHgvPerceptron();
  const S = parseOmiAddressToSegments("omi-0000-0000-0000-0000-0000-0000-0000-0000/48");
  const result = perceptron.evaluateLayer9(S, new Uint8Array([1, 1, 0, 0, 0]));
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test("HGV Perceptron: layer 10 allocates binary64 from layer9 event", () => {
  const perceptron = new OmiHgvPerceptron();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const layer9 = perceptron.evaluateLayer9(S, new Uint8Array([1, 0, 1, 0, 0]));
  const layer10 = perceptron.allocateLayer10(layer9);
  assert.ok(layer10.allocated);
  assert.ok(typeof layer10.floatValue === "number");
  assert.ok(layer10.bits.length > 0);
});

test("HGV Perceptron: layer 10 propagates layer9 eviction", () => {
  const perceptron = new OmiHgvPerceptron();
  const invalid = { accepted: false, reason: "LAYER9_NOT_2OF5_BARYCENTRIC" };
  const layer10 = perceptron.allocateLayer10(invalid);
  assert.equal(layer10.allocated, false);
  assert.equal(layer10.reason, "LAYER9_EVICTION_PROPAGATED");
});

test("HGV Perceptron: perceptron step fires for high confidence", () => {
  const perceptron = new OmiHgvPerceptron();
  const activation = perceptron.activatePerceptron(1500, 60000, false);
  assert.equal(activation.activationModel, "HGV_PERCEPTRON_STEP");
  assert.equal(activation.outputConfidence, 1.0);
  assert.equal(activation.canvasPresetColorId, "5");
});

test("HGV Perceptron: perceptron step does not fire for low confidence", () => {
  const perceptron = new OmiHgvPerceptron();
  const activation = perceptron.activatePerceptron(0, 0, false);
  assert.equal(activation.outputConfidence, 0.0);
  assert.equal(activation.canvasPresetColorId, "6");
});

test("HGV Perceptron: sigmoid produces continuous output", () => {
  const perceptron = new OmiHgvPerceptron();
  const activation = perceptron.activatePerceptron(800, 32768, true);
  assert.equal(activation.activationModel, "HGV_SIGMOID_CONTINUOUS");
  assert.ok(activation.outputConfidence >= 0 && activation.outputConfidence <= 1);
});

test("HGV Perceptron: full evaluateHgv pipeline completes", () => {
  const perceptron = new OmiHgvPerceptron();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const result = perceptron.evaluateHgv(S, new Uint8Array([0, 0, 1, 1, 0]), false);
  assert.ok(result.accepted);
  assert.ok(result.layer9.accepted);
  assert.ok(result.layer10.allocated);
  assert.ok(typeof result.outputConfidence === "number");
  assert.ok(typeof result.canvasPresetColorId === "string");
});

test("HGV Perceptron: full evaluateHgv sigmoid mode", () => {
  const perceptron = new OmiHgvPerceptron();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const result = perceptron.evaluateHgv(S, new Uint8Array([1, 0, 0, 0, 1]), true);
  assert.ok(result.accepted);
  assert.equal(result.activationModel, "HGV_SIGMOID_CONTINUOUS");
});
