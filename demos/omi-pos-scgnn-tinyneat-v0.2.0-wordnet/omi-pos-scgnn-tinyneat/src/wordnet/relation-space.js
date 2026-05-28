import { toIPv4HostRoute, toIPv6Centroid, cidrMetric, fnv1a32 } from "../addressing/cidr.js";

export const MIN_WORDNET_RELATIONS = 6;

// Six required relation slots: enough to make a tetrahedron centroid stable.
// The extra slots let richer WordNet records improve the metric without changing the ABI.
export const WORDNET_RELATION_SLOTS = Object.freeze([
  "synonym",
  "hypernym",
  "hyponym",
  "meronym",
  "holonym",
  "antonym",
  "similar",
  "entailment",
  "derivation",
  "domain"
]);

export const WORDNET_RELATION_INDEX = Object.freeze(
  Object.fromEntries(WORDNET_RELATION_SLOTS.map((name, i) => [name, i]))
);

export function normalizeLemma(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function pushUnique(arr, value) {
  const v = normalizeLemma(value);
  if (v && !arr.includes(v)) arr.push(v);
}

function extractWords(value) {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(extractWords);
  if (typeof value === "object") {
    return [
      value.lemma,
      value.word,
      value.synsetOffset,
      value.synset || value.synsetid,
      value.ptrSymbol,
      value.pos
    ].filter(Boolean).map(String);
  }
  return [String(value)];
}

function emptyRelations() {
  return Object.fromEntries(WORDNET_RELATION_SLOTS.map((slot) => [slot, []]));
}

// Accepts either wordpos lookup records or a small mock record shape used by tests.
export function relationSetFromLookup(lemma, lookupRecords = []) {
  const relations = emptyRelations();
  const normalizedLemma = normalizeLemma(lemma);

  for (const rec of lookupRecords || []) {
    pushUnique(relations.synonym, rec.lemma || rec.word || normalizedLemma);
    for (const word of extractWords(rec.synonyms || rec.words)) pushUnique(relations.synonym, word);

    const ptrs = rec.ptrs || rec.pointers || rec.relations || [];
    for (const ptr of ptrs) {
      const symbol = String(ptr.pointerSymbol || ptr.ptrSymbol || ptr.symbol || ptr.type || "").trim();
      const words = extractWords(ptr.words || ptr.lemma || ptr.target || ptr.synsetOffset || ptr);
      const target = words.join("_");
      if (["@", "@i"].includes(symbol)) pushUnique(relations.hypernym, target);
      else if (["~", "~i"].includes(symbol)) pushUnique(relations.hyponym, target);
      else if (["%m", "%s", "%p"].includes(symbol)) pushUnique(relations.meronym, target);
      else if (["#m", "#s", "#p"].includes(symbol)) pushUnique(relations.holonym, target);
      else if (symbol === "!") pushUnique(relations.antonym, target);
      else if (["&", "="].includes(symbol)) pushUnique(relations.similar, target);
      else if (symbol === "*") pushUnique(relations.entailment, target);
      else if (symbol === "+") pushUnique(relations.derivation, target);
      else if ([";c", ";r", ";u", "-c", "-r", "-u"].includes(symbol)) pushUnique(relations.domain, target);
    }

    for (const slot of WORDNET_RELATION_SLOTS) {
      for (const word of extractWords(rec[slot] || rec[`${slot}s`])) pushUnique(relations[slot], word);
    }
  }

  // The lemma itself is always the identity synonym, so empty WordNet results remain addressable but unstable.
  pushUnique(relations.synonym, normalizedLemma);
  for (const slot of WORDNET_RELATION_SLOTS) relations[slot].sort();
  return relations;
}

export function relationVector(relations) {
  return WORDNET_RELATION_SLOTS.map((slot) => (relations[slot] || []).length);
}

export function relationCount(relations) {
  return relationVector(relations).reduce((a, b) => a + b, 0);
}

export function makeWordNetCentroid({ lemma, pos = "X", lookupRecords = [], minRelations = MIN_WORDNET_RELATIONS }) {
  const norm = normalizeLemma(lemma);
  const relations = relationSetFromLookup(norm, lookupRecords);
  const vector = relationVector(relations);
  const count = relationCount(relations);
  const seed = JSON.stringify({ v: "omi.wordnet.centroid.v0", lemma: norm, pos, vector, relations });
  const centroid = {
    v: "omi.wordnet.centroid.v0",
    lemma: norm,
    pos,
    synsetCount: Array.isArray(lookupRecords) ? lookupRecords.length : 0,
    relationSlots: WORDNET_RELATION_SLOTS,
    relationVector: vector,
    relationCount: count,
    metric: cidrMetric(128, count, minRelations),
    ipv6: toIPv6Centroid(seed),
    ipv4: toIPv4HostRoute(seed),
    hash32: fnv1a32(seed).toString(16).padStart(8, "0"),
    relations
  };
  return centroid;
}

export async function lookupWordNetCentroid(wordpos, token, options = {}) {
  const lemma = normalizeLemma(token.normal || token.token || token.value || token.raw);
  let records = [];
  if (wordpos && typeof wordpos.lookup === "function") {
    records = await wordpos.lookup(lemma);
  } else if (wordpos && typeof wordpos.lookupNoun === "function") {
    // Some WordPOS builds expose POS-specific lookup helpers.
    const calls = ["lookupNoun", "lookupVerb", "lookupAdjective", "lookupAdverb"]
      .filter((name) => typeof wordpos[name] === "function")
      .map((name) => wordpos[name](lemma).catch(() => []));
    records = (await Promise.all(calls)).flat();
  }
  return makeWordNetCentroid({ lemma, pos: token.pos, lookupRecords: records, ...options });
}

export async function enrichFeatureTokensWithWordNet(featureTokens, wordpos, options = {}) {
  const out = [];
  for (const ft of featureTokens) {
    const centroid = await lookupWordNetCentroid(wordpos, ft, options);
    out.push({ ...ft, wordnet: centroid });
  }
  return out;
}
