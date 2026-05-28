import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isCausallyClosed, causalClosure, isRSSufficient, reconstructIfValid, fragmentKey } from "../src/distributed/causal-closure.js";

function mkFrag(cwId, fi, vv) {
  return { codewordId: cwId, fragmentIndex: fi, total: 3, versionVector: vv, data: new Uint8Array([fi]) };
}

function rsDecodeStub(frags, indices, k, n) {
  const data = new Uint8Array(k);
  for (let i = 0; i < k; i++) data[i] = frags[i][0];
  return data;
}

describe("Causal closure", () => {
  it("fragmentKey is deterministic", () => {
    const f = mkFrag("cw1", 0, { a: 1 });
    const k = fragmentKey(f);
    assert.ok(typeof k === "string");
    assert.ok(k.includes("cw1"));
    assert.ok(k.includes("a@1"));
  });

  it("isCausallyClosed returns true when no ancestors needed", () => {
    const set = [mkFrag("cw1", 0, { a: 1 }), mkFrag("cw1", 1, { a: 1 })];
    assert.ok(isCausallyClosed(set, set));
  });

  it("causalClosure adds missing ancestors", () => {
    const ancestor = mkFrag("cw1", 0, { a: 0 });
    const frag = mkFrag("cw1", 1, { a: 1 });
    const closure = causalClosure([frag], [ancestor, frag]);
    assert.equal(closure.length, 2);
  });

  it("isRSSufficient", () => {
    assert.ok(isRSSufficient([1, 2, 3], 3));
    assert.ok(!isRSSufficient([1, 2], 3));
  });

  it("reconstructIfValid succeeds with valid closed set", () => {
    const f0 = mkFrag("cw1", 0, { a: 1 });
    const f1 = mkFrag("cw1", 1, { a: 1 });
    const f2 = mkFrag("cw1", 2, { a: 1 });
    const result = reconstructIfValid([f0, f1, f2], [f0, f1, f2], 3, rsDecodeStub);
    assert.ok(result.valid);
    assert.deepEqual([...result.data], [0, 1, 2]);
  });

  it("reconstructIfValid fails with insufficient fragments", () => {
    const f0 = mkFrag("cw1", 0, { a: 1 });
    const result = reconstructIfValid([f0], [f0], 3, rsDecodeStub);
    assert.ok(!result.valid);
    assert.equal(result.reason, "insufficient-fragments");
  });

  it("reconstructIfValid fails without causal closure", () => {
    const f2 = mkFrag("cw1", 2, { a: 2 });
    const missing0 = mkFrag("cw1", 0, { a: 0 });
    const result = reconstructIfValid([f2], [f2, missing0], 1, rsDecodeStub);
    assert.ok(!result.valid);
    assert.equal(result.reason, "not-causally-closed");
  });
});
