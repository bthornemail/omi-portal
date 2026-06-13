import { CANONICAL_ORDER, loadNarrativeFromMap } from "../narrative/narrative-base.js";

export const NARRATIVE_SERIES_ROOT = "vendor/narrative-series";

export function loadNarrativeSeries(contentMap) {
  return loadNarrativeFromMap(contentMap);
}

export function createSeriesContentMap(rawTexts) {
  const map = {};
  for (let i = 0; i < CANONICAL_ORDER.length; i++) {
    const docId = CANONICAL_ORDER[i];
    if (rawTexts[i] !== undefined && rawTexts[i] !== null) {
      map[docId] = rawTexts[i];
    }
  }
  return map;
}

export function getPhaseEmoji(phase) {
  const map = {
    prelude: "\u{1F30C}",
    article: "\u{1F4DC}",
    aside: "\u{1F3AD}",
    epilogue: "\u{1F54A}\uFE0F",
    unknown: "\u{2753}"
  };
  return map[phase] || map.unknown;
}

export function getPhaseColor(phase) {
  const map = {
    prelude: "#5cf0ff",
    article: "#c09dff",
    aside: "#ffdd88",
    epilogue: "#8bffb5"
  };
  return map[phase] || "#888";
}

export const MOTIF_KEYWORDS = {
  Gate: ["gate", "entrance", "passage", "door", "city gate"],
  Logos: ["logos", "word", "meaning", "the word"],
  Number: ["number", "measure", "idol", "count", "rank", "comparison"],
  Covenant: ["covenant", "boundary", "promise", "not be crossed"],
  Beast: ["beast", "mark", "comparison"],
  Watcher: ["watcher", "scribe", "witness", "metatron"],
  Law: ["law", "solon", "statute", "justice"],
  Wisdom: ["wisdom", "solomon", "discern", "judgment"],
  Tribe: ["tribe", "asabiyyah", "asabiyah", "cohesion", "belonging"]
};

export function extractMotifs(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = [];
  for (const [motif, keywords] of Object.entries(MOTIF_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) found.push(motif);
  }
  return found;
}
