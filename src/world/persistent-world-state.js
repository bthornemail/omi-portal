export class PersistentWorldState {
  #tick;
  #epoch;
  #actors;
  #relations;
  #unresolvedTensions;
  #gates;
  #visibleVoxels;
  #replayReceipts;
  #maxReceipts;

  constructor(options = {}) {
    this.#tick = 0;
    this.#epoch = 0;
    this.#actors = new Map();
    this.#relations = new Map();
    this.#unresolvedTensions = [];
    this.#gates = new Map();
    this.#visibleVoxels = new Map();
    this.#replayReceipts = [];
    this.#maxReceipts = options.maxReceipts || 5040;
  }

  get tick() { return this.#tick; }
  get epoch() { return this.#epoch; }
  get actors() { return new Map(this.#actors); }
  get relations() { return new Map(this.#relations); }
  get unresolvedTensions() { return [...this.#unresolvedTensions]; }
  get gates() { return new Map(this.#gates); }
  get visibleVoxels() { return new Map(this.#visibleVoxels); }
  get replayReceipts() { return [...this.#replayReceipts]; }
  get actorCount() { return this.#actors.size; }
  get relationCount() { return this.#relations.size; }
  get tensionCount() { return this.#unresolvedTensions.length; }
  get gateCount() { return this.#gates.size; }
  get receiptCount() { return this.#replayReceipts.length; }
  get voxelCount() { return this.#visibleVoxels.size; }
  advance() {
    this.#tick++;
    if (this.#tick >= 5040) {
      this.#tick = 0;
      this.#epoch++;
    }
    // Age gates: decay unresolved tension
    this.#unresolvedTensions = this.#unresolvedTensions.filter(t => {
      t.age = (t.age || 0) + 1;
      return t.age < (t.maxAge || 100);
    });
    return this.#tick;
  }

  addActor(key, props = {}) {
    if (this.#actors.has(key)) {
      const existing = this.#actors.get(key);
      Object.assign(existing, props);
      return existing;
    }
    const actor = {
      key,
      upos: props.upos || 'NOUN',
      feature: props.feature || 'lexical',
      role: props.role || 'subject',
      emoji: props.emoji || '',
      worldBehavior: props.worldBehavior || 'idle',
      tickCreated: this.#tick,
      tickUpdated: this.#tick,
      ...props
    };
    this.#actors.set(key, actor);
    return actor;
  }

  getActor(key) {
    return this.#actors.get(key) || null;
  }

  hasActor(key) {
    return this.#actors.has(key);
  }

  removeActor(key) {
    return this.#actors.delete(key);
  }

  setRelation(s, p, o, props = {}) {
    const relKey = `${s}::${p}::${o}`;
    const relation = {
      subject: s,
      predicate: p,
      object: o,
      tick: this.#tick,
      epoch: this.#epoch,
      ...props
    };
    this.#relations.set(relKey, relation);
    return relation;
  }

  getRelation(s, p, o) {
    return this.#relations.get(`${s}::${p}::${o}`) || null;
  }

  hasRelation(s, p, o) {
    return this.#relations.has(`${s}::${p}::${o}`);
  }

  removeRelation(s, p, o) {
    return this.#relations.delete(`${s}::${p}::${o}`);
  }

  getRelationsBySubject(s) {
    const results = [];
    for (const [key, rel] of this.#relations) {
      if (rel.subject === s) results.push(rel);
    }
    return results;
  }

  getRelationsByObject(o) {
    const results = [];
    for (const [key, rel] of this.#relations) {
      if (rel.object === o) results.push(rel);
    }
    return results;
  }

  addTension(description, options = {}) {
    const tension = {
      id: this.#unresolvedTensions.length + 1,
      description,
      age: 0,
      maxAge: options.maxAge || 100,
      tick: this.#tick,
      ...options
    };
    this.#unresolvedTensions.push(tension);
    return tension;
  }

  resolveTension(id) {
    const idx = this.#unresolvedTensions.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.#unresolvedTensions.splice(idx, 1);
      return true;
    }
    return false;
  }

  setGate(name, state = 'open') {
    const gate = { name, state, tick: this.#tick, epoch: this.#epoch };
    this.#gates.set(name, gate);
    return gate;
  }

  getGate(name) {
    return this.#gates.get(name) || null;
  }

  removeGate(name) {
    return this.#gates.delete(name);
  }

  setVoxel(key, value) {
    this.#visibleVoxels.set(key, { ...value, tick: this.#tick });
  }

  getVoxel(key) {
    return this.#visibleVoxels.get(key) || null;
  }

  removeVoxel(key) {
    return this.#visibleVoxels.delete(key);
  }

  addReceipt(receipt) {
    this.#replayReceipts.push({ ...receipt, tick: this.#tick, epoch: this.#epoch });
    if (this.#replayReceipts.length > this.#maxReceipts) {
      this.#replayReceipts.shift();
    }
  }

  getState() {
    return {
      tick: this.#tick,
      epoch: this.#epoch,
      actors: Object.fromEntries(this.#actors),
      relations: Object.fromEntries(this.#relations),
      unresolvedTensions: [...this.#unresolvedTensions],
      gates: Object.fromEntries(this.#gates),
      visibleVoxels: Object.fromEntries(this.#visibleVoxels),
      replayReceipts: [...this.#replayReceipts]
    };
  }

  reset() {
    this.#tick = 0;
    this.#epoch = 0;
    this.#actors.clear();
    this.#relations.clear();
    this.#unresolvedTensions = [];
    this.#gates.clear();
    this.#visibleVoxels.clear();
    this.#replayReceipts = [];
  }
}
