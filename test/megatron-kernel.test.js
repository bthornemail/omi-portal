import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiMegatronKernel, CODE_UNICODE_LOWER_OMICRON, CODE_UNICODE_UPPER_OMICRON } from '../src/omi/megatron-kernel.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('Megatron Core: lowercase chiral omicron triggers firing step', () => {
  const kernel = new OmiMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateMegatronActivation(S, 0x03BF, 1024, false);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isLowerOmicronChiral, true);
  assert.equal(metrics.isUpperOmicronCardinal, false);
  assert.equal(metrics.absWeight, 1024);
  assert.equal(metrics.megatronActivationState, "MEGATRON_DOMINANT_FIRE_STEP");
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Megatron Core: uppercase cardinal omicron routes absolute weights', () => {
  const kernel = new OmiMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateMegatronActivation(S, 0x039F, 600, false);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isLowerOmicronChiral, false);
  assert.equal(metrics.isUpperOmicronCardinal, true);
  assert.equal(metrics.megatronActivationState, "MEGATRON_DOMINANT_FIRE_STEP");
  assert.equal(metrics.canvasPresetColorId, "5");
});

test('Megatron Core: chiral inhibited track fires for low weight lowercase', () => {
  const kernel = new OmiMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateMegatronActivation(S, 0x03BF, 12, false);

  assert.ok(metrics.accepted);
  assert.equal(metrics.megatronActivationState, "CHIRAL_INHIBITED_TRACK");
  assert.equal(metrics.canvasPresetColorId, "1");
});

test('Megatron Core: sigmoid mode routes to continuous logistic', () => {
  const kernel = new OmiMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateMegatronActivation(S, 0x03BF, 64, true);

  assert.ok(metrics.accepted);
  assert.equal(metrics.megatronActivationState, "CONTINUOUS_LOGISTIC_CONFIDENCE");
  assert.equal(metrics.canvasPresetColorId, "3");
});

test('Megatron Core: non-omicron unicode characters evicted', () => {
  const kernel = new OmiMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateMegatronActivation(S, 0x0058, 12, false);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "OUTSIDE_OMICRON_CASE_BOUNDARY_EVICTION");
});

test('Megatron Core: CLA adder fires across unicode slices', () => {
  const kernel = new OmiMegatronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateMegatronActivation(S, 0x03BF, 100, false);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
