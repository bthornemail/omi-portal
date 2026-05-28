import test from "node:test";
import assert from "node:assert/strict";
import { OmiBareMetalBootCompiler } from "../src/runtime/boot-compiler.js";

function mockBootSector() {
  const buf = new ArrayBuffer(512);
  const view = new DataView(buf);
  view.setUint16(510, 0xaa55, true);
  return buf;
}

function encodeFloats(values) {
  return Buffer.from(new Float32Array(values).buffer).toString("base64url");
}

test("OmiBareMetalBootCompiler requires valid SharedArrayBuffer", () => {
  assert.throws(() => new OmiBareMetalBootCompiler(null), TypeError);
  assert.throws(() => new OmiBareMetalBootCompiler(new ArrayBuffer(8)), TypeError);
  const sab = new SharedArrayBuffer(5040 * 8);
  assert.doesNotThrow(() => new OmiBareMetalBootCompiler(sab));
});

test("compileBootSector validates 512-byte payload", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiBareMetalBootCompiler(sab);
  assert.throws(() => compiler.compileBootSector(new ArrayBuffer(128)), /exactly 512/);
  assert.throws(() => compiler.compileBootSector(new ArrayBuffer(1024)), /exactly 512/);
});

test("compileBootSector rejects invalid 0xAA55 signature", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiBareMetalBootCompiler(sab);
  const buf = new ArrayBuffer(512);
  const view = new DataView(buf);
  view.setUint16(510, 0x0000, true);
  assert.throws(() => compiler.compileBootSector(buf), /not bootable/);
});

test("compileBootSector stores sector data at offset 64 in SAB", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiBareMetalBootCompiler(sab);
  const sectorBuf = mockBootSector();
  const u8 = new Uint8Array(sectorBuf);
  u8[0] = 0xeb;
  u8[1] = 0xfe;
  assert.equal(compiler.compileBootSector(sectorBuf), true);

  const stored = new Uint8Array(sab);
  assert.equal(stored[64], 0xeb);
  assert.equal(stored[65], 0xfe);
  assert.equal(stored[64 + 510], 0x55);
  assert.equal(stored[64 + 511], 0xaa);
});

test("readBootSector returns stored 512-byte block", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiBareMetalBootCompiler(sab);
  const sector = mockBootSector();
  compiler.compileBootSector(sector);
  const read = compiler.readBootSector();
  assert.equal(read.byteLength, 512);
  assert.equal(read[510], 0x55);
  assert.equal(read[511], 0xaa);
});

test("parseBootAddress returns null for non-omi strings", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiBareMetalBootCompiler(sab);
  assert.equal(compiler.parseBootAddress("garbage"), null);
  assert.equal(compiler.parseBootAddress(""), null);
});

test("parseBootAddress rejects external network paths", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiBareMetalBootCompiler(sab);
  const result = compiler.parseBootAddress("omi-8-ffff-10-0-0-1-0x7c00-0x7f00-NOUN");
  assert.equal(result.valid, false);
  assert.ok(result.error);
});

test("parseBootAddress recognizes boot sector lookup table range", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiBareMetalBootCompiler(sab);
  const result = compiler.parseBootAddress(
    "omi-ffff-127-0-0-1-0x7c00-0x7f00-NOUN"
  );
  assert.equal(result.valid, true);
  assert.equal(result.tier, "BOOT_SECTOR_LOOKUP_TABLE");
  assert.equal(result.bounds.startAddress, 0x7c00);
  assert.equal(result.bounds.endAddress, 0x7f00);
});

test("parseBootAddress recognizes extended execution surface range", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiBareMetalBootCompiler(sab);
  const result = compiler.parseBootAddress(
    "omi-ffff-127-0-0-1-0x7f01-0xaa55-VERB"
  );
  assert.equal(result.valid, true);
  assert.equal(result.tier, "EXTENDED_EXECUTION_SURFACE");
  assert.equal(result.bounds.startAddress, 0x7f01);
  assert.equal(result.bounds.endAddress, 0xaa55);
});

test("parseBootAddress yields unclassified for out-of-range addresses", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiBareMetalBootCompiler(sab);
  const result = compiler.parseBootAddress(
    "omi-ffff-127-0-0-1-0x0000-0x1000-NOUN"
  );
  assert.equal(result.valid, false);
  assert.equal(result.tier, "UNCLASSIFIED_VOLATILE_MEMORY");
});

test("parseBootAddress decodes payload coefficients", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiBareMetalBootCompiler(sab);
  const b64 = encodeFloats([1.5, 2, -0.5, 10]);
  const result = compiler.parseBootAddress(
    `omi-ffff-127-0-0-1-0x7f01-0xaa55-NOUN-VERB-SYM-slot720-${b64}`
  );
  assert.ok(result.coefficients);
  assert.equal(result.coefficients[0], 1.5);
  assert.equal(result.coefficients[1], 2);
});

test("cons/car/cdr primitives work", () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const compiler = new OmiBareMetalBootCompiler(sab);
  const cell = compiler.cons("mbr", "sector0");
  assert.equal(compiler.car(cell), "mbr");
  assert.equal(compiler.cdr(cell), "sector0");
});
