import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiContinuousClampedEncoder } from '../src/canvas/omicron-canvas.js';

test('Chromatic RGBA: encoder accurately transforms positive binary16 values to full opacity hex strings', (t) => {
  const encoder = new OmiContinuousClampedEncoder();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = encoder.encodeContinuousClampedColor(S);
  assert.ok(metrics);

  assert.equal(metrics.alphaHex, "ff");
  assert.equal(metrics.hueAngleDegrees, 0);
  assert.equal(metrics.canonicalHexColorString.endsWith("ff"), true);
});

test('Chromatic RGBA: maps negative sign bits to an attenuated exponential alpha channel', (t) => {
  const encoder = new OmiContinuousClampedEncoder();
  const negativeToken = "omi-0100-03bf-fc00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(negativeToken);

  const metrics = encoder.encodeContinuousClampedColor(S);
  assert.ok(metrics);
  assert.equal(metrics.alphaHex, "33");
  assert.equal(metrics.canonicalHexColorString.endsWith("33"), true);
});
