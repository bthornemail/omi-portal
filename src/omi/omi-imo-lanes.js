export const LANE_WIDTHS = { u8: 8, u16: 16, u32: 32, u64: 64 };

export const LANE_COUNTS = { u8: 32, u16: 16, u32: 8, u64: 4 };

export function getLane(word, width, lane) {
  const w = BigInt(word);
  const bits = Number(width);
  const idx = Number(lane);
  const maxLane = 256 / bits;
  if (idx < 0 || idx >= maxLane) {
    throw new RangeError(`Lane ${idx} out of range for ${bits}-bit lanes ([0,${maxLane - 1}]])`);
  }
  const mask = (1n << BigInt(bits)) - 1n;
  const raw = (w >> BigInt(idx * bits)) & mask;
  return bits > 32 ? raw : Number(raw);
}

export function setLane(word, width, lane, value) {
  const w = BigInt(word);
  const bits = Number(width);
  const idx = Number(lane);
  const val = BigInt(value);
  const maxLane = 256 / bits;
  if (idx < 0 || idx >= maxLane) {
    throw new RangeError(`Lane ${idx} out of range for ${bits}-bit lanes ([0,${maxLane - 1}]])`);
  }
  const mask = (1n << BigInt(bits)) - 1n;
  const clamped = val & mask;
  const shift = BigInt(idx * bits);
  const cleared = w & ~(mask << shift);
  return cleared | (clamped << shift);
}

export function getU8(word, lane) {
  return getLane(word, 8, lane);
}

export function getU16(word, lane) {
  return getLane(word, 16, lane);
}

export function getU32(word, lane) {
  return getLane(word, 32, lane);
}

export function getU64(word, lane) {
  return getLane(word, 64, lane);
}

export function setU8(word, lane, value) {
  return setLane(word, 8, lane, value);
}

export function setU16(word, lane, value) {
  return setLane(word, 16, lane, value);
}

export function setU32(word, lane, value) {
  return setLane(word, 32, lane, value);
}

export function setU64(word, lane, value) {
  return setLane(word, 64, lane, value);
}

export function lanes(word, width) {
  const bits = Number(width);
  const count = 256 / bits;
  const w = BigInt(word);
  const mask = (1n << BigInt(bits)) - 1n;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(Number((w >> BigInt(i * bits)) & mask));
  }
  return result;
}

export function forEachLane(word, width, fn) {
  const bits = Number(width);
  const count = 256 / bits;
  const w = BigInt(word);
  const mask = (1n << BigInt(bits)) - 1n;
  for (let i = 0; i < count; i++) {
    fn(i, Number((w >> BigInt(i * bits)) & mask));
  }
}
