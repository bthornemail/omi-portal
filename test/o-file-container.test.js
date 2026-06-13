import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { packOWord, oWordToHex, oWordFromHex } from "../src/omi/o-bitboard.js";
import {
  packOFile, unpackOFile,
  oFileToBinary, oFileFromBinary
} from "../src/omi/o-file-container.js";

describe("O-File Container (multiword .o serialization)", () => {
  const WORD_A = packOWord({ selector: 0, path: 1, surface: 0xABCDn });
  const WORD_B = packOWord({ selector: 1, path: 0x7FFFF, surface: (1n << 236n) - 1n });
  const WORD_C = packOWord({ selector: 0, path: 0, surface: 0n });

  it("packOFile produces one hex word per line", () => {
    const text = packOFile([WORD_A, WORD_B]);
    const lines = text.trim().split("\n");
    assert.equal(lines.length, 2);
    assert(lines[0].length === 64);
    assert(lines[1].length === 64);
    assert(lines[0].startsWith("0"));
  });

  it("unpackOFile round-trips with packOFile", () => {
    const original = [WORD_A, WORD_B, WORD_C];
    const text = packOFile(original);
    const restored = unpackOFile(text);
    assert.equal(restored.length, 3);
    assert.equal(restored[0], WORD_A);
    assert.equal(restored[1], WORD_B);
    assert.equal(restored[2], WORD_C);
  });

  it("unpackOFile handles whitespace variance", () => {
    const text = `  ${oWordToHex(WORD_A)}   \n${oWordToHex(WORD_B)}  `;
    const words = unpackOFile(text);
    assert.equal(words.length, 2);
    assert.equal(words[0], WORD_A);
  });

  it("oFileToBinary produces correct byte count", () => {
    const buf = oFileToBinary([WORD_A, WORD_B]);
    assert(buf instanceof Uint8Array);
    assert.equal(buf.length, 64);
  });

  it("oFileFromBinary round-trips with oFileToBinary", () => {
    const original = [WORD_A, WORD_B, WORD_C];
    const buf = oFileToBinary(original);
    const restored = oFileFromBinary(buf);
    assert.equal(restored.length, 3);
    assert.equal(restored[0], WORD_A);
    assert.equal(restored[1], WORD_B);
    assert.equal(restored[2], WORD_C);
  });

  it("oFileFromBinary with single word", () => {
    const buf = oFileToBinary([WORD_A]);
    const words = oFileFromBinary(buf);
    assert.equal(words.length, 1);
    assert.equal(words[0], WORD_A);
  });

  it("unpackOFile rejects malformed hex (wrong bit width)", () => {
    assert.throws(() => unpackOFile("zz"), /SyntaxError/);
  });

  it("round-trip of many words preserves order", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      packOWord({ selector: i & 1, path: i, surface: BigInt(i * 0x1000) })
    );
    const text = packOFile(many);
    const restored = unpackOFile(text);
    assert.deepEqual(restored, many);
  });

  it("unpackOFile('') returns []", () => {
    assert.deepEqual(unpackOFile(""), []);
    assert.deepEqual(unpackOFile("  \n  "), []);
  });

  it("oFileFromBinary rejects non-multiple of 32 bytes", () => {
    assert.throws(() => oFileFromBinary(new Uint8Array(1)), /not a multiple/);
    assert.throws(() => oFileFromBinary(new Uint8Array(33)), /not a multiple/);
  });

  it("oFileFromBinary with empty buffer returns []", () => {
    assert.deepEqual(oFileFromBinary(new Uint8Array(0)), []);
  });

  it("binary big-endian byte order is documented", () => {
    const word = packOWord({ selector: 0, path: 0, surface: 0xFFn });
    const buf = oFileToBinary([word]);
    assert.equal(buf[31], 0xFF);
    assert.equal(buf[30], 0x00);
    assert.equal(buf[0], 0x00);
  });
});
