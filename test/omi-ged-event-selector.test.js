import test from "node:test";
import assert from "node:assert/strict";
import {
  maskForBit,
  encodeSelector,
  decodeSelector,
  extractGaugeLane,
} from "../src/qemu/omi-ged-event-selector.js";

test("maskForBit returns unsigned bitmask", () => {
  assert.equal(maskForBit(0), 0x00000001 >>> 0);
  assert.equal(maskForBit(4), 0x00000010 >>> 0);
  assert.equal(maskForBit(28), 0x10000000 >>> 0);
  assert.equal(maskForBit(31), 0x80000000 >>> 0);
});

test("maskForBit rejects out of range", () => {
  assert.throws(() => maskForBit(-1), RangeError);
  assert.throws(() => maskForBit(32), RangeError);
  assert.throws(() => maskForBit(1.5), RangeError);
  assert.throws(() => maskForBit("a"), RangeError);
});

test("encodeSelector combines bits", () => {
  assert.equal(encodeSelector([0]), 0x00000001 >>> 0);
  assert.equal(encodeSelector([31]), 0x80000000 >>> 0);
  assert.equal(encodeSelector([0, 31]), 0x80000001 >>> 0);
  assert.equal(encodeSelector([0, 1, 2]), 0x00000007 >>> 0);
});

test("encodeSelector empty returns zero", () => {
  assert.equal(encodeSelector([]), 0);
});

test("decodeSelector returns ascending bit indices", () => {
  assert.deepEqual(decodeSelector(0), []);
  assert.deepEqual(decodeSelector(0x00000001), [0]);
  assert.deepEqual(decodeSelector(0x80000000), [31]);
  assert.deepEqual(decodeSelector(0x80000001), [0, 31]);
  assert.deepEqual(decodeSelector(0x00000007), [0, 1, 2]);
});

test("decodeSelector(0xFFFFFFFF) returns all 32 bits in ascending order", () => {
  const bits = decodeSelector(0xFFFFFFFF);
  assert.equal(bits.length, 32);
  for (let i = 0; i < 32; i++) assert.equal(bits[i], i);
});

test("encodeSelector round-trips through decodeSelector", () => {
  for (const bits of [[], [0], [31], [0, 31], [4, 8, 15, 16, 23]]) {
    const sel = encodeSelector(bits);
    const decoded = decodeSelector(sel);
    assert.deepEqual(decoded, [...bits].sort((a, b) => a - b));
  }
});

test("extractGaugeLane reads bits 28..31 only", () => {
  assert.equal(extractGaugeLane(0x00000000), null);
  assert.equal(extractGaugeLane(0x10000000), "FS");
  assert.equal(extractGaugeLane(0x20000000), "GS");
  assert.equal(extractGaugeLane(0x40000000), "RS");
  assert.equal(extractGaugeLane(0x80000000), "US");
});

test("extractGaugeLane ignores lower bits", () => {
  assert.equal(extractGaugeLane(0x10000FFF), "FS");
  assert.equal(extractGaugeLane(0x2FFFFFFF), "GS");
  assert.equal(extractGaugeLane(0x4FFFFFFF), "RS");
  assert.equal(extractGaugeLane(0x8FFFFFFF), "US");
});

test("extractGaugeLane returns null for non-canonical bit patterns", () => {
  assert.equal(extractGaugeLane(0x30000000), null);
  assert.equal(extractGaugeLane(0xF0000000), null);
  assert.equal(extractGaugeLane(0x00000001), null);
});

test("bit 31 survives unsigned round-trip", () => {
  const sel = encodeSelector([31]);
  assert.equal(sel, 0x80000000 >>> 0);
  assert.ok(sel > 0);
  assert.ok(sel <= 0xffffffff);
  const decoded = decodeSelector(sel);
  assert.deepEqual(decoded, [31]);
});
