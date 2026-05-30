import { test } from "node:test";
import { strict as assert } from "node:assert";
import { OmiFp16CanvasEncoder } from "../src/canvas/omicron-canvas.js";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";

function makeGenesisS() {
  return parseOmiAddressToSegments("omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48");
}

test("FP16 Canvas: encoder slices binary16 bits into correct graphical properties", () => {
  const encoder = new OmiFp16CanvasEncoder();
  const S = makeGenesisS();
  const rawJson = encoder.encodeWireFrameToCanvasSpec(S);
  const canvasObj = JSON.parse(rawJson);

  assert.ok(canvasObj);
  assert.ok(canvasObj.nodes);
  assert.equal(canvasObj.nodes.length, 1);

  // 0x7C00 = 0111 1100 0000 0000 → significand bits are exactly zero
  assert.equal(canvasObj.nodes[0].id, "omi-node-significand-0");
});

test("FP16 Canvas: sign bit resolves to Greek for bit=0 and Coptic for bit=1", () => {
  const encoder = new OmiFp16CanvasEncoder();

  const positive = encoder.resolveSignUnicode(0x7C00); // bit 15 = 0
  assert.equal(positive.bit, 0);
  assert.equal(positive.script, "Greek");
  assert.equal(positive.prefix, "U+03BF ο");

  const negative = encoder.resolveSignUnicode(0xFC00); // bit 15 = 1
  assert.equal(negative.bit, 1);
  assert.equal(negative.script, "Coptic");
  assert.equal(negative.prefix, "U+2C9F ⲟ");
});

test("FP16 Canvas: exponent bits route to correct tetrahedral vertex", () => {
  const encoder = new OmiFp16CanvasEncoder();

  // exponent % 4 === 0 → OmiTextNode
  const e0 = encoder.resolveExponentRouting(0x0000); // exponent = 0
  assert.equal(e0.activeVertex.node, "OmiTextNode");

  // exponent % 4 === 1 → OmiFileNode
  const e1 = encoder.resolveExponentRouting(0x0400); // exponent = 1
  assert.equal(e1.activeVertex.node, "OmiFileNode");

  // exponent % 4 === 2 → OmiLinkNode
  const e2 = encoder.resolveExponentRouting(0x0800); // exponent = 2
  assert.equal(e2.activeVertex.node, "OmiLinkNode");

  // exponent % 4 === 3 → OmiGroupNode
  const e3 = encoder.resolveExponentRouting(0x0C00); // exponent = 3
  assert.equal(e3.activeVertex.node, "OmiGroupNode");

  // masterRotation string includes rotr(x,16)
  assert.ok(e0.masterRotation.includes("rotr(x,16)"));
});

test("FP16 Canvas: significand bits map to hue, offsets, and NBD device", () => {
  const encoder = new OmiFp16CanvasEncoder();

  const sc0 = encoder.resolveSignificandColor(0x0000); // significand = 0
  assert.equal(sc0.significandBits, 0);
  assert.equal(sc0.hueDegrees, 0);
  assert.equal(sc0.hsl, "hsl(0, 100%, 50%)");

  const sc512 = encoder.resolveSignificandColor(0x0200); // significand = 512
  assert.equal(sc512.significandBits, 512);
  assert.equal(Math.round(sc512.hueDegrees), 180);
  assert.equal(sc512.hsl, "hsl(180, 100%, 50%)");

  const scMax = encoder.resolveSignificandColor(0x03FF); // significand = 1023
  assert.equal(scMax.significandBits, 1023);
  assert.equal(Math.round(scMax.hueDegrees), 360);
});

test("FP16 Canvas: encodeWireFrameToCanvasSpec rejects invalid frame", () => {
  const encoder = new OmiFp16CanvasEncoder();
  const result = encoder.encodeWireFrameToCanvasSpec(null);
  const parsed = JSON.parse(result);
  assert.equal(parsed.error, "GATE_1_ALGEBRAIC_SURFACE_EVICTION");
});

test("FP16 Canvas: encoder processes genesis word deterministically", () => {
  const encoder = new OmiFp16CanvasEncoder();
  const S = makeGenesisS();

  const a = JSON.parse(encoder.encodeWireFrameToCanvasSpec(S, 200, 300));
  const b = JSON.parse(encoder.encodeWireFrameToCanvasSpec(S, 200, 300));

  assert.equal(a.nodes[0].id, b.nodes[0].id);
  assert.equal(a.nodes[0].color, b.nodes[0].color);
  assert.equal(a.nodes[0].x, b.nodes[0].x);
});

test("FP16 Canvas: significand x-offset follows sexagesimal modulo", () => {
  const encoder = new OmiFp16CanvasEncoder();

  const sc = encoder.resolveSignificandColor(0x003C); // significand = 60
  assert.equal(sc.xOffset, 0); // 60 % 60 = 0
  assert.equal(sc.yOffset, 1); // Math.trunc(60/60) % 60 = 1
});

test("FP16 Canvas: NBD device mapping from significand", () => {
  const encoder = new OmiFp16CanvasEncoder();

  assert.equal(encoder.resolveSignificandColor(0x0000).nbdDevice, "/dev/nbd0");
  assert.equal(encoder.resolveSignificandColor(0x0064).nbdDevice, "/dev/nbd10"); // 100/10 = 10
  assert.equal(encoder.resolveSignificandColor(0x03FF).nbdDevice, "/dev/nbd102"); // 1023/10 = 102
});

test("FP16 Canvas: exponent routing returns all four tetrahedral vertices", () => {
  const encoder = new OmiFp16CanvasEncoder();
  const e = encoder.resolveExponentRouting(0x0000);
  assert.equal(e.tetrahedralMap.length, 4);
  assert.equal(e.tetrahedralMap[0].node, "OmiTextNode");
  assert.equal(e.tetrahedralMap[1].node, "OmiFileNode");
  assert.equal(e.tetrahedralMap[2].node, "OmiLinkNode");
  assert.equal(e.tetrahedralMap[3].node, "OmiGroupNode");
});
