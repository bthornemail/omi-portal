import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiMetacircularPerceptronKernel, FANO_RESOLUTION_CEILING } from '../src/omi/metacircular-perceptron.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('Meta Neural Core: hidden layer resolves Fano point 3 high resonance', () => {
  const kernel = new OmiMetacircularPerceptronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(FANO_RESOLUTION_CEILING, 15);

  const metrics = kernel.evaluateMultilayerWarp(S, 0x0000, 0x0000, 0x001C, false);

  assert.ok(metrics.accepted);
  assert.equal(metrics.fanoPointIndex, 3);
  assert.equal(metrics.metacircularWarpModel, "MEGATRON_FIRED_HIGH_RESONANCE");
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Meta Neural Core: sub-critical inhibited track at Fano point 1', () => {
  const kernel = new OmiMetacircularPerceptronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateMultilayerWarp(S, 0x0000, 0x0000, 0x0014, false);

  assert.ok(metrics.accepted);
  assert.equal(metrics.fanoPointIndex, 1);
  assert.equal(metrics.metacircularWarpModel, "SUB_CRITICAL_INHIBITED_TRACK");
  assert.equal(metrics.canvasPresetColorId, "1");
});

test('Meta Neural Core: sigmoid mode routes to continuous confidence', () => {
  const kernel = new OmiMetacircularPerceptronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateMultilayerWarp(S, 0x0000, 0x0000, 0x0018, true);

  assert.ok(metrics.accepted);
  assert.equal(metrics.metacircularWarpModel, "CONTINUOUS_METACIRCULAR_CONFIDENCE");
  assert.equal(metrics.canvasPresetColorId, "3");
});

test('Meta Neural Core: diverges and evicts when Fano orbit misses 1-7', () => {
  const kernel = new OmiMetacircularPerceptronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateMultilayerWarp(S, 0x0000, 0x0000, 0x0010, false);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "ORBITAL_FANO_PLANE_DIVERGENCE_EVICTION");
});

test('Meta Neural Core: GATE_1 eviction on structural malformation', () => {
  const kernel = new OmiMetacircularPerceptronKernel();

  const metrics = kernel.evaluateMultilayerWarp(null, 0x1111, 0x2222, 0x3333, false);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test('Meta Neural Core: CLA adder fires across Fano slices', () => {
  const kernel = new OmiMetacircularPerceptronKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateMultilayerWarp(S, 0x0000, 0x0000, 0x001C, false);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
