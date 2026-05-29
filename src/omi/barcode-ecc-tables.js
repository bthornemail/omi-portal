export const BARCODE_FORMATS = Object.freeze({
  USS16K:  'uss-16k',
  BEETAG:  'beetag',
  MAXICODE: 'maxicode',
  AZTEC:   'aztec'
});

export const BARCODE_FORMAT_NAMES = Object.freeze([
  'uss-16k', 'beetag', 'maxicode', 'aztec'
]);

export const TWO_OF_FIVE_ENCODE = Object.freeze([
  0b11000, 0b10100, 0b10010, 0b10001,
  0b01100, 0b01010, 0b01001, 0b00110,
  0b00101, 0b00011
]);

const _twoOfFiveDecode = new Array(32).fill(-1);
_twoOfFiveDecode[0b11000] = 0; _twoOfFiveDecode[0b10100] = 1;
_twoOfFiveDecode[0b10010] = 2; _twoOfFiveDecode[0b10001] = 3;
_twoOfFiveDecode[0b01100] = 4; _twoOfFiveDecode[0b01010] = 5;
_twoOfFiveDecode[0b01001] = 6; _twoOfFiveDecode[0b00110] = 7;
_twoOfFiveDecode[0b00101] = 8; _twoOfFiveDecode[0b00011] = 9;
export const TWO_OF_FIVE_DECODE = Object.freeze(_twoOfFiveDecode);

export const TWO_OF_FIVE_WEIGHTS = Object.freeze(
  TWO_OF_FIVE_ENCODE.map(p => {
    let w = 0;
    for (let b = p; b; b >>= 1) w += b & 1;
    return w;
  })
);

export const TWO_OF_FIVE_PARITY = Object.freeze(
  TWO_OF_FIVE_ENCODE.map(p => {
    let w = 0;
    for (let b = p; b; b >>= 1) w ^= b & 1;
    return w;
  })
);

export const FORMAT_STRIDE_MAP = Object.freeze({
  0x13B0: BARCODE_FORMATS.USS16K,
  0x0078: BARCODE_FORMATS.BEETAG,
  0x02D0: BARCODE_FORMATS.MAXICODE
});

export const FORMAT_SEG5_MODULATION = Object.freeze({
  [BARCODE_FORMATS.MAXICODE]: {
    mask: 0x0001,
    map: { 0x0001: BARCODE_FORMATS.MAXICODE, 0x0000: BARCODE_FORMATS.AZTEC }
  }
});

const ECC_DATA = {
  [BARCODE_FORMATS.USS16K]: {
    segmentIndices: [4, 6, 7],
    eccMaskLow: 0x13B000000000FFFFn,
    eccMaskHigh: 0x0000FFFF00000000n,
    maxCorrectableBits: 2,
    syndromeTable: new Int8Array(65536).fill(-1),
    formatName: 'USS-16K / Code 16K',
    description: 'Stacked linear 1D — Pascal Triangle frame (stride 5040)'
  },
  [BARCODE_FORMATS.BEETAG]: {
    segmentIndices: [4, 5, 6],
    eccMaskLow: 0x0078000000000000n,
    eccMaskHigh: 0x0000000000000000n,
    maxCorrectableBits: 1,
    syndromeTable: new Int8Array(65536).fill(-1),
    formatName: 'BEEtag',
    description: '25-bit 5×5 matrix — 2-of-5 polyform cells (stride 120)'
  },
  [BARCODE_FORMATS.MAXICODE]: {
    segmentIndices: [4, 5, 6, 7],
    eccMaskLow: 0x02D000360000FFFFn,
    eccMaskHigh: 0x0000000000000000n,
    maxCorrectableBits: 2,
    syndromeTable: new Int8Array(65536).fill(-1),
    formatName: 'MaxiCode',
    description: '25-bit 5×5 matrix — 15-bit identity + 10-bit ECC (stride 720)'
  },
  [BARCODE_FORMATS.AZTEC]: {
    segmentIndices: [4, 5, 6, 7],
    eccMaskLow: 0x02D0000000000000n,
    eccMaskHigh: 0x0000000000000000n,
    maxCorrectableBits: 3,
    syndromeTable: new Int8Array(65536).fill(-1),
    formatName: 'Aztec Code',
    description: '2D spiral — 40-bit codepoint + RS ECC (stride 720, mod 0)'
  }
};

const ECC_BITBOARD_MASKS_DATA = {};

