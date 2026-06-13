export function validateEdgeType(type) {
  const valid = ["hyp", "entails", "similar", "mirrors",
    "unlocks", "requires", "receipts", "routes"];
  return valid.includes(type);
}

export function edgePriority(type) {
  const map = {
    hyp: 0, entails: 1, similar: 2, mirrors: 3,
    unlocks: 4, requires: 5, receipts: 6, routes: 7
  };
  return map[type] ?? -1;
}

export function scoreEdge(fromNode, toNode, type) {
  let score = 1.0;
  if (type === "hyp") score = 1.0;
  else if (type === "entails") score = 1.5;
  else if (type === "similar") score = 0.8;
  else if (type === "mirrors") score = 1.2;
  else if (type === "unlocks") score = 2.0;
  else if (type === "requires") score = -1.0;
  else if (type === "receipts") score = 0.5;
  else if (type === "routes") score = 1.0;

  if (fromNode.receipt !== null) score += 0.5;
  if (toNode.receipt !== null) score += 0.3;
  if (fromNode.emoji) score += 0.2;
  if (toNode.emoji) score += 0.1;
  if (fromNode.synset && toNode.synset) score += 0.4;

  return score;
}

export function isReceiptStable(node) {
  return node.receipt !== null;
}

export function canTraverse(fromNode, toNode, type) {
  if (type === "requires" && toNode.receipt === null) return false;
  if (type === "unlocks" && fromNode.receipt === null) return false;
  return true;
}
