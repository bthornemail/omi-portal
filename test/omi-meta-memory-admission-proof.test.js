import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const ROOT = process.cwd();
const BIN = join(ROOT, ".cache", "omi-metacompiler");
const SCRIPT = "scripts/omi-meta-memory-admission-proof.js";

function runMake(target) {
  const result = spawnSync("make", [target], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, `make ${target} failed:\n${result.stderr}`);
  return result.stdout;
}

test("omi-meta-memory-admission-proof builds metacompiler and admits declaration into meta-memory", () => {
  runMake("build-omi-metacompiler");
  const result = spawnSync("node", [SCRIPT], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, `proof script failed:\n${result.stderr}`);
  assert.match(result.stdout, /\[omi-meta-memory-admission-proof\] accepted/);
});
