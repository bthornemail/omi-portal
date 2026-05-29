import test from "node:test";
import assert from "node:assert/strict";
import { OmiLispKernel } from "../src/omi/lisp-kernel.js";

test("Lisp primitive cell constructors pair car and cdr values without bit loss", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiLispKernel(sab);

  const pair = kernel.cons("head_node", "tail_vector");
  assert.equal(kernel.car(pair), "head_node");
  assert.equal(kernel.cdr(pair), "tail_vector");
});

test("OmiLispKernel intercepts the 0! suffix and assigns an exact 1-unit memory weight", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiLispKernel(sab);

  const terminalTokenId = "omi-fano-p2-ffff-127-0-0-1-vau-nil-env-0!";
  const resultCell = kernel.evaluateLispToken(terminalTokenId);
  const header = kernel.car(resultCell);
  const payload = kernel.cdr(resultCell);

  assert.equal(header.isListTerminatorActive, true);
  assert.equal(header.structuralMemoryWeight, 1);
  assert.equal(payload, null);
});

test("OmiLispKernel treats non-terminating tokens as active lists with weight > 1", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiLispKernel(sab);

  const activeToken = "omi-fano-p1-ffff-127-0-0-1-hyp-slot720-AAC_QEAAAL_AykAQA";
  const resultCell = kernel.evaluateLispToken(activeToken);
  const header = kernel.car(resultCell);
  const payload = kernel.cdr(resultCell);

  assert.equal(header.isListTerminatorActive, false);
  assert.equal(header.structuralMemoryWeight, header.tokenCount * 4);
  assert.ok(Array.isArray(payload));
});

test("OmiLispKernel rejects non-omi prefixed strings", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiLispKernel(sab);

  const header = kernel.car(kernel.evaluateLispToken("foo-bar"));
  assert.equal(header.valid, false);
  assert.equal(header.message, "Invalid Prefix");
});

test("OmiLispKernel rejects empty string", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiLispKernel(sab);

  const header = kernel.car(kernel.evaluateLispToken(""));
  assert.equal(header.valid, false);
});

test("cons/car/cdr returns null for null cell", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiLispKernel(sab);

  assert.equal(kernel.car(null), null);
  assert.equal(kernel.cdr(null), null);
});
