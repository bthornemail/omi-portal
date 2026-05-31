import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiMonoidAutomatonKernel, UNIVERSAL_RELATION_SLOT, MAX_REWRITING_STEPS } from '../src/omi/monoid-kernel.js';

test('Monoid Core: engine accurately handles principal prime ideals and verifies matroid closure', () => {
  const kernel = new OmiMonoidAutomatonKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  assert.equal(UNIVERSAL_RELATION_SLOT, 1);
  assert.equal(MAX_REWRITING_STEPS, 60);

  const metrics = kernel.evaluateMonoidTransition(S, 41, true, 12);

  assert.ok(metrics.accepted);
  assert.equal(metrics.generatorPrime, 41);
  assert.equal(metrics.isPseudoGeneratorValid, true);
  assert.equal(metrics.monoidAutomatonModel, "PRIME_IDEAL_PSEUDO_GENERATOR_ACTIVE");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.equal(metrics.timelineSlot, 0x7C00 % 60);
});

test('Monoid Core: evicts elements violating prime generator conditions under factorization', () => {
  const kernel = new OmiMonoidAutomatonKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = kernel.evaluateMonoidTransition(S, 33, true, 5);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "NON_PRIME_PRINCIPAL_IDEAL_EVICTION");
});
