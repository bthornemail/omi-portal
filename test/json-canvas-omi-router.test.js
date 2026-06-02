import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  _validateJsonCanvasNode, _validateJsonCanvasEdge,
  routeCanvasNode, routeCanvasEdge,
  sideToTangent, tangentToSide,
  buildOmiCanvas,
} from "../src/canvas/json-canvas-omi-router.js";

describe("JSON Canvas OMI Router — Node Validation", () => {
  const validNode = { id: "n1", type: "text", x: 10, y: 20, width: 100, height: 50 };

  it("accepts valid node", () => {
    assert.deepEqual(_validateJsonCanvasNode(validNode), { valid: true });
  });

  it("rejects node with missing id", () => {
    assert.equal(_validateJsonCanvasNode({ ...validNode, id: "" }).valid, false);
  });

  it("rejects node with invalid type", () => {
    assert.equal(_validateJsonCanvasNode({ ...validNode, type: "invalid" }).valid, false);
  });

  it("rejects node with non-integer x", () => {
    assert.equal(_validateJsonCanvasNode({ ...validNode, x: 1.5 }).valid, false);
  });

  it("rejects node with non-positive width", () => {
    assert.equal(_validateJsonCanvasNode({ ...validNode, width: 0 }).valid, false);
  });
});

describe("JSON Canvas OMI Router — Edge Validation", () => {
  const validEdge = { id: "e1", fromNode: "n1", toNode: "n2" };

  it("accepts valid edge", () => {
    assert.deepEqual(_validateJsonCanvasEdge(validEdge), { valid: true });
  });

  it("rejects edge with missing fromNode", () => {
    assert.equal(_validateJsonCanvasEdge({ ...validEdge, fromNode: "" }).valid, false);
  });

  it("rejects edge with invalid fromSide", () => {
    assert.equal(_validateJsonCanvasEdge({ ...validEdge, fromSide: "diagonal" }).valid, false);
  });

  it("accepts valid sides", () => {
    assert.ok(_validateJsonCanvasEdge({ ...validEdge, fromSide: "top", toSide: "bottom" }).valid);
    assert.ok(_validateJsonCanvasEdge({ ...validEdge, fromSide: "right", toSide: "left" }).valid);
  });
});

describe("JSON Canvas OMI Router — Node Routing", () => {
  it("routes a valid text node with geometry and Q_xy projection", () => {
    const node = { id: "n1", type: "text", x: 2, y: 3, width: 120, height: 60 };
    const result = routeCanvasNode(node);
    assert.ok(result.valid);
    assert.equal(result.omi.type, "text");
    assert.equal(result.omi.geometry, "structural-body");
    assert.ok(result.omi.qxy > 0);
    assert.ok(result.omi.local240 >= 0);
  });

  it("routes a node with lower hex color", () => {
    const node = { id: "n1", type: "text", x: 0, y: 0, width: 100, height: 50, color: "#FF0000" };
    const result = routeCanvasNode(node);
    assert.equal(result.omi.color.layer, "lower");
  });

  it("routes a node with upper preset color", () => {
    const node = { id: "n1", type: "group", x: 0, y: 0, width: 200, height: 100, color: "3" };
    const result = routeCanvasNode(node);
    assert.equal(result.omi.color.layer, "upper");
  });

  it("routes a node without color", () => {
    const node = { id: "n1", type: "file", x: 5, y: 10, width: 100, height: 50 };
    const result = routeCanvasNode(node);
    assert.equal(result.omi.color, null);
  });

  it("rejects invalid node", () => {
    const result = routeCanvasNode({ id: "", type: "invalid", x: 0, y: 0, width: 0, height: 0 });
    assert.equal(result.valid, false);
  });
});

describe("JSON Canvas OMI Router — Edge Routing", () => {
  it("routes an edge with tangent-crossing side mapping", () => {
    const edge = { id: "e1", fromNode: "n1", toNode: "n2", fromSide: "top", toSide: "bottom" };
    const result = routeCanvasEdge(edge);
    assert.ok(result.valid);
    assert.equal(result.omi.fromTangent, "upper-reader-shell");
    assert.equal(result.omi.toTangent, "lower-structural-body");
  });

  it("routes an edge with color", () => {
    const edge = { id: "e1", fromNode: "n1", toNode: "n2", color: "5" };
    const result = routeCanvasEdge(edge);
    assert.equal(result.omi.color.layer, "upper");
  });

  it("routes edge without sides", () => {
    const edge = { id: "e1", fromNode: "n1", toNode: "n2" };
    const result = routeCanvasEdge(edge);
    assert.ok(result.valid);
    assert.equal(result.omi.fromTangent, null);
    assert.equal(result.omi.toTangent, null);
    assert.equal(result.edge.fromEnd, "none");
    assert.equal(result.edge.toEnd, "arrow");
  });
});

describe("JSON Canvas OMI Router — Side/Tangent Mapping", () => {
  it("maps sides to tangents", () => {
    assert.equal(sideToTangent("top"), "upper-reader-shell");
    assert.equal(sideToTangent("right"), "forward-tangent-crossing");
    assert.equal(sideToTangent("bottom"), "lower-structural-body");
    assert.equal(sideToTangent("left"), "reverse-tangent-crossing");
  });

  it("maps tangents to sides", () => {
    assert.equal(tangentToSide("upper-reader-shell"), "top");
    assert.equal(tangentToSide("forward-tangent-crossing"), "right");
    assert.equal(tangentToSide("lower-structural-body"), "bottom");
    assert.equal(tangentToSide("reverse-tangent-crossing"), "left");
  });

  it("returns null for unknown side", () => {
    assert.equal(sideToTangent("diagonal"), null);
  });
});

describe("JSON Canvas OMI Router — Build Canvas", () => {
  it("builds a complete OMI canvas from schema", () => {
    const schema = {
      nodes: [
        { id: "n1", type: "text", x: 0, y: 0, width: 100, height: 50, color: "#FF0000" },
        { id: "n2", type: "group", x: 10, y: 20, width: 200, height: 100, color: "1" },
      ],
      edges: [
        { id: "e1", fromNode: "n1", toNode: "n2", fromSide: "bottom", toSide: "top" },
      ],
    };
    const result = buildOmiCanvas(schema);
    assert.ok(result.valid);
    assert.equal(result.nodeCount, 2);
    assert.equal(result.edgeCount, 1);
    assert.equal(result.errorCount, 0);
  });

  it("counts errors for invalid nodes/edges", () => {
    const schema = {
      nodes: [
        { id: "n1", type: "text", x: 0, y: 0, width: 100, height: 50 },
        { id: "", type: "invalid", x: 0, y: 0, width: 0, height: 0 },
      ],
      edges: [
        { id: "e1", fromNode: "", toNode: "" },
      ],
    };
    const result = buildOmiCanvas(schema);
    assert.equal(result.nodeCount, 1);
    assert.equal(result.edgeCount, 0);
    assert.equal(result.errorCount, 2);
  });
});
