import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AntiEntropyRepair, createRepairScheduler } from "../src/distributed/anti-entropy.js";
import { createFragmentStore } from "../src/distributed/fragment-store.js";

function frag(cwId, fi, vv) {
  return { codewordId: cwId, fragmentIndex: fi, total: 3, versionVector: vv, data: new Uint8Array([fi]) };
}

describe("AntiEntropyRepair", () => {
  it("checkDivergence detects concurrent writes", () => {
    const local = { cw1: { a: 2, b: 0 } };
    const remote = { cw1: { a: 1, b: 1 } };
    const diverged = AntiEntropyRepair.checkDivergence(local, remote);
    assert.equal(diverged.length, 1);
  });

  it("checkDivergence returns empty for identical frontiers", () => {
    const f = { cw1: { a: 1 } };
    assert.deepEqual(AntiEntropyRepair.checkDivergence(f, f), []);
  });

  it("computeMissing returns items remote has that we don't", () => {
    const store = createFragmentStore();
    store.put(frag("cw1", 0, { a: 1 }));
    const remoteFrontier = { cw1: { a: 2 } };
    const missing = AntiEntropyRepair.computeMissing(store, remoteFrontier);
    assert.ok(missing.length > 0);
  });

  it("computeMissingIndices finds gaps", () => {
    const store = createFragmentStore();
    store.put(frag("cw1", 0, { a: 1 }));
    store.put(frag("cw1", 2, { a: 1 }));
    const missing = AntiEntropyRepair.computeMissingIndices(store, { cw1: { a: 1 } }, "cw1", 3);
    assert.deepEqual(missing, [1]);
  });

  it("createRepairScheduler and lifecycle", () => {
    const node = { frontier: () => ({}), receiveDelta: () => [] };
    const repair = createRepairScheduler(node, { triggerPeriodic: false });
    assert.ok(repair instanceof AntiEntropyRepair);
    assert.equal(repair.isRunning, false);
    repair.start([]);
    assert.equal(repair.isRunning, true);
    repair.stop();
    assert.equal(repair.isRunning, false);
  });

  it("triggerRepair returns metrics", async () => {
    const node = {
      frontier: () => ({ cw1: { a: 2 } }),
      receiveDelta: () => [1, 2]
    };
    const repair = createRepairScheduler(node, { triggerPeriodic: false });
    const result = await repair.triggerRepair([]);
    assert.ok(result.repaired >= 0);
    assert.ok(repair.metrics.repairsTriggered >= 1);
  });
});
