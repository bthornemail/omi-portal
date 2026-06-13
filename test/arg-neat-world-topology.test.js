import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createGenomeNode, compileGenomeNode, genomeToCarrier, carrierToGenome,
  createEdge, EDGE_TYPES
} from "../src/arg/world-genome.js";
import {
  scoreEdge, canTraverse, isReceiptStable, edgePriority, validateEdgeType
} from "../src/arg/neat-topology-policy.js";
import {
  compileWorldTopology, resolveMotifToEmoji, resolveMotifToSynset, getNodeCarrier
} from "../src/arg/world-topology-compiler.js";
import {
  scoreTopology, findCandidateRoutes, assertNoMutation
} from "../src/arg/arg-world-projection.js";
import { unpackOWord } from "../src/omi/o-bitboard.js";

describe("NEAT World Topology (ARG)", () => {
  const FIXTURE_MOTIFS = [
    { id: "gate", motif: "Gate", emoji: "\u{1F6AA}", synset: { id: "07214215-n", lemma: "gate", pos: "n" } },
    { id: "logos", motif: "Logos", emoji: "\u{1F4DD}\u{2728}\u{1F54A}\uFE0F", synset: { id: "05987510-n", lemma: "logos", pos: "n" } },
    { id: "number", motif: "Number", emoji: "\u{1F522}\u{1F4CA}\u{1F4CF}", synset: { id: "13515941-n", lemma: "number", pos: "n" } },
    { id: "beast", motif: "Beast", emoji: "\u{1F409}", synset: { id: "00021535-n", lemma: "beast", pos: "n" } },
    { id: "wisdom", motif: "Wisdom", emoji: "\u{1F451}\u{1F4DC}\u{1F56D}\uFE0F", synset: { id: "05621328-n", lemma: "wisdom", pos: "n" } }
  ];

  const FIXTURE_EDGES = [
    { from: "gate", to: "logos", type: "hyp" },
    { from: "logos", to: "number", type: "entails" },
    { from: "number", to: "beast", type: "mirrors" },
    { from: "wisdom", to: "gate", type: "unlocks" },
    { from: "beast", to: "wisdom", type: "requires" }
  ];

  it("1. Resolves motif to emoji", () => {
    assert.equal(resolveMotifToEmoji("Gate"), "\u{1F6AA}");
    assert.equal(resolveMotifToEmoji("Logos"), "\u{1F4DD}\u{2728}\u{1F54A}\uFE0F");
    assert.equal(resolveMotifToEmoji("Unknown"), null);
  });

  it("2. Resolves motif to WordNet synset", () => {
    const synset = resolveMotifToSynset("Gate");
    assert.notEqual(synset, null);
    assert.equal(synset.lemma, "gate");
    assert.equal(synset.pos, "n");

    assert.equal(resolveMotifToSynset("Unknown"), null);
  });

  it("3. Creates genome nodes with deterministic .o carriers", () => {
    const node = createGenomeNode("gate", "Gate", "\u{1F6AA}", { id: "07214215-n", lemma: "gate", pos: "n" });
    assert.equal(node.id, "gate");
    assert.equal(node.motif, "Gate");

    const word = compileGenomeNode(node);
    assert.equal(typeof word, "bigint");
    assert(word > 0n);
    assert(node.carrier !== null);
    assert.equal(node.carrier, word);

    const recompile = compileGenomeNode(node);
    assert.equal(recompile, word, "Carrier compilation is deterministic");
  });

  it("4. genomeToCarrier and carrierToGenome round-trip", () => {
    const nodes = FIXTURE_MOTIFS.map(m => {
      const n = createGenomeNode(m.id, m.motif, m.emoji, m.synset);
      compileGenomeNode(n);
      return n;
    });

    const carriers = genomeToCarrier(nodes);
    assert.equal(carriers.length, FIXTURE_MOTIFS.length);
    carriers.forEach(c => assert.equal(typeof c, "bigint"));

    const restored = carrierToGenome(carriers);
    assert.equal(restored.length, FIXTURE_MOTIFS.length);
    restored.forEach((n, i) => {
      assert.equal(BigInt(n.carrier), carriers[i]);
    });
  });

  it("5. Builds topology graph from genome nodes and edges", () => {
    const nodes = FIXTURE_MOTIFS.map(m => {
      const n = createGenomeNode(m.id, m.motif, m.emoji, m.synset);
      compileGenomeNode(n);
      return n;
    });

    const topo = compileWorldTopology(nodes, FIXTURE_EDGES);
    assert.equal(topo.nodes.size, FIXTURE_MOTIFS.length);
    assert.equal(topo.edges.length, FIXTURE_EDGES.length);

    const gateNode = topo.getNode("gate");
    assert.notEqual(gateNode, null);
    assert.equal(gateNode.motif, "Gate");

    const gateEdges = topo.getEdges("gate");
    assert(gateEdges.length > 0);
    assert.equal(gateEdges[0].from, "gate");
  });

  it("6. Topology scoring produces deterministic results", () => {
    const nodes = FIXTURE_MOTIFS.map(m => {
      const n = createGenomeNode(m.id, m.motif, m.emoji, m.synset);
      compileGenomeNode(n);
      return n;
    });
    const topo = compileWorldTopology(nodes, FIXTURE_EDGES);

    const score = scoreTopology(topo);
    assert(typeof score.totalScore === "number");
    assert(score.totalScore > 0);
    assert(score.edgeCount === FIXTURE_EDGES.length);
    assert(score.nodeCount === FIXTURE_MOTIFS.length);
    assert(score.combinedScore > 0);

    const reScore = scoreTopology(topo);
    assert.equal(reScore.totalScore, score.totalScore, "Scoring is deterministic");
  });

  it("7. Candidate routes are deterministic and respect traversal rules", () => {
    const nodes = FIXTURE_MOTIFS.map(m => {
      const n = createGenomeNode(m.id, m.motif, m.emoji, m.synset);
      compileGenomeNode(n);
      return n;
    });
    const topo = compileWorldTopology(nodes, FIXTURE_EDGES);

    const routes = findCandidateRoutes(topo, "gate", "beast");
    assert(routes.length > 0, "At least one route found");
    routes.forEach(r => {
      assert(r.path.length >= 2, "Route connects at least two nodes");
      assert(r.path[0] === "gate");
      assert(r.path[r.path.length - 1] === "beast");
    });

    const reRoutes = findCandidateRoutes(topo, "gate", "beast");
    assert.equal(reRoutes.length, routes.length, "Routes are deterministic");
    reRoutes.forEach((r, i) => {
      assert.deepEqual(r.path, routes[i].path);
      assert.equal(r.score, routes[i].score);
    });
  });

  it("8. No route mutates the carrier source", () => {
    const nodes = FIXTURE_MOTIFS.map(m => {
      const n = createGenomeNode(m.id, m.motif, m.emoji, m.synset);
      compileGenomeNode(n);
      return n;
    });
    const topo = compileWorldTopology(nodes, FIXTURE_EDGES);

    findCandidateRoutes(topo, "gate", "beast");
    assertNoMutation(topo);
  });

  it("9. Edge priorities and weights are consistent", () => {
    assert(validateEdgeType("hyp"));
    assert(validateEdgeType("entails"));
    assert(validateEdgeType("similar"));
    assert(!validateEdgeType("unknown"));

    assert(edgePriority("hyp") < edgePriority("entails"));
    assert(edgePriority("entails") < edgePriority("routes"));

    const from = createGenomeNode("a", "Gate", "\u{1F6AA}", null);
    const to = createGenomeNode("b", "Number", "\u{1F522}", null);
    compileGenomeNode(from);
    compileGenomeNode(to);

    const unlockScore = scoreEdge(from, to, "unlocks");
    const reqScore = scoreEdge(from, to, "requires");
    assert(unlockScore > 0);
    assert(reqScore < 0);

    assert.equal(canTraverse(from, to, "requires"), false, "requires blocks when receipt is null");
  });

  it("10. Unpacking a compiled carrier yields valid selector/path/surface", () => {
    const node = createGenomeNode("test-node", "Wisdom", "\u{1F451}", { id: "05621328-n", lemma: "wisdom", pos: "n" });
    compileGenomeNode(node);
    const { selector, path, surface } = unpackOWord(node.carrier);
    assert(selector === 0 || selector === 1);
    assert(typeof path === "number" && path >= 0);
    assert(typeof surface === "bigint" && surface >= 0n);
  });

  it("11. Multi-codepoint emoji sequences compile without breaking", () => {
    const multiEmoji = "\u{1F9EC}\u{1F525}\u{1F91D}";
    const node = createGenomeNode("tribe", "Tribe", multiEmoji, { id: "07983171-n", lemma: "tribe", pos: "n" });
    compileGenomeNode(node);
    const { selector, path, surface } = unpackOWord(node.carrier);
    assert(selector >= 0);
    assert(path >= 0);
    assert(surface >= 0n);

    const recompiled = compileGenomeNode(node);
    assert.equal(recompiled, node.carrier, "Multi-codepoint emoji compilation is deterministic");
  });
});
