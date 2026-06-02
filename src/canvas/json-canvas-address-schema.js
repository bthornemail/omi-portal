const HEX6_RE = /^[0-9A-Fa-f]{6}$/;
const HEX2_RE = /^[0-9A-Fa-f]{2}$/;
const HEX8_RE = /^[0-9A-Fa-f]{8}$/;

const PRESET_NAMES = Object.freeze({
  "1": "red", "2": "orange", "3": "yellow",
  "4": "green", "5": "cyan", "6": "purple",
});

const PRESET_HEX = Object.freeze({
  "1": "#FF0000", "2": "#FFA500", "3": "#FFFF00",
  "4": "#00FF00", "5": "#00FFFF", "6": "#800080",
});

export function parseRgbHex(color) {
  if (typeof color !== "string") return null;
  const stripped = color.replace(/^#/, "");
  if (!HEX6_RE.test(stripped)) return null;
  return {
    hex: stripped,
    display: `#${stripped}`,
    red: parseInt(stripped.substring(0, 2), 16),
    green: parseInt(stripped.substring(2, 4), 16),
    blue: parseInt(stripped.substring(4, 6), 16),
    isValid: true,
  };
}

export function parseCanvasPresetColor(color) {
  if (typeof color !== "string") return null;
  const key = color.trim();
  if (!PRESET_NAMES[key]) return null;
  return {
    key,
    name: PRESET_NAMES[key],
    hex: PRESET_HEX[key],
    isValid: true,
  };
}

export function classifyCanvasColorAuthority(color) {
  if (typeof color !== "string") {
    return { authority: "invalid", layer: null, color };
  }
  const hex = parseRgbHex(color.replace(/^#/, "") ? color : "");
  if (color.startsWith("#") || HEX6_RE.test(color.replace(/^#/, ""))) {
    const parsed = parseRgbHex(color);
    if (parsed) {
      return {
        authority: "lower-structural",
        layer: "≤8!",
        color: parsed.display,
        hex: parsed.hex,
        red: parsed.red,
        green: parsed.green,
        blue: parsed.blue,
        isHex: true,
        isPreset: false,
      };
    }
  }
  const preset = parseCanvasPresetColor(color);
  if (preset) {
    return {
      authority: "upper-reader-cosmetic",
      layer: "9!–12!",
      color: preset.key,
      hex: preset.hex,
      name: preset.name,
      isHex: false,
      isPreset: true,
    };
  }
  return { authority: "invalid", layer: null, color };
}

export function composeRRGGBBAA(rgb, aa) {
  if (typeof rgb === "string") {
    const stripped = rgb.replace(/^#/, "");
    if (!HEX6_RE.test(stripped)) return null;
    rgb = parseInt(stripped, 16);
  }
  if (typeof aa === "string") {
    if (!HEX2_RE.test(aa)) return null;
    aa = parseInt(aa, 16);
  }
  if (typeof rgb !== "number" || typeof aa !== "number") return null;
  if (rgb < 0 || rgb > 0xFFFFFF || aa < 0 || aa > 0xFF) return null;
  const seed32 = ((rgb << 8) | aa) >>> 0;
  const rgbHex = rgb.toString(16).padStart(6, "0");
  const aaHex = aa.toString(16).padStart(2, "0");
  return {
    rgb,
    aa,
    seed32,
    hex: `${rgbHex}${aaHex}`,
    display: `#${rgbHex}`,
    aaDisplay: `0x${aaHex}`,
  };
}

export function buildJsonCanvasOmiVertex(node) {
  if (!node || typeof node.id !== "string" || typeof node.x !== "number" || typeof node.y !== "number") {
    return { valid: false, error: "node must have id, x, y" };
  }
  const type = node.type || "text";
  const width = node.width || 240;
  const height = node.height || 120;
  const colorAuth = node.color ? classifyCanvasColorAuthority(node.color) : null;
  const validTypes = new Set(["text", "file", "link", "group"]);
  if (!validTypes.has(type)) {
    return { valid: false, error: `invalid type: ${type}` };
  }
  return {
    valid: true,
    vertex: {
      id: node.id,
      type,
      x: node.x,
      y: node.y,
      width,
      height,
      color: colorAuth,
    },
  };
}

export function buildJsonCanvasOmiEdge(edge) {
  if (!edge || typeof edge.id !== "string" || typeof edge.fromNode !== "string" || typeof edge.toNode !== "string") {
    return { valid: false, error: "edge must have id, fromNode, toNode" };
  }
  const validSides = new Set(["top", "right", "bottom", "left"]);
  const fromSide = edge.fromSide && validSides.has(edge.fromSide) ? edge.fromSide : null;
  const toSide = edge.toSide && validSides.has(edge.toSide) ? edge.toSide : null;
  const colorAuth = edge.color ? classifyCanvasColorAuthority(edge.color) : null;
  return {
    valid: true,
    edge: {
      id: edge.id,
      fromNode: edge.fromNode,
      toNode: edge.toNode,
      fromSide,
      toSide,
      fromEnd: edge.fromEnd || "none",
      toEnd: edge.toEnd || "arrow",
      color: colorAuth,
      label: edge.label || null,
    },
  };
}

export function buildOmiGraph(nodes, edges) {
  const vertices = (nodes || []).map(buildJsonCanvasOmiVertex).filter(v => v.valid).map(v => v.vertex);
  const relations = (edges || []).map(buildJsonCanvasOmiEdge).filter(e => e.valid).map(e => e.edge);
  const incidence = [];
  for (const v of vertices) {
    for (const r of relations) {
      if (r.fromNode === v.id || r.toNode === v.id) {
        incidence.push({ vertexId: v.id, edgeId: r.id, side: r.fromNode === v.id ? r.fromSide : r.toSide });
      }
    }
  }
  return { V: vertices, E: relations, I: incidence, vertexCount: vertices.length, edgeCount: relations.length, incidenceCount: incidence.length };
}
