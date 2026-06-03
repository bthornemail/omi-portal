import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseOmiDocument } from "../src/omi/omi-parser.js";
import {
  compileOmiParsed,
  compileOmiParsedWithTriadDispatch
} from "../src/omilog/omi-imo-compiler.js";
import {
  TRIAD_COUNT,
  TRIAD_MODE_FULL8,
  TRIAD_MODE_PREFIX3,
  TRIAD_PLANE_IMAGINARY,
  TRIAD_PLANE_REAL,
  auditConsTriadDispatch,
  coreMaxFromSegments,
  determineTriadPlane,
  evaluateTriadDispatch,
  lowByte,
  triad155FromSegments
} from "../src/omilog/triad-dispatch.js";

async function readRepoFile(path) {
  return readFile(join(process.cwd(), path), "utf8");
}

test("triad155 computes canonical prefix3 low-byte modulo 155", () => {
  const segments = [0x0012, 0x03bf, 0x7c0a, 0, 0, 0, 0x039f, 0x7dff];
  assert.equal(lowByte(segments[1]), 0xbf);
  assert.equal(triad155FromSegments(segments), 64);
});

test("pre-boot root gives canonical triad 36", () => {
  const address = "omi-0000-03bf-7c00-0000-0010-0001-039f-7dff/128";
  const dispatch = evaluateTriadDispatch(address);
  assert.equal(dispatch.triadIndex, 36);
  assert.equal(dispatch.category, "rules");
  assert.equal(dispatch.localIndex, 36);
  assert.equal(dispatch.modulus, TRIAD_COUNT);
});

test("full8 mode is diagnostic and does not replace prefix3", () => {
  const address = "omi-0000-03bf-7c00-0001-0002-0003-039f-7dff/128";
  assert.equal(triad155FromSegments(address, TRIAD_MODE_PREFIX3), 36);
  assert.equal(triad155FromSegments(address, TRIAD_MODE_FULL8), 146);

  const dispatch = evaluateTriadDispatch(address, { triadMode: TRIAD_MODE_PREFIX3 });
  assert.equal(dispatch.triadIndex, 36);
  assert.equal(dispatch.diagnosticFull8, 146);
});

test("coreMax routes low intensity to Real Plane A and high intensity to Imaginary Plane B", () => {
  const realAddress = "omi-0000-03bf-7c00-0000-0010-0001-039f-7dff/128";
  const imaginaryAddress = "omi-0000-03bf-7c00-9000-0000-0000-039f-7dff/128";

  assert.equal(coreMaxFromSegments(realAddress), 0x0010);
  assert.equal(coreMaxFromSegments(imaginaryAddress), 0x9000);
  assert.equal(determineTriadPlane(0x0010), TRIAD_PLANE_REAL);
  assert.equal(determineTriadPlane(0x9000), TRIAD_PLANE_IMAGINARY);

  const real = evaluateTriadDispatch(realAddress);
  const imaginary = evaluateTriadDispatch(imaginaryAddress);
  assert.equal(real.branch, "A");
  assert.equal(imaginary.branch, "B");
  assert.deepEqual(real.tower, ["8!", "6!", "4!", "2!"]);
  assert.deepEqual(imaginary.tower, ["7!", "5!", "3!", "1!"]);
});

test("Real and Imaginary plane memory slots remain isolated", () => {
  const real = evaluateTriadDispatch("omi-0000-03bf-7c00-0000-0010-0001-039f-7dff/128");
  const imaginary = evaluateTriadDispatch("omi-0000-03bf-7c00-9000-0000-0000-039f-7dff/128");

  assert.equal(real.memorySlot, "real:A");
  assert.equal(real.isolation.real, "real:A");
  assert.equal(real.isolation.imaginary, null);

  assert.equal(imaginary.memorySlot, "imaginary:B");
  assert.equal(imaginary.isolation.real, null);
  assert.equal(imaginary.isolation.imaginary, "imaginary:B");
});

test("compileOmiParsed remains unchanged unless triad dispatch is requested", () => {
  const parsed = parseOmiDocument(
    "omi-0000-03bf-7c00-0000-0010-0001-039f-7dff/128 CONS cons-rrggbbaa-pos-adj"
  );
  const plain = compileOmiParsed(parsed);
  assert.equal(Object.hasOwn(plain, "triadDispatch"), false);

  const dispatched = compileOmiParsedWithTriadDispatch(parsed);
  assert.ok(Array.isArray(dispatched.triadDispatch));
  assert.equal(dispatched.triadDispatch.length, 1);
  assert.equal(dispatched.triadDispatch[0].dispatch.triadIndex, 36);
  assert.equal(dispatched.triadDispatch[0].dispatch.plane, TRIAD_PLANE_REAL);
  assert.deepEqual(dispatched.lines, plain.lines);
});

test("compileOmiParsedWithTriadDispatch is deterministic across recompilations", () => {
  const parsed = parseOmiDocument(
    "omi-0000-03bf-7c00-0100-0120-0200-039f-7eff/128 CONS cons-rrggbbaa-feature-tense"
  );
  const first = compileOmiParsedWithTriadDispatch(parsed);
  const second = compileOmiParsedWithTriadDispatch(parsed);
  assert.deepEqual(
    first.triadDispatch.map((entry) => entry.dispatch),
    second.triadDispatch.map((entry) => entry.dispatch)
  );
});

test("formal CONS audit passes for monotonic RRGGBBAA lookup records", async () => {
  const cons = await readRepoFile("CONS.omi");
  const audit = auditConsTriadDispatch(cons, { requireSourceBlocks: true });
  assert.equal(audit.valid, true);
  assert.equal(audit.monotonic, true);
  assert.ok(audit.entries.length >= 6);
  assert.ok(audit.entries.every((entry) => entry.dispatch.triadIndex === 36));
  assert.ok(audit.entries.every((entry) => entry.hasTriadSourceBlock));
});

test("Rules and Facts declare triad dispatch D1-D3 without adding a sixth root", async () => {
  const rules = parseOmiDocument(await readRepoFile("RULES.omi"), { source: "RULES.omi" });
  const facts = parseOmiDocument(await readRepoFile("FACTS.omi"), { source: "FACTS.omi" });
  assert.ok(rules.records.some((record) => record.assignment === "derive-triad-dispatch-as-secondary-cons-index-mod-one-hundred-fifty-five"));
  assert.ok(rules.records.some((record) => record.assignment === "preserve-rrggbbaa-monotonic-primary-order-when-triad-dispatch-is-added"));
  assert.ok(rules.records.some((record) => record.assignment === "route-triad-branch-plane-without-validating-lower-body"));
  assert.ok(facts.records.some((record) => record.assignment === "triad-dispatch-secondary-index-implemented"));
  assert.ok(facts.records.some((record) => record.assignment === "rrggbbaa-primary-order-preserved-across-triad-dispatch"));
  assert.equal(rules.records.some((record) => record.keyword === "TEST"), false);
});
