import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiTetrahedralLatticeResolver } from '../src/omi/lattice-resolver.js';

test('Lattice Core: resolver derives 4th missing vertex from any 3 points', () => {
  const resolver = new OmiTetrahedralLatticeResolver();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = resolver.inferMissingVertex(S, 7);

  assert.ok(metrics.accepted);
  assert.equal(metrics.canInfer, true);
  assert.equal(metrics.popCount, 3);
  assert.equal(metrics.inferredVertexId, 8);
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test('Lattice Core: clamps noisy bit layouts to high-contrast white hex bound', () => {
  const resolver = new OmiTetrahedralLatticeResolver();
  const highBitToken = "omi-0100-03bf-7fff-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(highBitToken);

  const metrics = resolver.inferMissingVertex(S, 7);
  assert.ok(metrics.accepted);
  assert.equal(metrics.monochromeHexCode, "#FFFFFF");
});

test('Lattice Core: low significand clamps to black', () => {
  const resolver = new OmiTetrahedralLatticeResolver();
  const lowBitToken = "omi-0100-03bf-0032-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(lowBitToken);

  const metrics = resolver.inferMissingVertex(S, 7);
  assert.ok(metrics.accepted);
  assert.equal(metrics.monochromeHexCode, "#000000");
});

test('Lattice Core: cannot infer with fewer than 3 vertices', () => {
  const resolver = new OmiTetrahedralLatticeResolver();
  const token = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(token);

  const metrics = resolver.inferMissingVertex(S, 3);
  assert.ok(metrics.accepted);
  assert.equal(metrics.canInfer, false);
  assert.equal(metrics.inferredVertexId, null);
});

test('Lattice Core: invalid address rejected at Gate 1', () => {
  const resolver = new OmiTetrahedralLatticeResolver();
  const badToken = "omi-0000-0000-0000-0000-0000-0000-0000-0000/48";
  const S = parseOmiAddressToSegments(badToken);

  const metrics = resolver.inferMissingVertex(S, 7);
  assert.equal(metrics.accepted, false);
  assert.match(metrics.reason, /GATE_1/);
});
