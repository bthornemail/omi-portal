import test from "node:test";
import assert from "node:assert/strict";

import {
  FIVE_CELL_MNEMONIC,
  TWENTY_FOUR_CELL_MNEMONIC,
  makeSynsetCellAddress
} from "../src/addressing/synset-cells.js";
import { makeWordNetCentroid } from "../src/wordnet/relation-space.js";

const relations = {
  synonym: ["node", "vertex"],
  hypernym: ["point"],
  hyponym: ["dom_node"],
  meronym: ["edge"],
  holonym: ["graph"],
  antonym: ["void"]
};

test("synset cell mnemonic exposes canonical 5-cell and 24-cell spaces", () => {
  const address = makeSynsetCellAddress({ lemma: "node", pos: "NOUN", relations });

  assert.equal(FIVE_CELL_MNEMONIC.length, 5);
  assert.equal(TWENTY_FOUR_CELL_MNEMONIC.length, 24);
  assert.equal(address.fiveCell.vector.length, 5);
  assert.equal(address.twentyFourCell.vector.length, 24);
  assert.ok(address.fiveCell.active.length >= 5);
  assert.ok(address.twentyFourCell.active.length >= 6);
  assert.match(address.canonical, /^synset:NOUN:node:5c/);
});

test("WordNet centroid includes canonical synset cell addressing", () => {
  const centroid = makeWordNetCentroid({
    lemma: "node",
    pos: "NOUN",
    lookupRecords: [relations],
    minRelations: 6
  });

  assert.equal(centroid.cells.mnemonic, "5-cell/24-cell");
  assert.equal(centroid.cells.fiveCell.cells.length, 5);
  assert.equal(centroid.cells.twentyFourCell.cells.length, 24);
  assert.ok(centroid.cells.fiveCell.cells.every((cell) => cell.ipv6.startsWith("2001:db8:")));
  assert.ok(centroid.cells.twentyFourCell.cells.every((cell) => cell.ipv4.startsWith("127.")));
});
