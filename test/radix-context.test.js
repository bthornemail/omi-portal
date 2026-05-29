import { test } from "node:test";
import { strict as assert } from "node:assert";
import { OmiAxiomaticKernel } from "../src/omi/axiomatic-kernel.js";
import { join } from "node:path";

const BASE = "omi-ffff-0002-0000-000f-02d0-0036-0000-0000/96";

async function createLoadedKernel() {
  const kernel = new OmiAxiomaticKernel();
  await kernel.loadAxiomaticFile(join(process.cwd(), "RULES.omi"), kernel.rulesRegistry);
  return kernel;
}

test("radix suffix processes Chiron delimiter as stream opener", async () => {
  const kernel = await createLoadedKernel();
  const cell = kernel.decodeRadixSuffix(`${BASE}/\u03bfAAC_QEAAAL_AykAQA`);
  const meta = kernel.car(cell);

  assert.equal(meta.valid, true);
  assert.equal(meta.profile, "CHIRON_STREAM_OPENER");
  assert.equal(meta.cleanBase64Payload, "AAC_QEAAAL_AykAQA");
  assert.equal(meta.isUrlSafeCompliant, true);
});

test("radix suffix processes Cardinal delimiter as record terminator", async () => {
  const kernel = await createLoadedKernel();
  const cell = kernel.decodeRadixSuffix(`${BASE}/\u039fMzkAQA`);
  const meta = kernel.car(cell);

  assert.equal(meta.valid, true);
  assert.equal(meta.profile, "CARDINAL_RECORD_TERMINATOR");
  assert.equal(meta.cleanBase64Payload, "MzkAQA");
});

test("radix suffix rejects standard base64 characters after delimiter removal", async () => {
  const kernel = await createLoadedKernel();

  assert.equal(kernel.car(kernel.decodeRadixSuffix(`${BASE}/\u03bfAA+C`)).valid, false);
  assert.equal(kernel.car(kernel.decodeRadixSuffix(`${BASE}/\u039fAA/C`)).valid, false);
});

test("radix suffix requires compliant base address and omicron delimiter", async () => {
  const kernel = await createLoadedKernel();

  assert.equal(kernel.car(kernel.decodeRadixSuffix("omi-ffff-invalid/96/\u03bfAAAA")).valid, false);
  assert.equal(kernel.car(kernel.decodeRadixSuffix(`${BASE}/AAAA`)).valid, false);
});

test("axiomatic file loader accepts /96 suffix rule rows", async () => {
  const kernel = await createLoadedKernel();
  const key = "omi-0000-0000-0000-0000-0000-0000-0000-0000/96/5040";
  const rule = kernel.rulesRegistry.get(key);

  assert.ok(rule);
  assert.equal(rule.keyword, "MUST");
  assert.equal(rule.assignment, "hard-reset-fence");
});