for (const [fmt, segs] of Object.entries({
  [BARCODE_FORMATS.USS16K]:  [0x0000, 0x0000, 0x0000, 0x0000, 0x13B0, 0x0036, 0x0000, 0x0000],
  [BARCODE_FORMATS.BEETAG]:  [0x0000, 0x0000, 0x0000, 0x0000, 0x0078, 0x0000, 0x0000, 0x0000],
  [BARCODE_FORMATS.MAXICODE]: [0x0000, 0x0000, 0x0000, 0x0000, 0x02D0, 0x0001, 0x0000, 0x0000],
  [BARCODE_FORMATS.AZTEC]:   [0x0000, 0x0000, 0x0000, 0x0000, 0x02D0, 0x0000, 0x0000, 0x0000]
})) {
  let lo = 0n;
  for (let i = 0; i < 4; i++) lo = (lo << 16n) | BigInt(segs[i]);
  let hi = 0n;
  for (let i = 4; i < 8; i++) hi = (hi << 16n) | BigInt(segs[i]);
  ECC_BITBOARD_MASKS_DATA[fmt] = { low: lo, high: hi };
  ECC_DATA[fmt].eccMaskLow = lo;
  ECC_DATA[fmt].eccMaskHigh = hi;
}

const GF256_EXP = new Uint16Array(512);
const GF256_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    const next = (x << 1) ^ x;
    x = next;
    if (x & 0x100) x ^= 0x11B;
    x &= 0xFF;
  }
  for (let i = 255; i < 512; i++) GF256_EXP[i] = GF256_EXP[i - 255];
})();

export const GF256_TABLES = Object.freeze({
  exp: GF256_EXP,
  log: GF256_LOG,
  primitive: 0x11B,
  add: (a, b) => a ^ b,
  sub: (a, b) => a ^ b,
  mul: (a, b) => a === 0 || b === 0 ? 0 : GF256_EXP[GF256_LOG[a] + GF256_LOG[b]],
  div: (a, b) => b === 0 ? 0 : GF256_EXP[(GF256_LOG[a] - GF256_LOG[b] + 255) % 255],
  pow: (a, n) => a === 0 ? 0 : GF256_EXP[(GF256_LOG[a] * n) % 255],
  inv: a => a === 0 ? 0 : GF256_EXP[255 - GF256_LOG[a]]
});

export function rsGeneratorPoly(nsym) {
  const g = new Uint8Array(nsym + 1);
  g[0] = 1;
  for (let i = 0; i < nsym; i++) {
    for (let j = i; j >= 0; j--) {
      g[j + 1] = GF256_TABLES.add(g[j + 1], GF256_TABLES.mul(g[j], GF256_EXP[i]));
    }
  }
  return g;
}

export const RS_GENERATORS = Object.freeze({
  4:  rsGeneratorPoly(4),
  6:  rsGeneratorPoly(6),
  8:  rsGeneratorPoly(8),
  10: rsGeneratorPoly(10),
  12: rsGeneratorPoly(12)
});

export const AZTEC_CODEWORD_SIZES = Object.freeze({
  1:  6, 2: 6, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8,
  9:  10, 10: 10, 11: 10, 12: 10, 13: 10, 14: 10,
  15: 10, 16: 10, 17: 10, 18: 10, 19: 10, 20: 10,
  21: 10, 22: 10, 23: 12, 24: 12, 25: 12, 26: 12,
  27: 12, 28: 12, 29: 12, 30: 12, 31: 12, 32: 12
});

export const AZTEC_RS_CORRECTION = Object.freeze({
  1:  3, 2:  5, 3:  6, 4:  8, 5:  8, 6: 10,
  7: 10, 8: 12, 9: 12, 10: 14, 11: 14, 12: 16,
  13: 18, 14: 18, 15: 20, 16: 20, 17: 22, 18: 22,
  19: 24, 20: 24, 21: 26, 22: 26, 23: 28, 24: 28,
  25: 30, 26: 30, 27: 32, 28: 32, 29: 34, 30: 34,
  31: 36, 32: 36
});

const HAMMING1510_ENCODE_TABLE = new Uint16Array(1024);
const HAMMING1510_DECODE_CORRECTED = new Uint16Array(32768);
const HAMMING1510_DECODE_ERROR_BIT = new Int8Array(32768);
const HAMMING1510_DECODE_DATA = new Int16Array(32768);
(() => {
  HAMMING1510_DECODE_ERROR_BIT.fill(-1);
  HAMMING1510_DECODE_DATA.fill(-1);

  const DATA_POS = [3, 5, 6, 7, 9, 10, 11, 12, 13, 14];
  const PARITY_POS = [1, 2, 4, 8];
  const ALL_POS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  for (let d = 0; d < 1024; d++) {
    let cw = 0;
    for (let i = 0; i < 10; i++) {
      if ((d >> i) & 1) cw |= 1 << DATA_POS[i];
    }
    let p1 = 0, p2 = 0, p4 = 0, p8 = 0;
    for (let i = 0; i < 10; i++) {
      if (!((d >> i) & 1)) continue;
      const pos = DATA_POS[i];
      if (pos & 1) p1 ^= 1;
      if (pos & 2) p2 ^= 1;
      if (pos & 4) p4 ^= 1;
      if (pos & 8) p8 ^= 1;
    }
    if (p1) cw |= (1 << 1);
    if (p2) cw |= (1 << 2);
    if (p4) cw |= (1 << 4);
    if (p8) cw |= (1 << 8);
    HAMMING1510_ENCODE_TABLE[d] = cw;
  }

  for (let cw = 0; cw < 32768; cw++) {
    let bestDist = Infinity;
    let bestData = -1;
    for (let d = 0; d < 1024; d++) {
      const valid = HAMMING1510_ENCODE_TABLE[d];
      let diff = cw ^ valid;
      let dist = 0;
      while (diff) { dist += diff & 1; diff >>= 1; }
      if (dist < bestDist) {
        bestDist = dist;
        bestData = d;
        if (bestDist === 0) break;
      }
    }
    HAMMING1510_DECODE_DATA[cw] = bestData;
    HAMMING1510_DECODE_CORRECTED[cw] = HAMMING1510_ENCODE_TABLE[bestData];
    HAMMING1510_DECODE_ERROR_BIT[cw] = bestDist === 0 ? -1 : (bestDist <= 1 ? (() => {
      const diff = cw ^ HAMMING1510_ENCODE_TABLE[bestData];
      for (let b = 0; b < 15; b++) if ((diff >> b) & 1) return b;
      return -1;
    })() : -1);
  }
})();

