import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  OPTIMIZER_RECEIPT_STATE,
  collectDuplicateCandidates,
  collectMalformedOmiCandidates,
  collectSlideResidueCandidates,
  optimizeCodebase,
  rankCandidates
} from "../src/omi/tetragrammatron-optimizer.js";
import { ingestSources } from "../src/omi/codebase-ingestion.js";
import { parseOmiDocument } from "../src/omi/omi-parser.js";

const DUPLICATE_SOURCES = [
  {
    path: "a.ts",
    content: [
      "export function duplicate() {",
      "  return 1;",
      "}",
      "const residue = 1;"
    ].join("\n")
  },
  {
    path: "b.ts",
    content: [
      "export function duplicate() {",
      "  return 2;",
      "}",
      "const residue = 2;"
    ].join("\n")
  }
];

const FAILING_OUTPUT = [
  "▶ Optimizer fixture",
  "  ✖ detects a broken route (1.25ms)",
  "  ✔ keeps a stable route (0.33ms)"
].join("\n");

test("optimizeCodebase is deterministic for the same source and test input", () => {
  const first = optimizeCodebase({
    sources: DUPLICATE_SOURCES,
    testOutput: FAILING_OUTPUT,
    options: {
      top: 8,
      skippedSources: [{ path: "README.md", reason: "unsupported source surface" }]
    }
  });
  const second = optimizeCodebase({
    sources: DUPLICATE_SOURCES,
    testOutput: FAILING_OUTPUT,
    options: {
      top: 8,
      skippedSources: [{ path: "README.md", reason: "unsupported source surface" }]
    }
  });

  assert.deepEqual(first.summary, second.summary);
  assert.deepEqual(first.candidates.map((candidate) => candidate.id), second.candidates.map((candidate) => candidate.id));
  assert.deepEqual(first.receipts, second.receipts);
  assert.equal(first.omiText, second.omiText);
  assert.deepEqual(first.events, second.events);
});

test("optimizeCodebase ranks failed tests before lower-severity candidates", () => {
  const result = optimizeCodebase({
    sources: DUPLICATE_SOURCES,
    testOutput: FAILING_OUTPUT,
    options: {
      top: 5,
      skippedSources: [{ path: "notes.md", reason: "unsupported source surface" }]
    }
  });

  assert.equal(result.candidates[0].kind, "failed_test");
  assert.equal(result.candidates[0].severity, 100);
  assert(result.candidates.some((candidate) => candidate.kind === "duplicate_declaration"));
  assert(result.candidates.every((candidate) => candidate.receiptState === OPTIMIZER_RECEIPT_STATE));
});

test("collectMalformedOmiCandidates catches parser drift surfaces", () => {
  const candidates = collectMalformedOmiCandidates({
    "BROKEN.omi": "omi-bad/128 FACT broken\n"
  });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].kind, "malformed_omi");
  assert.equal(candidates[0].severity, 90);
});

test("duplicate and slide residue collectors find structural candidates", () => {
  const ingestion = ingestSources(DUPLICATE_SOURCES);
  const duplicates = collectDuplicateCandidates(ingestion.records);
  const residues = collectSlideResidueCandidates(ingestion.records);

  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].kind, "duplicate_declaration");
  assert(residues.length > 0);
  assert(residues.every((candidate) => candidate.kind === "slide_residue"));
});

test("rankCandidates applies severity, confidence, and location ordering", () => {
  const ranked = rankCandidates([
    { kind: "unsupported_surface", confidence: 0.5, sourcePath: "z", line: 1, reason: "low" },
    { kind: "failed_test", confidence: 0.5, sourcePath: "b", line: 1, reason: "high" },
    { kind: "failed_test", confidence: 1, sourcePath: "a", line: 1, reason: "higher confidence" }
  ]);

  assert.equal(ranked[0].reason, "higher confidence");
  assert.equal(ranked[1].reason, "high");
  assert.equal(ranked[2].reason, "low");
});

