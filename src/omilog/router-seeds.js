import { UNIVERSAL_POS_TAGS, POS_INDEX, posToChannel } from "../pos-tags.js";
import { makeWordNetCentroid } from "../wordnet/relation-space.js";
import { parseOmiDocument } from "../omi/omi-parser.js";

export const PRE_BOOT_ROOT = 0x7c00;
export const LOWER_STRUCTURAL_GENERATOR = 0x7c;
export const TANGENT_GENERATOR = 0x7d;
export const ORIENTATION_GENERATOR = 0x7e;
export const TEMPLATE_GENERATOR = 0x7f;

export const ROUTER_GENERATORS = Object.freeze({
  LOWER_STRUCTURAL: LOWER_STRUCTURAL_GENERATOR,
  TANGENT_READER: TANGENT_GENERATOR,
  ORIENTATION_LENS: ORIENTATION_GENERATOR,
  TEMPLATE_WORLD: TEMPLATE_GENERATOR
});

export const ROUTER_KIND_FLAGS = Object.freeze({
  POS: 0x10,
  FEATURE: 0x20,
  PROLOG: 0x30,
  CONS_LOOKUP: 0x40
});

export const UNIVERSAL_FEATURE_SEEDS = Object.freeze([
  "Mood",
  "Tense",
  "Person",
  "Number",
  "PronType",
  "Case",
  "Gender",
  "VerbForm"
]);

const PRE_BOOT_ADDRESS_RE = /^omi-((?:[0-9a-fA-F]{4}-){7}[0-9a-fA-F]{4})\/128$/;
const GENERATOR_VALUES = new Set(Object.values(ROUTER_GENERATORS));

function normalizeByte(value, label) {
  const n = normalizeInteger(value, label);
  if (n < 0 || n > 0xff) throw new RangeError(`${label} must fit in one byte`);
  return n;
}

