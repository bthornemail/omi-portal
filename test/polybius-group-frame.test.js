import test from "node:test";
import assert from "node:assert/strict";
import { RAIL, railByte, word16, interpretWord16 } from "../src/omi/polybius-group-frame.js";

test("rail map defines six selectors", () => {
  assert.equal(Object.keys(RAIL).length, 6);
  assert.equal(RAIL[2], 0x55);
  assert.equal(RAIL[3], 0x66);
  assert.equal(RAIL[4], 0x77);
  assert.equal(RAIL[5], 0x88);
  assert.equal(RAIL[6], 0x99);
  assert.equal(RAIL["∞"], 0xAA);
});

test("railByte maps selectors to bytes", () => {
  assert.equal(railByte(2), 0x55);
  assert.equal(railByte(3), 0x66);
  assert.equal(railByte(4), 0x77);
  assert.equal(railByte(5), 0x88);
  assert.equal(railByte(6), 0x99);
  assert.equal(railByte("∞"), 0xAA);
});

test("railByte rejects invalid selector", () => {
  assert.throws(() => railByte(7), RangeError);
  assert.throws(() => railByte("x"), RangeError);
  assert.throws(() => railByte(null), RangeError);
});

test("word16 combines two rails", () => {
  assert.equal(word16(2, 2), 0x5555);
  assert.equal(word16(2, "∞"), 0x55AA);
  assert.equal(word16("∞", 2), 0xAA55);
  assert.equal(word16("∞", "∞"), 0xAAAA);
  assert.equal(word16(2, 3), 0x5566);
  assert.equal(word16(3, 2), 0x6655);
});

test("word16 returns unsigned uint16", () => {
  const result = word16(6, 6);
  assert.equal(result, 0x9999);
  assert.ok(result >= 0 && result <= 0xffff);
});

test("interpretWord16 round-trips valid values", () => {
  for (const p of [2, 3, 4, 5, 6, "∞"]) {
    for (const r of [2, 3, 4, 5, 6, "∞"]) {
      const w = word16(p, r);
      const back = interpretWord16(w);
      assert.notEqual(back, null);
      assert.equal(back.p, String(p));
      assert.equal(back.r, String(r));
    }
  }
});

test("interpretWord16 returns null for unknown byte", () => {
  assert.equal(interpretWord16(0x0000), null);
  assert.equal(interpretWord16(0xFFFF), null);
  assert.equal(interpretWord16(0x55CC), null);
});
