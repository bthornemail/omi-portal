import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { OmiAxiomaticKernel } from "../src/omi/axiomatic-kernel.js";
import { OmiAxiomaticRulesCompiler } from "../src/omi/rules-compiler.js";
import { parseOmiClause, parseOmiDocument } from "../src/omi/omi-parser.js";
import {
  KARNAUGH_BIT_ORDER,
  W6,
  W8,
  W14,
  carryForwardGnomon,
  karnaughMap,
  wittgensteinOperator
} from "../src/omi/truth-combinators.js";

const ROOT_OMI_FILES = Object.freeze([
  "RULES.omi",
  "FACTS.omi",
  "CLOSURES.omi",
  "COMBINATORS.omi",
  "CONS.omi"
]);

async function readRepoFile(path) {
  return readFile(join(process.cwd(), path), "utf8");
}

test("OMI parser parses existing RULES and FACTS one-line declarations", async () => {
  const rules = parseOmiDocument(await readRepoFile("RULES.omi"), { source: "RULES.omi" });
  const facts = parseOmiDocument(await readRepoFile("FACTS.omi"), { source: "FACTS.omi" });

  assert.equal(rules.malformed.length, 0);
  assert.equal(facts.malformed.length, 0);
  assert.ok(rules.records.some((record) => record.keyword === "MUST" && record.assignment === "central-inversion-mirror"));
  assert.ok(facts.records.some((record) => record.keyword === "FACT" && record.assignment === "universal-pos-NOUN"));
});

test("OMI parser preserves /96 suffix clauses and EQUALS right-hand addresses", () => {
  const record = parseOmiClause(
    "omi-0000-0000-0000-0000-0000-0000-0000-0000/96/1-2 EQUALS omi-0000-0000-0000-0000-0000-0000-0000-0000/96/2-1"
  );

  assert.equal(record.keyword, "EQUALS");
  assert.equal(record.prefixBits, 96);
  assert.equal(record.suffix, "1-2");
  assert.equal(record.rhs, "omi-0000-0000-0000-0000-0000-0000-0000-0000/96/2-1");
  assert.deepEqual(record.segmentHex, ["0000", "0000", "0000", "0000", "0000", "0000", "0000", "0000"]);
});

test("OMI parser preserves omi-/-imo source blocks for CLOSE, COMBINE, and CONS records", async () => {
  const closures = parseOmiDocument(await readRepoFile("CLOSURES.omi"), { source: "CLOSURES.omi" });
  const combinators = parseOmiDocument(await readRepoFile("COMBINATORS.omi"), { source: "COMBINATORS.omi" });
  const cons = parseOmiDocument(await readRepoFile("CONS.omi"), { source: "CONS.omi" });

  const nonCollapse = closures.records.find((record) => record.assignment === "q-frame-q-xy-non-collapse-boundary");
  assert.equal(nonCollapse.keyword, "CLOSE");
  assert.ok(nonCollapse.sourceBlock);
  assert.equal(nonCollapse.sourceBlock.opener, "omi-");
  assert.equal(nonCollapse.sourceBlock.closer, "-imo");
  assert.match(nonCollapse.sourceBlock.raw, /Q_frame\(S\) validates/);
  assert.match(nonCollapse.sourceBlock.raw, /validate-first/);

  const carry = combinators.records.find((record) => record.assignment === "carry-forward-gnomon");
  assert.equal(carry.keyword, "COMBINE");
  assert.ok(carry.sourceBlock);
  assert.match(carry.sourceBlock.raw, /W6 \. XOR/);
  assert.match(carry.sourceBlock.raw, /carry/);

  const karnaugh = combinators.records.find((record) => record.assignment === "karnaugh-gnomon-map");
  assert.ok(karnaugh.sourceBlock);
  assert.match(karnaugh.sourceBlock.raw, /bit3/);

  const mnemonic = cons.records.find((record) => record.assignment === "omi-palindromic-mnemonic-token");
  assert.equal(mnemonic.keyword, "CONS");
  assert.ok(mnemonic.sourceBlock);
  assert.match(mnemonic.sourceBlock.raw, /omi---imo/);
  assert.match(mnemonic.sourceBlock.raw, /hyphen-count-replaces-frame-validation/);

  const alist = cons.records.find((record) => record.assignment === "dot-alist-texture-carrier");
  assert.ok(alist.sourceBlock);
  assert.match(alist.sourceBlock.raw, /texture\.barcode-ink/);
});