function normalizeInteger(value, label) {
  let n = value;
  if (typeof n === "string") {
    const text = n.trim().replace(/^#/, "");
    n = text.startsWith("0x") || text.startsWith("0X")
      ? Number.parseInt(text.slice(2), 16)
      : Number.parseInt(text, 16);
  }
  if (!Number.isInteger(n)) throw new TypeError(`${label} must be an integer`);
  return n;
}

function normalizeRgb(value) {
  const n = normalizeInteger(value, "rgb");
  if (n < 0 || n > 0xffffff) throw new RangeError("rgb must fit in 24 bits");
  return n >>> 0;
}

function normalizeSeed32(value) {
  const n = normalizeInteger(value, "rrggbbaa");
  if (n < 0 || n > 0xffffffff) throw new RangeError("rrggbbaa must fit in 32 bits");
  return n >>> 0;
}

function normalizeGenerator(generator) {
  if (typeof generator === "string") {
    const key = generator.trim().toUpperCase();
    if (ROUTER_GENERATORS[key] !== undefined) return ROUTER_GENERATORS[key];
  }
  const n = normalizeInteger(generator, "generator");
  if (!GENERATOR_VALUES.has(n)) {
    throw new RangeError("generator must be one of 0x7c, 0x7d, 0x7e, or 0x7f");
  }
  return n;
}

function hex(value, width) {
  return (value >>> 0).toString(16).padStart(width, "0");
}

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function quote(value) {
  return JSON.stringify(String(value));
}

function generatorLabel(generator) {
  for (const [label, value] of Object.entries(ROUTER_GENERATORS)) {
    if (value === generator) return label.toLowerCase().replace(/_/g, "-");
  }
  return `0x${hex(generator, 2)}`;
}

export function composeRRGGBBAA(rgbOrFields, aa) {
  const fields = typeof rgbOrFields === "object" && rgbOrFields !== null
    ? rgbOrFields
    : { rgb: rgbOrFields, aa };
  const rgb = normalizeRgb(fields.rgb);
  const aaByte = normalizeByte(fields.aa ?? fields.aaLow ?? fields.attachment ?? 0, "aa");
  const seed32 = (((rgb & 0xffffff) << 8) | aaByte) >>> 0;
  return {
    seed32,
    rrggbbaa: seed32,
    rrggbbaaHex: hex(seed32, 8),
    rgb,
    rgbHex: hex(rgb, 6),
    aa: aaByte,
    aaHex: hex(aaByte, 2),
    display: `#${hex(rgb, 6)}`,
    aaDisplay: `0x${hex(aaByte, 2)}`
  };
}

export function parseRRGGBBAA(value) {
  const seed32 = normalizeSeed32(value);
  const rgb = (seed32 >>> 8) & 0xffffff;
  const aa = seed32 & 0xff;
  return composeRRGGBBAA({ rgb, aa });
}

export function encodePreBootAddress(fields = {}) {
  const seed = fields.rrggbbaa ?? fields.seed32;
  const parsed = seed === undefined ? null : parseRRGGBBAA(seed);
  const rgb = normalizeRgb(fields.rgb ?? parsed?.rgb ?? 0);
  const aaLow = normalizeByte(fields.aaLow ?? fields.aa ?? parsed?.aa ?? 0, "aaLow");
  const highAttachment = normalizeByte(fields.aaHigh ?? fields.featureByte ?? 0, "aaHigh");
  const attachment = fields.attachment === undefined
    ? ((highAttachment << 8) | aaLow)
    : normalizeInteger(fields.attachment, "attachment");
  if (attachment < 0 || attachment > 0xffff) {
    throw new RangeError("attachment must fit in 16 bits");
  }
  const kindFlag = normalizeByte(fields.flags ?? 0, "flags");
  const generator = normalizeGenerator(fields.generator ?? TANGENT_GENERATOR);
  const payload = (rgb >>> 8) & 0xffff;
  const flags = ((rgb & 0xff) << 8) | kindFlag;
  const segments = [
    0x0000,
    0x03bf,
    PRE_BOOT_ROOT,
    payload,
    flags,
    attachment,
    0x039f,
    (generator << 8) | 0xff
  ];
  return `omi-${segments.map((segment) => hex(segment, 4)).join("-")}/128`;
}

export function parsePreBootAddress(address) {
  const match = String(address || "").trim().match(PRE_BOOT_ADDRESS_RE);
  if (!match) return null;
  const segments = match[1].split("-").map((segment) => Number.parseInt(segment, 16));
  const payload = segments[3];
  const flagsSegment = segments[4];
  const attachment = segments[5];
  const generatorSegment = segments[7];
  const generator = generatorSegment >>> 8;
  const rgb = ((payload << 8) | (flagsSegment >>> 8)) >>> 0;
  const aa = attachment & 0xff;
  return {
    address: String(address).trim(),
    prefixBits: 128,
    segments,
    payload,
    flags: flagsSegment & 0xff,
    attachment,
    aa,
    aaLow: aa,
    aaHigh: attachment >>> 8,
    rgb,
    rgbHex: hex(rgb, 6),
    rrggbbaa: (((rgb & 0xffffff) << 8) | aa) >>> 0,
    rrggbbaaHex: hex((((rgb & 0xffffff) << 8) | aa) >>> 0, 8),
    generator,
    generatorHex: hex(generator, 2),
    invariant:
      segments[0] === 0x0000 &&
      segments[1] === 0x03bf &&
      segments[2] === PRE_BOOT_ROOT &&
      segments[6] === 0x039f &&
      (generatorSegment & 0xff) === 0xff &&
      GENERATOR_VALUES.has(generator)
  };
}

function makeRouterSeed({
  kind,
  name,
  label,
  rgb,
  aaLow = 0,
  aaHigh = 0,
  flags,
  generator,
  source,
  authority,
  route,
  details = {}
}) {
  const seed = composeRRGGBBAA({ rgb, aa: aaLow });
  const attachment = ((normalizeByte(aaHigh, "aaHigh") << 8) | normalizeByte(aaLow, "aaLow")) & 0xffff;
  const address = encodePreBootAddress({
    rgb: seed.rgb,
    aaLow,
    aaHigh,
    attachment,
    flags,
    generator
  });
  return Object.freeze({
    kind,
    name,
    label,
    source,
    authority,
    route,
    generator: normalizeGenerator(generator),
    generatorHex: hex(normalizeGenerator(generator), 2),
    attachment,
    aaLow,
    aaHigh,
    flags,
    address,
    ...seed,
    details: Object.freeze({ ...details })
  });
}

export function generatePosSeeds() {
  return UNIVERSAL_POS_TAGS.map((tag, index) => makeRouterSeed({
    kind: "pos",
    name: `pos-seed-${tag.toLowerCase()}`,
    label: tag,
    rgb: 0x000000,
    aaLow: index + 1,
    flags: ROUTER_KIND_FLAGS.POS,
    generator: TANGENT_GENERATOR,
    source: "src/pos-tags.js",
    authority: "proxy-seed-through-cons",
    route: "aa-low-byte",
    details: {
      pos: tag,
      posIndex: index,
      channel: posToChannel(tag),
      rule: "0xCC"
    }
  }));
}

export function generateFeatureSeeds() {
  return UNIVERSAL_FEATURE_SEEDS.map((feature, index) => makeRouterSeed({
    kind: "feature",
    name: `feature-seed-${slug(feature)}`,
    label: feature,
    rgb: 0x010000 + index,
    aaLow: 0x00,
    aaHigh: index + 1,
    flags: ROUTER_KIND_FLAGS.FEATURE,
    generator: ORIENTATION_GENERATOR,
    source: "docs/10-declaration/omi-object-model.manifest.json",
    authority: "proxy-seed-through-cons",
    route: "aa-high-byte",
    details: {
      feature,
      featureIndex: index,
      rule: "0xCD"
    }
  }));
}

const WORDNET_PROLOG_BRIDGE = Object.freeze([
  {
    lemma: "canvas",
    pos: "NOUN",
    operator: "s",
    lookupRecords: [{
      lemma: "canvas",
      synonyms: ["surface", "fabric"],
      relations: [
        { pointerSymbol: "@", target: "artifact" },
        { pointerSymbol: "~", target: "json_canvas" },
        { pointerSymbol: "%m", target: "pixel" },
        { pointerSymbol: "#m", target: "document" },
        { pointerSymbol: "!", target: "void" },
        { pointerSymbol: ";c", target: "visualization" }
      ]
    }]
  },
  {
    lemma: "feature",
    pos: "NOUN",
    operator: "hyp",
    lookupRecords: [{
      lemma: "feature",
      synonyms: ["attribute", "property"],
      relations: [
        { pointerSymbol: "@", target: "abstraction" },
        { pointerSymbol: "~", target: "grammatical_feature" },
        { pointerSymbol: "%m", target: "value" },
        { pointerSymbol: "#m", target: "schema" },
        { pointerSymbol: "!", target: "absence" },
        { pointerSymbol: ";c", target: "linguistics" }
      ]
    }]
  },
  {
    lemma: "synset",
    pos: "NOUN",
    operator: "g",
    lookupRecords: [{
      lemma: "synset",
      synonyms: ["sense_key", "semantic_set"],
      relations: [
        { pointerSymbol: "@", target: "wordnet_record" },
        { pointerSymbol: "~", target: "centroid_cell" },
        { pointerSymbol: "%m", target: "lemma" },
        { pointerSymbol: "#m", target: "lexicon" },
        { pointerSymbol: "!", target: "homograph" },
        { pointerSymbol: ";c", target: "wordnet" }
      ]
    }]
  }
]);

export function generateWordNetPrologSeeds() {
  const nounAa = (POS_INDEX.NOUN ?? 7) + 1;
  return WORDNET_PROLOG_BRIDGE.map((entry, index) => {
    const centroid = makeWordNetCentroid(entry);
    return makeRouterSeed({
      kind: "prolog",
      name: `prolog-seed-${slug(entry.lemma)}`,
      label: entry.lemma,
      rgb: 0x020000 + index,
      aaLow: nounAa,
      flags: ROUTER_KIND_FLAGS.PROLOG,
      generator: TEMPLATE_GENERATOR,
      source: "src/wordnet/relation-space.js",
      authority: "bridge-only-wordnet-centroid-authority-preserved",
      route: "wordnet-prolog-bridge",
      details: {
        lemma: entry.lemma,
        pos: entry.pos,
        operator: entry.operator,
        centroidCanonical: centroid.cells.canonical,
        centroidHash32: centroid.hash32,
        centroidIpv4: centroid.ipv4,
        centroidIpv6: centroid.ipv6,
        relationCount: centroid.relationCount,
        stable: centroid.metric.stable,
        rule: "0xCE"
      }
    });
  });
}

export function generateRouterSeeds() {
  return Object.freeze([
    ...generatePosSeeds(),
    ...generateFeatureSeeds(),
    ...generateWordNetPrologSeeds()
  ]);
}

export function generateConsLookupSeeds() {
  const pos = generatePosSeeds();
  const features = generateFeatureSeeds();
  const prolog = generateWordNetPrologSeeds();
  return Object.freeze([
    pos.find((seed) => seed.label === "ADJ"),
    pos.find((seed) => seed.label === "NOUN"),
    pos.find((seed) => seed.label === "VERB"),
    features.find((seed) => seed.label === "Mood"),
    features.find((seed) => seed.label === "Tense"),
    prolog.find((seed) => seed.label === "canvas")
  ].filter(Boolean).sort((a, b) => a.rrggbbaa - b.rrggbbaa));
}

export function emitRouterSeedOExpression(seed) {
  const details = seed.details || {};
  const detailLines = Object.entries(details)
    .map(([key, value]) => `       (${slug(key) || key} . ${typeof value === "string" ? quote(value) : String(value)})`)
    .join("\n");
  return [
    "omi-",
    "  (",
    `    (seed-kind . ${seed.kind})`,
    `    (name . ${seed.name})`,
    `    (label . ${quote(seed.label)})`,
    `    (rrggbbaa . 0x${seed.rrggbbaaHex})`,
    `    (rgb . #${seed.rgbHex})`,
    `    (aa-low-byte . 0x${hex(seed.aaLow, 2)})`,
    `    (aa-high-byte . 0x${hex(seed.aaHigh, 2)})`,
    `    (attachment . 0x${hex(seed.attachment, 4)})`,
    `    (cidr-pointer . ${seed.address})`,
    `    (upper-reader-generator . 0x${seed.generatorHex})`,
    `    (generator-plane . ${generatorLabel(seed.generator)})`,
    `    (route . ${seed.route})`,
    `    (source . ${seed.source})`,
    `    (authority . ${seed.authority})`,
    "    (boundary . (proxy-seed-not-root-authority cons-reduction-required))",
    detailLines ? `    (details .\n      (\n${detailLines}\n      ))` : "    (details . nil)",
    "  )",
    "-imo"
  ].join("\n");
}

export function emitRouterSeedRecord(seed) {
  return `${seed.address} FACT ${seed.name}\n\n${emitRouterSeedOExpression(seed)}`;
}

export function compileRouterSeedsToOmi(seeds, { title = "OMI ROUTER SEEDS" } = {}) {
  const records = seeds.map(emitRouterSeedRecord).join("\n\n");
  return [
    `# ${title}`,
    "# Generated by scripts/generate-router-seeds.js.",
    "# These vector files are static proxy seed configs.",
    "# They reduce through CONS. They are not canonical root authority files.",
    "",
    records,
    ""
  ].join("\n");
}

export function generateRouterSeedDocuments() {
  return Object.freeze({
    "pos.omi": compileRouterSeedsToOmi(generatePosSeeds(), {
      title: "OMI POS ROUTER SEEDS"
    }),
    "features.omi": compileRouterSeedsToOmi(generateFeatureSeeds(), {
      title: "OMI FEATURE ROUTER SEEDS"
    }),
    "pl.omi": compileRouterSeedsToOmi(generateWordNetPrologSeeds(), {
      title: "OMI WORDNET PROLOG ROUTER SEEDS"
    })
  });
}

export function extractConsRRGGBBAALookups(consSource) {
  const records = Array.isArray(consSource)
    ? consSource
    : parseOmiDocument(consSource, { source: "CONS.omi" }).records;
  return records
    .map((record, index) => {
      const raw = record.sourceBlock?.raw || "";
      const rrggbbaaMatch = raw.match(/\(rrggbbaa\s+\.\s+0x([0-9a-fA-F]{8})\)/);
      if (!rrggbbaaMatch) return null;
      const generatorMatch = raw.match(/\(upper-reader-generator\s+\.\s+0x([0-9a-fA-F]{2})\)/);
      const parsedAddress = parsePreBootAddress(record.address);
      const generator = generatorMatch
        ? Number.parseInt(generatorMatch[1], 16)
        : parsedAddress?.generator ?? null;
      return {
        index,
        record,
        address: record.address,
        assignment: record.assignment,
        rrggbbaa: Number.parseInt(rrggbbaaMatch[1], 16) >>> 0,
        rrggbbaaHex: rrggbbaaMatch[1].toLowerCase(),
        generator,
        generatorHex: generator === null ? null : hex(generator, 2),
        raw
      };
    })
    .filter(Boolean);
}

export function validateMonotonicConsLookup(consSourceOrLookups) {
  const lookups = Array.isArray(consSourceOrLookups)
    ? consSourceOrLookups
    : extractConsRRGGBBAALookups(consSourceOrLookups);
  const violations = [];
  for (let i = 1; i < lookups.length; i++) {
    if (lookups[i].rrggbbaa < lookups[i - 1].rrggbbaa) {
      violations.push({
        previous: lookups[i - 1],
        current: lookups[i],
        reason: "rrggbbaa keys must be ascending in file order"
      });
    }
  }
  return {
    valid: violations.length === 0,
    count: lookups.length,
    lookups,
    violations
  };
}

export function resolveProxySeedThroughCons(seedOrKey, consSourceOrLookups) {
  const rrggbbaa = typeof seedOrKey === "object" && seedOrKey !== null
    ? normalizeSeed32(seedOrKey.rrggbbaa ?? seedOrKey.seed32)
    : normalizeSeed32(seedOrKey);
  const lookups = Array.isArray(consSourceOrLookups)
    ? consSourceOrLookups
    : extractConsRRGGBBAALookups(consSourceOrLookups);
  const lookup = lookups.find((entry) => entry.rrggbbaa === rrggbbaa) || null;
  return {
    resolved: Boolean(lookup),
    rrggbbaa,
    rrggbbaaHex: hex(rrggbbaa, 8),
    generator: lookup?.generator ?? null,
    generatorHex: lookup?.generatorHex ?? null,
    lookup
  };
}
