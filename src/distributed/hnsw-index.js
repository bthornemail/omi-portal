export function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function cosineDistance(a, b) {
  return 1 - cosineSimilarity(a, b);
}

export function l2Distance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

const DEFAULT_ML = 1 / Math.LN2;

function layerAssignment(levelMult, M) {
  return Math.floor(-Math.log(Math.random()) * levelMult * M);
}

export class HNSWIndex {
  constructor(options = {}) {
    this.distance = options.distance || cosineDistance;
    this.M = options.M || 16;
    this.Mmax = options.Mmax || this.M * 2;
    this.efConstruction = options.efConstruction || 200;
    this.efSearch = options.efSearch || 50;
    this.levelMult = options.levelMult || DEFAULT_ML;
    this._nodes = new Map();
    this._layers = new Map();
    this._entryPoint = null;
    this._maxLevel = -1;
  }

  get size() { return this._nodes.size; }

  searchLayer(q, entryPointId, level, ef) {
    const visited = new Set([entryPointId]);
    const candidates = [{ id: entryPointId, dist: this.distance(q, this._nodes.get(entryPointId).vector) }];
    const result = new Map();
    result.set(entryPointId, candidates[0].dist);

    while (candidates.length > 0) {
      candidates.sort((a, b) => a.dist - b.dist);
      const c = candidates.shift();
      const farthestWorst = [...result.values()].reduce((max, d) => Math.max(max, d), -Infinity);
      if (c.dist > farthestWorst && result.size >= ef) break;

      const layerNeighbors = this._layers.get(level)?.get(entryPointId) || [];
      const nodeNeighbors = this._nodes.get(c.id)?.connections?.get(level) || [];
      for (const nId of nodeNeighbors) {
        if (visited.has(nId)) continue;
        visited.add(nId);
        const dist = this.distance(q, this._nodes.get(nId).vector);
        const farthestWorst2 = [...result.values()].reduce((max, d) => Math.max(max, d), -Infinity);
        if (dist < farthestWorst2 || result.size < ef) {
          result.set(nId, dist);
          candidates.push({ id: nId, dist });
        }
      }
    }
    return [...result.entries()].sort((a, b) => a[1] - b[1]).slice(0, ef);
  }

  insert(vector, id, options = {}) {
    const nodeId = id ?? `v${this._nodes.size}`;
    if (this._nodes.has(nodeId)) throw new Error(`Node ${nodeId} already exists in index`);

    const level = layerAssignment(1, this.M);
    const node = { id: nodeId, vector, level, connections: new Map() };
    for (let l = 0; l <= level; l++) node.connections.set(l, []);
    this._nodes.set(nodeId, node);

    if (this._entryPoint === null) {
      this._entryPoint = nodeId;
      this._maxLevel = level;
      for (let l = 0; l <= level; l++) {
        if (!this._layers.has(l)) this._layers.set(l, new Map());
      }
      return true;
    }

    let currEntry = this._entryPoint;
    let currDist = this.distance(vector, this._nodes.get(currEntry).vector);

    for (let l = this._maxLevel; l > level; l--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = this._nodes.get(currEntry).connections.get(l) || [];
        for (const nId of neighbors) {
          const d = this.distance(vector, this._nodes.get(nId).vector);
          if (d < currDist) { currDist = d; currEntry = nId; changed = true; break; }
        }
      }
    }

    for (let l = Math.min(level, this._maxLevel); l >= 0; l--) {
      const ef = l === level ? this.efConstruction : 1;
      const results = this.searchLayer(vector, currEntry, l, ef);
      const neighbors = results.slice(0, this.M).map(([id]) => id);
      const layer = this._layers.get(l);
      if (!layer) this._layers.set(l, new Map());
      const connMap = this._nodes.get(nodeId).connections;
      connMap.set(l, neighbors);
      for (const nId of neighbors) {
        const nNode = this._nodes.get(nId);
        const nConn = nNode.connections.get(l) || [];
        nConn.push(nodeId);
        if (nConn.length > this.Mmax) {
          nConn.sort((a, b) => this.distance(this._nodes.get(a).vector, this._nodes.get(nId).vector) - this.distance(this._nodes.get(b).vector, this._nodes.get(nId).vector));
          nConn.length = this.M;
        }
        nNode.connections.set(l, nConn);
      }
      if (neighbors.length > 0) currEntry = neighbors[0];
    }

    if (level > this._maxLevel) {
      this._maxLevel = level;
      this._entryPoint = nodeId;
    }
    return true;
  }

  search(query, k = 10) {
    if (this._entryPoint === null) return [];

    let currEntry = this._entryPoint;
    for (let l = this._maxLevel; l > 0; l--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = this._nodes.get(currEntry)?.connections.get(l) || [];
        for (const nId of neighbors) {
          const d = this.distance(query, this._nodes.get(nId).vector);
          if (d < this.distance(query, this._nodes.get(currEntry).vector)) {
            currEntry = nId; changed = true; break;
          }
        }
      }
    }

    const results = this.searchLayer(query, currEntry, 0, this.efSearch);
    return results.slice(0, k).map(([id, dist]) => ({ id, distance: dist }));
  }

  clear() {
    this._nodes.clear();
    this._layers.clear();
    this._entryPoint = null;
    this._maxLevel = -1;
  }
}

export function createHNSWIndex(options = {}) {
  return new HNSWIndex(options);
}
