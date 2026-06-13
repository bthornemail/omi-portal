/**
 * OMI Compiled Carrier (256-bit omi---imo word).
 *
 * Canon:
 *   The 256-bit omi---imo word is the source.
 *   The notation mask chooses how it may be read.
 *   The active reading chooses the route.
 *   The receipt proves replay stability of that interpretation.
 *
 * Packing reduces values into the 256-bit omi---imo frame.
 * Validation rejects malformed words.
 * Projection never mutates the source frame.
 */
export const O_WORD_BITS = 256;
export const SELECTOR_BITS = 1;
export const PATH_BITS = 19;
export const SURFACE_BITS = 236;
export const SURFACE_IMPLICIT_LEAD = 1;

export const SELECTOR_MASK = (1n << BigInt(SELECTOR_BITS)) - 1n;
export const PATH_MASK = (1n << BigInt(PATH_BITS)) - 1n;
export const SURFACE_MASK = (1n << BigInt(SURFACE_BITS)) - 1n;

const SURFACE_SHIFT = BigInt(0);
export const PATH_SHIFT = BigInt(SURFACE_BITS);
export const SELECTOR_SHIFT = BigInt(SURFACE_BITS + PATH_BITS);

export function packOWord({ selector, path, surface }) {
  const sel = BigInt(selector != null ? selector : 0) & SELECTOR_MASK;
  const pth = BigInt(path != null ? path : 0) & PATH_MASK;
  const surf = BigInt(surface != null ? surface : 0) & SURFACE_MASK;

  return (sel << SELECTOR_SHIFT) | (pth << PATH_SHIFT) | (surf << SURFACE_SHIFT);
}

export function unpackOWord(word) {
  const w = BigInt(word);
  const selector = Number((w >> SELECTOR_SHIFT) & SELECTOR_MASK);
  const path = Number((w >> PATH_SHIFT) & PATH_MASK);
  const surface = w & SURFACE_MASK;
  return { selector, path, surface };
}

export function assertOWord(word) {
  const w = BigInt(word);
  if (w < 0n) throw new RangeError("O-word cannot be negative");
  if (w > (1n << BigInt(O_WORD_BITS)) - 1n) {
    throw new RangeError(`O-word exceeds ${O_WORD_BITS} bits`);
  }
  return true;
}

export function oWordToHex(word) {
  const w = BigInt(word);
  return `0x${w.toString(16).padStart(64, "0")}`;
}

export function oWordFromHex(hex) {
  const h = String(hex).replace(/^0x/i, "");
  const w = BigInt(`0x${h}`);
  assertOWord(w);
  return w;
}

export function formatOWord(word) {
  const { selector, path, surface } = unpackOWord(word);
  return { selector, path, surface, hex: oWordToHex(word), bits: BigInt(word).toString(2).padStart(256, "0") };
}
