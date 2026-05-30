import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiEbcdicCharacterFilter } from '../src/omi/ebcdic-filter.js';

test('Character Core: classifies structural 0x2F divider with orange preset', () => {
  const filter = new OmiEbcdicCharacterFilter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = filter.evaluateCharacterMatrix(S, 0x2F);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isStructural, true);
  assert.equal(metrics.isNumeric, false);
  assert.equal(metrics.canvasPresetColorId, "2");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Character Core: extracts integer 5 from ASCII 0x35 and runs gnomon CLA', () => {
  const filter = new OmiEbcdicCharacterFilter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = filter.evaluateCharacterMatrix(S, 0x35);

  assert.ok(metrics.accepted);
  assert.equal(metrics.isStructural, false);
  assert.equal(metrics.isNumeric, true);
  assert.equal(metrics.derivedIntegerCode, 5);
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.ok(metrics.simulatedAdderResult);
  assert.equal(metrics.simulatedAdderResult.sum, (5 + 3 + 1) & 0x0F);
});

test('Character Core: rejects byte outside 0x00-0x3F range', () => {
  const filter = new OmiEbcdicCharacterFilter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = filter.evaluateCharacterMatrix(S, 0x40);

  assert.equal(metrics.accepted, false);
  assert.match(metrics.reason, /LEXICON/);
});
