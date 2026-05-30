import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiNonogramPresetColorEncoder } from '../src/canvas/omicron-canvas.js';

test('Preset Color: encoder translates 6-center nonogram overlaps directly to canvas preset IDs', (t) => {
  const encoder = new OmiNonogramPresetColorEncoder();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = encoder.derivePresetColorId(S, 10, 8);
  assert.ok(metrics);
  assert.equal(metrics.blocksToBackfill, 6);
  assert.equal(metrics.targetPresetColor, "5");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Preset Color: maps negative resistance states directly to the purple preset ID', (t) => {
  const encoder = new OmiNonogramPresetColorEncoder();
  const negativeBoundToken = "omi-0100-03bf-8000-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(negativeBoundToken);

  const metrics = encoder.derivePresetColorId(S, 10, 8);
  assert.ok(metrics);
  assert.equal(metrics.targetPresetColor, "6");
});
