const FRAME_SEGMENTS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'];

export function factorOmiPointer(address) {
  if (typeof address !== 'string') return null;
  const m = address.match(/^omi-([0-9a-f]{4})-03bf-([0-9a-f]{4})-2b([0-9a-f]{2})-2f([0-9a-f]{2})-([0-9a-f]{4})-039f-([0-9a-f]{4})\/(\d+)$/i);
  if (!m) {
    const fallback = address.match(/^omi-([0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4})\/(\d+)$/i);
    if (!fallback) return null;
    return {
      raw: address,
      segments: fallback[1].split('-'),
      prefix: parseInt(fallback[2], 10),
      lane: parseInt(fallback[1].split('-')[0], 16) >> 8,
      s1: '03bf',
      s6: '039f'
    };
  }
  return {
    raw: address,
    lane: parseInt(m[1], 16) >> 8,
    bodyNN: parseInt(m[2], 16),
    operatorRail: `2b${m[3]}`,
    projectionRail: `2f${m[4]}`,
    carrierMM: parseInt(m[5], 16),
    prefix: parseInt(m[7], 10),
    s0: m[1],
    s1: '03bf',
    s2: m[2],
    s3: `2b${m[3]}`,
    s4: `2f${m[4]}`,
    s5: m[5],
    s6: '039f',
    s7: m[6]
  };
}

export function laneGenerator(lane) {
  const ll = lane.toString(16).padStart(2, '0');
  return `omi-${(lane << 8).toString(16).padStart(4, '0')}-03bf-0000-2b${ll}-2f${ll}-0000-039f-${(lane << 8 | 0xff).toString(16).padStart(4, '0')}/128`;
}

function extractLane(addr) {
  if (typeof addr !== 'string') return null;
  const f = factorOmiPointer(addr);
  return f ? f.lane : null;
}

export function principalGenerator(records) {
  if (!Array.isArray(records) || records.length === 0) return null;
  const lanes = new Set();
  for (const rec of records) {
    const addr = typeof rec === 'string' ? rec : (rec && (rec.address || rec.omi));
    if (!addr || typeof addr !== 'string') continue;
    const lane = extractLane(addr);
    if (lane !== null) lanes.add(lane);
  }
  if (lanes.size === 0) return null;
  if (lanes.size === 1) {
    return laneGenerator([...lanes][0]);
  }
  const sorted = [...lanes].sort((a, b) => a - b);
  return laneGenerator(sorted[0]);
}

function matchesGenerator(addr, generator) {
  if (typeof addr !== 'string') return false;
  const genFactor = factorOmiPointer(generator);
  if (!genFactor) return addr.startsWith(generator.split('/')[0]);
  const addrFactor = factorOmiPointer(addr);
  if (!addrFactor) return false;
  return genFactor.lane === addrFactor.lane;
}

export function generatedIdeal(generator, records) {
  if (!generator || !Array.isArray(records)) return [];
  return records.filter(rec => {
    const addr = typeof rec === 'string' ? rec : rec.address || rec.omi;
    return addr && matchesGenerator(addr, generator);
  });
}

export function isPrincipalRegion(records) {
  if (!Array.isArray(records) || records.length === 0) return false;
  const gen = principalGenerator(records);
  if (!gen) return false;
  const ideal = generatedIdeal(gen, records);
  return ideal.length === records.length;
}
