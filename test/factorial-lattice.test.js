import test from "node:test";
import assert from "node:assert/strict";
import { OmiFactorialLatticeKernel } from "../src/omi/lattice-kernel.js";

test("Empty-cons identity law short-circuits evaluation loops to zero vector", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiFactorialLatticeKernel(sab);

  const emptyConsToken = "omi-0!-nil-closure";
  const resultCell = kernel.evaluateLatticeTransformation(
    emptyConsToken,
    new Float32Array([1.0, 2.0, 3.0, 4.0])
  );
  const nodeTarget = kernel.car(resultCell);
  const outputVector = kernel.cdr(resultCell);

  assert.equal(nodeTarget, emptyConsToken);
  assert.equal(outputVector[0], 0.0);
  assert.equal(outputVector[1], 0.0);
  assert.equal(outputVector[2], 0.0);
  assert.equal(outputVector[3], 0.0);
});

test("Lattice parser extracts precise factorial layers and verifies correct structural index metrics", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiFactorialLatticeKernel(sab);

  const layer7Token = "omi-7!-ffff-127-0-0-1-0x5a3c-slot5040-\u039f";
  const evaluationCell = kernel.resolveLatticeToken(layer7Token);
  const metadata = kernel.car(evaluationCell);

  assert.equal(metadata.factorialLayer, "7!");
  assert.equal(metadata.allocatedWeight, 5040);
  assert.equal(metadata.isFixedPointZeroFrame, false);
  assert.equal(metadata.shouldBypassProcessing, false);
});

test("Lattice parser detects 0! fixed point and sets bypass flag", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiFactorialLatticeKernel(sab);

  const cell = kernel.resolveLatticeToken("omi-0!-nil-closure");
  const meta = kernel.car(cell);
  const cdr = kernel.cdr(cell);

  assert.equal(meta.factorialLayer, "0!");
  assert.equal(meta.allocatedWeight, 1);
  assert.equal(meta.isFixedPointZeroFrame, true);
  assert.equal(meta.shouldBypassProcessing, true);
  assert.equal(cdr, null);
});

test("Lattice parser detects nil- containing tokens as fixed point", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiFactorialLatticeKernel(sab);

  const meta = kernel.car(kernel.resolveLatticeToken("omi-3!-vau-nil-env"));
  assert.equal(meta.isFixedPointZeroFrame, true);
});

test("Lattice reject malformed identity without omi- prefix", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiFactorialLatticeKernel(sab);

  const cell = kernel.resolveLatticeToken("bad-token");
  const meta = kernel.car(cell);
  assert.equal(meta.valid, false);
  assert.equal(meta.error, "Malformed Identity");
});

test("All factorial layer weights are correct", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiFactorialLatticeKernel(sab);

  assert.equal(kernel.LATTICE_WEIGHTS["0!"], 1);
  assert.equal(kernel.LATTICE_WEIGHTS["1!"], 1);
  assert.equal(kernel.LATTICE_WEIGHTS["2!"], 2);
  assert.equal(kernel.LATTICE_WEIGHTS["3!"], 6);
  assert.equal(kernel.LATTICE_WEIGHTS["4!"], 24);
  assert.equal(kernel.LATTICE_WEIGHTS["5!"], 120);
  assert.equal(kernel.LATTICE_WEIGHTS["6!"], 720);
  assert.equal(kernel.LATTICE_WEIGHTS["7!"], 5040);
});

test("evaluateLatticeTransformation computes Horner offset for non-fixed layers", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiFactorialLatticeKernel(sab);

  const cell = kernel.evaluateLatticeTransformation(
    "omi-3!-0x1a-0x41-vau-x-env-hyp-slot6",
    new Float32Array([0.5, 1.0, 2.0, 3.0])
  );
  const vec = kernel.cdr(cell);

  assert.ok(vec instanceof Float32Array);
  assert.equal(vec[2], 6);
});

test("cons/car/cdr cell primitives work on lattice kernel", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiFactorialLatticeKernel(sab);

  const cell = kernel.cons("layer-7", 5040);
  assert.equal(kernel.car(cell), "layer-7");
  assert.equal(kernel.cdr(cell), 5040);
});
