import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiPolyhedralSemanticRouter } from '../src/omi/semantic-router.js';

test('Semantic Core: routes open class NOUN to cube face with cyan preset', () => {
  const router = new OmiPolyhedralSemanticRouter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = router.routePolyhedralSymbol(S, "NOUN", 2, 4);

  assert.ok(metrics.accepted);
  assert.equal(metrics.space, "CUBE_FACE");
  assert.equal(metrics.posIndex, 1);
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Semantic Core: runs autonomous CLA on incoming feature pairs', () => {
  const router = new OmiPolyhedralSemanticRouter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = router.routePolyhedralSymbol(S, "VERB", 4, 2);

  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.equal(metrics.simulatedAdderResult.sum, (4 + 2 + 1) & 0x0F);
});

test('Semantic Core: rejects unknown tag with eviction reason', () => {
  const router = new OmiPolyhedralSemanticRouter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = router.routePolyhedralSymbol(S, "ZZZ", 0, 0);

  assert.equal(metrics.accepted, false);
  assert.match(metrics.reason, /EVICTION/);
});
