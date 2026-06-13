import { canTraverse, scoreEdge } from "./neat-topology-policy.js";

export function handleEntityClick(entityId, topology) {
  const node = topology.getNode(entityId);
  if (!node) return null;

  const routes = getEntityRouteOptions(entityId, topology);
  return {
    entityId,
    entityNode: node,
    routes,
    timestamp: Date.now(),
    activated: true
  };
}

export function getEntityRouteOptions(entityId, topology) {
  const node = topology.getNode(entityId);
  if (!node) return [];

  const edges = topology.getEdges(entityId);
  const options = [];

  for (const edge of edges) {
    const toNode = topology.getNode(edge.to);
    if (!toNode) continue;

    const fromNode = topology.getNode(edge.from);
    if (!fromNode) continue;

    if (!canTraverse(fromNode, toNode, edge.type)) continue;

    options.push({
      fromId: edge.from,
      toId: edge.to,
      type: edge.type,
      fromMotif: fromNode.motif,
      toMotif: toNode.motif,
      fromEmoji: fromNode.emoji,
      toEmoji: toNode.emoji,
      score: scoreEdge(fromNode, toNode, edge.type)
    });
  }

  return options;
}

export function isEntityActivated(entityId, activations) {
  return activations.some(a => a.entityId === entityId);
}

export function getActivationForEntity(entityId, activations) {
  return activations.find(a => a.entityId === entityId) || null;
}
