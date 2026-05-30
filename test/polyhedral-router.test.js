import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiPolyhedralSemanticRouter, getVertexChromaticDifferential } from '../src/omi/polyhedral-router.js';

test('Polyhedral Core: routes open class NOUN to cube face with cyan preset', () => {
  const router = new OmiPolyhedralSemanticRouter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = router.routePolyhedralSymbol(S, "NOUN", 2, 4);

  assert.ok(metrics.accepted);
  assert.equal(metrics.geometricRole, "CUBE_FACE");
  assert.equal(metrics.posIndex, 1);
  assert.equal(metrics.isDualIntersectionAligned, true);
  assert.equal(metrics.canvasPresetColorCode, "5");
});

test('Polyhedral Core: routes PUNCT to centroid pointer with yellow preset', () => {
  const router = new OmiPolyhedralSemanticRouter();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = router.routePolyhedralSymbol(S, "PUNCT", 2, 4);

  assert.ok(metrics.accepted);
  assert.equal(metrics.geometricRole, "CENTROID_POINTER");
  assert.equal(metrics.canvasPresetColorCode, "3");
});

test('Chromatic Vertex: NOUN maps to red cube vertex', () => {
  const metrics = getVertexChromaticDifferential("NOUN");

  assert.ok(metrics.valid);
  assert.equal(metrics.x, 1);
  assert.equal(metrics.y, 1);
  assert.equal(metrics.z, 1);
  assert.equal(metrics.hexColor, "#FF0000");
});

test('Chromatic Vertex: AUX maps to pink blended profile', () => {
  const metrics = getVertexChromaticDifferential("AUX");

  assert.ok(metrics.valid);
  assert.equal(metrics.x, 0);
  assert.equal(metrics.y, -1);
  assert.equal(metrics.z, 0);
  assert.equal(metrics.hexColor, "#FF0088");
});

test('Chromatic Vertex: unknown tag returns invalid', () => {
  const metrics = getVertexChromaticDifferential("ZZZ");

  assert.equal(metrics.valid, false);
});
