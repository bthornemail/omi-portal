import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HNSWIndex, createHNSWIndex, cosineSimilarity, cosineDistance, l2Distance } from "../src/distributed/hnsw-index.js";

describe("Distance functions", () => {
  it("cosineSimilarity of identical vectors is 1", () => {
    assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
    assert.equal(cosineSimilarity([0, 0], [0, 0]), 0);
  });

  it("cosineSimilarity of orthogonal vectors is 0", () => {
    assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  });

  it("cosineDistance is 1 - cosineSimilarity", () => {
    assert.equal(cosineDistance([1, 0], [1, 0]), 0);
    assert.equal(cosineDistance([1, 0], [0, 1]), 1);
  });

  it("l2Distance", () => {
    assert.equal(l2Distance([0, 0], [3, 4]), 5);
    assert.equal(l2Distance([1, 2], [1, 2]), 0);
  });
});

describe("HNSWIndex", () => {
  it("starts empty", () => {
    const idx = createHNSWIndex();
    assert.equal(idx.size, 0);
    assert.deepEqual(idx.search([1, 0]), []);
  });

  it("inserts a single vector", () => {
    const idx = createHNSWIndex();
    idx.insert([1, 0, 0], "vec1");
    assert.equal(idx.size, 1);
  });

  it("finds nearest by cosine similarity", () => {
    const idx = createHNSWIndex({ M: 8, efConstruction: 50, efSearch: 50 });
    idx.insert([1, 0, 0], "v1");
    idx.insert([0, 1, 0], "v2");
    idx.insert([0, 0, 1], "v3");
    const results = idx.search([1, 0.1, 0], 2);
    assert.equal(results.length, 2);
    assert.equal(results[0].id, "v1");
  });

  it("insert with duplicate id throws", () => {
    const idx = createHNSWIndex();
    idx.insert([1, 0], "dup");
    assert.throws(() => idx.insert([0, 1], "dup"), /already exists/);
  });

  it("clear resets index", () => {
    const idx = createHNSWIndex();
    idx.insert([1, 0, 0], "v1");
    assert.equal(idx.size, 1);
    idx.clear();
    assert.equal(idx.size, 0);
    assert.deepEqual(idx.search([1, 0, 0]), []);
  });

  it("works with l2 distance", () => {
    const idx = createHNSWIndex({ distance: l2Distance, M: 4, efConstruction: 50, efSearch: 50 });
    idx.insert([0, 0], "origin");
    idx.insert([10, 0], "far");
    const results = idx.search([1, 0], 2);
    assert.equal(results[0].id, "origin");
  });

  it("generates auto-id when none given", () => {
    const idx = createHNSWIndex();
    idx.insert([1, 0, 0]);
    assert.equal(idx.size, 1);
  });
});
