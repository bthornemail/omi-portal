export const UNIVERSAL_POS_TAGS = Object.freeze([
  "ADJ", "ADP", "ADV", "AUX", "CCONJ", "DET", "INTJ", "NOUN", "NUM",
  "PART", "PRON", "PROPN", "PUNCT", "SCONJ", "SYM", "VERB", "X"
]);

export const POS_INDEX = Object.freeze(
  Object.fromEntries(UNIVERSAL_POS_TAGS.map((tag, index) => [tag, index]))
);

// OMI chiral channel projection. This deliberately maps linguistic role
// to control-plane role, not to human-readable meaning.
export const POS_TO_CHANNEL = Object.freeze({
  NOUN: "US", PROPN: "US", PRON: "US", NUM: "US", X: "US",
  VERB: "RS", AUX: "RS", ADV: "RS", ADP: "RS", SCONJ: "RS", CCONJ: "RS", PART: "RS",
  ADJ: "GS", DET: "GS", INTJ: "GS",
  PUNCT: "FS", SYM: "FS"
});

export const CHANNELS = Object.freeze(["FS", "GS", "RS", "US"]);

export const CHANNEL_META = Object.freeze({
  FS: { code: "0x1C", nodeType: "file",  ipv4: "127.0.0.1/32", role: "file/BLOB egress" },
  GS: { code: "0x1D", nodeType: "group", ipv4: "127.0.0.2/32", role: "group/context centroid" },
  RS: { code: "0x1E", nodeType: "link",  ipv4: "127.0.0.3/32", role: "link/routing edge" },
  US: { code: "0x1F", nodeType: "text",  ipv4: "127.0.0.4/32", role: "text/base64 ingress" }
});

export function normalizePosTag(tag) {
  const upper = String(tag || "X").toUpperCase();
  return POS_INDEX[upper] === undefined ? "X" : upper;
}

export function posToChannel(tag) {
  return POS_TO_CHANNEL[normalizePosTag(tag)] || "US";
}
