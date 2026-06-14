/**
 * omi-pure-functions.mjs
 * Pure algorithmic kernel for OMI.
 *
 * Canon:
 *   Algorithms define the invariant.
 *   Artifacts are verifiable instances.
 *   Representations are projections.
 *
 * No DOM, no filesystem, no network, no ambient time, no randomness.
 * All functions are deterministic for the same inputs.
 */

export const OMI_RULE = "omi-0000-0000-0000-000b-0000-0000-0000-0000/48 MUST pos-part";

export const MASKS = Object.freeze({
  u4: 0x0f,
  u7: 0x7f,
  u8: 0xff,
  u10: 0x03ff,
  u16: 0xffff,
  u20: 0xfffff,
  u24: 0xffffff,
  u32: 0xffffffff,
});

export const BLOCK_73 = Object.freeze([0, 1, 3, 6, 9, 8, 6, 3]);
export const ORBIT_WIDTH_36 = 36;
export const BASE36_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const SELECTOR_16 = Object.freeze({
  0x0: "axioms",
  0x1: "rules",
  0x2: "facts",
  0x3: "closures",
  0x4: "combinators",
  0x5: "cons",
  0x6: "car",
  0x7: "cdr",
  0x8: "encode",
  0x9: "decode",
  0xA: "frame",
  0xB: "buffer",
  0xC: "file",
  0xD: "group",
  0xE: "record",
  0xF: "unit",
});

export const POS_PART_000B = Object.freeze({
  0x0000: "axiomatic-algorithms",
  0x0001: "logic-rules",
  0x0002: "configuration-facts",
  0x0003: "event-closures",
  0x0004: "intent-combinators",
  0x0005: "element-constructions",
  0x0006: "block-node",
  0x0007: "edge-node",
  0x0008: "graph-node",
  0x0009: "data-view",
  0x000A: "data-source",
  0x000B: "data-input",
  0x000C: "data-sink",
  0x000D: "data-output",
  0x000E: "done-statement",
  0x000F: "unit-boundary",
});

export const NOMOGRAM_0x30_0x3F = Object.freeze({
  0x30: "identity-index-unity-scale",
  0x31: "cd-logarithmic-multiply-divide-scale",
  0x32: "ab-square-square-root-scale",
  0x33: "k-cube-cube-root-scale",
  0x34: "folded-pi-scale",
  0x35: "inverse-reciprocal-scale",
  0x36: "sine-cosine-scale",
  0x37: "tangent-cotangent-scale",
  0x38: "small-angle-degree-radian-scale",
  0x39: "pythagorean-scale",
  0x3A: "common-log-power-of-ten-scale",
  0x3B: "natural-log-exp-scale",
  0x3C: "sexagesimal-circular-gate",
  0x3D: "roots-powers-arbitrary-exponent-scale",
  0x3E: "quadratic-proportion-gnomon-scale",
  0x3F: "lfsr-period-primitive-polynomial-scale",
});

export const OMI_GAUGE_ORBIT_0x40_0x4F = Object.freeze({
  0x40: "gauge-threshold-orbit-open",
  0x41: "lane-A",
  0x42: "lane-B-66-sentinel-echo",
  0x43: "lane-C-constant-carrier",
  0x44: "lane-D-delta-mnemonic",
  0x45: "lane-E-exponent-phase",
  0x46: "lane-F-frame-phase",
  0x47: "lane-G-gauge-phase",
  0x48: "lane-H-handoff",
  0x49: "period-prime-anchor-73",
  0x4A: "lane-J-join-phase",
  0x4B: "lane-K-ket-axis-phase",
  0x4C: "lane-L-loop-lfsr-phase",
  0x4D: "lane-M-matrix-phase",
  0x4E: "lane-N-nomogram-phase",
  0x4F: "lane-O-omicron-facing-closure",
});

export function assertInteger(name, value) {
  if (!Number.isInteger(value)) throw new TypeError(`${name} must be an integer`);
}

export function mask(width) {
  assertInteger("width", width);
  if (width <= 0 || width > 32) throw new RangeError("width must be 1..32");
  return width === 32 ? 0xffffffff : (1 << width) - 1;
}

export function u(width, x) {
  assertInteger("x", x);
  return x & mask(width);
}

export function rotl(x, k, width = 16) {
  assertInteger("k", k);
  const m = mask(width);
  const s = ((k % width) + width) % width;
  const v = x & m;
  return ((v << s) | (v >>> (width - s))) & m;
}

