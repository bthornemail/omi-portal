// Deterministic CIDR-like address helpers for semantic centroids.
// These addresses are private/documentation-safe by construction:
// IPv4 uses 127/8 host routes and IPv6 uses 2001:db8::/32 documentation space.

export function fnv1a32(input) {
  let h = 0x811c9dc5;
  const s = String(input ?? "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function toIPv4HostRoute(seed, baseOctet = 127) {
  const h = fnv1a32(seed);
  const b = (h >>> 16) & 0xff;
  const c = (h >>> 8) & 0xff;
  const d = h & 0xff;
  return `${baseOctet}.${b}.${c}.${d}/32`;
}

export function toIPv6Centroid(seed) {
  const h1 = fnv1a32(`A:${seed}`);
  const h2 = fnv1a32(`B:${seed}`);
  const h3 = fnv1a32(`C:${seed}`);
  const h4 = fnv1a32(`D:${seed}`);
  const hex = [h1, h2, h3, h4]
    .map((n) => n.toString(16).padStart(8, "0"))
    .join("");
  const segs = hex.match(/.{1,4}/g);
  // 2001:db8:: is the documentation prefix. Keep it out of real routing space.
  return `2001:db8:${segs.slice(0, 6).join(":")}/128`;
}

export function cidrMetric(prefixLength, relationCount, minRelations = 6) {
  const stability = Math.min(1, relationCount / Math.max(1, minRelations));
  return {
    prefixLength,
    relationCount,
    minRelations,
    stability,
    stable: relationCount >= minRelations
  };
}
