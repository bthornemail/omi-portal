import test from "node:test";
import assert from "node:assert/strict";
import { OmiOmicronKernel, OmiOmicronCIDRKernel } from "../src/omi/omicron-kernel.js";

const SAB = new SharedArrayBuffer(5040 * 8);

test("recognizes omi- as readable alias", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const result = kernel.normalizeMnemonicString("omi-ffff-127--/48-0x01-mask0-slot720-AADAPwAAAEAAAAC_AAAgQQ-imo");
  assert.ok(result.startsWith("\u03bf"));
  assert.ok(!result.includes("omi-"));
  assert.ok(!result.endsWith("-imo"));
});

test("recognizes OMI- as uppercase alias maps to uppercase Ο", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const result = kernel.normalizeMnemonicString("OMI-ffff-127--/48-0x01-mask0-slot720-AADAPwAAAEAAAAC_AAAgQQ-IMO");
  assert.ok(result.startsWith("\u039f"));
  assert.ok(!result.includes("OMI-"));
});

test("recognizes -imo as readable mirror alias", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const result = kernel.normalizeMnemonicString("omi-ffff-127--/48-0x01-mask0-slot720-imo");
  assert.ok(!result.endsWith("-imo"));
});

test("recognizes ο as U+03BF operator", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const cell = kernel.evaluateOmicronTape("\u03bf-ffff-127--/48-0x01-mask0-slot720-AADAPwAAAEAAAAC_AAAgQQ");
  assert.equal(kernel.car(cell).valid, true);
  assert.equal(kernel.car(cell).operator, "CHIRAL_CBOS");
  assert.equal(kernel.car(cell).codepoint, "U+03BF");
});

test("recognizes Ο as U+039F operator", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const cell = kernel.evaluateOmicronTape("\u039f-ffff-127--/48-0x01-mask0-slot720-AADAPwAAAEAAAAC_AAAgQQ");
  assert.equal(kernel.car(cell).valid, true);
  assert.equal(kernel.car(cell).operator, "CARDINAL_CBOS");
  assert.equal(kernel.car(cell).codepoint, "U+039F");
});

test("classifies U+03BF as CHIRAL_CBOS", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const cell = kernel.evaluateOmicronTape("\u03bf-ffff-127--/48-0x01-mask0-slot0");
  assert.equal(kernel.car(cell).operator, "CHIRAL_CBOS");
});

test("classifies U+039F as CARDINAL_CBOS", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const cell = kernel.evaluateOmicronTape("\u039f-ffff-127--/48-0x01-mask0-slot0");
  assert.equal(kernel.car(cell).operator, "CARDINAL_CBOS");
});

test("does not expose truthTable as primary diagnostic", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const cell = kernel.evaluateOmicronTape("\u03bf-ffff-127--/48-0x01-mask0-slot0");
  const header = kernel.car(cell);
  assert.ok(header.hasOwnProperty("codepoint"));
  assert.equal(header.truthTable, undefined);
});

test("keeps 0x7C00 and 0x7F00 as boot memory boundaries", () => {
  const kernel = new OmiOmicronKernel(SAB);
  assert.equal(kernel.validateBootMemoryAddress("0x7C00"), "BOOT_SECTOR_LOOKUP_TABLE");
  assert.equal(kernel.validateBootMemoryAddress("0x7E50"), "BOOT_SECTOR_LOOKUP_TABLE");
  assert.equal(kernel.validateBootMemoryAddress("0x7F00"), "BOOT_SECTOR_LOOKUP_TABLE");
  assert.equal(kernel.validateBootMemoryAddress("0x7F01"), "EXTENDED_EXECUTION_SURFACE");
  assert.equal(kernel.validateBootMemoryAddress("0xAA55"), "EXTENDED_EXECUTION_SURFACE");
  assert.equal(kernel.validateBootMemoryAddress("0xAB00"), "OUT_OF_BOUNDS_VOLATILE_SPACE");
  assert.equal(kernel.validateBootMemoryAddress("invalid"), "INVALID_ADDRESS");
});

test("evaluates mask order correctly via maskN notation", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const cell = kernel.evaluateOmicronTape("\u03bf-ffff-127--/48-0x01-mask3-slot720-AADAPwAAAEAAAAC_AAAgQQ");
  assert.equal(kernel.car(cell).algebraic.polynomialOrderDegree, 3);
  assert.equal(kernel.car(cell).algebraic.isPhaseInverted, true);
});

test("rejects non-canonical prefix", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const cell = kernel.evaluateOmicronTape("xyz-ffff-127--/48-0x01-slot0");
  assert.equal(kernel.car(cell).valid, false);
  assert.equal(kernel.car(cell).error, "Missing Canonical Code-Point Operator");
});

test("rejects non-local address subnet", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const cell = kernel.evaluateOmicronTape("\u03bf-c0a8-0001-0001-0x01-slot0");
  assert.equal(kernel.car(cell).valid, false);
});

test("decodePayloadBits produces Float32Array", () => {
  const kernel = new OmiOmicronKernel(SAB);
  const b64 = "AADAPwAAAEAAAAC_AAAgQQ";
  const result = kernel.decodePayloadBits(b64);
  assert.ok(result instanceof Float32Array);
  assert.equal(result.length, 4);
  assert.equal(result[1], 2.0);
  assert.equal(result[2], -0.5);
  assert.equal(result[3], 10.0);
});

test("OmiOmicronCIDRKernel class is exported and constructable", () => {
  const kernel = new OmiOmicronCIDRKernel(SAB);
  assert.ok(kernel instanceof OmiOmicronCIDRKernel);
  const child = new OmiOmicronKernel(SAB);
  assert.ok(child instanceof OmiOmicronCIDRKernel);
  assert.ok(child instanceof OmiOmicronKernel);
});