export function rotr(x, k, width = 16) {
  assertInteger("k", k);
  const m = mask(width);
  const s = ((k % width) + width) % width;
  const v = x & m;
  return ((v >>> s) | (v << (width - s))) & m;
}

export function delta(x, C = 0x5A3C, width = 16) {
  const m = mask(width);
  return (rotl(x, 1, width) ^ rotl(x, 3, width) ^ rotr(x, 2, width) ^ (C & m)) & m;
}

export function deltaOrbit(seed, C = 0x5A3C, width = 16, limit = 1 << 16) {
  let x = seed & mask(width);
  const seen = new Map();
  const values = [];
  for (let i = 0; i <= limit; i++) {
    if (seen.has(x)) {
      return { preperiod: seen.get(x), period: i - seen.get(x), values };
    }
    seen.set(x, i);
    values.push(x);
    x = delta(x, C, width);
  }
  return { preperiod: -1, period: -1, values };
}

export function hammingDistance(a, b) {
  let x = (a ^ b) >>> 0;
  let c = 0;
  while (x) {
    x &= x - 1;
    c++;
  }
  return c;
}

export function onesComplement(x, width = 16) {
  return (~x) & mask(width);
}

export function twosComplementNegate(x, width = 16) {
  return ((~x) + 1) & mask(width);
}

export function highNibble(byte) {
  return (byte >>> 4) & 0x0f;
}

export function lowNibble(byte) {
  return byte & 0x0f;
}

export function byteFromNibbles(high, low) {
  return ((high & 0x0f) << 4) | (low & 0x0f);
}

export function twoCubeMirror(byte) {
  return byteFromNibbles(lowNibble(byte), highNibble(byte));
}

export function twoCubeDelta(byte) {
  return (byte ^ twoCubeMirror(byte)) & 0xff;
}

export function isDiagonalByte(byte) {
  return highNibble(byte) === lowNibble(byte);
}

export function local240(byte) {
  const b = byte & 0xff;
  if (isDiagonalByte(b)) return -1;
  const h = highNibble(b);
  const l = lowNibble(b);
  return h * 15 + (l < h ? l : l - 1);
}

export function byteFromLocal240(index) {
  assertInteger("index", index);
  if (index < 0 || index >= 240) throw new RangeError("local240 index must be 0..239");
  const h = Math.floor(index / 15);
  const r = index % 15;
  const l = r < h ? r : r + 1;
  return byteFromNibbles(h, l);
}

export function gaugeCell16xy(row, x, y) {
  return ((row & 0x0f) << 12) | ((x & 0x3f) << 6) | (y & 0x3f);
}

export function gaugeCell4y2(row, x, y) {
  return ((row & 0x03) << 8) | ((x & 0x0f) << 4) | (y & 0x0f);
}

export function decodeGaugeCell16xy(cell) {
  return {
    row: (cell >>> 12) & 0x0f,
    x: (cell >>> 6) & 0x3f,
    y: cell & 0x3f,
  };
}

export function decodeGaugeCell4y2(cell) {
  return {
    row: (cell >>> 8) & 0x03,
    x: (cell >>> 4) & 0x0f,
    y: cell & 0x0f,
  };
}

export function gaugeFoldWitness24(runtimeRow, bridgeRow, nomogramRow, orbitConstant, width = 24) {
  const m = mask(width);
  return (
    rotl(runtimeRow, 1, width) ^
    rotl(nomogramRow, 3, width) ^
    rotr(bridgeRow, 2, width) ^
    (orbitConstant & m)
  ) & m;
}

export function isSaturatedGaugeWitness24(witness) {
  return (witness & MASKS.u24) === MASKS.u24;
}

export function qxy(x, y) {
  return 60 * x * x + 16 * x * y + 4 * y * y;
}

export function qxyLocal240(x, y) {
  return qxy(x, y) % 240;
}

export function qxyRoot120(x, y) {
  return Math.floor(qxy(x, y) / 6);
}

export function base36Value(ch) {
  if (typeof ch !== "string" || ch.length !== 1) throw new TypeError("base36Value expects one character");
  const i = BASE36_ALPHABET.indexOf(ch.toUpperCase());
  if (i < 0) throw new RangeError("not a base36 character");
  return i;
}

export function base36Char(value) {
  assertInteger("value", value);
  if (value < 0 || value >= 36) throw new RangeError("base36 value must be 0..35");
  return BASE36_ALPHABET[value];
}

export function orbit36(position) {
  assertInteger("position", position);
  const quotient = Math.floor(position / ORBIT_WIDTH_36);
  const remainder = ((position % ORBIT_WIDTH_36) + ORBIT_WIDTH_36) % ORBIT_WIDTH_36;
  return { quotient, remainder, symbol: base36Char(remainder) };
}

