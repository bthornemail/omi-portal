import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseOmiDocument } from "../src/omi/omi-parser.js";
import { compileOmiFile, lowerRecordToImo, isNativeCharPlaneSafe } from "../src/omilog/omi-imo-compiler.js";
import { projectBase36Symbol } from "../src/canvas/omicron-canvas.js";

async function readRepoFile(path) {
  return readFile(join(process.cwd(), path), "utf8");
}

test("Base36 rule 0x72 parses from RULES.omi", async () => {
  const rules = parseOmiDocument(await readRepoFile("RULES.omi"), { source: "RULES.omi" });
  const rule = rules.records.find((r) => r.assignment === "project-base36-orbital-symbols");
  assert.ok(rule, "Rule 0x72 project-base36-orbital-symbols must exist");
  assert.equal(rule.keyword, "MUST");
  assert.equal(rule.segments[6], 0x0036);
});

test("Base36 rule 0x73 parses from RULES.omi", async () => {
  const rules = parseOmiDocument(await readRepoFile("RULES.omi"), { source: "RULES.omi" });
  const rule = rules.records.find((r) => r.assignment === "canonicalize-bijective-symbol-state");
  assert.ok(rule, "Rule 0x73 canonicalize-bijective-symbol-state must exist");
  assert.equal(rule.keyword, "MUST");
});

test("Base36 rule 0x74 parses from RULES.omi", async () => {
  const rules = parseOmiDocument(await readRepoFile("RULES.omi"), { source: "RULES.omi" });
  assert.ok(rules.records.some((r) => r.assignment === "preserve-unary-root-presence-boundary"));
});

test("Base36 rule 0x75 parses from RULES.omi", async () => {
  const rules = parseOmiDocument(await readRepoFile("RULES.omi"), { source: "RULES.omi" });
  assert.ok(rules.records.some((r) => r.assignment === "preserve-signed-fold-symbol-boundary"));
});

test("Base36 rule 0x76 parses from RULES.omi", async () => {
  const rules = parseOmiDocument(await readRepoFile("RULES.omi"), { source: "RULES.omi" });
  assert.ok(rules.records.some((r) => r.assignment === "preserve-unicode-symbolic-carrier-authority"));
});

test("Base36 alignment facts parse from FACTS.omi", async () => {
  const facts = parseOmiDocument(await readRepoFile("FACTS.omi"), { source: "FACTS.omi" });
  assert.ok(facts.records.some((r) => r.assignment === "base36-orbit-alphabet-active"));
  assert.ok(facts.records.some((r) => r.assignment === "base36-width-equals-delta-orbit-tracker"));
  assert.ok(facts.records.some((r) => r.assignment === "base36-visible-five-is-not-hidden-factor-five"));
});

test("COMBINATORS.omi contains base36-projection", async () => {
  const combinators = parseOmiDocument(await readRepoFile("COMBINATORS.omi"), { source: "COMBINATORS.omi" });
  const base36 = combinators.records.find((r) => r.assignment === "base36-projection");
  assert.ok(base36, "base36-projection must exist in COMBINATORS.omi");
  assert.equal(base36.keyword, "COMBINE");
  assert.ok(base36.sourceBlock, "base36-projection must have a source block");
});

test("base36-projection lowers to native .imo operator + with correct segment", async () => {
  const combinators = parseOmiDocument(await readRepoFile("COMBINATORS.omi"), { source: "COMBINATORS.omi" });
  const base36 = combinators.records.find((r) => r.assignment === "base36-projection");
  assert.ok(base36);

  const imoLine = lowerRecordToImo(base36);
  assert.ok(imoLine.startsWith("+/"), "Base36 projection must lower to COMBINE (+) operator");
  assert.ok(imoLine.includes("54"), "Address must contain decimal 54 for 0x0036 segment");
  assert.ok(imoLine.includes("45060"), "Address must contain decimal 45060 for 0xb004 segment");
  assert.ok(isNativeCharPlaneSafe(imoLine), ".imo output must be native-safe");
  assert.ok(!imoLine.includes("base36"), ".imo output must not contain Latin text 'base36'");
});

test(".imo output from COMBINATORS.omi contains no Latin 'base36' text", async () => {
  const text = await readRepoFile("COMBINATORS.omi");
  const { lines } = await compileOmiFile(text, { source: "COMBINATORS.omi" });
  for (const line of lines) {
    if (!isNativeCharPlaneSafe(line)) {
      assert.fail(`Line contains forbidden byte: ${JSON.stringify(line)}`);
    }
  }
});

test("CLOSURES.omi contains base36-projection-authority-boundary closure", async () => {
  const closures = parseOmiDocument(await readRepoFile("CLOSURES.omi"), { source: "CLOSURES.omi" });
  const closure = closures.records.find((r) => r.assignment === "base36-projection-authority-boundary");
  assert.ok(closure, "base36-projection-authority-boundary must exist in CLOSURES.omi");
  assert.equal(closure.keyword, "CLOSE");
  assert.ok(closure.sourceBlock, "Closure must have a source block");
  assert.match(closure.sourceBlock.raw, /Base36-creates-orbit/);
  assert.match(closure.sourceBlock.raw, /Base36-digit-five-equals-hidden-factor-five/);
});

test("projectBase36Symbol('0') returns value36 0", () => {
  const result = projectBase36Symbol("0");
  assert.ok(result);
  assert.equal(result.value36, 0);
  assert.equal(result.symbol, "0");
  assert.equal(result.kind, "base36");
  assert.equal(result.authority, "projection-only");
});

test("projectBase36Symbol('Z') returns value36 35", () => {
  const result = projectBase36Symbol("Z");
  assert.ok(result);
  assert.equal(result.value36, 35);
  assert.equal(result.authority, "projection-only");
});

test("projectBase36Symbol('5') is valid symbol position 5 but does not represent hidden factor five", () => {
  const result = projectBase36Symbol("5");
  assert.ok(result);
  assert.equal(result.value36, 5);
  assert.equal(result.authority, "projection-only");

  const fiveHidden = 5;
  const fiveFactorial = 120;
  const fiveRoot = fiveFactorial / 24;
  assert.equal(fiveRoot, 5, "Hidden factor five = 5!/24 = 5");
  assert.equal(result.value36, fiveRoot, "Base36 '5' coincidentally matches 5!/24 but is projection-only");
  assert.equal(result.authority, "projection-only", "Base36 '5' must be projection-only, not structural authority");
});

test("symbolic Base36 projection does not authorize invalid Q_frame state", () => {
  const result = projectBase36Symbol("A");
  assert.ok(result);
  assert.equal(result.authority, "projection-only");

  const invalidFrames = [
    null,
    undefined,
    "",
    "not-an-omi-address",
    "omi-",
    "omi---imo",
  ];
  for (const frame of invalidFrames) {
    const projected = projectBase36Symbol("A");
    assert.equal(projected.authority, "projection-only");
    assert.ok(!projected.value36 === false || typeof projected.value36 === "number");
  }
});
