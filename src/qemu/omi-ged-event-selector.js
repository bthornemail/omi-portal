export function maskForBit(bit) {
  if (!Number.isInteger(bit) || bit < 0 || bit > 31) {
    throw new RangeError(`invalid GED bit: ${bit}`);
  }
  return (1 << bit) >>> 0;
}

export function encodeSelector(bits) {
  let selector = 0;
  for (const bit of bits) selector = (selector | maskForBit(bit)) >>> 0;
  return selector >>> 0;
}

export function decodeSelector(selector) {
  const sel = Number(selector) >>> 0;
  const bits = [];
  for (let bit = 0; bit < 32; bit++) {
    if (((sel >>> bit) & 1) === 1) bits.push(bit);
  }
  return bits;
}

export function extractGaugeLane(selector) {
  const bits = (Number(selector) >>> 28) & 0x0f;
  if (bits === 0x01) return "FS";
  if (bits === 0x02) return "GS";
  if (bits === 0x04) return "RS";
  if (bits === 0x08) return "US";
  return null;
}
