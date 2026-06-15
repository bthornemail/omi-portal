import test from "node:test";
import assert from "node:assert/strict";
import {
  GAUGE,
  GAUGE_NAMES,
  ACCEPTANCE_BRIDGE,
  sealedGauge,
  parseSealedGauge,
} from "../src/omi/sealed-gauge-word.js";

test("GAUGE defines four interpreter cards", () => {
  assert.equal(Object.keys(GAUGE).length, 4);
  assert.deepEqual(GAUGE_NAMES, ["FS", "GS", "RS", "US"]);
});

test("GAUGE FS card has correct mask token and role", () => {
  assert.equal(GAUGE.FS.mask, 0x0001);
  assert.equal(GAUGE.FS.token, "o---o");
  assert.equal(GAUGE.FS.role, "object");
});

test("GAUGE GS card has correct mask token and role", () => {
  assert.equal(GAUGE.GS.mask, 0x0010);
  assert.equal(GAUGE.GS.token, "/---/");
  assert.equal(GAUGE.GS.role, "path");
});

test("GAUGE RS card has correct mask token and role", () => {
  assert.equal(GAUGE.RS.mask, 0x0100);
  assert.equal(GAUGE.RS.token, "?---?");
  assert.equal(GAUGE.RS.role, "query");
});

test("GAUGE US card has correct mask token and role", () => {
  assert.equal(GAUGE.US.mask, 0x1000);
  assert.equal(GAUGE.US.token, "@---@");
  assert.equal(GAUGE.US.role, "socket");
});

test("ACCEPTANCE_BRIDGE is 0xAA55", () => {
  assert.equal(ACCEPTANCE_BRIDGE, 0xAA55);
});

test("sealedGauge(FS) = 0x0001AA55", () => {
  assert.equal(sealedGauge("FS"), 0x0001AA55);
});

test("sealedGauge(GS) = 0x0010AA55", () => {
  assert.equal(sealedGauge("GS"), 0x0010AA55);
});

test("sealedGauge(RS) = 0x0100AA55", () => {
  assert.equal(sealedGauge("RS"), 0x0100AA55);
});

test("sealedGauge(US) = 0x1000AA55", () => {
  assert.equal(sealedGauge("US"), 0x1000AA55);
});

test("sealedGauge returns unsigned uint32", () => {
  const sg = sealedGauge("US");
  assert.equal(sg, 0x1000AA55);
  assert.ok(sg >= 0 && sg <= 0xffffffff);
});

test("sealedGauge rejects unknown gauge name", () => {
  assert.throws(() => sealedGauge("XX"), RangeError);
  assert.throws(() => sealedGauge(""), RangeError);
  assert.throws(() => sealedGauge(null), RangeError);
});

test("parseSealedGauge round-trips all four gauges", () => {
  for (const name of GAUGE_NAMES) {
    const sg = sealedGauge(name);
    const parsed = parseSealedGauge(sg);
    assert.notEqual(parsed, null);
    assert.equal(parsed.name, name);
    assert.equal(parsed.mask, GAUGE[name].mask);
    assert.equal(parsed.token, GAUGE[name].token);
    assert.equal(parsed.role, GAUGE[name].role);
  }
});

test("parseSealedGauge returns null for invalid suffix", () => {
  assert.equal(parseSealedGauge(0x0001FFFF), null);
  assert.equal(parseSealedGauge(0), null);
});

test("parseSealedGauge returns null for unknown mask", () => {
  assert.equal(parseSealedGauge(0x0002AA55), null);
  assert.equal(parseSealedGauge(0xFFFFAA55), null);
});
