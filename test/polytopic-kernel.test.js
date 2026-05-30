import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiPolytopicOsiKernel, GENESIS_REG_ANCHOR } from '../src/omi/polytopic-kernel.js';

test('Polytopic OSI: identifies 1D circumscribed S^0 pre-kernel sphere shell', () => {
  const kernel = new OmiPolytopicOsiKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = kernel.evaluateOsiManifold(S, 0x0E);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isInsideNSphereShell, true);
  assert.equal(metrics.isGenesisAligned, true);
  assert.equal(metrics.continuumPhaseModel, "OMICRON_CORE_CONVERGENCE");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.equal(metrics.timelineSlot, GENESIS_REG_ANCHOR % 5040);
});

test('Polytopic OSI: evicts inputs outside circumscribed sphere fence', () => {
  const kernel = new OmiPolytopicOsiKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = kernel.evaluateOsiManifold(S, 0x20);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.continuumPhaseModel, "CIRCUMELOCUTION_DRIFT_FAULT");
  assert.equal(metrics.canvasPresetColorId, "1");
});
