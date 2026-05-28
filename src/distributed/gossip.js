import { createVersionVector, vvIncrement, vvMerge, vvCompare } from "./version-vector.js";
import { createFragmentStore } from "./fragment-store.js";
import { fragmentKey } from "./causal-closure.js";

export class GossipNode {
  constructor(nodeId, options = {}) {
    this.nodeId = String(nodeId);
    this.store = options.store || createFragmentStore();
    this.peers = new Map();
    this.fanout = options.fanout || 4;
    this._inventory = new Set();
    this._frontier = {};
  }

  addPeer(peerNode) {
    const id = peerNode.nodeId || peerNode.id || String(peerNode);
    this.peers.set(id, peerNode);
  }

  removePeer(nodeId) {
    this.peers.delete(String(nodeId));
  }

  frontier() {
    return { ...this.store.frontier() };
  }

  advertise() {
    return { nodeId: this.nodeId, frontier: this.frontier() };
  }

  computeDelta(remoteFrontier) {
    const delta = [];
    const allCodewords = [...new Set([...Object.keys(this.frontier()), ...Object.keys(remoteFrontier || {})])];
    for (const codewordId of allCodewords) {
      const localVV = this.frontier()[codewordId] || {};
      const remoteVV = (remoteFrontier || {})[codewordId] || {};
      const cmp = vvCompare(localVV, remoteVV);
      if (cmp === "equal" || cmp === "before") continue;
      const localFrags = this.store.get(codewordId);
      for (const f of localFrags) {
        const fCmp = vvCompare(f.versionVector, remoteVV);
        if (fCmp === "after" || fCmp === "concurrent") {
          delta.push(f);
        }
      }
    }
    return delta;
  }

  receiveFragment(fragment) {
    const stored = this.store.put(fragment);
    if (stored) {
      this._frontier = vvMerge(this._frontier, { [fragment.codewordId]: fragment.versionVector });
    }
    return stored;
  }

  receiveDelta(delta) {
    const accepted = [];
    for (const f of delta || []) {
      if (this.receiveFragment(f)) accepted.push(f);
    }
    return accepted;
  }

  async pushPullExchange(peer) {
    const peerId = peer.nodeId || peer.id || String(peer);
    const remoteAd = typeof peer.advertise === "function" ? peer.advertise() : { nodeId: peerId, frontier: peer.frontier?.() || {} };
    const delta = this.computeDelta(remoteAd.frontier || {});
    const sent = typeof peer.receiveDelta === "function" ? peer.receiveDelta(delta).length : 0;
    const myFrontier = this.frontier();
    const peerDelta = typeof peer.computeDelta === "function" ? peer.computeDelta(myFrontier) : [];
    const received = this.receiveDelta(peerDelta).length;
    return { sent, received };
  }

  async gossipRound() {
    const peerIds = [...this.peers.keys()];
    if (peerIds.length === 0) return { sent: 0, received: 0 };
    const shuffled = peerIds.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(this.fanout, shuffled.length));
    let totalSent = 0;
    let totalReceived = 0;
    for (const peerId of selected) {
      const peer = this.peers.get(peerId);
      if (peer) {
        const result = await this.pushPullExchange(peer);
        totalSent += result.sent;
        totalReceived += result.received;
      }
    }
    return { sent: totalSent, received: totalReceived };
  }

  fragmentCount() {
    return this.store.size;
  }
}

export function createGossipNode(nodeId, options = {}) {
  return new GossipNode(nodeId, options);
}
