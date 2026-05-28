import { CHANNEL_META } from "../pos-tags.js";
import { makeOmiAddressForAtom } from "../omi/index.js";

const COLOR = Object.freeze({ FS: "5", GS: "6", RS: "3", US: "4" });

export function toJSONCanvas(nodes, edges, { centroid = "2001:db8::8/128" } = {}) {
  const groups = Object.keys(CHANNEL_META).map((channel, i) => ({
    id: `group-${channel}`,
    type: "group",
    x: 20 + i * 320,
    y: 20,
    width: 300,
    height: 620,
    color: COLOR[channel],
    label: `${channel} ${CHANNEL_META[channel].code} · ${CHANNEL_META[channel].role}`
  }));

  const lanes = { FS: 0, GS: 1, RS: 2, US: 3 };
  const counts = { FS: 0, GS: 0, RS: 0, US: 0 };
  const canvasNodes = nodes.map((n) => {
    const lane = lanes[n.channel] ?? 3;
    const y = 80 + counts[n.channel]++ * 130;
    const omi = makeOmiAddressForAtom(n);
    const common = {
      id: n.id,
      type: n.type,
      x: 40 + lane * 320,
      y,
      width: 260,
      height: 92,
      color: COLOR[n.channel],
      omi
    };

    if (n.type === "file") return { ...common, file: `blob://${n.urn.replaceAll(":", "/")}.bin` };
    if (n.type === "link") return { ...common, url: n.urn, label: n.label };
    if (n.type === "group") return { ...common, label: n.label };
    return { ...common, text: n.text };
  });

  const canvasEdges = edges.map((e) => ({
    id: e.id,
    fromNode: e.fromNode,
    fromSide: e.fromSide,
    fromEnd: "none",
    toNode: e.toNode,
    toSide: e.toSide,
    toEnd: "arrow",
    color: e.color,
    label: e.label
  }));

  return {
    nodes: [
      {
        id: "centroid",
        type: "group",
        x: 0,
        y: 0,
        width: 1320,
        height: 700,
        color: "6",
        label: `ChiralCanvasCentroid ${centroid} · FS.GS.RS.US/128`
      },
      ...groups,
      ...canvasNodes
    ],
    edges: canvasEdges
  };
}
