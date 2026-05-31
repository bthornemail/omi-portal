import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiBitSliceAluKernel, IEEE754_BINARY256_EXP_BIAS } from '../src/omi/bitslice-kernel.js';

test('Bit-Slice Core: engine accurately handles 1024-bit data slicing and extracts exponents', () => {
  const alu = new OmiBitSliceAluKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  assert.equal(IEEE754_BINARY256_EXP_BIAS, 262143);

  const mockHi = 0x3FFFF00000000000n;
  const mockLo = 0x0000000000001337n;

  const metrics = alu.evaluateCipherSlice(S, 0, mockHi, mockLo);

  assert.ok(metrics.accepted);
  assert.equal(metrics.sliceIndex, 0);
  assert.equal(metrics.signBit, 0);
  assert.equal(metrics.biasedExponent, 262143);
  assert.equal(metrics.actualExponent, 0);
  assert.equal(metrics.bitSliceALUModelType, "BINARY256_OVERSCALED_NORMAL_PLANE");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Bit-Slice Core: traps critical exponent overflow states and triggers eviction loops', () => {
  const alu = new OmiBitSliceAluKernel();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const overflowHi = 0x7FFFF00000000000n;

  const metrics = alu.evaluateCipherSlice(S, 0, overflowHi, 0n);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.bitSliceALUModelType, "OMI1024_CRYPTOGRAPHIC_OVERFLOW_ANOMALY");
  assert.equal(metrics.canvasPresetColorId, "1");
});
