import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { OmiAxiomaticKernel } from "../src/index.js";
import { OmiSexagesimalKernel } from "../src/omi/sexagesimal-kernel.js";

const BIN = join(process.cwd(), ".cache", "test_omi_c99_equiv");

function compileC99() {
  mkdirSync(join(process.cwd(), ".cache"), { recursive: true });
  const result = spawnSync("gcc", [
    "-O3",
    "-Wall",
    "-Wextra",
    "-std=c99",
    "src/omi/axiomatic.c",
    "test/test_axiomatic.c",
    "-o",
    BIN
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function runC99(token) {
  const result = spawnSync(BIN, [token], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const [valid, slot, hardReset, hasSuffix] = result.stdout.trim().split(/\s+/).map(Number);
  return {
    valid: valid === 1,
    targetSlotOffset: slot,
    isHardReset: hardReset === 1,
    hasProjectiveSuffix: hasSuffix === 1
  };
}

async function jsDecision(token) {
  const axiomatic = new OmiAxiomaticKernel();
  await axiomatic.loadAxiomaticFile("RULES.omi", axiomatic.rulesRegistry);

  let valid = axiomatic.verifyPacketCompliance(token);
  let targetSlotOffset = 0;
  let isHardReset = false;
  const hasProjectiveSuffix = token.split("/").length === 3;

  if (valid && hasProjectiveSuffix) {
    const sexagesimal = new OmiSexagesimalKernel(new SharedArrayBuffer(5040 * 8));
    const cell = sexagesimal.evaluateProjectiveSuffix(token);
    const meta = sexagesimal.car(cell);
    valid = meta.valid === true;
    targetSlotOffset = valid ? meta.targetSlotOffset : 0;
    isHardReset = valid ? meta.isHardResetBoundary : false;
  }

  return {
    valid,
    targetSlotOffset,
    isHardReset,
    hasProjectiveSuffix: valid ? hasProjectiveSuffix : false
  };
}

test("C99 validator mirrors JS axiomatic/projective decisions", async () => {
  compileC99();

  const fixtures = [
    "omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48",
    "omi-039f-0002-5a3c-000f-02d0-0036-0007-0001/48",
    "omi-0000-0000-invalid-0000-0000-0000-0000-0000/48",
    "omi-ffff-0002-1234-000f-02d0-0036-0000-0000/48",
    "omi-ffff-0002-0000-000f-9999-0036-0000-0000/48",
    "omi-ffff-0002-0000-000f-02d0-0037-0000-0000/48",
    "omi-ffff-0002-0000-000f-02d0-0036-0008-0000/48",
    "omi-ffff-0002-0000-000f-02d0-0036-0000-0002/48",
    "omi-0064-ff9b-0000-0000-0000-0000-0000-0000/96/720",
    "omi-0064-ff9b-0000-0000-0000-0000-0000-0000/96/5040",
    "omi-0064-ff9b-0000-0000-0000-0000-0000-0000/96/1-2",
    "omi-0064-ff9b-0000-0000-0000-0000-0000-0000/96/2-1",
    "omi-0064-ff9b-0000-0000-0000-0000-0000-0000/96/0-5",
    "omi-ffff-0002-0000-000f-9999-0036-0000-0000/96/720"
  ];

  for (const token of fixtures) {
    const js = await jsDecision(token);
    const c99 = runC99(token);
    assert.deepEqual(c99, js, token);
  }
});
