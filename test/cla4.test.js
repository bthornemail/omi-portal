import test from "node:test";
import assert from "node:assert/strict";
import { cla4, bitsToNibble } from "../src/runtime/cla4.js";

test("cla4 matches nibble addition low bits and carry", () => {
  for (let a = 0; a < 16; a++) {
    for (let b = 0; b < 16; b++) {
      const got = cla4(a, b, 0);
      const sum = a + b;
      assert.equal(bitsToNibble(got.S), sum & 0xF);
      assert.equal(got.Cout, sum > 15 ? 1 : 0);
    }
  }
});
