import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiBijectiveCubeKernel, TWO_CUBE_BUFFER_SIZE_BYTES } from '../src/omi/bijective-cube-kernel.js';

test('Bijective Core: engine instantiation validates SAB presence', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiBijectiveCubeKernel(ringSAB);
  assert.ok(kernel);
  assert.ok(kernel.timelineRingArray);
});

test('Bijective Core: enforces 1024-byte ArrayBuffer workspace (Rule 0x8F)', () => {
  const testBuffer = new ArrayBuffer(TWO_CUBE_BUFFER_SIZE_BYTES);
  assert.equal(testBuffer.byteLength, 1024);
});

test('Bijective Core: rejects missing transition buffer', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiBijectiveCubeKernel(ringSAB);
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);
  const result = kernel.executeBijectiveTransition(S, 5, null);
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "INVALID_TWO_CUBE_WORKSPACE_CAPACITY");
});

test('Bijective Core: rejects invalid frame (non-zero Q(S))', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiBijectiveCubeKernel(ringSAB);
  const badToken = "omi-0005-bf03-0000-0000-0000-0000-0000-0000/48";
  const S = parseOmiAddressToSegments(badToken);
  const targetBuffer = new ArrayBuffer(TWO_CUBE_BUFFER_SIZE_BYTES);
  const result = kernel.executeBijectiveTransition(S, 5, targetBuffer);
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "GATE_1_ALGEBRAIC_EVICTION_FAULT");
});

test('Bijective Core: bijective face inversion active/opposing indices sum to 127', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiBijectiveCubeKernel(ringSAB);
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);
  const targetBuffer = new ArrayBuffer(TWO_CUBE_BUFFER_SIZE_BYTES);
  const metrics = kernel.executeBijectiveTransition(S, 42, targetBuffer);
  assert.ok(metrics.accepted);
  assert.equal(metrics.activeStateIndex, 42);
  assert.equal(metrics.opposingStateIndex, 85);
  assert.equal(metrics.activeStateIndex + metrics.opposingStateIndex, 127);
  assert.equal(metrics.canvasColorPresetId, "5");
});

test('Bijective Core: accepts genesis frame at boot slot 1504', () => {
  const ringSAB = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiBijectiveCubeKernel(ringSAB);
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);
  const targetBuffer = new ArrayBuffer(TWO_CUBE_BUFFER_SIZE_BYTES);
  const metrics = kernel.executeBijectiveTransition(S, 5, targetBuffer);
  assert.ok(metrics.accepted);
  assert.equal(metrics.canvasColorPresetId, "5");
});

test('Bijective Core: constructor throws when SAB is missing', () => {
  assert.throws(() => new OmiBijectiveCubeKernel(null), /Missing global timeline SAB/);
});
