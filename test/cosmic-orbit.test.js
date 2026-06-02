import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  digmod36, recoverCosmicPosition, recoverCosmicOrbit,
  evaluateOrbitSector, applyCosmeticReaderLens,
} from "../src/omilog/cosmic-orbit.js";

describe("Cosmic Orbit — digmod36", () => {
  it("returns quotient and remainder for positive numbers", () => {
    const result = digmod36(100);
    assert.equal(result.quotient, 2);
    assert.equal(result.remainder, 28);
    assert.equal(result.position, 28);
  });

  it("handles zero", () => {
    const result = digmod36(0);
    assert.equal(result.quotient, 0);
    assert.equal(result.remainder, 0);
  });

  it("handles numbers less than 36", () => {
    const result = digmod36(10);
    assert.equal(result.quotient, 0);
    assert.equal(result.remainder, 10);
  });
});

describe("Cosmic Orbit — recoverCosmicPosition", () => {
  it("returns symbol from base36 alphabet", () => {
    const result = recoverCosmicPosition(10);
    assert.equal(result.symbol, "a");

    const result2 = recoverCosmicPosition(35);
    assert.equal(result2.symbol, "z");
  });

  it("returns angle relative to 360-degree wheel", () => {
    const result = recoverCosmicPosition(9);
    assert.equal(result.angle, 90);
  });
});

describe("Cosmic Orbit — recoverCosmicOrbit", () => {
  it("returns cell, row, layer decomposition for orbit cycle", () => {
    const result = recoverCosmicOrbit(5040);
    assert.equal(result.fullCycles, 1);
    assert.equal(result.cyclePosition, 0);
    assert.equal(result.cell, 0);
    assert.equal(result.row, 0);
    assert.equal(result.layer, 0);
  });

  it("computes quadrant coordinates", () => {
    const result = recoverCosmicOrbit(42);
    assert.ok(Array.isArray([result.quadrant.x, result.quadrant.y]));
  });
});

describe("Cosmic Orbit — evaluateOrbitSector", () => {
  it("returns sextant (0–5) based on angle", () => {
    const result = evaluateOrbitSector(0);
    assert.equal(result.sector, 0);

    const r2 = evaluateOrbitSector(600);
    assert.ok(r2.sextant >= 0 && r2.sextant < 6);
  });
});

describe("Cosmic Orbit — DOM Cosmetic Lens", () => {
  it("applyCosmeticReaderLens sets dir and data-omicron-lens attributes", () => {
    const el = { setAttribute: (k, v) => { el[k] = v; } };
    const applied = applyCosmeticReaderLens(el, 0);
    assert.equal(applied, true);
    assert.equal(el.dir, "ltr");
    assert.equal(el["data-omicron-lens"], "ο");
  });

  it("applyCosmeticReaderLens returns false for non-element", () => {
    assert.equal(applyCosmeticReaderLens(null, 1), false);
    assert.equal(applyCosmeticReaderLens({}, 1), false);
  });

  it("applies rtl direction for odd chirality bit", () => {
    const el = { setAttribute: (k, v) => { el[k] = v; } };
    applyCosmeticReaderLens(el, 1);
    assert.equal(el.dir, "rtl");
    assert.equal(el["data-omicron-lens"], "Ο");
  });
});
