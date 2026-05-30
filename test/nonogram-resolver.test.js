import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiNonogramNat64Resolver } from '../src/omi/nonogram-resolver.js';

test('Nonogram Core: resolver correctly evaluates simple box overlaps and backfill counts', (t) => {
  const resolver = new OmiNonogramNat64Resolver();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = resolver.resolveNonogramLayer(S, 10, 8);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isNat64Valid, true);
  assert.equal(metrics.step2Difference, 2);
  assert.equal(metrics.blocksToBackfill, 6);
  assert.equal(metrics.timelineSlot, 1504);
});

test('Nonogram Core: identifies negative-resistance quadrant states based on bit layouts', (t) => {
  const resolver = new OmiNonogramNat64Resolver();
  const negativeBoundToken = "omi-0100-03bf-8000-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(negativeBoundToken);

  const metrics = resolver.resolveNonogramLayer(S, 10, 8);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isNegativeResistance, true);
  assert.equal(metrics.reflectionColorHex, "#7000FF");
});
