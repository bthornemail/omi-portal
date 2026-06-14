import { getInteriorCell } from "./polybius-ququart-frame.js";

export const CHANNEL_TO_QUQUART = Object.freeze({
  US: "Q0",
  GS: "Q1",
  RS: "Q2",
  FS: "Q3",
});

export const QUQUART_PHASE = Object.freeze({
  US: 0,
  GS: 1,
  RS: 2,
  FS: 3,
});

function stableHash32(text) {
  let h = 0x811c9dc5;
  for (const ch of String(text)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n) || 0));
}

function quantizeTinySignal(signal) {
  return Math.round(clamp(signal, -1, 1) * 127);
}

export function tetragrammatronRouteForNode(node, index, tinySignal = 0) {
  const channel = node.channel || "US";
  const phase4 = QUQUART_PHASE[channel] ?? 0;
  const qphase = CHANNEL_TO_QUQUART[channel] ?? "Q0";

  const relationCount = node.wordnet?.relationCount ?? 0;
  const stability = clamp(node.wordnet?.metric?.stability ?? 0, 0, 1);
  const signalBucket = quantizeTinySignal(tinySignal);

  const seed = stableHash32([
    "omi.tetragrammatron.route.v0",
    node.id,
    node.label,
    channel,
    node.controlCode,
    relationCount,
    node.wordnet?.cells?.canonical ?? "",
    signalBucket,
  ].join("|"));

  const orientation60 = seed % 60;
  const role3 = (relationCount + index) % 3;
  const fano7 = (seed + index + Math.round(stability * 60)) % 7;

  const local240 = phase4 * 60 + orientation60;
  const slot5040 = fano7 * 720 + role3 * 240 + local240;

  const local16 = orientation60 & 0x0f;
  const x = local16 & 3;
  const y = (local16 >> 2) & 3;
  const polybius = getInteriorCell(x, y);

  return Object.freeze({
    id: `tetragrammatron:${node.id}`,
    nodeId: node.id,
    term: node.label,
    channel,
    qphase,
    phase4,
    tinySignal,
    signalBucket,
    stability,
    relationCount,
    orientation60,
    role3,
    fano7,
    local240,
    slot5040,
    polybius: {
      ...polybius,
      origin: "o---o",
      x,
      y,
    },
    receiptState: "candidate",
  });
}
