import { ACCEPTANCE_BRIDGE, GAUGE } from "./sealed-gauge-word.js";
import { railByte, word16 as railWord16 } from "./polybius-group-frame.js";

export const PRELETTER_PAGE_MIN = 0x20;
export const PRELETTER_PAGE_MAX = 0x2f;
export const PRELETTER_WORD16_MIN = 0x2000;
export const PRELETTER_WORD16_MAX = 0x2fff;
export const PRELETTER_CARRY_MIN = 0x00;
export const PRELETTER_CARRY_MAX = 0xff;

const INFINITY_RAIL = "\u221E";

function freezeCard(card) {
  return Object.freeze(card);
}

function gaugeCard(opcode, kind, gauge) {
  const record = GAUGE[gauge];
  return freezeCard({
    opcode,
    kind,
    gauge,
    mask: record.mask,
    token: record.token,
    role: record.role,
  });
}

function railCard(opcode, rail) {
  return freezeCard({
    opcode,
    kind: "projectivePlane",
    rail: String(rail),
    railByte: railByte(rail),
  });
}

function bridgeCard(opcode, from, to, word16) {
  return freezeCard({
    opcode,
    kind: "projectiveBridge",
    from,
    to,
    word16,
    acceptanceBridge: word16 === ACCEPTANCE_BRIDGE,
  });
}

export const PRELETTER_NIBBLE_CARDS = Object.freeze([
  gaugeCard(0x0, "sealedGauge", "FS"),
  gaugeCard(0x1, "sealedGauge", "GS"),
  gaugeCard(0x2, "sealedGauge", "RS"),
  gaugeCard(0x3, "sealedGauge", "US"),
  railCard(0x4, 2),
  railCard(0x5, 3),
  railCard(0x6, 4),
  railCard(0x7, 5),
  railCard(0x8, 6),
  railCard(0x9, INFINITY_RAIL),
  bridgeCard(0xa, INFINITY_RAIL, "finite", railWord16(INFINITY_RAIL, 2)),
  bridgeCard(0xb, "finite", INFINITY_RAIL, railWord16(2, INFINITY_RAIL)),
  gaugeCard(0xc, "openGauge", "FS"),
  gaugeCard(0xd, "openGauge", "GS"),
  gaugeCard(0xe, "openGauge", "RS"),
  gaugeCard(0xf, "openGauge", "US"),
]);

function parseNibble(opcode) {
  const value = Number(opcode);
  if (!Number.isInteger(value) || value < 0 || value > 0x0f) {
    throw new RangeError(`bad opcode: ${opcode}`);
  }
  return value;
}

function parseCarry(carry) {
  const value = Number(carry);
  if (!Number.isInteger(value) || value < PRELETTER_CARRY_MIN || value > PRELETTER_CARRY_MAX) {
    throw new RangeError(`bad carry: ${carry}`);
  }
  return value;
}

function parseByte(byte) {
  const value = Number(byte);
  if (!Number.isInteger(value) || value < 0x00 || value > 0xff) {
    throw new RangeError(`bad byte: ${byte}`);
  }
  return value;
}

function parseWord(word) {
  const value = Number(word);
  if (!Number.isInteger(value)) {
    throw new RangeError(`bad word16: ${word}`);
  }
  return value & 0xffff;
}

export function decodeNibble(opcode) {
  return PRELETTER_NIBBLE_CARDS[parseNibble(opcode)];
}

export function preletterPageForOpcode(opcode) {
  return PRELETTER_PAGE_MIN | parseNibble(opcode);
}

export function encodePreletterByte(opcode) {
  return preletterPageForOpcode(opcode);
}

export function decodePreletterByte(byte) {
  const page = parseByte(byte);
  if (page < PRELETTER_PAGE_MIN || page > PRELETTER_PAGE_MAX) {
    throw new RangeError(`not a pre-letter byte: 0x${page.toString(16)}`);
  }
  const opcode = page & 0x0f;
  return {
    page,
    opcode,
    card: decodeNibble(opcode),
  };
}

export function encodePreletterWord16(opcode, carry = 0) {
  return ((encodePreletterByte(opcode) << 8) | parseCarry(carry)) & 0xffff;
}

export function decodePreletterWord16(word) {
  const w = parseWord(word);
  const page = (w >>> 8) & 0xff;
  const carry = w & 0xff;

  if (page < PRELETTER_PAGE_MIN || page > PRELETTER_PAGE_MAX) {
    throw new RangeError(`not a pre-letter word16: 0x${w.toString(16)}`);
  }

  const opcode = page & 0x0f;
  const card = decodeNibble(opcode);

  return { word16: w, page, opcode, carry, card };
}

export function isPreletterWord16(word) {
  try {
    decodePreletterWord16(word);
    return true;
  } catch {
    return false;
  }
}
