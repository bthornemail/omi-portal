import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { OmiJabScramblerKernel } from "../src/canvas/jab-scrambler.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("JAB Scrambler: LFSR scrambling routes to low nibble axis", () => {
  const kernel = new OmiJabScramblerKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const mockPayload = new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD]);
  const metrics = kernel.processAndRouteJabStream(S, mockPayload, 0x1337, 3);

  assert.ok(metrics.accepted);
  assert.equal(metrics.nbdAxisId, 3);
  assert.equal(metrics.isHighNibbleAxis, false);
  assert.equal(metrics.axisMappingModel, "LOW_NIBBLE_AXIS_0_7");
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.ok(typeof metrics.timelineSlot === "number");
});

test("JAB Scrambler: high nibble axis maps and updates indicator presets", () => {
  const kernel = new OmiJabScramblerKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const mockPayload = new Uint8Array([0x11, 0x22, 0x33, 0x44]);
  const metrics = kernel.processAndRouteJabStream(S, mockPayload, 0x5A3C, 12);

  assert.ok(metrics.accepted);
  assert.equal(metrics.nbdAxisId, 12);
  assert.equal(metrics.isHighNibbleAxis, true);
  assert.equal(metrics.axisMappingModel, "HIGH_NIBBLE_AXIS_8_F");
  assert.equal(metrics.canvasPresetColorId, "6");
});

test("JAB Scrambler: evicts structurally invalid frames", () => {
  const kernel = new OmiJabScramblerKernel();
  const S = parseOmiAddressToSegments("omi-0000-0000-0000-0000-0000-0000-0000-0000/48");
  const mockPayload = new Uint8Array([0x01, 0x02]);
  const metrics = kernel.processAndRouteJabStream(S, mockPayload, 0x1337, 0);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_ALGEBRAIC_SURFACE_FAULT");
});

test("JAB Scrambler: scrambled output differs from input", () => {
  const kernel = new OmiJabScramblerKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const mockPayload = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
  const metrics = kernel.processAndRouteJabStream(S, mockPayload, 0xDEAD, 5);

  assert.ok(metrics.accepted);
  assert.notEqual(metrics.totalStructuralXorSum, 0);
  assert.equal(metrics.canvasPresetColorId, "5");
});

test("JAB Scrambler: non-zero XOR sum escapes warning preset", () => {
  const kernel = new OmiJabScramblerKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const mockPayload = new Uint8Array([0xFF, 0x00, 0xFF, 0x00]);
  const metrics = kernel.processAndRouteJabStream(S, mockPayload, 0x1234, 7);

  assert.ok(metrics.accepted);
  assert.notEqual(metrics.totalStructuralXorSum, 0);
  assert.notEqual(metrics.canvasPresetColorId, "1");
});
