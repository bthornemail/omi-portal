import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiPolytopicSemanticRouter } from '../src/omi/polytopic-router.js';

test('Polytopic Core: routes UPOS over 5-Cell simplex with cyan preset', () => {
  const router = new OmiPolytopicSemanticRouter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = router.routePolytopicWordNetField(S, 5, 0x01A3);

  assert.ok(metrics.accepted);
  assert.equal(metrics.targetHyperCellCap, 5);
  assert.equal(metrics.isSnubbedTruncationValid, true);
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Polytopic Core: routes synset over 120-Cell dodecaplex with purple preset', () => {
  const router = new OmiPolytopicSemanticRouter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = router.routePolytopicWordNetField(S, 120, 0x02B2);

  assert.ok(metrics.accepted);
  assert.equal(metrics.targetHyperCellCap, 120);
  assert.equal(metrics.canvasPresetColorId, "6");
});
