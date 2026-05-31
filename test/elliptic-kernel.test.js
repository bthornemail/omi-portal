import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiSupersingularEllipticKernel, PRIME_RATIONALITY_THRESHOLD } from '../src/omi/elliptic-kernel.js';

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test('Elliptic Core: prime 11 with j=0 maps to cyclic order 6 centroid', () => {
  const kernel = new OmiSupersingularEllipticKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(PRIME_RATIONALITY_THRESHOLD, 37);

  const metrics = kernel.evaluateEllipticPrime(S, 11, 0, false);

  assert.ok(metrics.accepted);
  assert.equal(metrics.baseAutomorphismCount, Math.floor(11 / 12));
  assert.equal(metrics.massTotalWeight, (11 - 1) / 24);
  assert.equal(metrics.modularReductionModel, "CYCLIC_ORDER_6_CENTROID");
  assert.equal(metrics.canvasPresetColorId, "3");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Elliptic Core: prime 7 with j=1728 maps to cyclic order 4 centroid', () => {
  const kernel = new OmiSupersingularEllipticKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateEllipticPrime(S, 7, 1728, false);

  assert.ok(metrics.accepted);
  assert.equal(metrics.modularReductionModel, "CYCLIC_ORDER_4_CENTROID");
  assert.equal(metrics.canvasPresetColorId, "6");
});

test('Elliptic Core: standard rational reduction for non-special j', () => {
  const kernel = new OmiSupersingularEllipticKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateEllipticPrime(S, 13, 5, false);

  assert.ok(metrics.accepted);
  assert.equal(metrics.modularReductionModel, "STANDARD_RATIONAL_REDUCTION");
  assert.equal(metrics.canvasPresetColorId, "5");
});

test('Elliptic Core: blocks field extension below prime 37', () => {
  const kernel = new OmiSupersingularEllipticKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateEllipticPrime(S, 7, 1728, true);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "ILLEGAL_FIELD_EXTENSION_BELOW_PRIME_37_EVICTION");
});

test('Elliptic Core: quadratic extension root mesh at prime 37', () => {
  const kernel = new OmiSupersingularEllipticKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = kernel.evaluateEllipticPrime(S, 37, 8, true);

  assert.ok(metrics.accepted);
  assert.equal(metrics.modularReductionModel, "QUADRATIC_EXTENSION_ROOT_MESH");
  assert.equal(metrics.canvasPresetColorId, "1");
});

test('Elliptic Core: CLA adder fires across prime slices', () => {
  const kernel = new OmiSupersingularEllipticKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.evaluateEllipticPrime(S, 17, 0, false);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