test("All five root OMI declaration files parse with zero malformed records", async () => {
  for (const file of ROOT_OMI_FILES) {
    const parsed = parseOmiDocument(await readRepoFile(file), { source: file });
    assert.equal(parsed.malformed.length, 0, `${file} should not contain malformed OMI declarations`);
    assert.ok(parsed.records.length > 0, `${file} should expose parseable records`);
  }
});

test("Axiomatic kernel remains registry-compatible while loading new declaration records", async () => {
  const kernel = new OmiAxiomaticKernel();
  await kernel.loadAxiomaticFile("RULES.omi", kernel.rulesRegistry);
  await kernel.loadAxiomaticFile("FACTS.omi", kernel.factsRegistry);

  assert.equal(
    kernel.rulesRegistry.get("omi-0000-0000-5a3c-0000-0000-0000-0000-0000/48").assignment,
    "central-inversion-mirror"
  );
  assert.equal(
    kernel.factsRegistry.get("omi-0000-0000-0000-0001-0000-0000-0000-0000/48").assignment,
    "universal-pos-NOUN"
  );

  const metadataRegistry = new Map();
  await kernel.loadAxiomaticFile("CLOSURES.omi", metadataRegistry);
  await kernel.loadAxiomaticFile("COMBINATORS.omi", metadataRegistry);
  await kernel.loadAxiomaticFile("CONS.omi", metadataRegistry);

  const consRecord = [...metadataRegistry.values()].find((record) => record.assignment === "omi-palindromic-mnemonic-token");
  assert.equal(consRecord.keyword, "CONS");
  assert.ok(consRecord.sourceBlock);
  assert.match(consRecord.sourceBlock.raw, /projection-only/);

  assert.equal(kernel.verifyPacketCompliance("omi-ffff-0001-0000-0001-9999-0001-0001-0000/48"), false);
  assert.equal(kernel.verifyPacketCompliance("omi---imo"), false);
});

test("OMI parser flags unclosed omi- source block as malformed", () => {
  const result = parseOmiDocument("omi-\n  (orphan content\n  )\n", { source: "test" });
  assert.equal(result.malformed.length, 1);
  assert.match(result.malformed[0].reason, /Unclosed/);
});

test("OMI parser flags -imo without preceding record as malformed", () => {
  const result = parseOmiDocument("-imo\n", { source: "test" });
  assert.ok(result.malformed.length === 0 || result.malformed.some((m) => m.reason.includes("source block")), "hanging -imo is harmless");
});

test("OMI parser preserves source block raw content with indentation and newlines", async () => {
  const cons = parseOmiDocument(await readRepoFile("CONS.omi"), { source: "CONS.omi" });
  const emoji = cons.records.find((record) => record.assignment === "emoji-rewrite-pair-alist");
  assert.ok(emoji.sourceBlock);
  assert.match(emoji.sourceBlock.raw, /omi-🛹/);
  assert.match(emoji.sourceBlock.raw, /projection-only/);
  assert.ok(emoji.sourceBlock.startLine > 0);
  assert.ok(emoji.sourceBlock.endLine > emoji.sourceBlock.startLine);
});

test("OMI parser reads new declarative core facts from FACTS.omi", async () => {
  const facts = parseOmiDocument(await readRepoFile("FACTS.omi"), { source: "FACTS.omi" });
  assert.ok(facts.records.some((r) => r.assignment === "omi-source-block-parser-implemented"));
  assert.ok(facts.records.some((r) => r.assignment === "emoji-carrier-vendor-resolution-implemented"));
  assert.ok(facts.records.some((r) => r.assignment === "omiom-prefix-cascade-resolution-documented"));
});

