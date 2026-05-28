import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createFragmentStore, FragmentStore } from "../src/distributed/fragment-store.js";

function frag(cwId, fi, vv) {
  return { codewordId: cwId, fragmentIndex: fi, total: 3, versionVector: vv, data: new Uint8Array([fi]) };
}

describe("FragmentStore", () => {
  it("put and get fragments", () => {
    const store = createFragmentStore();
    assert.ok(store.put(frag("cw1", 0, { a: 1 })));
    assert.ok(store.put(frag("cw1", 1, { a: 1 })));
    assert.equal(store.size, 2);
    const results = store.get("cw1");
    assert.equal(results.length, 2);
  });

  it("put deduplicates exact match", () => {
    const store = new FragmentStore();
    const f = frag("cw1", 0, { a: 1 });
    assert.ok(store.put(f));
    assert.ok(!store.put(f));
    assert.equal(store.size, 1);
  });

  it("frontier aggregates codewords", () => {
    const store = createFragmentStore();
    store.put(frag("cw1", 0, { a: 2 }));
    store.put(frag("cw1", 1, { a: 1 }));
    store.put(frag("cw2", 0, { b: 3 }));
    const f = store.frontier();
    assert.equal(f.cw1.a, 2);
    assert.equal(f.cw2.b, 3);
  });

  it("missingFragments detects gaps", () => {
    const store = createFragmentStore();
    store.put(frag("cw1", 0, { a: 2 }));
    store.put(frag("cw1", 1, { a: 1 }));
    const missing = store.missingFragments({ cw1: { a: 3 } });
    assert.equal(missing.length, 1);
    assert.equal(missing[0].codewordId, "cw1");
    assert.equal(missing[0].remoteVV.a, 3);
  });

  it("missingFragments empty when caught up", () => {
    const store = createFragmentStore();
    store.put(frag("cw1", 0, { a: 3 }));
    assert.deepEqual(store.missingFragments({ cw1: { a: 2 } }), []);
  });

  it("isReconstructable checks sufficiency and closure", () => {
    const store = createFragmentStore();
    store.put(frag("cw1", 0, { a: 1 }));
    store.put(frag("cw1", 1, { a: 1 }));
    store.put(frag("cw1", 2, { a: 1 }));
    assert.ok(store.isReconstructable("cw1", 3));
    assert.ok(!store.isReconstructable("cw1", 4));
  });

  it("clear removes all", () => {
    const store = createFragmentStore();
    store.put(frag("cw1", 0, { a: 1 }));
    assert.equal(store.size, 1);
    store.clear();
    assert.equal(store.size, 0);
  });

  it("getAll returns copy", () => {
    const store = createFragmentStore();
    store.put(frag("cw1", 0, { a: 1 }));
    const all = store.getAll();
    assert.equal(all.length, 1);
    all.push(1);
    assert.equal(store.size, 1);
  });
});
