import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const BIN = join(ROOT, ".cache", "omi-metacompiler");
const CANONICAL = "omi-docs/metacompiler/canonical.omilisp";
const ALIST = "omi-docs/metacompiler/fs-gs-rs-us-trace.omilisp";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    ...options,
  });
  if (options.allowFailure) return result;
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  return result;
}

function buildTool() {
  run("make", ["build-omi-metacompiler"]);
}

function runTool(args, options = {}) {
  return run(BIN, args, options);
}

function inspect(source) {
  return JSON.parse(runTool(["inspect", source]).stdout);
}

function compile(source) {
  return JSON.parse(runTool(["compile", source]).stdout);
}

function artifactPath(source) {
  const stem = basename(source).replace(/\.[^.]+$/, "");
  return join(ROOT, "dist", "omi-docs", `${stem}.odct`);
}

test("omi metacompiler builds as a portable C tool", () => {
  buildTool();
  const help = runTool([], { allowFailure: true });
  assert.notEqual(help.status, 0);
  assert.match(help.stderr, /usage: omi-metacompiler/);
});

test("canonical declarations inspect as declaration-first control input", () => {
  buildTool();
  const receipt = inspect(CANONICAL);
  assert.equal(receipt.shape, "canonical");
  assert.equal(receipt.header8.join(" "), "NUL ESC FS GS RS US 0x28 0x01");
  assert.equal(receipt.lanes.FS, 1);
  assert.ok(receipt.lanes.GS >= 3);
  assert.ok(receipt.normalized.includes("addr128.v0"));
  assert.ok(receipt.normalized.includes(".omi/runtime"));
  assert.ok(receipt.records.some((record) => record.lane === "FS" && record.value === "omi"));
  assert.ok(receipt.records.some((record) => record.lane === "GS" && record.value === "identity"));
  assert.ok(receipt.records.some((record) => record.lane === "US" && record.value === "protocol.control-plane"));
});

test("FS/GS/RS/US alist traces inspect as lane declarations", () => {
  buildTool();
  const receipt = inspect(ALIST);
  assert.equal(receipt.shape, "alist");
  assert.equal(receipt.header8.join(" "), "NUL ESC FS GS RS US 0x28 0x02");
  assert.deepEqual(receipt.lanes, { FS: 1, GS: 2, RS: 2, US: 3 });
  assert.ok(receipt.records.some((record) => record.lane === "FS" && record.value === "app.declaration-first-metacompiler"));
  assert.ok(receipt.records.some((record) => record.lane === "US" && record.value === "class=protocol-pathway"));
});

test("compile writes deterministic ignored proof artifacts", () => {
  buildTool();
  const first = compile(CANONICAL);
  const second = compile(CANONICAL);
  assert.equal(first.artifact, "dist/omi-docs/canonical.odct");
  assert.equal(first.receipt, "dist/omi-docs/canonical.receipt.json");
  assert.equal(first.sourceHash, second.sourceHash);
  assert.equal(first.normalizedHash, second.normalizedHash);
  assert.equal(first.tapeHash, second.tapeHash);

  const tape = readFileSync(artifactPath(CANONICAL));
  assert.deepEqual([...tape.subarray(0, 8)], [0x00, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x28, 0x01]);
  assert.equal(tape.length, first.tapeBytes);

  const sidecar = JSON.parse(readFileSync(join(ROOT, "dist", "omi-docs", "canonical.receipt.json"), "utf8"));
  assert.equal(sidecar.tapeHash, first.tapeHash);
});

test("decompile renders control bytes as escaped lane names", () => {
  buildTool();
  compile(ALIST);
  const rendered = runTool(["decompile", "dist/omi-docs/fs-gs-rs-us-trace.odct"]).stdout;
  assert.match(rendered, /HEADER8: NUL ESC FS GS RS US input=0x28 state=0x02/);
  assert.match(rendered, /FS app\.declaration-first-metacompiler/);
  assert.match(rendered, /US class=protocol-pathway/);
});

test("malformed declarations reject before control tape emission", () => {
  buildTool();
  const dir = mkdtempSync(join(tmpdir(), "omi-metacompiler-"));
  const bad = join(dir, "bad.omilisp");
  writeFileSync(bad, "(omi (identity (sid missing-close)");
  const result = runTool(["inspect", bad], { allowFailure: true });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /inspect error:/);
});

test("omi-docs-proof verifies replay-stable declaration artifacts", () => {
  buildTool();
  const result = run("node", ["scripts/omi-docs-proof.js"]);
  assert.match(result.stdout, /\[omi-docs-proof\] accepted/);
});
