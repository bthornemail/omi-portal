import { test } from "node:test";
import { strict as assert } from "node:assert";
import { OmiSexagesimalKernel } from "../src/omi/sexagesimal-kernel.js";

const BASE = "omi-0064-ff9b-0000-0000-0000-0000-0000-0000/96";

test("reciprocal pairs 1-2 and 2-1 evaluate to the same slot", () => {
  const kernel = new OmiSexagesimalKernel(new SharedArrayBuffer(5040 * 8));

  const alpha = kernel.car(kernel.evaluateProjectiveSuffix(`${BASE}/1-2`));
  const beta = kernel.car(kernel.evaluateProjectiveSuffix(`${BASE}/2-1`));

  assert.equal(alpha.valid, true);
  assert.equal(beta.valid, true);
  assert.equal(alpha.targetSlotOffset, beta.targetSlotOffset);
});

test("reciprocal pairs 10-1 and 1-10 evaluate to the same slot", () => {
  const kernel = new OmiSexagesimalKernel(new SharedArrayBuffer(5040 * 8));

  const alpha = kernel.car(kernel.evaluateProjectiveSuffix(`${BASE}/10-1`));
  const beta = kernel.car(kernel.evaluateProjectiveSuffix(`${BASE}/1-10`));

  assert.equal(alpha.valid, true);
  assert.equal(beta.valid, true);
  assert.equal(alpha.targetSlotOffset, beta.targetSlotOffset);
});

test("clock step suffix maps to sequential timeline slot", () => {
  const kernel = new OmiSexagesimalKernel(new SharedArrayBuffer(5040 * 8));
  const meta = kernel.car(kernel.evaluateProjectiveSuffix(`${BASE}/720`));

  assert.equal(meta.valid, true);
  assert.equal(meta.targetSlotOffset, 720);
  assert.equal(meta.isHardResetBoundary, false);
});

test("5040 suffix maps to slot zero and marks hard reset fence", () => {
  const kernel = new OmiSexagesimalKernel(new SharedArrayBuffer(5040 * 8));
  const meta = kernel.car(kernel.evaluateProjectiveSuffix(`${BASE}/5040`));

  assert.equal(meta.valid, true);
  assert.equal(meta.targetSlotOffset, 0);
  assert.equal(meta.isHardResetBoundary, true);
});

test("projective suffix rejects malformed values", () => {
  const kernel = new OmiSexagesimalKernel(new SharedArrayBuffer(5040 * 8));

  assert.equal(kernel.car(kernel.evaluateProjectiveSuffix("")).valid, false);
  assert.equal(kernel.car(kernel.evaluateProjectiveSuffix(`${BASE}`)).valid, false);
  assert.equal(kernel.car(kernel.evaluateProjectiveSuffix(`${BASE}/1-0`)).valid, false);
  assert.equal(kernel.car(kernel.evaluateProjectiveSuffix(`${BASE}/-1-2`)).valid, false);
  assert.equal(kernel.car(kernel.evaluateProjectiveSuffix(`${BASE}/one`)).valid, false);
});
