import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { UNIVERSAL_POS_TAGS } from "../src/pos-tags.js";
import { parseOmiDocument } from "../src/omi/omi-parser.js";
import { compileOmiFile, isNativeCharPlaneSafe } from "../src/omilog/omi-imo-compiler.js";
import {
  TANGENT_GENERATOR,
  ORIENTATION_GENERATOR,
  TEMPLATE_GENERATOR,
  composeRRGGBBAA,
  parseRRGGBBAA,
  encodePreBootAddress,
  parsePreBootAddress,
  generatePosSeeds,
  generateFeatureSeeds,
  generateWordNetPrologSeeds,
  generateRouterSeedDocuments,
  extractConsRRGGBBAALookups,
  validateMonotonicConsLookup,
  resolveProxySeedThroughCons
} from "../src/omilog/router-seeds.js";

async function readRepoFile(path) {
  return readFile(join(process.cwd(), path), "utf8");
}

test("composeRRGGBBAA and parseRRGGBBAA round-trip RGB body and AA byte", () => {
  const composed = composeRRGGBBAA("#ff0000", "25");
  assert.equal(composed.rrggbbaaHex, "ff000025");
  assert.equal(composed.rgbHex, "ff0000");
  assert.equal(composed.aa, 0x25);

  const parsed = parseRRGGBBAA(`0x${composed.rrggbbaaHex}`);
  assert.deepEqual(parsed, composed);
});

test("encodePreBootAddress emits valid eight-segment router addresses", () => {
  const address = encodePreBootAddress({
    rgb: "#010203",
    aaLow: 0x11,
    aaHigh: 0x04,
    flags: 0x20,
    generator: ORIENTATION_GENERATOR
  });
  assert.equal(address, "omi-0000-03bf-7c00-0102-0320-0411-039f-7eff/128");

  const parsed = parsePreBootAddress(address);
  assert.ok(parsed.invariant);
  assert.equal(parsed.rgbHex, "010203");
  assert.equal(parsed.aaLow, 0x11);
  assert.equal(parsed.aaHigh, 0x04);
  assert.equal(parsed.flags, 0x20);
  assert.equal(parsed.generator, ORIENTATION_GENERATOR);
});

test("POS seeds map AA low byte 0x01 through 0x11 in existing POS order", () => {
  const seeds = generatePosSeeds();
  assert.equal(seeds.length, UNIVERSAL_POS_TAGS.length);
  assert.equal(seeds.length, 17);
  assert.deepEqual(seeds.map((seed) => seed.label), UNIVERSAL_POS_TAGS);
  assert.deepEqual(seeds.map((seed) => seed.aaLow), UNIVERSAL_POS_TAGS.map((_, index) => index + 1));
  assert.ok(seeds.every((seed) => seed.aaHigh === 0x00));
  assert.ok(seeds.every((seed) => seed.generator === TANGENT_GENERATOR));
});

test("feature seeds route through AA high byte distinctly from POS low-byte attachments", () => {
  const seeds = generateFeatureSeeds();
  assert.ok(seeds.length > 0);
  assert.ok(seeds.every((seed) => seed.aaLow === 0x00));
  assert.deepEqual(seeds.map((seed) => seed.aaHigh), seeds.map((_, index) => index + 1));
  assert.ok(seeds.every((seed) => seed.attachment >= 0x0100));
  assert.ok(seeds.every((seed) => seed.generator === ORIENTATION_GENERATOR));
});

test("WordNet-Prolog seeds preserve synset centroid identity and bridge-only authority", () => {
  const seeds = generateWordNetPrologSeeds();
  assert.ok(seeds.length >= 3);
  assert.ok(seeds.every((seed) => seed.generator === TEMPLATE_GENERATOR));
  for (const seed of seeds) {
    assert.match(seed.details.centroidCanonical, /^synset:/);
    assert.match(seed.details.centroidHash32, /^[0-9a-f]{8}$/);
    assert.match(seed.details.centroidIpv6, /^2001:db8:/);
    assert.match(seed.authority, /centroid-authority-preserved/);
  }
});

test("generated vector documents parse and compile to native-safe .imo", async () => {
  const documents = generateRouterSeedDocuments();
  assert.deepEqual(Object.keys(documents).sort(), ["features.omi", "pl.omi", "pos.omi"]);

  for (const [file, text] of Object.entries(documents)) {
    const parsed = parseOmiDocument(text, { source: `vectors/${file}` });
    assert.equal(parsed.malformed.length, 0, `${file} should parse cleanly`);
    assert.ok(parsed.records.every((record) => record.keyword === "FACT"));
    assert.ok(parsed.records.every((record) => record.sourceBlock));

    const compiled = await compileOmiFile(text, { source: `vectors/${file}` });
    assert.ok(compiled.lines.length >= parsed.records.length);
    for (const line of compiled.lines) {
      assert.ok(isNativeCharPlaneSafe(line), `${file} compiled unsafe line: ${JSON.stringify(line)}`);
    }
  }
});

test("tracked vectors are generated under vectors/ and match generator output", async () => {
  const documents = generateRouterSeedDocuments();
  for (const [file, expected] of Object.entries(documents)) {
    const actual = await readRepoFile(`vectors/${file}`);
    assert.equal(actual, expected, `vectors/${file} should not drift`);
  }
});

test("CONS RRGGBBAA lookup records are monotonic by primary key", async () => {
  const cons = await readRepoFile("CONS.omi");
  const lookups = extractConsRRGGBBAALookups(cons);
  assert.ok(lookups.length >= 6);
  assert.deepEqual(lookups.map((entry) => entry.rrggbbaaHex), [
    "00000001",
    "00000008",
    "00000010",
    "01000000",
    "01000100",
    "02000008"
  ]);

  const result = validateMonotonicConsLookup(lookups);
  assert.equal(result.valid, true);
  assert.equal(result.violations.length, 0);
});

test("non-linear aliases live in CONS source blocks without reordering keys", async () => {
  const cons = await readRepoFile("CONS.omi");
  const lookups = extractConsRRGGBBAALookups(cons);
  assert.ok(lookups.every((entry) => /non-linear-aliases/.test(entry.raw)));
  assert.ok(lookups.some((entry) => /wordnet-synset/.test(entry.raw)));
  assert.equal(validateMonotonicConsLookup(lookups).valid, true);
});

test("proxy seeds resolve through CONS to upper-reader generators", async () => {
  const cons = await readRepoFile("CONS.omi");
  const noun = generatePosSeeds().find((seed) => seed.label === "NOUN");
  const tense = generateFeatureSeeds().find((seed) => seed.label === "Tense");
  const canvas = generateWordNetPrologSeeds().find((seed) => seed.label === "canvas");

  assert.equal(resolveProxySeedThroughCons(noun, cons).generator, TANGENT_GENERATOR);
  assert.equal(resolveProxySeedThroughCons(tense, cons).generator, ORIENTATION_GENERATOR);
  assert.equal(resolveProxySeedThroughCons(canvas, cons).generator, TEMPLATE_GENERATOR);
});
