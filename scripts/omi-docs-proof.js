import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const BIN = join(ROOT, ".cache", "omi-metacompiler");
const SOURCES = Object.freeze([
  "omi-docs/metacompiler/canonical.omilisp",
  "omi-docs/metacompiler/fs-gs-rs-us-trace.omilisp",
]);

function run(args) {
  const result = spawnSync(BIN, args, {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `omi-metacompiler ${args.join(" ")} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }
  return result.stdout;
}

function artifactFor(source) {
  const stem = basename(source).replace(/\.[^.]+$/, "");
  return {
    tape: join(ROOT, "dist", "omi-docs", `${stem}.odct`),
    receipt: join(ROOT, "dist", "omi-docs", `${stem}.receipt.json`),
  };
}

function assertHeader8(bytes, state) {
  assert.deepEqual(
    [...bytes.subarray(0, 8)],
    [0x00, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x28, state]
  );
}

function assertLaneBytes(bytes) {
  const seen = new Set();
  let pos = 8;
  while (pos < bytes.length) {
    const lane = bytes[pos++];
    const len = (bytes[pos++] << 8) | bytes[pos++];
    seen.add(lane);
    pos += len;
  }
  assert.ok(seen.has(0x1c), "compiled tape must include FS");
  assert.ok(seen.has(0x1d), "compiled tape must include GS");
  assert.ok(seen.has(0x1e), "compiled tape must include RS");
  assert.ok(seen.has(0x1f), "compiled tape must include US");
}

assert.ok(existsSync(BIN), "build-omi-metacompiler must create .cache/omi-metacompiler");

for (const source of SOURCES) {
  const first = JSON.parse(run(["compile", source]));
  const second = JSON.parse(run(["compile", source]));
  const inspected = JSON.parse(run(["inspect", source]));
  const artifact = artifactFor(source);

  assert.equal(first.source, source);
  assert.equal(first.artifact, `dist/omi-docs/${basename(artifact.tape)}`);
  assert.equal(first.receipt, `dist/omi-docs/${basename(artifact.receipt)}`);
  assert.equal(first.tapeHash, second.tapeHash);
  assert.equal(first.normalizedHash, second.normalizedHash);
  assert.equal(first.sourceHash, second.sourceHash);
  assert.equal(first.tapeHash, inspected.tapeHash);
  assert.equal(first.normalizedHash, inspected.normalizedHash);
  assert.ok(first.records.length > 0);

  const tape = readFileSync(artifact.tape);
  const receipt = JSON.parse(readFileSync(artifact.receipt, "utf8"));
  assert.equal(receipt.tapeHash, first.tapeHash);
  assert.equal(tape.length, first.tapeBytes);
  assertLaneBytes(tape);
  assertHeader8(tape, first.shape === "canonical" ? 0x01 : 0x02);

  const rendered = run(["decompile", `dist/omi-docs/${basename(artifact.tape)}`]);
  assert.match(rendered, /HEADER8: NUL ESC FS GS RS US input=0x28 state=0x0[12]/);
  assert.match(rendered, /\bFS\b/);
  assert.match(rendered, /\bGS\b/);
  assert.match(rendered, /\bRS\b/);
  assert.match(rendered, /\bUS\b/);
}

console.log("[omi-docs-proof] accepted");
