const OP_CHIRAL = "\u03bf";
const OP_CARDINAL = "\u039f";

const DELTA_CONSTANT = 0x5A3C;
const DELTA_PERIOD = 8;

let _computedSignature = null;

function getCanonicalPeriodSignature() {
  if (_computedSignature) return _computedSignature;
  const trace = deltaTrace(0, 8);
  _computedSignature = trace.map(v => v & 0x0F);
  return _computedSignature;
}

const LOWER_FACTORIAL_MAX = 8;
const UPPER_FACTORIAL_MIN = 9;
const UPPER_FACTORIAL_MAX = 12;

export function deltaTick(x) {
  const v = x & 0xFFFF;
  const rotl1 = ((v << 1) | (v >> 15)) & 0xFFFF;
  const rotl3 = ((v << 3) | (v >> 13)) & 0xFFFF;
  const rotr2 = ((v >> 2) | (v << 14)) & 0xFFFF;
  return (rotl1 ^ rotl3 ^ rotr2 ^ DELTA_CONSTANT) & 0xFFFF;
}

export function deltaTrace(seed, steps) {
  const result = [];
  let v = seed & 0xFFFF;
  for (let i = 0; i < steps; i++) {
    result.push(v);
    v = deltaTick(v);
  }
  return result;
}

export function deltaPeriodSignature(seed) {
  const seen = new Map();
  let v = seed & 0xFFFF;
  const sig = [];
  for (let i = 0; i < 64; i++) {
    if (seen.has(v)) {
      const cycleStart = seen.get(v);
      const period = i - cycleStart;
      return { signature: sig, cycleStart, period, cycleLength: sig.length - cycleStart };
    }
    seen.set(v, i);
    sig.push(v);
    v = deltaTick(v);
  }
  return { signature: sig, cycleStart: -1, period: -1, cycleLength: -1 };
}

export function isCanonicalTickSequence(sequence) {
  if (!Array.isArray(sequence) || sequence.length === 0) return false;
  const modSeq = sequence.map(v => v & 0x0F);
  const reference = getCanonicalPeriodSignature();
  for (let offset = 0; offset < reference.length; offset++) {
    let match = true;
    for (let i = 0; i < sequence.length && match; i++) {
      const refIdx = (offset + i) % reference.length;
      if (modSeq[i] !== reference[refIdx]) match = false;
    }
    if (match) return true;
  }
  return false;
}

export function isLowerStack(factorialLayer) {
  return factorialLayer >= 0 && factorialLayer <= LOWER_FACTORIAL_MAX;
}

export function isUpperStack(factorialLayer) {
  return factorialLayer >= UPPER_FACTORIAL_MIN && factorialLayer <= UPPER_FACTORIAL_MAX;
}

export function encodeLowerChirality(currentTick) {
  const parityEven = (currentTick & 1) === 0;
  return parityEven
    ? { chirality: "chiral", operator: OP_CHIRAL, stack: "lower" }
    : { chirality: "cardinal", operator: OP_CARDINAL, stack: "lower" };
}

export function encodeUpperChirality(currentTick) {
  const parityEven = (currentTick & 1) === 0;
  return parityEven
    ? { chirality: "bidi-left-to-right", direction: "ltr", stack: "upper" }
    : { chirality: "bidi-right-to-left", direction: "rtl", stack: "upper" };
}

export function evaluateAtomicDual(factorialLayer, currentTick) {
  const tickResult = deltaTick(currentTick);
  if (isLowerStack(factorialLayer)) {
    const chirality = encodeLowerChirality(currentTick);
    return { tickResult, chirality, stack: "lower", factorialLayer };
  }
  if (isUpperStack(factorialLayer)) {
    const chirality = encodeUpperChirality(currentTick);
    return { tickResult, chirality, stack: "upper", factorialLayer };
  }
  return { tickResult, chirality: null, stack: "unknown", factorialLayer };
}
