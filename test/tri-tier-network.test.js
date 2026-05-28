import test from "node:test";
import assert from "node:assert/strict";
import { OmiTriTierNetworkEngine } from "../src/web/tri-tier-network.js";

const MOCK_B64 = "AADAPwAAAEAAAAC_AAAgQQ";

test("OmiTriTierNetworkEngine constructs with default SAB", () => {
  const engine = new OmiTriTierNetworkEngine();
  assert.ok(engine instanceof OmiTriTierNetworkEngine);
});

test("parseTriTierAddress parses ESP32 hardware token", () => {
  const engine = new OmiTriTierNetworkEngine();
  const addr = "omi-ffff-127-0-0-1-0x01-esp32-wlp2s0-slot720-" + MOCK_B64;
  const result = engine.parseTriTierAddress(addr);
  assert.ok(result.valid);
  assert.equal(result.tier, "TIER_1_PHYSICAL_HARDWARE");
  assert.equal(result.hardware.opcode, "0x01");
  assert.equal(result.hardware.device, "wlp2s0");
  assert.equal(result.clockTick, 720);
  assert.ok(result.coefficients instanceof Float32Array);
});

test("parseTriTierAddress parses VPS cloud token", () => {
  const engine = new OmiTriTierNetworkEngine();
  const addr = "omi-ffff-127-0-0-1-0x04-vps-ens6-slot5040-" + MOCK_B64;
  const result = engine.parseTriTierAddress(addr);
  assert.ok(result.valid);
  assert.equal(result.tier, "TIER_3_CLOUD_ROUTING_LEDGER");
  assert.equal(result.hardware.opcode, "0x04");
  assert.equal(result.hardware.device, "ens6");
  assert.equal(result.clockTick, 5040);
});

test("parseTriTierAddress rejects external domain", () => {
  const engine = new OmiTriTierNetworkEngine();
  const result = engine.parseTriTierAddress("omi-other-192-168-1-1-0x01-esp32-wlp2s0-slot720-AACA");
  assert.ok(result);
  assert.equal(result.valid, false);
  assert.equal(result.error, "External or Un-Authorized Network Domain Path");
});

test("parseTriTierAddress returns null for non-omi string", () => {
  const engine = new OmiTriTierNetworkEngine();
  assert.equal(engine.parseTriTierAddress("http://example.com"), null);
});

test("compileTransitFrame produces valid 16-byte buffer", () => {
  const engine = new OmiTriTierNetworkEngine();
  const addr = "omi-ffff-127-0-0-1-0x01-esp32-wlp2s0-slot720-" + MOCK_B64;
  const frame = engine.compileTransitFrame(addr);
  assert.ok(frame);
  assert.equal(frame.byteLength, 16);
  const view = new DataView(frame);
  assert.equal(view.getUint8(0), 0x01);
  assert.equal(view.getUint8(1), 1);
  assert.equal(view.getUint32(2, true), 720);
  assert.equal(view.getUint16(14, true), 0xAA55);
});

test("compileTransitFrame produces 16-byte buffer for VPS tier", () => {
  const engine = new OmiTriTierNetworkEngine();
  const addr = "omi-ffff-127-0-0-1-0x04-vps-ens6-slot5040-" + MOCK_B64;
  const frame = engine.compileTransitFrame(addr);
  assert.ok(frame);
  assert.equal(frame.byteLength, 16);
  const view = new DataView(frame);
  assert.equal(view.getUint8(1), 3);
  assert.equal(view.getUint32(2, true), 5040);
});

test("compileTransitFrame returns null for invalid address", () => {
  const engine = new OmiTriTierNetworkEngine();
  assert.equal(engine.compileTransitFrame("bad-addr"), null);
  assert.equal(engine.compileTransitFrame("omi-ffff-127-0-0-1-0x01-esp32-wlp2s0"), null);
});

test("compileTransitFrame returns null for no coefficients", () => {
  const engine = new OmiTriTierNetworkEngine();
  const addr = "omi-ffff-127-0-0-1-0x01-esp32-wlp2s0-slot720";
  assert.equal(engine.compileTransitFrame(addr), null);
});

test("slotFromTier maps correctly", () => {
  const engine = new OmiTriTierNetworkEngine();
  assert.equal(engine.slotFromTier("TIER_1_PHYSICAL_HARDWARE"), 720);
  assert.equal(engine.slotFromTier("TIER_2_LOCAL_EDGE_NODE"), 1440);
  assert.equal(engine.slotFromTier("TIER_3_CLOUD_ROUTING_LEDGER"), 5040);
  assert.equal(engine.slotFromTier("UNKNOWN"), 0);
});

test("cons/car/cdr cell primitives", () => {
  const engine = new OmiTriTierNetworkEngine();
  const cell = engine.cons("a", "b");
  assert.equal(engine.car(cell), "a");
  assert.equal(engine.cdr(cell), "b");
});
