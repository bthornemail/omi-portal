import * as Tablets from "../src/omi/upos-feature-tablets.js";
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";

describe("UPOS Feature Tablets", () => {
  it("NOUN maps to Q0.1.4", () => {
    const cell = Tablets.tagToQCell("NOUN");
    assert.ok(cell);
    assert.equal(cell.q, 1);
    assert.equal(cell.row, 1);
    assert.equal(cell.col, 4);
    assert.equal(cell.tablet, "Q0");
  });

  it("VERB maps to Q0.2.1", () => {
    const cell = Tablets.tagToQCell("VERB");
    assert.equal(cell.q, 1);
    assert.equal(cell.row, 2);
    assert.equal(cell.col, 1);
  });

  it("PUNCT maps to Q0.3.5", () => {
    const cell = Tablets.tagToQCell("PUNCT");
    assert.equal(cell.q, 1);
    assert.equal(cell.row, 3);
    assert.equal(cell.col, 5);
  });

  it("PronType maps to Q1.1.1", () => {
    const cell = Tablets.tagToQCell("PronType");
    assert.equal(cell.q, 2);
    assert.equal(cell.row, 1);
    assert.equal(cell.col, 1);
    assert.equal(cell.tablet, "Q1");
  });

  it("Motif maps to Q1.4.1", () => {
    const cell = Tablets.tagToQCell("Motif");
    assert.equal(cell.q, 2);
    assert.equal(cell.row, 4);
    assert.equal(cell.col, 1);
  });

  it("Tense maps to Q2.3.3", () => {
    const cell = Tablets.tagToQCell("Tense");
    assert.equal(cell.q, 3);
    assert.equal(cell.row, 3);
    assert.equal(cell.col, 3);
    assert.equal(cell.tablet, "Q2");
  });

  it("hyp maps to Q3.2.1", () => {
    const cell = Tablets.tagToQCell("hyp");
    assert.equal(cell.q, 4);
    assert.equal(cell.row, 2);
    assert.equal(cell.col, 1);
  });

  it("receipt maps to Q3.5.2", () => {
    const cell = Tablets.tagToQCell("receipt");
    assert.equal(cell.q, 4);
    assert.equal(cell.row, 5);
    assert.equal(cell.col, 2);
  });

  it("qCellToTag reverse-maps correctly", () => {
    assert.equal(Tablets.qCellToTag(1, 1, 4), "NOUN");
    assert.equal(Tablets.qCellToTag(1, 2, 1), "VERB");
    assert.equal(Tablets.qCellToTag(4, 2, 1), "hyp");
    assert.equal(Tablets.qCellToTag(4, 5, 2), "receipt");
  });

  it("encodeTag produces unique numeric code", () => {
    const code = Tablets.encodeTag("NOUN");
    assert.ok(code !== null);
    assert.equal(typeof code, "number");
    assert.ok(code > 0);
  });

  it("decodeTag reverses encodeTag", () => {
    const tags = ["NOUN", "VERB", "ADJ", "PUNCT", "hyp", "receipt", "Motif", "Tense"];
    for (const tag of tags) {
      const code = Tablets.encodeTag(tag);
      assert.ok(code !== null, `Failed to encode ${tag}`);
      const decoded = Tablets.decodeTag(code);
      assert.equal(decoded, tag, `Round-trip failed for ${tag}`);
    }
  });

  it("formatQCell produces Q#.row.col string", () => {
    assert.equal(Tablets.formatQCell(1, 1, 4), "Q0.1.4");
    assert.equal(Tablets.formatQCell(4, 2, 1), "Q3.2.1");
  });

  it("tagToQCell returns null for unknown tag", () => {
    assert.equal(Tablets.tagToQCell("NONEXISTENT"), null);
  });

  it("qCellToTag returns null for out-of-range", () => {
    assert.equal(Tablets.qCellToTag(0, 1, 1), null);
    assert.equal(Tablets.qCellToTag(5, 1, 1), null);
    assert.equal(Tablets.qCellToTag(1, 0, 1), null);
    assert.equal(Tablets.qCellToTag(1, 6, 1), null);
  });

  it("decodeTag returns null for invalid codes", () => {
    assert.equal(Tablets.decodeTag(-1), null);
    assert.equal(Tablets.decodeTag(0xFFFF), null);
    assert.equal(Tablets.decodeTag(null), null);
  });

  it("all Q0 tablet cells are reachable via tagToQCell", () => {
    const q0Cells = [
      "ADJ", "ADV", "INTJ", "NOUN", "PROPN",
      "VERB", "ADP", "AUX", "CCONJ", "DET",
      "NUM", "PART", "PRON", "SCONJ", "PUNCT",
      "SYM", "X", "NULL", "ACK", "BREAK",
      "SOURCE", "NOTATE", "READ", "RECEIPT", "WILD",
    ];
    for (const tag of q0Cells) {
      const cell = Tablets.tagToQCell(tag);
      assert.ok(cell, `Q0 cell ${tag} not found in tag index`);
      assert.equal(cell.q, 1, `${tag} should be in Q0`);
    }
  });
});
