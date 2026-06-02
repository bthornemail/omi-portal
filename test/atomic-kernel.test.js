import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deltaTick, deltaTrace, deltaPeriodSignature, isCanonicalTickSequence,
  isLowerStack, isUpperStack, encodeLowerChirality, encodeUpperChirality,
  evaluateAtomicDual,
} from "../src/omilog/atomic-kernel.js";

describe("Atomic Kernel — Delta Law", () => {
  it("deltaTick is a 16-bit bijection", () => {
    const input = 0x0000;
    const result = deltaTick(input);
    assert.equal(typeof result, "number");
    assert.ok(result >= 0 && result <= 0xFFFF);
  });

  it("deltaTick has period 8 starting from seed 0", () => {
    const trace = deltaTrace(0, 16);
    const first8 = trace.slice(0, 8);
    const second8 = trace.slice(8, 16);
    assert.deepEqual(first8, second8);
  });

  it("deltaTrace with seed 0 produces canonical period signature mod 16", () => {
    const trace = deltaTrace(0, 8);
    assert.ok(isCanonicalTickSequence(trace));
  });

  it("deltaTrace with seed 1 has period 8 (different cycle)", () => {
    const trace = deltaTrace(1, 8);
    const second8 = deltaTrace(1, 16).slice(8, 16);
    assert.deepEqual(trace, second8);
  });

  it("isCanonicalTickSequence rejects empty sequence", () => {
    assert.equal(isCanonicalTickSequence([]), false);
  });

  it("isCanonicalTickSequence rejects non-array", () => {
    assert.equal(isCanonicalTickSequence("abc"), false);
  });

  it("deltaPeriodSignature detects period 8", () => {
    const sig = deltaPeriodSignature(0);
    assert.equal(sig.cycleLength, 8);
    assert.equal(sig.cycleStart, 0);
    assert.equal(sig.period, 8);
  });

  it("deltaTick C constant is 0x5A3C", () => {
    const x = 0xFFFF;
    const rotl1 = ((x << 1) | (x >> 15)) & 0xFFFF;
    const rotl3 = ((x << 3) | (x >> 13)) & 0xFFFF;
    const rotr2 = ((x >> 2) | (x << 14)) & 0xFFFF;
    const expected = (rotl1 ^ rotl3 ^ rotr2 ^ 0x5A3C) & 0xFFFF;
    assert.equal(deltaTick(x), expected);
  });
});

describe("Atomic Kernel — Omicron Chirality", () => {
  it("encodeLowerChirality returns Omicron symbol based on tick parity", () => {
    const even = encodeLowerChirality(0);
    assert.equal(even.chirality, "chiral");
    assert.equal(even.operator, "\u03bf");
    assert.equal(even.stack, "lower");

    const odd = encodeLowerChirality(1);
    assert.equal(odd.chirality, "cardinal");
    assert.equal(odd.operator, "\u039f");
    assert.equal(odd.stack, "lower");
  });

  it("encodeUpperChirality returns bidi direction based on tick parity", () => {
    const even = encodeUpperChirality(0);
    assert.equal(even.chirality, "bidi-left-to-right");
    assert.equal(even.direction, "ltr");
    assert.equal(even.stack, "upper");

    const odd = encodeUpperChirality(1);
    assert.equal(odd.chirality, "bidi-right-to-left");
    assert.equal(odd.direction, "rtl");
    assert.equal(odd.stack, "upper");
  });
});

describe("Atomic Kernel — Stack Classification", () => {
  it("isLowerStack returns true for 0..8", () => {
    assert.ok(isLowerStack(0));
    assert.ok(isLowerStack(4));
    assert.ok(isLowerStack(8));
    assert.equal(isLowerStack(9), false);
    assert.equal(isLowerStack(12), false);
  });

  it("isUpperStack returns true for 9..12", () => {
    assert.ok(isUpperStack(9));
    assert.ok(isUpperStack(12));
    assert.equal(isUpperStack(8), false);
    assert.equal(isUpperStack(0), false);
  });
});

describe("Atomic Kernel — Dual Evaluation", () => {
  it("evaluateAtomicDual returns lower chirality for lower factorial layer", () => {
    const result = evaluateAtomicDual(4, 0);
    assert.equal(result.stack, "lower");
    assert.equal(result.factorialLayer, 4);
    assert.ok(typeof result.tickResult === "number");
  });

  it("evaluateAtomicDual returns upper chirality for upper factorial layer", () => {
    const result = evaluateAtomicDual(10, 1);
    assert.equal(result.stack, "upper");
    assert.equal(result.factorialLayer, 10);
    assert.equal(result.chirality.direction, "rtl");
  });

  it("evaluateAtomicDual returns unknown for out-of-range layer", () => {
    const result = evaluateAtomicDual(99, 5);
    assert.equal(result.stack, "unknown");
  });
});
