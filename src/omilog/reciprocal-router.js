const REGULAR_DENOMINATORS = new Set([
  1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 60,
]);

const REPEATING_DENOMINATORS = new Set([
  7, 11, 13, 17, 19, 59, 61,
]);

const TWIN_PRIME_BOUNDARY = 60;
const TWIN_PRIME_LOWER = 59;
const TWIN_PRIME_UPPER = 61;

export function isRegularDenominator(n) {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) return false;
  if (REGULAR_DENOMINATORS.has(n)) return true;
  let x = n;
  while (x % 2 === 0) x /= 2;
  while (x % 3 === 0) x /= 3;
  while (x % 5 === 0) x /= 5;
  return x === 1;
}

export function isRepeatingDenominator(n) {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) return false;
  return REPEATING_DENOMINATORS.has(n);
}

export function evaluateFractionalGrade(denominator) {
  if (isRegularDenominator(denominator)) {
    return { grade: "regular", type: "finite", denominator, cadence: "stable" };
  }
  if (isRepeatingDenominator(denominator)) {
    const isTwinBoundary =
      denominator === TWIN_PRIME_LOWER || denominator === TWIN_PRIME_UPPER;
    return {
      grade: "repeating",
      type: "infinite",
      denominator,
      cadence: "replay",
      twinPrimeBoundary: isTwinBoundary,
    };
  }
  if (denominator > 60) {
    const n = denominator;
    const hasRegularFactor = (n % 2 === 0 || n % 3 === 0 || n % 5 === 0);
    const hasRepeatingFactor =
      (n % 7 === 0 || n % 11 === 0 || n % 13 === 0 ||
       n % 17 === 0 || n % 19 === 0 || n % 59 === 0 || n % 61 === 0);
    if (hasRepeatingFactor && !hasRegularFactor) {
      return { grade: "repeating", type: "infinite", denominator, cadence: "replay", twinPrimeBoundary: false };
    }
    if (hasRegularFactor && !hasRepeatingFactor) {
      return { grade: "regular", type: "finite", denominator, cadence: "stable" };
    }
  }
  return { grade: "unknown", type: "irrational", denominator, cadence: "unknown" };
}

export function processSynchronizedState(position, denominator) {
  const grade = evaluateFractionalGrade(denominator);
  const pos = ((position % denominator) + denominator) % denominator;
  const base = Math.floor(position / denominator);

  if (grade.grade === "regular") {
    return {
      ...grade,
      base,
      remainder: pos,
      state: "synchronized",
      route: "stable-sync",
      fraction: `${base};${("00" + Math.round((pos / denominator) * 60)).slice(-2)}`,
    };
  }

  if (grade.grade === "repeating") {
    const period = grade.denominator - 1;
    return {
      ...grade,
      base,
      remainder: pos,
      state: "cyclical",
      route: "replay-loop",
      period,
      fraction: `${base};${("00" + Math.round((pos / denominator) * 60)).slice(-2)}...`,
    };
  }

  return {
    ...grade,
    base,
    remainder: pos,
    state: "irrational",
    route: "irrational-mode",
    fraction: `${base};??`,
  };
}

export function computeReciprocalProduct(numerator, denominator) {
  const grade = evaluateFractionalGrade(denominator);
  if (grade.grade === "regular") {
    const result = numerator / denominator;
    const sexagesimal = Math.round(result * 60);
    return { result, sexagesimal: `${Math.floor(result)};${("00" + (sexagesimal % 60)).slice(-2)}`, grade };
  }
  if (grade.grade === "repeating") {
    const result = numerator / denominator;
    const sexagesimalApprox = Math.round((result % 1) * 60);
    return { result, sexagesimalApprox: `${Math.floor(result)};${("00" + sexagesimalApprox).slice(-2)}...`, grade, repeating: true };
  }
  return { result: numerator / denominator, grade };
}

export class OmiReciprocalRouter {
  constructor() {
    this.synchronizedPositions = new Map();
  }

  route(position, denominator) {
    const state = processSynchronizedState(position, denominator);
    const key = `${denominator}`;
    if (!this.synchronizedPositions.has(key)) {
      this.synchronizedPositions.set(key, []);
    }
    this.synchronizedPositions.get(key).push({ position, timestamp: Date.now(), state: state.state });
    return state;
  }

  getHistory(denominator) {
    return this.synchronizedPositions.get(`${denominator}`) || [];
  }

  reset() {
    this.synchronizedPositions.clear();
  }
}
