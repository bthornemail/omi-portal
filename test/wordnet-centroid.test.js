import test from "node:test";
import assert from "node:assert/strict";
import { makeWordNetCentroid } from "../src/wordnet/relation-space.js";
import { makeDOMCSSOMTetrahedron, tetrahedronToJSONCanvas } from "../src/web/dom-cssom-tetrahedron.js";

const mockRecords = [
  {
    lemma: "node",
    synonyms: ["node", "vertex"],
    hypernyms: ["point"],
    hyponyms: ["dom_node"],
    meronyms: ["edge"],
    holonyms: ["graph"],
    antonyms: ["void"]
  }
];

test("WordNet centroid requires six relation facts for stability", () => {
  const centroid = makeWordNetCentroid({ lemma: "node", pos: "NOUN", lookupRecords: mockRecords, minRelations: 6 });
  assert.equal(centroid.metric.stable, true);
  assert.equal(centroid.metric.minRelations, 6);
  assert.match(centroid.ipv6, /^2001:db8:/);
  assert.match(centroid.ipv4, /^127\./);
});

test("DOM/CSSOM tetrahedron emits four vertices and six edges", () => {
  const centroid = makeWordNetCentroid({ lemma: "node", pos: "NOUN", lookupRecords: mockRecords, minRelations: 6 });
  const tetrahedron = makeDOMCSSOMTetrahedron([centroid]);
  const canvas = tetrahedronToJSONCanvas(tetrahedron);
  assert.equal(tetrahedron.vertices.length, 4);
  assert.equal(tetrahedron.edges.length, 6);
  assert.ok(canvas.nodes.some((n) => n.id === "dom-cssom-centroid"));
  assert.ok(tetrahedron.vertices.every((v) => v.metric.stable));
});