export function block73Step(index) {
  return BLOCK_73[((index % BLOCK_73.length) + BLOCK_73.length) % BLOCK_73.length];
}

export function mixedEncode(value, radices) {
  assertInteger("value", value);
  if (value < 0) throw new RangeError("mixedEncode value must be >= 0");
  let v = value;
  const coords = [];
  for (const r of radices) {
    assertInteger("radix", r);
    if (r <= 1) throw new RangeError("radices must be > 1");
    coords.push(v % r);
    v = Math.floor(v / r);
  }
  coords.push(v);
  return coords;
}

export function mixedDecode(coords, radices) {
  if (coords.length !== radices.length + 1) throw new RangeError("coords length must equal radices length + 1");
  let v = coords[coords.length - 1];
  for (let i = radices.length - 1; i >= 0; i--) {
    const r = radices[i];
    const c = coords[i];
    assertInteger("coord", c);
    if (c < 0 || c >= r) throw new RangeError("coordinate outside radix");
    v = c + r * v;
  }
  return v;
}

export function unicodeDecompose(codepoint) {
  assertInteger("codepoint", codepoint);
  if (codepoint < 0 || codepoint > 0x10ffff) throw new RangeError("codepoint outside Unicode range");
  return { plane: Math.floor(codepoint / 0x10000), offset: codepoint & 0xffff };
}

export function unicodeCompose(plane, offset) {
  assertInteger("plane", plane);
  assertInteger("offset", offset);
  const cp = plane * 0x10000 + (offset & 0xffff);
  if (plane < 0 || plane > 16 || cp > 0x10ffff) throw new RangeError("invalid Unicode plane/offset");
  return cp;
}

export function utf16SurrogatePair(codepoint) {
  assertInteger("codepoint", codepoint);
  if (codepoint < 0x10000 || codepoint > 0x10ffff) throw new RangeError("codepoint must be supplementary");
  const u = codepoint - 0x10000;
  return {
    high: 0xd800 + ((u >>> 10) & 0x3ff),
    low: 0xdc00 + (u & 0x3ff),
  };
}

export function codepointFromSurrogates(high, low) {
  if (high < 0xd800 || high > 0xdbff) throw new RangeError("invalid high surrogate");
  if (low < 0xdc00 || low > 0xdfff) throw new RangeError("invalid low surrogate");
  return 0x10000 + (((high - 0xd800) << 10) | (low - 0xdc00));
}

export function isPrivateUseCodepoint(codepoint) {
  return (
    (codepoint >= 0xe000 && codepoint <= 0xf8ff) ||
    (codepoint >= 0xf0000 && codepoint <= 0xffffd) ||
    (codepoint >= 0x100000 && codepoint <= 0x10fffd)
  );
}

export function isUnicodeNoncharacter(codepoint) {
  if (codepoint < 0 || codepoint > 0x10ffff) return false;
  if (codepoint >= 0xfdd0 && codepoint <= 0xfdef) return true;
  return (codepoint & 0xfffe) === 0xfffe;
}

export function slot5040(fano7, role3, local) {
  if (fano7 < 0 || fano7 > 6) throw new RangeError("fano7 must be 0..6");
  if (role3 < 0 || role3 > 2) throw new RangeError("role3 must be 0..2");
  if (local < 0 || local > 239) throw new RangeError("local240 must be 0..239");
  return fano7 * 720 + role3 * 240 + local;
}

export function decodeSlot5040(slot) {
  assertInteger("slot", slot);
  if (slot < 0 || slot >= 5040) throw new RangeError("slot must be 0..5039");
  const fano7 = Math.floor(slot / 720);
  const rest = slot % 720;
  const role3 = Math.floor(rest / 240);
  const local240 = rest % 240;
  return { fano7, role3, local240 };
}

export function factorial(n) {
  assertInteger("n", n);
  if (n < 0) throw new RangeError("n must be >= 0");
  let v = 1;
  for (let i = 2; i <= n; i++) v *= i;
  return v;
}

export function envelopeMultiplier(n) {
  assertInteger("n", n);
  if (n < 8 || n > 12) throw new RangeError("n must be 8..12");
  let v = 1;
  for (let i = 8; i <= n; i++) v *= i;
  return v;
}

export function coordNFactorial(n, envelopeIndex, local5040) {
  const mult = envelopeMultiplier(n);
  const base = 7 * 3 * 240;
  if (local5040 < 0 || local5040 >= base) throw new RangeError("local5040 must be 0..5039");
  return envelopeIndex * base + local5040;
}