export const HAMMING1510_TABLES = Object.freeze({
  encode: (data) => {
    const d = data & 0x3FF;
    return HAMMING1510_ENCODE_TABLE[d];
  },
  decode: (codeword) => {
    const cw = codeword & 0x7FFF;
    const data = HAMMING1510_DECODE_DATA[cw];
    const errBit = HAMMING1510_DECODE_ERROR_BIT[cw];
    return {
      data: data < 0 ? -1 : data,
      corrected: errBit >= 0,
      errorBit: errBit
    };
  }
});

export const USS16K_CHARSET = Object.freeze([
  0x6B, 0x6A, 0x69, 0x68, 0x67, 0x66, 0x65, 0x64,
  0x63, 0x62, 0x61, 0x60, 0x5F, 0x5E, 0x5D, 0x5C,
  0x5B, 0x5A, 0x59, 0x58, 0x57, 0x56, 0x55, 0x54,
  0x53, 0x52, 0x51, 0x50, 0x4F, 0x4E, 0x4D, 0x4C,
  0x4B, 0x4A, 0x49, 0x48, 0x47, 0x46, 0x45, 0x44,
  0x43, 0x42, 0x41, 0x40
]);

export const USS16K_START_PATTERN = 0x6B;
export const USS16K_STOP_PATTERN = 0x6A;
export const USS16K_MODULO = 103;

export function detectBarcodeFormat(segments) {
  if (!segments || segments.length < 8) return null;
  const seg4 = segments[4] & 0xFFFF;
  const seg5 = segments[5] & 0xFFFF;

  const baseFormat = FORMAT_STRIDE_MAP[seg4];
  if (!baseFormat) return null;

  if (baseFormat === BARCODE_FORMATS.MAXICODE) {
    const mod = FORMAT_SEG5_MODULATION[BARCODE_FORMATS.MAXICODE];
    const subFormat = mod.map[seg5 & mod.mask];
    return subFormat || baseFormat;
  }

  return baseFormat;
}

export function getBarcodeFormatEccData(format) {
  return ECC_DATA[format] || null;
}

export function computeBitboardMasks(format, segments) {
  const ecc = ECC_DATA[format];
  if (!ecc) return null;

  let low = 0n;
  let high = 0n;
  const indices = ecc.segmentIndices;
  for (const idx of indices) {
    const val = BigInt(segments[idx] & 0xFFFF);
    if (idx < 4) {
      low |= val << BigInt((3 - idx) * 16);
    } else {
      high |= val << BigInt((7 - idx) * 16);
    }
  }
  return { low, high };
}

export const ECC_BITBOARD_MASKS = Object.freeze(
  Object.fromEntries(
    Object.entries(ECC_BITBOARD_MASKS_DATA).map(([k, v]) => [k, Object.freeze(v)])
  )
);

export const SEGMENT_TO_ECC_MASK = Object.freeze({
  0x13B0: { low: 0x0000000000000000n, high: 0x13B0003600000000n, format: BARCODE_FORMATS.USS16K },
  0x0078: { low: 0x0000000000000000n, high: 0x0078000000000000n, format: BARCODE_FORMATS.BEETAG },
  0x02D0: { low: 0x0000000000000000n, high: 0x02D0000000000000n, format: BARCODE_FORMATS.AZTEC }
});

export const FORMAT_SEGMENT_ROUTES = Object.freeze({
  [BARCODE_FORMATS.USS16K]:  { stride: 0x13B0, seg5: null,   seg6: 0x0036,  seg7: null },
  [BARCODE_FORMATS.BEETAG]:  { stride: 0x0078, seg5: null,   seg6: null,    seg7: null },
  [BARCODE_FORMATS.MAXICODE]: { stride: 0x02D0, seg5: 0x0001, seg6: 0x0036,  seg7: null },
  [BARCODE_FORMATS.AZTEC]:   { stride: 0x02D0, seg5: 0x0000, seg6: null,    seg7: null }
});
