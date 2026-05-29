const SEGMENT_COUNT = 8;
const CHIRAL_DELIMITER = 0x03BF;
const CARDINAL_DELIMITER = 0x039F;
const S3_HIGH_MASK = 0x2B00;
const S4_HIGH_MASK = 0x2F00;
const S7_LOW_MASK = 0x00FF;

export function verifyInstructionLexer(S) {
  const L0 = S[0] >> 8;
  const L3 = S[3] & 0x00FF;
  const L4 = S[4] & 0x00FF;
  const L7 = S[7] >> 8;

  const E_var =
    (L0 - L3) ** 2 +
    (L3 - L4) ** 2 +
    (L4 - L7) ** 2;

  const E_const =
    (S[0] & 0x00FF) ** 2 +
    (S[1] - CHIRAL_DELIMITER) ** 2 +
    ((S[3] & 0xFF00) - S3_HIGH_MASK) ** 2 +
    ((S[4] & 0xFF00) - S4_HIGH_MASK) ** 2 +
    (S[6] - CARDINAL_DELIMITER) ** 2 +
    ((S[7] & 0x00FF) - S7_LOW_MASK) ** 2;

  return (E_var + E_const) === 0;
}

export function parseOmiAddressToSegments(address) {
  const parts = address.split('/')[0].split('-');
  if (parts.length < 9 || parts[0] !== 'omi') return null;
  const segs = new Uint16Array(SEGMENT_COUNT);
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const v = parseInt(parts[i + 1], 16);
    if (isNaN(v) || v < 0 || v > 0xFFFF) return null;
    segs[i] = v;
  }
  return segs;
}

export function makeOmiAddress(S) {
  const hex = Array.from(S, (v) => v.toString(16).padStart(4, '0'));
  return `omi-${hex.join('-')}/48`;
}

export const SEGMENT_LAYOUT = Object.freeze({
  S0: { role: 'LL00', lowByte: 0x00, highByte: 'LL' },
  S1: { role: 'chiral-delimiter', constant: CHIRAL_DELIMITER },
  S2: { role: 'free-variable-NNNN' },
  S3: { role: '2bLL', highByte: 0x2B, lowByte: 'LL' },
  S4: { role: '2fLL', highByte: 0x2F, lowByte: 'LL' },
  S5: { role: 'free-variable-MMMM' },
  S6: { role: 'cardinal-delimiter', constant: CARDINAL_DELIMITER },
  S7: { role: 'LLff', highByte: 'LL', lowByte: 0xFF }
});

export { CHIRAL_DELIMITER, CARDINAL_DELIMITER };
