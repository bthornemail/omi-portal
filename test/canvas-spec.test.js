import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import {
  convertSegmentToFp16Color,
  DELTA_TETRAHEDRAL_NODE_AXES,
  FP16_BASE_COLORS,
  OmiBarycentricCanvasKernel,
  OmiJsonCanvasKernel,
  OmiTetrahedralCanvasKernel,
  TWO_OF_FIVE_SELECTOR_PAIRS
} from "../src/canvas/omicron-canvas.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("Canvas Spec: generateOmicronCanvasSpec populates node and edge block sets", () => {
  const kernel = new OmiJsonCanvasKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const canvasObj = JSON.parse(kernel.generateOmicronCanvasSpec(S));

  assert.ok(canvasObj.nodes);
  assert.ok(canvasObj.edges);
  assert.equal(canvasObj.nodes.length, 4);
  assert.equal(canvasObj.edges.length, 1);

  assert.deepEqual(canvasObj.nodes.map((n) => n.type), ["text", "file", "group", "link"]);
  assert.deepEqual(
    canvasObj.nodes.map((n) => n.omi.component),
    ["OmiTextNode", "OmiFileNode", "OmiGroupNode", "OmiLinkNode"]
  );
  assert.equal(canvasObj.nodes.every((n) => n.omi.role === "OmicronNode"), true);
});

