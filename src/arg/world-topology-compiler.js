import { compileGenomeNode, createGenomeNode, createEdge } from "./world-genome.js";
import { canTraverse } from "./neat-topology-policy.js";

export function compileWorldTopology(genomeNodes, edges) {
  const nodes = new Map();
  for (const node of genomeNodes) {
    const n = createGenomeNode(node.id, node.motif, node.emoji, node.synset);
    if (node.receipt !== undefined) n.receipt = node.receipt;
    if (node.metadata) n.metadata = { ...node.metadata };
    compileGenomeNode(n);
    nodes.set(n.id, n);
  }

  const edgeList = edges.map(e => createEdge(e.from, e.to, e.type));
  const adjacency = new Map();
  for (const n of nodes.keys()) adjacency.set(n, []);
  for (const e of edgeList) {
    if (nodes.has(e.from) && nodes.has(e.to)) {
      adjacency.get(e.from).push(e);
    }
  }

  return {
    nodes,
    edges: edgeList,
    adjacency,
    getNode(id) { return this.nodes.get(id) || null; },
    getEdges(from) { return this.adjacency.get(from) || []; },
    getNeighbors(from) {
      return this.getEdges(from).map(e => ({
        node: this.nodes.get(e.to),
        edge: e
      }));
    }
  };
}

let _synsetOverride = null;

export function setSynsetOverride(fn) {
  _synsetOverride = fn;
}

export function resolveMotifToEmoji(motif) {
  const map = {
    Gate: "\u{1F6AA}",
    Logos: "\u{1F4DD}\u{2728}\u{1F54A}\uFE0F",
    Number: "\u{1F522}\u{1F4CA}\u{1F4CF}",
    Covenant: "\u{1F91D}\u{1F4DC}",
    Beast: "\u{1F409}",
    Watcher: "\u{1F441}\uFE0F\u{270D}\uFE0F",
    Law: "\u{2696}\uFE0F\u{1F4CF}",
    Wisdom: "\u{1F451}\u{1F4DC}\u{1F56D}\uFE0F",
    Tribe: "\u{1F9EC}\u{1F525}\u{1F91D}"
  };
  return map[motif] || null;
}

export function resolveMotifToSynset(motif) {
  if (_synsetOverride) {
    const result = _synsetOverride(motif);
    if (result) return result;
  }
  const map = {
    Gate: { id: "07214215-n", lemma: "gate", pos: "n" },
    Logos: { id: "05987510-n", lemma: "logos", pos: "n" },
    Number: { id: "13515941-n", lemma: "number", pos: "n" },
    Covenant: { id: "01053260-n", lemma: "covenant", pos: "n" },
    Beast: { id: "00021535-n", lemma: "beast", pos: "n" },
    Watcher: { id: "10036572-n", lemma: "watcher", pos: "n" },
    Law: { id: "05122310-n", lemma: "law", pos: "n" },
    Wisdom: { id: "05621328-n", lemma: "wisdom", pos: "n" },
    Tribe: { id: "07983171-n", lemma: "tribe", pos: "n" }
  };
  return map[motif] || null;
}

export function getNodeCarrier(node) {
  return node.carrier;
}
