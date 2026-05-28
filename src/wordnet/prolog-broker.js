export const PROLOG_WORDNET_OPERATORS = Object.freeze([
  "s",
  "sk",
  "g",
  "syntax",
  "hyp",
  "ins",
  "ent",
  "sim",
  "mm",
  "ms",
  "mp",
  "der",
  "cls",
  "cs",
  "vgp",
  "at",
  "ant",
  "sa",
  "ppl",
  "per",
  "fr"
]);

export const PROLOG_RELATION_FILES = Object.freeze([
  "hyp",
  "ins",
  "ent",
  "sim",
  "mm",
  "ms",
  "mp",
  "der",
  "cls",
  "cs",
  "vgp",
  "at",
  "ant",
  "sa",
  "ppl",
  "per",
  "fr"
]);

const DEFAULT_DICT_PATH = "vendor/prolog";
const OPERATOR_SET = new Set(PROLOG_WORDNET_OPERATORS);
const POS_MAP = Object.freeze({ n: "NOUN", v: "VERB", a: "ADJ", s: "ADJ", r: "ADV" });
const POINTER_SYMBOLS = Object.freeze({
  hyp: "@",
  ins: "@i",
  ent: "*",
  sim: "&",
  ant: "!",
  der: "+",
  mm: "%m",
  ms: "%s",
  mp: "%p",
  cls: ";c",
  cs: ";u",
  vgp: "=",
  at: "=",
  sa: "&",
  ppl: "&",
  per: ";r",
  fr: ";u"
});

export async function createPrologWordNetBroker(options = {}) {
  const broker = new PrologWordNetBroker(options);
  await broker.load();
  return broker;
}

export class PrologWordNetBroker {
  constructor({
    dictPath = DEFAULT_DICT_PATH,
    files,
    fetcher = globalThis.fetch?.bind(globalThis),
    operators = PROLOG_RELATION_FILES
  } = {}) {
    this.dictPath = dictPath;
    this.files = files || {};
    this.fetcher = fetcher;
    this.operators = [...new Set(operators.filter((op) => OPERATOR_SET.has(op) && op !== "s" && op !== "g" && op !== "sk" && op !== "syntax"))];
    this.synsets = new Map();
    this.glosses = new Map();
    this.relations = new Map();
    this.lemmaIndex = new Map();
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return this;
    this.loadSynsets(await this.readFactFile("s"));
    this.loadGlosses(await this.readFactFile("g"));
    for (const operator of this.operators) {
      const text = await this.readFactFile(operator).catch(() => "");
      this.loadRelation(operator, text);
    }
    this.loaded = true;
    return this;
  }

  async readFactFile(operator) {
    if (!OPERATOR_SET.has(operator)) throw new TypeError(`Unsupported WordNet Prolog operator: ${operator}`);
    if (this.files[operator]) return this.files[operator];
    const filename = operator === "syntax" ? "wn_syntax.pl" : `wn_${operator}.pl`;
    if (typeof window === "undefined") {
      return readNodeTextFile(this.dictPath, filename);
    }
    if (!this.fetcher) throw new TypeError("No fetch implementation is available for browser Prolog WordNet loading");
    const base = this.dictPath.startsWith("/") ? this.dictPath : `/${this.dictPath}`;
    const response = await this.fetcher(`${base}/${filename}`);
    if (!response.ok) throw new Error(`Unable to fetch WordNet Prolog file ${filename}: ${response.status}`);
    return response.text();
  }

  loadSynsets(text) {
    for (const fact of parsePrologFacts(text)) {
      if (fact.name !== "s" || fact.args.length < 4) continue;
      const id = normalizeSynsetId(fact.args[0]);
      const word = normalizeWord(fact.args[2]);
      const pos = String(fact.args[3] || "").toLowerCase();
      const sense = {
        id,
        senseNumber: Number(fact.args[1]) || 0,
        word,
        lemma: word,
        pos,
        upos: POS_MAP[pos] || "X",
        tagCount: Number(fact.args[4]) || 0
      };
      if (!this.synsets.has(id)) this.synsets.set(id, { id, pos, upos: sense.upos, words: [], senses: [] });
      const synset = this.synsets.get(id);
      synset.senses.push(sense);
      if (!synset.words.includes(word)) synset.words.push(word);
      addIndex(this.lemmaIndex, word, id);
      addIndex(this.lemmaIndex, word.replaceAll(" ", "_"), id);
    }
  }

  loadGlosses(text) {
    for (const fact of parsePrologFacts(text)) {
      if (fact.name !== "g" || fact.args.length < 2) continue;
      this.glosses.set(normalizeSynsetId(fact.args[0]), normalizeWord(fact.args[1]));
    }
  }

