import { vvCompare, vvMerge } from "./version-vector.js";
import { isCausallyClosed, isRSSufficient } from "./causal-closure.js";

export class FragmentStore {
  constructor() {
    this._fragments = [];
  }

  put(fragment) {
    const required = { ...fragment };
    required.versionVector = { ...fragment.versionVector };
    const existing = this._fragments.find((f) =>
      f.codewordId === required.codewordId &&
      f.fragmentIndex === required.fragmentIndex &&
      vvCompare(f.versionVector, required.versionVector) === "equal"
    );
    if (existing) return false;
    this._fragments.push(required);
    return true;
  }

  get(codewordId) {
    return this._fragments.filter((f) => f.codewordId === codewordId);
  }

  getAll() {
    return [...this._fragments];
  }

  frontier() {
    const frontier = {};
    for (const f of this._fragments) {
      frontier[f.codewordId] = vvMerge(frontier[f.codewordId] || {}, f.versionVector);
    }
    return frontier;
  }

  missingFragments(frontier) {
    const missing = [];
    for (const [codewordId, remoteVV] of Object.entries(frontier)) {
      const local = this.get(codewordId);
      const localVV = this.frontier()[codewordId] || {};
      const cmp = vvCompare(localVV, remoteVV);
      if (cmp === "equal" || cmp === "after") continue;
      const fragmentVVs = new Set(local.map((f) => JSON.stringify(f.versionVector)));
      for (const f of local) {
        fragmentVVs.add(JSON.stringify(f.versionVector));
      }
      missing.push({ codewordId, localVV, remoteVV });
    }
    return missing;
  }

  isReconstructable(codewordId, k) {
    const fragments = this.get(codewordId);
    return isRSSufficient(fragments, k) && isCausallyClosed(fragments, this._fragments);
  }

  clear() {
    this._fragments = [];
  }

  get size() {
    return this._fragments.length;
  }
}

export function createFragmentStore() {
  return new FragmentStore();
}
