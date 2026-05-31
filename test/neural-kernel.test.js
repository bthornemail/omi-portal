import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { OmiNeuralNeuronKernel } from "../src/omi/neural-kernel.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("Neural Core: Perceptron step fires for small laptop offer", () => {
  const kernel = new OmiNeuralNeuronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.activateNeuron(
    S,
    new Uint8Array([0, 255]),
    new Uint8Array([127, 229]),
    -127,
    false
  );

  assert.ok(metrics.accepted);
  assert.equal(metrics.activationModelType, "HARDWARE_PERCEPTRON_STEP");
  assert.equal(metrics.outputConfidence, 1.0);
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.ok(typeof metrics.timelineSlot === "number");
});

test("Neural Core: Perceptron does not fire with strongly negative bias", () => {
  const kernel = new OmiNeuralNeuronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.activateNeuron(
    S,
    new Uint8Array([0, 0]),
    new Uint8Array([127, 229]),
    -500,
    false
  );

  assert.ok(metrics.accepted);
  assert.equal(metrics.outputConfidence, 0.0);
  assert.equal(metrics.canvasPresetColorId, "1");
});

test("Neural Core: sigmoid neuron yields ~0.648 confidence for balanced inputs", () => {
  const kernel = new OmiNeuralNeuronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.activateNeuron(
    S,
    new Uint8Array([153, 229]),
    new Uint8Array([127, 229]),
    -127,
    true
  );

  assert.ok(metrics.accepted);
  assert.equal(metrics.activationModelType, "SIGMOID_CONTINUOUS_NEURON");
  assert.ok(metrics.outputConfidence > 0.6 && metrics.outputConfidence < 0.7);
  assert.equal(metrics.canvasPresetColorId, "5");
});

test("Neural Core: sigmoid low confidence maps to purple preset", () => {
  const kernel = new OmiNeuralNeuronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.activateNeuron(
    S,
    new Uint8Array([0, 0]),
    new Uint8Array([0, 0]),
    -500,
    true
  );

  assert.ok(metrics.accepted);
  assert.ok(metrics.outputConfidence < 0.4);
  assert.equal(metrics.canvasPresetColorId, "6");
});

test("Neural Core: sigmoid modest transition maps to yellow preset", () => {
  const kernel = new OmiNeuralNeuronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.activateNeuron(
    S,
    new Uint8Array([128, 128]),
    new Uint8Array([128, 128]),
    -150,
    true
  );

  assert.ok(metrics.accepted);
  assert.equal(metrics.canvasPresetColorId, "3");
});

test("Neural Core: evicts structurally invalid frames", () => {
  const kernel = new OmiNeuralNeuronKernel();
  const S = parseOmiAddressToSegments("omi-0000-0000-0000-0000-0000-0000-0000-0000/48");
  const metrics = kernel.activateNeuron(
    S,
    new Uint8Array([0, 255]),
    new Uint8Array([127, 229]),
    -127,
    false
  );

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});
