import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isRegularDenominator, isRepeatingDenominator, evaluateFractionalGrade,
  processSynchronizedState, computeReciprocalProduct, OmiReciprocalRouter,
} from "../src/omilog/reciprocal-router.js";

describe("Reciprocal Router — Denominator Classification", () => {
  it("identifies regular denominators (2^a × 3^b × 5^c)", () => {
    for (const n of [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 60]) {
      assert.ok(isRegularDenominator(n), `expected ${n} to be regular`);
    }
  });

  it("identifies non-regular denominators", () => {
    assert.equal(isRegularDenominator(7), false);
    assert.equal(isRegularDenominator(11), false);
    assert.equal(isRegularDenominator(59), false);
    assert.equal(isRegularDenominator(61), false);
  });

  it("identifies repeating denominators", () => {
    for (const n of [7, 11, 13, 17, 19, 59, 61]) {
      assert.ok(isRepeatingDenominator(n), `expected ${n} to be repeating`);
    }
  });

  it("rejects regular denominators from repeating set", () => {
    assert.equal(isRepeatingDenominator(2), false);
    assert.equal(isRepeatingDenominator(60), false);
  });
});

describe("Reciprocal Router — Fractional Grading", () => {
  it("grades 60 as regular/finite/stable", () => {
    const grade = evaluateFractionalGrade(60);
    assert.equal(grade.grade, "regular");
    assert.equal(grade.type, "finite");
    assert.equal(grade.cadence, "stable");
  });

  it("grades 7 as repeating/infinite/replay", () => {
    const grade = evaluateFractionalGrade(7);
    assert.equal(grade.grade, "repeating");
    assert.equal(grade.type, "infinite");
    assert.equal(grade.cadence, "replay");
  });

  it("flags 59 and 61 as twin-prime boundary", () => {
    const g59 = evaluateFractionalGrade(59);
    const g61 = evaluateFractionalGrade(61);
    assert.ok(g59.twinPrimeBoundary);
    assert.ok(g61.twinPrimeBoundary);
  });

  it("grades unknown denominators as irrational", () => {
    const grade = evaluateFractionalGrade(73);
    assert.equal(grade.grade, "unknown");
    assert.equal(grade.type, "irrational");
  });
});

describe("Reciprocal Router — Synchronized State", () => {
  it("returns stable-sync route for regular denominators", () => {
    const state = processSynchronizedState(42, 60);
    assert.equal(state.route, "stable-sync");
    assert.equal(state.state, "synchronized");
  });

  it("returns replay-loop route for repeating denominators", () => {
    const state = processSynchronizedState(42, 7);
    assert.equal(state.route, "replay-loop");
    assert.equal(state.state, "cyclical");
  });

  it("returns irrational-mode for unknown denominators", () => {
    const state = processSynchronizedState(42, 73);
    assert.equal(state.route, "irrational-mode");
    assert.equal(state.state, "irrational");
  });
});

describe("Reciprocal Router — Reciprocal Product", () => {
  it("computes exact sexagesimal for regular denominator", () => {
    const result = computeReciprocalProduct(1, 60);
    assert.equal(result.grade.grade, "regular");
    assert.ok(result.sexagesimal.includes(";"));
  });

  it("marks repeating result", () => {
    const result = computeReciprocalProduct(1, 7);
    assert.equal(result.repeating, true);
  });
});

describe("Reciprocal Router — OmiReciprocalRouter class", () => {
  it("routes positions and stores history", () => {
    const router = new OmiReciprocalRouter();
    const state = router.route(42, 60);
    assert.equal(state.route, "stable-sync");
    assert.equal(router.getHistory(60).length, 1);
  });

  it("accumulates history across routes", () => {
    const router = new OmiReciprocalRouter();
    router.route(1, 7);
    router.route(2, 7);
    assert.equal(router.getHistory(7).length, 2);
  });

  it("reset clears history", () => {
    const router = new OmiReciprocalRouter();
    router.route(42, 60);
    assert.equal(router.getHistory(60).length, 1);
    router.reset();
    assert.equal(router.getHistory(60).length, 0);
  });
});
