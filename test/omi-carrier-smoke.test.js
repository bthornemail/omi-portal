import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { packOWord } from "../src/omi/o-bitboard.js";
import { getU8, getU16, getU32, getU64, setU64, lanes } from "../src/omi/omi-imo-lanes.js";
import { packOFile, unpackOFile, oFileToBinary, oFileFromBinary } from "../src/omi/o-file-container.js";
import { compareWords, addWords, subtractWords, trimWords } from "../src/omi/o-chain-arithmetic.js";

describe("OMI carrier integration smoke test", () => {
  const W1 = packOWord({ selector: 0, path: 1, surface: 0xABCDn });
  const W2 = packOWord({ selector: 1, path: 2, surface: 0xFFn });

  it("lane views work on a compiled word", () => {
    assert.equal(getU8(W1, 0), 0xCD);
    assert.equal(getU8(W1, 1), 0xAB);
  });

  it("multiword .o file round-trips", () => {
    const text = packOFile([W1, W2]);
    const restored = unpackOFile(text);
    assert.equal(restored.length, 2);
    assert.equal(restored[0], W1);
  });

  it("chain arithmetic over multiword arrays", () => {
    const sum = addWords([W1], [W2]);
    assert(sum.length >= 1);
    assert(compareWords([W1], [W2]) === -1 || compareWords([W1], [W2]) === 0 || compareWords([W1], [W2]) === 1);
  });

  it("setU64 then getU64 round-trips through BigInt", () => {
    let w = 0n;
    w = setU64(w, 0, 0x123456789ABCDEF0n);
    w = setU64(w, 1, 0xFEDCBA9876543210n);
    assert.equal(BigInt(getU64(w, 0)), 0x123456789ABCDEF0n);
    assert.equal(BigInt(getU64(w, 1)), 0xFEDCBA9876543210n);
  });

  it("lanes() from a compiled word", () => {
    const l = lanes(W1, 32);
    assert.equal(l.length, 8);
    assert(l.every(v => typeof v === "number"));
  });
});
