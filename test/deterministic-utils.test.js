import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fnv1a32,
  deterministicPeerOrder,
  deterministicLayerAssignment,
  canonicalFragmentSort,
  stableJson,
  deterministicClock,
} from "../src/core/deterministic-utils.js";
import { HNSWIndex } from "../src/distributed/hnsw-index.js";
import { CoTURNProxy } from "../src/distributed/coturn-proxy.js";
import { OmiChiralFifoEngine } from "../src/runtime/chiral-fifo-engine.js";

function makeSAB() {
  return new SharedArrayBuffer(5040 * 8);
}

describe("deterministic-utils", () => {
  it("fnv1a32 is deterministic", () => {
    const h1 = fnv1a32("hello");
    const h2 = fnv1a32("hello");
    assert.equal(h1, h2);
    assert.equal(typeof h1, "number");
    assert.ok(h1 >= 0 && h1 <= 0xFFFFFFFF);
  });

  it("fnv1a32 produces different hashes for different inputs", () => {
    const h1 = fnv1a32("peer-a");
    const h2 = fnv1a32("peer-b");
    assert.notEqual(h1, h2);
  });

  it("deterministicPeerOrder returns stable order for same round/seed", () => {
    const peers = ["a", "b", "c", "d", "e"];
    const order1 = deterministicPeerOrder(peers, 1, 42);
    const order2 = deterministicPeerOrder(peers, 1, 42);
    assert.deepEqual(order1, order2);
    assert.equal(order1.length, peers.length);
    assert.deepEqual([...order1].sort(), [...peers].sort());
  });

  it("deterministicPeerOrder changes with round", () => {
    const peers = ["a", "b", "c", "d", "e"];
    const order1 = deterministicPeerOrder(peers, 0, 0);
    const order2 = deterministicPeerOrder(peers, 1, 0);
    // highly probable that they differ
    const same = order1.every((id, i) => id === order2[i]);
    assert.ok(!same, "different rounds should produce different orders");
  });

  it("deterministicLayerAssignment is stable for same node/vector", () => {
    const level1 = deterministicLayerAssignment("node1", [1, 2, 3], 16);
    const level2 = deterministicLayerAssignment("node1", [1, 2, 3], 16);
    assert.equal(level1, level2);
    assert.ok(Number.isInteger(level1));
    assert.ok(level1 >= 0);
  });

  it("deterministicLayerAssignment changes with different node id", () => {
    const l1 = deterministicLayerAssignment("node-a", [1, 2, 3], 16);
    const l2 = deterministicLayerAssignment("node-b", [1, 2, 3], 16);
    assert.notEqual(l1, l2);
  });

  it("canonicalFragmentSort is stable", () => {
    const frags = [
      { codewordId: "b", fragmentIndex: 2, versionVector: { a: 3 } },
      { codewordId: "a", fragmentIndex: 1, versionVector: { b: 1 } },
      { codewordId: "a", fragmentIndex: 0, versionVector: { a: 2 } },
    ];
    const sorted = canonicalFragmentSort(frags);
    assert.equal(sorted[0].codewordId, "a");
    // same codewordId preserves sort by versionVector string
    assert.ok(sorted[0].codewordId <= sorted[1].codewordId);
    assert.equal(sorted[2].codewordId, "b");
  });

  it("canonicalFragmentSort does not mutate original", () => {
    const frags = [{ codewordId: "b" }, { codewordId: "a" }];
    const sorted = canonicalFragmentSort(frags);
    assert.equal(frags[0].codewordId, "b");
    assert.equal(sorted[0].codewordId, "a");
  });

  it("stableJson produces deterministic keys", () => {
    const a = stableJson({ b: 1, a: 2 });
    const b = stableJson({ a: 2, b: 1 });
    assert.equal(a, b);
    assert.equal(a, '{"a":2,"b":1}');
  });

  it("deterministicClock starts at seed and advances", () => {
    const clock = deterministicClock(100);
    assert.equal(clock.now(), 100);
    assert.equal(clock.advance(), 101);
    assert.equal(clock.advance(5), 106);
    assert.equal(clock.now(), 106);
  });

  it("deterministicClock reset works", () => {
    const clock = deterministicClock(42);
    clock.advance(10);
    assert.equal(clock.now(), 52);
    clock.reset();
    assert.equal(clock.now(), 42);
  });
});

describe("HNSW level assignment determinism", () => {
  it("same insert produces same internal structure", () => {
    const idx1 = new HNSWIndex({ M: 8, efConstruction: 50, efSearch: 50 });
    const idx2 = new HNSWIndex({ M: 8, efConstruction: 50, efSearch: 50 });
    idx1.insert([1, 0, 0], "v1");
    idx1.insert([0, 1, 0], "v2");
    idx2.insert([1, 0, 0], "v1");
    idx2.insert([0, 1, 0], "v2");
    const search1 = idx1.search([1, 0.1, 0], 2);
    const search2 = idx2.search([1, 0.1, 0], 2);
    assert.equal(search1.length, search2.length);
    assert.equal(search1[0].id, search2[0].id);
  });
});

describe("CoTURN determinism", () => {
  it("injectable now/nonce produces stable credentials", async () => {
    let fakeNow = 1000000;
    const proxy = new CoTURNProxy({
      secret: "test-secret",
      now: () => fakeNow,
      nonce: async () => "deadbeef",
    });
    const creds1 = await proxy.generateCredentials("alice");
    const creds2 = await proxy.generateCredentials("alice");
    assert.equal(creds1.username, creds2.username);
    assert.equal(creds1.password, creds2.password);
  });

  it("injectable now works with validation", async () => {
    const proxy = new CoTURNProxy({
      secret: "test-secret",
      now: () => 2000000,
      nonce: async () => "cafebabe",
    });
    const creds = await proxy.generateCredentials("bob");
    assert.ok(creds.username.includes("bob"));
    assert.ok(await proxy.validateCredentials(creds.username, creds.password));
  });
});

describe("Chiral FIFO engine determinism", () => {
  it("injected tick produces sequential timestamps", () => {
    const sab = makeSAB();
    const engine = new OmiChiralFifoEngine(sab, { tick: 0 });
    const freq = [1.0, 0.5, 0.25, 0.125];
    const r1 = engine.processAnalogFFTChunk(0, freq, true);
    const r2 = engine.processAnalogFFTChunk(1, freq, false);
    const r3 = engine.processAnalogFFTChunk(2, freq, true);
    assert.equal(r1.car.tick, 1);
    assert.equal(r2.car.tick, 2);
    assert.equal(r3.car.tick, 3);
  });

  it("no Date.now in output when tick is injected", () => {
    const sab = makeSAB();
    const engine = new OmiChiralFifoEngine(sab, { tick: 42 });
    const freq = [1.0, 0.5, 0.25, 0.125];
    const r = engine.processAnalogFFTChunk(0, freq, true);
    assert.equal(typeof r.car.tick, "number");
    assert.equal(r.car.timestamp, undefined);
  });
});
