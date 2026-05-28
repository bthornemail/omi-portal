import { CHANNEL_META } from "../pos-tags.js";
import { fnv1a32, toIPv4HostRoute, toIPv6Centroid, cidrMetric } from "../addressing/cidr.js";
import { DOM_CSSOM_VERTEX_SETS } from "./dom-cssom-reference.js";

const COLOR = Object.freeze({ FS: "5", GS: "6", RS: "3", US: "4" });

function centroidSeed(channel, set, termCentroids) {
  const stableTerms = termCentroids
    .filter((c) => c.metric?.stable)
    .map((c) => `${c.lemma}:${c.hash32}`)
    .sort();
  return JSON.stringify({ v: "omi.dom-cssom.vertex.v0", channel, label: set.label, terms: set.terms, stableTerms });
}

export function makeDOMCSSOMTetrahedron(termCentroids = [], options = {}) {
  const centroidSeedText = JSON.stringify({
    v: "omi.dom-cssom.tetrahedron.v0",
    terms: termCentroids.map((c) => `${c.lemma}:${c.hash32}:${c.relationCount}`).sort()
  });

  const centroid = {
    id: "dom-cssom-centroid",
    v: "omi.dom-cssom.centroid.v0",
    label: "DOM.CSSOM.WordNet/128",
    ipv6: toIPv6Centroid(centroidSeedText),
    ipv4: toIPv4HostRoute(centroidSeedText),
    minRelations: options.minRelations ?? 6,
    metric: cidrMetric(128, termCentroids.filter((c) => c.metric?.stable).length, 1),
    stableTermCount: termCentroids.filter((c) => c.metric?.stable).length,
    totalTermCount: termCentroids.length
  };

  const vertices = Object.entries(DOM_CSSOM_VERTEX_SETS).map(([channel, set], i) => {
    const seed = centroidSeed(channel, set, termCentroids);
    const meta = CHANNEL_META[channel];
    return {
      id: `vertex-${channel.toLowerCase()}`,
      channel,
      label: set.label,
      type: meta.nodeType,
      controlCode: meta.code,
      ipv4: toIPv4HostRoute(seed),
      ipv6: toIPv6Centroid(seed),
      metric: cidrMetric(32, set.terms.length, 6),
      interfaces: set.terms,
      color: COLOR[channel],
      tetrahedronIndex: i
    };
  });

  const edges = [
    ["FS", "GS"], ["FS", "RS"], ["FS", "US"],
    ["GS", "RS"], ["GS", "US"], ["RS", "US"]
  ].map(([a, b]) => ({
    id: `tetra-edge-${a}-${b}`,
    fromNode: `vertex-${a.toLowerCase()}`,
    toNode: `vertex-${b.toLowerCase()}`,
    fromSide: a === "US" ? "left" : "right",
    toSide: b === "FS" ? "right" : "left",
    color: "5",
    label: `${a}.${b}`
  }));

  return { centroid, vertices, edges };
}

export function tetrahedronToJSONCanvas(tetrahedron, { x = 1360, y = 20 } = {}) {
  const positions = {
    FS: [x + 260, y + 40],
    GS: [x + 40, y + 300],
    RS: [x + 480, y + 300],
    US: [x + 260, y + 540]
  };
  const nodes = [
    {
      id: tetrahedron.centroid.id,
      type: "group",
      x,
      y,
      width: 820,
      height: 700,
      color: "6",
      label: `${tetrahedron.centroid.label} · ${tetrahedron.centroid.ipv6}`
    },
    ...tetrahedron.vertices.map((v) => {
      const [vx, vy] = positions[v.channel];
      const common = {
        id: v.id,
        type: v.type,
        x: vx,
        y: vy,
        width: 280,
        height: 110,
        color: v.color
      };
      const text = `${v.channel} ${v.controlCode}\n${v.label}\n${v.ipv4}\n${v.ipv6}\ninterfaces=${v.interfaces.length}`;
      if (v.type === "file") return { ...common, file: `blob://dom-cssom/${v.channel}.bin`, label: text };
      if (v.type === "link") return { ...common, url: `urn:omi:dom-cssom:${v.channel.toLowerCase()}`, label: text };
      if (v.type === "group") return { ...common, label: text };
      return { ...common, text };
    })
  ];

  const edges = tetrahedron.edges.map((e) => ({ ...e, fromEnd: "none", toEnd: "arrow" }));
  return { nodes, edges };
}
