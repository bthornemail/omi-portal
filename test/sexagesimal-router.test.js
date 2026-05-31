import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiSexagesimalRouterKernel, SUPERIOR_COMPOSITE_LCM, VALID_SEXAGESIMAL_DIVISORS } from '../src/canvas/sexagesimal-router.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('Sexagesimal Core: factor 15 yields 4 evenly divided minutes', () => {
  const kernel = new OmiSexagesimalRouterKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(SUPERIOR_COMPOSITE_LCM, 60);
  assert.equal(VALID_SEXAGESIMAL_DIVISORS.length, 12);

  const metrics = kernel.routeSexagesimalData(S, 15, 1);

  assert.ok(metrics.accepted);
  assert.equal(metrics.sexagesimalRoutingModel, "COMPOSITE_FRACTIONAL_RAIL");
  assert.equal(metrics.factor, 15);
  assert.equal(metrics.derivedSectionMinutes, 4);
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 60);
});

test('Sexagesimal Core: prime factors 2,3,5 route to clock thread source', () => {
  const kernel = new OmiSexagesimalRouterKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.routeSexagesimalData(S, 3, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.sexagesimalRoutingModel, "PRIME_CLOCK_THREAD_SOURCE");
  assert.equal(metrics.canvasPresetColorId, "4");
});

test('Sexagesimal Core: terminal factor 60 maps to LCM horizon lock', () => {
  const kernel = new OmiSexagesimalRouterKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.routeSexagesimalData(S, 60, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.sexagesimalRoutingModel, "TERMINAL_LCM_HORIZON_LOCK");
  assert.equal(metrics.canvasPresetColorId, "6");
});

test('Sexagesimal Core: zero canonical frame routes to yellow preset', () => {
  const kernel = new OmiSexagesimalRouterKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.routeSexagesimalData(S, 10, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.canvasPresetColorId, "3");
});

test('Sexagesimal Core: non-regular divisor 7 triggers eviction', () => {
  const kernel = new OmiSexagesimalRouterKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.routeSexagesimalData(S, 7, 0);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "NON_REGULAR_SEXAGESIMAL_FACTOR_EVICTION");
});

test('Sexagesimal Core: GATE_1 eviction on null S', () => {
  const kernel = new OmiSexagesimalRouterKernel();

  const metrics = kernel.routeSexagesimalData(null, 15, 1);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test('Sexagesimal Core: CLA adder fires across divisor slices', () => {
  const kernel = new OmiSexagesimalRouterKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.routeSexagesimalData(S, 12, 1);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
