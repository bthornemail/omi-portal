import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiOctuplePrecisionKernel, OCTUPLE_EXPONENT_BIAS } from '../src/omi/octuple-kernel.js';

test('Octuple Core: decodes 19-bit exponent with offset binary bias', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiOctuplePrecisionKernel(ringSAB);

  const tokenHigh = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const tokenLow  = "omi-0100-03bf-0005-2b01-2f01-1434-039f-01ff/48";

  const S_High = parseOmiAddressToSegments(tokenHigh);
  const S_Low  = parseOmiAddressToSegments(tokenLow);

  const metrics = kernel.decodeOctuplePrecisionWord(S_High, S_Low);

  assert.ok(metrics.accepted);
  assert.equal(metrics.signBit, 0);
  assert.equal(metrics.alphaHexChannel, "ff");

  const upperBits = (0x7C00 & 0x7FFF) << 4;
  const lowerBits = (0x1434 >> 12) & 0x0F;
  assert.equal(metrics.totalBiasedExponent, upperBits | lowerBits);
  assert.equal(metrics.trueExponentValue, (upperBits | lowerBits) - OCTUPLE_EXPONENT_BIAS);
  assert.equal(metrics.timelineSlot, 5);
});

test('Octuple Core: detects infinity exponent and triggers red warning', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiOctuplePrecisionKernel(ringSAB);

  const tokenMaxEx = "omi-0100-03bf-ffff-2b01-2f01-f000-039f-01ff/48";
  const tokenLow    = "omi-0100-03bf-0005-2b01-2f01-1434-039f-01ff/48";

  const S_High = parseOmiAddressToSegments(tokenMaxEx);
  const S_Low  = parseOmiAddressToSegments(tokenLow);

  const metrics = kernel.decodeOctuplePrecisionWord(S_High, S_Low);
  assert.ok(metrics.accepted);
  assert.equal(metrics.targetPresetColorCode, "1");
});
