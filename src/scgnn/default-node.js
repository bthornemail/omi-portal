import { CHANNEL_META, CHANNELS } from "../pos-tags.js";
import { resolveChiralURN } from "../runtime/chiral-urn.js";

// Default node SCGNN = small structural graph node policy.
// It is not a trained semantic model; it projects POS-token features into
// deterministic graph-state channels that TinyNEAT can evolve over.
export function makeDefaultSCGNNNode(featureToken, index, total) {
  const meta = CHANNEL_META[featureToken.channel];
  const stateA = (index + featureToken.pos.length) & 0xF;
  const stateB = (featureToken.token.length + total) & 0xF;
  const urn = resolveChiralURN({ stateA, stateB, portId: parseInt(meta.code, 16), namespace: featureToken.pos.toLowerCase() });
  const wordnet = featureToken.wordnet;

  return {
    id: featureToken.id,
    type: meta.nodeType,
    label: `${featureToken.pos}:${featureToken.token}`,
    text: `${featureToken.feature}\n${featureToken.transition}\n${urn.urn}${wordnet ? `\nWN:${wordnet.ipv6}\nrelations=${wordnet.relationCount}/${wordnet.metric.minRelations}` : ""}`,
    channel: featureToken.channel,
    controlCode: meta.code,
    address: wordnet?.ipv4 || meta.ipv4,
    channelAddress: meta.ipv4,
    centroid: wordnet?.ipv6,
    wordnet,
    urn: urn.urn,
    executable: urn.executable,
    feature: {
      pos: featureToken.pos,
      tokenLength: featureToken.token.length,
      normalizedIndex: total <= 1 ? 0 : index / (total - 1),
      channelOneHot: CHANNELS.map((ch) => ch === featureToken.channel ? 1 : 0)
    }
  };
}

export function connectDefaultSCGNN(nodes) {
  const edges = [];
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const next = nodes[i];
    edges.push({
      id: `edge-${String(i - 1).padStart(4, "0")}-${String(i).padStart(4, "0")}`,
      fromNode: prev.id,
      toNode: next.id,
      fromSide: prev.channel === "US" ? "left" : "right",
      toSide: next.channel === "FS" ? "right" : "left",
      label: `${prev.channel}→${next.channel}`,
      color: next.executable ? "4" : "5"
    });
  }
  return edges;
}
