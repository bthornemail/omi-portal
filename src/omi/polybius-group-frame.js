export const RAIL = Object.freeze({
  2: 0x55,
  3: 0x66,
  4: 0x77,
  5: 0x88,
  6: 0x99,
  "\u221E": 0xAA,
});

const RAIL_BY_BYTE = Object.fromEntries(
  Object.entries(RAIL).map(([key, byte]) => [byte, key])
);

export function railByte(p) {
  if (RAIL[p] === undefined) {
    throw new RangeError(`invalid rail selector: ${p}`);
  }
  return RAIL[p];
}

export function word16(p, r) {
  return ((railByte(p) << 8) | railByte(r)) >>> 0;
}

export function interpretWord16(w16) {
  const value = Number(w16) >>> 0;
  const hi = (value >>> 8) & 0xff;
  const lo = value & 0xff;
  const p = RAIL_BY_BYTE[hi];
  const r = RAIL_BY_BYTE[lo];
  if (p === undefined || r === undefined) {
    return null;
  }
  return { p, r };
}
