import { createGenomeNode, compileGenomeNode, createEdge } from "./world-genome.js";
import { compileWorldTopology } from "./world-topology-compiler.js";
import { resolveMotifToEmoji, resolveMotifToSynset } from "./world-topology-compiler.js";
import { compileTopologyToScene } from "./aframe-world-entity.js";

export function compileBeatToTopology(beat) {
  const motifs = beat.motifs || [];
  if (motifs.length === 0) {
    return { topology: null, scene: null, nodeCount: 0 };
  }

  const validMotifs = motifs.filter(m => resolveMotifToEmoji(m) !== null);
  if (validMotifs.length === 0) {
    return { topology: null, scene: null, nodeCount: 0 };
  }

  const nodes = validMotifs.map((m, i) => {
    const n = createGenomeNode(
      `${beat.beatId}::${m.toLowerCase()}`,
      m,
      resolveMotifToEmoji(m),
      resolveMotifToSynset(m)
    );
    compileGenomeNode(n);
    return n;
  });

  const edges = [];
  for (let i = 1; i < nodes.length; i++) {
    edges.push(createEdge(nodes[i - 1].id, nodes[i].id, "hyp"));
  }

  const topology = compileWorldTopology(nodes, edges);
  const scene = compileTopologyToScene(topology);

  return { topology, scene, nodeCount: nodes.length };
}

export function compileBeatToEntities(beat) {
  const result = compileBeatToTopology(beat);
  return result.scene ? result.scene.entities : [];
}

export function compileSceneToTopology(scene) {
  const allNodes = [];
  const allEdges = [];
  const allTopologies = [];

  for (const beat of scene.beats) {
    const result = compileBeatToTopology(beat);
    if (result.topology) {
      allTopologies.push(result.topology);
      for (const [id, node] of result.topology.nodes) {
        allNodes.push(node);
      }
      for (const edge of result.topology.edges) {
        allEdges.push(edge);
      }
    }
  }

  if (allNodes.length === 0) return null;

  const merged = compileWorldTopology(allNodes, allEdges);
  return merged;
}
