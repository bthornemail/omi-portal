import * as OBitboard from "../src/omi/o-bitboard.js";
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";

describe("O-Bitboard (256-bit O-Word)", () => {
  it("pack and unpack round-trips a zero word", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0, surface: 0n });
    const unpacked = OBitboard.unpackOWord(word);
    assert.equal(unpacked.selector, 0);
    assert.equal(unpacked.path, 0);
    assert.equal(unpacked.surface, 0n);
  });

  it("pack and unpack round-trips a maximal word", () => {
    const word = OBitboard.packOWord({
      selector: 1,
      path: (1 << 19) - 1,
      surface: (1n << 236n) - 1n,
    });
    const unpacked = OBitboard.unpackOWord(word);
    assert.equal(unpacked.selector, 1);
    assert.equal(unpacked.path, (1 << 19) - 1);
    assert.equal(unpacked.surface, (1n << 236n) - 1n);
  });

  it("pack and unpack round-trips typical values", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0x7A3, surface: 0xDEADBEEF1234n });
    const unpacked = OBitboard.unpackOWord(word);
    assert.equal(unpacked.selector, 0);
    assert.equal(unpacked.path, 0x7A3);
    assert.equal(unpacked.surface, 0xDEADBEEF1234n);
  });

  it("selector is exactly 1 bit", () => {
    const word = OBitboard.packOWord({ selector: 3, path: 0, surface: 0n });
    const unpacked = OBitboard.unpackOWord(word);
    assert.equal(unpacked.selector, 1);
  });

  it("path is exactly 19 bits", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0xFFFFFF, surface: 0n });
    const unpacked = OBitboard.unpackOWord(word);
    assert.equal(unpacked.path, 0x7FFFF);
  });

  it("surface is exactly 236 bits", () => {
    const big = (1n << 240n) - 1n;
    const word = OBitboard.packOWord({ selector: 0, path: 0, surface: big });
    const unpacked = OBitboard.unpackOWord(word);
    assert.equal(unpacked.surface, (1n << 236n) - 1n);
  });

  it("assertOWord accepts valid word", () => {
    const word = OBitboard.packOWord({ selector: 1, path: 42, surface: 0xFn });
    assert.equal(OBitboard.assertOWord(word), true);
  });

  it("assertOWord rejects negative word", () => {
    assert.throws(() => OBitboard.assertOWord(-1n), RangeError);
  });

  it("assertOWord rejects oversized word", () => {
    const tooBig = 1n << 256n;
    assert.throws(() => OBitboard.assertOWord(tooBig), RangeError);
  });

  it("oWordToHex produces 64-character hex string", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0, surface: 0n });
    const hex = OBitboard.oWordToHex(word);
    assert.ok(hex.startsWith("0x"));
    assert.equal(hex.length, 66);
  });

  it("oWordFromHex round-trips with oWordToHex", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0xABC, surface: 0x1234n });
    const hex = OBitboard.oWordToHex(word);
    const restored = OBitboard.oWordFromHex(hex);
    assert.equal(restored, word);
  });

  it("formatOWord produces all fields", () => {
    const word = OBitboard.packOWord({ selector: 1, path: 42, surface: 0xFFn });
    const fmt = OBitboard.formatOWord(word);
    assert.equal(fmt.selector, 1);
    assert.equal(fmt.path, 42);
    assert.equal(fmt.surface, 0xFFn);
    assert.equal(typeof fmt.hex, "string");
    assert.equal(fmt.bits.length, 256);
  });

  it("explicit 1+19+236 = 256 bit layout", () => {
    assert.equal(OBitboard.SELECTOR_BITS + OBitboard.PATH_BITS + OBitboard.SURFACE_BITS, 256);
  });
});
