import { readImoRecord } from '../omilog/reader.js';
import { LITTLE_OMICRON, BIG_OMICRON } from '../omilog/omi-imo-compiler.js';

export const NAT64_PREFIX_HEX = '64ff9b00';

export function ipv4ToBytes(ipv4) {
  const parts = ipv4.split('.');
  if (parts.length !== 4) return null;
  const bytes = parts.map(p => {
    const n = parseInt(p, 10);
    return (n >= 0 && n <= 255) ? n : null;
  });
  if (bytes.some(b => b === null)) return null;
  return bytes;
}

export function bytesToHex16(a, b) {
  return ((a << 8) | b).toString(16).padStart(4, '0');
}

export function ipv4ToOmiAddress(ipv4) {
  const bytes = ipv4ToBytes(ipv4);
  if (!bytes) return null;
  const s0 = NAT64_PREFIX_HEX;
  const s1 = '0000';
  const s2 = '0000';
  const s3 = '0000';
  const s4 = '0000';
  const s5 = '0000';
  const s6 = bytesToHex16(bytes[0], bytes[1]);
  const s7 = bytesToHex16(bytes[2], bytes[3]);
  return `omi-${s0}-${s1}-${s2}-${s3}-${s4}-${s5}-${s6}-${s7}/128`;
}

export function ipv4ToFfffAddress(ipv4) {
  const bytes = ipv4ToBytes(ipv4);
  if (!bytes) return null;
  return `${bytes[0]}-${bytes[1]}-${bytes[2]}-${bytes[3]}`;
}

export function createNat64Event(ipv4, operator = null) {
  const omiAddr = ipv4ToOmiAddress(ipv4);
  if (!omiAddr) return null;
  const ffff = ipv4ToFfffAddress(ipv4);
  const op = operator || '!';
  const imoLine = `${LITTLE_OMICRON} ${op}/${ffff}/48 ${BIG_OMICRON}`;
  try {
    const parsed = readImoRecord(imoLine);
    return {
      source: 'nat64-virtual',
      ipv4,
      omiAddress: omiAddr,
      ffffAddress: `ffff-${ffff}/48`,
      operator: op,
      imoLine,
      parsed,
      timestamp: Date.now()
    };
  } catch {
    return null;
  }
}

export function createNat64SourceEvent(ipv4, sourceData = null) {
  const omiAddr = ipv4ToOmiAddress(ipv4);
  if (!omiAddr) return null;
  const ffff = ipv4ToFfffAddress(ipv4);
  const src = sourceData || `payload-${ffff.replace(/-/g, '')}`;
  const imoLine = `${LITTLE_OMICRON} )/0-0-0-0-0-0-0-0/128 ${BIG_OMICRON}`;
  const srcLine = `${LITTLE_OMICRON} \x1e${ffff}/48\x1f ${BIG_OMICRON}`;
  const block = [imoLine, srcLine].join('\n');
  return {
    source: 'nat64-virtual',
    ipv4,
    omiAddress: omiAddr,
    ffffAddress: `ffff-${ffff}/48`,
    imoBlock: block,
    sourceData: src,
    timestamp: Date.now()
  };
}

export class Nat64VirtualAdapter {
  constructor(options = {}) {
    this.eventLog = [];
    this.maxLog = options.maxLog || 100;
  }

  emit(ipv4, operator = '!') {
    const ev = createNat64Event(ipv4, operator);
    if (!ev) return null;
    this.eventLog.push(ev);
    if (this.eventLog.length > this.maxLog) this.eventLog.shift();
    return ev;
  }

  emitSource(ipv4, sourceData = null) {
    const ev = createNat64SourceEvent(ipv4, sourceData);
    if (!ev) return null;
    this.eventLog.push(ev);
    if (this.eventLog.length > this.maxLog) this.eventLog.shift();
    return ev;
  }

  get history() { return [...this.eventLog]; }

  reset() { this.eventLog = []; }
}