test("Canvas Spec: canvas color is the deterministic FP16 base controller", () => {
  const kernel = new OmiJsonCanvasKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const canvasObj = JSON.parse(kernel.generateOmicronCanvasSpec(S));
  const node = canvasObj.nodes[0];

  assert.match(node.color, /^#[0-9A-F]{6}$/);
  assert.ok(Object.values(FP16_BASE_COLORS).includes(node.color));
  assert.equal(node.color, node.omi.fp16Color.baseColorHex);
  assert.equal(Number.isInteger(node.omi.transitionState), true);
  assert.equal(node.omi.transitionState >= 0 && node.omi.transitionState < 10, true);
  assert.equal("colorSpectrum" in node.omi, false);
  assert.equal("legacyColorSpectrum" in node.omi, false);
  assert.equal("legacyTransitionState" in node.omi, false);
});

test("Canvas Spec: clockwise edge parameters comply with JSON Canvas limits", () => {
  const kernel = new OmiJsonCanvasKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const canvasObj = JSON.parse(kernel.generateOmicronCanvasSpec(S));
  const edge = canvasObj.edges[0];

  assert.equal(edge.fromSide, "right");
  assert.equal(edge.toSide, "left");
  assert.equal(edge.fromEnd, "none");
  assert.equal(edge.toEnd, "arrow");
  assert.equal(edge.fromNode, canvasObj.nodes[0].id);
  assert.equal(edge.toNode, canvasObj.nodes[1].id);
});

test("Canvas Spec: OmiNode projection keeps the same four components with component role changed", () => {
  const kernel = new OmiJsonCanvasKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const canvasObj = JSON.parse(kernel.generateOmiNodeCanvasSpec(S));

  assert.equal(canvasObj.nodes.length, 4);
  assert.equal(canvasObj.nodes.every((n) => n.omi.role === "OmiNode"), true);
});

test("Canvas Spec: returns an error payload if Gate 1 structural shell is corrupted", () => {
  const kernel = new OmiJsonCanvasKernel();
  const corruptedToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039e-01ff/48";
  const S = parseOmiAddressToSegments(corruptedToken);
  const errorObj = JSON.parse(kernel.generateOmicronCanvasSpec(S));

  assert.ok(errorObj.error);
  assert.equal(errorObj.error.includes("SURFACE_EVICTION"), true);
});

test("Canvas Spec: RULES.omi declares JSON Canvas invariant anchors", async () => {
  const rules = await readFile(new URL("../RULES.omi", import.meta.url), "utf8");

  assert.match(rules, /emit-json-canvas-compliant-syntax/);
  assert.doesNotMatch(rules, /encode-transition-table-state-colors/);
  assert.doesNotMatch(rules, new RegExp("/" + "16 MUST"));
  assert.match(rules, /force-clockwise-edge-resolution/);
});

test("FP16 Color: convertSegmentToFp16Color parses binary16 fields to four-color base components", () => {
  const colorSpec = convertSegmentToFp16Color(0x3c00);

  assert.equal(colorSpec.word, 0x3c00);
  assert.equal(colorSpec.signBit, 0);
  assert.equal(colorSpec.exponent, 15);
  assert.equal(colorSpec.fraction, 0);
  assert.equal(colorSpec.baseColorHex, FP16_BASE_COLORS.positiveSmall);
  assert.equal(colorSpec.nonagramSelectorState, 0);
  assert.deepEqual(colorSpec.selectorPair, [0, 1]);
  assert.equal(colorSpec.approximateFloatValue, 1.0);
});

test("FP16 Color: negative and large positive magnitudes map to separate base controllers", () => {
  assert.equal(convertSegmentToFp16Color(0xbc00).baseColorHex, FP16_BASE_COLORS.negative);
  assert.equal(convertSegmentToFp16Color(0x7bff).baseColorHex, FP16_BASE_COLORS.positiveLarge);
});

test("FP16 Color: enforces strict 2-of-5 nonagram selector bounds", () => {
  const colorSpec = convertSegmentToFp16Color(0xffff);

  assert.equal(colorSpec.nonagramSelectorState >= 0, true);
  assert.equal(colorSpec.nonagramSelectorState < TWO_OF_FIVE_SELECTOR_PAIRS.length, true);
  assert.equal(colorSpec.selectorPair.length, 2);
  assert.notEqual(colorSpec.selectorPair[0], colorSpec.selectorPair[1]);
  assert.equal("colorSpectrum" in colorSpec, false);
});

test("FP16 Color: Omicron canvas metadata carries SCGNN fp16 controller state", () => {
  const kernel = new OmiJsonCanvasKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const canvasObj = JSON.parse(kernel.generateOmicronCanvasSpec(S));
  const fp16 = canvasObj.nodes[0].omi.fp16Color;

  assert.ok(fp16);
  assert.equal(fp16.word, 0x1434);
  assert.match(fp16.packedMetadataString, /^#[0-9A-F]{6}:[0-9]$/);
  assert.equal(canvasObj.nodes.every((node) => node.omi.fp16Color.word === fp16.word), true);
});

test("FP16 Color: RULES.omi declares fp16 and nonagram invariant anchors", async () => {
  const rules = await readFile(new URL("../RULES.omi", import.meta.url), "utf8");

  assert.match(rules, /encode-fp16-sign-exponent-base/);
  assert.match(rules, /enforce-two-of-five-fraction-nonagram/);
  assert.match(rules, /execute-scgnn-input-function-weight/);
});

test("Hypergraph: tetrahedral canvas resolves OmicronNode as centroid of typed OmiNodes", () => {
  const kernel = new OmiTetrahedralCanvasKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const canvasObj = JSON.parse(kernel.generateTetrahedralCanvas(S));

  assert.equal(canvasObj.nodes.length, 5);
  assert.equal(canvasObj.edges.length, 4);

  const centroid = canvasObj.nodes[0];
  const vertices = canvasObj.nodes.slice(1);
  assert.equal(centroid.omi.role, "OmicronNode");
  assert.equal(centroid.omi.component, "OmicronCentroid");
  assert.deepEqual(vertices.map((node) => node.type), ["text", "file", "link", "group"]);
  assert.deepEqual(vertices.map((node) => node.omi.role), ["OmiNode", "OmiNode", "OmiNode", "OmiNode"]);
  assert.deepEqual(vertices.map((node) => node.omi.component), DELTA_TETRAHEDRAL_NODE_AXES.map((axis) => axis.component));
  assert.deepEqual(vertices.map((node) => node.omi.deltaFunction), ["rotl(x,1)", "rotl(x,3)", "rotr(x,2)", "C"]);
  assert.deepEqual(vertices.map((node) => node.omi.baseDomain), ["US", "FS", "RS", "GS"]);
});

test("Hypergraph: barycentric centroid derives from OMI segment words with deterministic color", () => {
  const kernel = new OmiTetrahedralCanvasKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const canvasObj = JSON.parse(kernel.generateTetrahedralCanvas(S, 100));
  const centroid = canvasObj.nodes[0];

  const expectedX = Math.trunc((S[1] + S[2] + S[5] + S[7]) / 4) % 1000;
  const expectedY = Math.trunc((S[0] + S[3] + S[4] + S[6]) / 4) % 1000;
  assert.deepEqual(centroid.omi.barycentricCentroid, { x: expectedX, y: expectedY });
  assert.equal(canvasObj.nodes.every((node) => node.color === centroid.color), true);
  assert.equal(centroid.color, centroid.omi.fp16Color.baseColorHex);
  assert.equal("colorSpectrum" in centroid.omi, false);
});

test("Hypergraph: malformed tetrahedral input rejects before coordinate generation", () => {
  const kernel = new OmiTetrahedralCanvasKernel();
  const corruptedToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039e-01ff/48";
  const S = parseOmiAddressToSegments(corruptedToken);
  const errorObj = JSON.parse(kernel.generateTetrahedralCanvas(S));

  assert.ok(errorObj.error);
  assert.equal(errorObj.error.includes("MANIFOLD_EVICTION"), true);
});

test("Hypergraph: RULES.omi declares tetrahedral centroid invariants", async () => {
  const rules = await readFile(new URL("../RULES.omi", import.meta.url), "utf8");

  assert.match(rules, /map-delta-law-to-tetrahedral-vertices/);
  assert.match(rules, /derive-barycentric-canvas-coordinates/);
  assert.match(rules, /encode-hypergraph-state-color-fields/);
});

test("Barycentric Substrate: processMetadataDividend packs 24-bit execution receipt", () => {
  const kernel = new OmiBarycentricCanvasKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.processMetadataDividend(S, 0xABC1, () => 1);

  assert.equal(metrics.accepted, true);
  assert.equal(metrics.timelineSlot, 1504);
  assert.equal(metrics.orbitIndex, 41);
  assert.equal(metrics.offsetIndex, 28);
  assert.equal(metrics.hueAngleDegrees, 280);
  assert.equal(Number(metrics.packed64BitWord >> 48n), 0xABC1);
  assert.equal(Number((metrics.packed64BitWord >> 40n) & 0xFFn), 1);
  assert.equal(metrics.coreTruthRow, 0x017C001434n);
});

test("Barycentric Substrate: processMetadataDividend rejects failed truth-row convergence", () => {
  const kernel = new OmiBarycentricCanvasKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.processMetadataDividend(S, 0x0001, () => 15);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_2_RESOLUTION_DIVERGENCE");
});

test("Barycentric Substrate: malformed input rejects before metadata packing", () => {
  const kernel = new OmiBarycentricCanvasKernel();
  const corruptedToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039e-01ff/48";
  const S = parseOmiAddressToSegments(corruptedToken);
  const metrics = kernel.processMetadataDividend(S, 0x0001, () => 1);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_ALGEBRAIC_EVICTION");
});

test("Barycentric Substrate: RULES.omi declares 360-degree and 24-bit metadata invariants", async () => {
  const rules = await readFile(new URL("../RULES.omi", import.meta.url), "utf8");

  assert.match(rules, /coordinate-three-sixty-degree-colors/);
  assert.match(rules, /pack-local-execution-metadata-slip/);
});
