import { vvCompare } from "./version-vector.js";

export class AntiEntropyRepair {
  constructor(node, options = {}) {
    this.node = node;
    this.interval = options.interval || 30000;
    this._timer = null;
    this._running = false;
    this.triggers = {
      divergence: options.triggerDivergence !== false,
      rejoin: options.triggerRejoin !== false,
      periodic: options.triggerPeriodic !== false
    };
    this.metrics = {
      repairsTriggered: 0,
      fragmentsRepaired: 0,
      lastRepairTime: null
    };
  }

  static checkDivergence(localFrontier, remoteFrontier) {
    const diverged = [];
    const allKeys = [...new Set([...Object.keys(localFrontier || {}), ...Object.keys(remoteFrontier || {})])];
    for (const key of allKeys) {
      const local = localFrontier[key] || {};
      const remote = remoteFrontier[key] || {};
      if (vvCompare(local, remote) === "concurrent") {
        diverged.push(key);
      }
    }
    return diverged;
  }

  static computeMissing(localStore, remoteFrontier) {
    const missing = [];
    for (const [codewordId, remoteVV] of Object.entries(remoteFrontier || {})) {
      const localFrags = localStore.get(codewordId);
      const localMaxVV = {};
      for (const f of localFrags) {
        for (const [k, v] of Object.entries(f.versionVector)) {
          localMaxVV[k] = Math.max(localMaxVV[k] || 0, v);
        }
      }
      const cmp = vvCompare(localMaxVV, remoteVV);
      if (cmp === "after" || cmp === "equal") continue;
      missing.push({ codewordId, localMaxVV, remoteVV });
    }
    return missing;
  }

  static computeMissingIndices(localStore, remoteFrontier, codewordId, total) {
    const localFrags = localStore.get(codewordId);
    const present = new Set(localFrags.map((f) => f.fragmentIndex));
    const missing = [];
    for (let i = 0; i < total; i++) {
      if (!present.has(i)) missing.push(i);
    }
    return missing;
  }

  async triggerRepair(peers) {
    this.metrics.repairsTriggered++;
    let totalRepaired = 0;
    let totalDiverged = 0;
    for (const peer of peers || []) {
      const remoteFrontier = typeof peer.frontier === "function" ? peer.frontier() : {};
      const diverged = AntiEntropyRepair.checkDivergence(this.node.frontier(), remoteFrontier);
      totalDiverged += diverged.length;
      for (const codewordId of diverged) {
        const remoteFrags = typeof peer.store?.get === "function" ? peer.store.get(codewordId) : [];
        const accepted = this.node.receiveDelta(remoteFrags);
        totalRepaired += accepted.length;
      }
    }
    this.metrics.fragmentsRepaired += totalRepaired;
    this.metrics.lastRepairTime = Date.now();
    return { repaired: totalRepaired, divergedCodewords: totalDiverged };
  }

  start(peers) {
    if (this._running) return;
    this._running = true;
    if (this.triggers.periodic && this.interval > 0) {
      this._timer = setInterval(() => this.triggerRepair(peers), this.interval);
    }
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._running = false;
  }

  get isRunning() { return this._running; }
}

export function createRepairScheduler(node, options = {}) {
  return new AntiEntropyRepair(node, options);
}
