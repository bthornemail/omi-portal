const DELTA_C_CONSTANT = 0x5A3C;
const SEGMENT_COUNT = 8;
const CHIRAL_DELIMITER = 0x03BF;
const CARDINAL_DELIMITER = 0x039F;
const S3_HIGH_MASK = 0x2B00;
const S4_HIGH_MASK = 0x2F00;
const FANO_POINTS = 7;
const FANO_RESOLUTION_MAX = 15;
const ORBIT_PERIOD = 8;

export function deltaC(x, c = DELTA_C_CONSTANT) {
  const rotl1 = ((x << 1) | (x >> 15)) & 0xFFFF;
  const rotl3 = ((x << 3) | (x >> 13)) & 0xFFFF;
  const rotr2 = ((x >> 2) | (x << 14)) & 0xFFFF;
  return (rotl1 ^ rotl3 ^ rotr2 ^ c) & 0xFFFF;
}

export function generateDeltaCOrbit(seed, n = SEGMENT_COUNT, c = DELTA_C_CONSTANT) {
  const orbit = new Uint16Array(n);
  orbit[0] = seed & 0xFFFF;
  for (let i = 1; i < n; i++) {
    orbit[i] = deltaC(orbit[i - 1], c);
  }
  return orbit;
}

export function extractLL(S) {
  const L0 = S[0] >> 8;
  const L3 = S[3] & 0x00FF;
  const L4 = S[4] & 0x00FF;
  const L7 = S[7] >> 8;
  return {
    L0, L3, L4, L7,
    allEqual: L0 === L3 && L3 === L4 && L4 === L7,
    LL: L0
  };
}

export function isFanoPoint(LL) {
  return Number.isInteger(LL) && LL >= 1 && LL <= FANO_POINTS;
}

export function verifyOrbitLexer(S) {
  const { L0, L3, L4, L7 } = extractLL(S);

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
    ((S[7] & 0x00FF) - 0x00FF) ** 2;

  return E_var + E_const;
}

export function isOrbitLexerValid(S) {
  return verifyOrbitLexer(S) === 0;
}

export function fanoIntercept(a, b, c = DELTA_C_CONSTANT) {
  let x = a & 0xFFFF;
  let y = b & 0xFFFF;
  for (let i = 0; i < FANO_RESOLUTION_MAX; i++) {
    if (x === y) return i;
    x = deltaC(x, c);
    y = deltaC(y, c);
  }
  return -1;
}

export function fanoIntersectionPoint(LL1, LL2) {
  if (LL1 === LL2 || !isFanoPoint(LL1) || !isFanoPoint(LL2)) return 0;

  for (let i = 0; i < FANO_POINTS; i++) {
    if (FANO_LINES[LL1 - 1].points.includes(i + 1) &&
        FANO_LINES[LL2 - 1].points.includes(i + 1)) {
      return i + 1;
    }
  }
  return 0;
}

