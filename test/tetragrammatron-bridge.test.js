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
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseOmiDocument } from "../src/omi/omi-parser.js";
import {
  buildCellState,
  ingestSources
} from "../src/omi/codebase-ingestion.js";
import { runTetragrammatronBridge } from "../src/omi/tetragrammatron-bridge.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const FIXTURE_SOURCE = [
  "export function duplicate() {",
  "  return 1;",
  "}",
  "export function duplicate() {",
  "  return 2;",
  "}",
  "const residue = 1;"
].join("\n");

test("previous cell state lets deterministic ingestion converge to zero deltas", () => {
  const sources = [{ path: "fixture.js", content: FIXTURE_SOURCE }];
  const first = ingestSources(sources);
  const second = ingestSources(sources, { previousCellState: buildCellState(first.records) });

  assert(first.records.some((record) => record.cell.delta !== 0));
  assert.equal(second.records.length, first.records.length);
  assert(second.records.every((record) => record.cell.delta === 0));
});

test("guarded bridge is deterministic and accepts after replay stability plus safe gate", async () => {
  const root = mkdtempSync(join(tmpdir(), "omi-bridge-deterministic-"));
  const sourceDir = writeFixture(join(root, "src"));
  const first = await runTetragrammatronBridge({
    sourceDir,
    outDir: join(root, "out-a"),
    iterations: 3,
    top: 20,
    branch: "feature/hopf",
    nodeId: "node-a",
    safeGateRunner: async () => ({ accepted: true, status: "passed" })
  });
  const second = await runTetragrammatronBridge({
    sourceDir,
    outDir: join(root, "out-b"),
    iterations: 3,
    top: 20,
    branch: "feature/hopf",
    nodeId: "node-a",
    safeGateRunner: async () => ({ accepted: true, status: "passed" })
  });

  assert.equal(first.summary.accepted, true);
  assert.equal(first.summary.stoppedReason, "accepted");
  assert.equal(first.summary.finalIteration, 3);
  assert.equal(first.summary.finalStateHash, second.summary.finalStateHash);
  assert.deepEqual(first.receipts, second.receipts);
  assert.equal(
    readFileSync(join(root, "out-a", "OPTIMIZATION.omi"), "utf8"),
    readFileSync(join(root, "out-b", "OPTIMIZATION.omi"), "utf8")
  );

  const ringA = JSON.parse(readFileSync(join(root, "out-a", "ring.json"), "utf8"));
  const ringB = JSON.parse(readFileSync(join(root, "out-b", "ring.json"), "utf8"));
  assert.deepEqual(ringA, ringB);
});

test("guarded bridge reports malformed generated OMI and compile failure", async () => {
  const root = mkdtempSync(join(tmpdir(), "omi-bridge-malformed-"));
  const sourceDir = writeFixture(join(root, "src"));
  const result = await runTetragrammatronBridge({
    sourceDir,
    outDir: join(root, "out"),
    iterations: 2,
    top: 10,
    safeGateRunner: async () => ({ accepted: true, status: "passed" }),
    documentTransform({ fileName, text }) {
      return fileName === "RULES.omi" ? `${text}\nomi-bad/128 FACT broken\n` : text;
    }
  });

  assert.equal(result.summary.accepted, false);
  assert(result.summary.iterations.some((iteration) => iteration.parse.malformedCount > 0));
  assert(result.summary.iterations.some((iteration) => iteration.compiled.ok === false));
});

test("guarded bridge rejects unstable ququart replay", async () => {
  const root = mkdtempSync(join(tmpdir(), "omi-bridge-unstable-"));
  const sourceDir = writeFixture(join(root, "src"));
  let counter = 0n;
  const result = await runTetragrammatronBridge({
    sourceDir,
    outDir: join(root, "out"),
    iterations: 2,
    top: 10,
    safeGateRunner: async () => ({ accepted: true, status: "passed" }),
    ququartOperator(value) {
      counter += 1n;
      return value + counter;
    }
  });

  assert.equal(result.summary.accepted, false);
  assert.equal(result.summary.iterations.at(-1).guard.ququartStable, false);
});

test("guarded bridge does not accept when final deltas are still nonzero", async () => {
  const root = mkdtempSync(join(tmpdir(), "omi-bridge-nonzero-"));
  const sourceDir = writeFixture(join(root, "src"));
  const result = await runTetragrammatronBridge({
    sourceDir,
    outDir: join(root, "out"),
    iterations: 1,
    top: 10,
    safeGateRunner: async () => ({ accepted: true, status: "passed" })
  });

  assert.equal(result.summary.accepted, false);
  assert.equal(result.summary.iterations[0].guard.zeroDeltas, false);
  assert.equal(result.summary.iterations[0].safeGate.status, "skipped");
});

test("tetragrammatron bridge CLI writes artifacts and does not mutate sources", () => {
  const root = mkdtempSync(join(tmpdir(), "omi-bridge-cli-"));
  const sourceDir = writeFixture(join(root, "src"));
  const outDir = join(root, "out");
  const sourcePath = join(sourceDir, "fixture.js");
  const before = readFileSync(sourcePath, "utf8");

  const stdout = execFileSync(process.execPath, [
    "scripts/tetragrammatron-bridge.js",
    "--dir",
    sourceDir,
    "--out",
    outDir,
    "--iterations",
    "3",
    "--top",
    "10"
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe"
  });

  assert.match(stdout, /Tetragrammatron bridge/);
  assert.equal(readFileSync(sourcePath, "utf8"), before);
  for (const fileName of [
    "summary.json",
    "receipts.ndjson",
    "ring.json",
    "resolved.json",
    "OPTIMIZATION.omi",
    "NETWORK.omi",
    "state-vector.json"
  ]) {
    assert.equal(existsSync(join(outDir, fileName)), true, fileName);
  }
  for (const fileName of [
    "RULES.omi",
    "FACTS.omi",
    "CLOSURES.omi",
    "COMBINATORS.omi",
    "CONS.omi",
    "OPTIMIZATION.omi",
    "NETWORK.omi",
    "ring.json",
    "resolved.json",
    "state-vector.json"
  ]) {
    assert.equal(existsSync(join(outDir, "iterations", "003", fileName)), true, fileName);
  }

  const optimization = parseOmiDocument(readFileSync(join(outDir, "OPTIMIZATION.omi"), "utf8"), {
    source: "OPTIMIZATION.omi"
  });
  const network = parseOmiDocument(readFileSync(join(outDir, "NETWORK.omi"), "utf8"), {
    source: "NETWORK.omi"
  });
  const summary = JSON.parse(readFileSync(join(outDir, "summary.json"), "utf8"));

  assert.equal(optimization.malformed.length, 0);
  assert.equal(network.malformed.length, 0);
  assert.equal(summary.stoppedReason, "converged-safe-gate-not-accepted");
});

function writeFixture(sourceDir) {
  mkdirSync(sourceDir, { recursive: true });
  writeFileSync(join(sourceDir, "fixture.js"), FIXTURE_SOURCE, "utf8");
  writeFileSync(join(sourceDir, "README.md"), "# unsupported surface\n", "utf8");
  return sourceDir;
}
