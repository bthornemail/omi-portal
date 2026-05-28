export function createVersionVector(nodeId) {
  if (nodeId === undefined || nodeId === null) throw new TypeError("Version vector requires a node identifier");
  return { [String(nodeId)]: 0 };
}

export function vvIncrement(vector, nodeId) {
  const id = String(nodeId);
  return { ...vector, [id]: (vector[id] || 0) + 1 };
}

export function vvCompare(a, b) {
  if (!a || !b) throw new TypeError("Version vector comparison requires two vectors");
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  let aLeB = true;
  let bLeA = true;
  for (const k of keys) {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    if (va > vb) aLeB = false;
    if (vb > va) bLeA = false;
  }
  if (aLeB && bLeA) return "equal";
  if (aLeB) return "before";
  if (bLeA) return "after";
  return "concurrent";
}

export function vvMerge(a, b) {
  const merged = { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    merged[k] = Math.max(merged[k] || 0, v);
  }
  return merged;
}

export function vvEquals(a, b) {
  return vvCompare(a, b) === "equal";
}
