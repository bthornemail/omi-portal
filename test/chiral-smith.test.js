import test from "node:test";
import assert from "node:assert/strict";

import {
  SMITH_MATRIX_SLOTS,
  activeSmithState,
  createSmithMatrix,
  smithPointForSlot,
  storeSmithTick,
  writeCanvasGraphToSmithMatrix
} from "../src/runtime/chiral-smith.js";

test("smith matrix creates 5040 addressable slots", () => {
  const matrix = createSmithMatrix({ shared: false });
  assert.equal(matrix.length, SMITH_MATRIX_SLOTS);
});

test("smith point stays inside unit gamma circle and computes z/y", () => {
  const matrix = createSmithMatrix({ shared: false });
  writeCanvasGraphToSmithMatrix(matrix, {
    nodes: [{ id: "n1", type: "text", color: "4" }],
    edges: []
  }, 42);

  const point = smithPointForSlot(matrix, 42);
  const magnitude = Math.hypot(point.gamma.re, point.gamma.im);

  assert.ok(magnitude <= 0.98);
  assert.ok(Number.isFinite(point.z.re));
  assert.ok(Number.isFinite(point.z.im));
  assert.ok(Number.isFinite(point.y.re));
  assert.ok(Number.isFinite(point.y.im));
});

test("active state tracks tick modulo 5040", () => {
  const matrix = createSmithMatrix({ shared: false });
  storeSmithTick(matrix, SMITH_MATRIX_SLOTS + 7);

  const state = activeSmithState(matrix);
  assert.equal(state.slot, 7);
});
