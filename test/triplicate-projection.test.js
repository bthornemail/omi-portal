import test from "node:test";
import assert from "node:assert/strict";
import { OmiTriplicateProjectionEngine, CENTROID_COEFFICIENTS } from "../src/web/triplicate-projection.js";
import { applyProjectionToPage } from "../src/web/polytope-webgl.js";

function encodeFloats(values) {
  return Buffer.from(new Float32Array(values).buffer).toString("base64url");
}

test("CENTROID_COEFFICIENTS have correct values", () => {
  assert.ok(CENTROID_COEFFICIENTS.tetrahedron > 0.8);
  assert.ok(CENTROID_COEFFICIENTS.simplex5Cell > 0.8);
  assert.ok(CENTROID_COEFFICIENTS.octaplex24Cell > 0.5);
});

test("parseTriplicateAddress validates ::/48 prefix", () => {
  const sab = new ArrayBuffer(5040 * 8);
  const engine = new OmiTriplicateProjectionEngine(sab);
  const b64 = encodeFloats([1.5, 2, -0.5, 10]);
  const result = engine.parseTriplicateAddress(
    `omi-8-ffff-127-0-0-1-0x24-p3-slot1440-${b64}`
  );
  assert.equal(result.isSubnetValid, true);
  assert.equal(result.subnetMask, "::/48");
  assert.equal(result.controlCode, "0x24");
});

test("parseTriplicateAddress rejects bad FS byte", () => {
  const sab = new ArrayBuffer(5040 * 8);
  const engine = new OmiTriplicateProjectionEngine(sab);
  const b64 = encodeFloats([1, 0, 0, 0]);
  const result = engine.parseTriplicateAddress(
    `omi-9-ffff-127-0-0-1-0x24-p3-slot0-${b64}`
  );
  assert.ok(result);
  assert.equal(result.isSubnetValid, false);
});

test("parseTriplicateAddress returns null for non-omi strings", () => {
  const sab = new ArrayBuffer(5040 * 8);
  const engine = new OmiTriplicateProjectionEngine(sab);
  assert.equal(engine.parseTriplicateAddress("garbage"), null);
  assert.equal(engine.parseTriplicateAddress(""), null);
});

test("calculateTriplicateProjection applies 24-cell modifier", () => {
  const sab = new ArrayBuffer(5040 * 8);
  const engine = new OmiTriplicateProjectionEngine(sab);
  const b64 = encodeFloats([1, 0, 0, 0]);
  const result = engine.calculateTriplicateProjection(
    `omi-8-ffff-127-0-0-1-0x24-p3-slot1440-${b64}`,
    1440n
  );
  const t = (1440 % 5040) / 5040;
  const expected = t * t * t * Math.tan(Math.PI / 6);
  assert.ok(Math.abs(result - expected) < 0.001);
});

test("calculateTriplicateProjection applies 5-cell modifier", () => {
  const sab = new ArrayBuffer(5040 * 8);
  const engine = new OmiTriplicateProjectionEngine(sab);
  const b64 = encodeFloats([1, 0, 0, 0]);
  const result = engine.calculateTriplicateProjection(
    `omi-8-ffff-127-0-0-1-0x05-p1-slot720-${b64}`,
    720n
  );
  const t = (720 % 5040) / 5040;
  const expected = t * t * t * Math.cos(Math.PI / 5);
  assert.ok(Math.abs(result - expected) < 0.001);
});

test("calculateTriplicateProjection falls back to tetrahedron for unknown code", () => {
  const sab = new ArrayBuffer(5040 * 8);
  const engine = new OmiTriplicateProjectionEngine(sab);
  const b64 = encodeFloats([1, 0, 0, 0]);
  const result = engine.calculateTriplicateProjection(
    `omi-8-ffff-127-0-0-1-0x42-p0-slot0-${b64}`,
    0n
  );
  assert.equal(result, 0);
});

test("calculateTriplicateProjection with [0,1,0,0] matches Horner", () => {
  const sab = new ArrayBuffer(5040 * 8);
  const engine = new OmiTriplicateProjectionEngine(sab);
  const b64 = encodeFloats([0, 1, 0, 0]);
  const result = engine.calculateTriplicateProjection(
    `omi-8-ffff-127-0-0-1-0x24-p3-slot1440-${b64}`,
    1440n
  );
  const t = (1440 % 5040) / 5040;
  const raw = ((0 * t + 1) * t + 0) * t + 0;
  const expected = raw * Math.tan(Math.PI / 6);
  assert.ok(Math.abs(result - expected) < 0.001);
});

test("calculateTriplicateProjection returns 0 for invalid address", () => {
  const sab = new ArrayBuffer(5040 * 8);
  const engine = new OmiTriplicateProjectionEngine(sab);
  assert.equal(engine.calculateTriplicateProjection("bad", 0n), 0);
});

test("cons/car/cdr primitives work", () => {
  const sab = new ArrayBuffer(5040 * 8);
  const engine = new OmiTriplicateProjectionEngine(sab);
  const cell = engine.cons("a", "b");
  assert.equal(engine.car(cell), "a");
  assert.equal(engine.cdr(cell), "b");
});

test("applyProjectionToPage returns 24-cell code at high page index", () => {
  const proj = applyProjectionToPage(5, 3600);
  assert.equal(proj.code, "0x24");
  assert.equal(proj.page6, 5);
});

test("applyProjectionToPage returns 5-cell code at low page index", () => {
  const proj = applyProjectionToPage(0, 500);
  assert.equal(proj.code, "0x05");
  assert.equal(proj.page6, 0);
});
