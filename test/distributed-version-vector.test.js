import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createVersionVector, vvIncrement, vvCompare, vvMerge, vvEquals
} from "../src/distributed/version-vector.js";

describe("Version Vectors", () => {
  it("create initial vector", () => {
    const vv = createVersionVector("node-A");
    assert.deepEqual(vv, { "node-A": 0 });
    assert.throws(() => createVersionVector(), TypeError);
  });

  it("increment", () => {
    const vv = createVersionVector("n1");
    const vv2 = vvIncrement(vv, "n1");
    assert.equal(vv2["n1"], 1);
    assert.equal(vv["n1"], 0);
  });

  it("compare equal vectors", () => {
    const a = { x: 2, y: 1 };
    const b = { x: 2, y: 1 };
    assert.equal(vvCompare(a, b), "equal");
  });

  it("compare before/after", () => {
    const a = { x: 1, y: 0 };
    const b = { x: 2, y: 0 };
    assert.equal(vvCompare(a, b), "before");
    assert.equal(vvCompare(b, a), "after");
  });

  it("compare concurrent", () => {
    const a = { x: 2, y: 0 };
    const b = { x: 1, y: 3 };
    assert.equal(vvCompare(a, b), "concurrent");
  });

  it("merge takes max per key", () => {
    const a = { x: 2, y: 1, z: 0 };
    const b = { x: 1, y: 3, w: 5 };
    const merged = vvMerge(a, b);
    assert.equal(merged.x, 2);
    assert.equal(merged.y, 3);
    assert.equal(merged.z, 0);
    assert.equal(merged.w, 5);
  });

  it("equals checks equality", () => {
    assert.ok(vvEquals({ a: 1 }, { a: 1 }));
    assert.ok(!vvEquals({ a: 1 }, { a: 2 }));
    assert.ok(vvEquals({ a: 1, b: 0 }, { a: 1 }));
  });
});
