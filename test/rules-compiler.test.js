import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OmiAxiomaticRulesCompiler } from "../src/omi/rules-compiler.js";

const RULES_OMI_PATH = join(process.cwd(), "RULES.omi");

test("OmiAxiomaticRulesCompiler parses all MUST rules from /RULES.omi", () => {
  const text = readFileSync(RULES_OMI_PATH, "utf-8");
  const compiler = new OmiAxiomaticRulesCompiler(text);
  assert.ok(compiler.rules.length > 0);
  const mustCount = compiler.rules.filter(r => r.keyword === "MUST").length;
  assert.ok(mustCount >= 60);
});

test("evaluateAxiomaticRegister matches exact segment value", () => {
  const text = readFileSync(RULES_OMI_PATH, "utf-8");
  const compiler = new OmiAxiomaticRulesCompiler(text);
  const S = new Array(16).fill(0);
  const result = compiler.evaluateAxiomaticRegister(S, 6, 0x0007);
  assert.ok(result.valid);
  assert.ok(result.matchedRules.some(r => r.value === "terminal-fractal-fence"));
});

test("evaluateAxiomaticRegister returns invalid for bad segment index", () => {
  const text = readFileSync(RULES_OMI_PATH, "utf-8");
  const compiler = new OmiAxiomaticRulesCompiler(text);
  const S = new Array(16).fill(0);
  const result = compiler.evaluateAxiomaticRegister(S, 99, 0x0007);
  assert.equal(result.valid, false);
  assert.ok(result.reason.includes("segmentIndex out of range"));
});

test("evaluateAxiomaticRegister returns invalid for non-array S", () => {
  const text = readFileSync(RULES_OMI_PATH, "utf-8");
  const compiler = new OmiAxiomaticRulesCompiler(text);
  const result = compiler.evaluateAxiomaticRegister(null, 0, 0x0007);
  assert.equal(result.valid, false);
  assert.equal(result.reason, "S must be a 16-byte array");
});

test("match finds cardinal-enclosure rule for 0x039f prefix", () => {
  const text = readFileSync(RULES_OMI_PATH, "utf-8");
  const compiler = new OmiAxiomaticRulesCompiler(text);
  const frame = new Uint8Array(16);
  frame[0] = 0x03; frame[1] = 0x9f;
  const matches = compiler.match(frame);
  const chiralRule = matches.find(r => r.value === "cardinal-enclosure");
  assert.ok(chiralRule, "should match cardinal-enclosure rule");
  assert.equal(chiralRule.keyword, "MUST");
});

test("match returns empty for non-matching frame", () => {
  const text = readFileSync(RULES_OMI_PATH, "utf-8");
  const compiler = new OmiAxiomaticRulesCompiler(text);
  const frame = new Uint8Array(16).fill(0xFE);
  const matches = compiler.match(frame);
  assert.equal(matches.length, 0);
});

test("evaluateAxiomaticRegister matches stride rules", () => {
  const text = readFileSync(RULES_OMI_PATH, "utf-8");
  const compiler = new OmiAxiomaticRulesCompiler(text);
  const S = new Array(16).fill(0);
  const stride720 = compiler.evaluateAxiomaticRegister(S, 4, 0x02D0);
  assert.ok(stride720.valid);
  assert.ok(stride720.matchedRules.some(r => r.value === "stride-720"));
});

test("evaluateAxiomaticRegister matches slot rules", () => {
  const text = readFileSync(RULES_OMI_PATH, "utf-8");
  const compiler = new OmiAxiomaticRulesCompiler(text);
  const S = new Array(16).fill(0);
  const slot54 = compiler.evaluateAxiomaticRegister(S, 5, 0x0036);
  assert.ok(slot54.valid);
  assert.ok(slot54.matchedRules.some(r => r.value === "slot-54-max"));
});

test("evaluateAxiomaticRegister matches inversion gate rule", () => {
  const text = readFileSync(RULES_OMI_PATH, "utf-8");
  const compiler = new OmiAxiomaticRulesCompiler(text);
  const S = new Array(16).fill(0);
  const inversion = compiler.evaluateAxiomaticRegister(S, 2, 0x5A3C);
  assert.ok(inversion.valid);
  assert.ok(inversion.matchedRules.some(r => r.value === "central-inversion-mirror"));
});

test("evaluateAxiomaticRegister matches chiral-origin rule", () => {
  const text = readFileSync(RULES_OMI_PATH, "utf-8");
  const compiler = new OmiAxiomaticRulesCompiler(text);
  const S = new Array(16).fill(0);
  const chiral = compiler.evaluateAxiomaticRegister(S, 0, 0xFFFF);
  assert.ok(chiral.valid);
  assert.ok(chiral.matchedRules.some(r => r.value === "chiral-origin"));
});
