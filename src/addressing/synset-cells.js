import { fnv1a32, toIPv4HostRoute, toIPv6Centroid } from "./cidr.js";

export const FIVE_CELL_MNEMONIC = Object.freeze([
  { id: "S0", name: "lemma", role: "identity term", channel: "US" },
  { id: "S1", name: "hyper", role: "upward abstraction", channel: "GS" },
  { id: "S2", name: "hypo", role: "downward instance", channel: "US" },
  { id: "S3", name: "part", role: "part-whole boundary", channel: "FS" },
  { id: "S4", name: "oppo", role: "contrast closure", channel: "RS" }
]);

export const TWENTY_FOUR_CELL_MNEMONIC = Object.freeze([
  "syn.id", "syn.alias", "syn.gloss", "syn.example",
  "isa.hypernym", "isa.hyponym", "isa.instance", "isa.category",
  "part.meronym", "part.holonym", "part.member", "part.substance",
  "flow.entailment", "flow.cause", "flow.derivation", "flow.domain",
  "qual.similar", "qual.attribute", "qual.participle", "qual.pertainym",
  "opp.antonym", "opp.negation", "ctx.topic", "ctx.region"
].map((name, index) => Object.freeze({
  id: `C${String(index).padStart(2, "0")}`,
  index,
  name,
  simplex: FIVE_CELL_MNEMONIC[index % FIVE_CELL_MNEMONIC.length].id,
  channel: FIVE_CELL_MNEMONIC[index % FIVE_CELL_MNEMONIC.length].channel
})));

const RELATION_TO_FIVE_CELL = Object.freeze({
  synonym: "S0",
  hypernym: "S1",
  hyponym: "S2",
  meronym: "S3",
  holonym: "S3",
  antonym: "S4",
  similar: "S4",
  entailment: "S4",
  derivation: "S0",
  domain: "S1"
});

const RELATION_TO_24_BASE = Object.freeze({
  synonym: 0,
  hypernym: 4,
  hyponym: 5,
  meronym: 8,
  holonym: 9,
  antonym: 20,
  similar: 16,
  entailment: 12,
  derivation: 14,
  domain: 15
});

function valuesFor(relations, slot) {
  return Array.isArray(relations?.[slot]) ? relations[slot] : [];
}

function cellAddress(seed, prefix, cell) {
  const cellSeed = JSON.stringify({ prefix, cell, seed });
  return {
    ipv6: toIPv6Centroid(cellSeed),
    ipv4: toIPv4HostRoute(cellSeed),
    hash32: fnv1a32(cellSeed).toString(16).padStart(8, "0")
  };
}

export function fiveCellVector(relations) {
  const counts = Object.fromEntries(FIVE_CELL_MNEMONIC.map((cell) => [cell.id, 0]));
  for (const [slot, values] of Object.entries(relations || {})) {
    const id = RELATION_TO_FIVE_CELL[slot] || "S0";
    counts[id] += Array.isArray(values) ? values.length : 0;
  }
  return FIVE_CELL_MNEMONIC.map((cell) => counts[cell.id]);
}

export function twentyFourCellVector(relations) {
  const vector = new Array(TWENTY_FOUR_CELL_MNEMONIC.length).fill(0);
  for (const [slot, values] of Object.entries(relations || {})) {
    const base = RELATION_TO_24_BASE[slot] ?? 0;
    const count = Array.isArray(values) ? values.length : 0;
    vector[base] += count;
    valuesFor(relations, slot).forEach((value, i) => {
      const hash = fnv1a32(`${slot}:${value}:${i}`);
      vector[(base + 1 + (hash % 3)) % vector.length] += 1;
    });
  }
  return vector;
}

export function makeSynsetCellAddress({ lemma, pos = "X", relations = {}, seed = "" }) {
  const canonicalSeed = JSON.stringify({
    v: "omi.synset.cells.v0",
    lemma,
    pos,
    relations,
    seed
  });
  const fiveVector = fiveCellVector(relations);
  const cell24Vector = twentyFourCellVector(relations);
  const fiveCells = FIVE_CELL_MNEMONIC.map((cell, index) => ({
    ...cell,
    value: fiveVector[index],
    ...cellAddress(canonicalSeed, "5-cell", cell.id)
  }));
  const cells24 = TWENTY_FOUR_CELL_MNEMONIC.map((cell, index) => ({
    ...cell,
    value: cell24Vector[index],
    ...cellAddress(canonicalSeed, "24-cell", cell.id)
  }));
  const active5 = fiveCells.filter((cell) => cell.value > 0).map((cell) => cell.id);
  const active24 = cells24.filter((cell) => cell.value > 0).map((cell) => cell.id);

  return {
    v: "omi.synset.cells.v0",
    mnemonic: "5-cell/24-cell",
    lemma,
    pos,
    canonical: `synset:${pos}:${lemma}:5c${active5.join("-") || "S0"}:24c${active24.join("-") || "C00"}`,
    fiveCell: {
      cells: fiveCells,
      vector: fiveVector,
      active: active5
    },
    twentyFourCell: {
      cells: cells24,
      vector: cell24Vector,
      active: active24
    }
  };
}
