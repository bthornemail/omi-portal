import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { OmiPageFramerKernel, NAT64_WELL_KNOWN_PREFIX } from "../src/canvas/page-framer.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("DOM Framing: NAT64 prefix constant is well-known", () => {
  assert.equal(NAT64_WELL_KNOWN_PREFIX, "64:ff9b::/96");
});

test("DOM Framing: extracts embedded IPv4 from 16-bit segments", () => {
  const kernel = new OmiPageFramerKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.framePageLayer(S, "omi-64:ff9b::/96", 0xC0A8, 0x0132);
  assert.ok(metrics.accepted);
  assert.equal(metrics.opticalFramingModel, "NAT64_CODE16K_JABCODE_FRAMED");
  assert.equal(metrics.derivedIpv4String, "192.168.1.50");
  assert.equal(metrics.canvasPresetColorId, "6");
  assert.equal(metrics.timelineSlot, 0x7C00 % 5040);
});

test("DOM Framing: aligns with bare prefix without omi- prefix", () => {
  const kernel = new OmiPageFramerKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.framePageLayer(S, "64:ff9b::/96", 0xACD9, 0x0A0B);
  assert.ok(metrics.accepted);
  assert.equal(metrics.derivedIpv4String, "172.217.10.11");
  assert.equal(metrics.canvasPresetColorId, "6");
});

test("DOM Framing: evicts non-aligned iframe id", () => {
  const kernel = new OmiPageFramerKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.framePageLayer(S, "standard-legacy-iframe", 0x0000, 0x0000);
  assert.equal(metrics.accepted, false);
  assert.equal(metrics.opticalFramingModel, "STANDARD_UNFRAMED_DOM");
  assert.equal(metrics.canvasPresetColorId, "1");
});

test("DOM Framing: evicts structurally invalid frames", () => {
  const kernel = new OmiPageFramerKernel();
  const S = parseOmiAddressToSegments("omi-0000-0000-0000-0000-0000-0000-0000-0000/48");
  const metrics = kernel.framePageLayer(S, "omi-64:ff9b::/96", 0xC0A8, 0x0132);
  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test("DOM Framing: CLA adder fires across embedded octets", () => {
  const kernel = new OmiPageFramerKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.framePageLayer(S, "omi-64:ff9b::/96", 0x0A14, 0x0F01);
  assert.ok(metrics.accepted);
  assert.ok(metrics.simulatedAdderResult);
  assert.ok(typeof metrics.simulatedAdderResult.sumValue === "number");
});
