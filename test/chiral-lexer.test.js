import test from "node:test";
import assert from "node:assert/strict";
import { OmiSymmetricalChiralLexer } from "../src/omi/chiral-lexer.js";

const SAB = new SharedArrayBuffer(5040 * 8);

test("OmiSymmetricalChiralLexer initializes with mirror targets", () => {
  const lexer = new OmiSymmetricalChiralLexer(SAB);
  assert.equal(lexer.CANONICAL_ROOT, "omi-ffff-127-0-0-1");
  assert.equal(lexer.MIRROR_TAIL, "1-0-0-721-ffff-imo");
});

test("evaluateChiralTapeStream approves symmetric omi-to-imo tape", () => {
  const lexer = new OmiSymmetricalChiralLexer(SAB);
  const mockB64 = "AADAPwAAAEAAAAC_AAAgQQ";
  const token = `omi-0x02-ffff-127-0-0-1-slot720-${mockB64}-1-0-0-721-ffff-imo`;

  const cell = lexer.evaluateChiralTapeStream(token);
  const header = lexer.car(cell);
  const payload = lexer.cdr(cell);

  assert.equal(header.valid, true);
  assert.equal(header.chiralityPolarity, "LEFT_SNUB_CHIRAL");
  assert.equal(header.metadata.addressSubnet, "ffff-127-0-0-1");
  assert.ok(payload instanceof Float32Array);
});

test("evaluateChiralTapeStream rejects tokens missing mirror tail", () => {
  const lexer = new OmiSymmetricalChiralLexer(SAB);
  const token = "omi-0x02-ffff-127-0-0-1-slot720-AAC_QEAAAL_AykAQA-broken-tail";
  const cell = lexer.evaluateChiralTapeStream(token);
  assert.equal(lexer.car(cell).valid, false);
});

test("evaluateChiralTapeStream rejects tokens missing omi prefix", () => {
  const lexer = new OmiSymmetricalChiralLexer(SAB);
  const token = "xyz-0x02-ffff-127-0-0-1-slot720-AAC_QEAAAL_AykAQA-1-0-0-721-ffff-imo";
  const cell = lexer.evaluateChiralTapeStream(token);
  assert.equal(lexer.car(cell).valid, false);
  assert.equal(lexer.car(cell).error, "Missing Start-of-Tape Prefix Code");
});

test("evaluateChiralTapeStream rejects empty input", () => {
  const lexer = new OmiSymmetricalChiralLexer(SAB);
  const cell = lexer.evaluateChiralTapeStream("");
  assert.equal(lexer.car(cell).valid, false);
});

test("decodePayloadBits produces Float32Array from base64", () => {
  const lexer = new OmiSymmetricalChiralLexer(SAB);
  const b64 = "AADAPwAAAEAAAAC_AAAgQQ";
  const arr = lexer.decodePayloadBits(b64);
  assert.ok(arr instanceof Float32Array);
  assert.equal(arr.length, 4);
  assert.equal(arr[0], 1.5);
});

test("evaluateChiralTapeStream returns right-chiral for odd opcode", () => {
  const lexer = new OmiSymmetricalChiralLexer(SAB);
  const mockB64 = "AADAPwAAAEAAAAC_AAAgQQ";
  const token = `omi-0x03-ffff-127-0-0-1-slot720-${mockB64}-1-0-0-721-ffff-imo`;
  const cell = lexer.evaluateChiralTapeStream(token);
  assert.equal(lexer.car(cell).valid, true);
  assert.equal(lexer.car(cell).chiralityPolarity, "RIGHT_ASYMMETRIC_DUAL");
});

test("cons / car / cdr lisp primitives", () => {
  const lexer = new OmiSymmetricalChiralLexer(SAB);
  const cell = lexer.cons({ a: 1 }, [2]);
  assert.equal(lexer.car(cell).a, 1);
  assert.deepEqual(lexer.cdr(cell), [2]);
});
