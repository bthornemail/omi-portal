import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiTowerPrecisionKernel } from '../src/omi/tower-kernel.js';

test('Precision Tower: executes 59/60/61 roundtrip with regular base-60 divisor', () => {
  const kernel = new OmiTowerPrecisionKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = kernel.evaluatePrecisionTowerStep(S, 0x2F);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isRegular60Base, true);
  assert.equal(metrics.isAbsolutePrimeBoundary, false);
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.maskedCodepointIndex, 0x2F);
  assert.equal(metrics.inverseCodepointIndex, 127 - 0x2F);
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Precision Tower: 59 prime boundary triggers red preset', () => {
  const kernel = new OmiTowerPrecisionKernel();
  const prime59Token = "omi-0100-03bf-003b-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(prime59Token);

  const metrics = kernel.evaluatePrecisionTowerStep(S, 0x2F);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isRegular60Base, false);
  assert.equal(metrics.isAbsolutePrimeBoundary, true);
  assert.equal(metrics.canvasPresetColorId, "1");
});