test("OMI parser reads new Omilog/IMO facts from FACTS.omi", async () => {
  const facts = parseOmiDocument(await readRepoFile("FACTS.omi"), { source: "FACTS.omi" });
  assert.ok(facts.records.some((r) => r.assignment === "omilog-o-expression-parser-implemented"));
  assert.ok(facts.records.some((r) => r.assignment === "imo-native-character-plane-tested"));
  assert.ok(facts.records.some((r) => r.assignment === "omi-imo-authority-boundary-tested"));
});

test("OMI parser reads new declarative core rules from RULES.omi", async () => {
  const rules = parseOmiDocument(await readRepoFile("RULES.omi"), { source: "RULES.omi" });
  assert.ok(rules.records.some((r) => r.assignment === "parse-native-omi-declarative-records"));
  assert.ok(rules.records.some((r) => r.assignment === "parse-omi-source-block-delimiters"));
  assert.ok(rules.records.some((r) => r.assignment === "resolve-omi-declarations-by-prefix-specificity"));
});

test("OMI parser reads new Omilog/IMO rules from RULES.omi", async () => {
  const rules = parseOmiDocument(await readRepoFile("RULES.omi"), { source: "RULES.omi" });
  assert.ok(rules.records.some((r) => r.assignment === "parse-omilog-o-expressions"));
  assert.ok(rules.records.some((r) => r.assignment === "require-closure-for-wlog-safe-rewrite"));
  assert.ok(rules.records.some((r) => r.assignment === "preserve-o-expression-authority-boundary"));
  assert.ok(rules.records.some((r) => r.assignment === "resolve-omilog-records-by-prefix-specificity"));
  assert.ok(rules.records.some((r) => r.assignment === "compile-readable-omi-source-to-native-imo-object"));
  assert.ok(rules.records.some((r) => r.assignment === "restrict-imo-native-syntax-to-low-ascii-and-unicode-carriers"));
  assert.ok(rules.records.some((r) => r.assignment === "preserve-omi-source-imo-object-authority-boundary"));
});

test("Axiomatic rules compiler still matches existing MUST segment and prefix rules", async () => {
  const compiler = new OmiAxiomaticRulesCompiler(await readRepoFile("RULES.omi"));
  const chiral = compiler.evaluateAxiomaticRegister(new Array(16).fill(0), 0, 0xFFFF);
  assert.ok(chiral.valid);
  assert.ok(chiral.matchedRules.some((rule) => rule.value === "chiral-origin"));

  const frame = new Uint8Array(16);
  frame[0] = 0x03;
  frame[1] = 0x9f;
  assert.ok(compiler.match(frame).some((rule) => rule.value === "cardinal-enclosure"));
});

test("Wittgenstein truth combinators preserve canonical bit order and carry-forward gnomon", () => {
  assert.deepEqual(KARNAUGH_BIT_ORDER, {
    bit3: "f(T,T)",
    bit2: "f(T,F)",
    bit1: "f(F,T)",
    bit0: "f(F,F)"
  });
  assert.deepEqual(karnaughMap(6), { bit3: 0, bit2: 1, bit1: 1, bit0: 0 });

  assert.equal(W6(1, 0), 1);
  assert.equal(W6(1, 1), 0);
  assert.equal(W8(1, 1), 1);
  assert.equal(W8(1, 0), 0);
  assert.equal(W14(0, 0), 0);
  assert.equal(W14(1, 0), 1);

  assert.deepEqual(carryForwardGnomon(1, 1, 0), { P: 0, G: 1, sum: 0, carry: 1 });
  assert.deepEqual(carryForwardGnomon(1, 0, 1), { P: 1, G: 0, sum: 0, carry: 1 });
  assert.throws(() => wittgensteinOperator(16, 1, 1), /0..15/);
});