  loadRelation(operator, text) {
    if (!OPERATOR_SET.has(operator)) throw new TypeError(`Unsupported WordNet Prolog operator: ${operator}`);
    for (const fact of parsePrologFacts(text)) {
      if (fact.name !== operator || fact.args.length < 2) continue;
      if (!isSynsetId(fact.args[0]) || !isSynsetId(fact.args[1])) continue;
      const source = normalizeSynsetId(fact.args[0]);
      const target = normalizeSynsetId(fact.args[1]);
      addRelation(this.relations, operator, source, target);
    }
  }

  lookupLemma(lemma) {
    const key = normalizeWord(lemma).replaceAll("_", " ");
    const ids = [...new Set([...(this.lemmaIndex.get(key) || []), ...(this.lemmaIndex.get(key.replaceAll(" ", "_")) || [])])];
    return ids.map((id) => this.synsetDetails(id)).filter(Boolean);
  }

  queryRelation(operator, sourceId) {
    if (!OPERATOR_SET.has(operator)) throw new TypeError(`Unsupported WordNet Prolog operator: ${operator}`);
    const source = normalizeSynsetId(sourceId);
    if (operator === "s") return this.synsetDetails(source)?.senses || [];
    if (operator === "g") return this.glosses.get(source) || "";
    return [...(this.relations.get(operator)?.get(source) || [])].map((targetId) => this.synsetDetails(targetId)).filter(Boolean);
  }

  toWordPosRecords(lemma) {
    return this.lookupLemma(lemma).map((synset) => {
      const ptrs = [];
      for (const operator of this.operators) {
        for (const target of this.queryRelation(operator, synset.id)) {
          ptrs.push({
            operator,
            pointerSymbol: POINTER_SYMBOLS[operator] || operator,
            synsetOffset: target.id,
            words: target.words,
            pos: target.pos
          });
        }
      }
      return {
        lemma: synset.words[0] || normalizeWord(lemma),
        word: synset.words[0] || normalizeWord(lemma),
        synonyms: synset.words,
        gloss: synset.gloss,
        synsetOffset: synset.id,
        pos: synset.pos,
        ptrs
      };
    });
  }

  async lookup(lemma) {
    return this.toWordPosRecords(lemma);
  }

  synsetDetails(id) {
    const synset = this.synsets.get(normalizeSynsetId(id));
    if (!synset) return null;
    return {
      id: synset.id,
      pos: synset.pos,
      upos: synset.upos,
      words: [...synset.words],
      senses: [...synset.senses],
      gloss: this.glosses.get(synset.id) || ""
    };
  }
}

async function readNodeTextFile(dictPath, filename) {
  const nodeImport = new Function("specifier", "return import(specifier)");
  const [{ readFile }, { join }] = await Promise.all([
    nodeImport("node:fs/promises"),
    nodeImport("node:path")
  ]);
  return readFile(join(dictPath, filename), "utf8");
}

export function parsePrologFact(line) {
  const value = String(line || "").trim();
  if (!value || value.startsWith("%")) return null;
  const match = value.match(/^([a-z_]+)\((.*)\)\.$/i);
  if (!match) return null;
  return {
    name: match[1],
    args: splitPrologArgs(match[2]).map(unquotePrologAtom)
  };
}

export function parsePrologFacts(text) {
  const facts = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const fact = parsePrologFact(line);
    if (fact) facts.push(fact);
  }
  return facts;
}

function splitPrologArgs(value) {
  const args = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === "'") {
      current += char;
      if (quoted && value[i + 1] === "'") {
        current += value[++i];
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      args.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current) args.push(current.trim());
  return args;
}

function unquotePrologAtom(value) {
  const text = String(value || "").trim();
  if (text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1).replaceAll("''", "'");
  return text;
}

function normalizeWord(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSynsetId(value) {
  const text = String(value || "").trim();
  if (!isSynsetId(text)) throw new TypeError(`Invalid WordNet synset id: ${value}`);
  return text;
}

function isSynsetId(value) {
  return /^[1-4]\d{8}$/.test(String(value || "").trim());
}

function addIndex(map, key, value) {
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  const list = map.get(key);
  if (!list.includes(value)) list.push(value);
}

function addRelation(map, operator, source, target) {
  if (!map.has(operator)) map.set(operator, new Map());
  const bySource = map.get(operator);
  if (!bySource.has(source)) bySource.set(source, []);
  const list = bySource.get(source);
  if (!list.includes(target)) list.push(target);
}
