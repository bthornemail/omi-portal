import test from "node:test";
import assert from "node:assert/strict";
import { OmiSemanticMemoryBroker } from "../src/web/semantic-memory-broker.js";
import {
  makeWordNetCentroid,
  relationSetFromLookup,
  WORDNET_RELATION_SLOTS
} from "../src/wordnet/relation-space.js";

function makeMockBroker() {
  return {
    async lookup(lemma) {
      if (lemma === "node") {
        return [
          {
            synsetOffset: "100002684",
            pos: "NOUN",
            lemma: "node",
            synonyms: ["node", "knot"],
            gloss: "any thickened enlargement",
            ptrs: [
              { pointerSymbol: "@", words: ["plant_process", "enlargement"] },
              { pointerSymbol: "~", words: ["burl"] },
              { pointerSymbol: "!", words: ["smooth"] }
            ]
          },
          {
            synsetOffset: "04567890",
            pos: "NOUN",
            lemma: "node",
            synonyms: ["node", "client", "guest"],
            gloss: "a computer attached to a network",
            ptrs: [
              { pointerSymbol: "@", words: ["computer", "machine"] },
              { pointerSymbol: "~", words: ["terminal", "workstation"] },
              { pointerSymbol: "!", words: ["server"] }
            ]
          }
        ];
      }
      if (lemma === "graph") {
        return [
          {
            synsetOffset: "100002685",
            pos: "NOUN",
            lemma: "graph",
            synonyms: ["graph", "chart"],
            gloss: "a visual representation",
            ptrs: [
              { pointerSymbol: "@", words: ["visual_representation"] },
              { pointerSymbol: "~", words: ["bar_chart", "pie_chart"] }
            ]
          }
        ];
      }
      return [];
    }
  };
}

test("OmiSemanticMemoryBroker constructs with prolog broker", () => {
  const broker = new OmiSemanticMemoryBroker({ prologBroker: makeMockBroker() });
  assert.ok(broker instanceof OmiSemanticMemoryBroker);
  assert.equal(broker.size, 0);
});

test("OmiSemanticMemoryBroker rejects missing prolog broker", () => {
  assert.throws(() => new OmiSemanticMemoryBroker(), /PrologWordNetBroker/);
  assert.throws(() => new OmiSemanticMemoryBroker({}), /PrologWordNetBroker/);
});

test("ingestLemma inserts HNSW node from Prolog lookup", async () => {
  const broker = new OmiSemanticMemoryBroker({ prologBroker: makeMockBroker() });
  const result = await broker.ingestLemma("node", { tick: 0 });
  assert.ok(result);
  assert.equal(result.centroid.lemma, "node");
  assert.ok(result.centroid.relationVector.length >= 6);
  assert.equal(result.inserted, true);
  assert.equal(broker.size, 1);

  const node = broker.getIndexNode("node:NOUN");
  assert.ok(node);
  assert.ok(node.vector instanceof Float32Array);
  assert.equal(node.vector.length, WORDNET_RELATION_SLOTS.length);
});

test("ingestLemma returns null for unknown lemma", async () => {
  const broker = new OmiSemanticMemoryBroker({ prologBroker: makeMockBroker() });
  const result = await broker.ingestLemma("nonexistent_word_xyz", { tick: 1 });
  assert.equal(result, null);
  assert.equal(broker.size, 0);
});

test("ingestLemma handles duplicate insert gracefully", async () => {
  const broker = new OmiSemanticMemoryBroker({ prologBroker: makeMockBroker() });
  await broker.ingestLemma("node", { tick: 0 });
  const dup = await broker.ingestLemma("node", { tick: 1 });
  assert.ok(dup);
  assert.equal(dup.inserted, false);
  assert.equal(dup.error, "duplicate");
});

test("searchByLemma returns nearest neighbors", async () => {
  const broker = new OmiSemanticMemoryBroker({ prologBroker: makeMockBroker() });
  await broker.ingestLemma("node", { tick: 0 });
  await broker.ingestLemma("graph", { tick: 1 });

  const results = await broker.searchByLemma("node", 5);
  assert.ok(Array.isArray(results));
  assert.ok(results.length >= 1);
  assert.ok(results.some((r) => r.id === "node:NOUN"));
});

test("searchByVector returns nearest neighbors from raw vector", async () => {
  const broker = new OmiSemanticMemoryBroker({ prologBroker: makeMockBroker() });
  await broker.ingestLemma("node", { tick: 0 });
  await broker.ingestLemma("graph", { tick: 1 });

  const vector = new Float32Array([2, 1, 1, 0, 0, 1, 0]);
  const results = broker.searchByVector(vector, 5);
  assert.ok(Array.isArray(results));
  assert.ok(results.length >= 1);
});

test("getTemporalSlot reads value stored at tick", async () => {
  const broker = new OmiSemanticMemoryBroker({ prologBroker: makeMockBroker() });
  await broker.ingestLemma("node", { tick: 42 });
  const slot = broker.getTemporalSlot(42);
  // storeTickValue stores the index size (1 after first insert)
  assert.equal(slot, 1);
});

test("cons/car/cdr cell operations", () => {
  const broker = new OmiSemanticMemoryBroker({ prologBroker: makeMockBroker() });
  const cell = broker.cons("a", "b");
  assert.equal(broker.car(cell), "a");
  assert.equal(broker.cdr(cell), "b");
});
