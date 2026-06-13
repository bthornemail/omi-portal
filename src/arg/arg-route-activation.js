import { compileGenomeNode } from "./world-genome.js";
import { scoreEdge, edgePriority } from "./neat-topology-policy.js";

export function activateRoute(topology, fromId, edgeType) {
  const fromNode = topology.getNode(fromId);
  if (!fromNode) return null;

  const edges = topology.getEdges(fromId).filter(e => e.type === edgeType);
  if (edges.length === 0) return null;

  const toNode = topology.getNode(edges[0].to);
  if (!toNode) return null;

  if (fromNode.carrier == null) compileGenomeNode(fromNode);
  if (toNode.carrier == null) compileGenomeNode(toNode);

  const fromCarrier = BigInt(fromNode.carrier);
  const toCarrier = BigInt(toNode.carrier);

  const reading = (fromCarrier ^ (toCarrier << 1n)) & ((1n << 128n) - 1n);

  return {
    fromId,
    toId: edges[0].to,
    edgeType,
    fromMotif: fromNode.motif,
    toMotif: toNode.motif,
    reading,
    score: scoreEdge(fromNode, toNode, edgeType),
    timestamp: Date.now(),
    activated: true
  };
}

export function getCandidateReading(activation) {
  if (!activation || !activation.activated) return null;

  return {
    source: `${activation.fromMotif || activation.fromId}→${activation.toMotif || activation.toId}`,
    route: activation.edgeType,
    reading: activation.reading.toString(16).padStart(32, "0"),
    score: activation.score
  };
}

export function resolveActivation(activation, accept, topology, receiptFn) {
  if (!activation || !activation.activated) return null;

  const toNode = topology.getNode(activation.toId);
  if (!toNode) return null;

  const receipt = accept
    ? receiptFn(toNode, topology)
    : receiptFn(toNode, topology);

  if (receipt) {
    toNode.receipt = receipt;
  }

  return {
    resolved: true,
    accept,
    activation,
    receipt,
    timestamp: Date.now()
  };
}
