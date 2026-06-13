import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareWords, addWords, subtractWords, trimWords } from "../src/omi/o-chain-arithmetic.js";

describe("O-Chain Arithmetic (multiword BIGINT-256 frame chains)", () => {
  const ONE = 1n;
  const ZERO = 0n;
  const MAX = (1n << 256n) - 1n;
  const HALF = 1n << 255n;

  it("compareWords returns 0 for equal values", () => {
    assert.equal(compareWords([MAX, MAX], [MAX, MAX]), 0);
    assert.equal(compareWords([5n], [5n]), 0);
  });

  it("compareWords returns 1 when first is larger", () => {
    assert.equal(compareWords([ONE, MAX], [ZERO, MAX]), 1);
    assert.equal(compareWords([HALF], [ONE]), 1);
  });

  it("compareWords returns -1 when first is smaller", () => {
    assert.equal(compareWords([ZERO, MAX], [ONE, ZERO]), -1);
    assert.equal(compareWords([ONE], [HALF]), -1);
  });

  it("addWords adds single words without carry", () => {
    const r = addWords([ONE], [2n]);
    assert.equal(r.length, 1);
    assert.equal(r[0], 3n);
  });

  it("addWords produces carry to a new high word", () => {
    const r = addWords([MAX], [ONE]);
    assert.equal(r.length, 2);
    assert.equal(r[0], 1n);
    assert.equal(r[1], 0n);
  });

  it("addWords handles multiword carry propagation", () => {
    const r = addWords([MAX, MAX], [ZERO, ONE]);
    assert.equal(r.length, 3);
    assert.equal(r[0], 1n);
    assert.equal(r[1], 0n);
    assert.equal(r[2], 0n);
  });

  it("addWords handles values of different array lengths", () => {
    const r = addWords([MAX], [ZERO, ONE]);
    assert.equal(r.length, 2);
    assert.equal(r[0], 1n);
    assert.equal(r[1], 0n);
  });

  it("subtractWords subtracts without borrow", () => {
    const r = subtractWords([5n], [3n]);
    assert.equal(r.negative, false);
    assert.deepEqual(r.value, [2n]);
  });

  it("subtractWords handles simple borrow across one word", () => {
    const r = subtractWords([ONE, ZERO], [ZERO, ONE]);
    assert.equal(r.negative, false);
    assert.equal(r.value.length, 1);
    assert.equal(r.value[0], MAX);
  });

  it("subtractWords handles multiword borrow", () => {
    const r = subtractWords([ONE, ZERO, ZERO], [ZERO, ZERO, ONE]);
    assert.equal(r.negative, false);
    assert.equal(r.value.length, 2);
    assert.equal(r.value[0], MAX);
    assert.equal(r.value[1], MAX);
  });

  it("subtractWords returns negative when result would be negative", () => {
    const r = subtractWords([ONE], [HALF]);
    assert.equal(r.negative, true);
  });

  it("subtractWords returns zero value", () => {
    const r = subtractWords([5n], [5n]);
    assert.equal(r.negative, false);
    assert.deepEqual(r.value, [0n]);
  });

  it("addWords is commutative", () => {
    const a = [5n, 10n];
    const b = [3n, MAX];
    assert.deepEqual(addWords(a, b), addWords(b, a));
  });

  it("trimWords removes leading zero words", () => {
    assert.deepEqual(trimWords([0n, 0n, 5n, 3n]), [5n, 3n]);
    assert.deepEqual(trimWords([0n, 0n, 0n]), [0n]);
  });

  it("trimWords preserves a single word", () => {
    assert.deepEqual(trimWords([5n]), [5n]);
    assert.deepEqual(trimWords([0n]), [0n]);
  });

  it("addWords with single BigInt arguments", () => {
    const r = addWords(ONE, 2n);
    assert.equal(r.length, 1);
    assert.equal(r[0], 3n);
  });

  it("subtractWords with single BigInt arguments produces borrow", () => {
    const r = subtractWords(0n, ONE);
    assert.equal(r.negative, true);
    assert.deepEqual(r.value, [MAX]);
  });

  it("compareWords returns 0 for equal single BigInt", () => {
    assert.equal(compareWords(0n, 0n), 0);
    assert.equal(compareWords(MAX, MAX), 0);
  });

  it("compareWords with different array lengths", () => {
    assert.equal(compareWords([MAX, ZERO], [ZERO, ZERO, ONE]), 1);
    assert.equal(compareWords([ZERO, MAX], [ONE, ZERO]), -1);
  });
});
