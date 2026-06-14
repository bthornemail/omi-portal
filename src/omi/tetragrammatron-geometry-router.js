import { getInteriorCell } from "./polybius-ququart-frame.js";

const QUQUART_PHASE = Object.freeze({ US: 0, GS: 1, RS: 2, FS: 3 });

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

// ── Hopf fibration projection ──────────────────────────────────

export function hopfDirection(q) {
  const w = Number(q.w) || 0;
  const x = Number(q.x) || 0;
  const y = Number(q.y) || 0;
  const z = Number(q.z) || 0;
  return {
    a: 2 * (x * z + w * y),
    b: 2 * (y * z - w * x),
    c: 1 - 2 * (x * x + y * y),
  };
}

// ── BQD: 60x² + 16xy + 4y² ─────────────────────────────────────

export function computeQxy(baseQ, fiberQ) {
  const x = baseQ >>> 0;
  const y = fiberQ >>> 0;
  return 60 * x * x + 16 * x * y + 4 * y * y;
}

// ── Resolve two-QuQuart route through 11-cell nomogram ─────────

export function resolveHopfQuQuartRoute(input) {
  const chart11 = (((input.chart11 % 11) + 11) % 11);
  const baseQ = (((input.baseQ % 4) + 4) % 4);
  const fiberQ = (((input.fiberQ % 4) + 4) % 4);
  const fano7 = (((input.fano7 % 7) + 7) % 7);
  const role3 = (((input.role3 % 3) + 3) % 3);
  const x = baseQ;
  const y = fiberQ;
  const qxy = computeQxy(x, y);
  const local240 = qxy % 240;
  const slot5040 = fano7 * 720 + role3 * 240 + local240;

  const theta = ((x + 0.5) / 4) * Math.PI;
  const phi = ((y + 0.5) / 4) * 2 * Math.PI;
  const halfTheta = theta / 2;
  const qw = Math.cos(halfTheta);
  const qx = Math.sin(halfTheta) * Math.cos(phi);
  const qy = Math.sin(halfTheta) * Math.sin(phi);
  const qz = 0;
  const direction = hopfDirection({ w: qw, x: qx, y: qy, z: qz });

  const local16 = local240 & 0x0f;
  const px = local16 & 3;
  const py = (local16 >> 2) & 3;
  const polybius = getInteriorCell(px, py);

  return Object.freeze({
    chart11,
    baseQ: x,
    fiberQ: y,
    fano7,
    role3,
    x,
    y,
    qxy,
    local240,
    slot5040,
    thrustDirection: Object.freeze(direction),
    fiberPhase: phi,
    quaternionCandidate: Object.freeze({ w: qw, x: qx, y: qy, z: qz }),
    polybius: Object.freeze({
      ...polybius,
      origin: "o---o",
      x: px,
      y: py,
    }),
    receiptState: "candidate",
  });
}

// ── Geometry route from node (no TinyNEAT dependency) ──────────

export function tetragrammatronGeometryRoute(node, index) {
  const channel = node.channel || "US";
  const baseQ = QUQUART_PHASE[channel] ?? 0;

  const relationCount = node.wordnet?.relationCount ?? 0;
  const stability = clamp(node.wordnet?.metric?.stability ?? 0, 0, 1);

  const fiberSeed = stableHash32([
    "omi.tetragrammatron.geometry.fiber.v0",
    node.id,
    node.label,
    relationCount,
    node.wordnet?.cells?.canonical ?? "",
  ].join("|"));
  const fiberQ = (fiberSeed + Math.round(stability * 60) + relationCount) % 4;

  const chartSeed = stableHash32([
    "omi.tetragrammatron.geometry.chart.v0",
    node.id,
    node.label,
    channel,
    node.controlCode,
  ].join("|"));
  const chart11 = chartSeed % 11;

  const roleSeed = stableHash32([
    "omi.tetragrammatron.geometry.role.v0",
    node.id,
    baseQ, fiberQ, chart11,
  ].join("|"));
  const role3 = roleSeed % 3;
  const fano7 = (roleSeed + relationCount) % 7;

  return resolveHopfQuQuartRoute({
    chart11,
    baseQ,
    fiberQ,
    fano7,
    role3,
  });
}
