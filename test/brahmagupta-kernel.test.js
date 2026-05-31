import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiBrahmaguptaKernel, BASE_COMPOSITE_60 } from '../src/omi/brahmagupta-kernel.js';

test('Brahmagupta Core: engine accurately handles bilinear products and validates regular fractions', () => {
  const identityCore = new OmiBrahmaguptaKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  assert.equal(BASE_COMPOSITE_60, 60);

  const metrics = identityCore.evaluateQuadraticComposition(S, 1, 4, 2, 7, 25);

  assert.ok(metrics.accepted);
  assert.equal(metrics.productSumSquare, 901);
  assert.equal((metrics.form1.x * metrics.form1.x) + (metrics.form1.y * metrics.form1.y), 901);
  assert.equal((metrics.form2.x * metrics.form2.x) + (metrics.form2.y * metrics.form2.y), 901);
  assert.equal(metrics.quadraticClosureModel, "EXACT_SEXAGESIMAL_CLOSURE_ACTIVE");
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 60);
});

test('Brahmagupta Core: evicts fractions containing non-regular prime factor elements', () => {
  const identityCore = new OmiBrahmaguptaKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = identityCore.evaluateQuadraticComposition(S, 1, 4, 2, 7, 21);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "NON_REGULAR_DENOMINATOR_EXCLUSION");
});
