import { classifyCanvasColor } from "./omi-canvas-color-router.js";
import { omiQuadraticProject, omiLocal240, JSON_CANVAS_SIDES } from "./omicron-canvas.js";

const CANONICAL_NODE_TYPES = new Set(["text", "file", "link", "group"]);

const SIDE_TO_TANGENT = Object.freeze({
  top: "upper-reader-shell",
  right: "forward-tangent-crossing",
  bottom: "lower-structural-body",
  left: "reverse-tangent-crossing",
});

const TANGENT_TO_SIDE = Object.freeze({
  "upper-reader-shell": "top",
  "forward-tangent-crossing": "right",
  "lower-structural-body": "bottom",
  "reverse-tangent-crossing": "left",
});

function validateJsonCanvasId(id) {
  return typeof id === "string" && id.length > 0;
}

function validateJsonCanvasType(type) {
  return CANONICAL_NODE_TYPES.has(type);
}

function validateJsonCanvasCoord(v) {
  return Number.isInteger(v);
}

function validateJsonCanvasDimension(v) {
  return Number.isInteger(v) && v > 0;
}

export function _validateJsonCanvasNode(node) {
  if (!validateJsonCanvasId(node.id)) return { valid: false, error: "id must be a non-empty string" };
  if (!validateJsonCanvasType(node.type)) return { valid: false, error: `type must be one of: ${[...CANONICAL_NODE_TYPES].join(", ")}` };
  if (!validateJsonCanvasCoord(node.x)) return { valid: false, error: "x must be an integer" };
  if (!validateJsonCanvasCoord(node.y)) return { valid: false, error: "y must be an integer" };
  if (!validateJsonCanvasDimension(node.width)) return { valid: false, error: "width must be a positive integer" };
  if (!validateJsonCanvasDimension(node.height)) return { valid: false, error: "height must be a positive integer" };
  return { valid: true };
}

export function _validateJsonCanvasEdge(edge) {
  if (!validateJsonCanvasId(edge.id)) return { valid: false, error: "id must be a non-empty string" };
  if (!validateJsonCanvasId(edge.fromNode)) return { valid: false, error: "fromNode must be a non-empty string" };
  if (!validateJsonCanvasId(edge.toNode)) return { valid: false, error: "toNode must be a non-empty string" };
  if (edge.fromSide && !JSON_CANVAS_SIDES.includes(edge.fromSide)) return { valid: false, error: `fromSide must be one of: ${JSON_CANVAS_SIDES.join(", ")}` };
  if (edge.toSide && !JSON_CANVAS_SIDES.includes(edge.toSide)) return { valid: false, error: `toSide must be one of: ${JSON_CANVAS_SIDES.join(", ")}` };
  return { valid: true };
}

export function routeCanvasNode(node) {
  const validation = _validateJsonCanvasNode(node);
  if (!validation.valid) return { ...validation, node };

  const geometry = {
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  };

  const q = omiQuadraticProject(node.x, node.y);
  const local240 = omiLocal240(node.x, node.y);

  let colorRoute = null;
  if (node.color != null) {
    colorRoute = classifyCanvasColor(node.color);
  }

  const omi = {
    address: null,
    qxy: q,
    local240,
    type: node.type,
    geometry: "structural-body",
    color: colorRoute,
  };

  return { valid: true, node, omi, geometry };
}

export function routeCanvasEdge(edge) {
  const validation = _validateJsonCanvasEdge(edge);
  if (!validation.valid) return { ...validation, edge };

  const fromTangent = edge.fromSide ? SIDE_TO_TANGENT[edge.fromSide] : null;
  const toTangent = edge.toSide ? SIDE_TO_TANGENT[edge.toSide] : null;

  let colorRoute = null;
  if (edge.color != null) {
    colorRoute = classifyCanvasColor(edge.color);
  }

  return {
    valid: true,
    edge: {
      id: edge.id,
      fromNode: edge.fromNode,
      toNode: edge.toNode,
      fromSide: edge.fromSide,
      toSide: edge.toSide,
      fromEnd: edge.fromEnd || "none",
      toEnd: edge.toEnd || "arrow",
      label: edge.label || null,
    },
    omi: {
      fromTangent,
      toTangent,
      color: colorRoute,
      structural: true,
    },
  };
}

export function sideToTangent(side) {
  return SIDE_TO_TANGENT[side] || null;
}

export function tangentToSide(tangent) {
  return TANGENT_TO_SIDE[tangent] || null;
}

export function buildOmiCanvas(schema) {
  const { nodes = [], edges = [] } = schema;
  const routedNodes = nodes.map(routeCanvasNode);
  const routedEdges = edges.map(routeCanvasEdge);
  const validNodes = routedNodes.filter(n => n.valid);
  const validEdges = routedEdges.filter(e => e.valid);
  return {
    valid: true,
    nodeCount: validNodes.length,
    edgeCount: validEdges.length,
    nodes: validNodes,
    edges: validEdges,
    errorCount: (routedNodes.length + routedEdges.length) - (validNodes.length + validEdges.length),
  };
}
