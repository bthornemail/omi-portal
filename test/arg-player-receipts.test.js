import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createGenomeNode, compileGenomeNode, createEdge
} from "../src/arg/world-genome.js";
import { compileWorldTopology } from "../src/arg/world-topology-compiler.js";
import {
  handleEntityClick, getEntityRouteOptions, isEntityActivated
} from "../src/arg/arg-interaction.js";
import {
  createAcceptReceipt, createRejectReceipt, importReceipt, formatReceipt
} from "../src/arg/arg-receipts.js";
import {
  activateRoute, getCandidateReading, resolveActivation
} from "../src/arg/arg-route-activation.js";
import { assertNoMutation } from "../src/arg/arg-world-projection.js";

describe("ARG Player Receipts (interaction + receipt loop)", () => {
  const MOTIFS = [
    { id: "gate", motif: "Gate", emoji: "\u{1F6AA}", synset: { id: "07214215-n", lemma: "gate", pos: "n" } },
    { id: "logos", motif: "Logos", emoji: "\u{1F4DD}\u{2728}\u{1F54A}\uFE0F", synset: { id: "05987510-n", lemma: "logos", pos: "n" } }
  ];

  const EDGES = [
    { from: "gate", to: "logos", type: "hyp" },
    { from: "logos", to: "gate", type: "mirrors" }
  ];

  function buildTopology() {
    const nodes = MOTIFS.map(m => {
      const n = createGenomeNode(m.id, m.motif, m.emoji, m.synset);
      compileGenomeNode(n);
      return n;
    });
    return compileWorldTopology(nodes, EDGES);
  }

  it("1. Clicking an entity does not mutate carrier", () => {
    const topo = buildTopology();
    const originalCarriers = {};
    for (const [id, node] of topo.nodes) {
      originalCarriers[id] = BigInt(node.carrier);
    }

    handleEntityClick("gate", topo);

    for (const [id, node] of topo.nodes) {
      assert.equal(BigInt(node.carrier), originalCarriers[id],
        `Carrier for ${id} was mutated by click`);
    }
  });

  it("2. getEntityRouteOptions returns available routes from entity", () => {
    const topo = buildTopology();
    const options = getEntityRouteOptions("gate", topo);
    assert(options.length > 0);
    assert(options[0].fromId === "gate" || options[0].fromId === "gate");
    assert(options[0].toId === "logos");
    assert(["hyp", "mirrors", "entails", "similar", "unlocks", "requires", "receipts", "routes"].includes(options[0].type));
  });

  it("3. isEntityActivated tracks activation state", () => {
    const topo = buildTopology();
    const activations = [];
    assert.equal(isEntityActivated("gate", activations), false);

    const activation = handleEntityClick("gate", topo);
    activations.push(activation);
    assert.equal(isEntityActivated("gate", activations), true);
  });

  it("4. activateRoute creates a candidate reading", () => {
    const topo = buildTopology();
    const activation = activateRoute(topo, "gate", "hyp");
    assert(activation !== null);
    assert.equal(activation.fromId, "gate");
    assert.equal(activation.toId, "logos");
    assert.equal(activation.edgeType, "hyp");
    assert(activation.reading >= 0n);
    assert(activation.activated);

    const reading = getCandidateReading(activation);
    assert(reading !== null);
    assert(reading.source.includes("Gate"));
    assert(reading.route === "hyp");
    assert.equal(typeof reading.score, "number");
  });

  it("5. Accept creates stable receipt with all five fields", () => {
    const topo = buildTopology();
    const logosNode = topo.getNode("logos");

    const receipt = createAcceptReceipt(logosNode, topo);
    assert(receipt !== null);
    assert(receipt.sourceHash !== undefined);
    assert(receipt.notationHash !== undefined);
    assert(receipt.readingHash !== undefined);
    assert(receipt.resultHash !== undefined);
    assert(receipt.receiptHash !== undefined);
    assert.equal(receipt.action, "accept");
    assert(receipt.sourceHex !== undefined);

    const node = topo.getNode("logos");
    assert(node.receipt !== null);
    assert.equal(node.receipt.action, "accept");
  });

  it("6. Reject creates rejection receipt with different hash", () => {
    const topo = buildTopology();
    const gateNode = topo.getNode("gate");

    const acceptRec = createAcceptReceipt(gateNode, topo);
    const rejectRec = createRejectReceipt(gateNode, topo);

    assert(acceptRec.receiptHash !== rejectRec.receiptHash,
      "Accept and reject receipts must differ");
    assert.equal(rejectRec.action, "reject");
  });

  it("7. Receipt updates projected state only (no source mutation)", () => {
    const topo = buildTopology();
    const originalCarriers = {};
    for (const [id, node] of topo.nodes) {
      originalCarriers[id] = BigInt(node.carrier);
    }

    const gateNode = topo.getNode("gate");
    const receipt = createAcceptReceipt(gateNode, topo);
    assert(receipt !== null);

    for (const [id, node] of topo.nodes) {
      assert.equal(BigInt(node.carrier), originalCarriers[id],
        "Carrier was mutated by receipt creation");
    }
    assertNoMutation(topo);
  });

  it("8. importReceipt adds receipt to world state", () => {
    const topo = buildTopology();
    const gateNode = topo.getNode("gate");
    const receipt = createAcceptReceipt(gateNode, topo);

    const worldState = { receipts: [] };
    const imported = importReceipt(receipt, worldState);
    assert.equal(imported, true);
    assert.equal(worldState.receipts.length, 1);
    assert.equal(worldState.receipts[0].action, "accept");
  });

  it("9. formatReceipt produces readable fields", () => {
    const topo = buildTopology();
    const gateNode = topo.getNode("gate");
    const receipt = createAcceptReceipt(gateNode, topo);

    const formatted = formatReceipt(receipt);
    assert.equal(formatted.action, "accept");
    assert(formatted.receiptHash.length > 0);
    assert(formatted.sourceHash.length > 0);
    assert(formatted.notationHash.length > 0);
    assert(formatted.readingHash.length > 0);
    assert(formatted.resultHash.length > 0);
  });

  it("10. handleEntityClick on non-existent entity returns null", () => {
    const topo = buildTopology();
    assert.equal(handleEntityClick("nonexistent", topo), null);
  });

  it("11. activateRoute on non-existent edge returns null", () => {
    const topo = buildTopology();
    assert.equal(activateRoute(topo, "gate", "unknown_edge_type"), null);
  });
});
