import { packOWord, unpackOWord } from "../omi/o-bitboard.js";

export const EDGE_TYPES = Object.freeze([
  "hyp", "entails", "similar", "mirrors",
  "unlocks", "requires", "receipts", "routes"
]);

export const EDGE_TYPE_WEIGHTS = Object.freeze({
  hyp: 1.0, entails: 1.5, similar: 0.8,
  mirrors: 1.2, unlocks: 2.0, requires: -1.0,
  receipts: 0.5, routes: 1.0
});

export function createGenomeNode(seed, motif, emoji, synset) {
  return {
    id: seed,
    motif: motif || null,
    emoji: emoji || null,
    synset: synset || null,
    carrier: null,
    receipt: null,
    metadata: {}
  };
}

export function compileGenomeNode(node) {
  const seed = String(node.id || "");
  const motif = node.motif || "";
  const emoji = node.emoji || "";

  const selector = node.receipt !== null ? 1 : 0;
  const path = seed.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) & 0x7FFFF, 0);
  const idHash = seed.split("").reduce((h, c) => ((h << 5n) - h + BigInt(c.charCodeAt(0))) & 0xFFFFFFFFFFFFFFFFn, 0n);
  const motifCode = motif ? BigInt(motif.charCodeAt(0) || 0) : 0n;
  const emojiCode = emoji ? emoji.split("").reduce((h, c) => ((h << 5n) - h + BigInt(c.charCodeAt(0) || 0)) & 0xFFFFFFFFFFFFFFFFn, 0n) : 0n;
  const surface = (idHash ^ (motifCode << 40n) ^ (emojiCode << 80n)) & ((1n << 236n) - 1n);

  const word = packOWord({ selector, path, surface });
  node.carrier = word;
  return word;
}

export function genomeToCarrier(genome) {
  return genome.map(n => {
    if (n.carrier == null) compileGenomeNode(n);
    return BigInt(n.carrier);
  });
}

export function carrierToGenome(words) {
  return words.map((w, i) => {
    const word = BigInt(w);
    const { selector, path, surface } = unpackOWord(word);
    return {
      id: `carrier-${i}`,
      motif: null, emoji: null, synset: null,
      carrier: word, receipt: selector === 1 ? {} : null,
      metadata: { path, surface }
    };
  });
}

export function createEdge(fromId, toId, type) {
  if (!EDGE_TYPES.includes(type)) throw new Error(`Unknown edge type: ${type}`);
  return { from: fromId, to: toId, type };
}
