import { factorOmiPointer } from './principal-domain.js';

export function commonPrefixScope(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return null;
  const fa = factorOmiPointer(a);
  const fb = factorOmiPointer(b);
  if (!fa || !fb) return null;
  return Math.min(fa.prefix, fb.prefix);
}

export function commonLaneLL(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return null;
  const fa = factorOmiPointer(a);
  const fb = factorOmiPointer(b);
  if (!fa || !fb) return null;
  if (fa.lane === fb.lane) return fa.lane;
  return null;
}

export function commonFrameShell(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return null;
  const fa = factorOmiPointer(a);
  const fb = factorOmiPointer(b);
  if (!fa || !fb) return null;
  const shellMatch = fa.s1 === fb.s1 && fa.s6 === fb.s6;
  return shellMatch ? { s1: fa.s1, s6: fa.s6 } : null;
}

export function commonGenerator(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return null;
  const lane = commonLaneLL(a, b);
  if (lane !== null) {
    const ll = lane.toString(16).padStart(2, '0');
    return {
      type: 'lane',
      value: lane,
      generator: `omi-${(lane << 8).toString(16).padStart(4, '0')}-03bf-0000-2b${ll}-2f${ll}-0000-039f-${(lane << 8 | 0xff).toString(16).padStart(4, '0')}/128`
    };
  }
  const prefix = commonPrefixScope(a, b);
  if (prefix !== null) {
    const base = a.split('/')[0];
    return {
      type: 'prefix',
      value: prefix,
      generator: `${base}/${prefix}`
    };
  }
  return null;
}
