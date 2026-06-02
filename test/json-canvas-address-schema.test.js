import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseRgbHex, parseCanvasPresetColor, classifyCanvasColorAuthority,
  composeRRGGBBAA, buildJsonCanvasOmiVertex, buildJsonCanvasOmiEdge, buildOmiGraph,
} from "../src/canvas/json-canvas-address-schema.js";

describe("JSON Canvas Address Schema — parseRgbHex", () => {
  it("parses #FF0000", () => {
    const r = parseRgbHex("#FF0000");
    assert.equal(r.red, 255);
    assert.equal(r.green, 0);
    assert.equal(r.blue, 0);
    assert.equal(r.hex, "FF0000");
    assert.ok(r.isValid);
  });

  it("parses FF0000 without hash", () => {
    const r = parseRgbHex("FF0000");
    assert.equal(r.red, 255);
    assert.ok(r.isValid);
  });

  it("parses #000000 and #FFFFFF", () => {
    assert.equal(parseRgbHex("#000000").red, 0);
    assert.equal(parseRgbHex("#FFFFFF").red, 255);
    assert.equal(parseRgbHex("#FFFFFF").green, 255);
    assert.equal(parseRgbHex("#FFFFFF").blue, 255);
  });

  it("returns null for invalid input", () => {
    assert.equal(parseRgbHex(""), null);
    assert.equal(parseRgbHex("invalid"), null);
    assert.equal(parseRgbHex("#GGGGGG"), null);
    assert.equal(parseRgbHex(123), null);
  });
});

describe("JSON Canvas Address Schema — parseCanvasPresetColor", () => {
  it("parses all preset keys 1-6", () => {
    const names = ["red", "orange", "yellow", "green", "cyan", "purple"];
    for (let i = 1; i <= 6; i++) {
      const r = parseCanvasPresetColor(String(i));
      assert.equal(r.key, String(i));
      assert.equal(r.name, names[i - 1]);
      assert.ok(r.isValid);
    }
  });

  it("returns null for invalid keys", () => {
    assert.equal(parseCanvasPresetColor("0"), null);
    assert.equal(parseCanvasPresetColor("7"), null);
    assert.equal(parseCanvasPresetColor(""), null);
    assert.equal(parseCanvasPresetColor("#FF0000"), null);
  });
});

describe("JSON Canvas Address Schema — classifyCanvasColorAuthority", () => {
  it("classifies #FF0000 as lower-structural", () => {
    const r = classifyCanvasColorAuthority("#FF0000");
    assert.equal(r.authority, "lower-structural");
    assert.equal(r.isHex, true);
    assert.equal(r.isPreset, false);
    assert.equal(r.layer, "≤8!");
  });

  it("classifies preset '1' as upper-reader-cosmetic", () => {
    const r = classifyCanvasColorAuthority("1");
    assert.equal(r.authority, "upper-reader-cosmetic");
    assert.equal(r.isPreset, true);
    assert.equal(r.isHex, false);
    assert.equal(r.layer, "9!–12!");
  });

  it("rejects invalid colors", () => {
    assert.equal(classifyCanvasColorAuthority("").authority, "invalid");
    assert.equal(classifyCanvasColorAuthority(null).authority, "invalid");
    assert.equal(classifyCanvasColorAuthority("invalid").authority, "invalid");
  });
});

describe("JSON Canvas Address Schema — composeRRGGBBAA", () => {
  it("composes from numeric rgb and aa", () => {
    const r = composeRRGGBBAA(0xFF0000, 0x00);
    assert.equal(r.seed32 >>> 0, 0xFF000000 >>> 0);
    assert.equal(r.hex, "ff000000");
    assert.equal(r.rgb, 0xFF0000);
    assert.equal(r.aa, 0x00);
  });

  it("composes from hex string rgb and aa", () => {
    const r = composeRRGGBBAA("FF0000", "25");
    assert.equal(r.seed32 >>> 0, 0xFF000025 >>> 0);
    assert.equal(r.rgb, 0xFF0000);
    assert.equal(r.aa, 0x25);
  });

  it("composes with # prefix", () => {
    const r = composeRRGGBBAA("#00FF00", "37");
    assert.equal(r.seed32, 0x00FF0037);
    assert.equal(r.aaDisplay, "0x37");
  });

  it("returns null for invalid inputs", () => {
    assert.equal(composeRRGGBBAA("invalid", "00"), null);
    assert.equal(composeRRGGBBAA("FF0000", "invalid"), null);
    assert.equal(composeRRGGBBAA(0xFFFFFFF, 0x00), null);
  });
});

describe("JSON Canvas Address Schema — buildJsonCanvasOmiVertex", () => {
  it("builds a valid vertex", () => {
    const r = buildJsonCanvasOmiVertex({ id: "v1", x: 10, y: 20, color: "#FF0000" });
    assert.ok(r.valid);
    assert.equal(r.vertex.type, "text");
    assert.equal(r.vertex.width, 240);
    assert.equal(r.vertex.color.authority, "lower-structural");
  });

  it("rejects invalid vertex", () => {
    assert.equal(buildJsonCanvasOmiVertex({}).valid, false);
    assert.equal(buildJsonCanvasOmiVertex({ id: "v1" }).valid, false);
  });
});

describe("JSON Canvas Address Schema — buildJsonCanvasOmiEdge", () => {
  it("builds a valid edge", () => {
    const r = buildJsonCanvasOmiEdge({ id: "e1", fromNode: "v1", toNode: "v2", fromSide: "top", toSide: "bottom", color: "1" });
    assert.ok(r.valid);
    assert.equal(r.edge.fromSide, "top");
    assert.equal(r.edge.toSide, "bottom");
    assert.equal(r.edge.color.authority, "upper-reader-cosmetic");
  });

  it("rejects invalid edge", () => {
    assert.equal(buildJsonCanvasOmiEdge({}).valid, false);
  });

  it("rejects invalid side", () => {
    const r = buildJsonCanvasOmiEdge({ id: "e1", fromNode: "v1", toNode: "v2", fromSide: "diagonal" });
    assert.equal(r.edge.fromSide, null);
  });
});

describe("JSON Canvas Address Schema — buildOmiGraph", () => {
  it("builds complete G=(V,E,I)", () => {
    const nodes = [
      { id: "v1", x: 0, y: 0, color: "#FF0000" },
      { id: "v2", x: 100, y: 100, color: "1" },
    ];
    const edges = [
      { id: "e1", fromNode: "v1", toNode: "v2", color: "5", label: "connects" },
    ];
    const g = buildOmiGraph(nodes, edges);
    assert.equal(g.vertexCount, 2);
    assert.equal(g.edgeCount, 1);
    assert.equal(g.incidenceCount, 2);
    assert.equal(g.V[0].color.authority, "lower-structural");
    assert.equal(g.V[1].color.authority, "upper-reader-cosmetic");
  });

  it("filters invalid nodes/edges", () => {
    const g = buildOmiGraph([{ invalid: true }], [{}]);
    assert.equal(g.vertexCount, 0);
    assert.equal(g.edgeCount, 0);
  });
});