export function fanoLineOk(a, b, c) {
  return ((a ^ b ^ c) & 0x07) === 0;
}

export function expand7(x) {
  const v = x & MASKS.u7;
  const left = ((v << 1) | (v >>> 6)) & MASKS.u7;
  const right = ((v >>> 1) | ((v & 1) << 6)) & MASKS.u7;
  return (v | left | right) & MASKS.u7;
}

export function closure7(seed, lower = 0, upper = MASKS.u7) {
  if ((lower & upper) !== lower) throw new RangeError("lower must be contained in upper");
  let x = (seed | lower) & upper & MASKS.u7;
  for (;;) {
    const y = (expand7(x) | lower) & upper & MASKS.u7;
    if (y === x) return x;
    x = y;
  }
}

export function phase7(x) {
  return hammingDistance(x & MASKS.u7, 0) % 7;
}

export function carCdrCid(car, cdr) {
  return (car ^ cdr) & MASKS.u16;
}

export function verifyCarCdrCid(car, cdr, cid) {
  return carCdrCid(car, cdr) === (cid & MASKS.u16);
}

export function xor16(values) {
  let x = 0;
  for (const v of values) x ^= (v & MASKS.u16);
  return x & MASKS.u16;
}

export function parseHexWord(s) {
  if (!/^[0-9a-fA-F]{1,4}$/.test(s)) throw new RangeError("expected 1..4 hex digits");
  return parseInt(s, 16) & MASKS.u16;
}

export function parseOmiAddress(address) {
  const m = /^omi-([^/]+)\/([0-9]+)$/.exec(address);
  if (!m) throw new Error("expected omi-<segments>/<prefix>");
  const segments = m[1].split("-").map(parseHexWord);
  const prefix = Number(m[2]);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128) throw new RangeError("prefix must be 0..128");
  return { segments, prefix };
}

export function formatHex(value, width = 4) {
  return (value >>> 0).toString(16).padStart(width, "0");
}

export function formatOmiAddress(segments, prefix = 48) {
  if (!Array.isArray(segments) || segments.length !== 8) throw new RangeError("expected exactly 8 segments");
  return `omi-${segments.map((s) => formatHex(s & MASKS.u16, 4)).join("-")}/${prefix}`;
}

export function posPartName(value) {
  return POS_PART_000B[value & 0x000f] ?? "unknown-pos-part";
}

export function selectorName(nibble) {
  return SELECTOR_16[nibble & 0x0f];
}

export function nomogramName(scale) {
  return NOMOGRAM_0x30_0x3F[scale & 0xff] ?? "unknown-nomogram-scale";
}

export function orbitName(code) {
  return OMI_GAUGE_ORBIT_0x40_0x4F[code & 0xff] ?? "unknown-orbit-code";
}

/**
 * Pure structural projection placeholder.
 * The caller supplies a pure artifact object; this function only selects fields.
 */
export function projectArtifact(node, plane) {
  switch (plane) {
    case "FS": return node?.context ?? node?.fs ?? null;
    case "GS": return node?.group ?? node?.gs ?? null;
    case "RS": return node?.record ?? node?.rs ?? null;
    case "US": return node?.unit ?? node?.us ?? null;
    default: throw new RangeError("plane must be FS, GS, RS, or US");
  }
}

export function verifyPacketXor(payloadBytes, fingerprint16) {
  let x = 0;
  for (const b of payloadBytes) x ^= (b & 0xff);
  return (x & MASKS.u16) === (fingerprint16 & MASKS.u16);
}

export function dataViewHeader32(subpath, packetClass, axis, sign = 0) {
  return (
    (subpath & 0xffff) |
    ((packetClass & 0xff) << 16) |
    ((axis & 0x7f) << 24) |
    ((sign & 0x01) << 31)
  ) >>> 0;
}

export function decodeDataViewHeader32(word) {
  const w = word >>> 0;
  return {
    subpath: w & 0xffff,
    packetClass: (w >>> 16) & 0xff,
    axis: (w >>> 24) & 0x7f,
    sign: (w >>> 31) & 0x01,
  };
}

export function root16FromFragmentsXor(fragments) {
  // fragments: [{idx, car}] ; sorted/unique outside, deterministic inside.
  const sorted = [...fragments].sort((a, b) => a.idx - b.idx);
  return xor16(sorted.map((f) => f.car));
}

/**
 * Minimal pure GF(256) helpers for rs=gf256; polynomial 0x11d.
 * Used for deterministic root16 interpolation at x=0.
 */
