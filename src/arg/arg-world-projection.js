import { scoreEdge, canTraverse, isReceiptStable } from "./neat-topology-policy.js";
import { compileGenomeNode } from "./world-genome.js";

export function scoreTopology(topology) {
  let totalScore = 0;
  let edgeCount = 0;
  for (const edges of topology.adjacency.values()) {
    for (const e of edges) {
      const fromNode = topology.getNode(e.from);
      const toNode = topology.getNode(e.to);
      if (fromNode && toNode) {
        totalScore += scoreEdge(fromNode, toNode, e.type);
        edgeCount++;
      }
    }
  }

  const nodeCount = topology.nodes.size;
  const connectivity = nodeCount > 0 ? edgeCount / nodeCount : 0;
  const receiptRatio = [...topology.nodes.values()].filter(n => isReceiptStable(n)).length / Math.max(nodeCount, 1);

  return {
    totalScore,
    edgeCount,
    nodeCount,
    connectivity,
    receiptRatio,
    combinedScore: totalScore * (1 + connectivity) * (1 + receiptRatio)
  };
}

export function findCandidateRoutes(topology, startId, endId) {
  const visited = new Set();
  const queue = [{ id: startId, path: [], score: 0 }];
  const results = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.id === endId) {
      results.push({ path: [...current.path, current.id], score: current.score });
      continue;
    }
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    for (const { node, edge } of topology.getNeighbors(current.id)) {
      if (visited.has(node.id)) continue;
      const fromNode = topology.getNode(edge.from);
      const toNode = topology.getNode(edge.to);
      if (!canTraverse(fromNode, toNode, edge.type)) continue;
      queue.push({
        id: node.id,
        path: [...current.path, current.id],
        score: current.score + scoreEdge(fromNode, toNode, edge.type)
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

export function assertNoMutation(topology) {
  for (const [id, node] of topology.nodes) {
    const original = BigInt(node.carrier);
    compileGenomeNode(node);
    const current = BigInt(node.carrier);
    if (original !== current) {
      throw new Error(`Carrier mutation detected for node ${id}`);
    }
  }
  return true;
}
