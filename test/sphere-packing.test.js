import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { OmiClampedSpherePacker, CODE16K_SYMBOL_CEILING } from "../src/omi/sphere-packing.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("Sphere Packing: routes Code 16K symbols to pointer buffer with yellow preset", () => {
  const packer = new OmiClampedSpherePacker();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  assert.equal(CODE16K_SYMBOL_CEILING, 107);

  const metrics = packer.evaluatePackedSequence(S, 12, 42, "code16k");

  assert.ok(metrics.accepted);
  assert.equal(metrics.packagingLayerModel, "CODE16K_FUNCTIONAL_POINTER");
  assert.equal(metrics.clampedIndex, 12);
  assert.equal(metrics.clampedValue, 42);
  assert.equal(metrics.canvasPresetColorId, "3");
  assert.ok(typeof metrics.timelineSlot === "number");
});

test("Sphere Packing: routes UTF-8 to lexical buffer with green preset", () => {
  const packer = new OmiClampedSpherePacker();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = packer.evaluatePackedSequence(S, 5, 65, "utf-8");

  assert.ok(metrics.accepted);
  assert.equal(metrics.packagingLayerModel, "UTF8_LEXICAL_OPEN_CLASS");
  assert.equal(metrics.canvasPresetColorId, "4");
  assert.equal(packer.bufferLexical[5], 65);
});

test("Sphere Packing: routes Base64 to inflection buffer with purple preset", () => {
  const packer = new OmiClampedSpherePacker();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = packer.evaluatePackedSequence(S, 20, 99, "base64");

  assert.ok(metrics.accepted);
  assert.equal(metrics.packagingLayerModel, "BASE64_INFLECTION_CLOSED_CLASS");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.equal(packer.bufferInflection[20], 99);
});

test("Sphere Packing: evicts tokens beyond 107-symbol ceiling", () => {
  const packer = new OmiClampedSpherePacker();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = packer.evaluatePackedSequence(S, 0, 115, "utf-8");

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "OUT-OF-BOUNDS_107_SYMBOL_EVICTION");
});

test("Sphere Packing: evicts unsupported encoding format", () => {
  const packer = new OmiClampedSpherePacker();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const metrics = packer.evaluatePackedSequence(S, 0, 42, "bogus");

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "UNSUPPORTED_ENCODING_PLANE_EVICTION");
});

test("Sphere Packing: evicts structurally invalid frames", () => {
  const packer = new OmiClampedSpherePacker();
  const S = parseOmiAddressToSegments("omi-0000-0000-0000-0000-0000-0000-0000-0000/48");

  const metrics = packer.evaluatePackedSequence(S, 0, 42, "code16k");

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test("Sphere Packing: '16k' and 'b64' shorthand aliases work", () => {
  const packer = new OmiClampedSpherePacker();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);

  const m1 = packer.evaluatePackedSequence(S, 1, 50, "16k");
  assert.equal(m1.canvasPresetColorId, "3");
  assert.equal(packer.bufferPointer[1], 50);

  const m2 = packer.evaluatePackedSequence(S, 2, 77, "b64");
  assert.equal(m2.canvasPresetColorId, "6");
  assert.equal(packer.bufferInflection[2], 77);

  const m3 = packer.evaluatePackedSequence(S, 3, 88, "utf8");
  assert.equal(m3.canvasPresetColorId, "4");
  assert.equal(packer.bufferLexical[3], 88);
});
