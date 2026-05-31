import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { OmiPolytopicNeuralKernel } from "../src/omi/polytopic-neural.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("Polytopic Neural: expands n=6 truth table to 64 rows", () => {
  const kernel = new OmiPolytopicNeuralKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const table = kernel.expandTruthTable6(S);
  assert.equal(table.length, 64);
  assert.ok(table[0] <= 63);
  assert.ok(table[63] <= 63);
});

test("Polytopic Neural: projects 5-Cell simplex from truth table", () => {
  const kernel = new OmiPolytopicNeuralKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const table = kernel.expandTruthTable6(S);
  const five = kernel.projectFiveCell(table);
  assert.equal(five.length, 5);
  five.forEach(v => assert.ok(v >= 0 && v <= 1));
});

test("Polytopic Neural: projects 24-Cell self-dual from truth table", () => {
  const kernel = new OmiPolytopicNeuralKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const table = kernel.expandTruthTable6(S);
  const cell24 = kernel.project24Cell(table);
  assert.equal(cell24.length, 24);
  cell24.forEach(v => assert.ok(v >= 0 && v <= 1));
});

test("Polytopic Neural: chromatic bridge maps half-precision preset", () => {
  const kernel = new OmiPolytopicNeuralKernel();
  const bridge = kernel.chromaticBridge(0.85, 0);
  assert.equal(bridge.precisionBits, 16);
  assert.equal(bridge.precisionLabel, "HALF");
  assert.equal(bridge.canvasPresetColorId, "5");
});

test("Polytopic Neural: chromatic bridge maps octuple-precision preset", () => {
  const kernel = new OmiPolytopicNeuralKernel();
  const bridge = kernel.chromaticBridge(0.2, 4);
  assert.equal(bridge.precisionBits, 256);
  assert.equal(bridge.precisionLabel, "OCTUPLE");
  assert.equal(bridge.canvasPresetColorId, "6");
});

test("Polytopic Neural: projects 600-Cell vertices from truth table", () => {
  const kernel = new OmiPolytopicNeuralKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const table = kernel.expandTruthTable6(S);
  const vertices = kernel.project600CellVertices(table);
  assert.equal(vertices.length, 120);
});

test("Polytopic Neural: verifies snub passes for 5-cell projection", () => {
  const kernel = new OmiPolytopicNeuralKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const table = kernel.expandTruthTable6(S);
  const five = kernel.projectFiveCell(table);
  const snub = kernel.verifySnub(five, "5-cell");
  assert.equal(snub.valid, true);
  assert.equal(snub.canvasPresetColorId, "5");
});

test("Polytopic Neural: full evaluatePolytopic returns complete result", () => {
  const kernel = new OmiPolytopicNeuralKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const result = kernel.evaluatePolytopic(S, new Uint8Array(6), 2);
  assert.ok(result.accepted);
  assert.equal(result.truthTableSize, 64);
  assert.equal(result.fiveCellProjection.length, 5);
  assert.equal(result.cell24Projection.length, 24);
  assert.equal(result.vertices600Count, 120);
  assert.equal(result.dodecahedra120Count, 120);
});

test("Polytopic Neural: evicts structurally invalid frames", () => {
  const kernel = new OmiPolytopicNeuralKernel();
  const S = parseOmiAddressToSegments("omi-0000-0000-0000-0000-0000-0000-0000-0000/48");
  const result = kernel.evaluatePolytopic(S, new Uint8Array(6));
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});