test("optimizer writes candidate receipts through Tetragrammatron event shape", () => {
  const result = optimizeCodebase({
    sources: DUPLICATE_SOURCES,
    testOutput: FAILING_OUTPUT,
    options: { top: 3 }
  });

  assert.equal(result.events.length, result.candidates.length);
  for (let i = 0; i < result.events.length; i++) {
    const event = result.events[i];
    const candidate = result.candidates[i];
    assert.equal(event.type, "tetragrammatron-backend-event");
    assert.equal(event.receiptState, "candidate");
    assert.equal(event.status, "candidate");
    assert.equal(event.slot, candidate.slot5040);
    assert.equal(event.route.local240, candidate.local240);
    assert.equal(event.receipt, candidate.receipt);
    assert.doesNotThrow(() => JSON.stringify(candidate.snapshot));
  }
});

test("OPTIMIZATION.omi output is parseable", () => {
  const result = optimizeCodebase({
    sources: DUPLICATE_SOURCES,
    testOutput: FAILING_OUTPUT,
    options: { top: 5 }
  });
  const parsed = parseOmiDocument(result.omiText, { source: "OPTIMIZATION.omi" });

  assert.equal(parsed.malformed.length, 0);
  assert.equal(parsed.records.length, result.candidates.length);
});

test("tetragrammatron optimizer CLI writes report files and does not mutate sources", () => {
  const dir = mkdtempSync(join(tmpdir(), "omi-optimizer-"));
  const sourceDir = join(dir, "src");
  const outDir = join(dir, "out");
  const testOutputPath = join(dir, "test-output.txt");
  const aPath = join(sourceDir, "a.ts");
  const bPath = join(sourceDir, "b.ts");
  const readmePath = join(sourceDir, "README.md");

  mkdirSync(sourceDir, { recursive: true });
  writeFileSync(aPath, DUPLICATE_SOURCES[0].content, "utf8");
  writeFileSync(bPath, DUPLICATE_SOURCES[1].content, "utf8");
  writeFileSync(readmePath, "# unsupported surface\n", "utf8");
  writeFileSync(testOutputPath, FAILING_OUTPUT, "utf8");
  const before = new Map([
    [aPath, readFileSync(aPath, "utf8")],
    [bPath, readFileSync(bPath, "utf8")],
    [readmePath, readFileSync(readmePath, "utf8")]
  ]);

  execFileSync("node", [
    "scripts/tetragrammatron-optimize.js",
    sourceDir,
    "--out",
    outDir,
    "--top",
    "10",
    "--test-output",
    testOutputPath
  ], {
    cwd: process.cwd(),
    stdio: "pipe"
  });

  for (const fileName of ["summary.json", "candidates.json", "events.jsonl", "receipts.txt", "OPTIMIZATION.omi"]) {
    assert.equal(existsSync(join(outDir, fileName)), true, fileName);
  }
  assert.equal(readFileSync(aPath, "utf8"), before.get(aPath));
  assert.equal(readFileSync(bPath, "utf8"), before.get(bPath));
  assert.equal(readFileSync(readmePath, "utf8"), before.get(readmePath));

  const summary = JSON.parse(readFileSync(join(outDir, "summary.json"), "utf8"));
  const candidates = JSON.parse(readFileSync(join(outDir, "candidates.json"), "utf8"));
  const parsed = parseOmiDocument(readFileSync(join(outDir, "OPTIMIZATION.omi"), "utf8"), {
    source: "OPTIMIZATION.omi"
  });

  assert.equal(summary.proposeOnly, true);
  assert(candidates.some((candidate) => candidate.kind === "failed_test"));
  assert(candidates.some((candidate) => candidate.kind === "unsupported_surface"));
  assert.equal(parsed.malformed.length, 0);
  assert.equal(parsed.records.length, candidates.length);
});
