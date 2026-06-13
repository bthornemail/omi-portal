const Q0 = Object.freeze([
  [null,      1,          2,        3,       4,        5],
  [1,    "ADJ",     "ADV",   "INTJ",   "NOUN",  "PROPN"],
  [2,    "VERB",    "ADP",    "AUX",   "CCONJ",   "DET"],
  [3,    "NUM",    "PART",   "PRON",   "SCONJ", "PUNCT"],
  [4,    "SYM",       "X",   "NULL",    "ACK", "BREAK"],
  [5,  "SOURCE", "NOTATE",   "READ", "RECEIPT", "WILD"],
]);

const Q1 = Object.freeze([
  [null,      1,          2,       3,        4,       5],
  [1,  "PronType", "NumType",   "Poss",  "Reflex",  "Other"],
  [2,     "Abbr",   "Typo", "Foreign",  "ExtPos", "Clusivity"],
  [3,   "Lexeme",  "Sense",  "Synset",   "Gloss",   "Lemma"],
  [4,    "Motif",  "Sigil", "Article", "Passage", "Location"],
  [5,   "Puzzle",  "Route",     "Key",    "Hint",    "Lock"],
]);

const Q2 = Object.freeze([
  [null,       1,         2,          3,        4,       5],
  [1,   "Gender",  "Animacy", "NounClass",  "Number",   "Case"],
  [2, "Definite",  "Deixis", "DeixisRef",   "Degree", "Polite"],
  [3, "VerbForm",    "Mood",     "Tense",   "Aspect",  "Voice"],
  [4, "Evident", "Polarity",   "Person",   "Agent", "Patient"],
  [5,     "Time",   "Phase",      "Step",   "State", "Change"],
]);

const Q3 = Object.freeze([
  [null,      1,       2,      3,       4,       5],
  [1,      "s",     "sk",     "g", "syntax",  "sense"],
  [2,    "hyp",    "ins",   "ent",    "sim",    "mm"],
  [3,    "hol",    "mer",   "ant",    "der",   "cls"],
  [4,  "cause",   "also", "group", "domain", "frame"],
  [5,  "proof", "receipt", "accept", "reject", "replay"],
]);

const Q_CELLS = Object.freeze([null, Q0, Q1, Q2, Q3]);
const Q_NAMES = Object.freeze([null, "Q0", "Q1", "Q2", "Q3"]);

const TAG_TO_Q = new Map();
const Q_TO_TAG = new Map();

function buildIndex() {
  for (let q = 1; q <= 4; q++) {
    const tablet = Q_CELLS[q];
    if (!tablet) continue;
    for (let r = 1; r <= 5; r++) {
      for (let c = 1; c <= 5; c++) {
        const tag = tablet[r][c];
        if (tag == null) continue;
        const qcell = { q, row: r, col: c, tablet: Q_NAMES[q] };
        TAG_TO_Q.set(tag, qcell);
        const key = `${Q_NAMES[q]}.${r}.${c}`;
        Q_TO_TAG.set(key, tag);
        Q_TO_TAG.set(`${q}.${r}.${c}`, tag);
      }
    }
  }
}
buildIndex();

export function tagToQCell(tag) {
  return TAG_TO_Q.get(tag) || null;
}

export function qCellToTag(q, row, col) {
  if (q < 1 || q > 4) return null;
  const tablet = Q_CELLS[q];
  if (!tablet) return null;
  if (row < 1 || row > 5 || col < 1 || col > 5) return null;
  return tablet[row][col] || null;
}

export function encodeTag(tag) {
  const qcell = tagToQCell(tag);
  if (!qcell) return null;
  return (qcell.q << 8) | ((qcell.row & 0x7) << 4) | (qcell.col & 0xF);
}

export function decodeTag(code) {
  if (code == null || code < 0 || code > 0x7FF) return null;
  const q = (code >> 8) & 0x7;
  const row = (code >> 4) & 0x7;
  const col = code & 0xF;
  if (q < 1 || q > 4) return null;
  if (row < 1 || row > 5 || col < 1 || col > 5) return null;
  return qCellToTag(q, row, col);
}

export function formatQCell(q, row, col) {
  return `${Q_NAMES[q] || "Q?"}.${row}.${col}`;
}

export const TABLETS = Object.freeze({ Q0, Q1, Q2, Q3 });
