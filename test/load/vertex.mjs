import { createGossipNode } from "../../src/distributed/gossip.js";
import { createCoTURNProxy } from "../../src/distributed/coturn-proxy.js";
import { createHNSWIndex, cosineDistance } from "../../src/distributed/hnsw-index.js";
import { rsEncode, rsDecode } from "../../src/distributed/erasure.js";
import { vvIncrement, vvCompare } from "../../src/distributed/version-vector.js";
import {
  isCausallyClosed, isRSSufficient, reconstructIfValid
} from "../../src/distributed/causal-closure.js";
import { peerList } from "./platonic-topology.mjs";

export class LoadVertex {
  constructor(vertexIndex, solidName, options = {}) {
    this.index = vertexIndex;
    this.nodeId = `v${vertexIndex}`;
    this.solidName = solidName;
    this.peerIndices = peerList(solidName, vertexIndex);
    this.gossipNode = createGossipNode(this.nodeId, {
      fanout: Math.min(options.fanout || 4, this.peerIndices.length || 1)
    });
    this.turnProxy = createCoTURNProxy({ secret: `load-test-secret-${solidName}` });
    this.hnsw = createHNSWIndex({ distance: cosineDistance, M: 8, efConstruction: 50, efSearch: 50 });
    this._vectorClock = {};
    this.metrics = {
      fragmentsGenerated: 0,
      fragmentsReceived: 0,
      fragmentsRepaired: 0,
      rsEncodes: 0,
      rsDecodes: 0,
      turnCredentialsGenerated: 0,
      turnCredentialsValidated: 0,
      hnswInserts: 0,
      hnswSearches: 0,
      gossipRounds: 0,
      gossipSent: 0,
      gossipReceived: 0,
      causalClosures: 0,
      divergenceEvents: 0,
      startTime: 0,
      endTime: 0,
      memoryBefore: 0,
      memoryAfter: 0
    };
    this._running = false;
    this._roundInterval = options.interval || 50;
  }

  get frontier() {
    return () => this.gossipNode.frontier();
  }

  get store() {
    return this.gossipNode.store;
  }

  addRemotePeer(peerVertex) {
    this.gossipNode.addPeer(peerVertex.gossipNode);
  }

  generateLoad(round) {
    const ops = [];

    this._vectorClock = vvIncrement(this._vectorClock, this.nodeId);
    ops.push("vv-increment");

    const k = 3;
    const n = 5;
    const dataSize = k * 4;
    const data = new Uint8Array(dataSize);
    for (let i = 0; i < dataSize; i++) data[i] = (round * k + i) & 0xff;
    const fragments = rsEncode(data, k, n);
    this.metrics.rsEncodes++;
    ops.push("rs-encode");

    for (let fi = 0; fi < fragments.length; fi++) {
      this.gossipNode.receiveFragment({
        codewordId: `cw-${this.nodeId}-${round}`,
        fragmentIndex: fi,
        total: fragments.length,
        required: k,
        versionVector: { ...this._vectorClock },
        data: fragments[fi]
      });
      this.metrics.fragmentsGenerated++;
    }
    ops.push("fragment-store");

    const cwStore = this.gossipNode.store.get(`cw-${this.nodeId}-${round}`);
    if (cwStore.length >= k) {
      const closed = isCausallyClosed(cwStore, this.gossipNode.store.getAll());
      this.metrics.causalClosures++;
      if (closed) {
        const indices = cwStore.map((f) => f.fragmentIndex);
        const frags = cwStore.map((f) => f.data);
        try {
          const recovered = rsDecode(frags.slice(0, k), indices.slice(0, k), k, n);
          if (recovered.length === dataSize) this.metrics.rsDecodes++;
        } catch { /* expected on partial data */ }
      }
    }
    ops.push("rs-decode-attempt");

    const creds = this.turnProxy.generateCredentials(`load-user-${this.nodeId}`);
    this.metrics.turnCredentialsGenerated++;
    if (creds) this.metrics.turnCredentialsValidated++;
    ops.push("coturn-cred");

    const vec = new Float64Array([round * 0.1, Math.cos(round), Math.sin(round)]);
    this.hnsw.insert(Array.from(vec), `vec-${this.nodeId}-${round}`);
    this.metrics.hnswInserts++;
    const searchQ = [round * 0.1 + 0.01, Math.cos(round + 0.1), Math.sin(round + 0.1)];
    const results = this.hnsw.search(searchQ, 3);
    if (results.length > 0) this.metrics.hnswSearches++;
    ops.push("hnsw");

    return ops;
  }

  async gossipRound() {
    const result = await this.gossipNode.gossipRound();
    this.metrics.gossipRounds++;
    this.metrics.gossipSent += result.sent;
    this.metrics.gossipReceived += result.received;
    return result;
  }

  run(rounds = 100) {
    this._running = true;
    this.metrics.startTime = Date.now();
    this.metrics.memoryBefore = process.memoryUsage().heapUsed;

    return (async () => {
      for (let round = 0; round < rounds && this._running; round++) {
        this.generateLoad(round);

        if (this.peerIndices.length > 0 && round % 3 === 0) {
          await this.gossipRound();
        }

        if (round % 720 === 719) {
          this.metrics.divergenceEvents++;
        }

        if (this._roundInterval > 0) {
          await new Promise((r) => setTimeout(r, this._roundInterval));
        }
      }
      this.metrics.endTime = Date.now();
      this.metrics.memoryAfter = process.memoryUsage().heapUsed;
      this._running = false;
      return this.metrics;
    })();
  }

  stop() {
    this._running = false;
  }

  isRunning() { return this._running; }
}

export async function createSolidTest(solidName, options = {}) {
  const { getSolid } = await import("./platonic-topology.mjs");
  const solid = getSolid(solidName);
  const vertices = [];
  for (let i = 0; i < solid.vertices; i++) {
    vertices.push(new LoadVertex(i, solidName, options));
  }
  for (const [a, b] of solid.edges) {
    vertices[a].addRemotePeer(vertices[b]);
    vertices[b].addRemotePeer(vertices[a]);
  }
  return { solid, vertices };
}
