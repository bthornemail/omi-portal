export type TetragrammatronFactor = 'RULES' | 'FACTS' | 'CLOSURES' | 'COMBINATORS' | 'CONS';

export const TETRAGRAMMATRON_FACTORS: TetragrammatronFactor[] = [
  'RULES', 'FACTS', 'CLOSURES', 'COMBINATORS', 'CONS'
];

export interface RootedQuQuartInput {
  orientation60: number;
  phase4: 0 | 1 | 2 | 3;
  role3: 0 | 1 | 2;
  fano7: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export interface RootedQuQuartOutput {
  local240: number;
  slot5040: number;
  activeByte: number;
  receiptState: 'candidate';
}

export interface ClaDerivedInput {
  A: number;
  B: number;
  Cin: 0 | 1;
}

export interface Cla4Bit {
  A: number; B: number; Cin: number;
  P: number; G: number;
  carries: [number, number, number, number];
  sum: number; Cout: number;
}

export interface ByteAddressClassification {
  byte: number;
  activeBridge: boolean;
  reservedBand: boolean;
}

export interface ElevenCellWalkResult {
  path: number[];
  distances: number[];
  orientationStates: number[];
}

export interface ArchimedeanCatalanOutput {
  traversal: number;
  chiral: number;
  tangent: string;
  solidus: string;
}

export interface TwosComplementResult {
  delta: number;
  orientation: 'outward' | 'inward' | 'identity';
  overflow: boolean;
  signedDelta: number;
}

export interface QuQuartCarryResult {
  carry: number;
  propagate: number;
  sum: number;
}

export interface PsiInput {
  F1: number; W1: number; F2: number; W2: number;
  P: number; E: number; G: number; I: number;
  B: number; H: number; S: number;
}

export interface PsiOutput {
  receiptId: string;
  accepted: boolean;
  degree: number;
}

// ── Canonical entry point ─────────────────────────────────────

export function interpolateRootedQuQuart(input: RootedQuQuartInput): RootedQuQuartOutput {
  const local240 = input.phase4 * 60 + input.orientation60;
  const slot5040 = input.fano7 * 720 + input.role3 * 240 + local240;

  return {
    local240,
    slot5040,
    activeByte: local240,
    receiptState: 'candidate',
  };
}

// ── CLA compatibility bridge ──────────────────────────────────

export function deriveRootedQuQuartFromCla(input: ClaDerivedInput) {
  const cla = computeCla4Bit(input.A, input.B, input.Cin);
  const bytePair = ((input.A & 0x0F) << 4) | (input.B & 0x0F);
  const orientation60 = bytePair % 60;
  const phase4 = (cla.sum & 0b11) as 0 | 1 | 2 | 3;
  const role3 = ((cla.sum >> 2) % 3) as 0 | 1 | 2;
  const fano7 = ((input.A * 3 + input.B * 5 + input.Cin) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  return { orientation60, phase4, role3, fano7, cla };
}

// ── Byte address classification ───────────────────────────────

export function classifyByteAddress(byte: number): ByteAddressClassification {
  const b = byte & 0xFF;
  return {
    byte: b,
    activeBridge: b >= 0 && b < 240,
    reservedBand: b >= 240 && b <= 255,
  };
}

// ── Binary Quadratic Differential ─────────────────────────────

export function binaryQuadraticDifferential(x: number, y: number): number {
  return 60 * x * x + 16 * x * y + 4 * y * y;
}

// ── Difference of squares & gnomon ────────────────────────────

export function differenceOfSquares(a: number, b: number): number {
  return a * a - b * b;
}

export interface GnomonMetrics {
  differenceOfSquares: number;
  sum: number;
  difference: number;
  bridgeRectangle: number;
  width: number;
}

export function gnomonMetrics(a: number, b: number): GnomonMetrics {
  const larger = Math.max(a, b);
  const smaller = Math.min(a, b);
  const differenceOfSquares = larger * larger - smaller * smaller;
  const sum = larger + smaller;
  const difference = larger - smaller;
  const bridgeRectangle = sum * difference;
  const width = difference;
  return { differenceOfSquares, sum, difference, bridgeRectangle, width };
}

// ── Precision shell (2¹¹ / 2¹⁰) ──────────────────────────────

export function precisionShellMetrics(source: number, reading: number) {
  const shell = 2048;
  const surface = 1024;
  const anchor = (source & reading) !== 0 ? 'omi---imo' : 'o---o';
  return { shell, surface, anchor };
}

// ── 11-cell orientation ───────────────────────────────────────

export function elevenCellOrientation(vertex: number, cell: number): number {
  const v = Math.abs(vertex) % 11;
  const c = Math.abs(cell) % 11;
  return (v * 7 + c * 13 + v * c) % 60;
}

export function walkElevenCellShell(startVertex: number, steps: number): ElevenCellWalkResult {
  const path: number[] = [startVertex % 11];
  const distances: number[] = [];
  const orientationStates: number[] = [];

  for (let i = 0; i < steps; i++) {
    const current = path[path.length - 1];
    const next = (current + (i % 5) + 1) % 11;
    path.push(next);
    const distance = Math.abs(current - next);
    distances.push(distance);
    const orientation = (current * 7 + next * 13) % 60;
    orientationStates.push(orientation);
  }

  return { path, distances, orientationStates };
}

// ── Archimedean / Catalan coordination ────────────────────────

export function archimedeanCatalanCoordination(
  archimedeanSurface: number,
  catalanDual: number,
  omiPoint: number,
): ArchimedeanCatalanOutput {
  const traversal = (archimedeanSurface * Math.abs(omiPoint)) % 60;
  const chiral = (catalanDual * Math.abs(omiPoint)) % 60;
  const tangent = `o---o:${(omiPoint & 0xFF).toString(16).padStart(2, '0')}`;
  const solidus = `${tangent}/${traversal.toString(16).toUpperCase()}`;
  return { traversal, chiral, tangent, solidus };
}

// ── Two's-complement geometry ─────────────────────────────────

export function twosComplementGeometry(
  a: number,
  b: number,
  bits: number = 4,
): TwosComplementResult {
  const mask = (1 << bits) - 1;
  const delta = (b - a) & mask;
  const half = 1 << (bits - 1);
  const signedDelta = delta >= half ? delta - (1 << bits) : delta;

  let orientation: 'outward' | 'inward' | 'identity';
  if (signedDelta > 0) orientation = 'outward';
  else if (signedDelta < 0) orientation = 'inward';
  else orientation = 'identity';

  const overflow = Math.abs(signedDelta) >= half;

  return { delta, orientation, overflow, signedDelta };
}

// ── QuQuart 4-state carry/propagate ───────────────────────────

export function ququartCarryPropagate(
  p: number,
  g: number,
  cin: number,
): QuQuartCarryResult {
  const carry = g | (p & cin);
  const propagate = p & cin;
  const sum = p ^ cin;
  return { carry: carry & 1, propagate: propagate & 1, sum: sum & 1 };
}

// ── CLA 4-bit (preserved) ─────────────────────────────────────

export function computeCla4Bit(A: number, B: number, Cin: number): Cla4Bit {
  const a = A & 0x0F;
  const b = B & 0x0F;
  const cin = Cin & 1;

  const P = (a ^ b) & 0x0F;
  const G = (a & b) & 0x0F;

  const p = [(P >> 0) & 1, (P >> 1) & 1, (P >> 2) & 1, (P >> 3) & 1];
  const g = [(G >> 0) & 1, (G >> 1) & 1, (G >> 2) & 1, (G >> 3) & 1];

  const C1 = g[0] | (p[0] & cin);
  const C2 = g[1] | (p[1] & g[0]) | (p[1] & p[0] & cin);
  const C3 = g[2] | (p[2] & g[1]) | (p[2] & p[1] & g[0]) | (p[2] & p[1] & p[0] & cin);
  const C4 = g[3] | (p[3] & g[2]) | (p[3] & p[2] & g[1]) | (p[3] & p[2] & p[1] & g[0]) | (p[3] & p[2] & p[1] & p[0] & cin);

  const S0 = p[0] ^ cin;
  const S1 = p[1] ^ C1;
  const S2 = p[2] ^ C2;
  const S3 = p[3] ^ C3;
  const sum = (S3 << 3) | (S2 << 2) | (S1 << 1) | S0;

  return {
    A: a, B: b, Cin: cin,
    P, G,
    carries: [C1, C2, C3, C4],
    sum, Cout: C4,
  };
}

// ── ψ function (§31) ─────────────────────────────────────────

export function evaluatePsi(input: PsiInput): PsiOutput {
  const D2 = Math.abs((input.F1 + input.W1) - (input.F2 + input.W2));
  const Gpred = (D2 * input.G) & 0x0F;
  const Ipred = (Gpred + input.P + input.E) & 0x0F;
  const Bshell = (Ipred + input.B) % 60;
  const Hmeasure = (Bshell * input.H) % 10000;
  const Sdegree = Hmeasure % 60;
  const accepted = Sdegree % 2 === 0;

  const receiptId = [
    'receipt',
    input.F1.toString(16),
    input.F2.toString(16),
    Sdegree,
  ].join(':');

  return { receiptId, accepted, degree: Sdegree };
}

// ── Convenience: full rooted + ψ in one call ─────────────────

export function evaluateRootedPsi(
  rooted: RootedQuQuartInput,
  frames: { F1: number; W1: number; F2: number; W2: number },
) {
  const rootedOut = interpolateRootedQuQuart(rooted);
  const psi = evaluatePsi({
    F1: frames.F1,
    W1: frames.W1,
    F2: frames.F2,
    W2: frames.W2,
    P: rooted.phase4,
    E: rooted.orientation60 % 16,
    G: rooted.orientation60 >> 4,
    I: rooted.role3,
    B: rooted.orientation60,
    H: rootedOut.local240,
    S: rooted.role3,
  });
  return { rootedOut, psi };
}
