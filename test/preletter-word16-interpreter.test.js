import test from "node:test";
import assert from "node:assert/strict";
import {
  PRELETTER_NIBBLE_CARDS,
  PRELETTER_WORD16_MAX,
  PRELETTER_WORD16_MIN,
  decodeNibble,
  decodePreletterByte,
  decodePreletterWord16,
  encodePreletterByte,
  encodePreletterWord16,
  isPreletterWord16,
  preletterPageForOpcode,
} from "../src/omi/preletter-word16-interpreter.js";

test("pre-letter window spans 0x2000 through 0x2fff", () => {
  assert.equal(PRELETTER_WORD16_MIN, 0x2000);
  assert.equal(PRELETTER_WORD16_MAX, 0x2fff);
});

test("nibble card table defines sixteen interpreter cards", () => {
  assert.equal(PRELETTER_NIBBLE_CARDS.length, 16);
  assert.equal(PRELETTER_NIBBLE_CARDS.filter((card) => card.kind === "sealedGauge").length, 4);
  assert.equal(PRELETTER_NIBBLE_CARDS.filter((card) => card.kind === "projectivePlane").length, 6);
  assert.equal(PRELETTER_NIBBLE_CARDS.filter((card) => card.kind === "projectiveBridge").length, 2);
  assert.equal(PRELETTER_NIBBLE_CARDS.filter((card) => card.kind === "openGauge").length, 4);
});

test("decodeNibble maps sealed gauge cards", () => {
  assert.deepEqual(
    [0x0, 0x1, 0x2, 0x3].map((opcode) => decodeNibble(opcode).gauge),
    ["FS", "GS", "RS", "US"]
  );
  assert.equal(decodeNibble(0x0).kind, "sealedGauge");
  assert.equal(decodeNibble(0x3).kind, "sealedGauge");
});

test("decodeNibble maps projective plane rails and bridges", () => {
  assert.deepEqual(
    [0x4, 0x5, 0x6, 0x7, 0x8, 0x9].map((opcode) => decodeNibble(opcode).rail),
    ["2", "3", "4", "5", "6", "\u221E"]
  );
  assert.equal(decodeNibble(0xa).word16, 0xaa55);
  assert.equal(decodeNibble(0xa).from, "\u221E");
  assert.equal(decodeNibble(0xa).to, "finite");
  assert.equal(decodeNibble(0xb).word16, 0x55aa);
  assert.equal(decodeNibble(0xb).from, "finite");
  assert.equal(decodeNibble(0xb).to, "\u221E");
});

test("decodeNibble maps open gauge cards and preserves 0xc as openGauge(FS)", () => {
  assert.deepEqual(
    [0xc, 0xd, 0xe, 0xf].map((opcode) => decodeNibble(opcode).gauge),
    ["FS", "GS", "RS", "US"]
  );
  assert.equal(decodeNibble(0xc).kind, "openGauge");
  assert.equal(decodeNibble(0xc).gauge, "FS");
});

test("pre-letter byte encoder maps opcode to page byte", () => {
  assert.equal(preletterPageForOpcode(0x0), 0x20);
  assert.equal(preletterPageForOpcode(0xf), 0x2f);
  assert.equal(encodePreletterByte(0x0), 0x20);
  assert.equal(encodePreletterByte(0xf), 0x2f);
});

test("pre-letter byte decoder returns page opcode and card", () => {
  const first = decodePreletterByte(0x20);
  assert.equal(first.page, 0x20);
  assert.equal(first.opcode, 0x0);
  assert.equal(first.card.kind, "sealedGauge");
  assert.equal(first.card.gauge, "FS");

  const last = decodePreletterByte(0x2f);
  assert.equal(last.page, 0x2f);
  assert.equal(last.opcode, 0xf);
  assert.equal(last.card.kind, "openGauge");
  assert.equal(last.card.gauge, "US");
});

test("pre-letter byte decoder rejects non-window bytes", () => {
  assert.throws(() => decodePreletterByte(0x1f), RangeError);
  assert.throws(() => decodePreletterByte(0x30), RangeError);
});

test("pre-letter word16 encoder preserves page and carry boundaries", () => {
  assert.equal(encodePreletterWord16(0x0, 0x00), 0x2000);
  assert.equal(encodePreletterWord16(0x0, 0xff), 0x20ff);
  assert.equal(encodePreletterWord16(0xf, 0x00), 0x2f00);
  assert.equal(encodePreletterWord16(0xf, 0xff), 0x2fff);
});

test("pre-letter word16 decoder returns high-byte page low-byte carry and card", () => {
  const first = decodePreletterWord16(0x2000);
  assert.equal(first.word16, 0x2000);
  assert.equal(first.page, 0x20);
  assert.equal(first.opcode, 0x0);
  assert.equal(first.carry, 0x00);
  assert.equal(first.card.kind, "sealedGauge");
  assert.equal(first.card.gauge, "FS");

  const last = decodePreletterWord16(0x2fff);
  assert.equal(last.word16, 0x2fff);
  assert.equal(last.page, 0x2f);
  assert.equal(last.opcode, 0xf);
  assert.equal(last.carry, 0xff);
  assert.equal(last.card.kind, "openGauge");
  assert.equal(last.card.gauge, "US");
});

test("pre-letter word16 decoder rejects words outside 0x2000..0x2fff", () => {
  assert.throws(() => decodePreletterWord16(0x1fff), RangeError);
  assert.throws(() => decodePreletterWord16(0x3000), RangeError);
  assert.equal(isPreletterWord16(0x2000), true);
  assert.equal(isPreletterWord16(0x2fff), true);
  assert.equal(isPreletterWord16(0x1fff), false);
  assert.equal(isPreletterWord16(0x3000), false);
});

test("pre-letter encoders reject invalid opcode or carry values", () => {
  assert.throws(() => encodePreletterByte(-1), RangeError);
  assert.throws(() => encodePreletterByte(0x10), RangeError);
  assert.throws(() => encodePreletterWord16(0x0, -1), RangeError);
  assert.throws(() => encodePreletterWord16(0x0, 0x100), RangeError);
});
