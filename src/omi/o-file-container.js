import { assertOWord } from "./o-bitboard.js";

/**
 * .o File Container — ordered sequence of 256-bit omi---imo words.
 *
 * Canon:
 *   arbitrary precision = N × omi---imo[256]
 *   .o file = ordered sequence of 256-bit omi---imo words
 *
 * Binary layout: big-endian, most significant byte first.
 * Chain word order: big-endian (index 0 = most significant word).
 */

export function packOFile(words) {
  return words.map(w => BigInt(w).toString(16).padStart(64, "0")).join("\n");
}

export function unpackOFile(text) {
  const trimmed = String(text).trim();
  if (trimmed.length === 0) return [];
  return trimmed.split(/\s+/).map(h => {
    const hh = h.replace(/^0x/i, "");
    const w = BigInt(`0x${hh}`);
    assertOWord(w);
    return w;
  });
}

export function oFileToBinary(words) {
  const count = words.length;
  const buf = new Uint8Array(count * 32);
  for (let i = 0; i < count; i++) {
    const w = BigInt(words[i]);
    const offset = i * 32;
    for (let j = 0; j < 32; j++) {
      buf[offset + 31 - j] = Number((w >> BigInt(j * 8)) & 0xffn);
    }
  }
  return buf;
}

export function oFileFromBinary(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length % 32 !== 0) {
    throw new RangeError(`Binary .o length ${bytes.length} is not a multiple of 32 bytes`);
  }
  if (bytes.length === 0) return [];
  const count = Math.floor(bytes.length / 32);
  const words = [];
  for (let i = 0; i < count; i++) {
    const offset = i * 32;
    let w = 0n;
    for (let j = 0; j < 32; j++) {
      w = (w << 8n) | BigInt(bytes[offset + j]);
    }
    assertOWord(w);
    words.push(w);
  }
  return words;
}
