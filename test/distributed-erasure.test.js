import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rsEncode, rsDecode, gfAdd, gfMul, gfDiv, gfInv } from "../src/distributed/erasure.js";

describe("GF(2^8) arithmetic", () => {
  it("addition is XOR", () => {
    assert.equal(gfAdd(0xa5, 0x5a), 0xff);
    assert.equal(gfAdd(0xff, 0xff), 0x00);
  });

  it("multiplication and inverse", () => {
    assert.equal(gfMul(2, 3), 6);
    assert.equal(gfMul(1, 42), 42);
    assert.equal(gfMul(0, 100), 0);
    assert.equal(gfMul(gfInv(5), 5), 1);
  });

  it("division is mul by inverse", () => {
    assert.equal(gfDiv(10, 2), gfMul(10, gfInv(2)));
    assert.throws(() => gfDiv(1, 0), RangeError);
    assert.throws(() => gfInv(0), RangeError);
  });
});

describe("Reed-Solomon RS(k,n) over GF(2^8)", () => {
  it("encodes and decodes correctly for RS(2,4) with 2-byte data", () => {
    const data = Uint8Array.from([0x12, 0x34]);
    const fragments = rsEncode(data, 2, 4);
    assert.equal(fragments.length, 4);
    fragments.forEach((f) => assert.equal(f.length, 1));

    const decoded = rsDecode(fragments.slice(0, 2), [0, 1], 2, 4);
    assert.deepEqual([...decoded], [0x12, 0x34]);
  });

  it("recovers from fragment loss for RS(3,5)", () => {
    const data = Uint8Array.from([1, 2, 3, 4, 5, 6]);
    const fragments = rsEncode(data, 3, 5);
    const erased = [fragments[0], fragments[2], fragments[4]];
    const decoded = rsDecode(erased, [0, 2, 4], 3, 5);
    assert.deepEqual([...decoded], [1, 2, 3, 4, 5, 6]);
  });

  it("recovers from partial loss for RS(4,7)", () => {
    const data = Uint8Array.from(Array(8).fill(0).map((_, i) => i + 10));
    const fragments = rsEncode(data, 4, 7);
    const subset = [fragments[1], fragments[3], fragments[5], fragments[6]];
    const decoded = rsDecode(subset, [1, 3, 5, 6], 4, 7);
    assert.deepEqual([...decoded], [10, 11, 12, 13, 14, 15, 16, 17]);
  });

  it("throws with insufficient fragments", () => {
    const data = Uint8Array.from([1, 2]);
    const fragments = rsEncode(data, 2, 3);
    assert.throws(() => rsDecode(fragments.slice(0, 1), [0], 2, 3), RangeError);
  });

  it("throws on invalid parameters", () => {
    assert.throws(() => rsEncode(new Uint8Array(3), 2, 4), RangeError);
    assert.throws(() => rsEncode(new Uint8Array(2), 4, 2), RangeError);
    assert.throws(() => rsEncode(new Uint8Array(2), 2, 256), RangeError);
  });
});
