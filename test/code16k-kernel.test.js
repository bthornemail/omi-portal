import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { OmiCode16KRegisterKernel, CODE16K_MODULO_BASE } from "../src/canvas/code16k-kernel.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("Code 16K Core: starting character packaging isolates Set C pointer mode", () => {
  const kernel = new OmiCode16KRegisterKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const mockCharacters = new Uint8Array([33, 34, 35]);
  const metrics = kernel.decodeMultiRowFrame(S, mockCharacters, 4, 2);

  assert.ok(metrics.accepted);
  assert.equal(metrics.packedStartingChar, 7 * (4 - 2) + 2);
  assert.equal(metrics.activeCodeSetModel, "INITIAL_SET_C_OTHER_POINTER");
  assert.equal(metrics.canvasPresetColorId, "3");

  const expectedC1 = (2 * 16 + 2 * 33 + 3 * 34 + 4 * 35) % CODE16K_MODULO_BASE;
  const expectedC2 = (1 * 16 + 2 * 33 + 3 * 34 + 4 * 35) % CODE16K_MODULO_BASE;
  assert.equal(metrics.expectedC1, expectedC1);
  assert.equal(metrics.expectedC2, expectedC2);
  assert.ok(typeof metrics.timelineSlot === "number");
});

test("Code 16K Core: Set A lexical mode maps to green preset", () => {
  const kernel = new OmiCode16KRegisterKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const mockCharacters = new Uint8Array([65, 66]);
  const metrics = kernel.decodeMultiRowFrame(S, mockCharacters, 6, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.packedStartingChar, 7 * (6 - 2) + 0);
  assert.equal(metrics.activeCodeSetModel, "INITIAL_SET_A_LEXICAL");
  assert.equal(metrics.canvasPresetColorId, "4");
});

test("Code 16K Core: Set B inflectional mode maps to purple preset", () => {
  const kernel = new OmiCode16KRegisterKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.decodeMultiRowFrame(S, new Uint8Array([97, 98, 99]), 10, 1);

  assert.ok(metrics.accepted);
  assert.equal(metrics.packedStartingChar, 7 * (10 - 2) + 1);
  assert.equal(metrics.activeCodeSetModel, "INITIAL_SET_B_INFLECTIONAL");
  assert.equal(metrics.canvasPresetColorId, "6");
});

test("Code 16K Core: row count clamps to valid range", () => {
  const kernel = new OmiCode16KRegisterKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.decodeMultiRowFrame(S, new Uint8Array([10]), 99, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.packedStartingChar, 7 * (16 - 2) + 0);
});

test("Code 16K Core: evicts structurally invalid frames", () => {
  const kernel = new OmiCode16KRegisterKernel();
  const S = parseOmiAddressToSegments("omi-0000-0000-0000-0000-0000-0000-0000-0000/48");
  const metrics = kernel.decodeMultiRowFrame(S, new Uint8Array([0]), 2, 0);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_ALGEBRAIC_SURFACE_FAULT");
});

test("Code 16K Core: modulo-107 check matches for larger character arrays", () => {
  const kernel = new OmiCode16KRegisterKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const mockChars = new Uint8Array([10, 20, 30, 40, 50]);
  const metrics = kernel.decodeMultiRowFrame(S, mockChars, 8, 1);

  let c1 = 2 * metrics.packedStartingChar;
  let c2 = 1 * metrics.packedStartingChar;
  for (let i = 0; i < mockChars.length; i++) {
    c1 += (i + 2) * (mockChars[i] & 0x7F);
    c2 += (i + 2) * (mockChars[i] & 0x7F);
  }
  assert.equal(metrics.expectedC1, c1 % CODE16K_MODULO_BASE);
  assert.equal(metrics.expectedC2, c2 % CODE16K_MODULO_BASE);
});
