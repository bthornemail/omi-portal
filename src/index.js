import { readPOSTokens } from "./nlp/wink-pos.js";
import { featureTokens, posFeatureVector } from "./nlp/features.js";
import { makeDefaultSCGNNNode, connectDefaultSCGNN } from "./scgnn/default-node.js";
import { toJSONCanvas } from "./canvas/json-canvas.js";
import { enrichFeatureTokensWithWordNet } from "./wordnet/relation-space.js";
import { makeDOMCSSOMTetrahedron, tetrahedronToJSONCanvas } from "./web/dom-cssom-tetrahedron.js";

export function compileTextToPOSSCGNN(text, options = {}) {
  const tokens = readPOSTokens(text);
  const features = posFeatureVector(tokens);
  const fTokens = featureTokens(tokens);
  const nodes = fTokens.map((ft, i) => makeDefaultSCGNNNode(ft, i, fTokens.length));
  const edges = connectDefaultSCGNN(nodes);
  const canvas = toJSONCanvas(nodes, edges, options);
  return { tokens, features, featureTokens: fTokens, nodes, edges, canvas };
}

export async function compileTextToWordNetTetraSCGNN(text, { wordpos, minRelations = 6, ...options } = {}) {
  const tokens = readPOSTokens(text);
  const features = posFeatureVector(tokens);
  const baseFeatureTokens = featureTokens(tokens);
  const enrichedFeatureTokens = await enrichFeatureTokensWithWordNet(baseFeatureTokens, wordpos, { minRelations });
  const nodes = enrichedFeatureTokens.map((ft, i) => makeDefaultSCGNNNode(ft, i, enrichedFeatureTokens.length));
  const edges = connectDefaultSCGNN(nodes);
  const tetrahedron = makeDOMCSSOMTetrahedron(nodes.map((n) => n.wordnet).filter(Boolean), { minRelations });
  const baseCanvas = toJSONCanvas(nodes, edges, options);
  const tetraCanvas = tetrahedronToJSONCanvas(tetrahedron, options.tetrahedronCanvas || {});
  const canvas = {
    nodes: [...baseCanvas.nodes, ...tetraCanvas.nodes],
    edges: [...baseCanvas.edges, ...tetraCanvas.edges]
  };
  return {
    tokens,
    features,
    featureTokens: enrichedFeatureTokens,
    nodes,
    edges,
    tetrahedron,
    canvas
  };
}

export * from "./pos-tags.js";
export * from "./nlp/features.js";
export * from "./scgnn/default-node.js";
export * from "./canvas/json-canvas.js";
export * from "./canvas/smith-canvas.js";
export * from "./bidi/omi-bidi-cm6-bridge.js";
export * from "./runtime/cla4.js";
export * from "./runtime/chiral-urn.js";
export * from "./runtime/chiral-smith.js";
export * from "./runtime/polytope-sab.js";
export * from "./addressing/cidr.js";
export * from "./addressing/synset-cells.js";
export * from "./omi/index.js";
export * from "./omi/fano-prolog.js";
export * from "./omi/file-compiler.js";
export * from "./wordnet/prolog-broker.js";
export * from "./wordnet/relation-space.js";
export * from "./web/dom-cssom-reference.js";
export * from "./web/dom-cssom-registry.js";
export * from "./web/dom-cssom-tetrahedron.js";
export * from "./web/triplicate-projection.js";
export * from "./web/hardware-bus.js";
export * from "./document/animated-document.js";
export * from "./neat/tinyneat-policy.js";
export * from "./distributed/index.js";
