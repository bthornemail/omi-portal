import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createGenomeNode, compileGenomeNode, createEdge
} from "../src/arg/world-genome.js";
import { compileWorldTopology } from "../src/arg/world-topology-compiler.js";
import {
  buildEntityFromNode, buildEntityList, entityToAframeHTML,
  compileTopologyToScene
} from "../src/arg/aframe-world-entity.js";
import { assertNoMutation } from "../src/arg/arg-world-projection.js";

describe("A-Frame World Projection (ARG → entities)", () => {
  const FIXTURE_MOTIFS = [
    { id: "gate", motif: "Gate", emoji: "\u{1F6AA}", synset: { id: "07214215-n", lemma: "gate", pos: "n" } },
    { id: "logos", motif: "Logos", emoji: "\u{1F4DD}\u{2728}\u{1F54A}\uFE0F", synset: { id: "05987510-n", lemma: "logos", pos: "n" } },
    { id: "number", motif: "Number", emoji: "\u{1F522}\u{1F4CA}\u{1F4CF}", synset: { id: "13515941-n", lemma: "number", pos: "n" } }
  ];

  const FIXTURE_EDGES = [
    { from: "gate", to: "logos", type: "hyp" },
    { from: "logos", to: "number", type: "entails" }
  ];

  function buildTopology() {
    const nodes = FIXTURE_MOTIFS.map(m => {
      const n = createGenomeNode(m.id, m.motif, m.emoji, m.synset);
      compileGenomeNode(n);
      return n;
    });
    return compileWorldTopology(nodes, FIXTURE_EDGES);
  }

  it("1. buildEntityFromNode produces an entity with required fields", () => {
    const node = createGenomeNode("gate", "Gate", "\u{1F6AA}", { id: "07214215-n", lemma: "gate", pos: "n" });
    compileGenomeNode(node);
    const entity = buildEntityFromNode(node, 0, 3);

    assert.equal(entity.id, "gate");
    assert.equal(entity.motif, "Gate");
    assert.equal(entity.emoji, "\u{1F6AA}");
    assert.equal(entity.synset, "gate");
    assert(entity.carrierHex !== null);
    assert(entity.carrierHex.startsWith("0x"));
    assert.equal(entity.carrierHex.length, 66);
    assert(entity.position.x !== undefined);
    assert(entity.position.y !== undefined);
    assert(entity.position.z !== undefined);
  });

  it("2. buildEntityList produces entities for all topology nodes", () => {
    const topo = buildTopology();
    const entities = buildEntityList(topo);
    assert.equal(entities.length, FIXTURE_MOTIFS.length);
    entities.forEach((e, i) => {
      assert.equal(e.id, FIXTURE_MOTIFS[i].id);
      assert.equal(e.motif, FIXTURE_MOTIFS[i].motif);
    });
  });

  it("3. Each entity has carrier hex and data attributes", () => {
    const topo = buildTopology();
    const entities = buildEntityList(topo);

    for (const e of entities) {
      assert(e.dataAttributes["data-o-word"], "Missing data-o-word");
      assert(e.dataAttributes["data-omi"], "Missing data-omi");
      assert(e.dataAttributes["data-omo"], "Missing data-omo (motif)");
      assert(e.dataAttributes["data-imi"], "Missing data-imi (emoji)");
    }
  });

  it("4. entityToAframeHTML produces a valid A-Frame entity string", () => {
    const node = createGenomeNode("gate", "Gate", "\u{1F6AA}", { id: "07214215-n", lemma: "gate", pos: "n" });
    compileGenomeNode(node);
    const entity = buildEntityFromNode(node, 0, 1);
    const html = entityToAframeHTML(entity);

    assert(html.includes("<a-entity"), "Must be an a-entity element");
    assert(html.includes('id="gate"'), "Must have id attribute");
    assert(html.includes("geometry="), "Must have geometry");
    assert(html.includes("material="), "Must have material");
    assert(html.includes("position="), "Must have position");
    assert(html.includes('data-o-word='), "Must have data-o-word");
    assert(html.includes('data-omi='), "Must have data-omi");
    assert(html.includes('data-omo='), "Must have data-omo");
    assert(html.includes('data-imi='), "Must have data-imi");
  });

  it("5. compileTopologyToScene produces complete scene data", () => {
    const topo = buildTopology();
    const scene = compileTopologyToScene(topo);

    assert.equal(scene.entityCount, FIXTURE_MOTIFS.length);
    assert(typeof scene.html === "string");
    assert(scene.html.length > 0);
    assert(scene.html.includes("<a-entity"));
    assert(scene.html.includes("data-o-word"));
  });

  it("6. Receipt state affects entity color (data attributes)", () => {
    const node = createGenomeNode("test", "Gate", "\u{1F6AA}", null);
    compileGenomeNode(node);
    const entityNoReceipt = buildEntityFromNode(node, 0, 1);
    assert(!entityNoReceipt.dataAttributes["data-receipt"]);

    node.receipt = {};
    const entityReceipt = buildEntityFromNode(node, 0, 1);
    assert.equal(entityReceipt.dataAttributes["data-receipt"], "1");
  });

  it("7. A-Frame projection does not mutate carrier source", () => {
    const topo = buildTopology();
    compileTopologyToScene(topo);
    assertNoMutation(topo);
  });

  it("8. No A-Frame entity is source authority (carrier remains in genome)", () => {
    const topo = buildTopology();
    const scene = compileTopologyToScene(topo);

    for (const entity of scene.entities) {
      assert(entity.carrierHex, "Entity references carrier");
      assert(entity.motif, "Entity carries motif");
      assert(entity.synset, "Entity carries synset lemma");

      const node = topo.getNode(entity.id);
      assert(node, "Node exists in topology");
      assert.equal(
        BigInt(node.carrier).toString(16).padStart(64, "0"),
        entity.carrierHex.replace("0x", ""),
        "Entity carrierHex matches genome carrier"
      );
    }
  });
});
