import { vvCompare } from "./version-vector.js";

export function isCausallyClosed(fragmentSet, observedFragments) {
  const allAncestors = new Map();
  for (const f of observedFragments) {
    const key = fragmentKey(f);
    if (!allAncestors.has(key)) allAncestors.set(key, f);
  }
  for (const f of fragmentSet) {
    for (const ancestor of observedFragments) {
      if (ancestor.codewordId !== f.codewordId) continue;
      if (vvCompare(ancestor.versionVector, f.versionVector) === "before") {
        const ancKey = fragmentKey(ancestor);
        if (!fragmentSet.some((sf) => fragmentKey(sf) === ancKey)) return false;
      }
    }
  }
  return true;
}

export function causalClosure(fragmentSet, observedFragments) {
  const closure = [...fragmentSet];
  const seen = new Set(closure.map(fragmentKey));
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of closure) {
      for (const obs of observedFragments) {
        if (obs.codewordId !== f.codewordId) continue;
        if (vvCompare(obs.versionVector, f.versionVector) === "before") {
          const key = fragmentKey(obs);
          if (!seen.has(key)) {
            seen.add(key);
            closure.push(obs);
            changed = true;
          }
        }
      }
    }
  }
  return closure;
}

export function isRSSufficient(fragmentSet, k) {
  return fragmentSet.length >= k;
}

export function reconstructIfValid(fragmentSet, observedFragments, k, rsDecode) {
  if (!isCausallyClosed(fragmentSet, observedFragments)) {
    return { valid: false, reason: "not-causally-closed" };
  }
  if (!isRSSufficient(fragmentSet, k)) {
    return { valid: false, reason: "insufficient-fragments" };
  }
  try {
    const sorted = [...fragmentSet].sort((a, b) => a.fragmentIndex - b.fragmentIndex);
    const data = rsDecode(sorted.map((f) => f.data), sorted.map((f) => f.fragmentIndex), k, sorted[0].total);
    return { valid: true, data };
  } catch (err) {
    return { valid: false, reason: "rs-decode-failed", error: err.message };
  }
}

export function fragmentKey(fragment) {
  return `${fragment.codewordId}:${vvKey(fragment.versionVector)}:${fragment.fragmentIndex}`;
}

function vvKey(vector) {
  return Object.entries(vector).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}@${v}`).join(":");
}