export function fanoResolutionSteps(LL1, LL2) {
  if (LL1 === LL2) return 0;
  if (!isFanoPoint(LL1) || !isFanoPoint(LL2)) return -1;
  return FANO_RESOLUTION_MAX;
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

export function orbitPhaseFromPosition(pos) {
  const epoch = Math.floor(pos / 36);
  const phase = pos % 36;
  return { epoch, phase };
}

export function deltaCEight(x, c = DELTA_C_CONSTANT) {
  let v = x & 0xFFFF;
  for (let i = 0; i < ORBIT_PERIOD; i++) {
    v = deltaC(v, c);
  }
  return v;
}

export function isPeriodEight(x, c = DELTA_C_CONSTANT) {
  return deltaCEight(x, c) === (x & 0xFFFF);
}

export function formatBitboard(S) {
  const hi = (BigInt(S[0]) << 48n) | (BigInt(S[1]) << 32n) |
             (BigInt(S[2]) << 16n) | BigInt(S[3]);
  const lo = (BigInt(S[4]) << 48n) | (BigInt(S[5]) << 32n) |
             (BigInt(S[6]) << 16n) | BigInt(S[7]);
  return { hi, lo };
}

export const FANO_LINES = Object.freeze([
  { id: 1, points: [1, 2, 3], name: 'chiral-cardinal-trace' },
  { id: 2, points: [1, 4, 5], name: 'service-bus-projection' },
  { id: 3, points: [1, 6, 7], name: 'factorial-sweep-line' },
  { id: 4, points: [2, 4, 6], name: 'inversion-mirror-bridge' },
  { id: 5, points: [2, 5, 7], name: 'erasure-coding-channel' },
  { id: 6, points: [3, 4, 7], name: 'gossip-frontier-path' },
  { id: 7, points: [3, 5, 6], name: 'anti-entropy-repair-arc' }
]);

export const SEGMENT_LAYOUT = Object.freeze({
  S0: { role: 'LL00', lowByte: 0x00, highByte: 'LL', fanoPosition: 'CBOS-BOM-origin' },
  S1: { role: 'chiral-delimiter', constant: CHIRAL_DELIMITER, symbol: 'ο' },
  S2: { role: 'free-variable-NNNN', type: 'payload-ray-x' },
  S3: { role: '2bLL-add', highByte: 0x2B, lowByte: 'LL', operator: '+' },
  S4: { role: '2fLL-div', highByte: 0x2F, lowByte: 'LL', operator: '/' },
  S5: { role: 'free-variable-MMMM', type: 'payload-ray-y' },
  S6: { role: 'cardinal-delimiter', constant: CARDINAL_DELIMITER, symbol: 'Ο' },
  S7: { role: 'LLff', highByte: 'LL', lowByte: 0xFF, fanoPosition: 'closure-boundary' }
});

export function extractTruthRow(S) {
  if (!isOrbitLexerValid(S)) return null;

  const LL = S[0] >> 8;
  const NN = S[2];
  const MM = S[5];

  return {
    LL,
    NN,
    MM,
    row: (BigInt(LL) << 32n) | (BigInt(NN) << 16n) | BigInt(MM),
    key: (LL * 0x100000000) + (NN * 0x10000) + MM
  };
}

export function fanoTruthResolver(LL, NN, MM) {
  if (!isFanoPoint(LL)) return -1;

  const C = (LL * 0x1337) & 0xFFFF;
  let state = NN & 0xFFFF;
  const target = MM & 0xFFFF;

  if (state === target) return 0;

  for (let step = 1; step <= 14; step++) {
    const rotl1 = ((state << 1) | (state >> 15)) & 0xFFFF;
    const rotl3 = ((state << 3) | (state >> 13)) & 0xFFFF;
    const rotr2 = ((state >> 2) | (state << 14)) & 0xFFFF;
    state = (rotl1 ^ rotl3 ^ rotr2 ^ C) & 0xFFFF;

    if (state === target) return step;
  }

  return -1;
}

export function fanoTruthResolverClassic(LL, NN, MM) {
  if (!isFanoPoint(LL)) return -1;

  const C_LL = DELTA_C_CONSTANT ^ (LL * 0x0101);
  let x = NN & 0xFFFF;
  const target = MM & 0xFFFF;

  for (let i = 0; i < FANO_RESOLUTION_MAX; i++) {
    if (x === target) return i;
    x = deltaC(x, C_LL);
  }
  return -1;
}

export function verifyTruthRow(S, resolver = fanoTruthResolver) {
  const row = extractTruthRow(S);
  if (!row) return false;
  const steps = resolver(row.LL, row.NN, row.MM);
  return steps >= 0 && steps < FANO_RESOLUTION_MAX;
}

export function deltaCOrbitDistance(a, b, c = DELTA_C_CONSTANT) {
  let x = a & 0xFFFF;
  const target = b & 0xFFFF;
  for (let i = 0; i < 65536; i++) {
    if (x === target) return i;
    x = deltaC(x, c);
  }
  return -1;
}

export const TRANSYLVANIA_PLANE_B = Object.freeze(
  FANO_LINES.map((line) => ({
    id: line.id + 7,
    points: line.points.map((p) => p + 7),
    name: `transylvania-plane-B-${line.name}`
  }))
);

export function transylvaniaTicketCount() {
  return FANO_LINES.length + TRANSYLVANIA_PLANE_B.length;
}

export function transylvaniaMatchTwo(winning) {
  const w = winning.slice().sort((a, b) => a - b);
  if (w.length !== 3) return null;
  if (w.some((v) => v < 1 || v > 14)) return null;

  const inA = w.filter((v) => v >= 1 && v <= 7);
  const inB = w.filter((v) => v >= 8 && v <= 14);

  const candidates = inA.length >= 2 ? FANO_LINES
    : inB.length >= 2 ? TRANSYLVANIA_PLANE_B
    : null;

  if (!candidates) return { match: false, reason: 'no-plane-has-two' };

  for (const line of candidates) {
    const matchCount = w.filter((v) => line.points.includes(v)).length;
    if (matchCount >= 2) {
      return { match: true, line: line.id, points: line.points };
    }
  }
  return { match: false, reason: 'no-line-covers-two' };
}

export const GENESIS_BOOT_ADDRESS = 0x7C00;
export const GENESIS_REPLAY_RING_INDEX = GENESIS_BOOT_ADDRESS % 5040;
export const GENESIS_EPOCH = GENESIS_REPLAY_RING_INDEX % 720;
const GENESIS_ORBIT_POS = GENESIS_EPOCH;
export const GENESIS_ORBIT_EPOCH = Math.floor(GENESIS_ORBIT_POS / 36);
export const GENESIS_ORBIT_PHASE = GENESIS_ORBIT_POS % 36;
export const GENESIS_B_DIGIT = [0, 1, 3, 6, 9, 8, 6, 3][GENESIS_ORBIT_PHASE % 8];

export function makeGenesisTarget(LL, NN = GENESIS_BOOT_ADDRESS) {
  if (!isFanoPoint(LL)) return null;
  const C = (LL * 0x1337) & 0xFFFF;
  const rotl1 = ((NN << 1) | (NN >> 15)) & 0xFFFF;
  const rotl3 = ((NN << 3) | (NN >> 13)) & 0xFFFF;
  const rotr2 = ((NN >> 2) | (NN << 14)) & 0xFFFF;
  return (rotl1 ^ rotl3 ^ rotr2 ^ C) & 0xFFFF;
}

export function makeGenesisFrame(LL, NN = GENESIS_BOOT_ADDRESS) {
  if (!isFanoPoint(LL)) return null;
  const MM = makeGenesisTarget(LL, NN);
  if (MM === null) return null;
  const S = new Uint16Array(SEGMENT_COUNT);
  S[0] = (LL << 8) | 0x00;
  S[1] = CHIRAL_DELIMITER;
  S[2] = NN & 0xFFFF;
  S[3] = 0x2B00 | (LL & 0xFF);
  S[4] = 0x2F00 | (LL & 0xFF);
  S[5] = MM;
  S[6] = CARDINAL_DELIMITER;
  S[7] = (LL << 8) | 0xFF;
  return { S, LL, NN, MM };
}

export const GENESIS_SEGMENTS = (() => {
  const frame = makeGenesisFrame(0x01, GENESIS_BOOT_ADDRESS);
  return frame ? frame.S : null;
})();

export function verifyInstructionPipeline(S) {
  const valid = isOrbitLexerValid(S);
  if (!valid) return { valid: false, reason: 'GATE_1_STRUCTURAL_MALFORMATION' };

  const LL = S[0] >> 8;
  const NN = S[2];
  const MM = S[5];

  const steps = fanoTruthResolver(LL, NN, MM);
  if (steps === -1) {
    return { valid: false, reason: 'GATE_2_RESOLUTION_DIVERGENCE' };
  }

  return {
    valid: true,
    receipt: {
      steps,
      epoch: S[0] & 0x00FF,
      packedRow: (BigInt(steps) << 40n) | (BigInt(LL) << 32n) |
                  (BigInt(NN) << 16n) | BigInt(MM),
      LL, NN, MM
    }
  };
}

export function computeBootRingIndex(bootAddress = GENESIS_BOOT_ADDRESS) {
  return (bootAddress & 0xFFFF) % 5040;
}

export function computeBootPhase(bootAddress = GENESIS_BOOT_ADDRESS) {
  const ringIndex = computeBootRingIndex(bootAddress);
  const epoch = ringIndex % 720;
  const { epoch: orbitEpoch, phase: orbitPhase } = orbitPhaseFromPosition(epoch);
  return { ringIndex, epoch, orbitEpoch, orbitPhase };
}

export function bootstrapSystemKernel(rawMemoryBuffer, byteOffset = GENESIS_BOOT_ADDRESS) {
  if (!rawMemoryBuffer || rawMemoryBuffer.byteLength < byteOffset + 16) {
    return { success: false, error: 'INSUFFICIENT_MEMORY' };
  }

  const bootSegments = new Uint16Array(rawMemoryBuffer, byteOffset, 8);

  const truthRow = extractTruthRow(bootSegments);
  if (!truthRow) {
    return { success: false, error: 'GATE_1_STRUCTURAL_MALFORMATION_AT_BOOT' };
  }

  const stepReceipt = fanoTruthResolver(truthRow.LL, truthRow.NN, truthRow.MM);
  if (stepReceipt === -1) {
    return { success: false, error: 'GATE_2_TRANSYLVANIA_DIVERGENCE_AT_BOOT' };
  }

  const phase = computeBootPhase(byteOffset);

  return {
    success: true,
    status: 'SYSTEM_FLOW_STATE_ACTIVE',
    lens: truthRow.LL,
    steps: stepReceipt,
    ringIndex: phase.ringIndex,
    epoch: phase.epoch,
    orbitEpoch: phase.orbitEpoch,
    orbitPhase: phase.orbitPhase,
    bDigit: [0, 1, 3, 6, 9, 8, 6, 3][phase.orbitPhase % 8],
    packedGenesis: truthRow.row
  };
}

export const SAB_BOOT_SLOT = 1504;

export { CHIRAL_DELIMITER, CARDINAL_DELIMITER, DELTA_C_CONSTANT,
         FANO_POINTS, FANO_RESOLUTION_MAX, ORBIT_PERIOD };
