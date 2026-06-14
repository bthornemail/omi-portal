import { isOmiAddressAtom, isEmojiAtom } from '../omilog/reader.js';
import { parseOmiAddressToSegments, isOrbitLexerValid, extractTruthRow } from '../omi/delta-orbital-lexer.js';
import { omiQuadraticProject, omiLocal240, omiRootDepth, omiSlot5040 } from '../canvas/omicron-canvas.js';

export const VOXEL_EVENTS = ['voxel:update', 'voxel:remove', 'voxel:batch'];

const OPERATOR_COLORS = {
  '!': '#FF4444',
  '=': '#44AAFF',
  ')': '#FFAA00',
  '+': '#44DD44',
  '.': '#AA66FF',
  source: '#666666'
};

export function operatorToColor(op) {
  return OPERATOR_COLORS[op] || '#888888';
}

export function addressToQxy(address) {
  if (!address) return null;
  const omiAddr = address.startsWith('omi-') ? address : `omi-${address.replace(/-/g, '-')}`;

  if (isOmiAddressAtom(address)) {
    const S = parseOmiAddressToSegments(address);
    if (!S || !isOrbitLexerValid(S)) return null;
    const row = extractTruthRow(S);
    if (!row) return null;
    const x = row.LL;
    const y = row.NN % 16;
    return { S, row, x, y };
  }

  const parts = address.split('/')[0].split('-').filter(p => p.length > 0);
  if (parts.length >= 2) {
    const x = parseInt(parts[0], 10) || 0;
    const y = parts.length > 2 ? (parseInt(parts[2], 10) || 0) % 16 : (parseInt(parts[1], 10) || 0) % 16;
    return { S: null, row: null, x: x % 7, y };
  }

  return null;
}

function operatorForBackendEvent(rec) {
  if (rec.operator) return rec.operator;
  if (rec.receiptState === 'accepted') return '=';
  if (rec.receiptState === 'rejected') return '!';
  return '+';
}

function projectRecord(rec) {
  if (rec?.type === 'tetragrammatron-backend-event' && rec.route) {
    const x = Number(rec.route.baseQ ?? rec.route.phase ?? 0) % 7;
    const y = Number(rec.route.fiberQ ?? 0) % 16;
    return {
      x,
      y,
      operator: operatorForBackendEvent(rec),
      address: `tetragrammatron-${rec.slot ?? rec.route.slot5040 ?? 0}-${rec.route.local240 ?? 0}-${y}/48`,
      backendEvent: rec,
    };
  }

  const address = rec?.sourceAddress || rec?.address;
  if (!address) return null;
  const qxy = addressToQxy(address);
  if (!qxy) return null;
  return {
    x: qxy.x,
    y: qxy.y,
    operator: rec.operator,
    address,
    backendEvent: null,
  };
}

export class LiveVoxelStream {
  #options;
  #voxelState;
  #listeners;

  constructor(options = {}) {
    this.#options = {
      maxVoxels: options.maxVoxels || 5040,
      ttl: options.ttl || 60000,
      ...options
    };
    this.#voxelState = new Map();
    this.#listeners = {};
    this.ingestCount = 0;
  }

  get voxelCount() { return this.#voxelState.size; }

  on(eventType, callback) {
    if (!VOXEL_EVENTS.includes(eventType)) return false;
    if (!this.#listeners[eventType]) this.#listeners[eventType] = [];
    this.#listeners[eventType].push(callback);
    return true;
  }

  off(eventType, callback) {
    if (!this.#listeners[eventType]) return false;
    this.#listeners[eventType] = this.#listeners[eventType].filter(cb => cb !== callback);
    return true;
  }

  #emit(eventType, data) {
    const cbs = this.#listeners[eventType];
    if (cbs) {
      for (const cb of cbs) {
        try { cb(data); } catch { /* listener error */ }
      }
    }
  }

  ingest(parsedRecords) {
    if (!Array.isArray(parsedRecords)) return [];
    this.ingestCount++;
    const updates = [];
    const removals = [];
    const now = Date.now();

    for (const rec of parsedRecords) {
      const projection = projectRecord(rec);
      if (!projection) continue;

      const { x, y, address } = projection;
      const q = omiQuadraticProject(x, y);
      const depth = omiRootDepth(x, y);
      const local240 = omiLocal240(x, y);
      const color = operatorToColor(projection.operator);

      const voxelKey = `${x}:${y}`;
      const existing = this.#voxelState.get(voxelKey);
      const voxelData = {
        key: voxelKey,
        x,
        y,
        depth,
        q,
        local240,
        operator: projection.operator,
        address,
        color,
        lastSeen: now,
        backendEvent: projection.backendEvent,
      };

      this.#voxelState.set(voxelKey, voxelData);
      updates.push(voxelData);
    }

    const activeKeys = new Set(
      (parsedRecords || [])
        .map(r => {
          const projection = projectRecord(r);
          return projection ? `${projection.x}:${projection.y}` : null;
        })
        .filter(Boolean)
    );

    for (const [key, voxel] of this.#voxelState) {
      if (now - voxel.lastSeen > this.#options.ttl && !activeKeys.has(key)) {
        this.#voxelState.delete(key);
        removals.push(voxel);
      }
    }

    if (this.#voxelState.size > this.#options.maxVoxels) {
      const sorted = [...this.#voxelState.entries()]
        .sort((a, b) => a[1].lastSeen - b[1].lastSeen);
      while (this.#voxelState.size > this.#options.maxVoxels) {
        const [key, voxel] = sorted.shift();
        this.#voxelState.delete(key);
        removals.push(voxel);
      }
    }

    const batch = { updates, removals, ingestCount: this.ingestCount, timestamp: now };
    this.#emit('voxel:batch', batch);
    return batch;
  }

  getState() {
    return [...this.#voxelState.values()].sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.x - b.x || a.y - b.y;
    });
  }

  getVoxel(x, y) {
    return this.#voxelState.get(`${x}:${y}`) || null;
  }

  reset() {
    this.#voxelState.clear();
    this.ingestCount = 0;
  }
}
