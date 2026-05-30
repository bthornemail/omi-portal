import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments, extractTruthRow } from '../src/omi/delta-orbital-lexer.js';
import { OmiSexagesimalClaEncoder } from '../src/canvas/omicron-canvas.js';

test('Sexagesimal CLA: encoder maps regular terminating fractions to canvas preset IDs', () => {
  const encoder = new OmiSexagesimalClaEncoder();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = encoder.evaluateSexagesimalCla(S, 5, 6, 1);
  assert.ok(metrics.accepted);
  assert.equal(metrics.isRegularFraction, true);
  assert.equal(metrics.targetCanvasColor, "6");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Sexagesimal CLA: non-regular denominator flags repeating sexagesimal fraction', () => {
  const encoder = new OmiSexagesimalClaEncoder();
  const nonRegularToken = "omi-0100-03bf-0007-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(nonRegularToken);

  const metrics = encoder.evaluateSexagesimalCla(S, 5, 6, 1);
  assert.ok(metrics.accepted);
  assert.equal(metrics.isRegularFraction, false);
  assert.equal(metrics.targetCanvasColor, "1");
});

test('Sexagesimal CLA: propagate and generate masks computed correctly from 4-bit inputs', () => {
  const encoder = new OmiSexagesimalClaEncoder();
  const S = parseOmiAddressToSegments("omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48");

  const metrics = encoder.evaluateSexagesimalCla(S, 0xA, 0x5, 0);
  assert.ok(metrics.accepted);
  assert.equal(metrics.propagateMask, 0xF);
  assert.equal(metrics.generateMask, 0x0);
  assert.equal(metrics.isRegularFraction, true);
});

test('Sexagesimal CLA: gate delay analysis respects 3dt carry ceiling (Rule 0x89)', () => {
  const encoder = new OmiSexagesimalClaEncoder();
  const S = parseOmiAddressToSegments("omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48");

  const metrics = encoder.evaluateSexagesimalCla(S, 7, 7, 1);
  assert.ok(metrics.accepted);
  assert.ok(metrics.gateDelayCarry <= 3);
  assert.equal(metrics.generateMask, 7);
});

test('Sexagesimal CLA: YBC 7289 √2 diagonal alignment at boot slot 1504', () => {
  const encoder = new OmiSexagesimalClaEncoder();
  const S = parseOmiAddressToSegments("omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48");

  const rowData = extractTruthRow(S);
  assert.equal(rowData.NN % 5040, 1504);
});