export function gf256Mul(a, b, poly = 0x11d) {
  let aa = a & 0xff;
  let bb = b & 0xff;
  let p = 0;
  while (bb) {
    if (bb & 1) p ^= aa;
    aa <<= 1;
    if (aa & 0x100) aa ^= poly;
    bb >>>= 1;
  }
  return p & 0xff;
}

export function gf256Pow(a, e, poly = 0x11d) {
  let result = 1;
  let base = a & 0xff;
  let exp = e;
  while (exp > 0) {
    if (exp & 1) result = gf256Mul(result, base, poly);
    base = gf256Mul(base, base, poly);
    exp >>>= 1;
  }
  return result;
}

export function gf256Inv(a, poly = 0x11d) {
  if ((a & 0xff) === 0) throw new RangeError("GF(256) zero has no inverse");
  return gf256Pow(a, 254, poly);
}

export function gf256Div(a, b, poly = 0x11d) {
  return gf256Mul(a, gf256Inv(b, poly), poly);
}

export function gf256InterpolateAtZero(points, poly = 0x11d) {
  // points: [{x, y}] in GF(256), x must be nonzero and distinct.
  let acc = 0;
  for (let i = 0; i < points.length; i++) {
    const xi = points[i].x & 0xff;
    const yi = points[i].y & 0xff;
    let num = 1;
    let den = 1;
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const xj = points[j].x & 0xff;
      num = gf256Mul(num, xj, poly);       // 0 - xj == xj in characteristic 2
      den = gf256Mul(den, xi ^ xj, poly);  // xi - xj == xi ^ xj
    }
    acc ^= gf256Mul(yi, gf256Div(num, den, poly), poly);
  }
  return acc & 0xff;
}

export function root16FromFragmentsGF256(fragments, k, poly = 0x11d) {
  const chosen = [...fragments].sort((a, b) => a.idx - b.idx).slice(0, k);
  if (chosen.length < k) throw new RangeError("need at least k fragments");
  const highPoints = [];
  const lowPoints = [];
  for (const f of chosen) {
    const x = (f.idx + 1) & 0xff; // deterministic nonzero x-coordinate
    const car = f.car & MASKS.u16;
    highPoints.push({ x, y: (car >>> 8) & 0xff });
    lowPoints.push({ x, y: car & 0xff });
  }
  return ((gf256InterpolateAtZero(highPoints, poly) << 8) | gf256InterpolateAtZero(lowPoints, poly)) & MASKS.u16;
}

export function quotientTest(before, after) {
  // Pure helper: foundational iff canonical output changes.
  return Object.is(before, after) ? "projection-or-convenience" : "foundational";
}

export default Object.freeze({
  OMI_RULE,
  MASKS,
  BLOCK_73,
  BASE36_ALPHABET,
  SELECTOR_16,
  POS_PART_000B,
  NOMOGRAM_0x30_0x3F,
  OMI_GAUGE_ORBIT_0x40_0x4F,
  rotl,
  rotr,
  delta,
  deltaOrbit,
  hammingDistance,
  onesComplement,
  twosComplementNegate,
  highNibble,
  lowNibble,
  byteFromNibbles,
  twoCubeMirror,
  twoCubeDelta,
  local240,
  byteFromLocal240,
  gaugeCell16xy,
  gaugeCell4y2,
  decodeGaugeCell16xy,
  decodeGaugeCell4y2,
  gaugeFoldWitness24,
  isSaturatedGaugeWitness24,
  qxy,
  qxyLocal240,
  qxyRoot120,
  base36Value,
  base36Char,
  orbit36,
  block73Step,
  mixedEncode,
  mixedDecode,
  unicodeDecompose,
  unicodeCompose,
  utf16SurrogatePair,
  codepointFromSurrogates,
  isPrivateUseCodepoint,
  isUnicodeNoncharacter,
  slot5040,
  decodeSlot5040,
  factorial,
  envelopeMultiplier,
  coordNFactorial,
  fanoLineOk,
  expand7,
  closure7,
  phase7,
  carCdrCid,
  verifyCarCdrCid,
  xor16,
  parseOmiAddress,
  formatOmiAddress,
  posPartName,
  selectorName,
  nomogramName,
  orbitName,
  projectArtifact,
  verifyPacketXor,
  dataViewHeader32,
  decodeDataViewHeader32,
  root16FromFragmentsXor,
  gf256Mul,
  gf256Pow,
  gf256Inv,
  gf256Div,
  gf256InterpolateAtZero,
  root16FromFragmentsGF256,
  quotientTest,
});
