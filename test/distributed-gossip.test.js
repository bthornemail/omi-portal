import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { createGossipNode, GossipNode } from "../src/distributed/gossip.js";
import { createFragmentStore } from "../src/distributed/fragment-store.js";

function frag(cwId, fi, vv) {
  return { codewordId: cwId, fragmentIndex: fi, total: 3, versionVector: vv, data: new Uint8Array([fi]) };
}

describe("GossipNode", () => {
  it("creates node with store", () => {
    const node = createGossipNode("A");
    assert.equal(node.nodeId, "A");
    assert.ok(node.store);
  });

  it("advertise returns node info", () => {
    const node = createGossipNode("n1");
    const ad = node.advertise();
    assert.equal(ad.nodeId, "n1");
    assert.deepEqual(ad.frontier, {});
  });

  it("receiveFragment stores locally", () => {
    const node = createGossipNode("A");
    const f = frag("cw1", 0, { a: 1 });
    assert.ok(node.receiveFragment(f));
    assert.equal(node.fragmentCount(), 1);
  });

  it("computeDelta returns fragments peer is missing", () => {
    const nodeA = createGossipNode("A");
    const f0 = frag("cw1", 0, { a: 2 });
    const f1 = frag("cw1", 1, { a: 1 });
    nodeA.receiveFragment(f0);
    nodeA.receiveFragment(f1);

    const remoteFrontier = { cw1: { a: 1 } };
    const delta = nodeA.computeDelta(remoteFrontier);
    assert.ok(delta.length >= 1);
  });

  it("pushPullExchange with another node", async () => {
    const nodeA = createGossipNode("A");
    const nodeB = createGossipNode("B");
    nodeA.addPeer(nodeB);
    nodeB.addPeer(nodeA);

    nodeA.receiveFragment(frag("cw1", 0, { a: 1 }));
    nodeA.receiveFragment(frag("cw1", 1, { a: 1 }));
    nodeA.receiveFragment(frag("cw1", 2, { a: 1 }));

    const result = await nodeA.gossipRound();
    assert.equal(result.sent, 3);
  });

  it("gossipRound with no peers returns zeros", async () => {
    const node = createGossipNode("lonely");
    const result = await node.gossipRound();
    assert.deepEqual(result, { sent: 0, received: 0 });
  });

  it("addPeer and removePeer", () => {
    const node = createGossipNode("A");
    const nodeB = createGossipNode("B");
    node.addPeer(nodeB);
    assert.ok(node.peers.has("B"));
    node.removePeer("B");
    assert.ok(!node.peers.has("B"));
  });
});
