import type { GaugeName, OmiProjectionRef, ReceiptState } from '../narrative/narrativeTypes';

export type ClockState = {
  tick: number;
  m: bigint;
  t1: bigint;
  t2: bigint;
  t5: bigint;
  t6: bigint;
  A: number;
  B: number;
  cla: { S: number[]; Cout: number };
  ip4: string;
  ip6: string;
  cidr: { prefix: number; mask: string };
};

export const GAUGES: GaugeName[] = ['FS', 'GS', 'RS', 'US'];

export const RECEIPT_CANDIDATE_IMO = 'o---o/---/?receipt=candidate@3C@';

const CIDR_TABLE = [
  { prefix: 1, mask: '128.0.0.0' },
  { prefix: 2, mask: '192.0.0.0' },
  { prefix: 3, mask: '224.0.0.0' },
  { prefix: 4, mask: '240.0.0.0' },
  { prefix: 5, mask: '248.0.0.0' },
  { prefix: 6, mask: '252.0.0.0' },
  { prefix: 7, mask: '254.0.0.0' },
  { prefix: 8, mask: '255.0.0.0' }
];

export function composeOmiCarrier(value: string, length: number, handle: string, socket = '3C') {
  return `o---o/---/?v=${encodeCarrierValue(value)};l=${length};h=${encodeCarrierValue(handle)};b=beta1;s={4,3}@${socket}@`;
}

export function receiptCandidateImo() {
  return RECEIPT_CANDIDATE_IMO;
}

export function slot5040(value: number) {
  return ((Math.trunc(value) % 5040) + 5040) % 5040;
}

export function gaugeForIndex(index: number): GaugeName {
  return GAUGES[slot5040(index) % GAUGES.length];
}

export function sealedGaugeFor(gauge: GaugeName) {
  const seals: Record<GaugeName, string> = {
    FS: '0x0:o---o',
    GS: '0x1:/---/',
    RS: '0x2:?---?',
    US: '0x3:@---@'
  };
  return seals[gauge];
}

export function buildProjectionRef(options: {
  id: string;
  value: string;
  length?: number;
  handle: string;
  index: number;
  receiptState?: ReceiptState;
}): OmiProjectionRef {
  const gauge = gaugeForIndex(options.index);
  const slot = slot5040(options.index);
  return {
    id: options.id,
    dataOmi: composeOmiCarrier(options.value, options.length ?? options.value.length, options.handle),
    dataImo: receiptCandidateImo(),
    gauge,
    sealedGauge: sealedGaugeFor(gauge),
    word16: `0x${slot.toString(16).padStart(4, '0').toUpperCase()}`,
    carBase36: slot.toString(36).toUpperCase(),
    cdrBase64: safeBase64(`${options.value}:${options.handle}`).replaceAll('=', ''),
    slot5040: slot,
    receiptState: options.receiptState ?? 'candidate'
  };
}

export function computeClockState(tick: number): ClockState {
  const t = BigInt(tick);
  const m = t % 5040n;
  const t1 = rot(m, 1n, 7);
  const t2 = rot(t1, 2n, 15);
  const t3 = rot(t2, 3n, 60);
  const t4 = rot(t3, 4n, 120);
  const t5 = rot(t4, 5n, 240);
  const t6 = rot(t5, 6n, 360);
  const A = Number(rot(t1, 2n, 4) ^ rot(t1, 3n, 15)) & 0xf;
  const B = Number(rot(t2, 1n, 4) ^ rot(t2, 4n, 16)) & 0xf;
  const cla = cla4(A, B, 0);
  const ip4Seg = Number((t5 ^ 127n) & 127n);
  return {
    tick,
    m,
    t1,
    t2,
    t5,
    t6,
    A,
    B,
    cla,
    ip4: `${ip4Seg}.${Number(t1 & 255n)}.${Number(t2 & 255n)}.1`,
    ip6: toIPv6Short(t6),
    cidr: CIDR_TABLE[Number(t6 % 8n)]
  };
}

export function resolveURN(stateA: number, stateB: number, portId: number) {
  const P = [0, 1, 2, 3].map((i) => ((stateA >> i) & 1) ^ ((stateB >> i) & 1));
  const G = [0, 1, 2, 3].map((i) => ((stateA >> i) & 1) & ((stateB >> i) & 1));
  const Cin = portId & 1;
  const C0 = G[0] | (P[0] & Cin);
  const C1 = G[1] | (P[1] & G[0]) | (P[1] & P[0] & Cin);
  const C2 = G[2] | (P[2] & G[1]) | (P[2] & P[1] & G[0]) | (P[2] & P[1] & P[0] & Cin);
  const C3 = G[3] | (P[3] & G[2]) | (P[3] & P[2] & G[1]) | (P[3] & P[2] & P[1] & G[0]) | (P[3] & P[2] & P[1] & P[0] & Cin);
  const S = [P[0] ^ Cin, P[1] ^ C0, P[2] ^ C1, P[3] ^ C2];
  const nss = safeBase64(`p${portId}-s${stateB}`).slice(0, 12).replaceAll('=', '');
  return { urn: `urn:ietf:chiral:${nss}`, sum: S.join(''), executable: C3 === 1 };
}

export function safeBase64(value: string) {
  if (typeof btoa === 'function') {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  return Buffer.from(value, 'utf8').toString('base64');
}

function encodeCarrierValue(value: string) {
  return value.trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 48) || 'projection';
}

function rot(value: bigint | number, shift: bigint | number, width: number) {
  const mask = (1n << BigInt(width)) - 1n;
  const s = BigInt(shift) % BigInt(width);
  const x = BigInt(value) & mask;
  return s === 0n ? x : ((x << s) | (x >> (BigInt(width) - s))) & mask;
}

function cla4(A: number, B: number, Cin: number) {
  const bits = (i: number) => [((A >> i) & 1), ((B >> i) & 1)];
  const P = [0, 1, 2, 3].map((i) => bits(i)[0] ^ bits(i)[1]);
  const G = [0, 1, 2, 3].map((i) => bits(i)[0] & bits(i)[1]);
  const C0 = G[0] | (P[0] & Cin);
  const C1 = G[1] | (P[1] & G[0]) | (P[1] & P[0] & Cin);
  const C2 = G[2] | (P[2] & G[1]) | (P[2] & P[1] & G[0]) | (P[2] & P[1] & P[0] & Cin);
  const C3 = G[3] | (P[3] & G[2]) | (P[3] & P[2] & G[1]) | (P[3] & P[2] & P[1] & G[0]) | (P[3] & P[2] & P[1] & P[0] & Cin);
  return { S: [P[0] ^ Cin, P[1] ^ C0, P[2] ^ C1, P[3] ^ C2], Cout: C3 };
}

function toIPv6Short(value: bigint) {
  const hex = value.toString(16).padStart(32, '0');
  return `2001:db8::8:${hex.slice(24, 28)}`;
}
