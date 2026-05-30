import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { extractBlockFloatingPoint } from "../src/canvas/omicron-canvas.js";

test("BFP Core: extractBlockFloatingPoint executes branchless CLZ exponent normalization", () => {
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const bfpMetrics = extractBlockFloatingPoint(S);
  assert.ok(bfpMetrics);

  // 0x7C00 = 0111 1100 0000 0000 → leading zero count = 1
  assert.equal(bfpMetrics.leadingZerosCount, 1);
  assert.equal(bfpMetrics.sharedBlockExponent, 15);

  // 0x7C00 << 1 = 0xF800
  assert.equal(bfpMetrics.normalizedNN, 0xF800);
});

test("BFP Core: handles quiet zero NN/MM edge values — peak from LL=1", () => {
  const zeroBoundToken = "omi-0100-03bf-0000-2b01-2f01-0000-039f-01ff/48";
  const S = parseOmiAddressToSegments(zeroBoundToken);

  const bfpMetrics = extractBlockFloatingPoint(S);
  assert.ok(bfpMetrics);
  // NN=0, MM=0, LL=1 (from S[3] & 0xFF) → peak=1 → CLZ=15
  assert.equal(bfpMetrics.leadingZerosCount, 15);
  assert.equal(bfpMetrics.sharedBlockExponent, 1);
  assert.equal(bfpMetrics.normalizedNN, 0);
  assert.equal(bfpMetrics.normalizedMM, 0);
});

test("BFP Core: returns null for invalid frame", () => {
  const result = extractBlockFloatingPoint(null);
  assert.equal(result, null);
});

test("BFP Core: peak amplitude picks the largest of NN, MM, LL", () => {
  // NN=0x0010, MM=0x0020, LL=0x04 → peak = 32
  const S = parseOmiAddressToSegments("omi-0100-03bf-0010-2b01-2f01-0020-039f-01ff/48");
  const bfpMetrics = extractBlockFloatingPoint(S);
  assert.ok(bfpMetrics);
  // 0x0020 = 32 → leadingZeros = 10 (0000 0000 0010 0000)
  assert.equal(bfpMetrics.leadingZerosCount, 10);
  assert.equal(bfpMetrics.sharedBlockExponent, 6);
});

test("BFP Core: targetSharedMemorySlot computed from exponent and raw NN", () => {
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);
  const bfpMetrics = extractBlockFloatingPoint(S);

  const rawNN = 0x7C00;
  const expectedSlot = (bfpMetrics.sharedBlockExponent * rawNN) % 5040;
  assert.equal(bfpMetrics.targetSharedMemorySlot, expectedSlot);
});

test("BFP Core: canvasColorHex maps exponent to hue", () => {
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);
  const bfpMetrics = extractBlockFloatingPoint(S);

  const expectedHue = (15 * 360) / 16;
  assert.equal(bfpMetrics.canvasColorHex, `hsl(${expectedHue}, 100%, 50%)`);
});

test("BFP Core: all-zero NN/MM with minimal LL gives small exponent", () => {
  // NN=0, MM=0, LL=1 → peak=1 → leadingZeros=15 → exponent=1
  const S = parseOmiAddressToSegments("omi-0100-03bf-0000-2b01-2f01-0000-039f-01ff/48");
  const bfpMetrics = extractBlockFloatingPoint(S);
  assert.ok(bfpMetrics);
  assert.equal(bfpMetrics.leadingZerosCount, 15);
  assert.equal(bfpMetrics.sharedBlockExponent, 1);
});
