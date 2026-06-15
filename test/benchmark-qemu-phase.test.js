import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, rm, stat } from "node:fs/promises";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("QEMU benchmark runner writes dry-run artifact tree", async () => {
  const outDir = join(repoRoot, "dist", "test-benchmark-qemu-phase");
  await rm(outDir, { recursive: true, force: true });

  const result = await execFileAsync(process.execPath, [
    "scripts/benchmark-qemu-phase.js",
    "--dry-run",
    "--only",
    "emmc",
    "--out-dir",
    outDir,
  ], { cwd: repoRoot });

  assert.match(result.stdout, /summary:/);
  assert.match(result.stdout, /report:/);

  for (const artifact of [
    "environment.txt",
    "baseline.log",
    "emmc-proof.log",
    "emmc-image.sha256",
    "emmc-receipt.json",
    "qemu-user-build.log",
    "softmmu-build.log",
    "stress.log",
    "load-compose.log",
    "summary.json",
    "report.md",
  ]) {
    const artifactStat = await stat(join(outDir, artifact));
    assert.equal(artifactStat.isFile(), true, `${artifact} should exist`);
  }

  const summary = JSON.parse(await readFile(join(outDir, "summary.json"), "utf8"));
  assert.equal(summary.status, "dry-run");
  assert.equal(summary.commands.length, 3);
  assert.deepEqual(summary.commands.map((command) => command.phase), ["emmc", "emmc", "emmc"]);
  assert.equal(summary.commands.every((command) => command.skipped && command.ok), true);

  const environment = await readFile(join(outDir, "environment.txt"), "utf8");
  assert.match(environment, /Selected commands:/);
  assert.match(environment, /make emmc-proof/);

  const hash = await readFile(join(outDir, "emmc-image.sha256"), "utf8");
  assert.match(hash, /not generated/);

  const report = await readFile(join(outDir, "report.md"), "utf8");
  assert.match(report, /QEMU Benchmark Phase Report/);
  assert.match(report, /QEMU launch is not part of the default benchmark/);
});

test("QEMU benchmark runner plans virtualization matrix behind explicit flags", async () => {
  const outDir = join(repoRoot, "dist", "test-benchmark-qemu-phase-virt");
  await rm(outDir, { recursive: true, force: true });

  await execFileAsync(process.execPath, [
    "scripts/benchmark-qemu-phase.js",
    "--dry-run",
    "--include-docker",
    "--include-softmmu",
    "--out-dir",
    outDir,
  ], { cwd: repoRoot });

  const summary = JSON.parse(await readFile(join(outDir, "summary.json"), "utf8"));
  assert.equal(summary.status, "dry-run");
  assert.deepEqual(summary.plannedCommands.map((command) => command.id), [
    "emmc-proof-1",
    "verify-safe",
    "npm-test",
    "npm-build",
    "qemu-user-build",
    "softmmu-build",
    "docker-stress",
  ]);
  assert.equal(summary.commands.every((command) => command.skipped && command.ok), true);
});
