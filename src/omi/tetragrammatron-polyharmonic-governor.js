const GOVERNOR_ORDER = Object.freeze(["FACTS", "RULES", "CLOSURES", "COMBINATORS", "CONS"]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export const TETRAGRAMMATRON_CLOCKS = deepFreeze({
  ATOMIC_LOGIC: {
    name: "Atomic Logic Clock",
    formerName: "Carry Clock",
    plane: "4y²",
    role: "low-plane carry, nibble, local cell exactness",
  },
  SPECTRAL_OBSERVER: {
    name: "Spectral Observer Clock",
    formerName: "Frame Clock",
    plane: "16xy",
    role: "bridge-plane projection and observer-frame comparison",
  },
  COSMIC_ORBIT: {
    name: "Cosmic Orbit Clock",
    formerName: "Phase Clock",
    plane: "60x²",
    role: "high-plane periodic orbit and block closure",
  },
});

export const TETRAGRAMMATRON_OFFSETS = deepFreeze([
  { mask: 0x0001, lane: "FS", role: "source/frame seed lane" },
  { mask: 0x0010, lane: "GS", role: "group/generator lane" },
  { mask: 0x0100, lane: "RS", role: "relation/receipt lane" },
  { mask: 0x1000, lane: "US", role: "unit/userspace lane" },
]);

export const POLYHARMONIC_GOVERNORS = deepFreeze({
  FACTS: {
    root: "FACTS.omi",
    exponent: -1,
    governor: "Harmonic Governor",
    role: "inverse ground and reciprocal constraint",
    question: "What must be true beneath the object?",
    inverseOf: "CONS",
  },
  RULES: {
    root: "RULES.omi",
    exponent: 0,
    governor: "Geometric / Genesis Governor",
    role: "equality pivot and hidden 5-cell center",
    question: "What relation permits the transformation?",
  },
  CLOSURES: {
    root: "CLOSURES.omi",
    exponent: 1,
    governor: "Arithmetic Governor",
    role: "sequential frame count and document clock",
    question: "Has the path completed in order?",
  },
  COMBINATORS: {
    root: "COMBINATORS.omi",
    exponent: 2,
    governor: "Quadratic Governor",
    role: "binary quadratic relation surface",
    question: "How do grounded terms compose?",
  },
  CONS: {
    root: "CONS.omi",
    exponent: 3,
    governor: "Cubic / Qubic Governor",
    role: "runtime object body and carrier extension",
    question: "What object has the relation become?",
    inverseOf: "FACTS",
  },
});

function normalizeGovernorId(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const upper = text.replace(/\.omi$/i, "").toUpperCase();
  return Object.hasOwn(POLYHARMONIC_GOVERNORS, upper) ? upper : null;
}

export function governorForRoot(rootName) {
  const key = normalizeGovernorId(rootName);
  return key ? POLYHARMONIC_GOVERNORS[key] : null;
}

export function governorForExponent(p) {
  const exponent = Number(p);
  if (!Number.isInteger(exponent)) return null;
  return GOVERNOR_ORDER
    .map((key) => POLYHARMONIC_GOVERNORS[key])
    .find((governor) => governor.exponent === exponent) ?? null;
}

export function offsetForLane(lane) {
  const key = String(lane ?? "").trim().toUpperCase();
  return TETRAGRAMMATRON_OFFSETS.find((offset) => offset.lane === key) ?? null;
}

export function isInverseGovernorPair(a, b) {
  const leftKey = normalizeGovernorId(a);
  const rightKey = normalizeGovernorId(b);
  if (!leftKey || !rightKey) return false;
  return POLYHARMONIC_GOVERNORS[leftKey].inverseOf === rightKey;
}

export function visibleTimingSurface() {
  const clockKeys = Object.keys(TETRAGRAMMATRON_CLOCKS);
  return deepFreeze({
    clockCount: clockKeys.length,
    offsetCount: TETRAGRAMMATRON_OFFSETS.length,
    governorCount: GOVERNOR_ORDER.length,
    surfaceCount: clockKeys.length * TETRAGRAMMATRON_OFFSETS.length * GOVERNOR_ORDER.length,
    clocks: clockKeys.map((key) => TETRAGRAMMATRON_CLOCKS[key].name),
    offsets: TETRAGRAMMATRON_OFFSETS.map((offset) => offset.lane),
    governors: [...GOVERNOR_ORDER],
    authority: "reference-only",
    note: "descriptive metadata; not validation authority",
  });
}
