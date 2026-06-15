import test from "node:test";
import assert from "node:assert/strict";
import {
  EMMC_POLYHARMONIC_PLANES,
  governorPlaneAddress,
  governorPlaneForRoot,
  validatePolyharmonicEmmcGovernor,
} from "../src/qemu/omi-emmc-polyharmonic-governor.js";

test("eMMC polyharmonic governor maps canonical roots to exponents", () => {
  assert.deepEqual(
    EMMC_POLYHARMONIC_PLANES.map((plane) => [plane.root, plane.exponent]),
    [
      ["FACTS.omi", -1],
      ["RULES.omi", 0],
      ["CLOSURES.omi", 1],
      ["COMBINATORS.omi", 2],
      ["CONS.omi", 3],
    ]
  );
});

test("FACTS and CONS remain inverse projections", () => {
  const validation = validatePolyharmonicEmmcGovernor();

  assert.equal(validation.accepted, true);
  assert.equal(validation.factsConsInverse, true);
  assert.match(validation.note, /lanes, not roots/);
});

test("four offsets remain lane selectors, not governor roots", () => {
  const validation = validatePolyharmonicEmmcGovernor();

  assert.deepEqual(validation.offsetLanes, ["FS", "GS", "RS", "US"]);
  assert.equal(validation.roots.includes("FS.omi"), false);
  assert.equal(governorPlaneForRoot("RULES").oPlane, "RULES.o");
});

test("polyharmonic plane address includes governor clock offset and slot", () => {
  const address = governorPlaneAddress({
    governor: "COMBINATORS",
    clock: "spectral",
    offsetLane: "US",
    band: "userspace",
    clockSlot60: 10,
  });

  assert.equal(address.governor, "COMBINATORS");
  assert.equal(address.offsetMask, 0x1000);
  assert.equal(address.planeName, "COMBINATORS.o");
  assert.equal(address.local240, 43);
  assert.equal(address.slot5040, 2683);
});
