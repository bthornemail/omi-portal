// ── FNV-1a 32-bit ──────────────────────────────────────────────

export function fnv1a32(str) {
  let hash = 0x811C9DC5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
    hash >>>= 0;
  }
  return hash >>> 0;
}

// ── Deterministic peer order ───────────────────────────────────

export function deterministicPeerOrder(peerIds, round = 0, seed = 0) {
  const ids = [...peerIds];
  const keyed = ids.map(id => ({
    id,
    order: fnv1a32(`${id}:${round}:${seed}`),
  }));
  keyed.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return String(a.id).localeCompare(String(b.id));
  });
  return keyed.map(k => k.id);
}

// ── Deterministic HNSW level assignment ────────────────────────

export function deterministicLayerAssignment(nodeId, vector, M, levelMult = 1 / Math.LN2) {
  const vecHash = fnv1a32(vector.map(v => Math.round(v * 1e6).toString()).join('|'));
  const idHash = fnv1a32(String(nodeId));
  const combined = fnv1a32(`${idHash}:${vecHash}`);
  const r = combined / 0xFFFFFFFF;
  return Math.floor(-Math.log(1 - r + 1e-10) * levelMult * M);
}

// ── Canonical fragment sort ────────────────────────────────────

export function canonicalFragmentSort(fragments) {
  return [...fragments].sort((a, b) => {
    const cwCmp = String(a.codewordId || '').localeCompare(String(b.codewordId || ''));
    if (cwCmp !== 0) return cwCmp;
    const avv = JSON.stringify(a.versionVector || {});
    const bvv = JSON.stringify(b.versionVector || {});
    return avv.localeCompare(bvv);
  });
}

// ── Stable JSON (deterministic keys) ──────────────────────────

export function stableJson(value) {
  return JSON.stringify(value, (_, v) => {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      return Object.keys(v).sort().reduce((acc, k) => { acc[k] = v[k]; return acc; }, {});
    }
    return v;
  });
}

// ── Deterministic clock (tick-based) ────────────────────────────

export function deterministicClock(seedTick = 0) {
  let tick = seedTick >>> 0;
  return {
    now() { return tick; },
    advance(n = 1) { tick = (tick + n) >>> 0; return tick; },
    reset(t) { tick = (t !== undefined ? t : seedTick) >>> 0; },
  };
}
