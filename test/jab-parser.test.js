import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import {
  OmiJabCodeParser,
  evaluateChromaticModeSwitch,
  evaluateCode16KModeSwitch
} from "../src/canvas/jab-parser.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("JAB Code: parser handles subtractive CMYK colors and verifies finders", () => {
  const parser = new OmiJabCodeParser();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = parser.parseChromaticMatrix(S, "CYAN", 4, 0x05);

  assert.ok(metrics.accepted);
  assert.equal(metrics.colorType, "SUBTRACTIVE_PRIMARY");
  assert.equal(metrics.colorIdCode, 0);
  assert.equal(metrics.derivedDigitValue, 5);
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.ok(typeof metrics.timelineSlot === "number");
});

test("JAB Code: evicts malformed streams missing required finder structures", () => {
  const parser = new OmiJabCodeParser();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = parser.parseChromaticMatrix(S, "YELLOW", 3, 0x02);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "MALFORMED_FINDER_GEOMETRY_EVICTION");
});

test("JAB Code: evicts out of spectrum colors", () => {
  const parser = new OmiJabCodeParser();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = parser.parseChromaticMatrix(S, "ORANGE", 4, 0x00);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "OUTSIDE_CHROMATIC_SPECTRUM_EVICTION");
});

test("Chromatic Bridge: computes Delta Law shifts and isolates Fano points", () => {
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = evaluateChromaticModeSwitch(S, 0x1337, 4);

  assert.ok(metrics.accepted);
  assert.equal(metrics.bridgeLayerModel, "CHROMATIC_JABCODE_ACTIVE");
  assert.ok(metrics.fanoPointIndex >= 1 && metrics.fanoPointIndex <= 7);
  assert.equal(metrics.canvasPresetColorId, "3");
  assert.ok(typeof metrics.timelineSlot === "number");
});

test("Chromatic Bridge: evicts zero-Fano inputs and routes to warning presets", () => {
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = evaluateChromaticModeSwitch(S, 0x0002, 4);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.bridgeLayerModel, "LINEAR_CODE16K_PASS");
  assert.equal(metrics.canvasPresetColorId, "1");
});

test("Code 16K: engine computes Delta Law shifts and isolates Set C", () => {
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = evaluateCode16KModeSwitch(S, 0x0001, "C", 4);

  assert.ok(metrics.accepted);
  assert.equal(metrics.bridgeLayerModel, "CHROMATIC_JABCODE_ACTIVE");
  assert.equal(metrics.characterSetId, 3);
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.ok(typeof metrics.timelineSlot === "number");
});

test("Code 16K: evicts invalid character sets and routes to warning presets", () => {
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = evaluateCode16KModeSwitch(S, 0x1337, "Z", 4);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "INVALID_CODE16K_CHARACTER_SET_EVICTION");
});

test("Code 16K: evicts structurally invalid frames", () => {
  const S = parseOmiAddressToSegments("omi-0000-0000-0000-0000-0000-0000-0000-0000/48");
  const metrics = evaluateCode16KModeSwitch(S, 0x1337, "A", 4);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});
