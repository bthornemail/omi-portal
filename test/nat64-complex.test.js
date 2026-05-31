import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiNat64ComplexKernel, NAT64_PREFIX_SEG0, NAT64_PREFIX_SEG1 } from '../src/omi/nat64-complex.js';

test('Complex NAT64 Core: engine accurately processes complex norms and validates field multiplicativity', () => {
  const kernel = new OmiNat64ComplexKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  assert.equal(NAT64_PREFIX_SEG0, 0x0064);
  assert.equal(NAT64_PREFIX_SEG1, 0xff9b);

  const metrics = kernel.processComplexAddressNorm(S, 4, 3, 12, 5);

  assert.ok(metrics.accepted);
  assert.equal(metrics.normA, 25);
  assert.equal(metrics.normB, 169);
  assert.equal(metrics.actualProductNorm, 4225);
  assert.equal(metrics.complexNat64LayerModel, "HIGH_RESONANCE_CHAKRAVALA_CYCLE");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Complex NAT64 Core: identifies non-NAT64 prefix frames via segment check', () => {
  const kernel = new OmiNat64ComplexKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = kernel.processComplexAddressNorm(S, 1, 1, 1, 1);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isNat64Aligned, false);
  assert.equal(metrics.actualProductNorm, 4);
  assert.equal(metrics.complexNat64LayerModel, "STANDARD_NAT64_TRANSIT");
  assert.equal(metrics.canvasPresetColorId, "4");
});
