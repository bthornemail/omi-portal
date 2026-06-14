import test from "node:test";
import assert from "node:assert/strict";
import {
  POLYHARMONIC_GOVERNORS,
  TETRAGRAMMATRON_CLOCKS,
  TETRAGRAMMATRON_OFFSETS,
  governorForRoot,
  governorForExponent,
  isInverseGovernorPair,
  offsetForLane,
  visibleTimingSurface,
} from "../src/omi/tetragrammatron-polyharmonic-governor.js";

test("polyharmonic governors preserve five canonical roots", () => {
  assert.deepEqual(
    Object.keys(POLYHARMONIC_GOVERNORS),
    ["FACTS", "RULES", "CLOSURES", "COMBINATORS", "CONS"]
  );
  assert.equal(governorForRoot("BOOTVECTORS.omi"), null);
  assert.equal(governorForRoot("TEST"), null);
});

test("governor exponents map to generalized mean axis", () => {
  assert.equal(governorForExponent(-1).root, "FACTS.omi");
  assert.equal(governorForExponent(0).root, "RULES.omi");
  assert.equal(governorForExponent(1).root, "CLOSURES.omi");
  assert.equal(governorForExponent(2).root, "COMBINATORS.omi");
  assert.equal(governorForExponent(3).root, "CONS.omi");
  assert.equal(governorForExponent(4), null);
});

test("governorForRoot accepts canonical root filenames and keys", () => {
  assert.equal(governorForRoot("FACTS.omi").governor, "Harmonic Governor");
  assert.equal(governorForRoot("rules").governor, "Geometric / Genesis Governor");
  assert.equal(governorForRoot("CONS").inverseOf, "FACTS");
});

test("FACTS and CONS are inverse projections", () => {
  assert.equal(isInverseGovernorPair("FACTS", "CONS"), true);
  assert.equal(isInverseGovernorPair("CONS", "FACTS"), true);
  assert.equal(isInverseGovernorPair("RULES", "CONS"), false);
  assert.equal(isInverseGovernorPair("BOOTVECTORS", "CONS"), false);
});

test("four visible offsets preserve FS GS RS US masks", () => {
  assert.equal(offsetForLane("FS").mask, 0x0001);
  assert.equal(offsetForLane("GS").mask, 0x0010);
  assert.equal(offsetForLane("RS").mask, 0x0100);
  assert.equal(offsetForLane("US").mask, 0x1000);
  assert.equal(offsetForLane("unknown"), null);
});

test("three clocks are named without replacing older language", () => {
  assert.equal(TETRAGRAMMATRON_CLOCKS.ATOMIC_LOGIC.formerName, "Carry Clock");
  assert.equal(TETRAGRAMMATRON_CLOCKS.SPECTRAL_OBSERVER.formerName, "Frame Clock");
  assert.equal(TETRAGRAMMATRON_CLOCKS.COSMIC_ORBIT.formerName, "Phase Clock");
});

test("visible timing surface is descriptive only", () => {
  const surface = visibleTimingSurface();
  assert.equal(surface.clockCount, 3);
  assert.equal(surface.offsetCount, 4);
  assert.equal(surface.governorCount, 5);
  assert.equal(surface.surfaceCount, 60);
  assert.equal(surface.authority, "reference-only");
  assert.match(surface.note, /not validation authority/);
});

test("metadata objects are frozen reference surfaces", () => {
  assert.equal(Object.isFrozen(TETRAGRAMMATRON_CLOCKS), true);
  assert.equal(Object.isFrozen(TETRAGRAMMATRON_CLOCKS.ATOMIC_LOGIC), true);
  assert.equal(Object.isFrozen(TETRAGRAMMATRON_OFFSETS), true);
  assert.equal(Object.isFrozen(TETRAGRAMMATRON_OFFSETS[0]), true);
  assert.equal(Object.isFrozen(POLYHARMONIC_GOVERNORS), true);
  assert.equal(Object.isFrozen(POLYHARMONIC_GOVERNORS.RULES), true);
});
