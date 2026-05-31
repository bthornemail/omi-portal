import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { OmiHopfFibrationKernel } from "../src/omi/hopf-kernel.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

test("Hopf Fibration: projects 3-sphere to 2-sphere with balanced z0/z1", () => {
  const kernel = new OmiHopfFibrationKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.project3SphereTo2Sphere(S, 180, 0, 180, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.fibrationPhaseModel, "STANDARD_FIBER_PLANE");
  assert.equal(metrics.canvasPresetColorId, "5");
  assert.ok(metrics.complexRealPart > 0);
  assert.equal(metrics.complexImagPart, 0);
  assert.ok(typeof metrics.timelineSlot === "number");
});

test("Hopf Fibration: north pole z0 dominant maps to yellow preset", () => {
  const kernel = new OmiHopfFibrationKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.project3SphereTo2Sphere(S, 255, 0, 0, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.canvasPresetColorId, "3");
});

test("Hopf Fibration: south pole z1 dominant maps to purple preset", () => {
  const kernel = new OmiHopfFibrationKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.project3SphereTo2Sphere(S, 0, 0, 255, 0);

  assert.ok(metrics.accepted);
  assert.equal(metrics.canvasPresetColorId, "6");
});

test("Hopf Fibration: evicts tokens outside unit 3-sphere", () => {
  const kernel = new OmiHopfFibrationKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.project3SphereTo2Sphere(S, 0, 0, 0, 0);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "OUTSIDE_UNIT_3SPHERE_MANIFOLD_EVICTION");
});

test("Hopf Fibration: evicts structurally invalid frames", () => {
  const kernel = new OmiHopfFibrationKernel();
  const S = parseOmiAddressToSegments("omi-0000-0000-0000-0000-0000-0000-0000-0000/48");
  const metrics = kernel.project3SphereTo2Sphere(S, 180, 0, 180, 0);

  assert.equal(metrics.accepted, false);
  assert.equal(metrics.reason, "GATE_1_STRUCTURAL_EVICTION_FAULT");
});

test("Hopf Fibration: parametric torus yields Villarceau nesting", () => {
  const kernel = new OmiHopfFibrationKernel();
  const t = kernel.hopfParametricTorus(Math.PI / 4, 0, Math.PI);

  assert.ok(Math.abs(t.x1 * t.x1 + t.x2 * t.x2 + t.x3 * t.x3 + t.x4 * t.x4 - 1) < 1e-10);
  assert.equal(Math.round(t.z), 0);
});
